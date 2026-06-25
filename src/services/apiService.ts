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
  }
};
