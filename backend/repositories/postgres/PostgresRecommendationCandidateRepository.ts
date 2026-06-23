import { AuditableRecommendationCandidate } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { IRecommendationCandidateRepository } from "../interfaces";

export class PostgresRecommendationCandidateRepository implements IRecommendationCandidateRepository {
  async getAll(): Promise<AuditableRecommendationCandidate[]> {
    const rows = await query(
      `SELECT id, season, week, entry_id, team_id, candidate_rank, candidate_score,
              survivor_equity_score, future_team_value_score, survival_probability,
              strategy_profile, eligibility_status, eligibility_reason, explanation,
              calculation_version, created_at
       FROM recommendation_candidates ORDER BY id DESC`
    );
    return rows.map(r => ({
      id: r.id,
      season: r.season,
      week: Number(r.week),
      entry_id: r.entry_id,
      team_id: r.team_id,
      candidate_rank: Number(r.candidate_rank),
      candidate_score: Number(r.candidate_score),
      survivor_equity_score: Number(r.survivor_equity_score),
      future_team_value_score: Number(r.future_team_value_score),
      survival_probability: Number(r.survival_probability),
      strategy_profile: r.strategy_profile,
      eligibility_status: r.eligibility_status,
      eligibility_reason: r.eligibility_reason,
      explanation: r.explanation,
      calculation_version: r.calculation_version,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    }));
  }

  async getBySeasonAndWeek(season: string, week: number): Promise<AuditableRecommendationCandidate[]> {
    const rows = await query(
      `SELECT id, season, week, entry_id, team_id, candidate_rank, candidate_score,
              survivor_equity_score, future_team_value_score, survival_probability,
              strategy_profile, eligibility_status, eligibility_reason, explanation,
              calculation_version, created_at
       FROM recommendation_candidates
       WHERE season = $1 AND week = $2
       ORDER BY candidate_score DESC`,
      [season, week]
    );
    return rows.map(r => ({
      id: r.id,
      season: r.season,
      week: Number(r.week),
      entry_id: r.entry_id,
      team_id: r.team_id,
      candidate_rank: Number(r.candidate_rank),
      candidate_score: Number(r.candidate_score),
      survivor_equity_score: Number(r.survivor_equity_score),
      future_team_value_score: Number(r.future_team_value_score),
      survival_probability: Number(r.survival_probability),
      strategy_profile: r.strategy_profile,
      eligibility_status: r.eligibility_status,
      eligibility_reason: r.eligibility_reason,
      explanation: r.explanation,
      calculation_version: r.calculation_version,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    }));
  }

  async getLatest(): Promise<AuditableRecommendationCandidate[]> {
    // Find latest calculation version first
    const versionRows = await query(
      "SELECT calculation_version FROM recommendation_candidates ORDER BY created_at DESC, id DESC LIMIT 1"
    );
    if (versionRows.length === 0) return [];
    const latestVersion = versionRows[0].calculation_version;

    const rows = await query(
      `SELECT id, season, week, entry_id, team_id, candidate_rank, candidate_score,
              survivor_equity_score, future_team_value_score, survival_probability,
              strategy_profile, eligibility_status, eligibility_reason, explanation,
              calculation_version, created_at
       FROM recommendation_candidates
       WHERE calculation_version = $1
       ORDER BY candidate_score DESC`,
      [latestVersion]
    );
    return rows.map(r => ({
      id: r.id,
      season: r.season,
      week: Number(r.week),
      entry_id: r.entry_id,
      team_id: r.team_id,
      candidate_rank: Number(r.candidate_rank),
      candidate_score: Number(r.candidate_score),
      survivor_equity_score: Number(r.survivor_equity_score),
      future_team_value_score: Number(r.future_team_value_score),
      survival_probability: Number(r.survival_probability),
      strategy_profile: r.strategy_profile,
      eligibility_status: r.eligibility_status,
      eligibility_reason: r.eligibility_reason,
      explanation: r.explanation,
      calculation_version: r.calculation_version,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    }));
  }

  async getByEntryId(entryId: string): Promise<AuditableRecommendationCandidate[]> {
    const rows = await query(
      `SELECT id, season, week, entry_id, team_id, candidate_rank, candidate_score,
              survivor_equity_score, future_team_value_score, survival_probability,
              strategy_profile, eligibility_status, eligibility_reason, explanation,
              calculation_version, created_at
       FROM recommendation_candidates
       WHERE entry_id = $1
       ORDER BY created_at DESC, candidate_rank ASC`,
      [entryId]
    );
    return rows.map(r => ({
      id: r.id,
      season: r.season,
      week: Number(r.week),
      entry_id: r.entry_id,
      team_id: r.team_id,
      candidate_rank: Number(r.candidate_rank),
      candidate_score: Number(r.candidate_score),
      survivor_equity_score: Number(r.survivor_equity_score),
      future_team_value_score: Number(r.future_team_value_score),
      survival_probability: Number(r.survival_probability),
      strategy_profile: r.strategy_profile,
      eligibility_status: r.eligibility_status,
      eligibility_reason: r.eligibility_reason,
      explanation: r.explanation,
      calculation_version: r.calculation_version,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    }));
  }

  async save(candidate: AuditableRecommendationCandidate): Promise<AuditableRecommendationCandidate> {
    const rows = await query(
      `INSERT INTO recommendation_candidates (
         season, week, entry_id, team_id, candidate_rank, candidate_score,
         survivor_equity_score, future_team_value_score, survival_probability,
         strategy_profile, eligibility_status, eligibility_reason, explanation,
         calculation_version
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        candidate.season,
        candidate.week,
        candidate.entry_id,
        candidate.team_id,
        candidate.candidate_rank,
        candidate.candidate_score,
        candidate.survivor_equity_score,
        candidate.future_team_value_score,
        candidate.survival_probability,
        candidate.strategy_profile,
        candidate.eligibility_status,
        candidate.eligibility_reason,
        candidate.explanation,
        candidate.calculation_version
      ]
    );
    const r = rows[0];
    return {
      id: r.id,
      season: r.season,
      week: Number(r.week),
      entry_id: r.entry_id,
      team_id: r.team_id,
      candidate_rank: Number(r.candidate_rank),
      candidate_score: Number(r.candidate_score),
      survivor_equity_score: Number(r.survivor_equity_score),
      future_team_value_score: Number(r.future_team_value_score),
      survival_probability: Number(r.survival_probability),
      strategy_profile: r.strategy_profile,
      eligibility_status: r.eligibility_status,
      eligibility_reason: r.eligibility_reason,
      explanation: r.explanation,
      calculation_version: r.calculation_version,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    };
  }

  async saveMany(candidates: AuditableRecommendationCandidate[]): Promise<AuditableRecommendationCandidate[]> {
    const results: AuditableRecommendationCandidate[] = [];
    for (const c of candidates) {
      const saved = await this.save(c);
      results.push(saved);
    }
    return results;
  }

  async deleteBySeasonAndWeek(season: string, week: number): Promise<boolean> {
    await query(
      "DELETE FROM recommendation_candidates WHERE season = $1 AND week = $2",
      [season, week]
    );
    return true; // Simple confirmation
  }
}
