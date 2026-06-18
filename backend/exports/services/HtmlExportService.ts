import { HtmlExportResult, WeeklyReport, ExportConfig } from "../models";
import { WeeklyReportService } from "../../reports/services/WeeklyReportService";
import { ExportAuditService } from "./ExportAuditService";

export class HtmlExportService {
  /**
   * Generates a fully compiled, self-contained semantic HTML research study.
   */
  static async exportWeeklyReportToHtml(
    reportId: string,
    config: ExportConfig = {}
  ): Promise<HtmlExportResult> {
    const report = await WeeklyReportService.getWeeklyReport(reportId);
    if (!report) {
      throw new Error(`Weekly Report not found: ${reportId}`);
    }

    const sectionsHtml = this.buildHtmlSections(report, config);
    const metadata = this.createHtmlMetadata(report);

    const themeClass = config.custom_theme === "dark" 
      ? "background: #0f172a; color: #f1f5f9;" 
      : "background: #f8fafc; color: #0f172a;";

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>NFL Survivor Weekly Research Report - Week ${report.week_number}</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, sans-serif;
            max-width: 900px;
            margin: 40px auto;
            padding: 24px;
            line-height: 1.6;
            ${themeClass}
        }
        h1, h2, h3, h4 {
            color: #1e293b;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 8px;
        }
        .meta-container {
            background: #f1f5f9;
            border-left: 4px solid #3b82f6;
            padding: 16px;
            border-radius: 4px;
            margin-bottom: 32px;
        }
        .report-section {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            padding: 24px;
            border-radius: 8px;
            margin-bottom: 24px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
        }
        th, td {
            border: 1px solid #cbd5e1;
            padding: 12px;
            text-align: left;
        }
        th {
            background-color: #f8fafc;
        }
    </style>
</head>
<body>
    <div class="meta-container">
        <h1>Survivor Strategy Decision Report: Week ${report.week_number}</h1>
        <p><strong>Report Reference Key:</strong> ${metadata.report_id}</p>
        <p><strong>Export Timestamp:</strong> ${metadata.modified}</p>
        <p><strong>System Version Lock:</strong> r${metadata.versions.report_version} / d${metadata.versions.data_version}</p>
    </div>
    ${sectionsHtml}
</body>
</html>`;

    return {
      html_string: fullHtml,
      is_valid: true
    };
  }

  /**
   * Translates Markdown string representation to basic HTML.
   */
  static buildHtmlSections(report: WeeklyReport, config: ExportConfig): string {
    let output = "";

    // Executive Summary Header Card
    output += `
    <div class="report-section">
        <h2>Executive Decision Study Summary</h2>
        <p><strong>Top Recommended Path Choice:</strong> ${report.executive_summary.top_recommended_pick.team_name}</p>
        <p><strong>Confidence Tier:</strong> ${report.executive_summary.confidence_tier}</p>
        <p><strong>Strategy Recommendation Guidance:</strong> ${report.executive_summary.strategy_recommendation}</p>
        <p><strong>Operational Summary Directive:</strong> ${report.executive_summary.key_risk_warnings.join(". ")}</p>
    </div>`;

    // Process each document section markdown simply
    for (const rSec of report.sections) {
      let contentHtml = rSec.content_markdown
        .replace(/### (.*)/g, '<h3>$1</h3>')
        .replace(/#### (.*)/g, '<h4>$1</h4>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/-(.*)/g, '<li>$1</li>')
        .replace(/\| (.*) \|/g, (match) => {
          const cells = match.split("|").map(c => c.trim()).filter(c => c !== "");
          if (cells[0].includes("---")) return ""; // horizontal alignment line
          return `<tr>${cells.map(c => `<td>${c}</td>`).join("")}</tr>`;
        });

      // Wrap list elements
      contentHtml = contentHtml.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
      // Wrap table elements
      contentHtml = contentHtml.replace(/(<tr>.*<\/tr>)/gs, '<table>$1</table>');

      output += `
      <div class="report-section" id="section-${rSec.id}">
          <h2>${rSec.title}</h2>
          <div>${contentHtml}</div>
      </div>`;
    }

    if (config.include_assumptions !== false) {
      output += `
      <div class="report-section">
          <h2>Appendix A: System Integrity Assumptions</h2>
          <p>This report assumes standard public pick distribution data with strict tie elimination parameters.</p>
      </div>`;
    }

    if (config.include_limitations !== false) {
      output += `
      <div class="report-section">
          <h2>Appendix B: Analytical Boundaries</h2>
          <p>Projections represent frozen snapshots of the historical contest. Mid-week changes in parameters are excluded.</p>
      </div>`;
    }

    return output;
  }

  /**
   * Generates key document properties and versions tracking dictionary.
   */
  static createHtmlMetadata(report: WeeklyReport): Record<string, any> {
    return {
      report_id: report.id,
      modified: new Date().toISOString(),
      versions: {
        report_version: report.audit_metadata?.report_version || 1,
        data_version: report.audit_metadata?.data_version || 1,
        inventory_version: report.audit_metadata?.inventory_version || 1
      }
    };
  }

  /**
   * Validates HTML export reproducibility.
   */
  static async validateHtmlExport(
    htmlResult: HtmlExportResult,
    expectedHash: string,
    reportId: string
  ): Promise<boolean> {
    if (!htmlResult || !htmlResult.html_string) {
      return false;
    }
    return ExportAuditService.validateExportReproducibility(
      reportId,
      "html",
      htmlResult.html_string,
      expectedHash
    );
  }
}
