import { FutureTeamValue } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { IFutureTeamValueRepository } from "../interfaces";

export class PostgresFutureTeamValueRepository implements IFutureTeamValueRepository {
  async getAll(): Promise<FutureTeamValue[]> {
    const rows = await query(
      `SELECT id, season, week, team_id, future_value_score, future_value_rank, 
              future_weeks_considered, calculation_version, created_at 
       FROM future_team_values ORDER BY id DESC`
    );
    return rows.map(r => ({
      id: r.id,
      season: r.season,
      week: Number(r.week),
      team_id: r.team_id,
      future_value_score: Number(r.future_value_score),
      future_value_rank: Number(r.future_value_rank),
      future_weeks_considered: Number(r.future_weeks_considered),
      calculation_version: r.calculation_version,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    }));
  }

  async getBySeasonAndWeek(season: string, week: number): Promise<FutureTeamValue[]> {
    const rows = await query(
      `SELECT id, season, week, team_id, future_value_score, future_value_rank, 
              future_weeks_considered, calculation_version, created_at 
       FROM future_team_values 
       WHERE season = $1 AND week = $2 
       ORDER BY future_value_score DESC`,
      [season, week]
    );
    return rows.map(r => ({
      id: r.id,
      season: r.season,
      week: Number(r.week),
      team_id: r.team_id,
      future_value_score: Number(r.future_value_score),
      future_value_rank: Number(r.future_value_rank),
      future_weeks_considered: Number(r.future_weeks_considered),
      calculation_version: r.calculation_version,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    }));
  }

  async getLatest(): Promise<FutureTeamValue[]> {
    // Find latest calculation version first
    const versionRows = await query(
      "SELECT calculation_version FROM future_team_values ORDER BY created_at DESC, id DESC LIMIT 1"
    );
    if (versionRows.length === 0) return [];
    const latestVersion = versionRows[0].calculation_version;

    const rows = await query(
      `SELECT id, season, week, team_id, future_value_score, future_value_rank, 
              future_weeks_considered, calculation_version, created_at 
       FROM future_team_values 
       WHERE calculation_version = $1 
       ORDER BY future_value_score DESC`,
      [latestVersion]
    );
    return rows.map(r => ({
      id: r.id,
      season: r.season,
      week: Number(r.week),
      team_id: r.team_id,
      future_value_score: Number(r.future_value_score),
      future_value_rank: Number(r.future_value_rank),
      future_weeks_considered: Number(r.future_weeks_considered),
      calculation_version: r.calculation_version,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    }));
  }

  async save(val: FutureTeamValue): Promise<FutureTeamValue> {
    const rows = await query(
      `INSERT INTO future_team_values (
         season, week, team_id, future_value_score, future_value_rank, 
         future_weeks_considered, calculation_version
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        val.season,
        val.week,
        val.team_id,
        val.future_value_score,
        val.future_value_rank,
        val.future_weeks_considered,
        val.calculation_version
      ]
    );
    const r = rows[0];
    return {
      id: r.id,
      season: r.season,
      week: Number(r.week),
      team_id: r.team_id,
      future_value_score: Number(r.future_value_score),
      future_value_rank: Number(r.future_value_rank),
      future_weeks_considered: Number(r.future_weeks_considered),
      calculation_version: r.calculation_version,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    };
  }

  async saveMany(vals: FutureTeamValue[]): Promise<FutureTeamValue[]> {
    const results: FutureTeamValue[] = [];
    for (const val of vals) {
      const saved = await this.save(val);
      results.push(saved);
    }
    return results;
  }

  async deleteBySeasonAndWeek(season: string, week: number): Promise<boolean> {
    await query(
      "DELETE FROM future_team_values WHERE season = $1 AND week = $2",
      [season, week]
    );
    return true;
  }
}
