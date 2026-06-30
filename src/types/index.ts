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

export interface Owner {
  id: string;
  display_name: string;
  email?: string | null;
  owner_type: string; // 'individual' or 'group'
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ContestTypeRecord {
  id: string;
  code: string;
  name: string;
  description: string;
  total_legs: number;
  uses_thanksgiving_leg: boolean;
  uses_christmas_leg: boolean;
  uses_holiday_reservations: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SurvivorEntry {
  id: string;
  name: string;
  status: 'alive' | 'eliminated';
  notes?: string;
  created_at: string;
  owner_id?: string;
  contest_type_id: string;
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
  contest_type?: string;
  contest_name?: string;
  total_legs?: number;
  holiday_strategy_enabled?: boolean;
  recommendation_format?: string;
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
    decisionAnalytics?: { status: HealthState; message: string | null };
    modelPerformanceRepository?: { status: HealthState; message: string | null };
    modelPerformanceService?: { status: HealthState; message: string | null };
    learningRepository?: { status: HealthState; message: string | null };
    learningService?: { status: HealthState; message: string | null };
    recommendationEvolution?: { status: HealthState; message: string | null };
    survivorStrategyRoadmapRepository?: { status: HealthState; message: string | null };
    survivorStrategyService?: { status: HealthState; message: string | null };
    survivorRoadmapService?: { status: HealthState; message: string | null };
    holidayReservationService?: { status: HealthState; message: string | null };
    ownerService?: { status: HealthState; message: string | null };
    userAccessRepository?: { status: HealthState; message: string | null };
    userAccessService?: { status: HealthState; message: string | null };
    ownerAccessService?: { status: HealthState; message: string | null };
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

export enum ConsensusTier {
  ELITE_CONSENSUS = "ELITE_CONSENSUS",
  STRONG_CONSENSUS = "STRONG_CONSENSUS",
  MODERATE_CONSENSUS = "MODERATE_CONSENSUS",
  WEAK_CONSENSUS = "WEAK_CONSENSUS",
  NO_CONSENSUS = "NO_CONSENSUS"
}

export interface RecommendationConsensus {
  id?: number | string;
  season: string;
  week: number;
  entry_id: string;
  team_id: string;
  candidate_score: number;
  survivor_equity_score: number;
  recommendation_score: number;
  confidence_score: number;
  ownership_score: number;
  future_value_score: number;
  consensus_score: number;
  agreement_count: number;
  consensus_tier: ConsensusTier | string;
  consensus_summary: string;
  calculation_version: string;
  created_at?: string;
}

export enum PortfolioTier {
  AGGRESSIVE_DIVERSIFIED = "AGGRESSIVE_DIVERSIFIED",
  BALANCED = "BALANCED",
  HIGH_CONSENSUS = "HIGH_CONSENSUS",
  MAX_SURVIVAL = "MAX_SURVIVAL"
}

export interface RecommendationPortfolio {
  id?: number | string;
  season: string;
  week: number;
  portfolio_id: string;
  entry_id: string;
  recommended_team_id: string;
  recommendation_score: number;
  confidence_score: number;
  consensus_score: number;
  allocation_rank: number;
  diversification_score: number;
  correlation_penalty: number;
  portfolio_score: number;
  allocation_reason: string;
  calculation_version: string;
  created_at?: string;
}

export enum ContestType {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
  GROUP = "GROUP",
  HIGH_STAKES = "HIGH_STAKES",
  MARKETPLACE = "MARKETPLACE"
}

export interface ContestEV {
  id?: number | string;
  season: string;
  week: number;
  contest_id: string;
  entry_id: string;
  recommended_team_id: string;
  contest_size: number;
  remaining_entries: number;
  estimated_ownership: number;
  win_probability: number;
  future_team_value: number;
  survivor_equity: number;
  portfolio_score: number;
  consensus_score: number;
  contest_ev_score: number;
  championship_probability: number;
  risk_adjustment: number;
  explanation: string;
  calculation_version: string;
  created_at?: string;
  contest_type?: ContestType | string;
}

export interface OwnershipCalibration {
  id?: number | string;
  season: string;
  week: number;
  team_id: string;
  contest_id: string;
  baseline_ownership: number;
  calibrated_ownership: number;
  sharp_multiplier: number;
  contest_size_factor: number;
  variance_index: number;
  calibration_score: number;
  explanation: string;
  calculation_version: string;
  created_at?: string;
}

export interface MarketCalibration {
  id?: number | string;
  season: string;
  week: number;
  game_id: string;
  team_id: string;
  opening_spread: number;
  closing_spread: number;
  model_spread: number;
  spread_clv: number;
  opening_total: number;
  closing_total: number;
  model_total: number;
  total_clv: number;
  market_direction: string;
  prediction_error: number;
  market_edge: number;
  calibration_weight: number;
  calculation_version: string;
  created_at?: string;
}

export interface ModelPerformance {
  id?: number | string;
  season: string;
  week: number;
  model_name: string;
  model_version: string;
  prediction_type: string;
  games_evaluated: number;
  correct_predictions: number;
  accuracy: number;
  brier_score: number;
  log_loss: number;
  rmse: number;
  mae: number;
  spread_clv: number;
  total_clv: number;
  calibration_score: number;
  rolling_score: number;
  performance_weight: number;
  recommended_weight: number;
  active_weight: number;
  status: string;
  calculation_version: string;
  created_at?: string;
}

export interface RollingValidation {
  id?: number | string;
  season: string;
  start_week: number;
  end_week: number;
  model_name: string;
  model_version: string;
  prediction_type: string;
  games_evaluated: number;
  wins: number;
  losses: number;
  accuracy: number;
  brier_score: number;
  log_loss: number;
  rmse: number;
  mae: number;
  spread_clv: number;
  total_clv: number;
  rolling_score: number;
  drift_score: number;
  recommended_action: string;
  calculation_version: string;
  created_at?: string;
}

export interface ModelDrift {
  id?: number | string;
  season: string;
  week: number;
  model_name: string;
  model_version: string;
  prediction_type: string;
  baseline_accuracy: number;
  current_accuracy: number;
  accuracy_delta: number;
  baseline_brier_score: number;
  current_brier_score: number;
  brier_delta: number;
  baseline_clv: number;
  current_clv: number;
  clv_delta: number;
  drift_score: number;
  drift_level: string; // STABLE, MONITOR, WARNING, CRITICAL
  recommended_action: string; // NONE, RECALIBRATE, RETRAIN, INVESTIGATE
  recommended_priority: string; // LOW, MEDIUM, HIGH, CRITICAL
  explanation: string;
  calculation_version: string;
  created_at?: string;
}

export interface AdaptiveModelWeight {
  id?: number | string;
  season: string;
  week: number;
  model_name: string;
  model_version: string;
  prediction_type: string;
  previous_weight: number;
  recommended_weight: number;
  weight_delta: number;
  performance_score: number;
  rolling_validation_score: number;
  calibration_score: number;
  clv_score: number;
  drift_penalty: number;
  confidence_score: number;
  final_weight: number;
  recommendation_reason: string;
  calculation_version: string;
  created_at?: string;
}

export interface EnsemblePrediction {
  id?: number | string;
  season: string;
  week: number;
  game_id: string;
  prediction_type: string;
  ensemble_prediction: number;
  prediction_std_dev: number;
  prediction_variance: number;
  confidence_interval_low: number;
  confidence_interval_high: number;
  model_count: number;
  weighted_prediction: number;
  agreement_score: number;
  disagreement_score: number;
  confidence_score: number;
  recommended_usage: string; // SAFE, NORMAL, LOW_CONFIDENCE, DO_NOT_BET
  calculation_version: string;
  created_at?: string;
}

export interface DecisionPolicy {
  id?: number | string;
  season: string;
  week: number;
  entry_id: string;
  contest_id: string;
  game_id: string;
  team_id: string;
  policy_type: string;
  ensemble_prediction: number;
  ensemble_confidence: number;
  contest_ev: number;
  portfolio_score: number;
  risk_score: number;
  leverage_score: number;
  decision_score: number;
  recommended_action: string; // LOCK, STRONG PLAY, PLAY, PASS, AVOID
  recommended_pick: string;
  confidence_tier: string;
  policy_reason: string;
  calculation_version: string;
  created_at?: string;
}

export interface SurvivorDecision {
  id?: number | string;
  season: string;
  week: number;
  entry_id: string;
  contest_id: string;
  decision_policy_id?: number | string | null;
  recommended_team_id: string;
  confidence: string; // Elite, Strong, Average, Weak, Avoid
  championship_ev: number;
  future_value_score: number;
  risk_score: number;
  portfolio_score: number;
  decision_score: number;
  agent_version: string;
  decision_reason: string;
  decision_json: string;
  created_at?: string;
}

export interface SurvivorPlan {
  id?: number | string;
  season: string;
  week: number;
  entry_id: string;
  contest_id: string;
  plan_name: string;
  planned_picks: string;
  projected_survival_probability: number;
  future_value_remaining: number;
  risk_index: number;
  efficiency_score: number;
  is_active: boolean;
  agent_version: string;
  plan_reasoning: string;
  plan_json: string;
  created_at?: string;
}

export interface ChampionshipPlan {
  id?: number | string;
  season: string;
  entry_id: string;
  contest_id: string;
  planning_horizon: string;
  weeks_remaining: number;
  recommended_team_id: string;
  projected_finish_probability: number;
  projected_championship_probability: number;
  future_value_score: number;
  inventory_score: number;
  risk_score: number;
  optimization_score: number;
  recommended_path: string;
  alternative_paths: string;
  planner_version: string;
  optimization_reason: string;
  optimization_json: string;
  created_at?: string;
}

export interface DecisionAnalyticsRecord {
  id?: number;
  season: string;
  week: number;
  contest_id: string;
  recommendation_id: string;
  engine_version: string;
  model_hash: string;
  policy_version: string;
  data_version: string;
  workflow_version: string;
  recommendation_type: string;
  selected_team: string;
  projected_survival_probability: number;
  projected_championship_probability: number;
  projected_expected_value: number;
  projected_future_value: number;
  recommendation_rank: number;
  confidence_score: number;
  created_at?: string;
}

export interface DecisionOutcomeRecord {
  id?: number;
  decision_id: number;
  game_result: string;
  survived: boolean;
  eliminated: boolean;
  actual_win_probability: number;
  market_open_line: number;
  closing_line: number;
  closing_line_value: number;
  evaluation_notes: string;
  evaluated_at?: string;
}

export interface WeeklyDecisionSummary {
  season: string;
  week: number;
  recommendations: number;
  wins: number;
  losses: number;
  survival_rate: number;
  average_confidence: number;
  average_expected_value: number;
  average_future_value: number;
  average_championship_probability: number;
  average_closing_line_value: number;
  created_at?: string;
}

export interface ModelPerformanceHistoryRecord {
  id?: number;
  season: string;
  week: number;
  engine_version: string;
  model_hash: string;
  data_version: string;
  policy_version: string;
  prediction_count: number;
  accuracy: number;
  log_loss: number;
  brier_score: number;
  calibration_error: number;
  average_confidence: number;
  average_expected_value: number;
  average_closing_line_value: number;
  average_survival_probability: number;
  average_championship_probability: number;
  created_at?: string;
}

export interface ModelPerformanceSummaryRecord {
  id?: number;
  model_hash: string;
  engine_version: string;
  games_evaluated: number;
  rolling_accuracy: number;
  rolling_log_loss: number;
  rolling_brier_score: number;
  rolling_calibration_error: number;
  rolling_expected_value: number;
  rolling_closing_line_value: number;
  last_updated?: string;
}

export interface WeeklyLearningHistoryRecord {
  id?: number;
  season: string;
  week: number;
  engine_version: string;
  model_hash: string;
  policy_version: string;
  data_version: string;
  recommendations: number;
  correct_predictions: number;
  incorrect_predictions: number;
  accuracy: number;
  average_confidence: number;
  average_expected_value: number;
  average_future_value: number;
  average_championship_probability: number;
  average_closing_line_value: number;
  lessons_learned: string;
  strengths: string;
  weaknesses: string;
  recommendations_for_improvement: string;
  created_at?: string;
}

export interface LearningTrendRecord {
  id?: number;
  metric_name: string;
  current_value: number;
  previous_value: number;
  percent_change: number;
  trend_direction: string;
  observation_count: number;
  updated_at?: string;
}

export interface ModelWeight {
  id?: number;
  model_name: string;
  prediction_type: string;
  current_weight: number;
  normalized_weight: number;
  rolling_accuracy: number;
  rolling_brier: number;
  rolling_logloss: number;
  calibration_score: number;
  last_updated?: string;
  created_at?: string;
}

export interface ModelWeightHistory {
  id?: number;
  week: number;
  season: string;
  model_name: string;
  prediction_type: string;
  previous_weight: number;
  new_weight: number;
  reason: string;
  metrics_snapshot: string;
  policy_version: string;
  created_at?: string;
}

export interface RecommendationEvolution {
  id?: number;
  season: string;
  week: number;
  contest_id?: number;
  recommendation_id?: number;
  team_id?: string;
  previous_rank?: number;
  new_rank?: number;
  previous_confidence?: number;
  new_confidence?: number;
  previous_probability?: number;
  new_probability?: number;
  previous_expected_value?: number;
  new_expected_value?: number;
  previous_model_weight?: number;
  new_model_weight?: number;
  evolution_reason: string;
  triggering_event: string;
  recommendation_status: string;
  created_at?: string;
}

export interface RecommendationChangeEvent {
  id?: number;
  recommendation_id: number;
  event_type: string;
  event_source: string;
  event_description: string;
  impact_score: number;
  previous_value?: string;
  new_value?: string;
  created_at?: string;
}

export interface RecommendationEvolutionSummary {
  id?: number;
  season: string;
  week: number;
  total_changes: number;
  major_changes: number;
  stable_recommendations: number;
  average_confidence_delta: number;
  average_rank_delta: number;
  created_at?: string;
}

// === V057: Survivor Strategy & Roadmap Framework Types ===

export enum SurvivorStrategyType {
  CHAMPIONSHIP = "CHAMPIONSHIP",
  DIVERSIFICATION = "DIVERSIFICATION",
  MARKETPLACE = "MARKETPLACE",
  GROUP_CONSENSUS = "GROUP_CONSENSUS",
  CONSERVATIVE = "CONSERVATIVE",
  CONTRARIAN = "CONTRARIAN",
  CUSTOM = "CUSTOM"
}

export enum HolidayType {
  THANKSGIVING = "THANKSGIVING",
  CHRISTMAS = "CHRISTMAS"
}

export interface SurvivorEntryStrategy {
  id?: number;
  entry_id: string;
  strategy_type: SurvivorStrategyType;
  strategy_name: string;
  strategy_description?: string;
  risk_tolerance?: string;
  diversification_weight?: number;
  future_value_weight?: number;
  survival_weight?: number;
  ownership_leverage_weight?: number;
  marketplace_weight?: number;
  consensus_weight?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SurvivorHolidayReservation {
  id?: number;
  entry_id: string;
  season: string;
  holiday_type: HolidayType;
  reserved_team_id?: string;
  alternate_team_id?: string;
  confidence_score?: number;
  reservation_reason?: string;
  strategy_type?: SurvivorStrategyType;
  created_at?: string;
  updated_at?: string;
}

export interface SurvivorEntryRoadmap {
  id?: number;
  entry_id: string;
  season: string;
  generated_week: number;
  strategy_type: SurvivorStrategyType;
  roadmap_version: string;
  total_projected_survival?: number;
  total_projected_equity?: number;
  portfolio_correlation_score?: number;
  roadmap_confidence?: number;
  generated_reason?: string;
  model_version?: string;
  policy_version?: string;
  contest_type_id?: string;
  total_legs?: number;
  holiday_enabled?: boolean;
  created_at?: string;
}

export interface SurvivorEntryRoadmapWeek {
  id?: number;
  roadmap_id: number;
  season: string;
  week: number;
  recommended_team_id?: string;
  alternate_team_id?: string;
  win_probability?: number;
  future_value_cost?: number;
  contest_equity_score?: number;
  ownership_projection?: number;
  roadmap_note?: string;
  is_current_week?: boolean;
  is_holiday_week?: boolean;
  created_at?: string;
}

export interface AppUser {
  id: string;
  username: string;
  password_hash: string;
  display_name: string;
  role: "admin" | "user" | "group_representative";
  owner_id?: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}















