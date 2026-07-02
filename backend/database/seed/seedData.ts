import { query } from "../connection";
import { 
  initialTeams, 
  initialContests, 
  initialLegs, 
  initialEntries, 
  initialPicks 
} from "../../services/mockSeeder";
import { Team, Contest, ContestLeg, Game, TeamWeekLine, SurvivorEntry, SurvivorPick } from "../../../src/types";

// Dynamic UUID Mapping generator for UUID compatibility with database schema constraints
export function toUuid(id: string, type: "contest" | "leg" | "entry" | "pick" | "game" | "line"): string {
  if (id.length === 36 && id.includes("-")) {
    return id;
  }
  if (id === "circa-2026") {
    return "20262026-c17c-4c0a-bd6e-000000000001";
  }
  if (id === "UWOSH-1") {
    return "22222222-2222-4222-c222-000000000101";
  }
  if (id === "UWOSH-2") {
    return "22222222-2222-4222-c222-000000000102";
  }
  if (id === "UWOSH-3") {
    return "22222222-2222-4222-c222-000000000103";
  }
  if (id === "UWOSH-4") {
    return "22222222-2222-4222-c222-000000000104";
  }
  if (id.startsWith("leg-")) {
    const num = parseInt(id.replace("leg-", ""), 10);
    return `11111111-1111-4111-b111-${num.toString().padStart(12, "0")}`;
  }
  if (id.startsWith("entry-")) {
    const num = parseInt(id.replace("entry-", ""), 10);
    return `22222222-2222-4222-c222-${num.toString().padStart(12, "0")}`;
  }
  if (id.startsWith("p")) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash);
    return `33333333-3333-4333-b333-${absHash.toString().padStart(12, "0")}`;
  }
  if (id.startsWith("g-")) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash);
    return `44444444-4444-4444-b444-${absHash.toString().padStart(12, "0")}`;
  }
  if (id.startsWith("line-")) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash);
    return `55555555-5555-4555-b555-${absHash.toString().padStart(12, "0")}`;
  }

  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);
  return `00000000-0000-4000-b000-${absHash.toString().padStart(12, "0")}`;
}

export async function seedDatabase() {
  console.log("[Seeder] Starting PostgreSQL seeding...");

  try {
    // 1. Dependent Deletions to clear database for reseeding
    await query("DELETE FROM championship_plans CASCADE");
    await query("DELETE FROM survivor_plans CASCADE");
    await query("DELETE FROM survivor_history CASCADE");
    await query("DELETE FROM survivor_picks CASCADE");
    await query("DELETE FROM survivor_entries CASCADE");
    await query("DELETE FROM team_week_lines CASCADE");
    await query("DELETE FROM games CASCADE");
    await query("DELETE FROM contest_legs CASCADE");
    await query("DELETE FROM contests CASCADE");
    await query("DELETE FROM teams CASCADE");

    console.log("[Seeder] Cleaned existing database rows.");

    // 2. Insert Teams
    for (const t of initialTeams) {
      await query(
        `INSERT INTO teams (id, name, abbreviation, bye_week, primary_color, secondary_color) 
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET 
           name = EXCLUDED.name, abbreviation = EXCLUDED.abbreviation, 
           bye_week = EXCLUDED.bye_week, primary_color = EXCLUDED.primary_color, 
           secondary_color = EXCLUDED.secondary_color`,
        [t.id, t.name, t.abbreviation, t.bye_week, t.primary_color, t.secondary_color]
      );
    }
    console.log(`[Seeder] Seeded ${initialTeams.length} NFL Teams.`);

    // 2.5. Insert Team Aliases
    const addedAliases = new Set<string>();
    const aliasesToInsert: { team_id: string; alias: string; normalized_alias: string; alias_type: string }[] = [];

    const addAlias = (teamId: string, alias: string, type: string) => {
      const norm = alias.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!norm) return;
      const key = `${norm}:null`;
      if (addedAliases.has(key)) return;
      addedAliases.add(key);
      aliasesToInsert.push({
        team_id: teamId,
        alias,
        normalized_alias: norm,
        alias_type: type
      });
    };

    for (const t of initialTeams) {
      addAlias(t.id, t.id, "common");
      addAlias(t.id, t.abbreviation, "abbreviation");
      addAlias(t.id, t.name, "full_name");
      
      const spaceIdx = t.name.lastIndexOf(' ');
      if (spaceIdx > 0) {
        const city = t.name.substring(0, spaceIdx);
        const nickname = t.name.substring(spaceIdx + 1);
        addAlias(t.id, city, "city");
        addAlias(t.id, nickname, "nickname");
      }
    }

    const extraVariants = [
      { teamId: "ari", alias: "AZ", type: "abbreviation" },
      { teamId: "ari", alias: "Ariz", type: "historical" },
      { teamId: "gb", alias: "GNB", type: "abbreviation" },
      { teamId: "jax", alias: "JAC", type: "abbreviation" },
      { teamId: "kc", alias: "KAN", type: "abbreviation" },
      { teamId: "lv", alias: "LVR", type: "abbreviation" },
      { teamId: "lv", alias: "Vegas Raiders", type: "common" },
      { teamId: "lv", alias: "Oakland Raiders", type: "historical" },
      { teamId: "lac", alias: "LA Chargers", type: "common" },
      { teamId: "lac", alias: "San Diego Chargers", type: "historical" },
      { teamId: "lac", alias: "SD", type: "abbreviation" },
      { teamId: "lar", alias: "LA Rams", type: "common" },
      { teamId: "lar", alias: "St Louis Rams", type: "historical" },
      { teamId: "lar", alias: "STL", type: "abbreviation" },
      { teamId: "ne", alias: "NWE", type: "abbreviation" },
      { teamId: "no", alias: "NOR", type: "abbreviation" },
      { teamId: "sf", alias: "SFO", type: "abbreviation" },
      { teamId: "sf", alias: "Niners", type: "nickname" },
      { teamId: "tb", alias: "TBB", type: "abbreviation" },
      { teamId: "tb", alias: "Bucs", type: "nickname" },
      { teamId: "ten", alias: "Houston Oilers", type: "historical" },
      { teamId: "was", alias: "WSH", type: "abbreviation" },
      { teamId: "was", alias: "Washington Football Team", type: "historical" },
      { teamId: "was", alias: "Football Team", type: "nickname" },
      { teamId: "was", alias: "Redskins", type: "historical" }
    ];

    for (const v of extraVariants) {
      addAlias(v.teamId, v.alias, v.type);
    }

    for (const a of aliasesToInsert) {
      await query(
        `INSERT INTO team_aliases (team_id, alias, normalized_alias, alias_type, provider_name, active)
         VALUES ($1, $2, $3, $4, NULL, TRUE)
         ON CONFLICT (normalized_alias, provider_name) DO NOTHING`,
        [a.team_id, a.alias, a.normalized_alias, a.alias_type]
      );
    }
    console.log(`[Seeder] Seeded ${aliasesToInsert.length} Team Aliases.`);

    // 3. Insert Contest
    const contest = initialContests[0];
    const contestUuid = toUuid(contest.id, "contest");
    await query(
      `INSERT INTO contests (id, name, year, status) VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      [contestUuid, contest.name, contest.year, contest.status]
    );

    // 4. Insert Contest Legs
    for (const leg of initialLegs) {
      const legUuid = toUuid(leg.id, "leg");
      await query(
        `INSERT INTO contest_legs (id, contest_id, name, leg_type, display_order, nfl_week) 
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [legUuid, contestUuid, leg.name, leg.leg_type, leg.display_order, leg.nfl_week]
      );
    }
    console.log(`[Seeder] Seeded ${initialLegs.length} Contest Legs.`);

    // 5. Generate games and team_week_lines exactly matches mockSeeder algorithms
    const gamesToInsert: Game[] = [];
    const linesToInsert: TeamWeekLine[] = [];

    initialLegs.forEach((leg, idx) => {
      const legNum = idx + 1;
      for (let i = 0; i < 16; i++) {
        const homeIdx = (i * 2 + legNum) % 32;
        const awayIdx = (i * 2 + 1 + legNum) % 32;
        const homeTeam = initialTeams[homeIdx];
        const awayTeam = initialTeams[awayIdx];

        const gId = `g-${leg.id}-${i}`;
        
        let homeScore: number | undefined;
        let awayScore: number | undefined;
        let status: "scheduled" | "final" = "scheduled";

        if (legNum < 5) {
          status = "final";
          if (legNum === 2 && homeTeam.id === "ari" && awayTeam.id === "lar") {
            homeScore = 20;
            awayScore = 20;
          } else {
            homeScore = 20 + Math.floor(Math.random() * 20);
            awayScore = 20 + Math.floor(Math.random() * 20);
            if (homeScore === awayScore) homeScore += 3;
          }
        }
        
        gamesToInsert.push({
          id: gId,
          contest_leg_id: leg.id,
          home_team_id: homeTeam.id,
          away_team_id: awayTeam.id,
          home_score: homeScore,
          away_score: awayScore,
          status,
          game_time: "Sunday 1:00 PM"
        });
      }

      initialTeams.forEach((team) => {
        let win_probability = 0.45 + (Math.sin(team.name.length + legNum) * 0.35);
        win_probability = Math.max(0.2, Math.min(0.93, win_probability));

        let pick_popularity = 0.02 + (Math.cos(team.name.length * 2 + legNum) * 0.15);
        pick_popularity = Math.max(0.001, Math.min(0.35, pick_popularity));

        let future_value = 0.5 + (Math.sin(team.name.length * 3) * 0.4);
        if (["kc", "sf", "bal", "phi", "buf", "det"].includes(team.id)) {
          future_value = Math.max(0.7, future_value);
        }
        future_value = Math.max(0.1, Math.min(0.98, future_value));

        const leverage_multiplier = parseFloat((1.5 - pick_popularity).toFixed(2));
        const future_value_multiplier = parseFloat((1.1 - future_value).toFixed(2));

        let holiday_safety_multiplier = 1.0;
        if (leg.leg_type === "thanksgiving" && ["det", "dal", "chi"].includes(team.id)) {
          holiday_safety_multiplier = 1.25;
        } else if (leg.leg_type === "christmas" && ["kc", "sf", "bal", "lar"].includes(team.id)) {
          holiday_safety_multiplier = 1.3;
        }

        const rawEquity = win_probability * leverage_multiplier * future_value_multiplier * holiday_safety_multiplier;
        const contest_equity_score = parseFloat(rawEquity.toFixed(3));

        linesToInsert.push({
          id: `line-${leg.id}-${team.id}`,
          team_id: team.id,
          contest_leg_id: leg.id,
          win_probability: parseFloat(win_probability.toFixed(3)),
          pick_popularity: parseFloat(pick_popularity.toFixed(3)),
          future_value: parseFloat(future_value.toFixed(3)),
          leverage_multiplier,
          future_value_multiplier,
          holiday_safety_multiplier,
          contest_equity_score
        });
      });
    });

    // 6. Insert Games
    for (const g of gamesToInsert) {
      const gUuid = toUuid(g.id, "game");
      const legUuid = toUuid(g.contest_leg_id, "leg");
      // Format game_time into a proper timestamp string for PG
      const isoTime = new Date().toISOString(); 
      await query(
        `INSERT INTO games (id, contest_leg_id, home_team_id, away_team_id, home_score, away_score, status, game_time) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [gUuid, legUuid, g.home_team_id, g.away_team_id, g.home_score, g.away_score, g.status, isoTime]
      );
    }
    console.log(`[Seeder] Seeded ${gamesToInsert.length} Games.`);

    // 7. Insert Lines
    for (const l of linesToInsert) {
      const lineUuid = toUuid(l.id, "line");
      const legUuid = toUuid(l.contest_leg_id, "leg");
      await query(
        `INSERT INTO team_week_lines 
         (id, team_id, contest_leg_id, win_probability, pick_popularity, future_value, leverage_multiplier, holiday_safety_multiplier, contest_equity_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [lineUuid, l.team_id, legUuid, l.win_probability, l.pick_popularity, l.future_value, l.leverage_multiplier, l.holiday_safety_multiplier, l.contest_equity_score]
      );
    }
    console.log(`[Seeder] Seeded ${linesToInsert.length} Team Week Lines.`);

    // 8. Insert Survivor Entries
    for (const ent of initialEntries) {
      const entUuid = toUuid(ent.id, "entry");
      const ownerId =
        ent.name === "UWOSH-1" ? "owner-steve" :
        ent.name === "UWOSH-2" ? "owner-steve" :
        ent.name === "UWOSH-3" ? "owner-cameron" :
        ent.name === "UWOSH-4" ? "owner-uw-oshkosh" :
        null;

      await query(
        `INSERT INTO survivor_entries (id, contest_id, name, status, notes, owner_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [entUuid, contestUuid, ent.name, ent.status, ent.notes || "", ownerId, ent.created_at || new Date().toISOString()]
      );
    }
    console.log(`[Seeder] Seeded ${initialEntries.length} Survivor Entries.`);

    // 9. Insert Survivor Picks
    for (const pick of initialPicks) {
      const pickUuid = toUuid(pick.id, "pick");
      const entUuid = toUuid(pick.entry_id, "entry");
      const legUuid = toUuid(pick.contest_leg_id, "leg");
      await query(
        `INSERT INTO survivor_picks (id, entry_id, contest_leg_id, team_id, pick_status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [pickUuid, entUuid, legUuid, pick.team_id, pick.pick_status, pick.created_at || new Date().toISOString()]
      );
    }
    console.log(`[Seeder] Seeded ${initialPicks.length} Survivor Picks.`);

    // 10. Insert Sample Import Jobs
    const jobUuid = toUuid("seed-job-1", "pick");
    await query(
      `INSERT INTO import_jobs (id, job_type, file_name, status, rows_processed, error_message)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [jobUuid, "nfl_schedule", "initial_schedule_seed.csv", "completed", 16, null]
    );
    console.log("[Seeder] Seeded Sample Import Job.");

    // 11. Insert Sample Weekly Inputs
    const leg1Uuid = toUuid("leg-1", "leg");
    const wiKcUuid = toUuid("seed-wi-kc", "pick");
    const wiNeUuid = toUuid("seed-wi-ne", "pick");

    await query(
      `INSERT INTO weekly_inputs (
         id, contest_leg_id, team_id, rest_days, rest_disparity, sic_score,
         injury_risk_score, travel_disadvantage, weather_risk, quarterback_status,
         divisional_game_flag, short_week_flag
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (contest_leg_id, team_id) DO NOTHING`,
      [wiKcUuid, leg1Uuid, "kc", 7, 0, 95.5, 2.0, 0.0, 0.1, "active", false, false]
    );

    await query(
      `INSERT INTO weekly_inputs (
         id, contest_leg_id, team_id, rest_days, rest_disparity, sic_score,
         injury_risk_score, travel_disadvantage, weather_risk, quarterback_status,
         divisional_game_flag, short_week_flag
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (contest_leg_id, team_id) DO NOTHING`,
      [wiNeUuid, leg1Uuid, "ne", 7, 0, 88.0, 4.0, 0.0, 0.1, "active", false, false]
    );
    console.log("[Seeder] Seeded Sample Weekly Inputs.");

    // 12. Insert Sample Team Feature Metrics
    const tfKcUuid = toUuid("seed-tf-kc", "pick");
    const tfNeUuid = toUuid("seed-tf-ne", "pick");

    await query(
      `INSERT INTO team_features (
         id, contest_leg_id, team_id, off_efficiency, def_efficiency, net_efficiency,
         injury_index, pff_grade_offense, pff_grade_defense, dvoa_offense, dvoa_defense,
         sic_score, rest_days, quarterback_status, short_week_flag, travel_disadvantage
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       ON CONFLICT (contest_leg_id, team_id) DO NOTHING`,
      [tfKcUuid, leg1Uuid, "kc", 0.25, -0.05, 0.30, 2.0, 85.0, 78.5, 0.28, -0.04, 95.5, 7, "active", false, 0.0]
    );

    await query(
      `INSERT INTO team_features (
         id, contest_leg_id, team_id, off_efficiency, def_efficiency, net_efficiency,
         injury_index, pff_grade_offense, pff_grade_defense, dvoa_offense, dvoa_defense,
         sic_score, rest_days, quarterback_status, short_week_flag, travel_disadvantage
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       ON CONFLICT (contest_leg_id, team_id) DO NOTHING`,
      [tfNeUuid, leg1Uuid, "ne", -0.10, 0.05, -0.15, 4.0, 68.2, 74.0, -0.12, 0.06, 88.0, 7, "active", false, 0.0]
    );
    console.log("[Seeder] Seeded Sample Team Features.");

    // 13. Insert Sample Game Features
    const gfKcUuid = toUuid("seed-gf-kc-ne", "pick");
    const game1Uuid = toUuid("g-leg-1-0", "game");
    await query(
      `INSERT INTO game_features (
         id, contest_leg_id, game_id, home_team_id, away_team_id, rest_disparity,
         weather_risk, divisional_game_flag, line_spread, over_under, home_win_probability_pff
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (contest_leg_id, home_team_id, away_team_id) DO NOTHING`,
      [gfKcUuid, leg1Uuid, game1Uuid, "kc", "ne", 0, 0.1, false, -7.0, 48.5, 0.72]
    );
    console.log("[Seeder] Seeded Sample Game Features.");

    console.log("[Seeder] PostgreSQL seeding finished successfully!");
  } catch (err) {
    console.error("[Seeder] Error seeding PostgreSQL database:", err);
    throw err;
  }
}
