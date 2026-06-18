import { 
  WeeklyReportPickSummary, 
  WeeklyReportRiskSummary, 
  WeeklyReportInventorySummary, 
  WeeklyReportSimulationSummary 
} from "../models";

export class ReportNarrativeService {
  static generatePickRationale(pick: Partial<WeeklyReportPickSummary>): string {
    const probPct = ((pick.win_probability || 0.5) * 100).toFixed(0);
    const popPct = ((pick.pick_popularity || 0) * 100).toFixed(0);
    return `We recommend ${pick.team_name} in this leg. They boast an impressive match win probability of ${probPct}%, paired with public backing of ${popPct}%. With a future value penalty score of only ${pick.future_value_score}, selecting them preserves key premium options for deep contest splits later in the season.`;
  }

  static generateRiskNarrative(risk: WeeklyReportRiskSummary): string {
    const lines = [
      `Weekly risk evaluation yields an upset risk profile index of ${(risk.upset_probability * 100).toFixed(0)}%.`,
      `Rest disadvantages are calculated at ${risk.rest_risk}/100, while injury constraints score ${risk.injury_risk}/100.`,
      `Divisional alignment risk is currently ${risk.divisional_risk}/100.`
    ];
    if (risk.upset_probability > 0.35) {
      lines.push(`WARNING: High upset probability detected. Ensure backup portfolios are properly diversified to mitigate catastrophic joint exposure.`);
    } else {
      lines.push(`Upset parameters are within healthy margins, indicating a strong week to pick top leverage teams.`);
    }
    return lines.join(" ");
  }

  static generateInventoryNarrative(inv: WeeklyReportInventorySummary): string {
    const lines = [
      `Your portfolio currently has ${inv.available_teams.length} teams available for selection. We have used ${inv.used_teams.length} teams so far.`,
      `The inventory engine confirms ${inv.remaining_elite_teams.length} tier-1 elite teams remain preserved.`
    ];
    if (inv.future_value_warning) {
      lines.push(`CRITICAL INVENTORY: ${inv.future_value_warning}`);
    } else {
      lines.push(`Preservation health is highly stable; no holiday shortages or premature depletion bottlenecks are predicted on immediate paths.`);
    }
    return lines.join(" ");
  }

  static generateSimulationNarrative(sim: WeeklyReportSimulationSummary): string {
    const survivalPct = (sim.entry_survival_probability * 100).toFixed(1);
    const portPct = (sim.portfolio_survival_probability * 100).toFixed(1);
    const lines = [
      `Multi-path Monte Carlo simulations over 10,000 iterations estimate active entry survival probability at ${survivalPct}% and joint portfolio survival probability at ${portPct}%.`
    ];
    if (sim.concentrated_exposure_warnings.length > 0) {
      lines.push(`WARNING: Joint portfolio checks identified duplicated exposure: ${sim.concentrated_exposure_warnings.join(", ")}.`);
    } else {
      lines.push(`Portfolio diversification check shows outstanding dispersion with low correlation risk.`);
    }
    if (sim.chalk_upset_scenario) {
      lines.push(`A chalk upset targeting ${sim.chalk_upset_scenario.chalk_team_name} would eliminate an estimated ${sim.chalk_upset_scenario.field_elimination_estimate.toFixed(0)}% of the remaining field.`);
    }
    return lines.join(" ");
  }

  static generateExecutiveSummaryNarrative(pickName: string, confidence: string, stratRec: string): string {
    return `EXECUTIVE DECISION STUDY: This week, the recommended premium route pivots on ${pickName} supporting a high ${confidence} confidence tier. Simulation pathways suggest adopting a ${stratRec} approach to leverage public chalk risks or maximize portfolio floor survival as defined in optimal game theory policies.`;
  }
}
