export enum ImportStatus {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  SUCCEEDED = "SUCCEEDED",
  FAILED = "FAILED",
  PARTIAL_SUCCESS = "PARTIAL_SUCCESS",
  CANCELLED = "CANCELLED"
}

export enum ImportType {
  SCHEDULE = "SCHEDULE",
  TEAM = "TEAM",
  INJURY = "INJURY",
  LINE = "LINE",
  WEATHER = "WEATHER",
  CUSTOM = "CUSTOM"
}

export interface DataSource {
  id: string;
  name: string;
  description: string;
  adapterType: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

export interface ImportJob {
  id: string;
  name: string;
  description: string;
  importType: ImportType;
  sourceId: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

export interface ImportRun {
  id: string;
  jobId: string;
  importType: ImportType;
  status: ImportStatus;
  startedAt: Date;
  completedAt: Date | null;
  recordsProcessed: number;
  recordsImported: number;
  recordsRejected: number;
  errorMessage: string | null;
  auditMetadata: ImportAuditMetadata;
}

export interface ImportResult {
  runId: string;
  success: boolean;
  recordsProcessed: number;
  recordsImported: number;
  recordsRejected: number;
  message: string | null;
  errors: string[];
}

export interface ImportAuditMetadata {
  processedBy: string;
  validationIssuesCount: number;
  connectionSuccess: boolean;
  systemFingerprint: string;
  customTrace?: Record<string, any>;
}

export interface AdapterDefinition {
  type: string;
  name: string;
  description: string;
  supportedTypes: ImportType[];
}

export interface ImportValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
