/**
 * ====================================================================
 * SEMI-SHARP V2: API Contracts and DTOs (Data Transfer Objects)
 * Meets OpenAPI 3.0 Specifications (Documented in standard OpenAPI JSON/YAML structure below)
 * ====================================================================
 */

/**
 * @openapi
 * openapi: 3.0.3
 * info:
 *   title: Semi-Sharp V2 Circa Survivor API
 *   description: REST API Supporting Semi-Sharp V2 NFL Survivor Pool Optimizer
 *   version: 2.0.0
 * servers:
 *   - url: /api
 * paths:
 *   /contests:
 *     get:
 *       summary: Retrieve all active and completed contests
 *       responses:
 *         '200':
 *           description: List of contests
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ContestDTO'
 *   /legs:
 *     get:
 *       summary: Retrieve all 20 contest legs (regular plus Thanksgiving/Christmas)
 *       responses:
 *         '200':
 *           description: List of contest legs
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ContestLegDTO'
 *   /teams:
 *     get:
 *       summary: Retrieve all 32 NFL teams with details and color metrics
 *       responses:
 *         '200':
 *           description: List of teams
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/TeamDTO'
 *   /entries:
 *     get:
 *       summary: Retrieve all user-managed survivor entries
 *       responses:
 *         '200':
 *           description: List of survivor entries
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/SurvivorEntryDTO'
 *     post:
 *       summary: Create a new survivor entry
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateEntryRequestDTO'
 *       responses:
 *         '200':
 *           description: Entry created successfully
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/SurvivorEntryDTO'
 *   /entries/{id}:
 *     patch:
 *       summary: Update survivor entry notes and status parameters
 *       parameters:
 *         - name: id
 *           in: path
 *           required: true
 *           schema:
 *             type: string
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateEntryRequestDTO'
 *       responses:
 *         '200':
 *           description: Entry patched successfully
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/SurvivorEntryDTO'
 *     delete:
 *       summary: Safely delete an entry and its associated picks
 *       parameters:
 *         - name: id
 *           in: path
 *           required: true
 *           schema:
 *             type: string
 *       responses:
 *         '200':
 *           description: Entry deleted successfully
 *   /picks:
 *     get:
 *       summary: Get picks filtered by active entry optional parameter
 *       parameters:
 *         - name: entry_id
 *           in: query
 *           required: false
 *           schema:
 *             type: string
 *       responses:
 *         '200':
 *           description: List of pick DTOs
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/SurvivorPickDTO'
 *   /picks/make:
 *     post:
 *       summary: Place or edit locked team selection for specified entry & contest leg
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MakePickRequestDTO'
 *       responses:
 *         '200':
 *           description: Survivor selection finalized successfully
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/MakePickResponseDTO'
 *   /games:
 *     get:
 *       summary: Retrieve scheduled matchups for specified contest leg
 *       parameters:
 *         - name: leg_id
 *           in: query
 *           required: false
 *           schema:
 *             type: string
 *       responses:
 *         '200':
 *           description: Match logs
 *   /lines:
 *     get:
 *       summary: Retrieve analytical lines and equity parameters
 *       parameters:
 *         - name: leg_id
 *           in: query
 *           required: false
 *           schema:
 *             type: string
 *       responses:
 *         '200':
 *           description: Multiplier lines
 *   /recommendations:
 *     get:
 *       summary: Calculate optimal next select recommendation for specific active entry
 *       parameters:
 *         - name: entry_id
 *           in: query
 *           required: true
 *           schema:
 *             type: string
 *         - name: leg_id
 *           in: query
 *           required: true
 *           schema:
 *             type: string
 *       responses:
 *         '200':
 *           description: Stratification report
 *   /admin/reset:
 *     post:
 *       summary: Reseed mock template data and reset database state
 *       responses:
 *         '200':
 *           description: DB reset completed
 * 
 * components:
 *   schemas:
 *     ContestDTO:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - year
 *         - status
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         year:
 *           type: integer
 *         status:
 *           type: string
 *           enum: [active, completed]
 *     ContestLegDTO:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - leg_type
 *         - display_order
 *         - nfl_week
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         leg_type:
 *           type: string
 *           enum: [regular, thanksgiving, christmas]
 *         display_order:
 *           type: integer
 *         nfl_week:
 *           type: integer
 *     TeamDTO:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - abbreviation
 *         - bye_week
 *         - primary_color
 *         - secondary_color
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         abbreviation:
 *           type: string
 *         bye_week:
 *           type: integer
 *         primary_color:
 *           type: string
 *         secondary_color:
 *           type: string
 *     SurvivorEntryDTO:
 *       type: object
 *       required:
 *         - id
 *         - contest_id
 *         - name
 *         - status
 *         - created_at
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         contest_id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         status:
 *           type: string
 *           enum: [alive, eliminated]
 *         notes:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *     SurvivorPickDTO:
 *       type: object
 *       required:
 *         - id
 *         - entry_id
 *         - contest_leg_id
 *         - team_id
 *         - pick_status
 *         - created_at
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         entry_id:
 *           type: string
 *           format: uuid
 *         contest_leg_id:
 *           type: string
 *           format: uuid
 *         team_id:
 *           type: string
 *         pick_status:
 *           type: string
 *           enum: [pending, won, lost]
 *         created_at:
 *           type: string
 *           format: date-time
 *     TeamWeekLineDTO:
 *       type: object
 *       required:
 *         - id
 *         - team_id
 *         - contest_leg_id
 *         - win_probability
 *         - pick_popularity
 *         - future_value
 *         - leverage_multiplier
 *         - future_value_multiplier
 *         - holiday_safety_multiplier
 *         - contest_equity_score
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         team_id:
 *           type: string
 *         contest_leg_id:
 *           type: string
 *           format: uuid
 *         win_probability:
 *           type: number
 *         pick_popularity:
 *           type: number
 *         future_value:
 *           type: number
 *         leverage_multiplier:
 *           type: number
 *         future_value_multiplier:
 *           type: number
 *         holiday_safety_multiplier:
 *           type: number
 *         contest_equity_score:
 *           type: number
 */

// ==========================================
// DTO TypeScript Type Annotations
// ==========================================

export interface ContestDTO {
  id: string;
  name: string;
  year: number;
  status: 'active' | 'completed';
}

export interface ContestLegDTO {
  id: string;
  contest_id?: string;
  name: string;
  leg_type: 'regular' | 'thanksgiving' | 'christmas';
  display_order: number;
  nfl_week: number;
}

export interface TeamDTO {
  id: string;
  name: string;
  abbreviation: string;
  bye_week: number;
  primary_color: string;
  secondary_color: string;
}

export interface SurvivorEntryDTO {
  id: string;
  contest_id: string;
  name: string;
  status: 'alive' | 'eliminated';
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface SurvivorPickDTO {
  id: string;
  entry_id: string;
  contest_leg_id: string;
  team_id: string;
  pick_status: 'pending' | 'won' | 'lost';
  created_at: string;
  updated_at?: string;
}

export interface TeamWeekLineDTO {
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

export interface SurvivorHistoryDTO {
  id: string;
  entry_id: string;
  contest_leg_id: string;
  team_id: string;
  result: 'won' | 'lost' | 'tie_loss';
  created_at?: string;
}

// Request Payload DTOs
export interface CreateEntryRequestDTO {
  name: string;
  notes?: string;
}

export interface UpdateEntryRequestDTO {
  name?: string;
  notes?: string;
  status?: 'alive' | 'eliminated';
}

export interface MakePickRequestDTO {
  entry_id: string;
  contest_leg_id: string;
  team_id: string;
}

export interface MakePickResponseDTO {
  success: boolean;
  pick: SurvivorPickDTO;
  entry_status: 'alive' | 'eliminated';
}

export interface InventoryDTO {
  id: string;
  entry_id: string;
  contest_leg_id: string;
  inventory_version: number;
  used_teams: string[];
  available_teams: string[];
  reserved_teams: ReservedTeamDTO[];
  holiday_reservations: HolidayReservationDTO[];
  inventory_depth: number;
  future_inventory_strength: number;
  holiday_protection_score: number;
  remaining_elite_teams: number;
  remaining_playoff_teams: number;
  created_at: string;
  updated_at: string;
}

export interface TeamAvailabilityDTO {
  team_id: string;
  is_available: boolean;
  is_used: boolean;
  is_reserved: boolean;
  reason?: string;
}

export interface ReservedTeamDTO {
  id: string;
  entry_id: string;
  contest_leg_id: string;
  team_id: string;
  is_protected: boolean;
  created_at: string;
  updated_at: string;
}

export interface HolidayReservationDTO {
  id: string;
  entry_id: string;
  contest_leg_id: string;
  team_id: string;
  status: 'suggested' | 'confirmed';
  created_at: string;
  updated_at: string;
}

export interface FutureValueDTO {
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

export type ConfidenceTierDTO = 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low';

export interface UpsetFactorDTO {
  category: 'Injury Risk' | 'Travel Risk' | 'Weather Risk' | 'Divisional Risk' | 'Schedule Risk' | 'Market Risk';
  impact_score: number;
  description: string;
}

export interface TeamRiskAssessmentDTO {
  team_id: string;
  rest_risk: number;
  injury_risk: number;
  travel_risk: number;
  weather_risk: number;
  divisional_risk: number;
  market_risk: number;
  combined_risk_score: number;
}

export interface GameRiskDTO {
  id: string;
  game_id: string;
  contest_leg_id: string;
  home_team_risk: TeamRiskAssessmentDTO;
  away_team_risk: TeamRiskAssessmentDTO;
  upset_probability: number;
  confidence_tier: ConfidenceTierDTO;
  upset_factors: UpsetFactorDTO[];
  risk_score: number;
  risk_version: number;
  created_at: string;
  updated_at: string;
}

export interface RiskProfileDTO {
  id: string;
  entry_id: string;
  contest_leg_id: string;
  team_id: string;
  risk_score: number;
  upset_probability: number;
  confidence_tier: ConfidenceTierDTO;
  risk_version: number;
  created_at: string;
  updated_at: string;
}

export interface ContestEquityScoreDTO {
  win_probability: number;
  leverage_multiplier: number;
  future_value_multiplier: number;
  holiday_protection_multiplier: number;
  risk_adjustment_multiplier: number;
  final_score: number;
}

export interface RecommendationRationaleDTO {
  survival_case: string;
  leverage_case: string;
  future_value_tradeoff: string;
  upset_risk_warning: string;
  holiday_inventory_impact: string;
  confidence_tier: ConfidenceTierDTO;
}

export interface RecommendationCandidateDTO {
  team_id: string;
  contest_leg_id: string;
  win_probability: number;
  pick_popularity: number;
  leverage_score: number;
  future_value_score: number;
  risk_score: number;
  upset_probability: number;
  confidence_tier: ConfidenceTierDTO;
  is_available: boolean;
  is_used: boolean;
  is_thanksgiving_reserved: boolean;
  is_christmas_reserved: boolean;
  contest_equity_score: ContestEquityScoreDTO;
  rationale: RecommendationRationaleDTO;
}

export interface EntryRecommendationDTO {
  id: string;
  entry_id: string;
  contest_leg_id: string;
  primary_team_id: string;
  alternatives: string[];
  candidates: RecommendationCandidateDTO[];
  recommendation_version: number;
  data_version: number;
  inventory_version: number;
  risk_version: number;
  policy_version: number;
  created_at: string;
}

export interface PortfolioEntryRecommendationDTO {
  entry_id: string;
  primary_team_id: string;
  backup_team_ids: string[];
}

export interface PortfolioRecommendationDTO {
  id: string;
  contest_leg_id: string;
  entry_recommendations: PortfolioEntryRecommendationDTO[];
  diversification_score: number;
  overlap_percentage: number;
  correlated_risk_flag: boolean;
  policy_version: number;
  created_at: string;
}

export interface WeeklySnapshotDTO {
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

export interface FeatureSnapshotDTO {
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

export interface InventorySnapshotDTO {
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

export interface RiskSnapshotDTO {
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

export interface RecommendationSnapshotDTO {
  id: string;
  contest_id: string;
  contest_leg_id: string;
  week_number: number;
  entry_recommendations: EntryRecommendationDTO[];
  portfolio_recommendations: PortfolioRecommendationDTO | null;
  recommendation_version: number;
  created_at: string;
  created_by: string;
}

export interface AuditRecordDTO {
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

export interface SimulationConfigDTO {
  iterations: number;
  seed?: string;
  strategy_profile: 'safe' | 'balanced' | 'contrarian';
  max_runtime_ms?: number;
}

export interface EntrySurvivalProjectionDTO {
  entry_id: string;
  entry_name: string;
  survival_probability: number;
  average_weeks_survived: number;
  path_count: number;
}

export interface PortfolioSurvivalProjectionDTO {
  entry_projections: EntrySurvivalProjectionDTO[];
  duplicated_risk_score: number;
  portfolio_survival_probability: number;
  concentrated_exposures: Record<string, number>;
}

export interface ChalkUpsetScenarioDTO {
  chalk_team_id: string;
  chalk_team_name: string;
  field_elimination_estimate: number;
  user_entry_impact_count: number;
  leverage_benefit_score: number;
  risk_warning: string;
}

export interface StrategyComparisonDTO {
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

export interface FutureInventoryProjectionDTO {
  dangerous_weeks: { week_number: number; leg_id: string; danger_score: number; reason: string }[];
  weak_inventory_points: { team_id: string; available_count: number; reason: string }[];
  holiday_inventory_shortages: { holiday_type: 'thanksgiving' | 'christmas'; available_teams_count: number; warning: boolean }[];
  elite_team_preservation_problems: string[];
}

export interface SimulationRunDTO {
  id: string;
  contest_id: string;
  contest_leg_id: string;
  week_number: number;
  config: SimulationConfigDTO;
  entry_projections: EntrySurvivalProjectionDTO[];
  portfolio_projection: PortfolioSurvivalProjectionDTO | null;
  chalk_upset_scenario: ChalkUpsetScenarioDTO | null;
  strategy_comparison: StrategyComparisonDTO | null;
  future_inventory_projection: FutureInventoryProjectionDTO | null;
  simulation_version: number;
  data_version: number;
  inventory_version: number;
  risk_version: number;
  recommendation_version: number;
  created_at: string;
}

export interface WeeklyReportConfigDTO {
  include_simulation?: boolean;
  strategy_preference?: 'safe' | 'balanced' | 'contrarian';
  sample_size?: number;
}

export interface WeeklyReportPickSummaryDTO {
  team_id: string;
  team_name: string;
  opponent_id: string;
  opponent_name: string;
  win_probability: number;
  pick_popularity: number;
  contest_equity_score: number;
  leverage_score: number;
  future_value_score: number;
  risk_score: number;
  confidence_tier: string;
  rationale: string;
}

export interface WeeklyReportRiskSummaryDTO {
  rest_risk: number;
  injury_risk: number;
  travel_risk: number;
  weather_risk: number;
  divisional_risk: number;
  market_risk: number;
  upset_probability: number;
  confidence_tier: string;
}

export interface WeeklyReportInventorySummaryDTO {
  used_teams: string[];
  available_teams: string[];
  remaining_elite_teams: string[];
  thanksgiving_inventory: string[];
  christmas_inventory: string[];
  future_value_warning: string | null;
}

export interface WeeklyReportSimulationSummaryDTO {
  entry_survival_probability: number;
  portfolio_survival_probability: number;
  concentrated_exposure_warnings: string[];
  chalk_upset_scenario: ChalkUpsetScenarioDTO | null;
  strategy_comparison: StrategyComparisonDTO | null;
  future_inventory_projection: FutureInventoryProjectionDTO | null;
}

export interface WeeklyReportAuditMetadataDTO {
  report_version: number;
  data_version: number;
  feature_version: number;
  inventory_version: number;
  risk_version: number;
  recommendation_version: number;
  simulation_version: number;
  policy_version: number;
  model_version: string;
  generated_at: string;
  report_hash: string;
}

export interface WeeklyReportSectionDTO {
  id: string;
  title: string;
  type: 'executive_summary' | 'recommended_picks' | 'risk_summary' | 'inventory_summary' | 'simulation_summary' | 'audit';
  content_markdown: string;
}

export interface WeeklyReportDTO {
  id: string;
  contest_id: string;
  contest_leg_id: string;
  week_number: number;
  executive_summary: {
    top_recommended_pick: { team_id: string; team_name: string };
    alternate_picks: { team_id: string; team_name: string }[];
    confidence_tier: string;
    key_risk_warnings: string[];
    key_inventory_warning: string | null;
    strategy_recommendation: string;
  };
  recommended_picks: WeeklyReportPickSummaryDTO[];
  risk_summary: WeeklyReportRiskSummaryDTO;
  inventory_summary: WeeklyReportInventorySummaryDTO;
  simulation_summary: WeeklyReportSimulationSummaryDTO | null;
  audit_metadata: WeeklyReportAuditMetadataDTO;
  sections: WeeklyReportSectionDTO[];
  created_at: string;
}

export interface WeeklyReportRunDTO {
  id: string;
  report_id: string;
  config: WeeklyReportConfigDTO;
  status: 'completed' | 'failed' | 'running';
  error_message?: string;
  created_at: string;
}

export type ExportFormatDTO = 'docx' | 'html' | 'research-artifact';

export interface ExportConfigDTO {
  format?: ExportFormatDTO;
  include_limitations?: boolean;
  include_assumptions?: boolean;
  custom_theme?: string;
}

export interface ReportExportSectionDTO {
  id: string;
  heading: string;
  body_markdown: string;
}

export interface ExportAuditMetadataDTO {
  export_version: number;
  report_version: number;
  data_version: number;
  feature_version: number;
  inventory_version: number;
  risk_version: number;
  recommendation_version: number;
  simulation_version: number;
  policy_version: number;
  model_version: string;
  generated_at: string;
  report_hash: string;
  export_hash: string;
}

export interface DocxExportResultDTO {
  docx_ready_model: {
    title: string;
    sections: ReportExportSectionDTO[];
    metadata: Record<string, any>;
  };
  file_size_estimate_bytes: number;
  is_valid: boolean;
}

export interface HtmlExportResultDTO {
  html_string: string;
  is_valid: boolean;
}

export interface ExportArtifactDTO {
  id: string;
  report_id: string;
  format: ExportFormatDTO;
  docx_result: DocxExportResultDTO | null;
  html_result: HtmlExportResultDTO | null;
  audit_metadata: ExportAuditMetadataDTO;
  created_at: string;
}

export interface ResearchArtifactDTO {
  id: string;
  title: string;
  report_id: string;
  generated_at: string;
  sections: {
    title_page: any;
    executive_summary: { content: string };
    recommended_picks: { content: string };
    risk_summary: { content: string };
    inventory_summary: { content: string };
    simulation_summary: { content: string };
    chalk_upset_scenario: { content: string };
    strategy_comparison: { content: string };
    appendix_audit: { content: string };
    appendix_assumptions: { content: string };
    appendix_limitations: { content: string };
  };
  audit_metadata: ExportAuditMetadataDTO;
}

export interface ExportRunDTO {
  id: string;
  artifact_id: string;
  status: 'completed' | 'failed' | 'running';
  error_message?: string;
  created_at: string;
}





