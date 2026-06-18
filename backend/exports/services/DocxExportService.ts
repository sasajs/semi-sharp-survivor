import { DocxExportResult, WeeklyReport, ReportExportSection, ExportConfig } from "../models";
import { WeeklyReportService } from "../../reports/services/WeeklyReportService";
import { ExportAuditService } from "./ExportAuditService";

export class DocxExportService {
  /**
   * Generates a structured DOCX-compatible document model representing the weekly report.
   */
  static async exportWeeklyReportToDocx(
    reportId: string,
    config: ExportConfig = {}
  ): Promise<DocxExportResult> {
    const report = await WeeklyReportService.getWeeklyReport(reportId);
    if (!report) {
      throw new Error(`Weekly Report not found: ${reportId}`);
    }

    const sections = this.buildDocxSections(report, config);
    const metadata = this.createDocxMetadata(report);

    // Compute estimated file size based on serialized JSON size
    const serializedPayload = JSON.stringify({ sections, metadata });
    const sizeBytes = Buffer.byteLength(serializedPayload, "utf-8") + 4096; // 4KB base docx overhead

    const exportHash = ExportAuditService.createExportHash(report.id, "docx", serializedPayload);

    return {
      docx_ready_model: {
        title: `Contest Week ${report.week_number} Survivor Research Study`,
        sections,
        metadata: {
          ...metadata,
          export_hash: exportHash
        }
      },
      file_size_estimate_bytes: sizeBytes,
      is_valid: true
    };
  }

  /**
   * Builds the logical high-fidelity sections for DOCX conversion.
   */
  static buildDocxSections(report: WeeklyReport, config: ExportConfig): ReportExportSection[] {
    const sections: ReportExportSection[] = [];

    // Title Page
    sections.push({
      id: "docx-title-page",
      heading: `SURVIVOR CONTEST ANALYSIS - WEEK ${report.week_number}`,
      body_markdown: `# RESEARCH STUDY EXPORT
- **Report Reference**: \`${report.id}\`
- **Contest ID**: \`${report.contest_id}\`
- **Contest Leg ID**: \`${report.contest_leg_id}\`
- **Compiled At**: ${report.created_at}
- **Document Classification**: Proprietary Strategic Intelligence`
    });

    // Content sections derived from report
    for (const rSec of report.sections) {
      sections.push({
        id: `docx-${rSec.id}`,
        heading: rSec.title.toUpperCase(),
        body_markdown: rSec.content_markdown
      });
    }

    // Assumptions Appendix
    if (config.include_assumptions !== false) {
      sections.push({
        id: "docx-appendix-assumptions",
        heading: "A. APPENDIX: SYSTEM INTEGRITY ASSUMPTIONS",
        body_markdown: `### Key Research Constraints & Data Assumptions
1. **NFL Game Dynamics**: Win probabilities are derived from statistical model outputs and are assumed to capture all known rest, travel, and injury factors.
2. **Public Market Bias**: The contest pick popularities are representative of standard national survivor pools and assume no local bias.
3. **Strict Elimination Rules**: The model operates under classic survivor rules where ties operate strictly as field-wide losses.`
      });
    }

    // Limitations Appendix
    if (config.include_limitations !== false) {
      sections.push({
        id: "docx-appendix-limitations",
        heading: "B. APPENDIX: ANALYTICAL BOUNDARIES & LIMITATIONS",
        body_markdown: `### Analytical Boundaries & Predictive Disclaimers
- **Dynamic Variable Invariance**: This report represents a static historical snapshot of contest rules and implied probabilities locked at the execution timestamp. Late-week weather, injury trends, or public odds movements are not automatically incorporated.
- **Joint Path Correlation**: Monte Carlo projections assume independent game outcomes except where specific team dependencies are modeled.`
      });
    }

    return sections;
  }

  /**
   * Generates document meta and property blocks.
   */
  static createDocxMetadata(report: WeeklyReport): Record<string, any> {
    return {
      creator: "Survivor Planner Intelligence Suite",
      last_modified_by: "Survivor Planner Engine",
      created: report.created_at,
      modified: new Date().toISOString(),
      report_id: report.id,
      week_number: report.week_number,
      report_hash: report.audit_metadata?.report_hash || ""
    };
  }

  /**
   * Validates DOCX document model health and cryptographic signatures.
   */
  static async validateDocxExport(docxResult: DocxExportResult): Promise<boolean> {
    if (!docxResult.docx_ready_model || docxResult.file_size_estimate_bytes <= 0) {
      return false;
    }
    const pay = JSON.stringify({
      sections: docxResult.docx_ready_model.sections,
      metadata: {
        creator: docxResult.docx_ready_model.metadata.creator,
        last_modified_by: docxResult.docx_ready_model.metadata.last_modified_by,
        created: docxResult.docx_ready_model.metadata.created,
        modified: docxResult.docx_ready_model.metadata.modified,
        report_id: docxResult.docx_ready_model.metadata.report_id,
        week_number: docxResult.docx_ready_model.metadata.week_number,
        report_hash: docxResult.docx_ready_model.metadata.report_hash
      }
    });

    return ExportAuditService.validateExportReproducibility(
      docxResult.docx_ready_model.metadata.report_id,
      "docx",
      pay,
      docxResult.docx_ready_model.metadata.export_hash
    );
  }
}
