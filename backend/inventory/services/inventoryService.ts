import { EntryInventory, ReservedTeam, HolidayReservation, FutureValueProfile } from "../../../src/types";
import { 
  inventoryRepo, 
  reservationRepo, 
  futureValueRepo,
  teamRepo,
  legRepo,
  pickRepo
} from "../../repositories";
import { InventoryCalculator } from "./inventoryCalculator";
import { FutureValueService } from "./futureValueService";

/**
 * High-performance service managing Survivor Inventory Calculations,
 * Holiday Protections, Future Value preservation indexes, and reports.
 */
export class InventoryService {
  /**
   * Compiles and persists an entry's inventory snapshot, tracking audit logging version 
   */
  static async compileInventorySnapshot(entryId: string, legId: string): Promise<EntryInventory> {
    // 1. Evaluate used teams
    const usedSummary = await InventoryCalculator.evaluateUsedTeams(entryId, legId);
    const { previouslySelected, currentSelection } = usedSummary;

    // Combined set of used teams for the entry
    const allUsed = [...previouslySelected];
    if (currentSelection) {
      allUsed.push(currentSelection);
    }

    // 2. Assess availability
    const availabilities = await InventoryCalculator.calculateAvailability(
      entryId, 
      legId, 
      previouslySelected, 
      currentSelection
    );

    const availableTeamIds = availabilities
      .filter(a => a.is_available)
      .map(a => a.team_id);

    // 3. Assess Holiday protections & reservations
    const holidaySummary = await InventoryCalculator.assessHolidayInventory(
      entryId,
      legId,
      previouslySelected,
      currentSelection
    );
    const { reservedTeams, holidayReservations, holidayConflicts } = holidaySummary;

    // 4. Future Value mappings
    let futureValueProfiles = await futureValueRepo.getProfilesByLeg(legId);
    if (futureValueProfiles.length === 0) {
      futureValueProfiles = await FutureValueService.recalculateAllProfilesForLeg(legId);
    }

    const fvMap = new Map<string, FutureValueProfile>(futureValueProfiles.map(p => [p.team_id, p]));

    // 5. Calculate Metrics
    const inventory_depth = availableTeamIds.length;

    // Filter available team future profiles
    const availableProfiles = availableTeamIds
      .map(id => fvMap.get(id))
      .filter((p): p is FutureValueProfile => p !== undefined && p !== null);

    const remaining_elite_teams = availableProfiles.filter(p => p.is_elite).length;
    const remaining_playoff_teams = availableProfiles.filter(p => p.is_playoff_caliber).length;

    // Future Inventory Strength is the average of available teams' FV scores
    const sumFV = availableProfiles.reduce((sum, p) => sum + p.future_value_score, 0);
    const future_inventory_strength = availableProfiles.length > 0 
      ? parseFloat((sumFV / availableProfiles.length).toFixed(1)) 
      : 0.0;

    // Holiday Protection Score: starts at 50 base points, +25 for TG reservation, +25 for Xmas, -25 per conflict
    let holiday_protection_score = 50;
    
    // Check if we have Thanksgiving reservation
    const sortedLegs = [...(await legRepo.getAll())].sort((a, b) => a.display_order - b.display_order);
    const tgLeg = sortedLegs.find(l => l.leg_type === "thanksgiving");
    const xmasLeg = sortedLegs.find(l => l.leg_type === "christmas");

    const hasTg = tgLeg && holidayReservations.some(r => r.contest_leg_id === tgLeg.id);
    const hasXmas = xmasLeg && holidayReservations.some(r => r.contest_leg_id === xmasLeg.id);

    if (hasTg) holiday_protection_score += 25;
    if (hasXmas) holiday_protection_score += 25;
    holiday_protection_score -= (holidayConflicts.length * 25);
    holiday_protection_score = Math.min(100, Math.max(0, holiday_protection_score));

    // 6. Audit Version Management
    const existingSnap = await inventoryRepo.getByEntryIdAndLeg(entryId, legId);
    const nextVersion = existingSnap ? existingSnap.inventory_version + 1 : 1;

    const inventorySnap: EntryInventory = {
      id: existingSnap?.id || `inv-${legId}-${entryId}`,
      entry_id: entryId,
      contest_leg_id: legId,
      inventory_version: nextVersion,
      used_teams: allUsed,
      available_teams: availableTeamIds,
      reserved_teams: reservedTeams,
      holiday_reservations: holidayReservations,
      inventory_depth,
      future_inventory_strength,
      holiday_protection_score,
      remaining_elite_teams,
      remaining_playoff_teams,
      created_at: existingSnap?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return await inventoryRepo.save(inventorySnap);
  }

  /**
   * Compiles entry level inventory reports
   */
  static async getEntryInventoryReport(entryId: string, legId: string) {
    const snap = await this.compileInventorySnapshot(entryId, legId);
    
    // Compile future value summary for UI consumption
    const fvProfiles = await futureValueRepo.getProfilesByLeg(legId);
    const activeProfiles = fvProfiles.filter(p => snap.available_teams.includes(p.team_id));

    const future_value_summary = activeProfiles.map(p => ({
      team_id: p.team_id,
      future_value_score: p.future_value_score,
      is_elite: p.is_elite,
      is_playoff_caliber: p.is_playoff_caliber
    }));

    return {
      used_teams: snap.used_teams,
      available_teams: snap.available_teams,
      reserved_teams: snap.reserved_teams,
      holiday_reservations: snap.holiday_reservations,
      inventory_depth: snap.inventory_depth,
      future_inventory_strength: snap.future_inventory_strength,
      holiday_protection_score: snap.holiday_protection_score,
      remaining_elite_teams: snap.remaining_elite_teams,
      remaining_playoff_teams: snap.remaining_playoff_teams,
      future_value_summary,
      inventory_version: snap.inventory_version,
      updated_at: snap.updated_at
    };
  }

  /**
   * Create or update a holiday team reservation
   */
  static async createReservation(
    entryId: string,
    legId: string,
    teamId: string,
    status: 'suggested' | 'confirmed' = 'confirmed'
  ): Promise<HolidayReservation> {
    const allLegs = await legRepo.getAll();
    const targetLeg = allLegs.find(l => l.id === legId);
    if (!targetLeg) {
      throw new Error(`Target reservation leg is invalid: ${legId}`);
    }

    if (targetLeg.leg_type !== "thanksgiving" && targetLeg.leg_type !== "christmas") {
      throw new Error(`Reservations can only be placed on holiday legs (Thanksgiving or Christmas).`);
    }

    // See if reservation already exists
    const existingReservations = await reservationRepo.getHolidayReservations(entryId);
    const matched = existingReservations.find(r => r.contest_leg_id === legId);

    const reservationToSave: HolidayReservation = {
      id: matched?.id || `hr-${legId}-${entryId}`,
      entry_id: entryId,
      contest_leg_id: legId,
      team_id: teamId,
      status,
      created_at: matched?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const savedReservation = await reservationRepo.saveHolidayReservation(reservationToSave);

    // Also reflect this in the protected reserved_teams table
    const existingReservedTeams = await reservationRepo.getReservedTeams(entryId);
    const existingRt = existingReservedTeams.find(rt => rt.contest_leg_id === legId);

    const reservedTeamToSave: ReservedTeam = {
      id: existingRt?.id || `rt-${legId}-${entryId}`,
      entry_id: entryId,
      contest_leg_id: legId,
      team_id: teamId,
      is_protected: status === 'confirmed',
      created_at: existingRt?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await reservationRepo.saveReservedTeam(reservedTeamToSave);

    // Trigger cascading recalculation of the inventory snapshot
    await this.compileInventorySnapshot(entryId, legId);

    return savedReservation;
  }

  /**
   * Remove a holiday team reservation
   */
  static async deleteReservation(entryId: string, legId: string): Promise<boolean> {
    const existingReservations = await reservationRepo.getHolidayReservations(entryId);
    const matchedRes = existingReservations.find(r => r.contest_leg_id === legId);

    if (matchedRes) {
      await reservationRepo.deleteHolidayReservation(matchedRes.id);
    }

    const existingReservedTeams = await reservationRepo.getReservedTeams(entryId);
    const matchedRt = existingReservedTeams.find(rt => rt.contest_leg_id === legId);

    if (matchedRt) {
      await reservationRepo.deleteReservedTeam(matchedRt.id);
    }

    // Trigger recalculation of current snap
    await this.compileInventorySnapshot(entryId, legId);

    return true;
  }
}
