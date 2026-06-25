import { 
  survivorRecommendationRepo,
  recommendationConfidenceRepo,
  recommendationConsensusRepo,
  recommendationPortfolioRepo,
  contestEVRepo,
  entryRepo,
  contestRepo,
  futureTeamValueRepo,
  survivorEquityRepo,
  ownershipProjectionRepo
} from "../repositories/index";
import { 
  ContestEV,
  ContestType,
  SurvivorRecommendation,
  RecommendationPortfolio,
  Contest
} from "../../src/types";

export class ContestEVService {
  static async getLatest(): Promise<ContestEV[]> {
    return contestEVRepo.getLatestContestEV();
  }

  static async getHistory(): Promise<ContestEV[]> {
    return contestEVRepo.getContestHistory();
  }

  static async getById(contestId: string): Promise<ContestEV[]> {
    return contestEVRepo.getContestEV(contestId);
  }

  static async deleteWeek(season: string, week: number): Promise<boolean> {
    return contestEVRepo.deleteWeek(season, week);
  }

  static async calculate(
    season: string,
    week: number,
    calculationVersion: string
  ): Promise<ContestEV[]> {
    console.log(`[Contest EV Service] Executing Contest Expected Value (Contest EV) optimization for ${season} Week ${week} (Version: ${calculationVersion})`);

    // 1. Fetch active survivor entries
    const entries = await entryRepo.getAll();
    const activeEntries = entries.filter(e => e.status === "alive");

    if (activeEntries.length === 0) {
      console.warn(`[Contest EV Service] No active survivor entries found for Contest EV calculation.`);
      return [];
    }

    // 2. Fetch or seed contests
    let contests = await contestRepo.getAll();
    if (contests.length === 0) {
      const defaultContests: Contest[] = [
        { id: "circa-2026", name: "Circa Survivor 2026", year: 2026, status: "active" },
        { id: "public-mega", name: "Public Mega Contest", year: 2026, status: "active" },
        { id: "private-highroller", name: "Private High-Roller Pool", year: 2026, status: "active" },
        { id: "group-office", name: "Office Group Pool", year: 2026, status: "active" },
        { id: "marketplace-champ", name: "Marketplace Championship", year: 2026, status: "active" }
      ];
      for (const c of defaultContests) {
        await contestRepo.save(c);
      }
      contests = await contestRepo.getAll();
    }

    // Helper to get parameters per contest
    const getContestConfig = (contestId: string): {
      type: ContestType;
      size: number;
      remaining: number;
      description: string;
    } => {
      switch (contestId) {
        case "circa-2026":
          return { type: ContestType.HIGH_STAKES, size: 6000, remaining: 1200, description: "Circa Survivor 2026" };
        case "public-mega":
          return { type: ContestType.PUBLIC, size: 10000, remaining: 2500, description: "Public Mega Contest" };
        case "private-highroller":
          return { type: ContestType.PRIVATE, size: 150, remaining: 15, description: "Private High-Roller Pool" };
        case "group-office":
          return { type: ContestType.GROUP, size: 500, remaining: 80, description: "Office Group Pool" };
        case "marketplace-champ":
          return { type: ContestType.MARKETPLACE, size: 3000, remaining: 450, description: "Marketplace Championship" };
        default:
          return { type: ContestType.PUBLIC, size: 1000, remaining: 100, description: "Generic Public Pool" };
      }
    };

    // 3. Retrieve pre-calculated pipeline states
    const allRecs = await survivorRecommendationRepo.getBySeasonAndWeek(season, week);
    const weekRecs = allRecs.filter(r => r.calculation_version === calculationVersion);

    const portfolios = await recommendationPortfolioRepo.getLatestPortfolio();
    const activePortfolios = portfolios.filter(p => p.calculation_version === calculationVersion);

    const consensusList = await recommendationConsensusRepo.getBySeasonAndWeek(season, week);
    const equityList = await survivorEquityRepo.getBySeasonAndWeek(season, week);
    const ftvList = await futureTeamValueRepo.getBySeasonAndWeek(season, week);
    const ownershipList = await ownershipProjectionRepo.getBySeasonAndWeek(season, week);

    const calculatedSnapshots: ContestEV[] = [];

    // Clear existing for this season & week to prevent duplicates (idempotency)
    await contestEVRepo.deleteWeek(season, week);

    // 4. Perform Contest Expected Value optimization
    for (const contest of contests) {
      const config = getContestConfig(contest.id);

      for (const entry of activeEntries) {
        // Find recommendation for this entry
        const entryRec = weekRecs.find(r => r.entry_id === entry.id) || weekRecs[0];
        if (!entryRec) continue;

        const teamId = entryRec.recommended_team_id;

        // Retrieve Portfolio Score and Correlation Penalty
        const portfolioAlloc = activePortfolios.find(p => p.entry_id === entry.id && p.recommended_team_id === teamId);
        const portfolio_score = portfolioAlloc ? portfolioAlloc.portfolio_score : 75;
        const correlation_penalty = portfolioAlloc ? portfolioAlloc.correlation_penalty : 0;

        // Retrieve Consensus Score
        const consensusMatch = consensusList.find(c => c.team_id === teamId);
        const consensus_score = consensusMatch ? consensusMatch.consensus_score : 70;

        // Retrieve Survivor Equity Score
        const equityMatch = equityList.find(e => e.entry_id === entry.id);
        const survivor_equity = equityMatch ? equityMatch.equity_score : entryRec.survivor_equity_score || 50;

        // Retrieve Future Team Value Score
        const ftvMatch = ftvList.find(f => f.team_id === teamId);
        const future_team_value = ftvMatch ? ftvMatch.future_value_score : entryRec.future_team_value_score || 50;

        // Retrieve Estimated Ownership Percentage
        const ownershipMatch = ownershipList.find(o => o.team_id === teamId);
        const estimated_ownership = ownershipMatch ? ownershipMatch.projected_ownership_pct : entryRec.projected_ownership_pct || 15;

        // Retrieve Win Probability
        const win_probability = entryRec.recommendation_score > 0 
          ? Math.max(0.4, Math.min(0.95, (entryRec.recommendation_score + 10) / 100))
          : 0.75;

        // 5. Calculate components
        const winProbScore = win_probability * 100;
        const ownership_leverage = 100 - estimated_ownership;

        // Calibrate risk adjustment based on contest type and estimated ownership
        let risk_adjustment = 0;
        if (config.type === ContestType.HIGH_STAKES) {
          risk_adjustment = estimated_ownership * 0.35;
        } else if (config.type === ContestType.PUBLIC) {
          risk_adjustment = estimated_ownership * 0.25;
        } else if (config.type === ContestType.MARKETPLACE) {
          risk_adjustment = estimated_ownership * 0.20;
        } else if (config.type === ContestType.GROUP) {
          risk_adjustment = estimated_ownership * 0.10;
        } else if (config.type === ContestType.PRIVATE) {
          risk_adjustment = estimated_ownership * 0.05;
        }

        // Contest EV Score formula
        let contest_ev_score = (
          (winProbScore * 0.25) +
          (survivor_equity * 0.20) +
          (future_team_value * 0.15) +
          (portfolio_score * 0.15) +
          (consensus_score * 0.10) +
          (ownership_leverage * 0.15)
        ) - correlation_penalty - risk_adjustment;

        // Normalize between 0 and 100
        contest_ev_score = Math.max(0, Math.min(100, contest_ev_score));

        // 6. Calibrate Championship Probability
        // Represents the probability of winning the entire contest
        const baseline_prob = (1 / config.remaining) * 100; // as percentage
        const evMultiplier = Math.pow(contest_ev_score / 75, 2.5);
        const championship_probability = Number(Math.max(0.0001, Math.min(100, baseline_prob * evMultiplier)).toFixed(4));

        // 7. Draft auditability explanation
        const explanation = `Contest EV score of ${contest_ev_score.toFixed(1)} for entry "${entry.name}" in ${config.description}. ` +
          `Underpinned by win probability of ${(win_probability * 100).toFixed(1)}% (weight 25%), ` +
          `survivor equity score of ${survivor_equity.toFixed(1)} (weight 20%), ` +
          `future team value score of ${future_team_value.toFixed(1)} (weight 15%), ` +
          `portfolio alignment of ${portfolio_score.toFixed(1)} (weight 15%), ` +
          `consensus score of ${consensus_score.toFixed(1)} (weight 10%), ` +
          `and ownership leverage of ${ownership_leverage.toFixed(1)} (weight 15%). ` +
          `Subtracted portfolio correlation penalty of -${correlation_penalty.toFixed(1)} and contest-specific risk adjustment of -${risk_adjustment.toFixed(1)} ` +
          `to calibrate championship win probability to ${championship_probability.toFixed(4)}% (baseline of ${baseline_prob.toFixed(4)}% with EV multiplier of ${evMultiplier.toFixed(2)}x).`;

        calculatedSnapshots.push({
          season,
          week,
          contest_id: contest.id,
          entry_id: entry.id,
          recommended_team_id: teamId,
          contest_size: config.size,
          remaining_entries: config.remaining,
          estimated_ownership,
          win_probability,
          future_team_value,
          survivor_equity,
          portfolio_score,
          consensus_score,
          contest_ev_score,
          championship_probability,
          risk_adjustment,
          explanation,
          calculation_version: calculationVersion,
          contest_type: config.type
        });
      }
    }

    // 8. Save results
    if (calculatedSnapshots.length > 0) {
      await contestEVRepo.saveContestEV(calculatedSnapshots);
    }

    return calculatedSnapshots;
  }
}
