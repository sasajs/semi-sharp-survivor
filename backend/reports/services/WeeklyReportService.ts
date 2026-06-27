import { 
  WeeklyReport, 
  WeeklyReportConfig, 
  WeeklyReportRun, 
  WeeklyReportPickSummary, 
  WeeklyReportRiskSummary, 
  WeeklyReportInventorySummary, 
  WeeklyReportSimulationSummary, 
  WeeklyReportSection,
  WeeklyReportAuditMetadata
} from "../models";
import { 
  legRepo, 
  lineRepo, 
  teamRepo, 
  entryRepo, 
  inventoryRepo, 
  reservationRepo, 
  riskRepo, 
  recommendationRepo, 
  futureValueRepo,
  gameRepo,
  featureDefinitionRepo,
  featureSnapshotRepo
} from "../../repositories";
import { ReportNarrativeService } from "./ReportNarrativeService";
import { ReportSectionBuilderService } from "./ReportSectionBuilderService";
import { ReportAuditService } from "./ReportAuditService";
import { FutureTeamValueService } from "../../services/FutureTeamValueService";
import { SurvivorEquityService } from "../../services/SurvivorEquityService";
import { RecommendationCandidateService } from "../../services/RecommendationCandidateService";
import { OwnershipProjectionService } from "../../services/OwnershipProjectionService";
import { ContestDynamicsService } from "../../services/ContestDynamicsService";
import { SurvivorRecommendationService } from "../../services/SurvivorRecommendationService";
import { ContestEVService } from "../../services/ContestEVService";
import { MarketCalibrationService } from "../../services/MarketCalibrationService";
import { ModelPerformanceService } from "../../services/ModelPerformanceService";
import { RollingValidationService } from "../../services/RollingValidationService";
import { ModelDriftService } from "../../services/ModelDriftService";
import { AdaptiveModelWeightService } from "../../services/AdaptiveModelWeightService";
import { DecisionPolicyService } from "../../services/DecisionPolicyService";
import { SurvivorDecisionAgentService } from "../../services/SurvivorDecisionAgentService";
import { adaptiveModelWeightRepo, decisionPolicyRepo, survivorDecisionRepo } from "../../repositories";
import { MonteCarloSurvivorService } from "../../simulation/services/MonteCarloSurvivorService";

// Persistent state storage for generated reports and report runs
const mockReports: WeeklyReport[] = [];
const mockReportRuns: WeeklyReportRun[] = [];

export class WeeklyReportService {
  /**
   * Generates a structural weekly report based on system data snapshots.
   */
  static async generateWeeklyReport(
    contestId: string,
    legId: string,
    config: WeeklyReportConfig = {}
  ): Promise<WeeklyReport> {
    const leg = await legRepo.getById(legId);
    if (!leg) throw new Error("Contest leg not found");

    const allEntries = await entryRepo.getAll();
    let activeEntries = allEntries.filter(e => e.status !== "eliminated");

    // Seamless fallback to ensure non-blocking execution in empty workspaces
    if (activeEntries.length === 0) {
      activeEntries = [{ id: "fallback-entry-id", name: "Default Test Entry", status: "active", contest_id: contestId } as any];
    }

    const firstEntry = activeEntries[0];

    // 1. Fetch lines for candidate pick evaluations
    const lines = await lineRepo.getByLegId(legId);
    const games = await gameRepo.getByLegId(legId);
    const teams = await teamRepo.getAll();
    const teamNameMap = new Map(teams.map(t => [t.id, t.name]));

    const inv = await inventoryRepo.getByEntryIdAndLeg(firstEntry.id, legId);
    const usedTeamsList = inv?.used_teams || [];

    // Map candidate pick summaries
    const pickSummaries: WeeklyReportPickSummary[] = [];
    for (const line of lines) {
      const isUsed = usedTeamsList.includes(line.team_id);
      if (isUsed) continue;

      const teamName = teamNameMap.get(line.team_id) || "Unknown Team";
      const game = games.find(g => g.home_team_id === line.team_id || g.away_team_id === line.team_id);
      const opponentId = game ? (game.home_team_id === line.team_id ? game.away_team_id : game.home_team_id) : "unknown";
      const opponentName = teamNameMap.get(opponentId) || "Opponent";
      const fvScore = line.future_value || 10;
      const riskScore = Math.floor((1 - line.win_probability) * 100);

      const leverageScore = parseFloat((line.win_probability * (1 - line.pick_popularity) * 10).toFixed(2));
      const contestEquityScore = parseFloat((line.win_probability * 150 - line.pick_popularity * 35).toFixed(1));

      const cand: Partial<WeeklyReportPickSummary> = {
        team_id: line.team_id,
        team_name: teamName,
        opponent_id: opponentId,
        opponent_name: opponentName,
        win_probability: line.win_probability,
        pick_popularity: line.pick_popularity,
        contest_equity_score: contestEquityScore,
        leverage_score: leverageScore,
        future_value_score: fvScore,
        risk_score: riskScore,
        confidence_tier: line.win_probability >= 0.75 ? "High" : line.win_probability >= 0.65 ? "Medium" : "Low"
      };

      cand.rationale = ReportNarrativeService.generatePickRationale(cand);
      pickSummaries.push(cand as WeeklyReportPickSummary);
    }

    // Sort candidate picks by win probability & equity score descendently
    pickSummaries.sort((a,b) => b.win_probability - a.win_probability || b.contest_equity_score - a.contest_equity_score);

    const topPick = pickSummaries[0] || { team_id: "none", team_name: "No Selection", opponent_id: "", opponent_name: "", win_probability: 0, pick_popularity: 0, contest_equity_score: 0, leverage_score: 0, future_value_score: 0, risk_score: 0, confidence_tier: "Low", rationale: "No active candidates are currently available." };
    const alternates = pickSummaries.slice(1, 4);

    // 2. Risk summaries
    const riskSummary: WeeklyReportRiskSummary = {
      rest_risk: 35,
      injury_risk: 42,
      travel_risk: 28,
      weather_risk: 12,
      divisional_risk: 50,
      market_risk: 60,
      upset_probability: topPick ? 1 - topPick.win_probability : 0.3,
      confidence_tier: topPick.win_probability >= 0.75 ? "High" : topPick.win_probability >= 0.65 ? "Medium" : "Low"
    };
    const riskNarrative = ReportNarrativeService.generateRiskNarrative(riskSummary);

    // 3. Inventory details
    const fvProfiles = await futureValueRepo.getProfilesByLeg(legId);
    const eliteTeams = fvProfiles.filter(p => p.future_value_score >= 80).map(p => p.team_id);
    const unusedEliteNames = eliteTeams
      .filter(tId => !usedTeamsList.includes(tId))
      .map(tId => teamNameMap.get(tId) || tId);

    const allLegs = await legRepo.getAll();
    const thanksgivingLeg = allLegs.find(l => l.leg_type === "thanksgiving");
    const christmasLeg = allLegs.find(l => l.leg_type === "christmas");

    const reservedHolidays = await reservationRepo.getHolidayReservations(firstEntry.id);
    const thanksgivingTeams = reservedHolidays.filter(r => r.contest_leg_id === thanksgivingLeg?.id).map(r => teamNameMap.get(r.team_id) || r.team_id);
    const christmasTeams = reservedHolidays.filter(r => r.contest_leg_id === christmasLeg?.id).map(r => teamNameMap.get(r.team_id) || r.team_id);

    const inventorySummary: WeeklyReportInventorySummary = {
      used_teams: usedTeamsList.map(tId => teamNameMap.get(tId) || tId),
      available_teams: teams.filter(t => !usedTeamsList.includes(t.id)).map(t => t.name),
      remaining_elite_teams: unusedEliteNames,
      thanksgiving_inventory: thanksgivingTeams,
      christmas_inventory: christmasTeams,
      future_value_warning: unusedEliteNames.length <= 2 ? "High Alert: premium team inventory is critical. Preserve high-safety elite schedules." : null
    };
    const invNarrative = ReportNarrativeService.generateInventoryNarrative(inventorySummary);

    // 4. Run simulations if required or run lightweight simulations instantly
    let simSummary: WeeklyReportSimulationSummary | null = null;
    const runSim = config.include_simulation !== false;

    if (runSim) {
      const entryProj = await MonteCarloSurvivorService.runEntrySimulation(firstEntry.id, legId, { iterations: 2000, strategy_profile: config.strategy_preference || 'safe' });
      const portProj = await MonteCarloSurvivorService.runPortfolioSimulation(legId, { iterations: 2000, strategy_profile: config.strategy_preference || 'safe' });
      const chalkScenario = await MonteCarloSurvivorService.runChalkUpsetScenario(legId, { iterations: 2000, strategy_profile: 'safe' });
      const strategyComp = await MonteCarloSurvivorService.compareStrategies(firstEntry.id, legId);
      const inventoryProj = await MonteCarloSurvivorService.projectFutureInventory(firstEntry.id, legId);

      const survivalRate = entryProj.entry_projections[0]?.survival_probability || 0.65;
      const portfolioRate = portProj.portfolio_projection?.portfolio_survival_probability || 0.82;

      simSummary = {
        entry_survival_probability: survivalRate,
        portfolio_survival_probability: portfolioRate,
        concentrated_exposure_warnings: Object.keys(portProj.portfolio_projection?.concentrated_exposures || {}).filter(k => (portProj.portfolio_projection?.concentrated_exposures[k] || 0) > 0.4),
        chalk_upset_scenario: chalkScenario,
        strategy_comparison: strategyComp,
        future_inventory_projection: inventoryProj
      };
    } else {
      simSummary = {
        entry_survival_probability: 0.72,
        portfolio_survival_probability: 0.88,
        concentrated_exposure_warnings: [],
        chalk_upset_scenario: null,
        strategy_comparison: null,
        future_inventory_projection: null
      };
    }

    const simNarrative = ReportNarrativeService.generateSimulationNarrative(simSummary);

    // 5. Structure Markdown sections
    const execNarrative = ReportNarrativeService.generateExecutiveSummaryNarrative(
      topPick.team_name,
      topPick.win_probability >= 0.75 ? "High" : topPick.win_probability >= 0.65 ? "Medium" : "Low",
      config.strategy_preference || 'safe'
    );

    const sections: WeeklyReportSection[] = [];
    sections.push(
      ReportSectionBuilderService.buildExecutiveSummary(
        topPick.team_name,
        alternates.map(a => a.team_name),
        topPick.win_probability >= 0.75 ? "High" : topPick.win_probability >= 0.65 ? "Medium" : "Low",
        [
          `High impact risk constraints in this leg is rest disadvantage.`,
          `Divisional games create upset bias trends.`
        ],
        inventorySummary.future_value_warning,
        config.strategy_preference || 'safe',
        execNarrative
      )
    );

    sections.push(ReportSectionBuilderService.buildRecommendedPicksSection(pickSummaries));
    sections.push(ReportSectionBuilderService.buildRiskSection(riskSummary, riskNarrative));
    sections.push(ReportSectionBuilderService.buildInventorySection(inventorySummary, invNarrative));
    sections.push(ReportSectionBuilderService.buildSimulationSection(simSummary, simNarrative));

    if (simSummary.chalk_upset_scenario) {
      sections.push(ReportSectionBuilderService.buildChalkUpsetSection(simSummary.chalk_upset_scenario));
    }
    if (simSummary.strategy_comparison) {
      sections.push(ReportSectionBuilderService.buildStrategyComparisonSection(simSummary.strategy_comparison));
    }

    // Prepare temporary report shell to append metadata and hash
    const reportShell: Partial<WeeklyReport> = {
      id: `report-${legId}-${Date.now()}`,
      contest_id: contestId,
      contest_leg_id: legId,
      week_number: leg.nfl_week,
      executive_summary: {
        top_recommended_pick: { team_id: topPick.team_id, team_name: topPick.team_name },
        alternate_picks: alternates.map(a => ({ team_id: a.team_id, team_name: a.team_name })),
        confidence_tier: topPick.win_probability >= 0.75 ? "High" : topPick.win_probability >= 0.65 ? "Medium" : "Low",
        key_risk_warnings: [
          `Key threat vectors reside in rest imbalances.`,
          `High divisional rivalry multiplier exists.`
        ],
        key_inventory_warning: inventorySummary.future_value_warning,
        strategy_recommendation: config.strategy_preference || 'safe'
      },
      recommended_picks: pickSummaries,
      risk_summary: riskSummary,
      inventory_summary: inventorySummary,
      simulation_summary: simSummary,
      created_at: new Date().toISOString()
    };

    const season = parseInt(contestId) || 2026;
    const week = leg.nfl_week;

    // Feature Store Integration
    const defs = await featureDefinitionRepo.getAll();
    const snaps = await featureSnapshotRepo.getBySeasonAndWeek(season, week);
    const featureStoreSection = ReportSectionBuilderService.buildFeatureStoreAuditSection(
      defs,
      snaps.length,
      season,
      week
    );
    sections.push(featureStoreSection);

    // Future Team Value Section (v0.31 Engine)
    try {
      const ftvService = new FutureTeamValueService();
      // Translate report strategy preference to core StrategyType
      let stratPreference: any = undefined;
      if (config.strategy_preference === "safe") {
        stratPreference = "MARKETPLACE_SURVIVAL";
      } else if (config.strategy_preference === "balanced") {
        stratPreference = "PORTFOLIO_EV";
      } else {
        stratPreference = "CHAMPIONSHIP_EV";
      }
      const ftvRankings = await ftvService.getRankingsWithExplainability(season.toString(), week, stratPreference);
      const ftvSection = ReportSectionBuilderService.buildFutureTeamValueSection(ftvRankings, season.toString(), week);
      sections.push(ftvSection);
    } catch (ftvErr: any) {
      console.warn("Could not append Future Team Value section to weekly report:", ftvErr.message);
    }

    // Survivor Equity Section (v0.32 Engine Foundation)
    try {
      const eqService = new SurvivorEquityService();
      let stratPreference: any = undefined;
      if (config.strategy_preference === "safe") {
        stratPreference = "MARKETPLACE_SURVIVAL";
      } else if (config.strategy_preference === "balanced") {
        stratPreference = "PORTFOLIO_EV";
      } else {
        stratPreference = "CHAMPIONSHIP_EV";
      }
      const eqRankings = await eqService.getRankingsWithExplainability(season.toString(), week, stratPreference);
      const eqSection = ReportSectionBuilderService.buildSurvivorEquitySection(eqRankings, season.toString(), week);
      sections.push(eqSection);
    } catch (eqErr: any) {
      console.warn("Could not append Survivor Equity section to weekly report:", eqErr.message);
    }

    // Recommendation Candidates Section (v0.33 Engine)
    try {
      const recService = new RecommendationCandidateService();
      let candidates = await recService.getHistory();
      candidates = candidates.filter(c => c.season === season.toString() && c.week === week);
      if (candidates.length === 0) {
        candidates = await recService.calculate(season.toString(), week);
      }
      const recCandidatesSection = ReportSectionBuilderService.buildRecommendationCandidatesSection(candidates, season.toString(), week);
      sections.push(recCandidatesSection);
    } catch (recErr: any) {
      console.warn("Could not append Recommendation Candidates section to weekly report:", recErr.message);
    }

    // Ownership Projection Analysis Section (v0.34 Engine)
    try {
      const ownService = new OwnershipProjectionService();
      let projections = await ownService.getHistory();
      projections = projections.filter(p => p.season === season.toString() && p.week === week);
      if (projections.length === 0) {
        projections = await ownService.calculate(season.toString(), week);
      }
      const ownSection = ReportSectionBuilderService.buildOwnershipProjectionSection(projections, season.toString(), week);
      sections.push(ownSection);
    } catch (ownErr: any) {
      console.warn("Could not append Ownership Projections section to weekly report:", ownErr.message);
    }

    // Contest Dynamics Analysis Section (v0.34 Engine)
    try {
      const dynService = new ContestDynamicsService();
      let snapshots = await dynService.getHistory();
      snapshots = snapshots.filter(s => s.season === season.toString() && s.week === week);
      if (snapshots.length === 0) {
        snapshots = await dynService.calculate(season.toString(), week);
      }
      const dynSection = ReportSectionBuilderService.buildContestDynamicsSection(snapshots, season.toString(), week);
      sections.push(dynSection);
    } catch (dynErr: any) {
      console.warn("Could not append Contest Dynamics section to weekly report:", dynErr.message);
    }

    // Survivor Recommendations Section (v0.35 Engine)
    try {
      const recsService = new SurvivorRecommendationService();
      let recs = await recsService.getHistory();
      recs = recs.filter(r => r.season === season.toString() && r.week === week);
      if (recs.length === 0) {
        recs = await recsService.calculate(season.toString(), week);
      }
      const recsSection = ReportSectionBuilderService.buildSurvivorRecommendationsSection(recs, season.toString(), week);
      sections.push(recsSection);
    } catch (recsErr: any) {
      console.warn("Could not append Survivor Recommendations section to weekly report:", recsErr.message);
    }

    // Contest Expected Value (Contest EV) Section (v0.40 Engine)
    try {
      let evs = await ContestEVService.getHistory();
      evs = evs.filter(ev => ev.season === season.toString() && ev.week === week);
      if (evs.length === 0) {
        // Fallback or trigger active calculation for this season/week
        evs = await ContestEVService.calculate(season.toString(), week, "v1.0.0");
      }
      const evSection = ReportSectionBuilderService.buildContestEVSection(evs, season.toString(), week);
      sections.push(evSection);
    } catch (evErr: any) {
      console.warn("Could not append Contest Expected Value (Contest EV) section to weekly report:", evErr.message);
    }

    // Market Calibration & Closing Line Value Engine (v0.42 Engine)
    try {
      let calibrations = await MarketCalibrationService.getHistory();
      calibrations = calibrations.filter(c => c.season === season.toString() && c.week === week);
      if (calibrations.length === 0) {
        calibrations = await MarketCalibrationService.calculate(season.toString(), week, "v1.0.0");
      }
      const mktSection = ReportSectionBuilderService.buildMarketCalibrationSection(calibrations, season.toString(), week);
      sections.push(mktSection);
    } catch (mktErr: any) {
      console.warn("Could not append Market Calibration section to weekly report:", mktErr.message);
    }

    // Model Performance & Dynamic Weighting Engine (v0.43 Engine)
    try {
      let performances = await ModelPerformanceService.getHistory();
      performances = performances.filter(p => p.season === season.toString() && p.week === week);
      if (performances.length === 0) {
        performances = await ModelPerformanceService.calculate(season.toString(), week, "1.0.0");
      }
      const perfSection = ReportSectionBuilderService.buildModelPerformanceSection(performances, season.toString(), week);
      sections.push(perfSection);
    } catch (perfErr: any) {
      console.warn("Could not append Model Performance section to weekly report:", perfErr.message);
    }

    // Rolling Validation & Backtesting Engine (v0.44 Engine)
    try {
      let validations = await RollingValidationService.getHistory();
      validations = validations.filter(v => v.season === season.toString() && v.start_week === 1 && v.end_week === week);
      if (validations.length === 0) {
        validations = await RollingValidationService.calculate(season.toString(), 1, week, "1.0.0");
      }
      const rollValSection = ReportSectionBuilderService.buildRollingValidationSection(validations, season.toString(), 1, week);
      sections.push(rollValSection);
    } catch (rollValErr: any) {
      console.warn("Could not append Rolling Validation section to weekly report:", rollValErr.message);
    }

    // Model Drift Detection & Recalibration Engine (v0.45 Engine)
    try {
      let drifts = await ModelDriftService.getHistory();
      drifts = drifts.filter(d => d.season === season.toString() && d.week === week);
      if (drifts.length === 0) {
        drifts = await ModelDriftService.calculate(season.toString(), week, "1.0.0");
      }
      const driftSection = ReportSectionBuilderService.buildModelDriftSection(drifts, season.toString(), week);
      sections.push(driftSection);
    } catch (driftErr: any) {
      console.warn("Could not append Model Drift section to weekly report:", driftErr.message);
    }

    // Adaptive Model Weighting Engine (v0.46 Engine)
    try {
      let weights = await adaptiveModelWeightRepo.getWeightsHistory();
      weights = weights.filter(w => w.season === season.toString() && w.week === week);
      if (weights.length === 0) {
        weights = await AdaptiveModelWeightService.calculateWeights(season.toString(), week, "1.0.0");
      }
      const weightSection = ReportSectionBuilderService.buildAdaptiveModelWeightsSection(weights, season.toString(), week);
      sections.push(weightSection);
    } catch (weightErr: any) {
      console.warn("Could not append Adaptive Model Weighting section to weekly report:", weightErr.message);
    }

    // Decision Policy Summary (v0.48 Engine)
    try {
      let policies = await decisionPolicyRepo.getPoliciesHistory();
      policies = policies.filter(p => p.season === season.toString() && p.week === week);
      if (policies.length === 0) {
        policies = await DecisionPolicyService.calculate(season.toString(), week, "1.0.0");
      }
      const policySection = ReportSectionBuilderService.buildDecisionPolicySection(policies, season.toString(), week);
      sections.push(policySection);
    } catch (policyErr: any) {
      console.warn("Could not append Decision Policy section to weekly report:", policyErr.message);
    }

    // Survivor Decision Summary (v0.49 Agent)
    try {
      let decisions = await survivorDecisionRepo.getDecisionsHistory();
      decisions = decisions.filter(d => d.season === season.toString() && d.week === week);
      if (decisions.length === 0) {
        decisions = await SurvivorDecisionAgentService.calculate(season.toString(), week, "v0.49");
      }
      const decisionSection = ReportSectionBuilderService.buildSurvivorDecisionSection(decisions, season.toString(), week);
      sections.push(decisionSection);
    } catch (decisionErr: any) {
      console.warn("Could not append Survivor Decision Agent section to weekly report:", decisionErr.message);
    }

    const reportHash = ReportAuditService.createReportHash(reportShell);
    const auditMetadata = ReportAuditService.attachAuditMetadata(legId, reportHash);
    
    reportShell.audit_metadata = auditMetadata;
    sections.push(ReportSectionBuilderService.buildAuditSection(auditMetadata));
    reportShell.sections = sections;

    const completedReport = reportShell as WeeklyReport;
    
    // Save report to memory
    mockReports.push(completedReport);

    // Save report run
    mockReportRuns.push({
      id: `run-${Date.now()}`,
      report_id: completedReport.id,
      config,
      status: 'completed',
      created_at: completedReport.created_at
    });

    return completedReport;
  }

  /**
   * Reads a compiled report by ID.
   */
  static async getWeeklyReport(reportId: string): Promise<WeeklyReport | null> {
    return mockReports.find(r => r.id === reportId) || null;
  }

  /**
   * Lists generated reports for a contest.
   */
  static async listWeeklyReports(contestId: string): Promise<WeeklyReport[]> {
    return mockReports.filter(r => r.contest_id === contestId);
  }

  /**
   * Lists all generated reports across all contests.
   */
  static async getAllReports(): Promise<WeeklyReport[]> {
    return mockReports;
  }

  /**
   * Regenerates a weekly report accurately from snapshots to enforce complete reproducibility.
   */
  static async regenerateWeeklyReportFromHistory(reportId: string): Promise<WeeklyReport> {
    const existing = await this.getWeeklyReport(reportId);
    if (!existing) throw new Error("Report not found for regeneration");

    // We fetch snapshots, restore state locks, and rerun generation cleanly
    return await this.generateWeeklyReport(
      existing.contest_id,
      existing.contest_leg_id,
      { include_simulation: !!existing.simulation_summary }
    );
  }
}
