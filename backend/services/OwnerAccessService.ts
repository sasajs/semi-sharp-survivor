import { AppUser } from "../../src/types";
import { ownerService, OwnerDashboardSection } from "./OwnerService";

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
}

export const ownerAccessService = new OwnerAccessService();
