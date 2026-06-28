import { DecisionAnalyticsRecord, DecisionOutcomeRecord, WeeklyDecisionSummary } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { IDecisionAnalyticsRepository } from "../interfaces";

export class PostgresDecisionAnalyticsRepository implements IDecisionAnalyticsRepository {
  private mapDecisionRow(r: any): DecisionAnalyticsRecord {
    return {
      id: r.id,
      season: r.season,
      week: Number(r.week),
      contest_id: r.contest_id,
      recommendation_id: r.recommendation_id,
      engine_version: r.engine_version,
      model_hash: r.model_hash,
      policy_version: r.policy_version,
      data_version: r.data_version,
      workflow_version: r.workflow_version,
      recommendation_type: r.recommendation_type,
      selected_team: r.selected_team,
      projected_survival_probability: Number(r.projected_survival_probability),
      projected_championship_probability: Number(r.projected_championship_probability),
      projected_expected_value: Number(r.projected_expected_value),
      projected_future_value: Number(r.projected_future_value),
      recommendation_rank: Number(r.recommendation_rank),
      confidence_score: Number(r.confidence_score),
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    };
  }

  private mapOutcomeRow(r: any): DecisionOutcomeRecord {
    return {
      id: r.id,
      decision_id: Number(r.decision_id),
      game_result: r.game_result,
      survived: Boolean(r.survived),
      eliminated: Boolean(r.eliminated),
      actual_win_probability: Number(r.actual_win_probability),
      market_open_line: Number(r.market_open_line),
      closing_line: Number(r.closing_line),
      closing_line_value: Number(r.closing_line_value),
      evaluation_notes: r.evaluation_notes,
      evaluated_at: r.evaluated_at ? new Date(r.evaluated_at).toISOString() : undefined
    };
  }

  private mapSummaryRow(r: any): WeeklyDecisionSummary {
    return {
      season: r.season,
      week: Number(r.week),
      recommendations: Number(r.recommendations),
      wins: Number(r.wins),
      losses: Number(r.losses),
      survival_rate: Number(r.survival_rate),
      average_confidence: Number(r.average_confidence),
      average_expected_value: Number(r.average_expected_value),
      average_future_value: Number(r.average_future_value),
      average_championship_probability: Number(r.average_championship_probability),
      average_closing_line_value: Number(r.average_closing_line_value),
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    };
  }

  async saveDecision(p: DecisionAnalyticsRecord): Promise<DecisionAnalyticsRecord> {
    const rows = await query(
      `INSERT INTO decision_analytics (
        season, week, contest_id, recommendation_id, engine_version, model_hash,
        policy_version, data_version, workflow_version, recommendation_type, selected_team,
        projected_survival_probability, projected_championship_probability,
        projected_expected_value, projected_future_value, recommendation_rank, confidence_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        p.season,
        p.week,
        p.contest_id,
        p.recommendation_id,
        p.engine_version,
        p.model_hash,
        p.policy_version,
        p.data_version,
        p.workflow_version,
        p.recommendation_type,
        p.selected_team,
        p.projected_survival_probability,
        p.projected_championship_probability,
        p.projected_expected_value,
        p.projected_future_value,
        p.recommendation_rank,
        p.confidence_score
      ]
    );
    return this.mapDecisionRow(rows[0]);
  }

  async saveDecisionMany(records: DecisionAnalyticsRecord[]): Promise<DecisionAnalyticsRecord[]> {
    const saved: DecisionAnalyticsRecord[] = [];
    for (const p of records) {
      const s = await this.saveDecision(p);
      saved.push(s);
    }
    return saved;
  }

  async getDecisionHistory(): Promise<DecisionAnalyticsRecord[]> {
    const rows = await query(
      `SELECT * FROM decision_analytics
       ORDER BY season DESC, week DESC, id DESC`
    );
    return rows.map(r => this.mapDecisionRow(r));
  }

  async getDecisionsBySeasonAndWeek(season: string, week: number): Promise<DecisionAnalyticsRecord[]> {
    const rows = await query(
      `SELECT * FROM decision_analytics
       WHERE season = $1 AND week = $2
       ORDER BY id ASC`,
      [season, week]
    );
    return rows.map(r => this.mapDecisionRow(r));
  }

  async saveOutcome(outcome: DecisionOutcomeRecord): Promise<DecisionOutcomeRecord> {
    const existing = await query(`SELECT * FROM decision_outcomes WHERE decision_id = $1`, [outcome.decision_id]);
    if (existing.length > 0) {
      const rows = await query(
        `UPDATE decision_outcomes SET
          game_result = $1,
          survived = $2,
          eliminated = $3,
          actual_win_probability = $4,
          market_open_line = $5,
          closing_line = $6,
          closing_line_value = $7,
          evaluation_notes = $8,
          evaluated_at = CURRENT_TIMESTAMP
         WHERE decision_id = $9
         RETURNING *`,
        [
          outcome.game_result,
          outcome.survived,
          outcome.eliminated,
          outcome.actual_win_probability,
          outcome.market_open_line,
          outcome.closing_line,
          outcome.closing_line_value,
          outcome.evaluation_notes,
          outcome.decision_id
        ]
      );
      return this.mapOutcomeRow(rows[0]);
    } else {
      const rows = await query(
        `INSERT INTO decision_outcomes (
          decision_id, game_result, survived, eliminated, actual_win_probability,
          market_open_line, closing_line, closing_line_value, evaluation_notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          outcome.decision_id,
          outcome.game_result,
          outcome.survived,
          outcome.eliminated,
          outcome.actual_win_probability,
          outcome.market_open_line,
          outcome.closing_line,
          outcome.closing_line_value,
          outcome.evaluation_notes
        ]
      );
      return this.mapOutcomeRow(rows[0]);
    }
  }

  async getOutcomeByDecisionId(decisionId: number): Promise<DecisionOutcomeRecord | null> {
    const rows = await query(
      `SELECT * FROM decision_outcomes
       WHERE decision_id = $1`,
      [decisionId]
    );
    if (rows.length === 0) return null;
    return this.mapOutcomeRow(rows[0]);
  }

  async getOutcomes(): Promise<DecisionOutcomeRecord[]> {
    const rows = await query(
      `SELECT * FROM decision_outcomes
       ORDER BY id DESC`
    );
    return rows.map(r => this.mapOutcomeRow(r));
  }

  async saveWeeklySummary(s: WeeklyDecisionSummary): Promise<WeeklyDecisionSummary> {
    const rows = await query(
      `INSERT INTO weekly_decision_summary (
        season, week, recommendations, wins, losses, survival_rate,
        average_confidence, average_expected_value, average_future_value,
        average_championship_probability, average_closing_line_value
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (season, week) DO UPDATE SET
        recommendations = EXCLUDED.recommendations,
        wins = EXCLUDED.wins,
        losses = EXCLUDED.losses,
        survival_rate = EXCLUDED.survival_rate,
        average_confidence = EXCLUDED.average_confidence,
        average_expected_value = EXCLUDED.average_expected_value,
        average_future_value = EXCLUDED.average_future_value,
        average_championship_probability = EXCLUDED.average_championship_probability,
        average_closing_line_value = EXCLUDED.average_closing_line_value,
        created_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        s.season,
        s.week,
        s.recommendations,
        s.wins,
        s.losses,
        s.survival_rate,
        s.average_confidence,
        s.average_expected_value,
        s.average_future_value,
        s.average_championship_probability,
        s.average_closing_line_value
      ]
    );
    return this.mapSummaryRow(rows[0]);
  }

  async getLatestWeeklySummaries(): Promise<WeeklyDecisionSummary[]> {
    const rows = await query(
      `SELECT * FROM weekly_decision_summary
       ORDER BY season DESC, week DESC`
    );
    return rows.map(r => this.mapSummaryRow(r));
  }

  async getWeeklySummary(season: string, week: number): Promise<WeeklyDecisionSummary | null> {
    const rows = await query(
      `SELECT * FROM weekly_decision_summary
       WHERE season = $1 AND week = $2`,
      [season, week]
    );
    if (rows.length === 0) return null;
    return this.mapSummaryRow(rows[0]);
  }
}
