import { RepositoryFactory } from "../../repositories/RepositoryFactory";
import { databaseConfig } from "../../config/database";
import { RepositoryValidationResult } from "../models";

// Import Postgres repositories to confirm they can be resolved & instantiated
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
} from "../../repositories/postgres/postgresRepositories";

import { PostgresContestRepository } from "../../repositories/postgres/PostgresContestRepository";
import { PostgresEntryRepository } from "../../repositories/postgres/PostgresEntryRepository";
import { PostgresPickRepository } from "../../repositories/postgres/PostgresPickRepository";
import { PostgresWorkflowRepository } from "../../repositories/postgres/PostgresWorkflowRepository";
import { PostgresSnapshotRepository } from "../../repositories/postgres/PostgresSnapshotRepository";

export class RepositoryValidationService {
  /**
   * Validate the repository layer for PostgreSQL cutover readiness
   */
  static validateRepositoryFactory(): RepositoryValidationResult {
    const resolvedRepositories: {
      name: string;
      resolved: boolean;
      type: "mock" | "postgres" | "unknown";
      errorMessage: string | null;
    }[] = [];

    let overallStatus: "HEALTHY" | "WARNING" | "FAILED" = "HEALTHY";
    let mockActive = databaseConfig.useMock;
    let errorMessage: string | null = null;

    // List of standard repository resolution checks
    const targetRepos = [
      { name: "TeamRepository", getter: () => RepositoryFactory.getTeamRepo() },
      { name: "ContestRepository", getter: () => RepositoryFactory.getContestRepo() },
      { name: "ContestLegRepository", getter: () => RepositoryFactory.getLegRepo() },
      { name: "GameRepository", getter: () => RepositoryFactory.getGameRepo() },
      { name: "TeamWeekLineRepository", getter: () => RepositoryFactory.getLineRepo() },
      { name: "SurvivorEntryRepository", getter: () => RepositoryFactory.getEntryRepo() },
      { name: "SurvivorPickRepository", getter: () => RepositoryFactory.getPickRepo() },
      { name: "SurvivorHistoryRepository", getter: () => RepositoryFactory.getHistoryRepo() },
      { name: "WeeklyInputRepository", getter: () => RepositoryFactory.getWeeklyInputRepo() },
      { name: "TeamFeatureRepository", getter: () => RepositoryFactory.getTeamFeatureRepo() },
      { name: "GameFeatureRepository", getter: () => RepositoryFactory.getGameFeatureRepo() },
      { name: "ImportJobRepository", getter: () => RepositoryFactory.getImportJobRepo() },
      { name: "SnapshotRepository", getter: () => RepositoryFactory.getSnapshotRepo() },
      { name: "WorkflowRunRepository", getter: () => RepositoryFactory.getWorkflowRunRepo() }
    ];

    for (const target of targetRepos) {
      try {
        const repoInstance = target.getter();
        if (!repoInstance) {
          throw new Error("Resolved instance is null or undefined");
        }

        const constructorName = repoInstance.constructor.name.toLowerCase();
        let type: "mock" | "postgres" | "unknown" = "unknown";
        if (constructorName.includes("mock")) {
          type = "mock";
        } else if (constructorName.includes("postgres") || constructorName.includes("pg")) {
          type = "postgres";
        }

        resolvedRepositories.push({
          name: target.name,
          resolved: true,
          type,
          errorMessage: null
        });
      } catch (err: any) {
        overallStatus = "FAILED";
        resolvedRepositories.push({
          name: target.name,
          resolved: false,
          type: "unknown",
          errorMessage: err.message
        });
      }
    }

    if (overallStatus === "FAILED") {
      errorMessage = "One or more repository factory bindings could not be resolved.";
    }

    return {
      status: overallStatus,
      resolvedRepositories,
      mockActive,
      errorMessage
    };
  }

  /**
   * Specifically verify mock repository behaviors
   */
  static validateMockRepositories(): boolean {
    try {
      const teamRepo = RepositoryFactory.getTeamRepo();
      return teamRepo.constructor.name.toLowerCase().includes("mock");
    } catch {
      return false;
    }
  }

  /**
   * Specifically verify high-fidelity PostgreSQL repository availability
   */
  static validatePostgresRepositories(): { name: string; classExists: boolean; error: string | null }[] {
    const list = [
      { name: "PostgresTeamRepository", cls: PostgresTeamRepository },
      { name: "PostgresContestRepository", cls: PostgresContestRepository },
      { name: "PostgresContestLegRepository", cls: PostgresContestLegRepository },
      { name: "PostgresGameRepository", cls: PostgresGameRepository },
      { name: "PostgresTeamWeekLineRepository", cls: PostgresTeamWeekLineRepository },
      { name: "PostgresSurvivorHistoryRepository", cls: PostgresSurvivorHistoryRepository },
      { name: "PostgresWeeklyInputRepository", cls: PostgresWeeklyInputRepository },
      { name: "PostgresTeamFeatureRepository", cls: PostgresTeamFeatureRepository },
      { name: "PostgresGameFeatureRepository", cls: PostgresGameFeatureRepository },
      { name: "PostgresImportJobRepository", cls: PostgresImportJobRepository },
      { name: "PostgresEntryRepository", cls: PostgresEntryRepository },
      { name: "PostgresPickRepository", cls: PostgresPickRepository },
      { name: "PostgresWorkflowRepository", cls: PostgresWorkflowRepository },
      { name: "PostgresSnapshotRepository", cls: PostgresSnapshotRepository }
    ];

    return list.map(item => {
      try {
        const instance = new item.cls() as any;
        return {
          name: item.name,
          classExists: typeof item.cls === "function",
          error: instance ? null : "Instance is check null"
        };
      } catch (err: any) {
        return {
          name: item.name,
          classExists: false,
          error: err.message
        };
      }
    });
  }

  /**
   * Verify contracts are correctly fulfilled
   */
  static validateRepositoryContracts(): { contract: string; passed: boolean }[] {
    return [
      { contract: "ITeamRepository", passed: typeof PostgresTeamRepository.prototype.getAll === "function" },
      { contract: "IContestRepository", passed: typeof PostgresContestRepository.prototype.getAll === "function" },
      { contract: "IContestLegRepository", passed: typeof PostgresContestLegRepository.prototype.getAll === "function" },
      { contract: "IGameRepository", passed: typeof PostgresGameRepository.prototype.getAll === "function" },
      { contract: "ITeamWeekLineRepository", passed: typeof PostgresTeamWeekLineRepository.prototype.getAll === "function" },
      { contract: "ISurvivorEntryRepository", passed: typeof PostgresEntryRepository.prototype.getAll === "function" },
      { contract: "ISurvivorPickRepository", passed: typeof PostgresPickRepository.prototype.getAll === "function" },
      { contract: "ISurvivorHistoryRepository", passed: typeof PostgresSurvivorHistoryRepository.prototype.getAll === "function" },
      { contract: "ISnapshotRepository", passed: typeof PostgresSnapshotRepository.prototype.getWeeklySnapshot === "function" }
    ];
  }
}
