import { DataSource, ImportJob, ImportRun } from "../models";

export interface IIngestionRepository {
  // Data Sources
  saveSource(source: DataSource): Promise<DataSource>;
  getSourceById(id: string): Promise<DataSource | null>;
  listSources(): Promise<DataSource[]>;

  // Import Jobs
  saveJob(job: ImportJob): Promise<ImportJob>;
  getJobById(id: string): Promise<ImportJob | null>;
  listJobs(): Promise<ImportJob[]>;

  // Import Runs
  saveRun(run: ImportRun): Promise<ImportRun>;
  getRunById(id: string): Promise<ImportRun | null>;
  listAllRuns(limit?: number): Promise<ImportRun[]>;
  listRunsByJobId(jobId: string): Promise<ImportRun[]>;
}
