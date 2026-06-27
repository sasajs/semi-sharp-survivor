import { 
  decisionPolicyRepo,
  ensemblePredictionRepo,
  adaptiveModelWeightRepo,
  contestEVRepo,
  recommendationPortfolioRepo,
  ownershipCalibrationRepo,
  modelDriftRepo,
  entryRepo,
  contestRepo,
  gameRepo,
  teamRepo,
  legRepo,
  lineRepo
} from "../repositories/index";
import { DecisionPolicy, EnsemblePrediction, ContestEV, RecommendationPortfolio } from "../../src/types";
import { EnsemblePredictionService } from "./EnsemblePredictionService";

export class DecisionPolicyService {
  static async getLatest(): Promise<DecisionPolicy[]> {
    return decisionPolicyRepo.getLatestPolicies();
  }

  static async getHistory(): Promise<DecisionPolicy[]> {
    return decisionPolicyRepo.getPoliciesHistory();
  }

  static async getByEntry(entryId: string): Promise<DecisionPolicy[]> {
    return decisionPolicyRepo.getPoliciesByEntry(entryId);
  }

  static async deleteWeek(season: string, week: number): Promise<boolean> {
    return decisionPolicyRepo.deletePoliciesWeek(season, week);
  }

  static async calculate(
    season: string,
    week: number,
    calculationVersion: string
  ): Promise<DecisionPolicy[]> {
    console.log(`[Decision Policy Service] Initiating calculations for V0.48 Decision Policy Engine: ${season} Week ${week} (v${calculationVersion})`);

    // 1. Fetch metadata and game/team lists
    const legs = await legRepo.getAll();
    const currentLeg = legs.find(l => l.nfl_week === week) || legs[0];
    if (!currentLeg) {
      console.warn("[Decision Policy Service] Current contest leg not found.");
      return [];
    }

    const games = await gameRepo.getByLegId(currentLeg.id);
    const teams = await teamRepo.getAll();
    const teamMap = new Map(teams.map(t => [t.id, t]));
    const teamNameMap = new Map(teams.map(t => [t.id, t.name]));

    // 2. Load and ensure up-to-date inputs
    let ensemblePredictions = await ensemblePredictionRepo.getPredictionsHistory();
    ensemblePredictions = ensemblePredictions.filter(p => p.season === season && p.week === week);
    if (ensemblePredictions.length === 0) {
      // Auto-trigger calculation of V0.47 Ensemble Predictions if missing
      ensemblePredictions = await EnsemblePredictionService.calculate(season, week, calculationVersion);
    }

    const ensembleMap = new Map<string, EnsemblePrediction>();
    for (const ep of ensemblePredictions) {
      ensembleMap.set(ep.game_id, ep);
    }

    let adaptiveWeights = await adaptiveModelWeightRepo.getWeightsHistory();
    adaptiveWeights = adaptiveWeights.filter(w => w.season === season && w.week === week);

    const driftRecords = await modelDriftRepo.getDriftHistory();
    const latestDrift = driftRecords.filter(d => d.season === season && d.week === week);

    // Fetch entries and contests to produce customized policies per entry/contest combination
    const entries = await entryRepo.getAll();
    const contests = await contestRepo.getAll();

    const policies: DecisionPolicy[] = [];

    for (const entry of entries) {
      // Find matching portfolio optimizer score
      let portfolioRows = await recommendationPortfolioRepo.getLatestPortfolio();
      portfolioRows = portfolioRows.filter(p => p.season === season && p.week === week && p.entry_id === entry.id);

      for (const contest of contests) {
        // Find matching Contest EV score
        let evRows = await contestEVRepo.getLatestContestEV();
        evRows = evRows.filter(e => e.season === season && e.week === week && e.contest_id === contest.id && e.entry_id === entry.id);

        for (const game of games) {
          // Calculate for both home and away team selections
          const possibleTeams = [
            { teamId: game.home_team_id, isHome: true },
            { teamId: game.away_team_id, isHome: false }
          ];

          for (const item of possibleTeams) {
            const teamId = item.teamId;
            const teamName = teamNameMap.get(teamId) || teamId;

            // Retrieve pre-calculated pipeline states
            const ensemblePred = ensembleMap.get(game.id);
            const ensemblePredictionVal = ensemblePred 
              ? (item.isHome ? ensemblePred.ensemble_prediction : (100 - ensemblePred.ensemble_prediction))
              : 50.0;
            const ensembleConfidence = ensemblePred ? ensemblePred.confidence_score : 70.0;

            const matchingEV = evRows.find(e => e.recommended_team_id === teamId);
            const contest_ev = matchingEV ? matchingEV.contest_ev_score : 1.05;

            const matchingPortfolio = portfolioRows.find(p => p.recommended_team_id === teamId);
            const portfolio_score = matchingPortfolio ? matchingPortfolio.portfolio_score : 72.0;

            // Computed metrics
            // Risk score: Higher when prediction is closer to 50% or when there is model drift
            const driftPenalty = latestDrift.some(d => d.drift_level === "WARNING" || d.drift_level === "CRITICAL") ? 15 : 0;
            const agreementScore = ensemblePred ? ensemblePred.agreement_score : 75.0;
            const risk_score = Math.max(5, Math.min(95, (100 - ensemblePredictionVal) * 0.7 + (100 - agreementScore) * 0.2 + driftPenalty));

            // Leverage score: Derived from Contest EV and inverse win probability risk
            const leverage_score = Math.max(0, Math.min(100, (contest_ev - 0.5) * 40 + (100 - risk_score) * 0.4));

            // Expected utility combined score
            const rawDecisionScore = (ensemblePredictionVal * 0.35) + 
                                     (contest_ev * 25) + 
                                     (portfolio_score * 0.15) + 
                                     (leverage_score * 0.15) - 
                                     (risk_score * 0.10);

            const decision_score = Number(Math.max(0, Math.min(100, rawDecisionScore)).toFixed(2));

            // Define policy decisions deterministically
            let recommended_action = "PASS";
            let confidence_tier = "MODERATE";

            if (decision_score >= 82 && ensemblePredictionVal >= 70 && risk_score <= 35) {
              recommended_action = "LOCK";
              confidence_tier = "HIGH";
            } else if (decision_score >= 70 && ensemblePredictionVal >= 62 && risk_score <= 45) {
              recommended_action = "STRONG PLAY";
              confidence_tier = "HIGH";
            } else if (decision_score >= 52 && ensemblePredictionVal >= 53 && risk_score <= 60) {
              recommended_action = "PLAY";
              confidence_tier = "MODERATE";
            } else if (decision_score >= 38 || risk_score > 65) {
              recommended_action = "PASS";
              confidence_tier = "LOW";
            } else {
              recommended_action = "AVOID";
              confidence_tier = "LOW";
            }

            // Create customized policy explanations
            let policy_reason = "";
            if (recommended_action === "LOCK") {
              policy_reason = `[LOCK] ${teamName} represents an elite high-utility play for Week ${week}. The adaptive ensemble aligns at a robust ${ensemblePredictionVal.toFixed(1)}% win probability. Risk is low (${risk_score.toFixed(1)}%) and leverage is solid. Recommended as your primary choice.`;
            } else if (recommended_action === "STRONG PLAY") {
              policy_reason = `[STRONG PLAY] ${teamName} presents highly favorable metrics with a decision score of ${decision_score.toFixed(1)}. Strong backing from the portfolio optimizer makes this an excellent primary or backup strategy.`;
            } else if (recommended_action === "PLAY") {
              policy_reason = `[PLAY] ${teamName} is a viable pick with balanced risk/reward metrics. Recommended for inclusion in multi-entry portfolios.`;
            } else if (recommended_action === "PASS") {
              policy_reason = `[PASS] Metrics on ${teamName} are sub-optimal for this slate. Win probability is too low or risk (${risk_score.toFixed(1)}%) exceeds premium thresholds. Monitor secondary markets before acting.`;
            } else {
              policy_reason = `[AVOID] High risk (${risk_score.toFixed(1)}%) paired with negative expected value makes ${teamName} an unacceptable play. Highly recommended to steer clear.`;
            }

            policies.push({
              season,
              week,
              entry_id: entry.id,
              contest_id: contest.id,
              game_id: game.id,
              team_id: teamId,
              policy_type: "DECISION_INTELLIGENCE",
              ensemble_prediction: Number(ensemblePredictionVal.toFixed(2)),
              ensemble_confidence: Number(ensembleConfidence.toFixed(2)),
              contest_ev: Number(contest_ev.toFixed(2)),
              portfolio_score: Number(portfolio_score.toFixed(2)),
              risk_score: Number(risk_score.toFixed(2)),
              leverage_score: Number(leverage_score.toFixed(2)),
              decision_score,
              recommended_action,
              recommended_pick: teamId,
              confidence_tier,
              policy_reason,
              calculation_version: calculationVersion
            });
          }
        }
      }
    }

    // Save decision policies to database
    await decisionPolicyRepo.deletePoliciesWeek(season, week);
    const saved = await decisionPolicyRepo.savePolicies(policies);
    return saved;
  }
}
