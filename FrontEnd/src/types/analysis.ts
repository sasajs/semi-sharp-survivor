/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TeamInfo {
  team_id: number;
  team_abbr: string;
  team_name: string;
  power_rating: number;
}

export interface ScheduleReference {
  spread_line: number;
  total_line: number;
}

export interface SemiSharpProjection {
  rating_week: number;
  power_rating_diff: number;
  home_field_points: number;
  projected_home_margin: number;
  projected_favorite_team_id: number;
  projected_favorite_abbr: string;
  projected_spread: number;
  source_system: string;
  created_at: string;
  home_win_probability: number | null;
  away_win_probability: number | null;
}

export interface TeamEdge {
  semisharp_spread: number;
  market_spread: number;
  edge_points: number;
}

export interface BookmakerLine {
  bookmaker_key: string;
  bookmaker_title: string;
  away_spread: number;
  away_price: number;
  home_spread: number;
  home_price: number;
  last_update: string;
  pulled_at: string;
  commence_time: string;
}

export interface MarketInfo {
  away_consensus_spread: number;
  away_consensus_price: number;
  home_consensus_spread: number;
  home_consensus_price: number;
  sportsbook_count: number;
  latest_snapshot: string;
  away_edge: TeamEdge;
  home_edge: TeamEdge;
  sportsbooks: BookmakerLine[];
}

export interface RiskFactor {
  title?: string;
  category?: string;
  severity?: string;
  points?: number;
  description?: string;
}

export interface TeamRisk {
  score: number | null;
  stars: number | null;
  level: string | null;
  factor_count: number | null;
  summary: string | null;
  factors?: RiskFactor[] | null;
}

export interface GameRisk {
  away: TeamRisk;
  home: TeamRisk;
}

export interface GameAnalysis {
  game_id: string;
  season: number;
  week: number;
  game_type: string;
  gameday: string;
  gametime: string;
  away_team: TeamInfo;
  home_team: TeamInfo;
  schedule_reference: ScheduleReference;
  semisharp_projection: SemiSharpProjection;
  market: MarketInfo;
  risk: GameRisk;
}

export interface WeeklyAnalysisResponse {
  season: number;
  week: number;
  game_count: number;
  games: GameAnalysis[];
}
