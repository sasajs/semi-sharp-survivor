import { ChampionshipPlan } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { IChampionshipPlanningRepository } from "../interfaces";

export class PostgresChampionshipPlanningRepository implements IChampionshipPlanningRepository {
  private mapRow(r: any): ChampionshipPlan {
    return {
      id: r.id,
      season: r.season,
      entry_id: r.entry_id,
      contest_id: r.contest_id,
      planning_horizon: r.planning_horizon,
      weeks_remaining: Number(r.weeks_remaining),
      recommended_team_id: r.recommended_team_id,
      projected_finish_probability: Number(r.projected_finish_probability),
      projected_championship_probability: Number(r.projected_championship_probability),
      future_value_score: Number(r.future_value_score),
      inventory_score: Number(r.inventory_score),
      risk_score: Number(r.risk_score),
      optimization_score: Number(r.optimization_score),
      recommended_path: r.recommended_path,
      alternative_paths: r.alternative_paths,
      planner_version: r.planner_version,
      optimization_reason: r.optimization_reason,
      optimization_json: r.optimization_json,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    };
  }

  async savePlans(plans: ChampionshipPlan[]): Promise<ChampionshipPlan[]> {
    const saved: ChampionshipPlan[] = [];
    for (const p of plans) {
      const rows = await query(
        `INSERT INTO championship_plans (
          season, entry_id, contest_id, planning_horizon, weeks_remaining, recommended_team_id,
          projected_finish_probability, projected_championship_probability,
          future_value_score, inventory_score, risk_score, optimization_score,
          recommended_path, alternative_paths, planner_version, optimization_reason, optimization_json
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *`,
        [
          p.season,
          p.entry_id,
          p.contest_id,
          p.planning_horizon,
          p.weeks_remaining,
          p.recommended_team_id,
          p.projected_finish_probability,
          p.projected_championship_probability,
          p.future_value_score,
          p.inventory_score,
          p.risk_score,
          p.optimization_score,
          p.recommended_path,
          p.alternative_paths,
          p.planner_version,
          p.optimization_reason,
          p.optimization_json
        ]
      );
      saved.push(this.mapRow(rows[0]));
    }
    return saved;
  }

  async getLatestPlans(): Promise<ChampionshipPlan[]> {
    const rows = await query(
      `SELECT * FROM championship_plans
       ORDER BY id ASC`
    );
    if (rows.length === 0) return [];
    
    // Filter to latest compiled planner version
    const latestVersion = rows[rows.length - 1].planner_version;
    return rows.filter(r => r.planner_version === latestVersion).map(r => this.mapRow(r));
  }

  async getPlansByEntry(entryId: string): Promise<ChampionshipPlan[]> {
    const rows = await query(
      `SELECT * FROM championship_plans
       WHERE LOWER(entry_id) = LOWER($1)
       ORDER BY id ASC`,
      [entryId]
    );
    return rows.map(r => this.mapRow(r));
  }

  async getPlansHistory(): Promise<ChampionshipPlan[]> {
    const rows = await query(
      `SELECT * FROM championship_plans
       ORDER BY id DESC`
    );
    return rows.map(r => this.mapRow(r));
  }

  async deletePlansSeason(season: string): Promise<boolean> {
    await query(
      `DELETE FROM championship_plans WHERE season = $1`,
      [season]
    );
    return true;
  }
}
