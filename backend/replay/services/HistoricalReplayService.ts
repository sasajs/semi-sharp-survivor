import { 
  HistoricalSeason, 
  ReplayConfiguration, 
  ReplayExecution, 
  ReplayWeekResult, 
  ReplaySeasonResult, 
  ReplaySummary 
} from "../models";
import { TEAM_STRENGTHS, ReplayExecutionService } from "./ReplayExecutionService";
import { ReplayEvaluationService } from "./ReplayEvaluationService";
import { ReplayReportService } from "./ReplayReportService";

const TEAMS = [
  "KC", "SF", "BAL", "DET", "BUF", "PHI", "DAL", "GB", 
  "HOU", "MIA", "LAR", "TB", "CLE", "PIT", "CIN", "SEA", 
  "JAX", "MIN", "NO", "IND", "LV", "CHI", "ATL", "DEN", 
  "NYJ", "LAC", "TEN", "ARI", "WAS", "NYG", "NE", "CAR"
];

// In-Memory Replay Execution store
const inMemoryExecutions: ReplayExecution[] = [];

export class HistoricalReplayService {
  /**
   * Generates or fetches deterministic historical seasons
   */
  static generateHistoricalSeason(season: string): HistoricalSeason {
    const weeks: any[] = [];
    const seed = season === "2023" ? 2023 : season === "2024" ? 2024 : 2025;

    for (let w = 1; w <= 18; w++) {
      const games: any[] = [];
      const paired = new Set<string>();

      for (let i = 0; i < 32; i++) {
        const homeTeam = TEAMS[i];
        if (paired.has(homeTeam)) continue;

        let opponentIdx = (i + w) % 32;
        let iterations = 0;
        while (opponentIdx === i || paired.has(TEAMS[opponentIdx])) {
          opponentIdx = (opponentIdx + 1) % 32;
          iterations++;
          if (iterations > 32) break;
        }

        const awayTeam = TEAMS[opponentIdx];
        paired.add(homeTeam);
        paired.add(awayTeam);

        const homeStrength = TEAM_STRENGTHS[homeTeam] || 70;
        const awayStrength = TEAM_STRENGTHS[awayTeam] || 70;

        // Custom trigonometric swing calculations
        const homeWeight = homeStrength + Math.sin(i * w + seed) * 16 + 3;
        const awayWeight = awayStrength + Math.cos(opponentIdx * w + seed) * 16;

        const winner = homeWeight >= awayWeight ? homeTeam : awayTeam;
        const loser = winner === homeTeam ? awayTeam : homeTeam;

        const winnerScore = Math.floor(17 + ((homeWeight + awayWeight + w) % 21));
        const loserScore = Math.floor(winnerScore - 4 - ((homeWeight * w) % 11));
        const finalLoserScore = Math.max(3, loserScore);

        games.push({
          gameId: `game_s${season}_w${w}_g${i}`,
          homeTeam,
          awayTeam,
          winner,
          loser,
          score: `${winnerScore}-${finalLoserScore}`
        });
      }

      weeks.push({
        weekNumber: w,
        games
      });
    }

    return {
      season,
      weeks
    };
  }

  /**
   * Retrieves summary details of seasons ready for simulation
   */
  static getAvailableSeasons() {
    return [
      { 
        season: "2023", 
        weeksCount: 18, 
        description: "An upset-heavy NFL season requiring exceptional mid-tier navigation.",
        notableUpset: "Detroit over Kansas City in Week 1."
      },
      { 
        season: "2024", 
        weeksCount: 18, 
        description: "Balanced slate dominated by Detroit (DET) and Baltimore (BAL) elite streaks.",
        notableUpset: "Compelling late-season parity matches."
      },
      { 
        season: "2025", 
        weeksCount: 18, 
        description: "High-differential playoff contender sprints with extreme home margins.",
        notableUpset: "Prominent division rivalry swings."
      }
    ];
  }

  /**
   * Retrieves single full-season payload
   */
  static getSeason(season: string): HistoricalSeason {
    return this.generateHistoricalSeason(season);
  }

  /**
   * Executes backtesting simulation run
   */
  static async executeReplay(config: ReplayConfiguration): Promise<ReplayExecution> {
    const historicalSeason = this.getSeason(config.season);
    
    let weeksPlayed = 0;
    let weeksSurvived = 0;
    let eliminated = false;
    let eliminatedWeek: number | null = null;
    const inventorySpent: string[] = [];
    const weeklyResults: ReplayWeekResult[] = [];

    // Simulate week-by-week progression
    for (let currentW = config.startWeek; currentW <= config.endWeek; currentW++) {
      if (eliminated) {
        break;
      }

      const weekObj = historicalSeason.weeks.find(w => w.weekNumber === currentW);
      if (!weekObj) continue;

      weeksPlayed++;

      // 1. Selector Pick Maker
      const pick = ReplayExecutionService.selectPickForWeek(weekObj, inventorySpent, config.strategyPreference);
      
      // 2. Evaluate Outcome against game results
      const { outcome, scoreOffset } = ReplayExecutionService.evaluatePickOutcome(weekObj, pick.team);

      // Append and save selection to consumed list
      inventorySpent.push(pick.team);

      if (outcome === "SURVIVED") {
        weeksSurvived++;
        weeklyResults.push({
          weekNumber: currentW,
          selectedPick: pick.team,
          outcome: "SURVIVED",
          pointsScored: scoreOffset,
          inventorySpent: [...inventorySpent]
        });
      } else {
        eliminated = true;
        eliminatedWeek = currentW;
        weeklyResults.push({
          weekNumber: currentW,
          selectedPick: pick.team,
          outcome: "ELIMINATED",
          pointsScored: 0,
          inventorySpent: [...inventorySpent]
        });
      }
    }

    const seasonResult: ReplaySeasonResult = {
      season: config.season,
      weeksPlayed,
      weeksSurvived,
      eliminated,
      eliminatedWeek,
      weeklyResults
    };

    // 3. Compute detailed AI evaluator metrics
    const evaluation = ReplayEvaluationService.evaluateReplayPerformance(weeklyResults, eliminated);

    const execution: ReplayExecution = {
      id: `replay_exec_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      configuration: config,
      status: "COMPLETED",
      results: seasonResult,
      evaluation,
      generatedAt: new Date().toISOString()
    };

    inMemoryExecutions.push(execution);
    return execution;
  }

  /**
   * Stepwise individual week replay simulator
   */
  static executeWeekReplay(execution: ReplayExecution, weekNo: number): ReplayExecution {
    // Allows incremental triggers if designed by frontend
    return execution;
  }

  /**
   * Retrieves summary scorecard payload
   */
  static generateReplaySummary(execution: ReplayExecution): ReplaySummary {
    return ReplayReportService.generateSummary(execution);
  }

  /**
   * Fetch all executions recorded
   */
  static getExecutions(): ReplayExecution[] {
    return inMemoryExecutions;
  }

  /**
   * Fetch a single execution by UUID/id
   */
  static getExecutionById(id: string): ReplayExecution | undefined {
    return inMemoryExecutions.find(e => e.id === id);
  }
}
export default HistoricalReplayService;
