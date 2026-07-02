import dotenv from "dotenv";
dotenv.config();

import { PostgresConnectionManager } from "../backend/database/connection/PostgresConnectionManager";
import { databaseConfig } from "../backend/config/database";

async function runValidation() {
  console.log("[DB Validation] Starting database seed relationship integrity check...");
  
  if (databaseConfig.useMock) {
    console.error("[DB Validation] Error: Database is running in Mock Mode, but relational PostgreSQL mode is required for this validation.");
    process.exit(1);
  }

  try {
    const manager = PostgresConnectionManager.getInstance();
    const isConnected = await manager.testConnection();
    if (!isConnected) {
      console.error("[DB Validation] Error: Cannot establish connection to PostgreSQL.");
      process.exit(1);
    }

    let failed = false;

    // 1. Check weekly_inputs.team_id
    const q1 = await manager.query("SELECT COUNT(*) as count FROM weekly_inputs WHERE team_id NOT IN (SELECT id FROM teams);");
    const count1 = parseInt(q1[0]?.count || "0", 10);
    if (count1 > 0) {
      console.error(`[DB Validation] FAIL: Found ${count1} orphaned records in weekly_inputs with invalid team_id.`);
      failed = true;
    } else {
      console.log("[DB Validation] PASS: weekly_inputs.team_id references valid teams.id");
    }

    // 2. Check team_features.team_id
    const q2 = await manager.query("SELECT COUNT(*) as count FROM team_features WHERE team_id NOT IN (SELECT id FROM teams);");
    const count2 = parseInt(q2[0]?.count || "0", 10);
    if (count2 > 0) {
      console.error(`[DB Validation] FAIL: Found ${count2} orphaned records in team_features with invalid team_id.`);
      failed = true;
    } else {
      console.log("[DB Validation] PASS: team_features.team_id references valid teams.id");
    }

    // 3. Check game_features.game_id
    const q3 = await manager.query("SELECT COUNT(*) as count FROM game_features WHERE game_id IS NOT NULL AND game_id NOT IN (SELECT id FROM games);");
    const count3 = parseInt(q3[0]?.count || "0", 10);
    if (count3 > 0) {
      console.error(`[DB Validation] FAIL: Found ${count3} orphaned records in game_features with invalid game_id.`);
      failed = true;
    } else {
      console.log("[DB Validation] PASS: game_features.game_id references valid games.id");
    }

    // 4. Check game_features.home_team_id
    const q4 = await manager.query("SELECT COUNT(*) as count FROM game_features WHERE home_team_id NOT IN (SELECT id FROM teams);");
    const count4 = parseInt(q4[0]?.count || "0", 10);
    if (count4 > 0) {
      console.error(`[DB Validation] FAIL: Found ${count4} orphaned records in game_features with invalid home_team_id.`);
      failed = true;
    } else {
      console.log("[DB Validation] PASS: game_features.home_team_id references valid teams.id");
    }

    // 5. Check game_features.away_team_id
    const q5 = await manager.query("SELECT COUNT(*) as count FROM game_features WHERE away_team_id NOT IN (SELECT id FROM teams);");
    const count5 = parseInt(q5[0]?.count || "0", 10);
    if (count5 > 0) {
      console.error(`[DB Validation] FAIL: Found ${count5} orphaned records in game_features with invalid away_team_id.`);
      failed = true;
    } else {
      console.log("[DB Validation] PASS: game_features.away_team_id references valid teams.id");
    }

    // 6. Check total team_aliases count
    const qCount = await manager.query("SELECT COUNT(*) as count FROM team_aliases WHERE active = TRUE;");
    const totalAliases = parseInt(qCount[0]?.count || "0", 10);
    if (totalAliases < 100) {
      console.error(`[DB Validation] FAIL: team_aliases count is below 100 (Found: ${totalAliases}).`);
      failed = true;
    } else {
      console.log(`[DB Validation] PASS: team_aliases count is ${totalAliases}, which is >= 100.`);
    }

    // 7. Check specific alias resolution mappings
    const mappingsToCheck = [
      { alias: "Kansas City Chiefs", expected: "kc" },
      { alias: "KC", expected: "kc" },
      { alias: "ARI", expected: "ari" },
      { alias: "bal", expected: "bal" },
      { alias: "nyg", expected: "nyg" },
      { alias: "buf", expected: "buf" },
      { alias: "Philadelphia Eagles", expected: "phi" },
      { alias: "Detroit Lions", expected: "det" }
    ];

    for (const item of mappingsToCheck) {
      const norm = item.alias.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
      const q = await manager.query(
        "SELECT team_id FROM team_aliases WHERE normalized_alias = $1 AND active = TRUE ORDER BY CASE WHEN provider_name IS NULL THEN 2 ELSE 1 END LIMIT 1;",
        [norm]
      );
      const teamId = q[0]?.team_id;
      if (teamId !== item.expected) {
        console.error(`[DB Validation] FAIL: Alias '${item.alias}' (normalized: '${norm}') did not resolve to '${item.expected}'. Found: '${teamId || "NULL"}'`);
        failed = true;
      } else {
        console.log(`[DB Validation] PASS: Alias '${item.alias}' successfully resolved to canonical ID '${item.expected}'`);
      }
    }

    // 8. Owner-entry persistence validation
    const nullOwners = await manager.query(
      "SELECT COUNT(*) as count FROM survivor_entries WHERE owner_id IS NULL;"
    );
    const nullOwnerCount = parseInt(nullOwners[0]?.count || "0", 10);
    if (nullOwnerCount > 0) {
      console.error(`[DB Validation] FAIL: survivor_entries contains ${nullOwnerCount} NULL owner_id values.`);
      failed = true;
    } else {
      console.log("[DB Validation] PASS: survivor_entries.owner_id contains no NULL values.");
    }

    const invalidOwners = await manager.query(
      "SELECT COUNT(*) as count FROM survivor_entries se LEFT JOIN owners o ON se.owner_id = o.id WHERE se.owner_id IS NOT NULL AND o.id IS NULL;"
    );
    const invalidOwnerCount = parseInt(invalidOwners[0]?.count || "0", 10);
    if (invalidOwnerCount > 0) {
      console.error(`[DB Validation] FAIL: Found ${invalidOwnerCount} survivor_entries with invalid owner_id references.`);
      failed = true;
    } else {
      console.log("[DB Validation] PASS: All survivor_entries.owner_id values reference valid owners.");
    }

    const expectedOwnerMappings = [
      { name: "UWOSH-1", ownerId: "owner-steve" },
      { name: "UWOSH-2", ownerId: "owner-steve" },
      { name: "UWOSH-3", ownerId: "owner-cameron" },
      { name: "UWOSH-4", ownerId: "owner-uw-oshkosh" }
    ];

    for (const item of expectedOwnerMappings) {
      const rows = await manager.query(
        "SELECT owner_id FROM survivor_entries WHERE name = $1 LIMIT 1;",
        [item.name]
      );
      const ownerId = rows[0]?.owner_id;
      if (ownerId !== item.ownerId) {
        console.error(`[DB Validation] FAIL: ${item.name} assigned to '${ownerId || "NULL"}' instead of '${item.ownerId}'.`);
        failed = true;
      } else {
        console.log(`[DB Validation] PASS: ${item.name} assigned to ${item.ownerId}.`);
      }
    }

    const expectedOwnerCounts = [
      { ownerId: "owner-steve", expected: 2, label: "Steve" },
      { ownerId: "owner-cameron", expected: 1, label: "Cameron" },
      { ownerId: "owner-uw-oshkosh", expected: 1, label: "UW Oshkosh Group" }
    ];

    for (const item of expectedOwnerCounts) {
      const rows = await manager.query(
        "SELECT COUNT(*) as count FROM survivor_entries WHERE owner_id = $1;",
        [item.ownerId]
      );
      const count = parseInt(rows[0]?.count || "0", 10);
      if (count !== item.expected) {
        console.error(`[DB Validation] FAIL: ${item.label} owns ${count} survivor entries; expected ${item.expected}.`);
        failed = true;
      } else {
        console.log(`[DB Validation] PASS: ${item.label} owns exactly ${item.expected} survivor entries.`);
      }
    }

    if (failed) {
      console.error("[DB Validation] Validation completed with ERRORS. Seed integrity is broken.");
      process.exit(1);
    } else {
      console.log("[DB Validation] Database seed relationship integrity verification PASSED successfully.");
      process.exit(0);
    }
  } catch (err: any) {
    console.error("[DB Validation] Unexpected validation failure:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

runValidation();
