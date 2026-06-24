import { SurvivorRecommendation } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { ISurvivorRecommendationRepository } from "../interfaces";

export class PostgresSurvivorRecommendationRepository implements ISurvivorRecommendationRepository {
  private mapRow(r: any): SurvivorRecommendation {
    return {
      id: r.id,
      season: r.season,
      week: Number(r.week),
      entry_id: r.entry_id,
      recommended_team_id: r.recommended_team_id,
      recommendation_rank: Number(r.recommendation_rank),
      recommendation_score: Number(r.recommendation_score),
      candidate_score: Number(r.candidate_score),
      survivor_equity_score: Number(r.survivor_equity_score),
      future_team_value_score: Number(r.future_team_value_score),
      projected_ownership_pct: Number(r.projected_ownership_pct),
      contest_equity_adjustment: Number(r.contest_equity_adjustment),
      strategy_profile: r.strategy_profile,
      recommendation_tier: r.recommendation_tier,
      recommendation_reason: r.recommendation_reason,
      calculation_version: r.calculation_version,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    };
  }

  async getAll(): Promise<SurvivorRecommendation[]> {
    const rows = await query(
      `SELECT id, season, week, entry_id, recommended_team_id, recommendation_rank, 
              recommendation_score, candidate_score, survivor_equity_score, future_team_value_score,
              projected_ownership_pct, contest_equity_adjustment, strategy_profile, 
              recommendation_tier, recommendation_reason, calculation_version, created_at 
       FROM survivor_recommendations 
       ORDER BY id DESC`
    );
    return rows.map(r => this.mapRow(r));
  }

  async getBySeasonAndWeek(season: string, week: number): Promise<SurvivorRecommendation[]> {
    const rows = await query(
      `SELECT id, season, week, entry_id, recommended_team_id, recommendation_rank, 
              recommendation_score, candidate_score, survivor_equity_score, future_team_value_score,
              projected_ownership_pct, contest_equity_adjustment, strategy_profile, 
              recommendation_tier, recommendation_reason, calculation_version, created_at 
       FROM survivor_recommendations 
       WHERE season = $1 AND week = $2 
       ORDER BY recommendation_rank ASC`,
      [season, week]
    );
    return rows.map(r => this.mapRow(r));
  }

  async getLatest(): Promise<SurvivorRecommendation[]> {
    const rows = await query(
      `SELECT id, season, week, entry_id, recommended_team_id, recommendation_rank, 
              recommendation_score, candidate_score, survivor_equity_score, future_team_value_score,
              projected_ownership_pct, contest_equity_adjustment, strategy_profile, 
              recommendation_tier, recommendation_reason, calculation_version, created_at 
       FROM survivor_recommendations 
       WHERE calculation_version = (SELECT calculation_version FROM survivor_recommendations ORDER BY id DESC LIMIT 1)
       ORDER BY recommendation_rank ASC`
    );
    return rows.map(r => this.mapRow(r));
  }

  async getByEntryId(entryId: string): Promise<SurvivorRecommendation[]> {
    const rows = await query(
      `SELECT id, season, week, entry_id, recommended_team_id, recommendation_rank, 
              recommendation_score, candidate_score, survivor_equity_score, future_team_value_score,
              projected_ownership_pct, contest_equity_adjustment, strategy_profile, 
              recommendation_tier, recommendation_reason, calculation_version, created_at 
       FROM survivor_recommendations 
       WHERE entry_id = $1 
       ORDER BY season DESC, week DESC, recommendation_rank ASC`,
      [entryId]
    );
    return rows.map(r => this.mapRow(r));
  }

  async save(rec: SurvivorRecommendation): Promise<SurvivorRecommendation> {
    const rows = await query(
      `INSERT INTO survivor_recommendations (
         season, week, entry_id, recommended_team_id, recommendation_rank, 
         recommendation_score, candidate_score, survivor_equity_score, future_team_value_score,
         projected_ownership_pct, contest_equity_adjustment, strategy_profile, 
         recommendation_tier, recommendation_reason, calculation_version
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
       RETURNING *`,
      [
        rec.season,
        rec.week,
        rec.entry_id,
        rec.recommended_team_id,
        rec.recommendation_rank,
        rec.recommendation_score,
        rec.candidate_score,
        rec.survivor_equity_score,
        rec.future_team_value_score,
        rec.projected_ownership_pct,
        rec.contest_equity_adjustment,
        rec.strategy_profile,
        rec.recommendation_tier,
        rec.recommendation_reason,
        rec.calculation_version
      ]
    );
    return this.mapRow(rows[0]);
  }

  async saveMany(recs: SurvivorRecommendation[]): Promise<SurvivorRecommendation[]> {
    const saved: SurvivorRecommendation[] = [];
    for (const rec of recs) {
      saved.push(await this.save(rec));
    }
    return saved;
  }

  async deleteBySeasonAndWeek(season: string, week: number): Promise<boolean> {
    await query(
      `DELETE FROM survivor_recommendations WHERE season = $1 AND week = $2`,
      [season, week]
    );
    return true;
  }
}
