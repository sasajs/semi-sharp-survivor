export class LeverageService {
  /**
   * Calculates leverage scores and multipliers based on win probability and pick popularity.
   * High popularity lowers leverage. Low popularity with strong win probability improves leverage.
   */
  static calculateLeverage(
    winProbability: number,
    pickPopularity?: number
  ): {
    leverage_score: number;
    leverage_multiplier: number;
    is_popularity_missing: boolean;
  } {
    const is_popularity_missing = pickPopularity === undefined || pickPopularity === null || pickPopularity < 0;
    const popularity = is_popularity_missing ? 0.05 : pickPopularity; // default to 5% if missing

    // Raw leverage score represents win chance relative to how heavily selected they are
    // High leverage means they are safe but not picked by many
    const rawLeverage = winProbability * (1.0 - popularity) * 10;
    const leverage_score = parseFloat(Math.min(10.0, Math.max(0.1, rawLeverage)).toFixed(2));

    // Calculate leverage multiplier
    let leverage_multiplier = 1.0;
    if (popularity > 0.25) {
      // Highly chalky pick: penalize leverage
      leverage_multiplier = 1.0 - (popularity - 0.25) * 0.8;
    } else if (popularity < 0.10 && winProbability >= 0.65) {
      // High value sleeper pick: boost leverage
      leverage_multiplier = 1.0 + (0.10 - popularity) * 2.0 * (winProbability - 0.5);
    } else {
      // Normal range
      leverage_multiplier = 1.0 + (0.15 - popularity) * 0.4;
    }

    // Bound the multiplier to safe thresholds [0.6, 1.4]
    leverage_multiplier = parseFloat(Math.min(1.4, Math.max(0.6, leverage_multiplier)).toFixed(3));

    return {
      leverage_score,
      leverage_multiplier,
      is_popularity_missing
    };
  }
}
