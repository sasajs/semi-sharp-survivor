import { HistoricalWeek, ReplayWeekResult, ReplaySeasonResult } from "../models";

// Standard team strengths index used for simulated choices
export const TEAM_STRENGTHS: Record<string, number> = {
  KC: 95, SF: 94, BAL: 93, DET: 92, BUF: 90, PHI: 89, DAL: 88, GB: 87,
  HOU: 86, MIA: 85, LAR: 84, TB: 82, CLE: 81, PIT: 80, CIN: 80, SEA: 78,
  JAX: 77, MIN: 76, NO: 75, IND: 74, LV: 72, CHI: 70, ATL: 71, DEN: 68,
  NYJ: 67, LAC: 66, TEN: 65, ARI: 64, WAS: 63, NYG: 62, NE: 60, CAR: 50
};

export class ReplayExecutionService {
  /**
   * Determine the selected pick for a given week based on the selected strategy preference
   */
  static selectPickForWeek(
    week: HistoricalWeek,
    inventorySpent: string[],
    strategy: "safe" | "aggressive" | "balanced"
  ): { team: string; gameId: string } {
    // Collect all games in this historical week
    const candidates = week.games.map(game => {
      // We can pick either home or away, but to keep track we look at teams that aren't spent yet
      const homeAvailable = !inventorySpent.includes(game.homeTeam);
      const awayAvailable = !inventorySpent.includes(game.awayTeam);

      return {
        gameId: game.gameId,
        game,
        homeAvailable,
        awayAvailable
      };
    });

    // Strategy decision framework
    let bestPick: { team: string; gameId: string } | null = null;
    let fallbackPick: { team: string; gameId: string } | null = null;

    // Helper to calculate confidence scoring for candidates
    const scoredCandidates: { team: string; score: number; gameId: string }[] = [];

    for (const c of candidates) {
      if (c.homeAvailable) {
        const homeStrength = TEAM_STRENGTHS[c.game.homeTeam] || 70;
        const awayStrength = TEAM_STRENGTHS[c.game.awayTeam] || 70;
        // High difference means a safer pick for home team
        const score = homeStrength - awayStrength + 10; // Home field advantage bonus
        scoredCandidates.push({ team: c.game.homeTeam, score, gameId: c.gameId });
      }
      if (c.awayAvailable) {
        const homeStrength = TEAM_STRENGTHS[c.game.homeTeam] || 70;
        const awayStrength = TEAM_STRENGTHS[c.game.awayTeam] || 70;
        const score = awayStrength - homeStrength - 5; // Away penalty
        scoredCandidates.push({ team: c.game.awayTeam, score, gameId: c.gameId });
      }
    }

    if (scoredCandidates.length === 0) {
      // Absolute fallback if inventory is somehow completely exhausted, choose any unselected playing team
      const allTeames = week.games.flatMap(g => [g.homeTeam, g.awayTeam]);
      const freeTeam = allTeames.find(t => !inventorySpent.includes(t)) || allTeames[0];
      const match = week.games.find(g => g.homeTeam === freeTeam || g.awayTeam === freeTeam);
      return { team: freeTeam, gameId: match?.gameId || "fallback" };
    }

    // Sort scored candidates
    scoredCandidates.sort((a, b) => b.score - a.score);

    if (strategy === "safe") {
      // Choose the single highest-rated safety pick
      bestPick = { team: scoredCandidates[0].team, gameId: scoredCandidates[0].gameId };
    } else if (strategy === "aggressive") {
      // Under aggressive, we intentionally pick mid-tier candidates (e.g., ranks 3-5)
      // to preserve elite-level teams like KC/SF for crucial late weeks.
      const index = Math.min(scoredCandidates.length - 1, 3);
      bestPick = { team: scoredCandidates[index].team, gameId: scoredCandidates[index].gameId };
    } else {
      // Balanced mode, choose from second rank or first, split difference
      const index = Math.min(scoredCandidates.length - 1, 1);
      bestPick = { team: scoredCandidates[index].team, gameId: scoredCandidates[index].gameId };
    }

    return bestPick || { team: scoredCandidates[0].team, gameId: scoredCandidates[0].gameId };
  }

  /**
   * Evaluates the week pick against game outcome to determine outcome
   */
  static evaluatePickOutcome(
    week: HistoricalWeek,
    pick: string
  ): { outcome: "SURVIVED" | "ELIMINATED"; scoreOffset: number } {
    const game = week.games.find(g => g.homeTeam === pick || g.awayTeam === pick);
    if (!game) {
      return { outcome: "ELIMINATED", scoreOffset: 0 };
    }

    if (game.winner === pick) {
      // Calculate realistic score margin points earned
      const parts = game.score.split("-").map(Number);
      const pointsDiff = Math.abs((parts[0] || 10) - (parts[1] || 10));
      return { outcome: "SURVIVED", scoreOffset: pointsDiff };
    } else {
      return { outcome: "ELIMINATED", scoreOffset: 0 };
    }
  }
}
