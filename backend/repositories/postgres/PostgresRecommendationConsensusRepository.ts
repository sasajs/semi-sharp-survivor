import { RecommendationConsensus } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { IRecommendationConsensusRepository } from "../interfaces";

export class PostgresRecommendationConsensusRepository implements IRecommendationConsensusRepository {
  private mapRow(r: any): RecommendationConsensus {
    return {
      id: r.id,
      season: r.season,
      week: Number(r.week),
      entry_id: r.entry_id,
      team_id: r.team_id,
      candidate_score: Number(r.candidate_score),
      survivor_equity_score: Number(r.survivor_equity_score),
      recommendation_score: Number(r.recommendation_score),
      confidence_score: Number(r.confidence_score),
      ownership_score: Number(r.ownership_score),
      future_value_score: Number(r.future_value_score),
      consensus_score: Number(r.consensus_score),
      agreement_count: Number(r.agreement_count),
      consensus_tier: r.consensus_tier,
      consensus_summary: r.consensus_summary,
      calculation_version: r.calculation_version,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    };
  }

  async getAll(): Promise<RecommendationConsensus[]> {
    const rows = await query(
      `SELECT id, season, week, entry_id, team_id, candidate_score, survivor_equity_score, 
              recommendation_score, confidence_score, ownership_score, future_value_score, 
              consensus_score, agreement_count, consensus_tier, consensus_summary, 
              calculation_version, created_at 
       FROM recommendation_consensus 
       ORDER BY id DESC`
    );
    return rows.map(r => this.mapRow(r));
  }

  async getBySeasonAndWeek(season: string, week: number): Promise<RecommendationConsensus[]> {
    const rows = await query(
      `SELECT id, season, week, entry_id, team_id, candidate_score, survivor_equity_score, 
              recommendation_score, confidence_score, ownership_score, future_value_score, 
              consensus_score, agreement_count, consensus_tier, consensus_summary, 
              calculation_version, created_at 
       FROM recommendation_consensus 
       WHERE season = $1 AND week = $2 
       ORDER BY id ASC`,
      [season, week]
    );
    return rows.map(r => this.mapRow(r));
  }

  async getLatest(): Promise<RecommendationConsensus[]> {
    const rows = await query(
      `SELECT id, season, week, entry_id, team_id, candidate_score, survivor_equity_score, 
              recommendation_score, confidence_score, ownership_score, future_value_score, 
              consensus_score, agreement_count, consensus_tier, consensus_summary, 
              calculation_version, created_at 
       FROM recommendation_consensus 
       WHERE calculation_version = (SELECT calculation_version FROM recommendation_consensus ORDER BY id DESC LIMIT 1)
       ORDER BY id ASC`
    );
    return rows.map(r => this.mapRow(r));
  }

  async getByEntryId(entryId: string): Promise<RecommendationConsensus[]> {
    const rows = await query(
      `SELECT id, season, week, entry_id, team_id, candidate_score, survivor_equity_score, 
              recommendation_score, confidence_score, ownership_score, future_value_score, 
              consensus_score, agreement_count, consensus_tier, consensus_summary, 
              calculation_version, created_at 
       FROM recommendation_consensus 
       WHERE entry_id = $1 
       ORDER BY season DESC, week DESC, id ASC`,
      [entryId]
    );
    return rows.map(r => this.mapRow(r));
  }

  async getByTeamId(teamId: string): Promise<RecommendationConsensus[]> {
    const rows = await query(
      `SELECT id, season, week, entry_id, team_id, candidate_score, survivor_equity_score, 
              recommendation_score, confidence_score, ownership_score, future_value_score, 
              consensus_score, agreement_count, consensus_tier, consensus_summary, 
              calculation_version, created_at 
       FROM recommendation_consensus 
       WHERE team_id = $1 
       ORDER BY season DESC, week DESC, id ASC`,
      [teamId]
    );
    return rows.map(r => this.mapRow(r));
  }

  async getTopConsensus(limit: number): Promise<RecommendationConsensus[]> {
    const rows = await query(
      `SELECT id, season, week, entry_id, team_id, candidate_score, survivor_equity_score, 
              recommendation_score, confidence_score, ownership_score, future_value_score, 
              consensus_score, agreement_count, consensus_tier, consensus_summary, 
              calculation_version, created_at 
       FROM recommendation_consensus 
       ORDER BY consensus_score DESC, id DESC 
       LIMIT $1`,
      [limit]
    );
    return rows.map(r => this.mapRow(r));
  }

  async save(snapshot: RecommendationConsensus): Promise<RecommendationConsensus> {
    const rows = await query(
      `INSERT INTO recommendation_consensus (
         season, week, entry_id, team_id, candidate_score, survivor_equity_score, 
         recommendation_score, confidence_score, ownership_score, future_value_score, 
         consensus_score, agreement_count, consensus_tier, consensus_summary, 
         calculation_version
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
       RETURNING *`,
      [
        snapshot.season,
        snapshot.week,
        snapshot.entry_id,
        snapshot.team_id,
        snapshot.candidate_score,
        snapshot.survivor_equity_score,
        snapshot.recommendation_score,
        snapshot.confidence_score,
        snapshot.ownership_score,
        snapshot.future_value_score,
        snapshot.consensus_score,
        snapshot.agreement_count,
        snapshot.consensus_tier,
        snapshot.consensus_summary,
        snapshot.calculation_version
      ]
    );
    return this.mapRow(rows[0]);
  }

  async saveMany(snapshots: RecommendationConsensus[]): Promise<RecommendationConsensus[]> {
    const saved: RecommendationConsensus[] = [];
    for (const snapshot of snapshots) {
      saved.push(await this.save(snapshot));
    }
    return saved;
  }

  async deleteBySeasonAndWeek(season: string, week: number): Promise<boolean> {
    await query(
      `DELETE FROM recommendation_consensus WHERE season = $1 AND week = $2`,
      [season, week]
    );
    return true;
  }
}
