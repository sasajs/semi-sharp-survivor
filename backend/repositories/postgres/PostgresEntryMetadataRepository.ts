import { EntryMetadata } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { IEntryMetadataRepository } from "../interfaces";

export class PostgresEntryMetadataRepository implements IEntryMetadataRepository {
  async getAll(): Promise<EntryMetadata[]> {
    const rows = await query(
      `SELECT entry_id, owner_name, entry_description, entry_notes, 
              primary_goal, secondary_goal, active_flag, created_at, updated_at 
       FROM entry_metadata ORDER BY entry_id ASC`
    );
    return rows.map(r => ({
      entry_id: r.entry_id,
      owner_name: r.owner_name,
      entry_description: r.entry_description || undefined,
      entry_notes: r.entry_notes || undefined,
      primary_goal: r.primary_goal,
      secondary_goal: r.secondary_goal || undefined,
      active_flag: !!r.active_flag,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined,
      updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : undefined
    }));
  }

  async getByEntryId(entryId: string): Promise<EntryMetadata | null> {
    const rows = await query(
      `SELECT entry_id, owner_name, entry_description, entry_notes, 
              primary_goal, secondary_goal, active_flag, created_at, updated_at 
       FROM entry_metadata WHERE entry_id = $1`,
      [entryId]
    );
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      entry_id: r.entry_id,
      owner_name: r.owner_name,
      entry_description: r.entry_description || undefined,
      entry_notes: r.entry_notes || undefined,
      primary_goal: r.primary_goal,
      secondary_goal: r.secondary_goal || undefined,
      active_flag: !!r.active_flag,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined,
      updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : undefined
    };
  }

  async save(metadata: EntryMetadata): Promise<EntryMetadata> {
    const rows = await query(
      `INSERT INTO entry_metadata (
         entry_id, owner_name, entry_description, entry_notes, 
         primary_goal, secondary_goal, active_flag, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
       ON CONFLICT (entry_id) DO UPDATE SET
         owner_name = EXCLUDED.owner_name,
         entry_description = EXCLUDED.entry_description,
         entry_notes = EXCLUDED.entry_notes,
         primary_goal = EXCLUDED.primary_goal,
         secondary_goal = EXCLUDED.secondary_goal,
         active_flag = EXCLUDED.active_flag,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        metadata.entry_id,
        metadata.owner_name,
        metadata.entry_description || null,
        metadata.entry_notes || null,
        metadata.primary_goal,
        metadata.secondary_goal || null,
        metadata.active_flag
      ]
    );
    const r = rows[0];
    return {
      entry_id: r.entry_id,
      owner_name: r.owner_name,
      entry_description: r.entry_description || undefined,
      entry_notes: r.entry_notes || undefined,
      primary_goal: r.primary_goal,
      secondary_goal: r.secondary_goal || undefined,
      active_flag: !!r.active_flag,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined,
      updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : undefined
    };
  }

  async deleteByEntryId(entryId: string): Promise<boolean> {
    await query(
      "DELETE FROM entry_metadata WHERE entry_id = $1",
      [entryId]
    );
    return true;
  }
}
