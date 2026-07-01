// DataQualityService.ts
// Engine to detect schema irregularities, anomalies, and alias issues in incoming schedule data

import { ImportRow } from "./ScheduleImportFramework";
import { teamAliasResolverService } from "./TeamAliasResolverService";
import { gameRepo, legRepo } from "../repositories/index";

export interface DataQualityIssue {
  row_index?: number;
  type: 'unknown_alias' | 'duplicate_game' | 'missing_kickoff' | 'missing_team' | 'invalid_week' | 'invalid_leg' | 'schedule_conflict';
  message: string;
  severity: 'warning' | 'error';
  raw_data?: string;
}

export class DataQualityService {
  /**
   * Evaluates import rows and produces warning/error telemetries.
   * Does not mutate or repair data.
   */
  async validateSchedule(rows: ImportRow[], providerName?: string): Promise<DataQualityIssue[]> {
    const issues: DataQualityIssue[] = [];
    
    // Fetch DB tables for context validation
    const dbLegs = await legRepo.getAll();
    const dbGames = await gameRepo.getAll();

    // Structures to trace conflicts within this batch
    const teamGamesInWeek = new Map<string, { week: number; rowIndex: number; opponent: string }[]>();
    const seenGames = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowIndex = i + 1;
      const rawString = JSON.stringify(row);

      // 1. Missing Teams
      if (!row.home_team || row.home_team.trim() === "") {
        issues.push({
          row_index: rowIndex,
          type: 'missing_team',
          message: `Row ${rowIndex} is missing the home team identifier.`,
          severity: 'error',
          raw_data: rawString
        });
      }
      if (!row.away_team || row.away_team.trim() === "") {
        issues.push({
          row_index: rowIndex,
          type: 'missing_team',
          message: `Row ${rowIndex} is missing the away team identifier.`,
          severity: 'error',
          raw_data: rawString
        });
      }

      // Resolve Team Aliases FIRST
      let resolvedHome: string | null = null;
      let resolvedAway: string | null = null;

      if (row.home_team && row.home_team.trim() !== "") {
        resolvedHome = await teamAliasResolverService.resolveTeamId(row.home_team, providerName);
        if (!resolvedHome) {
          issues.push({
            row_index: rowIndex,
            type: 'unknown_alias',
            message: `Unresolved home team alias: '${row.home_team}' at row ${rowIndex}.`,
            severity: 'error',
            raw_data: rawString
          });
        }
      }

      if (row.away_team && row.away_team.trim() !== "") {
        resolvedAway = await teamAliasResolverService.resolveTeamId(row.away_team, providerName);
        if (!resolvedAway) {
          issues.push({
            row_index: rowIndex,
            type: 'unknown_alias',
            message: `Unresolved away team alias: '${row.away_team}' at row ${rowIndex}.`,
            severity: 'error',
            raw_data: rawString
          });
        }
      }

      // 2. Self Play (using resolved canonical team IDs!)
      if (resolvedHome && resolvedAway && resolvedHome === resolvedAway) {
        issues.push({
          row_index: rowIndex,
          type: 'schedule_conflict',
          message: `Home team and Away team are identical: '${row.home_team}' at row ${rowIndex}.`,
          severity: 'error',
          raw_data: rawString
        });
      }

      // 3. Invalid Week Assignments
      if (row.week === undefined || isNaN(row.week) || row.week < 1 || row.week > 18) {
        issues.push({
          row_index: rowIndex,
          type: 'invalid_week',
          message: `Invalid week number: '${row.week}' at row ${rowIndex}. Must be 1-18.`,
          severity: 'error',
          raw_data: rawString
        });
      } else {
        // 4. Invalid Contest Leg Matching
        const leg = dbLegs.find(l => l.nfl_week === row.week);
        if (!leg) {
          issues.push({
            row_index: rowIndex,
            type: 'invalid_leg',
            message: `No active contest leg configured for NFL Week ${row.week} at row ${rowIndex}.`,
            severity: 'warning',
            raw_data: rawString
          });
        }
      }

      // 5. Missing Kickoff Times
      if (!row.game_time || isNaN(Date.parse(row.game_time))) {
        issues.push({
          row_index: rowIndex,
          type: 'missing_kickoff',
          message: `Missing or invalid kickoff time: '${row.game_time}' at row ${rowIndex}.`,
          severity: 'warning',
          raw_data: rawString
        });
      }

      // Trace batch-level schedule duplicate & conflicts if aliases are resolved
      if (resolvedHome && resolvedAway) {
        const gameKey = `${row.week}_${resolvedHome}_${resolvedAway}`;
        const reverseGameKey = `${row.week}_${resolvedAway}_${resolvedHome}`;

        // Duplicate game in this batch
        if (seenGames.has(gameKey) || seenGames.has(reverseGameKey)) {
          issues.push({
            row_index: rowIndex,
            type: 'duplicate_game',
            message: `Duplicate game in import batch: ${row.home_team} vs ${row.away_team} for Week ${row.week} at row ${rowIndex}.`,
            severity: 'warning',
            raw_data: rawString
          });
        }
        seenGames.add(gameKey);

        // Schedule Conflict: Team scheduled multiple times in the same week (within import batch)
        const homeTrace = teamGamesInWeek.get(resolvedHome) || [];
        const existingHomeGame = homeTrace.find(g => g.week === row.week);
        if (existingHomeGame) {
          issues.push({
            row_index: rowIndex,
            type: 'schedule_conflict',
            message: `Scheduling conflict: Team '${row.home_team}' plays multiple games in Week ${row.week} (Row ${rowIndex} vs Row ${existingHomeGame.rowIndex}).`,
            severity: 'warning',
            raw_data: rawString
          });
        }
        homeTrace.push({ week: row.week, rowIndex, opponent: resolvedAway });
        teamGamesInWeek.set(resolvedHome, homeTrace);

        const awayTrace = teamGamesInWeek.get(resolvedAway) || [];
        const existingAwayGame = awayTrace.find(g => g.week === row.week);
        if (existingAwayGame) {
          issues.push({
            row_index: rowIndex,
            type: 'schedule_conflict',
            message: `Scheduling conflict: Team '${row.away_team}' plays multiple games in Week ${row.week} (Row ${rowIndex} vs Row ${existingAwayGame.rowIndex}).`,
            severity: 'warning',
            raw_data: rawString
          });
        }
        awayTrace.push({ week: row.week, rowIndex, opponent: resolvedHome });
        teamGamesInWeek.set(resolvedAway, awayTrace);

        // Compare against already database-persisted games
        const matchedDbGame = dbGames.find(g => {
          const leg = dbLegs.find(l => l.id === g.contest_leg_id);
          if (!leg || leg.nfl_week !== row.week) return false;
          return (g.home_team_id === resolvedHome && g.away_team_id === resolvedAway) ||
                 (g.home_team_id === resolvedAway && g.away_team_id === resolvedHome);
        });

        if (matchedDbGame) {
          issues.push({
            row_index: rowIndex,
            type: 'duplicate_game',
            message: `Game between '${row.home_team}' and '${row.away_team}' in Week ${row.week} already exists in the database.`,
            severity: 'warning',
            raw_data: rawString
          });
        }
      }
    }

    return issues;
  }
}

export const dataQualityService = new DataQualityService();
