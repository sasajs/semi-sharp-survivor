import { SurvivorDecision } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { ISurvivorDecisionRepository } from "../interfaces";

export class PostgresSurvivorDecisionRepository implements ISurvivorDecisionRepository {
  private mapRow(r: any): SurvivorDecision {
    return {
      id: r.id,
      season: r.season,
      week: Number(r.week),
      entry_id: r.entry_id,
      contest_id: r.contest_id,
      decision_policy_id: r.decision_policy_id ? Number(r.decision_policy_id) : null,
      recommended_team_id: r.recommended_team_id,
      confidence: r.confidence,
      championship_ev: Number(r.championship_ev),
      future_value_score: Number(r.future_value_score),
      risk_score: Number(r.risk_score),
      portfolio_score: Number(r.portfolio_score),
      decision_score: Number(r.decision_score),
      agent_version: r.agent_version,
      decision_reason: r.decision_reason,
      decision_json: r.decision_json,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    };
  }

  async saveDecisions(decisions: SurvivorDecision[]): Promise<SurvivorDecision[]> {
    const saved: SurvivorDecision[] = [];
    for (const d of decisions) {
      const rows = await query(
        `INSERT INTO survivor_decisions (
          season, week, entry_id, contest_id, decision_policy_id, recommended_team_id,
          confidence, championship_ev, future_value_score, risk_score, portfolio_score,
          decision_score, agent_version, decision_reason, decision_json
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *`,
        [
          d.season,
          d.week,
          d.entry_id,
          d.contest_id,
          d.decision_policy_id,
          d.recommended_team_id,
          d.confidence,
          d.championship_ev,
          d.future_value_score,
          d.risk_score,
          d.portfolio_score,
          d.decision_score,
          d.agent_version,
          d.decision_reason,
          d.decision_json
        ]
      );
      saved.push(this.mapRow(rows[0]));
    }
    return saved;
  }

  async getLatestDecisions(): Promise<SurvivorDecision[]> {
    const rows = await query(
      `SELECT * FROM survivor_decisions
       WHERE agent_version = (SELECT agent_version FROM survivor_decisions ORDER BY id DESC LIMIT 1)
       ORDER BY id ASC`
    );
    return rows.map(r => this.mapRow(r));
  }

  async getDecisionsByEntry(entryId: string): Promise<SurvivorDecision[]> {
    const rows = await query(
      `SELECT * FROM survivor_decisions
       WHERE LOWER(entry_id) = LOWER($1)
       ORDER BY id ASC`,
      [entryId]
    );
    return rows.map(r => this.mapRow(r));
  }

  async getDecisionsHistory(): Promise<SurvivorDecision[]> {
    const rows = await query(
      `SELECT * FROM survivor_decisions
       ORDER BY id DESC`
    );
    return rows.map(r => this.mapRow(r));
  }

  async deleteDecisionsWeek(season: string, week: number): Promise<boolean> {
    await query(
      `DELETE FROM survivor_decisions WHERE season = $1 AND week = $2`,
      [season, week]
    );
    return true;
  }
}
