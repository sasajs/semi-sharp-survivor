import { RecommendationRationale } from "../models";
import { ConfidenceTier } from "../../../src/types";

export class RecommendationExplanationService {
  /**
   * Generates highly descriptive, tailored, plain-English rationale for a pick candidate.
   */
  static generateRationale(inputs: {
    teamName: string;
    opponentName: string;
    winProbability: number;
    pickPopularity: number;
    leverageScore: number;
    futureValueScore: number;
    riskScore: number;
    upsetProbability: number;
    confidenceTier: ConfidenceTier;
    isThanksgivingReserved: boolean;
    isChristmasReserved: boolean;
  }): RecommendationRationale {
    const {
      teamName,
      opponentName,
      winProbability,
      pickPopularity,
      leverageScore,
      futureValueScore,
      riskScore,
      upsetProbability,
      confidenceTier,
      isThanksgivingReserved,
      isChristmasReserved
    } = inputs;

    // 1. Survival Floor Case
    const winPct = (winProbability * 100).toFixed(0);
    let survival_case = `${teamName} is favored with a ${winPct}% expected win probability against ${opponentName}.`;
    if (winProbability >= 0.8) {
      survival_case += ` This represents an exceptionally high floor pick for maximum safety in this leg.`;
    } else if (winProbability >= 0.65) {
      survival_case += ` This is a solid, above-average survival option with positive baseline expectations.`;
    } else {
      survival_case += ` This is a higher-risk choice with tighter margins of safety but viable pathing.`;
    }

    // 2. Leverage Upside Case
    const popPct = (pickPopularity * 100).toFixed(0);
    let leverage_case = `Selected by ${popPct}% of the field (Leverage: ${leverageScore.toFixed(1)}).`;
    if (pickPopularity > 0.3) {
      leverage_case += ` As a heavily public chalk pick, picking them offers limited leverage in the contest pool.`;
    } else if (pickPopularity < 0.1) {
      leverage_case += ` At low public ownership, picking them provides high leverage to move up when the crowd falls.`;
    } else {
      leverage_case += ` Moderate market concentration makes this a comfortable standard choice.`;
    }

    // 3. Future-Value Tradeoff
    let future_value_tradeoff = `Future Value of ${futureValueScore.toFixed(0)}/100 remaining.`;
    if (futureValueScore >= 75) {
      future_value_tradeoff += ` Burning ${teamName} now exhausts a valuable elite asset that could secure tough late-season legs.`;
    } else if (futureValueScore <= 35) {
      future_value_tradeoff += ` Excellent path optimization. Using ${teamName} now burns a low-value asset, preserving powerhouse teams.`;
    } else {
      future_value_tradeoff += ` Standard usage of a mid-tier asset. Maintains solid portfolio flexibility.`;
    }

    // 4. Upset Risk Warning
    const upsetPct = (upsetProbability * 100).toFixed(0);
    let upset_risk_warning = `Overall risk is rated ${riskScore.toFixed(0)}/100 with a ${upsetPct}% upset probability.`;
    if (riskScore >= 60) {
      upset_risk_warning += ` WARNING: Key indicators suggest high volatility (unstable lines, short rest). Watch out for an upset.`;
    } else if (riskScore < 30) {
      upset_risk_warning += ` Extremely stable parameters. No notable injury, rest, weather, or travel disadvantages detected.`;
    } else {
      upset_risk_warning += ` Moderate risk profile. Standard scheduling and travel factors apply.`;
    }

    // 5. Holiday Inventory Impact
    let holiday_inventory_impact = `No holiday conflicts detected for ${teamName}.`;
    if (isThanksgivingReserved) {
      holiday_inventory_impact = `CRITICAL: ${teamName} is actively designated for Thanksgiving protection. Selecting them now breaks holiday safety schemas.`;
    } else if (isChristmasReserved) {
      holiday_inventory_impact = `CRITICAL: ${teamName} is actively designated for Christmas protection. Selecting them now breaks holiday safety schemas.`;
    }

    return {
      survival_case,
      leverage_case,
      future_value_tradeoff,
      upset_risk_warning,
      holiday_inventory_impact,
      confidence_tier: confidenceTier
    };
  }
}
