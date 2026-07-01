import dotenv from "dotenv";
dotenv.config();

const port = process.env.PORT || "3000";
const url = `http://localhost:${port}`;

async function runApiValidation() {
  console.log(`[API Validation] Starting API endpoint verification against local server at ${url}...`);

  try {
    // 1. Verify /api/entries
    console.log("[API Validation] Verifying /api/entries...");
    const resEntries = await fetch(`${url}/api/entries`);
    if (!resEntries.ok) {
      throw new Error(`/api/entries returned status ${resEntries.status}`);
    }
    const entries = await resEntries.json();
    if (!Array.isArray(entries) || entries.length === 0) {
      throw new Error(`/api/entries returned non-array or empty results. Count: ${Array.isArray(entries) ? entries.length : "N/A"}`);
    }
    console.log(`[API Validation] PASS: /api/entries returned ${entries.length} entries.`);

    // 2. Verify /api/owners (returns non-empty owners if owners are required)
    console.log("[API Validation] Verifying /api/owners...");
    const resOwners = await fetch(`${url}/api/owners`);
    if (!resOwners.ok) {
      throw new Error(`/api/owners returned status ${resOwners.status}`);
    }
    const owners = await resOwners.json();
    if (!Array.isArray(owners) || owners.length === 0) {
      throw new Error(`/api/owners returned non-array or empty results. Count: ${Array.isArray(owners) ? owners.length : "N/A"}`);
    }
    console.log(`[API Validation] PASS: /api/owners returned ${owners.length} owners.`);

    // 3. Verify /api/contest-types includes CIRCA and STANDARD
    console.log("[API Validation] Verifying /api/contest-types...");
    const resContestTypes = await fetch(`${url}/api/contest-types`);
    if (!resContestTypes.ok) {
      throw new Error(`/api/contest-types returned status ${resContestTypes.status}`);
    }
    const contestTypes = await resContestTypes.json();
    if (!Array.isArray(contestTypes)) {
      throw new Error(`/api/contest-types is not an array`);
    }
    const hasCirca = contestTypes.some((ct: any) => 
      ct.id?.toUpperCase() === "CIRCA" || 
      ct.name?.toUpperCase().includes("CIRCA")
    );
    const hasStandard = contestTypes.some((ct: any) => 
      ct.id?.toUpperCase() === "STANDARD" || 
      ct.name?.toUpperCase().includes("STANDARD")
    );
    if (!hasCirca || !hasStandard) {
      throw new Error(`/api/contest-types missing CIRCA or STANDARD. Found: ${JSON.stringify(contestTypes)}`);
    }
    console.log("[API Validation] PASS: /api/contest-types includes CIRCA and STANDARD.");

    // 4. Verify /api/roadmaps
    console.log("[API Validation] Verifying /api/roadmaps...");
    const resRoadmaps = await fetch(`${url}/api/roadmaps`);
    if (!resRoadmaps.ok) {
      throw new Error(`/api/roadmaps returned status ${resRoadmaps.status}`);
    }
    const roadmaps = await resRoadmaps.json();
    if (typeof roadmaps !== "object" || roadmaps === null) {
      throw new Error(`/api/roadmaps returned invalid data type (expected object/dictionary).`);
    }
    console.log("[API Validation] PASS: /api/roadmaps returned valid roadmap dictionary.");

    // 5. Verify /api/recommendations with 400-tolerant behavior
    console.log("[API Validation] Verifying /api/recommendations...");
    const resRecs = await fetch(`${url}/api/recommendations`);
    if (resRecs.status !== 200 && resRecs.status !== 400) {
      throw new Error(`/api/recommendations returned unexpected status ${resRecs.status}, expected 200 or 400.`);
    }
    console.log(`[API Validation] PASS: /api/recommendations is 400-tolerant when called without params (status: ${resRecs.status}).`);

    // 6. Verify Health/status endpoint reports PostgreSQL mode when USE_MOCK=false
    const useMockEnv = process.env.USE_MOCK;
    if (useMockEnv === "false" || useMockEnv === "0") {
      console.log("[API Validation] Verifying system health and status under PostgreSQL mode...");
      const resHealth = await fetch(`${url}/api/system/health`);
      if (!resHealth.ok) {
        throw new Error(`/api/system/health returned status ${resHealth.status}`);
      }
      const health = await resHealth.json();
      const dbStatusObj = health.services?.database;
      if (!dbStatusObj) {
        throw new Error("/api/system/health does not contain services.database health block.");
      }
      if (dbStatusObj.status === "mock") {
        throw new Error("/api/system/health reports database mode as 'mock', but 'postgres' is expected since USE_MOCK=false.");
      }
      console.log(`[API Validation] PASS: Health reports PostgreSQL mode (status is '${dbStatusObj.status}').`);
    } else {
      console.log("[API Validation] Skipping PostgreSQL mode health check because USE_MOCK is true or unset.");
    }

    console.log("[API Validation] All API content checks completed successfully!");
    process.exit(0);
  } catch (err: any) {
    console.error("[API Validation] FAIL:", err.message);
    process.exit(1);
  }
}

runApiValidation();
