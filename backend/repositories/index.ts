import { 
  MockTeamRepository, 
  MockContestRepository, 
  MockContestLegRepository, 
  MockGameRepository, 
  MockTeamWeekLineRepository, 
  MockSurvivorEntryRepository, 
  MockSurvivorPickRepository,
  MockSurvivorHistoryRepository,
  MockWeeklyInputRepository,
  MockTeamFeatureRepository,
  MockGameFeatureRepository,
  MockImportJobRepository,
  MockInventoryRepository,
  MockReservationRepository,
  MockFutureValueRepository,
  MockRiskRepository,
  MockRiskAssessmentRepository,
  MockRecommendationRepository,
  MockRecommendationSnapshotRepository,
  MockSnapshotRepository,
  MockAuditRepository,
  MockSimulationRepository,
  MockSimulationRunRepository,
  MockSimulationResultRepository
} from "./mockRepositories";
import {
  PostgresTeamRepository,
  PostgresContestRepository,
  PostgresContestLegRepository,
  PostgresGameRepository,
  PostgresTeamWeekLineRepository,
  PostgresSurvivorEntryRepository,
  PostgresSurvivorPickRepository,
  PostgresSurvivorHistoryRepository,
  PostgresWeeklyInputRepository,
  PostgresTeamFeatureRepository,
  PostgresGameFeatureRepository,
  PostgresImportJobRepository
} from "./postgres/postgresRepositories";

const useMock = process.env.USE_MOCK_DATA !== "false";

console.log(`[Database] Instantiating factory repositories under ${useMock ? "IN-MEMORY MOCK" : "RELATIONAL POSTGRES"} persistence engine.`);

export const teamRepo = useMock ? new MockTeamRepository() : new PostgresTeamRepository();
export const contestRepo = useMock ? new MockContestRepository() : new PostgresContestRepository();
export const legRepo = useMock ? new MockContestLegRepository() : new PostgresContestLegRepository();
export const gameRepo = useMock ? new MockGameRepository() : new PostgresGameRepository();
export const lineRepo = useMock ? new MockTeamWeekLineRepository() : new PostgresTeamWeekLineRepository();
export const entryRepo = useMock ? new MockSurvivorEntryRepository() : new PostgresSurvivorEntryRepository();
export const pickRepo = useMock ? new MockSurvivorPickRepository() : new PostgresSurvivorPickRepository();
export const historyRepo = useMock ? new MockSurvivorHistoryRepository() : new PostgresSurvivorHistoryRepository();
export const weeklyInputRepo = useMock ? new MockWeeklyInputRepository() : new PostgresWeeklyInputRepository();
export const teamFeatureRepo = useMock ? new MockTeamFeatureRepository() : new PostgresTeamFeatureRepository();
export const gameFeatureRepo = useMock ? new MockGameFeatureRepository() : new PostgresGameFeatureRepository();
export const importJobRepo = useMock ? new MockImportJobRepository() : new PostgresImportJobRepository();
export const inventoryRepo = new MockInventoryRepository();
export const reservationRepo = new MockReservationRepository();
export const futureValueRepo = new MockFutureValueRepository();
export const riskRepo = new MockRiskRepository();
export const riskAssessmentRepo = new MockRiskAssessmentRepository();
export const recommendationRepo = new MockRecommendationRepository();
export const recommendationSnapshotRepo = new MockRecommendationSnapshotRepository();
export const snapshotRepo = new MockSnapshotRepository();
export const auditRepo = new MockAuditRepository();
export const simulationRepo = new MockSimulationRepository();
export const simulationRunRepo = new MockSimulationRunRepository();
export const simulationResultRepo = new MockSimulationResultRepository();

export { useMock };

