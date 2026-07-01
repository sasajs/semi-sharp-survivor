import { TeamAlias } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { ITeamAliasRepository } from "../interfaces";

function mapTeamAlias(row: any): TeamAlias {
  return {
    id: row.id,
    team_id: row.team_id,
    alias: row.alias,
    normalized_alias: row.normalized_alias,
    provider_name: row.provider_name || null,
    alias_type: row.alias_type as any,
    active: row.active === true || row.active === "true" || row.active === 1,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : undefined
  };
}

export class PostgresTeamAliasRepository implements ITeamAliasRepository {
  async findByNormalizedAlias(normalizedAlias: string, providerName?: string): Promise<TeamAlias | null> {
    let sql = "SELECT * FROM team_aliases WHERE normalized_alias = $1 AND active = TRUE";
    const params = [normalizedAlias];
    
    if (providerName) {
      sql += " AND (provider_name = $2 OR provider_name IS NULL) ORDER BY CASE WHEN provider_name = $2 THEN 1 ELSE 2 END ASC, provider_name DESC LIMIT 1";
      params.push(providerName);
    } else {
      sql += " AND provider_name IS NULL LIMIT 1";
    }

    const rows = await query(sql, params);
    return rows.length ? mapTeamAlias(rows[0]) : null;
  }

  async findByTeamId(teamId: string): Promise<TeamAlias[]> {
    const rows = await query("SELECT * FROM team_aliases WHERE team_id = $1 ORDER BY alias_type ASC, alias ASC", [teamId]);
    return rows.map(mapTeamAlias);
  }

  async listAll(): Promise<TeamAlias[]> {
    const rows = await query("SELECT * FROM team_aliases ORDER BY team_id ASC, alias_type ASC, alias ASC");
    return rows.map(mapTeamAlias);
  }

  async createAlias(alias: Omit<TeamAlias, "id" | "created_at" | "updated_at">): Promise<TeamAlias> {
    const rows = await query(
      `INSERT INTO team_aliases (team_id, alias, normalized_alias, provider_name, alias_type, active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [alias.team_id, alias.alias, alias.normalized_alias, alias.provider_name || null, alias.alias_type, alias.active !== false]
    );
    return mapTeamAlias(rows[0]);
  }

  async upsertAlias(alias: Omit<TeamAlias, "id" | "created_at" | "updated_at">): Promise<TeamAlias> {
    const pName = alias.provider_name || null;
    let existing;
    if (pName) {
      existing = await query("SELECT * FROM team_aliases WHERE normalized_alias = $1 AND provider_name = $2 LIMIT 1", [alias.normalized_alias, pName]);
    } else {
      existing = await query("SELECT * FROM team_aliases WHERE normalized_alias = $1 AND provider_name IS NULL LIMIT 1", [alias.normalized_alias]);
    }

    if (existing.length > 0) {
      const id = existing[0].id;
      const rows = await query(
        `UPDATE team_aliases 
         SET team_id = $1, alias = $2, alias_type = $3, active = $4, updated_at = CURRENT_TIMESTAMP
         WHERE id = $5
         RETURNING *`,
        [alias.team_id, alias.alias, alias.alias_type, alias.active !== false, id]
      );
      return mapTeamAlias(rows[0]);
    } else {
      const rows = await query(
        `INSERT INTO team_aliases (team_id, alias, normalized_alias, provider_name, alias_type, active)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [alias.team_id, alias.alias, alias.normalized_alias, pName, alias.alias_type, alias.active !== false]
      );
      return mapTeamAlias(rows[0]);
    }
  }

  async deactivateAlias(id: string): Promise<boolean> {
    const rows = await query("UPDATE team_aliases SET active = FALSE WHERE id = $1 RETURNING id", [id]);
    return rows.length > 0;
  }
}
