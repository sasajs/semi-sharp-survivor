import { ConfidenceTier } from "../models";

export class ConfidenceService {
  /**
   * Calculates a confidence score (0.0 to 100.0) based on win probability and team risk score
   */
  static calculateConfidenceScore(winProbability: number, riskScore: number): number {
    const score = (winProbability * 100) - (riskScore * 0.4);
    return Math.min(100.0, Math.max(0.0, parseFloat(score.toFixed(1))));
  }

  /**
   * Selects the appropriate Confidence Tier based on the confidence score
   */
  static determineConfidenceTier(confidenceScore: number): ConfidenceTier {
    if (confidenceScore >= 80.0) {
      return ConfidenceTier.VERY_HIGH;
    } else if (confidenceScore >= 65.0) {
      return ConfidenceTier.HIGH;
    } else if (confidenceScore >= 50.0) {
      return ConfidenceTier.MEDIUM;
    } else if (confidenceScore >= 35.0) {
      return ConfidenceTier.LOW;
    } else {
      return ConfidenceTier.VERY_LOW;
    }
  }
}
