import { DecisionPolicy } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { IDecisionPolicyRepository } from "../interfaces";

export class PostgresDecisionPolicyRepository implements IDecisionPolicyRepository {
  private mapRow(r: any): DecisionPolicy {
    return {
      id: r.id,
      season: r.season,
      week: Number(r.week),
      entry_id: r.entry_id,
      contest_id: r.contest_id,
      game_id: r.game_id,
      team_id: r.team_id,
      policy_type: r.policy_type,
      ensemble_prediction: Number(r.ensemble_prediction),
      ensemble_confidence: Number(r.ensemble_confidence),
      contest_ev: Number(r.contest_ev),
      portfolio_score: Number(r.portfolio_score),
      risk_score: Number(r.risk_score),
      leverage_score: Number(r.leverage_score),
      decision_score: Number(r.decision_score),
      recommended_action: r.recommended_action,
      recommended_pick: r.recommended_pick,
      confidence_tier: r.confidence_tier,
      policy_reason: r.policy_reason,
      calculation_version: r.calculation_version,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    };
  }

  async savePolicies(policies: DecisionPolicy[]): Promise<DecisionPolicy[]> {
    const saved: DecisionPolicy[] = [];
    for (const p of policies) {
      const rows = await query(
        `INSERT INTO decision_policies (
          season, week, entry_id, contest_id, game_id, team_id, policy_type,
          ensemble_prediction, ensemble_confidence, contest_ev, portfolio_score,
          risk_score, leverage_score, decision_score, recommended_action,
          recommended_pick, confidence_tier, policy_reason, calculation_version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *`,
        [
          p.season,
          p.week,
          p.entry_id,
          p.contest_id,
          p.game_id,
          p.team_id,
          p.policy_type,
          p.ensemble_prediction,
          p.ensemble_confidence,
          p.contest_ev,
          p.portfolio_score,
          p.risk_score,
          p.leverage_score,
          p.decision_score,
          p.recommended_action,
          p.recommended_pick,
          p.confidence_tier,
          p.policy_reason,
          p.calculation_version
        ]
      );
      saved.push(this.mapRow(rows[0]));
    }
    return saved;
  }

  async getLatestPolicies(): Promise<DecisionPolicy[]> {
    const rows = await query(
      `SELECT * FROM decision_policies
       WHERE calculation_version = (SELECT calculation_version FROM decision_policies ORDER BY id DESC LIMIT 1)
       ORDER BY id ASC`
    );
    return rows.map(r => this.mapRow(r));
  }

  async getPoliciesByEntry(entryId: string): Promise<DecisionPolicy[]> {
    const rows = await query(
      `SELECT * FROM decision_policies
       WHERE LOWER(entry_id) = LOWER($1)
       ORDER BY id ASC`,
      [entryId]
    );
    return rows.map(r => this.mapRow(r));
  }

  async getPoliciesHistory(): Promise<DecisionPolicy[]> {
    const rows = await query(
      `SELECT * FROM decision_policies
       ORDER BY id DESC`
    );
    return rows.map(r => this.mapRow(r));
  }

  async deletePoliciesWeek(season: string, week: number): Promise<boolean> {
    await query(
      `DELETE FROM decision_policies WHERE season = $1 AND week = $2`,
      [season, week]
    );
    return true;
  }
}
