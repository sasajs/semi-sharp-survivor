import { IIngestionRepository } from "./IngestionRepository";
import { DataSource, ImportJob, ImportRun, ImportStatus, ImportType } from "../models";

export class MockIngestionRepository implements IIngestionRepository {
  private static sources: DataSource[] = [
    {
      id: "src_nfl_schedules",
      name: "NFL Official Schedule Provider",
      description: "Primary upstream provider for matchups, historical calendars, and game locations.",
      adapterType: "nfl_schedule_provider",
      enabled: true,
      createdAt: new Date("2026-06-01T08:00:00Z"),
      updatedAt: new Date("2026-06-01T08:00:00Z"),
      metadata: { endpoint: "https://api.schedules.nfl.internal/v1" }
    },
    {
      id: "src_weather_forecaster",
      name: "National NOAA Stadium Weather Service",
      description: "Aggregates localized wind speed, humidity, precipitation, and cloud cover metrics.",
      adapterType: "stadium_weather_feed",
      enabled: true,
      createdAt: new Date("2026-06-02T09:00:00Z"),
      updatedAt: new Date("2026-06-02T09:00:00Z"),
      metadata: { update_interval_seconds: 3600 }
    },
    {
      id: "src_betting_consensus",
      name: "Consensus Bookmaker Odds Feed",
      description: "Stitches together spread prices and baseline over-unders from licensed sportsbook indicators.",
      adapterType: "consensus_odds_provider",
      enabled: false,
      createdAt: new Date("2026-06-03T10:00:00Z"),
      updatedAt: new Date("2026-06-03T10:00:00Z"),
      metadata: { weight_adjustments: { vegas: 0.6, offshore: 0.4 } }
    }
  ];

  private static jobs: ImportJob[] = [
    {
      id: "job_weekly_schedule_sync",
      name: "Weekly Schedule Import sync",
      description: "Imports stadium matchups and official kickoff dates for the current week's evaluation roster.",
      importType: ImportType.SCHEDULE,
      sourceId: "src_nfl_schedules",
      enabled: true,
      createdAt: new Date("2026-06-01T12:00:00Z"),
      updatedAt: new Date("2026-06-01T12:00:00Z"),
      metadata: { batch_size: 50 }
    },
    {
      id: "job_stadium_weather_sync",
      name: "Environmental Weather Tracker Sync",
      description: "Triggers weather updates and estimates precipitation probability values.",
      importType: ImportType.WEATHER,
      sourceId: "src_weather_forecaster",
      enabled: true,
      createdAt: new Date("2026-06-02T13:00:00Z"),
      updatedAt: new Date("2026-06-02T13:00:00Z"),
      metadata: { precision_decimals: 2 }
    }
  ];

  private static runs: ImportRun[] = [
    {
      id: "run_im_9001",
      jobId: "job_weekly_schedule_sync",
      importType: ImportType.SCHEDULE,
      status: ImportStatus.SUCCEEDED,
      startedAt: new Date("2026-06-16T05:00:00Z"),
      completedAt: new Date("2026-06-16T05:00:03Z"),
      recordsProcessed: 3,
      recordsImported: 3,
      recordsRejected: 0,
      errorMessage: null,
      auditMetadata: {
        processedBy: "scheduled_auto_agent",
        validationIssuesCount: 0,
        connectionSuccess: true,
        systemFingerprint: "node_v20_container"
      }
    },
    {
      id: "run_im_9002",
      jobId: "job_stadium_weather_sync",
      importType: ImportType.WEATHER,
      status: ImportStatus.SUCCEEDED,
      startedAt: new Date("2026-06-17T06:00:00Z"),
      completedAt: new Date("2026-06-17T06:00:02Z"),
      recordsProcessed: 2,
      recordsImported: 2,
      recordsRejected: 0,
      errorMessage: null,
      auditMetadata: {
        processedBy: "scheduled_auto_agent",
        validationIssuesCount: 0,
        connectionSuccess: true,
        systemFingerprint: "node_v20_container"
      }
    }
  ];

  async saveSource(source: DataSource): Promise<DataSource> {
    const idx = MockIngestionRepository.sources.findIndex(s => s.id === source.id);
    if (idx !== -1) {
      MockIngestionRepository.sources[idx] = { ...source, updatedAt: new Date() };
      return MockIngestionRepository.sources[idx];
    } else {
      MockIngestionRepository.sources.push(source);
      return source;
    }
  }

  async getSourceById(id: string): Promise<DataSource | null> {
    const found = MockIngestionRepository.sources.find(s => s.id === id);
    return found ? { ...found } : null;
  }

  async listSources(): Promise<DataSource[]> {
    return [...MockIngestionRepository.sources];
  }

  async saveJob(job: ImportJob): Promise<ImportJob> {
    const idx = MockIngestionRepository.jobs.findIndex(j => j.id === job.id);
    if (idx !== -1) {
      MockIngestionRepository.jobs[idx] = { ...job, updatedAt: new Date() };
      return MockIngestionRepository.jobs[idx];
    } else {
      MockIngestionRepository.jobs.push(job);
      return job;
    }
  }

  async getJobById(id: string): Promise<ImportJob | null> {
    const found = MockIngestionRepository.jobs.find(j => j.id === id);
    return found ? { ...found } : null;
  }

  async listJobs(): Promise<ImportJob[]> {
    return [...MockIngestionRepository.jobs];
  }

  async saveRun(run: ImportRun): Promise<ImportRun> {
    const idx = MockIngestionRepository.runs.findIndex(r => r.id === run.id);
    if (idx !== -1) {
      MockIngestionRepository.runs[idx] = { ...run };
      return MockIngestionRepository.runs[idx];
    } else {
      MockIngestionRepository.runs.push(run);
      return run;
    }
  }

  async getRunById(id: string): Promise<ImportRun | null> {
    const found = MockIngestionRepository.runs.find(r => r.id === id);
    return found ? { ...found } : null;
  }

  async listAllRuns(limit?: number): Promise<ImportRun[]> {
    const sorted = [...MockIngestionRepository.runs].sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    if (limit !== undefined) {
      return sorted.slice(0, limit);
    }
    return sorted;
  }

  async listRunsByJobId(jobId: string): Promise<ImportRun[]> {
    return MockIngestionRepository.runs.filter(r => r.jobId === jobId);
  }
}
