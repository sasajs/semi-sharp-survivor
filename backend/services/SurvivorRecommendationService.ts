import { 
  SurvivorRecommendation, 
  FeatureStoreSnapshot,
  RecommendationTier,
  StrategyType
} from "../../src/types";
import { 
  survivorRecommendationRepo, 
  recommendationCandidateRepo, 
  ownershipProjectionRepo, 
  contestDynamicsRepo, 
  teamRepo, 
  entryRepo,
  featureSnapshotRepo,
  entryStrategyProfileRepo as profileRepo
} from "../repositories/index";
import { RecommendationCandidateService } from "./RecommendationCandidateService";
import { OwnershipProjectionService } from "./OwnershipProjectionService";
import { ContestDynamicsService } from "./ContestDynamicsService";
import { RecommendationAuditService } from "./RecommendationAuditService";

export const STRATEGY_RECOMMENDATION_WEIGHTS: Record<StrategyType, {
  candidateWeight: number;      // baseline 40%
  equityWeight: number;          // baseline 25%
  ftvWeight: number;             // baseline 15%
  contestDynamicsWeight: number; // baseline 10%
  ownershipWeight: number;       // baseline 10%
}> = {
  [StrategyType.CHAMPIONSHIP_EV]: {
    candidateWeight: 0.30,
    equityWeight: 0.20,
    ftvWeight: 0.15,
    contestDynamicsWeight: 0.20,
    ownershipWeight: 0.15
  },
  [StrategyType.PORTFOLIO_EV]: {
    candidateWeight: 0.35,
    equityWeight: 0.25,
    ftvWeight: 0.15,
    contestDynamicsWeight: 0.15,
    ownershipWeight: 0.10
  },
  [StrategyType.MARKETPLACE_SURVIVAL]: {
    candidateWeight: 0.45,
    equityWeight: 0.35,
    ftvWeight: 0.10,
    contestDynamicsWeight: 0.05,
    ownershipWeight: 0.05
  },
  [StrategyType.GROUP_SURVIVAL]: {
    candidateWeight: 0.50,
    equityWeight: 0.40,
    ftvWeight: 0.05,
    contestDynamicsWeight: 0.025,
    ownershipWeight: 0.025
  }
};

export class SurvivorRecommendationService {
  private recCandidateService = new RecommendationCandidateService();
  private ownershipService = new OwnershipProjectionService();
  private contestDynamicsService = new ContestDynamicsService();
  private auditService = new RecommendationAuditService();
  private get profileRepo() { return profileRepo; }

  /**
   * Generates survivor recommendations for a given season and week.
   */
  async calculate(season: string, week: number): Promise<SurvivorRecommendation[]> {
    const teams = await teamRepo.getAll();
    const entries = await entryRepo.getAll();

    // 1. Get Recommendation Candidates. If empty, calculate them first.
    let candidates = await recommendationCandidateRepo.getBySeasonAndWeek(season, week);
    if (candidates.length === 0) {
      candidates = await this.recCandidateService.calculate(season, week);
    }

    // 2. Get Ownership Projections. If empty, calculate them first.
    let projections = await ownershipProjectionRepo.getBySeasonAndWeek(season, week);
    if (projections.length === 0) {
      projections = await this.ownershipService.calculate(season, week);
    }

    // 3. Get Contest Dynamics. If empty, calculate them first.
    let dynamics = await contestDynamicsRepo.getBySeasonAndWeek(season, week);
    if (dynamics.length === 0) {
      dynamics = await this.contestDynamicsService.calculate(season, week);
    }

    const calculationVersion = `v0.35-rec-${Date.now()}`;
    const recommendations: SurvivorRecommendation[] = [];

    for (const entry of entries) {
      // Load entry strategy profile
      const profile = await this.profileRepo.getByEntryId(entry.id);
      const strategyType = (profile?.strategy_type || StrategyType.CHAMPIONSHIP_EV) as StrategyType;
      const weights = STRATEGY_RECOMMENDATION_WEIGHTS[strategyType] || STRATEGY_RECOMMENDATION_WEIGHTS[StrategyType.CHAMPIONSHIP_EV];

      const entryCandidates = candidates.filter(c => c.entry_id === entry.id);
      const entryDynamics = dynamics.filter(d => d.entry_id === entry.id);

      const entryRecommendations: SurvivorRecommendation[] = [];

      for (const team of teams) {
        const candidate = entryCandidates.find(c => c.team_id.toLowerCase() === team.id.toLowerCase());
        const projection = projections.find(p => p.team_id.toLowerCase() === team.id.toLowerCase());
        const dynamic = entryDynamics.find(d => d.team_id.toLowerCase() === team.id.toLowerCase());

        const isEligible = candidate ? candidate.eligibility_status === "eligible" : false;

        // Base score values
        const candidate_score = candidate ? candidate.candidate_score : 0.0;
        const survivor_equity_score = candidate ? candidate.survivor_equity_score : 0.0;
        const future_team_value_score = candidate ? candidate.future_team_value_score : 50.0;
        const projected_ownership_pct = projection ? projection.projected_ownership_pct : 0.0;
        const contest_equity_adjustment = dynamic ? dynamic.contest_equity_adjustment : 0.0;

        let recommendation_score = 0.0;
        let recommendation_tier = RecommendationTier.LONGSHOT;

        if (isEligible && candidate) {
          // Normalize components to 0-100 scale:
          // 1. Candidate score: already 0-100
          const scoreCandidate = candidate_score;

          // 2. Survivor equity: already 0-100
          const scoreEquity = survivor_equity_score;

          // 3. FTV component (preservation): 100 - FTV score
          const scoreFTV = 100 - future_team_value_score;

          // 4. Contest Equity Adjustment: contest_equity_adjustment * 10
          const scoreContestDynamics = Math.min(100.0, Math.max(0.0, contest_equity_adjustment * 10));

          // 5. Ownership / Leverage signal: 100 - projected ownership %
          const scoreOwnership = Math.min(100.0, Math.max(0.0, 100 - projected_ownership_pct));

          // Combine with strategy-specific weights
          recommendation_score = 
            scoreCandidate * weights.candidateWeight +
            scoreEquity * weights.equityWeight +
            scoreFTV * weights.ftvWeight +
            scoreContestDynamics * weights.contestDynamicsWeight +
            scoreOwnership * weights.ownershipWeight;

          recommendation_score = Number(recommendation_score.toFixed(2));

          // Determine Recommendation Tier
          if (recommendation_score >= 85.0) {
            recommendation_tier = RecommendationTier.STRONG_RECOMMENDATION;
          } else if (recommendation_score >= 70.0) {
            recommendation_tier = RecommendationTier.RECOMMENDATION;
          } else if (recommendation_score >= 50.0) {
            recommendation_tier = RecommendationTier.VIABLE_OPTION;
          } else {
            recommendation_tier = RecommendationTier.LONGSHOT;
          }
        }

        const rec: SurvivorRecommendation = {
          season,
          week,
          entry_id: entry.id,
          recommended_team_id: team.id,
          recommendation_rank: 99, // Assigned below
          recommendation_score,
          candidate_score,
          survivor_equity_score,
          future_team_value_score,
          projected_ownership_pct,
          contest_equity_adjustment,
          strategy_profile: strategyType,
          recommendation_tier,
          recommendation_reason: "", // Assigned below
          calculation_version: calculationVersion
        };

        rec.recommendation_reason = this.generateExplanation(rec, team.id);
        entryRecommendations.push(rec);
      }

      // Sort and rank eligible recommendations
      const eligibleRecs = entryRecommendations.filter(r => r.recommendation_score > 0);
      eligibleRecs.sort((a, b) => b.recommendation_score - a.recommendation_score);
      eligibleRecs.forEach((r, idx) => {
        r.recommendation_rank = idx + 1;
      });

      // Handle ineligible ones
      const ineligibleRecs = entryRecommendations.filter(r => r.recommendation_score === 0);
      ineligibleRecs.forEach(r => {
        const candidate = entryCandidates.find(c => c.team_id.toLowerCase() === r.recommended_team_id.toLowerCase());
        const reason = candidate ? candidate.eligibility_reason : "Team ineligible";
        r.recommendation_rank = eligibleRecs.length + 1;
        r.recommendation_reason = `${r.recommended_team_id.toUpperCase()} is ineligible: ${reason}.`;
      });

      recommendations.push(...entryRecommendations);
    }

    // Save as immutable snapshots
    const saved = await survivorRecommendationRepo.saveMany(recommendations);

    // Register as official feature snapshot in the Feature Store
    const fsSnapshots: FeatureStoreSnapshot[] = saved.map(r => ({
      season: Number(r.season),
      week: r.week,
      sport: "NFL",
      team_id: `${r.entry_id}:${r.recommended_team_id}`,
      feature_id: "survivor_recommendation",
      feature_value: r.recommendation_score,
      source: "survivor_recommendation_engine"
    }));
    await featureSnapshotRepo.saveMany(fsSnapshots);

    // 8. Generate Recommendation Audits automatically (Immutable snapshot tracking changes over time)
    try {
      await this.auditService.generateRecommendationAudits(season, week, calculationVersion);
    } catch (auditErr: any) {
      console.error("[Survivor Recommendation Service] Failed to generate recommendation audits:", auditErr.message);
    }

    return saved;
  }

  /**
   * Generates a textual description of the recommendation.
   */
  generateExplanation(rec: SurvivorRecommendation, teamId: string): string {
    const team = teamId.toUpperCase();
    const score = rec.recommendation_score;
    const equity = rec.survivor_equity_score;
    const ftv = rec.future_team_value_score;
    const ownership = rec.projected_ownership_pct;
    const adj = rec.contest_equity_adjustment;
    const strategy = rec.strategy_profile;

    let tierDesc = "";
    if (ownership >= 25.0) {
      tierDesc = "mega-chalk with high crowd concentration";
    } else if (ownership >= 15.0) {
      tierDesc = "expected chalk";
    } else if (ownership >= 8.0) {
      tierDesc = "expected to have moderate ownership";
    } else {
      tierDesc = "highly contrarian with pivot appeal";
    }

    const ftvDesc = ftv < 40 
      ? "excellent future value preservation" 
      : ftv < 70 
        ? "moderate future value impact" 
        : "high future value consumption";

    const equityDesc = equity > 75 
      ? "high survivor equity" 
      : equity > 50 
        ? "balanced survivor equity" 
        : "marginal survivor equity";

    return `${team} combines ${equityDesc}, ${ftvDesc}, and a ${tierDesc} profile under the ${strategy} strategy (Contest Equity Adjustment: +${adj.toFixed(1)}). Recommended option with an overall Score of ${score.toFixed(1)}.`;
  }

  async getLatest(): Promise<SurvivorRecommendation[]> {
    return survivorRecommendationRepo.getLatest();
  }

  async getHistory(): Promise<SurvivorRecommendation[]> {
    return survivorRecommendationRepo.getAll();
  }

  async getByEntryId(entryId: string): Promise<SurvivorRecommendation[]> {
    return survivorRecommendationRepo.getByEntryId(entryId);
  }

  async getTop(limit: number = 5): Promise<SurvivorRecommendation[]> {
    const list = await this.getLatest();
    return list
      .filter(r => r.recommendation_rank === 1)
      .slice(0, limit);
  }

  async getRankings(season: string, week: number): Promise<SurvivorRecommendation[]> {
    let list = await survivorRecommendationRepo.getBySeasonAndWeek(season, week);
    if (list.length === 0) {
      list = await this.calculate(season, week);
    }
    return list;
  }
}
