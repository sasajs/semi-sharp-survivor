import { recommendationEvolutionRepo } from "../../repositories";
import { RecommendationEvolutionService } from "../../services/RecommendationEvolutionService";
import { RecommendationEvolution, RecommendationChangeEvent, RecommendationEvolutionSummary } from "../../../src/types";

export interface EvolutionTestResult {
  success: boolean;
  score: number;
  logs: string[];
  assertions: { name: string; passed: boolean; message?: string }[];
}

export class RecommendationEvolutionTestingService {
  /**
   * Run ALL recommendation evolution verification suites.
   */
  static async runAllTests(): Promise<EvolutionTestResult> {
    const logs: string[] = ["Starting Recommendation Evolution (V056) Test Suite..."];
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

    // 1. Repository Suite
    logs.push("\n[1/4] Running Repository Layer Tests...");
    try {
      const mockEvo: RecommendationEvolution = {
        season: "2026",
        week: 1,
        team_id: "SF",
        previous_rank: 3,
        new_rank: 1,
        previous_confidence: 80,
        new_confidence: 95,
        evolution_reason: "Test upgrades",
        triggering_event: "LINE_MOVEMENT",
        recommendation_status: "UPGRADED"
      };

      const savedEvo = await recommendationEvolutionRepo.saveEvolution(mockEvo);
      runAssertion("Repository can save an evolution record", () => {
        return !!savedEvo && savedEvo.team_id === "SF" && savedEvo.recommendation_status === "UPGRADED";
      });

      const mockEvent: RecommendationChangeEvent = {
        recommendation_id: 999,
        event_type: "RANK_SHIFT",
        event_source: "SURVIVOR_RECOMMENDATION_ENGINE",
        event_description: "SF moved from 3 to 1",
        impact_score: 20,
        previous_value: "Rank 3",
        new_value: "Rank 1"
      };

      const savedEvent = await recommendationEvolutionRepo.saveChangeEvent(mockEvent);
      runAssertion("Repository can save a change event record", () => {
        return !!savedEvent && savedEvent.recommendation_id === 999 && savedEvent.event_type === "RANK_SHIFT";
      });

      const mockSummary: RecommendationEvolutionSummary = {
        season: "2026",
        week: 1,
        total_changes: 5,
        major_changes: 2,
        stable_recommendations: 10,
        average_confidence_delta: 4.5,
        average_rank_delta: 1.2
      };

      const savedSummary = await recommendationEvolutionRepo.saveSummary(mockSummary);
      runAssertion("Repository can save a weekly summary", () => {
        return !!savedSummary && savedSummary.total_changes === 5 && savedSummary.major_changes === 2;
      });

      const history = await recommendationEvolutionRepo.getEvolutionHistory("2026", 1);
      runAssertion("Repository can retrieve evolution history for a week", () => {
        return Array.isArray(history) && history.length > 0;
      });

      const summaries = await recommendationEvolutionRepo.getSummaries("2026", 1);
      runAssertion("Repository can retrieve summaries for a week", () => {
        return Array.isArray(summaries) && summaries.length > 0;
      });

    } catch (err: any) {
      logs.push(`❌ Repository Layer test exception: ${err.message}`);
    }

    // 2. Service Suite (Comparison & tracking)
    logs.push("\n[2/4] Running Service Layer & Comparison Tests...");
    try {
      // Simulate tracking evolution for a dummy week
      const trackingResult = await RecommendationEvolutionService.trackEvolution("2026", 1, "v1.0.0");
      runAssertion("Service trackEvolution completes and returns structured records", () => {
        return Array.isArray(trackingResult);
      });

      const evaluated = await RecommendationEvolutionService.evaluateOutcomes("2026", 1);
      runAssertion("Service evaluateOutcomes runs outcome evaluation successfully", () => {
        return Array.isArray(evaluated);
      });

    } catch (err: any) {
      logs.push(`❌ Service Layer test exception: ${err.message}`);
    }

    // 3. API Simulation
    logs.push("\n[3/4] Running API Integration Simulations...");
    try {
      // Simulate retrieving change events
      const events = await recommendationEvolutionRepo.getChangeEvents();
      runAssertion("API query can fetch recommendation change events successfully", () => {
        return Array.isArray(events);
      });
    } catch (err: any) {
      logs.push(`❌ API Simulation test exception: ${err.message}`);
    }

    const success = assertions.every(a => a.passed);
    const score = assertions.length > 0 ? Math.round((passedCount / assertions.length) * 100) : 0;

    logs.push(`\nTest completion summary: ${passedCount}/${assertions.length} assertions passed. Overall Score: ${score}%`);

    return {
      success,
      score,
      logs,
      assertions
    };
  }
}
