import { 
  SurvivorStrategyType, 
  HolidayType, 
  SurvivorEntryStrategy, 
  SurvivorHolidayReservation, 
  SurvivorEntryRoadmap, 
  SurvivorEntryRoadmapWeek 
} from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { ISurvivorStrategyRoadmapRepository } from "../interfaces";

export class PostgresSurvivorStrategyRoadmapRepository implements ISurvivorStrategyRoadmapRepository {
  
  private mapStrategyRow(r: any): SurvivorEntryStrategy {
    return {
      id: r.id,
      entry_id: r.entry_id,
      strategy_type: r.strategy_type as SurvivorStrategyType,
      strategy_name: r.strategy_name,
      strategy_description: r.strategy_description || undefined,
      risk_tolerance: r.risk_tolerance || undefined,
      diversification_weight: r.diversification_weight !== null ? Number(r.diversification_weight) : undefined,
      future_value_weight: r.future_value_weight !== null ? Number(r.future_value_weight) : undefined,
      survival_weight: r.survival_weight !== null ? Number(r.survival_weight) : undefined,
      ownership_leverage_weight: r.ownership_leverage_weight !== null ? Number(r.ownership_leverage_weight) : undefined,
      marketplace_weight: r.marketplace_weight !== null ? Number(r.marketplace_weight) : undefined,
      consensus_weight: r.consensus_weight !== null ? Number(r.consensus_weight) : undefined,
      is_active: r.is_active,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined,
      updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : undefined
    };
  }

  private mapHolidayReservationRow(r: any): SurvivorHolidayReservation {
    return {
      id: r.id,
      entry_id: r.entry_id,
      season: r.season,
      holiday_type: r.holiday_type as HolidayType,
      reserved_team_id: r.reserved_team_id || undefined,
      alternate_team_id: r.alternate_team_id || undefined,
      confidence_score: r.confidence_score !== null ? Number(r.confidence_score) : undefined,
      reservation_reason: r.reservation_reason || undefined,
      strategy_type: r.strategy_type ? (r.strategy_type as SurvivorStrategyType) : undefined,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined,
      updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : undefined
    };
  }

  private mapRoadmapRow(r: any): SurvivorEntryRoadmap {
    return {
      id: r.id,
      entry_id: r.entry_id,
      season: r.season,
      generated_week: Number(r.generated_week),
      strategy_type: r.strategy_type as SurvivorStrategyType,
      roadmap_version: r.roadmap_version,
      total_projected_survival: r.total_projected_survival !== null ? Number(r.total_projected_survival) : undefined,
      total_projected_equity: r.total_projected_equity !== null ? Number(r.total_projected_equity) : undefined,
      portfolio_correlation_score: r.portfolio_correlation_score !== null ? Number(r.portfolio_correlation_score) : undefined,
      roadmap_confidence: r.roadmap_confidence !== null ? Number(r.roadmap_confidence) : undefined,
      generated_reason: r.generated_reason || undefined,
      model_version: r.model_version || undefined,
      policy_version: r.policy_version || undefined,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined,
      contest_type_id: r.contest_type_id || undefined,
      total_legs: r.total_legs !== null && r.total_legs !== undefined ? Number(r.total_legs) : undefined,
      holiday_enabled: r.holiday_enabled !== null && r.holiday_enabled !== undefined ? Boolean(r.holiday_enabled) : undefined
    };
  }

  private mapRoadmapWeekRow(r: any): SurvivorEntryRoadmapWeek {
    return {
      id: r.id,
      roadmap_id: Number(r.roadmap_id),
      season: r.season,
      week: Number(r.week),
      recommended_team_id: r.recommended_team_id || undefined,
      alternate_team_id: r.alternate_team_id || undefined,
      win_probability: r.win_probability !== null ? Number(r.win_probability) : undefined,
      future_value_cost: r.future_value_cost !== null ? Number(r.future_value_cost) : undefined,
      contest_equity_score: r.contest_equity_score !== null ? Number(r.contest_equity_score) : undefined,
      ownership_projection: r.ownership_projection !== null ? Number(r.ownership_projection) : undefined,
      roadmap_note: r.roadmap_note || undefined,
      is_current_week: r.is_current_week,
      is_holiday_week: r.is_holiday_week,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    };
  }

  // Strategy operations
  async saveStrategy(strategy: SurvivorEntryStrategy): Promise<SurvivorEntryStrategy> {
    // Check if strategy already exists for the entry
    const existing = await query(
      `SELECT id FROM survivor_entry_strategies WHERE entry_id = $1 LIMIT 1`,
      [strategy.entry_id]
    );

    if (existing && existing.length > 0) {
      const rows = await query(
        `UPDATE survivor_entry_strategies SET
          strategy_type = $2,
          strategy_name = $3,
          strategy_description = $4,
          risk_tolerance = $5,
          diversification_weight = $6,
          future_value_weight = $7,
          survival_weight = $8,
          ownership_leverage_weight = $9,
          marketplace_weight = $10,
          consensus_weight = $11,
          is_active = $12,
          updated_at = CURRENT_TIMESTAMP
        WHERE entry_id = $1
        RETURNING *`,
        [
          strategy.entry_id,
          strategy.strategy_type,
          strategy.strategy_name,
          strategy.strategy_description || null,
          strategy.risk_tolerance || null,
          strategy.diversification_weight !== undefined ? strategy.diversification_weight : null,
          strategy.future_value_weight !== undefined ? strategy.future_value_weight : null,
          strategy.survival_weight !== undefined ? strategy.survival_weight : null,
          strategy.ownership_leverage_weight !== undefined ? strategy.ownership_leverage_weight : null,
          strategy.marketplace_weight !== undefined ? strategy.marketplace_weight : null,
          strategy.consensus_weight !== undefined ? strategy.consensus_weight : null,
          strategy.is_active !== undefined ? strategy.is_active : true
        ]
      );
      return this.mapStrategyRow(rows[0]);
    } else {
      const rows = await query(
        `INSERT INTO survivor_entry_strategies (
          entry_id, strategy_type, strategy_name, strategy_description,
          risk_tolerance, diversification_weight, future_value_weight,
          survival_weight, ownership_leverage_weight, marketplace_weight,
          consensus_weight, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *`,
        [
          strategy.entry_id,
          strategy.strategy_type,
          strategy.strategy_name,
          strategy.strategy_description || null,
          strategy.risk_tolerance || null,
          strategy.diversification_weight !== undefined ? strategy.diversification_weight : null,
          strategy.future_value_weight !== undefined ? strategy.future_value_weight : null,
          strategy.survival_weight !== undefined ? strategy.survival_weight : null,
          strategy.ownership_leverage_weight !== undefined ? strategy.ownership_leverage_weight : null,
          strategy.marketplace_weight !== undefined ? strategy.marketplace_weight : null,
          strategy.consensus_weight !== undefined ? strategy.consensus_weight : null,
          strategy.is_active !== undefined ? strategy.is_active : true
        ]
      );
      return this.mapStrategyRow(rows[0]);
    }
  }

  async getStrategyByEntryId(entryId: string): Promise<SurvivorEntryStrategy | null> {
    const rows = await query(
      `SELECT * FROM survivor_entry_strategies WHERE entry_id = $1 AND is_active = TRUE LIMIT 1`,
      [entryId]
    );
    if (!rows || rows.length === 0) return null;
    return this.mapStrategyRow(rows[0]);
  }

  async getAllStrategies(): Promise<SurvivorEntryStrategy[]> {
    const rows = await query(`SELECT * FROM survivor_entry_strategies WHERE is_active = TRUE`);
    return (rows || []).map((r: any) => this.mapStrategyRow(r));
  }

  // Holiday Reservations
  async saveHolidayReservation(reservation: SurvivorHolidayReservation): Promise<SurvivorHolidayReservation> {
    const existing = await query(
      `SELECT id FROM survivor_holiday_reservations WHERE entry_id = $1 AND season = $2 AND holiday_type = $3 LIMIT 1`,
      [reservation.entry_id, reservation.season, reservation.holiday_type]
    );

    if (existing && existing.length > 0) {
      const rows = await query(
        `UPDATE survivor_holiday_reservations SET
          reserved_team_id = $4,
          alternate_team_id = $5,
          confidence_score = $6,
          reservation_reason = $7,
          strategy_type = $8,
          updated_at = CURRENT_TIMESTAMP
        WHERE entry_id = $1 AND season = $2 AND holiday_type = $3
        RETURNING *`,
        [
          reservation.entry_id,
          reservation.season,
          reservation.holiday_type,
          reservation.reserved_team_id || null,
          reservation.alternate_team_id || null,
          reservation.confidence_score !== undefined ? reservation.confidence_score : null,
          reservation.reservation_reason || null,
          reservation.strategy_type || null
        ]
      );
      return this.mapHolidayReservationRow(rows[0]);
    } else {
      const rows = await query(
        `INSERT INTO survivor_holiday_reservations (
          entry_id, season, holiday_type, reserved_team_id,
          alternate_team_id, confidence_score, reservation_reason,
          strategy_type, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *`,
        [
          reservation.entry_id,
          reservation.season,
          reservation.holiday_type,
          reservation.reserved_team_id || null,
          reservation.alternate_team_id || null,
          reservation.confidence_score !== undefined ? reservation.confidence_score : null,
          reservation.reservation_reason || null,
          reservation.strategy_type || null
        ]
      );
      return this.mapHolidayReservationRow(rows[0]);
    }
  }

  async saveHolidayReservationMany(reservations: SurvivorHolidayReservation[]): Promise<SurvivorHolidayReservation[]> {
    const results: SurvivorHolidayReservation[] = [];
    for (const r of reservations) {
      const saved = await this.saveHolidayReservation(r);
      results.push(saved);
    }
    return results;
  }

  async getHolidayReservationsByEntryId(entryId: string, season?: string): Promise<SurvivorHolidayReservation[]> {
    let sql = `SELECT * FROM survivor_holiday_reservations WHERE entry_id = $1`;
    const params: any[] = [entryId];
    if (season) {
      sql += ` AND season = $2`;
      params.push(season);
    }
    const rows = await query(sql, params);
    return (rows || []).map((r: any) => this.mapHolidayReservationRow(r));
  }

  async getAllHolidayReservations(season?: string): Promise<SurvivorHolidayReservation[]> {
    let sql = `SELECT * FROM survivor_holiday_reservations`;
    const params: any[] = [];
    if (season) {
      sql += ` WHERE season = $1`;
      params.push(season);
    }
    const rows = await query(sql, params);
    return (rows || []).map((r: any) => this.mapHolidayReservationRow(r));
  }

  // Roadmaps
  async saveRoadmap(roadmap: SurvivorEntryRoadmap): Promise<SurvivorEntryRoadmap> {
    const rows = await query(
      `INSERT INTO survivor_entry_roadmaps (
        entry_id, season, generated_week, strategy_type, roadmap_version,
        total_projected_survival, total_projected_equity, portfolio_correlation_score,
        roadmap_confidence, generated_reason, model_version, policy_version,
        contest_type_id, total_legs, holiday_enabled, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        roadmap.entry_id,
        roadmap.season,
        roadmap.generated_week,
        roadmap.strategy_type,
        roadmap.roadmap_version,
        roadmap.total_projected_survival !== undefined ? roadmap.total_projected_survival : null,
        roadmap.total_projected_equity !== undefined ? roadmap.total_projected_equity : null,
        roadmap.portfolio_correlation_score !== undefined ? roadmap.portfolio_correlation_score : null,
        roadmap.roadmap_confidence !== undefined ? roadmap.roadmap_confidence : null,
        roadmap.generated_reason || null,
        roadmap.model_version || null,
        roadmap.policy_version || null,
        roadmap.contest_type_id || null,
        roadmap.total_legs !== undefined ? roadmap.total_legs : null,
        roadmap.holiday_enabled !== undefined ? roadmap.holiday_enabled : null
      ]
    );
    return this.mapRoadmapRow(rows[0]);
  }

  async getRoadmapByEntryId(entryId: string, season: string): Promise<SurvivorEntryRoadmap | null> {
    // Get the latest generated roadmap version
    const rows = await query(
      `SELECT * FROM survivor_entry_roadmaps WHERE entry_id = $1 AND season = $2 ORDER BY created_at DESC LIMIT 1`,
      [entryId, season]
    );
    if (!rows || rows.length === 0) return null;
    return this.mapRoadmapRow(rows[0]);
  }

  async getRoadmapHistory(entryId: string, season: string): Promise<SurvivorEntryRoadmap[]> {
    const rows = await query(
      `SELECT * FROM survivor_entry_roadmaps WHERE entry_id = $1 AND season = $2 ORDER BY created_at DESC`,
      [entryId, season]
    );
    return (rows || []).map((r: any) => this.mapRoadmapRow(r));
  }

  async getAllActiveRoadmaps(season: string): Promise<SurvivorEntryRoadmap[]> {
    // Get the latest roadmap for each active entry
    const rows = await query(
      `SELECT DISTINCT ON (entry_id) * FROM survivor_entry_roadmaps 
       WHERE season = $1 
       ORDER BY entry_id, created_at DESC`,
      [season]
    );
    return (rows || []).map((r: any) => this.mapRoadmapRow(r));
  }

  // Roadmap Weeks
  async saveRoadmapWeeks(weeks: SurvivorEntryRoadmapWeek[]): Promise<SurvivorEntryRoadmapWeek[]> {
    const results: SurvivorEntryRoadmapWeek[] = [];
    for (const week of weeks) {
      const rows = await query(
        `INSERT INTO survivor_entry_roadmap_weeks (
          roadmap_id, season, week, recommended_team_id, alternate_team_id,
          win_probability, future_value_cost, contest_equity_score,
          ownership_projection, roadmap_note, is_current_week, is_holiday_week, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
        RETURNING *`,
        [
          week.roadmap_id,
          week.season,
          week.week,
          week.recommended_team_id || null,
          week.alternate_team_id || null,
          week.win_probability !== undefined ? week.win_probability : null,
          week.future_value_cost !== undefined ? week.future_value_cost : null,
          week.contest_equity_score !== undefined ? week.contest_equity_score : null,
          week.ownership_projection !== undefined ? week.ownership_projection : null,
          week.roadmap_note || null,
          week.is_current_week !== undefined ? week.is_current_week : false,
          week.is_holiday_week !== undefined ? week.is_holiday_week : false
        ]
      );
      results.push(this.mapRoadmapWeekRow(rows[0]));
    }
    return results;
  }

  async getRoadmapWeeks(roadmapId: number): Promise<SurvivorEntryRoadmapWeek[]> {
    const rows = await query(
      `SELECT * FROM survivor_entry_roadmap_weeks WHERE roadmap_id = $1 ORDER BY week ASC`,
      [roadmapId]
    );
    return (rows || []).map((r: any) => this.mapRoadmapWeekRow(r));
  }
}
