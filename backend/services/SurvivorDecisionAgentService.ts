import { 
  survivorDecisionRepo,
  decisionPolicyRepo,
  survivorEquityRepo,
  futureTeamValueRepo,
  contestEVRepo,
  recommendationPortfolioRepo,
  entryRepo,
  contestRepo,
  teamRepo
} from "../repositories/index";
import { SurvivorDecision, DecisionPolicy, SurvivorEquitySnapshot, FutureTeamValue, ContestEV, RecommendationPortfolio } from "../../src/types";
import { DecisionPolicyService } from "./DecisionPolicyService";

export class SurvivorDecisionAgentService {
  static async getLatest(): Promise<SurvivorDecision[]> {
    return survivorDecisionRepo.getLatestDecisions();
  }

  static async getHistory(): Promise<SurvivorDecision[]> {
    return survivorDecisionRepo.getDecisionsHistory();
  }

  static async getByEntry(entryId: string): Promise<SurvivorDecision[]> {
    return survivorDecisionRepo.getDecisionsByEntry(entryId);
  }

  static async deleteWeek(season: string, week: number): Promise<boolean> {
    return survivorDecisionRepo.deleteDecisionsWeek(season, week);
  }

  static async calculate(
    season: string,
    week: number,
    agentVersion: string
  ): Promise<SurvivorDecision[]> {
    console.log(`[Survivor Decision Agent] Initiating deterministic decision calculations for ${season} Week ${week} (Agent Version: ${agentVersion})`);

    // 1. Fetch entries, contests, and teams
    const entries = await entryRepo.getAll();
    const contests = await contestRepo.getAll();
    const teams = await teamRepo.getAll();
    const teamMap = new Map(teams.map(t => [t.id, t]));

    // 2. Ensure decision policies are generated
    let policies = await decisionPolicyRepo.getPoliciesHistory();
    policies = policies.filter(p => p.season === season && p.week === week);
    if (policies.length === 0) {
      console.log(`[Survivor Decision Agent] Decision policies missing for Week ${week}. Auto-calculating now.`);
      policies = await DecisionPolicyService.calculate(season, week, agentVersion);
    }

    // 3. Load other inputs for the week
    const equityList = await survivorEquityRepo.getBySeasonAndWeek(season, week);
    const ftvList = await futureTeamValueRepo.getBySeasonAndWeek(season, week);
    const contestEVList = await contestEVRepo.getLatestContestEV();
    const portfolioList = await recommendationPortfolioRepo.getPortfolioHistory();

    const entryEquityMap = new Map<string, SurvivorEquitySnapshot[]>();
    for (const eq of equityList) {
      const list = entryEquityMap.get(eq.entry_id) || [];
      list.push(eq);
      entryEquityMap.set(eq.entry_id, list);
    }

    const ftvMap = new Map<string, FutureTeamValue>();
    for (const f of ftvList) {
      ftvMap.set(f.team_id, f);
    }

    const evMap = new Map<string, ContestEV[]>();
    for (const ev of contestEVList) {
      if (ev.season === season && ev.week === week) {
        const list = evMap.get(`${ev.entry_id}_${ev.contest_id}`) || [];
        list.push(ev);
        evMap.set(`${ev.entry_id}_${ev.contest_id}`, list);
      }
    }

    const portfolioMap = new Map<string, RecommendationPortfolio[]>();
    for (const p of portfolioList) {
      if (p.season === season && p.week === week) {
        const list = portfolioMap.get(p.entry_id) || [];
        list.push(p);
        portfolioMap.set(p.entry_id, list);
      }
    }

    const decisions: SurvivorDecision[] = [];

    // 4. Calculate for every entry-contest combination
    for (const entry of entries) {
      const entryEquities = entryEquityMap.get(entry.id) || [];
      const entryPortfolios = portfolioMap.get(entry.id) || [];

      for (const contest of contests) {
        const entryContestEVs = evMap.get(`${entry.id}_${contest.id}`) || [];
        
        // Find policies for this specific entry and contest
        const currentPolicies = policies.filter(p => p.entry_id === entry.id && p.contest_id === contest.id);
        if (currentPolicies.length === 0) continue;

        const candidates: Array<{
          policy: DecisionPolicy;
          team_id: string;
          teamName: string;
          scores: {
            policyScore: number;
            evScore: number;
            ftvScore: number;
            equityScore: number;
            portfolioScore: number;
          };
          raw: {
            policyRaw: number;
            evRaw: number;
            ftvRaw: number;
            equityRaw: number;
            portfolioRaw: number;
          };
          overall_score: number;
        }> = [];

        for (const p of currentPolicies) {
          const teamId = p.team_id;
          const teamName = teamMap.get(teamId)?.name || teamId;

          // Find candidate pieces
          const matchingEquity = entryEquities.find(e => e.team_id === teamId);
          const matchingFTV = ftvMap.get(teamId);
          const matchingEV = entryContestEVs.find(e => e.recommended_team_id === teamId);
          const matchingPortfolio = entryPortfolios.find(pt => pt.recommended_team_id === teamId);

          const policyRaw = p.decision_score;
          const evRaw = matchingEV ? matchingEV.contest_ev_score : 50.0;
          const ftvRaw = matchingFTV ? matchingFTV.future_value_score : 50.0;
          const equityRaw = matchingEquity ? matchingEquity.equity_score : 50.0;
          const portfolioRaw = matchingPortfolio ? matchingPortfolio.portfolio_score : 50.0;

          // Normalized components (0 to 100 scales)
          const policyScore = policyRaw;
          const evScore = evRaw;
          const ftvScore = 100 - ftvRaw; // Prioritize teams with LOWER future value to minimize opportunity cost
          const equityScore = equityRaw;
          const portfolioScore = portfolioRaw;

          // Multi-factor weighted score
          const overall_score = Number((
            (policyScore * 0.35) +
            (evScore * 0.20) +
            (ftvScore * 0.20) +
            (equityScore * 0.15) +
            (portfolioScore * 0.10)
          ).toFixed(2));

          candidates.push({
            policy: p,
            team_id: teamId,
            teamName,
            scores: { policyScore, evScore, ftvScore, equityScore, portfolioScore },
            raw: { policyRaw, evRaw, ftvRaw, equityRaw, portfolioRaw },
            overall_score
          });
        }

        if (candidates.length === 0) continue;

        // Sort candidates by overall score descending
        candidates.sort((a, b) => b.overall_score - a.overall_score);

        const best = candidates[0];
        const recommended_team_id = best.team_id;
        const decision_score = best.overall_score;

        // Determine Confidence Tier based on overall score
        let confidence = "Average";
        if (decision_score >= 85) {
          confidence = "Elite";
        } else if (decision_score >= 70) {
          confidence = "Strong";
        } else if (decision_score >= 55) {
          confidence = "Average";
        } else if (decision_score >= 40) {
          confidence = "Weak";
        } else {
          confidence = "Avoid";
        }

        // Get Top Alternatives
        const topAlternatives = candidates.slice(1, 4).map(c => ({
          team_id: c.team_id,
          teamName: c.teamName,
          score: c.overall_score,
          confidence: c.overall_score >= 85 ? "Elite" : c.overall_score >= 70 ? "Strong" : c.overall_score >= 55 ? "Average" : c.overall_score >= 40 ? "Weak" : "Avoid"
        }));

        // Determine explanation with strongest positive and negative factors
        const positiveFactors: string[] = [];
        const negativeFactors: string[] = [];

        if (best.scores.policyScore >= 75) {
          positiveFactors.push(`Highly optimized backing from V048 Decision Policies (Score: ${best.scores.policyScore.toFixed(1)})`);
        } else if (best.scores.policyScore < 50) {
          negativeFactors.push(`Sub-optimal general policy rating (Score: ${best.scores.policyScore.toFixed(1)})`);
        }

        if (best.scores.evScore >= 75) {
          positiveFactors.push(`Elite Contest Expected Value alignment (Score: ${best.scores.evScore.toFixed(1)})`);
        } else if (best.scores.evScore < 50) {
          negativeFactors.push(`Low immediate Contest Expected Value (Score: ${best.scores.evScore.toFixed(1)})`);
        }

        if (best.scores.ftvScore >= 75) {
          positiveFactors.push(`Excellent future schedule preservation; saves other high-value teams (Future Opportunity Cost is low: ${best.raw.ftvRaw.toFixed(1)})`);
        } else if (best.scores.ftvScore < 45) {
          negativeFactors.push(`Substantial future opportunity cost; burning ${best.teamName} depletes future-week options (Future Value Score: ${best.raw.ftvRaw.toFixed(1)})`);
        }

        if (best.scores.equityScore >= 75) {
          positiveFactors.push(`Strong Survivor Equity Snapshot score (Score: ${best.scores.equityScore.toFixed(1)})`);
        } else if (best.scores.equityScore < 50) {
          negativeFactors.push(`Sub-optimal Survivor Equity Snapshot backing (Score: ${best.scores.equityScore.toFixed(1)})`);
        }

        if (best.scores.portfolioScore >= 75) {
          positiveFactors.push(`Perfect fit with Recommendation Portfolio allocations (Score: ${best.scores.portfolioScore.toFixed(1)})`);
        } else if (best.scores.portfolioScore < 50) {
          negativeFactors.push(`Poor alignment with portfolio optimization constraints (Score: ${best.scores.portfolioScore.toFixed(1)})`);
        }

        const strongestPos = positiveFactors.length > 0 ? positiveFactors.join(", and ") : "Balanced metrics across all dimensions";
        const strongestNeg = negativeFactors.length > 0 ? negativeFactors.join(", and ") : "No critical negative risk factors detected";

        const decision_reason = `Survivor Agent V1 recommends picking **${best.teamName}** for entry "${entry.name}" in contest "${contest.name}". ` +
          `This selection achieved an overall decision score of **${decision_score.toFixed(1)}** (${confidence} class). ` +
          `Key positive factors: ${strongestPos}. Key negative factors: ${strongestNeg}. ` +
          `Alternatives include: ${topAlternatives.map(a => `${a.teamName} (${a.score.toFixed(1)})`).join(", ")}.`;

        const matchingEVForBest = entryContestEVs.find(e => e.recommended_team_id === recommended_team_id);
        const championship_ev = matchingEVForBest ? matchingEVForBest.championship_probability : (best.scores.equityScore * 0.15);

        // Store detailed metadata in json field
        const decision_json = JSON.stringify({
          entry_id: entry.id,
          entry_name: entry.name,
          contest_id: contest.id,
          contest_name: contest.name,
          best_candidate: {
            team_id: recommended_team_id,
            teamName: best.teamName,
            overall_score: decision_score,
            confidence,
            championship_ev,
            raw_inputs: best.raw,
            normalized_scores: best.scores,
            risk_score: best.policy.risk_score
          },
          all_candidates: candidates.map(c => ({
            team_id: c.team_id,
            teamName: c.teamName,
            score: c.overall_score,
            raw_inputs: c.raw,
            normalized_scores: c.scores
          })),
          top_alternatives: topAlternatives,
          explanation: {
            positive: positiveFactors,
            negative: negativeFactors,
            confidence
          }
        });

        decisions.push({
          season,
          week,
          entry_id: entry.id,
          contest_id: contest.id,
          decision_policy_id: best.policy.id ? Number(best.policy.id) : null,
          recommended_team_id,
          confidence,
          championship_ev,
          future_value_score: best.raw.ftvRaw,
          risk_score: best.policy.risk_score,
          portfolio_score: best.scores.portfolioScore,
          decision_score,
          agent_version: agentVersion,
          decision_reason,
          decision_json
        });
      }
    }

    // Persist immutable history
    await survivorDecisionRepo.deleteDecisionsWeek(season, week);
    const saved = await survivorDecisionRepo.saveDecisions(decisions);
    return saved;
  }
}
