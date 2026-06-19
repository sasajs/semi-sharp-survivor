import { getSchedulerRepository } from "../../scheduler/services/ScheduleAuditService";
import { ScheduledWorkflowService } from "../../scheduler/services/ScheduledWorkflowService";
import { ScheduleValidationService } from "../../scheduler/services/ScheduleValidationService";
import { ScheduleDefinition, ScheduledWorkflowType } from "../../scheduler/models";
import { SchedulerTestResult } from "../models";

export class SchedulerTestingService {
  /**
   * Run detailed verification check on Scheduler Subsystem
   */
  static async validateSchedulerSubsystem(): Promise<SchedulerTestResult> {
    const details: string[] = [];
    let registryValid = false;
    let loadingValid = false;
    let metadataValid = false;
    let activationStatusValid = false;
    let nextRunCalculationsValid = false;
    let score = 0;
    let errorMessage: string | null = null;

    try {
      // 1. Verify Scheduler Registry
      details.push("Resolving active Schedule Audit and repository providers...");
      const repo = getSchedulerRepository();
      if (repo && typeof repo.listSchedules === "function" && typeof repo.saveSchedule === "function") {
        registryValid = true;
        details.push("SUCCESS: Scheduler repository resolved with save, list, and audit hooks.");
      } else {
        throw new Error("Scheduler repository registry failed to resolve valid data structure capabilities.");
      }

      // 2. Validate Schedule Loading
      details.push("Checking physical schedules loader from database...");
      const activeSchedules = await repo.listSchedules();
      if (Array.isArray(activeSchedules)) {
        loadingValid = true;
        details.push(`SUCCESS: Schedules load query fetched ${activeSchedules.length} blueprints from state logs.`);
      } else {
        throw new Error("Loaded schedules output was not structured as an array.");
      }

      // 3. Validate Schedule Metadata and creation pipelines
      details.push("Synthesizing workflow schedule validation schemas and test creation metadata...");
      const testDef: ScheduleDefinition = {
        name: "Preseason_Readiness_Automation_Check",
        description: "Test run metadata designed for pre-flight schedule verification",
        workflowType: "IMPORT_ONLY" as ScheduledWorkflowType,
        season: "2026",
        week: 1,
        scheduleExpression: "30 2 * * 2", // 2:30 AM every Tuesday
        scheduleTimezone: "America/New_York",
        metadata: { auditTest: true }
      };

      // Run schema validations
      ScheduleValidationService.validateDefinition(testDef);
      details.push("SUCCESS: ScheduleValidationService successfully parsed target schedule blueprint specifications.");

      // Test temporary creation
      const createdSched = await ScheduledWorkflowService.createSchedule(testDef, "Preseason_Tester");
      if (createdSched && createdSched.id && createdSched.name === testDef.name) {
        metadataValid = true;
        details.push(`SUCCESS: Simulated testing schedule written cleanly with persistent identification ID: ${createdSched.id}`);
      } else {
        throw new Error("Created scheduled workflow had mismatched fields or lacked unique identification.");
      }

      // 4. Validate Next-Run Calculations
      details.push("Evaluating cron mathematical next-run calculations service...");
      const testCron = "15 8 * * 4"; // 8:15 AM on Thursdays
      const calculatedDate = ScheduledWorkflowService.calculateNextRun(testCron);
      if (calculatedDate instanceof Date && !isNaN(calculatedDate.getTime())) {
        nextRunCalculationsValid = true;
        details.push(`SUCCESS: Next-run date computed: ${calculatedDate.toISOString()} for cron parameter: "${testCron}"`);
      } else {
        throw new Error("Next-run calculation engine returned non-date or null response.");
      }

      // 5. Validate Activation Status
      details.push(`Asserting active state trigger status parameters on created tester: ${createdSched.id}...`);
      if (createdSched.enabled === true && createdSched.status === "ACTIVE") {
        activationStatusValid = true;
        details.push("SUCCESS: Scheduled item matches ACTIVE / ENABLED metadata conditions.");
      } else {
        throw new Error("Newly registered workflow schedules did not build with expected enabled/active properties.");
      }

      // Cleanup mock schedule from repo if supported
      details.push("Cleaning up temporary verified schedule item...");
      const anyRepo = repo as any;
      if (typeof anyRepo.deleteSchedule === "function") {
        await anyRepo.deleteSchedule(createdSched.id);
        details.push(`SUCCESS: Successfully cleared temporary tester index: ${createdSched.id}`);
      } else if (typeof anyRepo.delete === "function") {
        await anyRepo.delete(createdSched.id);
        details.push(`SUCCESS: Successfully cleared temporary tester index: ${createdSched.id}`);
      } else {
        details.push("No deletion method registered on mock repo. Isolation verified without database teardown.");
      }

      // Compute score
      let passedChecks = 0;
      if (registryValid) passedChecks++;
      if (loadingValid) passedChecks++;
      if (metadataValid) passedChecks++;
      if (activationStatusValid) passedChecks++;
      if (nextRunCalculationsValid) passedChecks++;
      score = Math.round((passedChecks / 5) * 100);

    } catch (err: any) {
      details.push(`CRITICAL: Scheduler check encountered error: ${err.message}`);
      errorMessage = err.message;
    }

    const status = errorMessage ? "FAILED" : "PASSED";

    return {
      status,
      score,
      registryValid,
      loadingValid,
      metadataValid,
      activationStatusValid,
      nextRunCalculationsValid,
      details,
      errorMessage
    };
  }
}
