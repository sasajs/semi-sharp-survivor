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
  }
};
