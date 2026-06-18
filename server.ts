import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import apiRouter from "./backend/routes/api";
import { buildAndSeedMockState } from "./backend/services/mockSeeder";
import { useMock } from "./backend/repositories/index";
import { runMigrations } from "./backend/database/migrations/runMigrations";
import { seedDatabase } from "./backend/database/seed/seedData";
import { ApplicationLifecycleService } from "./backend/system/services/ApplicationLifecycleService";
import { PostgresConnectionManager } from "./backend/database/connection/PostgresConnectionManager";

const app = express();
app.use(express.json());
const PORT = 3000;

async function bootstrapDatabase() {
  if (useMock) {
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
      console.error("[Database Fatal] Startup SQL initializations have failed:", err.message);
      console.error("[Database Fatal] Halting application server execution per strict persistence constraints.");
      process.exit(1);
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
