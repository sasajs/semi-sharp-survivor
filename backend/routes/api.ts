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
  useMock
} from "../repositories/index";
import { buildAndSeedMockState } from "../services/mockSeeder";
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

const router = Router();


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
    res.json(entries);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Survivor Entry
router.post("/entries", async (req: Request, res: Response) => {
  const { name, notes } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }
  try {
    const newEntry = await entryRepo.create({ name, notes });
    res.json(newEntry);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Survivor Entry
router.delete("/entries/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
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
  const { name, notes, status } = req.body;
  try {
    const updated = await entryRepo.update(id, { name, notes, status });
    if (!updated) {
      return res.status(404).json({ error: "Entry not found" });
    }
    res.json(updated);
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
    if (entry_id && typeof entry_id === "string") {
      const entryPicks = await pickRepo.getByEntryId(entry_id);
      return res.json(entryPicks);
    }
    const allPicks = await pickRepo.getAll();
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
    const entry = await entryRepo.getById(entry_id);
    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
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

    res.json({
      entry,
      leg: currentLeg,
      used_teams: snap.used_teams,
      recommendations: formattedRecs,
      holiday_protection_score: snap.holiday_protection_score,
      inventory_depth_score: snap.inventory_depth
    });
  } catch (err: any) {
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

export default router;
