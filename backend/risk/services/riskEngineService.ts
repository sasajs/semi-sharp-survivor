import { GameRiskAssessment, RiskProfile, ConfidenceTier, UpsetFactor } from "../models";
import { 
  teamRepo, 
  legRepo, 
  gameRepo, 
  weeklyInputRepo, 
  teamFeatureRepo, 
  gameFeatureRepo, 
  lineRepo,
  riskRepo,
  riskAssessmentRepo
} from "../../repositories";
import { UpsetRiskService } from "./upsetRiskService";
import { ConfidenceService } from "./confidenceService";

export class RiskEngineService {
  /**
   * Evaluates the risk assessment for a specific game on a specific leg
   */
  static async assessGameRisk(gameId: string, legId: string): Promise<GameRiskAssessment> {
    const game = await gameRepo.getById(gameId);
    if (!game) {
      throw new Error(`Game not found: ${gameId}`);
    }

    // 1. Fetch Features
    const gameFeature = await gameFeatureRepo.getByLegAndTeams(legId, game.home_team_id, game.away_team_id);
    const homeTF = await teamFeatureRepo.getByLegAndTeam(legId, game.home_team_id);
    const homeWI = await weeklyInputRepo.getByLegAndTeam(legId, game.home_team_id);
    const awayTF = await teamFeatureRepo.getByLegAndTeam(legId, game.away_team_id);
    const awayWI = await weeklyInputRepo.getByLegAndTeam(legId, game.away_team_id);

    // 2. Fetch Market Lines (to get win probability/spread)
    const homeLine = await lineRepo.getByTeamAndLeg(game.home_team_id, legId);
    const homeWinProb = homeLine?.win_probability ?? gameFeature?.home_win_probability_pff ?? 0.5;

    // Coalesce inputs for Home Team
    const homeInputs = {
      team_id: game.home_team_id,
      rest_days: homeWI?.rest_days ?? homeTF?.rest_days ?? 7,
      rest_disparity: homeWI?.rest_disparity ?? gameFeature?.rest_disparity ?? 0,
      short_week_flag: homeWI?.short_week_flag ?? homeTF?.short_week_flag ?? false,
      sic_score: homeWI?.sic_score ?? homeTF?.sic_score ?? 90,
      injury_risk_score: homeWI?.injury_risk_score ?? (homeTF?.sic_score ? 100 - homeTF.sic_score : undefined),
      quarterback_status: homeWI?.quarterback_status ?? homeTF?.quarterback_status ?? "Healthy",
      travel_disadvantage: homeWI?.travel_disadvantage ?? homeTF?.travel_disadvantage ?? 0,
      road_game_flag: false,
      cross_country_travel: false,
      weather_risk: homeWI?.weather_risk ?? gameFeature?.weather_risk ?? 0,
      severe_weather_flag: ((homeWI?.weather_risk ?? gameFeature?.weather_risk ?? 0) >= 7),
      divisional_game_flag: homeWI?.divisional_game_flag ?? gameFeature?.divisional_game_flag ?? false,
      line_movement_score: 10,
      market_disagreement_score: 5
    };

    // Coalesce inputs for Away Team
    const awayInputs = {
      team_id: game.away_team_id,
      rest_days: awayWI?.rest_days ?? awayTF?.rest_days ?? 7,
      rest_disparity: awayWI?.rest_disparity ?? (gameFeature?.rest_disparity ? -gameFeature.rest_disparity : 0),
      short_week_flag: awayWI?.short_week_flag ?? awayTF?.short_week_flag ?? false,
      sic_score: awayWI?.sic_score ?? awayTF?.sic_score ?? 90,
      injury_risk_score: awayWI?.injury_risk_score ?? (awayTF?.sic_score ? 100 - awayTF.sic_score : undefined),
      quarterback_status: awayWI?.quarterback_status ?? awayTF?.quarterback_status ?? "Healthy",
      travel_disadvantage: awayWI?.travel_disadvantage ?? awayTF?.travel_disadvantage ?? 0,
      road_game_flag: true,
      cross_country_travel: (awayWI?.travel_disadvantage ?? awayTF?.travel_disadvantage ?? 0) >= 1500,
      weather_risk: awayWI?.weather_risk ?? gameFeature?.weather_risk ?? 0,
      severe_weather_flag: ((awayWI?.weather_risk ?? gameFeature?.weather_risk ?? 0) >= 7),
      divisional_game_flag: awayWI?.divisional_game_flag ?? gameFeature?.divisional_game_flag ?? false,
      line_movement_score: 10,
      market_disagreement_score: 5
    };

    // 3. Compute Assessments
    const home_team_risk = UpsetRiskService.calculateTeamRisk(homeInputs);
    const away_team_risk = UpsetRiskService.calculateTeamRisk(awayInputs);

    // Identify favorite & underdog for upset probability calculation
    const isHomeFav = homeWinProb >= 0.5;
    const favoriteRisk = isHomeFav ? home_team_risk.combined_risk_score : away_team_risk.combined_risk_score;
    const underdogRisk = isHomeFav ? away_team_risk.combined_risk_score : home_team_risk.combined_risk_score;
    const favWinProb = isHomeFav ? homeWinProb : (1.0 - homeWinProb);

    const upset_probability = UpsetRiskService.calculateUpsetProbability(favWinProb, favoriteRisk, underdogRisk);
    
    // Upset factors relative to favorite
    const favoriteAssessment = isHomeFav ? home_team_risk : away_team_risk;
    const isDivisional = gameFeature?.divisional_game_flag ?? false;
    const weatherRiskVal = gameFeature?.weather_risk ?? 0;
    const upset_factors = UpsetRiskService.compileUpsetFactors(favoriteAssessment, isDivisional, weatherRiskVal);

    // Overall Game or selection Risk Score based on favorite's combined risk and upset probability
    const risk_score = parseFloat(((favoriteRisk * 0.6) + (upset_probability * 100 * 0.4)).toFixed(1));

    // Confidence Level
    const confidence_score = ConfidenceService.calculateConfidenceScore(favWinProb, risk_score);
    const confidence_tier = ConfidenceService.determineConfidenceTier(confidence_score);

    // 4. Handle audit versions and save
    const existing = await riskAssessmentRepo.getByGameAndLeg(gameId, legId);
    const nextVersion = existing ? existing.risk_version + 1 : 1;

    const gameAssessment: GameRiskAssessment = {
      id: existing?.id || `gra-${legId}-${gameId}`,
      game_id: gameId,
      contest_leg_id: legId,
      home_team_risk,
      away_team_risk,
      upset_probability,
      confidence_tier,
      upset_factors,
      risk_score,
      risk_version: nextVersion,
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return await riskAssessmentRepo.save(gameAssessment);
  }

  /**
   * Generates a persistent Risk Profile for a specific team pick on a leg
   */
  static async compileTeamRiskProfile(
    entryId: string,
    legId: string,
    teamId: string
  ): Promise<RiskProfile> {
    // 1. Locate the game containing this team
    const games = await gameRepo.getByLegId(legId);
    const game = games.find(g => g.home_team_id === teamId || g.away_team_id === teamId);
    
    let risk_score = 50.0;
    let upset_probability = 0.5;
    let confidence_tier = ConfidenceTier.MEDIUM;

    if (game) {
      const gameAssessment = await this.assessGameRisk(game.id, legId);
      const isHome = game.home_team_id === teamId;
      
      // Determine if this team is the favorite or underdog in their line
      const line = await lineRepo.getByTeamAndLeg(teamId, legId);
      const isFav = line ? (line.win_probability >= 0.5) : true;

      risk_score = isHome ? gameAssessment.home_team_risk.combined_risk_score : gameAssessment.away_team_risk.combined_risk_score;
      
      if (isFav) {
        upset_probability = gameAssessment.upset_probability;
        confidence_tier = gameAssessment.confidence_tier;
      } else {
        // Underdog has high risk of losing, high probability of upset occurring
        upset_probability = parseFloat((1.0 - gameAssessment.upset_probability).toFixed(3));
        const score = ((line?.win_probability ?? 0.3) * 100) - (risk_score * 0.4);
        confidence_tier = ConfidenceService.determineConfidenceTier(score);
      }
    }

    const existing = await riskRepo.getByEntryIdAndLeg(entryId, legId);
    const nextVersion = existing ? existing.risk_version + 1 : 1;

    const profile: RiskProfile = {
      id: existing?.id || `rp-${legId}-${entryId}-${teamId}`,
      entry_id: entryId,
      contest_leg_id: legId,
      team_id: teamId,
      risk_score,
      upset_probability,
      confidence_tier,
      risk_version: nextVersion,
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return await riskRepo.save(profile);
  }
}
