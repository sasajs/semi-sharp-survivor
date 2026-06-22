import { FeatureBuildRun } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { IFeatureBuildRunRepository } from "../interfaces";

export class PostgresFeatureBuildRunRepository implements IFeatureBuildRunRepository {
  async getAll(): Promise<FeatureBuildRun[]> {
    const rows = await query(
      "SELECT run_id, season, week, status, feature_count, started_at, completed_at, build_version, notes FROM feature_build_runs ORDER BY run_id DESC"
    );
    return rows.map(r => ({
      run_id: Number(r.run_id),
      season: Number(r.season),
      week: Number(r.week),
      status: r.status as any,
      feature_count: Number(r.feature_count),
      started_at: r.started_at ? new Date(r.started_at).toISOString() : "",
      completed_at: r.completed_at ? new Date(r.completed_at).toISOString() : undefined,
      build_version: r.build_version,
      notes: r.notes || undefined
    }));
  }

  async getById(id: number | string): Promise<FeatureBuildRun | null> {
    const numericId = typeof id === "string" ? parseInt(id, 10) : id;
    const rows = await query(
      "SELECT run_id, season, week, status, feature_count, started_at, completed_at, build_version, notes FROM feature_build_runs WHERE run_id = $1",
      [numericId]
    );
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      run_id: Number(r.run_id),
      season: Number(r.season),
      week: Number(r.week),
      status: r.status as any,
      feature_count: Number(r.feature_count),
      started_at: r.started_at ? new Date(r.started_at).toISOString() : "",
      completed_at: r.completed_at ? new Date(r.completed_at).toISOString() : undefined,
      build_version: r.build_version,
      notes: r.notes || undefined
    };
  }

  async getLatest(): Promise<FeatureBuildRun | null> {
    const rows = await query(
      "SELECT run_id, season, week, status, feature_count, started_at, completed_at, build_version, notes FROM feature_build_runs ORDER BY run_id DESC LIMIT 1"
    );
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      run_id: Number(r.run_id),
      season: Number(r.season),
      week: Number(r.week),
      status: r.status as any,
      feature_count: Number(r.feature_count),
      started_at: r.started_at ? new Date(r.started_at).toISOString() : "",
      completed_at: r.completed_at ? new Date(r.completed_at).toISOString() : undefined,
      build_version: r.build_version,
      notes: r.notes || undefined
    };
  }

  async save(run: FeatureBuildRun): Promise<FeatureBuildRun> {
    if (run.run_id) {
      // Update
      const rows = await query(
        `UPDATE feature_build_runs SET
           season = $2,
           week = $3,
           status = $4,
           feature_count = $5,
           started_at = $6,
           completed_at = $7,
           build_version = $8,
           notes = $9
         WHERE run_id = $1
         RETURNING *`,
        [
          run.run_id,
          run.season,
          run.week,
          run.status,
          run.feature_count,
          run.started_at ? new Date(run.started_at) : new Date(),
          run.completed_at ? new Date(run.completed_at) : null,
          run.build_version,
          run.notes || null
        ]
      );
      const r = rows[0];
      return {
        run_id: Number(r.run_id),
        season: Number(r.season),
        week: Number(r.week),
        status: r.status as any,
        feature_count: Number(r.feature_count),
        started_at: r.started_at ? new Date(r.started_at).toISOString() : "",
        completed_at: r.completed_at ? new Date(r.completed_at).toISOString() : undefined,
        build_version: r.build_version,
        notes: r.notes || undefined
      };
    } else {
      // Insert
      const rows = await query(
        `INSERT INTO feature_build_runs (season, week, status, feature_count, started_at, completed_at, build_version, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          run.season,
          run.week,
          run.status,
          run.feature_count,
          run.started_at ? new Date(run.started_at) : new Date(),
          run.completed_at ? new Date(run.completed_at) : null,
          run.build_version,
          run.notes || null
        ]
      );
      const r = rows[0];
      return {
        run_id: Number(r.run_id),
        season: Number(r.season),
        week: Number(r.week),
        status: r.status as any,
        feature_count: Number(r.feature_count),
        started_at: r.started_at ? new Date(r.started_at).toISOString() : "",
        completed_at: r.completed_at ? new Date(r.completed_at).toISOString() : undefined,
        build_version: r.build_version,
        notes: r.notes || undefined
      };
    }
  }
}
