import pg from "pg";
import { databaseConfig } from "../../config/database";

const { Pool } = pg;

export class PostgresConnectionManager {
  private static instance: PostgresConnectionManager | null = null;
  private pool: pg.Pool | null = null;
  private isInitialized = false;
  private fallbackMode = false;

  private constructor() {}

  /**
   * Singleton accessor.
   */
  public static getInstance(): PostgresConnectionManager {
    if (!PostgresConnectionManager.instance) {
      PostgresConnectionManager.instance = new PostgresConnectionManager();
    }
    return PostgresConnectionManager.instance;
  }

  /**
   * Check if Postgres is in fallback mode.
   */
  public isFallbackMode(): boolean {
    return this.fallbackMode;
  }

  /**
   * Enable or disable fallback mode.
   */
  public setFallbackMode(enabled: boolean): void {
    this.fallbackMode = enabled;
  }

  /**
   * Instantiates the raw pg Pool.
   */
  public initialize(): pg.Pool {
    if (databaseConfig.useMock) {
      if (!this.pool) {
        console.log("[PostgresConnectionManager] Mock mode is active. Skipping physical PostgreSQL connection pool initialization.");
        this.pool = {
          query: async () => { throw new Error("Pool query called in mock mode"); },
          connect: async () => { throw new Error("Pool connect called in mock mode"); },
          on: () => {},
          end: async () => {},
          totalCount: 0,
          idleCount: 0,
          waitingCount: 0,
        } as unknown as pg.Pool;
        this.isInitialized = true;
      }
      return this.pool;
    }

    if (this.pool) {
      return this.pool;
    }

    console.log("[PostgresConnectionManager] Initializing relational connection pool...");
    
    const sslConfig = databaseConfig.databaseUrl.includes("supabase") ||
                      databaseConfig.databaseUrl.includes("render") ||
                      process.env.PG_SSL === "true"
                        ? { rejectUnauthorized: false }
                        : undefined;

    this.pool = new Pool({
      connectionString: databaseConfig.databaseUrl,
      min: databaseConfig.poolMin,
      max: databaseConfig.poolMax,
      connectionTimeoutMillis: databaseConfig.connectTimeout,
      ssl: sslConfig
    });

    this.pool.on("error", (err) => {
      console.error("[PostgresConnectionManager] Unexpected relational pool error:", err);
    });

    this.isInitialized = true;
    return this.pool;
  }

  /**
   * Get direct client pool.
   */
  public getPool(): pg.Pool {
    return this.initialize();
  }

  /**
   * Safe closure of connections to support application lifecycle graceful stops.
   */
  public async closePool(): Promise<void> {
    if (this.pool) {
      console.log("[PostgresConnectionManager] Draining active database connections...");
      await this.pool.end();
      this.pool = null;
      this.isInitialized = false;
      console.log("[PostgresConnectionManager] Relational connection pool shut down.");
    }
  }

  /**
   * Primary query execution helper support with automatic retry loops.
   */
  public async query<T = any>(queryText: string, params?: any[], retryCount = 1): Promise<T[]> {
    if (databaseConfig.useMock) {
      throw new Error("[Database Error] Relational query execution attempted while the application is in Mock Mode.");
    }
    this.initialize();
    let lastError: any = null;

    for (let attempt = 1; attempt <= retryCount + 1; attempt++) {
      try {
        const start = Date.now();
        const res = await this.pool!.query(queryText, params);
        const duration = Date.now() - start;
        
        if (process.env.DEBUG_SQL === "true") {
          console.log(`[SQL] Executed: ${queryText.substring(0, 120).replace(/\n/g, ' ')}${queryText.length > 120 ? '...' : ''} | duration: ${duration}ms | rows: ${res.rowCount}`);
        }
        
        return res.rows;
      } catch (err: any) {
        lastError = err;
        console.warn(`[Database Retry] Query execution attempt ${attempt} failed: ${err.message}`);
        
        const isConnectionError = 
          err.message?.includes("ECONNREFUSED") || 
          err.message?.includes("connection") || 
          err.code === "ECONNREFUSED" || 
          err.message?.includes("pool");
        
        if (isConnectionError) {
          this.fallbackMode = true;
        }

        if (attempt <= retryCount) {
          // Delay next attempt proportionally
          await new Promise(resolve => setTimeout(resolve, 300 * attempt));
        }
      }
    }

    throw lastError;
  }

  /**
   * Connectivity test routine.
   */
  public async testConnection(): Promise<boolean> {
    if (databaseConfig.useMock) {
      console.log("[PostgresConnectionManager] Skipping physical PostgreSQL connectivity test in mock mode.");
      return false;
    }
    try {
      const res = await this.query("SELECT 1 AS ok");
      return res && res.length > 0 && res[0].ok === 1;
    } catch (err: any) {
      console.error("[PostgresConnectionManager] Connectivity verification failed:", err);
      this.fallbackMode = true;
      return false;
    }
  }

  /**
   * Pull pools statistics.
   */
  public getPoolMetrics() {
    const p = this.pool;
    if (!p) {
      return { totalCount: 0, idleCount: 0, waitingCount: 0 };
    }
    return {
      totalCount: p.totalCount,
      idleCount: p.idleCount,
      waitingCount: p.waitingCount
    };
  }
}

/**
 * Global direct-exported query utility preserving parity with earlier implementations.
 */
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  return PostgresConnectionManager.getInstance().query<T>(text, params);
}
