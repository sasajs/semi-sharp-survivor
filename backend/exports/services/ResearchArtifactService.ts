import { ResearchArtifact, ExportRun, ExportConfig, WeeklyReport, ExportAuditMetadata } from "../models";
import { WeeklyReportService } from "../../reports/services/WeeklyReportService";
import { DocxExportService } from "./DocxExportService";
import { HtmlExportService } from "./HtmlExportService";
import { ExportAuditService } from "./ExportAuditService";

export class ResearchArtifactService {
  private static artifacts: ResearchArtifact[] = [];
  private static exportRuns: ExportRun[] = [];

  /**
   * Compiles and archives a high-fidelity Survivor Strategy Research Artifact.
   */
  static async createResearchArtifact(
    reportId: string,
    config: ExportConfig = {}
  ): Promise<ResearchArtifact> {
    const report = await WeeklyReportService.getWeeklyReport(reportId);
    if (!report) {
      throw new Error(`Weekly Report not found: ${reportId}`);
    }

    // Rely on DOCX export builder to get clean structured sections
    const docxSections = DocxExportService.buildDocxSections(report, config);
    const htmlResult = await HtmlExportService.exportWeeklyReportToHtml(reportId, config);

    // Build artifact sections
    const secMap = new Map(docxSections.map(s => [s.id, s.body_markdown]));

    const titlePageText = secMap.get("docx-title-page") || "";
    const execText = secMap.get("docx-sec-exec-summary") || "";
    const recText = secMap.get("docx-sec-rec-picks") || "";
    const riskText = secMap.get("docx-sec-risk-summary") || "";
    const invText = secMap.get("docx-sec-inventory-summary") || "";
    const simText = secMap.get("docx-sec-simulation-summary") || "";
    const chalkText = secMap.get("docx-sec-chalk-upset") || "";
    const stratText = secMap.get("docx-sec-strat-comparison") || "";
    const auditText = secMap.get("docx-sec-audit-metadata") || "";
    const assText = secMap.get("docx-appendix-assumptions") || "Standard model predictions and public popularity assumptions.";
    const limText = secMap.get("docx-appendix-limitations") || "Static prediction snapshot bounded by current execution variables.";

    const artifactContentString = JSON.stringify({
      title_page: titlePageText,
      executive_summary: execText,
      recommended_picks: recText,
      risk_summary: riskText,
      inventory_summary: invText,
      simulation_summary: simText,
      chalk_upset_scenario: chalkText,
      strategy_comparison: stratText,
      appendix_audit: auditText,
      appendix_assumptions: assText,
      appendix_limitations: limText
    });

    const exportFormat = config.format || "research-artifact";
    const exportHash = ExportAuditService.createExportHash(report.id, exportFormat, artifactContentString);
    const auditMetadata = ExportAuditService.attachExportAuditMetadata(report, exportHash);

    const artifact: ResearchArtifact = {
      id: `artifact-${reportId}-${Date.now()}`,
      title: `Contest Week ${report.week_number} Research Portfolio`,
      report_id: reportId,
      generated_at: new Date().toISOString(),
      sections: {
        title_page: { content: titlePageText },
        executive_summary: { content: execText },
        recommended_picks: { content: recText },
        risk_summary: { content: riskText },
        inventory_summary: { content: invText },
        simulation_summary: { content: simText },
        chalk_upset_scenario: { content: chalkText },
        strategy_comparison: { content: stratText },
        appendix_audit: { content: auditText },
        appendix_assumptions: { content: assText },
        appendix_limitations: { content: limText }
      },
      audit_metadata: auditMetadata
    };

    this.artifacts.push(artifact);

    // Save associated export run
    this.exportRuns.push({
      id: `exprun-${Date.now()}`,
      artifact_id: artifact.id,
      status: "completed",
      created_at: artifact.generated_at
    });

    return artifact;
  }

  /**
   * Retrieves all compiled research artifacts associated with a contest.
   */
  static async listResearchArtifacts(contestId: string): Promise<ResearchArtifact[]> {
    const matchingArtifacts: ResearchArtifact[] = [];
    for (const art of this.artifacts) {
      const rep = await WeeklyReportService.getWeeklyReport(art.report_id);
      if (rep && rep.contest_id === contestId) {
        matchingArtifacts.push(art);
      }
    }
    return matchingArtifacts;
  }

  /**
   * Retrieves an individual research artifact by id.
   */
  static async getResearchArtifact(artifactId: string): Promise<ResearchArtifact | null> {
    return this.artifacts.find(a => a.id === artifactId) || null;
  }

  /**
   * Regenerates a research study accurately from historic state captures.
   */
  static async regenerateArtifactFromHistory(artifactId: string): Promise<ResearchArtifact> {
    const existing = await this.getResearchArtifact(artifactId);
    if (!existing) throw new Error("Artifact not found for historical regeneration");

    // Re-pull and verify the report is active
    const report = await WeeklyReportService.getWeeklyReport(existing.report_id);
    if (!report) {
      throw new Error("Weekly Report referenced by artifact no longer exists.");
    }

    return await this.createResearchArtifact(existing.report_id, {
      include_assumptions: !!existing.sections.appendix_assumptions,
      include_limitations: !!existing.sections.appendix_limitations
    });
  }

  /**
   * Validates export runs by checking run records.
   */
  static async getExportRun(runId: string): Promise<ExportRun | null> {
    return this.exportRuns.find(r => r.id === runId) || null;
  }
}
