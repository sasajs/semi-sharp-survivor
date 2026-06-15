import { ContestEquityScore } from "../models";
import { ConfidenceTier } from "../../../src/types";

export class ContestEquityService {
  /**
   * Calculates the Future Value Multiplier based on the team's future value score.
   * High future-value teams receive a penalty when burned early in the season.
   */
  static calculateFutureValueMultiplier(futureValueScore: number): number {
    const score = futureValueScore ?? 0;
    let multiplier = 1.0;

    if (score >= 70) {
      // Highly elite team to preserve: apply penalty
      multiplier = 1.0 - (score / 100) * 0.35;
    } else if (score < 30) {
      // Low value team: prefer to burn now, reward with multiplier bonus
      multiplier = 1.0 + ((30 - score) / 100) * 0.3;
    } else {
      // Mid-tier teams
      multiplier = 1.0 - ((score - 30) / 100) * 0.1;
    }

    return parseFloat(Math.min(1.25, Math.max(0.5, multiplier)).toFixed(3));
  }

  /**
   * Calculates the Holiday Protection Multiplier based on reservation status.
   * Severe penalty if a reserved holiday team is picked during regular legs.
   */
  static calculateHolidayProtectionMultiplier(
    isThanksgivingReserved: boolean,
    isChristmasReserved: boolean
  ): number {
    let multiplier = 1.0;

    if (isThanksgivingReserved) {
      multiplier *= 0.55;
    }
    if (isChristmasReserved) {
      multiplier *= 0.55;
    }

    return parseFloat(Math.min(1.0, Math.max(0.3, multiplier)).toFixed(3));
  }

  /**
   * Calculates the Risk Adjustment Multiplier based on risk score, upset risk, and confidence tier.
   */
  static calculateRiskAdjustmentMultiplier(
    riskScore: number,
    upsetProbability: number,
    confidenceTier: ConfidenceTier
  ): number {
    let multiplier = 1.0 - upsetProbability * 0.35;

    // Adjust based on tier
    switch (confidenceTier) {
      case ConfidenceTier.VERY_HIGH:
        multiplier *= 1.15;
        break;
      case ConfidenceTier.HIGH:
        multiplier *= 1.05;
        break;
      case ConfidenceTier.MEDIUM:
        multiplier *= 0.95;
        break;
      case ConfidenceTier.LOW:
        multiplier *= 0.8;
        break;
      case ConfidenceTier.VERY_LOW:
        multiplier *= 0.6;
        break;
      default:
        break;
    }

    // Additional high risk score penalty
    if (riskScore > 65) {
      multiplier *= 0.85;
    }

    return parseFloat(Math.min(1.3, Math.max(0.3, multiplier)).toFixed(3));
  }

  /**
   * Compiles the full ContestEquityScore DTO
   */
  static evaluateEquityScore(inputs: {
    win_probability: number;
    leverage_multiplier: number;
    future_value_score: number;
    is_thanksgiving_reserved: boolean;
    is_christmas_reserved: boolean;
    risk_score: number;
    upset_probability: number;
    confidence_tier: ConfidenceTier;
  }): ContestEquityScore {
    const win_probability = inputs.win_probability;
    const leverage_multiplier = inputs.leverage_multiplier;
    const future_value_multiplier = this.calculateFutureValueMultiplier(inputs.future_value_score);
    const holiday_protection_multiplier = this.calculateHolidayProtectionMultiplier(
      inputs.is_thanksgiving_reserved,
      inputs.is_christmas_reserved
    );
    const risk_adjustment_multiplier = this.calculateRiskAdjustmentMultiplier(
      inputs.risk_score,
      inputs.upset_probability,
      inputs.confidence_tier
    );

    // Dynamic Contest Equity formula
    const raw_score = win_probability * 
      leverage_multiplier * 
      future_value_multiplier * 
      holiday_protection_multiplier * 
      risk_adjustment_multiplier * 
      100;

    const final_score = parseFloat(Math.min(100.0, Math.max(0.0, raw_score)).toFixed(1));

    return {
      win_probability,
      leverage_multiplier,
      future_value_multiplier,
      holiday_protection_multiplier,
      risk_adjustment_multiplier,
      final_score
    };
  }
}
