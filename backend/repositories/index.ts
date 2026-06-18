import { databaseConfig } from "../config/database";
import { RepositoryFactory } from "./RepositoryFactory";

const useMock = databaseConfig.useMock;

console.log(`[Repository Factory] Preparing data repositories under ${useMock ? "IN-MEMORY MOCK" : "RELATIONAL POSTGRES (FOUNDATION)"} mode.`);

export { RepositoryFactory, useMock };

// Preserve existing globally shared singleton exports across all core services
export const teamRepo = RepositoryFactory.getTeamRepo();
export const contestRepo = RepositoryFactory.getContestRepo();
export const legRepo = RepositoryFactory.getLegRepo();
export const gameRepo = RepositoryFactory.getGameRepo();
export const lineRepo = RepositoryFactory.getLineRepo();
export const entryRepo = RepositoryFactory.getEntryRepo();
export const pickRepo = RepositoryFactory.getPickRepo();
export const historyRepo = RepositoryFactory.getHistoryRepo();
export const weeklyInputRepo = RepositoryFactory.getWeeklyInputRepo();
export const teamFeatureRepo = RepositoryFactory.getTeamFeatureRepo();
export const gameFeatureRepo = RepositoryFactory.getGameFeatureRepo();
export const importJobRepo = RepositoryFactory.getImportJobRepo();
export const inventoryRepo = RepositoryFactory.getInventoryRepo();
export const reservationRepo = RepositoryFactory.getReservationRepo();
export const futureValueRepo = RepositoryFactory.getFutureValueRepo();
export const riskRepo = RepositoryFactory.getRiskRepo();
export const riskAssessmentRepo = RepositoryFactory.getRiskAssessmentRepo();
export const recommendationRepo = RepositoryFactory.getRecommendationRepo();
export const recommendationSnapshotRepo = RepositoryFactory.getRecommendationSnapshotRepo();
export const snapshotRepo = RepositoryFactory.getSnapshotRepo();
export const auditRepo = RepositoryFactory.getAuditRepo();
export const simulationRepo = RepositoryFactory.getSimulationRepo();
export const simulationRunRepo = RepositoryFactory.getSimulationRunRepo();
export const simulationResultRepo = RepositoryFactory.getSimulationResultRepo();
export const workflowRunRepo = RepositoryFactory.getWorkflowRunRepo();
