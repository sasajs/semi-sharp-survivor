import { EntryStrategyProfile, StrategyType } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { IEntryStrategyProfileRepository } from "../interfaces";

export class PostgresEntryStrategyProfileRepository implements IEntryStrategyProfileRepository {
  async getAll(): Promise<EntryStrategyProfile[]> {
    const rows = await query(
      `SELECT profile_id, entry_id, strategy_type, objective, risk_tolerance, 
              diversification_group, marketplace_target, notes, created_at, updated_at 
       FROM entry_strategy_profiles ORDER BY profile_id ASC`
    );
    return rows.map(r => ({
      profile_id: r.profile_id,
      entry_id: r.entry_id,
      strategy_type: r.strategy_type as StrategyType,
      objective: r.objective,
      risk_tolerance: r.risk_tolerance,
      diversification_group: r.diversification_group || undefined,
      marketplace_target: r.marketplace_target || undefined,
      notes: r.notes || undefined,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined,
      updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : undefined
    }));
  }

  async getByEntryId(entryId: string): Promise<EntryStrategyProfile | null> {
    const rows = await query(
      `SELECT profile_id, entry_id, strategy_type, objective, risk_tolerance, 
              diversification_group, marketplace_target, notes, created_at, updated_at 
       FROM entry_strategy_profiles WHERE entry_id = $1`,
      [entryId]
    );
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      profile_id: r.profile_id,
      entry_id: r.entry_id,
      strategy_type: r.strategy_type as StrategyType,
      objective: r.objective,
      risk_tolerance: r.risk_tolerance,
      diversification_group: r.diversification_group || undefined,
      marketplace_target: r.marketplace_target || undefined,
      notes: r.notes || undefined,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined,
      updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : undefined
    };
  }

  async save(profile: EntryStrategyProfile): Promise<EntryStrategyProfile> {
    const rows = await query(
      `INSERT INTO entry_strategy_profiles (
         entry_id, strategy_type, objective, risk_tolerance, 
         diversification_group, marketplace_target, notes, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
       ON CONFLICT (entry_id) DO UPDATE SET
         strategy_type = EXCLUDED.strategy_type,
         objective = EXCLUDED.objective,
         risk_tolerance = EXCLUDED.risk_tolerance,
         diversification_group = EXCLUDED.diversification_group,
         marketplace_target = EXCLUDED.marketplace_target,
         notes = EXCLUDED.notes,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        profile.entry_id,
        profile.strategy_type,
        profile.objective,
        profile.risk_tolerance,
        profile.diversification_group || null,
        profile.marketplace_target || null,
        profile.notes || null
      ]
    );
    const r = rows[0];
    return {
      profile_id: r.profile_id,
      entry_id: r.entry_id,
      strategy_type: r.strategy_type as StrategyType,
      objective: r.objective,
      risk_tolerance: r.risk_tolerance,
      diversification_group: r.diversification_group || undefined,
      marketplace_target: r.marketplace_target || undefined,
      notes: r.notes || undefined,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined,
      updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : undefined
    };
  }

  async deleteByEntryId(entryId: string): Promise<boolean> {
    await query(
      "DELETE FROM entry_strategy_profiles WHERE entry_id = $1",
      [entryId]
    );
    return true;
  }
}
