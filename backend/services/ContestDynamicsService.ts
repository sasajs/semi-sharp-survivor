import { 
  ContestDynamicsSnapshot, 
  FeatureStoreSnapshot,
  StrategyType
} from "../../src/types";
import { 
  contestDynamicsRepo, 
  teamRepo, 
  entryRepo,
  ownershipProjectionRepo,
  featureSnapshotRepo,
  RepositoryFactory
} from "../repositories/index";
import { OwnershipProjectionService } from "./OwnershipProjectionService";

interface StrategyWeightConfig {
  leverageWeight: number;
  uniquenessWeight: number;
  overallScale: number;
}

export const STRATEGY_CONTEST_WEIGHTS: Record<StrategyType, StrategyWeightConfig> = {
  [StrategyType.CHAMPIONSHIP_EV]: { leverageWeight: 0.8, uniquenessWeight: 0.2, overallScale: 1.0 },
  [StrategyType.PORTFOLIO_EV]: { leverageWeight: 0.5, uniquenessWeight: 0.5, overallScale: 0.8 },
  [StrategyType.MARKETPLACE_SURVIVAL]: { leverageWeight: 0.2, uniquenessWeight: 0.2, overallScale: 0.3 },
  [StrategyType.GROUP_SURVIVAL]: { leverageWeight: 0.05, uniquenessWeight: 0.05, overallScale: 0.1 }
};

export class ContestDynamicsService {
  private ownershipService = new OwnershipProjectionService();
  private profileRepo = RepositoryFactory.getEntryStrategyProfileRepo();
  private metadataRepo = RepositoryFactory.getEntryMetadataRepo();

  /**
   * Generates and stores contest dynamics snapshots for a given season and week.
   * All snapshots are immutable - every calculation creates a new snapshot set.
   */
  async calculate(season: string, week: number): Promise<ContestDynamicsSnapshot[]> {
    const teams = await teamRepo.getAll();
    const entries = await entryRepo.getAll();

    // 1. Get Ownership Projections. If empty, calculate them first.
    let projections = await ownershipProjectionRepo.getBySeasonAndWeek(season, week);
    if (projections.length === 0) {
      projections = await this.ownershipService.calculate(season, week);
    }

    // Active playing teams
    const activeProjs = projections.filter(p => p.projected_ownership_pct > 0);
    const N = activeProjs.length;

    const calculationVersion = `v0.34-dyn-${Date.now()}`;
    const snapshots: ContestDynamicsSnapshot[] = [];

    for (const entry of entries) {
      // Load entry strategy profile
      const profile = await this.profileRepo.getByEntryId(entry.id);
      const strategyType = (profile?.strategy_type || StrategyType.CHAMPIONSHIP_EV) as StrategyType;
      const weights = STRATEGY_CONTEST_WEIGHTS[strategyType];

      for (const team of teams) {
        const proj = projections.find(p => p.team_id.toLowerCase() === team.id.toLowerCase());
        const projected_ownership_pct = proj ? proj.projected_ownership_pct : 0.0;

        // Chalk score = projected ownership percentage
        const chalk_score = Number(projected_ownership_pct.toFixed(2));

        // Leverage score = 100 - projected ownership percentage
        const leverage_score = Number((100 - projected_ownership_pct).toFixed(2));

        // Uniqueness score = inverse ownership percentile
        let uniqueness_score = 0.0;
        if (proj && proj.ownership_rank <= N && N > 1) {
          // rank 1 (most popular) -> uniqueness 0
          // rank N (least popular) -> uniqueness 100
          uniqueness_score = Number((((proj.ownership_rank - 1) / (N - 1)) * 100).toFixed(2));
        } else if (N === 1) {
          uniqueness_score = 50.0;
        }

        // Contest Equity Adjustment = weighted combination of leverage and uniqueness
        const adjustment = (leverage_score * weights.leverageWeight + uniqueness_score * weights.uniquenessWeight) * weights.overallScale * 0.1;
        const contest_equity_adjustment = Number(adjustment.toFixed(2));

        snapshots.push({
          season,
          week,
          entry_id: entry.id,
          team_id: team.id,
          projected_ownership_pct,
          chalk_score,
          leverage_score,
          uniqueness_score,
          contest_equity_adjustment,
          strategy_profile: strategyType,
          calculation_version: calculationVersion
        });
      }
    }

    // Save to Postgres / Mock DB (Immutable snapshots, so we just append them. We don't overwrite history)
    const saved = await contestDynamicsRepo.saveMany(snapshots);

    // Register as official feature snapshot in the Feature Store
    const fsSnapshots: FeatureStoreSnapshot[] = saved.map(s => ({
      season: Number(s.season),
      week: s.week,
      sport: "NFL",
      team_id: `${s.entry_id}:${s.team_id}`, // Scoped to entry:team for entry features
      feature_id: "contest_dynamics",
      feature_value: s.contest_equity_adjustment,
      source: "contest_dynamics_engine"
    }));
    await featureSnapshotRepo.saveMany(fsSnapshots);

    return saved;
  }

  async getLatest(): Promise<ContestDynamicsSnapshot[]> {
    return contestDynamicsRepo.getLatest();
  }

  async getHistory(): Promise<ContestDynamicsSnapshot[]> {
    return contestDynamicsRepo.getAll();
  }

  async getRankings(season: string, week: number): Promise<ContestDynamicsSnapshot[]> {
    let list = await contestDynamicsRepo.getBySeasonAndWeek(season, week);
    if (list.length === 0) {
      list = await this.calculate(season, week);
    }
    return list;
  }

  /**
   * Generates a textual explanation for a team's contest dynamics.
   */
  generateExplanation(s: ContestDynamicsSnapshot): string {
    const team = s.team_id.toUpperCase();
    const pct = s.projected_ownership_pct;
    const adj = s.contest_equity_adjustment;
    
    if (pct >= 25.0) {
      return `${team} is expected to be highly selected (${pct.toFixed(1)}%). While survival outlook remains strong, ownership concentration reduces differentiation. Contest equity is moderately positive due to projected advancement probability, with an adjustment of +${adj.toFixed(1)}.`;
    }
    if (pct >= 8.0) {
      return `${team} offers solid leverage. With projected ownership of ${pct.toFixed(1)}% and a uniqueness score of ${s.uniqueness_score.toFixed(0)}, it balances risk and reward well (+${adj.toFixed(1)} contest equity).`;
    }
    return `${team} is an outstanding contrarian play (${pct.toFixed(1)}% projected ownership). Selecting them provides maximum differentiation (uniqueness score: ${s.uniqueness_score.toFixed(0)}), resulting in a high contest equity adjustment of +${adj.toFixed(1)}.`;
  }
}
