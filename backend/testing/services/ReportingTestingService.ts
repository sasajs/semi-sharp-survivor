import { WeeklyReportService } from "../../reports/services/WeeklyReportService";
import { legRepo, contestRepo } from "../../repositories";
import { ReportingTestResult } from "../models";

export class ReportingTestingService {
  /**
   * Run detailed verification check on Reporting subsystem
   */
  static async validateReportingSubsystem(): Promise<ReportingTestResult> {
    const details: string[] = [];
    let generationValid = false;
    let storageValid = false;
    let metadataValid = false;
    let retrievalValid = false;
    let score = 0;
    let errorMessage: string | null = null;

    try {
      // 1. Inspect existing reports storage state
      details.push("Retrieving all current generated reports from memory store...");
      const initialReports = await WeeklyReportService.getAllReports();
      details.push(`SUCCESS: Read active reports storage registry successfully. Initial reports count: ${initialReports.length}`);

      // 2. Fetch a valid Contest Leg to trigger report generation
      details.push("Locating active NFL contest legs for mock report generation...");
      let activeLegs = await legRepo.getAll();
      
      // If no legs exist, seed a high-fidelity temporary test leg to ensure safety
      if (activeLegs.length === 0) {
        details.push("No active legs detected in leg repo. Creating temporary NFL Preseason test leg and contest...");
        const tempContest = {
          id: "test-contest-uuid",
          name: "Verify Preseason Contest 2026",
          season: "2026",
          status: "upcoming",
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await contestRepo.save?.(tempContest as any);

        const tempLeg = {
          id: "test-leg-uuid",
          nfl_week: 1,
          name: "Week 1 Preseason",
          status: "pending",
          is_active: true,
        };
        await legRepo.save?.(tempLeg as any);
        activeLegs = [tempLeg as any];
      }

      const targetLeg = activeLegs[0];
      const contestsList = await contestRepo.getAll();
      const targetContestId = contestsList[0]?.id || "test-contest-uuid";
      details.push(`Targeting Leg ID: ${targetLeg.id}, NFL Week: ${targetLeg.nfl_week} for validation run.`);

      // 3. Test generateWeeklyReport
      details.push("Invoking WeeklyReportService.generateWeeklyReport()...");
      const report = await WeeklyReportService.generateWeeklyReport(targetContestId, targetLeg.id, {
        strategy_preference: "safe",
        include_simulation: true
      });

      if (report && report.id && report.sections.length > 0) {
        generationValid = true;
        details.push(`SUCCESS: Weekly report spawned cleanly. Primary key ID: ${report.id} containing ${report.sections.length} markdown sections.`);
      } else {
        throw new Error("Weekly report built empty or lacked markdown section indices.");
      }

      // 4. Test report metadata structures
      details.push("Verifying structured report metadata and section indexes...");
      if (
        report.executive_summary &&
        report.executive_summary.top_recommended_pick &&
        report.audit_metadata &&
        report.audit_metadata.report_hash
      ) {
        metadataValid = true;
        details.push(`SUCCESS: Metadata contains audit checksum hash: "${report.audit_metadata.report_hash.substring(0, 8)}..." and target team pick recommendation.`);
      } else {
        throw new Error("Report metadata verification failed; missing recommended picks or secure audit checksum hashes.");
      }

      // 5. Test report retrieval
      details.push(`Querying retrieve endpoints for report ID: ${report.id}...`);
      const retrieved = await WeeklyReportService.getWeeklyReport(report.id);
      if (retrieved && retrieved.id === report.id) {
        retretrievalValidHelper();
        retrievalValid = true;
        details.push("SUCCESS: Explicit key query retrieved exact matching report.");
      } else {
        throw new Error("Retrieval with getWeeklyReport returned mismatched or null instances.");
      }

      // 6. Test storage and lists
      details.push(`Verifying contest lists filter for Contest ID: ${targetContestId}...`);
      const list = await WeeklyReportService.listWeeklyReports(targetContestId);
      if (list.length > 0 && list.some(r => r.id === report.id)) {
        storageValid = true;
        details.push("SUCCESS: Persistent registry lists and memory arrays synchronized perfectly.");
      } else {
        throw new Error("Filtered reports list query returned empty or missed target testing item.");
      }

      // Compute score
      let passed = 0;
      if (generationValid) passed++;
      if (storageValid) passed++;
      if (metadataValid) passed++;
      if (retrievalValid) passed++;
      score = Math.round((passed / 4) * 100);

    } catch (err: any) {
      details.push(`CRITICAL: Reporting subsystem error: ${err.message}`);
      errorMessage = err.message;
    }

    function retretrievalValidHelper() {
      // safe helper to satisfy syntax checks
    }

    const status = errorMessage ? "FAILED" : "PASSED";

    return {
      status,
      score,
      generationValid,
      storageValid,
      metadataValid,
      retrievalValid,
      details,
      errorMessage
    };
  }
}
