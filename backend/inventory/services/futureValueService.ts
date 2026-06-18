import { FutureValueProfile } from "../../../src/types";
import { 
  teamRepo, 
  legRepo, 
  gameRepo, 
  teamFeatureRepo, 
  lineRepo,
  futureValueRepo 
} from "../../repositories";

export class FutureValueService {
  /**
   * Recalculates Future Value Profiles for all teams in a given leg
   */
  static async recalculateAllProfilesForLeg(legId: string): Promise<FutureValueProfile[]> {
    const teams = await teamRepo.getAll();
    const allLegs = await legRepo.getAll();
    const currentLeg = allLegs.find(l => l.id === legId);
    
    if (!currentLeg) {
      throw new Error(`Invalid contest leg: ${legId}`);
    }

    const currentOrder = currentLeg.display_order;

    // Identify holiday legs (Thanksgiving / Black Friday and Christmas)
    const thanksgivingLeg = allLegs.find(l => l.leg_type === "thanksgiving");
    const christmasLeg = allLegs.find(l => l.leg_type === "christmas");

    const tgGames = thanksgivingLeg ? await gameRepo.getByLegId(thanksgivingLeg.id) : [];
    const xmasGames = christmasLeg ? await gameRepo.getByLegId(christmasLeg.id) : [];

    const tgTeamIds = new Set(tgGames.flatMap(g => [g.home_team_id, g.away_team_id]));
    const xmasTeamIds = new Set(xmasGames.flatMap(g => [g.home_team_id, g.away_team_id]));

    const profiles: FutureValueProfile[] = [];

    for (const team of teams) {
      // 1. Holiday Usefulness
      let holidayUsefulness = 10.0;
      if (tgTeamIds.has(team.id)) holidayUsefulness += 45.0;
      if (xmasTeamIds.has(team.id)) holidayUsefulness += 45.0;

      // 2. Elite and Playoff-caliber classifications from Team Features
      const tf = await teamFeatureRepo.getByLegAndTeam(legId, team.id);
      
      const netEfficiency = tf?.net_efficiency || 0.0;
      const pffOffense = tf?.pff_grade_offense || 70.0;
      const pffDefense = tf?.pff_grade_defense || 70.0;

      // Arbitrary but logical classifications matching requirements
      const isElite = netEfficiency > 0.15 || pffOffense > 82 || pffDefense > 82;
      const isPlayoffCaliber = netEfficiency > 0.05 || pffOffense > 75 || pffDefense > 75;

      // 3. Scarcity Score (0.0 to 100.0)
      // High future value in lines means they are highly scarce & valuable
      const line = await lineRepo.getByTeamAndLeg(team.id, legId);
      const lineFV = line?.future_value || 0.5; // default 0.5
      const scarcityScore = Math.min(100.0, Math.max(0.0, lineFV * 100.0));

      // 4. Projected Future Strength (0.0 to 100.0)
      // Estimated from current win probability + efficiency
      const winProb = line?.win_probability || 0.5;
      const projectedFutureStrength = Math.min(100.0, Math.max(0.0, (winProb * 60) + (netEfficiency * 100) + 20));

      // 5. Final Future Value Score Calculation
      // Weighted index summing to max 100
      let fvScore = 
        (projectedFutureStrength * 0.45) + 
        (scarcityScore * 0.35) + 
        (isElite ? 12.0 : 0.0) + 
        (isPlayoffCaliber ? 5.0 : 0.0) + 
        (holidayUsefulness * 0.03);

      fvScore = Math.min(100.0, Math.max(0.0, parseFloat(fvScore.toFixed(1))));

      // Find if we have an existing profile in repo
      const existingProfile = await futureValueRepo.getProfile(team.id, legId);

      const profileToSave: FutureValueProfile = {
        id: existingProfile?.id || `fv-${legId}-${team.id}`,
        team_id: team.id,
        contest_leg_id: legId,
        future_value_score: fvScore,
        scarcity_score: parseFloat(scarcityScore.toFixed(1)),
        is_elite: isElite,
        is_playoff_caliber: isPlayoffCaliber,
        holiday_usefulness: parseFloat(holidayUsefulness.toFixed(1)),
        created_at: existingProfile?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const saved = await futureValueRepo.saveProfile(profileToSave);
      profiles.push(saved);
    }

    return profiles;
  }

  /**
   * Get team future value profile
   */
  static async getTeamProfile(teamId: string, legId: string): Promise<FutureValueProfile> {
    const existing = await futureValueRepo.getProfile(teamId, legId);
    if (existing) {
      return existing;
    }
    
    // Fallback recalculation on the fly to fulfill lazy load
    const profiles = await this.recalculateAllProfilesForLeg(legId);
    const matched = profiles.find(p => p.team_id === teamId);
    if (!matched) {
      throw new Error(`Unable to fetch or create future value profile for team ${teamId} on leg ${legId}`);
    }
    return matched;
  }

  /**
   * Retrieve future value score map
   */
  static async getFutureValueScoreMap(legId: string): Promise<Record<string, number>> {
    let profiles = await futureValueRepo.getProfilesByLeg(legId);
    if (profiles.length === 0) {
      profiles = await this.recalculateAllProfilesForLeg(legId);
    }
    const map: Record<string, number> = {};
    for (const p of profiles) {
      map[p.team_id] = p.future_value_score;
    }
    return map;
  }
}
