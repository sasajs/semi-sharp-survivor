import { 
  Team, 
  Contest, 
  ContestLeg, 
  Game, 
  TeamWeekLine, 
  Owner,
  SurvivorEntry, 
  ContestTypeRecord,
  SurvivorPick, 
  SurvivorHistory,
  WeeklyInput,
  TeamFeature,
  GameFeature,
  ImportJob,
  ImportJobFile,
  ImportJobError,
  EntryInventory,
  ReservedTeam,
  HolidayReservation,
  FutureValueProfile,
  RiskProfile,
  GameRiskAssessment,
  EntryRecommendation,
  PortfolioRecommendation,
  WeeklySnapshot,
  FeatureSnapshot,
  InventorySnapshotRecord,
  RiskSnapshot,
  RecommendationSnapshot,
  DecisionAuditRecord,
  SimulationRun,
  EntrySurvivalProjection,
  FeatureDefinition,
  FeatureBuildRun,
  FeatureStoreSnapshot,
  EntryStrategyProfile,
  EntryMetadata,
  StrategyType,
  FutureTeamValue,
  SurvivorEquitySnapshot,
  AuditableRecommendationCandidate,
  OwnershipProjection,
  ContestDynamicsSnapshot,
  SurvivorRecommendation,
  RecommendationAudit,
  RecommendationConfidenceSnapshot,
  RecommendationConsensus,
  RecommendationPortfolio,
  ContestEV,
  OwnershipCalibration,
  MarketCalibration,
  ModelPerformance,
  RollingValidation,
  ModelDrift,
  AdaptiveModelWeight,
  EnsemblePrediction,
  DecisionPolicy,
  SurvivorDecision,
  SurvivorPlan,
  ChampionshipPlan,
  DecisionAnalyticsRecord,
  DecisionOutcomeRecord,
  WeeklyDecisionSummary,
  ModelPerformanceHistoryRecord,
  ModelPerformanceSummaryRecord,
  WeeklyLearningHistoryRecord,
  LearningTrendRecord,
  ModelWeight,
  ModelWeightHistory,
  RecommendationEvolution,
  RecommendationChangeEvent,
  RecommendationEvolutionSummary,
  SurvivorStrategyType,
  HolidayType,
  SurvivorEntryStrategy,
  SurvivorHolidayReservation,
  SurvivorEntryRoadmap,
  SurvivorEntryRoadmapWeek,
  AppUser,
  TeamAlias
} from "../../src/types";
import { AuthAuditRecord, SystemMetadata, ApplicationVersion, ProjectDecision, OperationsEvent } from "../../src/types/admin";
import { 
  ITeamRepository, 
  ITeamAliasRepository,
  IContestRepository, 
  IContestLegRepository, 
  IGameRepository, 
  ITeamWeekLineRepository, 
  ISurvivorEntryRepository, 
  ISurvivorPickRepository, 
  ISurvivorHistoryRepository,
  IWeeklyInputRepository,
  ITeamFeatureRepository,
  IGameFeatureRepository,
  IImportJobRepository,
  IInventoryRepository,
  IReservationRepository,
  IFutureValueRepository,
  IRiskRepository,
  IRiskAssessmentRepository,
  IRecommendationRepository,
  IRecommendationSnapshotRepository,
  ISnapshotRepository,
  IAuditRepository,
  ISimulationRepository,
  ISimulationRunRepository,
  ISimulationResultRepository,
  IAuthAuditRepository,
  ISystemMetadataRepository,
  IApplicationVersionsRepository,
  IProjectDecisionsRepository,
  IOperationsEventsRepository,
  IFeatureDefinitionRepository,
  IFeatureSnapshotRepository,
  IFeatureBuildRunRepository,
  IEntryStrategyProfileRepository,
  IEntryMetadataRepository,
  IFutureTeamValueRepository,
  ISurvivorEquityRepository,
  IRecommendationCandidateRepository,
  IOwnershipProjectionRepository,
  IContestDynamicsRepository,
  ISurvivorRecommendationRepository,
  IRecommendationAuditRepository,
  IRecommendationConfidenceRepository,
  IRecommendationConsensusRepository,
  IRecommendationPortfolioRepository,
  IContestEVRepository,
  IOwnershipCalibrationRepository,
  IMarketCalibrationRepository,
  IModelPerformanceRepository,
  IRollingValidationRepository,
  IModelDriftRepository,
  IAdaptiveModelWeightRepository,
  IEnsemblePredictionRepository,
  IDecisionPolicyRepository,
  ISurvivorDecisionRepository,
  ISurvivorPlanningRepository,
  IChampionshipPlanningRepository,
  IDecisionAnalyticsRepository,
  ILearningRepository,
  IModelWeightRepository,
  IRecommendationEvolutionRepository,
  ISurvivorStrategyRoadmapRepository,
  IOwnerRepository,
  IUserAccessRepository,
  IContestTypeRepository
} from "./interfaces";

/**
 * ====================================================================
 * IN-MEMORY REPOSITORY DATABASE TABLES
 * ====================================================================
 */
export let mockTeams: Team[] = [];
export let mockTeamAliases: TeamAlias[] = [];
export let mockAppUsers: AppUser[] = [];

const extraVariants = [
  { teamId: "ari", alias: "AZ", type: "abbreviation" },
  { teamId: "ari", alias: "Ariz", type: "historical" },
  { teamId: "gb", alias: "GNB", type: "abbreviation" },
  { teamId: "jax", alias: "JAC", type: "abbreviation" },
  { teamId: "kc", alias: "KAN", type: "abbreviation" },
  { teamId: "lv", alias: "LVR", type: "abbreviation" },
  { teamId: "lv", alias: "Vegas Raiders", type: "common" },
  { teamId: "lv", alias: "Oakland Raiders", type: "historical" },
  { teamId: "lac", alias: "LA Chargers", type: "common" },
  { teamId: "lac", alias: "San Diego Chargers", type: "historical" },
  { teamId: "lac", alias: "SD", type: "abbreviation" },
  { teamId: "lar", alias: "LA Rams", type: "common" },
  { teamId: "lar", alias: "St Louis Rams", type: "historical" },
  { teamId: "lar", alias: "STL", type: "abbreviation" },
  { teamId: "ne", alias: "NWE", type: "abbreviation" },
  { teamId: "no", alias: "NOR", type: "abbreviation" },
  { teamId: "sf", alias: "SFO", type: "abbreviation" },
  { teamId: "sf", alias: "Niners", type: "nickname" },
  { teamId: "tb", alias: "TBB", type: "abbreviation" },
  { teamId: "tb", alias: "Bucs", type: "nickname" },
  { teamId: "ten", alias: "Houston Oilers", type: "historical" },
  { teamId: "was", alias: "WSH", type: "abbreviation" },
  { teamId: "was", alias: "Washington Football Team", type: "historical" },
  { teamId: "was", alias: "Football Team", type: "nickname" },
  { teamId: "was", alias: "Redskins", type: "historical" }
];

export function seedMockTeamAliases(teamsList: Team[]) {
  const list: TeamAlias[] = [];
  const added = new Set<string>();

  const add = (teamId: string, alias: string, type: string) => {
    const norm = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
    const key = `${norm}:null`;
    if (added.has(key)) return;
    added.add(key);

    list.push({
      id: `alias-${teamId}-${norm}`,
      team_id: teamId,
      alias,
      normalized_alias: norm,
      provider_name: null,
      alias_type: type as any,
      active: true
    });
  };

  for (const t of teamsList) {
    add(t.id, t.id, "common");
    add(t.id, t.abbreviation, "abbreviation");
    add(t.id, t.name, "full_name");
    
    const spaceIdx = t.name.lastIndexOf(' ');
    if (spaceIdx > 0) {
      const city = t.name.substring(0, spaceIdx);
      const nickname = t.name.substring(spaceIdx + 1);
      add(t.id, city, "city");
      add(t.id, nickname, "nickname");
    }
  }

  for (const v of extraVariants) {
    add(v.teamId, v.alias, v.type);
  }

  mockTeamAliases = list;
}
export let mockContestTypes: ContestTypeRecord[] = [];
export let mockSurvivorEntryStrategies: SurvivorEntryStrategy[] = [];
export let mockSurvivorHolidayReservations: SurvivorHolidayReservation[] = [];
export let mockSurvivorEntryRoadmaps: SurvivorEntryRoadmap[] = [];
export let mockSurvivorEntryRoadmapWeeks: SurvivorEntryRoadmapWeek[] = [];
export let mockContests: Contest[] = [];
export let mockLegs: ContestLeg[] = [];
export let mockGames: Game[] = [];
export let mockLines: TeamWeekLine[] = [];
export let mockOwners: Owner[] = [];
export let mockEntries: SurvivorEntry[] = [];
export let mockPicks: SurvivorPick[] = [];
export let mockHistory: SurvivorHistory[] = [];
export let mockWeeklyInputs: WeeklyInput[] = [];
export let mockTeamFeatures: TeamFeature[] = [];
export let mockGameFeatures: GameFeature[] = [];
export let mockImportJobs: ImportJob[] = [];
export let mockImportJobFiles: ImportJobFile[] = [];
export let mockImportJobErrors: ImportJobError[] = [];
export let mockInventories: EntryInventory[] = [];
export let mockReservedTeams: ReservedTeam[] = [];
export let mockHolidayReservations: HolidayReservation[] = [];
export let mockFutureValueProfiles: FutureValueProfile[] = [];
export let mockRiskProfiles: RiskProfile[] = [];
export let mockGameRiskAssessments: GameRiskAssessment[] = [];
export let mockEntryRecommendations: EntryRecommendation[] = [];
export let mockPortfolioRecommendations: PortfolioRecommendation[] = [];
export let mockWeeklySnapshots: WeeklySnapshot[] = [];
export let mockFeatureSnapshots: FeatureSnapshot[] = [];
export let mockInventorySnapshots: InventorySnapshotRecord[] = [];
export let mockRiskSnapshots: RiskSnapshot[] = [];
export let mockWeeklyRecSnapshots: RecommendationSnapshot[] = [];
export let mockDecisionAuditRecords: DecisionAuditRecord[] = [];
export let mockSimulationRuns: SimulationRun[] = [];

// --- FEATURE STORE MOCK TABLES ---
export let mockFeatureDefinitions: FeatureDefinition[] = [
  {
    feature_id: "days_rest",
    feature_name: "Days of Rest",
    feature_category: "Scheduling",
    description: "Total rest days prior to the game kickoff.",
    sport: "NFL",
    active_flag: true,
    created_at: new Date().toISOString()
  },
  {
    feature_id: "home_field_advantage",
    feature_name: "Home Field Advantage",
    feature_category: "Situational",
    description: "Binary indicator (1.0 or 0.0) of whether the team has home field advantage in the game.",
    sport: "NFL",
    active_flag: true,
    created_at: new Date().toISOString()
  },
  {
    feature_id: "market_spread",
    feature_name: "Market Spread",
    feature_category: "Market",
    description: "Official betting line market spread for the team (negative for favorites, positive for underdogs).",
    sport: "NFL",
    active_flag: true,
    created_at: new Date().toISOString()
  },
  {
    feature_id: "market_total",
    feature_name: "Market Over/Under Total",
    feature_category: "Market",
    description: "Official betting line total over/under projection for the game.",
    sport: "NFL",
    active_flag: true,
    created_at: new Date().toISOString()
  },
  {
    feature_id: "team_win_pct",
    feature_name: "Team Win Percentage",
    feature_category: "Performance",
    description: "The historical winning percentage of the team leading up to the current week.",
    sport: "NFL",
    active_flag: true,
    created_at: new Date().toISOString()
  },
  {
    feature_id: "future_team_value",
    feature_name: "Future Team Value",
    feature_category: "Long-term",
    description: "Projected future valuation multiplier for survivor or simulation weightings.",
    sport: "NFL",
    active_flag: true,
    created_at: new Date().toISOString()
  },
  {
    feature_id: "survivor_equity",
    feature_name: "Survivor Equity",
    feature_category: "Contest Value",
    description: "Estimated contest equity gain of surviving the week with a given team choice, weighted by entry-specific strategy profile.",
    sport: "NFL",
    active_flag: true,
    created_at: new Date().toISOString()
  }
];
export let mockFeatureStoreSnapshots: FeatureStoreSnapshot[] = [];
export let mockFeatureBuildRuns: FeatureBuildRun[] = [];

export let mockEntryStrategyProfiles: EntryStrategyProfile[] = [];
export let mockEntryMetadataRecords: EntryMetadata[] = [];
export let mockFutureTeamValues: FutureTeamValue[] = [];
export let mockSurvivorEquitySnapshots: SurvivorEquitySnapshot[] = [];
export let mockRecommendationCandidates: AuditableRecommendationCandidate[] = [];
export let mockOwnershipProjections: OwnershipProjection[] = [];
export let mockContestDynamicsSnapshots: ContestDynamicsSnapshot[] = [];
export let mockSurvivorRecommendations: SurvivorRecommendation[] = [];
export let mockRecommendationAudits: RecommendationAudit[] = [];
export let mockRecommendationConfidenceSnapshots: RecommendationConfidenceSnapshot[] = [];
export let mockRecommendationConsensus: RecommendationConsensus[] = [];
export let mockRecommendationPortfolios: RecommendationPortfolio[] = [];
export let mockContestEVs: ContestEV[] = [];
export let mockOwnershipCalibrations: OwnershipCalibration[] = [];
export let mockMarketCalibrations: MarketCalibration[] = [];
export let mockModelPerformances: ModelPerformance[] = [];
export let mockRollingValidations: RollingValidation[] = [];
export let mockModelDrifts: ModelDrift[] = [];
export let mockAdaptiveModelWeights: AdaptiveModelWeight[] = [];
export let mockEnsemblePredictions: EnsemblePrediction[] = [];
export let mockDecisionPolicies: DecisionPolicy[] = [];
export let mockSurvivorDecisions: SurvivorDecision[] = [];
export let mockSurvivorPlans: SurvivorPlan[] = [];
export let mockChampionshipPlans: ChampionshipPlan[] = [];
export let mockDecisionAnalytics: DecisionAnalyticsRecord[] = [];
export let mockDecisionOutcomes: DecisionOutcomeRecord[] = [];
export let mockWeeklyDecisionSummaries: WeeklyDecisionSummary[] = [];

export let mockRecommendationEvolutions: RecommendationEvolution[] = [];
export let mockRecommendationChangeEvents: RecommendationChangeEvent[] = [];
export let mockRecommendationEvolutionSummaries: RecommendationEvolutionSummary[] = [];

export let mockModelWeights: ModelWeight[] = [
  {
    model_name: "Ensemble Consensus Model",
    prediction_type: "survival",
    current_weight: 0.25,
    normalized_weight: 0.25,
    rolling_accuracy: 85.0,
    rolling_brier: 0.12,
    rolling_logloss: 0.35,
    calibration_score: 90.0,
    last_updated: new Date().toISOString(),
    created_at: new Date().toISOString()
  },
  {
    model_name: "Machine Learning Regressor",
    prediction_type: "survival",
    current_weight: 0.20,
    normalized_weight: 0.20,
    rolling_accuracy: 82.5,
    rolling_brier: 0.14,
    rolling_logloss: 0.38,
    calibration_score: 85.0,
    last_updated: new Date().toISOString(),
    created_at: new Date().toISOString()
  },
  {
    model_name: "Market Calibration Model",
    prediction_type: "survival",
    current_weight: 0.22,
    normalized_weight: 0.22,
    rolling_accuracy: 84.0,
    rolling_brier: 0.13,
    rolling_logloss: 0.36,
    calibration_score: 88.0,
    last_updated: new Date().toISOString(),
    created_at: new Date().toISOString()
  },
  {
    model_name: "Expert Consensus Model",
    prediction_type: "survival",
    current_weight: 0.18,
    normalized_weight: 0.18,
    rolling_accuracy: 80.0,
    rolling_brier: 0.15,
    rolling_logloss: 0.40,
    calibration_score: 82.0,
    last_updated: new Date().toISOString(),
    created_at: new Date().toISOString()
  },
  {
    model_name: "Historical Trend Model",
    prediction_type: "survival",
    current_weight: 0.15,
    normalized_weight: 0.15,
    rolling_accuracy: 78.0,
    rolling_brier: 0.16,
    rolling_logloss: 0.42,
    calibration_score: 80.0,
    last_updated: new Date().toISOString(),
    created_at: new Date().toISOString()
  }
];

export let mockModelWeightHistory: ModelWeightHistory[] = [
  {
    week: 4,
    season: "2026",
    model_name: "Ensemble Consensus Model",
    prediction_type: "survival",
    previous_weight: 0.20,
    new_weight: 0.25,
    reason: "Consistent model outperformance in Weeks 1-3. Accuracy 85.0%, Low Brier Score 0.12.",
    metrics_snapshot: '{"rolling_accuracy": 85.0, "rolling_brier": 0.12, "rolling_logloss": 0.35, "calibration_score": 90.0}',
    policy_version: "v0.54-default",
    created_at: "2026-06-25T12:00:00Z"
  }
];

export let mockWeeklyLearningHistories: WeeklyLearningHistoryRecord[] = [
  {
    season: "2026",
    week: 4,
    engine_version: "V054",
    model_hash: "m_hash_v054",
    policy_version: "p_version_v2",
    data_version: "d_version_v2",
    recommendations: 10,
    correct_predictions: 9,
    incorrect_predictions: 1,
    accuracy: 90.0,
    average_confidence: 88.5,
    average_expected_value: 1.22,
    average_future_value: 0.15,
    average_championship_probability: 0.13,
    average_closing_line_value: 0.52,
    lessons_learned: "Model confidence in divisional matchups was highly calibrated. Avoided overconfident chalk in high-wind games.",
    strengths: "Divisional Underdogs, Wind-adjusted totals",
    weaknesses: "Injured Quarterback backfills",
    recommendations_for_improvement: "Integrate backfill QB snap shares and wind velocity multipliers earlier."
  },
  {
    season: "2026",
    week: 3,
    engine_version: "V054",
    model_hash: "m_hash_v054",
    policy_version: "p_version_v2",
    data_version: "d_version_v2",
    recommendations: 12,
    correct_predictions: 10,
    incorrect_predictions: 2,
    accuracy: 83.3,
    average_confidence: 85.0,
    average_expected_value: 1.18,
    average_future_value: 0.18,
    average_championship_probability: 0.12,
    average_closing_line_value: 0.41,
    lessons_learned: "Rest-disadvantaged road favorites continue to underperform expected win rates. Equity retention was prioritized.",
    strengths: "Home Favorites, Divisional Matchups",
    weaknesses: "Rest-disadvantaged road favorites",
    recommendations_for_improvement: "Apply Rest-Disadvantage penalty factor (v1.2) to future recommendation candidates."
  }
];
export let mockLearningTrends: LearningTrendRecord[] = [
  {
    metric_name: "Weekly Learning Score",
    current_value: 86.7,
    previous_value: 81.2,
    percent_change: 6.77,
    trend_direction: "UP",
    observation_count: 4
  },
  {
    metric_name: "Prediction Accuracy",
    current_value: 86.7,
    previous_value: 83.3,
    percent_change: 4.08,
    trend_direction: "UP",
    observation_count: 4
  },
  {
    metric_name: "Confidence Calibration",
    current_value: 88.5,
    previous_value: 85.0,
    percent_change: 4.12,
    trend_direction: "UP",
    observation_count: 4
  },
  {
    metric_name: "Average Expected Value",
    current_value: 1.22,
    previous_value: 1.18,
    percent_change: 3.39,
    trend_direction: "UP",
    observation_count: 4
  },
  {
    metric_name: "Closing Line Value Beat",
    current_value: 0.52,
    previous_value: 0.41,
    percent_change: 26.83,
    trend_direction: "UP",
    observation_count: 4
  }
];
export let mockModelPerformanceHistories: ModelPerformanceHistoryRecord[] = [
  {
    season: "2026",
    week: 4,
    engine_version: "V053",
    model_hash: "m_hash_v053",
    data_version: "d_version_v1",
    policy_version: "p_version_v1",
    prediction_count: 10,
    accuracy: 90.0,
    log_loss: 0.3921,
    brier_score: 0.1102,
    calibration_error: 0.0215,
    average_confidence: 88.5,
    average_expected_value: 1.2240,
    average_closing_line_value: 0.520,
    average_survival_probability: 0.8524,
    average_championship_probability: 0.1315
  },
  {
    season: "2026",
    week: 3,
    engine_version: "V053",
    model_hash: "m_hash_v053",
    data_version: "d_version_v1",
    policy_version: "p_version_v1",
    prediction_count: 10,
    accuracy: 80.0,
    log_loss: 0.4850,
    brier_score: 0.1410,
    calibration_error: 0.0350,
    average_confidence: 84.0,
    average_expected_value: 1.2510,
    average_closing_line_value: 0.450,
    average_survival_probability: 0.8214,
    average_championship_probability: 0.1215
  },
  {
    season: "2026",
    week: 2,
    engine_version: "V053",
    model_hash: "m_hash_v053",
    data_version: "d_version_v1",
    policy_version: "p_version_v1",
    prediction_count: 15,
    accuracy: 66.7,
    log_loss: 0.5891,
    brier_score: 0.1982,
    calibration_error: 0.0821,
    average_confidence: 76.5,
    average_expected_value: 1.1820,
    average_closing_line_value: 0.220,
    average_survival_probability: 0.7410,
    average_championship_probability: 0.1105
  },
  {
    season: "2026",
    week: 1,
    engine_version: "V053",
    model_hash: "m_hash_v053",
    data_version: "d_version_v1",
    policy_version: "p_version_v1",
    prediction_count: 12,
    accuracy: 75.0,
    log_loss: 0.5213,
    brier_score: 0.1654,
    calibration_error: 0.0412,
    average_confidence: 80.0,
    average_expected_value: 1.1230,
    average_closing_line_value: 0.350,
    average_survival_probability: 0.7912,
    average_championship_probability: 0.1015
  }
];
export let mockModelPerformanceSummaries: ModelPerformanceSummaryRecord[] = [
  {
    model_hash: "m_hash_v053",
    engine_version: "V053",
    games_evaluated: 47,
    rolling_accuracy: 76.6,
    rolling_log_loss: 0.5015,
    rolling_brier_score: 0.1554,
    rolling_calibration_error: 0.0465,
    rolling_expected_value: 1.1920,
    rolling_closing_line_value: 0.371,
    last_updated: new Date().toISOString()
  }
];

const defaultMetadata: EntryMetadata[] = [
  {
    entry_id: "UWOSH-1",
    owner_name: "Steve",
    entry_description: "Steve personal entry #1",
    entry_notes: "High Priority",
    primary_goal: "Maximize championship expected value",
    secondary_goal: "ROI optimization",
    active_flag: true
  },
  {
    entry_id: "UWOSH-2",
    owner_name: "Steve",
    entry_description: "Steve personal entry #2",
    entry_notes: "Portfolio entry",
    primary_goal: "Diversify from UWOSH-1 and maximize combined portfolio EV",
    secondary_goal: "Jointly optimize with UWOSH-1",
    active_flag: true
  },
  {
    entry_id: "UWOSH-3",
    owner_name: "Cameron",
    entry_description: "Cameron personal entry",
    entry_notes: "Marketplace resale focus",
    primary_goal: "Survive past mid-season and preserve marketplace resale value",
    secondary_goal: "Increase marketplace resale value",
    active_flag: true
  },
  {
    entry_id: "UWOSH-4",
    owner_name: "UW Oshkosh IS Group",
    entry_description: "Group entry for 9 people including Steve, Cameron, and 7 UW Oshkosh IS department participants",
    entry_notes: "Low risk focus",
    primary_goal: "Maximize group survival probability and reduce volatility",
    secondary_goal: "Reduce risk",
    active_flag: true
  }
];

const defaultProfiles: EntryStrategyProfile[] = [
  {
    profile_id: 1,
    entry_id: "UWOSH-1",
    strategy_type: StrategyType.CHAMPIONSHIP_EV,
    objective: "Maximize championship expected value.",
    risk_tolerance: "HIGH",
    diversification_group: "UWOSH_GROUP",
    marketplace_target: "NONE",
    notes: "Steve first entry"
  },
  {
    profile_id: 2,
    entry_id: "UWOSH-2",
    strategy_type: StrategyType.PORTFOLIO_EV,
    objective: "Optimize jointly with UWOSH-1. Avoid unnecessary duplicate selections. Maximize combined portfolio EV.",
    risk_tolerance: "MEDIUM",
    diversification_group: "Steve Portfolio",
    marketplace_target: "NONE",
    notes: "Steve second entry (portfolio logic)"
  },
  {
    profile_id: 3,
    entry_id: "UWOSH-3",
    strategy_type: StrategyType.MARKETPLACE_SURVIVAL,
    objective: "Survive into mid-season to increase marketplace resale value. Favor safer selections early. Lower volatility.",
    risk_tolerance: "LOW",
    diversification_group: "CAMERON",
    marketplace_target: "MID_SEASON",
    notes: "Cameron marketplace survival entry"
  },
  {
    profile_id: 4,
    entry_id: "UWOSH-4",
    strategy_type: StrategyType.GROUP_SURVIVAL,
    objective: "9 total participants. Maximize survival probability. Reduce risk. Avoid aggressive strategies.",
    risk_tolerance: "VERY_LOW",
    diversification_group: "UWOSH_GROUP_4",
    marketplace_target: "NONE",
    notes: "UW Oshkosh Group entry (9 participants)"
  }
];

/**
 * Global database reset / seed helper
 */
export function resetMockDatabase(
  teams: Team[],
  contests: Contest[],
  legs: ContestLeg[],
  entries: SurvivorEntry[],
  picks: SurvivorPick[],
  games: Game[],
  lines: TeamWeekLine[]
) {
  mockTeams = [...teams];
  seedMockTeamAliases(mockTeams);
  mockContests = [...contests];
  mockLegs = [...legs];
  mockOwners = [
    { id: "owner-steve", display_name: "Steve", email: "Steve.Schilhabel@gmail.com", owner_type: "individual", active: true },
    { id: "owner-cameron", display_name: "Cameron", email: "cameron@example.com", owner_type: "individual", active: true },
    { id: "owner-uw-oshkosh", display_name: "UW Oshkosh Group", email: "uwosh@example.com", owner_type: "group", active: true }
  ];
  mockAppUsers = [
    { id: "user-admin", username: "admin", password_hash: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918", display_name: "Admin User", role: "admin", owner_id: undefined, active: true },
    { id: "user-steve", username: "steve", password_hash: "a09033324f9f69424c8322e70e9a037803d3bc93c04c554a9d949ecf14652c70", display_name: "Steve Schilhabel", role: "user", owner_id: "owner-steve", active: true },
    { id: "user-cameron", username: "cameron", password_hash: "199990b797968561ec9c7929497e201200257e852445b9db054e8be48e9d6d7e", display_name: "Cameron", role: "user", owner_id: "owner-cameron", active: true },
    { id: "user-group", username: "group", password_hash: "a0bc9568ec3b7b6863118a1bf18dbfb37e2962451557999738ef9ca8c903a4cf", display_name: "UW Oshkosh Group", role: "group_representative", owner_id: "owner-uw-oshkosh", active: true }
  ];
  mockEntries = [...entries];
  // Seed mock contest types if they are empty
  mockContestTypes = [
    {
      id: 'circa',
      code: 'CIRCA',
      name: 'Circa Survivor',
      description: '20-leg Survivor contest including Thanksgiving and Christmas holiday legs.',
      total_legs: 20,
      uses_thanksgiving_leg: true,
      uses_christmas_leg: true,
      uses_holiday_reservations: true,
      is_active: true
    },
    {
      id: 'standard',
      code: 'STANDARD',
      name: 'Standard Survivor',
      description: 'Traditional 18-week Survivor contest with no separate Thanksgiving or Christmas legs.',
      total_legs: 18,
      uses_thanksgiving_leg: false,
      uses_christmas_leg: false,
      uses_holiday_reservations: false,
      is_active: true
    }
  ];
  // Ensure every entry has a contest_type_id
  mockEntries.forEach(e => {
    if (!e.contest_type_id) {
      e.contest_type_id = 'circa';
    }
  });
  mockPicks = [...picks];
  mockGames = [...games];
  mockLines = [...lines];
  mockHistory = [];
  mockEntryMetadataRecords = [...defaultMetadata];
  mockEntryStrategyProfiles = [...defaultProfiles];
  mockFutureTeamValues = [];
  mockSurvivorEquitySnapshots = [];
  mockRecommendationCandidates = [];
  mockOwnershipProjections = [];
  mockContestDynamicsSnapshots = [];
  mockSurvivorRecommendations = [];
  mockRecommendationAudits = [];
  mockRecommendationConfidenceSnapshots = [];
  mockRecommendationConsensus = [];
  mockRecommendationPortfolios = [];
  mockContestEVs = [];
  mockOwnershipCalibrations = [];
  mockMarketCalibrations = [];
  mockModelPerformances = [];
  mockRollingValidations = [];
  mockModelDrifts = [];
  mockAdaptiveModelWeights = [];
  mockEnsemblePredictions = [];
  mockDecisionPolicies = [];
  mockSurvivorDecisions = [];
  mockSurvivorPlans = [];
  mockChampionshipPlans = [];
  mockDecisionAnalytics = [];
  mockDecisionOutcomes = [];
  mockWeeklyDecisionSummaries = [];
}

/**
 * 1. Team Repository Implementation
 */
export class MockTeamRepository implements ITeamRepository {
  async getAll(): Promise<Team[]> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM teams ORDER BY name ASC;
    */
    return [...mockTeams];
  }

  async getById(id: string): Promise<Team | null> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM teams WHERE id = $1 LIMIT 1;
    */
    return mockTeams.find(t => t.id === id) || null;
  }

  async save(team: Team): Promise<Team> {
    /* 
      PostgreSQL Reference:
      INSERT INTO teams (id, name, abbreviation, bye_week, primary_color, secondary_color)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name, 
        abbreviation = EXCLUDED.abbreviation, 
        bye_week = EXCLUDED.bye_week, 
        primary_color = EXCLUDED.primary_color, 
        secondary_color = EXCLUDED.secondary_color
      RETURNING *;
    */
    const existing = mockTeams.findIndex(t => t.id === team.id);
    if (existing !== -1) {
      mockTeams[existing] = team;
    } else {
      mockTeams.push(team);
    }
    return team;
  }
}

/**
 * 2. Contest Repository Implementation
 */
export class MockContestRepository implements IContestRepository {
  async getAll(): Promise<Contest[]> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM contests ORDER BY year DESC;
    */
    return [...mockContests];
  }

  async getById(id: string): Promise<Contest | null> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM contests WHERE id = $1 LIMIT 1;
    */
    return mockContests.find(c => c.id === id) || null;
  }

  async save(contest: Contest): Promise<Contest> {
    /* 
      PostgreSQL Reference:
      INSERT INTO contests (id, name, year, status)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status
      RETURNING *;
    */
    const existing = mockContests.findIndex(c => c.id === contest.id);
    if (existing !== -1) {
      mockContests[existing] = contest;
    } else {
      mockContests.push(contest);
    }
    return contest;
  }
}

/**
 * 3. ContestLeg Repository Implementation
 */
export class MockContestLegRepository implements IContestLegRepository {
  async getAll(): Promise<ContestLeg[]> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM contest_legs ORDER BY display_order ASC;
    */
    return [...mockLegs];
  }

  async getById(id: string): Promise<ContestLeg | null> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM contest_legs WHERE id = $1 LIMIT 1;
    */
    return mockLegs.find(l => l.id === id) || null;
  }

  async getByContestId(contestId: string): Promise<ContestLeg[]> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM contest_legs WHERE contest_id = $1 ORDER BY display_order ASC;
    */
    return [...mockLegs];
  }

  async save(leg: ContestLeg): Promise<ContestLeg> {
    /* 
      PostgreSQL Reference:
      INSERT INTO contest_legs (id, contest_id, name, leg_type, display_order, nfl_week)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name, 
        leg_type = EXCLUDED.leg_type, 
        display_order = EXCLUDED.display_order, 
        nfl_week = EXCLUDED.nfl_week
      RETURNING *;
    */
    const existing = mockLegs.findIndex(l => l.id === leg.id);
    if (existing !== -1) {
      mockLegs[existing] = leg;
    } else {
      mockLegs.push(leg);
    }
    return leg;
  }
}

/**
 * 4. Game Repository Implementation
 */
export class MockGameRepository implements IGameRepository {
  async getAll(): Promise<Game[]> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM games ORDER BY game_time ASC;
    */
    return [...mockGames];
  }

  async getById(id: string): Promise<Game | null> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM games WHERE id = $1 LIMIT 1;
    */
    return mockGames.find(g => g.id === id) || null;
  }

  async getByLegId(legId: string): Promise<Game[]> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM games WHERE contest_leg_id = $1 ORDER BY game_time ASC;
    */
    return mockGames.filter(g => g.contest_leg_id === legId);
  }

  async save(game: Game): Promise<Game> {
    /* 
      PostgreSQL Reference:
      INSERT INTO games (id, contest_leg_id, home_team_id, away_team_id, home_score, away_score, status, game_time)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET 
        home_score = EXCLUDED.home_score, 
        away_score = EXCLUDED.away_score, 
        status = EXCLUDED.status, 
        game_time = EXCLUDED.game_time
      RETURNING *;
    */
    const existing = mockGames.findIndex(g => g.id === game.id);
    if (existing !== -1) {
      mockGames[existing] = game;
    } else {
      mockGames.push(game);
    }
    return game;
  }
}

/**
 * 5. TeamWeekLine Repository Implementation
 */
export class MockTeamWeekLineRepository implements ITeamWeekLineRepository {
  async getAll(): Promise<TeamWeekLine[]> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM team_week_lines;
    */
    return [...mockLines];
  }

  async getByLegId(legId: string): Promise<TeamWeekLine[]> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM team_week_lines WHERE contest_leg_id = $1;
    */
    return mockLines.filter(l => l.contest_leg_id === legId);
  }

  async getByTeamAndLeg(teamId: string, legId: string): Promise<TeamWeekLine | null> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM team_week_lines WHERE team_id = $1 AND contest_leg_id = $2 LIMIT 1;
    */
    return mockLines.find(l => l.team_id === teamId && l.contest_leg_id === legId) || null;
  }

  async save(line: TeamWeekLine): Promise<TeamWeekLine> {
    /* 
      PostgreSQL Reference:
      INSERT INTO team_week_lines (id, team_id, contest_leg_id, win_probability, pick_popularity, future_value, leverage_multiplier, holiday_safety_multiplier, contest_equity_score)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (team_id, contest_leg_id) DO UPDATE SET 
        win_probability = EXCLUDED.win_probability, 
        pick_popularity = EXCLUDED.pick_popularity, 
        future_value = EXCLUDED.future_value, 
        leverage_multiplier = EXCLUDED.leverage_multiplier, 
        holiday_safety_multiplier = EXCLUDED.holiday_safety_multiplier, 
        contest_equity_score = EXCLUDED.contest_equity_score
      RETURNING *;
    */
    const existing = mockLines.findIndex(l => l.team_id === line.team_id && l.contest_leg_id === line.contest_leg_id);
    if (existing !== -1) {
      mockLines[existing] = line;
    } else {
      mockLines.push(line);
    }
    return line;
  }
}

/**
 * 6. SurvivorEntry Repository Implementation
 */
export class MockSurvivorEntryRepository implements ISurvivorEntryRepository {
  async getAll(): Promise<SurvivorEntry[]> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM survivor_entries ORDER BY created_at ASC;
    */
    return [...mockEntries];
  }

  async getById(id: string): Promise<SurvivorEntry | null> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM survivor_entries WHERE id = $1 LIMIT 1;
    */
    return mockEntries.find(e => 
      e.id === id || 
      e.name === id ||
      (id === "22222222-2222-4222-c222-000000000101" && (e.id === "UWOSH-1" || e.name === "UWOSH-1")) ||
      (id === "22222222-2222-4222-c222-000000000102" && (e.id === "UWOSH-2" || e.name === "UWOSH-2")) ||
      (id === "22222222-2222-4222-c222-000000000103" && (e.id === "UWOSH-3" || e.name === "UWOSH-3")) ||
      (id === "22222222-2222-4222-c222-000000000104" && (e.id === "UWOSH-4" || e.name === "UWOSH-4"))
    ) || null;
  }

  async getByOwnerId(ownerId: string): Promise<SurvivorEntry[]> {
    return mockEntries.filter(e => e.owner_id === ownerId);
  }

  async create(entry: { contest_id?: string; name: string; notes?: string; owner_id?: string; contest_type_id?: string }): Promise<SurvivorEntry> {
    /* 
      PostgreSQL Reference:
      INSERT INTO survivor_entries (id, contest_id, name, status, notes, owner_id)
      VALUES (uuid_generate_v4(), $1, $2, 'alive', $3, $4)
      RETURNING *;
    */
    const newEntry: SurvivorEntry = {
      id: `entry-${Date.now()}`,
      name: entry.name,
      status: "alive",
      notes: entry.notes || "",
      created_at: new Date().toISOString(),
      owner_id: entry.owner_id,
      contest_type_id: entry.contest_type_id || 'circa'
    };
    mockEntries.push(newEntry);
    return newEntry;
  }

  async update(id: string, updates: Partial<SurvivorEntry>): Promise<SurvivorEntry | null> {
    /* 
      PostgreSQL Reference:
      UPDATE survivor_entries 
      SET name = COALESCE($2, name), notes = COALESCE($3, notes), status = COALESCE($4, status), updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    */
    const idx = mockEntries.findIndex(e => e.id === id);
    if (idx === -1) return null;
    
    mockEntries[idx] = {
      ...mockEntries[idx],
      ...updates
    };
    return mockEntries[idx];
  }

  async delete(id: string): Promise<boolean> {
    /* 
      PostgreSQL Reference:
      DELETE FROM survivor_entries WHERE id = $1;
    */
    const idx = mockEntries.findIndex(e => e.id === id);
    if (idx === -1) return false;
    mockEntries.splice(idx, 1);
    return true;
  }
}

/**
 * 7. SurvivorPick Repository Implementation
 */
export class MockSurvivorPickRepository implements ISurvivorPickRepository {
  async getAll(): Promise<SurvivorPick[]> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM survivor_picks;
    */
    return [...mockPicks];
  }

  async getById(id: string): Promise<SurvivorPick | null> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM survivor_picks WHERE id = $1 LIMIT 1;
    */
    return mockPicks.find(p => p.id === id) || null;
  }

  async getByEntryId(entryId: string): Promise<SurvivorPick[]> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM survivor_picks WHERE entry_id = $1 ORDER BY created_at ASC;
    */
    return mockPicks.filter(p => p.entry_id === entryId);
  }

  async getByLegId(legId: string): Promise<SurvivorPick[]> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM survivor_picks WHERE contest_leg_id = $1;
    */
    return mockPicks.filter(p => p.contest_leg_id === legId);
  }

  async getByEntryAndLeg(entryId: string, legId: string): Promise<SurvivorPick | null> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM survivor_picks WHERE entry_id = $1 AND contest_leg_id = $2 LIMIT 1;
    */
    return mockPicks.find(p => p.entry_id === entryId && p.contest_leg_id === legId) || null;
  }

  async getByEntryAndTeam(entryId: string, teamId: string): Promise<SurvivorPick | null> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM survivor_picks WHERE entry_id = $1 AND team_id = $2 LIMIT 1;
    */
    return mockPicks.find(p => p.entry_id === entryId && p.team_id === teamId) || null;
  }

  async createOrUpdate(pick: { id?: string; entry_id: string; contest_leg_id: string; team_id: string; pick_status: 'pending' | 'won' | 'lost' }): Promise<SurvivorPick> {
    /* 
      PostgreSQL Reference:
      INSERT INTO survivor_picks (id, entry_id, contest_leg_id, team_id, pick_status)
      VALUES (COALESCE($1, uuid_generate_v4()), $2, $3, $4, $5)
      ON CONFLICT (entry_id, contest_leg_id) DO UPDATE SET 
        team_id = EXCLUDED.team_id, 
        pick_status = EXCLUDED.pick_status,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    */
    const existingIdx = mockPicks.findIndex(p => p.entry_id === pick.entry_id && p.contest_leg_id === pick.contest_leg_id);
    
    if (existingIdx !== -1) {
      mockPicks[existingIdx] = {
        ...mockPicks[existingIdx],
        team_id: pick.team_id,
        pick_status: pick.pick_status,
        created_at: new Date().toISOString()
      };
      return mockPicks[existingIdx];
    } else {
      const newPick: SurvivorPick = {
        id: pick.id || `pick-${Date.now()}`,
        entry_id: pick.entry_id,
        contest_leg_id: pick.contest_leg_id,
        team_id: pick.team_id,
        pick_status: pick.pick_status,
        created_at: new Date().toISOString()
      };
      mockPicks.push(newPick);
      return newPick;
    }
  }

  async delete(id: string): Promise<boolean> {
    /* 
      PostgreSQL Reference:
      DELETE FROM survivor_picks WHERE id = $1;
    */
    const idx = mockPicks.findIndex(p => p.id === id);
    if (idx === -1) return false;
    mockPicks.splice(idx, 1);
    return true;
  }

  async deleteByEntryId(entryId: string): Promise<boolean> {
    /* 
      PostgreSQL Reference:
      DELETE FROM survivor_picks WHERE entry_id = $1;
    */
    const beforeCount = mockPicks.length;
    mockPicks = mockPicks.filter(p => p.entry_id !== entryId);
    return mockPicks.length < beforeCount;
  }
}

/**
 * 8. SurvivorHistory Repository Implementation
 */
export class MockSurvivorHistoryRepository implements ISurvivorHistoryRepository {
  async getAll(): Promise<SurvivorHistory[]> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM survivor_history ORDER BY created_at ASC;
    */
    return [...mockHistory];
  }

  async getByEntryId(entryId: string): Promise<SurvivorHistory[]> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM survivor_history WHERE entry_id = $1;
    */
    return mockHistory.filter(h => h.entry_id === entryId);
  }

  async save(history: SurvivorHistory): Promise<SurvivorHistory> {
    /* 
      PostgreSQL Reference:
      INSERT INTO survivor_history (id, entry_id, contest_leg_id, team_id, result)
      VALUES (COALESCE($1, uuid_generate_v4()), $2, $3, $4, $5)
      RETURNING *;
    */
    mockHistory.push(history);
    return history;
  }
}

/**
 * 9. WeeklyInput Repository Implementation (Mock)
 */
export class MockWeeklyInputRepository implements IWeeklyInputRepository {
  async getAll(): Promise<WeeklyInput[]> {
    return [...mockWeeklyInputs];
  }

  async getById(id: string): Promise<WeeklyInput | null> {
    return mockWeeklyInputs.find(wi => wi.id === id) || null;
  }

  async getByLegAndTeam(legId: string, teamId: string): Promise<WeeklyInput | null> {
    return mockWeeklyInputs.find(wi => wi.contest_leg_id === legId && wi.team_id === teamId) || null;
  }

  async getByLegId(legId: string): Promise<WeeklyInput[]> {
    return mockWeeklyInputs.filter(wi => wi.contest_leg_id === legId);
  }

  async save(input: WeeklyInput): Promise<WeeklyInput> {
    const idx = mockWeeklyInputs.findIndex(wi => wi.contest_leg_id === input.contest_leg_id && wi.team_id === input.team_id);
    if (idx !== -1) {
      mockWeeklyInputs[idx] = { ...input, updated_at: new Date().toISOString() };
      return mockWeeklyInputs[idx];
    } else {
      const newInput = {
        ...input,
        id: input.id || `wi-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockWeeklyInputs.push(newInput);
      return newInput;
    }
  }

  async delete(id: string): Promise<boolean> {
    const idx = mockWeeklyInputs.findIndex(wi => wi.id === id);
    if (idx === -1) return false;
    mockWeeklyInputs.splice(idx, 1);
    return true;
  }
}

/**
 * 10. TeamFeature Repository Implementation (Mock)
 */
export class MockTeamFeatureRepository implements ITeamFeatureRepository {
  async getAll(): Promise<TeamFeature[]> {
    return [...mockTeamFeatures];
  }

  async getById(id: string): Promise<TeamFeature | null> {
    return mockTeamFeatures.find(tf => tf.id === id) || null;
  }

  async getByLegAndTeam(legId: string, teamId: string): Promise<TeamFeature | null> {
    return mockTeamFeatures.find(tf => tf.contest_leg_id === legId && tf.team_id === teamId) || null;
  }

  async getByLegId(legId: string): Promise<TeamFeature[]> {
    return mockTeamFeatures.filter(tf => tf.contest_leg_id === legId);
  }

  async save(feature: TeamFeature): Promise<TeamFeature> {
    const idx = mockTeamFeatures.findIndex(tf => tf.contest_leg_id === feature.contest_leg_id && tf.team_id === feature.team_id);
    if (idx !== -1) {
      mockTeamFeatures[idx] = { ...feature, updated_at: new Date().toISOString() };
      return mockTeamFeatures[idx];
    } else {
      const newFeature = {
        ...feature,
        id: feature.id || `tf-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockTeamFeatures.push(newFeature);
      return newFeature;
    }
  }

  async delete(id: string): Promise<boolean> {
    const idx = mockTeamFeatures.findIndex(tf => tf.id === id);
    if (idx === -1) return false;
    mockTeamFeatures.splice(idx, 1);
    return true;
  }
}

/**
 * 11. GameFeature Repository Implementation (Mock)
 */
export class MockGameFeatureRepository implements IGameFeatureRepository {
  async getAll(): Promise<GameFeature[]> {
    return [...mockGameFeatures];
  }

  async getById(id: string): Promise<GameFeature | null> {
    return mockGameFeatures.find(gf => gf.id === id) || null;
  }

  async getByLegAndTeams(legId: string, homeTeamId: string, awayTeamId: string): Promise<GameFeature | null> {
    return mockGameFeatures.find(gf => gf.contest_leg_id === legId && gf.home_team_id === homeTeamId && gf.away_team_id === awayTeamId) || null;
  }

  async getByLegId(legId: string): Promise<GameFeature[]> {
    return mockGameFeatures.filter(gf => gf.contest_leg_id === legId);
  }

  async save(feature: GameFeature): Promise<GameFeature> {
    const idx = mockGameFeatures.findIndex(gf => gf.contest_leg_id === feature.contest_leg_id && gf.home_team_id === feature.home_team_id && gf.away_team_id === feature.away_team_id);
    if (idx !== -1) {
      mockGameFeatures[idx] = { ...feature, updated_at: new Date().toISOString() };
      return mockGameFeatures[idx];
    } else {
      const newFeature = {
        ...feature,
        id: feature.id || `gf-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockGameFeatures.push(newFeature);
      return newFeature;
    }
  }

  async delete(id: string): Promise<boolean> {
    const idx = mockGameFeatures.findIndex(gf => gf.id === id);
    if (idx === -1) return false;
    mockGameFeatures.splice(idx, 1);
    return true;
  }
}

/**
 * 12. ImportJob Repository Implementation (Mock)
 */
export class MockImportJobRepository implements IImportJobRepository {
  async getAll(): Promise<ImportJob[]> {
    return [...mockImportJobs];
  }

  async getById(id: string): Promise<ImportJob | null> {
    return mockImportJobs.find(job => job.id === id) || null;
  }

  async create(job: Omit<ImportJob, "id" | "created_at" | "updated_at">): Promise<ImportJob> {
    const newJob: ImportJob = {
      ...job,
      id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockImportJobs.push(newJob);
    return newJob;
  }

  async update(id: string, updates: Partial<ImportJob>): Promise<ImportJob | null> {
    const idx = mockImportJobs.findIndex(job => job.id === id);
    if (idx === -1) return null;
    mockImportJobs[idx] = {
      ...mockImportJobs[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    return mockImportJobs[idx];
  }

  async createFile(file: Omit<ImportJobFile, "id" | "created_at">): Promise<ImportJobFile> {
    const newFile: ImportJobFile = {
      ...file,
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      created_at: new Date().toISOString()
    };
    mockImportJobFiles.push(newFile);
    return newFile;
  }

  async getFilesByJobId(jobId: string): Promise<ImportJobFile[]> {
    return mockImportJobFiles.filter(f => f.import_job_id === jobId);
  }

  async createError(err: Omit<ImportJobError, "id" | "created_at">): Promise<ImportJobError> {
    const newErr: ImportJobError = {
      ...err,
      id: `err-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      created_at: new Date().toISOString()
    };
    mockImportJobErrors.push(newErr);
    return newErr;
  }

  async getErrorsByJobId(jobId: string): Promise<ImportJobError[]> {
    return mockImportJobErrors.filter(e => e.import_job_id === jobId);
  }

  async getAllErrors(): Promise<ImportJobError[]> {
    return [...mockImportJobErrors];
  }
}

/**
 * 13. Inventory Repository Implementation (Mock)
 */
export class MockInventoryRepository implements IInventoryRepository {
  async getByEntryIdAndLeg(entryId: string, legId: string): Promise<EntryInventory | null> {
    return mockInventories.find(inv => inv.entry_id === entryId && inv.contest_leg_id === legId) || null;
  }

  async getAllForEntry(entryId: string): Promise<EntryInventory[]> {
    return mockInventories.filter(inv => inv.entry_id === entryId);
  }

  async save(inventory: EntryInventory): Promise<EntryInventory> {
    const item = { ...inventory };
    if (!item.id) {
      item.id = `inv-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }
    const idx = mockInventories.findIndex(inv => inv.id === item.id);
    if (idx !== -1) {
      mockInventories[idx] = item;
    } else {
      mockInventories.push(item);
    }
    return item;
  }

  async delete(id: string): Promise<boolean> {
    const idx = mockInventories.findIndex(inv => inv.id === id);
    if (idx === -1) return false;
    mockInventories.splice(idx, 1);
    return true;
  }
}

/**
 * 14. Reservation Repository Implementation (Mock)
 */
export class MockReservationRepository implements IReservationRepository {
  async getReservedTeams(entryId: string): Promise<ReservedTeam[]> {
    return mockReservedTeams.filter(rt => rt.entry_id === entryId);
  }

  async getHolidayReservations(entryId: string): Promise<HolidayReservation[]> {
    return mockHolidayReservations.filter(hr => hr.entry_id === entryId);
  }

  async saveReservedTeam(reservedTeam: ReservedTeam): Promise<ReservedTeam> {
    const item = { ...reservedTeam };
    if (!item.id) {
      item.id = `rt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }
    const idx = mockReservedTeams.findIndex(rt => rt.id === item.id);
    if (idx !== -1) {
      mockReservedTeams[idx] = item;
    } else {
      mockReservedTeams.push(item);
    }
    return item;
  }

  async saveHolidayReservation(reservation: HolidayReservation): Promise<HolidayReservation> {
    const item = { ...reservation };
    if (!item.id) {
      item.id = `hr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }
    const idx = mockHolidayReservations.findIndex(hr => hr.id === item.id);
    if (idx !== -1) {
      mockHolidayReservations[idx] = item;
    } else {
      mockHolidayReservations.push(item);
    }
    return item;
  }

  async deleteReservedTeam(id: string): Promise<boolean> {
    const idx = mockReservedTeams.findIndex(rt => rt.id === id);
    if (idx === -1) return false;
    mockReservedTeams.splice(idx, 1);
    return true;
  }

  async deleteHolidayReservation(id: string): Promise<boolean> {
    const idx = mockHolidayReservations.findIndex(hr => hr.id === id);
    if (idx === -1) return false;
    mockHolidayReservations.splice(idx, 1);
    return true;
  }
}

/**
 * 15. Future Value Repository Implementation (Mock)
 */
export class MockFutureValueRepository implements IFutureValueRepository {
  async getAllProfiles(): Promise<FutureValueProfile[]> {
    return [...mockFutureValueProfiles];
  }

  async getProfile(teamId: string, legId: string): Promise<FutureValueProfile | null> {
    return mockFutureValueProfiles.find(f => f.team_id === teamId && f.contest_leg_id === legId) || null;
  }

  async getProfilesByLeg(legId: string): Promise<FutureValueProfile[]> {
    return mockFutureValueProfiles.filter(f => f.contest_leg_id === legId);
  }

  async saveProfile(profile: FutureValueProfile): Promise<FutureValueProfile> {
    const item = { ...profile };
    if (!item.id) {
      item.id = `fv-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }
    const idx = mockFutureValueProfiles.findIndex(f => f.id === item.id);
    if (idx !== -1) {
      mockFutureValueProfiles[idx] = item;
    } else {
      mockFutureValueProfiles.push(item);
    }
    return item;
  }
}

/**
 * 16. Risk Repository Implementation (Mock)
 */
export class MockRiskRepository implements IRiskRepository {
  async getByEntryIdAndLeg(entryId: string, legId: string): Promise<RiskProfile | null> {
    return mockRiskProfiles.find(rp => rp.entry_id === entryId && rp.contest_leg_id === legId) || null;
  }

  async getAllForEntry(entryId: string): Promise<RiskProfile[]> {
    return mockRiskProfiles.filter(rp => rp.entry_id === entryId);
  }

  async save(profile: RiskProfile): Promise<RiskProfile> {
    const item = { ...profile };
    if (!item.id) {
      item.id = `rp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }
    const idx = mockRiskProfiles.findIndex(rp => rp.id === item.id);
    if (idx !== -1) {
      mockRiskProfiles[idx] = item;
    } else {
      mockRiskProfiles.push(item);
    }
    return item;
  }

  async delete(id: string): Promise<boolean> {
    const idx = mockRiskProfiles.findIndex(rp => rp.id === id);
    if (idx === -1) return false;
    mockRiskProfiles.splice(idx, 1);
    return true;
  }
}

/**
 * 17. Risk Assessment Repository Implementation (Mock)
 */
export class MockRiskAssessmentRepository implements IRiskAssessmentRepository {
  async getByGameAndLeg(gameId: string, legId: string): Promise<GameRiskAssessment | null> {
    return mockGameRiskAssessments.find(gra => gra.game_id === gameId && gra.contest_leg_id === legId) || null;
  }

  async getAssessmentByLegAndTeams(legId: string, homeTeamId: string, awayTeamId: string): Promise<GameRiskAssessment | null> {
    return mockGameRiskAssessments.find(gra => 
      gra.contest_leg_id === legId && 
      gra.home_team_risk.team_id === homeTeamId && 
      gra.away_team_risk.team_id === awayTeamId
    ) || null;
  }

  async getByLegId(legId: string): Promise<GameRiskAssessment[]> {
    return mockGameRiskAssessments.filter(gra => gra.contest_leg_id === legId);
  }

  async save(assessment: GameRiskAssessment): Promise<GameRiskAssessment> {
    const item = { ...assessment };
    if (!item.id) {
      item.id = `gra-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }
    const idx = mockGameRiskAssessments.findIndex(gra => gra.id === item.id);
    if (idx !== -1) {
      mockGameRiskAssessments[idx] = item;
    } else {
      mockGameRiskAssessments.push(item);
    }
    return item;
  }

  async delete(id: string): Promise<boolean> {
    const idx = mockGameRiskAssessments.findIndex(gra => gra.id === id);
    if (idx === -1) return false;
    mockGameRiskAssessments.splice(idx, 1);
    return true;
  }
}

/**
 * 18. Recommendation Repository Implementation (Mock)
 */
export class MockRecommendationRepository implements IRecommendationRepository {
  async getByEntryAndLeg(entryId: string, legId: string): Promise<EntryRecommendation | null> {
    return mockEntryRecommendations.find(er => er.entry_id === entryId && er.contest_leg_id === legId) || null;
  }

  async getAllForEntry(entryId: string): Promise<EntryRecommendation[]> {
    return mockEntryRecommendations.filter(er => er.entry_id === entryId);
  }

  async save(recommendation: EntryRecommendation): Promise<EntryRecommendation> {
    const item = { ...recommendation };
    if (!item.id) {
      item.id = `er-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }
    const idx = mockEntryRecommendations.findIndex(er => er.id === item.id);
    if (idx !== -1) {
      mockEntryRecommendations[idx] = item;
    } else {
      mockEntryRecommendations.push(item);
    }
    return item;
  }

  async delete(id: string): Promise<boolean> {
    const idx = mockEntryRecommendations.findIndex(er => er.id === id);
    if (idx === -1) return false;
    mockEntryRecommendations.splice(idx, 1);
    return true;
  }
}

/**
 * 19. Recommendation Snapshot Repository Implementation (Mock)
 */
export class MockRecommendationSnapshotRepository implements IRecommendationSnapshotRepository {
  async getByLegId(legId: string): Promise<PortfolioRecommendation | null> {
    return mockPortfolioRecommendations.find(pr => pr.contest_leg_id === legId) || null;
  }

  async save(portfolio: PortfolioRecommendation): Promise<PortfolioRecommendation> {
    const item = { ...portfolio };
    if (!item.id) {
      item.id = `pr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }
    const idx = mockPortfolioRecommendations.findIndex(pr => pr.id === item.id);
    if (idx !== -1) {
      mockPortfolioRecommendations[idx] = item;
    } else {
      mockPortfolioRecommendations.push(item);
    }
    return item;
  }

  async delete(id: string): Promise<boolean> {
    const idx = mockPortfolioRecommendations.findIndex(pr => pr.id === id);
    if (idx === -1) return false;
    mockPortfolioRecommendations.splice(idx, 1);
    return true;
  }

  async getWeeklyRecSnapshot(legId: string): Promise<RecommendationSnapshot | null> {
    return mockWeeklyRecSnapshots.find(wrs => wrs.contest_leg_id === legId) || null;
  }

  async saveWeeklyRecSnapshot(snapshot: RecommendationSnapshot): Promise<RecommendationSnapshot> {
    const item = { ...snapshot };
    if (!item.id) {
      item.id = `wrs-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }
    const idx = mockWeeklyRecSnapshots.findIndex(wrs => wrs.id === item.id);
    if (idx !== -1) {
      mockWeeklyRecSnapshots[idx] = item;
    } else {
      mockWeeklyRecSnapshots.push(item);
    }
    return item;
  }

  async getAllWeeklyRecSnapshots(): Promise<RecommendationSnapshot[]> {
    return [...mockWeeklyRecSnapshots];
  }
}

/**
 * 20. Snapshot Repository Implementation (Mock)
 */
export class MockSnapshotRepository implements ISnapshotRepository {
  async getWeeklySnapshot(legId: string): Promise<WeeklySnapshot | null> {
    return mockWeeklySnapshots.find(ws => ws.contest_leg_id === legId) || null;
  }

  async saveWeeklySnapshot(snapshot: WeeklySnapshot): Promise<WeeklySnapshot> {
    const item = { ...snapshot };
    if (!item.id) {
      item.id = `ws-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }
    const idx = mockWeeklySnapshots.findIndex(ws => ws.id === item.id);
    if (idx !== -1) {
      mockWeeklySnapshots[idx] = item;
    } else {
      mockWeeklySnapshots.push(item);
    }
    return item;
  }

  async getAllWeeklySnapshots(): Promise<WeeklySnapshot[]> {
    return [...mockWeeklySnapshots];
  }

  async getFeatureSnapshot(legId: string): Promise<FeatureSnapshot | null> {
    return mockFeatureSnapshots.find(fs => fs.contest_leg_id === legId) || null;
  }

  async saveFeatureSnapshot(snapshot: FeatureSnapshot): Promise<FeatureSnapshot> {
    const item = { ...snapshot };
    if (!item.id) {
      item.id = `fs-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }
    const idx = mockFeatureSnapshots.findIndex(fs => fs.id === item.id);
    if (idx !== -1) {
      mockFeatureSnapshots[idx] = item;
    } else {
      mockFeatureSnapshots.push(item);
    }
    return item;
  }

  async getAllFeatureSnapshots(): Promise<FeatureSnapshot[]> {
    return [...mockFeatureSnapshots];
  }

  async getInventorySnapshot(entryId: string, legId: string): Promise<InventorySnapshotRecord | null> {
    return mockInventorySnapshots.find(is => is.entry_id === entryId && is.contest_leg_id === legId) || null;
  }

  async saveInventorySnapshot(snapshot: InventorySnapshotRecord): Promise<InventorySnapshotRecord> {
    const item = { ...snapshot };
    if (!item.id) {
      item.id = `is-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }
    const idx = mockInventorySnapshots.findIndex(is => is.id === item.id);
    if (idx !== -1) {
      mockInventorySnapshots[idx] = item;
    } else {
      mockInventorySnapshots.push(item);
    }
    return item;
  }

  async getAllInventorySnapshotsByLeg(legId: string): Promise<InventorySnapshotRecord[]> {
    return mockInventorySnapshots.filter(is => is.contest_leg_id === legId);
  }

  async getRiskSnapshot(legId: string): Promise<RiskSnapshot | null> {
    return mockRiskSnapshots.find(rs => rs.contest_leg_id === legId) || null;
  }

  async saveRiskSnapshot(snapshot: RiskSnapshot): Promise<RiskSnapshot> {
    const item = { ...snapshot };
    if (!item.id) {
      item.id = `rs-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }
    const idx = mockRiskSnapshots.findIndex(rs => rs.id === item.id);
    if (idx !== -1) {
      mockRiskSnapshots[idx] = item;
    } else {
      mockRiskSnapshots.push(item);
    }
    return item;
  }

  async getAllRiskSnapshots(): Promise<RiskSnapshot[]> {
    return [...mockRiskSnapshots];
  }
}

/**
 * 21. Audit Repository Implementation (Mock)
 */
export class MockAuditRepository implements IAuditRepository {
  async getAuditByLeg(legId: string): Promise<DecisionAuditRecord | null> {
    return mockDecisionAuditRecords.find(dar => dar.contest_leg_id === legId) || null;
  }

  async getAuditsByWeek(weekNumber: number): Promise<DecisionAuditRecord[]> {
    return mockDecisionAuditRecords.filter(dar => dar.week_number === weekNumber);
  }

  async getAllAudits(): Promise<DecisionAuditRecord[]> {
    return [...mockDecisionAuditRecords];
  }

  async save(record: DecisionAuditRecord): Promise<DecisionAuditRecord> {
    const item = { ...record };
    if (!item.id) {
      item.id = `dar-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }
    const idx = mockDecisionAuditRecords.findIndex(dar => dar.id === item.id);
    if (idx !== -1) {
      mockDecisionAuditRecords[idx] = item;
    } else {
      mockDecisionAuditRecords.push(item);
    }
    return item;
  }
}

/**
 * 22. Simulation Repository Implementation (Mock)
 */
export class MockSimulationRepository implements ISimulationRepository {
  async getStrategyMultiplier(strategy: string, metric: string): Promise<number> {
    if (strategy === "safe") {
      if (metric === "win_prob") return 1.2;
      if (metric === "popularity") return 0.5;
    } else if (strategy === "contrarian") {
      if (metric === "win_prob") return 0.8;
      if (metric === "popularity") return 2.0;
    }
    return 1.0;
  }
}

/**
 * 23. Simulation Run Repository Implementation (Mock)
 */
export class MockSimulationRunRepository implements ISimulationRunRepository {
  async getAll(): Promise<SimulationRun[]> {
    return [...mockSimulationRuns];
  }

  async getById(id: string): Promise<SimulationRun | null> {
    return mockSimulationRuns.find(r => r.id === id) || null;
  }

  async getByLegId(legId: string): Promise<SimulationRun[]> {
    return mockSimulationRuns.filter(r => r.contest_leg_id === legId);
  }

  async save(run: SimulationRun): Promise<SimulationRun> {
    const item = { ...run };
    if (!item.id) {
      item.id = `sim-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }
    const idx = mockSimulationRuns.findIndex(r => r.id === item.id);
    if (idx !== -1) {
      mockSimulationRuns[idx] = item;
    } else {
      mockSimulationRuns.push(item);
    }
    return item;
  }

  async delete(id: string): Promise<boolean> {
    const idx = mockSimulationRuns.findIndex(r => r.id === id);
    if (idx === -1) return false;
    mockSimulationRuns.splice(idx, 1);
    return true;
  }
}

/**
 * 24. Simulation Result Repository Implementation (Mock)
 */
export class MockSimulationResultRepository implements ISimulationResultRepository {
  async getProjectionsByRunId(runId: string): Promise<EntrySurvivalProjection[]> {
    const run = mockSimulationRuns.find(r => r.id === runId);
    return run ? run.entry_projections : [];
  }
}

// In-memory array to persist audit logs for security panel
export const mockAuthAuditRecords: AuthAuditRecord[] = [];

export class MockAuthAuditRepository implements IAuthAuditRepository {
  async getAll(): Promise<AuthAuditRecord[]> {
    return [...mockAuthAuditRecords];
  }

  async getRecent(limit: number): Promise<AuthAuditRecord[]> {
    return [...mockAuthAuditRecords]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async create(record: Omit<AuthAuditRecord, "id" | "timestamp">): Promise<AuthAuditRecord> {
    const newRecord: AuthAuditRecord = {
      ...record,
      id: "aud_" + Math.random().toString(36).substring(2, 10),
      timestamp: new Date().toISOString()
    };
    mockAuthAuditRecords.push(newRecord);
    return newRecord;
  }
}

export const mockSystemMetadata: SystemMetadata = {
  systemName: "Semi-Sharp",
  currentVersion: "v0.27",
  currentGitBranch: "main",
  currentGitTag: "v0.27-project-memory-foundation",
  deploymentEnvironment: "production-mock",
  serverHostname: "mock-host.local",
  databaseName: "mock-sandbox",
  lastStartupTimestamp: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const mockApplicationVersions: ApplicationVersion[] = [
  {
    versionId: 1,
    versionTag: "v0.26",
    gitCommitHash: "a7b3c9e1f2d34567890abcdef1234567890abcde",
    releaseDate: "2026-06-21T12:00:00Z",
    releaseNotes: "Established raw system security roles and administrative gatekeeper rules.",
    milestoneName: "Auth cutover",
    createdAt: "2026-06-21T12:00:00Z"
  },
  {
    versionId: 2,
    versionTag: "v0.27",
    gitCommitHash: "8f9e0d1c2b3a4f5e6d7c8b9a0f1e2d3c4b5a6f7e",
    releaseDate: "2026-06-22T15:00:00Z",
    releaseNotes: "Upgraded platform to support persistent project memory, system metadata, and deep audits.",
    milestoneName: "Project Memory Foundation",
    createdAt: "2026-06-22T15:00:00Z"
  }
];

export const mockProjectDecisions: ProjectDecision[] = [
  {
    decisionId: 1,
    decisionDate: "2026-06-20",
    category: "Architectural Pattern",
    title: "Repository Pattern Mandatory",
    rationale: "Requires all tables and models to be decoupled via isolated class repositories.",
    impact: "Guarantees that database models can switch seamlessly between low-overhead mock in-memory states and postgres high-fidelity states.",
    status: "APPROVED",
    createdAt: "2026-06-20T10:00:00Z"
  },
  {
    decisionId: 2,
    decisionDate: "2026-06-21",
    category: "Persistence Strategy",
    title: "PostgreSQL Authoritative Store",
    rationale: "Adopt raw PostgreSQL relational engine for high-fidelity persistence tracking.",
    impact: "Secures and validates transaction logs, contest runs, system health metrics, and user logs with transactional durability.",
    status: "APPROVED",
    createdAt: "2026-06-21T10:00:00Z"
  },
  {
    decisionId: 3,
    decisionDate: "2026-06-21",
    category: "Aesthetic Rule",
    title: "Mock Mode Retained",
    rationale: "Retain full in-memory mock repositories and fallback controls for sandboxed testing.",
    impact: "Provides frictionless local development environment when running without an active PostgreSQL cluster link.",
    status: "APPROVED",
    createdAt: "2026-06-21T11:00:00Z"
  },
  {
    decisionId: 4,
    decisionDate: "2026-06-22",
    category: "Environment Boundary",
    title: "Cloudflare Deployment",
    rationale: "Configure proxy tunnels and gateway firewalls to isolate system parameters.",
    impact: "Protects backoffice dashboards and JSON endpoints behind Cloudflare verification layer.",
    status: "APPROVED",
    createdAt: "2026-06-22T10:00:00Z"
  },
  {
    decisionId: 5,
    decisionDate: "2026-06-22",
    category: "Feature Strategy",
    title: "Historical Replay Architecture",
    rationale: "Model contest historical data with sub-second simulation replay features.",
    impact: "Allows testing modeling strategies across past season records with deep visual metric reviews.",
    status: "APPROVED",
    createdAt: "2026-06-22T11:00:00Z"
  }
];

export const mockOperationsEvents: OperationsEvent[] = [
  {
    eventId: 1,
    eventType: "Application Startup",
    severity: "INFO",
    source: "system-bootstrap",
    description: "Application successfully bootstrapped system services in in-memory Mock Sandbox context.",
    metadataJson: { mode: "MOCK", version: "v0.27" },
    createdAt: new Date().toISOString()
  }
];

export class MockSystemMetadataRepository implements ISystemMetadataRepository {
  private metadata = { ...mockSystemMetadata };

  async getLatest(): Promise<SystemMetadata | null> {
    return this.metadata;
  }

  async save(metadata: SystemMetadata): Promise<SystemMetadata> {
    this.metadata = {
      ...metadata,
      updatedAt: new Date().toISOString()
    };
    return this.metadata;
  }
}

export class MockApplicationVersionsRepository implements IApplicationVersionsRepository {
  async getAll(): Promise<ApplicationVersion[]> {
    return [...mockApplicationVersions];
  }

  async create(version: Omit<ApplicationVersion, "versionId" | "createdAt">): Promise<ApplicationVersion> {
    const newVersion: ApplicationVersion = {
      ...version,
      versionId: mockApplicationVersions.length + 1,
      createdAt: new Date().toISOString()
    };
    mockApplicationVersions.push(newVersion);
    return newVersion;
  }
}

export class MockProjectDecisionsRepository implements IProjectDecisionsRepository {
  async getAll(): Promise<ProjectDecision[]> {
    return [...mockProjectDecisions];
  }

  async create(decision: Omit<ProjectDecision, "decisionId" | "createdAt">): Promise<ProjectDecision> {
    const newDecision: ProjectDecision = {
      ...decision,
      decisionId: mockProjectDecisions.length + 1,
      createdAt: new Date().toISOString()
    };
    mockProjectDecisions.push(newDecision);
    return newDecision;
  }
}

export class MockOperationsEventsRepository implements IOperationsEventsRepository {
  async getAll(): Promise<OperationsEvent[]> {
    return [...mockOperationsEvents];
  }

  async getRecent(limit: number): Promise<OperationsEvent[]> {
    return [...mockOperationsEvents]
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limit);
  }

  async create(event: Omit<OperationsEvent, "eventId" | "createdAt">): Promise<OperationsEvent> {
    const newEvent: OperationsEvent = {
      ...event,
      eventId: mockOperationsEvents.length + 1,
      createdAt: new Date().toISOString()
    };
    mockOperationsEvents.push(newEvent);
    return newEvent;
  }
}

export class MockFeatureDefinitionRepository implements IFeatureDefinitionRepository {
  async getAll(): Promise<FeatureDefinition[]> {
    return [...mockFeatureDefinitions];
  }

  async getByFeatureId(id: string): Promise<FeatureDefinition | null> {
    return mockFeatureDefinitions.find(fd => fd.feature_id === id) || null;
  }

  async save(definition: FeatureDefinition): Promise<FeatureDefinition> {
    const existingIdx = mockFeatureDefinitions.findIndex(fd => fd.feature_id === definition.feature_id);
    const item = { ...definition, created_at: definition.created_at || new Date().toISOString() };
    if (existingIdx >= 0) {
      mockFeatureDefinitions[existingIdx] = item;
    } else {
      mockFeatureDefinitions.push(item);
    }
    return item;
  }
}

export class MockFeatureSnapshotRepository implements IFeatureSnapshotRepository {
  async getAll(): Promise<FeatureStoreSnapshot[]> {
    return [...mockFeatureStoreSnapshots];
  }

  async getBySeasonAndWeek(season: number, week: number): Promise<FeatureStoreSnapshot[]> {
    return mockFeatureStoreSnapshots.filter(fs => fs.season === season && fs.week === week);
  }

  async save(snapshot: FeatureStoreSnapshot): Promise<FeatureStoreSnapshot> {
    const item = { 
      ...snapshot, 
      snapshot_id: snapshot.snapshot_id || mockFeatureStoreSnapshots.length + 1, 
      created_at: snapshot.created_at || new Date().toISOString() 
    };
    mockFeatureStoreSnapshots.push(item);
    return item;
  }

  async saveMany(snapshots: FeatureStoreSnapshot[]): Promise<FeatureStoreSnapshot[]> {
    const saved: FeatureStoreSnapshot[] = [];
    for (const snap of snapshots) {
      saved.push(await this.save(snap));
    }
    return saved;
  }
}

export class MockFeatureBuildRunRepository implements IFeatureBuildRunRepository {
  async getAll(): Promise<FeatureBuildRun[]> {
    return [...mockFeatureBuildRuns];
  }

  async getById(id: number | string): Promise<FeatureBuildRun | null> {
    const numericId = typeof id === "string" ? parseInt(id, 10) : id;
    return mockFeatureBuildRuns.find(fr => fr.run_id === numericId) || null;
  }

  async getLatest(): Promise<FeatureBuildRun | null> {
    if (mockFeatureBuildRuns.length === 0) return null;
    return [...mockFeatureBuildRuns].sort((a, b) => {
      const idxA = typeof a.run_id === "number" ? a.run_id : 0;
      const idxB = typeof b.run_id === "number" ? b.run_id : 0;
      return idxB - idxA;
    })[0];
  }

  async save(run: FeatureBuildRun): Promise<FeatureBuildRun> {
    const runId = run.run_id || mockFeatureBuildRuns.length + 1;
    const existingIdx = mockFeatureBuildRuns.findIndex(fr => fr.run_id === runId);
    const item: FeatureBuildRun = {
      ...run,
      run_id: runId
    };
    if (existingIdx >= 0) {
      mockFeatureBuildRuns[existingIdx] = item;
    } else {
      mockFeatureBuildRuns.push(item);
    }
    return item;
  }
}

export class MockEntryStrategyProfileRepository implements IEntryStrategyProfileRepository {
  async getAll(): Promise<EntryStrategyProfile[]> {
    return [...mockEntryStrategyProfiles];
  }

  async getByEntryId(entryId: string): Promise<EntryStrategyProfile | null> {
    return mockEntryStrategyProfiles.find(p => p.entry_id === entryId) || null;
  }

  async save(profile: EntryStrategyProfile): Promise<EntryStrategyProfile> {
    const existingIdx = mockEntryStrategyProfiles.findIndex(p => p.entry_id === profile.entry_id);
    const item: EntryStrategyProfile = {
      ...profile,
      profile_id: profile.profile_id || mockEntryStrategyProfiles.length + 1,
      created_at: profile.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (existingIdx >= 0) {
      mockEntryStrategyProfiles[existingIdx] = item;
    } else {
      mockEntryStrategyProfiles.push(item);
    }
    return item;
  }

  async deleteByEntryId(entryId: string): Promise<boolean> {
    const originalLen = mockEntryStrategyProfiles.length;
    mockEntryStrategyProfiles = mockEntryStrategyProfiles.filter(p => p.entry_id !== entryId);
    return mockEntryStrategyProfiles.length < originalLen;
  }
}

export class MockEntryMetadataRepository implements IEntryMetadataRepository {
  async getAll(): Promise<EntryMetadata[]> {
    return [...mockEntryMetadataRecords];
  }

  async getByEntryId(entryId: string): Promise<EntryMetadata | null> {
    return mockEntryMetadataRecords.find(m => m.entry_id === entryId) || null;
  }

  async save(metadata: EntryMetadata): Promise<EntryMetadata> {
    const existingIdx = mockEntryMetadataRecords.findIndex(m => m.entry_id === metadata.entry_id);
    const item: EntryMetadata = {
      ...metadata,
      created_at: metadata.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (existingIdx >= 0) {
      mockEntryMetadataRecords[existingIdx] = item;
    } else {
      mockEntryMetadataRecords.push(item);
    }
    return item;
  }

  async deleteByEntryId(entryId: string): Promise<boolean> {
    const originalLen = mockEntryMetadataRecords.length;
    mockEntryMetadataRecords = mockEntryMetadataRecords.filter(m => m.entry_id !== entryId);
    return mockEntryMetadataRecords.length < originalLen;
  }
}

export class MockFutureTeamValueRepository implements IFutureTeamValueRepository {
  async getAll(): Promise<FutureTeamValue[]> {
    return [...mockFutureTeamValues];
  }

  async getBySeasonAndWeek(season: string, week: number): Promise<FutureTeamValue[]> {
    return mockFutureTeamValues.filter(v => v.season === season && v.week === week)
      .sort((a, b) => b.future_value_score - a.future_value_score);
  }

  async getLatest(): Promise<FutureTeamValue[]> {
    if (mockFutureTeamValues.length === 0) return [];
    // Get latest calculation version
    const latestVersion = mockFutureTeamValues[mockFutureTeamValues.length - 1].calculation_version;
    return mockFutureTeamValues.filter(v => v.calculation_version === latestVersion)
      .sort((a, b) => b.future_value_score - a.future_value_score);
  }

  async save(val: FutureTeamValue): Promise<FutureTeamValue> {
    const item: FutureTeamValue = {
      ...val,
      id: val.id || `ftv-${Date.now()}-${Math.random().toString().substring(2,6)}`,
      created_at: val.created_at || new Date().toISOString()
    };
    mockFutureTeamValues.push(item);
    return item;
  }

  async saveMany(vals: FutureTeamValue[]): Promise<FutureTeamValue[]> {
    const results: FutureTeamValue[] = [];
    for (const val of vals) {
      const saved = await this.save(val);
      results.push(saved);
    }
    return results;
  }

  async deleteBySeasonAndWeek(season: string, week: number): Promise<boolean> {
    const originalLen = mockFutureTeamValues.length;
    mockFutureTeamValues = mockFutureTeamValues.filter(v => !(v.season === season && v.week === week));
    return mockFutureTeamValues.length < originalLen;
  }
}

export class MockSurvivorEquityRepository implements ISurvivorEquityRepository {
  async getAll(): Promise<SurvivorEquitySnapshot[]> {
    return [...mockSurvivorEquitySnapshots];
  }

  async getBySeasonAndWeek(season: string, week: number): Promise<SurvivorEquitySnapshot[]> {
    return mockSurvivorEquitySnapshots.filter(v => v.season === season && v.week === week)
      .sort((a, b) => b.equity_score - a.equity_score);
  }

  async getLatest(): Promise<SurvivorEquitySnapshot[]> {
    if (mockSurvivorEquitySnapshots.length === 0) return [];
    const latestVersion = mockSurvivorEquitySnapshots[mockSurvivorEquitySnapshots.length - 1].calculation_version;
    return mockSurvivorEquitySnapshots.filter(v => v.calculation_version === latestVersion)
      .sort((a, b) => b.equity_score - a.equity_score);
  }

  async save(snapshot: SurvivorEquitySnapshot): Promise<SurvivorEquitySnapshot> {
    const item: SurvivorEquitySnapshot = {
      ...snapshot,
      id: snapshot.id || `eq-${Date.now()}-${Math.random().toString().substring(2,6)}`,
      created_at: snapshot.created_at || new Date().toISOString()
    };
    mockSurvivorEquitySnapshots.push(item);
    return item;
  }

  async saveMany(snapshots: SurvivorEquitySnapshot[]): Promise<SurvivorEquitySnapshot[]> {
    const results: SurvivorEquitySnapshot[] = [];
    for (const snapshot of snapshots) {
      const saved = await this.save(snapshot);
      results.push(saved);
    }
    return results;
  }

  async deleteBySeasonAndWeek(season: string, week: number): Promise<boolean> {
    const originalLen = mockSurvivorEquitySnapshots.length;
    mockSurvivorEquitySnapshots = mockSurvivorEquitySnapshots.filter(v => !(v.season === season && v.week === week));
    return mockSurvivorEquitySnapshots.length < originalLen;
  }
}

export class MockRecommendationCandidateRepository implements IRecommendationCandidateRepository {
  async getAll(): Promise<AuditableRecommendationCandidate[]> {
    return [...mockRecommendationCandidates];
  }

  async getBySeasonAndWeek(season: string, week: number): Promise<AuditableRecommendationCandidate[]> {
    return mockRecommendationCandidates.filter(c => c.season === season && c.week === week);
  }

  async getLatest(): Promise<AuditableRecommendationCandidate[]> {
    if (mockRecommendationCandidates.length === 0) return [];
    const latestVersion = mockRecommendationCandidates[mockRecommendationCandidates.length - 1].calculation_version;
    return mockRecommendationCandidates.filter(c => c.calculation_version === latestVersion);
  }

  async getByEntryId(entryId: string): Promise<AuditableRecommendationCandidate[]> {
    return mockRecommendationCandidates.filter(c => c.entry_id === entryId);
  }

  async save(candidate: AuditableRecommendationCandidate): Promise<AuditableRecommendationCandidate> {
    const item: AuditableRecommendationCandidate = {
      ...candidate,
      id: candidate.id || Math.random().toString(36).substr(2, 9),
      created_at: candidate.created_at || new Date().toISOString()
    };
    mockRecommendationCandidates.push(item);
    return item;
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
    const originalLen = mockRecommendationCandidates.length;
    mockRecommendationCandidates = mockRecommendationCandidates.filter(c => !(c.season === season && c.week === week));
    return mockRecommendationCandidates.length < originalLen;
  }
}

export class MockOwnershipProjectionRepository implements IOwnershipProjectionRepository {
  async getAll(): Promise<OwnershipProjection[]> {
    return [...mockOwnershipProjections];
  }

  async getBySeasonAndWeek(season: string, week: number): Promise<OwnershipProjection[]> {
    return mockOwnershipProjections.filter(p => p.season === season && p.week === week);
  }

  async getLatest(): Promise<OwnershipProjection[]> {
    if (mockOwnershipProjections.length === 0) return [];
    const latestVersion = mockOwnershipProjections[mockOwnershipProjections.length - 1].calculation_version;
    return mockOwnershipProjections.filter(p => p.calculation_version === latestVersion);
  }

  async save(projection: OwnershipProjection): Promise<OwnershipProjection> {
    const item: OwnershipProjection = {
      ...projection,
      id: projection.id || Math.random().toString(36).substr(2, 9),
      created_at: projection.created_at || new Date().toISOString()
    };
    mockOwnershipProjections.push(item);
    return item;
  }

  async saveMany(projections: OwnershipProjection[]): Promise<OwnershipProjection[]> {
    const results: OwnershipProjection[] = [];
    for (const p of projections) {
      const saved = await this.save(p);
      results.push(saved);
    }
    return results;
  }

  async deleteBySeasonAndWeek(season: string, week: number): Promise<boolean> {
    const originalLen = mockOwnershipProjections.length;
    mockOwnershipProjections = mockOwnershipProjections.filter(p => !(p.season === season && p.week === week));
    return mockOwnershipProjections.length < originalLen;
  }
}

export class MockContestDynamicsRepository implements IContestDynamicsRepository {
  async getAll(): Promise<ContestDynamicsSnapshot[]> {
    return [...mockContestDynamicsSnapshots];
  }

  async getBySeasonAndWeek(season: string, week: number): Promise<ContestDynamicsSnapshot[]> {
    return mockContestDynamicsSnapshots.filter(s => s.season === season && s.week === week);
  }

  async getLatest(): Promise<ContestDynamicsSnapshot[]> {
    if (mockContestDynamicsSnapshots.length === 0) return [];
    const latestVersion = mockContestDynamicsSnapshots[mockContestDynamicsSnapshots.length - 1].calculation_version;
    return mockContestDynamicsSnapshots.filter(s => s.calculation_version === latestVersion);
  }

  async getByEntryId(entryId: string): Promise<ContestDynamicsSnapshot[]> {
    return mockContestDynamicsSnapshots.filter(s => s.entry_id === entryId);
  }

  async save(snapshot: ContestDynamicsSnapshot): Promise<ContestDynamicsSnapshot> {
    const item: ContestDynamicsSnapshot = {
      ...snapshot,
      id: snapshot.id || Math.random().toString(36).substr(2, 9),
      created_at: snapshot.created_at || new Date().toISOString()
    };
    mockContestDynamicsSnapshots.push(item);
    return item;
  }

  async saveMany(snapshots: ContestDynamicsSnapshot[]): Promise<ContestDynamicsSnapshot[]> {
    const results: ContestDynamicsSnapshot[] = [];
    for (const s of snapshots) {
      const saved = await this.save(s);
      results.push(saved);
    }
    return results;
  }

  async deleteBySeasonAndWeek(season: string, week: number): Promise<boolean> {
    const originalLen = mockContestDynamicsSnapshots.length;
    mockContestDynamicsSnapshots = mockContestDynamicsSnapshots.filter(s => !(s.season === season && s.week === week));
    return mockContestDynamicsSnapshots.length < originalLen;
  }
}

export class MockSurvivorRecommendationRepository implements ISurvivorRecommendationRepository {
  async getAll(): Promise<SurvivorRecommendation[]> {
    return [...mockSurvivorRecommendations];
  }

  async getBySeasonAndWeek(season: string, week: number): Promise<SurvivorRecommendation[]> {
    return mockSurvivorRecommendations.filter(r => r.season === season && r.week === week);
  }

  async getLatest(): Promise<SurvivorRecommendation[]> {
    if (mockSurvivorRecommendations.length === 0) return [];
    const latestVersion = mockSurvivorRecommendations[mockSurvivorRecommendations.length - 1].calculation_version;
    return mockSurvivorRecommendations.filter(r => r.calculation_version === latestVersion);
  }

  async getByEntryId(entryId: string): Promise<SurvivorRecommendation[]> {
    return mockSurvivorRecommendations.filter(r => r.entry_id === entryId);
  }

  async save(rec: SurvivorRecommendation): Promise<SurvivorRecommendation> {
    const item: SurvivorRecommendation = {
      ...rec,
      id: rec.id || Math.random().toString(36).substr(2, 9),
      created_at: rec.created_at || new Date().toISOString()
    };
    mockSurvivorRecommendations.push(item);
    return item;
  }

  async saveMany(recs: SurvivorRecommendation[]): Promise<SurvivorRecommendation[]> {
    const results: SurvivorRecommendation[] = [];
    for (const r of recs) {
      const saved = await this.save(r);
      results.push(saved);
    }
    return results;
  }

  async deleteBySeasonAndWeek(season: string, week: number): Promise<boolean> {
    const originalLen = mockSurvivorRecommendations.length;
    mockSurvivorRecommendations = mockSurvivorRecommendations.filter(r => !(r.season === season && r.week === week));
    return mockSurvivorRecommendations.length < originalLen;
  }
}

export class MockRecommendationAuditRepository implements IRecommendationAuditRepository {
  async getAll(): Promise<RecommendationAudit[]> {
    return [...mockRecommendationAudits];
  }

  async getBySeasonAndWeek(season: string, week: number): Promise<RecommendationAudit[]> {
    return mockRecommendationAudits.filter(a => a.season === season && a.week === week);
  }

  async getLatest(): Promise<RecommendationAudit[]> {
    if (mockRecommendationAudits.length === 0) return [];
    const latestVersion = mockRecommendationAudits[mockRecommendationAudits.length - 1].calculation_version;
    return mockRecommendationAudits.filter(a => a.calculation_version === latestVersion);
  }

  async getByEntryId(entryId: string): Promise<RecommendationAudit[]> {
    return mockRecommendationAudits.filter(a => a.entry_id === entryId);
  }

  async getByTeamId(teamId: string): Promise<RecommendationAudit[]> {
    return mockRecommendationAudits.filter(a => a.team_id === teamId);
  }

  async save(audit: RecommendationAudit): Promise<RecommendationAudit> {
    const item: RecommendationAudit = {
      ...audit,
      id: audit.id || Math.floor(Math.random() * 1000000) + 1,
      created_at: audit.created_at || new Date().toISOString()
    };
    mockRecommendationAudits.push(item);
    return item;
  }

  async saveMany(audits: RecommendationAudit[]): Promise<RecommendationAudit[]> {
    const results: RecommendationAudit[] = [];
    for (const a of audits) {
      const saved = await this.save(a);
      results.push(saved);
    }
    return results;
  }

  async deleteBySeasonAndWeek(season: string, week: number): Promise<boolean> {
    const originalLen = mockRecommendationAudits.length;
    mockRecommendationAudits = mockRecommendationAudits.filter(a => !(a.season === season && a.week === week));
    return mockRecommendationAudits.length < originalLen;
  }
}

export class MockRecommendationConfidenceRepository implements IRecommendationConfidenceRepository {
  async getAll(): Promise<RecommendationConfidenceSnapshot[]> {
    return [...mockRecommendationConfidenceSnapshots];
  }

  async getBySeasonAndWeek(season: string, week: number): Promise<RecommendationConfidenceSnapshot[]> {
    return mockRecommendationConfidenceSnapshots.filter(s => s.season === season && s.week === week);
  }

  async getLatest(): Promise<RecommendationConfidenceSnapshot[]> {
    if (mockRecommendationConfidenceSnapshots.length === 0) return [];
    const latestVersion = mockRecommendationConfidenceSnapshots[mockRecommendationConfidenceSnapshots.length - 1].calculation_version;
    return mockRecommendationConfidenceSnapshots.filter(s => s.calculation_version === latestVersion);
  }

  async getByEntryId(entryId: string): Promise<RecommendationConfidenceSnapshot[]> {
    return mockRecommendationConfidenceSnapshots.filter(s => s.entry_id === entryId);
  }

  async getByTeamId(teamId: string): Promise<RecommendationConfidenceSnapshot[]> {
    const upperTeam = teamId.toUpperCase();
    return mockRecommendationConfidenceSnapshots.filter(s => s.team_id.toUpperCase() === upperTeam);
  }

  async getTopConfidence(limit: number): Promise<RecommendationConfidenceSnapshot[]> {
    return [...mockRecommendationConfidenceSnapshots]
      .sort((a, b) => b.confidence_score - a.confidence_score)
      .slice(0, limit);
  }

  async save(snapshot: RecommendationConfidenceSnapshot): Promise<RecommendationConfidenceSnapshot> {
    const item: RecommendationConfidenceSnapshot = {
      ...snapshot,
      id: snapshot.id || Math.floor(Math.random() * 1000000) + 1,
      created_at: snapshot.created_at || new Date().toISOString()
    };
    mockRecommendationConfidenceSnapshots.push(item);
    return item;
  }

  async saveMany(snapshots: RecommendationConfidenceSnapshot[]): Promise<RecommendationConfidenceSnapshot[]> {
    const results: RecommendationConfidenceSnapshot[] = [];
    for (const s of snapshots) {
      const saved = await this.save(s);
      results.push(saved);
    }
    return results;
  }

  async deleteBySeasonAndWeek(season: string, week: number): Promise<boolean> {
    const originalLen = mockRecommendationConfidenceSnapshots.length;
    mockRecommendationConfidenceSnapshots = mockRecommendationConfidenceSnapshots.filter(s => !(s.season === season && s.week === week));
    return mockRecommendationConfidenceSnapshots.length < originalLen;
  }
}

export class MockRecommendationConsensusRepository implements IRecommendationConsensusRepository {
  async getAll(): Promise<RecommendationConsensus[]> {
    return [...mockRecommendationConsensus];
  }

  async getBySeasonAndWeek(season: string, week: number): Promise<RecommendationConsensus[]> {
    return mockRecommendationConsensus.filter(s => s.season === season && s.week === week);
  }

  async getLatest(): Promise<RecommendationConsensus[]> {
    if (mockRecommendationConsensus.length === 0) return [];
    const latestVersion = mockRecommendationConsensus[mockRecommendationConsensus.length - 1].calculation_version;
    return mockRecommendationConsensus.filter(s => s.calculation_version === latestVersion);
  }

  async getByEntryId(entryId: string): Promise<RecommendationConsensus[]> {
    return mockRecommendationConsensus.filter(s => s.entry_id === entryId);
  }

  async getByTeamId(teamId: string): Promise<RecommendationConsensus[]> {
    const upperTeam = teamId.toUpperCase();
    return mockRecommendationConsensus.filter(s => s.team_id.toUpperCase() === upperTeam);
  }

  async getTopConsensus(limit: number): Promise<RecommendationConsensus[]> {
    return [...mockRecommendationConsensus]
      .sort((a, b) => b.consensus_score - a.consensus_score)
      .slice(0, limit);
  }

  async save(snapshot: RecommendationConsensus): Promise<RecommendationConsensus> {
    const item: RecommendationConsensus = {
      ...snapshot,
      id: snapshot.id || Math.floor(Math.random() * 1000000) + 1,
      created_at: snapshot.created_at || new Date().toISOString()
    };
    mockRecommendationConsensus.push(item);
    return item;
  }

  async saveMany(snapshots: RecommendationConsensus[]): Promise<RecommendationConsensus[]> {
    const results: RecommendationConsensus[] = [];
    for (const s of snapshots) {
      const saved = await this.save(s);
      results.push(saved);
    }
    return results;
  }

  async deleteBySeasonAndWeek(season: string, week: number): Promise<boolean> {
    const originalLen = mockRecommendationConsensus.length;
    mockRecommendationConsensus = mockRecommendationConsensus.filter(s => !(s.season === season && s.week === week));
    return mockRecommendationConsensus.length < originalLen;
  }
}

export class MockRecommendationPortfolioRepository implements IRecommendationPortfolioRepository {
  async savePortfolioRecommendations(snapshots: RecommendationPortfolio[]): Promise<RecommendationPortfolio[]> {
    const results: RecommendationPortfolio[] = [];
    for (const snapshot of snapshots) {
      const item: RecommendationPortfolio = {
        ...snapshot,
        id: snapshot.id || Math.floor(Math.random() * 1000000) + 1,
        created_at: snapshot.created_at || new Date().toISOString()
      };
      mockRecommendationPortfolios.push(item);
      results.push(item);
    }
    return results;
  }

  async getLatestPortfolio(): Promise<RecommendationPortfolio[]> {
    if (mockRecommendationPortfolios.length === 0) return [];
    const latestVersion = mockRecommendationPortfolios[mockRecommendationPortfolios.length - 1].calculation_version;
    return mockRecommendationPortfolios.filter(s => s.calculation_version === latestVersion);
  }

  async getPortfolioById(portfolioId: string): Promise<RecommendationPortfolio[]> {
    return mockRecommendationPortfolios.filter(s => s.portfolio_id === portfolioId);
  }

  async getPortfolioHistory(): Promise<RecommendationPortfolio[]> {
    return [...mockRecommendationPortfolios];
  }

  async deleteWeek(season: string, week: number): Promise<boolean> {
    const originalLen = mockRecommendationPortfolios.length;
    mockRecommendationPortfolios = mockRecommendationPortfolios.filter(s => !(s.season === season && s.week === week));
    return mockRecommendationPortfolios.length < originalLen;
  }
}

export class MockContestEVRepository implements IContestEVRepository {
  async saveContestEV(snapshots: ContestEV[]): Promise<ContestEV[]> {
    const results: ContestEV[] = [];
    for (const snapshot of snapshots) {
      const item: ContestEV = {
        ...snapshot,
        id: snapshot.id || Math.floor(Math.random() * 1000000) + 1,
        created_at: snapshot.created_at || new Date().toISOString()
      };
      mockContestEVs.push(item);
      results.push(item);
    }
    return results;
  }

  async getLatestContestEV(): Promise<ContestEV[]> {
    if (mockContestEVs.length === 0) return [];
    const latestVersion = mockContestEVs[mockContestEVs.length - 1].calculation_version;
    return mockContestEVs.filter(s => s.calculation_version === latestVersion);
  }

  async getContestEV(contestId: string): Promise<ContestEV[]> {
    return mockContestEVs.filter(s => s.contest_id === contestId);
  }

  async getContestHistory(): Promise<ContestEV[]> {
    return [...mockContestEVs];
  }

  async deleteWeek(season: string, week: number): Promise<boolean> {
    const originalLen = mockContestEVs.length;
    mockContestEVs = mockContestEVs.filter(s => !(s.season === season && s.week === week));
    return mockContestEVs.length < originalLen;
  }
}

export class MockOwnershipCalibrationRepository implements IOwnershipCalibrationRepository {
  async saveCalibration(calibrations: OwnershipCalibration[]): Promise<OwnershipCalibration[]> {
    const results: OwnershipCalibration[] = [];
    for (const c of calibrations) {
      const item: OwnershipCalibration = {
        ...c,
        id: c.id || Math.floor(Math.random() * 1000000) + 1,
        created_at: c.created_at || new Date().toISOString()
      };
      mockOwnershipCalibrations.push(item);
      results.push(item);
    }
    return results;
  }

  async getLatestCalibration(): Promise<OwnershipCalibration[]> {
    if (mockOwnershipCalibrations.length === 0) return [];
    const latestVersion = mockOwnershipCalibrations[mockOwnershipCalibrations.length - 1].calculation_version;
    return mockOwnershipCalibrations.filter(s => s.calculation_version === latestVersion);
  }

  async getCalibration(contestId: string): Promise<OwnershipCalibration[]> {
    return mockOwnershipCalibrations.filter(s => s.contest_id === contestId);
  }

  async getCalibrationHistory(): Promise<OwnershipCalibration[]> {
    return [...mockOwnershipCalibrations];
  }

  async deleteWeek(season: string, week: number): Promise<boolean> {
    const originalLen = mockOwnershipCalibrations.length;
    mockOwnershipCalibrations = mockOwnershipCalibrations.filter(s => !(s.season === season && s.week === week));
    return mockOwnershipCalibrations.length < originalLen;
  }
}

export class MockMarketCalibrationRepository implements IMarketCalibrationRepository {
  async saveCalibration(calibrations: MarketCalibration[]): Promise<MarketCalibration[]> {
    const results: MarketCalibration[] = [];
    for (const c of calibrations) {
      const item: MarketCalibration = {
        ...c,
        id: c.id || Math.floor(Math.random() * 1000000) + 1,
        created_at: c.created_at || new Date().toISOString()
      };
      mockMarketCalibrations.push(item);
      results.push(item);
    }
    return results;
  }

  async getLatestCalibration(): Promise<MarketCalibration[]> {
    if (mockMarketCalibrations.length === 0) return [];
    const latestVersion = mockMarketCalibrations[mockMarketCalibrations.length - 1].calculation_version;
    return mockMarketCalibrations.filter(s => s.calculation_version === latestVersion);
  }

  async getCalibrationByGame(gameId: string): Promise<MarketCalibration[]> {
    return mockMarketCalibrations.filter(s => s.game_id === gameId);
  }

  async getCalibrationHistory(): Promise<MarketCalibration[]> {
    return [...mockMarketCalibrations];
  }

  async deleteWeek(season: string, week: number): Promise<boolean> {
    const originalLen = mockMarketCalibrations.length;
    mockMarketCalibrations = mockMarketCalibrations.filter(s => !(s.season === season && s.week === week));
    return mockMarketCalibrations.length < originalLen;
  }
}

export class MockModelPerformanceRepository implements IModelPerformanceRepository {
  async savePerformance(performances: ModelPerformance[]): Promise<ModelPerformance[]> {
    const results: ModelPerformance[] = [];
    for (const p of performances) {
      const item: ModelPerformance = {
        ...p,
        id: p.id || Math.floor(Math.random() * 1000000) + 1,
        created_at: p.created_at || new Date().toISOString()
      };
      mockModelPerformances.push(item);
      results.push(item);
    }
    return results;
  }

  async getLatestPerformance(): Promise<ModelPerformance[]> {
    if (mockModelPerformances.length === 0) return [];
    const latestVersion = mockModelPerformances[mockModelPerformances.length - 1].calculation_version;
    return mockModelPerformances.filter(s => s.calculation_version === latestVersion);
  }

  async getPerformanceByName(modelName: string): Promise<ModelPerformance[]> {
    return mockModelPerformances.filter(s => s.model_name.toLowerCase() === modelName.toLowerCase());
  }

  async getPerformanceHistory(): Promise<ModelPerformance[]> {
    return [...mockModelPerformances];
  }

  async deleteWeek(season: string, week: number): Promise<boolean> {
    const originalLen = mockModelPerformances.length;
    mockModelPerformances = mockModelPerformances.filter(s => !(s.season === season && s.week === week));
    return mockModelPerformances.length < originalLen;
  }

  // --- V053 Methods ---
  async saveHistory(record: ModelPerformanceHistoryRecord): Promise<ModelPerformanceHistoryRecord> {
    const item = {
      ...record,
      id: record.id || mockModelPerformanceHistories.length + 1,
      created_at: record.created_at || new Date().toISOString()
    };
    mockModelPerformanceHistories.push(item);
    return item;
  }

  async getHistory(): Promise<ModelPerformanceHistoryRecord[]> {
    return [...mockModelPerformanceHistories].sort((a, b) => {
      if (a.season !== b.season) return b.season.localeCompare(a.season);
      return b.week - a.week;
    });
  }

  async getHistoryBySeasonAndWeek(season: string, week: number): Promise<ModelPerformanceHistoryRecord[]> {
    return mockModelPerformanceHistories.filter(h => h.season === season && h.week === week);
  }

  async getHistoryByModelHash(modelHash: string): Promise<ModelPerformanceHistoryRecord[]> {
    return mockModelPerformanceHistories.filter(h => h.model_hash === modelHash);
  }

  async saveSummary(record: ModelPerformanceSummaryRecord): Promise<ModelPerformanceSummaryRecord> {
    const item = {
      ...record,
      id: record.id || mockModelPerformanceSummaries.length + 1,
      last_updated: record.last_updated || new Date().toISOString()
    };
    const idx = mockModelPerformanceSummaries.findIndex(s => s.model_hash === item.model_hash);
    if (idx !== -1) {
      mockModelPerformanceSummaries[idx] = item;
    } else {
      mockModelPerformanceSummaries.push(item);
    }
    return item;
  }

  async getSummaryByModelHash(modelHash: string): Promise<ModelPerformanceSummaryRecord | null> {
    return mockModelPerformanceSummaries.find(s => s.model_hash === modelHash) || null;
  }

  async getSummaries(): Promise<ModelPerformanceSummaryRecord[]> {
    return [...mockModelPerformanceSummaries];
  }
}

export class MockLearningRepository implements ILearningRepository {
  async saveLearningHistory(record: WeeklyLearningHistoryRecord): Promise<WeeklyLearningHistoryRecord> {
    const item = {
      ...record,
      id: record.id || mockWeeklyLearningHistories.length + 1,
      created_at: record.created_at || new Date().toISOString()
    };
    const idx = mockWeeklyLearningHistories.findIndex(h => h.season === record.season && h.week === record.week);
    if (idx !== -1) {
      mockWeeklyLearningHistories[idx] = item;
    } else {
      mockWeeklyLearningHistories.push(item);
    }
    return item;
  }

  async getLearningHistory(): Promise<WeeklyLearningHistoryRecord[]> {
    return [...mockWeeklyLearningHistories].sort((a, b) => {
      if (a.season !== b.season) return b.season.localeCompare(a.season);
      return b.week - a.week;
    });
  }

  async getLearningHistoryBySeasonAndWeek(season: string, week: number): Promise<WeeklyLearningHistoryRecord | null> {
    return mockWeeklyLearningHistories.find(h => h.season === season && h.week === week) || null;
  }

  async deleteLearningHistory(season: string, week: number): Promise<boolean> {
    const originalLen = mockWeeklyLearningHistories.length;
    mockWeeklyLearningHistories = mockWeeklyLearningHistories.filter(h => !(h.season === season && h.week === week));
    return mockWeeklyLearningHistories.length < originalLen;
  }

  async saveLearningTrend(record: LearningTrendRecord): Promise<LearningTrendRecord> {
    const item = {
      ...record,
      id: record.id || mockLearningTrends.length + 1,
      updated_at: record.updated_at || new Date().toISOString()
    };
    const idx = mockLearningTrends.findIndex(t => t.metric_name === record.metric_name);
    if (idx !== -1) {
      mockLearningTrends[idx] = item;
    } else {
      mockLearningTrends.push(item);
    }
    return item;
  }

  async getLearningTrends(): Promise<LearningTrendRecord[]> {
    return [...mockLearningTrends].sort((a, b) => a.metric_name.localeCompare(b.metric_name));
  }

  async getLearningTrendByName(metricName: string): Promise<LearningTrendRecord | null> {
    return mockLearningTrends.find(t => t.metric_name === metricName) || null;
  }
}

export class MockRollingValidationRepository implements IRollingValidationRepository {
  async saveValidation(validations: RollingValidation[]): Promise<RollingValidation[]> {
    const results: RollingValidation[] = [];
    for (const v of validations) {
      const item: RollingValidation = {
        ...v,
        id: v.id || Math.floor(Math.random() * 1000000) + 1,
        created_at: v.created_at || new Date().toISOString()
      };
      mockRollingValidations.push(item);
      results.push(item);
    }
    return results;
  }

  async getLatestValidation(): Promise<RollingValidation[]> {
    if (mockRollingValidations.length === 0) return [];
    const latestVersion = mockRollingValidations[mockRollingValidations.length - 1].calculation_version;
    return mockRollingValidations.filter(s => s.calculation_version === latestVersion);
  }

  async getValidationByModel(modelName: string): Promise<RollingValidation[]> {
    return mockRollingValidations.filter(s => s.model_name.toLowerCase() === modelName.toLowerCase());
  }

  async getValidationHistory(): Promise<RollingValidation[]> {
    return [...mockRollingValidations];
  }

  async deleteWeekRange(season: string, startWeek: number, endWeek: number): Promise<boolean> {
    const originalLen = mockRollingValidations.length;
    mockRollingValidations = mockRollingValidations.filter(s => !(s.season === season && s.start_week === startWeek && s.end_week === endWeek));
    return mockRollingValidations.length < originalLen;
  }
}

export class MockModelDriftRepository implements IModelDriftRepository {
  async saveDrift(drifts: ModelDrift[]): Promise<ModelDrift[]> {
    const results: ModelDrift[] = [];
    for (const d of drifts) {
      const item: ModelDrift = {
        ...d,
        id: d.id || Math.floor(Math.random() * 1000000) + 1,
        created_at: d.created_at || new Date().toISOString()
      };
      mockModelDrifts.push(item);
      results.push(item);
    }
    return results;
  }

  async getLatestDrift(): Promise<ModelDrift[]> {
    if (mockModelDrifts.length === 0) return [];
    const latestVersion = mockModelDrifts[mockModelDrifts.length - 1].calculation_version;
    return mockModelDrifts.filter(s => s.calculation_version === latestVersion);
  }

  async getDriftByModel(modelName: string): Promise<ModelDrift[]> {
    return mockModelDrifts.filter(s => s.model_name.toLowerCase() === modelName.toLowerCase());
  }

  async getDriftHistory(): Promise<ModelDrift[]> {
    return [...mockModelDrifts];
  }

  async deleteDriftWeek(season: string, week: number): Promise<boolean> {
    const originalLen = mockModelDrifts.length;
    mockModelDrifts = mockModelDrifts.filter(s => !(s.season === season && s.week === week));
    return mockModelDrifts.length < originalLen;
  }
}

export class MockAdaptiveModelWeightRepository implements IAdaptiveModelWeightRepository {
  async saveWeights(weights: AdaptiveModelWeight[]): Promise<AdaptiveModelWeight[]> {
    const results: AdaptiveModelWeight[] = [];
    for (const w of weights) {
      const item: AdaptiveModelWeight = {
        ...w,
        id: w.id || Math.floor(Math.random() * 1000000) + 1,
        created_at: w.created_at || new Date().toISOString()
      };
      mockAdaptiveModelWeights.push(item);
      results.push(item);
    }
    return results;
  }

  async getLatestWeights(): Promise<AdaptiveModelWeight[]> {
    if (mockAdaptiveModelWeights.length === 0) return [];
    const latestVersion = mockAdaptiveModelWeights[mockAdaptiveModelWeights.length - 1].calculation_version;
    return mockAdaptiveModelWeights.filter(s => s.calculation_version === latestVersion);
  }

  async getWeightsByModel(modelName: string): Promise<AdaptiveModelWeight[]> {
    return mockAdaptiveModelWeights.filter(s => s.model_name.toLowerCase() === modelName.toLowerCase());
  }

  async getWeightsHistory(): Promise<AdaptiveModelWeight[]> {
    return [...mockAdaptiveModelWeights];
  }

  async deleteWeightsWeek(season: string, week: number): Promise<boolean> {
    const originalLen = mockAdaptiveModelWeights.length;
    mockAdaptiveModelWeights = mockAdaptiveModelWeights.filter(s => !(s.season === season && s.week === week));
    return mockAdaptiveModelWeights.length < originalLen;
  }
}

export class MockEnsemblePredictionRepository implements IEnsemblePredictionRepository {
  async savePredictions(predictions: EnsemblePrediction[]): Promise<EnsemblePrediction[]> {
    const results: EnsemblePrediction[] = [];
    for (const p of predictions) {
      const item: EnsemblePrediction = {
        ...p,
        id: p.id || Math.floor(Math.random() * 1000000) + 1,
        created_at: p.created_at || new Date().toISOString()
      };
      mockEnsemblePredictions.push(item);
      results.push(item);
    }
    return results;
  }

  async getLatestPredictions(): Promise<EnsemblePrediction[]> {
    if (mockEnsemblePredictions.length === 0) return [];
    const latestVersion = mockEnsemblePredictions[mockEnsemblePredictions.length - 1].calculation_version;
    return mockEnsemblePredictions.filter(s => s.calculation_version === latestVersion);
  }

  async getPredictionsByGame(gameId: string): Promise<EnsemblePrediction[]> {
    return mockEnsemblePredictions.filter(s => s.game_id.toLowerCase() === gameId.toLowerCase());
  }

  async getPredictionsHistory(): Promise<EnsemblePrediction[]> {
    return [...mockEnsemblePredictions];
  }

  async deletePredictionsWeek(season: string, week: number): Promise<boolean> {
    const originalLen = mockEnsemblePredictions.length;
    mockEnsemblePredictions = mockEnsemblePredictions.filter(s => !(s.season === season && s.week === week));
    return mockEnsemblePredictions.length < originalLen;
  }
}

export class MockDecisionPolicyRepository implements IDecisionPolicyRepository {
  async savePolicies(policies: DecisionPolicy[]): Promise<DecisionPolicy[]> {
    const results: DecisionPolicy[] = [];
    for (const p of policies) {
      const item: DecisionPolicy = {
        ...p,
        id: p.id || Math.floor(Math.random() * 1000000) + 1,
        created_at: p.created_at || new Date().toISOString()
      };
      mockDecisionPolicies.push(item);
      results.push(item);
    }
    return results;
  }

  async getLatestPolicies(): Promise<DecisionPolicy[]> {
    if (mockDecisionPolicies.length === 0) return [];
    const latestVersion = mockDecisionPolicies[mockDecisionPolicies.length - 1].calculation_version;
    return mockDecisionPolicies.filter(s => s.calculation_version === latestVersion);
  }

  async getPoliciesByEntry(entryId: string): Promise<DecisionPolicy[]> {
    return mockDecisionPolicies.filter(s => s.entry_id.toLowerCase() === entryId.toLowerCase());
  }

  async getPoliciesHistory(): Promise<DecisionPolicy[]> {
    return [...mockDecisionPolicies];
  }

  async deletePoliciesWeek(season: string, week: number): Promise<boolean> {
    const originalLen = mockDecisionPolicies.length;
    mockDecisionPolicies = mockDecisionPolicies.filter(s => !(s.season === season && s.week === week));
    return mockDecisionPolicies.length < originalLen;
  }
}

export class MockSurvivorDecisionRepository implements ISurvivorDecisionRepository {
  async saveDecisions(decisions: SurvivorDecision[]): Promise<SurvivorDecision[]> {
    const results: SurvivorDecision[] = [];
    for (const d of decisions) {
      const item: SurvivorDecision = {
        ...d,
        id: d.id || Math.floor(Math.random() * 1000000) + 1,
        created_at: d.created_at || new Date().toISOString()
      };
      mockSurvivorDecisions.push(item);
      results.push(item);
    }
    return results;
  }

  async getLatestDecisions(): Promise<SurvivorDecision[]> {
    if (mockSurvivorDecisions.length === 0) return [];
    const latestVersion = mockSurvivorDecisions[mockSurvivorDecisions.length - 1].agent_version;
    return mockSurvivorDecisions.filter(s => s.agent_version === latestVersion);
  }

  async getDecisionsByEntry(entryId: string): Promise<SurvivorDecision[]> {
    return mockSurvivorDecisions.filter(s => s.entry_id.toLowerCase() === entryId.toLowerCase());
  }

  async getDecisionsHistory(): Promise<SurvivorDecision[]> {
    return [...mockSurvivorDecisions];
  }

  async deleteDecisionsWeek(season: string, week: number): Promise<boolean> {
    const originalLen = mockSurvivorDecisions.length;
    mockSurvivorDecisions = mockSurvivorDecisions.filter(s => !(s.season === season && s.week === week));
    return mockSurvivorDecisions.length < originalLen;
  }
}

export class MockSurvivorPlanningRepository implements ISurvivorPlanningRepository {
  async savePlans(plans: SurvivorPlan[]): Promise<SurvivorPlan[]> {
    const results: SurvivorPlan[] = [];
    for (const p of plans) {
      const item: SurvivorPlan = {
        ...p,
        id: p.id || Math.floor(Math.random() * 1000000) + 1,
        created_at: p.created_at || new Date().toISOString()
      };
      mockSurvivorPlans.push(item);
      results.push(item);
    }
    return results;
  }

  async getLatestPlans(): Promise<SurvivorPlan[]> {
    if (mockSurvivorPlans.length === 0) return [];
    const latestVersion = mockSurvivorPlans[mockSurvivorPlans.length - 1].agent_version;
    return mockSurvivorPlans.filter(s => s.agent_version === latestVersion);
  }

  async getPlansByEntry(entryId: string): Promise<SurvivorPlan[]> {
    return mockSurvivorPlans.filter(s => s.entry_id.toLowerCase() === entryId.toLowerCase());
  }

  async getPlansHistory(): Promise<SurvivorPlan[]> {
    return [...mockSurvivorPlans];
  }

  async deletePlansWeek(season: string, week: number): Promise<boolean> {
    const originalLen = mockSurvivorPlans.length;
    mockSurvivorPlans = mockSurvivorPlans.filter(s => !(s.season === season && s.week === week));
    return mockSurvivorPlans.length < originalLen;
  }
}

export class MockChampionshipPlanningRepository implements IChampionshipPlanningRepository {
  async savePlans(plans: ChampionshipPlan[]): Promise<ChampionshipPlan[]> {
    const results: ChampionshipPlan[] = [];
    for (const p of plans) {
      const item: ChampionshipPlan = {
        ...p,
        id: p.id || Math.floor(Math.random() * 1000000) + 1,
        created_at: p.created_at || new Date().toISOString()
      };
      mockChampionshipPlans.push(item);
      results.push(item);
    }
    return results;
  }

  async getLatestPlans(): Promise<ChampionshipPlan[]> {
    if (mockChampionshipPlans.length === 0) return [];
    const latestVersion = mockChampionshipPlans[mockChampionshipPlans.length - 1].planner_version;
    return mockChampionshipPlans.filter(s => s.planner_version === latestVersion);
  }

  async getPlansByEntry(entryId: string): Promise<ChampionshipPlan[]> {
    return mockChampionshipPlans.filter(s => s.entry_id.toLowerCase() === entryId.toLowerCase());
  }

  async getPlansHistory(): Promise<ChampionshipPlan[]> {
    return [...mockChampionshipPlans];
  }

  async deletePlansSeason(season: string): Promise<boolean> {
    const originalLen = mockChampionshipPlans.length;
    mockChampionshipPlans = mockChampionshipPlans.filter(s => s.season !== season);
    return mockChampionshipPlans.length < originalLen;
  }
}

export class MockDecisionAnalyticsRepository implements IDecisionAnalyticsRepository {
  async saveDecision(record: DecisionAnalyticsRecord): Promise<DecisionAnalyticsRecord> {
    const item = { ...record };
    if (!item.id) {
      item.id = mockDecisionAnalytics.length + 1;
    }
    const idx = mockDecisionAnalytics.findIndex(d => d.id === item.id);
    if (idx !== -1) {
      mockDecisionAnalytics[idx] = item;
    } else {
      mockDecisionAnalytics.push(item);
    }
    return item;
  }

  async saveDecisionMany(records: DecisionAnalyticsRecord[]): Promise<DecisionAnalyticsRecord[]> {
    const saved: DecisionAnalyticsRecord[] = [];
    for (const r of records) {
      const s = await this.saveDecision(r);
      saved.push(s);
    }
    return saved;
  }

  async getDecisionHistory(): Promise<DecisionAnalyticsRecord[]> {
    return [...mockDecisionAnalytics].sort((a, b) => {
      if (a.season !== b.season) return b.season.localeCompare(a.season);
      if (a.week !== b.week) return b.week - a.week;
      return (b.id || 0) - (a.id || 0);
    });
  }

  async getDecisionsBySeasonAndWeek(season: string, week: number): Promise<DecisionAnalyticsRecord[]> {
    return mockDecisionAnalytics.filter(d => d.season === season && d.week === week);
  }

  async saveOutcome(outcome: DecisionOutcomeRecord): Promise<DecisionOutcomeRecord> {
    const item = { ...outcome };
    if (!item.id) {
      item.id = mockDecisionOutcomes.length + 1;
    }
    const idx = mockDecisionOutcomes.findIndex(o => o.decision_id === item.decision_id);
    if (idx !== -1) {
      mockDecisionOutcomes[idx] = item;
    } else {
      mockDecisionOutcomes.push(item);
    }
    return item;
  }

  async getOutcomeByDecisionId(decisionId: number): Promise<DecisionOutcomeRecord | null> {
    return mockDecisionOutcomes.find(o => o.decision_id === decisionId) || null;
  }

  async getOutcomes(): Promise<DecisionOutcomeRecord[]> {
    return [...mockDecisionOutcomes];
  }

  async saveWeeklySummary(summary: WeeklyDecisionSummary): Promise<WeeklyDecisionSummary> {
    const item = { ...summary };
    const idx = mockWeeklyDecisionSummaries.findIndex(s => s.season === item.season && s.week === item.week);
    if (idx !== -1) {
      mockWeeklyDecisionSummaries[idx] = item;
    } else {
      mockWeeklyDecisionSummaries.push(item);
    }
    return item;
  }

  async getLatestWeeklySummaries(): Promise<WeeklyDecisionSummary[]> {
    return [...mockWeeklyDecisionSummaries].sort((a, b) => {
      if (a.season !== b.season) return b.season.localeCompare(a.season);
      return b.week - a.week;
    });
  }

  async getWeeklySummary(season: string, week: number): Promise<WeeklyDecisionSummary | null> {
    return mockWeeklyDecisionSummaries.find(s => s.season === season && s.week === week) || null;
  }
}

export class MockModelWeightRepository implements IModelWeightRepository {
  async getActiveWeights(): Promise<ModelWeight[]> {
    return [...mockModelWeights];
  }

  async getWeightByModel(modelName: string, predictionType: string): Promise<ModelWeight | null> {
    return mockModelWeights.find(w => w.model_name === modelName && w.prediction_type === predictionType) || null;
  }

  async saveWeight(weight: ModelWeight): Promise<ModelWeight> {
    const item = { ...weight };
    if (!item.id) {
      item.id = mockModelWeights.length + 1;
    }
    const idx = mockModelWeights.findIndex(w => w.model_name === item.model_name && w.prediction_type === item.prediction_type);
    if (idx !== -1) {
      mockModelWeights[idx] = {
        ...mockModelWeights[idx],
        ...item,
        last_updated: new Date().toISOString()
      };
      return mockModelWeights[idx];
    } else {
      item.created_at = item.created_at || new Date().toISOString();
      item.last_updated = item.last_updated || new Date().toISOString();
      mockModelWeights.push(item);
      return item;
    }
  }

  async saveWeightMany(weights: ModelWeight[]): Promise<ModelWeight[]> {
    const results: ModelWeight[] = [];
    for (const w of weights) {
      const saved = await this.saveWeight(w);
      results.push(saved);
    }
    return results;
  }

  async getWeightHistory(season?: string, week?: number): Promise<ModelWeightHistory[]> {
    let list = [...mockModelWeightHistory];
    if (season) {
      list = list.filter(h => h.season === season);
    }
    if (week !== undefined) {
      list = list.filter(h => h.week === week);
    }
    return list.sort((a, b) => b.week - a.week);
  }

  async saveHistory(history: ModelWeightHistory): Promise<ModelWeightHistory> {
    const item = {
      ...history,
      id: history.id || mockModelWeightHistory.length + 1,
      created_at: history.created_at || new Date().toISOString()
    };
    mockModelWeightHistory.push(item);
    return item;
  }

  async saveHistoryMany(historyRecords: ModelWeightHistory[]): Promise<ModelWeightHistory[]> {
    const results: ModelWeightHistory[] = [];
    for (const r of historyRecords) {
      const saved = await this.saveHistory(r);
      results.push(saved);
    }
    return results;
  }
}

export class MockRecommendationEvolutionRepository implements IRecommendationEvolutionRepository {
  async saveEvolution(evolution: RecommendationEvolution): Promise<RecommendationEvolution> {
    const item = {
      ...evolution,
      id: evolution.id || mockRecommendationEvolutions.length + 1,
      created_at: evolution.created_at || new Date().toISOString()
    };
    mockRecommendationEvolutions.push(item);
    return item;
  }

  async saveEvolutionMany(evolutions: RecommendationEvolution[]): Promise<RecommendationEvolution[]> {
    const results: RecommendationEvolution[] = [];
    for (const e of evolutions) {
      const saved = await this.saveEvolution(e);
      results.push(saved);
    }
    return results;
  }

  async getEvolutionHistory(season?: string, week?: number): Promise<RecommendationEvolution[]> {
    let list = [...mockRecommendationEvolutions];
    if (season) {
      list = list.filter(e => e.season === season);
    }
    if (week !== undefined) {
      list = list.filter(e => e.week === week);
    }
    return list.sort((a, b) => {
      if (a.season !== b.season) return b.season.localeCompare(a.season);
      if (a.week !== b.week) return b.week - a.week;
      return (b.id || 0) - (a.id || 0);
    });
  }

  async getEvolutionById(id: number): Promise<RecommendationEvolution | null> {
    return mockRecommendationEvolutions.find(e => e.id === id) || null;
  }

  async getEvolutionByRecommendationId(recommendationId: number): Promise<RecommendationEvolution[]> {
    return mockRecommendationEvolutions
      .filter(e => e.recommendation_id === recommendationId)
      .sort((a, b) => (a.id || 0) - (b.id || 0));
  }

  async saveChangeEvent(event: RecommendationChangeEvent): Promise<RecommendationChangeEvent> {
    const item = {
      ...event,
      id: event.id || mockRecommendationChangeEvents.length + 1,
      created_at: event.created_at || new Date().toISOString()
    };
    mockRecommendationChangeEvents.push(item);
    return item;
  }

  async saveChangeEventMany(events: RecommendationChangeEvent[]): Promise<RecommendationChangeEvent[]> {
    const results: RecommendationChangeEvent[] = [];
    for (const e of events) {
      const saved = await this.saveChangeEvent(e);
      results.push(saved);
    }
    return results;
  }

  async getChangeEvents(recommendationId?: number): Promise<RecommendationChangeEvent[]> {
    let list = [...mockRecommendationChangeEvents];
    if (recommendationId !== undefined) {
      list = list.filter(e => e.recommendation_id === recommendationId);
    }
    return list.sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime || (b.id || 0) - (a.id || 0);
    });
  }

  async saveSummary(summary: RecommendationEvolutionSummary): Promise<RecommendationEvolutionSummary> {
    const item = {
      ...summary,
      id: summary.id || mockRecommendationEvolutionSummaries.length + 1,
      created_at: summary.created_at || new Date().toISOString()
    };
    mockRecommendationEvolutionSummaries.push(item);
    return item;
  }

  async getSummaries(season?: string, week?: number): Promise<RecommendationEvolutionSummary[]> {
    let list = [...mockRecommendationEvolutionSummaries];
    if (season) {
      list = list.filter(s => s.season === season);
    }
    if (week !== undefined) {
      list = list.filter(s => s.week === week);
    }
    return list.sort((a, b) => {
      if (a.season !== b.season) return b.season.localeCompare(a.season);
      return b.week - a.week;
    });
  }
}

export class MockSurvivorStrategyRoadmapRepository implements ISurvivorStrategyRoadmapRepository {
  async saveStrategy(strategy: SurvivorEntryStrategy): Promise<SurvivorEntryStrategy> {
    const existingIdx = mockSurvivorEntryStrategies.findIndex(s => s.entry_id === strategy.entry_id);
    const item = {
      ...strategy,
      id: strategy.id || mockSurvivorEntryStrategies.length + 1,
      created_at: strategy.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (existingIdx >= 0) {
      mockSurvivorEntryStrategies[existingIdx] = item;
    } else {
      mockSurvivorEntryStrategies.push(item);
    }
    return item;
  }

  async getStrategyByEntryId(entryId: string): Promise<SurvivorEntryStrategy | null> {
    return mockSurvivorEntryStrategies.find(s => s.entry_id === entryId && s.is_active !== false) || null;
  }

  async getAllStrategies(): Promise<SurvivorEntryStrategy[]> {
    return mockSurvivorEntryStrategies.filter(s => s.is_active !== false);
  }

  // Holiday Reservations
  async saveHolidayReservation(reservation: SurvivorHolidayReservation): Promise<SurvivorHolidayReservation> {
    const existingIdx = mockSurvivorHolidayReservations.findIndex(
      r => r.entry_id === reservation.entry_id && r.season === reservation.season && r.holiday_type === reservation.holiday_type
    );
    const item = {
      ...reservation,
      id: reservation.id || mockSurvivorHolidayReservations.length + 1,
      created_at: reservation.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (existingIdx >= 0) {
      mockSurvivorHolidayReservations[existingIdx] = item;
    } else {
      mockSurvivorHolidayReservations.push(item);
    }
    return item;
  }

  async saveHolidayReservationMany(reservations: SurvivorHolidayReservation[]): Promise<SurvivorHolidayReservation[]> {
    const results: SurvivorHolidayReservation[] = [];
    for (const r of reservations) {
      const saved = await this.saveHolidayReservation(r);
      results.push(saved);
    }
    return results;
  }

  async getHolidayReservationsByEntryId(entryId: string, season?: string): Promise<SurvivorHolidayReservation[]> {
    let list = mockSurvivorHolidayReservations.filter(r => r.entry_id === entryId);
    if (season) {
      list = list.filter(r => r.season === season);
    }
    return list;
  }

  async getAllHolidayReservations(season?: string): Promise<SurvivorHolidayReservation[]> {
    let list = [...mockSurvivorHolidayReservations];
    if (season) {
      list = list.filter(r => r.season === season);
    }
    return list;
  }

  // Roadmaps
  async saveRoadmap(roadmap: SurvivorEntryRoadmap): Promise<SurvivorEntryRoadmap> {
    const item = {
      ...roadmap,
      id: roadmap.id || mockSurvivorEntryRoadmaps.length + 1,
      created_at: roadmap.created_at || new Date().toISOString()
    };
    mockSurvivorEntryRoadmaps.push(item);
    return item;
  }

  async getRoadmapByEntryId(entryId: string, season: string): Promise<SurvivorEntryRoadmap | null> {
    const list = mockSurvivorEntryRoadmaps.filter(r => r.entry_id === entryId && r.season === season);
    if (list.length === 0) return null;
    return list[list.length - 1];
  }

  async getRoadmapHistory(entryId: string, season: string): Promise<SurvivorEntryRoadmap[]> {
    return mockSurvivorEntryRoadmaps
      .filter(r => r.entry_id === entryId && r.season === season)
      .reverse();
  }

  async getAllActiveRoadmaps(season: string): Promise<SurvivorEntryRoadmap[]> {
    const map = new Map<string, SurvivorEntryRoadmap>();
    for (const r of mockSurvivorEntryRoadmaps) {
      if (r.season === season) {
        map.set(r.entry_id, r);
      }
    }
    return Array.from(map.values());
  }

  // Roadmap Weeks
  async saveRoadmapWeeks(weeks: SurvivorEntryRoadmapWeek[]): Promise<SurvivorEntryRoadmapWeek[]> {
    const results: SurvivorEntryRoadmapWeek[] = [];
    for (const w of weeks) {
      const item = {
        ...w,
        id: w.id || mockSurvivorEntryRoadmapWeeks.length + 1,
        created_at: w.created_at || new Date().toISOString()
      };
      mockSurvivorEntryRoadmapWeeks.push(item);
      results.push(item);
    }
    return results;
  }

  async getRoadmapWeeks(roadmapId: number): Promise<SurvivorEntryRoadmapWeek[]> {
    return mockSurvivorEntryRoadmapWeeks.filter(w => w.roadmap_id === roadmapId).sort((a, b) => a.week - b.week);
  }
}

export class MockOwnerRepository implements IOwnerRepository {
  async getAll(): Promise<Owner[]> {
    return [...mockOwners];
  }

  async getById(id: string): Promise<Owner | null> {
    return mockOwners.find(o => o.id === id) || null;
  }

  async save(owner: Owner): Promise<Owner> {
    const idx = mockOwners.findIndex(o => o.id === owner.id);
    if (idx !== -1) {
      mockOwners[idx] = {
        ...mockOwners[idx],
        ...owner,
        updated_at: new Date().toISOString()
      };
      return mockOwners[idx];
    } else {
      const newOwner = {
        ...owner,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockOwners.push(newOwner);
      return newOwner;
    }
  }

  async delete(id: string): Promise<boolean> {
    const idx = mockOwners.findIndex(o => o.id === id);
    if (idx === -1) return false;
    mockOwners.splice(idx, 1);
    return true;
  }
}

export class MockUserAccessRepository implements IUserAccessRepository {
  async getAll(): Promise<AppUser[]> {
    return [...mockAppUsers];
  }

  async getById(id: string): Promise<AppUser | null> {
    return mockAppUsers.find(u => u.id === id) || null;
  }

  async getByUsername(username: string): Promise<AppUser | null> {
    return mockAppUsers.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
  }

  async save(user: AppUser): Promise<AppUser> {
    const idx = mockAppUsers.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      mockAppUsers[idx] = {
        ...mockAppUsers[idx],
        ...user,
        updated_at: new Date().toISOString()
      };
      return mockAppUsers[idx];
    } else {
      const newUser = {
        ...user,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockAppUsers.push(newUser);
      return newUser;
    }
  }

  async delete(id: string): Promise<boolean> {
    const idx = mockAppUsers.findIndex(u => u.id === id);
    if (idx === -1) return false;
    mockAppUsers.splice(idx, 1);
    return true;
  }
}

export class MockContestTypeRepository implements IContestTypeRepository {
  async getAllActive(): Promise<ContestTypeRecord[]> {
    return mockContestTypes.filter(ct => ct.is_active);
  }

  async getById(id: string): Promise<ContestTypeRecord | null> {
    return mockContestTypes.find(ct => ct.id === id) || null;
  }

  async getByCode(code: string): Promise<ContestTypeRecord | null> {
    return mockContestTypes.find(ct => ct.code.toLowerCase() === code.toLowerCase()) || null;
  }
}

export class MockTeamAliasRepository implements ITeamAliasRepository {
  async findByNormalizedAlias(normalizedAlias: string, providerName?: string): Promise<TeamAlias | null> {
    const activeAliases = mockTeamAliases.filter(a => a.normalized_alias === normalizedAlias && a.active);
    
    if (providerName) {
      const providerSpecific = activeAliases.find(a => a.provider_name === providerName);
      if (providerSpecific) return providerSpecific;
    }
    
    const globalAlias = activeAliases.find(a => !a.provider_name);
    return globalAlias || null;
  }

  async findByTeamId(teamId: string): Promise<TeamAlias[]> {
    return mockTeamAliases.filter(a => a.team_id === teamId);
  }

  async listAll(): Promise<TeamAlias[]> {
    return [...mockTeamAliases];
  }

  async createAlias(alias: Omit<TeamAlias, "id" | "created_at" | "updated_at">): Promise<TeamAlias> {
    const newAlias: TeamAlias = {
      id: `alias-gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      team_id: alias.team_id,
      alias: alias.alias,
      normalized_alias: alias.normalized_alias,
      provider_name: alias.provider_name || null,
      alias_type: alias.alias_type,
      active: alias.active !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const exists = mockTeamAliases.some(a => a.normalized_alias === newAlias.normalized_alias && a.provider_name === newAlias.provider_name);
    if (exists) {
      throw new Error(`Duplicate alias constraint violation: normalized_alias=${newAlias.normalized_alias}`);
    }
    
    mockTeamAliases.push(newAlias);
    return newAlias;
  }

  async deactivateAlias(id: string): Promise<boolean> {
    const idx = mockTeamAliases.findIndex(a => a.id === id);
    if (idx === -1) return false;
    mockTeamAliases[idx].active = false;
    mockTeamAliases[idx].updated_at = new Date().toISOString();
    return true;
  }
}



















