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
  MockSimulationResultRepository
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

// Import high-fidelity PostgreSQL repositories
import { PostgresContestRepository } from "./postgres/PostgresContestRepository";
import { PostgresEntryRepository } from "./postgres/PostgresEntryRepository";
import { PostgresPickRepository } from "./postgres/PostgresPickRepository";
import { PostgresWorkflowRepository } from "./postgres/PostgresWorkflowRepository";
import { PostgresSnapshotRepository } from "./postgres/PostgresSnapshotRepository";

const useMock = databaseConfig.useMock;

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
