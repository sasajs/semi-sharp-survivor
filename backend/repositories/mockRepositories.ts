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
  ImportJob,
  EntryInventory,
  ReservedTeam,
  HolidayReservation,
  FutureValueProfile,
  RiskProfile,
  GameRiskAssessment,
  EntryRecommendation,
  PortfolioRecommendation,
  WeeklySnapshot,
  FeatureSnapshot,
  InventorySnapshotRecord,
  RiskSnapshot,
  RecommendationSnapshot,
  DecisionAuditRecord,
  SimulationRun,
  EntrySurvivalProjection,
  FeatureDefinition,
  FeatureBuildRun,
  FeatureStoreSnapshot,
  EntryStrategyProfile,
  EntryMetadata,
  StrategyType
} from "../../src/types";
import { AuthAuditRecord, SystemMetadata, ApplicationVersion, ProjectDecision, OperationsEvent } from "../../src/types/admin";
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
  IImportJobRepository,
  IInventoryRepository,
  IReservationRepository,
  IFutureValueRepository,
  IRiskRepository,
  IRiskAssessmentRepository,
  IRecommendationRepository,
  IRecommendationSnapshotRepository,
  ISnapshotRepository,
  IAuditRepository,
  ISimulationRepository,
  ISimulationRunRepository,
  ISimulationResultRepository,
  IAuthAuditRepository,
  ISystemMetadataRepository,
  IApplicationVersionsRepository,
  IProjectDecisionsRepository,
  IOperationsEventsRepository,
  IFeatureDefinitionRepository,
  IFeatureSnapshotRepository,
  IFeatureBuildRunRepository,
  IEntryStrategyProfileRepository,
  IEntryMetadataRepository
} from "./interfaces";

/**
 * ====================================================================
 * IN-MEMORY REPOSITORY DATABASE TABLES
 * ====================================================================
 */
export let mockTeams: Team[] = [];
export let mockContests: Contest[] = [];
export let mockLegs: ContestLeg[] = [];
export let mockGames: Game[] = [];
export let mockLines: TeamWeekLine[] = [];
export let mockEntries: SurvivorEntry[] = [];
export let mockPicks: SurvivorPick[] = [];
export let mockHistory: SurvivorHistory[] = [];
export let mockWeeklyInputs: WeeklyInput[] = [];
export let mockTeamFeatures: TeamFeature[] = [];
export let mockGameFeatures: GameFeature[] = [];
export let mockImportJobs: ImportJob[] = [];
export let mockInventories: EntryInventory[] = [];
export let mockReservedTeams: ReservedTeam[] = [];
export let mockHolidayReservations: HolidayReservation[] = [];
export let mockFutureValueProfiles: FutureValueProfile[] = [];
export let mockRiskProfiles: RiskProfile[] = [];
export let mockGameRiskAssessments: GameRiskAssessment[] = [];
export let mockEntryRecommendations: EntryRecommendation[] = [];
export let mockPortfolioRecommendations: PortfolioRecommendation[] = [];
export let mockWeeklySnapshots: WeeklySnapshot[] = [];
export let mockFeatureSnapshots: FeatureSnapshot[] = [];
export let mockInventorySnapshots: InventorySnapshotRecord[] = [];
export let mockRiskSnapshots: RiskSnapshot[] = [];
export let mockWeeklyRecSnapshots: RecommendationSnapshot[] = [];
export let mockDecisionAuditRecords: DecisionAuditRecord[] = [];
export let mockSimulationRuns: SimulationRun[] = [];

// --- FEATURE STORE MOCK TABLES ---
export let mockFeatureDefinitions: FeatureDefinition[] = [
  {
    feature_id: "days_rest",
    feature_name: "Days of Rest",
    feature_category: "Scheduling",
    description: "Total rest days prior to the game kickoff.",
    sport: "NFL",
    active_flag: true,
    created_at: new Date().toISOString()
  },
  {
    feature_id: "home_field_advantage",
    feature_name: "Home Field Advantage",
    feature_category: "Situational",
    description: "Binary indicator (1.0 or 0.0) of whether the team has home field advantage in the game.",
    sport: "NFL",
    active_flag: true,
    created_at: new Date().toISOString()
  },
  {
    feature_id: "market_spread",
    feature_name: "Market Spread",
    feature_category: "Market",
    description: "Official betting line market spread for the team (negative for favorites, positive for underdogs).",
    sport: "NFL",
    active_flag: true,
    created_at: new Date().toISOString()
  },
  {
    feature_id: "market_total",
    feature_name: "Market Over/Under Total",
    feature_category: "Market",
    description: "Official betting line total over/under projection for the game.",
    sport: "NFL",
    active_flag: true,
    created_at: new Date().toISOString()
  },
  {
    feature_id: "team_win_pct",
    feature_name: "Team Win Percentage",
    feature_category: "Performance",
    description: "The historical winning percentage of the team leading up to the current week.",
    sport: "NFL",
    active_flag: true,
    created_at: new Date().toISOString()
  },
  {
    feature_id: "future_team_value",
    feature_name: "Future Team Value",
    feature_category: "Long-term",
    description: "Projected future valuation multiplier for survivor or simulation weightings.",
    sport: "NFL",
    active_flag: true,
    created_at: new Date().toISOString()
  }
];
export let mockFeatureStoreSnapshots: FeatureStoreSnapshot[] = [];
export let mockFeatureBuildRuns: FeatureBuildRun[] = [];

export let mockEntryStrategyProfiles: EntryStrategyProfile[] = [];
export let mockEntryMetadataRecords: EntryMetadata[] = [];

const defaultMetadata: EntryMetadata[] = [
  {
    entry_id: "UWOSH-1",
    owner_name: "Steve",
    entry_description: "UWOSH-1 Steve Entry",
    entry_notes: "High Priority",
    primary_goal: "Maximize championship expected value",
    secondary_goal: "ROI optimization",
    active_flag: true
  },
  {
    entry_id: "UWOSH-2",
    owner_name: "Steve",
    entry_description: "UWOSH-2 Steve Entry",
    entry_notes: "Portfolio entry",
    primary_goal: "Portfolio diversification",
    secondary_goal: "Jointly optimize with UWOSH-1",
    active_flag: true
  },
  {
    entry_id: "UWOSH-3",
    owner_name: "Cameron",
    entry_description: "UWOSH-3 Cameron Entry",
    entry_notes: "Marketplace resale focus",
    primary_goal: "Survive into mid-season",
    secondary_goal: "Increase marketplace resale value",
    active_flag: true
  },
  {
    entry_id: "UWOSH-4",
    owner_name: "UW Oshkosh Group Entry",
    entry_description: "9 total participants.",
    entry_notes: "Low risk focus",
    primary_goal: "Maximize survival probability",
    secondary_goal: "Avoid aggressive strategies",
    active_flag: true
  }
];

const defaultProfiles: EntryStrategyProfile[] = [
  {
    profile_id: 1,
    entry_id: "UWOSH-1",
    strategy_type: StrategyType.CHAMPIONSHIP_EV,
    objective: "Maximize championship expected value.",
    risk_tolerance: "HIGH",
    diversification_group: "UWOSH_GROUP",
    marketplace_target: "NONE",
    notes: "Steve first entry"
  },
  {
    profile_id: 2,
    entry_id: "UWOSH-2",
    strategy_type: StrategyType.PORTFOLIO_EV,
    objective: "Optimize jointly with UWOSH-1. Avoid unnecessary duplicate selections. Maximize combined portfolio EV.",
    risk_tolerance: "MEDIUM",
    diversification_group: "UWOSH_GROUP",
    marketplace_target: "NONE",
    notes: "Steve second entry (portfolio logic)"
  },
  {
    profile_id: 3,
    entry_id: "UWOSH-3",
    strategy_type: StrategyType.MARKETPLACE_SURVIVAL,
    objective: "Survive into mid-season to increase marketplace resale value. Favor safer selections early. Lower volatility.",
    risk_tolerance: "LOW",
    diversification_group: "CAMERON",
    marketplace_target: "MID_SEASON",
    notes: "Cameron marketplace survival entry"
  },
  {
    profile_id: 4,
    entry_id: "UWOSH-4",
    strategy_type: StrategyType.GROUP_SURVIVAL,
    objective: "9 total participants. Maximize survival probability. Reduce risk. Avoid aggressive strategies.",
    risk_tolerance: "VERY_LOW",
    diversification_group: "UWOSH_GROUP_4",
    marketplace_target: "NONE",
    notes: "UW Oshkosh Group entry (9 participants)"
  }
];

/**
 * Global database reset / seed helper
 */
export function resetMockDatabase(
  teams: Team[],
  contests: Contest[],
  legs: ContestLeg[],
  entries: SurvivorEntry[],
  picks: SurvivorPick[],
  games: Game[],
  lines: TeamWeekLine[]
) {
  mockTeams = [...teams];
  mockContests = [...contests];
  mockLegs = [...legs];
  mockEntries = [...entries];
  mockPicks = [...picks];
  mockGames = [...games];
  mockLines = [...lines];
  mockHistory = [];
  mockEntryMetadataRecords = [...defaultMetadata];
  mockEntryStrategyProfiles = [...defaultProfiles];
}

/**
 * 1. Team Repository Implementation
 */
export class MockTeamRepository implements ITeamRepository {
  async getAll(): Promise<Team[]> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM teams ORDER BY name ASC;
    */
    return [...mockTeams];
  }

  async getById(id: string): Promise<Team | null> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM teams WHERE id = $1 LIMIT 1;
    */
    return mockTeams.find(t => t.id === id) || null;
  }

  async save(team: Team): Promise<Team> {
    /* 
      PostgreSQL Reference:
      INSERT INTO teams (id, name, abbreviation, bye_week, primary_color, secondary_color)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name, 
        abbreviation = EXCLUDED.abbreviation, 
        bye_week = EXCLUDED.bye_week, 
        primary_color = EXCLUDED.primary_color, 
        secondary_color = EXCLUDED.secondary_color
      RETURNING *;
    */
    const existing = mockTeams.findIndex(t => t.id === team.id);
    if (existing !== -1) {
      mockTeams[existing] = team;
    } else {
      mockTeams.push(team);
    }
    return team;
  }
}

/**
 * 2. Contest Repository Implementation
 */
export class MockContestRepository implements IContestRepository {
  async getAll(): Promise<Contest[]> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM contests ORDER BY year DESC;
    */
    return [...mockContests];
  }

  async getById(id: string): Promise<Contest | null> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM contests WHERE id = $1 LIMIT 1;
    */
    return mockContests.find(c => c.id === id) || null;
  }

  async save(contest: Contest): Promise<Contest> {
    /* 
      PostgreSQL Reference:
      INSERT INTO contests (id, name, year, status)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status
      RETURNING *;
    */
    const existing = mockContests.findIndex(c => c.id === contest.id);
    if (existing !== -1) {
      mockContests[existing] = contest;
    } else {
      mockContests.push(contest);
    }
    return contest;
  }
}

/**
 * 3. ContestLeg Repository Implementation
 */
export class MockContestLegRepository implements IContestLegRepository {
  async getAll(): Promise<ContestLeg[]> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM contest_legs ORDER BY display_order ASC;
    */
    return [...mockLegs];
  }

  async getById(id: string): Promise<ContestLeg | null> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM contest_legs WHERE id = $1 LIMIT 1;
    */
    return mockLegs.find(l => l.id === id) || null;
  }

  async getByContestId(contestId: string): Promise<ContestLeg[]> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM contest_legs WHERE contest_id = $1 ORDER BY display_order ASC;
    */
    return [...mockLegs];
  }

  async save(leg: ContestLeg): Promise<ContestLeg> {
    /* 
      PostgreSQL Reference:
      INSERT INTO contest_legs (id, contest_id, name, leg_type, display_order, nfl_week)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name, 
        leg_type = EXCLUDED.leg_type, 
        display_order = EXCLUDED.display_order, 
        nfl_week = EXCLUDED.nfl_week
      RETURNING *;
    */
    const existing = mockLegs.findIndex(l => l.id === leg.id);
    if (existing !== -1) {
      mockLegs[existing] = leg;
    } else {
      mockLegs.push(leg);
    }
    return leg;
  }
}

/**
 * 4. Game Repository Implementation
 */
export class MockGameRepository implements IGameRepository {
  async getAll(): Promise<Game[]> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM games ORDER BY game_time ASC;
    */
    return [...mockGames];
  }

  async getById(id: string): Promise<Game | null> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM games WHERE id = $1 LIMIT 1;
    */
    return mockGames.find(g => g.id === id) || null;
  }

  async getByLegId(legId: string): Promise<Game[]> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM games WHERE contest_leg_id = $1 ORDER BY game_time ASC;
    */
    return mockGames.filter(g => g.contest_leg_id === legId);
  }

  async save(game: Game): Promise<Game> {
    /* 
      PostgreSQL Reference:
      INSERT INTO games (id, contest_leg_id, home_team_id, away_team_id, home_score, away_score, status, game_time)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET 
        home_score = EXCLUDED.home_score, 
        away_score = EXCLUDED.away_score, 
        status = EXCLUDED.status, 
        game_time = EXCLUDED.game_time
      RETURNING *;
    */
    const existing = mockGames.findIndex(g => g.id === game.id);
    if (existing !== -1) {
      mockGames[existing] = game;
    } else {
      mockGames.push(game);
    }
    return game;
  }
}

/**
 * 5. TeamWeekLine Repository Implementation
 */
export class MockTeamWeekLineRepository implements ITeamWeekLineRepository {
  async getAll(): Promise<TeamWeekLine[]> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM team_week_lines;
    */
    return [...mockLines];
  }

  async getByLegId(legId: string): Promise<TeamWeekLine[]> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM team_week_lines WHERE contest_leg_id = $1;
    */
    return mockLines.filter(l => l.contest_leg_id === legId);
  }

  async getByTeamAndLeg(teamId: string, legId: string): Promise<TeamWeekLine | null> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM team_week_lines WHERE team_id = $1 AND contest_leg_id = $2 LIMIT 1;
    */
    return mockLines.find(l => l.team_id === teamId && l.contest_leg_id === legId) || null;
  }

  async save(line: TeamWeekLine): Promise<TeamWeekLine> {
    /* 
      PostgreSQL Reference:
      INSERT INTO team_week_lines (id, team_id, contest_leg_id, win_probability, pick_popularity, future_value, leverage_multiplier, holiday_safety_multiplier, contest_equity_score)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (team_id, contest_leg_id) DO UPDATE SET 
        win_probability = EXCLUDED.win_probability, 
        pick_popularity = EXCLUDED.pick_popularity, 
        future_value = EXCLUDED.future_value, 
        leverage_multiplier = EXCLUDED.leverage_multiplier, 
        holiday_safety_multiplier = EXCLUDED.holiday_safety_multiplier, 
        contest_equity_score = EXCLUDED.contest_equity_score
      RETURNING *;
    */
    const existing = mockLines.findIndex(l => l.team_id === line.team_id && l.contest_leg_id === line.contest_leg_id);
    if (existing !== -1) {
      mockLines[existing] = line;
    } else {
      mockLines.push(line);
    }
    return line;
  }
}

/**
 * 6. SurvivorEntry Repository Implementation
 */
export class MockSurvivorEntryRepository implements ISurvivorEntryRepository {
  async getAll(): Promise<SurvivorEntry[]> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM survivor_entries ORDER BY created_at ASC;
    */
    return [...mockEntries];
  }

  async getById(id: string): Promise<SurvivorEntry | null> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM survivor_entries WHERE id = $1 LIMIT 1;
    */
    return mockEntries.find(e => e.id === id) || null;
  }

  async create(entry: { contest_id?: string; name: string; notes?: string }): Promise<SurvivorEntry> {
    /* 
      PostgreSQL Reference:
      INSERT INTO survivor_entries (id, contest_id, name, status, notes)
      VALUES (uuid_generate_v4(), $1, $2, 'alive', $3)
      RETURNING *;
    */
    const newEntry: SurvivorEntry = {
      id: `entry-${Date.now()}`,
      name: entry.name,
      status: "alive",
      notes: entry.notes || "",
      created_at: new Date().toISOString()
    };
    mockEntries.push(newEntry);
    return newEntry;
  }

  async update(id: string, updates: Partial<SurvivorEntry>): Promise<SurvivorEntry | null> {
    /* 
      PostgreSQL Reference:
      UPDATE survivor_entries 
      SET name = COALESCE($2, name), notes = COALESCE($3, notes), status = COALESCE($4, status), updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    */
    const idx = mockEntries.findIndex(e => e.id === id);
    if (idx === -1) return null;
    
    mockEntries[idx] = {
      ...mockEntries[idx],
      ...updates
    };
    return mockEntries[idx];
  }

  async delete(id: string): Promise<boolean> {
    /* 
      PostgreSQL Reference:
      DELETE FROM survivor_entries WHERE id = $1;
    */
    const idx = mockEntries.findIndex(e => e.id === id);
    if (idx === -1) return false;
    mockEntries.splice(idx, 1);
    return true;
  }
}

/**
 * 7. SurvivorPick Repository Implementation
 */
export class MockSurvivorPickRepository implements ISurvivorPickRepository {
  async getAll(): Promise<SurvivorPick[]> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM survivor_picks;
    */
    return [...mockPicks];
  }

  async getById(id: string): Promise<SurvivorPick | null> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM survivor_picks WHERE id = $1 LIMIT 1;
    */
    return mockPicks.find(p => p.id === id) || null;
  }

  async getByEntryId(entryId: string): Promise<SurvivorPick[]> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM survivor_picks WHERE entry_id = $1 ORDER BY created_at ASC;
    */
    return mockPicks.filter(p => p.entry_id === entryId);
  }

  async getByLegId(legId: string): Promise<SurvivorPick[]> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM survivor_picks WHERE contest_leg_id = $1;
    */
    return mockPicks.filter(p => p.contest_leg_id === legId);
  }

  async getByEntryAndLeg(entryId: string, legId: string): Promise<SurvivorPick | null> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM survivor_picks WHERE entry_id = $1 AND contest_leg_id = $2 LIMIT 1;
    */
    return mockPicks.find(p => p.entry_id === entryId && p.contest_leg_id === legId) || null;
  }

  async getByEntryAndTeam(entryId: string, teamId: string): Promise<SurvivorPick | null> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM survivor_picks WHERE entry_id = $1 AND team_id = $2 LIMIT 1;
    */
    return mockPicks.find(p => p.entry_id === entryId && p.team_id === teamId) || null;
  }

  async createOrUpdate(pick: { id?: string; entry_id: string; contest_leg_id: string; team_id: string; pick_status: 'pending' | 'won' | 'lost' }): Promise<SurvivorPick> {
    /* 
      PostgreSQL Reference:
      INSERT INTO survivor_picks (id, entry_id, contest_leg_id, team_id, pick_status)
      VALUES (COALESCE($1, uuid_generate_v4()), $2, $3, $4, $5)
      ON CONFLICT (entry_id, contest_leg_id) DO UPDATE SET 
        team_id = EXCLUDED.team_id, 
        pick_status = EXCLUDED.pick_status,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    */
    const existingIdx = mockPicks.findIndex(p => p.entry_id === pick.entry_id && p.contest_leg_id === pick.contest_leg_id);
    
    if (existingIdx !== -1) {
      mockPicks[existingIdx] = {
        ...mockPicks[existingIdx],
        team_id: pick.team_id,
        pick_status: pick.pick_status,
        created_at: new Date().toISOString()
      };
      return mockPicks[existingIdx];
    } else {
      const newPick: SurvivorPick = {
        id: pick.id || `pick-${Date.now()}`,
        entry_id: pick.entry_id,
        contest_leg_id: pick.contest_leg_id,
        team_id: pick.team_id,
        pick_status: pick.pick_status,
        created_at: new Date().toISOString()
      };
      mockPicks.push(newPick);
      return newPick;
    }
  }

  async delete(id: string): Promise<boolean> {
    /* 
      PostgreSQL Reference:
      DELETE FROM survivor_picks WHERE id = $1;
    */
    const idx = mockPicks.findIndex(p => p.id === id);
    if (idx === -1) return false;
    mockPicks.splice(idx, 1);
    return true;
  }

  async deleteByEntryId(entryId: string): Promise<boolean> {
    /* 
      PostgreSQL Reference:
      DELETE FROM survivor_picks WHERE entry_id = $1;
    */
    const beforeCount = mockPicks.length;
    mockPicks = mockPicks.filter(p => p.entry_id !== entryId);
    return mockPicks.length < beforeCount;
  }
}

/**
 * 8. SurvivorHistory Repository Implementation
 */
export class MockSurvivorHistoryRepository implements ISurvivorHistoryRepository {
  async getAll(): Promise<SurvivorHistory[]> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM survivor_history ORDER BY created_at ASC;
    */
    return [...mockHistory];
  }

  async getByEntryId(entryId: string): Promise<SurvivorHistory[]> {
    /* 
      PostgreSQL Reference:
      SELECT * FROM survivor_history WHERE entry_id = $1;
    */
    return mockHistory.filter(h => h.entry_id === entryId);
  }

  async save(history: SurvivorHistory): Promise<SurvivorHistory> {
    /* 
      PostgreSQL Reference:
      INSERT INTO survivor_history (id, entry_id, contest_leg_id, team_id, result)
      VALUES (COALESCE($1, uuid_generate_v4()), $2, $3, $4, $5)
      RETURNING *;
    */
    mockHistory.push(history);
    return history;
  }
}

/**
 * 9. WeeklyInput Repository Implementation (Mock)
 */
export class MockWeeklyInputRepository implements IWeeklyInputRepository {
  async getAll(): Promise<WeeklyInput[]> {
    return [...mockWeeklyInputs];
  }

  async getById(id: string): Promise<WeeklyInput | null> {
    return mockWeeklyInputs.find(wi => wi.id === id) || null;
  }

  async getByLegAndTeam(legId: string, teamId: string): Promise<WeeklyInput | null> {
    return mockWeeklyInputs.find(wi => wi.contest_leg_id === legId && wi.team_id === teamId) || null;
  }

  async getByLegId(legId: string): Promise<WeeklyInput[]> {
    return mockWeeklyInputs.filter(wi => wi.contest_leg_id === legId);
  }

  async save(input: WeeklyInput): Promise<WeeklyInput> {
    const idx = mockWeeklyInputs.findIndex(wi => wi.contest_leg_id === input.contest_leg_id && wi.team_id === input.team_id);
    if (idx !== -1) {
      mockWeeklyInputs[idx] = { ...input, updated_at: new Date().toISOString() };
      return mockWeeklyInputs[idx];
    } else {
      const newInput = {
        ...input,
        id: input.id || `wi-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockWeeklyInputs.push(newInput);
      return newInput;
    }
  }

  async delete(id: string): Promise<boolean> {
    const idx = mockWeeklyInputs.findIndex(wi => wi.id === id);
    if (idx === -1) return false;
    mockWeeklyInputs.splice(idx, 1);
    return true;
  }
}

/**
 * 10. TeamFeature Repository Implementation (Mock)
 */
export class MockTeamFeatureRepository implements ITeamFeatureRepository {
  async getAll(): Promise<TeamFeature[]> {
    return [...mockTeamFeatures];
  }

  async getById(id: string): Promise<TeamFeature | null> {
    return mockTeamFeatures.find(tf => tf.id === id) || null;
  }

  async getByLegAndTeam(legId: string, teamId: string): Promise<TeamFeature | null> {
    return mockTeamFeatures.find(tf => tf.contest_leg_id === legId && tf.team_id === teamId) || null;
  }

  async getByLegId(legId: string): Promise<TeamFeature[]> {
    return mockTeamFeatures.filter(tf => tf.contest_leg_id === legId);
  }

  async save(feature: TeamFeature): Promise<TeamFeature> {
    const idx = mockTeamFeatures.findIndex(tf => tf.contest_leg_id === feature.contest_leg_id && tf.team_id === feature.team_id);
    if (idx !== -1) {
      mockTeamFeatures[idx] = { ...feature, updated_at: new Date().toISOString() };
      return mockTeamFeatures[idx];
    } else {
      const newFeature = {
        ...feature,
        id: feature.id || `tf-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockTeamFeatures.push(newFeature);
      return newFeature;
    }
  }

  async delete(id: string): Promise<boolean> {
    const idx = mockTeamFeatures.findIndex(tf => tf.id === id);
    if (idx === -1) return false;
    mockTeamFeatures.splice(idx, 1);
    return true;
  }
}

/**
 * 11. GameFeature Repository Implementation (Mock)
 */
export class MockGameFeatureRepository implements IGameFeatureRepository {
  async getAll(): Promise<GameFeature[]> {
    return [...mockGameFeatures];
  }

  async getById(id: string): Promise<GameFeature | null> {
    return mockGameFeatures.find(gf => gf.id === id) || null;
  }

  async getByLegAndTeams(legId: string, homeTeamId: string, awayTeamId: string): Promise<GameFeature | null> {
    return mockGameFeatures.find(gf => gf.contest_leg_id === legId && gf.home_team_id === homeTeamId && gf.away_team_id === awayTeamId) || null;
  }

  async getByLegId(legId: string): Promise<GameFeature[]> {
    return mockGameFeatures.filter(gf => gf.contest_leg_id === legId);
  }

  async save(feature: GameFeature): Promise<GameFeature> {
    const idx = mockGameFeatures.findIndex(gf => gf.contest_leg_id === feature.contest_leg_id && gf.home_team_id === feature.home_team_id && gf.away_team_id === feature.away_team_id);
    if (idx !== -1) {
      mockGameFeatures[idx] = { ...feature, updated_at: new Date().toISOString() };
      return mockGameFeatures[idx];
    } else {
      const newFeature = {
        ...feature,
        id: feature.id || `gf-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockGameFeatures.push(newFeature);
      return newFeature;
    }
  }

  async delete(id: string): Promise<boolean> {
    const idx = mockGameFeatures.findIndex(gf => gf.id === id);
    if (idx === -1) return false;
    mockGameFeatures.splice(idx, 1);
    return true;
  }
}

/**
 * 12. ImportJob Repository Implementation (Mock)
 */
export class MockImportJobRepository implements IImportJobRepository {
  async getAll(): Promise<ImportJob[]> {
    return [...mockImportJobs];
  }

  async getById(id: string): Promise<ImportJob | null> {
    return mockImportJobs.find(job => job.id === id) || null;
  }

  async create(job: Omit<ImportJob, "id" | "created_at" | "updated_at">): Promise<ImportJob> {
    const newJob: ImportJob = {
      ...job,
      id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockImportJobs.push(newJob);
    return newJob;
  }

  async update(id: string, updates: Partial<ImportJob>): Promise<ImportJob | null> {
    const idx = mockImportJobs.findIndex(job => job.id === id);
    if (idx === -1) return null;
    mockImportJobs[idx] = {
      ...mockImportJobs[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    return mockImportJobs[idx];
  }
}

/**
 * 13. Inventory Repository Implementation (Mock)
 */
export class MockInventoryRepository implements IInventoryRepository {
  async getByEntryIdAndLeg(entryId: string, legId: string): Promise<EntryInventory | null> {
    return mockInventories.find(inv => inv.entry_id === entryId && inv.contest_leg_id === legId) || null;
  }

  async getAllForEntry(entryId: string): Promise<EntryInventory[]> {
    return mockInventories.filter(inv => inv.entry_id === entryId);
  }

  async save(inventory: EntryInventory): Promise<EntryInventory> {
    const item = { ...inventory };
    if (!item.id) {
      item.id = `inv-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }
    const idx = mockInventories.findIndex(inv => inv.id === item.id);
    if (idx !== -1) {
      mockInventories[idx] = item;
    } else {
      mockInventories.push(item);
    }
    return item;
  }

  async delete(id: string): Promise<boolean> {
    const idx = mockInventories.findIndex(inv => inv.id === id);
    if (idx === -1) return false;
    mockInventories.splice(idx, 1);
    return true;
  }
}

/**
 * 14. Reservation Repository Implementation (Mock)
 */
export class MockReservationRepository implements IReservationRepository {
  async getReservedTeams(entryId: string): Promise<ReservedTeam[]> {
    return mockReservedTeams.filter(rt => rt.entry_id === entryId);
  }

  async getHolidayReservations(entryId: string): Promise<HolidayReservation[]> {
    return mockHolidayReservations.filter(hr => hr.entry_id === entryId);
  }

  async saveReservedTeam(reservedTeam: ReservedTeam): Promise<ReservedTeam> {
    const item = { ...reservedTeam };
    if (!item.id) {
      item.id = `rt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }
    const idx = mockReservedTeams.findIndex(rt => rt.id === item.id);
    if (idx !== -1) {
      mockReservedTeams[idx] = item;
    } else {
      mockReservedTeams.push(item);
    }
    return item;
  }

  async saveHolidayReservation(reservation: HolidayReservation): Promise<HolidayReservation> {
    const item = { ...reservation };
    if (!item.id) {
      item.id = `hr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }
    const idx = mockHolidayReservations.findIndex(hr => hr.id === item.id);
    if (idx !== -1) {
      mockHolidayReservations[idx] = item;
    } else {
      mockHolidayReservations.push(item);
    }
    return item;
  }

  async deleteReservedTeam(id: string): Promise<boolean> {
    const idx = mockReservedTeams.findIndex(rt => rt.id === id);
    if (idx === -1) return false;
    mockReservedTeams.splice(idx, 1);
    return true;
  }

  async deleteHolidayReservation(id: string): Promise<boolean> {
    const idx = mockHolidayReservations.findIndex(hr => hr.id === id);
    if (idx === -1) return false;
    mockHolidayReservations.splice(idx, 1);
    return true;
  }
}

/**
 * 15. Future Value Repository Implementation (Mock)
 */
export class MockFutureValueRepository implements IFutureValueRepository {
  async getAllProfiles(): Promise<FutureValueProfile[]> {
    return [...mockFutureValueProfiles];
  }

  async getProfile(teamId: string, legId: string): Promise<FutureValueProfile | null> {
    return mockFutureValueProfiles.find(f => f.team_id === teamId && f.contest_leg_id === legId) || null;
  }

  async getProfilesByLeg(legId: string): Promise<FutureValueProfile[]> {
    return mockFutureValueProfiles.filter(f => f.contest_leg_id === legId);
  }

  async saveProfile(profile: FutureValueProfile): Promise<FutureValueProfile> {
    const item = { ...profile };
    if (!item.id) {
      item.id = `fv-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }
    const idx = mockFutureValueProfiles.findIndex(f => f.id === item.id);
    if (idx !== -1) {
      mockFutureValueProfiles[idx] = item;
    } else {
      mockFutureValueProfiles.push(item);
    }
    return item;
  }
}

/**
 * 16. Risk Repository Implementation (Mock)
 */
export class MockRiskRepository implements IRiskRepository {
  async getByEntryIdAndLeg(entryId: string, legId: string): Promise<RiskProfile | null> {
    return mockRiskProfiles.find(rp => rp.entry_id === entryId && rp.contest_leg_id === legId) || null;
  }

  async getAllForEntry(entryId: string): Promise<RiskProfile[]> {
    return mockRiskProfiles.filter(rp => rp.entry_id === entryId);
  }

  async save(profile: RiskProfile): Promise<RiskProfile> {
    const item = { ...profile };
    if (!item.id) {
      item.id = `rp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }
    const idx = mockRiskProfiles.findIndex(rp => rp.id === item.id);
    if (idx !== -1) {
      mockRiskProfiles[idx] = item;
    } else {
      mockRiskProfiles.push(item);
    }
    return item;
  }

  async delete(id: string): Promise<boolean> {
    const idx = mockRiskProfiles.findIndex(rp => rp.id === id);
    if (idx === -1) return false;
    mockRiskProfiles.splice(idx, 1);
    return true;
  }
}

/**
 * 17. Risk Assessment Repository Implementation (Mock)
 */
export class MockRiskAssessmentRepository implements IRiskAssessmentRepository {
  async getByGameAndLeg(gameId: string, legId: string): Promise<GameRiskAssessment | null> {
    return mockGameRiskAssessments.find(gra => gra.game_id === gameId && gra.contest_leg_id === legId) || null;
  }

  async getAssessmentByLegAndTeams(legId: string, homeTeamId: string, awayTeamId: string): Promise<GameRiskAssessment | null> {
    return mockGameRiskAssessments.find(gra => 
      gra.contest_leg_id === legId && 
      gra.home_team_risk.team_id === homeTeamId && 
      gra.away_team_risk.team_id === awayTeamId
    ) || null;
  }

  async getByLegId(legId: string): Promise<GameRiskAssessment[]> {
    return mockGameRiskAssessments.filter(gra => gra.contest_leg_id === legId);
  }

  async save(assessment: GameRiskAssessment): Promise<GameRiskAssessment> {
    const item = { ...assessment };
    if (!item.id) {
      item.id = `gra-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }
    const idx = mockGameRiskAssessments.findIndex(gra => gra.id === item.id);
    if (idx !== -1) {
      mockGameRiskAssessments[idx] = item;
    } else {
      mockGameRiskAssessments.push(item);
    }
    return item;
  }

  async delete(id: string): Promise<boolean> {
    const idx = mockGameRiskAssessments.findIndex(gra => gra.id === id);
    if (idx === -1) return false;
    mockGameRiskAssessments.splice(idx, 1);
    return true;
  }
}

/**
 * 18. Recommendation Repository Implementation (Mock)
 */
export class MockRecommendationRepository implements IRecommendationRepository {
  async getByEntryAndLeg(entryId: string, legId: string): Promise<EntryRecommendation | null> {
    return mockEntryRecommendations.find(er => er.entry_id === entryId && er.contest_leg_id === legId) || null;
  }

  async getAllForEntry(entryId: string): Promise<EntryRecommendation[]> {
    return mockEntryRecommendations.filter(er => er.entry_id === entryId);
  }

  async save(recommendation: EntryRecommendation): Promise<EntryRecommendation> {
    const item = { ...recommendation };
    if (!item.id) {
      item.id = `er-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }
    const idx = mockEntryRecommendations.findIndex(er => er.id === item.id);
    if (idx !== -1) {
      mockEntryRecommendations[idx] = item;
    } else {
      mockEntryRecommendations.push(item);
    }
    return item;
  }

  async delete(id: string): Promise<boolean> {
    const idx = mockEntryRecommendations.findIndex(er => er.id === id);
    if (idx === -1) return false;
    mockEntryRecommendations.splice(idx, 1);
    return true;
  }
}

/**
 * 19. Recommendation Snapshot Repository Implementation (Mock)
 */
export class MockRecommendationSnapshotRepository implements IRecommendationSnapshotRepository {
  async getByLegId(legId: string): Promise<PortfolioRecommendation | null> {
    return mockPortfolioRecommendations.find(pr => pr.contest_leg_id === legId) || null;
  }

  async save(portfolio: PortfolioRecommendation): Promise<PortfolioRecommendation> {
    const item = { ...portfolio };
    if (!item.id) {
      item.id = `pr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }
    const idx = mockPortfolioRecommendations.findIndex(pr => pr.id === item.id);
    if (idx !== -1) {
      mockPortfolioRecommendations[idx] = item;
    } else {
      mockPortfolioRecommendations.push(item);
    }
    return item;
  }

  async delete(id: string): Promise<boolean> {
    const idx = mockPortfolioRecommendations.findIndex(pr => pr.id === id);
    if (idx === -1) return false;
    mockPortfolioRecommendations.splice(idx, 1);
    return true;
  }

  async getWeeklyRecSnapshot(legId: string): Promise<RecommendationSnapshot | null> {
    return mockWeeklyRecSnapshots.find(wrs => wrs.contest_leg_id === legId) || null;
  }

  async saveWeeklyRecSnapshot(snapshot: RecommendationSnapshot): Promise<RecommendationSnapshot> {
    const item = { ...snapshot };
    if (!item.id) {
      item.id = `wrs-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }
    const idx = mockWeeklyRecSnapshots.findIndex(wrs => wrs.id === item.id);
    if (idx !== -1) {
      mockWeeklyRecSnapshots[idx] = item;
    } else {
      mockWeeklyRecSnapshots.push(item);
    }
    return item;
  }

  async getAllWeeklyRecSnapshots(): Promise<RecommendationSnapshot[]> {
    return [...mockWeeklyRecSnapshots];
  }
}

/**
 * 20. Snapshot Repository Implementation (Mock)
 */
export class MockSnapshotRepository implements ISnapshotRepository {
  async getWeeklySnapshot(legId: string): Promise<WeeklySnapshot | null> {
    return mockWeeklySnapshots.find(ws => ws.contest_leg_id === legId) || null;
  }

  async saveWeeklySnapshot(snapshot: WeeklySnapshot): Promise<WeeklySnapshot> {
    const item = { ...snapshot };
    if (!item.id) {
      item.id = `ws-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }
    const idx = mockWeeklySnapshots.findIndex(ws => ws.id === item.id);
    if (idx !== -1) {
      mockWeeklySnapshots[idx] = item;
    } else {
      mockWeeklySnapshots.push(item);
    }
    return item;
  }

  async getAllWeeklySnapshots(): Promise<WeeklySnapshot[]> {
    return [...mockWeeklySnapshots];
  }

  async getFeatureSnapshot(legId: string): Promise<FeatureSnapshot | null> {
    return mockFeatureSnapshots.find(fs => fs.contest_leg_id === legId) || null;
  }

  async saveFeatureSnapshot(snapshot: FeatureSnapshot): Promise<FeatureSnapshot> {
    const item = { ...snapshot };
    if (!item.id) {
      item.id = `fs-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }
    const idx = mockFeatureSnapshots.findIndex(fs => fs.id === item.id);
    if (idx !== -1) {
      mockFeatureSnapshots[idx] = item;
    } else {
      mockFeatureSnapshots.push(item);
    }
    return item;
  }

  async getAllFeatureSnapshots(): Promise<FeatureSnapshot[]> {
    return [...mockFeatureSnapshots];
  }

  async getInventorySnapshot(entryId: string, legId: string): Promise<InventorySnapshotRecord | null> {
    return mockInventorySnapshots.find(is => is.entry_id === entryId && is.contest_leg_id === legId) || null;
  }

  async saveInventorySnapshot(snapshot: InventorySnapshotRecord): Promise<InventorySnapshotRecord> {
    const item = { ...snapshot };
    if (!item.id) {
      item.id = `is-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }
    const idx = mockInventorySnapshots.findIndex(is => is.id === item.id);
    if (idx !== -1) {
      mockInventorySnapshots[idx] = item;
    } else {
      mockInventorySnapshots.push(item);
    }
    return item;
  }

  async getAllInventorySnapshotsByLeg(legId: string): Promise<InventorySnapshotRecord[]> {
    return mockInventorySnapshots.filter(is => is.contest_leg_id === legId);
  }

  async getRiskSnapshot(legId: string): Promise<RiskSnapshot | null> {
    return mockRiskSnapshots.find(rs => rs.contest_leg_id === legId) || null;
  }

  async saveRiskSnapshot(snapshot: RiskSnapshot): Promise<RiskSnapshot> {
    const item = { ...snapshot };
    if (!item.id) {
      item.id = `rs-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }
    const idx = mockRiskSnapshots.findIndex(rs => rs.id === item.id);
    if (idx !== -1) {
      mockRiskSnapshots[idx] = item;
    } else {
      mockRiskSnapshots.push(item);
    }
    return item;
  }

  async getAllRiskSnapshots(): Promise<RiskSnapshot[]> {
    return [...mockRiskSnapshots];
  }
}

/**
 * 21. Audit Repository Implementation (Mock)
 */
export class MockAuditRepository implements IAuditRepository {
  async getAuditByLeg(legId: string): Promise<DecisionAuditRecord | null> {
    return mockDecisionAuditRecords.find(dar => dar.contest_leg_id === legId) || null;
  }

  async getAuditsByWeek(weekNumber: number): Promise<DecisionAuditRecord[]> {
    return mockDecisionAuditRecords.filter(dar => dar.week_number === weekNumber);
  }

  async getAllAudits(): Promise<DecisionAuditRecord[]> {
    return [...mockDecisionAuditRecords];
  }

  async save(record: DecisionAuditRecord): Promise<DecisionAuditRecord> {
    const item = { ...record };
    if (!item.id) {
      item.id = `dar-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }
    const idx = mockDecisionAuditRecords.findIndex(dar => dar.id === item.id);
    if (idx !== -1) {
      mockDecisionAuditRecords[idx] = item;
    } else {
      mockDecisionAuditRecords.push(item);
    }
    return item;
  }
}

/**
 * 22. Simulation Repository Implementation (Mock)
 */
export class MockSimulationRepository implements ISimulationRepository {
  async getStrategyMultiplier(strategy: string, metric: string): Promise<number> {
    if (strategy === "safe") {
      if (metric === "win_prob") return 1.2;
      if (metric === "popularity") return 0.5;
    } else if (strategy === "contrarian") {
      if (metric === "win_prob") return 0.8;
      if (metric === "popularity") return 2.0;
    }
    return 1.0;
  }
}

/**
 * 23. Simulation Run Repository Implementation (Mock)
 */
export class MockSimulationRunRepository implements ISimulationRunRepository {
  async getAll(): Promise<SimulationRun[]> {
    return [...mockSimulationRuns];
  }

  async getById(id: string): Promise<SimulationRun | null> {
    return mockSimulationRuns.find(r => r.id === id) || null;
  }

  async getByLegId(legId: string): Promise<SimulationRun[]> {
    return mockSimulationRuns.filter(r => r.contest_leg_id === legId);
  }

  async save(run: SimulationRun): Promise<SimulationRun> {
    const item = { ...run };
    if (!item.id) {
      item.id = `sim-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }
    const idx = mockSimulationRuns.findIndex(r => r.id === item.id);
    if (idx !== -1) {
      mockSimulationRuns[idx] = item;
    } else {
      mockSimulationRuns.push(item);
    }
    return item;
  }

  async delete(id: string): Promise<boolean> {
    const idx = mockSimulationRuns.findIndex(r => r.id === id);
    if (idx === -1) return false;
    mockSimulationRuns.splice(idx, 1);
    return true;
  }
}

/**
 * 24. Simulation Result Repository Implementation (Mock)
 */
export class MockSimulationResultRepository implements ISimulationResultRepository {
  async getProjectionsByRunId(runId: string): Promise<EntrySurvivalProjection[]> {
    const run = mockSimulationRuns.find(r => r.id === runId);
    return run ? run.entry_projections : [];
  }
}

// In-memory array to persist audit logs for security panel
export const mockAuthAuditRecords: AuthAuditRecord[] = [];

export class MockAuthAuditRepository implements IAuthAuditRepository {
  async getAll(): Promise<AuthAuditRecord[]> {
    return [...mockAuthAuditRecords];
  }

  async getRecent(limit: number): Promise<AuthAuditRecord[]> {
    return [...mockAuthAuditRecords]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async create(record: Omit<AuthAuditRecord, "id" | "timestamp">): Promise<AuthAuditRecord> {
    const newRecord: AuthAuditRecord = {
      ...record,
      id: "aud_" + Math.random().toString(36).substring(2, 10),
      timestamp: new Date().toISOString()
    };
    mockAuthAuditRecords.push(newRecord);
    return newRecord;
  }
}

export const mockSystemMetadata: SystemMetadata = {
  systemName: "Semi-Sharp",
  currentVersion: "v0.27",
  currentGitBranch: "main",
  currentGitTag: "v0.27-project-memory-foundation",
  deploymentEnvironment: "production-mock",
  serverHostname: "mock-host.local",
  databaseName: "mock-sandbox",
  lastStartupTimestamp: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const mockApplicationVersions: ApplicationVersion[] = [
  {
    versionId: 1,
    versionTag: "v0.26",
    gitCommitHash: "a7b3c9e1f2d34567890abcdef1234567890abcde",
    releaseDate: "2026-06-21T12:00:00Z",
    releaseNotes: "Established raw system security roles and administrative gatekeeper rules.",
    milestoneName: "Auth cutover",
    createdAt: "2026-06-21T12:00:00Z"
  },
  {
    versionId: 2,
    versionTag: "v0.27",
    gitCommitHash: "8f9e0d1c2b3a4f5e6d7c8b9a0f1e2d3c4b5a6f7e",
    releaseDate: "2026-06-22T15:00:00Z",
    releaseNotes: "Upgraded platform to support persistent project memory, system metadata, and deep audits.",
    milestoneName: "Project Memory Foundation",
    createdAt: "2026-06-22T15:00:00Z"
  }
];

export const mockProjectDecisions: ProjectDecision[] = [
  {
    decisionId: 1,
    decisionDate: "2026-06-20",
    category: "Architectural Pattern",
    title: "Repository Pattern Mandatory",
    rationale: "Requires all tables and models to be decoupled via isolated class repositories.",
    impact: "Guarantees that database models can switch seamlessly between low-overhead mock in-memory states and postgres high-fidelity states.",
    status: "APPROVED",
    createdAt: "2026-06-20T10:00:00Z"
  },
  {
    decisionId: 2,
    decisionDate: "2026-06-21",
    category: "Persistence Strategy",
    title: "PostgreSQL Authoritative Store",
    rationale: "Adopt raw PostgreSQL relational engine for high-fidelity persistence tracking.",
    impact: "Secures and validates transaction logs, contest runs, system health metrics, and user logs with transactional durability.",
    status: "APPROVED",
    createdAt: "2026-06-21T10:00:00Z"
  },
  {
    decisionId: 3,
    decisionDate: "2026-06-21",
    category: "Aesthetic Rule",
    title: "Mock Mode Retained",
    rationale: "Retain full in-memory mock repositories and fallback controls for sandboxed testing.",
    impact: "Provides frictionless local development environment when running without an active PostgreSQL cluster link.",
    status: "APPROVED",
    createdAt: "2026-06-21T11:00:00Z"
  },
  {
    decisionId: 4,
    decisionDate: "2026-06-22",
    category: "Environment Boundary",
    title: "Cloudflare Deployment",
    rationale: "Configure proxy tunnels and gateway firewalls to isolate system parameters.",
    impact: "Protects backoffice dashboards and JSON endpoints behind Cloudflare verification layer.",
    status: "APPROVED",
    createdAt: "2026-06-22T10:00:00Z"
  },
  {
    decisionId: 5,
    decisionDate: "2026-06-22",
    category: "Feature Strategy",
    title: "Historical Replay Architecture",
    rationale: "Model contest historical data with sub-second simulation replay features.",
    impact: "Allows testing modeling strategies across past season records with deep visual metric reviews.",
    status: "APPROVED",
    createdAt: "2026-06-22T11:00:00Z"
  }
];

export const mockOperationsEvents: OperationsEvent[] = [
  {
    eventId: 1,
    eventType: "Application Startup",
    severity: "INFO",
    source: "system-bootstrap",
    description: "Application successfully bootstrapped system services in in-memory Mock Sandbox context.",
    metadataJson: { mode: "MOCK", version: "v0.27" },
    createdAt: new Date().toISOString()
  }
];

export class MockSystemMetadataRepository implements ISystemMetadataRepository {
  private metadata = { ...mockSystemMetadata };

  async getLatest(): Promise<SystemMetadata | null> {
    return this.metadata;
  }

  async save(metadata: SystemMetadata): Promise<SystemMetadata> {
    this.metadata = {
      ...metadata,
      updatedAt: new Date().toISOString()
    };
    return this.metadata;
  }
}

export class MockApplicationVersionsRepository implements IApplicationVersionsRepository {
  async getAll(): Promise<ApplicationVersion[]> {
    return [...mockApplicationVersions];
  }

  async create(version: Omit<ApplicationVersion, "versionId" | "createdAt">): Promise<ApplicationVersion> {
    const newVersion: ApplicationVersion = {
      ...version,
      versionId: mockApplicationVersions.length + 1,
      createdAt: new Date().toISOString()
    };
    mockApplicationVersions.push(newVersion);
    return newVersion;
  }
}

export class MockProjectDecisionsRepository implements IProjectDecisionsRepository {
  async getAll(): Promise<ProjectDecision[]> {
    return [...mockProjectDecisions];
  }

  async create(decision: Omit<ProjectDecision, "decisionId" | "createdAt">): Promise<ProjectDecision> {
    const newDecision: ProjectDecision = {
      ...decision,
      decisionId: mockProjectDecisions.length + 1,
      createdAt: new Date().toISOString()
    };
    mockProjectDecisions.push(newDecision);
    return newDecision;
  }
}

export class MockOperationsEventsRepository implements IOperationsEventsRepository {
  async getAll(): Promise<OperationsEvent[]> {
    return [...mockOperationsEvents];
  }

  async getRecent(limit: number): Promise<OperationsEvent[]> {
    return [...mockOperationsEvents]
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limit);
  }

  async create(event: Omit<OperationsEvent, "eventId" | "createdAt">): Promise<OperationsEvent> {
    const newEvent: OperationsEvent = {
      ...event,
      eventId: mockOperationsEvents.length + 1,
      createdAt: new Date().toISOString()
    };
    mockOperationsEvents.push(newEvent);
    return newEvent;
  }
}

export class MockFeatureDefinitionRepository implements IFeatureDefinitionRepository {
  async getAll(): Promise<FeatureDefinition[]> {
    return [...mockFeatureDefinitions];
  }

  async getByFeatureId(id: string): Promise<FeatureDefinition | null> {
    return mockFeatureDefinitions.find(fd => fd.feature_id === id) || null;
  }

  async save(definition: FeatureDefinition): Promise<FeatureDefinition> {
    const existingIdx = mockFeatureDefinitions.findIndex(fd => fd.feature_id === definition.feature_id);
    const item = { ...definition, created_at: definition.created_at || new Date().toISOString() };
    if (existingIdx >= 0) {
      mockFeatureDefinitions[existingIdx] = item;
    } else {
      mockFeatureDefinitions.push(item);
    }
    return item;
  }
}

export class MockFeatureSnapshotRepository implements IFeatureSnapshotRepository {
  async getAll(): Promise<FeatureStoreSnapshot[]> {
    return [...mockFeatureStoreSnapshots];
  }

  async getBySeasonAndWeek(season: number, week: number): Promise<FeatureStoreSnapshot[]> {
    return mockFeatureStoreSnapshots.filter(fs => fs.season === season && fs.week === week);
  }

  async save(snapshot: FeatureStoreSnapshot): Promise<FeatureStoreSnapshot> {
    const item = { 
      ...snapshot, 
      snapshot_id: snapshot.snapshot_id || mockFeatureStoreSnapshots.length + 1, 
      created_at: snapshot.created_at || new Date().toISOString() 
    };
    mockFeatureStoreSnapshots.push(item);
    return item;
  }

  async saveMany(snapshots: FeatureStoreSnapshot[]): Promise<FeatureStoreSnapshot[]> {
    const saved: FeatureStoreSnapshot[] = [];
    for (const snap of snapshots) {
      saved.push(await this.save(snap));
    }
    return saved;
  }
}

export class MockFeatureBuildRunRepository implements IFeatureBuildRunRepository {
  async getAll(): Promise<FeatureBuildRun[]> {
    return [...mockFeatureBuildRuns];
  }

  async getById(id: number | string): Promise<FeatureBuildRun | null> {
    const numericId = typeof id === "string" ? parseInt(id, 10) : id;
    return mockFeatureBuildRuns.find(fr => fr.run_id === numericId) || null;
  }

  async getLatest(): Promise<FeatureBuildRun | null> {
    if (mockFeatureBuildRuns.length === 0) return null;
    return [...mockFeatureBuildRuns].sort((a, b) => {
      const idxA = typeof a.run_id === "number" ? a.run_id : 0;
      const idxB = typeof b.run_id === "number" ? b.run_id : 0;
      return idxB - idxA;
    })[0];
  }

  async save(run: FeatureBuildRun): Promise<FeatureBuildRun> {
    const runId = run.run_id || mockFeatureBuildRuns.length + 1;
    const existingIdx = mockFeatureBuildRuns.findIndex(fr => fr.run_id === runId);
    const item: FeatureBuildRun = {
      ...run,
      run_id: runId
    };
    if (existingIdx >= 0) {
      mockFeatureBuildRuns[existingIdx] = item;
    } else {
      mockFeatureBuildRuns.push(item);
    }
    return item;
  }
}

export class MockEntryStrategyProfileRepository implements IEntryStrategyProfileRepository {
  async getAll(): Promise<EntryStrategyProfile[]> {
    return [...mockEntryStrategyProfiles];
  }

  async getByEntryId(entryId: string): Promise<EntryStrategyProfile | null> {
    return mockEntryStrategyProfiles.find(p => p.entry_id === entryId) || null;
  }

  async save(profile: EntryStrategyProfile): Promise<EntryStrategyProfile> {
    const existingIdx = mockEntryStrategyProfiles.findIndex(p => p.entry_id === profile.entry_id);
    const item: EntryStrategyProfile = {
      ...profile,
      profile_id: profile.profile_id || mockEntryStrategyProfiles.length + 1,
      created_at: profile.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (existingIdx >= 0) {
      mockEntryStrategyProfiles[existingIdx] = item;
    } else {
      mockEntryStrategyProfiles.push(item);
    }
    return item;
  }

  async deleteByEntryId(entryId: string): Promise<boolean> {
    const originalLen = mockEntryStrategyProfiles.length;
    mockEntryStrategyProfiles = mockEntryStrategyProfiles.filter(p => p.entry_id !== entryId);
    return mockEntryStrategyProfiles.length < originalLen;
  }
}

export class MockEntryMetadataRepository implements IEntryMetadataRepository {
  async getAll(): Promise<EntryMetadata[]> {
    return [...mockEntryMetadataRecords];
  }

  async getByEntryId(entryId: string): Promise<EntryMetadata | null> {
    return mockEntryMetadataRecords.find(m => m.entry_id === entryId) || null;
  }

  async save(metadata: EntryMetadata): Promise<EntryMetadata> {
    const existingIdx = mockEntryMetadataRecords.findIndex(m => m.entry_id === metadata.entry_id);
    const item: EntryMetadata = {
      ...metadata,
      created_at: metadata.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (existingIdx >= 0) {
      mockEntryMetadataRecords[existingIdx] = item;
    } else {
      mockEntryMetadataRecords.push(item);
    }
    return item;
  }

  async deleteByEntryId(entryId: string): Promise<boolean> {
    const originalLen = mockEntryMetadataRecords.length;
    mockEntryMetadataRecords = mockEntryMetadataRecords.filter(m => m.entry_id !== entryId);
    return mockEntryMetadataRecords.length < originalLen;
  }
}









