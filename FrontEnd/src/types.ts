/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// User & Authentication Types
export type UserRole = 'ADMIN' | 'USER';

export interface SurvivorEntry {
  entry_id: string;
  survivor_sweat_name: string;
  entry_label: string;
  is_active: boolean;
  contest_format_id?: number;
  format_code?: string;
  format_name?: string;
}

export interface UserProfile {
  user_id: string;
  username: string;
  display_name: string;
  role: UserRole;
  entries: SurvivorEntry[];
}

export interface LoginResponse {
  authenticated: boolean;
  user: {
    user_id: string | number;
    username: string;
    display_name: string;
    role: UserRole;
    entries: {
      entry_id: string | number;
      survivor_sweat_name: string;
      entry_label: string;
      is_active: boolean;
      contest_format_id?: number;
      format_code?: string;
      format_name?: string;
    }[];
  };
}

// Global Context
export interface SemiSharpContext {
  season: number;
  week: number;
  current_week?: number;
  api_version: string;
  environment: string;
  status?: string;
  projection_model?: string;
  rating_week?: number;
  hfa_source?: string;
}

// Reference Data
export interface Team {
  abbr: string;
  name: string;
  conference?: string;
  division?: string;
}

// Schedule & Matchups
export interface GameMatchup {
  game_id: string;
  matchup?: string;
  date: string;
  stadium?: string;
  location?: string;
  holiday_flags?: string | string[] | boolean;
  rest_information?: string;
  
  // Real API fields
  away_team?: string;
  home_team?: string;
  time?: string;
  thanksgiving?: boolean;
  christmas?: boolean;
  away_rest?: number;
  home_rest?: number;
}

// Ratings
export interface PowerRating {
  team: string;
  power_rating: number;
  qb_rating: number;
  projections?: string;
}

// Injuries (SIC Team Health)
export interface SicHealthScore {
  team: string;
  sic_score: number;
  source: string;
  import_date: string;
  team_name?: string;
  imported_at?: string;
}

// Projections
export interface ProjectedSpread {
  matchup: string;
  favorite: string;
  projected_spread: number;
  model_version: string;
}

export interface ProjectionGame {
  game_id: string;
  week: number;
  away_team: string;
  home_team: string;
  favorite: string;
  projected_spread: number;
  model: string;
}

export interface ProjectionsResponse {
  season: number;
  week: number;
  count: number;
  model: string;
  games: ProjectionGame[];
}

// Market Engine
export interface ConsensusMarketLine {
  game_id: string;
  team: string;
  consensus_spread: number;
  sportsbook_count: number;
  latest_snapshot: string;
}

export interface ConsensusResponse {
  season: number;
  week: number;
  count: number;
  consensus_lines: ConsensusMarketLine[];
}

export interface ProjectionEdge {
  game_id: string;
  team: string;
  semisharp_spread: number;
  market_spread: number;
  edge_points: number;
  sportsbook_count: number;
}

export interface ProjectionEdgeResponse {
  season: number;
  week: number;
  count: number;
  projection_edges: ProjectionEdge[];
}

// Risk Engine
export interface RiskFactor {
  matchup: string;
  away_favorite: boolean;
  neutral_site: boolean;
  rest_disadvantage: string;
  outdoor_weather_placeholder?: string;
  qb_injury?: string;
  cluster_injuries?: string;
  weather?: string;
  travel?: string;
}

export interface RiskItem {
  game_id: string;
  team: string;
  risk_points: number;
  risk_factor_count: number;
  risk_types: string;
}

export interface RiskResponse {
  season: number;
  week: number;
  count: number;
  risks: RiskItem[];
}

// Strategy Recommendations
export interface StrategyBackendPick {
  leg_number: number;
  leg_name: string;
  leg_code?: string;
  team: string;
  projected_line: number;
  game_id: string;
  semisharp_spread?: number;
  market_spread?: number;
  edge_points?: number;
  sportsbook_count?: number;
  risk_level?: string;
  risk_stars?: number;
  risk_points?: number;
  risk_summary?: string;
}

export interface AlternativeRecommendation {
  team: string;
  projected_line: number;
  risk_level: string;
  risk_points: number;
  leg_number?: number;
  leg_name?: string;
  leg_code?: string;
  game_id?: string;
  risk_stars?: number;
  risk_summary?: string;
}

export interface StrategyBackendEntry {
  entry_id: number;
  survivor_sweat_name: string;
  picks: StrategyBackendPick[];
  alternative_recommendations?: AlternativeRecommendation[];
}

export interface StrategyRecommendation {
  strategy?: string;
  strategy_name?: string;
  contest_format?: string;
  season: number;
  week?: number;
  rating_week?: number;
  hfa_source?: string;
  entries?: StrategyBackendEntry[];
  recommendations?: Array<{
    team: string;
    pick_probability?: number;
    future_value?: number;
    safety_rating?: number;
    ev_score?: number; // Expected Value
    rank?: number;
    notes?: string;
  }>;
  model_version?: string;
  timestamp?: string;
}

// Environment & App Settings
export interface AppEnvironment {
  BACKEND_URL: string;
  API_VERSION: string;
  ENVIRONMENT: string;
  AUTH_HEADER_KEY: string;
}

// PFF Power Rankings Types
export interface PffRankingRecord {
  rank: number;
  pff_power_rating_id?: string | number;
  season: number;
  week: number;
  contest_leg_id?: string | number;
  team_id?: string | number;
  pff_team_code?: string;
  team: string; // canonical team abbreviation
  team_name?: string;
  team_nick?: string;
  conference?: string;
  division?: string;
  point_spread_rating?: number;
  qb_rating?: number;
  sos_to_date?: number | null;
  sos_remaining?: number | null;
  projected_wins?: number | null;
  make_playoffs_pct?: number | null;
  win_division_pct?: number | null;
  win_conference_pct?: number | null;
  win_super_bowl_pct?: number | null;
  source_file?: string;
  imported_at?: string;
}

export interface PffPowerRankingsResponse {
  season: number;
  week: number;
  count: number;
  source?: string;
  latest_imported_at?: string;
  rankings: PffRankingRecord[];
}

// Home Field Advantage Types
export interface HomeFieldAdvantageRecord {
  rank: number;
  home_field_advantage_id: string | number;
  season: number;
  team_id: string | number;
  team: string; // canonical team abbreviation
  team_name: string | null;
  team_nick: string | null;
  conference: string | null;
  division: string | null;
  home_field_points: number;
  source_system: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface HomeFieldAdvantageResponse {
  season: number;
  count: number;
  source_systems: string[];
  minimum_home_field_points: number;
  maximum_home_field_points: number;
  advantages: HomeFieldAdvantageRecord[];
}

