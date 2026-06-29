import { RecommendationEvolution, RecommendationChangeEvent, RecommendationEvolutionSummary } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { IRecommendationEvolutionRepository } from "../interfaces";

export class PostgresRecommendationEvolutionRepository implements IRecommendationEvolutionRepository {
  private mapEvolutionRow(r: any): RecommendationEvolution {
    return {
      id: r.id,
      season: r.season,
      week: Number(r.week),
      contest_id: r.contest_id ? Number(r.contest_id) : undefined,
      recommendation_id: r.recommendation_id ? Number(r.recommendation_id) : undefined,
      team_id: r.team_id,
      previous_rank: r.previous_rank !== null ? Number(r.previous_rank) : undefined,
      new_rank: r.new_rank !== null ? Number(r.new_rank) : undefined,
      previous_confidence: r.previous_confidence !== null ? Number(r.previous_confidence) : undefined,
      new_confidence: r.new_confidence !== null ? Number(r.new_confidence) : undefined,
      previous_probability: r.previous_probability !== null ? Number(r.previous_probability) : undefined,
      new_probability: r.new_probability !== null ? Number(r.new_probability) : undefined,
      previous_expected_value: r.previous_expected_value !== null ? Number(r.previous_expected_value) : undefined,
      new_expected_value: r.new_expected_value !== null ? Number(r.new_expected_value) : undefined,
      previous_model_weight: r.previous_model_weight !== null ? Number(r.previous_model_weight) : undefined,
      new_model_weight: r.new_model_weight !== null ? Number(r.new_model_weight) : undefined,
      evolution_reason: r.evolution_reason,
      triggering_event: r.triggering_event,
      recommendation_status: r.recommendation_status,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    };
  }

  private mapChangeEventRow(r: any): RecommendationChangeEvent {
    return {
      id: r.id,
      recommendation_id: Number(r.recommendation_id),
      event_type: r.event_type,
      event_source: r.event_source,
      event_description: r.event_description,
      impact_score: Number(r.impact_score),
      previous_value: r.previous_value !== null ? String(r.previous_value) : undefined,
      new_value: r.new_value !== null ? String(r.new_value) : undefined,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    };
  }

  private mapSummaryRow(r: any): RecommendationEvolutionSummary {
    return {
      id: r.id,
      season: r.season,
      week: Number(r.week),
      total_changes: Number(r.total_changes),
      major_changes: Number(r.major_changes),
      stable_recommendations: Number(r.stable_recommendations),
      average_confidence_delta: Number(r.average_confidence_delta),
      average_rank_delta: Number(r.average_rank_delta),
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    };
  }

  async saveEvolution(evolution: RecommendationEvolution): Promise<RecommendationEvolution> {
    const rows = await query(
      `INSERT INTO recommendation_evolution (
        season, week, contest_id, recommendation_id, team_id,
        previous_rank, new_rank, previous_confidence, new_confidence,
        previous_probability, new_probability, previous_expected_value, new_expected_value,
        previous_model_weight, new_model_weight, evolution_reason, triggering_event, recommendation_status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, COALESCE($19, CURRENT_TIMESTAMP))
      RETURNING *`,
      [
        evolution.season,
        evolution.week,
        evolution.contest_id,
        evolution.recommendation_id,
        evolution.team_id,
        evolution.previous_rank,
        evolution.new_rank,
        evolution.previous_confidence,
        evolution.new_confidence,
        evolution.previous_probability,
        evolution.new_probability,
        evolution.previous_expected_value,
        evolution.new_expected_value,
        evolution.previous_model_weight,
        evolution.new_model_weight,
        evolution.evolution_reason,
        evolution.triggering_event,
        evolution.recommendation_status,
        evolution.created_at
      ]
    );
    return this.mapEvolutionRow(rows[0]);
  }

  async saveEvolutionMany(evolutions: RecommendationEvolution[]): Promise<RecommendationEvolution[]> {
    const results: RecommendationEvolution[] = [];
    for (const evo of evolutions) {
      const saved = await this.saveEvolution(evo);
      results.push(saved);
    }
    return results;
  }

  async getEvolutionHistory(season?: string, week?: number): Promise<RecommendationEvolution[]> {
    let sql = `SELECT * FROM recommendation_evolution WHERE 1=1`;
    const params: any[] = [];

    if (season) {
      params.push(season);
      sql += ` AND season = $${params.length}`;
    }
    if (week !== undefined) {
      params.push(week);
      sql += ` AND week = $${params.length}`;
    }

    sql += ` ORDER BY season DESC, week DESC, id DESC`;
    const rows = await query(sql, params);
    return rows.map(r => this.mapEvolutionRow(r));
  }

  async getEvolutionById(id: number): Promise<RecommendationEvolution | null> {
    const rows = await query(`SELECT * FROM recommendation_evolution WHERE id = $1`, [id]);
    if (rows.length === 0) return null;
    return this.mapEvolutionRow(rows[0]);
  }

  async getEvolutionByRecommendationId(recommendationId: number): Promise<RecommendationEvolution[]> {
    const rows = await query(
      `SELECT * FROM recommendation_evolution WHERE recommendation_id = $1 ORDER BY id ASC`,
      [recommendationId]
    );
    return rows.map(r => this.mapEvolutionRow(r));
  }

  async saveChangeEvent(event: RecommendationChangeEvent): Promise<RecommendationChangeEvent> {
    const rows = await query(
      `INSERT INTO recommendation_change_events (
        recommendation_id, event_type, event_source, event_description, impact_score, previous_value, new_value
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        event.recommendation_id,
        event.event_type,
        event.event_source,
        event.event_description,
        event.impact_score,
        event.previous_value,
        event.new_value
      ]
    );
    return this.mapChangeEventRow(rows[0]);
  }

  async saveChangeEventMany(events: RecommendationChangeEvent[]): Promise<RecommendationChangeEvent[]> {
    const results: RecommendationChangeEvent[] = [];
    for (const e of events) {
      const saved = await this.saveChangeEvent(e);
      results.push(saved);
    }
    return results;
  }

  async getChangeEvents(recommendationId?: number): Promise<RecommendationChangeEvent[]> {
    let sql = `SELECT * FROM recommendation_change_events WHERE 1=1`;
    const params: any[] = [];

    if (recommendationId !== undefined) {
      params.push(recommendationId);
      sql += ` AND recommendation_id = $${params.length}`;
    }

    sql += ` ORDER BY created_at DESC, id DESC`;
    const rows = await query(sql, params);
    return rows.map(r => this.mapChangeEventRow(r));
  }

  async saveSummary(summary: RecommendationEvolutionSummary): Promise<RecommendationEvolutionSummary> {
    const rows = await query(
      `INSERT INTO recommendation_evolution_summary (
        season, week, total_changes, major_changes, stable_recommendations,
        average_confidence_delta, average_rank_delta
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        summary.season,
        summary.week,
        summary.total_changes,
        summary.major_changes,
        summary.stable_recommendations,
        summary.average_confidence_delta,
        summary.average_rank_delta
      ]
    );
    return this.mapSummaryRow(rows[0]);
  }

  async getSummaries(season?: string, week?: number): Promise<RecommendationEvolutionSummary[]> {
    let sql = `SELECT * FROM recommendation_evolution_summary WHERE 1=1`;
    const params: any[] = [];

    if (season) {
      params.push(season);
      sql += ` AND season = $${params.length}`;
    }
    if (week !== undefined) {
      params.push(week);
      sql += ` AND week = $${params.length}`;
    }

    sql += ` ORDER BY season DESC, week DESC, id DESC`;
    const rows = await query(sql, params);
    return rows.map(r => this.mapSummaryRow(r));
  }
}
