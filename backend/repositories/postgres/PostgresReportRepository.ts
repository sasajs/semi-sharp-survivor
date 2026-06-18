import { WeeklyReport } from "../../reports/models";
import { query } from "../../database/connection/PostgresConnectionManager";

export class PostgresReportRepository {
  async save(report: WeeklyReport): Promise<WeeklyReport> {
    const item = { ...report };
    if (!item.id) {
      item.id = `report-${item.contest_leg_id || 'unknown'}-${Date.now()}`;
    }

    // Immutable schema rule: insert brand new record
    await query(
      `INSERT INTO weekly_reports (id, season, week, report_json, report_version)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        item.id,
        2026,
        item.week_number || 1,
        JSON.stringify(item),
        "1.0"
      ]
    );

    return item;
  }

  async getById(id: string): Promise<WeeklyReport | null> {
    const rows = await query("SELECT report_json FROM weekly_reports WHERE id = $1 LIMIT 1", [id]);
    return rows.length ? rows[0].report_json as WeeklyReport : null;
  }

  async getByContestId(contestId: string): Promise<WeeklyReport[]> {
    const rows = await query("SELECT report_json FROM weekly_reports ORDER BY created_at DESC");
    const reports = rows.map((r: any) => r.report_json as WeeklyReport);
    return reports.filter(r => r.contest_id === contestId);
  }

  async getAll(): Promise<WeeklyReport[]> {
    const rows = await query("SELECT report_json FROM weekly_reports ORDER BY created_at DESC");
    return rows.map((r: any) => r.report_json as WeeklyReport);
  }
}
