import { Team, SurvivorEntry, SurvivorPick, ContestLeg } from "../../src/types";
import { 
  teamRepo, 
  contestRepo, 
  legRepo, 
  gameRepo, 
  lineRepo, 
  entryRepo, 
  pickRepo, 
  historyRepo 
} from "../repositories/index";
import { calculateRecommendations } from "./recommendationEngine";

/**
 * 1. Create Survivor Entry
 */
export async function createEntry(name: string, notes?: string): Promise<SurvivorEntry> {
  if (!name.trim()) {
    throw new Error("Entry name is required and cannot be empty.");
  }
  return await entryRepo.create({ name, notes });
}

/**
 * 2. Submit / Edit Locked Survivor Selection (createPick)
 */
export async function createPick(
  entryId: string, 
  contestLegId: string, 
  teamId: string
): Promise<{ success: boolean; pick: SurvivorPick; entry_status: "alive" | "eliminated" }> {
  
  const entry = await entryRepo.getById(entryId);
  if (!entry) {
    throw new Error(`Survivor Entry with ID ${entryId} not found.`);
  }

  if (entry.status === "eliminated") {
    throw new Error("This entry is eliminated and cannot place matches.");
  }

  // Business Constraint: Team can only be selected once per entry (excluding current week to allow pick switching)
  const existingTeamPick = await pickRepo.getByEntryAndTeam(entryId, teamId);
  if (existingTeamPick && existingTeamPick.contest_leg_id !== contestLegId) {
    const activeLeg = await legRepo.getById(existingTeamPick.contest_leg_id);
    throw new Error(
      `Rule Violation: Team ${teamId.toUpperCase()} has already been used by this entry in ${activeLeg?.name || existingTeamPick.contest_leg_id}.`
    );
  }

  // Check if team is actually playing in this contest leg
  const legGames = await gameRepo.getByLegId(contestLegId);
  const teamGame = legGames.find(g => g.home_team_id === teamId || g.away_team_id === teamId);
  if (!teamGame) {
    throw new Error(`Selected team ${teamId.toUpperCase()} is not playing in of the gamesscheduled for this leg.`);
  }

  // Determine status of pick
  let pick_status: "pending" | "won" | "lost" = "pending";
  if (teamGame.status === "final") {
    const isHome = teamGame.home_team_id === teamId;
    const homeScore = teamGame.home_score || 0;
    const awayScore = teamGame.away_score || 0;

    if (homeScore === awayScore) {
      // Tie counts as loss in Circa Survivor Rules
      pick_status = "lost";
    } else if (isHome && homeScore > awayScore) {
      pick_status = "won";
    } else if (!isHome && awayScore > homeScore) {
      pick_status = "won";
    } else {
      pick_status = "lost";
    }
  }

  // Create or Update pick
  const savedPick = await pickRepo.createOrUpdate({
    entry_id: entryId,
    contest_leg_id: contestLegId,
    team_id: teamId,
    pick_status
  });

  // If pick status is lost, mark the entry as eliminated
  if (pick_status === "lost") {
    await entryRepo.update(entryId, { status: "eliminated" });
    entry.status = "eliminated";
  }

  return {
    success: true,
    pick: savedPick,
    entry_status: entry.status
  };
}

/**
 * 3. Retrieve eligible teams playing in week games that are not yet selected
 */
export async function getEligibleTeams(entryId: string, contestLegId: string): Promise<Team[]> {
  const allTeams = await teamRepo.getAll();
  const legGames = await gameRepo.getByLegId(contestLegId);
  const legTeams = legGames.map(g => [g.home_team_id, g.away_team_id]).flat();

  // Selected teams by entry in other legs
  const entryPicks = await pickRepo.getByEntryId(entryId);
  const usedTeams = entryPicks
    .filter(p => p.contest_leg_id !== contestLegId)
    .map(p => p.team_id);

  return allTeams.filter(t => legTeams.includes(t.id) && !usedTeams.includes(t.id));
}

/**
 * 4. Retrieve picked teams for specified entry
 */
export async function getUsedTeams(entryId: string): Promise<string[]> {
  const entryPicks = await pickRepo.getByEntryId(entryId);
  return entryPicks.map(p => p.team_id);
}

/**
 * 5. Get Inventory Summary: total counts and remaining luxury/elite teams
 */
export async function getInventorySummary(
  entryId: string
): Promise<{ totalUsed: number; remainingEliteTeams: string[] }> {
  // Define Elite NFL teams that have high future value
  const eliteTeams = ["kc", "sf", "bal", "phi", "buf", "det"];
  const used = await getUsedTeams(entryId);
  const remainingElite = eliteTeams.filter(tId => !used.includes(tId));

  return {
    totalUsed: used.length,
    remainingEliteTeams: remainingElite
  };
}

/**
 * 6. Get Recommendation Analytics Candidates list
 */
export async function getRecommendationCandidates(
  entryId: string, 
  contestLegId: string
): Promise<any[]> {
  const entry = await entryRepo.getById(entryId);
  if (!entry) {
    throw new Error(`Survivor Entry with ID ${entryId} not found.`);
  }

  const currentLeg = await legRepo.getById(contestLegId);
  if (!currentLeg) {
    throw new Error(`Contest Leg with ID ${contestLegId} not found.`);
  }

  const allTeams = await teamRepo.getAll();
  const legLines = await lineRepo.getByLegId(contestLegId);
  const allPicks = await pickRepo.getAll();

  const report = calculateRecommendations(
    entry,
    currentLeg,
    allTeams,
    legLines,
    allPicks
  );

  return report.recommendations;
}
