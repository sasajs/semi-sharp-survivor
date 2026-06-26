import { RollingValidation } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { IRollingValidationRepository } from "../interfaces";

export class PostgresRollingValidationRepository implements IRollingValidationRepository {
  private mapRow(r: any): RollingValidation {
    return {
      id: r.id,
      season: r.season,
      start_week: Number(r.start_week),
      end_week: Number(r.end_week),
      model_name: r.model_name,
      model_version: r.model_version,
      prediction_type: r.prediction_type,
      games_evaluated: Number(r.games_evaluated),
      wins: Number(r.wins),
      losses: Number(r.losses),
      accuracy: Number(r.accuracy),
      brier_score: Number(r.brier_score),
      log_loss: Number(r.log_loss),
      rmse: Number(r.rmse),
      mae: Number(r.mae),
      spread_clv: Number(r.spread_clv),
      total_clv: Number(r.total_clv),
      rolling_score: Number(r.rolling_score),
      drift_score: Number(r.drift_score),
      recommended_action: r.recommended_action,
      calculation_version: r.calculation_version,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    };
  }

  async saveValidation(validations: RollingValidation[]): Promise<RollingValidation[]> {
    const saved: RollingValidation[] = [];
    for (const v of validations) {
      const rows = await query(
        `INSERT INTO rolling_validation (
          season, start_week, end_week, model_name, model_version, prediction_type,
          games_evaluated, wins, losses, accuracy, brier_score, log_loss, rmse, mae,
          spread_clv, total_clv, rolling_score, drift_score, recommended_action, calculation_version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        RETURNING *`,
        [
          v.season,
          v.start_week,
          v.end_week,
          v.model_name,
          v.model_version,
          v.prediction_type,
          v.games_evaluated,
          v.wins,
          v.losses,
          v.accuracy,
          v.brier_score,
          v.log_loss,
          v.rmse,
          v.mae,
          v.spread_clv,
          v.total_clv,
          v.rolling_score,
          v.drift_score,
          v.recommended_action,
          v.calculation_version
        ]
      );
      saved.push(this.mapRow(rows[0]));
    }
    return saved;
  }

  async getLatestValidation(): Promise<RollingValidation[]> {
    const rows = await query(
      `SELECT id, season, start_week, end_week, model_name, model_version, prediction_type,
              games_evaluated, wins, losses, accuracy, brier_score, log_loss, rmse, mae,
              spread_clv, total_clv, rolling_score, drift_score, recommended_action,
              calculation_version, created_at
       FROM rolling_validation
       WHERE calculation_version = (SELECT calculation_version FROM rolling_validation ORDER BY id DESC LIMIT 1)
       ORDER BY id ASC`
    );
    return rows.map(r => this.mapRow(r));
  }

  async getValidationByModel(modelName: string): Promise<RollingValidation[]> {
    const rows = await query(
      `SELECT id, season, start_week, end_week, model_name, model_version, prediction_type,
              games_evaluated, wins, losses, accuracy, brier_score, log_loss, rmse, mae,
              spread_clv, total_clv, rolling_score, drift_score, recommended_action,
              calculation_version, created_at
       FROM rolling_validation
       WHERE LOWER(model_name) = LOWER($1)
       ORDER BY id ASC`,
      [modelName]
    );
    return rows.map(r => this.mapRow(r));
  }

  async getValidationHistory(): Promise<RollingValidation[]> {
    const rows = await query(
      `SELECT id, season, start_week, end_week, model_name, model_version, prediction_type,
              games_evaluated, wins, losses, accuracy, brier_score, log_loss, rmse, mae,
              spread_clv, total_clv, rolling_score, drift_score, recommended_action,
              calculation_version, created_at
       FROM rolling_validation
       ORDER BY id DESC`
    );
    return rows.map(r => this.mapRow(r));
  }

  async deleteWeekRange(season: string, startWeek: number, endWeek: number): Promise<boolean> {
    await query(
      `DELETE FROM rolling_validation WHERE season = $1 AND start_week = $2 AND end_week = $3`,
      [season, startWeek, endWeek]
    );
    return true;
  }
}
