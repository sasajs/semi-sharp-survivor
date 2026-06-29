import { survivorStrategyRoadmapRepo } from "../../repositories";
import { survivorStrategyService } from "../../services/SurvivorStrategyService";
import { survivorRoadmapService } from "../../services/SurvivorRoadmapService";
import { holidayReservationService } from "../../services/HolidayReservationService";
import { SurvivorStrategyType, HolidayType, SurvivorEntryStrategy } from "../../../src/types";

export interface StrategyTestResult {
  success: boolean;
  score: number;
  logs: string[];
  assertions: { name: string; passed: boolean; message?: string }[];
}

export class SurvivorStrategyTestingService {
  /**
   * Run ALL Survivor Strategy & Roadmap (V057) Test Suites.
   */
  static async runAllTests(): Promise<StrategyTestResult> {
    const logs: string[] = ["Starting Survivor Strategy & Roadmap (V057) Test Suite..."];
    const assertions: { name: string; passed: boolean; message?: string }[] = [];
    let passedCount = 0;

    const runAssertion = (name: string, assertionFn: () => boolean) => {
      try {
        const passed = assertionFn();
        assertions.push({ name, passed });
        if (passed) {
          passedCount++;
          logs.push(`✅ ASSERTION PASSED: ${name}`);
        } else {
          logs.push(`❌ ASSERTION FAILED: ${name}`);
        }
      } catch (err: any) {
        assertions.push({ name, passed: false, message: err.message });
        logs.push(`❌ ASSERTION EXCEPTION in "${name}": ${err.message}`);
      }
    };

    const testEntryId = `test-entry-${Date.now()}`;
    const season = "2026";

    // 1. Strategy Assignment Suite
    logs.push("\n[1/5] Running Strategy Assignment Tests...");
    try {
      const assigned = await survivorStrategyService.assignStrategy(testEntryId, SurvivorStrategyType.CHAMPIONSHIP);
      runAssertion("Should assign CHAMPIONSHIP strategy to entry", () => {
        return !!assigned && 
          assigned.entry_id === testEntryId && 
          assigned.strategy_type === SurvivorStrategyType.CHAMPIONSHIP &&
          assigned.survival_weight === 0.25 &&
          assigned.future_value_weight === 0.30;
      });

      const retrieved = await survivorStrategyService.getActiveStrategy(testEntryId);
      runAssertion("Should retrieve active strategy for entry", () => {
        return !!retrieved && retrieved.strategy_type === SurvivorStrategyType.CHAMPIONSHIP;
      });

      // Update strategy weights
      retrieved.survival_weight = 0.50;
      retrieved.future_value_weight = 0.10;
      const updated = await survivorStrategyService.updateStrategy(retrieved);
      runAssertion("Should update and save custom strategy weights", () => {
        return !!updated && 
          updated.survival_weight === 0.50 && 
          updated.future_value_weight === 0.10;
      });

    } catch (err: any) {
      logs.push(`❌ Strategy Assignment test exception: ${err.message}`);
    }

    // 2. Holiday Reservation Suite
    logs.push("\n[2/5] Running Holiday Reservation Generation Tests...");
    try {
      const reservations = await holidayReservationService.generateReservations(testEntryId, season, SurvivorStrategyType.CHAMPIONSHIP);
      
      runAssertion("Should generate exactly 2 holiday reservations (Thanksgiving and Christmas)", () => {
        return Array.isArray(reservations) && reservations.length === 2;
      });

      const tg = reservations.find(r => r.holiday_type === HolidayType.THANKSGIVING);
      runAssertion("Thanksgiving reservation should assign det or dal with high confidence", () => {
        return !!tg && 
          (tg.reserved_team_id === "det" || tg.reserved_team_id === "dal") && 
          tg.confidence_score >= 0.70;
      });

      const xmas = reservations.find(r => r.holiday_type === HolidayType.CHRISTMAS);
      runAssertion("Christmas reservation should assign kc or sf with high confidence", () => {
        return !!xmas && 
          (xmas.reserved_team_id === "kc" || xmas.reserved_team_id === "sf") && 
          xmas.confidence_score >= 0.70;
      });

    } catch (err: any) {
      logs.push(`❌ Holiday Reservation test exception: ${err.message}`);
    }

    // 3. Roadmap Generation Suite
    logs.push("\n[3/5] Running Roadmap Generation Tests...");
    try {
      const { roadmap, weeks } = await survivorRoadmapService.generateRoadmap(testEntryId, season);

      runAssertion("Roadmap metadata should be generated", () => {
        return !!roadmap && 
          roadmap.entry_id === testEntryId && 
          roadmap.season === season && 
          !!roadmap.roadmap_version &&
          roadmap.total_projected_survival > 0;
      });

      runAssertion("Roadmap should contain exactly 18 weeks", () => {
        return Array.isArray(weeks) && weeks.length === 18;
      });

      // Verify Thanksgiving and Christmas weeks are flagged
      const week12 = weeks.find(w => w.week === 12);
      runAssertion("Week 12 should be marked as a Holiday Week", () => {
        return !!week12 && week12.is_holiday_week === true;
      });

      const week16 = weeks.find(w => w.week === 16);
      runAssertion("Week 16 should be marked as a Holiday Week", () => {
        return !!week16 && week16.is_holiday_week === true;
      });

    } catch (err: any) {
      logs.push(`❌ Roadmap Generation test exception: ${err.message}`);
    }

    // 4. Current Week Recommendation Extraction
    logs.push("\n[4/5] Running Current Week Extraction Tests...");
    try {
      const { weeks } = await survivorRoadmapService.generateRoadmap(testEntryId, season);
      const currentWeek = weeks.find(w => w.is_current_week === true);

      runAssertion("Should find exactly one current week in full roadmap", () => {
        const currentCount = weeks.filter(w => w.is_current_week === true).length;
        return currentCount === 1;
      });

      runAssertion("Current week recommendation should have a valid recommended team ID", () => {
        return !!currentWeek && !!currentWeek.recommended_team_id;
      });

    } catch (err: any) {
      logs.push(`❌ Current Week Extraction test exception: ${err.message}`);
    }

    // 5. Repository and Mock Compatibility
    logs.push("\n[5/5] Running Repository and Mock Compatibility Tests...");
    try {
      const allActiveStrats = await survivorStrategyRoadmapRepo.getAllStrategies();
      runAssertion("Should retrieve all strategies from repository (mock or postgres)", () => {
        return Array.isArray(allActiveStrats) && allActiveStrats.length > 0;
      });

      const roadmaps = await survivorRoadmapService.getPortfolioRoadmaps(season);
      runAssertion("Should get portfolio roadmaps list", () => {
        return typeof roadmaps === "object" && roadmaps !== null;
      });

    } catch (err: any) {
      logs.push(`❌ Repository and Mock Compatibility test exception: ${err.message}`);
    }

    const success = assertions.every(a => a.passed);
    const score = Math.round((passedCount / assertions.length) * 100);

    logs.push(`\nTest Suite Completed. Passed Assertions: ${passedCount}/${assertions.length} (${score}%)`);

    return {
      success,
      score,
      logs,
      assertions
    };
  }
}
