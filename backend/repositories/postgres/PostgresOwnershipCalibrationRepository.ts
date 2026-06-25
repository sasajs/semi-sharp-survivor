import { OwnershipCalibration } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { IOwnershipCalibrationRepository } from "../interfaces";

export class PostgresOwnershipCalibrationRepository implements IOwnershipCalibrationRepository {
  private mapRow(r: any): OwnershipCalibration {
    return {
      id: r.id,
      season: r.season,
      week: Number(r.week),
      team_id: r.team_id,
      contest_id: r.contest_id,
      baseline_ownership: Number(r.baseline_ownership),
      calibrated_ownership: Number(r.calibrated_ownership),
      sharp_multiplier: Number(r.sharp_multiplier),
      contest_size_factor: Number(r.contest_size_factor),
      variance_index: Number(r.variance_index),
      calibration_score: Number(r.calibration_score),
      explanation: r.explanation,
      calculation_version: r.calculation_version,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    };
  }

  async saveCalibration(calibrations: OwnershipCalibration[]): Promise<OwnershipCalibration[]> {
    const saved: OwnershipCalibration[] = [];
    for (const c of calibrations) {
      const rows = await query(
        `INSERT INTO ownership_calibration (
          season, week, team_id, contest_id, baseline_ownership, 
          calibrated_ownership, sharp_multiplier, contest_size_factor, 
          variance_index, calibration_score, explanation, calculation_version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
        RETURNING *`,
        [
          c.season,
          c.week,
          c.team_id,
          c.contest_id,
          c.baseline_ownership,
          c.calibrated_ownership,
          c.sharp_multiplier,
          c.contest_size_factor,
          c.variance_index,
          c.calibration_score,
          c.explanation,
          c.calculation_version
        ]
      );
      saved.push(this.mapRow(rows[0]));
    }
    return saved;
  }

  async getLatestCalibration(): Promise<OwnershipCalibration[]> {
    const rows = await query(
      `SELECT id, season, week, team_id, contest_id, baseline_ownership, 
              calibrated_ownership, sharp_multiplier, contest_size_factor, 
              variance_index, calibration_score, explanation, 
              calculation_version, created_at 
       FROM ownership_calibration 
       WHERE calculation_version = (SELECT calculation_version FROM ownership_calibration ORDER BY id DESC LIMIT 1)
       ORDER BY id ASC`
    );
    return rows.map(r => this.mapRow(r));
  }

  async getCalibration(contestId: string): Promise<OwnershipCalibration[]> {
    const rows = await query(
      `SELECT id, season, week, team_id, contest_id, baseline_ownership, 
              calibrated_ownership, sharp_multiplier, contest_size_factor, 
              variance_index, calibration_score, explanation, 
              calculation_version, created_at 
       FROM ownership_calibration 
       WHERE contest_id = $1 
       ORDER BY id ASC`,
      [contestId]
    );
    return rows.map(r => this.mapRow(r));
  }

  async getCalibrationHistory(): Promise<OwnershipCalibration[]> {
    const rows = await query(
      `SELECT id, season, week, team_id, contest_id, baseline_ownership, 
              calibrated_ownership, sharp_multiplier, contest_size_factor, 
              variance_index, calibration_score, explanation, 
              calculation_version, created_at 
       FROM ownership_calibration 
       ORDER BY id DESC`
    );
    return rows.map(r => this.mapRow(r));
  }

  async deleteWeek(season: string, week: number): Promise<boolean> {
    await query(
      `DELETE FROM ownership_calibration WHERE season = $1 AND week = $2`,
      [season, week]
    );
    return true;
  }
}
