import { 
  recommendationConfidenceRepo, 
  survivorRecommendationRepo, 
  recommendationAuditRepo 
} from "../repositories/index";
import { 
  RecommendationConfidenceSnapshot, 
  ConfidenceTier, 
  StabilityTier, 
  SurvivorRecommendation, 
  RecommendationAudit,
  RecommendationTier
} from "../../src/types";

export class RecommendationConfidenceService {
  private get confidenceRepo() { return recommendationConfidenceRepo; }
  private get recRepo() { return survivorRecommendationRepo; }
  private get auditRepo() { return recommendationAuditRepo; }

  async getAll(): Promise<RecommendationConfidenceSnapshot[]> {
    return this.confidenceRepo.getAll();
  }

  async getLatest(): Promise<RecommendationConfidenceSnapshot[]> {
    return this.confidenceRepo.getLatest();
  }

  async getByEntryId(entryId: string): Promise<RecommendationConfidenceSnapshot[]> {
    return this.confidenceRepo.getByEntryId(entryId);
  }

  async getByTeamId(teamId: string): Promise<RecommendationConfidenceSnapshot[]> {
    return this.confidenceRepo.getByTeamId(teamId);
  }

  async getTopConfidence(limit: number = 10): Promise<RecommendationConfidenceSnapshot[]> {
    return this.confidenceRepo.getTopConfidence(limit);
  }

  async calculate(season: string, week: number, currentVersion: string): Promise<RecommendationConfidenceSnapshot[]> {
    // 1. Fetch current recommendations for this season, week, and version
    const allRecs = await this.recRepo.getBySeasonAndWeek(season, week);
    const currentRecs = allRecs.filter(r => r.calculation_version === currentVersion);

    if (currentRecs.length === 0) {
      console.warn(`[Recommendation Confidence Service] No recommendations found for version ${currentVersion}`);
      return [];
    }

    // 2. Fetch historical audits for the season and week
    const audits = await this.auditRepo.getBySeasonAndWeek(season, week);

    const snapshotsToSave: RecommendationConfidenceSnapshot[] = [];

    // 3. Process recommendations entry by entry to calculate gaps
    const entries = Array.from(new Set(currentRecs.map(r => r.entry_id)));

    for (const entryId of entries) {
      const entryRecs = currentRecs.filter(r => r.entry_id === entryId);
      
      // Sort entry recommendations by rank (1 being top) or score descending
      const sortedRecs = [...entryRecs].sort((a, b) => a.recommendation_rank - b.recommendation_rank);
      if (sortedRecs.length === 0) continue;

      const topRec = sortedRecs[0];

      for (let i = 0; i < sortedRecs.length; i++) {
        const rec = sortedRecs[i];
        const teamId = rec.recommended_team_id;

        // Calculate score gaps
        const score_gap_to_next = (i < sortedRecs.length - 1)
          ? Number((rec.recommendation_score - sortedRecs[i + 1].recommendation_score).toFixed(2))
          : 0.0;

        const score_gap_to_top = Number((topRec.recommendation_score - rec.recommendation_score).toFixed(2));

        // Fetch all audits for this specific entry and team to compute volatility
        const entryTeamAudits = audits.filter(a => 
          a.entry_id === entryId && 
          a.team_id.toLowerCase() === teamId.toLowerCase()
        );

        // Volatility Calculation
        let recommendation_volatility = 0.0;
        if (entryTeamAudits.length > 0) {
          const rank_changes = entryTeamAudits.map(a => Math.abs(a.rank_delta));
          const score_changes = entryTeamAudits.map(a => Math.abs(a.score_delta));
          const tier_changes = entryTeamAudits.filter(a => a.previous_tier !== a.current_tier).length;

          const avg_rank_change = rank_changes.reduce((sum, val) => sum + val, 0) / entryTeamAudits.length;
          const avg_score_change = score_changes.reduce((sum, val) => sum + val, 0) / entryTeamAudits.length;

          recommendation_volatility = Math.min(100.0, Number((
            (avg_rank_change * 15.0) + 
            (avg_score_change * 8.0) + 
            (tier_changes * 12.0)
          ).toFixed(2)));
        }

        // Confidence Model (Deterministic 0-100)
        let tierBonus = 0.0;
        if (rec.recommendation_tier === RecommendationTier.STRONG_RECOMMENDATION) {
          tierBonus = 12.0;
        } else if (rec.recommendation_tier === RecommendationTier.RECOMMENDATION) {
          tierBonus = 5.0;
        } else if (rec.recommendation_tier === RecommendationTier.VIABLE_OPTION) {
          tierBonus = 0.0;
        } else if (rec.recommendation_tier === RecommendationTier.LONGSHOT) {
          tierBonus = -15.0;
        }

        // Confidence Score Formula
        let confidence_score = (rec.recommendation_score * 0.8) + 
                               (score_gap_to_next * 1.5) - 
                               (score_gap_to_top * 1.2) + 
                               tierBonus;

        confidence_score = Math.min(100.0, Math.max(0.0, Number(confidence_score.toFixed(2))));

        // Stability Model (Deterministic 0-100)
        let stability_score = 100.0 - recommendation_volatility;

        // Apply penalty for recent rank and score moves in latest audit
        const latestAudit = entryTeamAudits[entryTeamAudits.length - 1];
        if (latestAudit) {
          const rankPenalty = Math.min(25.0, Math.abs(latestAudit.rank_delta) * 6.0);
          const scorePenalty = Math.min(20.0, Math.abs(latestAudit.score_delta) * 4.0);
          stability_score -= (rankPenalty + scorePenalty);
        }

        // Audit frequency penalty
        const freqPenalty = Math.min(15.0, entryTeamAudits.length * 2.5);
        stability_score -= freqPenalty;

        stability_score = Math.min(100.0, Math.max(0.0, Number(stability_score.toFixed(2))));

        // Determine Tiers
        const confidence_tier = this.getConfidenceTier(confidence_score);
        const stability_tier = this.getStabilityTier(stability_score);

        // Generate Human-Readable Explanation
        const explanation = this.generateExplanation(
          teamId,
          confidence_score,
          stability_score,
          score_gap_to_next,
          score_gap_to_top,
          recommendation_volatility,
          latestAudit,
          rec
        );

        snapshotsToSave.push({
          season,
          week,
          entry_id: entryId,
          team_id: teamId.toUpperCase(),
          recommendation_rank: rec.recommendation_rank,
          recommendation_score: rec.recommendation_score,
          confidence_score,
          stability_score,
          score_gap_to_next,
          score_gap_to_top,
          recommendation_volatility,
          confidence_tier,
          stability_tier,
          explanation,
          calculation_version: currentVersion
        });
      }
    }

    // Save as immutable snapshots
    const savedSnapshots = await this.confidenceRepo.saveMany(snapshotsToSave);
    return savedSnapshots;
  }

  private getConfidenceTier(score: number): ConfidenceTier {
    if (score >= 90.0) return ConfidenceTier.VERY_HIGH;
    if (score >= 75.0) return ConfidenceTier.HIGH;
    if (score >= 50.0) return ConfidenceTier.MEDIUM;
    if (score >= 25.0) return ConfidenceTier.LOW;
    return ConfidenceTier.VERY_LOW;
  }

  private getStabilityTier(score: number): StabilityTier {
    if (score >= 90.0) return StabilityTier.VERY_STABLE;
    if (score >= 75.0) return StabilityTier.STABLE;
    if (score >= 50.0) return StabilityTier.MODERATE;
    if (score >= 25.0) return StabilityTier.UNSTABLE;
    return StabilityTier.HIGHLY_UNSTABLE;
  }

  private generateExplanation(
    teamId: string,
    confidenceScore: number,
    stabilityScore: number,
    scoreGapToNext: number,
    scoreGapToTop: number,
    volatility: number,
    latestAudit: RecommendationAudit | undefined,
    rec: SurvivorRecommendation
  ): string {
    const team = teamId.toUpperCase();
    const parts: string[] = [];

    // 1. Confidence driver description
    if (rec.recommendation_rank === 1) {
      if (scoreGapToNext > 5.0) {
        parts.push(`${team} strongly leads the next option by ${scoreGapToNext.toFixed(1)} points.`);
      } else if (scoreGapToNext > 1.0) {
        parts.push(`${team} holds a moderate lead of ${scoreGapToNext.toFixed(1)} points over the next option.`);
      } else {
        parts.push(`${team} is the top option but shares a narrow lead of only ${scoreGapToNext.toFixed(1)} points.`);
      }
    } else {
      parts.push(`${team} trails the top recommendation by ${scoreGapToTop.toFixed(1)} points.`);
    }

    // 2. Rank movement stability driver description
    if (latestAudit && Math.abs(latestAudit.rank_delta) > 0) {
      const direction = latestAudit.rank_delta > 0 ? "rose" : "fell";
      parts.push(`Recent rank movement occurred: ${team} ${direction} by ${Math.abs(latestAudit.rank_delta)} position(s).`);
    } else {
      parts.push(`No significant recommendation rank movement has occurred.`);
    }

    // 3. Volatility description
    if (volatility >= 40.0) {
      parts.push(`Historical recommendation volatility remains high (${volatility.toFixed(1)}).`);
    } else if (volatility >= 15.0) {
      parts.push(`Historical recommendation volatility is moderate (${volatility.toFixed(1)}).`);
    } else {
      parts.push(`Historical recommendation volatility remains low (${volatility.toFixed(1)}).`);
    }

    return parts.join(" ");
  }
}
