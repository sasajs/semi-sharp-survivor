import { TeamAvailability, ReservedTeam, HolidayReservation } from "../../../src/types";
import { 
  teamRepo, 
  legRepo, 
  gameRepo, 
  pickRepo, 
  entryRepo,
  reservationRepo,
  futureValueRepo
} from "../../repositories";

export class InventoryCalculator {
  /**
   * Evaluates previously used teams, current selection, and elimination status
   */
  static async evaluateUsedTeams(entryId: string, currentLegId: string) {
    const entry = await entryRepo.getById(entryId);
    if (!entry) {
      throw new Error(`Entry not found: ${entryId}`);
    }

    const allLegs = await legRepo.getAll();
    const currentLeg = allLegs.find(l => l.id === currentLegId);
    if (!currentLeg) {
      throw new Error(`Invalid leg ID: ${currentLegId}`);
    }

    const picks = await pickRepo.getByEntryId(entryId);

    // Get legs list sorted by order
    const sortedLegs = [...allLegs].sort((a, b) => a.display_order - b.display_order);
    const prevLegIds = new Set(
      sortedLegs
        .filter(l => l.display_order < currentLeg.display_order)
        .map(l => l.id)
    );

    const previouslySelected = picks
      .filter(p => prevLegIds.has(p.contest_leg_id))
      .map(p => p.team_id);

    const currentSelectionPick = picks.find(p => p.contest_leg_id === currentLegId);
    const currentSelection = currentSelectionPick ? currentSelectionPick.team_id : undefined;

    const isEliminated = entry.status === "eliminated";

    return {
      previouslySelected,
      currentSelection,
      isEliminated
    };
  }

  /**
   * Calculates availability, used status, and reservation blockers per team
   */
  static async calculateAvailability(
    entryId: string,
    currentLegId: string,
    previouslySelected: string[],
    currentSelection?: string
  ): Promise<TeamAvailability[]> {
    const teams = await teamRepo.getAll();
    const reservations = await reservationRepo.getReservedTeams(entryId);

    const prevSet = new Set(previouslySelected);
    const reservedSet = new Set(reservations.map(r => r.team_id));

    return teams.map(team => {
      const isUsed = prevSet.has(team.id) || team.id === currentSelection;
      const isReserved = reservedSet.has(team.id);
      
      let reason: string | undefined = undefined;
      if (prevSet.has(team.id)) {
        reason = "Selected in previous week";
      } else if (team.id === currentSelection) {
        reason = "Currently picked for active week";
      } else if (isReserved) {
        reason = "Reserved for holiday leg protection";
      }

      return {
        team_id: team.id,
        is_available: !isUsed && !isReserved,
        is_used: isUsed,
        is_reserved: isReserved,
        reason
      };
    });
  }

  /**
   * Tracks holiday reservations, protected teams, and checks for holiday conflicts
   */
  static async assessHolidayInventory(
    entryId: string,
    currentLegId: string,
    previouslySelected: string[],
    currentSelection?: string
  ) {
    const allLegs = await legRepo.getAll();
    const sortedLegs = [...allLegs].sort((a, b) => a.display_order - b.display_order);
    
    // Find holiday legs (Thanksgiving order 13, Christmas order 18)
    const tgLeg = sortedLegs.find(l => l.leg_type === "thanksgiving");
    const xmasLeg = sortedLegs.find(l => l.leg_type === "christmas");

    const reservedTeams = await reservationRepo.getReservedTeams(entryId);
    const holidayReservations = await reservationRepo.getHolidayReservations(entryId);

    const protectedTeams: string[] = [];
    const holidayConflicts: string[] = [];

    // Helper map of which teams actually play in TG/XMAS
    const tgGames = tgLeg ? await gameRepo.getByLegId(tgLeg.id) : [];
    const xmasGames = xmasLeg ? await gameRepo.getByLegId(xmasLeg.id) : [];

    const tgPlayingTeams = new Set(tgGames.flatMap(g => [g.home_team_id, g.away_team_id]));
    const xmasPlayingTeams = new Set(xmasGames.flatMap(g => [g.home_team_id, g.away_team_id]));

    // Evaluate Thanksgiving reservations
    const tgReservations = holidayReservations.filter(hr => tgLeg && hr.contest_leg_id === tgLeg.id);
    for (const r of tgReservations) {
      protectedTeams.push(r.team_id);
      
      // Conflict: Reserved team was already used in a previous non-holiday week
      if (previouslySelected.includes(r.team_id)) {
        holidayConflicts.push(`Thanksgiving reserved team ${r.team_id} was already used in previous weeks.`);
      }
      
      // Conflict: team is not playing on Thanksgiving
      if (!tgPlayingTeams.has(r.team_id)) {
        holidayConflicts.push(`Holiday conflict: Thanksgiving reserved team ${r.team_id} is not scheduled to play in the Thanksgiving leg.`);
      }

      // Conflict: team is picked for active week but was reserved for TG
      if (currentSelection && currentSelection === r.team_id && currentLegId !== tgLeg?.id) {
        holidayConflicts.push(`Active pick ${r.team_id} conflicts with its Thanksgiving reservation.`);
      }
    }

    // Evaluate Christmas reservations
    const xmasReservations = holidayReservations.filter(hr => xmasLeg && hr.contest_leg_id === xmasLeg.id);
    for (const r of xmasReservations) {
      protectedTeams.push(r.team_id);

      // Conflict: Reserved team was already used previously
      if (previouslySelected.includes(r.team_id)) {
        holidayConflicts.push(`Christmas reserved team ${r.team_id} was already used in previous weeks.`);
      }

      // Conflict: team is not playing on Christmas
      if (!xmasPlayingTeams.has(r.team_id)) {
        holidayConflicts.push(`Holiday conflict: Christmas reserved team ${r.team_id} is not scheduled to play in the Christmas leg.`);
      }

      // Conflict: team is picked for active week but was reserved for Christmas
      if (currentSelection && currentSelection === r.team_id && currentLegId !== xmasLeg?.id) {
        holidayConflicts.push(`Active pick ${r.team_id} conflicts with its Christmas reservation.`);
      }
    }

    return {
      reservedTeams,
      holidayReservations,
      protectedTeams,
      holidayConflicts
    };
  }
}
