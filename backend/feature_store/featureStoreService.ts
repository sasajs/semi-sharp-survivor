import { WeeklyInput, TeamFeature, GameFeature } from "../../src/types";
import { 
  weeklyInputRepo, 
  teamFeatureRepo, 
  gameFeatureRepo, 
  gameRepo,
  importJobRepo
} from "../repositories";
import { ValidationService } from "../validation/validationService";

export class FeatureStoreService {
  /**
   * Safe save of a manual weekly input, automatically calculating and propagating
   * derived attributes to related TeamFeature and GameFeature caches.
   */
  static async saveWeeklyInput(input: Partial<WeeklyInput>): Promise<WeeklyInput> {
    const valSummary = await ValidationService.validateManualInput(input);
    if (!valSummary.isValid) {
      throw new Error(`Invaliding weekly input attributes: ${valSummary.errors.map(e => e.message).join(", ")}`);
    }

    const legId = input.contest_leg_id!;
    const teamId = input.team_id!;

    // Resolve previous input if any
    const existingInput = await weeklyInputRepo.getByLegAndTeam(legId, teamId);
    
    const weeklyInputToSave: WeeklyInput = {
      id: existingInput?.id,
      contest_leg_id: legId,
      team_id: teamId,
      rest_days: input.rest_days,
      rest_disparity: input.rest_disparity,
      sic_score: input.sic_score,
      injury_risk_score: input.injury_risk_score,
      travel_disadvantage: input.travel_disadvantage,
      weather_risk: input.weather_risk,
      quarterback_status: input.quarterback_status,
      divisional_game_flag: !!input.divisional_game_flag,
      short_week_flag: !!input.short_week_flag
    };

    const savedInput = await weeklyInputRepo.save(weeklyInputToSave);

    // Propagate changes to team feature store cache
    const existingTeamFeature = await teamFeatureRepo.getByLegAndTeam(legId, teamId);
    await teamFeatureRepo.save({
      id: existingTeamFeature?.id,
      contest_leg_id: legId,
      team_id: teamId,
      off_efficiency: existingTeamFeature?.off_efficiency,
      def_efficiency: existingTeamFeature?.def_efficiency,
      net_efficiency: existingTeamFeature?.net_efficiency,
      dvoa_offense: existingTeamFeature?.dvoa_offense,
      dvoa_defense: existingTeamFeature?.dvoa_defense,
      pff_grade_offense: existingTeamFeature?.pff_grade_offense,
      pff_grade_defense: existingTeamFeature?.pff_grade_defense,
      // Manual overrides mapped matching requirement
      injury_index: input.injury_risk_score,
      sic_score: input.sic_score,
      quarterback_status: input.quarterback_status,
      rest_days: input.rest_days,
      short_week_flag: !!input.short_week_flag,
      travel_disadvantage: input.travel_disadvantage
    });

    // Resolve match details to calculate match-level features
    const allGames = await gameRepo.getByLegId(legId);
    const matchedGame = allGames.find(g => g.home_team_id === teamId || g.away_team_id === teamId);

    if (matchedGame) {
      const isHome = matchedGame.home_team_id === teamId;
      const homeTeam = matchedGame.home_team_id;
      const awayTeam = matchedGame.away_team_id;

      const existingGameFeature = await gameFeatureRepo.getByLegAndTeams(legId, homeTeam, awayTeam);
      
      await gameFeatureRepo.save({
        id: existingGameFeature?.id,
        contest_leg_id: legId,
        game_id: matchedGame.id,
        home_team_id: homeTeam,
        away_team_id: awayTeam,
        // Calculate rest disparity if opponent values exist
        rest_disparity: isHome ? input.rest_disparity : (input.rest_disparity !== undefined ? -input.rest_disparity : undefined),
        weather_risk: input.weather_risk,
        divisional_game_flag: !!input.divisional_game_flag,
        line_spread: existingGameFeature?.line_spread,
        over_under: existingGameFeature?.over_under,
        home_win_probability_pff: existingGameFeature?.home_win_probability_pff
      });
    }

    return savedInput;
  }

  /**
   * Retrieves a consolidated list of team features with integrated weekly inputs
   */
  static async getConsolidatedFeaturesForLeg(legId: string): Promise<any[]> {
    const weeklyInputs = await weeklyInputRepo.getByLegId(legId);
    const teamFeatures = await teamFeatureRepo.getByLegId(legId);
    const gameFeatures = await gameFeatureRepo.getByLegId(legId);

    // Merge everything by team ID
    const merged = teamFeatures.map(tf => {
      const wi = weeklyInputs.find(input => input.team_id === tf.team_id);
      const gf = gameFeatures.find(g => g.home_team_id === tf.team_id || g.away_team_id === tf.team_id);

      return {
        ...tf,
        weekly_input: wi || null,
        game_feature: gf || null
      };
    });

    return merged;
  }

  /**
   * Audit log retriever for monitoring import activity
   */
  static async getImportJobsAudit(): Promise<any[]> {
    return await importJobRepo.getAll();
  }
}
