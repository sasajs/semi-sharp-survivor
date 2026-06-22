import { FeatureStoreSnapshot } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { IFeatureSnapshotRepository } from "../interfaces";

export class PostgresFeatureSnapshotRepository implements IFeatureSnapshotRepository {
  async getAll(): Promise<FeatureStoreSnapshot[]> {
    const rows = await query(
      "SELECT snapshot_id, season, week, sport, team_id, game_id, feature_id, feature_value, source, created_at FROM feature_snapshots ORDER BY snapshot_id DESC"
    );
    return rows.map(r => ({
      snapshot_id: r.snapshot_id,
      season: Number(r.season),
      week: Number(r.week),
      sport: r.sport,
      team_id: r.team_id,
      game_id: r.game_id || null,
      feature_id: r.feature_id,
      feature_value: parseFloat(r.feature_value),
      source: r.source,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    }));
  }

  async getBySeasonAndWeek(season: number, week: number): Promise<FeatureStoreSnapshot[]> {
    const rows = await query(
      "SELECT snapshot_id, season, week, sport, team_id, game_id, feature_id, feature_value, source, created_at FROM feature_snapshots WHERE season = $1 AND week = $2 ORDER BY snapshot_id DESC",
      [season, week]
    );
    return rows.map(r => ({
      snapshot_id: r.snapshot_id,
      season: Number(r.season),
      week: Number(r.week),
      sport: r.sport,
      team_id: r.team_id,
      game_id: r.game_id || null,
      feature_id: r.feature_id,
      feature_value: parseFloat(r.feature_value),
      source: r.source,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    }));
  }

  async save(snapshot: FeatureStoreSnapshot): Promise<FeatureStoreSnapshot> {
    const rows = await query(
      `INSERT INTO feature_snapshots (season, week, sport, team_id, game_id, feature_id, feature_value, source, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, CURRENT_TIMESTAMP))
       RETURNING *`,
      [
        snapshot.season,
        snapshot.week,
        snapshot.sport,
        snapshot.team_id,
        snapshot.game_id || null,
        snapshot.feature_id,
        snapshot.feature_value,
        snapshot.source,
        snapshot.created_at ? new Date(snapshot.created_at) : null
      ]
    );
    const r = rows[0];
    return {
      snapshot_id: r.snapshot_id,
      season: Number(r.season),
      week: Number(r.week),
      sport: r.sport,
      team_id: r.team_id,
      game_id: r.game_id || null,
      feature_id: r.feature_id,
      feature_value: parseFloat(r.feature_value),
      source: r.source,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    };
  }

  async saveMany(snapshots: FeatureStoreSnapshot[]): Promise<FeatureStoreSnapshot[]> {
    const result: FeatureStoreSnapshot[] = [];
    for (const s of snapshots) {
      result.push(await this.save(s));
    }
    return result;
  }
}
