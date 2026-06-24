import { recommendationAuditRepo, survivorRecommendationRepo } from "../repositories/index";
import { RecommendationAudit, RecommendationChangeCategory, SurvivorRecommendation } from "../../src/types";

export class RecommendationAuditService {
  private get auditRepo() { return recommendationAuditRepo; }
  private get recRepo() { return survivorRecommendationRepo; }

  async getAll(): Promise<RecommendationAudit[]> {
    return this.auditRepo.getAll();
  }

  async getLatest(): Promise<RecommendationAudit[]> {
    return this.auditRepo.getLatest();
  }

  async getByEntryId(entryId: string): Promise<RecommendationAudit[]> {
    return this.auditRepo.getByEntryId(entryId);
  }

  async getByTeamId(teamId: string): Promise<RecommendationAudit[]> {
    return this.auditRepo.getByTeamId(teamId);
  }

  async getBySeasonAndWeek(season: string, week: number): Promise<RecommendationAudit[]> {
    return this.auditRepo.getBySeasonAndWeek(season, week);
  }

  /**
   * Generates recommendation audits by comparing the latest generated recommendations with the previous run.
   */
  async generateRecommendationAudits(season: string, week: number, currentVersion: string): Promise<RecommendationAudit[]> {
    // 1. Fetch all recommendations for this season and week
    const allRecs = await this.recRepo.getBySeasonAndWeek(season, week);
    if (allRecs.length === 0) {
      return [];
    }

    // 2. Identify current recommendations
    const currentRecs = allRecs.filter(r => r.calculation_version === currentVersion);
    if (currentRecs.length === 0) {
      return [];
    }

    // 3. Identify previous version (the most recent calculation version other than currentVersion)
    const otherRecs = allRecs.filter(r => r.calculation_version !== currentVersion);
    let previousVersion: string | null = null;
    if (otherRecs.length > 0) {
      const sortedOther = [...otherRecs].sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      });
      previousVersion = sortedOther[0].calculation_version;
    }

    const previousRecs = previousVersion 
      ? otherRecs.filter(r => r.calculation_version === previousVersion)
      : [];

    // 4. For each entry, compare current recommendations with previous recommendations
    const auditsToSave: RecommendationAudit[] = [];

    // Get all distinct entry IDs in the current set
    const currentEntries = Array.from(new Set(currentRecs.map(r => r.entry_id)));

    for (const entryId of currentEntries) {
      const currentEntryRecs = currentRecs.filter(r => r.entry_id === entryId);
      const previousEntryRecs = previousRecs.filter(r => r.entry_id === entryId);

      const currentMap = new Map<string, SurvivorRecommendation>();
      currentEntryRecs.forEach(r => currentMap.set(r.recommended_team_id.toLowerCase(), r));

      const previousMap = new Map<string, SurvivorRecommendation>();
      previousEntryRecs.forEach(r => previousMap.set(r.recommended_team_id.toLowerCase(), r));

      const allTeamIds = Array.from(new Set([
        ...Array.from(currentMap.keys()),
        ...Array.from(previousMap.keys())
      ]));

      for (const teamId of allTeamIds) {
        const current = currentMap.get(teamId);
        const previous = previousMap.get(teamId);

        let previous_rank: number | null = null;
        let current_rank: number | null = null;
        let rank_delta = 0;

        let previous_score: number | null = null;
        let current_score: number | null = null;
        let score_delta = 0;

        let previous_tier: string | null = null;
        let current_tier: string | null = null;

        let candidate_score_delta = 0;
        let survivor_equity_delta = 0;
        let future_value_delta = 0;
        let ownership_delta = 0;
        let contest_dynamics_delta = 0;

        let change_category = RecommendationChangeCategory.UNCHANGED;

        if (current && previous) {
          previous_rank = previous.recommendation_rank;
          current_rank = current.recommendation_rank;
          rank_delta = previous_rank - current_rank; // Improved rank is positive

          previous_score = previous.recommendation_score;
          current_score = current.recommendation_score;
          score_delta = Number((current_score - previous_score).toFixed(2));

          previous_tier = previous.recommendation_tier;
          current_tier = current.recommendation_tier;

          candidate_score_delta = Number((current.candidate_score - previous.candidate_score).toFixed(2));
          survivor_equity_delta = Number((current.survivor_equity_score - previous.survivor_equity_score).toFixed(2));
          future_value_delta = Number((current.future_team_value_score - previous.future_team_value_score).toFixed(2));
          ownership_delta = Number((current.projected_ownership_pct - previous.projected_ownership_pct).toFixed(2));
          contest_dynamics_delta = Number((current.contest_equity_adjustment - previous.contest_equity_adjustment).toFixed(2));

          if (score_delta >= 5.0) {
            change_category = RecommendationChangeCategory.MAJOR_IMPROVEMENT;
          } else if (score_delta > 1.0) {
            change_category = RecommendationChangeCategory.MINOR_IMPROVEMENT;
          } else if (score_delta <= -5.0) {
            change_category = RecommendationChangeCategory.MAJOR_DECLINE;
          } else if (score_delta < -1.0) {
            change_category = RecommendationChangeCategory.MINOR_DECLINE;
          } else {
            change_category = RecommendationChangeCategory.UNCHANGED;
          }
        } else if (current) {
          current_rank = current.recommendation_rank;
          rank_delta = 0;

          current_score = current.recommendation_score;
          score_delta = current_score;

          current_tier = current.recommendation_tier;

          candidate_score_delta = current.candidate_score;
          survivor_equity_delta = current.survivor_equity_score;
          future_value_delta = current.future_team_value_score;
          ownership_delta = current.projected_ownership_pct;
          contest_dynamics_delta = current.contest_equity_adjustment;

          change_category = RecommendationChangeCategory.NEW_RECOMMENDATION;
        } else if (previous) {
          previous_rank = previous.recommendation_rank;
          rank_delta = 0;

          previous_score = previous.recommendation_score;
          score_delta = -previous_score;

          previous_tier = previous.recommendation_tier;

          candidate_score_delta = -previous.candidate_score;
          survivor_equity_delta = -previous.survivor_equity_score;
          future_value_delta = -previous.future_team_value_score;
          ownership_delta = -previous.projected_ownership_pct;
          contest_dynamics_delta = -previous.contest_equity_adjustment;

          change_category = RecommendationChangeCategory.REMOVED_RECOMMENDATION;
        }

        const audit_summary = this.generateNarrative(
          teamId,
          previous_rank,
          current_rank,
          previous_score,
          current_score,
          previous_tier,
          current_tier,
          candidate_score_delta,
          survivor_equity_delta,
          future_value_delta,
          ownership_delta,
          contest_dynamics_delta,
          change_category
        );

        const audit: RecommendationAudit = {
          season,
          week,
          entry_id: entryId,
          team_id: teamId.toUpperCase(),
          previous_rank,
          current_rank,
          rank_delta,
          previous_score,
          current_score,
          score_delta,
          previous_tier,
          current_tier,
          candidate_score_delta,
          survivor_equity_delta,
          future_value_delta,
          ownership_delta,
          contest_dynamics_delta,
          change_category,
          audit_summary,
          calculation_version: currentVersion
        };

        auditsToSave.push(audit);
      }
    }

    const savedAudits = await this.auditRepo.saveMany(auditsToSave);
    return savedAudits;
  }

  private generateNarrative(
    teamId: string,
    prevRank: number | null,
    currRank: number | null,
    prevScore: number | null,
    currScore: number | null,
    prevTier: string | null,
    currTier: string | null,
    candidate_score_delta: number,
    survivor_equity_delta: number,
    future_value_delta: number,
    ownership_delta: number,
    contest_dynamics_delta: number,
    category: RecommendationChangeCategory
  ): string {
    const teamName = teamId.toUpperCase();
    if (category === RecommendationChangeCategory.NEW_RECOMMENDATION) {
      return `New recommendation for ${teamName} at Rank ${currRank} with a score of ${currScore?.toFixed(1)}.`;
    }
    if (category === RecommendationChangeCategory.REMOVED_RECOMMENDATION) {
      return `${teamName} was dropped from the recommendation list (previously Rank ${prevRank} with a score of ${prevScore?.toFixed(1)}).`;
    }

    const rankStr = prevRank !== currRank 
      ? `${teamName} rank moved from Rank ${prevRank} to Rank ${currRank} (Delta: ${currRank && prevRank ? (prevRank - currRank > 0 ? "+" : "") + (prevRank - currRank) : "0"}).`
      : `${teamName} maintained Rank ${currRank}.`;

    const drivers: string[] = [];
    if (Math.abs(survivor_equity_delta) > 0.1) {
      drivers.push(`${survivor_equity_delta > 0 ? "+" : ""}${survivor_equity_delta.toFixed(1)} Survivor Equity`);
    }
    if (Math.abs(contest_dynamics_delta) > 0.1) {
      drivers.push(`${contest_dynamics_delta > 0 ? "+" : ""}${contest_dynamics_delta.toFixed(1)} Contest Dynamics`);
    }
    if (Math.abs(ownership_delta) > 0.1) {
      drivers.push(`${ownership_delta > 0 ? "+" : ""}${ownership_delta.toFixed(1)} Ownership`);
    }
    if (Math.abs(candidate_score_delta) > 0.1) {
      drivers.push(`${candidate_score_delta > 0 ? "+" : ""}${candidate_score_delta.toFixed(1)} Candidate Score`);
    }
    if (Math.abs(future_value_delta) > 0.1) {
      drivers.push(`${future_value_delta > 0 ? "+" : ""}${future_value_delta.toFixed(1)} Future Team Value`);
    }

    const driverStr = drivers.length > 0 
      ? `Primary drivers: ${drivers.join(", ")}.`
      : `Components remained stable.`;

    const scoreStr = prevScore !== currScore
      ? `Recommendation Score changed from ${prevScore?.toFixed(1)} to ${currScore?.toFixed(1)} (Delta: ${currScore && prevScore ? (currScore - prevScore > 0 ? "+" : "") + (currScore - prevScore).toFixed(1) : "0"}).`
      : `Recommendation Score remained stable at ${currScore?.toFixed(1)}.`;

    return `${rankStr} ${driverStr} ${scoreStr}`;
  }
}
