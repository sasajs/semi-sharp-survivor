import { SurvivorEquitySnapshot } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { ISurvivorEquityRepository } from "../interfaces";

export class PostgresSurvivorEquityRepository implements ISurvivorEquityRepository {
  async getAll(): Promise<SurvivorEquitySnapshot[]> {
    const rows = await query(
      `SELECT id, season, week, entry_id, team_id, survival_probability, 
              future_team_value, equity_score, equity_rank, strategy_profile, 
              calculation_version, created_at 
       FROM survivor_equity_snapshots ORDER BY id DESC`
    );
    return rows.map(r => ({
      id: r.id,
      season: r.season,
      week: Number(r.week),
      entry_id: r.entry_id,
      team_id: r.team_id,
      survival_probability: Number(r.survival_probability),
      future_team_value: Number(r.future_team_value),
      equity_score: Number(r.equity_score),
      equity_rank: Number(r.equity_rank),
      strategy_profile: r.strategy_profile,
      calculation_version: r.calculation_version,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    }));
  }

  async getBySeasonAndWeek(season: string, week: number): Promise<SurvivorEquitySnapshot[]> {
    const rows = await query(
      `SELECT id, season, week, entry_id, team_id, survival_probability, 
              future_team_value, equity_score, equity_rank, strategy_profile, 
              calculation_version, created_at 
       FROM survivor_equity_snapshots 
       WHERE season = $1 AND week = $2 
       ORDER BY equity_score DESC`,
      [season, week]
    );
    return rows.map(r => ({
      id: r.id,
      season: r.season,
      week: Number(r.week),
      entry_id: r.entry_id,
      team_id: r.team_id,
      survival_probability: Number(r.survival_probability),
      future_team_value: Number(r.future_team_value),
      equity_score: Number(r.equity_score),
      equity_rank: Number(r.equity_rank),
      strategy_profile: r.strategy_profile,
      calculation_version: r.calculation_version,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    }));
  }

  async getLatest(): Promise<SurvivorEquitySnapshot[]> {
    // Find latest calculation version first
    const versionRows = await query(
      "SELECT calculation_version FROM survivor_equity_snapshots ORDER BY created_at DESC, id DESC LIMIT 1"
    );
    if (versionRows.length === 0) return [];
    const latestVersion = versionRows[0].calculation_version;

    const rows = await query(
      `SELECT id, season, week, entry_id, team_id, survival_probability, 
              future_team_value, equity_score, equity_rank, strategy_profile, 
              calculation_version, created_at 
       FROM survivor_equity_snapshots 
       WHERE calculation_version = $1 
       ORDER BY equity_score DESC`,
      [latestVersion]
    );
    return rows.map(r => ({
      id: r.id,
      season: r.season,
      week: Number(r.week),
      entry_id: r.entry_id,
      team_id: r.team_id,
      survival_probability: Number(r.survival_probability),
      future_team_value: Number(r.future_team_value),
      equity_score: Number(r.equity_score),
      equity_rank: Number(r.equity_rank),
      strategy_profile: r.strategy_profile,
      calculation_version: r.calculation_version,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    }));
  }

  async save(snapshot: SurvivorEquitySnapshot): Promise<SurvivorEquitySnapshot> {
    const rows = await query(
      `INSERT INTO survivor_equity_snapshots (
         season, week, entry_id, team_id, survival_probability, 
         future_team_value, equity_score, equity_rank, strategy_profile, 
         calculation_version
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        snapshot.season,
        snapshot.week,
        snapshot.entry_id,
        snapshot.team_id,
        snapshot.survival_probability,
        snapshot.future_team_value,
        snapshot.equity_score,
        snapshot.equity_rank,
        snapshot.strategy_profile,
        snapshot.calculation_version
      ]
    );
    const r = rows[0];
    return {
      id: r.id,
      season: r.season,
      week: Number(r.week),
      entry_id: r.entry_id,
      team_id: r.team_id,
      survival_probability: Number(r.survival_probability),
      future_team_value: Number(r.future_team_value),
      equity_score: Number(r.equity_score),
      equity_rank: Number(r.equity_rank),
      strategy_profile: r.strategy_profile,
      calculation_version: r.calculation_version,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    };
  }

  async saveMany(snapshots: SurvivorEquitySnapshot[]): Promise<SurvivorEquitySnapshot[]> {
    const results: SurvivorEquitySnapshot[] = [];
    for (const s of snapshots) {
      const saved = await this.save(s);
      results.push(saved);
    }
    return results;
  }

  async deleteBySeasonAndWeek(season: string, week: number): Promise<boolean> {
    await query(
      "DELETE FROM survivor_equity_snapshots WHERE season = $1 AND week = $2",
      [season, week]
    );
    return true;
  }
}
