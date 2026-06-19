import { ReplayEvaluation, ReplayWeekResult } from "../models";
import { TEAM_STRENGTHS } from "./ReplayExecutionService";

export class ReplayEvaluationService {
  /**
   * Generates custom intelligence evaluation metrics based on season survival results
   */
  static evaluateReplayPerformance(
    weeklyResults: ReplayWeekResult[],
    eliminated: boolean
  ): ReplayEvaluation {
    const totalWeeks = weeklyResults.length;
    if (totalWeeks === 0) {
      return {
        survivalRate: 0,
        inventoryEfficiencyScore: 0,
        recommendationScore: 0,
        confidenceScore: 0
      };
    }

    const survivedWeeks = weeklyResults.filter(w => w.outcome === "SURVIVED").length;
    const survivalRate = Math.round((survivedWeeks / totalWeeks) * 100);

    // 1. Inventory Efficiency Score:
    // If we survived using weaker teams, efficiency is higher.
    // Preserving powerhouse teams (strength > 90) leads to better efficiency ratings.
    let totalStrengthOfUsedTeams = 0;
    const usedTeams = weeklyResults.map(w => w.selectedPick);
    
    for (const team of usedTeams) {
      totalStrengthOfUsedTeams += TEAM_STRENGTHS[team] || 75;
    }

    const avgStrength = totalWeeks > 0 ? totalStrengthOfUsedTeams / totalWeeks : 75;
    
    // Low average strength picked + high survival rate = high inventory efficiency!
    // Base efficiency goes from 40 to 100.
    let rawEfficiency = 100 - (avgStrength - 65) * 1.5;
    if (eliminated) {
      rawEfficiency = rawEfficiency * 0.8; // Penalty for early elimination
    }
    const inventoryEfficiencyScore = Math.max(15, Math.min(100, Math.round(rawEfficiency)));

    // 2. Recommendation Score:
    // How robust was the chosen path? 
    // Higher points differentiation in survived weeks translates to solid planning.
    let totalPointsMargin = 0;
    for (const w of weeklyResults) {
      if (w.outcome === "SURVIVED") {
        totalPointsMargin += w.pointsScored;
      }
    }
    const avgMargin = survivedWeeks > 0 ? totalPointsMargin / survivedWeeks : 0;
    let recommendationScore = 50 + avgMargin * 3;
    if (eliminated) {
      recommendationScore -= 15;
    }
    recommendationScore = Math.max(20, Math.min(100, Math.round(recommendationScore)));

    // 3. Model Confidence Score:
    // Based on survival outcome percentage, capped or offset.
    let confidenceScore = survivalRate;
    if (survivalRate === 100) {
      confidenceScore = 95; // realistic max statistical confidence
    } else {
      confidenceScore = Math.max(10, confidenceScore - 10);
    }

    return {
      survivalRate,
      inventoryEfficiencyScore,
      recommendationScore,
      confidenceScore
    };
  }
}
