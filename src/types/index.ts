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

export interface WeeklyReportConfig {
  include_simulation?: boolean;
  strategy_preference?: 'safe' | 'balanced' | 'contrarian';
  sample_size?: number;
}

export interface WeeklyReportPickSummary {
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

export interface WeeklyReportRiskSummary {
  rest_risk: number;
  injury_risk: number;
  travel_risk: number;
  weather_risk: number;
  divisional_risk: number;
  market_risk: number;
  upset_probability: number;
  confidence_tier: string;
}

export interface WeeklyReportInventorySummary {
  used_teams: string[];
  available_teams: string[];
  remaining_elite_teams: string[];
  thanksgiving_inventory: string[];
  christmas_inventory: string[];
  future_value_warning: string | null;
}

export interface WeeklyReportSimulationSummary {
  entry_survival_probability: number;
  portfolio_survival_probability: number;
  concentrated_exposure_warnings: string[];
  chalk_upset_scenario: ChalkUpsetScenario | null;
  strategy_comparison: StrategyComparison | null;
  future_inventory_projection: FutureInventoryProjection | null;
}

export interface WeeklyReportAuditMetadata {
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

export interface WeeklyReportSection {
  id: string;
  title: string;
  type: 'executive_summary' | 'recommended_picks' | 'risk_summary' | 'inventory_summary' | 'simulation_summary' | 'audit';
  content_markdown: string;
}

export interface WeeklyReport {
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
  recommended_picks: WeeklyReportPickSummary[];
  risk_summary: WeeklyReportRiskSummary;
  inventory_summary: WeeklyReportInventorySummary;
  simulation_summary: WeeklyReportSimulationSummary | null;
  audit_metadata: WeeklyReportAuditMetadata;
  sections: WeeklyReportSection[];
  created_at: string;
}

export interface WeeklyReportRun {
  id: string;
  report_id: string;
  config: WeeklyReportConfig;
  status: 'completed' | 'failed' | 'running';
  error_message?: string;
  created_at: string;
}

export type ExportFormat = 'docx' | 'html' | 'research-artifact';

export interface ExportConfig {
  format?: ExportFormat;
  include_limitations?: boolean;
  include_assumptions?: boolean;
  custom_theme?: string;
}

export interface ReportExportSection {
  id: string;
  heading: string;
  body_markdown: string;
}

export interface ExportAuditMetadata {
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

export interface DocxExportResult {
  docx_ready_model: {
    title: string;
    sections: ReportExportSection[];
    metadata: Record<string, any>;
  };
  file_size_estimate_bytes: number;
  is_valid: boolean;
}

export interface HtmlExportResult {
  html_string: string;
  is_valid: boolean;
}

export interface ExportArtifact {
  id: string;
  report_id: string;
  format: ExportFormat;
  docx_result: DocxExportResult | null;
  html_result: HtmlExportResult | null;
  audit_metadata: ExportAuditMetadata;
  created_at: string;
}

export interface ResearchArtifact {
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
  audit_metadata: ExportAuditMetadata;
}

export interface ExportRun {
  id: string;
  artifact_id: string;
  status: 'completed' | 'failed' | 'running';
  error_message?: string;
  created_at: string;
}

export enum WorkflowStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  PARTIAL_FAILED = 'PARTIAL_FAILED',
  SKIPPED = 'SKIPPED'
}

export enum WorkflowType {
  FULL_WEEKLY_RESEARCH = 'FULL_WEEKLY_RESEARCH',
  IMPORT_ONLY = 'IMPORT_ONLY',
  FEATURE_REFRESH_ONLY = 'FEATURE_REFRESH_ONLY',
  RECOMMENDATION_ONLY = 'RECOMMENDATION_ONLY',
  SIMULATION_ONLY = 'SIMULATION_ONLY',
  REPORT_ONLY = 'REPORT_ONLY',
  EXPORT_ONLY = 'EXPORT_ONLY'
}

export enum TriggerSource {
  manual = 'manual',
  cron = 'cron',
  system = 'system'
}

export interface WorkflowStep {
  name: string;
  status: WorkflowStatus;
  startedAt: string | null;
  completedAt: string | null;
  inputHash: string;
  outputHash: string;
  errorMessage: string | null;
  metadata: Record<string, any>;
}

export interface WorkflowRun {
  id: string;
  workflowType: WorkflowType;
  season: number | string;
  week: number;
  status: WorkflowStatus;
  requestedBy: string;
  triggerSource: TriggerSource;
  idempotencyKey: string;
  dataVersion: number;
  featureVersion: number;
  inventoryVersion: number;
  riskVersion: number;
  recommendationVersion: number;
  simulationVersion: number;
  policyVersion: number;
  modelVersion: string;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  steps: WorkflowStep[];
  metadata: Record<string, any>;
}

export interface WorkflowAuditMetadata {
  applicationVersion: string;
  dataVersion: number;
  featureVersion: number;
  inventoryVersion: number;
  riskVersion: number;
  recommendationVersion: number;
  simulationVersion: number;
  policyVersion: number;
  modelVersion: string;
  requestedBy: string;
  triggerSource: TriggerSource;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface WorkflowExecutionRequest {
  workflowType: WorkflowType;
  season: string | number;
  week: number;
  requestedBy: string;
  triggerSource: TriggerSource;
  force?: boolean;
}

export interface WorkflowExecutionResult {
  runId: string;
  status: WorkflowStatus;
  startedAt: string;
  completedAt?: string;
  idempotencyKey: string;
  errorMessage?: string;
}

export enum ApplicationState {
  STARTING = 'STARTING',
  RUNNING = 'RUNNING',
  STOPPING = 'STOPPING',
  STOPPED = 'STOPPED',
  FAILED = 'FAILED'
}

export enum HealthState {
  HEALTHY = 'HEALTHY',
  DEGRADED = 'DEGRADED',
  UNHEALTHY = 'UNHEALTHY'
}

export interface BuildMetadata {
  applicationVersion: string;
  gitCommit: string;
  buildTimestamp: string;
  environment: string;
}

export interface StartupValidationResult {
  initialized: boolean;
  timestamp: string;
  components: {
    repositories: boolean;
    workflowEngine: boolean;
    reportEngine: boolean;
    exportEngine: boolean;
  };
  details: string[];
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsageBytes: number;
  freeMemoryBytes: number;
  totalMemoryBytes: number;
}

export interface ApplicationStatus {
  applicationState: ApplicationState;
  uptimeSeconds: number;
  startedAt: string | null;
  environment: string;
  validation: StartupValidationResult | null;
}

export interface HealthStatus {
  overallHealth: HealthState;
  serviceChecks: {
    repositoryLayer: { status: HealthState; message: string | null };
    databaseLayer?: any;
    workflowEngine: { status: HealthState; message: string | null };
    monteCarloEngine: { status: HealthState; message: string | null };
    weeklyReportEngine: { status: HealthState; message: string | null };
    researchExportEngine: { status: HealthState; message: string | null };
    schedulerLayer?: { status: HealthState; message: string | null };
    ingestionLayer?: { status: HealthState; message: string | null };
    postgresReadinessLayer?: { status: "HEALTHY" | "WARNING" | "FAILED"; message: string | null };
    preseasonReadinessLayer?: { status: "HEALTHY" | "WARNING" | "FAILED"; message: string | null };
    historicalReplayLayer?: { status: "HEALTHY" | "WARNING" | "FAILED"; message: string | null };
    weeklyPipelineLayer?: { status: "HEALTHY" | "WARNING" | "FAILED"; message: string | null };
    authLayer?: { status: "HEALTHY" | "DISABLED" | "WARNING" | "FAILED"; message: string | null };
    remoteAccessLayer?: { status: "DISABLED" | "READY" | "WARNING" | "FAILED"; message: string | null };
  };
  timestamp: string;
}

export interface RemoteAccessStatus {
  lanUrl: string;
  localPort: number;
  recommendedPublicAccess: string;
  httpsRequired: boolean;
  authRecommended: boolean;
  cloudflareTunnelConfigured: boolean;
  tailscaleConfigured: boolean;
  warnings: string[];
  nextSteps: string[];
}

export interface FeatureDefinition {
  feature_id: string;
  feature_name: string;
  feature_category: string;
  description: string;
  sport: string;
  active_flag: boolean;
  created_at?: string;
}

export interface FeatureStoreSnapshot {
  snapshot_id?: number | string;
  season: number;
  week: number;
  sport: string;
  team_id: string;
  game_id?: string | null;
  feature_id: string;
  feature_value: number;
  source: string;
  created_at?: string;
}

export interface FeatureBuildRun {
  run_id?: number | string;
  season: number;
  week: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  feature_count: number;
  started_at: string;
  completed_at?: string;
  build_version: string;
  notes?: string;
}

export enum StrategyType {
  CHAMPIONSHIP_EV = "CHAMPIONSHIP_EV",
  PORTFOLIO_EV = "PORTFOLIO_EV",
  MARKETPLACE_SURVIVAL = "MARKETPLACE_SURVIVAL",
  GROUP_SURVIVAL = "GROUP_SURVIVAL"
}

export interface EntryStrategyProfile {
  profile_id?: string | number;
  entry_id: string;
  strategy_type: StrategyType;
  objective: string;
  risk_tolerance: string;
  diversification_group?: string;
  marketplace_target?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EntryMetadata {
  entry_id: string;
  owner_name: string;
  entry_description?: string;
  entry_notes?: string;
  primary_goal: string;
  secondary_goal?: string;
  active_flag: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FutureTeamValue {
  id?: number | string;
  season: string;
  week: number;
  team_id: string;
  future_value_score: number;
  future_value_rank: number;
  future_weeks_considered: number;
  calculation_version: string;
  created_at?: string;
}

export interface SurvivorEquitySnapshot {
  id?: number | string;
  season: string;
  week: number;
  entry_id: string;
  team_id: string;
  survival_probability: number;
  future_team_value: number;
  equity_score: number;
  equity_rank: number;
  strategy_profile: string;
  calculation_version: string;
  created_at?: string;
}

export interface AuditableRecommendationCandidate {
  id?: number | string;
  season: string;
  week: number;
  entry_id: string;
  team_id: string;
  candidate_rank: number;
  candidate_score: number;
  survivor_equity_score: number;
  future_team_value_score: number;
  survival_probability: number;
  strategy_profile: string;
  eligibility_status: string;
  eligibility_reason: string | null;
  explanation: string;
  calculation_version: string;
  created_at?: string;
}

export enum OwnershipTier {
  MEGA_CHALK = "MEGA_CHALK",
  CHALK = "CHALK",
  POPULAR = "POPULAR",
  NEUTRAL = "NEUTRAL",
  CONTRARIAN = "CONTRARIAN",
  EXTREME_CONTRARIAN = "EXTREME_CONTRARIAN"
}

export interface OwnershipProjection {
  id?: number | string;
  season: string;
  week: number;
  team_id: string;
  projected_ownership_pct: number;
  ownership_rank: number;
  ownership_tier: string; // or OwnershipTier
  projection_source: string;
  calculation_version: string;
  created_at?: string;
}

export interface ContestDynamicsSnapshot {
  id?: number | string;
  season: string;
  week: number;
  entry_id: string;
  team_id: string;
  projected_ownership_pct: number;
  chalk_score: number;
  leverage_score: number;
  uniqueness_score: number;
  contest_equity_adjustment: number;
  strategy_profile: string;
  calculation_version: string;
  created_at?: string;
}

export enum RecommendationTier {
  STRONG_RECOMMENDATION = "STRONG_RECOMMENDATION",
  RECOMMENDATION = "RECOMMENDATION",
  VIABLE_OPTION = "VIABLE_OPTION",
  LONGSHOT = "LONGSHOT"
}

export interface SurvivorRecommendation {
  id?: number | string;
  season: string;
  week: number;
  entry_id: string;
  recommended_team_id: string;
  recommendation_rank: number;
  recommendation_score: number;
  candidate_score: number;
  survivor_equity_score: number;
  future_team_value_score: number;
  projected_ownership_pct: number;
  contest_equity_adjustment: number;
  strategy_profile: string;
  recommendation_tier: string; // RecommendationTier or string
  recommendation_reason: string;
  calculation_version: string;
  created_at?: string;
}

export enum RecommendationChangeCategory {
  MAJOR_IMPROVEMENT = "MAJOR_IMPROVEMENT",
  MINOR_IMPROVEMENT = "MINOR_IMPROVEMENT",
  UNCHANGED = "UNCHANGED",
  MINOR_DECLINE = "MINOR_DECLINE",
  MAJOR_DECLINE = "MAJOR_DECLINE",
  NEW_RECOMMENDATION = "NEW_RECOMMENDATION",
  REMOVED_RECOMMENDATION = "REMOVED_RECOMMENDATION"
}

export interface RecommendationAudit {
  id?: number | string;
  season: string;
  week: number;
  entry_id: string;
  team_id: string;
  previous_rank: number | null;
  current_rank: number | null;
  rank_delta: number;
  previous_score: number | null;
  current_score: number | null;
  score_delta: number;
  previous_tier: string | null;
  current_tier: string | null;
  candidate_score_delta: number;
  survivor_equity_delta: number;
  future_value_delta: number;
  ownership_delta: number;
  contest_dynamics_delta: number;
  change_category: RecommendationChangeCategory | string;
  audit_summary: string;
  calculation_version: string;
  created_at?: string;
}

export enum StabilityTier {
  VERY_STABLE = "VERY_STABLE",
  STABLE = "STABLE",
  MODERATE = "MODERATE",
  UNSTABLE = "UNSTABLE",
  HIGHLY_UNSTABLE = "HIGHLY_UNSTABLE"
}

export interface RecommendationConfidenceSnapshot {
  id?: number | string;
  season: string;
  week: number;
  entry_id: string;
  team_id: string;
  recommendation_rank: number;
  recommendation_score: number;
  confidence_score: number;
  stability_score: number;
  score_gap_to_next: number;
  score_gap_to_top: number;
  recommendation_volatility: number;
  confidence_tier: ConfidenceTier | string;
  stability_tier: StabilityTier | string;
  explanation: string;
  calculation_version: string;
  created_at?: string;
}


