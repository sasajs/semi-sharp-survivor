import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import apiRouter from "./backend/routes/api";
import { buildAndSeedMockState } from "./backend/services/mockSeeder";
import { databaseConfig } from "./backend/config/database";
import { runMigrations } from "./backend/database/migrations/runMigrations";
import { seedDatabase } from "./backend/database/seed/seedData";
import { ApplicationLifecycleService } from "./backend/system/services/ApplicationLifecycleService";
import { PostgresConnectionManager } from "./backend/database/connection/PostgresConnectionManager";
import { updateUseMock } from "./backend/repositories/index";

const app = reportMissingTypeInjections(express());
app.use(express.json());
const PORT = 3000;

// Helper to keep typescript happy with custom routing wrappers if needed
function reportMissingTypeInjections(e: any) { return e; }

async function bootstrapDatabase() {
  const curUseMock = databaseConfig.useMock;
  const curAuthEnabled = process.env.AUTH_ENABLED === "true";
  const repoMode = curUseMock ? "IN-MEMORY MOCK" : "RELATIONAL POSTGRES";

  console.log("=========================================");
  console.log("     SEMI-SHARP SERVER BOOTSTRAP         ");
  console.log("=========================================");
  console.log(`- USE_MOCK value          : ${process.env.USE_MOCK ?? "undefined (defaulting to true)"}`);
  console.log(`- USE_MOCK_DATA value     : ${process.env.USE_MOCK_DATA ?? "undefined"}`);
  console.log(`- AUTH_ENABLED value      : ${curAuthEnabled}`);
  console.log(`- Repository mode selected: ${repoMode}`);
  console.log(`- Postgres initialization : ${curUseMock ? "SKIPPED" : "ENABLED"}`);
  console.log("=========================================");

  if (curUseMock) {
    console.log("[Semi-Sharp V2 Server] Running in memory-mock mode. Seeding defaults...");
    buildAndSeedMockState();
  } else {
    console.log("[Semi-Sharp V2 Server] Running in PostgreSQL mode. Testing connection & running migrations...");
    try {
      // 1. Connectivity test - fails fast if DB is down
      const manager = PostgresConnectionManager.getInstance();
      const connected = await manager.testConnection();
      if (!connected) {
        throw new Error("Unable to establish communication with target PostgreSQL database.");
      }

      // 2. Run migrations
      await runMigrations();

      // 3. Seed configurations
      await seedDatabase();
      console.log("[Database] PostgreSQL connection, migrations, and seeding completed successfully.");
    } catch (err: any) {
      console.error("[Database Error] Startup SQL initializations have failed:", err.message);
      
      const isProduction = process.env.NODE_ENV === "production";
      if (isProduction) {
        console.error("[Database Degraded] Running in PRODUCTION mode under strict persistence constraints. Entering DEGRADED mode.");
        // Mark database connection as offline / degraded without exiting
        PostgresConnectionManager.getInstance().setFallbackMode(true);
      } else {
        console.warn("[Database Fallback] Non-production environment detected. Activating mock persistence as dynamic fallback.");
        PostgresConnectionManager.getInstance().setFallbackMode(true);
        databaseConfig.useMock = true;
        updateUseMock(true);
        buildAndSeedMockState();
      }
    }
  }

  // Initialize Application Lifecycle tracking
  try {
    await ApplicationLifecycleService.initializeLifecycle();
  } catch (err) {
    console.error("[Lifecycle Init Warning] Failed to initialize system lifecycle:", err);
  }
}

// Kickstart database and lifecycle setup
bootstrapDatabase();

// Bind API routing structure
app.use("/api", apiRouter);

// ==========================================
// VITE DEV SERVER / STATIC ASSETS PIPELINE
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Semi-Sharp V2 Server] Access the app at http://localhost:${PORT}`);
  });
}

startServer();
export default app;
