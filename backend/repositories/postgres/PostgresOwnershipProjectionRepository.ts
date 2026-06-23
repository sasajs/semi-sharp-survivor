import { OwnershipProjection } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { IOwnershipProjectionRepository } from "../interfaces";

export class PostgresOwnershipProjectionRepository implements IOwnershipProjectionRepository {
  async getAll(): Promise<OwnershipProjection[]> {
    const rows = await query(
      `SELECT id, season, week, team_id, projected_ownership_pct, ownership_rank, 
              ownership_tier, projection_source, calculation_version, created_at 
       FROM ownership_projections ORDER BY id DESC`
    );
    return rows.map(r => ({
      id: r.id,
      season: r.season,
      week: Number(r.week),
      team_id: r.team_id,
      projected_ownership_pct: Number(r.projected_ownership_pct),
      ownership_rank: Number(r.ownership_rank),
      ownership_tier: r.ownership_tier,
      projection_source: r.projection_source,
      calculation_version: r.calculation_version,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    }));
  }

  async getBySeasonAndWeek(season: string, week: number): Promise<OwnershipProjection[]> {
    const rows = await query(
      `SELECT id, season, week, team_id, projected_ownership_pct, ownership_rank, 
              ownership_tier, projection_source, calculation_version, created_at 
       FROM ownership_projections 
       WHERE season = $1 AND week = $2 
       ORDER BY projected_ownership_pct DESC`,
      [season, week]
    );
    return rows.map(r => ({
      id: r.id,
      season: r.season,
      week: Number(r.week),
      team_id: r.team_id,
      projected_ownership_pct: Number(r.projected_ownership_pct),
      ownership_rank: Number(r.ownership_rank),
      ownership_tier: r.ownership_tier,
      projection_source: r.projection_source,
      calculation_version: r.calculation_version,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    }));
  }

  async getLatest(): Promise<OwnershipProjection[]> {
    const versionRows = await query(
      "SELECT calculation_version FROM ownership_projections ORDER BY created_at DESC, id DESC LIMIT 1"
    );
    if (versionRows.length === 0) return [];
    const latestVersion = versionRows[0].calculation_version;

    const rows = await query(
      `SELECT id, season, week, team_id, projected_ownership_pct, ownership_rank, 
              ownership_tier, projection_source, calculation_version, created_at 
       FROM ownership_projections 
       WHERE calculation_version = $1 
       ORDER BY projected_ownership_pct DESC`,
      [latestVersion]
    );
    return rows.map(r => ({
      id: r.id,
      season: r.season,
      week: Number(r.week),
      team_id: r.team_id,
      projected_ownership_pct: Number(r.projected_ownership_pct),
      ownership_rank: Number(r.ownership_rank),
      ownership_tier: r.ownership_tier,
      projection_source: r.projection_source,
      calculation_version: r.calculation_version,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    }));
  }

  async save(projection: OwnershipProjection): Promise<OwnershipProjection> {
    const rows = await query(
      `INSERT INTO ownership_projections (
         season, week, team_id, projected_ownership_pct, ownership_rank, 
         ownership_tier, projection_source, calculation_version
       ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [
        projection.season,
        projection.week,
        projection.team_id,
        projection.projected_ownership_pct,
        projection.ownership_rank,
        projection.ownership_tier,
        projection.projection_source,
        projection.calculation_version
      ]
    );
    const r = rows[0];
    return {
      id: r.id,
      season: r.season,
      week: Number(r.week),
      team_id: r.team_id,
      projected_ownership_pct: Number(r.projected_ownership_pct),
      ownership_rank: Number(r.ownership_rank),
      ownership_tier: r.ownership_tier,
      projection_source: r.projection_source,
      calculation_version: r.calculation_version,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    };
  }

  async saveMany(projections: OwnershipProjection[]): Promise<OwnershipProjection[]> {
    const results: OwnershipProjection[] = [];
    for (const p of projections) {
      const saved = await this.save(p);
      results.push(saved);
    }
    return results;
  }

  async deleteBySeasonAndWeek(season: string, week: number): Promise<boolean> {
    await query(
      "DELETE FROM ownership_projections WHERE season = $1 AND week = $2",
      [season, week]
    );
    return true;
  }
}
