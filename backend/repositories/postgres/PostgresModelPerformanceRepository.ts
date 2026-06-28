import { ModelPerformance, ModelPerformanceHistoryRecord, ModelPerformanceSummaryRecord } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { IModelPerformanceRepository } from "../interfaces";

export class PostgresModelPerformanceRepository implements IModelPerformanceRepository {
  private mapPerformanceRow(r: any): ModelPerformance {
    return {
      id: r.id,
      season: r.season,
      week: Number(r.week),
      model_name: r.model_name,
      model_version: r.model_version,
      prediction_type: r.prediction_type,
      games_evaluated: Number(r.games_evaluated),
      correct_predictions: Number(r.correct_predictions),
      accuracy: Number(r.accuracy),
      brier_score: Number(r.brier_score),
      log_loss: Number(r.log_loss),
      rmse: Number(r.rmse),
      mae: Number(r.mae),
      spread_clv: Number(r.spread_clv),
      total_clv: Number(r.total_clv),
      calibration_score: Number(r.calibration_score),
      rolling_score: Number(r.rolling_score),
      performance_weight: Number(r.performance_weight),
      recommended_weight: Number(r.recommended_weight),
      active_weight: Number(r.active_weight),
      status: r.status,
      calculation_version: r.calculation_version,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    };
  }

  private mapHistoryRow(r: any): ModelPerformanceHistoryRecord {
    return {
      id: r.id,
      season: r.season,
      week: Number(r.week),
      engine_version: r.engine_version,
      model_hash: r.model_hash,
      data_version: r.data_version,
      policy_version: r.policy_version,
      prediction_count: Number(r.prediction_count),
      accuracy: Number(r.accuracy),
      log_loss: Number(r.log_loss),
      brier_score: Number(r.brier_score),
      calibration_error: Number(r.calibration_error),
      average_confidence: Number(r.average_confidence),
      average_expected_value: Number(r.average_expected_value),
      average_closing_line_value: Number(r.average_closing_line_value),
      average_survival_probability: Number(r.average_survival_probability),
      average_championship_probability: Number(r.average_championship_probability),
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    };
  }

  private mapSummaryRow(r: any): ModelPerformanceSummaryRecord {
    return {
      id: r.id,
      model_hash: r.model_hash,
      engine_version: r.engine_version,
      games_evaluated: Number(r.games_evaluated),
      rolling_accuracy: Number(r.rolling_accuracy),
      rolling_log_loss: Number(r.rolling_log_loss),
      rolling_brier_score: Number(r.rolling_brier_score),
      rolling_calibration_error: Number(r.rolling_calibration_error),
      rolling_expected_value: Number(r.rolling_expected_value),
      rolling_closing_line_value: Number(r.rolling_closing_line_value),
      last_updated: r.last_updated ? new Date(r.last_updated).toISOString() : undefined
    };
  }

  // --- V043 Model Performance Methods ---
  async savePerformance(performances: ModelPerformance[]): Promise<ModelPerformance[]> {
    const results: ModelPerformance[] = [];
    for (const p of performances) {
      const rows = await query(
        `INSERT INTO model_performance (
          season, week, model_name, model_version, prediction_type, games_evaluated,
          correct_predictions, accuracy, brier_score, log_loss, rmse, mae,
          spread_clv, total_clv, calibration_score, rolling_score, performance_weight,
          recommended_weight, active_weight, status, calculation_version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        RETURNING *`,
        [
          p.season, p.week, p.model_name, p.model_version, p.prediction_type, p.games_evaluated,
          p.correct_predictions, p.accuracy, p.brier_score, p.log_loss, p.rmse, p.mae,
          p.spread_clv, p.total_clv, p.calibration_score, p.rolling_score, p.performance_weight,
          p.recommended_weight, p.active_weight, p.status, p.calculation_version
        ]
      );
      results.push(this.mapPerformanceRow(rows[0]));
    }
    return results;
  }

  async getLatestPerformance(): Promise<ModelPerformance[]> {
    const rows = await query(
      `SELECT * FROM model_performance
       WHERE calculation_version = (SELECT calculation_version FROM model_performance ORDER BY id DESC LIMIT 1)`
    );
    return rows.map(r => this.mapPerformanceRow(r));
  }

  async getPerformanceByName(modelName: string): Promise<ModelPerformance[]> {
    const rows = await query(
      `SELECT * FROM model_performance
       WHERE LOWER(model_name) = LOWER($1)
       ORDER BY season DESC, week DESC`,
      [modelName]
    );
    return rows.map(r => this.mapPerformanceRow(r));
  }

  async getPerformanceHistory(): Promise<ModelPerformance[]> {
    const rows = await query(
      `SELECT * FROM model_performance
       ORDER BY season DESC, week DESC, id DESC`
    );
    return rows.map(r => this.mapPerformanceRow(r));
  }

  async deleteWeek(season: string, week: number): Promise<boolean> {
    const result = await query(
      `DELETE FROM model_performance
       WHERE season = $1 AND week = $2`,
      [season, week]
    );
    // Connection manager returns rows. In typical Express apps here, query returns rows, so we don't necessarily have affectedCount,
    // but returning true or checking is fine.
    return true;
  }

  // --- V053 Model Performance Analytics Methods ---
  async saveHistory(record: ModelPerformanceHistoryRecord): Promise<ModelPerformanceHistoryRecord> {
    const rows = await query(
      `INSERT INTO model_performance_history (
        season, week, engine_version, model_hash, data_version, policy_version,
        prediction_count, accuracy, log_loss, brier_score, calibration_error,
        average_confidence, average_expected_value, average_closing_line_value,
        average_survival_probability, average_championship_probability
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        record.season,
        record.week,
        record.engine_version,
        record.model_hash,
        record.data_version,
        record.policy_version,
        record.prediction_count,
        record.accuracy,
        record.log_loss,
        record.brier_score,
        record.calibration_error,
        record.average_confidence,
        record.average_expected_value,
        record.average_closing_line_value,
        record.average_survival_probability,
        record.average_championship_probability
      ]
    );
    return this.mapHistoryRow(rows[0]);
  }

  async getHistory(): Promise<ModelPerformanceHistoryRecord[]> {
    const rows = await query(
      `SELECT * FROM model_performance_history
       ORDER BY season DESC, week DESC, id DESC`
    );
    return rows.map(r => this.mapHistoryRow(r));
  }

  async getHistoryBySeasonAndWeek(season: string, week: number): Promise<ModelPerformanceHistoryRecord[]> {
    const rows = await query(
      `SELECT * FROM model_performance_history
       WHERE season = $1 AND week = $2
       ORDER BY id DESC`,
      [season, week]
    );
    return rows.map(r => this.mapHistoryRow(r));
  }

  async getHistoryByModelHash(modelHash: string): Promise<ModelPerformanceHistoryRecord[]> {
    const rows = await query(
      `SELECT * FROM model_performance_history
       WHERE model_hash = $1
       ORDER BY season DESC, week DESC`,
      [modelHash]
    );
    return rows.map(r => this.mapHistoryRow(r));
  }

  async saveSummary(record: ModelPerformanceSummaryRecord): Promise<ModelPerformanceSummaryRecord> {
    const rows = await query(
      `INSERT INTO model_performance_summary (
        model_hash, engine_version, games_evaluated, rolling_accuracy,
        rolling_log_loss, rolling_brier_score, rolling_calibration_error,
        rolling_expected_value, rolling_closing_line_value
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (model_hash) DO UPDATE SET
        engine_version = EXCLUDED.engine_version,
        games_evaluated = EXCLUDED.games_evaluated,
        rolling_accuracy = EXCLUDED.rolling_accuracy,
        rolling_log_loss = EXCLUDED.rolling_log_loss,
        rolling_brier_score = EXCLUDED.rolling_brier_score,
        rolling_calibration_error = EXCLUDED.rolling_calibration_error,
        rolling_expected_value = EXCLUDED.rolling_expected_value,
        rolling_closing_line_value = EXCLUDED.rolling_closing_line_value,
        last_updated = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        record.model_hash,
        record.engine_version,
        record.games_evaluated,
        record.rolling_accuracy,
        record.rolling_log_loss,
        record.rolling_brier_score,
        record.rolling_calibration_error,
        record.rolling_expected_value,
        record.rolling_closing_line_value
      ]
    );
    return this.mapSummaryRow(rows[0]);
  }

  async getSummaryByModelHash(modelHash: string): Promise<ModelPerformanceSummaryRecord | null> {
    const rows = await query(
      `SELECT * FROM model_performance_summary
       WHERE model_hash = $1`,
      [modelHash]
    );
    if (rows.length === 0) return null;
    return this.mapSummaryRow(rows[0]);
  }

  async getSummaries(): Promise<ModelPerformanceSummaryRecord[]> {
    const rows = await query(
      `SELECT * FROM model_performance_summary
       ORDER BY id DESC`
    );
    return rows.map(r => this.mapSummaryRow(r));
  }
}
