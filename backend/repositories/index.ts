import { databaseConfig } from "../config/database";
import { RepositoryFactory, useMock, updateUseMock } from "./RepositoryFactory";
import { PostgresConnectionManager } from "../database/connection/PostgresConnectionManager";

console.log(`[Repository Factory] Preparing data repositories under ${useMock ? "IN-MEMORY MOCK" : "RELATIONAL POSTGRES (FOUNDATION)"} mode.`);

export { RepositoryFactory, useMock, updateUseMock };

/**
 * Creates a dynamic proxy that lazily resolves either the Postgres or Mock repository.
 * If a call to a Postgres repository method fails due to database connection errors, 
 * it automatically switches the application permanently to the Mock repository for subsequent calls
 * and transparently retries the current method call once on the Mock repository.
 */
function createRepositoryProxy<T extends object>(getRepoFn: () => T): T {
  let cachedRepo: T | null = null;
  let cachedIsMock = false;

  const getRepo = () => {
    const isOffline = PostgresConnectionManager.getInstance().isFallbackMode();
    const useMockMode = databaseConfig.useMock || (isOffline && process.env.NODE_ENV !== "production");
    
    // If fallback is detected, update the config dynamically (only in non-production)
    if (isOffline && !databaseConfig.useMock && process.env.NODE_ENV !== "production") {
      databaseConfig.useMock = true;
      updateUseMock(true);
    }

    if (cachedRepo && cachedIsMock === useMockMode) {
      return cachedRepo;
    }

    cachedIsMock = useMockMode;
    cachedRepo = getRepoFn();
    return cachedRepo;
  };

  return new Proxy({} as T, {
    get(target, prop, receiver) {
      const repo = getRepo();
      const value = Reflect.get(repo, prop, receiver);

      if (typeof value === "function") {
        return async function (this: any, ...args: any[]) {
          try {
            return await value.apply(repo, args);
          } catch (err: any) {
            const isConnectionError = 
              err.message?.includes("ECONNREFUSED") || 
              err.message?.includes("connection") || 
              err.code === "ECONNREFUSED" || 
              err.message?.includes("Database check failed") || 
              err.message?.includes("pool") ||
              err.message?.includes("testConnection") ||
              err.message?.includes("query execution attempt") ||
              err.message?.includes("terminated abruptly");

            if (isConnectionError && !databaseConfig.useMock) {
              if (process.env.NODE_ENV === "production") {
                console.error(`[Proxy] Relational connection error in production: ${err.message}. Entering DEGRADED mode. Mock persistent fallback is prohibited.`);
                throw err;
              }

              console.warn(`[Proxy Fallback] Database connection error detected [${err.message}]. Activating live mock fallback engine.`);
              PostgresConnectionManager.getInstance().setFallbackMode(true);
              databaseConfig.useMock = true;
              updateUseMock(true);

              // Immediately resolve mock version and execute
              const mockRepo = getRepoFn();
              const fallbackVal = Reflect.get(mockRepo, prop);
              if (typeof fallbackVal === "function") {
                return await fallbackVal.apply(mockRepo, args);
              }
            }
            throw err;
          }
        };
      }
      return value;
    }
  });
}

// Preserve existing globally shared singleton exports across all core services
export const teamRepo = createRepositoryProxy(() => RepositoryFactory.getTeamRepo());
export const contestRepo = createRepositoryProxy(() => RepositoryFactory.getContestRepo());
export const legRepo = createRepositoryProxy(() => RepositoryFactory.getLegRepo());
export const gameRepo = createRepositoryProxy(() => RepositoryFactory.getGameRepo());
export const lineRepo = createRepositoryProxy(() => RepositoryFactory.getLineRepo());
export const entryRepo = createRepositoryProxy(() => RepositoryFactory.getEntryRepo());
export const pickRepo = createRepositoryProxy(() => RepositoryFactory.getPickRepo());
export const historyRepo = createRepositoryProxy(() => RepositoryFactory.getHistoryRepo());
export const weeklyInputRepo = createRepositoryProxy(() => RepositoryFactory.getWeeklyInputRepo());
export const teamFeatureRepo = createRepositoryProxy(() => RepositoryFactory.getTeamFeatureRepo());
export const gameFeatureRepo = createRepositoryProxy(() => RepositoryFactory.getGameFeatureRepo());
export const importJobRepo = createRepositoryProxy(() => RepositoryFactory.getImportJobRepo());
export const inventoryRepo = createRepositoryProxy(() => RepositoryFactory.getInventoryRepo());
export const reservationRepo = createRepositoryProxy(() => RepositoryFactory.getReservationRepo());
export const futureValueRepo = createRepositoryProxy(() => RepositoryFactory.getFutureValueRepo());
export const riskRepo = createRepositoryProxy(() => RepositoryFactory.getRiskRepo());
export const riskAssessmentRepo = createRepositoryProxy(() => RepositoryFactory.getRiskAssessmentRepo());
export const recommendationRepo = createRepositoryProxy(() => RepositoryFactory.getRecommendationRepo());
export const recommendationSnapshotRepo = createRepositoryProxy(() => RepositoryFactory.getRecommendationSnapshotRepo());
export const snapshotRepo = createRepositoryProxy(() => RepositoryFactory.getSnapshotRepo());
export const auditRepo = createRepositoryProxy(() => RepositoryFactory.getAuditRepo());
export const simulationRepo = createRepositoryProxy(() => RepositoryFactory.getSimulationRepo());
export const simulationRunRepo = createRepositoryProxy(() => RepositoryFactory.getSimulationRunRepo());
export const simulationResultRepo = createRepositoryProxy(() => RepositoryFactory.getSimulationResultRepo());
export const workflowRunRepo = createRepositoryProxy(() => RepositoryFactory.getWorkflowRunRepo());
export const authAuditRepo = createRepositoryProxy(() => RepositoryFactory.getAuthAuditRepo());
export const systemMetadataRepo = createRepositoryProxy(() => RepositoryFactory.getSystemMetadataRepo());
export const applicationVersionsRepo = createRepositoryProxy(() => RepositoryFactory.getApplicationVersionsRepo());
export const projectDecisionsRepo = createRepositoryProxy(() => RepositoryFactory.getProjectDecisionsRepo());
export const operationsEventsRepo = createRepositoryProxy(() => RepositoryFactory.getOperationsEventsRepo());
export const featureDefinitionRepo = createRepositoryProxy(() => RepositoryFactory.getFeatureDefinitionRepo());
export const featureSnapshotRepo = createRepositoryProxy(() => RepositoryFactory.getFeatureSnapshotRepo());
export const featureBuildRunRepo = createRepositoryProxy(() => RepositoryFactory.getFeatureBuildRunRepo());
export const futureTeamValueRepo = createRepositoryProxy(() => RepositoryFactory.getFutureTeamValueRepo());
export const survivorEquityRepo = createRepositoryProxy(() => RepositoryFactory.getSurvivorEquityRepo());
export const recommendationCandidateRepo = createRepositoryProxy(() => RepositoryFactory.getRecommendationCandidateRepo());
export const ownershipProjectionRepo = createRepositoryProxy(() => RepositoryFactory.getOwnershipProjectionRepo());
export const contestDynamicsRepo = createRepositoryProxy(() => RepositoryFactory.getContestDynamicsRepo());
export const survivorRecommendationRepo = createRepositoryProxy(() => RepositoryFactory.getSurvivorRecommendationRepo());
export const entryStrategyProfileRepo = createRepositoryProxy(() => RepositoryFactory.getEntryStrategyProfileRepo());
export const entryMetadataRepo = createRepositoryProxy(() => RepositoryFactory.getEntryMetadataRepo());
export const recommendationAuditRepo = createRepositoryProxy(() => RepositoryFactory.getRecommendationAuditRepo());
export const recommendationConfidenceRepo = createRepositoryProxy(() => RepositoryFactory.getRecommendationConfidenceRepo());
export const recommendationConsensusRepo = createRepositoryProxy(() => RepositoryFactory.getRecommendationConsensusRepo());
export const recommendationPortfolioRepo = createRepositoryProxy(() => RepositoryFactory.getRecommendationPortfolioRepo());
export const contestEVRepo = createRepositoryProxy(() => RepositoryFactory.getContestEVRepo());
export const ownershipCalibrationRepo = createRepositoryProxy(() => RepositoryFactory.getOwnershipCalibrationRepo());
export const marketCalibrationRepo = createRepositoryProxy(() => RepositoryFactory.getMarketCalibrationRepo());
export const modelPerformanceRepo = createRepositoryProxy(() => RepositoryFactory.getModelPerformanceRepo());
export const rollingValidationRepo = createRepositoryProxy(() => RepositoryFactory.getRollingValidationRepo());


