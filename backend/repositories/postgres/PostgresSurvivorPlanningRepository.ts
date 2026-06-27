import { SurvivorPlan } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { ISurvivorPlanningRepository } from "../interfaces";

export class PostgresSurvivorPlanningRepository implements ISurvivorPlanningRepository {
  private mapRow(r: any): SurvivorPlan {
    return {
      id: r.id,
      season: r.season,
      week: Number(r.week),
      entry_id: r.entry_id,
      contest_id: r.contest_id,
      plan_name: r.plan_name,
      planned_picks: r.planned_picks,
      projected_survival_probability: Number(r.projected_survival_probability),
      future_value_remaining: Number(r.future_value_remaining),
      risk_index: Number(r.risk_index),
      efficiency_score: Number(r.efficiency_score),
      is_active: Boolean(r.is_active),
      agent_version: r.agent_version,
      plan_reasoning: r.plan_reasoning,
      plan_json: r.plan_json,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    };
  }

  async savePlans(plans: SurvivorPlan[]): Promise<SurvivorPlan[]> {
    const saved: SurvivorPlan[] = [];
    for (const p of plans) {
      const rows = await query(
        `INSERT INTO survivor_plans (
          season, week, entry_id, contest_id, plan_name, planned_picks,
          projected_survival_probability, future_value_remaining, risk_index,
          efficiency_score, is_active, agent_version, plan_reasoning, plan_json
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          p.season,
          p.week,
          p.entry_id,
          p.contest_id,
          p.plan_name,
          p.planned_picks,
          p.projected_survival_probability,
          p.future_value_remaining,
          p.risk_index,
          p.efficiency_score,
          p.is_active,
          p.agent_version,
          p.plan_reasoning,
          p.plan_json
        ]
      );
      saved.push(this.mapRow(rows[0]));
    }
    return saved;
  }

  async getLatestPlans(): Promise<SurvivorPlan[]> {
    const rows = await query(
      `SELECT * FROM survivor_plans
       ORDER BY id ASC`
    );
    if (rows.length === 0) return [];
    
    // Filter to latest compiled version
    const latestVersion = rows[rows.length - 1].agent_version;
    return rows.filter(r => r.agent_version === latestVersion).map(r => this.mapRow(r));
  }

  async getPlansByEntry(entryId: string): Promise<SurvivorPlan[]> {
    const rows = await query(
      `SELECT * FROM survivor_plans
       WHERE LOWER(entry_id) = LOWER($1)
       ORDER BY id ASC`,
      [entryId]
    );
    return rows.map(r => this.mapRow(r));
  }

  async getPlansHistory(): Promise<SurvivorPlan[]> {
    const rows = await query(
      `SELECT * FROM survivor_plans
       ORDER BY id DESC`
    );
    return rows.map(r => this.mapRow(r));
  }

  async deletePlansWeek(season: string, week: number): Promise<boolean> {
    await query(
      `DELETE FROM survivor_plans WHERE season = $1 AND week = $2`,
      [season, week]
    );
    return true;
  }
}
