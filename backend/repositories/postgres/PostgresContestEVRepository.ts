import { ContestEV } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { IContestEVRepository } from "../interfaces";

export class PostgresContestEVRepository implements IContestEVRepository {
  private mapRow(r: any): ContestEV {
    return {
      id: r.id,
      season: r.season,
      week: Number(r.week),
      contest_id: r.contest_id,
      entry_id: r.entry_id,
      recommended_team_id: r.recommended_team_id,
      contest_size: Number(r.contest_size),
      remaining_entries: Number(r.remaining_entries),
      estimated_ownership: Number(r.estimated_ownership),
      win_probability: Number(r.win_probability),
      future_team_value: Number(r.future_team_value),
      survivor_equity: Number(r.survivor_equity),
      portfolio_score: Number(r.portfolio_score),
      consensus_score: Number(r.consensus_score),
      contest_ev_score: Number(r.contest_ev_score),
      championship_probability: Number(r.championship_probability),
      risk_adjustment: Number(r.risk_adjustment),
      explanation: r.explanation,
      calculation_version: r.calculation_version,
      contest_type: r.contest_type,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    };
  }

  async saveContestEV(snapshots: ContestEV[]): Promise<ContestEV[]> {
    const saved: ContestEV[] = [];
    for (const s of snapshots) {
      const rows = await query(
        `INSERT INTO contest_ev (
          season, week, contest_id, entry_id, recommended_team_id, 
          contest_size, remaining_entries, estimated_ownership, 
          win_probability, future_team_value, survivor_equity, 
          portfolio_score, consensus_score, contest_ev_score, 
          championship_probability, risk_adjustment, explanation, 
          calculation_version, contest_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) 
        RETURNING *`,
        [
          s.season,
          s.week,
          s.contest_id,
          s.entry_id,
          s.recommended_team_id,
          s.contest_size,
          s.remaining_entries,
          s.estimated_ownership,
          s.win_probability,
          s.future_team_value,
          s.survivor_equity,
          s.portfolio_score,
          s.consensus_score,
          s.contest_ev_score,
          s.championship_probability,
          s.risk_adjustment,
          s.explanation,
          s.calculation_version,
          s.contest_type || 'PUBLIC'
        ]
      );
      saved.push(this.mapRow(rows[0]));
    }
    return saved;
  }

  async getLatestContestEV(): Promise<ContestEV[]> {
    const rows = await query(
      `SELECT id, season, week, contest_id, entry_id, recommended_team_id, 
              contest_size, remaining_entries, estimated_ownership, 
              win_probability, future_team_value, survivor_equity, 
              portfolio_score, consensus_score, contest_ev_score, 
              championship_probability, risk_adjustment, explanation, 
              calculation_version, contest_type, created_at 
       FROM contest_ev 
       WHERE calculation_version = (SELECT calculation_version FROM contest_ev ORDER BY id DESC LIMIT 1)
       ORDER BY id ASC`
    );
    return rows.map(r => this.mapRow(r));
  }

  async getContestEV(contestId: string): Promise<ContestEV[]> {
    const rows = await query(
      `SELECT id, season, week, contest_id, entry_id, recommended_team_id, 
              contest_size, remaining_entries, estimated_ownership, 
              win_probability, future_team_value, survivor_equity, 
              portfolio_score, consensus_score, contest_ev_score, 
              championship_probability, risk_adjustment, explanation, 
              calculation_version, contest_type, created_at 
       FROM contest_ev 
       WHERE contest_id = $1 
       ORDER BY id ASC`,
      [contestId]
    );
    return rows.map(r => this.mapRow(r));
  }

  async getContestHistory(): Promise<ContestEV[]> {
    const rows = await query(
      `SELECT id, season, week, contest_id, entry_id, recommended_team_id, 
              contest_size, remaining_entries, estimated_ownership, 
              win_probability, future_team_value, survivor_equity, 
              portfolio_score, consensus_score, contest_ev_score, 
              championship_probability, risk_adjustment, explanation, 
              calculation_version, contest_type, created_at 
       FROM contest_ev 
       ORDER BY id DESC`
    );
    return rows.map(r => this.mapRow(r));
  }

  async deleteWeek(season: string, week: number): Promise<boolean> {
    await query(
      `DELETE FROM contest_ev WHERE season = $1 AND week = $2`,
      [season, week]
    );
    return true;
  }
}
