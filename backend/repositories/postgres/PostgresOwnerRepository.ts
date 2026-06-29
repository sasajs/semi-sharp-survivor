import { Owner } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { IOwnerRepository } from "../interfaces";

function mapOwner(row: any): Owner {
  return {
    id: row.id,
    display_name: row.display_name,
    email: row.email || null,
    owner_type: row.owner_type,
    active: !!row.active,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : undefined
  };
}

export class PostgresOwnerRepository implements IOwnerRepository {
  async getAll(): Promise<Owner[]> {
    const rows = await query("SELECT * FROM owners ORDER BY display_name ASC");
    return rows.map(mapOwner);
  }

  async getById(id: string): Promise<Owner | null> {
    const rows = await query("SELECT * FROM owners WHERE id = $1 LIMIT 1", [id]);
    return rows.length ? mapOwner(rows[0]) : null;
  }

  async save(owner: Owner): Promise<Owner> {
    const existing = await this.getById(owner.id);
    if (existing) {
      const rows = await query(
        `UPDATE owners
         SET display_name = $1, email = $2, owner_type = $3, active = $4, updated_at = NOW()
         WHERE id = $5
         RETURNING *`,
        [owner.display_name, owner.email || null, owner.owner_type, owner.active, owner.id]
      );
      return mapOwner(rows[0]);
    } else {
      const rows = await query(
        `INSERT INTO owners (id, display_name, email, owner_type, active)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [owner.id, owner.display_name, owner.email || null, owner.owner_type, owner.active]
      );
      return mapOwner(rows[0]);
    }
  }

  async delete(id: string): Promise<boolean> {
    const res = await query("DELETE FROM owners WHERE id = $1 RETURNING id", [id]);
    return res.length > 0;
  }
}
