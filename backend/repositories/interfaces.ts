import { 
  Team, 
  Contest, 
  ContestLeg, 
  Game, 
  TeamWeekLine, 
  SurvivorEntry, 
  SurvivorPick, 
  SurvivorHistory,
  WeeklyInput,
  TeamFeature,
  GameFeature,
  ImportJob,
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
  EnsemblePrediction
} from "../../src/types";
import { AuthAuditRecord, SystemMetadata, ApplicationVersion, ProjectDecision, OperationsEvent } from "../../src/types/admin";

export interface ITeamRepository {
  getAll(): Promise<Team[]>;
  getById(id: string): Promise<Team | null>;
  save(team: Team): Promise<Team>;
}

export interface IContestRepository {
  getAll(): Promise<Contest[]>;
  getById(id: string): Promise<Contest | null>;
  save(contest: Contest): Promise<Contest>;
}

export interface IContestLegRepository {
  getAll(): Promise<ContestLeg[]>;
  getById(id: string): Promise<ContestLeg | null>;
  getByContestId(contestId: string): Promise<ContestLeg[]>;
  save(leg: ContestLeg): Promise<ContestLeg>;
}

export interface IGameRepository {
  getAll(): Promise<Game[]>;
  getById(id: string): Promise<Game | null>;
  getByLegId(legId: string): Promise<Game[]>;
  save(game: Game): Promise<Game>;
}

export interface ITeamWeekLineRepository {
  getAll(): Promise<TeamWeekLine[]>;
  getByLegId(legId: string): Promise<TeamWeekLine[]>;
  getByTeamAndLeg(teamId: string, legId: string): Promise<TeamWeekLine | null>;
  save(line: TeamWeekLine): Promise<TeamWeekLine>;
}

export interface ISurvivorEntryRepository {
  getAll(): Promise<SurvivorEntry[]>;
  getById(id: string): Promise<SurvivorEntry | null>;
  create(entry: { contest_id?: string; name: string; notes?: string }): Promise<SurvivorEntry>;
  update(id: string, updates: Partial<SurvivorEntry>): Promise<SurvivorEntry | null>;
  delete(id: string): Promise<boolean>;
}

export interface ISurvivorPickRepository {
  getAll(): Promise<SurvivorPick[]>;
  getById(id: string): Promise<SurvivorPick | null>;
  getByEntryId(entryId: string): Promise<SurvivorPick[]>;
  getByLegId(legId: string): Promise<SurvivorPick[]>;
  getByEntryAndLeg(entryId: string, legId: string): Promise<SurvivorPick | null>;
  getByEntryAndTeam(entryId: string, teamId: string): Promise<SurvivorPick | null>;
  createOrUpdate(pick: { id?: string; entry_id: string; contest_leg_id: string; team_id: string; pick_status: 'pending' | 'won' | 'lost' }): Promise<SurvivorPick>;
  delete(id: string): Promise<boolean>;
  deleteByEntryId(entryId: string): Promise<boolean>;
}

export interface ISurvivorHistoryRepository {
  getAll(): Promise<SurvivorHistory[]>;
  getByEntryId(entryId: string): Promise<SurvivorHistory[]>;
  save(history: SurvivorHistory): Promise<SurvivorHistory>;
}

export interface IWeeklyInputRepository {
  getAll(): Promise<WeeklyInput[]>;
  getById(id: string): Promise<WeeklyInput | null>;
  getByLegAndTeam(legId: string, teamId: string): Promise<WeeklyInput | null>;
  getByLegId(legId: string): Promise<WeeklyInput[]>;
  save(input: WeeklyInput): Promise<WeeklyInput>;
  delete(id: string): Promise<boolean>;
}

export interface ITeamFeatureRepository {
  getAll(): Promise<TeamFeature[]>;
  getById(id: string): Promise<TeamFeature | null>;
  getByLegAndTeam(legId: string, teamId: string): Promise<TeamFeature | null>;
  getByLegId(legId: string): Promise<TeamFeature[]>;
  save(feature: TeamFeature): Promise<TeamFeature>;
  delete(id: string): Promise<boolean>;
}

export interface IGameFeatureRepository {
  getAll(): Promise<GameFeature[]>;
  getById(id: string): Promise<GameFeature | null>;
  getByLegAndTeams(legId: string, homeTeamId: string, awayTeamId: string): Promise<GameFeature | null>;
  getByLegId(legId: string): Promise<GameFeature[]>;
  save(feature: GameFeature): Promise<GameFeature>;
  delete(id: string): Promise<boolean>;
}

export interface IImportJobRepository {
  getAll(): Promise<ImportJob[]>;
  getById(id: string): Promise<ImportJob | null>;
  create(job: Omit<ImportJob, "id" | "created_at" | "updated_at">): Promise<ImportJob>;
  update(id: string, updates: Partial<ImportJob>): Promise<ImportJob | null>;
}

export interface IInventoryRepository {
  getByEntryIdAndLeg(entryId: string, legId: string): Promise<EntryInventory | null>;
  getAllForEntry(entryId: string): Promise<EntryInventory[]>;
  save(inventory: EntryInventory): Promise<EntryInventory>;
  delete(id: string): Promise<boolean>;
}

export interface IReservationRepository {
  getReservedTeams(entryId: string): Promise<ReservedTeam[]>;
  getHolidayReservations(entryId: string): Promise<HolidayReservation[]>;
  saveReservedTeam(reservedTeam: ReservedTeam): Promise<ReservedTeam>;
  saveHolidayReservation(reservation: HolidayReservation): Promise<HolidayReservation>;
  deleteReservedTeam(id: string): Promise<boolean>;
  deleteHolidayReservation(id: string): Promise<boolean>;
}

export interface IFutureValueRepository {
  getAllProfiles(): Promise<FutureValueProfile[]>;
  getProfile(teamId: string, legId: string): Promise<FutureValueProfile | null>;
  getProfilesByLeg(legId: string): Promise<FutureValueProfile[]>;
  saveProfile(profile: FutureValueProfile): Promise<FutureValueProfile>;
}

export interface IRiskRepository {
  getByEntryIdAndLeg(entryId: string, legId: string): Promise<RiskProfile | null>;
  getAllForEntry(entryId: string): Promise<RiskProfile[]>;
  save(profile: RiskProfile): Promise<RiskProfile>;
  delete(id: string): Promise<boolean>;
}

export interface IRiskAssessmentRepository {
  getByGameAndLeg(gameId: string, legId: string): Promise<GameRiskAssessment | null>;
  getAssessmentByLegAndTeams(legId: string, homeTeamId: string, awayTeamId: string): Promise<GameRiskAssessment | null>;
  getByLegId(legId: string): Promise<GameRiskAssessment[]>;
  save(assessment: GameRiskAssessment): Promise<GameRiskAssessment>;
  delete(id: string): Promise<boolean>;
}

export interface IRecommendationRepository {
  getByEntryAndLeg(entryId: string, legId: string): Promise<EntryRecommendation | null>;
  getAllForEntry(entryId: string): Promise<EntryRecommendation[]>;
  save(recommendation: EntryRecommendation): Promise<EntryRecommendation>;
  delete(id: string): Promise<boolean>;
}

export interface IRecommendationSnapshotRepository {
  getByLegId(legId: string): Promise<PortfolioRecommendation | null>;
  save(portfolio: PortfolioRecommendation): Promise<PortfolioRecommendation>;
  delete(id: string): Promise<boolean>;
  getWeeklyRecSnapshot(legId: string): Promise<RecommendationSnapshot | null>;
  saveWeeklyRecSnapshot(snapshot: RecommendationSnapshot): Promise<RecommendationSnapshot>;
  getAllWeeklyRecSnapshots(): Promise<RecommendationSnapshot[]>;
}

export interface ISnapshotRepository {
  getWeeklySnapshot(legId: string): Promise<WeeklySnapshot | null>;
  saveWeeklySnapshot(snapshot: WeeklySnapshot): Promise<WeeklySnapshot>;
  getAllWeeklySnapshots(): Promise<WeeklySnapshot[]>;
  
  getFeatureSnapshot(legId: string): Promise<FeatureSnapshot | null>;
  saveFeatureSnapshot(snapshot: FeatureSnapshot): Promise<FeatureSnapshot>;
  getAllFeatureSnapshots(): Promise<FeatureSnapshot[]>;
  
  getInventorySnapshot(entryId: string, legId: string): Promise<InventorySnapshotRecord | null>;
  saveInventorySnapshot(snapshot: InventorySnapshotRecord): Promise<InventorySnapshotRecord>;
  getAllInventorySnapshotsByLeg(legId: string): Promise<InventorySnapshotRecord[]>;
  
  getRiskSnapshot(legId: string): Promise<RiskSnapshot | null>;
  saveRiskSnapshot(snapshot: RiskSnapshot): Promise<RiskSnapshot>;
  getAllRiskSnapshots(): Promise<RiskSnapshot[]>;
}

export interface IAuditRepository {
  getAuditByLeg(legId: string): Promise<DecisionAuditRecord | null>;
  getAuditsByWeek(weekNumber: number): Promise<DecisionAuditRecord[]>;
  getAllAudits(): Promise<DecisionAuditRecord[]>;
  save(record: DecisionAuditRecord): Promise<DecisionAuditRecord>;
}

export interface ISimulationRepository {
  // Configs or reference settings
  getStrategyMultiplier(strategy: string, metric: string): Promise<number>;
}

export interface ISimulationRunRepository {
  getAll(): Promise<SimulationRun[]>;
  getById(id: string): Promise<SimulationRun | null>;
  getByLegId(legId: string): Promise<SimulationRun[]>;
  save(run: SimulationRun): Promise<SimulationRun>;
  delete(id: string): Promise<boolean>;
}

export interface ISimulationResultRepository {
  getProjectionsByRunId(runId: string): Promise<EntrySurvivalProjection[]>;
}

export interface IAuthAuditRepository {
  getAll(): Promise<AuthAuditRecord[]>;
  getRecent(limit: number): Promise<AuthAuditRecord[]>;
  create(record: Omit<AuthAuditRecord, "id" | "timestamp">): Promise<AuthAuditRecord>;
}

export interface ISystemMetadataRepository {
  getLatest(): Promise<SystemMetadata | null>;
  save(metadata: SystemMetadata): Promise<SystemMetadata>;
}

export interface IApplicationVersionsRepository {
  getAll(): Promise<ApplicationVersion[]>;
  create(version: Omit<ApplicationVersion, "versionId" | "createdAt">): Promise<ApplicationVersion>;
}

export interface IProjectDecisionsRepository {
  getAll(): Promise<ProjectDecision[]>;
  create(decision: Omit<ProjectDecision, "decisionId" | "createdAt">): Promise<ProjectDecision>;
}

export interface IOperationsEventsRepository {
  getAll(): Promise<OperationsEvent[]>;
  getRecent(limit: number): Promise<OperationsEvent[]>;
  create(event: Omit<OperationsEvent, "eventId" | "createdAt">): Promise<OperationsEvent>;
}

export interface IFeatureDefinitionRepository {
  getAll(): Promise<FeatureDefinition[]>;
  getByFeatureId(id: string): Promise<FeatureDefinition | null>;
  save(definition: FeatureDefinition): Promise<FeatureDefinition>;
}

export interface IFeatureSnapshotRepository {
  getAll(): Promise<FeatureStoreSnapshot[]>;
  getBySeasonAndWeek(season: number, week: number): Promise<FeatureStoreSnapshot[]>;
  save(snapshot: FeatureStoreSnapshot): Promise<FeatureStoreSnapshot>;
  saveMany(snapshots: FeatureStoreSnapshot[]): Promise<FeatureStoreSnapshot[]>;
}

export interface IFeatureBuildRunRepository {
  getAll(): Promise<FeatureBuildRun[]>;
  getById(id: number | string): Promise<FeatureBuildRun | null>;
  getLatest(): Promise<FeatureBuildRun | null>;
  save(run: FeatureBuildRun): Promise<FeatureBuildRun>;
}

export interface IEntryStrategyProfileRepository {
  getAll(): Promise<EntryStrategyProfile[]>;
  getByEntryId(entryId: string): Promise<EntryStrategyProfile | null>;
  save(profile: EntryStrategyProfile): Promise<EntryStrategyProfile>;
  deleteByEntryId(entryId: string): Promise<boolean>;
}

export interface IEntryMetadataRepository {
  getAll(): Promise<EntryMetadata[]>;
  getByEntryId(entryId: string): Promise<EntryMetadata | null>;
  save(metadata: EntryMetadata): Promise<EntryMetadata>;
  deleteByEntryId(entryId: string): Promise<boolean>;
}

export interface IFutureTeamValueRepository {
  getAll(): Promise<FutureTeamValue[]>;
  getBySeasonAndWeek(season: string, week: number): Promise<FutureTeamValue[]>;
  getLatest(): Promise<FutureTeamValue[]>;
  save(val: FutureTeamValue): Promise<FutureTeamValue>;
  saveMany(vals: FutureTeamValue[]): Promise<FutureTeamValue[]>;
  deleteBySeasonAndWeek(season: string, week: number): Promise<boolean>;
}

export interface ISurvivorEquityRepository {
  getAll(): Promise<SurvivorEquitySnapshot[]>;
  getBySeasonAndWeek(season: string, week: number): Promise<SurvivorEquitySnapshot[]>;
  getLatest(): Promise<SurvivorEquitySnapshot[]>;
  save(snapshot: SurvivorEquitySnapshot): Promise<SurvivorEquitySnapshot>;
  saveMany(snapshots: SurvivorEquitySnapshot[]): Promise<SurvivorEquitySnapshot[]>;
  deleteBySeasonAndWeek(season: string, week: number): Promise<boolean>;
}

export interface IRecommendationCandidateRepository {
  getAll(): Promise<AuditableRecommendationCandidate[]>;
  getBySeasonAndWeek(season: string, week: number): Promise<AuditableRecommendationCandidate[]>;
  getLatest(): Promise<AuditableRecommendationCandidate[]>;
  getByEntryId(entryId: string): Promise<AuditableRecommendationCandidate[]>;
  save(candidate: AuditableRecommendationCandidate): Promise<AuditableRecommendationCandidate>;
  saveMany(candidates: AuditableRecommendationCandidate[]): Promise<AuditableRecommendationCandidate[]>;
  deleteBySeasonAndWeek(season: string, week: number): Promise<boolean>;
}

export interface IOwnershipProjectionRepository {
  getAll(): Promise<OwnershipProjection[]>;
  getBySeasonAndWeek(season: string, week: number): Promise<OwnershipProjection[]>;
  getLatest(): Promise<OwnershipProjection[]>;
  save(projection: OwnershipProjection): Promise<OwnershipProjection>;
  saveMany(projections: OwnershipProjection[]): Promise<OwnershipProjection[]>;
  deleteBySeasonAndWeek(season: string, week: number): Promise<boolean>;
}

export interface IContestDynamicsRepository {
  getAll(): Promise<ContestDynamicsSnapshot[]>;
  getBySeasonAndWeek(season: string, week: number): Promise<ContestDynamicsSnapshot[]>;
  getLatest(): Promise<ContestDynamicsSnapshot[]>;
  getByEntryId(entryId: string): Promise<ContestDynamicsSnapshot[]>;
  save(snapshot: ContestDynamicsSnapshot): Promise<ContestDynamicsSnapshot>;
  saveMany(snapshots: ContestDynamicsSnapshot[]): Promise<ContestDynamicsSnapshot[]>;
  deleteBySeasonAndWeek(season: string, week: number): Promise<boolean>;
}

export interface ISurvivorRecommendationRepository {
  getAll(): Promise<SurvivorRecommendation[]>;
  getBySeasonAndWeek(season: string, week: number): Promise<SurvivorRecommendation[]>;
  getLatest(): Promise<SurvivorRecommendation[]>;
  getByEntryId(entryId: string): Promise<SurvivorRecommendation[]>;
  save(recommendation: SurvivorRecommendation): Promise<SurvivorRecommendation>;
  saveMany(recommendations: SurvivorRecommendation[]): Promise<SurvivorRecommendation[]>;
  deleteBySeasonAndWeek(season: string, week: number): Promise<boolean>;
}

export interface IRecommendationAuditRepository {
  getAll(): Promise<RecommendationAudit[]>;
  getBySeasonAndWeek(season: string, week: number): Promise<RecommendationAudit[]>;
  getLatest(): Promise<RecommendationAudit[]>;
  getByEntryId(entryId: string): Promise<RecommendationAudit[]>;
  getByTeamId(teamId: string): Promise<RecommendationAudit[]>;
  save(audit: RecommendationAudit): Promise<RecommendationAudit>;
  saveMany(audits: RecommendationAudit[]): Promise<RecommendationAudit[]>;
  deleteBySeasonAndWeek(season: string, week: number): Promise<boolean>;
}

export interface IRecommendationConfidenceRepository {
  getAll(): Promise<RecommendationConfidenceSnapshot[]>;
  getBySeasonAndWeek(season: string, week: number): Promise<RecommendationConfidenceSnapshot[]>;
  getLatest(): Promise<RecommendationConfidenceSnapshot[]>;
  getByEntryId(entryId: string): Promise<RecommendationConfidenceSnapshot[]>;
  getByTeamId(teamId: string): Promise<RecommendationConfidenceSnapshot[]>;
  getTopConfidence(limit: number): Promise<RecommendationConfidenceSnapshot[]>;
  save(snapshot: RecommendationConfidenceSnapshot): Promise<RecommendationConfidenceSnapshot>;
  saveMany(snapshots: RecommendationConfidenceSnapshot[]): Promise<RecommendationConfidenceSnapshot[]>;
  deleteBySeasonAndWeek(season: string, week: number): Promise<boolean>;
}

export interface IRecommendationConsensusRepository {
  getAll(): Promise<RecommendationConsensus[]>;
  getBySeasonAndWeek(season: string, week: number): Promise<RecommendationConsensus[]>;
  getLatest(): Promise<RecommendationConsensus[]>;
  getByEntryId(entryId: string): Promise<RecommendationConsensus[]>;
  getByTeamId(teamId: string): Promise<RecommendationConsensus[]>;
  getTopConsensus(limit: number): Promise<RecommendationConsensus[]>;
  save(snapshot: RecommendationConsensus): Promise<RecommendationConsensus>;
  saveMany(snapshots: RecommendationConsensus[]): Promise<RecommendationConsensus[]>;
  deleteBySeasonAndWeek(season: string, week: number): Promise<boolean>;
}

export interface IRecommendationPortfolioRepository {
  savePortfolioRecommendations(snapshots: RecommendationPortfolio[]): Promise<RecommendationPortfolio[]>;
  getLatestPortfolio(): Promise<RecommendationPortfolio[]>;
  getPortfolioById(portfolioId: string): Promise<RecommendationPortfolio[]>;
  getPortfolioHistory(): Promise<RecommendationPortfolio[]>;
  deleteWeek(season: string, week: number): Promise<boolean>;
}

export interface IContestEVRepository {
  saveContestEV(snapshots: ContestEV[]): Promise<ContestEV[]>;
  getLatestContestEV(): Promise<ContestEV[]>;
  getContestEV(contestId: string): Promise<ContestEV[]>;
  getContestHistory(): Promise<ContestEV[]>;
  deleteWeek(season: string, week: number): Promise<boolean>;
}

export interface IOwnershipCalibrationRepository {
  saveCalibration(calibrations: OwnershipCalibration[]): Promise<OwnershipCalibration[]>;
  getLatestCalibration(): Promise<OwnershipCalibration[]>;
  getCalibration(contestId: string): Promise<OwnershipCalibration[]>;
  getCalibrationHistory(): Promise<OwnershipCalibration[]>;
  deleteWeek(season: string, week: number): Promise<boolean>;
}

export interface IMarketCalibrationRepository {
  saveCalibration(calibrations: MarketCalibration[]): Promise<MarketCalibration[]>;
  getLatestCalibration(): Promise<MarketCalibration[]>;
  getCalibrationByGame(gameId: string): Promise<MarketCalibration[]>;
  getCalibrationHistory(): Promise<MarketCalibration[]>;
  deleteWeek(season: string, week: number): Promise<boolean>;
}

export interface IModelPerformanceRepository {
  savePerformance(performances: ModelPerformance[]): Promise<ModelPerformance[]>;
  getLatestPerformance(): Promise<ModelPerformance[]>;
  getPerformanceByName(modelName: string): Promise<ModelPerformance[]>;
  getPerformanceHistory(): Promise<ModelPerformance[]>;
  deleteWeek(season: string, week: number): Promise<boolean>;
}

export interface IRollingValidationRepository {
  saveValidation(validations: RollingValidation[]): Promise<RollingValidation[]>;
  getLatestValidation(): Promise<RollingValidation[]>;
  getValidationByModel(modelName: string): Promise<RollingValidation[]>;
  getValidationHistory(): Promise<RollingValidation[]>;
  deleteWeekRange(season: string, startWeek: number, endWeek: number): Promise<boolean>;
}

export interface IModelDriftRepository {
  saveDrift(drifts: ModelDrift[]): Promise<ModelDrift[]>;
  getLatestDrift(): Promise<ModelDrift[]>;
  getDriftByModel(modelName: string): Promise<ModelDrift[]>;
  getDriftHistory(): Promise<ModelDrift[]>;
  deleteDriftWeek(season: string, week: number): Promise<boolean>;
}

export interface IAdaptiveModelWeightRepository {
  saveWeights(weights: AdaptiveModelWeight[]): Promise<AdaptiveModelWeight[]>;
  getLatestWeights(): Promise<AdaptiveModelWeight[]>;
  getWeightsByModel(modelName: string): Promise<AdaptiveModelWeight[]>;
  getWeightsHistory(): Promise<AdaptiveModelWeight[]>;
  deleteWeightsWeek(season: string, week: number): Promise<boolean>;
}

export interface IEnsemblePredictionRepository {
  savePredictions(predictions: EnsemblePrediction[]): Promise<EnsemblePrediction[]>;
  getLatestPredictions(): Promise<EnsemblePrediction[]>;
  getPredictionsByGame(gameId: string): Promise<EnsemblePrediction[]>;
  getPredictionsHistory(): Promise<EnsemblePrediction[]>;
  deletePredictionsWeek(season: string, week: number): Promise<boolean>;
}















