import { 
  OwnershipProjection, 
  FeatureStoreSnapshot,
  OwnershipTier
} from "../../src/types";
import { 
  ownershipProjectionRepo, 
  teamRepo, 
  recommendationCandidateRepo,
  featureSnapshotRepo,
  RepositoryFactory
} from "../repositories/index";
import { RecommendationCandidateService } from "./RecommendationCandidateService";

export class OwnershipProjectionService {
  private recCandidateService = new RecommendationCandidateService();
  private metadataRepo = RepositoryFactory.getEntryMetadataRepo();

  /**
   * Generates and stores projected ownership for a given season and week.
   */
  async calculate(season: string, week: number): Promise<OwnershipProjection[]> {
    const teams = await teamRepo.getAll();
    
    // Get recommendation candidates. If empty, calculate them first.
    let candidates = await recommendationCandidateRepo.getBySeasonAndWeek(season, week);
    if (candidates.length === 0) {
      candidates = await this.recCandidateService.calculate(season, week);
    }

    const calculationVersion = `v0.34-own-${Date.now()}`;

    // Base strength fallback for teams (prioritized if no candidates)
    const baseStrengthMap: Record<string, number> = {
      kc: 0.75, sf: 0.73, det: 0.72, bal: 0.72, buf: 0.71, phi: 0.70,
      gb: 0.68, dal: 0.66, mia: 0.65, cin: 0.64, hou: 0.63, lar: 0.62,
      cle: 0.58, tb: 0.57, jax: 0.56, sea: 0.55, ind: 0.54, pit: 0.54,
      atl: 0.53, min: 0.52, chi: 0.51, lv: 0.49, no: 0.48, nyj: 0.47,
      den: 0.46, ari: 0.45, lac: 0.45, ten: 0.43, was: 0.42, ne: 0.38,
      car: 0.35, nyg: 0.34
    };

    // Calculate raw deterministic popularity scores for each team
    const rawScores = new Map<string, number>();
    let totalRawScore = 0;

    // Filter to teams that have games or are in candidates
    const playingTeams = new Set<string>();
    for (const c of candidates) {
      playingTeams.add(c.team_id.toLowerCase());
    }

    for (const team of teams) {
      const teamIdLower = team.id.toLowerCase();
      if (!playingTeams.has(teamIdLower)) {
        // If not playing, raw score is 0
        rawScores.set(team.id, 0);
        continue;
      }

      const teamCandidates = candidates.filter(
        c => c.team_id.toLowerCase() === teamIdLower && c.eligibility_status === "eligible"
      );

      // Extract survival probability and FTV
      const survival_probability = teamCandidates.length > 0
        ? teamCandidates[0].survival_probability
        : (baseStrengthMap[teamIdLower] ?? 0.50) * 100;

      const ftv = teamCandidates.length > 0
        ? teamCandidates[0].future_team_value_score
        : 50;

      const candidate_score = teamCandidates.length > 0
        ? teamCandidates[0].candidate_score
        : 50;

      // Formula: higher survival probability, lower future value, and higher candidate score drives selection rate
      // We use exponential on win prob (as favorites draw disproportionately more chalk)
      const rawPopularity = Math.pow(survival_probability / 100, 3.5) * (1.5 - (ftv / 100)) * (candidate_score / 100) * 100;
      
      const score = Math.max(0.1, rawPopularity);
      rawScores.set(team.id, score);
      totalRawScore += score;
    }

    // Map to percentage and build projection entities
    const projections: OwnershipProjection[] = [];
    for (const team of teams) {
      const teamIdLower = team.id.toLowerCase();
      if (!playingTeams.has(teamIdLower)) {
        projections.push({
          season,
          week,
          team_id: team.id,
          projected_ownership_pct: 0.0,
          ownership_rank: 99,
          ownership_tier: OwnershipTier.EXTREME_CONTRARIAN,
          projection_source: "Deterministic Placeholder Model",
          calculation_version: calculationVersion
        });
        continue;
      }

      const raw = rawScores.get(team.id) || 0;
      const pct = totalRawScore > 0 ? (raw / totalRawScore) * 100 : 0;
      const roundedPct = Number(pct.toFixed(2));

      projections.push({
        season,
        week,
        team_id: team.id,
        projected_ownership_pct: roundedPct,
        ownership_rank: 0, // Assigned below
        ownership_tier: this.determineTier(roundedPct),
        projection_source: "Deterministic Placeholder Model",
        calculation_version: calculationVersion
      });
    }

    // Sort active ones and assign rank
    const activeProjections = projections.filter(p => p.projected_ownership_pct > 0);
    activeProjections.sort((a, b) => b.projected_ownership_pct - a.projected_ownership_pct);
    activeProjections.forEach((p, idx) => {
      p.ownership_rank = idx + 1;
    });

    // Sort ineligible/bye teams to the end
    projections.forEach(p => {
      if (p.ownership_rank === 0) {
        p.ownership_rank = activeProjections.length + 1;
      }
    });

    // Sort by rank before saving
    projections.sort((a, b) => a.ownership_rank - b.ownership_rank);

    // Save to Postgres / Mock DB
    await ownershipProjectionRepo.deleteBySeasonAndWeek(season, week);
    const saved = await ownershipProjectionRepo.saveMany(projections);

    // Register as official feature snapshot in the Feature Store
    const snapshots: FeatureStoreSnapshot[] = saved.map(p => ({
      season: Number(p.season),
      week: p.week,
      sport: "NFL",
      team_id: p.team_id,
      feature_id: "ownership_projection",
      feature_value: p.projected_ownership_pct,
      source: "ownership_projection_engine"
    }));
    await featureSnapshotRepo.saveMany(snapshots);

    return saved;
  }

  /**
   * Determines ownership tier based on projected ownership percentage.
   */
  determineTier(pct: number): OwnershipTier {
    if (pct >= 25.0) return OwnershipTier.MEGA_CHALK;
    if (pct >= 15.0) return OwnershipTier.CHALK;
    if (pct >= 8.0) return OwnershipTier.POPULAR;
    if (pct >= 3.0) return OwnershipTier.NEUTRAL;
    if (pct >= 1.0) return OwnershipTier.CONTRARIAN;
    return OwnershipTier.EXTREME_CONTRARIAN;
  }

  async getLatest(): Promise<OwnershipProjection[]> {
    return ownershipProjectionRepo.getLatest();
  }

  async getHistory(): Promise<OwnershipProjection[]> {
    return ownershipProjectionRepo.getAll();
  }

  async getRankings(season: string, week: number): Promise<OwnershipProjection[]> {
    let list = await ownershipProjectionRepo.getBySeasonAndWeek(season, week);
    if (list.length === 0) {
      list = await this.calculate(season, week);
    }
    return list;
  }

  /**
   * Generates a textual description of the projection.
   */
  generateExplanation(p: OwnershipProjection): string {
    const tier = p.ownership_tier;
    const team = p.team_id.toUpperCase();
    const pct = p.projected_ownership_pct;

    if (tier === "MEGA_CHALK") {
      return `${team} is projected as MEGA-CHALK at ${pct.toFixed(1)}% ownership. Highly popular pick this week. Selecting them offers almost no differentiation.`;
    }
    if (tier === "CHALK") {
      return `${team} is chalk at ${pct.toFixed(1)}% ownership. Expected to be heavily selected. Moderate threat of high concentration.`;
    }
    if (tier === "POPULAR") {
      return `${team} is popular with ${pct.toFixed(1)}% ownership. Normal public selection interest.`;
    }
    if (tier === "NEUTRAL") {
      return `${team} is in the neutral tier at ${pct.toFixed(1)}% ownership. Balanced choice with low concentration risk.`;
    }
    if (tier === "CONTRARIAN") {
      return `${team} is contrarian at ${pct.toFixed(1)}% ownership. Very few entries are expected to pick them, creating strong pivot potential.`;
    }
    return `${team} is EXTREMELY CONTRARIAN at ${pct.toFixed(1)}% ownership. High-risk pivot with extreme uniqueness.`;
  }
}
