import { WeeklyLearningHistoryRecord, LearningTrendRecord } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { ILearningRepository } from "../interfaces";

export class PostgresLearningRepository implements ILearningRepository {
  private mapHistoryRow(r: any): WeeklyLearningHistoryRecord {
    return {
      id: r.id,
      season: r.season,
      week: Number(r.week),
      engine_version: r.engine_version,
      model_hash: r.model_hash,
      policy_version: r.policy_version,
      data_version: r.data_version,
      recommendations: Number(r.recommendations),
      correct_predictions: Number(r.correct_predictions),
      incorrect_predictions: Number(r.incorrect_predictions),
      accuracy: Number(r.accuracy),
      average_confidence: Number(r.average_confidence),
      average_expected_value: Number(r.average_expected_value),
      average_future_value: Number(r.average_future_value),
      average_championship_probability: Number(r.average_championship_probability),
      average_closing_line_value: Number(r.average_closing_line_value),
      lessons_learned: r.lessons_learned,
      strengths: r.strengths,
      weaknesses: r.weaknesses,
      recommendations_for_improvement: r.recommendations_for_improvement,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    };
  }

  private mapTrendRow(r: any): LearningTrendRecord {
    return {
      id: r.id,
      metric_name: r.metric_name,
      current_value: Number(r.current_value),
      previous_value: Number(r.previous_value),
      percent_change: Number(r.percent_change),
      trend_direction: r.trend_direction,
      observation_count: Number(r.observation_count),
      updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : undefined
    };
  }

  async saveLearningHistory(record: WeeklyLearningHistoryRecord): Promise<WeeklyLearningHistoryRecord> {
    const rows = await query(
      `INSERT INTO weekly_learning_history (
        season, week, engine_version, model_hash, policy_version, data_version,
        recommendations, correct_predictions, incorrect_predictions, accuracy,
        average_confidence, average_expected_value, average_future_value,
        average_championship_probability, average_closing_line_value,
        lessons_learned, strengths, weaknesses, recommendations_for_improvement
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      ON CONFLICT (season, week) DO UPDATE SET
        engine_version = EXCLUDED.engine_version,
        model_hash = EXCLUDED.model_hash,
        policy_version = EXCLUDED.policy_version,
        data_version = EXCLUDED.data_version,
        recommendations = EXCLUDED.recommendations,
        correct_predictions = EXCLUDED.correct_predictions,
        incorrect_predictions = EXCLUDED.incorrect_predictions,
        accuracy = EXCLUDED.accuracy,
        average_confidence = EXCLUDED.average_confidence,
        average_expected_value = EXCLUDED.average_expected_value,
        average_future_value = EXCLUDED.average_future_value,
        average_championship_probability = EXCLUDED.average_championship_probability,
        average_closing_line_value = EXCLUDED.average_closing_line_value,
        lessons_learned = EXCLUDED.lessons_learned,
        strengths = EXCLUDED.strengths,
        weaknesses = EXCLUDED.weaknesses,
        recommendations_for_improvement = EXCLUDED.recommendations_for_improvement
      RETURNING *`,
      [
        record.season,
        record.week,
        record.engine_version,
        record.model_hash,
        record.policy_version,
        record.data_version,
        record.recommendations,
        record.correct_predictions,
        record.incorrect_predictions,
        record.accuracy,
        record.average_confidence,
        record.average_expected_value,
        record.average_future_value,
        record.average_championship_probability,
        record.average_closing_line_value,
        record.lessons_learned,
        record.strengths,
        record.weaknesses,
        record.recommendations_for_improvement
      ]
    );
    return this.mapHistoryRow(rows[0]);
  }

  async getLearningHistory(): Promise<WeeklyLearningHistoryRecord[]> {
    const rows = await query(
      `SELECT * FROM weekly_learning_history
       ORDER BY season DESC, week DESC`
    );
    return rows.map(r => this.mapHistoryRow(r));
  }

  async getLearningHistoryBySeasonAndWeek(season: string, week: number): Promise<WeeklyLearningHistoryRecord | null> {
    const rows = await query(
      `SELECT * FROM weekly_learning_history
       WHERE season = $1 AND week = $2`,
      [season, week]
    );
    if (rows.length === 0) return null;
    return this.mapHistoryRow(rows[0]);
  }

  async deleteLearningHistory(season: string, week: number): Promise<boolean> {
    await query(
      `DELETE FROM weekly_learning_history
       WHERE season = $1 AND week = $2`,
      [season, week]
    );
    return true;
  }

  async saveLearningTrend(record: LearningTrendRecord): Promise<LearningTrendRecord> {
    const rows = await query(
      `INSERT INTO learning_trends (
        metric_name, current_value, previous_value, percent_change, trend_direction, observation_count
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (metric_name) DO UPDATE SET
        current_value = EXCLUDED.current_value,
        previous_value = EXCLUDED.previous_value,
        percent_change = EXCLUDED.percent_change,
        trend_direction = EXCLUDED.trend_direction,
        observation_count = EXCLUDED.observation_count,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        record.metric_name,
        record.current_value,
        record.previous_value,
        record.percent_change,
        record.trend_direction,
        record.observation_count
      ]
    );
    return this.mapTrendRow(rows[0]);
  }

  async getLearningTrends(): Promise<LearningTrendRecord[]> {
    const rows = await query(
      `SELECT * FROM learning_trends
       ORDER BY metric_name ASC`
    );
    return rows.map(r => this.mapTrendRow(r));
  }

  async getLearningTrendByName(metricName: string): Promise<LearningTrendRecord | null> {
    const rows = await query(
      `SELECT * FROM learning_trends
       WHERE metric_name = $1`,
      [metricName]
    );
    if (rows.length === 0) return null;
    return this.mapTrendRow(rows[0]);
  }
}
