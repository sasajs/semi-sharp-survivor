import { Router, Request, Response } from "express";
import { 
  teamRepo,
  contestRepo,
  legRepo,
  gameRepo,
  lineRepo,
  entryRepo,
  pickRepo,
  historyRepo,
  systemMetadataRepo,
  applicationVersionsRepo,
  projectDecisionsRepo,
  operationsEventsRepo,
  contestTypeRepo,
  teamAliasRepo,
  importJobRepo,
  useMock
} from "../repositories/index";
import { buildAndSeedMockState } from "../services/mockSeeder";
import { teamAliasResolverService } from "../services/TeamAliasResolverService";
import { scheduleImportService } from "../services/ScheduleImportService";
import { weeklyPipelineCoordinator } from "../services/WeeklyPipelineCoordinator";
import { calculateRecommendations, RecommendationService } from "../services/recommendationEngine";
import { runMigrations } from "../database/migrations/runMigrations";
import { seedDatabase } from "../database/seed/seedData";
import { createPick } from "../services/survivorService";
import { ImportService } from "../imports/importService";
import { FeatureStoreService } from "../feature_store/featureStoreService";
import { InventoryService } from "../inventory/services/inventoryService";
import { RecommendationEngineService } from "../recommendations/services/recommendationEngineService";
import { HistoricalSnapshotService } from "../history/services/historicalSnapshotService";
import { RecommendationSnapshotService } from "../history/services/recommendationSnapshotService";
import { AuditTrailService } from "../history/services/auditTrailService";
import { VersionTrackingService } from "../history/services/versionTrackingService";
import { MonteCarloSurvivorService } from "../simulation/services/MonteCarloSurvivorService";
import { WeeklyReportService } from "../reports/services/WeeklyReportService";
import { DocxExportService } from "../exports/services/DocxExportService";
import { HtmlExportService } from "../exports/services/HtmlExportService";
import { ResearchArtifactService } from "../exports/services/ResearchArtifactService";
import { PostgresValidationService } from "../postgres/services/PostgresValidationService";

import { WorkflowOrchestratorService } from "../orchestration/services/WorkflowOrchestratorService";
import { WorkflowStatusService } from "../orchestration/services/WorkflowStatusService";
import { workflowRunRepo } from "../repositories/index";

import { HealthCheckService } from "../system/services/HealthCheckService";
import { RemoteAccessStatusService } from "../system/services/RemoteAccessStatusService";
import { ApplicationLifecycleService } from "../system/services/ApplicationLifecycleService";
import { BuildMetadataService } from "../system/services/BuildMetadataService";
import { DatabaseHealthService } from "../database/services/DatabaseHealthService";
import { ScheduledWorkflowService } from "../scheduler/services/ScheduledWorkflowService";
import { DataIngestionService } from "../ingestion/services/DataIngestionService";
import { ReadinessTestingService } from "../testing/services/ReadinessTestingService";
import { HistoricalReplayService } from "../replay/services/HistoricalReplayService";
import { ReplayReportService } from "../replay/services/ReplayReportService";
import { WeeklyPipelineService } from "../pipeline/services/WeeklyPipelineService";
import { PipelineExecutionService } from "../pipeline/services/PipelineExecutionService";
import { AuthService } from "../auth/services/AuthService";
import { SessionService } from "../auth/services/SessionService";
import { AuthenticationMiddleware, RoleMiddleware } from "../auth/middleware/AuthMiddleware";
import { SecurityStatusService } from "../auth/services/SecurityStatusService";
import { EntryStrategyService } from "../services/EntryStrategyService";
import { FutureTeamValueService } from "../services/FutureTeamValueService";
import { SurvivorEquityService } from "../services/SurvivorEquityService";
import { RecommendationCandidateService } from "../services/RecommendationCandidateService";
import { OwnershipProjectionService } from "../services/OwnershipProjectionService";
import { ContestDynamicsService } from "../services/ContestDynamicsService";

const entryStrategyService = new EntryStrategyService();
const futureTeamValueService = new FutureTeamValueService();
const survivorEquityService = new SurvivorEquityService();
const recommendationCandidateService = new RecommendationCandidateService();
const ownershipProjectionService = new OwnershipProjectionService();
const contestDynamicsService = new ContestDynamicsService();

import { survivorStrategyService } from "../services/SurvivorStrategyService";
import { survivorRoadmapService } from "../services/SurvivorRoadmapService";
import { holidayReservationService } from "../services/HolidayReservationService";
import { contestRulesService } from "../services/ContestRulesService";
import { SurvivorStrategyType, HolidayType } from "../../src/types";
import { SurvivorRecommendationService } from "../services/SurvivorRecommendationService";
const survivorRecommendationService = new SurvivorRecommendationService();
import { RecommendationAuditService } from "../services/RecommendationAuditService";
const recommendationAuditService = new RecommendationAuditService();
import { RecommendationConfidenceService } from "../services/RecommendationConfidenceService";
const recommendationConfidenceService = new RecommendationConfidenceService();
import { RecommendationConsensusService } from "../services/RecommendationConsensusService";
import { RecommendationPortfolioOptimizerService } from "../services/RecommendationPortfolioOptimizerService";
import { ContestEVService } from "../services/ContestEVService";
import { OwnershipCalibrationService } from "../services/OwnershipCalibrationService";
import { MarketCalibrationService } from "../services/MarketCalibrationService";
import { ModelPerformanceService } from "../services/ModelPerformanceService";
import { RollingValidationService } from "../services/RollingValidationService";
import { ModelDriftService } from "../services/ModelDriftService";
import { AdaptiveModelWeightService } from "../services/AdaptiveModelWeightService";
import { EnsemblePredictionService } from "../services/EnsemblePredictionService";
import { DecisionPolicyService } from "../services/DecisionPolicyService";
import { SurvivorDecisionAgentService } from "../services/SurvivorDecisionAgentService";
import { SurvivorPlanningService } from "../services/SurvivorPlanningService";
import { ChampionshipPlanningService } from "../services/ChampionshipPlanningService";
import { DecisionAnalyticsService } from "../services/DecisionAnalyticsService";
import { LearningService } from "../services/LearningService";
import { ModelWeightingService } from "../services/ModelWeightingService";
import { RecommendationEvolutionService } from "../services/RecommendationEvolutionService";
import { RecommendationEvolutionTestingService } from "../testing/services/RecommendationEvolutionTestingService";
import { SurvivorStrategyTestingService } from "../testing/services/SurvivorStrategyTestingService";
import { UserAccessService } from "../services/UserAccessService";
import { ownerAccessService } from "../services/OwnerAccessService";
import { adaptiveModelWeightRepo, ensemblePredictionRepo, decisionPolicyRepo, survivorDecisionRepo, survivorPlanningRepo, championshipPlanningRepo, decisionAnalyticsRepo, recommendationEvolutionRepo } from "../repositories/index";

const router = Router();

const getAdminToken = (req: Request): string | undefined => {
  const customHeader = req.headers["x-admin-token"];
  if (typeof customHeader === "string") return customHeader;

  const authHeader = req.headers["authorization"];
  if (typeof authHeader === "string" && authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.substring(7);
  }

  if (typeof req.query.token === "string" && req.query.token) {
    return req.query.token;
  }

  return undefined;
};

const getCurrentUserFromReq = async (req: Request): Promise<any | null> => {
  if (!AuthService.isAuthEnabled()) {
    return await UserAccessService.getUserById("user-admin");
  }
  const token = getAdminToken(req);
  if (!token) return null;
  const status = AuthService.getAuthStatus(token);
  if (!status.authenticated) return null;

  const userId = UserAccessService.getSessionUserId(token);
  if (userId) {
    return await UserAccessService.getUserById(userId);
  } else if (status.session?.role === "ADMIN") {
    return await UserAccessService.getUserById("user-admin");
  }
  return null;
};

// Apply administrative and RBAC gateway controls across all protected api endpoints
router.use("/admin", AuthenticationMiddleware, RoleMiddleware("ADMIN"));
router.use("/orchestration", AuthenticationMiddleware, RoleMiddleware("ADMIN"));
router.use("/scheduler", AuthenticationMiddleware, RoleMiddleware("ADMIN"));
router.use("/ingestion", AuthenticationMiddleware, RoleMiddleware("ADMIN"));
router.use("/testing", AuthenticationMiddleware, RoleMiddleware("ADMIN"));
router.use("/replay", AuthenticationMiddleware, RoleMiddleware("ADMIN"));
router.use("/pipeline", AuthenticationMiddleware, RoleMiddleware("ADMIN"));

// Secure all general system status/utility parameters except public health checking
router.use("/system", (req: any, res: any, next: any) => {
  if (req.path === "/health") {
    return next();
  }
  return AuthenticationMiddleware(req, res, () => {
    return RoleMiddleware("ADMIN")(req, res, next);
  });
});



// Get Contests
router.get("/contests", async (req: Request, res: Response) => {
  try {
    const contests = await contestRepo.getAll();
    res.json(contests);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Contest Legs
router.get("/legs", async (req: Request, res: Response) => {
  try {
    const legs = await legRepo.getAll();
    res.json(legs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Teams
router.get("/teams", async (req: Request, res: Response) => {
  try {
    const teams = await teamRepo.getAll();
    res.json(teams);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Survivor Entries
router.get("/entries", async (req: Request, res: Response) => {
  try {
    const entries = await entryRepo.getAll();
    const metadataList = await entryStrategyService.getMetadata();
    // Filter out inactive entries (where active_flag === false)
    let activeEntries = entries.filter((entry: any) => {
      const meta = metadataList.find(m => m.entry_id === entry.id);
      return !meta || meta.active_flag !== false;
    });

    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      activeEntries = activeEntries.filter(e => e.owner_id === currentUser.owner_id);
    }

    res.json(activeEntries);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Survivor Entry
router.post("/entries", async (req: Request, res: Response) => {
  const { name, notes, contest_type_id } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }
  try {
    const currentUser = await getCurrentUserFromReq(req);
    const ownerId = (currentUser && currentUser.role !== "admin") ? currentUser.owner_id : null;
    const newEntry = await entryRepo.create({ name, notes, owner_id: ownerId, contest_type_id: contest_type_id || "circa" });
    res.json(newEntry);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Survivor Entry
router.delete("/entries/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      const entry = await entryRepo.getById(id);
      if (!entry || entry.owner_id !== currentUser.owner_id) {
        return res.status(403).json({ error: "Forbidden: You do not own this entry." });
      }
    }

    const success = await entryRepo.delete(id);
    if (!success) {
      return res.status(404).json({ error: "Entry not found" });
    }
    // Delete picks associated with entry
    await pickRepo.deleteByEntryId(id);
    res.json({ success: true, message: `Entry ${id} deleted.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Patch / Update Survivor Entry
router.patch("/entries/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, notes, status, contest_type_id } = req.body;
  try {
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      const entry = await entryRepo.getById(id);
      if (!entry || entry.owner_id !== currentUser.owner_id) {
        return res.status(403).json({ error: "Forbidden: You do not own this entry." });
      }
    }

    const updated = await entryRepo.update(id, { name, notes, status, contest_type_id });
    if (!updated) {
      return res.status(404).json({ error: "Entry not found" });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Active Contest Types
router.get("/contest-types", async (req: Request, res: Response) => {
  try {
    const contestTypes = await contestTypeRepo.getAllActive();
    res.json(contestTypes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Contest Type by ID
router.get("/contest-types/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const contestType = await contestTypeRepo.getById(id);
    if (!contestType) {
      return res.status(404).json({ error: "Contest type not found" });
    }
    res.json(contestType);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Contest Rules by Contest Type ID
router.get("/contest-types/:id/rules", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rules = contestRulesService.getRules(id);
    res.json({
      success: true,
      contestTypeId: rules.contestTypeId,
      name: rules.name,
      totalLegs: rules.totalLegs,
      usesThanksgivingLeg: rules.usesThanksgivingLeg,
      usesChristmasLeg: rules.usesChristmasLeg,
      usesHolidayReservations: rules.usesHolidayReservations,
      holidayLegs: rules.holidayLegs(),
      roadmapLegs: rules.roadmapLegs()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reset / Seed simulated database back to pristine mock template configurations
router.post("/admin/reset", async (req: Request, res: Response) => {
  try {
    if (useMock) {
      buildAndSeedMockState();
    } else {
      await runMigrations();
      await seedDatabase();
    }
    res.json({ success: true, message: useMock ? "Mock database reseeded to defaults." : "PostgreSQL database migrated and reseeded successfully." });
  } catch (err: any) {
    console.error("[Reset Endpoint Error] Failed:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get Picks for ALL or Single Entry
router.get("/picks", async (req: Request, res: Response) => {
  const { entry_id } = req.query;
  try {
    const currentUser = await getCurrentUserFromReq(req);

    if (entry_id && typeof entry_id === "string") {
      if (currentUser && currentUser.role !== "admin") {
        const entry = await entryRepo.getById(entry_id);
        if (!entry || entry.owner_id !== currentUser.owner_id) {
          return res.status(403).json({ error: "Forbidden: You do not own this entry." });
        }
      }
      const entryPicks = await pickRepo.getByEntryId(entry_id);
      return res.json(entryPicks);
    }

    let allPicks = await pickRepo.getAll();
    if (currentUser && currentUser.role !== "admin") {
      const myEntries = await entryRepo.getByOwnerId(currentUser.owner_id);
      const myEntryIds = new Set(myEntries.map(e => e.id));
      allPicks = allPicks.filter(p => myEntryIds.has(p.entry_id));
    }
    res.json(allPicks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Submit / Edit Locked Survivor Selection
router.post("/picks/make", async (req: Request, res: Response) => {
  const { entry_id, contest_leg_id, team_id } = req.body;

  if (!entry_id || !contest_leg_id || !team_id) {
    return res.status(400).json({ error: "Missing entry_id, contest_leg_id, or team_id" });
  }

  try {
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      const entry = await entryRepo.getById(entry_id);
      if (!entry || entry.owner_id !== currentUser.owner_id) {
        return res.status(403).json({ error: "Forbidden: You do not own this entry." });
      }
    }

    const result = await createPick(entry_id, contest_leg_id, team_id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Delete Pick
router.delete("/picks/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      const pick = await pickRepo.getById(id);
      if (pick) {
        const entry = await entryRepo.getById(pick.entry_id);
        if (!entry || entry.owner_id !== currentUser.owner_id) {
          return res.status(403).json({ error: "Forbidden: You do not own this pick's entry." });
        }
      }
    }

    const success = await pickRepo.delete(id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Games for leg
router.get("/games", async (req: Request, res: Response) => {
  const { leg_id } = req.query;
  try {
    if (leg_id && typeof leg_id === "string") {
      const legGames = await gameRepo.getByLegId(leg_id);
      return res.json(legGames);
    }
    const allGames = await gameRepo.getAll();
    res.json(allGames);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Lines for leg
router.get("/lines", async (req: Request, res: Response) => {
  const { leg_id } = req.query;
  try {
    if (leg_id && typeof leg_id === "string") {
      const legLines = await lineRepo.getByLegId(leg_id);
      return res.json(legLines);
    }
    const allLines = await lineRepo.getAll();
    res.json(allLines);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Recommendation Analytics Report
router.get("/recommendations", async (req: Request, res: Response) => {
  const { entry_id, leg_id } = req.query;

  if (!entry_id || !leg_id || typeof entry_id !== "string" || typeof leg_id !== "string") {
    return res.status(400).json({ error: "Missing entry_id or leg_id parameter" });
  }

  try {
    let entry = await entryRepo.getById(entry_id);
    if (!entry) {
      const allEntries = await entryRepo.getAll();
      entry = allEntries.find(e => e.id === entry_id || e.name === entry_id) || null;
    }

    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }

    const currentUser = await getCurrentUserFromReq(req);
    try {
      await ownerAccessService.checkEntryAccess(currentUser, entry_id);
    } catch (err: any) {
      return res.status(403).json({ error: err.message });
    }

    const currentLeg = await legRepo.getById(leg_id);
    if (!currentLeg) {
      return res.status(404).json({ error: "Leg not found" });
    }

    // Call the new highly advanced engine
    const recReport = await RecommendationEngineService.getEntryRecommendations(entry_id, leg_id);
    const snap = await InventoryService.compileInventorySnapshot(entry_id, leg_id);
    const allTeams = await teamRepo.getAll();
    const teamMap = new Map(allTeams.map(t => [t.id, t]));

    // Format new candidates directly into RecommendationResults for the legacy UI tables
    const formattedRecs = recReport.candidates
      .filter(c => c.is_available)
      .sort((a, b) => b.contest_equity_score.final_score - a.contest_equity_score.final_score)
      .slice(0, 5) // Return top 5
      .map(c => {
        const teamObj = teamMap.get(c.team_id)!;
        
        // Assemble dynamic insights using our rich natural language rationale generator
        const insight = `${c.rationale.survival_case} ${c.rationale.leverage_case} ${c.rationale.future_value_tradeoff} ${c.rationale.upset_risk_warning} ${c.rationale.holiday_inventory_impact}`;

        return {
          team: teamObj,
          insight,
          line: {
            id: `line-${recReport.contest_leg_id}-${c.team_id}`,
            team_id: c.team_id,
            contest_leg_id: recReport.contest_leg_id,
            win_probability: c.win_probability,
            pick_popularity: c.pick_popularity,
            future_value: c.future_value_score / 100.0, // scale for the UI multiplier progress bar
            contest_equity_score: c.contest_equity_score.final_score,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          available_team_flag: c.is_available,
          future_value_score: c.future_value_score,
          holiday_protection_score: snap.holiday_protection_score,
          inventory_depth_score: snap.inventory_depth,
          risk_score: c.risk_score,
          upset_probability: c.upset_probability,
          confidence_tier: c.confidence_tier
        };
      });

    const contestTypeId = entry.contest_type_id || "circa";
    const rules = contestRulesService.getRules(contestTypeId);

    res.json({
      entry,
      leg: currentLeg,
      used_teams: snap.used_teams,
      recommendations: formattedRecs,
      holiday_protection_score: snap.holiday_protection_score,
      inventory_depth_score: snap.inventory_depth,
      contest_type: contestTypeId,
      contest_name: rules.name,
      total_legs: rules.totalLegs,
      holiday_strategy_enabled: rules.usesHolidayReservations,
      recommendation_format: contestTypeId === "standard" ? "Standard" : "Circa Format"
    });
  } catch (err: any) {
    console.error("Error in GET /recommendations:", err);
    res.status(500).json({ error: err.message });
  }
});

// Import NFL Schedule CSV
router.post("/imports/nfl-schedule", async (req: Request, res: Response) => {
  const { fileName, csvText } = req.body;
  if (!csvText) {
    return res.status(400).json({ error: "csvText payload is required." });
  }
  try {
    const job = await ImportService.importNFLSchedule(fileName || "manual_schedule.csv", csvText);
    res.json(job);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Import Team Weekly Metrics CSV
router.post("/imports/team-metrics", async (req: Request, res: Response) => {
  const { fileName, csvText } = req.body;
  if (!csvText) {
    return res.status(400).json({ error: "csvText payload is required." });
  }
  try {
    const job = await ImportService.importTeamMetrics(fileName || "manual_metrics.csv", csvText);
    res.json(job);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Import PFF Spreadsheet CSV
router.post("/imports/pff", async (req: Request, res: Response) => {
  const { fileName, csvText } = req.body;
  if (!csvText) {
    return res.status(400).json({ error: "csvText payload is required." });
  }
  try {
    const job = await ImportService.importPFFSpreadsheet(fileName || "manual_pff.csv", csvText);
    res.json(job);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Manual Weekly Inputs Save & Propagated Derived Updates
router.post("/api/features/manual", async (req: Request, res: Response) => {
  try {
    const saved = await FeatureStoreService.saveWeeklyInput(req.body);
    res.json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Alias path to prevent any lookup ambiguity
router.post("/features/manual", async (req: Request, res: Response) => {
  try {
    const saved = await FeatureStoreService.saveWeeklyInput(req.body);
    res.json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Get Consolidated Features for Leg
router.get("/features/consolidated", async (req: Request, res: Response) => {
  const { leg_id } = req.query;
  if (!leg_id || typeof leg_id !== "string") {
    return res.status(400).json({ error: "Missing leg_id parameter" });
  }
  try {
    const data = await FeatureStoreService.getConsolidatedFeaturesForLeg(leg_id);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Feature definitions
router.get(["/features/definitions", "/api/features/definitions"], async (req: Request, res: Response) => {
  try {
    const definitions = await FeatureStoreService.getFeatureDefinitions();
    res.json(definitions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST Register feature definition
router.post(["/features/definitions", "/api/features/definitions"], async (req: Request, res: Response) => {
  try {
    const saved = await FeatureStoreService.registerFeatureDefinition(req.body);
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET Feature snapshots (all)
router.get(["/features/snapshots", "/api/features/snapshots"], async (req: Request, res: Response) => {
  try {
    const snapshots = await FeatureStoreService.getLatestFeatureSnapshots();
    res.json(snapshots);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Query historical feature snapshots by season & week query params
router.get(["/features/historical", "/api/features/historical"], async (req: Request, res: Response) => {
  const season = parseInt(req.query.season as string, 10);
  const week = parseInt(req.query.week as string, 10);
  if (isNaN(season) || isNaN(week)) {
    return res.status(400).json({ error: "Missing or invalid season or week query parameter." });
  }
  try {
    const data = await FeatureStoreService.queryHistoricalFeatures(season, week);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Feature build runs
router.get(["/features/build-runs", "/api/features/build-runs"], async (req: Request, res: Response) => {
  try {
    const runs = await FeatureStoreService.getFeatureBuildRuns();
    res.json(runs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST Build weekly feature snapshots
router.post(["/features/build", "/api/features/build"], async (req: Request, res: Response) => {
  const { season, week, notes } = req.body;
  if (season === undefined || week === undefined) {
    return res.status(400).json({ error: "season and week are required in body." });
  }
  try {
    const run = await FeatureStoreService.buildWeeklySnapshots(Number(season), Number(week), notes);
    res.status(202).json(run);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Audit Logs for Import Jobs
router.get("/imports/jobs", async (req: Request, res: Response) => {
  try {
    const jobs = await FeatureStoreService.getImportJobsAudit();
    res.json(jobs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Portfolio Recommendations
const getPortfolio = async (req: Request, res: Response) => {
  const { legId } = req.params;
  try {
    const portfolio = await RecommendationEngineService.getPortfolioRecommendations(legId);
    res.json(portfolio);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
router.get("/recommendations/portfolio/:legId", getPortfolio);
router.get("/api/recommendations/portfolio/:legId", getPortfolio);

// GET Candidates for Entry on Leg
const getCandidates = async (req: Request, res: Response) => {
  const { entryId, legId } = req.params;
  try {
    const currentUser = await getCurrentUserFromReq(req);
    try {
      await ownerAccessService.checkEntryAccess(currentUser, entryId);
    } catch (err: any) {
      if (err.message === "Entry not found") {
        return res.status(404).json({ error: "Entry not found" });
      }
      return res.status(403).json({ error: err.message });
    }

    const candidates = await RecommendationEngineService.compileCandidates(entryId, legId);
    res.json(candidates);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
router.get("/recommendations/candidates/:entryId/:legId", getCandidates);
router.get("/api/recommendations/candidates/:entryId/:legId", getCandidates);

// GET Entry Recommendations
const getEntryRec = async (req: Request, res: Response) => {
  const { entryId, legId } = req.params;
  try {
    const currentUser = await getCurrentUserFromReq(req);
    try {
      await ownerAccessService.checkEntryAccess(currentUser, entryId);
    } catch (err: any) {
      if (err.message === "Entry not found") {
        return res.status(404).json({ error: "Entry not found" });
      }
      return res.status(403).json({ error: err.message });
    }

    const recommendation = await RecommendationEngineService.getEntryRecommendations(entryId, legId);
    res.json(recommendation);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
router.get("/recommendations/:entryId/:legId", getEntryRec);
router.get("/api/recommendations/:entryId/:legId", getEntryRec);


/* ====================================================================
 * HISTORICAL SNAPSHOTS & DECISION AUDIT TRAIL API ROUTES
 * ==================================================================== */

// POST Capture Snapshots
router.post("/api/history/snapshots", async (req: Request, res: Response) => {
  try {
    const result = await HistoricalSnapshotService.captureSnapshots(req.body);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST Capture Recommendation Snapshot
router.post("/api/history/recommendation-snapshot", async (req: Request, res: Response) => {
  try {
    const result = await RecommendationSnapshotService.captureRecommendationSnapshot(req.body);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST Commit Decision Audit Record
router.post("/api/history/audit-trail", async (req: Request, res: Response) => {
  try {
    const result = await AuditTrailService.commitAuditRecord(req.body);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Snapshots by Week Number
router.get("/api/history/snapshots/week/:weekNumber", async (req: Request, res: Response) => {
  try {
    const week = parseInt(req.params.weekNumber, 10);
    if (isNaN(week)) {
      return res.status(400).json({ error: "Invalid weekNumber parameter" });
    }
    const result = await HistoricalSnapshotService.getSnapshotByWeek(week);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Snapshots by Contest Leg ID
router.get("/api/history/snapshots/leg/:legId", async (req: Request, res: Response) => {
  try {
    const result = await HistoricalSnapshotService.getSnapshotByContestLeg(req.params.legId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Recommendation Snapshot History
router.get("/api/history/recommendation-snapshot/history", async (req: Request, res: Response) => {
  try {
    const result = await RecommendationSnapshotService.getRecommendationHistory();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Snapshot Version History
router.get("/api/history/versions", async (req: Request, res: Response) => {
  try {
    const result = await HistoricalSnapshotService.getVersionHistory();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Full History Dataset Export
router.get("/api/history/export", async (req: Request, res: Response) => {
  try {
    const result = await HistoricalSnapshotService.exportFullHistoryDataset();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Decision Audit Record for a Leg
router.get("/api/history/audit-trail/leg/:legId", async (req: Request, res: Response) => {
  try {
    const result = await AuditTrailService.getAuditsByLeg(req.params.legId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


/* ====================================================================
 * MONTE CARLO SURVIVOR PLANNER API ROUTES
 * ==================================================================== */

// POST Run Entry Simulation
router.post("/api/simulation/run-entry", async (req: Request, res: Response) => {
  try {
    const { entryId, legId, config } = req.body;
    if (!entryId || !legId) {
      return res.status(400).json({ error: "Missing entryId or legId parameter" });
    }
    const result = await MonteCarloSurvivorService.runEntrySimulation(entryId, legId, config || {});
    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST Run Portfolio Simulation
router.post("/api/simulation/run-portfolio", async (req: Request, res: Response) => {
  try {
    const { legId, config } = req.body;
    if (!legId) {
      return res.status(400).json({ error: "Missing legId parameter" });
    }
    const result = await MonteCarloSurvivorService.runPortfolioSimulation(legId, config || {});
    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST Run Chalk Upset Scenario Custom Simulation
router.post("/api/simulation/run-chalk-upset", async (req: Request, res: Response) => {
  try {
    const { legId, config } = req.body;
    if (!legId) {
      return res.status(400).json({ error: "Missing legId parameter" });
    }
    const result = await MonteCarloSurvivorService.runChalkUpsetScenario(legId, config || {});
    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Compare Strategies for Selection Path
router.get("/api/simulation/compare-strategies/:entryId/:legId", async (req: Request, res: Response) => {
  try {
    const { entryId, legId } = req.params;
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      const entry = await entryRepo.getById(entryId);
      if (!entry || entry.owner_id !== currentUser.owner_id) {
        return res.status(403).json({ error: "Forbidden: You do not own this entry." });
      }
    }

    const result = await MonteCarloSurvivorService.compareStrategies(entryId, legId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Project Future Week Inventory Availability
router.get("/api/simulation/project-inventory/:entryId/:legId", async (req: Request, res: Response) => {
  try {
    const { entryId, legId } = req.params;
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      const entry = await entryRepo.getById(entryId);
      if (!entry || entry.owner_id !== currentUser.owner_id) {
        return res.status(403).json({ error: "Forbidden: You do not own this entry." });
      }
    }

    const result = await MonteCarloSurvivorService.projectFutureInventory(entryId, legId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* ====================================================================
 * WEEKLY REPORT GENERATION ENGINE API ROUTES
 * ==================================================================== */

// GET Get reports by contest ID and leg ID
router.get("/api/reports/:contestId/:legId", async (req: Request, res: Response) => {
  try {
    const { contestId, legId } = req.params;
    const reports = await WeeklyReportService.listWeeklyReports(contestId);
    const legReport = reports.find(r => r.contest_leg_id === legId);
    if (legReport) {
      return res.json(legReport);
    }
    // Pull on-the-fly if not built yet (mock seed fallback)
    const report = await WeeklyReportService.generateWeeklyReport(contestId, legId);
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Get single weekly report by report ID
router.get("/api/reports/:reportId", async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const report = await WeeklyReportService.getWeeklyReport(reportId);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST Generate weekly report for specified contest and leg
router.post("/api/reports/:contestId/:legId/generate", async (req: Request, res: Response) => {
  try {
    const { contestId, legId } = req.params;
    const config = req.body || {};
    const report = await WeeklyReportService.generateWeeklyReport(contestId, legId, config);
    res.status(201).json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* ====================================================================
 * DOCX / RESEARCH EXPORT ENGINE API ROUTES
 * ==================================================================== */

// POST Export weekly report to DOCX
router.post("/api/exports/reports/:reportId/docx", async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const config = req.body || {};
    const result = await DocxExportService.exportWeeklyReportToDocx(reportId, config);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST Export weekly report to HTML
router.post("/api/exports/reports/:reportId/html", async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const config = req.body || {};
    const result = await HtmlExportService.exportWeeklyReportToHtml(reportId, config);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST Compile and archive a Research Artifact
router.post("/api/exports/reports/:reportId/research-artifact", async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const config = req.body || {};
    const artifact = await ResearchArtifactService.createResearchArtifact(reportId, config);
    res.status(201).json(artifact);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Fetch research artifact details by identifier
router.get("/api/exports/artifacts/:artifactId", async (req: Request, res: Response) => {
  try {
    const { artifactId } = req.params;
    const artifact = await ResearchArtifactService.getResearchArtifact(artifactId);
    if (!artifact) {
      return res.status(404).json({ error: "Research artifact not found" });
    }
    res.json(artifact);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Fetch all artifacts belonging to a contest
router.get("/api/exports/contests/:contestId/artifacts", async (req: Request, res: Response) => {
  try {
    const { contestId } = req.params;
    const artifacts = await ResearchArtifactService.listResearchArtifacts(contestId);
    res.json(artifacts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* ====================================================================
 * WORKFLOW ORCHESTRATION ENGINE API ROUTES
 * ==================================================================== */

// POST Start or register a workflow run
router.post(["/orchestration/workflows/execute", "/api/orchestration/workflows/execute"], async (req: Request, res: Response) => {
  try {
    const payload = req.body || {};
    const run = await WorkflowOrchestratorService.startWorkflowExecution(payload);
    res.status(202).json(run);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET Fetch all/recent workflows logs/history
router.get(["/orchestration/workflows/runs", "/api/orchestration/workflows/runs"], async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const runs = await WorkflowStatusService.listRecentWorkflowRuns(limit);
    res.json(runs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Fetch overall statistics and execution KPI summaries
router.get(["/orchestration/workflows/summaries", "/api/orchestration/workflows/summaries"], async (req: Request, res: Response) => {
  try {
    const summary = await WorkflowStatusService.getWorkflowExecutionSummaries();
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Lookup workflow progress and step statuses by identifier
router.get(["/orchestration/workflows/runs/:runId/status", "/api/orchestration/workflows/runs/:runId/status"], async (req: Request, res: Response) => {
  try {
    const { runId } = req.params;
    const status = await WorkflowStatusService.lookupWorkflowStatus(runId);
    if (!status) {
      return res.status(404).json({ error: "Workflow run not found." });
    }
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Fetch complete raw run data by identifier
router.get(["/orchestration/workflows/runs/:runId", "/api/orchestration/workflows/runs/:runId"], async (req: Request, res: Response) => {
  try {
    const { runId } = req.params;
    const run = await workflowRunRepo.getRunById(runId);
    if (!run) {
      return res.status(404).json({ error: "Workflow run not found." });
    }
    res.json(run);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* ====================================================================
 * APPLICATION LIFECYCLE & LIVE HEALTH CHECK ENDPOINTS
 * ==================================================================== */

// GET Dynamic live health check across service instances
router.get("/system/health", async (req: Request, res: Response) => {
  try {
    const health = await HealthCheckService.checkSystemHealth();
    res.json(health);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Remote access status and deployment configuration metrics
router.get("/system/remote-access", (req: Request, res: Response) => {
  try {
    const status = RemoteAccessStatusService.getStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Full PostgreSQL Cutover Readiness System Report
router.get("/system/postgres-readiness", (req: Request, res: Response) => {
  try {
    const report = PostgresValidationService.runValidation();
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Detailed Postgres Env Settings Verification Checks
router.get("/system/postgres-validation", (req: Request, res: Response) => {
  try {
    const envAudit = PostgresValidationService.validateEnvironment();
    res.json(envAudit);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Detailed Repository Factory and Interface Resolver Checks
router.get("/system/repository-validation", (req: Request, res: Response) => {
  try {
    const repoAudit = PostgresValidationService.validateRepositories();
    res.json(repoAudit);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Detailed Schema Migrations List File Checks
router.get("/system/migration-validation", (req: Request, res: Response) => {
  try {
    const migrationAudit = PostgresValidationService.validateMigrationRegistry();
    res.json(migrationAudit);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Current general runtime state, validator feedback, and process uptime
router.get("/system/status", async (req: Request, res: Response) => {
  try {
    const status = ApplicationLifecycleService.getApplicationStatus();
    // Return precisely with "uptime" matching prompt requirements
    res.json({
      applicationState: status.applicationState,
      uptime: status.uptimeSeconds, // "uptime" requirement
      uptimeSeconds: status.uptimeSeconds, // fallback
      startedAt: status.startedAt,
      environment: status.environment,
      validation: status.validation
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Expose current product versions
router.get("/system/version", async (req: Request, res: Response) => {
  try {
    const versions = BuildMetadataService.getVersions();
    res.json(versions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Expose physical build artifacts, git commits, and compile timestamps
router.get("/system/build-info", async (req: Request, res: Response) => {
  try {
    const info = BuildMetadataService.getBuildMetadata();
    res.json(info);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Expose real-time relational database health, connectivity status, latency and pool metrics
router.get("/system/database", async (req: Request, res: Response) => {
  try {
    const health = await DatabaseHealthService.checkHealth();
    res.json({
      connected: health.mode === "mock" || health.connection.status === "online",
      databaseType: health.mode,
      poolActive: health.pool.totalConnections - health.pool.idleConnections,
      poolIdle: health.pool.idleConnections,
      migrationVersion: health.migrations.activeVersion,
      healthy: health.status === "healthy"
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Primary diagnostic/health state check for newly added storage layers
router.get("/system/project-memory", async (req: Request, res: Response) => {
  try {
    const latestMeta = await systemMetadataRepo.getLatest();
    if (!latestMeta) {
      return res.json({
        currentVersion: "v0.27",
        currentBranch: "main",
        currentTag: "v0.27-project-memory-foundation",
        hostname: "unknown",
        databaseStatus: useMock ? "MOCK" : "POSTGRES",
        startupTimestamp: new Date().toISOString()
      });
    }
    res.json({
      currentVersion: latestMeta.currentVersion,
      currentBranch: latestMeta.currentGitBranch,
      currentTag: latestMeta.currentGitTag,
      hostname: latestMeta.serverHostname,
      databaseStatus: useMock ? "MOCK" : "POSTGRES",
      startupTimestamp: latestMeta.lastStartupTimestamp
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET List of all application versions recorded in database
router.get("/system/versions", async (req: Request, res: Response) => {
  try {
    const versions = await applicationVersionsRepo.getAll();
    res.json(versions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET List of all project architectural and strategy decisions
router.get("/system/decisions", async (req: Request, res: Response) => {
  try {
    const decisions = await projectDecisionsRepo.getAll();
    res.json(decisions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST Register a database-persisted operations log event
router.post("/system/operations-events", async (req: Request, res: Response) => {
  try {
    const { eventType, severity, source, description, metadataJson } = req.body;
    if (!eventType || !severity || !source || !description) {
      return res.status(400).json({ error: "Missing required event registration fields." });
    }
    const newEvent = await operationsEventsRepo.create({
      eventType,
      severity,
      source,
      description,
      metadataJson: metadataJson || {}
    });
    res.status(201).json(newEvent);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET List all generated weekly reports across all contests
router.get(["/system/reports", "/api/system/reports"], async (req: Request, res: Response) => {
  try {
    const reports = await WeeklyReportService.getAllReports();
    res.json(reports);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET List all compiled research artifacts across all contests
router.get(["/system/exports/artifacts", "/api/system/exports/artifacts"], async (req: Request, res: Response) => {
  try {
    const artifacts = await ResearchArtifactService.getAllArtifacts();
    res.json(artifacts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* ====================================================================
 * SCHEDULED WORKFLOW ENGINE ENDPOINTS
 * ==================================================================== */

// GET List all schedules
router.get("/scheduler/schedules", async (req: Request, res: Response) => {
  try {
    const list = await ScheduledWorkflowService.listSchedules();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Fetch individual schedule by ID
router.get("/scheduler/schedules/:id", async (req: Request, res: Response) => {
  try {
    const schedule = await ScheduledWorkflowService.getSchedule(req.params.id);
    res.json(schedule);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// POST Create new schedule
router.post("/scheduler/schedules", async (req: Request, res: Response) => {
  try {
    const { name, description, workflowType, season, week, scheduleExpression, scheduleTimezone, metadata } = req.body;
    const schedule = await ScheduledWorkflowService.createSchedule({
      name,
      description,
      workflowType,
      season: String(season),
      week: Number(week),
      scheduleExpression,
      scheduleTimezone,
      metadata
    }, "admin");
    res.status(201).json(schedule);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH Update partial schedule attributes
router.patch("/scheduler/schedules/:id", async (req: Request, res: Response) => {
  try {
    const { name, description, workflowType, season, week, scheduleExpression, scheduleTimezone, metadata } = req.body;
    const schedule = await ScheduledWorkflowService.updateSchedule(req.params.id, {
      name,
      description,
      workflowType,
      season: season !== undefined ? String(season) : undefined,
      week: week !== undefined ? Number(week) : undefined,
      scheduleExpression,
      scheduleTimezone,
      metadata
    }, "admin");
    res.json(schedule);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST Enable schedule and calculate next run time
router.post("/scheduler/schedules/:id/enable", async (req: Request, res: Response) => {
  try {
    const schedule = await ScheduledWorkflowService.enableSchedule(req.params.id, "admin");
    res.json(schedule);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST Disable schedule
router.post("/scheduler/schedules/:id/disable", async (req: Request, res: Response) => {
  try {
    const schedule = await ScheduledWorkflowService.disableSchedule(req.params.id, "admin");
    res.json(schedule);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST Pause schedule
router.post("/scheduler/schedules/:id/pause", async (req: Request, res: Response) => {
  try {
    const schedule = await ScheduledWorkflowService.pauseSchedule(req.params.id, "admin");
    res.json(schedule);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST Manually execute scheduled workflow run
router.post("/scheduler/schedules/:id/trigger", async (req: Request, res: Response) => {
  try {
    const run = await ScheduledWorkflowService.triggerScheduleManually(req.params.id, "admin");
    res.json(run);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Extract all executions/runs belonging to this schedule
router.get("/scheduler/schedules/:id/runs", async (req: Request, res: Response) => {
  try {
    const runs = await ScheduledWorkflowService.listScheduledRuns(req.params.id);
    res.json(runs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* ====================================================================
 * DATA INGESTION FRAMEWORK ENDPOINTS
 * ==================================================================== */

// GET List sources
router.get("/ingestion/sources", async (req: Request, res: Response) => {
  try {
    const list = await DataIngestionService.listSources();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Fetch individual source
router.get("/ingestion/sources/:id", async (req: Request, res: Response) => {
  try {
    const source = await DataIngestionService.getSource(req.params.id);
    res.json(source);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// POST Create data source
router.post("/ingestion/sources", async (req: Request, res: Response) => {
  try {
    const { name, description, adapterType, metadata } = req.body;
    const source = await DataIngestionService.createSource({
      name,
      description,
      adapterType,
      metadata
    });
    res.status(201).json(source);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH Update partial source fields
router.patch("/ingestion/sources/:id", async (req: Request, res: Response) => {
  try {
    const source = await DataIngestionService.updateSource(req.params.id, req.body);
    res.json(source);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST Enable source
router.post("/ingestion/sources/:id/enable", async (req: Request, res: Response) => {
  try {
    const source = await DataIngestionService.enableSource(req.params.id);
    res.json(source);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST Disable source
router.post("/ingestion/sources/:id/disable", async (req: Request, res: Response) => {
  try {
    const source = await DataIngestionService.disableSource(req.params.id);
    res.json(source);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET List ingestion jobs
router.get("/ingestion/jobs", async (req: Request, res: Response) => {
  try {
    const list = await DataIngestionService.listJobs();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST Create new ingestion job
router.post("/ingestion/jobs", async (req: Request, res: Response) => {
  try {
    const { name, description, importType, sourceId, metadata } = req.body;
    const job = await DataIngestionService.createJob({
      name,
      description,
      importType,
      sourceId,
      metadata
    });
    res.status(201).json(job);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH Update partial job attributes
router.patch("/ingestion/jobs/:id", async (req: Request, res: Response) => {
  try {
    const job = await DataIngestionService.updateJob(req.params.id, req.body);
    res.json(job);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST Run single ingestion job
router.post("/ingestion/jobs/:id/run", async (req: Request, res: Response) => {
  try {
    const run = await DataIngestionService.runImport(req.params.id, "admin");
    res.json(run);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Fetch multiple ingestion runs history log
router.get("/ingestion/runs", async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const list = await DataIngestionService.listImportRuns(limit);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Fetch individual run log by ID
router.get("/ingestion/runs/:id", async (req: Request, res: Response) => {
  try {
    const run = await DataIngestionService.getImportRun(req.params.id);
    res.json(run);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

/* ====================================================================
 * PRESEASON READINESS TESTING FRAMEWORK ENDPOINTS
 * ==================================================================== */

router.get("/testing/readiness", async (req: Request, res: Response) => {
  try {
    const scorecard = await ReadinessTestingService.runFullCertification();
    res.json(scorecard);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/testing/workflows", async (req: Request, res: Response) => {
  try {
    const result = await ReadinessTestingService.runWorkflowTests();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/testing/scheduler", async (req: Request, res: Response) => {
  try {
    const result = await ReadinessTestingService.runSchedulerTests();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/testing/ingestion", async (req: Request, res: Response) => {
  try {
    const result = await ReadinessTestingService.runIngestionTests();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/testing/reporting", async (req: Request, res: Response) => {
  try {
    const result = await ReadinessTestingService.runReportingTests();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/testing/exports", async (req: Request, res: Response) => {
  try {
    const result = await ReadinessTestingService.runExportTests();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* ====================================================================
 * HISTORICAL REPLAY ENGINE ENDPOINTS
 * ==================================================================== */

// GET /replay/seasons
router.get("/replay/seasons", async (req: Request, res: Response) => {
  try {
    const seasons = HistoricalReplayService.getAvailableSeasons();
    res.json(seasons);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /replay/seasons/:season
router.get("/replay/seasons/:season", async (req: Request, res: Response) => {
  try {
    const season = HistoricalReplayService.getSeason(req.params.season);
    res.json(season);
  } catch (err: any) {
    res.status(404).json({ error: `Season ${req.params.season} not found: ${err.message}` });
  }
});

// POST /replay/execute
router.post("/replay/execute", async (req: Request, res: Response) => {
  try {
    const { season, strategyPreference, startWeek, endWeek } = req.body;
    
    const config = {
      season: season || "2023",
      strategyPreference: strategyPreference || "safe",
      startWeek: parseInt(startWeek) || 1,
      endWeek: parseInt(endWeek) || 18
    };

    const execution = await HistoricalReplayService.executeReplay(config);
    res.status(201).json(execution);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /replay/executions
router.get("/replay/executions", async (req: Request, res: Response) => {
  try {
    const executions = HistoricalReplayService.getExecutions();
    res.json(executions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /replay/executions/:id
router.get("/replay/executions/:id", async (req: Request, res: Response) => {
  try {
    const execution = HistoricalReplayService.getExecutionById(req.params.id);
    if (!execution) {
      return res.status(404).json({ error: `Replay execution with ID ${req.params.id} not found.` });
    }
    
    const markdownReport = ReplayReportService.generateMarkdownReport(execution);
    res.json({
      ...execution,
      markdownReport
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* ====================================================================
 * AUTOMATED WEEKLY PIPELINE ENDPOINTS
 * ==================================================================== */

// GET /pipeline/status
router.get("/pipeline/status", async (req: Request, res: Response) => {
  try {
    const runs = PipelineExecutionService.getExecutions();
    if (runs.length === 0) {
      return res.json({ status: "IDLE", latestExecution: null });
    }
    const latest = runs[runs.length - 1];
    res.json({
      status: latest.status === "RUNNING" ? "RUNNING" : "IDLE",
      latestExecution: latest
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /pipeline/history
router.get("/pipeline/history", async (req: Request, res: Response) => {
  try {
    const history = WeeklyPipelineService.getPipelineHistory();
    res.json(history);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /pipeline/summary
router.get("/pipeline/summary", async (req: Request, res: Response) => {
  try {
    const summary = WeeklyPipelineService.getPipelineSummary();
    if (!summary) {
      return res.status(404).json({ error: "No completed pipeline execution summarized yet." });
    }
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /pipeline/execute
router.post("/pipeline/execute", async (req: Request, res: Response) => {
  try {
    const newExecution = await WeeklyPipelineService.executeWeeklyPipeline();
    res.status(201).json(newExecution);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /pipeline/executions/:id
router.get("/pipeline/executions/:id", async (req: Request, res: Response) => {
  try {
    const run = PipelineExecutionService.getExecutionById(req.params.id);
    if (!run) {
      return res.status(404).json({ error: `Pipeline execution Run with ID ${req.params.id} not found.` });
    }
    res.json(run);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* ====================================================================
 * SECURE ADMIN ACCESS ENDPOINTS
 * ==================================================================== */

// GET /auth/status
router.get("/auth/status", async (req: Request, res: Response) => {
  try {
    const token = getAdminToken(req);
    const status = AuthService.getAuthStatus(token);
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* ====================================================================
 * ENTRY STRATEGY PROFILES FOUNDATION ENDPOINTS
 * ==================================================================== */

// GET all strategic entries with profiles/metadata combined
router.get("/api/strategies/entries", async (req: Request, res: Response) => {
  try {
    let list = await entryStrategyService.getAllStrategicEntries();
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      list = list.filter(e => e.owner_id === currentUser.owner_id);
    }
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET all strategy profiles
router.get("/api/strategies/profiles", async (req: Request, res: Response) => {
  try {
    let list = await entryStrategyService.getProfiles();
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      const myEntries = await entryRepo.getByOwnerId(currentUser.owner_id);
      const myEntryIds = new Set(myEntries.map(e => e.id));
      list = list.filter(p => myEntryIds.has(p.entry_id));
    }
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET all metadata records
router.get("/api/strategies/metadata", async (req: Request, res: Response) => {
  try {
    let list = await entryStrategyService.getMetadata();
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      const myEntries = await entryRepo.getByOwnerId(currentUser.owner_id);
      const myEntryIds = new Set(myEntries.map(e => e.id));
      list = list.filter(m => myEntryIds.has(m.entry_id));
    }
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET specific entry strategy details
router.get("/api/strategies/entry/:entryId", async (req: Request, res: Response) => {
  try {
    const { entryId } = req.params;
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      const entry = await entryRepo.getById(entryId);
      if (!entry || entry.owner_id !== currentUser.owner_id) {
        return res.status(403).json({ error: "Forbidden: You do not own this entry." });
      }
    }

    const details = await entryStrategyService.getEntryStrategyDetails(entryId);
    if (!details) {
      res.status(404).json({ error: "Entry not found" });
    } else {
      res.json(details);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST save strategy profile
router.post("/api/strategies/profiles", async (req: Request, res: Response) => {
  try {
    const entryId = req.body.entry_id;
    if (entryId) {
      const currentUser = await getCurrentUserFromReq(req);
      if (currentUser && currentUser.role !== "admin") {
        const entry = await entryRepo.getById(entryId);
        if (!entry || entry.owner_id !== currentUser.owner_id) {
          return res.status(403).json({ error: "Forbidden: You do not own this entry." });
        }
      }
    }

    const profile = await entryStrategyService.saveProfile(req.body);
    res.status(200).json(profile);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST save metadata record
router.post("/api/strategies/metadata", async (req: Request, res: Response) => {
  try {
    const entryId = req.body.entry_id;
    if (entryId) {
      const currentUser = await getCurrentUserFromReq(req);
      if (currentUser && currentUser.role !== "admin") {
        const entry = await entryRepo.getById(entryId);
        if (!entry || entry.owner_id !== currentUser.owner_id) {
          return res.status(403).json({ error: "Forbidden: You do not own this entry." });
        }
      }
    }

    const metadata = await entryStrategyService.saveMetadata(req.body);
    res.status(200).json(metadata);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Joint diversification analysis
router.get("/api/strategies/portfolio/analyze/:groupName", async (req: Request, res: Response) => {
  try {
    const analysis = await entryStrategyService.analyzeDiversificationGroup(req.params.groupName);
    res.json(analysis);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* ====================================================================
 * SURVIVOR DECISION INTELLIGENCE STRATEGY & METRIC DEFINITIONS API
 * ==================================================================== */

// GET /api/entries/profiles (combined list of strategic entries)
router.get("/api/entries/profiles", async (req: Request, res: Response) => {
  try {
    let list = await entryStrategyService.getAllStrategicEntries();
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      list = list.filter(e => e.owner_id === currentUser.owner_id);
    }
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/entries/strategies (alias/fallback support)
router.get("/api/entries/strategies", async (req: Request, res: Response) => {
  try {
    let list = await entryStrategyService.getAllStrategicEntries();
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      list = list.filter(e => e.owner_id === currentUser.owner_id);
    }
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/entries/profile (idempotent updater for profile and metadata)
router.put("/api/entries/profile", async (req: Request, res: Response) => {
  try {
    const { 
      entry_id, 
      owner_name, 
      entry_description, 
      entry_notes,
      primary_goal, 
      secondary_goal, 
      active_flag,
      strategy_type,
      objective,
      risk_tolerance,
      diversification_group,
      marketplace_target,
      notes
    } = req.body;

    if (!entry_id) {
      return res.status(400).json({ error: "entry_id is required" });
    }

    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      const entry = await entryRepo.getById(entry_id);
      if (!entry || entry.owner_id !== currentUser.owner_id) {
        return res.status(403).json({ error: "Forbidden: You do not own this entry." });
      }
    }

    // Save/Update Metadata
    const metadata = await entryStrategyService.saveMetadata({
      entry_id,
      owner_name: owner_name || "Steve",
      entry_description: entry_description || "",
      entry_notes: entry_notes || "",
      primary_goal: primary_goal || "Maximize championship expected value",
      secondary_goal: secondary_goal || "",
      active_flag: active_flag !== false
    });

    // Save/Update Strategy Profile
    const profile = await entryStrategyService.saveProfile({
      entry_id,
      strategy_type: strategy_type || "CHAMPIONSHIP_EV",
      objective: objective || "Maximize championship expected value.",
      risk_tolerance: risk_tolerance || "MEDIUM",
      diversification_group: diversification_group || "",
      marketplace_target: marketplace_target || "NONE",
      notes: notes || ""
    });

    res.json({ success: true, metadata, profile });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/entries/strategy-definitions
router.get("/api/entries/strategy-definitions", async (req: Request, res: Response) => {
  res.json({
    CHAMPIONSHIP_EV: {
      name: "Championship EV Strategy",
      description: "Maximize extreme late-stage expected value. High risk tolerance. Holds premium teams (e.g. KC, SF, BUF) for maximum leverage on seasonal key legs."
    },
    PORTFOLIO_EV: {
      name: "Portfolio EV Strategy",
      description: "Performs joint portfolio optimization across multiple owned entries to avoid duplicate picks, lower correlation, and maximize combined expected value."
    },
    MARKETPLACE_SURVIVAL: {
      name: "Marketplace Survival",
      description: "Focuses on high-probability survival through mid-season to increase entry resale value in secondary marketplaces (e.g., Splash / Circa marketplace). Minimizes risk early."
    },
    GROUP_SURVIVAL: {
      name: "Group Survival",
      description: "Designed for department pools or multi-owner entries. Emphasizes group consensus, absolute safest paths, and extremely low volatility."
    }
  });
});

// GET /api/system/dashboard-definitions
router.get("/api/system/dashboard-definitions", async (req: Request, res: Response) => {
  res.json({
    CONTEST_STRATEGY_EQUITY: "Contest Strategy Equity combines win probability with pick leverage and future value constraints to evaluate the overall value of a particular choice.",
    FUTURE_VALUE_LOOKUPS: "Future Value ratings analyze the subsequent value of each NFL team across the remaining legs. Lower numbers mean the team is safe to burn now; higher numbers signify premium teams that should be preserved for key future weeks.",
    THANKSGIVING_SLATE: "The Thanksgiving holiday. A three-game special slate requiring precise, dedicated team selections. A key milestone for mid-season survival profiles.",
    NEXT_PLAYOFF_LEG: "Upcoming tournament legs or Christmas premium legs. Strategy-aware recommendation engines reserve top-shelf assets to protect this high-leverage slate."
  });
});

/* ====================================================================
 * FUTURE TEAM VALUE ENGINE ENDPOINTS
 * ==================================================================== */

// GET /api/future-value/latest
router.get("/api/future-value/latest", async (req: Request, res: Response) => {
  try {
    const list = await futureTeamValueService.getLatestBaseline();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/future-value/history
router.get("/api/future-value/history", async (req: Request, res: Response) => {
  try {
    const list = await futureTeamValueService.getHistory();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/future-value/rankings
router.get("/api/future-value/rankings", async (req: Request, res: Response) => {
  try {
    const season = (req.query.season || "2026").toString();
    const week = parseInt((req.query.week || "1").toString(), 10);
    const strategy = req.query.strategy ? (req.query.strategy).toString() : undefined;

    const list = await futureTeamValueService.getRankingsWithExplainability(
      season,
      week,
      strategy as any
    );
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/future-value/calculate
router.post("/api/future-value/calculate", async (req: Request, res: Response) => {
  try {
    const { season, week } = req.body || {};
    if (!season) {
      return res.status(400).json({ error: "Season is required" });
    }
    const weekNum = parseInt((week || "1").toString(), 10);
    if (isNaN(weekNum) || weekNum < 1 || weekNum > 18) {
      return res.status(400).json({ error: "Week must be between 1 and 18" });
    }

    const results = await futureTeamValueService.calculate(season, weekNum);
    res.json({ success: true, count: results.length, data: results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* ====================================================================
 * SURVIVOR EQUITY ENGINE ENDPOINTS
 * ==================================================================== */

// GET /api/survivor-equity/latest
router.get("/survivor-equity/latest", async (req: Request, res: Response) => {
  try {
    const list = await survivorEquityService.getLatest();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/survivor-equity/history
router.get("/survivor-equity/history", async (req: Request, res: Response) => {
  try {
    const list = await survivorEquityService.getHistory();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/survivor-equity/rankings
router.get("/survivor-equity/rankings", async (req: Request, res: Response) => {
  try {
    const season = (req.query.season || "2026").toString();
    const week = parseInt((req.query.week || "1").toString(), 10);
    const strategy = req.query.strategy ? (req.query.strategy).toString() : undefined;

    const list = await survivorEquityService.getRankingsWithExplainability(
      season,
      week,
      strategy as any
    );
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/survivor-equity/calculate
router.post("/survivor-equity/calculate", async (req: Request, res: Response) => {
  try {
    const { season, week } = req.body || {};
    if (!season) {
      return res.status(400).json({ error: "Season is required" });
    }
    const weekNum = parseInt((week || "1").toString(), 10);
    if (isNaN(weekNum) || weekNum < 1 || weekNum > 18) {
      return res.status(400).json({ error: "Week must be between 1 and 18" });
    }

    const results = await survivorEquityService.calculate(season, weekNum);
    res.json({ success: true, count: results.length, data: results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// GET /auth/users
router.get("/auth/users", async (req: Request, res: Response) => {
  try {
    const users = await UserAccessService.getAllUsers();
    res.json({ success: true, users });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/login
router.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { username, password, role } = req.body || {};
    const ipAddress = (req.ip || req.socket.remoteAddress || "unknown").toString();
    const userAgent = req.headers["user-agent"] || "unknown";

    if (username) {
      // High-fidelity role-based login
      const user = await UserAccessService.authenticate(username, password);
      if (user) {
        const session = SessionService.createSession(user.role === "admin" ? "ADMIN" : "USER");
        UserAccessService.setSessionUser(session.token, user.id);
        res.json({ success: true, session, user });
      } else {
        res.status(401).json({ success: false, error: "Invalid credentials." });
      }
    } else {
      // Legacy env-based admin login fallback
      const result = AuthService.createSession({
        password,
        role,
        ipAddress,
        userAgent
      });
      if (result.success) {
        res.json(result);
      } else {
        res.status(401).json(result);
      }
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/logout
router.post("/auth/logout", async (req: Request, res: Response) => {
  try {
    const token = getAdminToken(req);
    const ipAddress = (req.ip || req.socket.remoteAddress || "unknown").toString();
    const userAgent = req.headers["user-agent"] || "unknown";
    if (token) {
      AuthService.destroySession(token, ipAddress, userAgent);
      UserAccessService.clearSession(token);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /auth/session
router.get("/auth/session", async (req: Request, res: Response) => {
  try {
    const token = getAdminToken(req);
    const status = AuthService.getAuthStatus(token);
    
    let currentUser = null;
    if (token && status.authenticated) {
      const userId = UserAccessService.getSessionUserId(token);
      if (userId) {
        currentUser = await UserAccessService.getUserById(userId);
      } else if (status.session?.role === "ADMIN") {
        currentUser = await UserAccessService.getUserById("user-admin");
      }
    }

    res.json({
      enabled: status.enabled,
      authenticated: status.authenticated,
      session: status.session,
      user: currentUser
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /users/current
router.get("/users/current", async (req: Request, res: Response) => {
  try {
    const token = getAdminToken(req);
    if (!token) {
      return res.status(401).json({ error: "Unauthorized. No token provided." });
    }
    const status = AuthService.getAuthStatus(token);
    if (!status.authenticated) {
      return res.status(401).json({ error: "Unauthorized. Session expired." });
    }

    const userId = UserAccessService.getSessionUserId(token);
    let currentUser = null;
    if (userId) {
      currentUser = await UserAccessService.getUserById(userId);
    } else if (status.session?.role === "ADMIN") {
      currentUser = await UserAccessService.getUserById("user-admin");
    }

    if (!currentUser) {
      return res.status(404).json({ error: "User not found." });
    }

    res.json({ success: true, user: currentUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /owners/current-workspace
router.get("/owners/current-workspace", async (req: Request, res: Response) => {
  try {
    const token = getAdminToken(req);
    if (!token) {
      return res.status(401).json({ error: "Unauthorized. No token provided." });
    }
    const status = AuthService.getAuthStatus(token);
    if (!status.authenticated) {
      return res.status(401).json({ error: "Unauthorized. Session expired." });
    }

    const userId = UserAccessService.getSessionUserId(token);
    let currentUser = null;
    if (userId) {
      currentUser = await UserAccessService.getUserById(userId);
    } else if (status.session?.role === "ADMIN") {
      currentUser = await UserAccessService.getUserById("user-admin");
    }

    if (!currentUser) {
      return res.status(404).json({ error: "User not found." });
    }

    const season = (req.query.season as string) || "2026";
    const workspace = await ownerAccessService.getWorkspaceForUser(currentUser, season);
    res.json({ success: true, workspace });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/security/status - Protected Security status API
router.get("/admin/security/status", async (req: Request, res: Response) => {
  try {
    const status = await SecurityStatusService.getStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* ====================================================================
 * RECOMMENDATION CANDIDATE ENGINE ENDPOINTS (v0.33)
 * ==================================================================== */

// GET /api/recommendation-candidates/latest
router.get("/recommendation-candidates/latest", async (req: Request, res: Response) => {
  try {
    let list = await recommendationCandidateService.getLatest();
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      const myEntries = await entryRepo.getByOwnerId(currentUser.owner_id);
      const myEntryIds = new Set(myEntries.map(e => e.id));
      list = list.filter(item => myEntryIds.has(item.entry_id));
    }
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/recommendation-candidates/history
router.get("/recommendation-candidates/history", async (req: Request, res: Response) => {
  try {
    let list = await recommendationCandidateService.getHistory();
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      const myEntries = await entryRepo.getByOwnerId(currentUser.owner_id);
      const myEntryIds = new Set(myEntries.map(e => e.id));
      list = list.filter(item => myEntryIds.has(item.entry_id));
    }
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/recommendation-candidates/by-entry/:entryId
router.get("/recommendation-candidates/by-entry/:entryId", async (req: Request, res: Response) => {
  try {
    const { entryId } = req.params;
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      const entry = await entryRepo.getById(entryId);
      if (!entry || entry.owner_id !== currentUser.owner_id) {
        return res.status(403).json({ error: "Forbidden: You do not own this entry." });
      }
    }

    const list = await recommendationCandidateService.getByEntryId(entryId);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/recommendation-candidates/calculate
router.post("/recommendation-candidates/calculate", async (req: Request, res: Response) => {
  try {
    const { season, week } = req.body || {};
    if (!season) {
      return res.status(400).json({ error: "Season is required" });
    }
    const weekNum = parseInt((week || "1").toString(), 10);
    if (isNaN(weekNum) || weekNum < 1 || weekNum > 18) {
      return res.status(400).json({ error: "Week must be between 1 and 18" });
    }

    const results = await recommendationCandidateService.calculate(season, weekNum);
    res.json({ success: true, count: results.length, data: results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* ====================================================================
 * OWNERSHIP PROJECTION ENDPOINTS (v0.34)
 * ==================================================================== */

// GET /api/ownership/latest
router.get("/ownership/latest", async (req: Request, res: Response) => {
  try {
    const list = await ownershipProjectionService.getLatest();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ownership/history
router.get("/ownership/history", async (req: Request, res: Response) => {
  try {
    const list = await ownershipProjectionService.getHistory();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ownership/rankings
router.get("/ownership/rankings", async (req: Request, res: Response) => {
  try {
    const season = (req.query.season || "2026").toString();
    const week = parseInt((req.query.week || "1").toString(), 10);
    const list = await ownershipProjectionService.getRankings(season, week);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ownership/calculate
router.post("/ownership/calculate", async (req: Request, res: Response) => {
  try {
    const { season, week } = req.body || {};
    if (!season) {
      return res.status(400).json({ error: "Season is required" });
    }
    const weekNum = parseInt((week || "1").toString(), 10);
    if (isNaN(weekNum) || weekNum < 1 || weekNum > 18) {
      return res.status(400).json({ error: "Week must be between 1 and 18" });
    }

    const results = await ownershipProjectionService.calculate(season, weekNum);
    res.json({ success: true, count: results.length, data: results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* ====================================================================
 * CONTEST DYNAMICS SNAPSHOT ENDPOINTS (v0.34)
 * ==================================================================== */

// GET /api/contest-dynamics/latest
router.get("/contest-dynamics/latest", async (req: Request, res: Response) => {
  try {
    const list = await contestDynamicsService.getLatest();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/contest-dynamics/history
router.get("/contest-dynamics/history", async (req: Request, res: Response) => {
  try {
    const list = await contestDynamicsService.getHistory();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/contest-dynamics/rankings
router.get("/contest-dynamics/rankings", async (req: Request, res: Response) => {
  try {
    const season = (req.query.season || "2026").toString();
    const week = parseInt((req.query.week || "1").toString(), 10);
    const list = await contestDynamicsService.getRankings(season, week);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/contest-dynamics/calculate
router.post("/contest-dynamics/calculate", async (req: Request, res: Response) => {
  try {
    const { season, week } = req.body || {};
    if (!season) {
      return res.status(400).json({ error: "Season is required" });
    }
    const weekNum = parseInt((week || "1").toString(), 10);
    if (isNaN(weekNum) || weekNum < 1 || weekNum > 18) {
      return res.status(400).json({ error: "Week must be between 1 and 18" });
    }

    const results = await contestDynamicsService.calculate(season, weekNum);
    res.json({ success: true, count: results.length, data: results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* ====================================================================
 * SURVIVOR RECOMMENDATION ENDPOINTS (v0.35)
 * ==================================================================== */

// GET /api/recommendations/latest
router.get("/recommendations/latest", async (req: Request, res: Response) => {
  try {
    let list = await survivorRecommendationService.getLatest();
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      const myEntries = await entryRepo.getByOwnerId(currentUser.owner_id);
      const myEntryIds = new Set(myEntries.map(e => e.id));
      list = list.filter(item => myEntryIds.has(item.entry_id));
    }
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/recommendations/history
router.get("/recommendations/history", async (req: Request, res: Response) => {
  try {
    let list = await survivorRecommendationService.getHistory();
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      const myEntries = await entryRepo.getByOwnerId(currentUser.owner_id);
      const myEntryIds = new Set(myEntries.map(e => e.id));
      list = list.filter(item => myEntryIds.has(item.entry_id));
    }
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/recommendations/by-entry/:entryId
router.get("/recommendations/by-entry/:entryId", async (req: Request, res: Response) => {
  try {
    const { entryId } = req.params;
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      const entry = await entryRepo.getById(entryId);
      if (!entry || entry.owner_id !== currentUser.owner_id) {
        return res.status(403).json({ error: "Forbidden: You do not own this entry." });
      }
    }

    const list = await survivorRecommendationService.getByEntryId(entryId);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/recommendations/top
router.get("/recommendations/top", async (req: Request, res: Response) => {
  try {
    const limit = parseInt((req.query.limit || "5").toString(), 10);
    let list = await survivorRecommendationService.getTop(limit);
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      const myEntries = await entryRepo.getByOwnerId(currentUser.owner_id);
      const myEntryIds = new Set(myEntries.map(e => e.id));
      list = list.filter(item => myEntryIds.has(item.entry_id));
    }
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/recommendations/calculate
router.post("/recommendations/calculate", async (req: Request, res: Response) => {
  try {
    const { season, week } = req.body || {};
    if (!season) {
      return res.status(400).json({ error: "Season is required" });
    }
    const weekNum = parseInt((week || "1").toString(), 10);
    if (isNaN(weekNum) || weekNum < 1 || weekNum > 18) {
      return res.status(400).json({ error: "Week must be between 1 and 18" });
    }

    const results = await survivorRecommendationService.calculate(season, weekNum);
    res.json({ success: true, count: results.length, data: results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/recommendation-audits/latest
router.get("/recommendation-audits/latest", async (req: Request, res: Response) => {
  try {
    let list = await recommendationAuditService.getLatest();
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      const myEntries = await entryRepo.getByOwnerId(currentUser.owner_id);
      const myEntryIds = new Set(myEntries.map(e => e.id));
      list = list.filter(item => myEntryIds.has(item.entry_id));
    }
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/recommendation-audits/history
router.get("/recommendation-audits/history", async (req: Request, res: Response) => {
  try {
    let list = await recommendationAuditService.getAll();
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      const myEntries = await entryRepo.getByOwnerId(currentUser.owner_id);
      const myEntryIds = new Set(myEntries.map(e => e.id));
      list = list.filter(item => myEntryIds.has(item.entry_id));
    }
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/recommendation-audits/by-entry/:entryId
router.get("/recommendation-audits/by-entry/:entryId", async (req: Request, res: Response) => {
  try {
    const { entryId } = req.params;
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      const entry = await entryRepo.getById(entryId);
      if (!entry || entry.owner_id !== currentUser.owner_id) {
        return res.status(403).json({ error: "Forbidden: You do not own this entry." });
      }
    }

    const list = await recommendationAuditService.getByEntryId(entryId);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/recommendation-audits/by-team/:teamId
router.get("/recommendation-audits/by-team/:teamId", async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    let list = await recommendationAuditService.getByTeamId(teamId.toUpperCase());
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      const myEntries = await entryRepo.getByOwnerId(currentUser.owner_id);
      const myEntryIds = new Set(myEntries.map(e => e.id));
      list = list.filter(item => !item.entry_id || myEntryIds.has(item.entry_id));
    }
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/recommendation-audits/generate
router.post("/recommendation-audits/generate", async (req: Request, res: Response) => {
  try {
    const { season, week, calculationVersion } = req.body || {};
    if (!season) {
      return res.status(400).json({ error: "Season is required" });
    }
    const weekNum = parseInt((week || "1").toString(), 10);
    if (isNaN(weekNum) || weekNum < 1 || weekNum > 18) {
      return res.status(400).json({ error: "Week must be between 1 and 18" });
    }
    if (!calculationVersion) {
      return res.status(400).json({ error: "Calculation version is required" });
    }

    const audits = await recommendationAuditService.generateRecommendationAudits(season, weekNum, calculationVersion);
    res.json({ success: true, count: audits.length, data: audits });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/recommendation-confidence/latest
router.get("/recommendation-confidence/latest", async (req: Request, res: Response) => {
  try {
    let list = await recommendationConfidenceService.getLatest();
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      const myEntries = await entryRepo.getByOwnerId(currentUser.owner_id);
      const myEntryIds = new Set(myEntries.map(e => e.id));
      list = list.filter(item => myEntryIds.has(item.entry_id));
    }
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/recommendation-confidence/history
router.get("/recommendation-confidence/history", async (req: Request, res: Response) => {
  try {
    let list = await recommendationConfidenceService.getAll();
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      const myEntries = await entryRepo.getByOwnerId(currentUser.owner_id);
      const myEntryIds = new Set(myEntries.map(e => e.id));
      list = list.filter(item => myEntryIds.has(item.entry_id));
    }
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/recommendation-confidence/by-entry/:entryId
router.get("/recommendation-confidence/by-entry/:entryId", async (req: Request, res: Response) => {
  try {
    const { entryId } = req.params;
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      const entry = await entryRepo.getById(entryId);
      if (!entry || entry.owner_id !== currentUser.owner_id) {
        return res.status(403).json({ error: "Forbidden: You do not own this entry." });
      }
    }

    const list = await recommendationConfidenceService.getByEntryId(entryId);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/recommendation-confidence/top
router.get("/recommendation-confidence/top", async (req: Request, res: Response) => {
  try {
    const limit = parseInt((req.query.limit || "10").toString(), 10);
    let list = await recommendationConfidenceService.getTopConfidence(limit);
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      const myEntries = await entryRepo.getByOwnerId(currentUser.owner_id);
      const myEntryIds = new Set(myEntries.map(e => e.id));
      list = list.filter(item => myEntryIds.has(item.entry_id));
    }
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/recommendation-confidence/calculate
router.post("/recommendation-confidence/calculate", async (req: Request, res: Response) => {
  try {
    const { season, week, calculationVersion } = req.body || {};
    if (!season) {
      return res.status(400).json({ error: "Season is required" });
    }
    const weekNum = parseInt((week || "1").toString(), 10);
    if (isNaN(weekNum) || weekNum < 1 || weekNum > 18) {
      return res.status(400).json({ error: "Week must be between 1 and 18" });
    }
    if (!calculationVersion) {
      return res.status(400).json({ error: "Calculation version is required" });
    }

    const snapshots = await recommendationConfidenceService.calculate(season, weekNum, calculationVersion);
    res.json({ success: true, count: snapshots.length, data: snapshots });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/recommendation-consensus/latest
router.get("/recommendation-consensus/latest", async (req: Request, res: Response) => {
  try {
    let list = await RecommendationConsensusService.getLatest();
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      const myEntries = await entryRepo.getByOwnerId(currentUser.owner_id);
      const myEntryIds = new Set(myEntries.map(e => e.id));
      list = list.filter(item => myEntryIds.has(item.entry_id));
    }
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/recommendation-consensus/history
router.get("/recommendation-consensus/history", async (req: Request, res: Response) => {
  try {
    let list = await RecommendationConsensusService.getAll();
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      const myEntries = await entryRepo.getByOwnerId(currentUser.owner_id);
      const myEntryIds = new Set(myEntries.map(e => e.id));
      list = list.filter(item => myEntryIds.has(item.entry_id));
    }
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/recommendation-consensus/by-entry/:entryId
router.get("/recommendation-consensus/by-entry/:entryId", async (req: Request, res: Response) => {
  try {
    const { entryId } = req.params;
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      const entry = await entryRepo.getById(entryId);
      if (!entry || entry.owner_id !== currentUser.owner_id) {
        return res.status(403).json({ error: "Forbidden: You do not own this entry." });
      }
    }

    const list = await RecommendationConsensusService.getByEntryId(entryId);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/recommendation-consensus/top
router.get("/recommendation-consensus/top", async (req: Request, res: Response) => {
  try {
    const limit = parseInt((req.query.limit || "10").toString(), 10);
    let list = await RecommendationConsensusService.getTopConsensus(limit);
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      const myEntries = await entryRepo.getByOwnerId(currentUser.owner_id);
      const myEntryIds = new Set(myEntries.map(e => e.id));
      list = list.filter(item => myEntryIds.has(item.entry_id));
    }
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/recommendation-consensus/calculate
router.post("/recommendation-consensus/calculate", async (req: Request, res: Response) => {
  try {
    const { season, week, calculationVersion } = req.body || {};
    if (!season) {
      return res.status(400).json({ error: "Season is required" });
    }
    const weekNum = parseInt((week || "1").toString(), 10);
    if (isNaN(weekNum) || weekNum < 1 || weekNum > 18) {
      return res.status(400).json({ error: "Week must be between 1 and 18" });
    }
    if (!calculationVersion) {
      return res.status(400).json({ error: "Calculation version is required" });
    }

    const snapshots = await RecommendationConsensusService.calculateConsensus(season, weekNum, calculationVersion);
    res.json({ success: true, count: snapshots.length, data: snapshots });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/portfolio-optimizer/latest
router.get("/portfolio-optimizer/latest", async (req: Request, res: Response) => {
  try {
    const list = await RecommendationPortfolioOptimizerService.getLatest();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/portfolio-optimizer/history
router.get("/portfolio-optimizer/history", async (req: Request, res: Response) => {
  try {
    const list = await RecommendationPortfolioOptimizerService.getHistory();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/portfolio-optimizer/by-id/:portfolioId
router.get("/portfolio-optimizer/by-id/:portfolioId", async (req: Request, res: Response) => {
  try {
    const { portfolioId } = req.params;
    const list = await RecommendationPortfolioOptimizerService.getById(portfolioId);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/portfolio-optimizer/calculate
router.post("/portfolio-optimizer/calculate", async (req: Request, res: Response) => {
  try {
    const { season, week, calculationVersion } = req.body || {};
    if (!season) {
      return res.status(400).json({ error: "Season is required" });
    }
    const weekNum = parseInt((week || "1").toString(), 10);
    if (isNaN(weekNum) || weekNum < 1 || weekNum > 18) {
      return res.status(400).json({ error: "Week must be between 1 and 18" });
    }
    if (!calculationVersion) {
      return res.status(400).json({ error: "Calculation version is required" });
    }

    const list = await RecommendationPortfolioOptimizerService.calculate(season, weekNum, calculationVersion);
    res.json({ success: true, count: list.length, data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/contest-ev/latest
router.get("/contest-ev/latest", async (req: Request, res: Response) => {
  try {
    const list = await ContestEVService.getLatest();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/contest-ev/history
router.get("/contest-ev/history", async (req: Request, res: Response) => {
  try {
    const list = await ContestEVService.getHistory();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/contest-ev/:contestId
router.get("/contest-ev/:contestId", async (req: Request, res: Response) => {
  try {
    const { contestId } = req.params;
    const list = await ContestEVService.getById(contestId);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/contest-ev/generate
router.post("/contest-ev/generate", async (req: Request, res: Response) => {
  try {
    const { season, week, calculationVersion } = req.body || {};
    if (!season) {
      return res.status(400).json({ error: "Season is required" });
    }
    const weekNum = parseInt((week || "1").toString(), 10);
    if (isNaN(weekNum) || weekNum < 1 || weekNum > 18) {
      return res.status(400).json({ error: "Week must be between 1 and 18" });
    }
    if (!calculationVersion) {
      return res.status(400).json({ error: "Calculation version is required" });
    }

    const list = await ContestEVService.calculate(season, weekNum, calculationVersion);
    res.json({ success: true, count: list.length, data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ownership-calibration/latest
router.get("/ownership-calibration/latest", async (req: Request, res: Response) => {
  try {
    const list = await OwnershipCalibrationService.getLatest();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ownership-calibration/history
router.get("/ownership-calibration/history", async (req: Request, res: Response) => {
  try {
    const list = await OwnershipCalibrationService.getHistory();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ownership-calibration/:contestId
router.get("/ownership-calibration/:contestId", async (req: Request, res: Response) => {
  try {
    const { contestId } = req.params;
    const list = await OwnershipCalibrationService.getByContestId(contestId);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ownership-calibration/generate
router.post("/ownership-calibration/generate", async (req: Request, res: Response) => {
  try {
    const { season, week, calculationVersion } = req.body || {};
    if (!season) {
      return res.status(400).json({ error: "Season is required" });
    }
    const weekNum = parseInt((week || "1").toString(), 10);
    if (isNaN(weekNum) || weekNum < 1 || weekNum > 18) {
      return res.status(400).json({ error: "Week must be between 1 and 18" });
    }
    if (!calculationVersion) {
      return res.status(400).json({ error: "Calculation version is required" });
    }

    const list = await OwnershipCalibrationService.calculate(season, weekNum, calculationVersion);
    res.json({ success: true, count: list.length, data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/market-calibration/latest
router.get("/market-calibration/latest", async (req: Request, res: Response) => {
  try {
    const list = await MarketCalibrationService.getLatest();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/market-calibration/history
router.get("/market-calibration/history", async (req: Request, res: Response) => {
  try {
    const list = await MarketCalibrationService.getHistory();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/market-calibration/:gameId
router.get("/market-calibration/:gameId", async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const list = await MarketCalibrationService.getByGameId(gameId);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/market-calibration/generate
router.post("/market-calibration/generate", async (req: Request, res: Response) => {
  try {
    const { season, week, calculationVersion } = req.body || {};
    if (!season) {
      return res.status(400).json({ error: "Season is required" });
    }
    const weekNum = parseInt((week || "1").toString(), 10);
    if (isNaN(weekNum) || weekNum < 1 || weekNum > 18) {
      return res.status(400).json({ error: "Week must be between 1 and 18" });
    }
    if (!calculationVersion) {
      return res.status(400).json({ error: "Calculation version is required" });
    }

    const list = await MarketCalibrationService.calculate(season, weekNum, calculationVersion);
    res.json({ success: true, count: list.length, data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/model-performance/latest
router.get("/model-performance/latest", async (req: Request, res: Response) => {
  try {
    const list = await ModelPerformanceService.getLatest();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/model-performance/history
router.get("/model-performance/history", async (req: Request, res: Response) => {
  try {
    const list = await ModelPerformanceService.getHistory();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/model-performance/:modelName
router.get("/model-performance/:modelName", async (req: Request, res: Response) => {
  try {
    const { modelName } = req.params;
    const list = await ModelPerformanceService.getByModelName(modelName);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/model-performance/calculate
router.post("/model-performance/calculate", async (req: Request, res: Response) => {
  try {
    const { season, week, calculationVersion } = req.body || {};
    if (!season) {
      return res.status(400).json({ error: "Season is required" });
    }
    const weekNum = parseInt((week || "1").toString(), 10);
    if (isNaN(weekNum) || weekNum < 1 || weekNum > 18) {
      return res.status(400).json({ error: "Week must be between 1 and 18" });
    }
    const version = calculationVersion || "v1.0.0";

    const list = await ModelPerformanceService.calculate(season, weekNum, version);
    res.json({ success: true, count: list.length, data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rolling-validation/latest
router.get("/rolling-validation/latest", async (req: Request, res: Response) => {
  try {
    const list = await RollingValidationService.getLatest();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rolling-validation/history
router.get("/rolling-validation/history", async (req: Request, res: Response) => {
  try {
    const list = await RollingValidationService.getHistory();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rolling-validation/:model
router.get("/rolling-validation/:model", async (req: Request, res: Response) => {
  try {
    const { model } = req.params;
    const list = await RollingValidationService.getByModel(model);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rolling-validation/run
router.post("/rolling-validation/run", async (req: Request, res: Response) => {
  try {
    const { season, startWeek, endWeek, calculationVersion } = req.body || {};
    if (!season) {
      return res.status(400).json({ error: "Season is required" });
    }
    const startW = parseInt((startWeek || "1").toString(), 10);
    const endW = parseInt((endWeek || "1").toString(), 10);
    if (isNaN(startW) || startW < 1 || startW > 18 || isNaN(endW) || endW < 1 || endW > 18) {
      return res.status(400).json({ error: "startWeek and endWeek must be between 1 and 18" });
    }
    if (startW > endW) {
      return res.status(400).json({ error: "startWeek cannot be greater than endWeek" });
    }
    const version = calculationVersion || "v1.0.0";

    const list = await RollingValidationService.calculate(season, startW, endW, version);
    res.json({ success: true, count: list.length, data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/model-drift/latest
router.get("/model-drift/latest", async (req: Request, res: Response) => {
  try {
    const list = await ModelDriftService.getLatest();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/model-drift/history
router.get("/model-drift/history", async (req: Request, res: Response) => {
  try {
    const list = await ModelDriftService.getHistory();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/model-drift/:modelName
router.get("/model-drift/:modelName", async (req: Request, res: Response) => {
  try {
    const { modelName } = req.params;
    const list = await ModelDriftService.getByModel(modelName);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/model-drift/calculate
router.post("/model-drift/calculate", async (req: Request, res: Response) => {
  try {
    const { season, week, calculationVersion } = req.body || {};
    if (!season) {
      return res.status(400).json({ error: "Season is required" });
    }
    const w = parseInt((week || "1").toString(), 10);
    if (isNaN(w) || w < 1 || w > 18) {
      return res.status(400).json({ error: "Week must be between 1 and 18" });
    }
    const version = calculationVersion || "v1.0.0";

    const list = await ModelDriftService.calculate(season, w, version);
    res.json({ success: true, count: list.length, data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/model-weights/latest
router.get("/model-weights/latest", async (req: Request, res: Response) => {
  try {
    const list = await adaptiveModelWeightRepo.getLatestWeights();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/model-weights/history
router.get("/model-weights/history", async (req: Request, res: Response) => {
  try {
    const list = await adaptiveModelWeightRepo.getWeightsHistory();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/model-weights/:modelName
router.get("/model-weights/:modelName", async (req: Request, res: Response) => {
  try {
    const { modelName } = req.params;
    const list = await adaptiveModelWeightRepo.getWeightsByModel(modelName);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/model-weights/recalculate
router.post("/model-weights/recalculate", async (req: Request, res: Response) => {
  try {
    const { season, week, calculationVersion } = req.body || {};
    if (!season) {
      return res.status(400).json({ error: "Season is required" });
    }
    const w = parseInt((week || "1").toString(), 10);
    if (isNaN(w) || w < 1 || w > 18) {
      return res.status(400).json({ error: "Week must be between 1 and 18" });
    }
    const version = calculationVersion || "v1.0.0";

    const list = await AdaptiveModelWeightService.calculateWeights(season, w, version);
    res.json({ success: true, count: list.length, data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/decision-policies/latest
router.get("/decision-policies/latest", async (req: Request, res: Response) => {
  try {
    const list = await decisionPolicyRepo.getLatestPolicies();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/decision-policies/history
router.get("/decision-policies/history", async (req: Request, res: Response) => {
  try {
    const list = await decisionPolicyRepo.getPoliciesHistory();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/decision-policies/calculate
router.post("/decision-policies/calculate", async (req: Request, res: Response) => {
  try {
    const { season, week, calculationVersion } = req.body || {};
    if (!season) {
      return res.status(400).json({ error: "Season is required" });
    }
    const w = parseInt((week || "1").toString(), 10);
    if (isNaN(w) || w < 1 || w > 18) {
      return res.status(400).json({ error: "Week must be between 1 and 18" });
    }
    const version = calculationVersion || "v1.0.0";

    const list = await DecisionPolicyService.calculate(season, w, version);
    res.json({ success: true, count: list.length, data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/survivor-decisions/latest
router.get("/survivor-decisions/latest", async (req: Request, res: Response) => {
  try {
    const list = await survivorDecisionRepo.getLatestDecisions();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/survivor-decisions/history
router.get("/survivor-decisions/history", async (req: Request, res: Response) => {
  try {
    const list = await survivorDecisionRepo.getDecisionsHistory();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/survivor-decisions/calculate
router.post("/survivor-decisions/calculate", async (req: Request, res: Response) => {
  try {
    const { season, week, agentVersion } = req.body || {};
    if (!season) {
      return res.status(400).json({ error: "Season is required" });
    }
    const w = parseInt((week || "1").toString(), 10);
    if (isNaN(w) || w < 1 || w > 18) {
      return res.status(400).json({ error: "Week must be between 1 and 18" });
    }
    const version = agentVersion || "v0.49";

    const list = await SurvivorDecisionAgentService.calculate(season, w, version);
    res.json({ success: true, count: list.length, data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/survivor-plans/latest
router.get("/survivor-plans/latest", async (req: Request, res: Response) => {
  try {
    const list = await survivorPlanningRepo.getLatestPlans();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/survivor-plans/history
router.get("/survivor-plans/history", async (req: Request, res: Response) => {
  try {
    const list = await survivorPlanningRepo.getPlansHistory();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/survivor-plans/calculate
router.post("/survivor-plans/calculate", async (req: Request, res: Response) => {
  try {
    const { season, week, agentVersion } = req.body || {};
    if (!season) {
      return res.status(400).json({ error: "Season is required" });
    }
    const w = parseInt((week || "1").toString(), 10);
    if (isNaN(w) || w < 1 || w > 18) {
      return res.status(400).json({ error: "Week must be between 1 and 18" });
    }
    const version = agentVersion || "v0.50";

    const list = await SurvivorPlanningService.calculate(season, w, version);
    res.json({ success: true, count: list.length, data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/championship-plans/latest
router.get("/championship-plans/latest", async (req: Request, res: Response) => {
  try {
    const list = await championshipPlanningRepo.getLatestPlans();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/championship-plans/history
router.get("/championship-plans/history", async (req: Request, res: Response) => {
  try {
    const list = await championshipPlanningRepo.getPlansHistory();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/championship-plans/calculate
router.post("/championship-plans/calculate", async (req: Request, res: Response) => {
  try {
    const { season, week, agentVersion } = req.body || {};
    if (!season) {
      return res.status(400).json({ error: "Season is required" });
    }
    const w = parseInt((week || "1").toString(), 10);
    if (isNaN(w) || w < 1 || w > 18) {
      return res.status(400).json({ error: "Week must be between 1 and 18" });
    }
    const version = agentVersion || "v0.51";

    const list = await ChampionshipPlanningService.calculate(season, w, version);
    res.json({ success: true, count: list.length, data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/decision-analytics
router.get("/decision-analytics", async (req: Request, res: Response) => {
  try {
    const summaries = await DecisionAnalyticsService.getLatestSummaries();
    const history = await DecisionAnalyticsService.getHistory();
    res.json({ summaries, history });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/decision-analytics/evaluate-week
router.post("/decision-analytics/evaluate-week", async (req: Request, res: Response) => {
  try {
    const { season, week } = req.body || {};
    if (!season) {
      return res.status(400).json({ error: "Season is required" });
    }
    const w = parseInt((week || "1").toString(), 10);
    if (isNaN(w) || w < 1 || w > 18) {
      return res.status(400).json({ error: "Week must be between 1 and 18" });
    }

    const summary = await DecisionAnalyticsService.evaluateWeek(season, w);
    res.json({ success: true, data: summary });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/model-performance
router.get("/model-performance", async (req: Request, res: Response) => {
  try {
    const analytics = await ModelPerformanceService.getAnalytics();
    res.json(analytics);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/model-performance/recalculate
router.post("/model-performance/recalculate", async (req: Request, res: Response) => {
  try {
    const success = await ModelPerformanceService.recalculateHistory();
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/learning
router.get("/learning", async (req: Request, res: Response) => {
  try {
    const analytics = await LearningService.getAnalytics();
    res.json(analytics);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/learning/analyze-week
router.post("/learning/analyze-week", async (req: Request, res: Response) => {
  try {
    const { season, week } = req.body;
    if (!season || week === undefined) {
      res.status(400).json({ error: "Missing season or week parameter" });
      return;
    }
    const record = await LearningService.analyzeCompletedWeek(season, Number(week));
    res.json({ success: true, data: record });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/learning/rebuild-history
router.post("/learning/rebuild-history", async (req: Request, res: Response) => {
  try {
    const rebuildCount = await LearningService.rebuildHistory();
    res.json({ success: true, count: rebuildCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/model-reweights/active
router.get("/model-reweights/active", async (req: Request, res: Response) => {
  try {
    const weights = await ModelWeightingService.getActiveWeights();
    res.json(weights);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/model-reweights/history
router.get("/model-reweights/history", async (req: Request, res: Response) => {
  try {
    const { season, week } = req.query;
    const history = await ModelWeightingService.getWeightHistory(
      season ? String(season) : undefined,
      week ? Number(week) : undefined
    );
    res.json(history);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/model-reweights/adapt
router.post("/model-reweights/adapt", async (req: Request, res: Response) => {
  try {
    const { season, week, policyVersion } = req.body;
    if (!season || week === undefined) {
      res.status(400).json({ error: "Missing season or week parameter" });
      return;
    }
    const weights = await ModelWeightingService.adaptWeights(season, Number(week), policyVersion);
    res.json({ success: true, data: weights });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// === V056: Recommendation Evolution Tracking Endpoints ===

// GET /api/recommendation-evolution/history
router.get("/recommendation-evolution/history", async (req: Request, res: Response) => {
  try {
    const { season, week } = req.query;
    const history = await recommendationEvolutionRepo.getEvolutionHistory(
      season ? String(season) : undefined,
      week ? Number(week) : undefined
    );
    res.json(history);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/recommendation-evolution/summary
router.get("/recommendation-evolution/summary", async (req: Request, res: Response) => {
  try {
    const { season, week } = req.query;
    const summaries = await recommendationEvolutionRepo.getSummaries(
      season ? String(season) : undefined,
      week ? Number(week) : undefined
    );
    res.json(summaries);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/recommendation-evolution/events
router.get("/recommendation-evolution/events", async (req: Request, res: Response) => {
  try {
    const { recommendation_id } = req.query;
    const events = await recommendationEvolutionRepo.getChangeEvents(
      recommendation_id ? Number(recommendation_id) : undefined
    );
    res.json(events);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/recommendation-evolution/track
router.post("/recommendation-evolution/track", async (req: Request, res: Response) => {
  try {
    const { season, week, currentVersion } = req.body;
    if (!season || week === undefined || !currentVersion) {
      res.status(400).json({ error: "Missing season, week, or currentVersion parameter" });
      return;
    }
    const result = await RecommendationEvolutionService.trackEvolution(season, Number(week), String(currentVersion));
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/recommendation-evolution/evaluate
router.post("/recommendation-evolution/evaluate", async (req: Request, res: Response) => {
  try {
    const { season, week } = req.body;
    if (!season || week === undefined) {
      res.status(400).json({ error: "Missing season or week parameter" });
      return;
    }
    const result = await RecommendationEvolutionService.evaluateOutcomes(season, Number(week));
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/system/test-evolution
router.get("/system/test-evolution", async (req: Request, res: Response) => {
  try {
    const results = await RecommendationEvolutionTestingService.runAllTests();
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/system/test-strategy
router.get("/system/test-strategy", async (req: Request, res: Response) => {
  try {
    const results = await SurvivorStrategyTestingService.runAllTests();
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* ====================================================================
 * V057 - SURVIVOR STRATEGY, ROADMAP, & HOLIDAY RESERVATION API ROUTES
 * ==================================================================== */

// GET active strategy for entry
router.get("/survivor/entries/:entryId/strategy", async (req: Request, res: Response) => {
  try {
    const { entryId } = req.params;
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      const entry = await entryRepo.getById(entryId);
      if (!entry || entry.owner_id !== currentUser.owner_id) {
        return res.status(403).json({ error: "Forbidden: You do not own this entry." });
      }
    }

    const strategy = await survivorStrategyService.getActiveStrategy(entryId);
    res.json(strategy);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update strategy for entry
router.post("/survivor/entries/:entryId/strategy", async (req: Request, res: Response) => {
  try {
    const entryId = req.params.entryId || req.body.entry_id;
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      if (entryId) {
        const entry = await entryRepo.getById(entryId);
        if (!entry || entry.owner_id !== currentUser.owner_id) {
          return res.status(403).json({ error: "Forbidden: You do not own this entry." });
        }
      }
    }

    const updated = await survivorStrategyService.updateStrategy(req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Support standard PUT as well
router.put("/survivor/entries/:entryId/strategy", async (req: Request, res: Response) => {
  try {
    const entryId = req.params.entryId || req.body.entry_id;
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      if (entryId) {
        const entry = await entryRepo.getById(entryId);
        if (!entry || entry.owner_id !== currentUser.owner_id) {
          return res.status(403).json({ error: "Forbidden: You do not own this entry." });
        }
      }
    }

    const updated = await survivorStrategyService.updateStrategy(req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET latest roadmap for entry
router.get("/survivor/entries/:entryId/roadmap", async (req: Request, res: Response) => {
  try {
    const { entryId } = req.params;
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      const entry = await entryRepo.getById(entryId);
      if (!entry || entry.owner_id !== currentUser.owner_id) {
        return res.status(403).json({ error: "Forbidden: You do not own this entry." });
      }
    }

    const season = (req.query.season as string) || "2026";
    let data = await survivorRoadmapService.getLatestRoadmap(entryId, season);
    if (!data) {
      data = await survivorRoadmapService.generateRoadmap(entryId, season);
    }
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST regenerate roadmap for entry
router.post("/survivor/entries/:entryId/roadmap/regenerate", async (req: Request, res: Response) => {
  try {
    const { entryId } = req.params;
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      const entry = await entryRepo.getById(entryId);
      if (!entry || entry.owner_id !== currentUser.owner_id) {
        return res.status(403).json({ error: "Forbidden: You do not own this entry." });
      }
    }

    const season = (req.body.season as string) || (req.query.season as string) || "2026";
    const data = await survivorRoadmapService.generateRoadmap(entryId, season);
    res.json({ success: true, ...data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET holiday reservations for entry
router.get("/survivor/entries/:entryId/holiday-reservations", async (req: Request, res: Response) => {
  try {
    const { entryId } = req.params;
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      const entry = await entryRepo.getById(entryId);
      if (!entry || entry.owner_id !== currentUser.owner_id) {
        return res.status(403).json({ error: "Forbidden: You do not own this entry." });
      }
    }

    const season = (req.query.season as string) || "2026";
    let reservations = await holidayReservationService.getReservations(entryId, season);
    if (!reservations || reservations.length === 0) {
      const strat = await survivorStrategyService.getActiveStrategy(entryId);
      reservations = await holidayReservationService.generateReservations(entryId, season, strat.strategy_type);
    }
    res.json(reservations);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST update specific holiday reservation
router.post("/survivor/entries/:entryId/holiday-reservations", async (req: Request, res: Response) => {
  try {
    const entryId = req.params.entryId || req.body.entry_id;
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      if (entryId) {
        const entry = await entryRepo.getById(entryId);
        if (!entry || entry.owner_id !== currentUser.owner_id) {
          return res.status(403).json({ error: "Forbidden: You do not own this entry." });
        }
      }
    }

    const saved = await holidayReservationService.saveReservation(req.body);
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST regenerate holiday reservations
router.post("/survivor/entries/:entryId/holiday-reservations/regenerate", async (req: Request, res: Response) => {
  try {
    const { entryId } = req.params;
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      const entry = await entryRepo.getById(entryId);
      if (!entry || entry.owner_id !== currentUser.owner_id) {
        return res.status(403).json({ error: "Forbidden: You do not own this entry." });
      }
    }

    const season = (req.body.season as string) || (req.query.season as string) || "2026";
    const strat = await survivorStrategyService.getActiveStrategy(entryId);
    const reservations = await holidayReservationService.generateReservations(entryId, season, strat.strategy_type);
    res.json({ success: true, reservations });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET portfolio roadmaps for all active entries
router.get("/survivor/portfolio/roadmaps", async (req: Request, res: Response) => {
  try {
    const season = (req.query.season as string) || "2026";
    const roadmaps = await survivorRoadmapService.getPortfolioRoadmaps(season);

    // Filter by currentUser if not admin
    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      const myEntries = await entryRepo.getByOwnerId(currentUser.owner_id);
      const myEntryIds = new Set(myEntries.map(e => e.id));
      const filteredRoadmaps: Record<string, any> = {};
      for (const entryId of Object.keys(roadmaps)) {
        if (myEntryIds.has(entryId)) {
          filteredRoadmaps[entryId] = roadmaps[entryId];
        }
      }
      return res.json(filteredRoadmaps);
    }

    res.json(roadmaps);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST regenerate all portfolio roadmaps
router.post("/survivor/portfolio/roadmaps/regenerate", async (req: Request, res: Response) => {
  try {
    const season = (req.body.season as string) || (req.query.season as string) || "2026";

    const currentUser = await getCurrentUserFromReq(req);
    if (currentUser && currentUser.role !== "admin") {
      const myEntries = await entryRepo.getByOwnerId(currentUser.owner_id);
      const results = [];
      for (const entry of myEntries) {
        const r = await survivorRoadmapService.generateRoadmap(entry.id, season);
        results.push(r);
      }
      return res.json({ success: true, results });
    }

    const results = await survivorRoadmapService.generateAllRoadmaps(season);
    res.json({ success: true, results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ====================================================================
// CANONICAL TEAM ALIAS RESOLUTION LAYER ENDPOINTS
// ====================================================================

// GET /api/admin/data/team-aliases - Get all team aliases
router.get("/admin/data/team-aliases", async (req: Request, res: Response) => {
  try {
    const aliases = await teamAliasResolverService.listAliases();
    res.json(aliases);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/data/team-aliases/:teamId - Get aliases for a specific team
router.get("/admin/data/team-aliases/:teamId", async (req: Request, res: Response) => {
  try {
    const aliases = await teamAliasResolverService.listAliasesForTeam(req.params.teamId);
    res.json(aliases);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/data/resolve-team - Resolve team alias to canonical team
router.get("/admin/data/resolve-team", async (req: Request, res: Response) => {
  try {
    const value = req.query.value as string;
    const providerName = req.query.providerName as string;
    if (!value) {
      return res.status(400).json({ error: "Missing required parameter: value" });
    }

    const normalized = teamAliasResolverService.normalizeTeamAlias(value);
    const teamId = await teamAliasResolverService.resolveTeamId(value, providerName);
    const team = teamId ? await teamRepo.getById(teamId) : null;

    res.json({
      success: !!teamId,
      teamId,
      normalized,
      team
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/data/team-aliases - Create a new team alias
router.post("/admin/data/team-aliases", async (req: Request, res: Response) => {
  try {
    const { team_id, alias, provider_name, alias_type, active } = req.body;
    if (!team_id || !alias || !alias_type) {
      return res.status(400).json({ error: "Missing required fields: team_id, alias, alias_type" });
    }

    const newAlias = await teamAliasResolverService.createAlias({
      team_id,
      alias,
      provider_name: provider_name || null,
      alias_type,
      active: active !== false
    });
    res.status(201).json(newAlias);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/data/team-aliases/:id - Deactivate a team alias
router.delete("/api/admin/data/team-aliases/:id", async (req: Request, res: Response) => {
  try {
    const success = await teamAliasResolverService.deactivateAlias(req.params.id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/data/import-jobs - Get all import jobs
router.get("/admin/data/import-jobs", async (req: Request, res: Response) => {
  try {
    const jobs = await importJobRepo.getAll();
    res.json(jobs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/data/import-jobs/:id - Get import job by ID with details
router.get("/admin/data/import-jobs/:id", async (req: Request, res: Response) => {
  try {
    const job = await importJobRepo.getById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: "Import job not found" });
    }
    const files = await importJobRepo.getFilesByJobId(req.params.id);
    const errors = await importJobRepo.getErrorsByJobId(req.params.id);
    res.json({
      ...job,
      files,
      errors
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/data/import-jobs/preview - Preview schedule file
router.post("/admin/data/import-jobs/preview", async (req: Request, res: Response) => {
  try {
    const { filename, content, provider } = req.body;
    if (!filename || !content || !provider) {
      return res.status(400).json({ error: "Missing required fields: filename, content, provider" });
    }
    const preview = await scheduleImportService.previewImport(filename, content, provider);
    res.json(preview);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/data/import-jobs/import - Run import or dry_run pipeline
router.post("/admin/data/import-jobs/import", async (req: Request, res: Response) => {
  try {
    const { filename, content, provider, mode, initiated_by } = req.body;
    if (!filename || !content || !provider || !mode) {
      return res.status(400).json({ error: "Missing required fields: filename, content, provider, mode" });
    }
    
    if (mode === 'commit') {
      const summary = await weeklyPipelineCoordinator.runPipeline(filename, content, provider, initiated_by || 'admin');
      res.json(summary);
    } else {
      const summary = await scheduleImportService.runImport(filename, content, provider, 'dry_run', initiated_by || 'admin');
      res.json(summary);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/data/import-errors - Get all import errors
router.get("/api/admin/data/import-errors", async (req: Request, res: Response) => {
  try {
    const errors = await importJobRepo.getAllErrors();
    res.json(errors);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/data/pipeline-status - Get overall pipeline status summary
router.get("/api/admin/data/pipeline-status", async (req: Request, res: Response) => {
  try {
    const jobs = await importJobRepo.getAll();
    const errors = await importJobRepo.getAllErrors();
    const aliases = await teamAliasResolverService.listAliases();

    // Data Quality Summary
    const unknownAliasesCount = errors.filter(e => e.error_message.toLowerCase().includes("alias") || e.error_message.toLowerCase().includes("unresolved")).length;
    const duplicateGamesCount = errors.filter(e => e.error_message.toLowerCase().includes("duplicate") || e.error_message.toLowerCase().includes("exists")).length;
    
    res.json({
      recent_jobs: jobs.slice(0, 10),
      recent_errors: errors.slice(0, 20),
      total_aliases: aliases.length,
      data_quality_metrics: {
        total_errors: errors.length,
        unknown_aliases: unknownAliasesCount,
        duplicate_games: duplicateGamesCount,
        warnings_count: errors.filter(e => e.severity === 'warning').length,
        errors_count: errors.filter(e => e.severity === 'error').length
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;


