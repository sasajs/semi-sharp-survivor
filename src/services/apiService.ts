import { 
  Contest, 
  ContestLeg, 
  Team, 
  Game, 
  TeamWeekLine, 
  SurvivorEntry, 
  SurvivorPick 
} from "../types";

export const apiService = {
  async fetchContests(): Promise<Contest[]> {
    const res = await fetch("/api/contests");
    if (!res.ok) throw new Error("Failed to fetch contests");
    return res.json();
  },

  async fetchLegs(): Promise<ContestLeg[]> {
    const res = await fetch("/api/legs");
    if (!res.ok) throw new Error("Failed to fetch legs");
    return res.json();
  },

  async fetchTeams(): Promise<Team[]> {
    const res = await fetch("/api/teams");
    if (!res.ok) throw new Error("Failed to fetch teams");
    return res.json();
  },

  async fetchEntries(): Promise<SurvivorEntry[]> {
    const res = await fetch("/api/entries");
    if (!res.ok) throw new Error("Failed to fetch entries");
    return res.json();
  },

  async fetchPicks(entryId?: string): Promise<SurvivorPick[]> {
    const path = entryId ? `/api/picks?entry_id=${entryId}` : "/api/picks";
    const res = await fetch(path);
    if (!res.ok) throw new Error("Failed to fetch picks");
    return res.json();
  },

  async fetchGames(legId: string): Promise<Game[]> {
    const res = await fetch(`/api/games?leg_id=${legId}`);
    if (!res.ok) throw new Error("Failed to fetch games for leg " + legId);
    return res.json();
  },

  async fetchLines(legId: string): Promise<TeamWeekLine[]> {
    const res = await fetch(`/api/lines?leg_id=${legId}`);
    if (!res.ok) throw new Error("Failed to fetch lines for leg " + legId);
    return res.json();
  },

  async fetchRecommendations(entryId: string, legId: string): Promise<any> {
    const res = await fetch(`/api/recommendations?entry_id=${entryId}&leg_id=${legId}`);
    if (!res.ok) throw new Error("Failed to fetch recommendations");
    return res.json();
  },

  async createEntry(name: string, notes?: string): Promise<SurvivorEntry> {
    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, notes })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to create entry");
    }
    return res.json();
  },

  async deleteEntry(id: string): Promise<void> {
    const res = await fetch(`/api/entries/${id}`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error("Failed to delete entry");
  },

  async makePick(entryId: string, contestLegId: string, teamId: string): Promise<any> {
    const res = await fetch("/api/picks/make", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entry_id: entryId,
        contest_leg_id: contestLegId,
        team_id: teamId
      })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to make pick");
    }
    return data;
  },

  async resetDatabase(): Promise<void> {
    const res = await fetch("/api/admin/reset", {
      method: "POST"
    });
    if (!res.ok) throw new Error("Failed to reset database");
  },

  async fetchOwnershipProjections(season: string, week: number): Promise<any[]> {
    const res = await fetch(`/api/ownership/rankings?season=${season}&week=${week}`);
    if (!res.ok) throw new Error("Failed to fetch ownership projections");
    return res.json();
  },

  async fetchContestDynamics(season: string, week: number): Promise<any[]> {
    const res = await fetch(`/api/contest-dynamics/rankings?season=${season}&week=${week}`);
    if (!res.ok) throw new Error("Failed to fetch contest dynamics");
    return res.json();
  },

  async fetchLatestAudits(): Promise<any[]> {
    const res = await fetch("/api/recommendation-audits/latest");
    if (!res.ok) throw new Error("Failed to fetch latest audits");
    return res.json();
  },

  async fetchAuditsHistory(): Promise<any[]> {
    const res = await fetch("/api/recommendation-audits/history");
    if (!res.ok) throw new Error("Failed to fetch audits history");
    return res.json();
  },

  async fetchAuditsByEntry(entryId: string): Promise<any[]> {
    const res = await fetch(`/api/recommendation-audits/by-entry/${entryId}`);
    if (!res.ok) throw new Error("Failed to fetch audits for entry " + entryId);
    return res.json();
  },

  async fetchAuditsByTeam(teamId: string): Promise<any[]> {
    const res = await fetch(`/api/recommendation-audits/by-team/${teamId}`);
    if (!res.ok) throw new Error("Failed to fetch audits for team " + teamId);
    return res.json();
  },

  async generateAudits(season: string, week: number, calculationVersion: string): Promise<any> {
    const res = await fetch("/api/recommendation-audits/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ season, week, calculationVersion })
    });
    if (!res.ok) throw new Error("Failed to generate recommendation audits");
    return res.json();
  },

  async fetchLatestConfidence(): Promise<any[]> {
    const res = await fetch("/api/recommendation-confidence/latest");
    if (!res.ok) throw new Error("Failed to fetch latest confidence snapshots");
    return res.json();
  },

  async fetchConfidenceHistory(): Promise<any[]> {
    const res = await fetch("/api/recommendation-confidence/history");
    if (!res.ok) throw new Error("Failed to fetch confidence history");
    return res.json();
  },

  async fetchConfidenceByEntry(entryId: string): Promise<any[]> {
    const res = await fetch(`/api/recommendation-confidence/by-entry/${entryId}`);
    if (!res.ok) throw new Error("Failed to fetch confidence snapshots for entry " + entryId);
    return res.json();
  },

  async fetchTopConfidence(limit: number = 10): Promise<any[]> {
    const res = await fetch(`/api/recommendation-confidence/top?limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch top confidence snapshots");
    return res.json();
  },

  async calculateConfidence(season: string, week: number, calculationVersion: string): Promise<any> {
    const res = await fetch("/api/recommendation-confidence/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ season, week, calculationVersion })
    });
    if (!res.ok) throw new Error("Failed to calculate recommendation confidence snapshots");
    return res.json();
  },

  async fetchLatestConsensus(): Promise<any[]> {
    const res = await fetch("/api/recommendation-consensus/latest");
    if (!res.ok) throw new Error("Failed to fetch latest consensus snapshots");
    return res.json();
  },

  async fetchConsensusHistory(): Promise<any[]> {
    const res = await fetch("/api/recommendation-consensus/history");
    if (!res.ok) throw new Error("Failed to fetch consensus history");
    return res.json();
  },

  async fetchConsensusByEntry(entryId: string): Promise<any[]> {
    const res = await fetch(`/api/recommendation-consensus/by-entry/${entryId}`);
    if (!res.ok) throw new Error("Failed to fetch consensus snapshots for entry " + entryId);
    return res.json();
  },

  async fetchTopConsensus(limit: number = 10): Promise<any[]> {
    const res = await fetch(`/api/recommendation-consensus/top?limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch top consensus snapshots");
    return res.json();
  },

  async calculateConsensus(season: string, week: number, calculationVersion: string): Promise<any> {
    const res = await fetch("/api/recommendation-consensus/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ season, week, calculationVersion })
    });
    if (!res.ok) throw new Error("Failed to calculate recommendation consensus snapshots");
    return res.json();
  },

  async fetchLatestPortfolio(): Promise<any[]> {
    const res = await fetch("/api/portfolio-optimizer/latest");
    if (!res.ok) throw new Error("Failed to fetch latest portfolio optimizer recommendations");
    return res.json();
  },

  async fetchPortfolioHistory(): Promise<any[]> {
    const res = await fetch("/api/portfolio-optimizer/history");
    if (!res.ok) throw new Error("Failed to fetch portfolio optimizer history");
    return res.json();
  },

  async fetchPortfolioById(portfolioId: string): Promise<any[]> {
    const res = await fetch(`/api/portfolio-optimizer/by-id/${portfolioId}`);
    if (!res.ok) throw new Error("Failed to fetch portfolio: " + portfolioId);
    return res.json();
  },

  async calculatePortfolio(season: string, week: number, calculationVersion: string): Promise<any> {
    const res = await fetch("/api/portfolio-optimizer/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ season, week, calculationVersion })
    });
    if (!res.ok) throw new Error("Failed to calculate recommendation portfolio optimization");
    return res.json();
  },

  async fetchLatestContestEV(): Promise<any[]> {
    const res = await fetch("/api/contest-ev/latest");
    if (!res.ok) throw new Error("Failed to fetch latest contest EV snapshots");
    return res.json();
  },

  async fetchContestEVHistory(): Promise<any[]> {
    const res = await fetch("/api/contest-ev/history");
    if (!res.ok) throw new Error("Failed to fetch contest EV history");
    return res.json();
  },

  async fetchContestEVById(contestId: string): Promise<any[]> {
    const res = await fetch(`/api/contest-ev/${contestId}`);
    if (!res.ok) throw new Error("Failed to fetch contest EV for: " + contestId);
    return res.json();
  },

  async generateContestEV(season: string, week: number, calculationVersion: string): Promise<any> {
    const res = await fetch("/api/contest-ev/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ season, week, calculationVersion })
    });
    if (!res.ok) throw new Error("Failed to generate contest EV calculations");
    return res.json();
  },

  async fetchLatestOwnershipCalibration(): Promise<any[]> {
    const res = await fetch("/api/ownership-calibration/latest");
    if (!res.ok) throw new Error("Failed to fetch latest ownership calibration snapshots");
    return res.json();
  },

  async fetchOwnershipCalibrationHistory(): Promise<any[]> {
    const res = await fetch("/api/ownership-calibration/history");
    if (!res.ok) throw new Error("Failed to fetch ownership calibration history");
    return res.json();
  },

  async fetchOwnershipCalibrationByContestId(contestId: string): Promise<any[]> {
    const res = await fetch(`/api/ownership-calibration/${contestId}`);
    if (!res.ok) throw new Error("Failed to fetch ownership calibration for: " + contestId);
    return res.json();
  },

  async generateOwnershipCalibration(season: string, week: number, calculationVersion: string): Promise<any> {
    const res = await fetch("/api/ownership-calibration/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ season, week, calculationVersion })
    });
    if (!res.ok) throw new Error("Failed to generate ownership calibration calculations");
    return res.json();
  },

  async fetchLatestMarketCalibration(): Promise<any[]> {
    const res = await fetch("/api/market-calibration/latest");
    if (!res.ok) throw new Error("Failed to fetch latest market calibration snapshots");
    return res.json();
  },

  async fetchMarketCalibrationHistory(): Promise<any[]> {
    const res = await fetch("/api/market-calibration/history");
    if (!res.ok) throw new Error("Failed to fetch market calibration history");
    return res.json();
  },

  async fetchMarketCalibrationByGameId(gameId: string): Promise<any[]> {
    const res = await fetch(`/api/market-calibration/${gameId}`);
    if (!res.ok) throw new Error("Failed to fetch market calibration for game: " + gameId);
    return res.json();
  },

  async generateMarketCalibration(season: string, week: number, calculationVersion: string): Promise<any> {
    const res = await fetch("/api/market-calibration/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ season, week, calculationVersion })
    });
    if (!res.ok) throw new Error("Failed to generate market calibration calculations");
    return res.json();
  },

  async fetchLatestModelPerformance(): Promise<any[]> {
    const res = await fetch("/api/model-performance/latest");
    if (!res.ok) throw new Error("Failed to fetch latest model performance snapshots");
    return res.json();
  },

  async fetchModelPerformanceHistory(): Promise<any[]> {
    const res = await fetch("/api/model-performance/history");
    if (!res.ok) throw new Error("Failed to fetch model performance history");
    return res.json();
  },

  async fetchModelPerformanceByName(modelName: string): Promise<any[]> {
    const res = await fetch(`/api/model-performance/${encodeURIComponent(modelName)}`);
    if (!res.ok) throw new Error("Failed to fetch model performance for: " + modelName);
    return res.json();
  },

  async calculateModelPerformance(season: string, week: number, calculationVersion: string): Promise<any> {
    const res = await fetch("/api/model-performance/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ season, week, calculationVersion })
    });
    if (!res.ok) throw new Error("Failed to trigger model performance calculations");
    return res.json();
  },

  async fetchLatestRollingValidation(): Promise<any[]> {
    const res = await fetch("/api/rolling-validation/latest");
    if (!res.ok) throw new Error("Failed to fetch latest rolling validation snapshot");
    return res.json();
  },

  async fetchRollingValidationHistory(): Promise<any[]> {
    const res = await fetch("/api/rolling-validation/history");
    if (!res.ok) throw new Error("Failed to fetch rolling validation history");
    return res.json();
  },

  async fetchRollingValidationByModel(modelName: string): Promise<any[]> {
    const res = await fetch(`/api/rolling-validation/${encodeURIComponent(modelName)}`);
    if (!res.ok) throw new Error("Failed to fetch rolling validation for: " + modelName);
    return res.json();
  },

  async runRollingValidation(season: string, startWeek: number, endWeek: number, calculationVersion: string): Promise<any> {
    const res = await fetch("/api/rolling-validation/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ season, startWeek, endWeek, calculationVersion })
    });
    if (!res.ok) throw new Error("Failed to run rolling validation & backtesting engine");
    return res.json();
  },

  async fetchLatestModelDrift(): Promise<any[]> {
    const res = await fetch("/api/model-drift/latest");
    if (!res.ok) throw new Error("Failed to fetch latest model drift snapshot");
    return res.json();
  },

  async fetchModelDriftHistory(): Promise<any[]> {
    const res = await fetch("/api/model-drift/history");
    if (!res.ok) throw new Error("Failed to fetch model drift history");
    return res.json();
  },

  async fetchModelDriftByModel(modelName: string): Promise<any[]> {
    const res = await fetch(`/api/model-drift/${encodeURIComponent(modelName)}`);
    if (!res.ok) throw new Error("Failed to fetch model drift for: " + modelName);
    return res.json();
  },

  async runModelDriftCalculate(season: string, week: number, calculationVersion: string): Promise<any> {
    const res = await fetch("/api/model-drift/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ season, week, calculationVersion })
    });
    if (!res.ok) throw new Error("Failed to run model drift calculation engine");
    return res.json();
  },

  async fetchLatestModelWeights(): Promise<any[]> {
    const res = await fetch("/api/model-weights/latest");
    if (!res.ok) throw new Error("Failed to fetch latest adaptive model weights");
    return res.json();
  },

  async fetchModelWeightsHistory(): Promise<any[]> {
    const res = await fetch("/api/model-weights/history");
    if (!res.ok) throw new Error("Failed to fetch adaptive model weights history");
    return res.json();
  },

  async fetchModelWeightsByModel(modelName: string): Promise<any[]> {
    const res = await fetch(`/api/model-weights/${encodeURIComponent(modelName)}`);
    if (!res.ok) throw new Error("Failed to fetch adaptive model weights for: " + modelName);
    return res.json();
  },

  async runModelWeightsRecalculate(season: string, week: number, calculationVersion: string): Promise<any> {
    const res = await fetch("/api/model-weights/recalculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ season, week, calculationVersion })
    });
    if (!res.ok) throw new Error("Failed to run adaptive model weights recalculation");
    return res.json();
  },

  async fetchLatestDecisionPolicies(): Promise<any[]> {
    const res = await fetch("/api/decision-policies/latest");
    if (!res.ok) throw new Error("Failed to fetch latest decision policies");
    return res.json();
  },

  async fetchDecisionPoliciesHistory(): Promise<any[]> {
    const res = await fetch("/api/decision-policies/history");
    if (!res.ok) throw new Error("Failed to fetch decision policies history");
    return res.json();
  },

  async runDecisionPoliciesCalculate(season: string, week: number, calculationVersion: string): Promise<any> {
    const res = await fetch("/api/decision-policies/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ season, week, calculationVersion })
    });
    if (!res.ok) throw new Error("Failed to calculate decision policies");
    return res.json();
  },

  async fetchLatestSurvivorDecisions(): Promise<any[]> {
    const res = await fetch("/api/survivor-decisions/latest");
    if (!res.ok) throw new Error("Failed to fetch latest survivor decisions");
    return res.json();
  },

  async fetchSurvivorDecisionsHistory(): Promise<any[]> {
    const res = await fetch("/api/survivor-decisions/history");
    if (!res.ok) throw new Error("Failed to fetch survivor decisions history");
    return res.json();
  },

  async runSurvivorDecisionsCalculate(season: string, week: number, agentVersion: string): Promise<any> {
    const res = await fetch("/api/survivor-decisions/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ season, week, agentVersion })
    });
    if (!res.ok) throw new Error("Failed to calculate survivor decisions");
    return res.json();
  },

  async fetchLatestSurvivorPlans(): Promise<any[]> {
    const res = await fetch("/api/survivor-plans/latest");
    if (!res.ok) throw new Error("Failed to fetch latest survivor plans");
    return res.json();
  },

  async fetchSurvivorPlansHistory(): Promise<any[]> {
    const res = await fetch("/api/survivor-plans/history");
    if (!res.ok) throw new Error("Failed to fetch survivor plans history");
    return res.json();
  },

  async runSurvivorPlansCalculate(season: string, week: number, agentVersion: string): Promise<any> {
    const res = await fetch("/api/survivor-plans/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ season, week, agentVersion })
    });
    if (!res.ok) throw new Error("Failed to calculate survivor plans");
    return res.json();
  },

  async fetchLatestChampionshipPlans(): Promise<any[]> {
    const res = await fetch("/api/championship-plans/latest");
    if (!res.ok) throw new Error("Failed to fetch latest championship plans");
    return res.json();
  },

  async fetchChampionshipPlansHistory(): Promise<any[]> {
    const res = await fetch("/api/championship-plans/history");
    if (!res.ok) throw new Error("Failed to fetch championship plans history");
    return res.json();
  },

  async runChampionshipPlansCalculate(season: string, week: number, agentVersion: string): Promise<any> {
    const res = await fetch("/api/championship-plans/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ season, week, agentVersion })
    });
    if (!res.ok) throw new Error("Failed to calculate championship plans");
    return res.json();
  }
};
