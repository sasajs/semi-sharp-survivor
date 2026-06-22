import { FeatureDefinition } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { IFeatureDefinitionRepository } from "../interfaces";

export class PostgresFeatureDefinitionRepository implements IFeatureDefinitionRepository {
  async getAll(): Promise<FeatureDefinition[]> {
    const rows = await query(
      "SELECT feature_id, feature_name, feature_category, description, sport, active_flag, created_at FROM feature_definitions ORDER BY feature_id ASC"
    );
    return rows.map(r => ({
      feature_id: r.feature_id,
      feature_name: r.feature_name,
      feature_category: r.feature_category,
      description: r.description,
      sport: r.sport,
      active_flag: !!r.active_flag,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    }));
  }

  async getByFeatureId(id: string): Promise<FeatureDefinition | null> {
    const rows = await query(
      "SELECT feature_id, feature_name, feature_category, description, sport, active_flag, created_at FROM feature_definitions WHERE feature_id = $1",
      [id]
    );
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      feature_id: r.feature_id,
      feature_name: r.feature_name,
      feature_category: r.feature_category,
      description: r.description,
      sport: r.sport,
      active_flag: !!r.active_flag,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    };
  }

  async save(definition: FeatureDefinition): Promise<FeatureDefinition> {
    const rows = await query(
      `INSERT INTO feature_definitions (feature_id, feature_name, feature_category, description, sport, active_flag, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, CURRENT_TIMESTAMP))
       ON CONFLICT (feature_id) DO UPDATE SET
         feature_name = EXCLUDED.feature_name,
         feature_category = EXCLUDED.feature_category,
         description = EXCLUDED.description,
         sport = EXCLUDED.sport,
         active_flag = EXCLUDED.active_flag
       RETURNING *`,
      [
        definition.feature_id,
        definition.feature_name,
        definition.feature_category,
        definition.description,
        definition.sport,
        definition.active_flag,
        definition.created_at ? new Date(definition.created_at) : null
      ]
    );
    const r = rows[0];
    return {
      feature_id: r.feature_id,
      feature_name: r.feature_name,
      feature_category: r.feature_category,
      description: r.description,
      sport: r.sport,
      active_flag: !!r.active_flag,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    };
  }
}
