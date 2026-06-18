import { PostgresConnectionManager } from "../connection/PostgresConnectionManager";
import { MigrationRunner } from "../migrations/MigrationRunner";
import { databaseConfig } from "../../config/database";
import { migrationRegistry } from "../migrations/MigrationRegistry";

export interface DatabaseHealthStatus {
  status: "healthy" | "unhealthy" | "degraded" | "disabled";
  mode: "postgres" | "mock";
  connection: {
    status: "online" | "offline" | "disabled";
    latencyMs?: number;
    error?: string;
  };
  migrations: {
    activeVersion: string;
    registryVersion: string;
    status: "up-to-date" | "pending" | "unknown" | "mock";
  };
  pool: {
    totalConnections: number;
    idleConnections: number;
    waitingConnections: number;
    maxLimit: number;
    minLimit: number;
  };
}

export class DatabaseHealthService {
  /**
   * Safe, non-throwing diagnostic utility measuring connection status, migration state, and pool metrics.
   */
  static async checkHealth(): Promise<DatabaseHealthStatus> {
    const isMock = databaseConfig.useMock;
    const registryVersion = migrationRegistry[migrationRegistry.length - 1]?.version || "V001";

    if (isMock) {
      return {
        status: "healthy",
        mode: "mock",
        connection: { status: "disabled" },
        migrations: { activeVersion: "mock", registryVersion, status: "mock" },
        pool: { totalConnections: 0, idleConnections: 0, waitingConnections: 0, maxLimit: 0, minLimit: 0 }
      };
    }

    const manager = PostgresConnectionManager.getInstance();
    const metrics = manager.getPoolMetrics();
    
    let connectionStatus: "online" | "offline" = "offline";
    let latencyMs: number | undefined;
    let errMessage: string | undefined;
    
    // Test connectivity
    const start = Date.now();
    let isConnected = false;
    try {
      isConnected = await manager.testConnection();
      if (isConnected) {
        connectionStatus = "online";
        latencyMs = Date.now() - start;
      } else {
        errMessage = "Ping returned empty or invalid response";
      }
    } catch (e: any) {
      errMessage = e.message || String(e);
    }

    // Investigate applied schema migrations
    let activeVersion = "unknown";
    let migrationStatus: "up-to-date" | "pending" | "unknown" = "unknown";
    
    if (isConnected) {
      try {
        activeVersion = await MigrationRunner.getCurrentVersion();
        migrationStatus = activeVersion === registryVersion ? "up-to-date" : "pending";
      } catch (e) {
        console.error("[DatabaseHealthService] Failed checking current schema version:", e);
      }
    }

    // Determine overall service status
    let serviceStatus: "healthy" | "degraded" | "unhealthy" = "healthy";
    if (connectionStatus === "offline") {
      serviceStatus = "unhealthy";
    } else if (migrationStatus === "pending") {
      serviceStatus = "degraded";
    }

    return {
      status: serviceStatus,
      mode: "postgres",
      connection: {
        status: connectionStatus,
        latencyMs,
        error: errMessage
      },
      migrations: {
        activeVersion,
        registryVersion,
        status: migrationStatus
      },
      pool: {
        totalConnections: metrics.totalCount,
        idleConnections: metrics.idleCount,
        waitingConnections: metrics.waitingCount,
        maxLimit: databaseConfig.poolMax,
        minLimit: databaseConfig.poolMin
      }
    };
  }
}
