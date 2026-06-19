export interface WorkflowTestResult {
  status: "PASSED" | "FAILED" | "WARNING";
  score: number; // 0 - 100
  registryValid: boolean;
  executionValid: boolean;
  statusTrackingValid: boolean;
  historyGenerationValid: boolean;
  idempotencyValid: boolean;
  completionValid: boolean;
  details: string[];
  errorMessage: string | null;
}

export interface SchedulerTestResult {
  status: "PASSED" | "FAILED" | "WARNING";
  score: number; // 0 - 100
  registryValid: boolean;
  loadingValid: boolean;
  metadataValid: boolean;
  activationStatusValid: boolean;
  nextRunCalculationsValid: boolean;
  details: string[];
  errorMessage: string | null;
}

export interface IngestionTestResult {
  status: "PASSED" | "FAILED" | "WARNING";
  score: number; // 0 - 100
  sourceRegistryValid: boolean;
  importJobsValid: boolean;
  importRunsValid: boolean;
  validationServicesValid: boolean;
  auditServicesValid: boolean;
  details: string[];
  errorMessage: string | null;
}

export interface ReportingTestResult {
  status: "PASSED" | "FAILED" | "WARNING";
  score: number; // 0 - 100
  generationValid: boolean;
  storageValid: boolean;
  metadataValid: boolean;
  retrievalValid: boolean;
  details: string[];
  errorMessage: string | null;
}

export interface ExportTestResult {
  status: "PASSED" | "FAILED" | "WARNING";
  score: number; // 0 - 100
  docxGenerationValid: boolean;
  htmlGenerationValid: boolean;
  researchArtifactValid: boolean;
  registryValid: boolean;
  details: string[];
  errorMessage: string | null;
}

export interface SystemReadinessScorecard {
  overallStatus: "READY" | "NEEDS_ATTENTION" | "NOT_READY";
  overallScore: number; // 0 - 100
  workflowScore: number;
  schedulerScore: number;
  ingestionScore: number;
  reportingScore: number;
  exportScore: number;
  workflowResult: WorkflowTestResult;
  schedulerResult: SchedulerTestResult;
  ingestionResult: IngestionTestResult;
  reportingResult: ReportingTestResult;
  exportResult: ExportTestResult;
  warnings: string[];
  recommendations: string[];
  generatedAt: string;
}

// Map alias as required by directory specification
export type ReadinessTestResult = SystemReadinessScorecard;
