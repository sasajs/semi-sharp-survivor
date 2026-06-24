import { databaseConfig } from "../config/database";

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
  MockSimulationResultRepository,
  MockAuthAuditRepository,
  MockSystemMetadataRepository,
  MockApplicationVersionsRepository,
  MockProjectDecisionsRepository,
  MockOperationsEventsRepository,
  MockFeatureDefinitionRepository,
  MockFeatureSnapshotRepository,
  MockFeatureBuildRunRepository,
  MockEntryStrategyProfileRepository,
  MockEntryMetadataRepository,
  MockFutureTeamValueRepository,
  MockSurvivorEquityRepository,
  MockRecommendationCandidateRepository,
  MockOwnershipProjectionRepository,
  MockContestDynamicsRepository,
  MockSurvivorRecommendationRepository,
  MockRecommendationAuditRepository,
  MockRecommendationConfidenceRepository
} from "./mockRepositories";

import {
  PostgresTeamRepository,
  PostgresContestLegRepository,
  PostgresGameRepository,
  PostgresTeamWeekLineRepository,
  PostgresSurvivorHistoryRepository,
  PostgresWeeklyInputRepository,
  PostgresTeamFeatureRepository,
  PostgresGameFeatureRepository,
  PostgresImportJobRepository
} from "./postgres/postgresRepositories";

import {
  PostgresSystemMetadataRepository,
  PostgresApplicationVersionsRepository,
  PostgresProjectDecisionsRepository,
  PostgresOperationsEventsRepository
} from "./postgres/PostgresSystemMemoryRepositories";

// Import high-fidelity PostgreSQL repositories
import { PostgresContestRepository } from "./postgres/PostgresContestRepository";
import { PostgresEntryRepository } from "./postgres/PostgresEntryRepository";
import { PostgresPickRepository } from "./postgres/PostgresPickRepository";
import { PostgresWorkflowRepository } from "./postgres/PostgresWorkflowRepository";
import { PostgresSnapshotRepository } from "./postgres/PostgresSnapshotRepository";
import { PostgresFeatureDefinitionRepository } from "./postgres/PostgresFeatureDefinitionRepository";
import { PostgresFeatureSnapshotRepository } from "./postgres/PostgresFeatureSnapshotRepository";
import { PostgresFeatureBuildRunRepository } from "./postgres/PostgresFeatureBuildRunRepository";
import { PostgresEntryStrategyProfileRepository } from "./postgres/PostgresEntryStrategyProfileRepository";
import { PostgresEntryMetadataRepository } from "./postgres/PostgresEntryMetadataRepository";
import { PostgresFutureTeamValueRepository } from "./postgres/PostgresFutureTeamValueRepository";
import { PostgresSurvivorEquityRepository } from "./postgres/PostgresSurvivorEquityRepository";
import { PostgresRecommendationCandidateRepository } from "./postgres/PostgresRecommendationCandidateRepository";
import { PostgresOwnershipProjectionRepository } from "./postgres/PostgresOwnershipProjectionRepository";
import { PostgresContestDynamicsRepository } from "./postgres/PostgresContestDynamicsRepository";
import { PostgresSurvivorRecommendationRepository } from "./postgres/PostgresSurvivorRecommendationRepository";
import { PostgresRecommendationAuditRepository } from "./postgres/PostgresRecommendationAuditRepository";
import { PostgresRecommendationConfidenceRepository } from "./postgres/PostgresRecommendationConfidenceRepository";

export let useMock = databaseConfig.useMock;

export function updateUseMock(val: boolean) {
  useMock = val;
  databaseConfig.useMock = val;
}

export class RepositoryFactory {
  static getTeamRepo() {
    return useMock ? new MockTeamRepository() : new PostgresTeamRepository();
  }
  static getContestRepo() {
    return useMock ? new MockContestRepository() : new PostgresContestRepository();
  }
  static getLegRepo() {
    return useMock ? new MockContestLegRepository() : new PostgresContestLegRepository();
  }
  static getGameRepo() {
    return useMock ? new MockGameRepository() : new PostgresGameRepository();
  }
  static getLineRepo() {
    return useMock ? new MockTeamWeekLineRepository() : new PostgresTeamWeekLineRepository();
  }
  static getEntryRepo() {
    return useMock ? new MockSurvivorEntryRepository() : new PostgresEntryRepository();
  }
  static getPickRepo() {
    return useMock ? new MockSurvivorPickRepository() : new PostgresPickRepository();
  }
  static getHistoryRepo() {
    return useMock ? new MockSurvivorHistoryRepository() : new PostgresSurvivorHistoryRepository();
  }
  static getWeeklyInputRepo() {
    return useMock ? new MockWeeklyInputRepository() : new PostgresWeeklyInputRepository();
  }
  static getTeamFeatureRepo() {
    return useMock ? new MockTeamFeatureRepository() : new PostgresTeamFeatureRepository();
  }
  static getGameFeatureRepo() {
    return useMock ? new MockGameFeatureRepository() : new PostgresGameFeatureRepository();
  }
  static getImportJobRepo() {
    return useMock ? new MockImportJobRepository() : new PostgresImportJobRepository();
  }
  static getInventoryRepo() {
    return new MockInventoryRepository();
  }
  static getReservationRepo() {
    return new MockReservationRepository();
  }
  static getFutureValueRepo() {
    return new MockFutureValueRepository();
  }
  static getRiskRepo() {
    return new MockRiskRepository();
  }
  static getRiskAssessmentRepo() {
    return new MockRiskAssessmentRepository();
  }
  static getRecommendationRepo() {
    return new MockRecommendationRepository();
  }
  static getRecommendationSnapshotRepo() {
    return new MockRecommendationSnapshotRepository();
  }
  static getSnapshotRepo() {
    return useMock ? new MockSnapshotRepository() : new PostgresSnapshotRepository();
  }
  static getAuditRepo() {
    return new MockAuditRepository();
  }
  static getSimulationRepo() {
    return new MockSimulationRepository();
  }
  static getSimulationRunRepo() {
    return new MockSimulationRunRepository();
  }
  static getSimulationResultRepo() {
    return new MockSimulationResultRepository();
  }
  static getWorkflowRunRepo() {
    return useMock ? new MockWorkflowRepositoryWrapper() : new PostgresWorkflowRepository();
  }
  static getAuthAuditRepo() {
    return new MockAuthAuditRepository();
  }
  static getSystemMetadataRepo() {
    return useMock ? new MockSystemMetadataRepository() : new PostgresSystemMetadataRepository();
  }
  static getApplicationVersionsRepo() {
    return useMock ? new MockApplicationVersionsRepository() : new PostgresApplicationVersionsRepository();
  }
  static getProjectDecisionsRepo() {
    return useMock ? new MockProjectDecisionsRepository() : new PostgresProjectDecisionsRepository();
  }
  static getOperationsEventsRepo() {
    return useMock ? new MockOperationsEventsRepository() : new PostgresOperationsEventsRepository();
  }
  static getFeatureDefinitionRepo() {
    return useMock ? new MockFeatureDefinitionRepository() : new PostgresFeatureDefinitionRepository();
  }
  static getFeatureSnapshotRepo() {
    return useMock ? new MockFeatureSnapshotRepository() : new PostgresFeatureSnapshotRepository();
  }
  static getFeatureBuildRunRepo() {
    return useMock ? new MockFeatureBuildRunRepository() : new PostgresFeatureBuildRunRepository();
  }
  static getEntryStrategyProfileRepo() {
    return useMock ? new MockEntryStrategyProfileRepository() : new PostgresEntryStrategyProfileRepository();
  }
  static getEntryMetadataRepo() {
    return useMock ? new MockEntryMetadataRepository() : new PostgresEntryMetadataRepository();
  }
  static getFutureTeamValueRepo() {
    return useMock ? new MockFutureTeamValueRepository() : new PostgresFutureTeamValueRepository();
  }
  static getSurvivorEquityRepo() {
    return useMock ? new MockSurvivorEquityRepository() : new PostgresSurvivorEquityRepository();
  }
  static getRecommendationCandidateRepo() {
    return useMock ? new MockRecommendationCandidateRepository() : new PostgresRecommendationCandidateRepository();
  }
  static getOwnershipProjectionRepo() {
    return useMock ? new MockOwnershipProjectionRepository() : new PostgresOwnershipProjectionRepository();
  }
  static getContestDynamicsRepo() {
    return useMock ? new MockContestDynamicsRepository() : new PostgresContestDynamicsRepository();
  }
  static getSurvivorRecommendationRepo() {
    return useMock ? new MockSurvivorRecommendationRepository() : new PostgresSurvivorRecommendationRepository();
  }
  static getRecommendationAuditRepo() {
    return useMock ? new MockRecommendationAuditRepository() : new PostgresRecommendationAuditRepository();
  }
  static getRecommendationConfidenceRepo() {
    return useMock ? new MockRecommendationConfidenceRepository() : new PostgresRecommendationConfidenceRepository();
  }
}

// Compact helper to guarantee clean runtime instancing in Mock workflow scenarios
class MockWorkflowRepositoryWrapper {
  async createRun(run: any) { return mockWorkflowRunRepo.createRun(run); }
  async updateRun(run: any) { return mockWorkflowRunRepo.updateRun(run); }
  async getRunById(id: string) { return mockWorkflowRunRepo.getRunById(id); }
  async getRunByIdempotencyKey(key: string) { return mockWorkflowRunRepo.getRunByIdempotencyKey(key); }
  async listRuns() { return mockWorkflowRunRepo.listRuns(); }
  async listRecentRuns(limit?: number) { return mockWorkflowRunRepo.listRecentRuns(limit); }
}

import { mockWorkflowRunRepo } from "../orchestration/repositories/MockWorkflowRunRepository";
