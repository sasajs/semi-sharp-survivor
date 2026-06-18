import { 
  WeeklySnapshot, 
  FeatureSnapshot, 
  InventorySnapshotRecord, 
  RiskSnapshot 
} from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { ISnapshotRepository } from "../interfaces";

export class PostgresSnapshotRepository implements ISnapshotRepository {

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  }

  // --- WEEKLY SNAPSHOTS ---
  async getWeeklySnapshot(legId: string): Promise<WeeklySnapshot | null> {
    const rows = await query(
      `SELECT snapshot_json FROM historical_snapshots 
       WHERE snapshot_type = 'weekly' 
         AND snapshot_json->>'contest_leg_id' = $1 
       ORDER BY created_at DESC LIMIT 1`,
      [legId]
    );
    return rows.length ? rows[0].snapshot_json as WeeklySnapshot : null;
  }

  async saveWeeklySnapshot(snapshot: WeeklySnapshot): Promise<WeeklySnapshot> {
    const item = { ...snapshot };
    if (!item.id) {
      item.id = this.generateId("ws");
    }
    
    await query(
      `INSERT INTO historical_snapshots (id, season, week, snapshot_type, snapshot_json, data_version)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        item.id,
        2026, 
        item.week_number || 1,
        'weekly',
        JSON.stringify(item),
        String(item.data_version || "1")
      ]
    );
    return item;
  }

  async getAllWeeklySnapshots(): Promise<WeeklySnapshot[]> {
    const rows = await query(
      `SELECT snapshot_json FROM historical_snapshots 
       WHERE snapshot_type = 'weekly' 
       ORDER BY created_at DESC`
    );
    return rows.map((r: any) => r.snapshot_json as WeeklySnapshot);
  }

  // --- FEATURE SNAPSHOTS ---
  async getFeatureSnapshot(legId: string): Promise<FeatureSnapshot | null> {
    const rows = await query(
      `SELECT snapshot_json FROM historical_snapshots 
       WHERE snapshot_type = 'feature' 
         AND snapshot_json->>'contest_leg_id' = $1 
       ORDER BY created_at DESC LIMIT 1`,
      [legId]
    );
    return rows.length ? rows[0].snapshot_json as FeatureSnapshot : null;
  }

  async saveFeatureSnapshot(snapshot: FeatureSnapshot): Promise<FeatureSnapshot> {
    const item = { ...snapshot };
    if (!item.id) {
      item.id = this.generateId("fs");
    }

    await query(
      `INSERT INTO historical_snapshots (id, season, week, snapshot_type, snapshot_json, data_version)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        item.id,
        2026,
        item.week_number || 1,
        'feature',
        JSON.stringify(item),
        String(item.feature_version || "1")
      ]
    );
    return item;
  }

  async getAllFeatureSnapshots(): Promise<FeatureSnapshot[]> {
    const rows = await query(
      `SELECT snapshot_json FROM historical_snapshots 
       WHERE snapshot_type = 'feature' 
       ORDER BY created_at DESC`
    );
    return rows.map((r: any) => r.snapshot_json as FeatureSnapshot);
  }

  // --- INVENTORY SNAPSHOTS ---
  async getInventorySnapshot(entryId: string, legId: string): Promise<InventorySnapshotRecord | null> {
    const rows = await query(
      `SELECT snapshot_json FROM historical_snapshots 
       WHERE snapshot_type = 'inventory' 
         AND snapshot_json->>'entry_id' = $1 
         AND snapshot_json->>'contest_leg_id' = $2 
       ORDER BY created_at DESC LIMIT 1`,
      [entryId, legId]
    );
    return rows.length ? rows[0].snapshot_json as InventorySnapshotRecord : null;
  }

  async saveInventorySnapshot(snapshot: InventorySnapshotRecord): Promise<InventorySnapshotRecord> {
    const item = { ...snapshot };
    if (!item.id) {
      item.id = this.generateId("is");
    }

    await query(
      `INSERT INTO historical_snapshots (id, season, week, snapshot_type, snapshot_json, data_version)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        item.id,
        2026,
        item.week_number || 1,
        'inventory',
        JSON.stringify(item),
        String(item.inventory_version || "1")
      ]
    );
    return item;
  }

  async getAllInventorySnapshotsByLeg(legId: string): Promise<InventorySnapshotRecord[]> {
    const rows = await query(
      `SELECT snapshot_json FROM historical_snapshots 
       WHERE snapshot_type = 'inventory' 
         AND snapshot_json->>'contest_leg_id' = $1 
       ORDER BY created_at DESC`,
      [legId]
    );
    return rows.map((r: any) => r.snapshot_json as InventorySnapshotRecord);
  }

  // --- RISK SNAPSHOTS ---
  async getRiskSnapshot(legId: string): Promise<RiskSnapshot | null> {
    const rows = await query(
      `SELECT snapshot_json FROM historical_snapshots 
       WHERE snapshot_type = 'risk' 
         AND snapshot_json->>'contest_leg_id' = $1 
       ORDER BY created_at DESC LIMIT 1`,
      [legId]
    );
    return rows.length ? rows[0].snapshot_json as RiskSnapshot : null;
  }

  async saveRiskSnapshot(snapshot: RiskSnapshot): Promise<RiskSnapshot> {
    const item = { ...snapshot };
    if (!item.id) {
      item.id = this.generateId("rs");
    }

    await query(
      `INSERT INTO historical_snapshots (id, season, week, snapshot_type, snapshot_json, data_version)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        item.id,
        2026,
        item.week_number || 1,
        'risk',
        JSON.stringify(item),
        String(item.risk_version || "1")
      ]
    );
    return item;
  }

  async getAllRiskSnapshots(): Promise<RiskSnapshot[]> {
    const rows = await query(
      `SELECT snapshot_json FROM historical_snapshots 
       WHERE snapshot_type = 'risk' 
       ORDER BY created_at DESC`
    );
    return rows.map((r: any) => r.snapshot_json as RiskSnapshot);
  }
}
