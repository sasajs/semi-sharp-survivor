import { AdaptiveModelWeight } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { IAdaptiveModelWeightRepository } from "../interfaces";

export class PostgresAdaptiveModelWeightRepository implements IAdaptiveModelWeightRepository {
  private mapRow(r: any): AdaptiveModelWeight {
    return {
      id: r.id,
      season: r.season,
      week: Number(r.week),
      model_name: r.model_name,
      model_version: r.model_version,
      prediction_type: r.prediction_type,
      previous_weight: Number(r.previous_weight),
      recommended_weight: Number(r.recommended_weight),
      weight_delta: Number(r.weight_delta),
      performance_score: Number(r.performance_score),
      rolling_validation_score: Number(r.rolling_validation_score),
      calibration_score: Number(r.calibration_score),
      clv_score: Number(r.clv_score),
      drift_penalty: Number(r.drift_penalty),
      confidence_score: Number(r.confidence_score),
      final_weight: Number(r.final_weight),
      recommendation_reason: r.recommendation_reason,
      calculation_version: r.calculation_version,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    };
  }

  async saveWeights(weights: AdaptiveModelWeight[]): Promise<AdaptiveModelWeight[]> {
    const saved: AdaptiveModelWeight[] = [];
    for (const w of weights) {
      const rows = await query(
        `INSERT INTO adaptive_model_weights (
          season, week, model_name, model_version, prediction_type,
          previous_weight, recommended_weight, weight_delta,
          performance_score, rolling_validation_score, calibration_score,
          clv_score, drift_penalty, confidence_score, final_weight,
          recommendation_reason, calculation_version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *`,
        [
          w.season,
          w.week,
          w.model_name,
          w.model_version,
          w.prediction_type,
          w.previous_weight,
          w.recommended_weight,
          w.weight_delta,
          w.performance_score,
          w.rolling_validation_score,
          w.calibration_score,
          w.clv_score,
          w.drift_penalty,
          w.confidence_score,
          w.final_weight,
          w.recommendation_reason,
          w.calculation_version
        ]
      );
      saved.push(this.mapRow(rows[0]));
    }
    return saved;
  }

  async getLatestWeights(): Promise<AdaptiveModelWeight[]> {
    const rows = await query(
      `SELECT id, season, week, model_name, model_version, prediction_type,
              previous_weight, recommended_weight, weight_delta,
              performance_score, rolling_validation_score, calibration_score,
              clv_score, drift_penalty, confidence_score, final_weight,
              recommendation_reason, calculation_version, created_at
       FROM adaptive_model_weights
       WHERE calculation_version = (SELECT calculation_version FROM adaptive_model_weights ORDER BY id DESC LIMIT 1)
       ORDER BY id ASC`
    );
    return rows.map(r => this.mapRow(r));
  }

  async getWeightsByModel(modelName: string): Promise<AdaptiveModelWeight[]> {
    const rows = await query(
      `SELECT id, season, week, model_name, model_version, prediction_type,
              previous_weight, recommended_weight, weight_delta,
              performance_score, rolling_validation_score, calibration_score,
              clv_score, drift_penalty, confidence_score, final_weight,
              recommendation_reason, calculation_version, created_at
       FROM adaptive_model_weights
       WHERE LOWER(model_name) = LOWER($1)
       ORDER BY id ASC`,
      [modelName]
    );
    return rows.map(r => this.mapRow(r));
  }

  async getWeightsHistory(): Promise<AdaptiveModelWeight[]> {
    const rows = await query(
      `SELECT id, season, week, model_name, model_version, prediction_type,
              previous_weight, recommended_weight, weight_delta,
              performance_score, rolling_validation_score, calibration_score,
              clv_score, drift_penalty, confidence_score, final_weight,
              recommendation_reason, calculation_version, created_at
       FROM adaptive_model_weights
       ORDER BY id DESC`
    );
    return rows.map(r => this.mapRow(r));
  }

  async deleteWeightsWeek(season: string, week: number): Promise<boolean> {
    await query(
      `DELETE FROM adaptive_model_weights WHERE season = $1 AND week = $2`,
      [season, week]
    );
    return true;
  }
}
