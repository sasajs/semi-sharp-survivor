import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import apiRouter from "./backend/routes/api";
import { buildAndSeedMockState } from "./backend/services/mockSeeder";
import { useMock } from "./backend/repositories/index";
import { runMigrations } from "./backend/database/migrations/runMigrations";
import { seedDatabase } from "./backend/database/seed/seedData";
import { ApplicationLifecycleService } from "./backend/system/services/ApplicationLifecycleService";

const app = express();
app.use(express.json());
const PORT = 3000;

// Seed the mock database layers with default NFL teams and week parameters on launch!
if (useMock) {
  buildAndSeedMockState();
} else {
  console.log("[Semi-Sharp V2 Server] Running in PostgreSQL mode. Initializing database schema...");
  runMigrations()
    .then(() => seedDatabase())
    .then(() => {
      console.log("[Database] PostgreSQL schema migration and seeding complete.");
    })
    .catch((err) => {
      console.warn("[Database Warning] Graceful startup note: PostgreSQL failed to connect on boot. This is expected if the container/service is starting. Details:", err.message);
    });
}

// Initialize Application Lifecycle tracking and perform startup validation checks
ApplicationLifecycleService.initializeLifecycle()
  .catch(err => {
    console.error("[Lifecycle Init Warning] Failed to initialize system lifecycle:", err);
  });

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
