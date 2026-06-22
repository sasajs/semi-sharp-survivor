import { SystemMetadata, ApplicationVersion, ProjectDecision, OperationsEvent } from "../../../src/types/admin";
import { query } from "../../database/connection/PostgresConnectionManager";
import { 
  ISystemMetadataRepository, 
  IApplicationVersionsRepository, 
  IProjectDecisionsRepository, 
  IOperationsEventsRepository 
} from "../interfaces";

function mapMetadata(row: any): SystemMetadata {
  return {
    id: row.id,
    systemName: row.system_name,
    currentVersion: row.current_version,
    currentGitBranch: row.current_git_branch,
    currentGitTag: row.current_git_tag,
    deploymentEnvironment: row.deployment_environment,
    serverHostname: row.server_hostname,
    databaseName: row.database_name,
    lastStartupTimestamp: row.last_startup_timestamp ? new Date(row.last_startup_timestamp).toISOString() : "",
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : "",
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : ""
  };
}

function mapVersion(row: any): ApplicationVersion {
  return {
    versionId: row.version_id,
    versionTag: row.version_tag,
    gitCommitHash: row.git_commit_hash,
    releaseDate: row.release_date ? new Date(row.release_date).toISOString() : "",
    releaseNotes: row.release_notes,
    milestoneName: row.milestone_name,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : ""
  };
}

function mapDecision(row: any): ProjectDecision {
  return {
    decisionId: row.decision_id,
    decisionDate: row.decision_date ? new Date(row.decision_date).toISOString().split("T")[0] : "",
    category: row.category,
    title: row.title,
    rationale: row.rationale,
    impact: row.impact,
    status: row.status,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : ""
  };
}

function mapEvent(row: any): OperationsEvent {
  let parsedJson: any = {};
  if (row.metadata_json) {
    try {
      parsedJson = typeof row.metadata_json === "string" ? JSON.parse(row.metadata_json) : row.metadata_json;
    } catch {
      parsedJson = { raw: row.metadata_json };
    }
  }
  return {
    eventId: row.event_id,
    eventType: row.event_type,
    severity: row.severity,
    source: row.source,
    description: row.description,
    metadataJson: parsedJson,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : ""
  };
}

export class PostgresSystemMetadataRepository implements ISystemMetadataRepository {
  async getLatest(): Promise<SystemMetadata | null> {
    const rows = await query("SELECT * FROM system_metadata ORDER BY id DESC LIMIT 1");
    return rows.length ? mapMetadata(rows[0]) : null;
  }

  async save(metadata: SystemMetadata): Promise<SystemMetadata> {
    const rows = await query(
      `INSERT INTO system_metadata (
        system_name, current_version, current_git_branch, current_git_tag, 
        deployment_environment, server_hostname, database_name, last_startup_timestamp, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *`,
      [
        metadata.systemName,
        metadata.currentVersion,
        metadata.currentGitBranch,
        metadata.currentGitTag,
        metadata.deploymentEnvironment,
        metadata.serverHostname,
        metadata.databaseName,
        metadata.lastStartupTimestamp ? new Date(metadata.lastStartupTimestamp) : new Date()
      ]
    );
    return mapMetadata(rows[0]);
  }
}

export class PostgresApplicationVersionsRepository implements IApplicationVersionsRepository {
  async getAll(): Promise<ApplicationVersion[]> {
    const rows = await query("SELECT * FROM application_versions ORDER BY release_date DESC, version_id DESC");
    return rows.map(mapVersion);
  }

  async create(version: Omit<ApplicationVersion, "versionId" | "createdAt">): Promise<ApplicationVersion> {
    const rows = await query(
      `INSERT INTO application_versions (version_tag, git_commit_hash, release_date, release_notes, milestone_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        version.versionTag,
        version.gitCommitHash,
        new Date(version.releaseDate),
        version.releaseNotes,
        version.milestoneName
      ]
    );
    return mapVersion(rows[0]);
  }
}

export class PostgresProjectDecisionsRepository implements IProjectDecisionsRepository {
  async getAll(): Promise<ProjectDecision[]> {
    const rows = await query("SELECT * FROM project_decisions ORDER BY decision_date DESC, decision_id DESC");
    return rows.map(mapDecision);
  }

  async create(decision: Omit<ProjectDecision, "decisionId" | "createdAt">): Promise<ProjectDecision> {
    const rows = await query(
      `INSERT INTO project_decisions (decision_date, category, title, rationale, impact, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        new Date(decision.decisionDate),
        decision.category,
        decision.title,
        decision.rationale,
        decision.impact,
        decision.status
      ]
    );
    return mapDecision(rows[0]);
  }
}

export class PostgresOperationsEventsRepository implements IOperationsEventsRepository {
  async getAll(): Promise<OperationsEvent[]> {
    const rows = await query("SELECT * FROM operations_events ORDER BY created_at DESC");
    return rows.map(mapEvent);
  }

  async getRecent(limit: number): Promise<OperationsEvent[]> {
    const rows = await query("SELECT * FROM operations_events ORDER BY created_at DESC LIMIT $1", [limit]);
    return rows.map(mapEvent);
  }

  async create(event: Omit<OperationsEvent, "eventId" | "createdAt">): Promise<OperationsEvent> {
    const rows = await query(
      `INSERT INTO operations_events (event_type, severity, source, description, metadata_json)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        event.eventType,
        event.severity,
        event.source,
        event.description,
        event.metadataJson ? JSON.stringify(event.metadataJson) : null
      ]
    );
    return mapEvent(rows[0]);
  }
}
