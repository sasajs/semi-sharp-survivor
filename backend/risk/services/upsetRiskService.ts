import { UpsetFactor, TeamRiskAssessment } from "../models";

export class UpsetRiskService {
  /**
   * Evaluates the individual team risk categories
   */
  static calculateTeamRisk(inputs: {
    rest_days?: number;
    rest_disparity?: number;
    short_week_flag?: boolean;
    sic_score?: number;
    injury_risk_score?: number;
    quarterback_status?: string;
    travel_disadvantage?: number;
    road_game_flag?: boolean;
    cross_country_travel?: boolean;
    weather_risk?: number;
    severe_weather_flag?: boolean;
    divisional_game_flag?: boolean;
    line_movement_score?: number;
    market_disagreement_score?: number;
    team_id: string;
  }): TeamRiskAssessment {
    // 1. Rest / Schedule Risk
    let rest_risk = 0;
    const restDays = inputs.rest_days ?? 7;
    if (restDays < 6) {
      rest_risk += (6 - restDays) * 15;
    }
    if (inputs.rest_disparity && inputs.rest_disparity < 0) {
      rest_risk += Math.abs(inputs.rest_disparity) * 15;
    }
    if (inputs.short_week_flag) {
      rest_risk += 25;
    }
    rest_risk = Math.min(100.0, Math.max(0.0, rest_risk));

    // 2. Injury Risk
    let injury_risk = inputs.injury_risk_score ?? (100 - (inputs.sic_score ?? 90));
    if (inputs.quarterback_status) {
      const qb = inputs.quarterback_status.toLowerCase();
      if (qb.includes("injured") || qb.includes("out") || qb.includes("doubtful")) {
        injury_risk += 45;
      } else if (qb.includes("questionable") || qb.includes("limited")) {
        injury_risk += 20;
      }
    }
    injury_risk = Math.min(100.0, Math.max(0.0, injury_risk));

    // 3. Travel Risk
    let travel_risk = 0;
    if (inputs.road_game_flag) {
      travel_risk += 20;
    }
    if (inputs.travel_disadvantage && inputs.travel_disadvantage > 0) {
      travel_risk += Math.min(50, inputs.travel_disadvantage / 10);
    }
    if (inputs.cross_country_travel || (inputs.travel_disadvantage && inputs.travel_disadvantage >= 1500)) {
      travel_risk += 20;
    }
    travel_risk = Math.min(100.0, Math.max(0.0, travel_risk));

    // 4. Weather Risk
    let weather_risk = (inputs.weather_risk ?? 0) * 10;
    if (inputs.severe_weather_flag || (inputs.weather_risk && inputs.weather_risk >= 7)) {
      weather_risk += 25;
    }
    weather_risk = Math.min(100.0, Math.max(0.0, weather_risk));

    // 5. Divisional Risk
    const divisional_risk = inputs.divisional_game_flag ? 35.0 : 0.0;

    // 6. Market Risk
    const lineMove = inputs.line_movement_score ?? 10.0;
    const marketDisagree = inputs.market_disagreement_score ?? 5.0;
    let market_risk = lineMove + marketDisagree;
    market_risk = Math.min(100.0, Math.max(0.0, market_risk));

    // Combined Risk Score (Weighted Average)
    const combined_risk_score = parseFloat((
      (rest_risk * 0.15) +
      (injury_risk * 0.25) +
      (travel_risk * 0.15) +
      (weather_risk * 0.10) +
      (divisional_risk * 0.15) +
      (market_risk * 0.20)
    ).toFixed(1));

    return {
      team_id: inputs.team_id,
      rest_risk: parseFloat(rest_risk.toFixed(1)),
      injury_risk: parseFloat(injury_risk.toFixed(1)),
      travel_risk: parseFloat(travel_risk.toFixed(1)),
      weather_risk: parseFloat(weather_risk.toFixed(1)),
      divisional_risk: parseFloat(divisional_risk.toFixed(1)),
      market_risk: parseFloat(market_risk.toFixed(1)),
      combined_risk_score
    };
  }

  /**
   * Calculates overall upset probability under the given team risk levels
   */
  static calculateUpsetProbability(
    favoriteWinProbability: number,
    favoriteRisk: number,
    underdogRisk: number
  ): number {
    const baseUpset = 1.0 - favoriteWinProbability;
    
    // Add custom multiplier based on favorite's combined risk score vs underdog's combined risk score
    const riskAdjustment = (favoriteRisk * 0.0025) - (underdogRisk * 0.001);
    const prob = baseUpset + riskAdjustment;

    // Keep bounded strictly between 0.02 and 0.98
    return Math.min(0.98, Math.max(0.02, parseFloat(prob.toFixed(3))));
  }

  /**
   * Compiles the collection of structural Upset Factors detailing risk category impacts
   */
  static compileUpsetFactors(
    favAssessment: TeamRiskAssessment,
    divisional: boolean,
    weather: number
  ): UpsetFactor[] {
    const factors: UpsetFactor[] = [];

    if (favAssessment.injury_risk > 35) {
      factors.push({
        category: "Injury Risk",
        impact_score: favAssessment.injury_risk,
        description: "Elevated favorite player injuries or key quarterback status degradation."
      });
    }

    if (favAssessment.travel_risk > 30) {
      factors.push({
        category: "Travel Risk",
        impact_score: favAssessment.travel_risk,
        description: "Disadvantageous road game schedules or long cross-country transit fatigue."
      });
    }

    if (favAssessment.weather_risk > 30 || weather >= 5) {
      factors.push({
        category: "Weather Risk",
        impact_score: favAssessment.weather_risk,
        description: "Inclement forecasts or cold and windy open-stadium play conditions."
      });
    }

    if (divisional) {
      factors.push({
        category: "Divisional Risk",
        impact_score: 35.0,
        description: "Divisional matchups increase upset risks due to scheduling familiarity."
      });
    }

    if (favAssessment.rest_risk > 25) {
      factors.push({
        category: "Schedule Risk",
        impact_score: favAssessment.rest_risk,
        description: "Short week or severe rest disparity relative to opponent."
      });
    }

    if (favAssessment.market_risk > 40) {
      factors.push({
        category: "Market Risk",
        impact_score: favAssessment.market_risk,
        description: "Unstable point spread movements or professional market consensus disagreements."
      });
    }

    // Default factor if list empty
    if (factors.length === 0) {
      factors.push({
        category: "Schedule Risk",
        impact_score: 10.0,
        description: "Normal background seasonal schedule variability."
      });
    }

    return factors;
  }
}
