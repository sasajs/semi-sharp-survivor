import { modelWeightRepo, modelPerformanceRepo } from "../repositories/index";
import { ModelWeight, ModelWeightHistory } from "../../src/types";

export class ModelWeightingService {
  static async getActiveWeights(): Promise<ModelWeight[]> {
    let weights = await modelWeightRepo.getActiveWeights();
    if (weights.length === 0) {
      // Initialize with default weights
      const defaults: ModelWeight[] = [
        {
          model_name: "Ensemble Consensus Model",
          prediction_type: "survival",
          current_weight: 0.25,
          normalized_weight: 0.25,
          rolling_accuracy: 85.0,
          rolling_brier: 0.12,
          rolling_logloss: 0.35,
          calibration_score: 90.0,
          last_updated: new Date().toISOString()
        },
        {
          model_name: "Machine Learning Regressor",
          prediction_type: "survival",
          current_weight: 0.20,
          normalized_weight: 0.20,
          rolling_accuracy: 82.5,
          rolling_brier: 0.14,
          rolling_logloss: 0.38,
          calibration_score: 85.0,
          last_updated: new Date().toISOString()
        },
        {
          model_name: "Market Calibration Model",
          prediction_type: "survival",
          current_weight: 0.22,
          normalized_weight: 0.22,
          rolling_accuracy: 84.0,
          rolling_brier: 0.13,
          rolling_logloss: 0.36,
          calibration_score: 88.0,
          last_updated: new Date().toISOString()
        },
        {
          model_name: "Expert Consensus Model",
          prediction_type: "survival",
          current_weight: 0.18,
          normalized_weight: 0.18,
          rolling_accuracy: 80.0,
          rolling_brier: 0.15,
          rolling_logloss: 0.40,
          calibration_score: 82.0,
          last_updated: new Date().toISOString()
        },
        {
          model_name: "Historical Trend Model",
          prediction_type: "survival",
          current_weight: 0.15,
          normalized_weight: 0.15,
          rolling_accuracy: 78.0,
          rolling_brier: 0.16,
          rolling_logloss: 0.42,
          calibration_score: 80.0,
          last_updated: new Date().toISOString()
        }
      ];
      weights = await modelWeightRepo.saveWeightMany(defaults);
    }
    return weights;
  }

  static async getWeightHistory(season?: string, week?: number): Promise<ModelWeightHistory[]> {
    return modelWeightRepo.getWeightHistory(season, week);
  }

  static async adaptWeights(
    season: string,
    week: number,
    policyVersion: string = "v0.55-default"
  ): Promise<ModelWeight[]> {
    console.log(`[Model Weighting Service] Starting V0.55 Automatic Model Reweighting calculations for ${season} Week ${week}`);

    // 1. Fetch current active weights
    const currentWeights = await this.getActiveWeights();

    // 2. Fetch recent model performance histories to extract real-time indicators
    const performances = await modelPerformanceRepo.getPerformanceHistory();

    const adaptedModels: ModelWeight[] = [];
    const rawScores: { modelName: string; score: number }[] = [];

    // Calculate a dynamic recent evidence score for each model
    for (const w of currentWeights) {
      // Find historical evaluations for this model in the current season up to the active week
      const modelPerf = performances.filter(
        p => p.model_name.toLowerCase() === w.model_name.toLowerCase() && p.season === season && p.week < week
      );

      let accuracy = w.rolling_accuracy;
      let brier = w.rolling_brier;
      let logloss = w.rolling_logloss;
      let calibration = w.calibration_score;

      if (modelPerf.length > 0) {
        // Sort chronologically and take average of trailing 4 weeks for steady, drift-calibrated learning
        const recentPerf = modelPerf.sort((a, b) => b.week - a.week).slice(0, 4);
        const sumAcc = recentPerf.reduce((sum, p) => sum + p.accuracy, 0);
        const sumBrier = recentPerf.reduce((sum, p) => sum + p.brier_score, 0);
        const sumLogloss = recentPerf.reduce((sum, p) => sum + p.log_loss, 0);
        const sumCalib = recentPerf.reduce((sum, p) => sum + p.calibration_score, 0);

        accuracy = Number((sumAcc / recentPerf.length).toFixed(2));
        brier = Number((sumBrier / recentPerf.length).toFixed(4));
        logloss = Number((sumLogloss / recentPerf.length).toFixed(4));
        calibration = Number((sumCalib / recentPerf.length).toFixed(2));
      }

      // Compute composite performance index (higher is better, scale of ~0-100)
      const performanceIndex = (accuracy * 0.5) + (calibration * 0.3) + ((1 - Math.min(1.0, brier)) * 100 * 0.2);
      rawScores.push({ modelName: w.model_name, score: performanceIndex });

      // Update the running snapshots on the weights themselves
      w.rolling_accuracy = accuracy;
      w.rolling_brier = brier;
      w.rolling_logloss = logloss;
      w.calibration_score = calibration;
    }

    // Proportional re-weighting with learning rate 0.15
    const avgScore = rawScores.reduce((sum, s) => sum + s.score, 0) / rawScores.length;
    const learningRate = 0.15;

    const unnormalizedWeights = currentWeights.map(w => {
      const pScore = rawScores.find(s => s.modelName === w.model_name)?.score || avgScore;
      const deviation = avgScore > 0 ? (pScore - avgScore) / avgScore : 0;
      
      // Update weight directionally with learning rate capping
      let updatedWeight = w.normalized_weight * (1 + learningRate * deviation);
      return {
        model_name: w.model_name,
        weight: updatedWeight
      };
    });

    // Apply constraints: min 0.05, max 0.50 with iterative balance redistribution
    const finalDistribution = this.clampAndNormalizeDistribution(unnormalizedWeights, 0.05, 0.50);

    const historyRecords: ModelWeightHistory[] = [];

    for (const w of currentWeights) {
      const previousWeight = w.normalized_weight;
      const newWeight = finalDistribution[w.model_name] || w.normalized_weight;
      const delta = Number((newWeight - previousWeight).toFixed(4));

      // Build explainable reasons
      let reason = "";
      if (Math.abs(delta) < 0.001) {
        reason = `Model weight stabilized at ${Number(newWeight * 100).toFixed(1)}%. Rolling accuracy (${w.rolling_accuracy.toFixed(1)}%) is closely aligned with ensemble averages.`;
      } else if (delta > 0) {
        reason = `Increased weight by +${Number(delta * 100).toFixed(1)}% (to ${Number(newWeight * 100).toFixed(1)}%) due to above-average rolling accuracy of ${w.rolling_accuracy.toFixed(1)}% and high calibration score (${w.calibration_score.toFixed(1)}).`;
      } else {
        reason = `Reduced weight by ${Number(delta * 100).toFixed(1)}% (to ${Number(newWeight * 100).toFixed(1)}%) in response to model drift underperformance. Evidence indicates a higher Brier score (${w.rolling_brier.toFixed(3)}) relative to other ensemble predictors.`;
      }

      // Check boundaries
      if (Math.abs(newWeight - 0.05) < 0.0001 && previousWeight > 0.05) {
        reason += " Minimum safety floor threshold constraint (5.0%) was enforced to maintain model diversity.";
      } else if (Math.abs(newWeight - 0.50) < 0.0001 && previousWeight < 0.50) {
        reason += " Maximum influence ceiling threshold constraint (50.0%) was enforced to prevent single model dominance.";
      }

      // Snapshot model metrics for auditability
      const metricsSnapshot = JSON.stringify({
        rolling_accuracy: w.rolling_accuracy,
        rolling_brier: w.rolling_brier,
        rolling_logloss: w.rolling_logloss,
        calibration_score: w.calibration_score
      });

      // Update current active weight properties
      w.current_weight = newWeight;
      w.normalized_weight = newWeight;
      w.last_updated = new Date().toISOString();

      adaptedModels.push(w);

      historyRecords.push({
        week,
        season,
        model_name: w.model_name,
        prediction_type: w.prediction_type,
        previous_weight: previousWeight,
        new_weight: newWeight,
        reason,
        metrics_snapshot: metricsSnapshot,
        policy_version: policyVersion
      });
    }

    // 3. Save active updated weights (Updates in-place)
    const savedWeights = await modelWeightRepo.saveWeightMany(adaptedModels);

    // 4. Save learning history records for complete audit tracking (Never modify historical logs, always append)
    await modelWeightRepo.saveHistoryMany(historyRecords);

    console.log(`[Model Weighting Service] Completed V0.55 Automatic Reweighting. Clamped and normalized ${savedWeights.length} model weights successfully.`);
    return savedWeights;
  }

  private static clampAndNormalizeDistribution(
    weights: { model_name: string; weight: number }[],
    min: number = 0.05,
    max: number = 0.50
  ): Record<string, number> {
    let adjusted = weights.map(w => ({ ...w, weight: Math.max(min, Math.min(max, w.weight)) }));
    
    // Iterate up to 10 times to solve redistribution constraints
    for (let iter = 0; iter < 10; iter++) {
      const total = adjusted.reduce((sum, w) => sum + w.weight, 0);
      if (Math.abs(total - 1.0) < 1e-6) break;
      
      const diff = 1.0 - total;
      // Find items that can absorb the difference without violating constraints
      const allocatable = adjusted.filter(
        w => (diff > 0 && w.weight < max) || (diff < 0 && w.weight > min)
      );
      
      if (allocatable.length === 0) break;
      
      const share = diff / allocatable.length;
      for (const item of allocatable) {
        const target = adjusted.find(w => w.model_name === item.model_name)!;
        target.weight = Math.max(min, Math.min(max, target.weight + share));
      }
    }
    
    // Scale proportionally for micro decimal safety
    const finalTotal = adjusted.reduce((sum, w) => sum + w.weight, 0);
    const result: Record<string, number> = {};
    for (const w of adjusted) {
      result[w.model_name] = Number((w.weight / finalTotal).toFixed(4));
    }

    // Force exact sum to be 1.0000
    let sumWeights = Object.values(result).reduce((sum, val) => sum + val, 0);
    if (sumWeights !== 1.0) {
      const firstKey = Object.keys(result)[0];
      const discrepancy = Number((1.0 - sumWeights).toFixed(4));
      result[firstKey] = Number((result[firstKey] + discrepancy).toFixed(4));
    }

    return result;
  }
}
