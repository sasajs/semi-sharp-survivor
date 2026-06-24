import { 
  recommendationConsensusRepo, 
  survivorRecommendationRepo, 
  recommendationConfidenceRepo 
} from "../repositories/index";
import { 
  RecommendationConsensus, 
  ConsensusTier, 
  SurvivorRecommendation, 
  RecommendationConfidenceSnapshot 
} from "../../src/types";

export class RecommendationConsensusService {
  private static get consensusRepo() { return recommendationConsensusRepo; }
  private static get recRepo() { return survivorRecommendationRepo; }
  private static get confidenceRepo() { return recommendationConfidenceRepo; }

  static async getAll(): Promise<RecommendationConsensus[]> {
    return this.consensusRepo.getAll();
  }

  static async getLatest(): Promise<RecommendationConsensus[]> {
    return this.consensusRepo.getLatest();
  }

  static async getBySeasonAndWeek(season: string, week: number): Promise<RecommendationConsensus[]> {
    return this.consensusRepo.getBySeasonAndWeek(season, week);
  }

  static async getByEntryId(entryId: string): Promise<RecommendationConsensus[]> {
    return this.consensusRepo.getByEntryId(entryId);
  }

  static async getByTeamId(teamId: string): Promise<RecommendationConsensus[]> {
    return this.consensusRepo.getByTeamId(teamId);
  }

  static async getTopConsensus(limit: number = 10): Promise<RecommendationConsensus[]> {
    return this.consensusRepo.getTopConsensus(limit);
  }

  static async calculateConsensus(
    season: string,
    week: number,
    calculationVersion: string
  ): Promise<RecommendationConsensus[]> {
    // 1. Fetch recommendations for season and week
    const allRecs = await this.recRepo.getBySeasonAndWeek(season, week);
    const currentRecs = allRecs.filter(r => r.calculation_version === calculationVersion);

    if (currentRecs.length === 0) {
      console.warn(`[Recommendation Consensus Service] No recommendations found for version ${calculationVersion}`);
      return [];
    }

    // 2. Fetch confidence snapshots for season and week
    const allConfidence = await this.confidenceRepo.getBySeasonAndWeek(season, week);
    const currentConfidence = allConfidence.filter(c => c.calculation_version === calculationVersion);

    const snapshotsToSave: RecommendationConsensus[] = [];

    // 3. Process entry-by-entry
    for (const rec of currentRecs) {
      const confidenceSnapshot = currentConfidence.find(
        c => c.entry_id === rec.entry_id && c.team_id.toLowerCase() === rec.recommended_team_id.toLowerCase()
      );

      // Component Scores normalization
      const candidate_score = Math.min(100.0, Math.max(0.0, Number(rec.candidate_score || 0)));
      const survivor_equity_score = Math.min(100.0, Math.max(0.0, Number(rec.survivor_equity_score || 0)));
      const recommendation_score = Math.min(100.0, Math.max(0.0, Number(rec.recommendation_score || 0)));
      
      const confidence_score = confidenceSnapshot 
        ? Math.min(100.0, Math.max(0.0, Number(confidenceSnapshot.confidence_score)))
        : 50.0; // Fallback score if confidence snapshot is missing
      
      const ownership_score = Math.min(100.0, Math.max(0.0, 100.0 - Number(rec.projected_ownership_pct || 0)));
      const future_value_score = Math.min(100.0, Math.max(0.0, 100.0 - Number(rec.future_team_value_score || 0)));

      // Consensus Score = average of all six scores
      const totalScoreSum = candidate_score + survivor_equity_score + recommendation_score + confidence_score + ownership_score + future_value_score;
      const consensus_score = Number((totalScoreSum / 6.0).toFixed(2));

      // Agreement Count: how many rate the team >= 70
      let agreement_count = 0;
      if (candidate_score >= 70) agreement_count++;
      if (survivor_equity_score >= 70) agreement_count++;
      if (recommendation_score >= 70) agreement_count++;
      if (confidence_score >= 70) agreement_count++;
      if (ownership_score >= 70) agreement_count++;
      if (future_value_score >= 70) agreement_count++;

      // Consensus Tier
      let consensus_tier = ConsensusTier.NO_CONSENSUS;
      if (agreement_count >= 6) {
        consensus_tier = ConsensusTier.ELITE_CONSENSUS;
      } else if (agreement_count >= 5) {
        consensus_tier = ConsensusTier.STRONG_CONSENSUS;
      } else if (agreement_count >= 4) {
        consensus_tier = ConsensusTier.MODERATE_CONSENSUS;
      } else if (agreement_count >= 3) {
        consensus_tier = ConsensusTier.WEAK_CONSENSUS;
      } else {
        consensus_tier = ConsensusTier.NO_CONSENSUS;
      }

      // Consensus Summary explanation
      let consensus_summary = "";
      const teamLabel = rec.recommended_team_id.toUpperCase();
      if (consensus_tier === ConsensusTier.ELITE_CONSENSUS) {
        consensus_summary = `${teamLabel} receives ELITE_CONSENSUS support across all major decision systems.`;
      } else if (consensus_tier === ConsensusTier.STRONG_CONSENSUS) {
        consensus_summary = `${teamLabel} receives STRONG_CONSENSUS support from 5 of 6 decision systems.`;
      } else if (consensus_tier === ConsensusTier.MODERATE_CONSENSUS) {
        consensus_summary = `${teamLabel} receives MODERATE_CONSENSUS support from 4 of 6 decision systems.`;
      } else if (consensus_tier === ConsensusTier.WEAK_CONSENSUS) {
        consensus_summary = `${teamLabel} receives WEAK_CONSENSUS support from 3 of 6 decision systems.`;
      } else {
        consensus_summary = `${teamLabel} currently lacks broad agreement between decision systems.`;
      }

      snapshotsToSave.push({
        season,
        week,
        entry_id: rec.entry_id,
        team_id: rec.recommended_team_id,
        candidate_score,
        survivor_equity_score,
        recommendation_score,
        confidence_score,
        ownership_score,
        future_value_score,
        consensus_score,
        agreement_count,
        consensus_tier,
        consensus_summary,
        calculation_version: calculationVersion
      });
    }

    // 4. Save snapshots to repository (Postgres or Mock memory)
    await this.consensusRepo.deleteBySeasonAndWeek(season, week);
    const saved = await this.consensusRepo.saveMany(snapshotsToSave);
    console.log(`[Recommendation Consensus Service] Calculated and persisted ${saved.length} consensus records.`);
    return saved;
  }
}
