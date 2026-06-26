import { ModelDrift } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { IModelDriftRepository } from "../interfaces";

export class PostgresModelDriftRepository implements IModelDriftRepository {
  private mapRow(r: any): ModelDrift {
    return {
      id: r.id,
      season: r.season,
      week: Number(r.week),
      model_name: r.model_name,
      model_version: r.model_version,
      prediction_type: r.prediction_type,
      baseline_accuracy: Number(r.baseline_accuracy),
      current_accuracy: Number(r.current_accuracy),
      accuracy_delta: Number(r.accuracy_delta),
      baseline_brier_score: Number(r.baseline_brier_score),
      current_brier_score: Number(r.current_brier_score),
      brier_delta: Number(r.brier_delta),
      baseline_clv: Number(r.baseline_clv),
      current_clv: Number(r.current_clv),
      clv_delta: Number(r.clv_delta),
      drift_score: Number(r.drift_score),
      drift_level: r.drift_level,
      recommended_action: r.recommended_action,
      recommended_priority: r.recommended_priority,
      explanation: r.explanation,
      calculation_version: r.calculation_version,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    };
  }

  async saveDrift(drifts: ModelDrift[]): Promise<ModelDrift[]> {
    const saved: ModelDrift[] = [];
    for (const d of drifts) {
      const rows = await query(
        `INSERT INTO model_drift (
          season, week, model_name, model_version, prediction_type,
          baseline_accuracy, current_accuracy, accuracy_delta,
          baseline_brier_score, current_brier_score, brier_delta,
          baseline_clv, current_clv, clv_delta,
          drift_score, drift_level, recommended_action, recommended_priority,
          explanation, calculation_version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        RETURNING *`,
        [
          d.season,
          d.week,
          d.model_name,
          d.model_version,
          d.prediction_type,
          d.baseline_accuracy,
          d.current_accuracy,
          d.accuracy_delta,
          d.baseline_brier_score,
          d.current_brier_score,
          d.brier_delta,
          d.baseline_clv,
          d.current_clv,
          d.clv_delta,
          d.drift_score,
          d.drift_level,
          d.recommended_action,
          d.recommended_priority,
          d.explanation,
          d.calculation_version
        ]
      );
      saved.push(this.mapRow(rows[0]));
    }
    return saved;
  }

  async getLatestDrift(): Promise<ModelDrift[]> {
    const rows = await query(
      `SELECT id, season, week, model_name, model_version, prediction_type,
              baseline_accuracy, current_accuracy, accuracy_delta,
              baseline_brier_score, current_brier_score, brier_delta,
              baseline_clv, current_clv, clv_delta,
              drift_score, drift_level, recommended_action, recommended_priority,
              explanation, calculation_version, created_at
       FROM model_drift
       WHERE calculation_version = (SELECT calculation_version FROM model_drift ORDER BY id DESC LIMIT 1)
       ORDER BY id ASC`
    );
    return rows.map(r => this.mapRow(r));
  }

  async getDriftByModel(modelName: string): Promise<ModelDrift[]> {
    const rows = await query(
      `SELECT id, season, week, model_name, model_version, prediction_type,
              baseline_accuracy, current_accuracy, accuracy_delta,
              baseline_brier_score, current_brier_score, brier_delta,
              baseline_clv, current_clv, clv_delta,
              drift_score, drift_level, recommended_action, recommended_priority,
              explanation, calculation_version, created_at
       FROM model_drift
       WHERE LOWER(model_name) = LOWER($1)
       ORDER BY id ASC`,
      [modelName]
    );
    return rows.map(r => this.mapRow(r));
  }

  async getDriftHistory(): Promise<ModelDrift[]> {
    const rows = await query(
      `SELECT id, season, week, model_name, model_version, prediction_type,
              baseline_accuracy, current_accuracy, accuracy_delta,
              baseline_brier_score, current_brier_score, brier_delta,
              baseline_clv, current_clv, clv_delta,
              drift_score, drift_level, recommended_action, recommended_priority,
              explanation, calculation_version, created_at
       FROM model_drift
       ORDER BY id DESC`
    );
    return rows.map(r => this.mapRow(r));
  }

  async deleteDriftWeek(season: string, week: number): Promise<boolean> {
    await query(
      `DELETE FROM model_drift WHERE season = $1 AND week = $2`,
      [season, week]
    );
    return true;
  }
}
