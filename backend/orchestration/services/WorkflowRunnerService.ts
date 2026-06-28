import { 
  WorkflowRun, 
  WorkflowStep, 
  WorkflowStatus, 
  WorkflowType 
} from "../models";
import { 
  contestRepo, 
  legRepo, 
  entryRepo,
  gameRepo,
  workflowRunRepo 
} from "../../repositories";
import { ImportService } from "../../imports/importService";
import { FeatureStoreService } from "../../feature_store/featureStoreService";
import { InventoryService } from "../../inventory/services/inventoryService";
import { RiskEngineService } from "../../risk/services/riskEngineService";
import { RecommendationEngineService } from "../../recommendations/services/recommendationEngineService";
import { MonteCarloSurvivorService } from "../../simulation/services/MonteCarloSurvivorService";
import { WeeklyReportService } from "../../reports/services/WeeklyReportService";
import { ResearchArtifactService } from "../../exports/services/ResearchArtifactService";
import { WorkflowAuditService } from "./WorkflowAuditService";
import crypto from "crypto";

export class WorkflowRunnerService {
  /**
   * Safe entry-point to execute a workflow run, managing lifecycle transitions of steps.
   */
  static async executeWorkflow(runId: string): Promise<WorkflowRun> {
    const run = await workflowRunRepo.getRunById(runId);
    if (!run) {
      throw new Error(`Workflow run not found: ${runId}`);
    }

    // Mark workflow as running
    run.status = WorkflowStatus.RUNNING;
    run.startedAt = new Date().toISOString();
    await workflowRunRepo.updateRun(run);

    try {
      // 1. Resolve Contest and Contest Leg context based on season and week
      const contests = await contestRepo.getAll();
      const targetContest = contests.find(c => String(c.year) === String(run.season)) || contests[0];
      if (!targetContest) {
        throw new Error(`No active contest found for season ${run.season}`);
      }

      const legs = await legRepo.getAll();
      const targetLeg = legs.find(l => l.nfl_week === run.week) || legs[0];
      if (!targetLeg) {
        throw new Error(`No active contest leg found for contest ${targetContest.id} and week ${run.week}`);
      }

      const context = {
        contestId: targetContest.id,
        legId: targetLeg.id,
        weekNumber: run.week,
        season: run.season
      };

      let anyStepFailed = false;
      let allStepsSkipped = true;

      // 2. Sequentially process all predefined workflow steps
      for (let i = 0; i < run.steps.length; i++) {
        const step = run.steps[i];
        const isStepActive = this.isStepRequiredForType(step.name, run.workflowType);

        if (!isStepActive) {
          step.status = WorkflowStatus.SKIPPED;
          continue;
        }

        allStepsSkipped = false;
        step.status = WorkflowStatus.RUNNING;
        step.startedAt = new Date().toISOString();
        await workflowRunRepo.updateRun(run);

        try {
          const inputObj = { stepName: step.name, context };
          step.inputHash = crypto.createHash("sha256").update(JSON.stringify(inputObj)).digest("hex");

          // Execute physical application step
          const outputPayload = await this.executeStepAction(step.name, context);

          step.status = WorkflowStatus.SUCCEEDED;
          step.outputHash = crypto.createHash("sha256").update(JSON.stringify(outputPayload ?? {})).digest("hex");
          step.completedAt = new Date().toISOString();
          step.metadata = {
            ...step.metadata,
            execution_timestamp: step.completedAt,
            elapsed_ms: new Date(step.completedAt).getTime() - new Date(step.startedAt).getTime()
          };
        } catch (stepErr: any) {
          console.error(`[Workflow Engine] Critical step failure in ${step.name}:`, stepErr);
          step.status = WorkflowStatus.FAILED;
          step.errorMessage = stepErr.message || "Unknown execution exception";
          step.completedAt = new Date().toISOString();
          anyStepFailed = true;
          break; // Stop execution on any fatal synchronous step failure
        }

        // Persist progress incrementally
        await workflowRunRepo.updateRun(run);
      }

      // 3. Conclude overall workflow run status
      if (anyStepFailed) {
        run.status = WorkflowStatus.FAILED;
        run.errorMessage = "Workflow execution stopped due to step failure.";
      } else if (allStepsSkipped) {
        run.status = WorkflowStatus.SKIPPED;
      } else {
        run.status = WorkflowStatus.SUCCEEDED;
      }

    } catch (globalErr: any) {
      console.error(`[Workflow Engine] Fatal orchestrator failure:`, globalErr);
      run.status = WorkflowStatus.FAILED;
      run.errorMessage = globalErr.message || "Global workflow orchestration error";
    }

    run.completedAt = new Date().toISOString();
    run.metadata = {
      ...run.metadata,
      completed_at: run.completedAt,
      workflow_hash: WorkflowAuditService.createExecutionHash(run)
    };

    // Update the record with full complete stats
    await workflowRunRepo.updateRun(run);

    return run;
  }

  /**
   * Helper mapping logical step types to Workflow execution triggers.
   */
  private static isStepRequiredForType(stepName: string, wType: WorkflowType): boolean {
    if (wType === WorkflowType.FULL_WEEKLY_RESEARCH) return true;

    switch (stepName) {
      case "DATA_IMPORT":
        return wType === WorkflowType.IMPORT_ONLY;
      case "FEATURE_STORE_REFRESH":
        return wType === WorkflowType.FEATURE_REFRESH_ONLY;
      case "INVENTORY_CALCULATION":
        // Fallback or specific to recommendations/full paths
        return false;
      case "RISK_CALCULATION":
        return false;
      case "RECOMMENDATION_GENERATION":
        return wType === WorkflowType.RECOMMENDATION_ONLY;
      case "MONTE_CARLO_SIMULATION":
        return wType === WorkflowType.SIMULATION_ONLY;
      case "WEEKLY_REPORT_GENERATION":
        return wType === WorkflowType.REPORT_ONLY;
      case "RESEARCH_EXPORT_GENERATION":
        return wType === WorkflowType.EXPORT_ONLY;
      default:
        return false;
    }
  }

  /**
   * Core dispatcher binding individual steps to their real backend service counterparts.
   */
  private static async executeStepAction(stepName: string, context: { contestId: string; legId: string; weekNumber: number; season: string | number }): Promise<any> {
    switch (stepName) {
      case "DATA_IMPORT":
        // Run import check. If there are no games, fallback trigger to importing standard elements
        const games = await gameRepo.getByLegId(context.legId);
        if (games.length === 0) {
          // Pre-seed some game info
          await ImportService.importNFLSchedule("nfl_weekly_schedule.csv", `week_number,home_team,away_team,game_time\n${context.weekNumber},SF,KC,2026-09-12T17:00:00Z`);
        }
        return { status: "imports_redefined", totalGames: (await gameRepo.getByLegId(context.legId)).length };

      case "FEATURE_STORE_REFRESH":
        const buildRun = await FeatureStoreService.buildWeeklySnapshots(
          Number(context.season),
          Number(context.weekNumber),
          `Automated workflow build run, triggered by workflow step FEATURE_STORE_REFRESH`
        );
        const features = await FeatureStoreService.getConsolidatedFeaturesForLeg(context.legId);
        return { 
          features_restored: features.length,
          feature_store_build_id: buildRun.run_id,
          feature_store_status: buildRun.status,
          feature_store_count: buildRun.feature_count
        };

      case "INVENTORY_CALCULATION":
        const entries = await entryRepo.getAll();
        const compiled = [];
        for (const ent of entries) {
          const snapshot = await InventoryService.compileInventorySnapshot(ent.id, context.legId);
          compiled.push(snapshot.id);
        }
        return { snapshots_compiled: compiled.length };

      case "RISK_CALCULATION":
        const legGames = await gameRepo.getByLegId(context.legId);
        const risks = [];
        for (const gm of legGames) {
          const r = await RiskEngineService.assessGameRisk(gm.id, context.legId);
          risks.push(r.id);
        }
        return { risk_analyses_run: risks.length };

      case "RECOMMENDATION_GENERATION":
        const recommendations = await RecommendationEngineService.getPortfolioRecommendations(context.legId);
        try {
          const entriesList = await entryRepo.getAll();
          const recRecords: any[] = [];
          for (const ent of entriesList) {
            const recReport = await RecommendationEngineService.getEntryRecommendations(ent.id, context.legId);
            if (recReport && recReport.candidates) {
              const topCand = recReport.candidates
                .filter(c => c.is_available)
                .sort((a, b) => b.contest_equity_score.final_score - a.contest_equity_score.final_score)[0];
              if (topCand) {
                recRecords.push({
                  season: context.season.toString(),
                  week: context.weekNumber,
                  contest_id: context.contestId,
                  recommendation_id: `rec-${context.legId}-${ent.id}`,
                  engine_version: "v0.52",
                  model_hash: "sha256-dec-analytics-v052",
                  policy_version: "v0.48",
                  data_version: "v0.47",
                  workflow_version: "v1.0.0",
                  recommendation_type: "survivor_primary",
                  selected_team: topCand.team_id,
                  projected_survival_probability: topCand.win_probability,
                  projected_championship_probability: topCand.contest_equity_score.final_score / 100.0,
                  projected_expected_value: topCand.win_probability * 1.5,
                  projected_future_value: topCand.future_value_score,
                  recommendation_rank: 1,
                  confidence_score: (topCand.confidence_tier as any) === "Very High" ? 95 : ((topCand.confidence_tier as any) === "High" ? 85 : 70)
                });
              }
            }
          }
          if (recRecords.length > 0) {
            const { DecisionAnalyticsService } = await import("../../services/DecisionAnalyticsService");
            await DecisionAnalyticsService.recordDecisionMany(recRecords);
            console.log(`[Workflow Integration] Automatically logged ${recRecords.length} decision recommendations for continuous performance tracking.`);
          }
        } catch (eError) {
          console.error("[Workflow Integration] Non-blocking failure logging decisions during recommendation generation:", eError);
        }
        return { recommendations_generated: recommendations.id };

      case "MONTE_CARLO_SIMULATION":
        const simRun = await MonteCarloSurvivorService.runPortfolioSimulation(context.legId, { iterations: 1000, strategy_profile: "balanced" });
        return { sim_run_id: simRun.id };

      case "WEEKLY_REPORT_GENERATION":
        const report = await WeeklyReportService.generateWeeklyReport(context.contestId, context.legId);
        try {
          const { DecisionAnalyticsService } = await import("../../services/DecisionAnalyticsService");
          await DecisionAnalyticsService.evaluateWeek(context.season.toString(), context.weekNumber);
          console.log(`[Workflow Integration] Automatically evaluated decision outcomes and performance metrics for Week ${context.weekNumber}.`);
        } catch (evalError) {
          console.error("[Workflow Integration] Non-blocking failure performing decision evaluation during weekly report generation:", evalError);
        }
        return { report_id: report.id };

      case "RESEARCH_EXPORT_GENERATION":
        const reportsList = await WeeklyReportService.listWeeklyReports(context.contestId);
        const matchedReport = reportsList.find(r => r.contest_leg_id === context.legId);
        if (!matchedReport) {
          throw new Error("Weekly report not prepared yet for research artifacts.");
        }
        const artifact = await ResearchArtifactService.createResearchArtifact(matchedReport.id);
        return { artifact_id: artifact.id };

      default:
        throw new Error(`Step executor is undefined for name: ${stepName}`);
    }
  }
}
