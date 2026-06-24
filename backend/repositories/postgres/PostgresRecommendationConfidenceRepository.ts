import { RecommendationConfidenceSnapshot } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { IRecommendationConfidenceRepository } from "../interfaces";

export class PostgresRecommendationConfidenceRepository implements IRecommendationConfidenceRepository {
  private mapRow(r: any): RecommendationConfidenceSnapshot {
    return {
      id: r.id,
      season: r.season,
      week: Number(r.week),
      entry_id: r.entry_id,
      team_id: r.team_id,
      recommendation_rank: Number(r.recommendation_rank),
      recommendation_score: Number(r.recommendation_score),
      confidence_score: Number(r.confidence_score),
      stability_score: Number(r.stability_score),
      score_gap_to_next: Number(r.score_gap_to_next),
      score_gap_to_top: Number(r.score_gap_to_top),
      recommendation_volatility: Number(r.recommendation_volatility),
      confidence_tier: r.confidence_tier,
      stability_tier: r.stability_tier,
      explanation: r.explanation,
      calculation_version: r.calculation_version,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    };
  }

  async getAll(): Promise<RecommendationConfidenceSnapshot[]> {
    const rows = await query(
      `SELECT id, season, week, entry_id, team_id, recommendation_rank, recommendation_score, 
              confidence_score, stability_score, score_gap_to_next, score_gap_to_top, 
              recommendation_volatility, confidence_tier, stability_tier, explanation, 
              calculation_version, created_at 
       FROM recommendation_confidence_snapshots 
       ORDER BY id DESC`
    );
    return rows.map(r => this.mapRow(r));
  }

  async getBySeasonAndWeek(season: string, week: number): Promise<RecommendationConfidenceSnapshot[]> {
    const rows = await query(
      `SELECT id, season, week, entry_id, team_id, recommendation_rank, recommendation_score, 
              confidence_score, stability_score, score_gap_to_next, score_gap_to_top, 
              recommendation_volatility, confidence_tier, stability_tier, explanation, 
              calculation_version, created_at 
       FROM recommendation_confidence_snapshots 
       WHERE season = $1 AND week = $2 
       ORDER BY id ASC`,
      [season, week]
    );
    return rows.map(r => this.mapRow(r));
  }

  async getLatest(): Promise<RecommendationConfidenceSnapshot[]> {
    const rows = await query(
      `SELECT id, season, week, entry_id, team_id, recommendation_rank, recommendation_score, 
              confidence_score, stability_score, score_gap_to_next, score_gap_to_top, 
              recommendation_volatility, confidence_tier, stability_tier, explanation, 
              calculation_version, created_at 
       FROM recommendation_confidence_snapshots 
       WHERE calculation_version = (SELECT calculation_version FROM recommendation_confidence_snapshots ORDER BY id DESC LIMIT 1)
       ORDER BY id ASC`
    );
    return rows.map(r => this.mapRow(r));
  }

  async getByEntryId(entryId: string): Promise<RecommendationConfidenceSnapshot[]> {
    const rows = await query(
      `SELECT id, season, week, entry_id, team_id, recommendation_rank, recommendation_score, 
              confidence_score, stability_score, score_gap_to_next, score_gap_to_top, 
              recommendation_volatility, confidence_tier, stability_tier, explanation, 
              calculation_version, created_at 
       FROM recommendation_confidence_snapshots 
       WHERE entry_id = $1 
       ORDER BY season DESC, week DESC, id ASC`,
      [entryId]
    );
    return rows.map(r => this.mapRow(r));
  }

  async getByTeamId(teamId: string): Promise<RecommendationConfidenceSnapshot[]> {
    const rows = await query(
      `SELECT id, season, week, entry_id, team_id, recommendation_rank, recommendation_score, 
              confidence_score, stability_score, score_gap_to_next, score_gap_to_top, 
              recommendation_volatility, confidence_tier, stability_tier, explanation, 
              calculation_version, created_at 
       FROM recommendation_confidence_snapshots 
       WHERE team_id = $1 
       ORDER BY season DESC, week DESC, id ASC`,
      [teamId]
    );
    return rows.map(r => this.mapRow(r));
  }

  async getTopConfidence(limit: number): Promise<RecommendationConfidenceSnapshot[]> {
    const rows = await query(
      `SELECT id, season, week, entry_id, team_id, recommendation_rank, recommendation_score, 
              confidence_score, stability_score, score_gap_to_next, score_gap_to_top, 
              recommendation_volatility, confidence_tier, stability_tier, explanation, 
              calculation_version, created_at 
       FROM recommendation_confidence_snapshots 
       ORDER BY confidence_score DESC, id DESC 
       LIMIT $1`,
      [limit]
    );
    return rows.map(r => this.mapRow(r));
  }

  async save(snapshot: RecommendationConfidenceSnapshot): Promise<RecommendationConfidenceSnapshot> {
    const rows = await query(
      `INSERT INTO recommendation_confidence_snapshots (
         season, week, entry_id, team_id, recommendation_rank, recommendation_score, 
         confidence_score, stability_score, score_gap_to_next, score_gap_to_top, 
         recommendation_volatility, confidence_tier, stability_tier, explanation, 
         calculation_version
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
       RETURNING *`,
      [
        snapshot.season,
        snapshot.week,
        snapshot.entry_id,
        snapshot.team_id,
        snapshot.recommendation_rank,
        snapshot.recommendation_score,
        snapshot.confidence_score,
        snapshot.stability_score,
        snapshot.score_gap_to_next,
        snapshot.score_gap_to_top,
        snapshot.recommendation_volatility,
        snapshot.confidence_tier,
        snapshot.stability_tier,
        snapshot.explanation,
        snapshot.calculation_version
      ]
    );
    return this.mapRow(rows[0]);
  }

  async saveMany(snapshots: RecommendationConfidenceSnapshot[]): Promise<RecommendationConfidenceSnapshot[]> {
    const saved: RecommendationConfidenceSnapshot[] = [];
    for (const snapshot of snapshots) {
      saved.push(await this.save(snapshot));
    }
    return saved;
  }

  async deleteBySeasonAndWeek(season: string, week: number): Promise<boolean> {
    await query(
      `DELETE FROM recommendation_confidence_snapshots WHERE season = $1 AND week = $2`,
      [season, week]
    );
    return true;
  }
}
