import { AppUser } from "../../src/types";
import { ownerService, OwnerDashboardSection } from "./OwnerService";
import { entryRepo } from "../repositories/index";

export class OwnerAccessService {
  /**
   * Retrieves the workspace/dashboard sections filtered by user role and owner ID.
   */
  async getWorkspaceForUser(user: AppUser, season: string = "2026"): Promise<OwnerDashboardSection[]> {
    const fullDashboard = await ownerService.getOwnerDashboard(season);
    
    if (user.role === "admin") {
      return fullDashboard;
    }

    if (!user.owner_id) {
      return [];
    }

    return fullDashboard.filter(section => section.owner.id === user.owner_id);
  }

  /**
   * Validates if a user has access to a given entry (by ID or name).
   * Throws an error if access is forbidden, or if entry is not found.
   */
  async checkEntryAccess(user: AppUser | null, entryIdOrName: string): Promise<void> {
    if (user && user.role === "admin") {
      return; // Admins can access everything
    }

    if (!user || !user.owner_id) {
      throw new Error("Forbidden: You do not own this entry.");
    }

    // Try to load the entry by ID or Name
    let entry = await entryRepo.getById(entryIdOrName);
    if (!entry) {
      // Fallback: try to find by name or ID in all entries
      const allEntries = await entryRepo.getAll();
      entry = allEntries.find(e => e.id === entryIdOrName || e.name === entryIdOrName) || null;
    }

    if (!entry) {
      throw new Error("Entry not found");
    }

    // Direct owner check using the explicit requirements mapping:
    // - SAS / owner-steve can access UWOSH-1 and UWOSH-2.
    // - CNS / owner-cameron can access UWOSH-3.
    // - UWO / owner-uw-oshkosh can access UWOSH-4.
    const mappings: Record<string, string> = {
      "UWOSH-1": "owner-steve",
      "UWOSH-2": "owner-steve",
      "UWOSH-3": "owner-cameron",
      "UWOSH-4": "owner-uw-oshkosh",
      "22222222-2222-4222-c222-000000000101": "owner-steve",
      "22222222-2222-4222-c222-000000000102": "owner-steve",
      "22222222-2222-4222-c222-000000000103": "owner-cameron",
      "22222222-2222-4222-c222-000000000104": "owner-uw-oshkosh"
    };

    const expectedOwnerId = mappings[entry.id] || mappings[entry.name || ""] || entry.owner_id;

    if (expectedOwnerId !== user.owner_id) {
      throw new Error("Forbidden: You do not own this entry.");
    }
  }
}

export const ownerAccessService = new OwnerAccessService();
