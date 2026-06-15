import { Team, ContestLeg, TeamWeekLine, SurvivorPick, SurvivorEntry } from "../../src/types";
import { InventoryService } from "../inventory/services/inventoryService";
import { FutureValueService } from "../inventory/services/futureValueService";

export interface RecommendationResult {
  team: Team;
  line: TeamWeekLine;
  insight: string;
  available_team_flag?: boolean;
  future_value_score?: number;
  holiday_protection_score?: number;
  inventory_depth_score?: number;
  risk_score?: number;
  upset_probability?: number;
  confidence_tier?: 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low';
}

export class RecommendationService {
  /**
   * Main recommendation compiling with fully integrated survivor inventory contexts
   */
  static async getRecommendations(
    entry: SurvivorEntry,
    currentLeg: ContestLeg,
    allTeams: Team[],
    legLines: TeamWeekLine[],
    allPicks: SurvivorPick[]
  ): Promise<{
    entry: SurvivorEntry;
    leg: ContestLeg;
    used_teams: string[];
    recommendations: RecommendationResult[];
    holiday_protection_score: number;
    inventory_depth_score: number;
  }> {
    // 1. Fetch live Survivor Inventory Snapshot
    const snap = await InventoryService.compileInventorySnapshot(entry.id, currentLeg.id);
    const fvScores = await FutureValueService.getFutureValueScoreMap(currentLeg.id);

    // 2. Compute normal recommendations
    const pickedTeams = allPicks
      .filter(p => p.entry_id === entry.id && p.contest_leg_id !== currentLeg.id)
      .map(p => p.team_id);

    // Filter out teams that have already been picked
    const availableLines = legLines.filter(l => !pickedTeams.includes(l.team_id));

    // Sort by Contest Equity Score descending
    const recommended: RecommendationResult[] = availableLines
      .map(line => {
        const teamObj = allTeams.find(t => t.id === line.team_id)!;
        if (!teamObj) return null;

        // Create detailed analytical recommendation insight message
        let insight = "Strong pick with balanced risk and equity profile.";
        if (line.win_probability > 0.8 && line.future_value > 0.8) {
          insight = "Extremely high safety but high future value penalty. Suggest conserving unless critical.";
        } else if (line.win_probability > 0.85 && line.future_value < 0.6) {
          insight = "Absolute Golden Matchup: Safe win probability with almost zero sacrificed future value!";
        } else if (line.pick_popularity < 0.03 && line.win_probability > 0.7) {
          insight = "High Leverage Play: Low popularity gives massive tournament equity bump if successful.";
        }

        if (currentLeg.leg_type === "thanksgiving") {
          insight += " Thanksgiving game shielding: This pick takes advantage of special Thursday holiday scheduling.";
        } else if (currentLeg.leg_type === "christmas") {
          insight += " Christmas day shielding: Utilizes teams playing in special holiday schedule.";
        }

        const teamId = teamObj.id;

        return {
          team: teamObj,
          line,
          insight,
          // Expose all required inventory metrics directly in recommendation outputs
          available_team_flag: snap.available_teams.includes(teamId),
          future_value_score: fvScores[teamId] || 0.0,
          holiday_protection_score: snap.holiday_protection_score,
          inventory_depth_score: snap.inventory_depth
        };
      })
      .filter(r => r !== null) as RecommendationResult[];
    
    const sortedRecommendations = recommended.sort((a, b) => b.line.contest_equity_score - a.line.contest_equity_score);

    return {
      entry,
      leg: currentLeg,
      used_teams: pickedTeams,
      recommendations: sortedRecommendations.slice(0, 5), // Return top 5
      holiday_protection_score: snap.holiday_protection_score,
      inventory_depth_score: snap.inventory_depth
    };
  }
}

// Keep legacy export for backward compatibility where routes/services use it
export function calculateRecommendations(
  entry: SurvivorEntry,
  currentLeg: ContestLeg,
  allTeams: Team[],
  legLines: TeamWeekLine[],
  allPicks: SurvivorPick[]
): any {
  // Leverage the synchronous version or a simplified mapper to avoid breaking interface
  const pickedTeams = allPicks
    .filter(p => p.entry_id === entry.id && p.contest_leg_id !== currentLeg.id)
    .map(p => p.team_id);

  const availableLines = legLines.filter(l => !pickedTeams.includes(l.team_id));

  const recommended: RecommendationResult[] = availableLines
    .map(line => {
      const teamObj = allTeams.find(t => t.id === line.team_id)!;
      if (!teamObj) return null;

      let insight = "Strong pick with balanced risk and equity profile.";
      if (line.win_probability > 0.8 && line.future_value > 0.8) {
        insight = "Extremely high safety but high future value penalty. Suggest conserving unless critical.";
      } else if (line.win_probability > 0.85 && line.future_value < 0.6) {
        insight = "Absolute Golden Matchup: Safe win probability with almost zero sacrificed future value!";
      } else if (line.pick_popularity < 0.03 && line.win_probability > 0.7) {
        insight = "High Leverage Play: Low popularity gives massive tournament equity bump if successful.";
      }

      return {
        team: teamObj,
        line,
        insight,
        available_team_flag: !pickedTeams.includes(teamObj.id),
        future_value_score: 50.0, // default placeholder
        holiday_protection_score: 100.0, // default placeholder
        inventory_depth_score: 32 - pickedTeams.length // default placeholder
      };
    })
    .filter(r => r !== null) as RecommendationResult[];
  
  const sortedRecommended = recommended.sort((a, b) => b.line.contest_equity_score - a.line.contest_equity_score);

  return {
    entry,
    leg: currentLeg,
    used_teams: pickedTeams,
    recommendations: sortedRecommended.slice(0, 5)
  };
}

