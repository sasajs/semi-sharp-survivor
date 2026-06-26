import { EnsemblePrediction } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { IEnsemblePredictionRepository } from "../interfaces";

export class PostgresEnsemblePredictionRepository implements IEnsemblePredictionRepository {
  private mapRow(r: any): EnsemblePrediction {
    return {
      id: r.id,
      season: r.season,
      week: Number(r.week),
      game_id: r.game_id,
      prediction_type: r.prediction_type,
      ensemble_prediction: Number(r.ensemble_prediction),
      prediction_std_dev: Number(r.prediction_std_dev),
      prediction_variance: Number(r.prediction_variance),
      confidence_interval_low: Number(r.confidence_interval_low),
      confidence_interval_high: Number(r.confidence_interval_high),
      model_count: Number(r.model_count),
      weighted_prediction: Number(r.weighted_prediction),
      agreement_score: Number(r.agreement_score),
      disagreement_score: Number(r.disagreement_score),
      confidence_score: Number(r.confidence_score),
      recommended_usage: r.recommended_usage,
      calculation_version: r.calculation_version,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    };
  }

  async savePredictions(predictions: EnsemblePrediction[]): Promise<EnsemblePrediction[]> {
    const saved: EnsemblePrediction[] = [];
    for (const p of predictions) {
      const rows = await query(
        `INSERT INTO ensemble_predictions (
          season, week, game_id, prediction_type, ensemble_prediction,
          prediction_std_dev, prediction_variance, confidence_interval_low,
          confidence_interval_high, model_count, weighted_prediction,
          agreement_score, disagreement_score, confidence_score,
          recommended_usage, calculation_version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *`,
        [
          p.season,
          p.week,
          p.game_id,
          p.prediction_type,
          p.ensemble_prediction,
          p.prediction_std_dev,
          p.prediction_variance,
          p.confidence_interval_low,
          p.confidence_interval_high,
          p.model_count,
          p.weighted_prediction,
          p.agreement_score,
          p.disagreement_score,
          p.confidence_score,
          p.recommended_usage,
          p.calculation_version
        ]
      );
      saved.push(this.mapRow(rows[0]));
    }
    return saved;
  }

  async getLatestPredictions(): Promise<EnsemblePrediction[]> {
    const rows = await query(
      `SELECT id, season, week, game_id, prediction_type, ensemble_prediction,
              prediction_std_dev, prediction_variance, confidence_interval_low,
              confidence_interval_high, model_count, weighted_prediction,
              agreement_score, disagreement_score, confidence_score,
              recommended_usage, calculation_version, created_at
       FROM ensemble_predictions
       WHERE calculation_version = (SELECT calculation_version FROM ensemble_predictions ORDER BY id DESC LIMIT 1)
       ORDER BY id ASC`
    );
    return rows.map(r => this.mapRow(r));
  }

  async getPredictionsByGame(gameId: string): Promise<EnsemblePrediction[]> {
    const rows = await query(
      `SELECT id, season, week, game_id, prediction_type, ensemble_prediction,
              prediction_std_dev, prediction_variance, confidence_interval_low,
              confidence_interval_high, model_count, weighted_prediction,
              agreement_score, disagreement_score, confidence_score,
              recommended_usage, calculation_version, created_at
       FROM ensemble_predictions
       WHERE LOWER(game_id) = LOWER($1)
       ORDER BY id ASC`,
      [gameId]
    );
    return rows.map(r => this.mapRow(r));
  }

  async getPredictionsHistory(): Promise<EnsemblePrediction[]> {
    const rows = await query(
      `SELECT id, season, week, game_id, prediction_type, ensemble_prediction,
              prediction_std_dev, prediction_variance, confidence_interval_low,
              confidence_interval_high, model_count, weighted_prediction,
              agreement_score, disagreement_score, confidence_score,
              recommended_usage, calculation_version, created_at
       FROM ensemble_predictions
       ORDER BY id DESC`
    );
    return rows.map(r => this.mapRow(r));
  }

  async deletePredictionsWeek(season: string, week: number): Promise<boolean> {
    await query(
      `DELETE FROM ensemble_predictions WHERE season = $1 AND week = $2`,
      [season, week]
    );
    return true;
  }
}
