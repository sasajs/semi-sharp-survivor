import { DocxExportService } from "../../exports/services/DocxExportService";
import { HtmlExportService } from "../../exports/services/HtmlExportService";
import { ResearchArtifactService } from "../../exports/services/ResearchArtifactService";
import { WeeklyReportService } from "../../reports/services/WeeklyReportService";
import { legRepo, contestRepo } from "../../repositories";
import { ExportTestResult } from "../models";

export class ExportTestingService {
  /**
   * Run detailed verification on the Export & Artifact subsystem
   */
  static async validateExportSubsystem(): Promise<ExportTestResult> {
    const details: string[] = [];
    let docxGenerationValid = false;
    let htmlGenerationValid = false;
    let researchArtifactValid = false;
    let registryValid = false;
    let score = 0;
    let errorMessage: string | null = null;

    try {
      // 1. Locate/generate a weekly report first
      details.push("Resolving active weekly reports for export formatting validations...");
      let reports = await WeeklyReportService.getAllReports();

      if (reports.length === 0) {
        details.push("No reports found in memory. Seeding temporary mock report for validation...");
        let activeLegs = await legRepo.getAll();
        if (activeLegs.length === 0) {
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
        const newRep = await WeeklyReportService.generateWeeklyReport(targetContestId, targetLeg.id, {
          strategy_preference: "safe"
        });
        reports = [newRep];
      }

      const report = reports[0];
      details.push(`Using Report ID: ${report.id} (NFL Week ${report.week_number}) for export runner validations.`);

      // 2. Validate DOCX Export Generation
      details.push("Invoking DocxExportService to compile standard Word document format sections...");
      const docxResult = await DocxExportService.exportWeeklyReportToDocx(report.id, {
        format: "docx",
        include_assumptions: true
      });

      if (docxResult && docxResult.docx_ready_model && Array.isArray(docxResult.docx_ready_model.sections) && docxResult.docx_ready_model.sections.length > 0) {
        docxGenerationValid = true;
        details.push(`SUCCESS: Word (DOCX) export file generated cleanly. Generated ${docxResult.docx_ready_model.sections.length} document sections.`);
      } else {
        throw new Error("Word template generation failed or output lacked sections.");
      }

      // 3. Validate HTML Export Generation
      details.push("Invoking HtmlExportService to convert report to responsive web format...");
      const htmlResult = await HtmlExportService.exportWeeklyReportToHtml(report.id, {
        format: "html",
        custom_theme: "cosmic"
      });

      if (htmlResult && htmlResult.html_string && htmlResult.html_string.includes("<html") && htmlResult.is_valid) {
        htmlGenerationValid = true;
        details.push(`SUCCESS: HTML conversion engine ran successfully. Generated valid HTML container: "${htmlResult.html_string.substring(0, 100)}..."`);
      } else {
        throw new Error("HTML export failed or compiled invalid or empty string structures.");
      }

      // 4. Validate Research Artifact Generation
      details.push("Invoking ResearchArtifactService to package strategy study portfolios...");
      const artifact = await ResearchArtifactService.createResearchArtifact(report.id, {
        format: "research-artifact",
        include_assumptions: true,
        include_limitations: true
      });

      if (artifact && artifact.id && artifact.sections && artifact.sections.executive_summary) {
        researchArtifactValid = true;
        details.push(`SUCCESS: Survivor Strategy Research Artifact archived. Storage ID: ${artifact.id}`);
      } else {
        throw new Error("Research artifact packaging failed or returned missing block contexts.");
      }

      // 5. Validate Artifact Registry
      details.push("Verifying compiled research artifact historical logging registries...");
      const registryArtifacts = await ResearchArtifactService.getAllArtifacts();
      if (Array.isArray(registryArtifacts) && registryArtifacts.length > 0) {
        registryValid = true;
        details.push(`SUCCESS: Artifact registry validated. Scanned archive size: ${registryArtifacts.length} packaged instances.`);
      } else {
        throw new Error("Registry is empty or listResearchArtifacts function is missing.");
      }

      // Compute score
      let passed = 0;
      if (docxGenerationValid) passed++;
      if (htmlGenerationValid) passed++;
      if (researchArtifactValid) passed++;
      if (registryValid) passed++;
      score = Math.round((passed / 4) * 100);

    } catch (err: any) {
      details.push(`CRITICAL: Export validation pipeline failure: ${err.message}`);
      errorMessage = err.message;
    }

    const status = errorMessage ? "FAILED" : "PASSED";

    return {
      status,
      score,
      docxGenerationValid,
      htmlGenerationValid,
      researchArtifactValid,
      registryValid,
      details,
      errorMessage
    };
  }
}
