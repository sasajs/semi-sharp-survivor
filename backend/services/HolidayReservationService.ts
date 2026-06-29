import { HolidayType, SurvivorHolidayReservation, SurvivorStrategyType } from "../../src/types";
import { survivorStrategyRoadmapRepo } from "../repositories/index";

export class HolidayReservationService {
  /**
   * Recommend Thanksgiving reserved team based on strategy
   */
  recommendThanksgiving(strategyType: SurvivorStrategyType): { teamId: string; alternateTeamId: string; confidence: number; reason: string } {
    switch (strategyType) {
      case SurvivorStrategyType.CONSERVATIVE:
        return {
          teamId: "det",
          alternateTeamId: "dal",
          confidence: 0.88,
          reason: "Detroit Lions are playing at home on Thanksgiving with high historical win probability. Recommended for maximum survival safety."
        };
      case SurvivorStrategyType.CONTRARIAN:
        return {
          teamId: "dal",
          alternateTeamId: "det",
          confidence: 0.72,
          reason: "Dallas Cowboys are a heavy Thanksgiving favorite but usually over-owned. Assigned Dallas for ownership leverage."
        };
      case SurvivorStrategyType.MARKETPLACE:
        return {
          teamId: "buf",
          alternateTeamId: "det",
          confidence: 0.79,
          reason: "Buffalo Bills recommended to preserve Lions/Cowboys for early-season resale power."
        };
      case SurvivorStrategyType.CHAMPIONSHIP:
      default:
        return {
          teamId: "det",
          alternateTeamId: "dal",
          confidence: 0.85,
          reason: "Detroit Lions offer the absolute highest projected contest equity index for the holiday slate."
        };
    }
  }

  /**
   * Recommend Christmas reserved team based on strategy
   */
  recommendChristmas(strategyType: SurvivorStrategyType): { teamId: string; alternateTeamId: string; confidence: number; reason: string } {
    switch (strategyType) {
      case SurvivorStrategyType.CONSERVATIVE:
        return {
          teamId: "kc",
          alternateTeamId: "sf",
          confidence: 0.92,
          reason: "Kansas City Chiefs represent the absolute highest Christmas security lock for safe survival."
        };
      case SurvivorStrategyType.CONTRARIAN:
        return {
          teamId: "sf",
          alternateTeamId: "kc",
          confidence: 0.81,
          reason: "San Francisco 49ers Christmas recommendation provides high-leverage edge against Chiefs-heavy contest rosters."
        };
      default:
        return {
          teamId: "kc",
          alternateTeamId: "buf",
          confidence: 0.89,
          reason: "Kansas City Chiefs Christmas leverage. Preserves high-tier equity value for the late-season final push."
        };
    }
  }

  /**
   * Generate and store holiday reservations for an entry
   */
  async generateReservations(entryId: string, season: string, strategyType: SurvivorStrategyType): Promise<SurvivorHolidayReservation[]> {
    const tgRecommendation = this.recommendThanksgiving(strategyType);
    const xmasRecommendation = this.recommendChristmas(strategyType);

    const tgRes: SurvivorHolidayReservation = {
      entry_id: entryId,
      season,
      holiday_type: HolidayType.THANKSGIVING,
      reserved_team_id: tgRecommendation.teamId,
      alternate_team_id: tgRecommendation.alternateTeamId,
      confidence_score: tgRecommendation.confidence,
      reservation_reason: tgRecommendation.reason,
      strategy_type: strategyType
    };

    const xmasRes: SurvivorHolidayReservation = {
      entry_id: entryId,
      season,
      holiday_type: HolidayType.CHRISTMAS,
      reserved_team_id: xmasRecommendation.teamId,
      alternate_team_id: xmasRecommendation.alternateTeamId,
      confidence_score: xmasRecommendation.confidence,
      reservation_reason: xmasRecommendation.reason,
      strategy_type: strategyType
    };

    return await survivorStrategyRoadmapRepo.saveHolidayReservationMany([tgRes, xmasRes]);
  }

  /**
   * Get active reservations for an entry
   */
  async getReservations(entryId: string, season: string): Promise<SurvivorHolidayReservation[]> {
    return await survivorStrategyRoadmapRepo.getHolidayReservationsByEntryId(entryId, season);
  }

  /**
   * Store reserved teams manually
   */
  async saveReservation(reservation: SurvivorHolidayReservation): Promise<SurvivorHolidayReservation> {
    return await survivorStrategyRoadmapRepo.saveHolidayReservation(reservation);
  }
}

export const holidayReservationService = new HolidayReservationService();
