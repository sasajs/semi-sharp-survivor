import { 
  RecommendationCandidate, 
  EntryRecommendation, 
  PortfolioRecommendation, 
  ContestEquityScore, 
  RecommendationRationale,
  PortfolioEntryRecommendation
} from "../models";
import { 
  teamRepo, 
  entryRepo, 
  legRepo, 
  gameRepo, 
  lineRepo,
  recommendationRepo,
  recommendationSnapshotRepo
} from "../../repositories";
import { InventoryService } from "../../inventory/services/inventoryService";
import { RiskEngineService } from "../../risk/services/riskEngineService";
import { LeverageService } from "./leverageService";
import { ContestEquityService } from "./contestEquityService";
import { RecommendationExplanationService } from "./recommendationExplanationService";
import { ConfidenceTier } from "../../../src/types";

export class RecommendationEngineService {
  /**
   * Compiles and ranks all potential selection candidates for an entry and leg
   */
  static async compileCandidates(entryId: string, legId: string): Promise<RecommendationCandidate[]> {
    // 1. Fetch Inventory Snapshot
    const snap = await InventoryService.compileInventorySnapshot(entryId, legId);
    
    // 2. Fetch all Teams and Games on this leg
    const teams = await teamRepo.getAll();
    const games = await gameRepo.getByLegId(legId);
    const legs = await legRepo.getAll();
    const sortedLegs = [...legs].sort((a, b) => a.display_order - b.display_order);

    const tgLeg = sortedLegs.find(l => l.leg_type === "thanksgiving");
    const xmasLeg = sortedLegs.find(l => l.leg_type === "christmas");

    const candidates: RecommendationCandidate[] = [];

    // Helper map of games by team
    const teamGameMap = new Map();
    for (const g of games) {
      teamGameMap.set(g.home_team_id, { opponentId: g.away_team_id, game: g });
      teamGameMap.set(g.away_team_id, { opponentId: g.home_team_id, game: g });
    }

    const teamMap = new Map(teams.map(t => [t.id, t]));

    for (const team of teams) {
      const match = teamGameMap.get(team.id);
      if (!match) {
        // Bye week: not a pick candidate for this leg
        continue;
      }

      const opponent = teamMap.get(match.opponentId);
      const opponentName = opponent?.name || "Opponent";

      // 3. Fetch line & feature details
      const line = await lineRepo.getByTeamAndLeg(team.id, legId);
      const win_probability = line?.win_probability ?? 0.50;
      const pick_popularity = line?.pick_popularity ?? 0.05;

      // 4. Fetch Inventory Specifics
      const is_used = snap.used_teams.includes(team.id);
      const is_available = snap.available_teams.includes(team.id);

      // Check Thanksgiving and Christmas specific reservations
      const is_thanksgiving_reserved = tgLeg 
        ? snap.holiday_reservations.some(r => r.team_id === team.id && r.contest_leg_id === tgLeg.id)
        : false;

      const is_christmas_reserved = xmasLeg 
        ? snap.holiday_reservations.some(r => r.team_id === team.id && r.contest_leg_id === xmasLeg.id)
        : false;

      // Fetch future value of team for this leg
      const inventoryReport = await InventoryService.getEntryInventoryReport(entryId, legId);
      const fvSummary = inventoryReport.future_value_summary.find(s => s.team_id === team.id);
      const future_value_score = fvSummary?.future_value_score ?? 35.0;

      // 5. Evaluate Risk metrics via Risk Engine
      const riskProfile = await RiskEngineService.compileTeamRiskProfile(entryId, legId, team.id);
      const risk_score = riskProfile.risk_score;
      const upset_probability = riskProfile.upset_probability;
      const confidence_tier = riskProfile.confidence_tier;

      // 6. Leverage Calculations
      const leverageInfo = LeverageService.calculateLeverage(win_probability, pick_popularity);
      const leverage_score = leverageInfo.leverage_score;
      const leverage_multiplier = leverageInfo.leverage_multiplier;

      // 7. Equity Calculations
      const contest_equity_score = ContestEquityService.evaluateEquityScore({
        win_probability,
        leverage_multiplier,
        future_value_score,
        is_thanksgiving_reserved,
        is_christmas_reserved,
        risk_score,
        upset_probability,
        confidence_tier
      });

      // 8. Generate plain-English Rationale
      const rationale = RecommendationExplanationService.generateRationale({
        teamName: team.name,
        opponentName,
        winProbability: win_probability,
        pickPopularity: pick_popularity,
        leverageScore: leverage_score,
        futureValueScore: future_value_score,
        riskScore: risk_score,
        upsetProbability: upset_probability,
        confidenceTier: confidence_tier,
        isThanksgivingReserved: is_thanksgiving_reserved,
        isChristmasReserved: is_christmas_reserved
      });

      candidates.push({
        team_id: team.id,
        contest_leg_id: legId,
        win_probability,
        pick_popularity,
        leverage_score,
        future_value_score,
        risk_score,
        upset_probability,
        confidence_tier,
        is_available,
        is_used,
        is_thanksgiving_reserved,
        is_christmas_reserved,
        contest_equity_score,
        rationale
      });
    }

    return candidates;
  }

  /**
   * Compiles the sorted entry level Survivor recommendation reports
   */
  static async getEntryRecommendations(entryId: string, legId: string): Promise<EntryRecommendation> {
    const allCandidates = await this.compileCandidates(entryId, legId);
    
    // Filter to available candidates
    const eligible = allCandidates
      .filter(c => c.is_available)
      .sort((a, b) => b.contest_equity_score.final_score - a.contest_equity_score.final_score);

    if (eligible.length === 0) {
      throw new Error(`No available teams left for entry: ${entryId} on leg: ${legId}`);
    }

    const primaryCandidate = eligible[0];
    const primary_team_id = primaryCandidate.team_id;

    // Get up to 3 alternatives
    const alternatives = eligible.slice(1, 4).map(c => c.team_id);
    
    // Pad alternatives to ensure we return at least 3 alternatives if possible
    while (alternatives.length < 3 && eligible.length > alternatives.length + 1) {
      const nextIndex = alternatives.length + 1;
      if (eligible[nextIndex]) {
        alternatives.push(eligible[nextIndex].team_id);
      } else {
        break;
      }
    }

    // Fetch related model versions for audits
    const snap = await InventoryService.compileInventorySnapshot(entryId, legId);
    const existing = await recommendationRepo.getByEntryAndLeg(entryId, legId);
    const nextVersion = existing ? existing.recommendation_version + 1 : 1;

    const recommendation: EntryRecommendation = {
      id: existing?.id || `rec-${legId}-${entryId}`,
      entry_id: entryId,
      contest_leg_id: legId,
      primary_team_id,
      alternatives,
      candidates: allCandidates,
      recommendation_version: nextVersion,
      data_version: 1,
      inventory_version: snap.inventory_version,
      risk_version: primaryCandidate.risk_score ? Math.floor(primaryCandidate.risk_score / 10) : 1,
      policy_version: 1,
      created_at: existing?.created_at || new Date().toISOString()
    };

    return await recommendationRepo.save(recommendation);
  }

  /**
   * Optimizes selection allocation across a portfolio of multiple entries to minimize correlation failures
   */
  static async getPortfolioRecommendations(legId: string): Promise<PortfolioRecommendation> {
    const entries = await entryRepo.getAll();
    const activeEntries = entries.filter(e => e.status !== "eliminated");

    if (activeEntries.length === 0) {
      throw new Error("No active entries found for portfolio diversification.");
    }

    const entryRecs: PortfolioEntryRecommendation[] = [];
    const teamPickCount = new Map<string, number>();

    // Sort entries to optimize larger/more valuable entries first if applicable, or process systematically
    for (const entry of activeEntries) {
      const entryId = entry.id;
      const candList = await this.compileCandidates(entryId, legId);
      
      const eligible = candList
        .filter(c => c.is_available)
        // Sort by equity with a high penalty on already picked teams by peer entries
        .map(c => {
          const peersPickedCount = teamPickCount.get(c.team_id) ?? 0;
          const adjustedScore = c.contest_equity_score.final_score - (peersPickedCount * 17.5);
          return { candidate: c, adjustedScore };
        })
        .sort((a, b) => b.adjustedScore - a.adjustedScore);

      if (eligible.length > 0) {
        const primary = eligible[0].candidate.team_id;
        
        // Log choice inside allocations
        teamPickCount.set(primary, (teamPickCount.get(primary) ?? 0) + 1);

        const backups = eligible.slice(1, 4).map(e => e.candidate.team_id);
        
        entryRecs.push({
          entry_id: entryId,
          primary_team_id: primary,
          backup_team_ids: backups
        });
      }
    }

    // Portfolio metrics computation
    const totalPicks = entryRecs.length;
    let maxTeamCount = 0;
    
    for (const count of teamPickCount.values()) {
      if (count > maxTeamCount) {
        maxTeamCount = count;
      }
    }

    const overlap_percentage = totalPicks > 0 
      ? parseFloat(((maxTeamCount / totalPicks) * 100).toFixed(1)) 
      : 0.0;

    // Diversification score starts at 100, drops as picks focus on single teams
    const diversification_score = parseFloat(Math.min(100.0, Math.max(0.0, 100.0 - overlap_percentage * 0.8)).toFixed(1));
    const correlated_risk_flag = overlap_percentage >= 40.0;

    const existingSnap = await recommendationSnapshotRepo.getByLegId(legId);

    const portfolioRec: PortfolioRecommendation = {
      id: existingSnap?.id || `port-${legId}`,
      contest_leg_id: legId,
      entry_recommendations: entryRecs,
      diversification_score,
      overlap_percentage,
      correlated_risk_flag,
      policy_version: 1,
      created_at: existingSnap?.created_at || new Date().toISOString()
    };

    return await recommendationSnapshotRepo.save(portfolioRec);
  }
}
