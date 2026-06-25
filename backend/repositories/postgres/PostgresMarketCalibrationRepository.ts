import { MarketCalibration } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { IMarketCalibrationRepository } from "../interfaces";

export class PostgresMarketCalibrationRepository implements IMarketCalibrationRepository {
  private mapRow(r: any): MarketCalibration {
    return {
      id: r.id,
      season: r.season,
      week: Number(r.week),
      game_id: r.game_id,
      team_id: r.team_id,
      opening_spread: Number(r.opening_spread),
      closing_spread: Number(r.closing_spread),
      model_spread: Number(r.model_spread),
      spread_clv: Number(r.spread_clv),
      opening_total: Number(r.opening_total),
      closing_total: Number(r.closing_total),
      model_total: Number(r.model_total),
      total_clv: Number(r.total_clv),
      market_direction: r.market_direction,
      prediction_error: Number(r.prediction_error),
      market_edge: Number(r.market_edge),
      calibration_weight: Number(r.calibration_weight),
      calculation_version: r.calculation_version,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    };
  }

  async saveCalibration(calibrations: MarketCalibration[]): Promise<MarketCalibration[]> {
    const saved: MarketCalibration[] = [];
    for (const c of calibrations) {
      const rows = await query(
        `INSERT INTO market_calibration (
          season, week, game_id, team_id, opening_spread, closing_spread, 
          model_spread, spread_clv, opening_total, closing_total, model_total, 
          total_clv, market_direction, prediction_error, market_edge, 
          calibration_weight, calculation_version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) 
        RETURNING *`,
        [
          c.season,
          c.week,
          c.game_id,
          c.team_id,
          c.opening_spread,
          c.closing_spread,
          c.model_spread,
          c.spread_clv,
          c.opening_total,
          c.closing_total,
          c.model_total,
          c.total_clv,
          c.market_direction,
          c.prediction_error,
          c.market_edge,
          c.calibration_weight,
          c.calculation_version
        ]
      );
      saved.push(this.mapRow(rows[0]));
    }
    return saved;
  }

  async getLatestCalibration(): Promise<MarketCalibration[]> {
    const rows = await query(
      `SELECT id, season, week, game_id, team_id, opening_spread, closing_spread, 
              model_spread, spread_clv, opening_total, closing_total, model_total, 
              total_clv, market_direction, prediction_error, market_edge, 
              calibration_weight, calculation_version, created_at 
       FROM market_calibration 
       WHERE calculation_version = (SELECT calculation_version FROM market_calibration ORDER BY id DESC LIMIT 1)
       ORDER BY id ASC`
    );
    return rows.map(r => this.mapRow(r));
  }

  async getCalibrationByGame(gameId: string): Promise<MarketCalibration[]> {
    const rows = await query(
      `SELECT id, season, week, game_id, team_id, opening_spread, closing_spread, 
              model_spread, spread_clv, opening_total, closing_total, model_total, 
              total_clv, market_direction, prediction_error, market_edge, 
              calibration_weight, calculation_version, created_at 
       FROM market_calibration 
       WHERE game_id = $1 
       ORDER BY id ASC`,
      [gameId]
    );
    return rows.map(r => this.mapRow(r));
  }

  async getCalibrationHistory(): Promise<MarketCalibration[]> {
    const rows = await query(
      `SELECT id, season, week, game_id, team_id, opening_spread, closing_spread, 
              model_spread, spread_clv, opening_total, closing_total, model_total, 
              total_clv, market_direction, prediction_error, market_edge, 
              calibration_weight, calculation_version, created_at 
       FROM market_calibration 
       ORDER BY id DESC`
    );
    return rows.map(r => this.mapRow(r));
  }

  async deleteWeek(season: string, week: number): Promise<boolean> {
    await query(
      `DELETE FROM market_calibration WHERE season = $1 AND week = $2`,
      [season, week]
    );
    return true;
  }
}
