import { ScheduleDefinition, ScheduledWorkflowType } from "../models";

export class ScheduleValidationService {
  private static VALID_WORKFLOW_TYPES: Set<ScheduledWorkflowType> = new Set([
    "FULL_WEEKLY_RESEARCH",
    "IMPORT_ONLY",
    "FEATURE_REFRESH_ONLY",
    "RECOMMENDATION_ONLY",
    "SIMULATION_ONLY",
    "REPORT_ONLY",
    "EXPORT_ONLY"
  ]);

  /**
   * Validates a workflow type against the allowed enum set.
   */
  static validateWorkflowType(type: any): void {
    if (!type) {
      throw new Error("Workflow type is required");
    }
    if (!this.VALID_WORKFLOW_TYPES.has(type)) {
      throw new Error(`Invalid workflow type: ${type}. Allowed workflow types: ${Array.from(this.VALID_WORKFLOW_TYPES).join(", ")}`);
    }
  }

  /**
   * Validates the validity of season (e.g. '2026') and week (1-22).
   */
  static validateSeasonAndWeek(season: string, week: number): void {
    if (!season || typeof season !== "string" || !season.trim()) {
      throw new Error("Season identifier is invalid or empty");
    }
    if (week === undefined || typeof week !== "number" || week < 1 || week > 22) {
      throw new Error("Week selection must be an integer between 1 and 22");
    }
  }

  /**
   * Validates crontab schedule expressions (basic syntax format checks).
   */
  static validateScheduleExpression(expr: string): void {
    if (!expr || typeof expr !== "string" || !expr.trim()) {
      throw new Error("Schedule expression (cron format) is required");
    }
    const parts = expr.split(/\s+/);
    if (parts.length !== 5) {
      throw new Error("Invalid cron schedule expression: Must contain exactly 5 space-separated parameters (minute hour day-of-month month day-of-week).");
    }
  }

  /**
   * Validates whether a state change satisfies basic consistency.
   */
  static validateEnabledDisabledState(enabled: any): void {
    if (typeof enabled !== "boolean") {
      throw new Error("Enabled flag must be a boolean value");
    }
  }

  /**
   * General-purpose blueprint validation wrapper.
   */
  static validateDefinition(def: ScheduleDefinition): void {
    if (!def.name || typeof def.name !== "string" || !def.name.trim()) {
      throw new Error("Schedule name is required and cannot be blank");
    }
    this.validateWorkflowType(def.workflowType);
    this.validateSeasonAndWeek(def.season, def.week);
    this.validateScheduleExpression(def.scheduleExpression);
  }

  /**
   * Validates trigger payload requests.
   */
  static validateTriggerRequest(scheduleId: string): void {
    if (!scheduleId || typeof scheduleId !== "string" || !scheduleId.trim()) {
      throw new Error("Invalid scheduled resource identifier for execution request");
    }
  }
}
