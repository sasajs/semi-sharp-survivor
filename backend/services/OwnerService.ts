import { ownerRepo, entryRepo } from "../repositories/index";
import { Owner, SurvivorEntry, SurvivorStrategyType, SurvivorEntryRoadmapWeek } from "../../src/types";
import { survivorStrategyService } from "./SurvivorStrategyService";
import { survivorRoadmapService } from "./SurvivorRoadmapService";
import { holidayReservationService } from "./HolidayReservationService";

export interface OwnerDashboardEntry {
  entry: SurvivorEntry;
  strategy: {
    strategy_type: SurvivorStrategyType;
    strategy_name: string;
    strategy_description: string;
    risk_tolerance: string;
    weights: {
      diversification: number;
      future_value: number;
      survival: number;
      ownership_leverage: number;
      marketplace: number;
      consensus: number;
    }
  };
  holidayReservations: {
    thanksgiving: {
      team_id: string;
      alternate_team_id: string;
      confidence: number;
      reason: string;
    } | null;
    christmas: {
      team_id: string;
      alternate_team_id: string;
      confidence: number;
      reason: string;
    } | null;
  };
  roadmap: {
    total_projected_survival: number;
    total_projected_equity: number;
    portfolio_correlation_score: number;
    roadmap_confidence: number;
    generated_reason: string;
    roadmap_version: string;
    weeks: SurvivorEntryRoadmapWeek[];
  } | null;
  currentRecommendation: {
    week: number;
    teamId: string;
    alternateTeamId: string;
    confidence: number;
    winProb: number;
    fvCost: number;
    note: string;
  } | null;
}

export interface OwnerDashboardSection {
  owner: Owner;
  entries: OwnerDashboardEntry[];
}

export class OwnerService {
  /**
   * Retrieve all owners
   */
  async getAllOwners(): Promise<Owner[]> {
    return await ownerRepo.getAll();
  }

  /**
   * Retrieve owner by ID
   */
  async getOwnerById(id: string): Promise<Owner | null> {
    return await ownerRepo.getById(id);
  }

  /**
   * Retrieve entries associated with owner ID
   */
  async getEntriesByOwnerId(ownerId: string): Promise<SurvivorEntry[]> {
    return await entryRepo.getByOwnerId(ownerId);
  }

  /**
   * Fetch structured data for the Owner workspace and multi-owner dashboard
   */
  async getOwnerDashboard(season: string = "2026"): Promise<OwnerDashboardSection[]> {
    const owners = await ownerRepo.getAll();
    const dashboard: OwnerDashboardSection[] = [];

    for (const owner of owners) {
      const entries = await entryRepo.getByOwnerId(owner.id);
      const entryDashboards: OwnerDashboardEntry[] = [];

      for (const entry of entries) {
        // 1. Retrieve active strategy
        const strategy = await survivorStrategyService.getActiveStrategy(entry.id);

        // 2. Retrieve or generate holiday reservations
        let reservations = await holidayReservationService.getReservations(entry.id, season);
        if (!reservations || reservations.length === 0) {
          reservations = await holidayReservationService.generateReservations(entry.id, season, strategy.strategy_type);
        }

        const tg = reservations.find(r => r.holiday_type === "thanksgiving");
        const xmas = reservations.find(r => r.holiday_type === "christmas");

        // 3. Retrieve or generate the optimized season roadmap
        let roadmapData = await survivorRoadmapService.getLatestRoadmap(entry.id, season);
        if (!roadmapData) {
          roadmapData = await survivorRoadmapService.generateRoadmap(entry.id, season);
        }

        // 4. Extract current week recommendation derived from the roadmap
        let currentRec: OwnerDashboardEntry["currentRecommendation"] = null;
        if (roadmapData && roadmapData.weeks) {
          const currentWeek = roadmapData.weeks.find(w => w.is_current_week);
          if (currentWeek) {
            currentRec = {
              week: currentWeek.week,
              teamId: currentWeek.recommended_team_id,
              alternateTeamId: currentWeek.alternate_team_id || "",
              confidence: currentWeek.win_probability || 0.70,
              winProb: currentWeek.win_probability || 0.70,
              fvCost: currentWeek.future_value_cost || 0.50,
              note: currentWeek.roadmap_note || ""
            };
          }
        }

        entryDashboards.push({
          entry,
          strategy: {
            strategy_type: strategy.strategy_type,
            strategy_name: strategy.strategy_name,
            strategy_description: strategy.strategy_description,
            risk_tolerance: strategy.risk_tolerance,
            weights: {
              diversification: strategy.diversification_weight || 0,
              future_value: strategy.future_value_weight || 0,
              survival: strategy.survival_weight || 0,
              ownership_leverage: strategy.ownership_leverage_weight || 0,
              marketplace: strategy.marketplace_weight || 0,
              consensus: strategy.consensus_weight || 0
            }
          },
          holidayReservations: {
            thanksgiving: tg ? {
              team_id: tg.reserved_team_id,
              alternate_team_id: tg.alternate_team_id || "",
              confidence: tg.confidence_score || 0.85,
              reason: tg.reservation_reason || ""
            } : null,
            christmas: xmas ? {
              team_id: xmas.reserved_team_id,
              alternate_team_id: xmas.alternate_team_id || "",
              confidence: xmas.confidence_score || 0.89,
              reason: xmas.reservation_reason || ""
            } : null
          },
          roadmap: roadmapData ? {
            total_projected_survival: roadmapData.roadmap.total_projected_survival,
            total_projected_equity: roadmapData.roadmap.total_projected_equity,
            portfolio_correlation_score: roadmapData.roadmap.portfolio_correlation_score,
            roadmap_confidence: roadmapData.roadmap.roadmap_confidence,
            generated_reason: roadmapData.roadmap.generated_reason || "",
            roadmap_version: roadmapData.roadmap.roadmap_version,
            weeks: roadmapData.weeks
          } : null,
          currentRecommendation: currentRec
        });
      }

      dashboard.push({
        owner,
        entries: entryDashboards
      });
    }

    return dashboard;
  }
}

export const ownerService = new OwnerService();
