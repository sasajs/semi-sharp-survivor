import { RecommendationPortfolio } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { IRecommendationPortfolioRepository } from "../interfaces";

export class PostgresRecommendationPortfolioRepository implements IRecommendationPortfolioRepository {
  private mapRow(r: any): RecommendationPortfolio {
    return {
      id: r.id,
      season: r.season,
      week: Number(r.week),
      portfolio_id: r.portfolio_id,
      entry_id: r.entry_id,
      recommended_team_id: r.recommended_team_id,
      recommendation_score: Number(r.recommendation_score),
      confidence_score: Number(r.confidence_score),
      consensus_score: Number(r.consensus_score),
      allocation_rank: Number(r.allocation_rank),
      diversification_score: Number(r.diversification_score),
      correlation_penalty: Number(r.correlation_penalty),
      portfolio_score: Number(r.portfolio_score),
      allocation_reason: r.allocation_reason,
      calculation_version: r.calculation_version,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined
    };
  }

  async savePortfolioRecommendations(snapshots: RecommendationPortfolio[]): Promise<RecommendationPortfolio[]> {
    const saved: RecommendationPortfolio[] = [];
    for (const s of snapshots) {
      const rows = await query(
        `INSERT INTO recommendation_portfolios (
          season, week, portfolio_id, entry_id, recommended_team_id, 
          recommendation_score, confidence_score, consensus_score, 
          allocation_rank, diversification_score, correlation_penalty, 
          portfolio_score, allocation_reason, calculation_version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
        RETURNING *`,
        [
          s.season,
          s.week,
          s.portfolio_id,
          s.entry_id,
          s.recommended_team_id,
          s.recommendation_score,
          s.confidence_score,
          s.consensus_score,
          s.allocation_rank,
          s.diversification_score,
          s.correlation_penalty,
          s.portfolio_score,
          s.allocation_reason,
          s.calculation_version
        ]
      );
      saved.push(this.mapRow(rows[0]));
    }
    return saved;
  }

  async getLatestPortfolio(): Promise<RecommendationPortfolio[]> {
    const rows = await query(
      `SELECT id, season, week, portfolio_id, entry_id, recommended_team_id, 
              recommendation_score, confidence_score, consensus_score, 
              allocation_rank, diversification_score, correlation_penalty, 
              portfolio_score, allocation_reason, calculation_version, created_at 
       FROM recommendation_portfolios 
       WHERE calculation_version = (SELECT calculation_version FROM recommendation_portfolios ORDER BY id DESC LIMIT 1)
       ORDER BY id ASC`
    );
    return rows.map(r => this.mapRow(r));
  }

  async getPortfolioById(portfolioId: string): Promise<RecommendationPortfolio[]> {
    const rows = await query(
      `SELECT id, season, week, portfolio_id, entry_id, recommended_team_id, 
              recommendation_score, confidence_score, consensus_score, 
              allocation_rank, diversification_score, correlation_penalty, 
              portfolio_score, allocation_reason, calculation_version, created_at 
       FROM recommendation_portfolios 
       WHERE portfolio_id = $1 
       ORDER BY id ASC`,
      [portfolioId]
    );
    return rows.map(r => this.mapRow(r));
  }

  async getPortfolioHistory(): Promise<RecommendationPortfolio[]> {
    const rows = await query(
      `SELECT id, season, week, portfolio_id, entry_id, recommended_team_id, 
              recommendation_score, confidence_score, consensus_score, 
              allocation_rank, diversification_score, correlation_penalty, 
              portfolio_score, allocation_reason, calculation_version, created_at 
       FROM recommendation_portfolios 
       ORDER BY id DESC`
    );
    return rows.map(r => this.mapRow(r));
  }

  async deleteWeek(season: string, week: number): Promise<boolean> {
    await query(
      `DELETE FROM recommendation_portfolios WHERE season = $1 AND week = $2`,
      [season, week]
    );
    return true;
  }
}
