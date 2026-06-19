import { ReplayExecution, ReplaySummary } from "../models";

export class ReplayReportService {
  /**
   * Synthesize a ReplaySummary card from execution data
   */
  static generateSummary(execution: ReplayExecution): ReplaySummary {
    const { results, evaluation, configuration, generatedAt } = execution;
    return {
      season: configuration.season,
      weeksPlayed: results.weeksPlayed,
      weeksSurvived: results.weeksSurvived,
      eliminated: results.eliminated,
      survivalRate: evaluation.survivalRate,
      inventoryEfficiencyScore: evaluation.inventoryEfficiencyScore,
      recommendationScore: evaluation.recommendationScore,
      confidenceScore: evaluation.confidenceScore,
      generatedAt
    };
  }

  /**
   * Generates a fully printable high-fidelity markdown report detailing replay performance
   */
  static generateMarkdownReport(execution: ReplayExecution): string {
    const { configuration, results, evaluation } = execution;
    const finalOutcome = results.eliminated 
      ? `❌ ELIMINATED in Week ${results.eliminatedWeek}` 
      : "🏆 CHAMPION (Survived All Played Weeks)";

    let md = `## 📊 Historical Replay Report: Season ${configuration.season}\n\n`;
    md += `### ⚙️ Replay Configuration\n`;
    md += `- **Strategy Preference**: \`${configuration.strategyPreference.toUpperCase()}\`\n`;
    md += `- **Simulated Week Span**: Week ${configuration.startWeek} to Week ${configuration.endWeek}\n`;
    md += `- **Execution Outcome**: **${finalOutcome}**\n\n`;

    md += `### 📌 Performance Scorecard\n`;
    md += `| Diagnostic Metric | Score / Valuation | Rating |\n`;
    md += `| :--- | :---: | :--- |\n`;
    md += `| **Survival Rate** | ${evaluation.survivalRate}% | ${evaluation.survivalRate >= 90 ? "Excellent Elite" : evaluation.survivalRate >= 70 ? "Adequate" : "Flagged/Vulnerable"} |\n`;
    md += `| **Inventory Efficiency** | ${evaluation.inventoryEfficiencyScore}% | ${evaluation.inventoryEfficiencyScore >= 80 ? "Optimal Conservative" : "Heavy Asset Drain"} |\n`;
    md += `| **Recommendation Impact** | ${evaluation.recommendationScore}% | ${evaluation.recommendationScore >= 80 ? "Highly Decisive" : "Sub-Optimal"} |\n`;
    md += `| **Statistical Confidence** | ${evaluation.confidenceScore}% | ${evaluation.confidenceScore >= 80 ? "Certified" : "Low Significance"} |\n\n`;

    md += `### 📆 Weekly Selection Progression\n`;
    md += `| week | Preserved Pick | Result Margin | Status | inventory Depleted |\n`;
    md += `| :---: | :--- | :---: | :---: | :--- |\n`;

    for (const week of results.weeklyResults) {
      const outcomeIcon = week.outcome === "SURVIVED" ? "✅ SURVIVED" : week.outcome === "ELIMINATED" ? "❌ ELIMINATED" : "⏳ PENDING";
      const marginStr = week.outcome === "SURVIVED" ? `+${week.pointsScored} pts` : "0 pts";
      md += `| Wk ${week.weekNumber} | **${week.selectedPick}** | ${marginStr} | ${outcomeIcon} | ${week.inventorySpent.join(", ") || "(None)"} |\n`;
    }

    md += `\n\n`;
    md += `*Report Generated securely by local Semi-Sharp Replay Reporting Authority. Certified for 2026 backtesting.*`;
    return md;
  }
}
