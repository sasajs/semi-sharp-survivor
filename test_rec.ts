import { buildAndSeedMockState } from "./backend/services/mockSeeder";
import { RecommendationEngineService } from "./backend/recommendations/services/recommendationEngineService";

async function test() {
  buildAndSeedMockState();
  try {
    const recs = await RecommendationEngineService.getEntryRecommendations("UWOSH-1", "leg-1");
    console.log("Success! Compiled candidates count:", recs.candidates.length);
  } catch (err: any) {
    console.error("FAILED with error:", err);
    console.error(err.stack);
  }
}

test();
