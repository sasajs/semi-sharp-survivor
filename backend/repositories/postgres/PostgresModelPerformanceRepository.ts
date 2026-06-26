import { ModelPerformance } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { IModelPerformanceRepository } from "../interfaces";

export class PostgresModelPerformanceRepository implements IModelPerformanceRepository {
  private mapRow(r: any): ModelPerformance {
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

  async savePerformance(performances: ModelPerformance[]): Promise<ModelPerformance[]> {
    const saved: ModelPerformance[] = [];
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
          p.season,
          p.week,
          p.model_name,
          p.model_version,
          p.prediction_type,
          p.games_evaluated,
          p.correct_predictions,
          p.accuracy,
          p.brier_score,
          p.log_loss,
          p.rmse,
          p.mae,
          p.spread_clv,
          p.total_clv,
          p.calibration_score,
          p.rolling_score,
          p.performance_weight,
          p.recommended_weight,
          p.active_weight,
          p.status,
          p.calculation_version
        ]
      );
      saved.push(this.mapRow(rows[0]));
    }
    return saved;
  }

  async getLatestPerformance(): Promise<ModelPerformance[]> {
    const rows = await query(
      `SELECT id, season, week, model_name, model_version, prediction_type, games_evaluated,
              correct_predictions, accuracy, brier_score, log_loss, rmse, mae,
              spread_clv, total_clv, calibration_score, rolling_score, performance_weight,
              recommended_weight, active_weight, status, calculation_version, created_at
       FROM model_performance 
       WHERE calculation_version = (SELECT calculation_version FROM model_performance ORDER BY id DESC LIMIT 1)
       ORDER BY id ASC`
    );
    return rows.map(r => this.mapRow(r));
  }

  async getPerformanceByName(modelName: string): Promise<ModelPerformance[]> {
    const rows = await query(
      `SELECT id, season, week, model_name, model_version, prediction_type, games_evaluated,
              correct_predictions, accuracy, brier_score, log_loss, rmse, mae,
              spread_clv, total_clv, calibration_score, rolling_score, performance_weight,
              recommended_weight, active_weight, status, calculation_version, created_at
       FROM model_performance 
       WHERE model_name = $1 
       ORDER BY id ASC`,
      [modelName]
    );
    return rows.map(r => this.mapRow(r));
  }

  async getPerformanceHistory(): Promise<ModelPerformance[]> {
    const rows = await query(
      `SELECT id, season, week, model_name, model_version, prediction_type, games_evaluated,
              correct_predictions, accuracy, brier_score, log_loss, rmse, mae,
              spread_clv, total_clv, calibration_score, rolling_score, performance_weight,
              recommended_weight, active_weight, status, calculation_version, created_at
       FROM model_performance 
       ORDER BY id DESC`
    );
    return rows.map(r => this.mapRow(r));
  }

  async deleteWeek(season: string, week: number): Promise<boolean> {
    await query(
      `DELETE FROM model_performance WHERE season = $1 AND week = $2`,
      [season, week]
    );
    return true;
  }
}
