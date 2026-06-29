import { ContestTypeRecord } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { IContestTypeRepository } from "../interfaces";

function mapContestType(row: any): ContestTypeRecord {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description || "",
    total_legs: Number(row.total_legs),
    uses_thanksgiving_leg: row.uses_thanksgiving_leg === true || row.uses_thanksgiving_leg === "true" || row.uses_thanksgiving_leg === 1,
    uses_christmas_leg: row.uses_christmas_leg === true || row.uses_christmas_leg === "true" || row.uses_christmas_leg === 1,
    uses_holiday_reservations: row.uses_holiday_reservations === true || row.uses_holiday_reservations === "true" || row.uses_holiday_reservations === 1,
    is_active: row.is_active === true || row.is_active === "true" || row.is_active === 1,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : undefined
  };
}

export class PostgresContestTypeRepository implements IContestTypeRepository {
  async getAllActive(): Promise<ContestTypeRecord[]> {
    const rows = await query("SELECT * FROM contest_types WHERE is_active = TRUE ORDER BY id ASC");
    return rows.map(mapContestType);
  }

  async getById(id: string): Promise<ContestTypeRecord | null> {
    const rows = await query("SELECT * FROM contest_types WHERE id = $1 LIMIT 1", [id]);
    return rows.length ? mapContestType(rows[0]) : null;
  }

  async getByCode(code: string): Promise<ContestTypeRecord | null> {
    const rows = await query("SELECT * FROM contest_types WHERE LOWER(code) = LOWER($1) LIMIT 1", [code]);
    return rows.length ? mapContestType(rows[0]) : null;
  }
}
