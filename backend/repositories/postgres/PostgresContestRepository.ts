import { Contest } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { IContestRepository } from "../interfaces";
import { fromUuid } from "./postgresRepositories";
import { toUuid } from "../../database/seed/seedData";

function mapContest(row: any): Contest {
  return {
    id: fromUuid(row.id),
    name: row.name,
    year: row.year,
    status: row.status as "active" | "completed"
  };
}

export class PostgresContestRepository implements IContestRepository {
  async getAll(): Promise<Contest[]> {
    const rows = await query("SELECT * FROM contests ORDER BY year DESC");
    return rows.map(mapContest);
  }

  async getById(id: string): Promise<Contest | null> {
    const dbId = toUuid(id, "contest");
    const rows = await query("SELECT * FROM contests WHERE id = $1 LIMIT 1", [dbId]);
    return rows.length ? mapContest(rows[0]) : null;
  }

  async save(contest: Contest): Promise<Contest> {
    const dbId = toUuid(contest.id, "contest");
    const rows = await query(
      `INSERT INTO contests (id, name, year, status)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         status = EXCLUDED.status
       RETURNING *`,
      [dbId, contest.name, contest.year, contest.status]
    );
    return mapContest(rows[0]);
  }
}
