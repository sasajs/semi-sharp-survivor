import { 
  WeeklyReportSection, 
  WeeklyReportPickSummary, 
  WeeklyReportRiskSummary, 
  WeeklyReportInventorySummary, 
  WeeklyReportSimulationSummary, 
  WeeklyReportAuditMetadata,
  ChalkUpsetScenario,
  StrategyComparison
} from "../models";

export class ReportSectionBuilderService {
  static buildExecutiveSummary(
    topPickName: string,
    alternates: string[],
    confidence: string,
    warnings: string[],
    inventoryWarning: string | null,
    stratRec: string,
    narrative: string
  ): WeeklyReportSection {
    const md = `### Executive Pick Recommendation: **${topPickName}**
- **Confidence Tier**: ${confidence}
- **Strategy Alignment**: ${stratRec}
- **Alt Recommendations**: ${alternates.length > 0 ? alternates.join(", ") : "None available"}

#### Risk Warnings:
${warnings.map(w => `- ⚠️ ${w}`).join("\n")}
${inventoryWarning ? `- 📁 **Inventory Constraint**: ${inventoryWarning}` : ""}

#### Analytical Overview:
${narrative}`;

    return {
      id: "sec-exec-summary",
      title: "1. Executive Summary & Recommendations",
      type: "executive_summary",
      content_markdown: md
    };
  }

  static buildRecommendedPicksSection(picks: WeeklyReportPickSummary[]): WeeklyReportSection {
    const header = `### Rated Pick Alternatives Matrix
Below is the optimized valuation table for available candidates.

| Team | Opponent | Win % | Popularity | Equity Score | Future Value | Risk Score | Rationale |
|---|---|---|---|---|---|---|---|
`;
    const rows = picks.map(p => 
      `| **${p.team_name}** | ${p.opponent_name} | ${(p.win_probability * 100).toFixed(0)}% | ${(p.pick_popularity * 100).toFixed(0)}% | ${p.contest_equity_score.toFixed(1)} | ${p.future_value_score} | ${p.risk_score} | ${p.rationale} |`
    ).join("\n");

    return {
      id: "sec-rec-picks",
      title: "2. Recommended Contest Selections",
      type: "recommended_picks",
      content_markdown: header + rows
    };
  }

  static buildRiskSection(risk: WeeklyReportRiskSummary, narrative: string): WeeklyReportSection {
    const md = `### Key Risk Exposure Matrices
- **Overall Confidence**: ${risk.confidence_tier}
- **Implied Leg Upset Probability**: ${(risk.upset_probability * 100).toFixed(0)}%

| Risk Vector Component | Severity Index (0-100) |
|---|---|
| Schedule/Rest Factor | ${risk.rest_risk} |
| Travel Penalty | ${risk.travel_risk} |
| Team Key Injuries (SIC) | ${risk.injury_risk} |
| Adverse Weather Predictor | ${risk.weather_risk} |
| Divisional Rivalry Modifier | ${risk.divisional_risk} |
| Public Market Bias Check | ${risk.market_risk} |

#### Strategic Narrative:
${narrative}`;

    return {
      id: "sec-risk-summary",
      title: "3. Strategic Risk Profiling",
      type: "risk_summary",
      content_markdown: md
    };
  }

  static buildInventorySection(inv: WeeklyReportInventorySummary, narrative: string): WeeklyReportSection {
    const md = `### Portfolio Inventory Preservation Report
- **Used Picks Count**: ${inv.used_teams.length} teams
- **Available Matchups**: ${inv.available_teams.length} teams
- **Preserved Elite Franchises**: ${inv.remaining_elite_teams.join(", ") || "None remaining"}

#### Special Multi-Split Holiday Reserves
- **Thanksgiving Day Inventory**: ${inv.thanksgiving_inventory.join(", ") || "None"}
- **Christmas Day Inventory**: ${inv.christmas_inventory.join(", ") || "None"}

#### Operational Insight:
${narrative}`;

    return {
      id: "sec-inventory-summary",
      title: "4. Future Inventory Allocation Status",
      type: "inventory_summary",
      content_markdown: md
    };
  }

  static buildSimulationSection(sim: WeeklyReportSimulationSummary, narrative: string): WeeklyReportSection {
    const md = `### Monte Carlo Path Projection Analysis
- **Entry Safety Level**: ${(sim.entry_survival_probability * 100).toFixed(1)}%
- **Combined Portfolio Survival Score**: ${(sim.portfolio_survival_probability * 100).toFixed(1)}%

#### Exposure Constraints:
${narrative}`;

    return {
      id: "sec-simulation-summary",
      title: "5. Joint Portfolio Path Simulations",
      type: "simulation_summary",
      content_markdown: md
    };
  }

  static buildChalkUpsetSection(chalk: ChalkUpsetScenario): WeeklyReportSection {
    const md = `### Chalk Team Fragility Probe: **${chalk.chalk_team_name}**
- **Public Picking Percentage**: ${chalk.field_elimination_estimate.toFixed(0)}%
- **Simulated Impact on Your Entries**: If ${chalk.chalk_team_name} loses, ${chalk.user_entry_impact_count} of your active entries would fail.
- **Estimated Public Field Elimination**: **${chalk.field_elimination_estimate.toFixed(0)}%** of remaining rivals.
- **Contest Leverage Multiple**: **+${chalk.leverage_benefit_score.toFixed(0)}%** EQ shift.

#### Threat Notification:
> ${chalk.risk_warning}`;

    return {
      id: "sec-chalk-upset",
      title: "6. Custom Chalk Upset Scenario Analysis",
      type: "simulation_summary",
      content_markdown: md
    };
  }

  static buildStrategyComparisonSection(strategies: StrategyComparison): WeeklyReportSection {
    const md = `### Contest Pathway Strategy Benchmark

| Strategy Profile | Projected Survival % | Preserved Options Index | Combined Risk Index | Est. Contest Equity |
|---|---|---|---|---|
| **Safe (Max Probability)** | ${(strategies.safe_strategy.survival_probability * 100).toFixed(0)}% | ${strategies.safe_strategy.inventory_preservation_score}/100 | ${strategies.safe_strategy.risk_exposure_score}/100 | $${strategies.safe_strategy.projected_contest_equity.toFixed(2)} |
| **Balanced (Mix)** | ${(strategies.balanced_strategy.survival_probability * 100).toFixed(0)}% | ${strategies.balanced_strategy.inventory_preservation_score}/100 | ${strategies.balanced_strategy.risk_exposure_score}/100 | $${strategies.balanced_strategy.projected_contest_equity.toFixed(2)} |
| **Contrarian (Low Pop)** | ${(strategies.contrarian_strategy.survival_probability * 100).toFixed(0)}% | ${strategies.contrarian_strategy.inventory_preservation_score}/100 | ${strategies.contrarian_strategy.risk_exposure_score}/100 | $${strategies.contrarian_strategy.projected_contest_equity.toFixed(2)} |
`;

    return {
      id: "sec-strat-comparison",
      title: "7. Strategy Profile Benchmarking Comparison",
      type: "simulation_summary",
      content_markdown: md
    };
  }

  static buildAuditSection(audit: WeeklyReportAuditMetadata): WeeklyReportSection {
    const md = `### Report Verification & Cryptographic Reproducibility
This report was generated using state-locked snapshots. Tamper-proof validation hashes ensure 100% downstream reproducibility.

| System Parameter | Active Version Snapshot |
|---|---|
| **Data Engine Version** | ${audit.data_version} |
| **Feature Store Level** | ${audit.feature_version} |
| **Inventory State Code** | ${audit.inventory_version} |
| **Risk Metrics Stage** | ${audit.risk_version} |
| **Recommendation Engine Profile** | ${audit.recommendation_version} |
| **Simulation Core Engine** | ${audit.simulation_version} |
| **Policy Guideline Code** | ${audit.policy_version} |
| **Core Model Token** | \`${audit.model_version}\` |
| **Downstream Verification Hash** | \`${audit.report_hash}\` |
| **Timestamp Lock** | ${audit.generated_at} |
`;

    return {
      id: "sec-audit-metadata",
      title: "8. Reproducibility & Section Signatures",
      type: "audit",
      content_markdown: md
    };
  }

  static buildFeatureStoreAuditSection(definitions: any[], snapshotCount: number, season: number, week: number): WeeklyReportSection {
    const md = `### Certified Feature Store Audit (v0.28 Core)
Features are mathematically computed on-demand and logged to our append-only Postgres schema.

- **Verified Snapshots for S${season} W${week}**: **${snapshotCount}** compiled values.
- **Pre-Registered Feature Definitions**:

| Feature ID | Full Name | Category | Scope | Description |
|---|---|---|---|---|
${definitions.map(d => `| \`${d.feature_id}\` | ${d.feature_name} | ${d.feature_category} | ${d.sport} | ${d.description || "-"} |`).join("\n")}
`;

    return {
      id: "sec-feature-store-audit",
      title: "9. Feature Store Compliance & Model Auditing",
      type: "audit",
      content_markdown: md
    };
  }

  static buildFutureTeamValueSection(rankings: any[], season: string, week: number): WeeklyReportSection {
    const md = `### Future Team Value Preservations (v0.31 Engine)
The Future Team Value Engine estimates the strategic value of preserving teams for future weeks rather than burning them today.
- **Season**: ${season} | **Current Week**: Week ${week}
- **Calculated Team Preservations (Top 10)**:

| Team | Value Score | Rank | Explanation / Reason |
|---|---|---|---|
${rankings.slice(0, 10).map(r => `| **${r.team_id.toUpperCase()}** | ${r.future_value_score.toFixed(1)} | #${r.future_value_rank} | ${r.explanation} |`).join("\n")}
`;

    return {
      id: "sec-future-team-value-preservation",
      title: "10. Survivor Future Team Value Analysis",
      type: "inventory_summary",
      content_markdown: md
    };
  }
}
