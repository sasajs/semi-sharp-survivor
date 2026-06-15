import { ImportJob, WeeklyInput, TeamFeature, GameFeature } from "../../src/types";
import { 
  importJobRepo, 
  legRepo, 
  teamRepo, 
  weeklyInputRepo, 
  teamFeatureRepo, 
  gameFeatureRepo, 
  gameRepo,
  lineRepo
} from "../repositories";
import { ValidationService } from "../validation/validationService";

export class ImportService {
  /**
   * Safe CSV parser accepting raw csv file text and returning arrays of key-value records
   */
  private static parseCSV(csvText: string): { headers: string[]; rows: string[][] } {
    const lines = csvText
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) {
      return { headers: [], rows: [] };
    }

    // Helper to split a CSV line considering quotes
    const splitCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let currentToken = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          result.push(currentToken.trim());
          currentToken = "";
        } else {
          currentToken += char;
        }
      }
      result.push(currentToken.trim());
      return result;
    };

    const headers = splitCSVLine(lines[0]);
    const rows = lines.slice(1).map(line => splitCSVLine(line));

    return { headers, rows };
  }

  /**
   * Helper to retrieve all standard teams in the system as a Set of abbreviations
   */
  private static async getTeamMap(): Promise<Map<string, string>> {
    const teams = await teamRepo.getAll();
    const map = new Map<string, string>();
    teams.forEach(t => {
      map.set(t.id.toUpperCase(), t.id);
      map.set(t.name.toUpperCase(), t.id);
      map.set(t.abbreviation.toUpperCase(), t.id);
    });
    return map;
  }

  /**
   * Helper to retrieve contest leg corresponding to week number or display_order
   */
  private static async findContestLeg(weekVal: string): Promise<string | null> {
    const legs = await legRepo.getAll();
    const cleanOrder = parseInt(weekVal, 10);
    
    // Attempt exact digit match first
    if (!isNaN(cleanOrder)) {
      const match = legs.find(l => l.nfl_week === cleanOrder || l.display_order === cleanOrder);
      if (match) return match.id;
    }

    // Attempt fuzzy name/id prefix matches
    const search = weekVal.toLowerCase().replace(/[^a-z0-9]/g, "");
    const matchFuzzy = legs.find(l => {
      const lName = l.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      const lId = l.id.toLowerCase().replace(/[^a-z0-9]/g, "");
      return lName.includes(search) || lId.includes(search) || search.includes(lName);
    });

    return matchFuzzy ? matchFuzzy.id : (legs[0]?.id || null);
  }

  /**
   * 1. Import NFL Schedule CSV
   * Header expectation: week, home_team, away_team, spread, over_under (or matching close tags)
   */
  static async importNFLSchedule(fileName: string, csvText: string): Promise<ImportJob> {
    const job = await importJobRepo.create({
      job_type: "nfl_schedule",
      file_name: fileName,
      status: "pending",
      rows_processed: 0
    });

    try {
      const { headers, rows } = this.parseCSV(csvText);
      if (headers.length === 0) {
        throw new Error("No headers or data detected in CSV content.");
      }

      const teamMap = await this.getTeamMap();
      const knownAbbrs = new Set(teamMap.keys());
      let successCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 2) continue;

        // Perform basic format validations
        const errorMsg = await ValidationService.validateImportRow(i + 1, headers, row, knownAbbrs);
        if (errorMsg) {
          throw new Error(`Validation Error on Row ${i + 1}: ${errorMsg}`);
        }

        // Map row keys
        const rowObj: Record<string, string> = {};
        headers.forEach((h, idx) => {
          rowObj[h.trim().toLowerCase()] = (row[idx] || "").trim();
        });

        const weekVal = rowObj["week"] || rowObj["contest_leg_id"] || rowObj["leg"];
        const homeVal = rowObj["home_team"] || rowObj["home"];
        const awayVal = rowObj["away_team"] || rowObj["away"];

        const legId = await this.findContestLeg(weekVal);
        if (!legId) {
          throw new Error(`Row ${i + 1}: Could not map week value '${weekVal}' to any contest leg.`);
        }

        const homeTeamId = teamMap.get(homeVal.toUpperCase())!;
        const awayTeamId = teamMap.get(awayVal.toUpperCase())!;

        const lineSpread = rowObj["spread"] ? parseFloat(rowObj["spread"]) : undefined;
        const overUnder = rowObj["over_under"] ? parseFloat(rowObj["over_under"]) : undefined;

        // Create or update a corresponding Game on this contest leg
        // Check if game already exists
        const legGames = await gameRepo.getByLegId(legId);
        const existingGame = legGames.find(g => 
          (g.home_team_id === homeTeamId && g.away_team_id === awayTeamId) ||
          (g.home_team_id === awayTeamId && g.away_team_id === homeTeamId)
        );

        const savedGame = await gameRepo.save({
          id: existingGame?.id || `game-${legId}-${homeTeamId}-${awayTeamId}`,
          contest_leg_id: legId,
          home_team_id: homeTeamId,
          away_team_id: awayTeamId,
          status: "scheduled",
          game_time: "Sunday 1:00 PM"
        });

        const gfExisting = await gameFeatureRepo.getByLegAndTeams(legId, homeTeamId, awayTeamId);

        // Seed a corresponding GameFeature profile in database
        await gameFeatureRepo.save({
          id: gfExisting?.id || `gf-${legId}-${homeTeamId}-${awayTeamId}`,
          contest_leg_id: legId,
          game_id: savedGame.id,
          home_team_id: homeTeamId,
          away_team_id: awayTeamId,
          divisional_game_flag: rowObj["divisional"] === "true" || rowObj["divisional_game_flag"] === "true",
          line_spread: lineSpread,
          over_under: overUnder
        });

        // Ensure default lines exist for probability evaluations
        const lines = await lineRepo.getByLegId(legId);
        const homeLine = lines.find(l => l.team_id === homeTeamId);
        if (!homeLine) {
          // Set spread based win prob
          const testProb = lineSpread && lineSpread < 0 ? 0.5 + (-lineSpread * 0.03) : 0.5;
          await lineRepo.save({
            id: `line-${legId}-${homeTeamId}`,
            contest_leg_id: legId,
            team_id: homeTeamId,
            win_probability: Math.min(0.99, Math.max(0.01, testProb)),
            pick_popularity: 0.05,
            future_value: 0.2,
            leverage_multiplier: 1.0,
            holiday_safety_multiplier: 1.0,
            contest_equity_score: 50.0,
            future_value_multiplier: 1.1 - 0.2
          });
        }

        const awayLine = lines.find(l => l.team_id === awayTeamId);
        if (!awayLine) {
          const testProb = lineSpread && lineSpread > 0 ? 0.5 + (lineSpread * 0.03) : 0.5;
          await lineRepo.save({
            id: `line-${legId}-${awayTeamId}`,
            contest_leg_id: legId,
            team_id: awayTeamId,
            win_probability: Math.min(0.99, Math.max(0.01, testProb)),
            pick_popularity: 0.05,
            future_value: 0.2,
            leverage_multiplier: 1.0,
            holiday_safety_multiplier: 1.0,
            contest_equity_score: 50.0,
            future_value_multiplier: 1.1 - 0.2
          });
        }

        successCount++;
      }

      const completedJob = await importJobRepo.update(job.id, {
        status: "completed",
        rows_processed: successCount
      });
      return completedJob!;
    } catch (err: any) {
      console.error("[Schedule Import Failure]", err);
      const failedJob = await importJobRepo.update(job.id, {
        status: "failed",
        error_message: err.message || String(err)
      });
      return failedJob!;
    }
  }

  /**
   * 2. Import Team Weekly Metrics CSV
   * Header expectation: week, team, off_efficiency, def_efficiency, net_efficiency, dvoa_offense, dvoa_defense
   */
  static async importTeamMetrics(fileName: string, csvText: string): Promise<ImportJob> {
    const job = await importJobRepo.create({
      job_type: "team_metrics",
      file_name: fileName,
      status: "pending",
      rows_processed: 0
    });

    try {
      const { headers, rows } = this.parseCSV(csvText);
      if (headers.length === 0) {
        throw new Error("No headers or data detected in CSV content.");
      }

      const teamMap = await this.getTeamMap();
      const knownAbbrs = new Set(teamMap.keys());
      let successCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 2) continue;

        const errorMsg = await ValidationService.validateImportRow(i + 1, headers, row, knownAbbrs);
        if (errorMsg) {
          throw new Error(`Validation Error on Row ${i + 1}: ${errorMsg}`);
        }

        const rowObj: Record<string, string> = {};
        headers.forEach((h, idx) => {
          rowObj[h.trim().toLowerCase()] = (row[idx] || "").trim();
        });

        const weekVal = rowObj["week"] || rowObj["contest_leg_id"] || rowObj["leg"];
        const teamVal = rowObj["team"] || rowObj["team_id"] || rowObj["team_name"];

        const legId = await this.findContestLeg(weekVal);
        if (!legId) {
          throw new Error(`Row ${i + 1}: Could not map week value '${weekVal}' to any contest leg.`);
        }

        const teamId = teamMap.get(teamVal.toUpperCase())!;

        // Check for duplicate team entries in same week (leg) to fulfill duplicate prevention requirement
        const previousFeature = await teamFeatureRepo.getByLegAndTeam(legId, teamId);

        const offEff = rowObj["off_efficiency"] ? parseFloat(rowObj["off_efficiency"]) : undefined;
        const defEff = rowObj["def_efficiency"] ? parseFloat(rowObj["def_efficiency"]) : undefined;
        const netEff = rowObj["net_efficiency"] ? parseFloat(rowObj["net_efficiency"]) : undefined;
        const dvoaOff = rowObj["dvoa_offense"] ? parseFloat(rowObj["dvoa_offense"]) : undefined;
        const dvoaDef = rowObj["dvoa_defense"] ? parseFloat(rowObj["dvoa_defense"]) : undefined;

        await teamFeatureRepo.save({
          id: previousFeature?.id,
          contest_leg_id: legId,
          team_id: teamId,
          off_efficiency: offEff,
          def_efficiency: defEff,
          net_efficiency: netEff,
          dvoa_offense: dvoaOff,
          dvoa_defense: dvoaDef,
          injury_index: previousFeature?.injury_index,
          pff_grade_offense: previousFeature?.pff_grade_offense,
          pff_grade_defense: previousFeature?.pff_grade_defense,
          short_week_flag: previousFeature?.short_week_flag || false,
          travel_disadvantage: previousFeature?.travel_disadvantage
        });

        successCount++;
      }

      const completedJob = await importJobRepo.update(job.id, {
        status: "completed",
        rows_processed: successCount
      });
      return completedJob!;
    } catch (err: any) {
      console.error("[Metrics Import Failure]", err);
      const failedJob = await importJobRepo.update(job.id, {
        status: "failed",
        error_message: err.message || String(err)
      });
      return failedJob!;
    }
  }

  /**
   * 3. Import PFF Spreadsheet CSV (generic CSV version of XLSX)
   * Header expectation: week, team, pff_grade_offense, pff_grade_defense, home_win_probability_pff
   */
  static async importPFFSpreadsheet(fileName: string, csvText: string): Promise<ImportJob> {
    const job = await importJobRepo.create({
      job_type: "pff_spreadsheet",
      file_name: fileName,
      status: "pending",
      rows_processed: 0
    });

    try {
      const { headers, rows } = this.parseCSV(csvText);
      if (headers.length === 0) {
        throw new Error("No headers or data detected in CSV content.");
      }

      const teamMap = await this.getTeamMap();
      const knownAbbrs = new Set(teamMap.keys());
      let successCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 2) continue;

        const errorMsg = await ValidationService.validateImportRow(i + 1, headers, row, knownAbbrs);
        if (errorMsg) {
          throw new Error(`Validation Error on Row ${i + 1}: ${errorMsg}`);
        }

        const rowObj: Record<string, string> = {};
        headers.forEach((h, idx) => {
          rowObj[h.trim().toLowerCase()] = (row[idx] || "").trim();
        });

        const weekVal = rowObj["week"] || rowObj["contest_leg_id"] || rowObj["leg"];
        const teamVal = rowObj["team"] || rowObj["team_id"] || rowObj["team_name"];

        const legId = await this.findContestLeg(weekVal);
        if (!legId) {
          throw new Error(`Row ${i + 1}: Could not map week value '${weekVal}' to any contest leg.`);
        }

        const teamId = teamMap.get(teamVal.toUpperCase())!;

        const pffGradeOff = rowObj["pff_grade_offense"] ? parseFloat(rowObj["pff_grade_offense"]) : undefined;
        const pffGradeDef = rowObj["pff_grade_defense"] ? parseFloat(rowObj["pff_grade_defense"]) : undefined;
        const winProbPff = rowObj["home_win_probability_pff"] || rowObj["win_probability_pff"] || rowObj["win_prob_pff"];

        // Update Team Feature Profile
        const previousFeature = await teamFeatureRepo.getByLegAndTeam(legId, teamId);
        await teamFeatureRepo.save({
          id: previousFeature?.id,
          contest_leg_id: legId,
          team_id: teamId,
          pff_grade_offense: pffGradeOff,
          pff_grade_defense: pffGradeDef,
          off_efficiency: previousFeature?.off_efficiency,
          def_efficiency: previousFeature?.def_efficiency,
          net_efficiency: previousFeature?.net_efficiency,
          dvoa_offense: previousFeature?.dvoa_offense,
          dvoa_defense: previousFeature?.dvoa_defense,
          injury_index: previousFeature?.injury_index,
          short_week_flag: previousFeature?.short_week_flag || false,
          travel_disadvantage: previousFeature?.travel_disadvantage
        });

        // If win probability is provided, update any game feature where this team is home team
        if (winProbPff) {
          const parsedProb = parseFloat(winProbPff);
          const gameFeatures = await gameFeatureRepo.getByLegId(legId);
          const matchingGF = gameFeatures.find(f => f.home_team_id === teamId);
          if (matchingGF) {
            await gameFeatureRepo.save({
              ...matchingGF,
              home_win_probability_pff: parsedProb
            });
          }
        }

        successCount++;
      }

      const completedJob = await importJobRepo.update(job.id, {
        status: "completed",
        rows_processed: successCount
      });
      return completedJob!;
    } catch (err: any) {
      console.error("[PFF Import Failure]", err);
      const failedJob = await importJobRepo.update(job.id, {
        status: "failed",
        error_message: err.message || String(err)
      });
      return failedJob!;
    }
  }
}
