import { SurvivorPick } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { ISurvivorPickRepository } from "../interfaces";
import { fromUuid } from "./postgresRepositories";
import { toUuid } from "../../database/seed/seedData";

function mapSurvivorPick(row: any): SurvivorPick {
  return {
    id: fromUuid(row.id),
    entry_id: fromUuid(row.entry_id),
    contest_leg_id: fromUuid(row.contest_leg_id),
    team_id: row.team_id,
    pick_status: row.pick_status as "pending" | "won" | "lost",
    created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString()
  };
}

export class PostgresPickRepository implements ISurvivorPickRepository {
  async getAll(): Promise<SurvivorPick[]> {
    const rows = await query("SELECT * FROM survivor_picks ORDER BY created_at ASC");
    return rows.map(mapSurvivorPick);
  }

  async getById(id: string): Promise<SurvivorPick | null> {
    const dbId = toUuid(id, "pick");
    const rows = await query("SELECT * FROM survivor_picks WHERE id = $1 LIMIT 1", [dbId]);
    return rows.length ? mapSurvivorPick(rows[0]) : null;
  }

  async getByEntryId(entryId: string): Promise<SurvivorPick[]> {
    const dbId = toUuid(entryId, "entry");
    const rows = await query("SELECT * FROM survivor_picks WHERE entry_id = $1 ORDER BY created_at ASC", [dbId]);
    return rows.map(mapSurvivorPick);
  }

  async getByLegId(legId: string): Promise<SurvivorPick[]> {
    const dbId = toUuid(legId, "leg");
    const rows = await query("SELECT * FROM survivor_picks WHERE contest_leg_id = $1", [dbId]);
    return rows.map(mapSurvivorPick);
  }

  async getByEntryAndLeg(entryId: string, legId: string): Promise<SurvivorPick | null> {
    const dbEntryId = toUuid(entryId, "entry");
    const dbLegId = toUuid(legId, "leg");
    const rows = await query("SELECT * FROM survivor_picks WHERE entry_id = $1 AND contest_leg_id = $2 LIMIT 1", [dbEntryId, dbLegId]);
    return rows.length ? mapSurvivorPick(rows[0]) : null;
  }

  async getByEntryAndTeam(entryId: string, teamId: string): Promise<SurvivorPick | null> {
    const dbEntryId = toUuid(entryId, "entry");
    const rows = await query("SELECT * FROM survivor_picks WHERE entry_id = $1 AND team_id = $2 LIMIT 1", [dbEntryId, teamId]);
    return rows.length ? mapSurvivorPick(rows[0]) : null;
  }

  async createOrUpdate(pick: { id?: string; entry_id: string; contest_leg_id: string; team_id: string; pick_status: "pending" | "won" | "lost" }): Promise<SurvivorPick> {
    const dbEntryId = toUuid(pick.entry_id, "entry");
    const dbLegId = toUuid(pick.contest_leg_id, "leg");
    
    let pickId: string;
    if (pick.id) {
      pickId = toUuid(pick.id, "pick");
    } else {
      const stableSeed = `pick-${dbEntryId.substring(0, 8)}-${dbLegId.substring(0, 8)}`;
      pickId = toUuid(stableSeed, "pick");
    }

    const rows = await query(
      `INSERT INTO survivor_picks (id, entry_id, contest_leg_id, team_id, pick_status)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (entry_id, contest_leg_id) DO UPDATE SET
         team_id = EXCLUDED.team_id,
         pick_status = EXCLUDED.pick_status,
         updated_at = NOW()
       RETURNING *`,
      [pickId, dbEntryId, dbLegId, pick.team_id, pick.pick_status]
    );
    return mapSurvivorPick(rows[0]);
  }

  async delete(id: string): Promise<boolean> {
    const dbId = toUuid(id, "pick");
    const res = await query("DELETE FROM survivor_picks WHERE id = $1 RETURNING id", [dbId]);
    return res.length > 0;
  }

  async deleteByEntryId(entryId: string): Promise<boolean> {
    const dbEntryId = toUuid(entryId, "entry");
    const res = await query("DELETE FROM survivor_picks WHERE entry_id = $1 RETURNING id", [dbEntryId]);
    return res.length > 0;
  }
}
