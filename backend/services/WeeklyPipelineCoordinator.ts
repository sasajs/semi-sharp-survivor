// WeeklyPipelineCoordinator.ts
// Pipeline controller that orchestrates schedule importing and down-stream analytics generation

import { ImportRow, parseCSV, parseJSON } from "./ScheduleImportFramework";
import { dataQualityService, DataQualityIssue } from "./DataQualityService";
import { teamAliasResolverService } from "./TeamAliasResolverService";
import { scheduleImportService, ImportSummary } from "./ScheduleImportService";
import { 
  importJobRepo, 
  legRepo, 
  gameRepo, 
  weeklyInputRepo, 
  teamFeatureRepo, 
  gameFeatureRepo 
} from "../repositories/index";
import { Game, WeeklyInput, TeamFeature, GameFeature, ImportJob } from "../../src/types";

export class WeeklyPipelineCoordinator {
  /**
   * Stage 1: Import Schedule (Raw Parsing)
   */
  importSchedule(filename: string, content: string): ImportRow[] {
    const isJson = filename.endsWith(".json") || content.trim().startsWith("[") || content.trim().startsWith("{");
    return isJson ? parseJSON(content) : parseCSV(content);
  }

  /**
   * Stage 2: Resolve Aliases
   */
  async resolveAliases(rows: ImportRow[], provider: string): Promise<{ row: ImportRow; resolvedHome: string | null; resolvedAway: string | null }[]> {
    const results: { row: ImportRow; resolvedHome: string | null; resolvedAway: string | null }[] = [];
    for (const r of rows) {
      const resolvedHome = await teamAliasResolverService.resolveTeamId(r.home_team, provider);
      const resolvedAway = await teamAliasResolverService.resolveTeamId(r.away_team, provider);
      results.push({ row: r, resolvedHome, resolvedAway });
    }
    return results;
  }

  /**
   * Stage 3: Validate Schedule
   */
  async validateSchedule(rows: ImportRow[], provider: string): Promise<DataQualityIssue[]> {
    return await dataQualityService.validateSchedule(rows, provider);
  }

  /**
   * Stage 4: Persist Games
   */
  async persistGames(
    resolvedRows: { row: ImportRow; resolvedHome: string | null; resolvedAway: string | null }[],
    mode: 'dry_run' | 'commit'
  ): Promise<{ games: Game[]; insertedCount: number; updatedCount: number; rejectedCount: number }> {
    const dbLegs = await legRepo.getAll();
    const dbGames = await gameRepo.getAll();

    const games: Game[] = [];
    let insertedCount = 0;
    let updatedCount = 0;
    let rejectedCount = 0;

    for (const item of resolvedRows) {
      const { row, resolvedHome, resolvedAway } = item;
      if (!resolvedHome || !resolvedAway || isNaN(row.week) || row.week < 1 || row.week > 18) {
        rejectedCount++;
        continue;
      }

      const leg = dbLegs.find(l => l.nfl_week === row.week);
      if (!leg) {
        rejectedCount++;
        continue;
      }

      const existingGame = dbGames.find(g => {
        return g.contest_leg_id === leg.id &&
               ((g.home_team_id === resolvedHome && g.away_team_id === resolvedAway) ||
                (g.home_team_id === resolvedAway && g.away_team_id === resolvedHome));
      });

      if (existingGame) {
        const gameToSave: Game = {
          ...existingGame,
          game_time: row.game_time || existingGame.game_time,
          home_score: row.home_score !== undefined ? row.home_score : existingGame.home_score,
          away_score: row.away_score !== undefined ? row.away_score : existingGame.away_score,
          status: row.status || existingGame.status
        };
        updatedCount++;
        if (mode === 'commit') {
          const saved = await gameRepo.save(gameToSave);
          games.push(saved);
        } else {
          games.push(gameToSave);
        }
      } else {
        const gameToSave: Game = {
          id: "",
          contest_leg_id: leg.id,
          home_team_id: resolvedHome,
          away_team_id: resolvedAway,
          home_score: row.home_score,
          away_score: row.away_score,
          status: row.status || 'scheduled',
          game_time: row.game_time
        };
        insertedCount++;
        if (mode === 'commit') {
          const saved = await gameRepo.save(gameToSave);
          games.push(saved);
        } else {
          games.push(gameToSave);
        }
      }
    }

    return { games, insertedCount, updatedCount, rejectedCount };
  }

  /**
   * Stage 5: Generate Weekly Inputs
   */
  async generateWeeklyInputs(games: Game[], mode: 'dry_run' | 'commit'): Promise<WeeklyInput[]> {
    const weeklyInputs: WeeklyInput[] = [];
    for (const g of games) {
      const teamsToGenerate = [g.home_team_id, g.away_team_id];
      for (const tId of teamsToGenerate) {
        // Query if weekly inputs already exist
        const existing = await weeklyInputRepo.getByLegAndTeam(g.contest_leg_id, tId);
        const input: WeeklyInput = {
          id: existing?.id || "",
          contest_leg_id: g.contest_leg_id,
          team_id: tId,
          rest_days: 7,
          rest_disparity: 0,
          sic_score: 100,
          injury_risk_score: 0,
          travel_disadvantage: 0,
          weather_risk: 0,
          quarterback_status: 'healthy',
          divisional_game_flag: false,
          short_week_flag: false
        };

        if (mode === 'commit') {
          const saved = await weeklyInputRepo.save(input);
          weeklyInputs.push(saved);
        } else {
          weeklyInputs.push(input);
        }
      }
    }
    return weeklyInputs;
  }

  /**
   * Stage 6: Generate Team Features
   */
  async generateTeamFeatures(games: Game[], mode: 'dry_run' | 'commit'): Promise<TeamFeature[]> {
    const features: TeamFeature[] = [];
    for (const g of games) {
      const teamsToGenerate = [g.home_team_id, g.away_team_id];
      for (const tId of teamsToGenerate) {
        const existing = await teamFeatureRepo.getByLegAndTeam(g.contest_leg_id, tId);
        const feature: TeamFeature = {
          id: existing?.id || "",
          contest_leg_id: g.contest_leg_id,
          team_id: tId,
          off_efficiency: existing?.off_efficiency || 0,
          def_efficiency: existing?.def_efficiency || 0,
          net_efficiency: existing?.net_efficiency || 0,
          injury_index: existing?.injury_index || 0,
          rest_days: 7,
          short_week_flag: false
        };

        if (mode === 'commit') {
          const saved = await teamFeatureRepo.save(feature);
          features.push(saved);
        } else {
          features.push(feature);
        }
      }
    }
    return features;
  }

  /**
   * Stage 7: Generate Game Features
   */
  async generateGameFeatures(games: Game[], mode: 'dry_run' | 'commit'): Promise<GameFeature[]> {
    const features: GameFeature[] = [];
    for (const g of games) {
      if (!g.id && mode === 'commit') continue; // needs a valid game ID
      
      const existing = await gameFeatureRepo.getByLegAndTeams(g.contest_leg_id, g.home_team_id, g.away_team_id);
      const feature: GameFeature = {
        id: existing?.id || "",
        contest_leg_id: g.contest_leg_id,
        game_id: g.id || undefined,
        home_team_id: g.home_team_id,
        away_team_id: g.away_team_id,
        rest_disparity: 0,
        weather_risk: 0,
        divisional_game_flag: false,
        line_spread: 0,
        over_under: 45,
        home_win_probability_pff: 0.5
      };

      if (mode === 'commit') {
        const saved = await gameFeatureRepo.save(feature);
        features.push(saved);
      } else {
        features.push(feature);
      }
    }
    return features;
  }

  /**
   * Stage 8: Record Import Statistics
   */
  async recordImportStatistics(jobId: string, stats: Partial<ImportJob>): Promise<ImportJob | null> {
    return await importJobRepo.update(jobId, stats);
  }

  /**
   * Orchestrates the complete end-to-end 8-stage pipeline.
   */
  async runPipeline(
    filename: string,
    content: string,
    provider: string,
    initiatedBy: string = 'admin'
  ): Promise<ImportSummary> {
    // Rely on the transactional ScheduleImportService to parse, validate, persist and log errors
    const summary = await scheduleImportService.runImport(filename, content, provider, 'commit', initiatedBy);

    if (summary.status === 'completed') {
      // Fetch the games created during the run to generate down-stream features
      const dbLegs = await legRepo.getAll();
      const dbGames = await gameRepo.getAll();
      const rawRows = this.importSchedule(filename, content);
      const resolved = await this.resolveAliases(rawRows, provider);

      // Filter games that belong to this import batch
      const gamesThisBatch: Game[] = [];
      for (const r of resolved) {
        if (!r.resolvedHome || !r.resolvedAway) continue;
        const leg = dbLegs.find(l => l.nfl_week === r.row.week);
        if (!leg) continue;
        const game = dbGames.find(g => {
          return g.contest_leg_id === leg.id &&
                 ((g.home_team_id === r.resolvedHome && g.away_team_id === r.resolvedAway) ||
                  (g.home_team_id === r.resolvedAway && g.away_team_id === r.resolvedHome));
        });
        if (game) {
          gamesThisBatch.push(game);
        }
      }

      // Generate downstream inputs and features
      await this.generateWeeklyInputs(gamesThisBatch, 'commit');
      await this.generateTeamFeatures(gamesThisBatch, 'commit');
      await this.generateGameFeatures(gamesThisBatch, 'commit');
    }

    return summary;
  }
}

export const weeklyPipelineCoordinator = new WeeklyPipelineCoordinator();
