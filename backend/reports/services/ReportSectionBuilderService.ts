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
import { OwnershipProjection, ContestDynamicsSnapshot, SurvivorRecommendation, ContestEV, MarketCalibration, ModelPerformance, RollingValidation, ModelDrift, AdaptiveModelWeight, DecisionPolicy } from "../../../src/types";

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

  static buildSurvivorEquitySection(rankings: any[], season: string, week: number): WeeklyReportSection {
    const top10 = rankings.slice(0, 10);
    const strategyAnalysis = `
### Strategy Impact & Weights Analysis
- **CHAMPIONSHIP_EV**: 30% Survival, 50% Future Team Value, 20% Season Utility (Focuses on preserving high-value future targets).
- **PORTFOLIO_EV**: 40% Survival, 40% Future Team Value, 20% Season Utility (Balanced weighting for joint portfolio optimization).
- **MARKETPLACE_SURVIVAL**: 60% Survival, 20% Future Team Value, 20% Season Utility (Prioritizes immediate safety to progress into mid-season).
- **GROUP_SURVIVAL**: 70% Survival, 15% Future Team Value, 15% Season Utility (Consensus model maximizing raw survival).
`;

    const md = `### Survivor Equity Snapshot (v0.32 Engine Foundation)
Survivor Equity estimates how much contest value you gain if a given pick survives, balancing immediate survival probability against preserving future value.

- **Season**: ${season} | **Current Week**: Week ${week}

- **Top 10 Survivor Equity Candidates (Ranked)**:

| Team | Equity Score | Rank | Survival Prob | Future Value | Strategy Profile | Explanation |
|---|---|---|---|---|---|---|
${top10.map(r => `| **${r.team_id.toUpperCase()}** | ${r.equity_score.toFixed(1)} | #${r.equity_rank} | ${r.survival_probability.toFixed(1)}% | ${r.future_team_value.toFixed(1)} | \`${r.strategy_profile}\` | ${r.explanation} |`).join("\n")}

${strategyAnalysis}
`;

    return {
      id: "sec-survivor-equity-analysis",
      title: "11. Survivor Equity & Contest Value Analysis",
      type: "inventory_summary",
      content_markdown: md
    };
  }

  static buildRecommendationCandidatesSection(candidates: any[], season: string, week: number): WeeklyReportSection {
    const entriesMap = new Map<string, any[]>();
    for (const c of candidates) {
      if (!entriesMap.has(c.entry_id)) {
        entriesMap.set(c.entry_id, []);
      }
      entriesMap.get(c.entry_id)!.push(c);
    }

    let entriesMarkdown = "";
    for (const [entryId, entryCandList] of entriesMap.entries()) {
      const sorted = [...entryCandList].sort((a, b) => {
        if (a.eligibility_status === "eligible" && b.eligibility_status !== "eligible") return -1;
        if (a.eligibility_status !== "eligible" && b.eligibility_status === "eligible") return 1;
        return b.candidate_score - a.candidate_score;
      });

      const top5 = sorted.slice(0, 5);
      
      entriesMarkdown += `
#### Entry: **${entryId}**
*Strategy Profile Impact: \`${top5[0]?.strategy_profile || "N/A"}\`*

| Rank | Team | Candidate Score | Eligibility | Equity Score | Future Value | Survival Prob | Explanation |
|---|---|---|---|---|---|---|---|
${top5.map(c => {
  const rankStr = c.eligibility_status === "eligible" ? `#${c.candidate_rank}` : "N/A";
  const scoreStr = c.eligibility_status === "eligible" ? c.candidate_score.toFixed(1) : "N/A";
  const statusBadge = c.eligibility_status === "eligible" ? "🟢 Eligible" : `🔴 Ineligible (${c.eligibility_reason})`;
  return `| ${rankStr} | **${c.team_id.toUpperCase()}** | ${scoreStr} | ${statusBadge} | ${c.survivor_equity_score.toFixed(1)} | ${c.future_team_value_score.toFixed(1)} | ${c.survival_probability.toFixed(1)}% | ${c.explanation} |`;
}).join("\n")}
`;
    }

    const md = `### Recommendation Candidates (v0.33 Engine)
⚠️ **IMPORTANT NOTICE: Candidates only — not final recommendations.**
These are ranked candidate options generated using eligible team filters and strategic fit scoring. They do NOT represent locked picks or final recommendation decisions.

- **Season**: ${season} | **Current Week**: Week ${week}
- **Scoring Weights Model**: 70% Survivor Equity Score + 20% Survival Probability + 10% Strategy Fit Score.

${entriesMarkdown}
`;

    return {
      id: "sec-recommendation-candidates-analysis",
      title: "12. Recommendation Candidate Auditing",
      type: "inventory_summary",
      content_markdown: md
    };
  }

  static buildOwnershipProjectionSection(projections: OwnershipProjection[], season: string, week: number): WeeklyReportSection {
    const active = projections.filter(p => p.projected_ownership_pct > 0);
    const topChalk = [...active].sort((a, b) => b.projected_ownership_pct - a.projected_ownership_pct).slice(0, 5);
    const topContrarian = [...active].sort((a, b) => a.projected_ownership_pct - b.projected_ownership_pct).slice(0, 5);

    const md = `### Ownership Projection Analysis (v0.34)
This section evaluates projected ownership across the contest crowd to identify chalk concentrations and unique pivot options.

#### 📈 Top Chalk Teams (Crowd Favorites)
These teams are highly popular. Picking them offers high survival security but very low differentiation.

| Rank | Team | Projected Ownership % | Ownership Tier | Projection Source |
|---|---|---|---|---|
${topChalk.map(p => `| #${p.ownership_rank} | **${p.team_id.toUpperCase()}** | ${p.projected_ownership_pct.toFixed(2)}% | \`${p.ownership_tier}\` | ${p.projection_source} |`).join("\n")}

#### 🛡️ Top Contrarian Teams (Differentiators)
These teams have positive survival equity but minimal expected ownership, offering strong pivot potential.

| Rank | Team | Projected Ownership % | Ownership Tier | Projection Source |
|---|---|---|---|---|
${topContrarian.map(p => `| #${p.ownership_rank} | **${p.team_id.toUpperCase()}** | ${p.projected_ownership_pct.toFixed(2)}% | \`${p.ownership_tier}\` | ${p.projection_source} |`).join("\n")}
`;

    return {
      id: "sec-ownership-projections",
      title: "13. Ownership Projection Analysis",
      type: "inventory_summary",
      content_markdown: md
    };
  }

  static buildContestDynamicsSection(snapshots: ContestDynamicsSnapshot[], season: string, week: number): WeeklyReportSection {
    // Top leverage teams (average across entries)
    const teamsMap = new Map<string, { sumLeverage: number; sumAdj: number; count: number; pct: number; chalk: number; uniq: number }>();
    for (const s of snapshots) {
      if (!teamsMap.has(s.team_id)) {
        teamsMap.set(s.team_id, { sumLeverage: 0, sumAdj: 0, count: 0, pct: s.projected_ownership_pct, chalk: s.chalk_score, uniq: s.uniqueness_score });
      }
      const data = teamsMap.get(s.team_id)!;
      data.sumLeverage += s.leverage_score;
      data.sumAdj += s.contest_equity_adjustment;
      data.count++;
    }

    const teamSummaries = Array.from(teamsMap.entries()).map(([teamId, data]) => ({
      teamId,
      avgLeverage: data.sumLeverage / data.count,
      avgAdj: data.sumAdj / data.count,
      pct: data.pct,
      chalk: data.chalk,
      uniq: data.uniq
    })).filter(t => t.pct > 0);

    const topLeverage = [...teamSummaries].sort((a, b) => b.avgLeverage - a.avgLeverage).slice(0, 5);
    const topEquity = [...teamSummaries].sort((a, b) => b.avgAdj - a.avgAdj).slice(0, 5);

    const md = `### Contest Dynamics & Strategic Leverage Analysis (v0.34)
This section evaluates contest-specific leverage, chalk scores, and uniqueness metrics to optimize game-theoretic expected value.

#### ⚖️ Highest Leverage Options
These teams maximize contest equity by minimizing crowd correlation.

| Team | Avg Leverage Score | Projected Ownership % | Uniqueness Score |
|---|---|---|---|
${topLeverage.map(t => `| **${t.teamId.toUpperCase()}** | ${t.avgLeverage.toFixed(1)} | ${t.pct.toFixed(2)}% | ${t.uniq.toFixed(1)} |`).join("\n")}

#### 💎 Highest Contest Equity Teams (By Strategy Mode)
These teams represent the optimal trade-off between survival security and leverage based on entry-level strategic profiles.

| Team | Avg Contest Equity Adjustment | Chalk Score | Uniqueness Score | Avg Leverage Score |
|---|---|---|---|---|
${topEquity.map(t => `| **${t.teamId.toUpperCase()}** | +${t.avgAdj.toFixed(2)} | ${t.chalk.toFixed(1)} | ${t.uniq.toFixed(1)} | ${t.avgLeverage.toFixed(1)} |`).join("\n")}

#### 🎯 Strategy Impact Summary
Expected value adjustments dynamically react to Entry Strategy Profiles:
- **Championship EV**: Highest game-theory emphasis (80% leverage / 20% uniqueness weights, full scale 1.0).
- **Portfolio EV**: Balanced risk-reward diversification (50% leverage / 50% uniqueness weights, 0.8 scale).
- **Marketplace Survival**: Immediate progression safety focus (20% leverage / 20% uniqueness weights, 0.3 scale).
- **Group Survival**: Low-volatility standard profile (5% leverage / 5% uniqueness weights, 0.1 scale).
`;

    return {
      id: "sec-contest-dynamics-analysis",
      title: "14. Contest Dynamics Analysis",
      type: "inventory_summary",
      content_markdown: md
    };
  }

  static buildSurvivorRecommendationsSection(recs: SurvivorRecommendation[], season: string, week: number): WeeklyReportSection {
    // Group recommendations by entry
    const entriesMap = new Map<string, SurvivorRecommendation[]>();
    for (const r of recs) {
      if (!entriesMap.has(r.entry_id)) {
        entriesMap.set(r.entry_id, []);
      }
      entriesMap.get(r.entry_id)!.push(r);
    }

    let md = `### 🎯 Survivor Recommendations Analysis (v0.35)\n`;
    md += `This section displays the ranked recommendations generated by the Survivor Recommendation Engine for each active survivor entry.\n\n`;

    for (const [entryId, entryRecs] of entriesMap.entries()) {
      const sorted = [...entryRecs].sort((a, b) => a.recommendation_rank - b.recommendation_rank);
      const topRec = sorted.find(r => r.recommendation_rank === 1);
      const alternatives = sorted.filter(r => r.recommendation_rank > 1 && r.recommendation_rank <= 3);

      md += `#### 👤 Entry: ${entryId}\n`;
      md += `The unified recommendation scoring model is configured to favor team preservation, immediate survival, and game-theoretic differentiation.\n\n`;

      if (topRec) {
        md += `🏆 **Recommended Pick**: **${topRec.recommended_team_id.toUpperCase()}** (Score: ${topRec.recommendation_score.toFixed(1)} | Rank: 1 | Tier: *${topRec.recommendation_tier}*)\n`;
        md += `> **Rationale**: ${topRec.recommendation_reason}\n\n`;
      }

      if (alternatives.length > 0) {
        md += `🔄 **Alternative Options**:\n`;
        for (const alt of alternatives) {
          md += `- **${alt.recommended_team_id.toUpperCase()}** (Score: ${alt.recommendation_score.toFixed(1)} | Rank: ${alt.recommendation_rank} | Tier: *${alt.recommendation_tier}*)\n`;
          md += `  *Rationale*: ${alt.recommendation_reason}\n`;
        }
        md += `\n`;
      }

      md += `| Team | Rec Rank | Score | Candidate Score | Survivor Equity | Future Value Impact | Projected Ownership | Contest Eq Adjustment | Strategy Profile |\n`;
      md += `|---|---|---|---|---|---|---|---|---|\n`;
      
      const tableRows = sorted.slice(0, 5).map(r => {
        return `| **${r.recommended_team_id.toUpperCase()}** | Rank ${r.recommendation_rank} | ${r.recommendation_score.toFixed(1)} | ${r.candidate_score.toFixed(1)} | ${r.survivor_equity_score.toFixed(1)} | ${r.future_team_value_score.toFixed(1)} | ${r.projected_ownership_pct.toFixed(1)}% | +${r.contest_equity_adjustment.toFixed(1)} | ${r.strategy_profile} |`;
      }).join("\n");
      
      md += tableRows + "\n\n";
    }

    md += `#### ⚙️ Recommendation Framework (v0.35 Engine Config)\n`;
    md += `Survivor recommendations are dynamically weighted based on the entry's strategic orientation:\n`;
    md += `- **Championship EV**: Emphasizes Contest Equity (20%) and Ownership/Leverage (15%).\n`;
    md += `- **Portfolio EV**: Prioritizes balanced risk-reward profile (35% Candidate, 25% Equity, 15% FTV, 15% Dynamics, 10% Leverage).\n`;
    md += `- **Marketplace Survival**: Favors survival probability & stability (45% Candidate, 35% Equity, 10% FTV).\n`;
    md += `- **Group Survival**: Maximum focus on highest confidence safety options (50% Candidate, 40% Equity).\n`;

    return {
      id: "sec-survivor-recommendations",
      title: "15. Survivor Recommendations Analysis",
      type: "inventory_summary",
      content_markdown: md
    };
  }

  static buildContestEVSection(evs: ContestEV[], season: string, week: number): WeeklyReportSection {
    // Group EV calculations by Contest ID
    const contestsMap = new Map<string, ContestEV[]>();
    for (const ev of evs) {
      if (!contestsMap.has(ev.contest_id)) {
        contestsMap.set(ev.contest_id, []);
      }
      contestsMap.get(ev.contest_id)!.push(ev);
    }

    let md = `### 🏆 Contest Expected Value (Contest EV) Optimization (v0.40)\n`;
    md += `This section displays the game-theoretic Contest Expected Value (Contest EV) optimizations across active contests. Calculations integrate win probabilities, survivor equity hedging, future value preservation, consensus alignment, and contest-specific public ownership risk adjustments.\n\n`;

    for (const [contestId, contestEVList] of contestsMap.entries()) {
      const sorted = [...contestEVList].sort((a, b) => b.contest_ev_score - a.contest_ev_score);
      const topEV = sorted[0];

      md += `#### 🏛️ Contest: **${contestId.toUpperCase()}** (Type: *${topEV?.contest_type || "PUBLIC"}* | Size: ${topEV?.contest_size.toLocaleString() || "1,000"})\n`;
      md += `Strategic modeling uses specific risk profiles matching this pool's participant behavior and scale.\n\n`;

      if (topEV) {
        md += `⭐ **Highest EV Selection**: **${topEV.recommended_team_id.toUpperCase()}** (Contest EV Score: **${topEV.contest_ev_score.toFixed(1)}** | Champ Prob: **${topEV.championship_probability.toFixed(4)}%**)\n`;
        md += `> **Audit Explanation**: ${topEV.explanation}\n\n`;
      }

      md += `| Team | Entry ID | Contest EV | Champ Prob | Est Ownership | Win Prob | FTV Score | Survivor Equity | Portfolio Score | Risk Adj |\n`;
      md += `|---|---|---|---|---|---|---|---|---|---|\n`;

      const tableRows = sorted.slice(0, 10).map(ev => {
        return `| **${ev.recommended_team_id.toUpperCase()}** | ${ev.entry_id} | **${ev.contest_ev_score.toFixed(1)}** | ${ev.championship_probability.toFixed(4)}% | ${ev.estimated_ownership.toFixed(1)}% | ${((ev.win_probability || 0.75) * 100).toFixed(0)}% | ${ev.future_team_value.toFixed(0)} | ${ev.survivor_equity.toFixed(0)} | ${ev.portfolio_score.toFixed(0)} | -${ev.risk_adjustment.toFixed(1)} |`;
      }).join("\n");

      md += tableRows + "\n\n";
    }

    md += `#### ⚙️ Contest EV Calibration Framework (Layer 5/v0.40 Engine Config)\n`;
    md += `Contest Expected Value combines 6 major core pillars of the intelligence suite:\n`;
    md += `- **Win Probability** (25% weight): Represents pure schedule safety.\n`;
    md += `- **Survivor Equity** (20% weight): Hedges the portfolio's underlying asset value.\n`;
    md += `- **Future Team Value** (15% weight): Prevents short-sighted schedule exhaustion.\n`;
    md += `- **Portfolio Alignment** (15% weight): Enforces optimal distribution and constraints.\n`;
    md += `- **Consensus Score** (10% weight): Protects against variance and market deviations.\n`;
    md += `- **Ownership Leverage** (15% weight): Multiplies returns via contrarian anti-chalk selections.\n`;
    md += `- **Risk Adjustment**: Subtracts a calibrated deduction based on contest-type specific ownership concentrations.\n`;

    return {
      id: "sec-contest-ev-analysis",
      title: "16. Contest Expected Value Analysis",
      type: "inventory_summary",
      content_markdown: md
    };
  }

  static buildMarketCalibrationSection(calibrations: MarketCalibration[], season: string, week: number): WeeklyReportSection {
    let md = `### ⚖️ Market Calibration & Closing Line Value (CLV) Engine (v0.42)\n`;
    md += `This section monitors predictive performance against real closing market lines, tracing spread CLV, total CLV, model edge, and absolute prediction errors. A higher CLV proves the model is consistently beating the market movement.\n\n`;

    md += `| Team Matchup | Opening Line | Closing Line | Model Line | Spread CLV | Total CLV | Market Edge | Prediction Error | Calibration Score |\n`;
    md += `|---|---|---|---|---|---|---|---|---|\n`;

    const tableRows = calibrations.map(item => {
      const qScore = Math.max(0, Math.min(100, Math.round(75 + (item.spread_clv * 15) - (item.prediction_error * 2))));
      const formatNum = (num: number) => num > 0 ? `+${num}` : `${num}`;
      const clvSign = item.spread_clv > 0 ? `+` : ``;
      const totSign = item.total_clv > 0 ? `+` : ``;

      return `| **${item.team_id.toUpperCase()}** | ${formatNum(item.opening_spread)} | ${formatNum(item.closing_spread)} | **${formatNum(item.model_spread)}** | **${clvSign}${item.spread_clv}** | ${totSign}${item.total_clv} | ${item.market_edge.toFixed(2)} | ${item.prediction_error.toFixed(2)} | **${qScore}** |`;
    }).join("\n");

    md += tableRows + "\n\n";

    md += `#### 🧠 Closed-Loop Calibration Learning Feedback\n`;
    md += `- **Opening vs Closing lines**: Measuring spread drift confirms the velocity of sharp market sentiment.\n`;
    md += `- **Spread CLV**: Positive closing value is mathematically correlated with long-term profitability.\n`;
    md += `- **Calibration score (0-100)**: Assesses precision where +CLV increases ratings and MAE (absolute error) deducts points.\n`;

    return {
      id: "sec-market-calibration-analysis",
      title: "17. Market Calibration & Closing Line Value (CLV) Analysis",
      type: "inventory_summary",
      content_markdown: md
    };
  }

  static buildModelPerformanceSection(performances: ModelPerformance[], season: string, week: number): WeeklyReportSection {
    let md = `### 🎯 Model Performance & Dynamic Weighting Engine (v0.43)\n`;
    md += `This section reviews the continuously calculated performance ratings of the main projection engines and explains their dynamically self-adjusting active weights.\n\n`;

    md += `| Prediction Model | Type | Accuracy | Brier Score | Log Loss | MAE / RMSE | Spread CLV | Calibration Score | Active Weight | Status | Trend |\n`;
    md += `|---|---|---|---|---|---|---|---|---|---|---|\n`;

    const tableRows = performances.map(item => {
      const errorMetric = `${item.mae.toFixed(1)} / ${item.rmse.toFixed(1)}`;
      const statusIcon = item.status === "IMPROVING" ? "🟢" : item.status === "STABLE" ? "🟡" : "🔴";
      const trendIcon = item.active_weight > 1.0 ? "📈" : item.active_weight < 1.0 ? "📉" : "➡️";

      return `| **${item.model_name}** | ${item.prediction_type} | ${item.accuracy.toFixed(1)}% | ${item.brier_score.toFixed(4)} | ${item.log_loss.toFixed(4)} | ${errorMetric} | **${item.spread_clv > 0 ? "+" : ""}${item.spread_clv}** | **${Math.round(item.calibration_score)}** | **${item.active_weight.toFixed(2)}x** | ${statusIcon} ${item.status} | ${trendIcon} |`;
    }).join("\n");

    md += tableRows + "\n\n";

    md += `#### 🧠 Self-Adjusting Machine Learning Feedback loop\n`;
    md += `- **Active Weight adjustment**: Weekly ratings smoothly shift via a 80% previous and 20% current allocation formula.\n`;
    md += `- **Performance boundaries**: Weight ranges are bounded strictly between **0.10** and **3.00** to guarantee stability.\n`;
    md += `- **Performance Status indicator**: Green represents high accuracy and CLV, yellow is standard operations, red alerts require manual model optimization.\n`;

    return {
      id: "sec-model-performance-analysis",
      title: "18. Model Performance & Dynamic Weighting Analysis",
      type: "inventory_summary",
      content_markdown: md
    };
  }

  static buildRollingValidationSection(validations: RollingValidation[], season: string, startWeek: number, endWeek: number): WeeklyReportSection {
    let md = `### 🔄 Rolling Validation & Backtesting Engine (v0.44)\n`;
    md += `This section evaluates model forecasting over a rolling timeline (NFL Weeks ${startWeek} through ${endWeek}) to identify predictive drift, compile robust error metrics, and suggest remediation plans.\n\n`;

    md += `| Prediction Model | Week Range | Games | Accuracy | Brier Score | Log Loss | RMSE / MAE | Spread CLV | Calibration Score | Drift Score | Recommended Action |\n`;
    md += `|---|---|---|---|---|---|---|---|---|---|---|\n`;

    const tableRows = validations.map(item => {
      const errorMetric = `${item.rmse.toFixed(1)} / ${item.mae.toFixed(1)}`;
      const statusIcon = item.recommended_action === "KEEP" ? "🟢" : item.recommended_action === "WATCH" ? "🟡" : item.recommended_action === "RECALIBRATE" ? "🟠" : "🔴";

      return `| **${item.model_name}** | W${item.start_week}-W${item.end_week} | ${item.games_evaluated} | ${item.accuracy.toFixed(1)}% | ${item.brier_score.toFixed(4)} | ${item.log_loss.toFixed(4)} | ${errorMetric} | **${item.spread_clv > 0 ? "+" : ""}${item.spread_clv}** | **${Math.round(item.rolling_score)}** | **${item.drift_score.toFixed(1)}** | ${statusIcon} **${item.recommended_action}** |`;
    }).join("\n");

    md += tableRows + "\n\n";

    md += `#### 🛠️ Automated Model Lifecycle Recommendations\n`;
    md += `- **0–10 Stable (KEEP)**: No drift detected. The model maintains standard high predictive power.\n`;
    md += `- **10–20 Watch (WATCH)**: Minimal divergence from closing lines. Flagged for close observation.\n`;
    md += `- **20–35 Recalibrate (RECALIBRATE)**: Predictive accuracy or CLV degrading. Model requires hyperparameter fine-tuning.\n`;
    md += `- **35+ Retrain (RETRAIN)**: Severe drift detected. The model should be retrained on newer historical datasets.\n`;

    return {
      id: "sec-rolling-validation-analysis",
      title: "19. Rolling Validation & Backtesting Performance Analysis",
      type: "inventory_summary",
      content_markdown: md
    };
  }

  static buildModelDriftSection(drifts: ModelDrift[], season: string, week: number): WeeklyReportSection {
    let md = `### 📉 Model Drift Detection & Recalibration Recommendation Engine (v0.45)\n`;
    md += `This section monitors statistical drift and model decay for season ${season}, Week ${week}. By comparing current backtesting metrics against historical baseline training standards, the engine identifies degraded predictive accuracy and recommends automated retraining/recalibration lifecycles.\n\n`;

    md += `| Prediction Model | Drift Score | Status / Level | Recommended Action | Priority | Accuracy Delta | Brier Delta | CLV Delta | Explanation |\n`;
    md += `|---|---|---|---|---|---|---|---|---|\n`;

    const tableRows = drifts.map(item => {
      const statusIcon = item.drift_level === "STABLE" ? "🟢" : item.drift_level === "MONITOR" ? "🟡" : item.drift_level === "WARNING" ? "🟠" : "🔴";
      const priorityBadge = `\`${item.recommended_priority}\``;
      const accDeltaSign = item.accuracy_delta > 0 ? "+" : "";
      const brierDeltaSign = item.brier_delta > 0 ? "+" : "";
      const clvDeltaSign = item.clv_delta > 0 ? "+" : "";

      return `| **${item.model_name}** | **${item.drift_score.toFixed(1)}** | ${statusIcon} **${item.drift_level}** | \`${item.recommended_action}\` | ${priorityBadge} | ${accDeltaSign}${item.accuracy_delta}% | ${brierDeltaSign}${item.brier_delta.toFixed(4)} | ${clvDeltaSign}${item.clv_delta.toFixed(2)} | ${item.explanation} |`;
    }).join("\n");

    md += tableRows + "\n\n";

    md += `#### 🛠️ Recalibration Action Matrix\n`;
    md += `- **🟢 STABLE (Action: NONE)**: Performance metrics are within standard deviation parameters. Maintain deployment.\n`;
    md += `- **🟡 MONITOR (Action: INVESTIGATE)**: Minor predictive shifts detected. Put model on watch list and inspect features.\n`;
    md += `- **🟠 WARNING (Action: RECALIBRATE)**: Medium-level drift detected. Recommend scheduled parameter recalibration.\n`;
    md += `- **🔴 CRITICAL (Action: RETRAIN)**: Severe statistical decay detected. Immediate weight-retraining cycle required.\n`;

    return {
      id: "sec-model-drift-analysis",
      title: "20. Model Drift & Recalibration Recommendations",
      type: "inventory_summary",
      content_markdown: md
    };
  }

  static buildAdaptiveModelWeightsSection(weights: AdaptiveModelWeight[], season: string, week: number): WeeklyReportSection {
    let md = `### ⚖️ Adaptive Ensemble Weighting Engine (v0.46)\n`;
    md += `This section monitors the continuous adaptation of predictive model weights for season ${season}, Week ${week}. By analyzing live performance, backtesting, calibration alignment, and drift status, the engine shifts authority to high-performing models and penalizes drifting models.\n\n`;

    md += `| Prediction Model | Previous Weight | Final Weight | Weight Shift | Confidence Score | Performance Score | Calibration Score | Drift Penalty | Recommendation Summary |\n`;
    md += `|---|---|---|---|---|---|---|---|---|\n`;

    const tableRows = weights.map(item => {
      const shiftSign = item.weight_delta > 0 ? "+" : "";
      const shiftColor = item.weight_delta > 0 ? "🟢" : item.weight_delta < 0 ? "🔴" : "⚪";
      return `| **${item.model_name}** | ${item.previous_weight.toFixed(1)}% | **${item.final_weight.toFixed(1)}%** | ${shiftColor} **${shiftSign}${item.weight_delta.toFixed(1)}%** | \`${item.confidence_score.toFixed(1)}\` | ${item.performance_score.toFixed(1)} | ${item.calibration_score.toFixed(1)} | -${item.drift_penalty.toFixed(1)} | ${item.recommendation_reason} |`;
    }).join("\n");

    md += tableRows + "\n\n";

    // Add highlighted insights
    const sorted = [...weights].sort((a, b) => b.final_weight - a.final_weight);
    const topModel = sorted[0];
    const sortedDeltas = [...weights].sort((a, b) => a.weight_delta - b.weight_delta);
    const penalizedModel = sortedDeltas[0];

    md += `#### 🔍 Key Weighting Adjustments\n`;
    md += `- **🏆 Top Weighted Model**: **${topModel.model_name}** is the primary driver of the ensemble with an active weight of **${topModel.final_weight.toFixed(1)}%** (Confidence score: \`${topModel.confidence_score.toFixed(1)}\`).\n`;
    if (penalizedModel && penalizedModel.weight_delta < 0) {
      md += `- **⚠️ Maximum Penalty Applied**: **${penalizedModel.model_name}** received the largest allocation reduction of **${penalizedModel.weight_delta.toFixed(1)}%** due to active recalibration indicators and drift penalties.\n`;
    }

    return {
      id: "sec-adaptive-model-weights",
      title: "21. Adaptive Ensemble Weighting Analysis",
      type: "inventory_summary",
      content_markdown: md
    };
  }

  static buildDecisionPolicySection(policies: DecisionPolicy[], season: string, week: number): WeeklyReportSection {
    let md = `### 🎯 Decision Policy Engine Summary (v0.48)\n`;
    md += `This section transforms the calibrated ensemble predictions into actionable, deterministic Survivor decision policies for season ${season}, Week ${week}. Rather than simply ranking selections, the engine evaluates expected utility, risk levels, portfolio alignment, and leverage to issue explainable policy recommendations.\n\n`;

    md += `| Team Selection | Decision Score | Win Prob (Ens) | Risk Score | Leverage Score | Portfolio Fit | Action Recommendation | Confidence Tier |\n`;
    md += `|---|---|---|---|---|---|---|---|\n`;

    // Sort by decision score descending to highlight top choices
    const sortedPolicies = [...policies].sort((a, b) => b.decision_score - a.decision_score);
    const visiblePolicies = sortedPolicies.slice(0, 10); // Display top 10

    const tableRows = visiblePolicies.map(p => {
      let badge = "⚪ PASS";
      if (p.recommended_action === "LOCK") badge = "🟢 **LOCK**";
      else if (p.recommended_action === "STRONG PLAY") badge = "🟢 **STRONG PLAY**";
      else if (p.recommended_action === "PLAY") badge = "🔵 **PLAY**";
      else if (p.recommended_action === "PASS") badge = "🟡 **PASS**";
      else if (p.recommended_action === "AVOID") badge = "🔴 **AVOID**";

      return `| **${p.recommended_pick.toUpperCase()}** | **${p.decision_score.toFixed(1)}** | ${p.ensemble_prediction.toFixed(1)}% | ${p.risk_score.toFixed(1)}% | ${p.leverage_score.toFixed(1)} | ${p.portfolio_score.toFixed(1)} | ${badge} | \`${p.confidence_tier}\` |`;
    }).join("\n");

    md += tableRows + "\n\n";

    // Recommended Picks, Top Alternatives, Risk Summary, Explanations
    const locks = sortedPolicies.filter(p => p.recommended_action === "LOCK");
    const strongPlays = sortedPolicies.filter(p => p.recommended_action === "STRONG PLAY");
    const plays = sortedPolicies.filter(p => p.recommended_action === "PLAY");
    const avoids = sortedPolicies.filter(p => p.recommended_action === "AVOID");

    md += `#### 📋 Policy Strategic Breakdown\n`;
    
    // Top Picks
    if (locks.length > 0) {
      md += `- **🏆 Primary Recommended Picks (LOCKS)**: ${locks.map(l => `**${l.recommended_pick.toUpperCase()}** (Score: ${l.decision_score.toFixed(1)})`).join(", ")}\n`;
    } else if (strongPlays.length > 0) {
      md += `- **🏆 Primary Recommended Picks (STRONG PLAYS)**: ${strongPlays.slice(0, 2).map(l => `**${l.recommended_pick.toUpperCase()}** (Score: ${l.decision_score.toFixed(1)})`).join(", ")}\n`;
    } else {
      md += `- **🏆 Primary Recommended Picks**: None meet premium selection criteria this week.\n`;
    }

    // Top Alternatives
    const alternatives = [...strongPlays, ...plays].filter(p => !locks.some(l => l.recommended_pick === p.recommended_pick));
    if (alternatives.length > 0) {
      md += `- **🔄 Top Alternative Selections**: ${alternatives.slice(0, 3).map(a => `**${a.recommended_pick.toUpperCase()}** (Score: ${a.decision_score.toFixed(1)})`).join(", ")}\n`;
    }

    // Risk & Avoids
    md += `- **⚠️ Risk & Avoidance Directives**: **${avoids.length}** teams have been designated with an **AVOID** status. `;
    if (avoids.length > 0) {
      md += `Steer completely clear of ${avoids.slice(0, 4).map(av => `**${av.recommended_pick.toUpperCase()}**`).join(", ")} due to high model variance, low expected utility, or system drift penalties.`;
    } else {
      md += `No extreme risks or drift penalties have triggered AVOID thresholds for the current slate.`;
    }
    md += `\n\n`;

    // Highlight top reasons
    md += `#### 💬 Key Decision Policy Explanations\n`;
    const featuredPolicies = sortedPolicies.filter(p => p.recommended_action === "LOCK" || p.recommended_action === "STRONG PLAY" || p.recommended_action === "AVOID").slice(0, 4);
    for (const fp of featuredPolicies) {
      md += `- **${fp.recommended_pick.toUpperCase()}** (${fp.recommended_action}): *"${fp.policy_reason}"*\n`;
    }

    return {
      id: "sec-decision-policies",
      title: "22. Decision Policy Engine Analytics",
      type: "inventory_summary",
      content_markdown: md
    };
  }
}
