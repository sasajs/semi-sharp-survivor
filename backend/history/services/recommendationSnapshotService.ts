import { RecommendationSnapshot, EntryRecommendation, PortfolioRecommendation } from "../models";
import { recommendationSnapshotRepo, recommendationRepo, entryRepo } from "../../repositories";
import { VersionTrackingService } from "./versionTrackingService";

export class RecommendationSnapshotService {
  /**
   * Commits current active entry and portfolio recommendations to an immutable RecommendationSnapshot.
   */
  static async captureRecommendationSnapshot(inputs: {
    contestId: string;
    contestLegId: string;
    weekNumber: number;
    createdBy: string;
  }): Promise<RecommendationSnapshot> {
    const { contestId, contestLegId, weekNumber, createdBy } = inputs;

    // Retrieve active entries
    const entries = await entryRepo.getAll();
    const activeEntries = entries.filter(e => e.status !== "eliminated");

    // Gather entry level recommendations of this leg
    const entryRecs: EntryRecommendation[] = [];
    for (const ent of activeEntries) {
      const rec = await recommendationRepo.getByEntryAndLeg(ent.id, contestLegId);
      if (rec) {
        entryRecs.push(rec);
      }
    }

    // Gather standard portfolio recommendations on this leg
    const portRec = await recommendationSnapshotRepo.getByLegId(contestLegId);

    const versions = VersionTrackingService.getVersionsForLeg(contestLegId);

    const snapshot: RecommendationSnapshot = {
      id: `recsnap-${contestLegId}-${Date.now()}`,
      contest_id: contestId,
      contest_leg_id: contestLegId,
      week_number: weekNumber,
      entry_recommendations: entryRecs,
      portfolio_recommendations: portRec,
      recommendation_version: versions.recommendation_version,
      created_at: new Date().toISOString(),
      created_by: createdBy
    };

    return await recommendationSnapshotRepo.saveWeeklyRecSnapshot(snapshot);
  }

  /**
   * Retrieves recommendation snapshots by contest leg ID
   */
  static async getRecommendationSnapshotByLeg(legId: string): Promise<RecommendationSnapshot | null> {
    return await recommendationSnapshotRepo.getWeeklyRecSnapshot(legId);
  }

  /**
   * Returns whole recommendation snapshot history list
   */
  static async getRecommendationHistory(): Promise<RecommendationSnapshot[]> {
    return await recommendationSnapshotRepo.getAllWeeklyRecSnapshots();
  }
}
