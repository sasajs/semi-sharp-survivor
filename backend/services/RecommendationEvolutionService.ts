import { 
  recommendationEvolutionRepo, 
  survivorRecommendationRepo, 
  recommendationConfidenceRepo,
  adaptiveModelWeightRepo,
  decisionAnalyticsRepo,
  gameRepo,
  contestRepo,
  legRepo
} from "../repositories";
import { 
  RecommendationEvolution, 
  RecommendationChangeEvent, 
  RecommendationEvolutionSummary,
  SurvivorRecommendation,
  RecommendationConfidenceSnapshot,
  AdaptiveModelWeight,
  DecisionOutcomeRecord,
  DecisionAnalyticsRecord
} from "../../src/types";

export class RecommendationEvolutionService {
  /**
   * Main method to track evolution of recommendations for a given week.
   * Compares the current version of recommendations with previous runs.
   */
  static async trackEvolution(season: string, week: number, currentVersion: string): Promise<RecommendationEvolution[]> {
    console.log(`[Recommendation Evolution Service] Tracking evolution for Season ${season}, Week ${week} (version: ${currentVersion})`);

    // 1. Fetch all recommendations for this season/week
    const allRecs = await survivorRecommendationRepo.getBySeasonAndWeek(season, week);
    if (allRecs.length === 0) {
      console.warn(`[Recommendation Evolution Service] No recommendations found for ${season} Week ${week}.`);
      return [];
    }

    // Identify current active recommendations
    const currentRecs = allRecs.filter(r => r.calculation_version === currentVersion);
    if (currentRecs.length === 0) {
      console.warn(`[Recommendation Evolution Service] No recommendations found for current version ${currentVersion}.`);
      return [];
    }

    // Identify previous recommendations (most recent prior calculation version)
    const priorRecs = allRecs.filter(r => r.calculation_version !== currentVersion);
    let previousVersion: string | null = null;
    if (priorRecs.length > 0) {
      const sortedPrior = [...priorRecs].sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      });
      previousVersion = sortedPrior[0].calculation_version;
    }

    const previousRecs = previousVersion 
      ? priorRecs.filter(r => r.calculation_version === previousVersion)
      : [];

    console.log(`[Recommendation Evolution Service] Found ${currentRecs.length} current recs and ${previousRecs.length} previous recs (from version ${previousVersion || "none"}).`);

    // Fetch confidence snapshots to compare confidence/stability scores
    const allConfidenceSnapshots = await recommendationConfidenceRepo.getBySeasonAndWeek(season, week);
    const currentConfMap = new Map<string, RecommendationConfidenceSnapshot>();
    const previousConfMap = new Map<string, RecommendationConfidenceSnapshot>();

    for (const snap of allConfidenceSnapshots) {
      const key = `${snap.entry_id}_${snap.team_id}`.toLowerCase();
      if (snap.calculation_version === currentVersion) {
        currentConfMap.set(key, snap);
      } else if (previousVersion && snap.calculation_version === previousVersion) {
        previousConfMap.set(key, snap);
      }
    }

    // Fetch adaptive model weights to check weight recalibrations
    const allModelWeights = await adaptiveModelWeightRepo.getWeightsHistory();
    const currentWeights = allModelWeights.filter(w => w.season === season && w.week === week && w.calculation_version === currentVersion);
    const previousWeights = previousVersion 
      ? allModelWeights.filter(w => w.season === season && w.week === week && w.calculation_version === previousVersion)
      : [];

    // Map model weights for comparison (model_name -> AdaptiveModelWeight)
    const currentWeightsMap = new Map<string, AdaptiveModelWeight>();
    currentWeights.forEach(w => currentWeightsMap.set(w.model_name, w));

    const previousWeightsMap = new Map<string, AdaptiveModelWeight>();
    previousWeights.forEach(w => previousWeightsMap.set(w.model_name, w));

    // Determine weight shifts
    const weightShiftDetails: string[] = [];
    let isWeightRecalibrated = false;

    for (const [modelName, currW] of currentWeightsMap.entries()) {
      const prevW = previousWeightsMap.get(modelName);
      if (prevW && Math.abs(currW.final_weight - prevW.final_weight) > 0.01) {
        isWeightRecalibrated = true;
        weightShiftDetails.push(`${modelName}: ${prevW.final_weight.toFixed(1)}% -> ${currW.final_weight.toFixed(1)}% (delta: ${(currW.final_weight - prevW.final_weight).toFixed(1)}%)`);
      }
    }

    // Now track evolution per distinct entry and team
    const evolutionsToSave: RecommendationEvolution[] = [];
    const changeEventsToSave: Omit<RecommendationChangeEvent, "id">[] = [];

    // Combine distinct combinations of entry_id & team_id across current and previous sets
    const distinctPairs = new Set<string>();
    currentRecs.forEach(r => distinctPairs.add(`${r.entry_id}_${r.recommended_team_id}`.toLowerCase()));
    previousRecs.forEach(r => distinctPairs.add(`${r.entry_id}_${r.recommended_team_id}`.toLowerCase()));

    const contests = await contestRepo.getAll();

    for (const pair of distinctPairs) {
      const [entryId, teamId] = pair.split("_");
      
      const current = currentRecs.find(r => r.entry_id.toLowerCase() === entryId && r.recommended_team_id.toLowerCase() === teamId);
      const previous = previousRecs.find(r => r.entry_id.toLowerCase() === entryId && r.recommended_team_id.toLowerCase() === teamId);

      // Find the contest id for this entry
      let contestDbId: number | undefined;
      const matchingContest = contests.find(c => c.id?.toString() === current?.entry_id || c.id?.toString() === previous?.entry_id);
      if (matchingContest && matchingContest.id) {
        contestDbId = Number(matchingContest.id);
      }

      const confKey = `${entryId}_${teamId}`.toLowerCase();
      const currentConf = currentConfMap.get(confKey);
      const previousConf = previousConfMap.get(confKey);

      let previous_rank: number | undefined = previous?.recommendation_rank;
      let new_rank: number | undefined = current?.recommendation_rank;

      let previous_confidence: number | undefined = previousConf?.confidence_score ?? previous?.recommendation_score;
      let new_confidence: number | undefined = currentConf?.confidence_score ?? current?.recommendation_score;

      // Survival probability and EV map to survivor equity score and contest EV
      let previous_probability: number | undefined = previous?.survivor_equity_score;
      let new_probability: number | undefined = current?.survivor_equity_score;

      let previous_expected_value: number | undefined = previous?.contest_equity_adjustment;
      let new_expected_value: number | undefined = current?.contest_equity_adjustment;

      // Primary model weights (using 'Survivor Equity' weight as the anchor)
      let previous_model_weight: number | undefined = previousWeightsMap.get("Survivor Equity")?.final_weight;
      let new_model_weight: number | undefined = currentWeightsMap.get("Survivor Equity")?.final_weight;

      let recommendation_status = "STABLE";
      let triggering_event = "POLICY_ADJUSTMENT";
      const reasons: string[] = [];

      if (current && previous) {
        // Existed in both runs
        const rankDelta = (previous_rank || 0) - (new_rank || 0); // Improved rank is positive
        const confDelta = (new_confidence || 0) - (previous_confidence || 0);

        if (rankDelta > 0) {
          recommendation_status = "UPGRADED";
          reasons.push(`Recommendation rank upgraded from Rank ${previous_rank} to Rank ${new_rank} (improved by +${rankDelta}).`);
        } else if (rankDelta < 0) {
          recommendation_status = "DOWNGRADED";
          reasons.push(`Recommendation rank downgraded from Rank ${previous_rank} to Rank ${new_rank} (degraded by ${rankDelta}).`);
        } else {
          recommendation_status = "STABLE";
          reasons.push(`Recommendation remained stable at Rank ${new_rank}.`);
        }

        if (Math.abs(confDelta) >= 1.0) {
          reasons.push(`Confidence score shifted from ${previous_confidence?.toFixed(1)} to ${new_confidence?.toFixed(1)} (delta: ${confDelta > 0 ? "+" : ""}${confDelta.toFixed(1)}).`);
        }

        // Detect triggering events
        if (isWeightRecalibrated) {
          triggering_event = "WEIGHT_RECALIBRATION";
          reasons.push(`Recalibrated using updated model weights.`);
        } else if (Math.abs((current.projected_ownership_pct || 0) - (previous.projected_ownership_pct || 0)) > 2.0) {
          triggering_event = "CONTEST_LIQUIDATION";
          reasons.push(`Contest dynamics shifted. Ownership projections changed by ${((current.projected_ownership_pct || 0) - (previous.projected_ownership_pct || 0)).toFixed(1)}%.`);
        } else if (Math.abs((current.survivor_equity_score || 0) - (previous.survivor_equity_score || 0)) > 0.05) {
          triggering_event = "LINE_MOVEMENT";
          reasons.push(`Market lines or spread moved, impacting predictive survival probability.`);
        }
      } else if (current) {
        // Newly added
        recommendation_status = "NEW";
        triggering_event = "POLICY_ADJUSTMENT";
        reasons.push(`New recommendation identified at Rank ${new_rank} with score ${current.recommendation_score.toFixed(1)}.`);
      } else if (previous) {
        // Abandoned / Dropped
        recommendation_status = "ABANDONED";
        triggering_event = "POLICY_ADJUSTMENT";
        reasons.push(`Recommendation dropped. Previously ranked Rank ${previous_rank} with score ${previous.recommendation_score.toFixed(1)}.`);
      }

      const evolution_reason = reasons.join(" ");

      const evo: RecommendationEvolution = {
        season,
        week,
        contest_id: contestDbId,
        recommendation_id: current?.id ? Number(current.id) : previous?.id ? Number(previous.id) : undefined,
        team_id: teamId.toUpperCase(),
        previous_rank,
        new_rank,
        previous_confidence,
        new_confidence,
        previous_probability,
        new_probability,
        previous_expected_value,
        new_expected_value,
        previous_model_weight,
        new_model_weight,
        evolution_reason,
        triggering_event,
        recommendation_status
      };

      evolutionsToSave.push(evo);
    }

    // Save all evolutions
    const savedEvolutions = await recommendationEvolutionRepo.saveEvolutionMany(evolutionsToSave);

    // Save detailed change events for any non-stable or significant evolutions
    for (const evo of savedEvolutions) {
      if (!evo.recommendation_id) continue;

      // 1. If rank changed
      if (evo.previous_rank !== undefined && evo.new_rank !== undefined && evo.previous_rank !== evo.new_rank) {
        changeEventsToSave.push({
          recommendation_id: evo.recommendation_id,
          event_type: "RANK_SHIFT",
          event_source: "SURVIVOR_RECOMMENDATION_ENGINE",
          event_description: `Rank moved from Rank ${evo.previous_rank} to Rank ${evo.new_rank}.`,
          impact_score: Number(((evo.previous_rank - evo.new_rank) * 10).toFixed(2)),
          previous_value: `Rank ${evo.previous_rank}`,
          new_value: `Rank ${evo.new_rank}`
        });
      }

      // 2. If confidence changed significantly (>= 2.0%)
      if (evo.previous_confidence !== undefined && evo.new_confidence !== undefined && Math.abs(evo.new_confidence - evo.previous_confidence) >= 2.0) {
        const delta = evo.new_confidence - evo.previous_confidence;
        changeEventsToSave.push({
          recommendation_id: evo.recommendation_id,
          event_type: "CONFIDENCE_SHIFT",
          event_source: "CONFIDENCE_ENGINE",
          event_description: `Confidence score changed from ${evo.previous_confidence.toFixed(1)} to ${evo.new_confidence.toFixed(1)}.`,
          impact_score: Number(delta.toFixed(2)),
          previous_value: evo.previous_confidence.toFixed(1),
          new_value: evo.new_confidence.toFixed(1)
        });
      }

      // 3. If model weights changed and influenced this evolution
      if (isWeightRecalibrated && evo.recommendation_status !== "STABLE") {
        changeEventsToSave.push({
          recommendation_id: evo.recommendation_id,
          event_type: "WEIGHT_RECALIBRATION",
          event_source: "ADAPTIVE_MODEL_WEIGHT_SERVICE",
          event_description: `Recalibrated using model weight revisions: ${weightShiftDetails.join("; ")}`,
          impact_score: 5.0,
          previous_value: evo.previous_model_weight ? `${evo.previous_model_weight.toFixed(1)}%` : undefined,
          new_value: evo.new_model_weight ? `${evo.new_model_weight.toFixed(1)}%` : undefined
        });
      }
    }

    if (changeEventsToSave.length > 0) {
      await recommendationEvolutionRepo.saveChangeEventMany(changeEventsToSave as RecommendationChangeEvent[]);
    }

    // 4. Generate Weekly Evolution Summary
    const total_changes = savedEvolutions.filter(e => e.recommendation_status !== "STABLE").length;
    const stable_recommendations = savedEvolutions.filter(e => e.recommendation_status === "STABLE").length;
    
    // Major changes are rank shifts of 2+ or confidence shifts of 10%+
    const major_changes = savedEvolutions.filter(e => {
      const rankShift = Math.abs((e.previous_rank || 0) - (e.new_rank || 0));
      const confShift = Math.abs((e.new_confidence || 0) - (e.previous_confidence || 0));
      return rankShift >= 2 || confShift >= 10.0;
    }).length;

    // Calculate average deltas
    let sumConfDelta = 0;
    let sumRankDelta = 0;
    let validConfCount = 0;
    let validRankCount = 0;

    for (const e of savedEvolutions) {
      if (e.previous_confidence !== undefined && e.new_confidence !== undefined) {
        sumConfDelta += Math.abs(e.new_confidence - e.previous_confidence);
        validConfCount++;
      }
      if (e.previous_rank !== undefined && e.new_rank !== undefined) {
        sumRankDelta += Math.abs(e.new_rank - e.previous_rank);
        validRankCount++;
      }
    }

    const average_confidence_delta = validConfCount > 0 ? sumConfDelta / validConfCount : 0;
    const average_rank_delta = validRankCount > 0 ? sumRankDelta / validRankCount : 0;

    const summary: RecommendationEvolutionSummary = {
      season,
      week,
      total_changes,
      major_changes,
      stable_recommendations,
      average_confidence_delta,
      average_rank_delta
    };

    await recommendationEvolutionRepo.saveSummary(summary);

    return savedEvolutions;
  }

  /**
   * Evaluate the outcomes of recommendation evolutions (proves correct or incorrect).
   */
  static async evaluateOutcomes(season: string, week: number): Promise<RecommendationEvolution[]> {
    console.log(`[Recommendation Evolution Service] Evaluating recommendation outcomes for ${season} Week ${week}`);

    // Fetch all evolution records for the week
    const evolutions = await recommendationEvolutionRepo.getEvolutionHistory(season, week);
    if (evolutions.length === 0) {
      console.warn(`[Recommendation Evolution Service] No evolution records found to evaluate for ${season} Week ${week}.`);
      return [];
    }

    // Retrieve decision outcomes
    const outcomes: DecisionOutcomeRecord[] = await decisionAnalyticsRepo.getOutcomes();
    
    // Retrieve decision records to map outcomes to recommendation IDs
    const decisions: DecisionAnalyticsRecord[] = await decisionAnalyticsRepo.getDecisionsBySeasonAndWeek(season, week);

    // Retrieve games to use as a robust fallback
    const legs = await legRepo.getAll();
    const leg = legs.find(l => {
      const matches = l.id.match(/w(\d+)/i) || l.name.match(/Week\s*(\d+)/i);
      const w = matches ? parseInt(matches[1], 10) : l.display_order;
      return w === week;
    });

    let gamesThisWeek: any[] = [];
    if (leg) {
      gamesThisWeek = await gameRepo.getByLegId(leg.id);
    }

    const updatedEvolutions: RecommendationEvolution[] = [];

    for (const evo of evolutions) {
      let isCorrect: boolean | null = null;
      let outcomeFound = false;

      // Try mapping via Decision Outcome records
      if (evo.recommendation_id) {
        const matchingDecision = decisions.find(d => d.recommendation_id === evo.recommendation_id.toString());
        if (matchingDecision && matchingDecision.id) {
          const matchingOutcome = outcomes.find(o => o.decision_id === matchingDecision.id);
          if (matchingOutcome) {
            isCorrect = matchingOutcome.survived && !matchingOutcome.eliminated;
            outcomeFound = true;
          }
        }
      }

      // Fallback: direct check using game results
      if (!outcomeFound && evo.team_id) {
        const teamGame = gamesThisWeek.find(g => 
          g.home_team_id.toUpperCase() === evo.team_id?.toUpperCase() || 
          g.away_team_id.toUpperCase() === evo.team_id?.toUpperCase()
        );

        if (teamGame && teamGame.status === "final") {
          const isHome = teamGame.home_team_id.toUpperCase() === evo.team_id.toUpperCase();
          const homeScore = teamGame.home_score ?? 0;
          const awayScore = teamGame.away_score ?? 0;

          if (isHome) {
            isCorrect = homeScore > awayScore;
          } else {
            isCorrect = awayScore > homeScore;
          }
          outcomeFound = true;
        }
      }

      // If we resolved the outcome, update status to CORRECT / INCORRECT and save
      if (isCorrect !== null) {
        evo.recommendation_status = isCorrect ? "CORRECT" : "INCORRECT";
        evo.evolution_reason += ` Evaluated: recommendation was ${isCorrect ? "CORRECT" : "INCORRECT"} based on actual outcome.`;
        
        const saved = await recommendationEvolutionRepo.saveEvolution(evo);
        updatedEvolutions.push(saved);
      }
    }

    console.log(`[Recommendation Evolution Service] Evaluated outcomes for ${updatedEvolutions.length} evolution records.`);
    return updatedEvolutions;
  }
}
