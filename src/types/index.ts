export interface Contest {
  id: string;
  name: string;
  year: number;
  status: 'active' | 'completed';
}

export interface ContestLeg {
  id: string;
  name: string;
  leg_type: 'regular' | 'thanksgiving' | 'christmas';
  display_order: number;
  nfl_week: number;
}

export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  bye_week: number;
  primary_color: string;
  secondary_color: string;
}

export interface Game {
  id: string;
  contest_leg_id: string;
  home_team_id: string;
  away_team_id: string;
  home_score?: number;
  away_score?: number;
  status: 'scheduled' | 'final';
  game_time: string;
}

export interface TeamWeekLine {
  id: string;
  team_id: string;
  contest_leg_id: string;
  win_probability: number;
  pick_popularity: number;
  future_value: number;
  leverage_multiplier: number;
  future_value_multiplier: number;
  holiday_safety_multiplier: number;
  contest_equity_score: number;
}

export interface SurvivorEntry {
  id: string;
  name: string;
  status: 'alive' | 'eliminated';
  notes?: string;
  created_at: string;
}

export interface SurvivorPick {
  id: string;
  entry_id: string;
  contest_leg_id: string;
  team_id: string;
  pick_status: 'pending' | 'won' | 'lost';
  created_at: string;
}

export interface SurvivorHistory {
  id: string;
  entry_id: string;
  contest_leg_id: string;
  team_id: string;
  result: 'won' | 'lost' | 'tie_loss';
}

export interface WeeklyInput {
  id: string;
  contest_leg_id: string;
  team_id: string;
  rest_days?: number;
  rest_disparity?: number;
  sic_score?: number;
  injury_risk_score?: number;
  travel_disadvantage?: number;
  weather_risk?: number;
  quarterback_status?: string;
  divisional_game_flag: boolean;
  short_week_flag: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TeamFeature {
  id: string;
  contest_leg_id: string;
  team_id: string;
  off_efficiency?: number;
  def_efficiency?: number;
  net_efficiency?: number;
  injury_index?: number;
  pff_grade_offense?: number;
  pff_grade_defense?: number;
  dvoa_offense?: number;
  dvoa_defense?: number;
  rest_days?: number;
  sic_score?: number;
  quarterback_status?: string;
  short_week_flag: boolean;
  travel_disadvantage?: number;
  created_at?: string;
  updated_at?: string;
}

export interface GameFeature {
  id: string;
  contest_leg_id: string;
  game_id?: string;
  home_team_id: string;
  away_team_id: string;
  rest_disparity?: number;
  weather_risk?: number;
  divisional_game_flag: boolean;
  line_spread?: number;
  over_under?: number;
  home_win_probability_pff?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ImportJob {
  id: string;
  job_type: string;
  file_name?: string;
  status: 'pending' | 'completed' | 'failed';
  rows_processed: number;
  error_message?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EntryInventory {
  id: string;
  entry_id: string;
  contest_leg_id: string;
  inventory_version: number;
  used_teams: string[];
  available_teams: string[];
  reserved_teams: ReservedTeam[];
  holiday_reservations: HolidayReservation[];
  inventory_depth: number;
  future_inventory_strength: number;
  holiday_protection_score: number;
  remaining_elite_teams: number;
  remaining_playoff_teams: number;
  created_at: string;
  updated_at: string;
}

export interface TeamAvailability {
  team_id: string;
  is_available: boolean;
  is_used: boolean;
  is_reserved: boolean;
  reason?: string;
}

export interface ReservedTeam {
  id: string;
  entry_id: string;
  contest_leg_id: string;
  team_id: string;
  is_protected: boolean;
  created_at: string;
  updated_at: string;
}

export interface HolidayReservation {
  id: string;
  entry_id: string;
  contest_leg_id: string;
  team_id: string;
  status: 'suggested' | 'confirmed';
  created_at: string;
  updated_at: string;
}

export interface FutureValueProfile {
  id: string;
  team_id: string;
  contest_leg_id: string;
  future_value_score: number;
  scarcity_score: number;
  is_elite: boolean;
  is_playoff_caliber: boolean;
  holiday_usefulness: number;
  created_at: string;
  updated_at: string;
}

export enum ConfidenceTier {
  VERY_HIGH = 'Very High',
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
  VERY_LOW = 'Very Low'
}

export interface UpsetFactor {
  category: 'Injury Risk' | 'Travel Risk' | 'Weather Risk' | 'Divisional Risk' | 'Schedule Risk' | 'Market Risk';
  impact_score: number;
  description: string;
}

export interface TeamRiskAssessment {
  team_id: string;
  rest_risk: number;
  injury_risk: number;
  travel_risk: number;
  weather_risk: number;
  divisional_risk: number;
  market_risk: number;
  combined_risk_score: number;
}

export interface GameRiskAssessment {
  id: string;
  game_id: string;
  contest_leg_id: string;
  home_team_risk: TeamRiskAssessment;
  away_team_risk: TeamRiskAssessment;
  upset_probability: number;
  confidence_tier: ConfidenceTier;
  upset_factors: UpsetFactor[];
  risk_score: number;
  risk_version: number;
  created_at: string;
  updated_at: string;
}

export interface RiskProfile {
  id: string;
  entry_id: string;
  contest_leg_id: string;
  team_id: string;
  risk_score: number;
  upset_probability: number;
  confidence_tier: ConfidenceTier;
  risk_version: number;
  created_at: string;
  updated_at: string;
}

export interface ContestEquityScore {
  win_probability: number;
  leverage_multiplier: number;
  future_value_multiplier: number;
  holiday_protection_multiplier: number;
  risk_adjustment_multiplier: number;
  final_score: number;
}

export interface RecommendationRationale {
  survival_case: string;
  leverage_case: string;
  future_value_tradeoff: string;
  upset_risk_warning: string;
  holiday_inventory_impact: string;
  confidence_tier: ConfidenceTier;
}

export interface RecommendationCandidate {
  team_id: string;
  contest_leg_id: string;
  win_probability: number;
  pick_popularity: number;
  leverage_score: number;
  future_value_score: number;
  risk_score: number;
  upset_probability: number;
  confidence_tier: ConfidenceTier;
  is_available: boolean;
  is_used: boolean;
  is_thanksgiving_reserved: boolean;
  is_christmas_reserved: boolean;
  contest_equity_score: ContestEquityScore;
  rationale: RecommendationRationale;
}

export interface EntryRecommendation {
  id: string;
  entry_id: string;
  contest_leg_id: string;
  primary_team_id: string;
  alternatives: string[];
  candidates: RecommendationCandidate[];
  recommendation_version: number;
  data_version: number;
  inventory_version: number;
  risk_version: number;
  policy_version: number;
  created_at: string;
}

export interface PortfolioEntryRecommendation {
  entry_id: string;
  primary_team_id: string;
  backup_team_ids: string[];
}

export interface PortfolioRecommendation {
  id: string;
  contest_leg_id: string;
  entry_recommendations: PortfolioEntryRecommendation[];
  diversification_score: number;
  overlap_percentage: number;
  correlated_risk_flag: boolean;
  policy_version: number;
  created_at: string;
}

export interface WeeklySnapshot {
  id: string;
  contest_id: string;
  contest_leg_id: string;
  week_number: number;
  schedule_data: any;
  imported_values: any;
  sic_inputs: any;
  rest_disparity_inputs: any;
  weather_inputs: any;
  manual_research_inputs: any;
  data_version: number;
  created_at: string;
  created_by: string;
}

export interface FeatureSnapshot {
  id: string;
  contest_id: string;
  contest_leg_id: string;
  week_number: number;
  team_features: any[];
  game_features: any[];
  derived_features: any[];
  feature_version: number;
  created_at: string;
  created_by: string;
}

export interface InventorySnapshotRecord {
  id: string;
  entry_id: string;
  contest_id: string;
  contest_leg_id: string;
  week_number: number;
  used_teams: string[];
  available_teams: string[];
  reserved_teams: any[];
  future_value_scores: Record<string, number>;
  holiday_protection_values: any;
  inventory_version: number;
  created_at: string;
  created_by: string;
}

export interface RiskSnapshot {
  id: string;
  contest_id: string;
  contest_leg_id: string;
  week_number: number;
  team_risks: any[];
  game_risks: any[];
  risk_version: number;
  created_at: string;
  created_by: string;
}

export interface RecommendationSnapshot {
  id: string;
  contest_id: string;
  contest_leg_id: string;
  week_number: number;
  entry_recommendations: EntryRecommendation[];
  portfolio_recommendations: PortfolioRecommendation | null;
  recommendation_version: number;
  created_at: string;
  created_by: string;
}

export interface DecisionAuditRecord {
  id: string;
  contest_id: string;
  contest_leg_id: string;
  week_number: number;
  recommendation_snapshot_id: string;
  weekly_snapshot_id: string;
  inventory_snapshot_id: string;
  risk_snapshot_id: string;
  feature_snapshot_id: string;
  source_versions: {
    data_version: number;
    feature_version: number;
    inventory_version: number;
    risk_version: number;
    recommendation_version: number;
    policy_version: number;
  };
  calculation_versions: Record<string, number>;
  generated_at: string;
  snapshot_created_at: string;
  created_at: string;
}

export interface SimulationConfig {
  iterations: number;
  seed?: string;
  strategy_profile: 'safe' | 'balanced' | 'contrarian';
  max_runtime_ms?: number;
}

export interface SimulationPath {
  id: string;
  iteration_index: number;
  leg_ids: string[];
  chosen_teams: string[];
  surrendered_at_leg_id?: string;
  is_survived: boolean;
}

export interface EntrySurvivalProjection {
  entry_id: string;
  entry_name: string;
  survival_probability: number;
  average_weeks_survived: number;
  path_count: number;
}

export interface PortfolioSurvivalProjection {
  entry_projections: EntrySurvivalProjection[];
  duplicated_risk_score: number;
  portfolio_survival_probability: number;
  concentrated_exposures: Record<string, number>;
}

export interface ChalkUpsetScenario {
  chalk_team_id: string;
  chalk_team_name: string;
  field_elimination_estimate: number;
  user_entry_impact_count: number;
  leverage_benefit_score: number;
  risk_warning: string;
}

export interface StrategyComparison {
  safe_strategy: {
    survival_probability: number;
    projected_contest_equity: number;
    inventory_preservation_score: number;
    risk_exposure_score: number;
  };
  balanced_strategy: {
    survival_probability: number;
    projected_contest_equity: number;
    inventory_preservation_score: number;
    risk_exposure_score: number;
  };
  contrarian_strategy: {
    survival_probability: number;
    projected_contest_equity: number;
    inventory_preservation_score: number;
    risk_exposure_score: number;
  };
}

export interface FutureInventoryProjection {
  dangerous_weeks: { week_number: number; leg_id: string; danger_score: number; reason: string }[];
  weak_inventory_points: { team_id: string; available_count: number; reason: string }[];
  holiday_inventory_shortages: { holiday_type: 'thanksgiving' | 'christmas'; available_teams_count: number; warning: boolean }[];
  elite_team_preservation_problems: string[];
}

export interface SimulationRun {
  id: string;
  contest_id: string;
  contest_leg_id: string;
  week_number: number;
  config: SimulationConfig;
  entry_projections: EntrySurvivalProjection[];
  portfolio_projection: PortfolioSurvivalProjection | null;
  chalk_upset_scenario: ChalkUpsetScenario | null;
  strategy_comparison: StrategyComparison | null;
  future_inventory_projection: FutureInventoryProjection | null;
  simulation_version: number;
  data_version: number;
  inventory_version: number;
  risk_version: number;
  recommendation_version: number;
  created_at: string;
}




