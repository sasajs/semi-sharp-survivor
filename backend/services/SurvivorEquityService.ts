import { 
  SurvivorEquitySnapshot, 
  StrategyType, 
  FeatureStoreSnapshot,
  FutureTeamValue
} from "../../src/types";
import { 
  survivorEquityRepo, 
  teamRepo, 
  legRepo, 
  lineRepo, 
  entryRepo,
  featureSnapshotRepo,
  futureTeamValueRepo,
  entryStrategyProfileRepo as profileRepo
} from "../repositories/index";
import { FutureTeamValueService } from "./FutureTeamValueService";

export const STRATEGY_EQUITY_WEIGHTS: Record<StrategyType, { survival: number; futureValue: number; utility: number }> = {
  [StrategyType.CHAMPIONSHIP_EV]: { survival: 0.30, futureValue: 0.50, utility: 0.20 },
  [StrategyType.PORTFOLIO_EV]: { survival: 0.40, futureValue: 0.40, utility: 0.20 },
  [StrategyType.MARKETPLACE_SURVIVAL]: { survival: 0.60, futureValue: 0.20, utility: 0.20 },
  [StrategyType.GROUP_SURVIVAL]: { survival: 0.70, futureValue: 0.15, utility: 0.15 }
};

export class SurvivorEquityService {
  private get profileRepo() { return profileRepo; }
  private ftvService = new FutureTeamValueService();

  /**
   * Calculates Survivor Equity snapshots for all entries and teams.
   * Saves results in immutable historical records and Feature Store.
   */
  async calculate(season: string, week: number): Promise<SurvivorEquitySnapshot[]> {
    const teams = await teamRepo.getAll();
    const legs = await legRepo.getAll();
    const lines = await lineRepo.getAll();
    const entries = await entryRepo.getAll();

    // Identify current and future weeks
    const sortedLegs = legs.sort((a, b) => a.display_order - b.display_order);
    const currentLeg = sortedLegs.find(l => l.nfl_week === week);
    const futureLegs = sortedLegs.filter(l => l.nfl_week > week);
    
    const totalLegsCount = sortedLegs.length;
    const futureWeeksConsidered = futureLegs.length;

    const remainingSeasonUtility = totalLegsCount > 0
      ? (futureWeeksConsidered / totalLegsCount) * 100
      : 0;

    // Get Future Team Values for this week
    let ftvList = await futureTeamValueRepo.getBySeasonAndWeek(season, week);
    if (ftvList.length === 0) {
      ftvList = await this.ftvService.calculate(season, week);
    }

    const ftvMap = new Map<string, number>();
    for (const ftv of ftvList) {
      ftvMap.set(ftv.team_id, ftv.future_value_score);
    }

    // Win probability line map
    const lineMap = new Map<string, number>();
    if (currentLeg) {
      for (const line of lines) {
        if (line.contest_leg_id === currentLeg.id) {
          lineMap.set(line.team_id, line.win_probability);
        }
      }
    }

    const baseStrengthMap: Record<string, number> = {
      kc: 0.75, sf: 0.73, det: 0.72, bal: 0.72, buf: 0.71, phi: 0.70,
      gb: 0.68, dal: 0.66, mia: 0.65, cin: 0.64, hou: 0.63, lar: 0.62,
      cle: 0.58, tb: 0.57, jax: 0.56, sea: 0.55, ind: 0.54, pit: 0.54,
      atl: 0.53, min: 0.52, chi: 0.51, lv: 0.49, no: 0.48, nyj: 0.47,
      den: 0.46, ari: 0.45, lac: 0.45, ten: 0.43, was: 0.42, ne: 0.38,
      car: 0.35, nyg: 0.34
    };

    const calculationVersion = `v0.32-${Date.now()}`;
    const allCalculations: SurvivorEquitySnapshot[] = [];

    // Evaluate for each survivor entry
    for (const entry of entries) {
      // Find strategy profile
      const profile = await this.profileRepo.getByEntryId(entry.id);
      const strategyType = profile?.strategy_type || StrategyType.PORTFOLIO_EV;
      const weights = STRATEGY_EQUITY_WEIGHTS[strategyType];

      const entryCalculations: SurvivorEquitySnapshot[] = [];

      for (const team of teams) {
        // Simple survival probability proxy
        const rawProb = lineMap.get(team.id) ?? baseStrengthMap[team.id] ?? 0.50;
        const survivalProbPercent = rawProb * 100;

        // Future team value proxy
        const futureValScore = ftvMap.get(team.id) ?? 50.0;

        // Formula: weights.survival * Survival + weights.futureValue * FTV + weights.utility * RSU
        let score = 
          (survivalProbPercent * weights.survival) +
          (futureValScore * weights.futureValue) +
          (remainingSeasonUtility * weights.utility);

        score = Math.min(100.00, Math.max(0.00, Number(score.toFixed(2))));

        entryCalculations.push({
          season,
          week,
          entry_id: entry.id,
          team_id: team.id,
          survival_probability: Number(survivalProbPercent.toFixed(2)),
          future_team_value: Number(futureValScore.toFixed(2)),
          equity_score: score,
          equity_rank: 0, // Assigned below
          strategy_profile: strategyType,
          calculation_version: calculationVersion
        });
      }

      // Sort and rank descending per entry
      entryCalculations.sort((a, b) => b.equity_score - a.equity_score);
      entryCalculations.forEach((calc, idx) => {
        calc.equity_rank = idx + 1;
      });

      allCalculations.push(...entryCalculations);
    }

    // Persist all calculated snapshots
    const saved = await survivorEquityRepo.saveMany(allCalculations);

    // Register results in Feature Store snapshots
    const featureSnapshots: FeatureStoreSnapshot[] = saved.map(s => ({
      season: Number(s.season),
      week: s.week,
      sport: "NFL",
      team_id: s.team_id,
      feature_id: "survivor_equity",
      feature_value: s.equity_score,
      source: `survivor_equity_${s.entry_id}`
    }));
    await featureSnapshotRepo.saveMany(featureSnapshots);

    return saved;
  }

  /**
   * Retrieves latest calculated snapshots.
   */
  async getLatest(): Promise<SurvivorEquitySnapshot[]> {
    return survivorEquityRepo.getLatest();
  }

  /**
   * Retrieves full history of calculated snapshots.
   */
  async getHistory(): Promise<SurvivorEquitySnapshot[]> {
    return survivorEquityRepo.getAll();
  }

  /**
   * Gets rankings matching given criteria, decorated with explainable narrative details.
   */
  async getRankingsWithExplainability(
    season: string,
    week: number,
    strategyType?: StrategyType
  ): Promise<any[]> {
    let baseSnapshots = await survivorEquityRepo.getBySeasonAndWeek(season, week);

    // Dynamic on-demand calculation if empty
    if (baseSnapshots.length === 0) {
      await this.calculate(season, week);
      baseSnapshots = await survivorEquityRepo.getBySeasonAndWeek(season, week);
    }

    // Filter by strategy profile if specified
    const targetType = strategyType || StrategyType.PORTFOLIO_EV;
    const filtered = baseSnapshots.filter(s => s.strategy_profile === targetType);

    // Map and generate explanation
    const decorated = filtered.map(s => {
      return {
        ...s,
        explanation: this.generateExplanation(s)
      };
    });

    // Re-rank for filtered strategy set
    decorated.sort((a, b) => b.equity_score - a.equity_score);
    decorated.forEach((d, idx) => {
      d.equity_rank = idx + 1;
    });

    return decorated;
  }

  private generateExplanation(s: SurvivorEquitySnapshot): string {
    const teamName = s.team_id.toUpperCase();
    const weights = STRATEGY_EQUITY_WEIGHTS[s.strategy_profile as StrategyType] || STRATEGY_EQUITY_WEIGHTS[StrategyType.PORTFOLIO_EV];
    
    let reasoning = "";
    if (s.equity_score >= 80) {
      reasoning = `Highly premium tactical recommendation for ${teamName}. Exhibits exceptional current survival probability (${s.survival_probability.toFixed(0)}%) while preserving critical future expected value.`;
    } else if (s.equity_score >= 60) {
      reasoning = `Strong balanced selection for ${teamName}. Offers robust immediate safety with moderate impact on future-week utility metrics.`;
    } else if (s.equity_score >= 40) {
      reasoning = `Moderate tactical compromise. Selecting ${teamName} might save elite teams but offers lower immediate safety margins.`;
    } else {
      reasoning = `Highly inefficient decision profile. Selecting ${teamName} results in a low survival chance combined with minimal strategic value added.`;
    }

    // Add explicit component breakdowns for perfect transparency
    reasoning += ` Weight breakdown: Survival (${(weights.survival * 100).toFixed(0)}%), FTV (${(weights.futureValue * 100).toFixed(0)}%), Season Utility (${(weights.utility * 100).toFixed(0)}%).`;
    return reasoning;
  }
}
