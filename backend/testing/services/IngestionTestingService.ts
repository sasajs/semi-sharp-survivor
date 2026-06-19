import { DataIngestionService } from "../../ingestion/services/DataIngestionService";
import { ImportValidationService } from "../../ingestion/services/ImportValidationService";
import { ImportAuditService } from "../../ingestion/services/ImportAuditService";
import { ImportType } from "../../ingestion/models";
import { IngestionTestResult } from "../models";

export class IngestionTestingService {
  /**
   * Run detailed verification on the Data Ingestion subsystem
   */
  static async validateIngestionSubsystem(): Promise<IngestionTestResult> {
    const details: string[] = [];
    let sourceRegistryValid = false;
    let importJobsValid = false;
    let importRunsValid = false;
    let validationServicesValid = false;
    let auditServicesValid = false;
    let score = 0;
    let errorMessage: string | null = null;

    try {
      // 1. Verify Source Registry
      details.push("Listing registered data sources from the ingestion engine...");
      const sources = await DataIngestionService.listSources();
      if (Array.isArray(sources)) {
        sourceRegistryValid = true;
        details.push(`SUCCESS: Data sources loaded successfully. Loaded count: ${sources.length} sources.`);
      } else {
        throw new Error("Data sources load did not return an array.");
      }

      // 2. Verify Import Jobs
      details.push("Retrieving list of configured import jobs...");
      const jobs = await DataIngestionService.listJobs();
      if (Array.isArray(jobs)) {
        importJobsValid = true;
        details.push(`SUCCESS: Configuration jobs list fetched. Count: ${jobs.length} jobs.`);
      } else {
        throw new Error("Job list retrieval failed or returned non-array structure.");
      }

      // 3. Verify Import Runs
      details.push("Querying ingestion history execution runs...");
      const runs = await DataIngestionService.listImportRuns();
      if (Array.isArray(runs)) {
        importRunsValid = true;
        details.push(`SUCCESS: Import runs fetched perfectly. Executed runs logged: ${runs.length} runs.`);
      } else {
        throw new Error("Import run history loaded invalid metadata values.");
      }

      // 4. Validate Validation Services
      details.push("Triggering internal verification validators on payload structures...");
      const mockPayloadCorrect = [{ teamId: "SF", wins: 12 }, { teamId: "KC", wins: 13 }];
      const validationSuccessResult = ImportValidationService.validatePayload(mockPayloadCorrect);
      
      const mockPayloadEmpty: any[] = [];
      const validationWarningResult = ImportValidationService.validatePayload(mockPayloadEmpty);

      if (validationSuccessResult.isValid === true && validationWarningResult.warnings.length > 0) {
        validationServicesValid = true;
        details.push(`SUCCESS: Payload validation engine validated cleanly (Correct: ${validationSuccessResult.isValid}, Empty Warning flag count: ${validationWarningResult.warnings.length}).`);
      } else {
        throw new Error("Payload validation results did not handle arrays as expected.");
      }

      // 5. Validate Audit Services
      details.push("Asserting audit logging and metadata tracking formats...");
      const testAuditMetadata = ImportAuditService.buildAuditMetadata("Readiness_Ingestion_Tester", 0, true, { dryRun: true });
      if (testAuditMetadata && testAuditMetadata.processedBy === "Readiness_Ingestion_Tester" && testAuditMetadata.connectionSuccess === true) {
        auditServicesValid = true;
        details.push("SUCCESS: Auditing engine validated. Schema logs and environment system fingerprints are generated on spec.");
      } else {
        throw new Error("Audit service failed to produce matching tracking structures.");
      }

      // Compute score
      let passed = 0;
      if (sourceRegistryValid) passed++;
      if (importJobsValid) passed++;
      if (importRunsValid) passed++;
      if (validationServicesValid) passed++;
      if (auditServicesValid) passed++;
      score = Math.round((passed / 5) * 100);

    } catch (err: any) {
      details.push(`CRITICAL: Ingestion system verification crash: ${err.message}`);
      errorMessage = err.message;
    }

    const status = errorMessage ? "FAILED" : "PASSED";

    return {
      status,
      score,
      sourceRegistryValid,
      importJobsValid,
      importRunsValid,
      validationServicesValid,
      auditServicesValid,
      details,
      errorMessage
    };
  }
}
