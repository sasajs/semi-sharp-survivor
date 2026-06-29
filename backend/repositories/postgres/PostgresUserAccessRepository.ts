import { AppUser } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { IUserAccessRepository } from "../interfaces";

function mapAppUser(row: any): AppUser {
  return {
    id: row.id,
    username: row.username,
    password_hash: row.password_hash,
    display_name: row.display_name,
    role: row.role as "admin" | "user" | "group_representative",
    owner_id: row.owner_id || undefined,
    active: row.active === true || row.active === "true" || row.active === 1,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : undefined
  };
}

export class PostgresUserAccessRepository implements IUserAccessRepository {
  async getAll(): Promise<AppUser[]> {
    const rows = await query("SELECT * FROM app_users ORDER BY username ASC");
    return rows.map(mapAppUser);
  }

  async getById(id: string): Promise<AppUser | null> {
    const rows = await query("SELECT * FROM app_users WHERE id = $1 LIMIT 1", [id]);
    return rows.length ? mapAppUser(rows[0]) : null;
  }

  async getByUsername(username: string): Promise<AppUser | null> {
    const rows = await query("SELECT * FROM app_users WHERE LOWER(username) = LOWER($1) LIMIT 1", [username]);
    return rows.length ? mapAppUser(rows[0]) : null;
  }

  async save(user: AppUser): Promise<AppUser> {
    const rows = await query(
      `INSERT INTO app_users (id, username, password_hash, display_name, role, owner_id, active, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (id) DO UPDATE SET
         username = EXCLUDED.username,
         password_hash = EXCLUDED.password_hash,
         display_name = EXCLUDED.display_name,
         role = EXCLUDED.role,
         owner_id = EXCLUDED.owner_id,
         active = EXCLUDED.active,
         updated_at = NOW()
       RETURNING *`,
      [user.id, user.username, user.password_hash, user.display_name, user.role, user.owner_id || null, user.active]
    );
    return mapAppUser(rows[0]);
  }

  async delete(id: string): Promise<boolean> {
    await query("DELETE FROM app_users WHERE id = $1", [id]);
    return true;
  }
}
