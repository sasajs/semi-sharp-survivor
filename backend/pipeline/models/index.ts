export enum PipelineStage {
  DATA_INGESTION = "DATA_INGESTION",
  WORKFLOW_EXECUTION = "WORKFLOW_EXECUTION",
  REPORT_GENERATION = "REPORT_GENERATION",
  EXPORT_GENERATION = "EXPORT_GENERATION",
  HISTORICAL_REPLAY_VALIDATION = "HISTORICAL_REPLAY_VALIDATION",
  PRESEASON_READINESS_VALIDATION = "PRESEASON_READINESS_VALIDATION",
  PIPELINE_COMPLETION = "PIPELINE_COMPLETION"
}

export interface PipelineStageResult {
  stage: PipelineStage;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  durationMs: number;
  outputSummary: string;
  errorMessage: string | null;
}

export interface PipelineValidationResult {
  isValid: boolean;
  score: number; // 0 - 100
  details: string[];
  warnings: string[];
}

export interface PipelineAuditRecord {
  timestamp: string;
  stage?: PipelineStage;
  event: string;
  message: string;
  level: "INFO" | "WARNING" | "ERROR";
}

export interface PipelineExecution {
  id: string;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  currentStage: PipelineStage | null;
  stageResults: PipelineStageResult[];
  validation: {
    ingestion: PipelineValidationResult;
    workflow: PipelineValidationResult;
    reporting: PipelineValidationResult;
    export: PipelineValidationResult;
    replay: PipelineValidationResult;
    readiness: PipelineValidationResult;
  };
  durationMs: number;
  createdAt: string;
  completedAt: string | null;
}

export interface PipelineSummary {
  pipelineId: string;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  stagesCompleted: number;
  stagesFailed: number;
  durationMs: number;
  workflowCount: number;
  reportCount: number;
  exportCount: number;
  validationScore: number; // Avg validation score across checked layers
  createdAt: string;
}
