import { SurvivorEntry } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { ISurvivorEntryRepository } from "../interfaces";
import { fromUuid } from "./postgresRepositories";
import { toUuid } from "../../database/seed/seedData";

function mapSurvivorEntry(row: any): SurvivorEntry {
  return {
    id: fromUuid(row.id),
    name: row.name,
    status: row.status as "alive" | "eliminated",
    notes: row.notes || undefined,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    owner_id: row.owner_id || undefined
  };
}

export class PostgresEntryRepository implements ISurvivorEntryRepository {
  async getAll(): Promise<SurvivorEntry[]> {
    const rows = await query("SELECT * FROM survivor_entries ORDER BY created_at ASC");
    return rows.map(mapSurvivorEntry);
  }

  async getById(id: string): Promise<SurvivorEntry | null> {
    const dbId = toUuid(id, "entry");
    const rows = await query("SELECT * FROM survivor_entries WHERE id = $1 LIMIT 1", [dbId]);
    return rows.length ? mapSurvivorEntry(rows[0]) : null;
  }

  async getByOwnerId(ownerId: string): Promise<SurvivorEntry[]> {
    const rows = await query("SELECT * FROM survivor_entries WHERE owner_id = $1 ORDER BY created_at ASC", [ownerId]);
    return rows.map(mapSurvivorEntry);
  }

  async create(entry: { contest_id?: string; name: string; notes?: string; owner_id?: string }): Promise<SurvivorEntry> {
    const randomHex = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    const newId = `22222222-${randomHex()}-${randomHex()}-${randomHex()}-${randomHex()}${randomHex()}${randomHex()}`;
    const dbId = toUuid(newId, "entry");
    const contestId = toUuid(entry.contest_id || "circa-2026", "contest");
    const rows = await query(
      `INSERT INTO survivor_entries (id, contest_id, name, status, notes, owner_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [dbId, contestId, entry.name, "alive", entry.notes || "", entry.owner_id || null]
    );
    return mapSurvivorEntry(rows[0]);
  }

  async update(id: string, updates: Partial<SurvivorEntry>): Promise<SurvivorEntry | null> {
    const dbId = toUuid(id, "entry");
    const current = await this.getById(id);
    if (!current) return null;

    const name = updates.name !== undefined ? updates.name : current.name;
    const notes = updates.notes !== undefined ? updates.notes : (current.notes || "");
    const status = updates.status !== undefined ? updates.status : current.status;
    const ownerId = updates.owner_id !== undefined ? updates.owner_id : current.owner_id;

    const rows = await query(
      `UPDATE survivor_entries
       SET name = $1, notes = $2, status = $3, owner_id = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [name, notes, status, ownerId || null, dbId]
    );
    return rows.length ? mapSurvivorEntry(rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const dbId = toUuid(id, "entry");
    await query("DELETE FROM survivor_picks WHERE entry_id = $1", [dbId]);
    await query("DELETE FROM survivor_history WHERE entry_id = $1", [dbId]);
    const res = await query("DELETE FROM survivor_entries WHERE id = $1 RETURNING id", [dbId]);
    return res.length > 0;
  }
}
