import { 
  FutureTeamValue, 
  StrategyType, 
  FeatureStoreSnapshot 
} from "../../src/types";
import { 
  futureTeamValueRepo, 
  teamRepo, 
  legRepo, 
  lineRepo, 
  featureSnapshotRepo 
} from "../repositories/index";

export const STRATEGY_FUTURE_VALUE_WEIGHTS: Record<StrategyType, number> = {
  [StrategyType.CHAMPIONSHIP_EV]: 1.0,
  [StrategyType.PORTFOLIO_EV]: 0.7,
  [StrategyType.MARKETPLACE_SURVIVAL]: 0.4,
  [StrategyType.GROUP_SURVIVAL]: 0.3
};

export class FutureTeamValueService {
  /**
   * Calculates future value scores for all teams for a given season and week,
   * saves them to the repository, and registers them in the Feature Store.
   */
  async calculate(season: string, week: number): Promise<FutureTeamValue[]> {
    const teams = await teamRepo.getAll();
    const legs = await legRepo.getAll();
    const lines = await lineRepo.getAll();

    // Filter legs belonging to this season/contest (usually circa-2026)
    const seasonLegs = legs.sort((a, b) => a.display_order - b.display_order);

    // Identify future weeks/legs after the current week
    const futureLegs = seasonLegs.filter(l => l.nfl_week > week);
    const totalLegsCount = seasonLegs.length;
    const futureWeeksConsidered = futureLegs.length;

    const calculationVersion = `v-${Date.now()}`;
    const calculatedValues: FutureTeamValue[] = [];

    // Map win probabilities by team -> leg for quick access
    const lineMap = new Map<string, Map<string, number>>();
    for (const line of lines) {
      if (!lineMap.has(line.team_id)) {
        lineMap.set(line.team_id, new Map());
      }
      lineMap.get(line.team_id)!.set(line.contest_leg_id, line.win_probability);
    }

    // Determine basic team strength baseline if lines are empty/missing
    const baseStrengthMap: Record<string, number> = {
      kc: 0.75, sf: 0.73, det: 0.72, bal: 0.72, buf: 0.71, phi: 0.70,
      gb: 0.68, dal: 0.66, mia: 0.65, cin: 0.64, hou: 0.63, lar: 0.62,
      cle: 0.58, tb: 0.57, jax: 0.56, sea: 0.55, ind: 0.54, pit: 0.54,
      atl: 0.53, min: 0.52, chi: 0.51, lv: 0.49, no: 0.48, nyj: 0.47,
      den: 0.46, ari: 0.45, lac: 0.45, ten: 0.43, was: 0.42, ne: 0.38,
      car: 0.35, nyg: 0.34
    };

    for (const team of teams) {
      const futureProbabilities: number[] = [];
      let strongFavoritesCount = 0;
      let moderateFavoritesCount = 0;

      for (const leg of futureLegs) {
        const prob = lineMap.get(team.id)?.get(leg.id) ?? baseStrengthMap[team.id] ?? 0.50;
        futureProbabilities.push(prob);
        if (prob >= 0.65) {
          strongFavoritesCount++;
        } else if (prob >= 0.55) {
          moderateFavoritesCount++;
        }
      }

      const averageWinProb = futureProbabilities.length > 0
        ? futureProbabilities.reduce((sum, p) => sum + p, 0) / futureProbabilities.length
        : baseStrengthMap[team.id] ?? 0.50;

      const remainingSeasonUtility = totalLegsCount > 0
        ? futureWeeksConsidered / totalLegsCount
        : 0;

      // 1. Opportunities score: strong favorites have premium preservation value
      const opportunitiesScore = Math.min(100, (strongFavoritesCount * 12 + moderateFavoritesCount * 4) * 1.5);
      
      // 2. Strength score: a stronger team has higher saving value
      const strengthScore = averageWinProb * 100;

      // 3. Utility score: remaining proportion of season
      const utilityScore = remainingSeasonUtility * 100;

      // Combine into base score
      let score = opportunitiesScore * 0.45 + strengthScore * 0.35 + utilityScore * 0.20;

      // Cap at 100
      score = Math.min(100.00, Math.max(0.00, Number(score.toFixed(2))));

      // If no future weeks considered, value is strictly 0
      if (futureWeeksConsidered === 0) {
        score = 0.00;
      }

      calculatedValues.push({
        season,
        week,
        team_id: team.id,
        future_value_score: score,
        future_value_rank: 0, // Computed below
        future_weeks_considered: futureWeeksConsidered,
        calculation_version: calculationVersion
      });
    }

    // Sort by base score and assign rank
    calculatedValues.sort((a, b) => b.future_value_score - a.future_value_score);
    calculatedValues.forEach((v, index) => {
      v.future_value_rank = index + 1;
    });

    // Save to Postgres / Mock DB
    await futureTeamValueRepo.deleteBySeasonAndWeek(season, week);
    const savedValues = await futureTeamValueRepo.saveMany(calculatedValues);

    // Write to Feature Store snapshots table
    const snapshots: FeatureStoreSnapshot[] = savedValues.map(v => ({
      season: Number(v.season),
      week: v.week,
      sport: "NFL",
      team_id: v.team_id,
      feature_id: "future_team_value",
      feature_value: v.future_value_score,
      source: "future_team_value_engine"
    }));
    await featureSnapshotRepo.saveMany(snapshots);

    return savedValues;
  }

  /**
   * Retrieves the baseline Future Team Values calculated for the latest calculation run.
   */
  async getLatestBaseline(): Promise<FutureTeamValue[]> {
    return futureTeamValueRepo.getLatest();
  }

  /**
   * Retrieves entire calculation history.
   */
  async getHistory(): Promise<FutureTeamValue[]> {
    return futureTeamValueRepo.getAll();
  }

  /**
   * Retrieves list of teams ranked with explainable details and customized by Strategy Type weights.
   */
  async getRankingsWithExplainability(
    season: string, 
    week: number, 
    strategyType?: StrategyType
  ): Promise<any[]> {
    let baseValues = await futureTeamValueRepo.getBySeasonAndWeek(season, week);
    
    // If we have absolutely no values calculated, let's run an on-demand calculation to avoid empty states
    if (baseValues.length === 0) {
      await this.calculate(season, week);
      baseValues = await futureTeamValueRepo.getBySeasonAndWeek(season, week);
    }

    const type = strategyType || StrategyType.CHAMPIONSHIP_EV;
    const weight = STRATEGY_FUTURE_VALUE_WEIGHTS[type] ?? 1.0;

    const adjusted = baseValues.map(v => {
      const adjustedScore = Number((v.future_value_score * weight).toFixed(2));
      return {
        ...v,
        original_score: v.future_value_score,
        future_value_score: adjustedScore,
        explanation: this.generateExplanation(v, type, adjustedScore)
      };
    });

    // Re-sort and re-rank based on the adjusted strategy weights
    adjusted.sort((a, b) => b.future_value_score - a.future_value_score);
    adjusted.forEach((v, index) => {
      v.future_value_rank = index + 1;
    });

    return adjusted;
  }

  private generateExplanation(val: FutureTeamValue, strategyType: StrategyType, adjustedScore: number): string {
    const score = val.future_value_score; // this is original score
    const teamName = val.team_id.toUpperCase();
    
    let reason = "";
    if (val.future_weeks_considered === 0) {
      reason = `${teamName} has no remaining future games in the season schedule. Preservation value is zero.`;
    } else if (score >= 80) {
      reason = `${teamName} is an elite survivor asset with ${val.future_weeks_considered} future games. Saving them preserves a high-probability win option.`;
    } else if (score >= 60) {
      reason = `${teamName} offers strong future utility with multiple comfortable match-ups scheduled in the second half of the season.`;
    } else if (score >= 45) {
      reason = `${teamName} has moderate preservation utility. They have solid matches but few premium runaway-favorite options left.`;
    } else {
      reason = `${teamName} has low future utility. It is safe to use this team soon as they offer sparse long-term survival advantages.`;
    }

    // Append strategy-specific weight details
    switch (strategyType) {
      case StrategyType.CHAMPIONSHIP_EV:
        reason += ` Evaluated under CHAMPIONSHIP_EV (100% full preservation weight).`;
        break;
      case StrategyType.PORTFOLIO_EV:
        reason += ` Adjusted under PORTFOLIO_EV (70% moderate hedging weight).`;
        break;
      case StrategyType.MARKETPLACE_SURVIVAL:
        reason += ` Adjusted under MARKETPLACE_SURVIVAL (40% discount to prioritize immediate week survival).`;
        break;
      case StrategyType.GROUP_SURVIVAL:
        reason += ` Adjusted under GROUP_SURVIVAL (30% discount to align with consensus targets).`;
        break;
    }

    return reason;
  }
}
