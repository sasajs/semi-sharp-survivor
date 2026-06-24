import { RecommendationAudit } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { IRecommendationAuditRepository } from "../interfaces";

export class PostgresRecommendationAuditRepository implements IRecommendationAuditRepository {
  private mapRow(r: any): RecommendationAudit {
    return {
      id: r.id,
      season: r.season,
      week: Number(r.week),
      entry_id: r.entry_id,
      team_id: r.team_id,
      previous_rank: r.previous_rank !== null ? Number(r.previous_rank) : null,
      current_rank: r.current_rank !== null ? Number(r.current_rank) : null,
      rank_delta: Number(r.rank_delta),
      previous_score: r.previous_score !== null ? Number(r.previous_score) : null,
      current_score: r.current_score !== null ? Number(r.current_score) : null,
      score_delta: Number(r.score_delta),
      previous_tier: r.previous_tier,
      current_tier: r.current_tier,
      candidate_score_delta: Number(r.candidate_score_delta),
      survivor_equity_delta: Number(r.survivor_equity_delta),
      future_value_delta: Number(r.future_value_delta),
      ownership_delta: Number(r.ownership_delta),
      contest_dynamics_delta: Number(r.contest_dynamics_delta),
      change_category: r.change_category,
      audit_summary: r.audit_summary,
      calculation_version: r.calculation_version,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    };
  }

  async getAll(): Promise<RecommendationAudit[]> {
    const rows = await query(
      `SELECT id, season, week, entry_id, team_id, previous_rank, current_rank, rank_delta, 
              previous_score, current_score, score_delta, previous_tier, current_tier, 
              candidate_score_delta, survivor_equity_delta, future_value_delta, 
              ownership_delta, contest_dynamics_delta, change_category, audit_summary, 
              calculation_version, created_at 
       FROM recommendation_audits 
       ORDER BY id DESC`
    );
    return rows.map(r => this.mapRow(r));
  }

  async getBySeasonAndWeek(season: string, week: number): Promise<RecommendationAudit[]> {
    const rows = await query(
      `SELECT id, season, week, entry_id, team_id, previous_rank, current_rank, rank_delta, 
              previous_score, current_score, score_delta, previous_tier, current_tier, 
              candidate_score_delta, survivor_equity_delta, future_value_delta, 
              ownership_delta, contest_dynamics_delta, change_category, audit_summary, 
              calculation_version, created_at 
       FROM recommendation_audits 
       WHERE season = $1 AND week = $2 
       ORDER BY id ASC`,
      [season, week]
    );
    return rows.map(r => this.mapRow(r));
  }

  async getLatest(): Promise<RecommendationAudit[]> {
    const rows = await query(
      `SELECT id, season, week, entry_id, team_id, previous_rank, current_rank, rank_delta, 
              previous_score, current_score, score_delta, previous_tier, current_tier, 
              candidate_score_delta, survivor_equity_delta, future_value_delta, 
              ownership_delta, contest_dynamics_delta, change_category, audit_summary, 
              calculation_version, created_at 
       FROM recommendation_audits 
       WHERE calculation_version = (SELECT calculation_version FROM recommendation_audits ORDER BY id DESC LIMIT 1)
       ORDER BY id ASC`
    );
    return rows.map(r => this.mapRow(r));
  }

  async getByEntryId(entryId: string): Promise<RecommendationAudit[]> {
    const rows = await query(
      `SELECT id, season, week, entry_id, team_id, previous_rank, current_rank, rank_delta, 
              previous_score, current_score, score_delta, previous_tier, current_tier, 
              candidate_score_delta, survivor_equity_delta, future_value_delta, 
              ownership_delta, contest_dynamics_delta, change_category, audit_summary, 
              calculation_version, created_at 
       FROM recommendation_audits 
       WHERE entry_id = $1 
       ORDER BY season DESC, week DESC, id ASC`,
      [entryId]
    );
    return rows.map(r => this.mapRow(r));
  }

  async getByTeamId(teamId: string): Promise<RecommendationAudit[]> {
    const rows = await query(
      `SELECT id, season, week, entry_id, team_id, previous_rank, current_rank, rank_delta, 
              previous_score, current_score, score_delta, previous_tier, current_tier, 
              candidate_score_delta, survivor_equity_delta, future_value_delta, 
              ownership_delta, contest_dynamics_delta, change_category, audit_summary, 
              calculation_version, created_at 
       FROM recommendation_audits 
       WHERE team_id = $1 
       ORDER BY season DESC, week DESC, id ASC`,
      [teamId]
    );
    return rows.map(r => this.mapRow(r));
  }

  async save(audit: RecommendationAudit): Promise<RecommendationAudit> {
    const rows = await query(
      `INSERT INTO recommendation_audits (
         season, week, entry_id, team_id, previous_rank, current_rank, rank_delta, 
         previous_score, current_score, score_delta, previous_tier, current_tier, 
         candidate_score_delta, survivor_equity_delta, future_value_delta, 
         ownership_delta, contest_dynamics_delta, change_category, audit_summary, 
         calculation_version
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) 
       RETURNING *`,
      [
        audit.season,
        audit.week,
        audit.entry_id,
        audit.team_id,
        audit.previous_rank,
        audit.current_rank,
        audit.rank_delta,
        audit.previous_score,
        audit.current_score,
        audit.score_delta,
        audit.previous_tier,
        audit.current_tier,
        audit.candidate_score_delta,
        audit.survivor_equity_delta,
        audit.future_value_delta,
        audit.ownership_delta,
        audit.contest_dynamics_delta,
        audit.change_category,
        audit.audit_summary,
        audit.calculation_version
      ]
    );
    return this.mapRow(rows[0]);
  }

  async saveMany(audits: RecommendationAudit[]): Promise<RecommendationAudit[]> {
    const saved: RecommendationAudit[] = [];
    for (const audit of audits) {
      saved.push(await this.save(audit));
    }
    return saved;
  }

  async deleteBySeasonAndWeek(season: string, week: number): Promise<boolean> {
    await query(
      `DELETE FROM recommendation_audits WHERE season = $1 AND week = $2`,
      [season, week]
    );
    return true;
  }
}
