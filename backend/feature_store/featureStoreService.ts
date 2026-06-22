import { 
  WeeklyInput, 
  TeamFeature, 
  GameFeature, 
  FeatureDefinition, 
  FeatureStoreSnapshot, 
  FeatureBuildRun 
} from "../../src/types";

import { 
  weeklyInputRepo, 
  teamFeatureRepo, 
  gameFeatureRepo, 
  gameRepo,
  importJobRepo,
  featureDefinitionRepo,
  featureSnapshotRepo,
  featureBuildRunRepo,
  teamRepo,
  contestRepo,
  legRepo,
  lineRepo
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

  /**
   * Register a feature definition (idempotent seed or creation)
   */
  static async registerFeatureDefinition(def: FeatureDefinition): Promise<FeatureDefinition> {
    return await featureDefinitionRepo.save(def);
  }

  /**
   * Get all registered feature definitions
   */
  static async getFeatureDefinitions(): Promise<FeatureDefinition[]> {
    return await featureDefinitionRepo.getAll();
  }

  /**
   * Get all completed or pending build runs
   */
  static async getFeatureBuildRuns(): Promise<FeatureBuildRun[]> {
    return await featureBuildRunRepo.getAll();
  }

  /**
   * Query historical feature values by season & week number
   */
  static async queryHistoricalFeatures(season: number, week: number): Promise<FeatureStoreSnapshot[]> {
    return await featureSnapshotRepo.getBySeasonAndWeek(season, week);
  }

  /**
   * Retrieve all feature snapshots in the DB
   */
  static async getLatestFeatureSnapshots(): Promise<FeatureStoreSnapshot[]> {
    return await featureSnapshotRepo.getAll();
  }

  /**
   * Build weekly feature snapshots deterministically for a given season and week
   */
  static async buildWeeklySnapshots(season: number, week: number, notes?: string): Promise<FeatureBuildRun> {
    const run = await featureBuildRunRepo.save({
      season,
      week,
      status: "running",
      feature_count: 0,
      started_at: new Date().toISOString(),
      build_version: "v0.28",
      notes: notes || `Feature Store Weekly Build for Season ${season} Week ${week}`
    });

    try {
      const teams = await teamRepo.getAll();
      const contests = await contestRepo.getAll();
      const targetContest = contests.find(c => c.year === season) || contests[0];

      let legId = "";
      if (targetContest) {
        const legs = await legRepo.getByContestId(targetContest.id);
        const matchedLeg = legs.find(l => l.nfl_week === week);
        if (matchedLeg) {
          legId = matchedLeg.id;
        }
      }

      let games: any[] = [];
      let lines: any[] = [];
      let inputs: any[] = [];
      let teamFeats: any[] = [];
      let gameFeats: any[] = [];

      if (legId) {
        games = await gameRepo.getByLegId(legId);
        lines = await lineRepo.getByLegId(legId);
        inputs = await weeklyInputRepo.getByLegId(legId);
        teamFeats = await teamFeatureRepo.getByLegId(legId);
        gameFeats = await gameFeatureRepo.getByLegId(legId);
      }

      const snapshots: FeatureStoreSnapshot[] = [];

      for (const team of teams) {
        const matchedGame = games.find(g => g.home_team_id === team.id || g.away_team_id === team.id);
        const gameId = matchedGame ? matchedGame.id : null;
        const isHome = matchedGame ? (matchedGame.home_team_id === team.id) : false;

        const teamLine = lines.find(l => l.team_id === team.id);
        const teamInput = inputs.find(i => i.team_id === team.id);
        const teamFeat = teamFeats.find(f => f.team_id === team.id);
        const gameFeat = matchedGame ? gameFeats.find(gf => gf.home_team_id === matchedGame.home_team_id && gf.away_team_id === matchedGame.away_team_id) : null;

        // 1. days_rest calculation (defaults to 7.0 if absent)
        let restDays = 7.0;
        if (teamInput && teamInput.rest_days !== undefined && teamInput.rest_days !== null) {
          restDays = teamInput.rest_days;
        } else if (teamFeat && teamFeat.rest_days !== undefined && teamFeat.rest_days !== null) {
          restDays = teamFeat.rest_days;
        } else if (teamInput && teamInput.short_week_flag) {
          restDays = 4.0;
        }
        snapshots.push({
          season,
          week,
          sport: "NFL",
          team_id: team.id,
          game_id: gameId,
          feature_id: "days_rest",
          feature_value: restDays,
          source: "deterministic-engine-v0.28"
        });

        // 2. home_field_advantage indicator
        snapshots.push({
          season,
          week,
          sport: "NFL",
          team_id: team.id,
          game_id: gameId,
          feature_id: "home_field_advantage",
          feature_value: isHome ? 1.0 : 0.0,
          source: "deterministic-engine-v0.28"
        });

        // 3. market_spread representation
        let spread = 0.0;
        if (gameFeat && gameFeat.line_spread !== undefined && gameFeat.line_spread !== null) {
          spread = isHome ? gameFeat.line_spread : -gameFeat.line_spread;
        } else if (teamLine && teamLine.win_probability !== undefined) {
          spread = parseFloat(((teamLine.win_probability - 0.5) * -24.0).toFixed(1));
        }
        snapshots.push({
          season,
          week,
          sport: "NFL",
          team_id: team.id,
          game_id: gameId,
          feature_id: "market_spread",
          feature_value: spread,
          source: "deterministic-engine-v0.28"
        });

        // 4. market_total over/under projection
        let total = 44.5;
        if (gameFeat && gameFeat.over_under !== undefined && gameFeat.over_under !== null) {
          total = gameFeat.over_under;
        }
        snapshots.push({
          season,
          week,
          sport: "NFL",
          team_id: team.id,
          game_id: gameId,
          feature_id: "market_total",
          feature_value: total,
          source: "deterministic-engine-v0.28"
        });

        // 5. team_win_pct trailing average
        let winPct = 0.5;
        if (teamLine && teamLine.win_probability !== undefined) {
          winPct = parseFloat((teamLine.win_probability * 0.9).toFixed(3));
        } else {
          const numericId = parseInt(team.id.replace(/\D/g, "") || "5", 10);
          winPct = parseFloat((0.4 + (numericId % 5) * 0.08).toFixed(3));
        }
        snapshots.push({
          season,
          week,
          sport: "NFL",
          team_id: team.id,
          game_id: gameId,
          feature_id: "team_win_pct",
          feature_value: winPct,
          source: "deterministic-engine-v0.28"
        });

        // 6. future_team_value multiplier
        let fv = 1.0;
        if (teamLine && teamLine.future_value !== undefined && teamLine.future_value !== null) {
          fv = teamLine.future_value;
        } else if (teamLine && teamLine.future_value_multiplier !== undefined && teamLine.future_value_multiplier !== null) {
          fv = teamLine.future_value_multiplier;
        }
        snapshots.push({
          season,
          week,
          sport: "NFL",
          team_id: team.id,
          game_id: gameId,
          feature_id: "future_team_value",
          feature_value: fv,
          source: "deterministic-engine-v0.28"
        });
      }

      await featureSnapshotRepo.saveMany(snapshots);

      run.status = "completed";
      run.feature_count = snapshots.length;
      run.completed_at = new Date().toISOString();
      return await featureBuildRunRepo.save(run);

    } catch (err: any) {
      console.error("[FeatureStoreService] buildWeeklySnapshots error:", err);
      run.status = "failed";
      run.notes = `Error: ${err.message}. ${notes || ""}`;
      run.completed_at = new Date().toISOString();
      await featureBuildRunRepo.save(run);
      throw err;
    }
  }
}
