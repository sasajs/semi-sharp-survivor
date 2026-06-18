import { IIngestionRepository } from "../repositories/IngestionRepository";
import { MockIngestionRepository } from "../repositories/MockIngestionRepository";
import { 
  DataSource, 
  ImportJob, 
  ImportRun, 
  ImportStatus, 
  ImportType 
} from "../models";
import { ImportValidationService } from "./ImportValidationService";
import { ImportAuditService } from "./ImportAuditService";
import { AdapterRegistryService } from "./AdapterRegistryService";
import crypto from "crypto";

let activeRepository: IIngestionRepository = new MockIngestionRepository();

export function getIngestionRepository(): IIngestionRepository {
  return activeRepository;
}

export function setIngestionRepository(repo: IIngestionRepository): void {
  activeRepository = repo;
}

export class DataIngestionService {
  // Sources
  static async listSources(): Promise<DataSource[]> {
    const repo = getIngestionRepository();
    return repo.listSources();
  }

  static async getSource(id: string): Promise<DataSource> {
    const repo = getIngestionRepository();
    const source = await repo.getSourceById(id);
    if (!source) {
      throw new Error(`Data Source with ID: ${id} could not be resolved`);
    }
    return source;
  }

  static async createSource(payload: {
    name: string;
    description: string;
    adapterType: string;
    metadata?: Record<string, any>;
  }): Promise<DataSource> {
    const id = `src_${crypto.randomUUID?.() || Math.random().toString(36).substring(2, 11)}`;
    const source: DataSource = {
      id,
      name: payload.name,
      description: payload.description,
      adapterType: payload.adapterType,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: payload.metadata || {}
    };

    ImportValidationService.validateSource(source);
    const repo = getIngestionRepository();
    return repo.saveSource(source);
  }

  static async updateSource(id: string, updates: Partial<DataSource>): Promise<DataSource> {
    const repo = getIngestionRepository();
    const existing = await this.getSource(id);

    const updated: DataSource = {
      ...existing,
      name: updates.name !== undefined ? updates.name : existing.name,
      description: updates.description !== undefined ? updates.description : existing.description,
      adapterType: updates.adapterType !== undefined ? updates.adapterType : existing.adapterType,
      enabled: updates.enabled !== undefined ? updates.enabled : existing.enabled,
      metadata: updates.metadata !== undefined ? { ...existing.metadata, ...updates.metadata } : existing.metadata,
      updatedAt: new Date()
    };

    ImportValidationService.validateSource(updated);
    return repo.saveSource(updated);
  }

  static async enableSource(id: string): Promise<DataSource> {
    return this.updateSource(id, { enabled: true });
  }

  static async disableSource(id: string): Promise<DataSource> {
    return this.updateSource(id, { enabled: false });
  }

  // Jobs
  static async listJobs(): Promise<ImportJob[]> {
    const repo = getIngestionRepository();
    return repo.listJobs();
  }

  static async createJob(payload: {
    name: string;
    description: string;
    importType: ImportType;
    sourceId: string;
    metadata?: Record<string, any>;
  }): Promise<ImportJob> {
    const id = `job_${crypto.randomUUID?.() || Math.random().toString(36).substring(2, 11)}`;
    const job: ImportJob = {
      id,
      name: payload.name,
      description: payload.description,
      importType: payload.importType,
      sourceId: payload.sourceId,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: payload.metadata || {}
    };

    ImportValidationService.validateJob(job);
    const repo = getIngestionRepository();
    return repo.saveJob(job);
  }

  static async updateJob(id: string, updates: Partial<ImportJob>): Promise<ImportJob> {
    const repo = getIngestionRepository();
    const job = await repo.getJobById(id);
    if (!job) {
      throw new Error(`Import Job with ID: ${id} could not be resolved`);
    }

    const updated: ImportJob = {
      ...job,
      name: updates.name !== undefined ? updates.name : job.name,
      description: updates.description !== undefined ? updates.description : job.description,
      importType: updates.importType !== undefined ? updates.importType : job.importType,
      sourceId: updates.sourceId !== undefined ? updates.sourceId : job.sourceId,
      enabled: updates.enabled !== undefined ? updates.enabled : job.enabled,
      metadata: updates.metadata !== undefined ? { ...job.metadata, ...updates.metadata } : job.metadata,
      updatedAt: new Date()
    };

    ImportValidationService.validateJob(updated);
    return repo.saveJob(updated);
  }

  // Runs
  static async listImportRuns(limit?: number): Promise<ImportRun[]> {
    const repo = getIngestionRepository();
    return repo.listAllRuns(limit);
  }

  static async getImportRun(id: string): Promise<ImportRun> {
    const repo = getIngestionRepository();
    const run = await repo.getRunById(id);
    if (!run) {
      throw new Error(`Data Ingestion Import Run with ID: ${id} could not be resolved`);
    }
    return run;
  }

  static async runImport(jobId: string, actor: string = "web_admin"): Promise<ImportRun> {
    const repo = getIngestionRepository();
    
    // 1. Fetch targeted job
    const job = await repo.getJobById(jobId);
    if (!job) {
      throw new Error(`Target automation job with ID: ${jobId} does not exist`);
    }

    // 2. Fetch associated parent DataSource provider
    const source = await repo.getSourceById(job.sourceId);
    if (!source) {
      throw new Error(`Target DataSource provider with ID: ${job.sourceId} does not exist`);
    }

    // 3. Structural validations
    ImportValidationService.validateImportRequest(job, source);

    // 4. Record execution launch phase
    const runId = `run_im_${crypto.randomUUID?.() || Math.random().toString(36).substring(2, 11)}`;
    let run = ImportAuditService.recordImportStart(runId, job.id, job.importType, actor);
    await repo.saveRun(run);

    try {
      // 5. Look up adapter
      const adapter = AdapterRegistryService.getAdapter(source.adapterType);
      if (!adapter) {
        throw new Error(`No adapter template registered for driver identifier: ${source.adapterType}`);
      }

      // 6. Check endpoint network health
      const connected = await adapter.validateConnection();
      if (!connected) {
        throw new Error(`Adapter target server connection validation handshake failed`);
      }

      // 7. Extract data
      const rawData = await adapter.fetchData();
      
      // 8. Payload validation checks
      const validation = ImportValidationService.validatePayload(rawData);
      if (!validation.isValid) {
        run = ImportAuditService.recordValidationFailure(run, validation.errors.join("; "), actor);
        await repo.saveRun(run);
        return run;
      }

      // 9. Convert/transform payloads
      const transformedData = await adapter.transform(rawData);
      const recordCount = transformedData.length;

      // 10. Audit complete process run success
      run = ImportAuditService.recordImportSuccess(run, recordCount, recordCount, 0, actor);
      await repo.saveRun(run);
      return run;
    } catch (err: any) {
      // 11. Error capturing
      run = ImportAuditService.recordImportFailure(run, err.message || "Unknown adapter flow error", actor);
      await repo.saveRun(run);
      return run;
    }
  }
}
