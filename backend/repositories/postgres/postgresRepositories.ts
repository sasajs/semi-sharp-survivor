import { 
  Team, 
  Contest, 
  ContestLeg, 
  Game, 
  TeamWeekLine, 
  SurvivorEntry, 
  SurvivorPick, 
  SurvivorHistory,
  WeeklyInput,
  TeamFeature,
  GameFeature,
  ImportJob
} from "../../../src/types";
import { query } from "../../database/connection";
import { toUuid } from "../../database/seed/seedData";
import {
  ITeamRepository,
  IContestRepository,
  IContestLegRepository,
  IGameRepository,
  ITeamWeekLineRepository,
  ISurvivorEntryRepository,
  ISurvivorPickRepository,
  ISurvivorHistoryRepository,
  IWeeklyInputRepository,
  ITeamFeatureRepository,
  IGameFeatureRepository,
  IImportJobRepository
} from "../interfaces";

// Convert UUID back to legacy mock IDs for UI/analytics consumption
export function fromUuid(uuid: string): string {
  if (!uuid) return uuid;
  if (uuid === "20262026-c17c-4c0a-bd6e-000000000001") return "circa-2026";
  if (uuid === "22222222-2222-4222-c222-000000000101") return "UWOSH-1";
  if (uuid === "22222222-2222-4222-c222-000000000102") return "UWOSH-2";
  if (uuid === "22222222-2222-4222-c222-000000000103") return "UWOSH-3";
  if (uuid === "22222222-2222-4222-c222-000000000104") return "UWOSH-4";
  if (uuid.startsWith("11111111-1111-4111-b111-")) {
    const num = parseInt(uuid.substring(24), 10);
    return `leg-${num}`;
  }
  if (uuid.startsWith("22222222-2222-4222-c222-")) {
    const num = parseInt(uuid.substring(24), 10);
    return `entry-${num}`;
  }
  return uuid;
}

// Map database row outputs to core TypeScript entities
function mapTeam(row: any): Team {
  return {
    id: row.id,
    name: row.name,
    abbreviation: row.abbreviation,
    bye_week: row.bye_week,
    primary_color: row.primary_color,
    secondary_color: row.secondary_color
  };
}

function mapContest(row: any): Contest {
  return {
    id: fromUuid(row.id),
    name: row.name,
    year: row.year,
    status: row.status as "active" | "completed"
  };
}

function mapContestLeg(row: any): ContestLeg {
  return {
    id: fromUuid(row.id),
    name: row.name,
    leg_type: row.leg_type as "regular" | "thanksgiving" | "christmas",
    display_order: row.display_order,
    nfl_week: row.nfl_week
  };
}

function mapGame(row: any): Game {
  return {
    id: fromUuid(row.id),
    contest_leg_id: fromUuid(row.contest_leg_id),
    home_team_id: row.home_team_id,
    away_team_id: row.away_team_id,
    home_score: row.home_score !== null && row.home_score !== undefined ? Number(row.home_score) : undefined,
    away_score: row.away_score !== null && row.away_score !== undefined ? Number(row.away_score) : undefined,
    status: row.status as "scheduled" | "final",
    game_time: "Sunday 1:00 PM"
  };
}

function mapTeamWeekLine(row: any): TeamWeekLine {
  const futVal = parseFloat(row.future_value);
  return {
    id: fromUuid(row.id),
    team_id: row.team_id,
    contest_leg_id: fromUuid(row.contest_leg_id),
    win_probability: parseFloat(row.win_probability),
    pick_popularity: parseFloat(row.pick_popularity),
    future_value: futVal,
    leverage_multiplier: parseFloat(row.leverage_multiplier),
    future_value_multiplier: parseFloat((1.1 - futVal).toFixed(2)),
    holiday_safety_multiplier: parseFloat(row.holiday_safety_multiplier),
    contest_equity_score: parseFloat(row.contest_equity_score)
  };
}

function mapSurvivorEntry(row: any): SurvivorEntry {
  const idStr = row.id ? row.id.toString() : "";
  const nameStr = row.name ? row.name.toString() : "";
  let ownerId = row.owner_id || undefined;

  // Explicit mappings for SAS, CNS, UWO
  if (idStr === "22222222-2222-4222-c222-000000000101" || nameStr === "UWOSH-1" || idStr === "UWOSH-1") {
    ownerId = "owner-steve";
  } else if (idStr === "22222222-2222-4222-c222-000000000102" || nameStr === "UWOSH-2" || idStr === "UWOSH-2") {
    ownerId = "owner-steve";
  } else if (idStr === "22222222-2222-4222-c222-000000000103" || nameStr === "UWOSH-3" || idStr === "UWOSH-3") {
    ownerId = "owner-cameron";
  } else if (idStr === "22222222-2222-4222-c222-000000000104" || nameStr === "UWOSH-4" || idStr === "UWOSH-4") {
    ownerId = "owner-uw-oshkosh";
  }

  return {
    id: fromUuid(row.id),
    name: row.name,
    status: row.status as "alive" | "eliminated",
    notes: row.notes || undefined,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    owner_id: ownerId,
    contest_type_id: row.contest_type_id || "circa"
  };
}

function mapSurvivorPick(row: any): SurvivorPick {
  return {
    id: fromUuid(row.id),
    entry_id: fromUuid(row.entry_id),
    contest_leg_id: fromUuid(row.contest_leg_id),
    team_id: row.team_id,
    pick_status: row.pick_status as "pending" | "won" | "lost",
    created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString()
  };
}

function mapSurvivorHistory(row: any): SurvivorHistory {
  return {
    id: fromUuid(row.id),
    entry_id: fromUuid(row.entry_id),
    contest_leg_id: fromUuid(row.contest_leg_id),
    team_id: row.team_id,
    result: row.result as "won" | "lost" | "tie_loss"
  };
}

function mapWeeklyInput(row: any): WeeklyInput {
  if (!row) return row;
  return {
    id: fromUuid(row.id),
    contest_leg_id: fromUuid(row.contest_leg_id),
    team_id: row.team_id,
    rest_days: row.rest_days !== null && row.rest_days !== undefined ? Number(row.rest_days) : undefined,
    rest_disparity: row.rest_disparity !== null && row.rest_disparity !== undefined ? Number(row.rest_disparity) : undefined,
    sic_score: row.sic_score !== null && row.sic_score !== undefined ? parseFloat(row.sic_score) : undefined,
    injury_risk_score: row.injury_risk_score !== null && row.injury_risk_score !== undefined ? parseFloat(row.injury_risk_score) : undefined,
    travel_disadvantage: row.travel_disadvantage !== null && row.travel_disadvantage !== undefined ? parseFloat(row.travel_disadvantage) : undefined,
    weather_risk: row.weather_risk !== null && row.weather_risk !== undefined ? parseFloat(row.weather_risk) : undefined,
    quarterback_status: row.quarterback_status,
    divisional_game_flag: !!row.divisional_game_flag,
    short_week_flag: !!row.short_week_flag,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function mapTeamFeature(row: any): TeamFeature {
  if (!row) return row;
  return {
    id: fromUuid(row.id),
    contest_leg_id: fromUuid(row.contest_leg_id),
    team_id: row.team_id,
    off_efficiency: row.off_efficiency !== null && row.off_efficiency !== undefined ? parseFloat(row.off_efficiency) : undefined,
    def_efficiency: row.def_efficiency !== null && row.def_efficiency !== undefined ? parseFloat(row.def_efficiency) : undefined,
    net_efficiency: row.net_efficiency !== null && row.net_efficiency !== undefined ? parseFloat(row.net_efficiency) : undefined,
    injury_index: row.injury_index !== null && row.injury_index !== undefined ? parseFloat(row.injury_index) : undefined,
    pff_grade_offense: row.pff_grade_offense !== null && row.pff_grade_offense !== undefined ? parseFloat(row.pff_grade_offense) : undefined,
    pff_grade_defense: row.pff_grade_defense !== null && row.pff_grade_defense !== undefined ? parseFloat(row.pff_grade_defense) : undefined,
    dvoa_offense: row.dvoa_offense !== null && row.dvoa_offense !== undefined ? parseFloat(row.dvoa_offense) : undefined,
    dvoa_defense: row.dvoa_defense !== null && row.dvoa_defense !== undefined ? parseFloat(row.dvoa_defense) : undefined,
    rest_days: row.rest_days !== null && row.rest_days !== undefined ? Number(row.rest_days) : undefined,
    sic_score: row.sic_score !== null && row.sic_score !== undefined ? parseFloat(row.sic_score) : undefined,
    quarterback_status: row.quarterback_status,
    short_week_flag: !!row.short_week_flag,
    travel_disadvantage: row.travel_disadvantage !== null && row.travel_disadvantage !== undefined ? parseFloat(row.travel_disadvantage) : undefined,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function mapGameFeature(row: any): GameFeature {
  if (!row) return row;
  return {
    id: fromUuid(row.id),
    contest_leg_id: fromUuid(row.contest_leg_id),
    game_id: row.game_id ? fromUuid(row.game_id) : undefined,
    home_team_id: row.home_team_id,
    away_team_id: row.away_team_id,
    rest_disparity: row.rest_disparity !== null && row.rest_disparity !== undefined ? Number(row.rest_disparity) : undefined,
    weather_risk: row.weather_risk !== null && row.weather_risk !== undefined ? parseFloat(row.weather_risk) : undefined,
    divisional_game_flag: !!row.divisional_game_flag,
    line_spread: row.line_spread !== null && row.line_spread !== undefined ? parseFloat(row.line_spread) : undefined,
    over_under: row.over_under !== null && row.over_under !== undefined ? parseFloat(row.over_under) : undefined,
    home_win_probability_pff: row.home_win_probability_pff !== null && row.home_win_probability_pff !== undefined ? parseFloat(row.home_win_probability_pff) : undefined,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function mapImportJob(row: any): ImportJob {
  if (!row) return row;
  return {
    id: fromUuid(row.id),
    job_type: row.job_type,
    file_name: row.file_name,
    status: row.status as 'pending' | 'completed' | 'failed',
    rows_processed: Number(row.rows_processed || 0),
    error_message: row.error_message || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}


/**
 * 1. Team PostgreSQL Repository
 */
export class PostgresTeamRepository implements ITeamRepository {
  async getAll(): Promise<Team[]> {
    const rows = await query("SELECT * FROM teams ORDER BY id ASC");
    return rows.map(mapTeam);
  }

  async getById(id: string): Promise<Team | null> {
    const rows = await query("SELECT * FROM teams WHERE id = $1 LIMIT 1", [id]);
    return rows.length ? mapTeam(rows[0]) : null;
  }

  async save(team: Team): Promise<Team> {
    const rows = await query(
      `INSERT INTO teams (id, name, abbreviation, bye_week, primary_color, secondary_color)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         abbreviation = EXCLUDED.abbreviation,
         bye_week = EXCLUDED.bye_week,
         primary_color = EXCLUDED.primary_color,
         secondary_color = EXCLUDED.secondary_color
       RETURNING *`,
      [team.id, team.name, team.abbreviation, team.bye_week, team.primary_color, team.secondary_color]
    );
    return mapTeam(rows[0]);
  }
}

/**
 * 2. Contest PostgreSQL Repository
 */
export class PostgresContestRepository implements IContestRepository {
  async getAll(): Promise<Contest[]> {
    const rows = await query("SELECT * FROM contests ORDER BY year DESC");
    return rows.map(mapContest);
  }

  async getById(id: string): Promise<Contest | null> {
    const dbId = toUuid(id, "contest");
    const rows = await query("SELECT * FROM contests WHERE id = $1 LIMIT 1", [dbId]);
    return rows.length ? mapContest(rows[0]) : null;
  }

  async save(contest: Contest): Promise<Contest> {
    const dbId = toUuid(contest.id, "contest");
    const rows = await query(
      `INSERT INTO contests (id, name, year, status)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         status = EXCLUDED.status
       RETURNING *`,
      [dbId, contest.name, contest.year, contest.status]
    );
    return mapContest(rows[0]);
  }
}

/**
 * 3. ContestLeg PostgreSQL Repository
 */
export class PostgresContestLegRepository implements IContestLegRepository {
  async getAll(): Promise<ContestLeg[]> {
    const rows = await query("SELECT * FROM contest_legs ORDER BY display_order ASC");
    return rows.map(mapContestLeg);
  }

  async getById(id: string): Promise<ContestLeg | null> {
    const dbId = toUuid(id, "leg");
    const rows = await query("SELECT * FROM contest_legs WHERE id = $1 LIMIT 1", [dbId]);
    return rows.length ? mapContestLeg(rows[0]) : null;
  }

  async getByContestId(contestId: string): Promise<ContestLeg[]> {
    const dbId = toUuid(contestId, "contest");
    const rows = await query("SELECT * FROM contest_legs WHERE contest_id = $1 ORDER BY display_order ASC", [dbId]);
    return rows.map(mapContestLeg);
  }

  async save(leg: ContestLeg): Promise<ContestLeg> {
    const dbId = toUuid(leg.id, "leg");
    const contestId = toUuid("circa-2026", "contest");
    const rows = await query(
      `INSERT INTO contest_legs (id, contest_id, name, leg_type, display_order, nfl_week)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         leg_type = EXCLUDED.leg_type,
         display_order = EXCLUDED.display_order,
         nfl_week = EXCLUDED.nfl_week
       RETURNING *`,
      [dbId, contestId, leg.name, leg.leg_type, leg.display_order, leg.nfl_week]
    );
    return mapContestLeg(rows[0]);
  }
}

/**
 * 4. Game PostgreSQL Repository
 */
export class PostgresGameRepository implements IGameRepository {
  async getAll(): Promise<Game[]> {
    const rows = await query("SELECT * FROM games ORDER BY game_time ASC");
    return rows.map(mapGame);
  }

  async getById(id: string): Promise<Game | null> {
    const dbId = toUuid(id, "game");
    const rows = await query("SELECT * FROM games WHERE id = $1 LIMIT 1", [dbId]);
    return rows.length ? mapGame(rows[0]) : null;
  }

  async getByLegId(legId: string): Promise<Game[]> {
    const dbId = toUuid(legId, "leg");
    const rows = await query("SELECT * FROM games WHERE contest_leg_id = $1 ORDER BY game_time ASC", [dbId]);
    return rows.map(mapGame);
  }

  async save(game: Game): Promise<Game> {
    const dbId = toUuid(game.id, "game");
    const legUuid = toUuid(game.contest_leg_id, "leg");
    const rows = await query(
      `INSERT INTO games (id, contest_leg_id, home_team_id, away_team_id, home_score, away_score, status, game_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         home_score = EXCLUDED.home_score,
         away_score = EXCLUDED.away_score,
         status = EXCLUDED.status,
         game_time = EXCLUDED.game_time
       RETURNING *`,
      [dbId, legUuid, game.home_team_id, game.away_team_id, game.home_score, game.away_score, game.status, new Date().toISOString()]
    );
    return mapGame(rows[0]);
  }
}

/**
 * 5. TeamWeekLine PostgreSQL Repository
 */
export class PostgresTeamWeekLineRepository implements ITeamWeekLineRepository {
  async getAll(): Promise<TeamWeekLine[] | any[]> {
    const rows = await query("SELECT * FROM team_week_lines");
    return rows.map(mapTeamWeekLine);
  }

  async getByLegId(legId: string): Promise<TeamWeekLine[]> {
    const dbId = toUuid(legId, "leg");
    const rows = await query("SELECT * FROM team_week_lines WHERE contest_leg_id = $1", [dbId]);
    return rows.map(mapTeamWeekLine);
  }

  async getByTeamAndLeg(teamId: string, legId: string): Promise<TeamWeekLine | null> {
    const dbId = toUuid(legId, "leg");
    const rows = await query("SELECT * FROM team_week_lines WHERE team_id = $1 AND contest_leg_id = $2 LIMIT 1", [teamId, dbId]);
    return rows.length ? mapTeamWeekLine(rows[0]) : null;
  }

  async save(line: TeamWeekLine): Promise<TeamWeekLine> {
    const dbId = toUuid(line.id, "line");
    const legUuid = toUuid(line.contest_leg_id, "leg");
    const rows = await query(
      `INSERT INTO team_week_lines 
         (id, team_id, contest_leg_id, win_probability, pick_popularity, future_value, leverage_multiplier, holiday_safety_multiplier, contest_equity_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (team_id, contest_leg_id) DO UPDATE SET
         win_probability = EXCLUDED.win_probability,
         pick_popularity = EXCLUDED.pick_popularity,
         future_value = EXCLUDED.future_value,
         leverage_multiplier = EXCLUDED.leverage_multiplier,
         holiday_safety_multiplier = EXCLUDED.holiday_safety_multiplier,
         contest_equity_score = EXCLUDED.contest_equity_score
       RETURNING *`,
      [dbId, line.team_id, legUuid, line.win_probability, line.pick_popularity, line.future_value, line.leverage_multiplier, line.holiday_safety_multiplier, line.contest_equity_score]
    );
    return mapTeamWeekLine(rows[0]);
  }
}

/**
 * 6. SurvivorEntry PostgreSQL Repository (EntryRepository)
 */
export class PostgresSurvivorEntryRepository implements ISurvivorEntryRepository {
  async getAll(): Promise<SurvivorEntry[]> {
    const rows = await query("SELECT * FROM survivor_entries ORDER BY created_at ASC");
    return rows.map(mapSurvivorEntry);
  }

  async getById(id: string): Promise<SurvivorEntry | null> {
    let dbId: string | null = null;
    try {
      dbId = toUuid(id, "entry");
    } catch (e) {
      // ignore
    }

    if (dbId) {
      const rows = await query(
        "SELECT * FROM survivor_entries WHERE id = $1 OR name = $2 LIMIT 1", 
        [dbId, id]
      );
      if (rows.length) {
        return mapSurvivorEntry(rows[0]);
      }
    }

    const rowsByName = await query("SELECT * FROM survivor_entries WHERE name = $1 LIMIT 1", [id]);
    return rowsByName.length ? mapSurvivorEntry(rowsByName[0]) : null;
  }

  async getByOwnerId(ownerId: string): Promise<SurvivorEntry[]> {
    const rows = await query("SELECT * FROM survivor_entries WHERE owner_id = $1 ORDER BY created_at ASC", [ownerId]);
    return rows.map(mapSurvivorEntry);
  }

  async create(entry: { contest_id?: string; name: string; notes?: string; owner_id?: string }): Promise<SurvivorEntry> {
    // Generate valid random UUID
    const randomHex = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    const newId = `22222222-${randomHex()}-${randomHex()}-${randomHex()}-${randomHex()}${randomHex()}${randomHex()}`;
    const dbId = toUuid(newId, "entry");
    const contestId = toUuid(entry.contest_id || "circa-2026", "contest");
    const rows = await query(
      `INSERT INTO survivor_entries (id, contest_id, name, status, notes, owner_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [dbId, contestId, entry.name, "alive", entry.notes || "", entry.owner_id || null]
    );
    return mapSurvivorEntry(rows[0]);
  }

  async update(id: string, updates: Partial<SurvivorEntry>): Promise<SurvivorEntry | null> {
    const dbId = toUuid(id, "entry");
    const current = await this.getById(id);
    if (!current) return null;

    const name = updates.name !== undefined ? updates.name : current.name;
    const notes = updates.notes !== undefined ? updates.notes : (current.notes || "");
    const status = updates.status !== undefined ? updates.status : current.status;
    const ownerId = updates.owner_id !== undefined ? updates.owner_id : current.owner_id;

    const rows = await query(
      `UPDATE survivor_entries
       SET name = $1, notes = $2, status = $3, owner_id = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [name, notes, status, ownerId || null, dbId]
    );
    return rows.length ? mapSurvivorEntry(rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const dbId = toUuid(id, "entry");
    await query("DELETE FROM survivor_picks WHERE entry_id = $1", [dbId]);
    await query("DELETE FROM survivor_history WHERE entry_id = $1", [dbId]);
    const res = await query("DELETE FROM survivor_entries WHERE id = $1 RETURNING id", [dbId]);
    return res.length > 0;
  }
}

/**
 * 7. SurvivorPick PostgreSQL Repository (PickRepository)
 */
export class PostgresSurvivorPickRepository implements ISurvivorPickRepository {
  async getAll(): Promise<SurvivorPick[]> {
    const rows = await query("SELECT * FROM survivor_picks ORDER BY created_at ASC");
    return rows.map(mapSurvivorPick);
  }

  async getById(id: string): Promise<SurvivorPick | null> {
    const dbId = toUuid(id, "pick");
    const rows = await query("SELECT * FROM survivor_picks WHERE id = $1 LIMIT 1", [dbId]);
    return rows.length ? mapSurvivorPick(rows[0]) : null;
  }

  async getByEntryId(entryId: string): Promise<SurvivorPick[]> {
    const dbId = toUuid(entryId, "entry");
    const rows = await query("SELECT * FROM survivor_picks WHERE entry_id = $1 ORDER BY created_at ASC", [dbId]);
    return rows.map(mapSurvivorPick);
  }

  async getByLegId(legId: string): Promise<SurvivorPick[]> {
    const dbId = toUuid(legId, "leg");
    const rows = await query("SELECT * FROM survivor_picks WHERE contest_leg_id = $1", [dbId]);
    return rows.map(mapSurvivorPick);
  }

  async getByEntryAndLeg(entryId: string, legId: string): Promise<SurvivorPick | null> {
    const dbEntryId = toUuid(entryId, "entry");
    const dbLegId = toUuid(legId, "leg");
    const rows = await query("SELECT * FROM survivor_picks WHERE entry_id = $1 AND contest_leg_id = $2 LIMIT 1", [dbEntryId, dbLegId]);
    return rows.length ? mapSurvivorPick(rows[0]) : null;
  }

  async getByEntryAndTeam(entryId: string, teamId: string): Promise<SurvivorPick | null> {
    const dbEntryId = toUuid(entryId, "entry");
    const rows = await query("SELECT * FROM survivor_picks WHERE entry_id = $1 AND team_id = $2 LIMIT 1", [dbEntryId, teamId]);
    return rows.length ? mapSurvivorPick(rows[0]) : null;
  }

  async createOrUpdate(pick: { id?: string; entry_id: string; contest_leg_id: string; team_id: string; pick_status: "pending" | "won" | "lost" }): Promise<SurvivorPick> {
    const dbEntryId = toUuid(pick.entry_id, "entry");
    const dbLegId = toUuid(pick.contest_leg_id, "leg");
    
    // Create consistent, stable UUID for this pick if it doesn't have one
    let pickId: string;
    if (pick.id) {
      pickId = toUuid(pick.id, "pick");
    } else {
      const stableSeed = `pick-${dbEntryId.substring(0, 8)}-${dbLegId.substring(0, 8)}`;
      pickId = toUuid(stableSeed, "pick");
    }

    const rows = await query(
      `INSERT INTO survivor_picks (id, entry_id, contest_leg_id, team_id, pick_status)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (entry_id, contest_leg_id) DO UPDATE SET
         team_id = EXCLUDED.team_id,
         pick_status = EXCLUDED.pick_status,
         updated_at = NOW()
       RETURNING *`,
      [pickId, dbEntryId, dbLegId, pick.team_id, pick.pick_status]
    );
    return mapSurvivorPick(rows[0]);
  }

  async delete(id: string): Promise<boolean> {
    const dbId = toUuid(id, "pick");
    const res = await query("DELETE FROM survivor_picks WHERE id = $1 RETURNING id", [dbId]);
    return res.length > 0;
  }

  async deleteByEntryId(entryId: string): Promise<boolean> {
    const dbEntryId = toUuid(entryId, "entry");
    const res = await query("DELETE FROM survivor_picks WHERE entry_id = $1 RETURNING id", [dbEntryId]);
    return res.length > 0;
  }
}

/**
 * 8. SurvivorHistory PostgreSQL Repository
 */
export class PostgresSurvivorHistoryRepository implements ISurvivorHistoryRepository {
  async getAll(): Promise<SurvivorHistory[]> {
    const rows = await query("SELECT * FROM survivor_history");
    return rows.map(mapSurvivorHistory);
  }

  async getByEntryId(entryId: string): Promise<SurvivorHistory[]> {
    const dbEntryId = toUuid(entryId, "entry");
    const rows = await query("SELECT * FROM survivor_history WHERE entry_id = $1", [dbEntryId]);
    return rows.map(mapSurvivorHistory);
  }

  async save(history: SurvivorHistory): Promise<SurvivorHistory> {
    const dbEntryId = toUuid(history.entry_id, "entry");
    const dbLegId = toUuid(history.contest_leg_id, "leg");
    const dbId = history.id ? toUuid(history.id, "pick") : toUuid(`history-${dbEntryId.substring(0,6)}-${dbLegId.substring(0,6)}`, "pick");
    
    const rows = await query(
      `INSERT INTO survivor_history (id, entry_id, contest_leg_id, team_id, result)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         team_id = EXCLUDED.team_id,
         result = EXCLUDED.result
       RETURNING *`,
      [dbId, dbEntryId, dbLegId, history.team_id, history.result]
    );
    return mapSurvivorHistory(rows[0]);
  }
}

/**
 * 9. WeeklyInput PostgreSQL Repository
 */
export class PostgresWeeklyInputRepository implements IWeeklyInputRepository {
  async getAll(): Promise<WeeklyInput[]> {
    const rows = await query("SELECT * FROM weekly_inputs");
    return rows.map(mapWeeklyInput);
  }

  async getById(id: string): Promise<WeeklyInput | null> {
    const dbId = toUuid(id, "pick");
    const rows = await query("SELECT * FROM weekly_inputs WHERE id = $1", [dbId]);
    return rows.length ? mapWeeklyInput(rows[0]) : null;
  }

  async getByLegAndTeam(legId: string, teamId: string): Promise<WeeklyInput | null> {
    const dbLegId = toUuid(legId, "leg");
    const rows = await query("SELECT * FROM weekly_inputs WHERE contest_leg_id = $1 AND team_id = $2", [dbLegId, teamId]);
    return rows.length ? mapWeeklyInput(rows[0]) : null;
  }

  async getByLegId(legId: string): Promise<WeeklyInput[]> {
    const dbLegId = toUuid(legId, "leg");
    const rows = await query("SELECT * FROM weekly_inputs WHERE contest_leg_id = $1", [dbLegId]);
    return rows.map(mapWeeklyInput);
  }

  async save(input: WeeklyInput): Promise<WeeklyInput> {
    const dbLegId = toUuid(input.contest_leg_id, "leg");
    const dbId = input.id ? toUuid(input.id, "pick") : toUuid(`wi-${dbLegId.substring(0, 8)}-${input.team_id}`, "pick");

    const rows = await query(
      `INSERT INTO weekly_inputs (
         id, contest_leg_id, team_id, rest_days, rest_disparity, sic_score,
         injury_risk_score, travel_disadvantage, weather_risk, quarterback_status,
         divisional_game_flag, short_week_flag, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
       ON CONFLICT (contest_leg_id, team_id) DO UPDATE SET
         rest_days = EXCLUDED.rest_days,
         rest_disparity = EXCLUDED.rest_disparity,
         sic_score = EXCLUDED.sic_score,
         injury_risk_score = EXCLUDED.injury_risk_score,
         travel_disadvantage = EXCLUDED.travel_disadvantage,
         weather_risk = EXCLUDED.weather_risk,
         quarterback_status = EXCLUDED.quarterback_status,
         divisional_game_flag = EXCLUDED.divisional_game_flag,
         short_week_flag = EXCLUDED.short_week_flag,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        dbId,
        dbLegId,
        input.team_id,
        input.rest_days ?? null,
        input.rest_disparity ?? null,
        input.sic_score ?? null,
        input.injury_risk_score ?? null,
        input.travel_disadvantage ?? null,
        input.weather_risk ?? null,
        input.quarterback_status ?? null,
        input.divisional_game_flag,
        input.short_week_flag
      ]
    );
    return mapWeeklyInput(rows[0]);
  }

  async delete(id: string): Promise<boolean> {
    const dbId = toUuid(id, "pick");
    const res = await query("DELETE FROM weekly_inputs WHERE id = $1 RETURNING id", [dbId]);
    return res.length > 0;
  }
}

/**
 * 10. TeamFeature PostgreSQL Repository
 */
export class PostgresTeamFeatureRepository implements ITeamFeatureRepository {
  async getAll(): Promise<TeamFeature[]> {
    const rows = await query("SELECT * FROM team_features");
    return rows.map(mapTeamFeature);
  }

  async getById(id: string): Promise<TeamFeature | null> {
    const dbId = toUuid(id, "pick");
    const rows = await query("SELECT * FROM team_features WHERE id = $1", [dbId]);
    return rows.length ? mapTeamFeature(rows[0]) : null;
  }

  async getByLegAndTeam(legId: string, teamId: string): Promise<TeamFeature | null> {
    const dbLegId = toUuid(legId, "leg");
    const rows = await query("SELECT * FROM team_features WHERE contest_leg_id = $1 AND team_id = $2", [dbLegId, teamId]);
    return rows.length ? mapTeamFeature(rows[0]) : null;
  }

  async getByLegId(legId: string): Promise<TeamFeature[]> {
    const dbLegId = toUuid(legId, "leg");
    const rows = await query("SELECT * FROM team_features WHERE contest_leg_id = $1", [dbLegId]);
    return rows.map(mapTeamFeature);
  }

  async save(feature: TeamFeature): Promise<TeamFeature> {
    const dbLegId = toUuid(feature.contest_leg_id, "leg");
    const dbId = feature.id ? toUuid(feature.id, "pick") : toUuid(`tf-${dbLegId.substring(0, 8)}-${feature.team_id}`, "pick");

    const rows = await query(
      `INSERT INTO team_features (
         id, contest_leg_id, team_id, off_efficiency, def_efficiency, net_efficiency,
         injury_index, pff_grade_offense, pff_grade_defense, dvoa_offense, dvoa_defense,
         rest_days, sic_score, quarterback_status, short_week_flag, travel_disadvantage, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP)
       ON CONFLICT (contest_leg_id, team_id) DO UPDATE SET
         off_efficiency = EXCLUDED.off_efficiency,
         def_efficiency = EXCLUDED.def_efficiency,
         net_efficiency = EXCLUDED.net_efficiency,
         injury_index = EXCLUDED.injury_index,
         pff_grade_offense = EXCLUDED.pff_grade_offense,
         pff_grade_defense = EXCLUDED.pff_grade_defense,
         dvoa_offense = EXCLUDED.dvoa_offense,
         dvoa_defense = EXCLUDED.dvoa_defense,
         rest_days = EXCLUDED.rest_days,
         sic_score = EXCLUDED.sic_score,
         quarterback_status = EXCLUDED.quarterback_status,
         short_week_flag = EXCLUDED.short_week_flag,
         travel_disadvantage = EXCLUDED.travel_disadvantage,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        dbId,
        dbLegId,
        feature.team_id,
        feature.off_efficiency ?? null,
        feature.def_efficiency ?? null,
        feature.net_efficiency ?? null,
        feature.injury_index ?? null,
        feature.pff_grade_offense ?? null,
        feature.pff_grade_defense ?? null,
        feature.dvoa_offense ?? null,
        feature.dvoa_defense ?? null,
        feature.rest_days ?? null,
        feature.sic_score ?? null,
        feature.quarterback_status ?? null,
        feature.short_week_flag,
        feature.travel_disadvantage ?? null
      ]
    );
    return mapTeamFeature(rows[0]);
  }

  async delete(id: string): Promise<boolean> {
    const dbId = toUuid(id, "pick");
    const res = await query("DELETE FROM team_features WHERE id = $1 RETURNING id", [dbId]);
    return res.length > 0;
  }
}

/**
 * 11. GameFeature PostgreSQL Repository
 */
export class PostgresGameFeatureRepository implements IGameFeatureRepository {
  async getAll(): Promise<GameFeature[]> {
    const rows = await query("SELECT * FROM game_features");
    return rows.map(mapGameFeature);
  }

  async getById(id: string): Promise<GameFeature | null> {
    const dbId = toUuid(id, "pick");
    const rows = await query("SELECT * FROM game_features WHERE id = $1", [dbId]);
    return rows.length ? mapGameFeature(rows[0]) : null;
  }

  async getByLegAndTeams(legId: string, homeTeamId: string, awayTeamId: string): Promise<GameFeature | null> {
    const dbLegId = toUuid(legId, "leg");
    const rows = await query("SELECT * FROM game_features WHERE contest_leg_id = $1 AND home_team_id = $2 AND away_team_id = $3", [dbLegId, homeTeamId, awayTeamId]);
    return rows.length ? mapGameFeature(rows[0]) : null;
  }

  async getByLegId(legId: string): Promise<GameFeature[]> {
    const dbLegId = toUuid(legId, "leg");
    const rows = await query("SELECT * FROM game_features WHERE contest_leg_id = $1", [dbLegId]);
    return rows.map(mapGameFeature);
  }

  async save(feature: GameFeature): Promise<GameFeature> {
    const dbLegId = toUuid(feature.contest_leg_id, "leg");
    const dbGameId = feature.game_id ? toUuid(feature.game_id, "game") : null;
    const dbId = feature.id ? toUuid(feature.id, "pick") : toUuid(`gf-${dbLegId.substring(0, 8)}-${feature.home_team_id}-${feature.away_team_id}`, "pick");

    const rows = await query(
      `INSERT INTO game_features (
         id, contest_leg_id, game_id, home_team_id, away_team_id, rest_disparity,
         weather_risk, divisional_game_flag, line_spread, over_under, home_win_probability_pff, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
       ON CONFLICT (contest_leg_id, home_team_id, away_team_id) DO UPDATE SET
         game_id = EXCLUDED.game_id,
         rest_disparity = EXCLUDED.rest_disparity,
         weather_risk = EXCLUDED.weather_risk,
         divisional_game_flag = EXCLUDED.divisional_game_flag,
         line_spread = EXCLUDED.line_spread,
         over_under = EXCLUDED.over_under,
         home_win_probability_pff = EXCLUDED.home_win_probability_pff,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        dbId,
        dbLegId,
        dbGameId,
        feature.home_team_id,
        feature.away_team_id,
        feature.rest_disparity ?? null,
        feature.weather_risk ?? null,
        feature.divisional_game_flag,
        feature.line_spread ?? null,
        feature.over_under ?? null,
        feature.home_win_probability_pff ?? null
      ]
    );
    return mapGameFeature(rows[0]);
  }

  async delete(id: string): Promise<boolean> {
    const dbId = toUuid(id, "pick");
    const res = await query("DELETE FROM game_features WHERE id = $1 RETURNING id", [dbId]);
    return res.length > 0;
  }
}

/**
 * 12. ImportJob PostgreSQL Repository
 */
export class PostgresImportJobRepository implements IImportJobRepository {
  async getAll(): Promise<ImportJob[]> {
    const rows = await query("SELECT * FROM import_jobs ORDER BY created_at DESC");
    return rows.map(mapImportJob);
  }

  async getById(id: string): Promise<ImportJob | null> {
    const dbId = toUuid(id, "pick");
    const rows = await query("SELECT * FROM import_jobs WHERE id = $1", [dbId]);
    return rows.length ? mapImportJob(rows[0]) : null;
  }

  async create(job: Omit<ImportJob, "id" | "created_at" | "updated_at">): Promise<ImportJob> {
    const dbId = toUuid(`job-${Date.now()}-${Math.random().toString().substring(2,6)}`, "pick");
    const rows = await query(
      `INSERT INTO import_jobs (id, job_type, file_name, status, rows_processed, error_message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [dbId, job.job_type, job.file_name ?? null, job.status, job.rows_processed, job.error_message ?? null]
    );
    return mapImportJob(rows[0]);
  }

  async update(id: string, updates: Partial<ImportJob>): Promise<ImportJob | null> {
    const dbId = toUuid(id, "pick");
    const existing = await this.getById(id);
    if (!existing) return null;

    const merged = { ...existing, ...updates };

    const rows = await query(
      `UPDATE import_jobs SET
         job_type = $2,
         file_name = $3,
         status = $4,
         rows_processed = $5,
         error_message = $6,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [dbId, merged.job_type, merged.file_name ?? null, merged.status, merged.rows_processed, merged.error_message ?? null]
    );
    return mapImportJob(rows[0]);
  }
}

// Named exports matching exact requested repository architecture
export { PostgresContestRepository as ContestRepository };
export { PostgresContestLegRepository as ContestLegRepository };
export { PostgresSurvivorEntryRepository as EntryRepository };
export { PostgresSurvivorPickRepository as PickRepository };
export { PostgresTeamRepository as TeamRepository };
export { PostgresTeamWeekLineRepository as TeamWeekLineRepository };
export { PostgresSurvivorHistoryRepository as SurvivorHistoryRepository };
export { PostgresWeeklyInputRepository as WeeklyInputRepository };
export { PostgresTeamFeatureRepository as TeamFeatureRepository };
export { PostgresGameFeatureRepository as GameFeatureRepository };
export { PostgresImportJobRepository as ImportJobRepository };


