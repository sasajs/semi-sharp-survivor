import { query } from "../../database/connection/PostgresConnectionManager";

export interface ResearchExportRecord {
  id: string;
  season: number;
  week: number;
  export_type: string;
  artifact_path: string;
  metadata_json?: any;
  created_at?: string;
}

export class PostgresExportRepository {
  async save(record: ResearchExportRecord): Promise<ResearchExportRecord> {
    const item = { ...record };
    if (!item.id) {
      item.id = `export-${item.export_type || 'docx'}-${Date.now()}`;
    }

    await query(
      `INSERT INTO research_exports (id, season, week, export_type, artifact_path, metadata_json)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        item.id,
        item.season || 2026,
        item.week || 1,
        item.export_type || "docx",
        item.artifact_path,
        JSON.stringify(item.metadata_json || {})
      ]
    );

    return item;
  }

  async getById(id: string): Promise<ResearchExportRecord | null> {
    const rows = await query("SELECT * FROM research_exports WHERE id = $1 LIMIT 1", [id]);
    if (rows.length === 0) return null;
    
    const r = rows[0];
    return {
      id: r.id,
      season: Number(r.season),
      week: Number(r.week),
      export_type: r.export_type,
      artifact_path: r.artifact_path,
      metadata_json: r.metadata_json,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    };
  }

  async getAll(): Promise<ResearchExportRecord[]> {
    const rows = await query("SELECT * FROM research_exports ORDER BY created_at DESC");
    return rows.map((r: any) => ({
      id: r.id,
      season: Number(r.season),
      week: Number(r.week),
      export_type: r.export_type,
      artifact_path: r.artifact_path,
      metadata_json: r.metadata_json,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    }));
  }
}
