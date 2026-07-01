// ScheduleImportService.ts
// Orchestrator for Schedule Imports with Validation, Dry Runs, Duplication Detection, and Telemetry

import { createHash } from "crypto";
import { ImportRow, parseCSV, parseJSON } from "./ScheduleImportFramework";
import { dataQualityService, DataQualityIssue } from "./DataQualityService";
import { teamAliasResolverService } from "./TeamAliasResolverService";
import { importJobRepo, legRepo, gameRepo } from "../repositories/index";
import { ImportJob, Game, ContestLeg } from "../../src/types";

export interface ImportPreviewResult {
  filename: string;
  checksum: string;
  provider: string;
  rows_read: number;
  rows_inserted: number;
  rows_updated: number;
  rows_rejected: number;
  warnings: DataQualityIssue[];
  alias_resolutions: { raw: string; resolved: string }[];
  duplicate_games: { home: string; away: string; week: number }[];
  preview_rows: {
    week: number;
    home_team: string;
    resolved_home: string | null;
    resolved_home_alias?: string | null;
    away_team: string;
    resolved_away: string | null;
    resolved_away_alias?: string | null;
    game_time: string;
    action: 'insert' | 'update' | 'reject';
    reason?: string;
  }[];
}

export interface ImportSummary {
  job_id: string;
  status: 'pending' | 'dry_run' | 'completed' | 'failed';
  provider: string;
  filename: string;
  duration_ms: number;
  rows_read: number;
  rows_inserted: number;
  rows_updated: number;
  rows_rejected: number;
  errors: DataQualityIssue[];
}

export class ScheduleImportService {
  private calculateChecksum(content: string): string {
    return createHash("sha256").update(content).digest("hex");
  }

  /**
   * Generates a preview result from incoming schedule files without writing to DB.
   */
  async previewImport(
    filename: string,
    content: string,
    provider: string
  ): Promise<ImportPreviewResult> {
    const isJson = filename.endsWith(".json") || content.trim().startsWith("[") || content.trim().startsWith("{");
    const rawRows = isJson ? parseJSON(content) : parseCSV(content);

    const checksum = this.calculateChecksum(content);
    const warnings = await dataQualityService.validateSchedule(rawRows, provider);

    const dbLegs = await legRepo.getAll();
    const dbGames = await gameRepo.getAll();

    let rows_inserted = 0;
    let rows_updated = 0;
    let rows_rejected = 0;

    const alias_resolutions: { raw: string; resolved: string }[] = [];
    const duplicate_games: { home: string; away: string; week: number }[] = [];
    const preview_rows: ImportPreviewResult["preview_rows"] = [];

    const resolvedCache = new Map<string, string | null>();
    const getResolvedId = async (team: string): Promise<string | null> => {
      const lower = team.trim().toLowerCase();
      if (resolvedCache.has(lower)) return resolvedCache.get(lower)!;
      const id = await teamAliasResolverService.resolveTeamId(team, provider);
      resolvedCache.set(lower, id);
      if (id) {
        alias_resolutions.push({ raw: team, resolved: id });
      }
      return id;
    };

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const resHome = await getResolvedId(row.home_team);
      const resAway = await getResolvedId(row.away_team);
      const resHomeAlias = teamAliasResolverService.normalizeTeamAlias(row.home_team);
      const resAwayAlias = teamAliasResolverService.normalizeTeamAlias(row.away_team);

      if (!resHome || !resAway || isNaN(row.week) || row.week < 1 || row.week > 18) {
        rows_rejected++;
        preview_rows.push({
          week: row.week,
          home_team: row.home_team,
          resolved_home: resHome,
          resolved_home_alias: resHomeAlias,
          away_team: row.away_team,
          resolved_away: resAway,
          resolved_away_alias: resAwayAlias,
          game_time: row.game_time,
          action: 'reject',
          reason: !resHome ? `Unresolved home team '${row.home_team}'` : (!resAway ? `Unresolved away team '${row.away_team}'` : `Invalid week ${row.week}`)
        });
        continue;
      }

      // Find contest leg
      const leg = dbLegs.find(l => l.nfl_week === row.week);
      if (!leg) {
        rows_rejected++;
        preview_rows.push({
          week: row.week,
          home_team: row.home_team,
          resolved_home: resHome,
          resolved_home_alias: resHomeAlias,
          away_team: row.away_team,
          resolved_away: resAway,
          resolved_away_alias: resAwayAlias,
          game_time: row.game_time,
          action: 'reject',
          reason: `No active contest leg configured for NFL Week ${row.week}`
        });
        continue;
      }

      // Check if duplicate/update
      const existingGame = dbGames.find(g => {
        return g.contest_leg_id === leg.id &&
               ((g.home_team_id === resHome && g.away_team_id === resAway) ||
                (g.home_team_id === resAway && g.away_team_id === resHome));
      });

      if (existingGame) {
        rows_updated++;
        duplicate_games.push({ home: resHome, away: resAway, week: row.week });
        preview_rows.push({
          week: row.week,
          home_team: row.home_team,
          resolved_home: resHome,
          resolved_home_alias: resHomeAlias,
          away_team: row.away_team,
          resolved_away: resAway,
          resolved_away_alias: resAwayAlias,
          game_time: row.game_time,
          action: 'update',
          reason: `Game already exists. Kickoff or score metadata will be updated.`
        });
      } else {
        rows_inserted++;
        preview_rows.push({
          week: row.week,
          home_team: row.home_team,
          resolved_home: resHome,
          resolved_home_alias: resHomeAlias,
          away_team: row.away_team,
          resolved_away: resAway,
          resolved_away_alias: resAwayAlias,
          game_time: row.game_time,
          action: 'insert'
        });
      }
    }

    return {
      filename,
      checksum,
      provider,
      rows_read: rawRows.length,
      rows_inserted,
      rows_updated,
      rows_rejected,
      warnings,
      alias_resolutions,
      duplicate_games,
      preview_rows
    };
  }

  /**
   * Imports game schedule rows from raw file.
   */
  async runImport(
    filename: string,
    content: string,
    provider: string,
    mode: 'dry_run' | 'commit',
    initiatedBy: string = 'admin'
  ): Promise<ImportSummary> {
    const startTime = Date.now();
    const checksum = this.calculateChecksum(content);

    // Create Initial Import Job in Pending Status
    const job = await importJobRepo.create({
      job_type: "Schedule Import",
      file_name: filename,
      status: "pending",
      rows_processed: 0,
      provider,
      started_at: new Date().toISOString(),
      initiated_by: initiatedBy,
      rows_read: 0,
      rows_inserted: 0,
      rows_updated: 0,
      rows_rejected: 0,
      duration: 0
    });

    // Track Import File Metadata
    await importJobRepo.createFile({
      import_job_id: job.id,
      filename,
      checksum,
      file_size: Buffer.byteLength(content, 'utf8')
    });

    let rawRows: ImportRow[] = [];
    let errors: DataQualityIssue[] = [];

    try {
      const isJson = filename.endsWith(".json") || content.trim().startsWith("[") || content.trim().startsWith("{");
      rawRows = isJson ? parseJSON(content) : parseCSV(content);
    } catch (parseErr: any) {
      const duration = Date.now() - startTime;
      const failReason = `Format parsing error: ${parseErr.message}`;
      await importJobRepo.createError({
        import_job_id: job.id,
        error_message: failReason,
        severity: 'error'
      });
      await importJobRepo.update(job.id, {
        status: "failed",
        error_message: failReason,
        completed_at: new Date().toISOString(),
        duration
      });
      return {
        job_id: job.id,
        status: "failed",
        provider,
        filename,
        duration_ms: duration,
        rows_read: 0,
        rows_inserted: 0,
        rows_updated: 0,
        rows_rejected: 0,
        errors: [{ type: 'invalid_week', message: failReason, severity: 'error' }]
      };
    }

    // Run Validation checks
    errors = await dataQualityService.validateSchedule(rawRows, provider);

    // Save warnings to import_job_errors
    for (const issue of errors) {
      await importJobRepo.createError({
        import_job_id: job.id,
        row_index: issue.row_index,
        raw_data: issue.raw_data,
        error_message: issue.message,
        severity: issue.severity
      });
    }

    const dbLegs = await legRepo.getAll();
    const dbGames = await gameRepo.getAll();

    let rows_inserted = 0;
    let rows_updated = 0;
    let rows_rejected = 0;

    const rollbackQueue: { original: Game | null; current: Game }[] = [];

    try {
      for (let i = 0; i < rawRows.length; i++) {
        const row = rawRows[i];
        const rowIndex = i + 1;

        const resHome = await teamAliasResolverService.resolveTeamId(row.home_team, provider);
        const resAway = await teamAliasResolverService.resolveTeamId(row.away_team, provider);

        if (!resHome || !resAway || isNaN(row.week) || row.week < 1 || row.week > 18) {
          rows_rejected++;
          continue;
        }

        const leg = dbLegs.find(l => l.nfl_week === row.week);
        if (!leg) {
          rows_rejected++;
          continue;
        }

        // Locate game if it already exists to determine UPDATE vs INSERT
        const existingGame = dbGames.find(g => {
          return g.contest_leg_id === leg.id &&
                 ((g.home_team_id === resHome && g.away_team_id === resAway) ||
                  (g.home_team_id === resAway && g.away_team_id === resHome));
        });

        if (existingGame) {
          // UPDATE MODE
          const gameToSave: Game = {
            ...existingGame,
            game_time: row.game_time || existingGame.game_time,
            home_score: row.home_score !== undefined ? row.home_score : existingGame.home_score,
            away_score: row.away_score !== undefined ? row.away_score : existingGame.away_score,
            status: row.status || existingGame.status
          };

          rollbackQueue.push({ original: { ...existingGame }, current: gameToSave });
          rows_updated++;

          if (mode === 'commit') {
            await gameRepo.save(gameToSave);
          }
        } else {
          // INSERT MODE
          const gameToSave: Game = {
            id: "", // Repo factory save handles auto-uuid generating
            contest_leg_id: leg.id,
            home_team_id: resHome,
            away_team_id: resAway,
            home_score: row.home_score,
            away_score: row.away_score,
            status: row.status || 'scheduled',
            game_time: row.game_time
          };

          rollbackQueue.push({ original: null, current: gameToSave });
          rows_inserted++;

          if (mode === 'commit') {
            await gameRepo.save(gameToSave);
          }
        }
      }
    } catch (dbErr: any) {
      // Rollback support (manually restore state if required by mock environment,
      // or standard transactional rollback)
      if (mode === 'commit') {
        console.warn("[Schedule Import] Error during persist, rolling back write queue...", dbErr);
        for (const item of rollbackQueue) {
          if (item.original) {
            // Restore original record
            try { await gameRepo.save(item.original); } catch {}
          } else {
            // If we had deleted/inserted, usually standard rollback handles it or we can ignore
          }
        }
      }

      const duration = Date.now() - startTime;
      const failReason = `Database write error: ${dbErr.message}`;
      await importJobRepo.createError({
        import_job_id: job.id,
        error_message: failReason,
        severity: 'error'
      });
      await importJobRepo.update(job.id, {
        status: "failed",
        error_message: failReason,
        completed_at: new Date().toISOString(),
        duration
      });

      return {
        job_id: job.id,
        status: "failed",
        provider,
        filename,
        duration_ms: duration,
        rows_read: rawRows.length,
        rows_inserted: 0,
        rows_updated: 0,
        rows_rejected: rawRows.length,
        errors: [...errors, { type: 'schedule_conflict', message: failReason, severity: 'error' }]
      };
    }

    const duration = Date.now() - startTime;
    const finalStatus = mode === 'dry_run' ? 'dry_run' as const : 'completed' as const;

    await importJobRepo.update(job.id, {
      status: finalStatus,
      rows_processed: rows_inserted + rows_updated,
      rows_read: rawRows.length,
      rows_inserted,
      rows_updated,
      rows_rejected,
      completed_at: new Date().toISOString(),
      duration
    });

    return {
      job_id: job.id,
      status: finalStatus,
      provider,
      filename,
      duration_ms: duration,
      rows_read: rawRows.length,
      rows_inserted,
      rows_updated,
      rows_rejected,
      errors
    };
  }
}

export const scheduleImportService = new ScheduleImportService();
