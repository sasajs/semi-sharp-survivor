import { ContestDynamicsSnapshot } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { IContestDynamicsRepository } from "../interfaces";

export class PostgresContestDynamicsRepository implements IContestDynamicsRepository {
  async getAll(): Promise<ContestDynamicsSnapshot[]> {
    const rows = await query(
      `SELECT id, season, week, entry_id, team_id, projected_ownership_pct, 
              chalk_score, leverage_score, uniqueness_score, contest_equity_adjustment, 
              strategy_profile, calculation_version, created_at 
       FROM contest_dynamics_snapshots ORDER BY id DESC`
    );
    return rows.map(r => ({
      id: r.id,
      season: r.season,
      week: Number(r.week),
      entry_id: r.entry_id,
      team_id: r.team_id,
      projected_ownership_pct: Number(r.projected_ownership_pct),
      chalk_score: Number(r.chalk_score),
      leverage_score: Number(r.leverage_score),
      uniqueness_score: Number(r.uniqueness_score),
      contest_equity_adjustment: Number(r.contest_equity_adjustment),
      strategy_profile: r.strategy_profile,
      calculation_version: r.calculation_version,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    }));
  }

  async getBySeasonAndWeek(season: string, week: number): Promise<ContestDynamicsSnapshot[]> {
    const rows = await query(
      `SELECT id, season, week, entry_id, team_id, projected_ownership_pct, 
              chalk_score, leverage_score, uniqueness_score, contest_equity_adjustment, 
              strategy_profile, calculation_version, created_at 
       FROM contest_dynamics_snapshots 
       WHERE season = $1 AND week = $2 
       ORDER BY contest_equity_adjustment DESC`,
      [season, week]
    );
    return rows.map(r => ({
      id: r.id,
      season: r.season,
      week: Number(r.week),
      entry_id: r.entry_id,
      team_id: r.team_id,
      projected_ownership_pct: Number(r.projected_ownership_pct),
      chalk_score: Number(r.chalk_score),
      leverage_score: Number(r.leverage_score),
      uniqueness_score: Number(r.uniqueness_score),
      contest_equity_adjustment: Number(r.contest_equity_adjustment),
      strategy_profile: r.strategy_profile,
      calculation_version: r.calculation_version,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    }));
  }

  async getLatest(): Promise<ContestDynamicsSnapshot[]> {
    const versionRows = await query(
      "SELECT calculation_version FROM contest_dynamics_snapshots ORDER BY created_at DESC, id DESC LIMIT 1"
    );
    if (versionRows.length === 0) return [];
    const latestVersion = versionRows[0].calculation_version;

    const rows = await query(
      `SELECT id, season, week, entry_id, team_id, projected_ownership_pct, 
              chalk_score, leverage_score, uniqueness_score, contest_equity_adjustment, 
              strategy_profile, calculation_version, created_at 
       FROM contest_dynamics_snapshots 
       WHERE calculation_version = $1 
       ORDER BY contest_equity_adjustment DESC`,
      [latestVersion]
    );
    return rows.map(r => ({
      id: r.id,
      season: r.season,
      week: Number(r.week),
      entry_id: r.entry_id,
      team_id: r.team_id,
      projected_ownership_pct: Number(r.projected_ownership_pct),
      chalk_score: Number(r.chalk_score),
      leverage_score: Number(r.leverage_score),
      uniqueness_score: Number(r.uniqueness_score),
      contest_equity_adjustment: Number(r.contest_equity_adjustment),
      strategy_profile: r.strategy_profile,
      calculation_version: r.calculation_version,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    }));
  }

  async getByEntryId(entryId: string): Promise<ContestDynamicsSnapshot[]> {
    const rows = await query(
      `SELECT id, season, week, entry_id, team_id, projected_ownership_pct, 
              chalk_score, leverage_score, uniqueness_score, contest_equity_adjustment, 
              strategy_profile, calculation_version, created_at 
       FROM contest_dynamics_snapshots 
       WHERE entry_id = $1 
       ORDER BY created_at DESC, week ASC`,
      [entryId]
    );
    return rows.map(r => ({
      id: r.id,
      season: r.season,
      week: Number(r.week),
      entry_id: r.entry_id,
      team_id: r.team_id,
      projected_ownership_pct: Number(r.projected_ownership_pct),
      chalk_score: Number(r.chalk_score),
      leverage_score: Number(r.leverage_score),
      uniqueness_score: Number(r.uniqueness_score),
      contest_equity_adjustment: Number(r.contest_equity_adjustment),
      strategy_profile: r.strategy_profile,
      calculation_version: r.calculation_version,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    }));
  }

  async save(snapshot: ContestDynamicsSnapshot): Promise<ContestDynamicsSnapshot> {
    const rows = await query(
      `INSERT INTO contest_dynamics_snapshots (
         season, week, entry_id, team_id, projected_ownership_pct, 
         chalk_score, leverage_score, uniqueness_score, contest_equity_adjustment, 
         strategy_profile, calculation_version
       ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING *`,
      [
        snapshot.season,
        snapshot.week,
        snapshot.entry_id,
        snapshot.team_id,
        snapshot.projected_ownership_pct,
        snapshot.chalk_score,
        snapshot.leverage_score,
        snapshot.uniqueness_score,
        snapshot.contest_equity_adjustment,
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
      projected_ownership_pct: Number(r.projected_ownership_pct),
      chalk_score: Number(r.chalk_score),
      leverage_score: Number(r.leverage_score),
      uniqueness_score: Number(r.uniqueness_score),
      contest_equity_adjustment: Number(r.contest_equity_adjustment),
      strategy_profile: r.strategy_profile,
      calculation_version: r.calculation_version,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    };
  }

  async saveMany(snapshots: ContestDynamicsSnapshot[]): Promise<ContestDynamicsSnapshot[]> {
    const results: ContestDynamicsSnapshot[] = [];
    for (const s of snapshots) {
      const saved = await this.save(s);
      results.push(saved);
    }
    return results;
  }

  async deleteBySeasonAndWeek(season: string, week: number): Promise<boolean> {
    await query(
      "DELETE FROM contest_dynamics_snapshots WHERE season = $1 AND week = $2",
      [season, week]
    );
    return true;
  }
}
