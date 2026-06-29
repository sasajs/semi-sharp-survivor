import { ModelWeight, ModelWeightHistory } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { IModelWeightRepository } from "../interfaces";

export class PostgresModelWeightRepository implements IModelWeightRepository {
  private mapWeightRow(r: any): ModelWeight {
    return {
      id: r.id,
      model_name: r.model_name,
      prediction_type: r.prediction_type,
      current_weight: Number(r.current_weight),
      normalized_weight: Number(r.normalized_weight),
      rolling_accuracy: Number(r.rolling_accuracy),
      rolling_brier: Number(r.rolling_brier),
      rolling_logloss: Number(r.rolling_logloss),
      calibration_score: Number(r.calibration_score),
      last_updated: r.last_updated ? new Date(r.last_updated).toISOString() : undefined,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    };
  }

  private mapHistoryRow(r: any): ModelWeightHistory {
    return {
      id: r.id,
      week: Number(r.week),
      season: r.season,
      model_name: r.model_name,
      prediction_type: r.prediction_type,
      previous_weight: Number(r.previous_weight),
      new_weight: Number(r.new_weight),
      reason: r.reason,
      metrics_snapshot: r.metrics_snapshot,
      policy_version: r.policy_version,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    };
  }

  async getActiveWeights(): Promise<ModelWeight[]> {
    const rows = await query(
      `SELECT * FROM model_weights
       ORDER BY normalized_weight DESC, model_name ASC`
    );
    return rows.map(r => this.mapWeightRow(r));
  }

  async getWeightByModel(modelName: string, predictionType: string): Promise<ModelWeight | null> {
    const rows = await query(
      `SELECT * FROM model_weights
       WHERE model_name = $1 AND prediction_type = $2`,
      [modelName, predictionType]
    );
    if (rows.length === 0) return null;
    return this.mapWeightRow(rows[0]);
  }

  async saveWeight(weight: ModelWeight): Promise<ModelWeight> {
    const rows = await query(
      `INSERT INTO model_weights (
        model_name, prediction_type, current_weight, normalized_weight,
        rolling_accuracy, rolling_brier, rolling_logloss, calibration_score, last_updated
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      ON CONFLICT (model_name, prediction_type) DO UPDATE SET
        current_weight = EXCLUDED.current_weight,
        normalized_weight = EXCLUDED.normalized_weight,
        rolling_accuracy = EXCLUDED.rolling_accuracy,
        rolling_brier = EXCLUDED.rolling_brier,
        rolling_logloss = EXCLUDED.rolling_logloss,
        calibration_score = EXCLUDED.calibration_score,
        last_updated = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        weight.model_name,
        weight.prediction_type,
        weight.current_weight,
        weight.normalized_weight,
        weight.rolling_accuracy,
        weight.rolling_brier,
        weight.rolling_logloss,
        weight.calibration_score
      ]
    );
    return this.mapWeightRow(rows[0]);
  }

  async saveWeightMany(weights: ModelWeight[]): Promise<ModelWeight[]> {
    const results: ModelWeight[] = [];
    for (const w of weights) {
      const saved = await this.saveWeight(w);
      results.push(saved);
    }
    return results;
  }

  async getWeightHistory(season?: string, week?: number): Promise<ModelWeightHistory[]> {
    let sql = `SELECT * FROM model_weight_history WHERE 1=1`;
    const params: any[] = [];
    
    if (season) {
      params.push(season);
      sql += ` AND season = $${params.length}`;
    }
    if (week !== undefined) {
      params.push(week);
      sql += ` AND week = $${params.length}`;
    }
    
    sql += ` ORDER BY season DESC, week DESC, model_name ASC`;
    
    const rows = await query(sql, params);
    return rows.map(r => this.mapHistoryRow(r));
  }

  async saveHistory(history: ModelWeightHistory): Promise<ModelWeightHistory> {
    const rows = await query(
      `INSERT INTO model_weight_history (
        week, season, model_name, prediction_type, previous_weight, new_weight,
        reason, metrics_snapshot, policy_version
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        history.week,
        history.season,
        history.model_name,
        history.prediction_type,
        history.previous_weight,
        history.new_weight,
        history.reason,
        history.metrics_snapshot,
        history.policy_version
      ]
    );
    return this.mapHistoryRow(rows[0]);
  }

  async saveHistoryMany(historyRecords: ModelWeightHistory[]): Promise<ModelWeightHistory[]> {
    const results: ModelWeightHistory[] = [];
    for (const r of historyRecords) {
      const saved = await this.saveHistory(r);
      results.push(saved);
    }
    return results;
  }
}
