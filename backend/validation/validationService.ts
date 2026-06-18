import { WeeklyInput } from "../../src/types";
import { teamRepo, legRepo } from "../repositories";

export interface ValidationError {
  row: number;
  message: string;
}

export interface ValidationSummary {
  isValid: boolean;
  errors: ValidationError[];
}

export class ValidationService {
  /**
   * Validates a manual weekly input model
   */
  static async validateManualInput(input: Partial<WeeklyInput>): Promise<ValidationSummary> {
    const errors: ValidationError[] = [];

    if (!input.team_id) {
      errors.push({ row: 0, message: "Team ID is required." });
    } else {
      const team = await teamRepo.getById(input.team_id);
      if (!team) {
        errors.push({ row: 0, message: `Team with ID '${input.team_id}' does not exist.` });
      }
    }

    if (!input.contest_leg_id) {
      errors.push({ row: 0, message: "Contest leg ID (Week specification) is required." });
    } else {
      const leg = await legRepo.getById(input.contest_leg_id);
      if (!leg) {
        errors.push({ row: 0, message: `Contest leg with ID '${input.contest_leg_id}' does not exist.` });
      }
    }

    // Number score range boundaries
    if (input.sic_score !== undefined && (input.sic_score < 0 || input.sic_score > 100)) {
      errors.push({ row: 0, message: "SIC score must be between 0 and 100." });
    }

    if (input.injury_risk_score !== undefined && (input.injury_risk_score < 0 || input.injury_risk_score > 10)) {
      errors.push({ row: 0, message: "Injury risk score must be between 0 and 10." });
    }

    if (input.travel_disadvantage !== undefined && (input.travel_disadvantage < -10 || input.travel_disadvantage > 10)) {
      errors.push({ row: 0, message: "Travel disadvantage score should be within standard range of -10 to 10." });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Helper to inspect CSV imports for required keys and valid teams
   */
  static async validateImportRow(
    rowNum: number,
    headers: string[],
    values: string[],
    knownTeams: Set<string>
  ): Promise<string | null> {
    const rowObj: Record<string, string> = {};
    headers.forEach((h, i) => {
      rowObj[h.trim().toLowerCase()] = (values[i] || "").trim();
    });

    const weekVal = rowObj["week"] || rowObj["contest_leg_id"] || rowObj["leg"];
    if (!weekVal) {
      return `Row ${rowNum}: Missing required week or contest leg specifications.`;
    }

    // Checking team specification fields
    const teamVal = rowObj["team"] || rowObj["team_id"] || rowObj["team_name"];
    const homeVal = rowObj["home_team"] || rowObj["home"];
    const awayVal = rowObj["away_team"] || rowObj["away"];

    if (!teamVal && !homeVal && !awayVal) {
      return `Row ${rowNum}: Must specify a valid team, home team, or away team name.`;
    }

    if (teamVal && !knownTeams.has(teamVal.toUpperCase())) {
      return `Row ${rowNum}: Team abbreviation '${teamVal}' is unrecognized.`;
    }

    if (homeVal && !knownTeams.has(homeVal.toUpperCase())) {
      return `Row ${rowNum}: Home team abbreviation '${homeVal}' is unrecognized.`;
    }

    if (awayVal && !knownTeams.has(awayVal.toUpperCase())) {
      return `Row ${rowNum}: Away team abbreviation '${awayVal}' is unrecognized.`;
    }

    return null;
  }
}
