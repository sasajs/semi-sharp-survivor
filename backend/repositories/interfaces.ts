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
  EntrySurvivalProjection
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






