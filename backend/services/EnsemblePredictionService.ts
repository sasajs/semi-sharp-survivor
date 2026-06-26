import { 
  ensemblePredictionRepo,
  adaptiveModelWeightRepo,
  gameRepo,
  legRepo,
  lineRepo,
  teamRepo
} from "../repositories/index";
import { EnsemblePrediction, AdaptiveModelWeight } from "../../src/types";
import { AdaptiveModelWeightService } from "./AdaptiveModelWeightService";

export class EnsemblePredictionService {
  static async getLatest(): Promise<EnsemblePrediction[]> {
    return ensemblePredictionRepo.getLatestPredictions();
  }

  static async getHistory(): Promise<EnsemblePrediction[]> {
    return ensemblePredictionRepo.getPredictionsHistory();
  }

  static async getByGame(gameId: string): Promise<EnsemblePrediction[]> {
    return ensemblePredictionRepo.getPredictionsByGame(gameId);
  }

  static async deleteWeek(season: string, week: number): Promise<boolean> {
    return ensemblePredictionRepo.deletePredictionsWeek(season, week);
  }

  static async calculate(
    season: string,
    week: number,
    calculationVersion: string
  ): Promise<EnsemblePrediction[]> {
    console.log(`[Ensemble Prediction Service] Calculating V0.47 Adaptive Ensemble Predictions for ${season} Week ${week} (Version: ${calculationVersion})`);

    // 1. Fetch legs, games, and lines
    const legs = await legRepo.getAll();
    const currentLeg = legs.find(l => l.nfl_week === week) || legs[0];
    if (!currentLeg) {
      console.warn("[Ensemble Prediction Service] No legs found, returning empty predictions.");
      return [];
    }

    const games = await gameRepo.getByLegId(currentLeg.id);
    if (games.length === 0) {
      console.warn(`[Ensemble Prediction Service] No games found for week ${week}, returning empty predictions.`);
      return [];
    }

    const lines = await lineRepo.getByLegId(currentLeg.id);
    const teams = await teamRepo.getAll();
    const teamMap = new Map(teams.map(t => [t.id, t]));

    // 2. Fetch or calculate adaptive model weights
    let weights = await adaptiveModelWeightRepo.getWeightsHistory();
    weights = weights.filter(w => w.season === season && w.week === week);
    if (weights.length === 0) {
      weights = await AdaptiveModelWeightService.calculateWeights(season, week, calculationVersion);
    }

    // Default to equal weights if no weights calculated or available
    const models = [
      "Future Team Value",
      "Survivor Equity",
      "Ownership Calibration",
      "Market Calibration"
    ];

    const modelWeightMap = new Map<string, number>();
    let totalRawWeight = 0;
    for (const mName of models) {
      const match = weights.find(w => w.model_name === mName);
      const wVal = match ? match.final_weight : 25.0;
      modelWeightMap.set(mName, wVal);
      totalRawWeight += wVal;
    }

    // Normalize weights so they sum exactly to 1.0 (decimals)
    const normalizedWeights = new Map<string, number>();
    for (const mName of models) {
      const raw = modelWeightMap.get(mName) || 25.0;
      normalizedWeights.set(mName, raw / (totalRawWeight || 100));
    }

    const predictions: EnsemblePrediction[] = [];

    // 3. Perform deterministic calculations for each game
    for (const game of games) {
      // Find win probability lines for home and away teams
      const homeLine = lines.find(l => l.team_id === game.home_team_id);
      const awayLine = lines.find(l => l.team_id === game.away_team_id);

      const baseHomeProb = homeLine ? homeLine.win_probability : 0.55;
      const baseAwayProb = awayLine ? awayLine.win_probability : 0.45;

      // We calculate ensemble predictions for the home team's prediction_type "WIN_PROBABILITY"
      // Compute predictions from each model (between 0.0 and 100.0)
      
      // Model 1: Future Team Value Model (uses future_value difference)
      const homeFV = homeLine ? homeLine.future_value : 50;
      const awayFV = awayLine ? awayLine.future_value : 50;
      const fvDiff = (homeFV - awayFV) / 100; // e.g. -0.1 to 0.1
      const p1 = Math.max(10, Math.min(90, (baseHomeProb + fvDiff * 0.15) * 100));

      // Model 2: Survivor Equity Model (uses contest_equity_score difference)
      const homeEq = homeLine ? homeLine.contest_equity_score : 50;
      const awayEq = awayLine ? awayLine.contest_equity_score : 50;
      const eqDiff = (homeEq - awayEq) / 100;
      const p2 = Math.max(10, Math.min(90, (baseHomeProb + eqDiff * 0.20) * 100));

      // Model 3: Ownership Calibration Model (uses pick_popularity to shade predictions)
      const homePop = homeLine ? homeLine.pick_popularity : 0.10;
      const awayPop = awayLine ? awayLine.pick_popularity : 0.10;
      const popDiff = homePop - awayPop; // -1 to 1
      const p3 = Math.max(10, Math.min(90, (baseHomeProb - popDiff * 0.12) * 100));

      // Model 4: Market Calibration Model (uses leverage_multiplier difference)
      const homeLev = homeLine ? homeLine.leverage_multiplier : 1.0;
      const awayLev = awayLine ? awayLine.leverage_multiplier : 1.0;
      const levDiff = (homeLev - awayLev) / 5;
      const p4 = Math.max(10, Math.min(90, (baseHomeProb + levDiff * 0.10) * 100));

      const individualProbs = new Map<string, number>([
        ["Future Team Value", p1],
        ["Survivor Equity", p2],
        ["Ownership Calibration", p3],
        ["Market Calibration", p4]
      ]);

      // Compute weighted prediction
      let weightedPrediction = 0;
      for (const mName of models) {
        const prob = individualProbs.get(mName) || 50.0;
        const normW = normalizedWeights.get(mName) || 0.25;
        weightedPrediction += prob * normW;
      }

      // Compute weighted variance
      let predictionVariance = 0;
      for (const mName of models) {
        const prob = individualProbs.get(mName) || 50.0;
        const normW = normalizedWeights.get(mName) || 0.25;
        predictionVariance += normW * Math.pow(prob - weightedPrediction, 2);
      }

      const predictionStdDev = Math.sqrt(predictionVariance);

      // Model agreement score: tighter std dev means higher agreement (0 - 100)
      const agreementScore = Math.max(0, Math.min(100, 100 - (predictionStdDev * 6.5)));
      const disagreementScore = 100 - agreementScore;

      // Confidence intervals (95% CI based on std dev)
      const marginOfError = 1.96 * predictionStdDev;
      const confidenceIntervalLow = Math.max(0, weightedPrediction - marginOfError);
      const confidenceIntervalHigh = Math.min(100, weightedPrediction + marginOfError);

      // Average model confidence from V0.46 weights
      let avgModelConfidence = 75.0;
      if (weights.length > 0) {
        const sumConf = weights.reduce((sum, w) => sum + w.confidence_score, 0);
        avgModelConfidence = sumConf / weights.length;
      }

      // Overall ensemble confidence score
      const confidenceScore = Math.max(0, Math.min(100, agreementScore * 0.6 + avgModelConfidence * 0.4));

      // Determine recommended usage
      let recommendedUsage = "NORMAL";
      if (weightedPrediction >= 72 && confidenceScore >= 82) {
        recommendedUsage = "SAFE";
      } else if (weightedPrediction < 50 || confidenceScore < 50) {
        recommendedUsage = "DO_NOT_BET";
      } else if (confidenceScore < 68) {
        recommendedUsage = "LOW_CONFIDENCE";
      }

      predictions.push({
        season,
        week,
        game_id: game.id,
        prediction_type: "WIN_PROBABILITY",
        ensemble_prediction: Number(weightedPrediction.toFixed(2)),
        prediction_std_dev: Number(predictionStdDev.toFixed(2)),
        prediction_variance: Number(predictionVariance.toFixed(2)),
        confidence_interval_low: Number(confidenceIntervalLow.toFixed(2)),
        confidence_interval_high: Number(confidenceIntervalHigh.toFixed(2)),
        model_count: models.length,
        weighted_prediction: Number(weightedPrediction.toFixed(2)),
        agreement_score: Number(agreementScore.toFixed(2)),
        disagreement_score: Number(disagreementScore.toFixed(2)),
        confidence_score: Number(confidenceScore.toFixed(2)),
        recommended_usage: recommendedUsage,
        calculation_version: calculationVersion
      });
    }

    // Save predictions in the repository (and delete any existing predictions for same week/season to prevent duplicates)
    await ensemblePredictionRepo.deletePredictionsWeek(season, week);
    const saved = await ensemblePredictionRepo.savePredictions(predictions);
    return saved;
  }
}
