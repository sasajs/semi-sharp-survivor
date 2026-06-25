import { 
  survivorRecommendationRepo,
  recommendationConfidenceRepo,
  recommendationConsensusRepo,
  recommendationPortfolioRepo,
  gameRepo,
  entryRepo
} from "../repositories/index";
import { 
  RecommendationPortfolio,
  SurvivorRecommendation,
  RecommendationConfidenceSnapshot,
  RecommendationConsensus,
  Game
} from "../../src/types";

export class RecommendationPortfolioOptimizerService {
  static async getLatest(): Promise<RecommendationPortfolio[]> {
    return recommendationPortfolioRepo.getLatestPortfolio();
  }

  static async getHistory(): Promise<RecommendationPortfolio[]> {
    return recommendationPortfolioRepo.getPortfolioHistory();
  }

  static async getById(portfolioId: string): Promise<RecommendationPortfolio[]> {
    return recommendationPortfolioRepo.getPortfolioById(portfolioId);
  }

  static async deleteWeek(season: string, week: number): Promise<boolean> {
    return recommendationPortfolioRepo.deleteWeek(season, week);
  }

  static async calculate(
    season: string,
    week: number,
    calculationVersion: string
  ): Promise<RecommendationPortfolio[]> {
    console.log(`[Portfolio Optimizer] Starting multi-entry optimization for ${season} Week ${week} (Version: ${calculationVersion})`);

    // 1. Retrieve all active survivor entries
    const entries = await entryRepo.getAll();
    const activeEntries = entries.filter(e => e.status === "alive");

    if (activeEntries.length === 0) {
      console.warn(`[Portfolio Optimizer] No active survivor entries found for portfolio optimization.`);
      return [];
    }

    // 2. Fetch recommendations for the given week and version
    const allRecs = await survivorRecommendationRepo.getBySeasonAndWeek(season, week);
    const weekRecs = allRecs.filter(r => r.calculation_version === calculationVersion);

    if (weekRecs.length === 0) {
      console.warn(`[Portfolio Optimizer] No eligible recommendations found for version: ${calculationVersion}`);
      return [];
    }

    // 3. Fetch confidence and consensus snapshots
    const allConfidence = await recommendationConfidenceRepo.getBySeasonAndWeek(season, week);
    const weekConfidence = allConfidence.filter(c => c.calculation_version === calculationVersion);

    const allConsensus = await recommendationConsensusRepo.getBySeasonAndWeek(season, week);
    const weekConsensus = allConsensus.filter(c => c.calculation_version === calculationVersion);

    // 4. Fetch games for the week to evaluate head-to-head suicide-game correlation
    let weekGames: Game[] = [];
    try {
      // Find the leg ID for the given season and week
      const firstRec = weekRecs[0];
      // Leg ID is typically retrievable or we can just fetch all games and match
      weekGames = await gameRepo.getAll();
    } catch (err: any) {
      console.error(`[Portfolio Optimizer] Failed to retrieve games: ${err.message}`);
    }

    // 5. Group recommendations by entry ID and keep eligible ones (recommendation_score > 0)
    const entryCandidatesMap: { [entryId: string]: SurvivorRecommendation[] } = {};
    for (const e of activeEntries) {
      const candidates = weekRecs
        .filter(r => r.entry_id === e.id && r.recommendation_score > 0)
        .sort((a, b) => b.recommendation_score - a.recommendation_score);
      
      if (candidates.length > 0) {
        entryCandidatesMap[e.id] = candidates;
      }
    }

    const optimizationEntries = Object.keys(entryCandidatesMap);
    if (optimizationEntries.length === 0) {
      console.warn(`[Portfolio Optimizer] No active entries have eligible recommendations.`);
      return [];
    }

    // Define unique stable portfolio session ID
    const portfolioId = `port-${season}-w${week}-${Date.now().toString().substring(6)}`;

    // 6. Set up and run the backtrack search over combinations
    // To maintain high performance, we restrict candidate teams per entry based on portfolio size
    const N = optimizationEntries.length;
    const K = N <= 3 ? 10 : (N <= 5 ? 6 : 4);

    let bestCombination: { [entryId: string]: SurvivorRecommendation } | null = null;
    let bestScore = -Infinity;
    let bestCorrPenalty = 0;
    let bestDivScore = 0;

    const backtrack = (
      index: number,
      currentAssignment: { [entryId: string]: SurvivorRecommendation }
    ) => {
      if (index === N) {
        // Evaluate the assignment
        const evaluation = this.evaluatePortfolio(
          currentAssignment,
          weekConfidence,
          weekConsensus,
          weekGames
        );
        if (evaluation.overallScore > bestScore) {
          bestScore = evaluation.overallScore;
          bestCorrPenalty = evaluation.correlationPenalty;
          bestDivScore = evaluation.diversificationScore;
          bestCombination = { ...currentAssignment };
        }
        return;
      }

      const entryId = optimizationEntries[index];
      const entryCandidates = entryCandidatesMap[entryId].slice(0, K);

      for (const rec of entryCandidates) {
        currentAssignment[entryId] = rec;
        backtrack(index + 1, currentAssignment);
        delete currentAssignment[entryId];
      }
    };

    backtrack(0, {});

    if (!bestCombination) {
      console.error(`[Portfolio Optimizer] Optimization backtrack failed to find any valid combination.`);
      return [];
    }

    // 7. Map the winning combination to the output Portfolio Recommendation objects
    const results: RecommendationPortfolio[] = [];
    const chosenCombinationMap = bestCombination as { [entryId: string]: SurvivorRecommendation };

    // Group chosen teams to allocate ranks and descriptions
    const chosenTeams = Object.values(chosenCombinationMap).map(r => r.recommended_team_id);
    const teamCounts: { [teamId: string]: number } = {};
    for (const team of chosenTeams) {
      teamCounts[team] = (teamCounts[team] || 0) + 1;
    }

    optimizationEntries.forEach((entryId, index) => {
      const rec = chosenCombinationMap[entryId];
      const teamId = rec.recommended_team_id;

      // Component extraction with fallback defaults
      const recScore = Number(rec.recommendation_score);
      const equityScore = Number(rec.survivor_equity_score);
      const ftvScore = 100 - Number(rec.future_team_value_score);

      const confidenceSnapshot = weekConfidence.find(
        c => c.entry_id === entryId && c.team_id.toLowerCase() === teamId.toLowerCase()
      );
      const confidenceScore = confidenceSnapshot ? Number(confidenceSnapshot.confidence_score) : recScore * 0.9;

      const consensusSnapshot = weekConsensus.find(
        c => c.entry_id === entryId && c.team_id.toLowerCase() === teamId.toLowerCase()
      );
      const consensusScore = consensusSnapshot ? Number(consensusSnapshot.consensus_score) : (recScore + equityScore + ftvScore) / 3;

      // Single item base score (weighted formula)
      const baseScore = recScore * 0.35 + confidenceScore * 0.15 + consensusScore * 0.15 + equityScore * 0.20 + ftvScore * 0.15;

      // Correlation penalty for this specific selection
      const usageCount = teamCounts[teamId] || 1;
      let itemCorrPenalty = 0;
      if (usageCount > 1) {
        itemCorrPenalty = (usageCount - 1) * 20.0;
      }

      // Check for opponent suicide-game
      const opponent = this.getOpponent(teamId, weekGames);
      let playsOpponent = false;
      if (opponent) {
        playsOpponent = chosenTeams.includes(opponent);
        if (playsOpponent) {
          itemCorrPenalty += 100.0; // suicide game penalty contribution
        }
      }

      const itemPortfolioScore = Math.max(0.0, Math.min(100.0, baseScore - itemCorrPenalty));

      // Construct a clean, professional, literal human explanation
      let reason = "";
      if (usageCount === 1 && !playsOpponent) {
        reason = `Allocated ${teamId.toUpperCase()} with 100% individual concentration to maximize unique contest path coverage. High base score of ${baseScore.toFixed(1)} with no correlation penalty.`;
      } else if (playsOpponent) {
        reason = `WARNING: Opponent conflict detected! Chosen team ${teamId.toUpperCase()} plays opponent ${opponent?.toUpperCase()} which is also allocated in this portfolio. High failure risk.`;
      } else {
        reason = `Allocated ${teamId.toUpperCase()} with a shared concentration factor of ${usageCount} entries. Reconciles high standalone metrics against a diversification concentration penalty of -${itemCorrPenalty.toFixed(0)} pts.`;
      }

      const item: RecommendationPortfolio = {
        season,
        week,
        portfolio_id: portfolioId,
        entry_id: entryId,
        recommended_team_id: teamId,
        recommendation_score: Number(recScore.toFixed(2)),
        confidence_score: Number(confidenceScore.toFixed(2)),
        consensus_score: Number(consensusScore.toFixed(2)),
        allocation_rank: index + 1,
        diversification_score: Number(bestDivScore.toFixed(2)),
        correlation_penalty: Number(itemCorrPenalty.toFixed(2)),
        portfolio_score: Number(itemPortfolioScore.toFixed(2)),
        allocation_reason: reason,
        calculation_version: calculationVersion
      };

      results.push(item);
    });

    // Save and return optimized results
    const savedResults = await recommendationPortfolioRepo.savePortfolioRecommendations(results);
    console.log(`[Portfolio Optimizer] Successfully completed portfolio optimization. Generated ${savedResults.length} entry allocations under Portfolio ID: ${portfolioId}`);
    return savedResults;
  }

  /**
   * Helper to retrieve opponent for a team from the game schedule
   */
  private static getOpponent(teamId: string, games: Game[]): string | null {
    const game = games.find(
      g => g.home_team_id.toLowerCase() === teamId.toLowerCase() || 
           g.away_team_id.toLowerCase() === teamId.toLowerCase()
    );
    if (!game) return null;
    return game.home_team_id.toLowerCase() === teamId.toLowerCase() 
      ? game.away_team_id 
      : game.home_team_id;
  }

  /**
   * Evaluate a specific combination of recommendations for the portfolio
   */
  private static evaluatePortfolio(
    assignment: { [entryId: string]: SurvivorRecommendation },
    weekConfidence: RecommendationConfidenceSnapshot[],
    weekConsensus: RecommendationConsensus[],
    games: Game[]
  ): { overallScore: number; correlationPenalty: number; diversificationScore: number } {
    const entries = Object.keys(assignment);
    const N = entries.length;

    let totalBaseScore = 0;
    const selectedTeams: string[] = [];

    entries.forEach(entryId => {
      const rec = assignment[entryId];
      const teamId = rec.recommended_team_id;
      selectedTeams.push(teamId);

      const recScore = Number(rec.recommendation_score);
      const equityScore = Number(rec.survivor_equity_score);
      const ftvScore = 100 - Number(rec.future_team_value_score);

      // Fetch confidence and consensus components or use fallbacks
      const confidenceSnapshot = weekConfidence.find(
        c => c.entry_id === entryId && c.team_id.toLowerCase() === teamId.toLowerCase()
      );
      const confidenceScore = confidenceSnapshot ? Number(confidenceSnapshot.confidence_score) : recScore * 0.9;

      const consensusSnapshot = weekConsensus.find(
        c => c.entry_id === entryId && c.team_id.toLowerCase() === teamId.toLowerCase()
      );
      const consensusScore = consensusSnapshot ? Number(consensusSnapshot.consensus_score) : (recScore + equityScore + ftvScore) / 3;

      // Standalone base score before correlation penalty
      const baseScore = recScore * 0.35 + confidenceScore * 0.15 + consensusScore * 0.15 + equityScore * 0.20 + ftvScore * 0.15;
      totalBaseScore += baseScore;
    });

    const averageBaseScore = totalBaseScore / N;

    // 1. Concentration Penalty (repeated teams)
    const teamCounts: { [teamId: string]: number } = {};
    for (const team of selectedTeams) {
      teamCounts[team] = (teamCounts[team] || 0) + 1;
    }

    let correlationPenalty = 0;
    Object.values(teamCounts).forEach(count => {
      if (count > 1) {
        // e.g., 2 times: 20 pts penalty. 3 times: 55 pts. 4 times: 105 pts.
        correlationPenalty += (count - 1) * 20.0 + (count > 2 ? (count - 2) * 15.0 : 0);
      }
    });

    // 2. Suicide game penalty (Opponents playing each other)
    let suicideGamesCount = 0;
    for (let i = 0; i < selectedTeams.length; i++) {
      const opponent = this.getOpponent(selectedTeams[i], games);
      if (opponent && selectedTeams.slice(i + 1).includes(opponent)) {
        suicideGamesCount++;
      }
    }
    // Suicidal head-to-head picks are heavily penalized (150 pts per conflict)
    correlationPenalty += suicideGamesCount * 150.0;

    // 3. Diversification Score
    const uniqueTeamsCount = Object.keys(teamCounts).length;
    const diversificationScore = (uniqueTeamsCount / N) * 100.0;

    const overallScore = averageBaseScore - correlationPenalty;

    return {
      overallScore,
      correlationPenalty,
      diversificationScore
    };
  }
}
