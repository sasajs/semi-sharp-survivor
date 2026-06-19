export interface HistoricalSeason {
  season: string;
  weeks: HistoricalWeek[];
}

export interface HistoricalWeek {
  weekNumber: number;
  games: {
    gameId: string;
    homeTeam: string;
    awayTeam: string;
    winner: string;
    loser: string;
    score: string;
  }[];
}

export interface ReplayConfiguration {
  season: string;
  strategyPreference: "safe" | "aggressive" | "balanced";
  startWeek: number;
  endWeek: number;
}

export interface ReplayWeekResult {
  weekNumber: number;
  selectedPick: string;
  outcome: "SURVIVED" | "ELIMINATED" | "PENDING";
  pointsScored: number;
  inventorySpent: string[];
}

export interface ReplaySeasonResult {
  season: string;
  weeksPlayed: number;
  weeksSurvived: number;
  eliminated: boolean;
  eliminatedWeek: number | null;
  weeklyResults: ReplayWeekResult[];
}

export interface ReplayEvaluation {
  survivalRate: number; // 0 - 100
  inventoryEfficiencyScore: number; // 0 - 100
  recommendationScore: number; // 0 - 100
  confidenceScore: number; // 0 - 100
}

export interface ReplayExecution {
  id: string;
  configuration: ReplayConfiguration;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  results: ReplaySeasonResult;
  evaluation: ReplayEvaluation;
  generatedAt: string;
}

export interface ReplaySummary {
  season: string;
  weeksPlayed: number;
  weeksSurvived: number;
  eliminated: boolean;
  survivalRate: number;
  inventoryEfficiencyScore: number;
  recommendationScore: number;
  confidenceScore: number;
  generatedAt: string;
}
