/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PrintSummaryData {
  entryLabel: string;
  survivorSweatName?: string;
  contestFormat: string;
  season: number | string;
  currentWeek: number;
  generatedTimestamp: string;
  selectedStrategyName: string;
  selectedStrategyCode: string;
  entryId?: string | number;
  seasonSurvivalProbFormatted: string; // e.g. "11.89%" or "Not available"

  historicalPicks: Array<{
    week: number | string;
    legId?: number | string;
    teamCode: string;
    teamName: string;
    pickSource?: string;
    status: string;
    timestamp: string;
  }>;

  currentWeekPick: {
    week: number | string;
    teamCode: string;
    teamName: string;
    opponent?: string;
    winProbFormatted: string;
    riskLevel: string;
    spreadText: string;
    edgeText: string;
    pickSource: string;
    status: string;
    timestamp: string;
    rationale?: string;
    rationaleBullets?: string[];
  } | null;

  futurePicks: Array<{
    week: number | string;
    teamCode: string;
    teamName: string;
    opponent: string;
    winProbFormatted: string;
    optionValueStatus: string;
    rationale?: string;
  }>;
}

export function openSeasonSummaryPrintWindow(data: PrintSummaryData): void {
  const printWindow = window.open('', '_blank', 'width=950,height=1000,scrollbars=yes');
  if (!printWindow) {
    alert('Please allow popups to open the printable season summary.');
    return;
  }

  const {
    entryLabel,
    survivorSweatName,
    contestFormat,
    season,
    currentWeek,
    generatedTimestamp,
    selectedStrategyName,
    entryId,
    seasonSurvivalProbFormatted,
    historicalPicks,
    currentWeekPick,
    futurePicks,
  } = data;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SemiSharp Season Summary - Entry #${entryId || ''}</title>
  <style>
    @page {
      size: letter portrait;
      margin: 0.5in;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 20px;
      font-size: 11.5px;
      line-height: 1.45;
    }

    /* Screen-only top toolbar */
    .no-print-toolbar {
      background: #0f172a;
      color: #ffffff;
      padding: 12px 20px;
      margin: -20px -20px 20px -20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-family: monospace;
      font-size: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .toolbar-title {
      font-weight: bold;
      color: #f59e0b;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .toolbar-actions {
      display: flex;
      gap: 10px;
    }
    .btn-action {
      background: #f59e0b;
      color: #0f172a;
      border: none;
      padding: 6px 14px;
      font-weight: 800;
      font-size: 11px;
      font-family: monospace;
      border-radius: 6px;
      cursor: pointer;
    }
    .btn-secondary {
      background: #334155;
      color: #ffffff;
      border: 1px solid #475569;
    }

    @media print {
      .no-print {
        display: none !important;
      }
      body {
        padding: 0;
        margin: 0;
      }
    }

    /* Header block */
    .header-box {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .title-main {
      font-size: 20px;
      font-weight: 900;
      letter-spacing: -0.5px;
      text-transform: uppercase;
      color: #0f172a;
      margin: 0 0 2px 0;
    }
    .subtitle-main {
      font-size: 12px;
      font-weight: 700;
      color: #475569;
      margin: 0;
    }
    .header-meta-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-top: 10px;
      background: #f8fafc;
      padding: 10px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 11px;
    }
    .meta-item {
      display: flex;
      flex-direction: column;
    }
    .meta-label {
      font-size: 9px;
      text-transform: uppercase;
      font-weight: 800;
      color: #64748b;
      letter-spacing: 0.5px;
    }
    .meta-value {
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
    }

    /* Season Survival Callout */
    .survival-callout {
      background: #f0fdf4;
      border: 2px solid #10b981;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .survival-info {
      display: flex;
      flex-direction: column;
    }
    .survival-label {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      color: #065f46;
      letter-spacing: 0.5px;
    }
    .survival-desc {
      font-size: 10px;
      color: #047857;
      margin-top: 2px;
    }
    .survival-value {
      font-size: 20px;
      font-weight: 900;
      color: #047857;
      font-family: monospace;
      background: #ffffff;
      padding: 4px 12px;
      border-radius: 6px;
      border: 1px solid #a7f3d0;
    }

    /* Section Headings */
    .section-head {
      font-size: 12px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0f172a;
      border-bottom: 1.5px solid #0f172a;
      padding-bottom: 4px;
      margin: 16px 0 10px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .section-count {
      font-size: 10px;
      font-weight: 700;
      color: #475569;
      font-family: monospace;
    }

    /* Table styles */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 10.5px;
    }
    thead {
      display: table-header-group;
    }
    th {
      background: #f1f5f9;
      color: #1e293b;
      text-transform: uppercase;
      font-size: 9.5px;
      font-weight: 800;
      text-align: left;
      padding: 6px 8px;
      border: 1px solid #cbd5e1;
      letter-spacing: 0.3px;
    }
    td {
      padding: 6px 8px;
      border: 1px solid #e2e8f0;
      vertical-align: middle;
    }
    tr {
      page-break-inside: avoid;
    }
    .team-badge {
      display: inline-block;
      font-weight: 900;
      font-family: monospace;
      background: #e2e8f0;
      color: #0f172a;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      margin-right: 6px;
    }
    .status-badge-locked {
      display: inline-block;
      font-weight: 800;
      font-size: 9.5px;
      color: #047857;
      background: #d1fae5;
      padding: 2px 8px;
      border-radius: 12px;
      border: 1px solid #a7f3d0;
      text-transform: uppercase;
    }

    /* Section 2 Current Week Detailed Box */
    .current-week-card {
      border: 2px solid #0f172a;
      background: #f8fafc;
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 16px;
    }
    .current-week-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .team-highlight {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .team-code-big {
      font-size: 16px;
      font-weight: 900;
      font-family: monospace;
      background: #0f172a;
      color: #ffffff;
      padding: 4px 10px;
      border-radius: 6px;
    }
    .team-name-big {
      font-size: 15px;
      font-weight: 900;
      color: #0f172a;
    }
    .current-metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin: 10px 0;
      background: #ffffff;
      padding: 8px 10px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
    }
    .metric-col {
      display: flex;
      flex-direction: column;
    }
    .metric-col .lbl {
      font-size: 8.5px;
      text-transform: uppercase;
      font-weight: 800;
      color: #64748b;
    }
    .metric-col .val {
      font-size: 12px;
      font-weight: 900;
      color: #0f172a;
      font-family: monospace;
    }
    .rationale-list {
      margin: 6px 0 0 0;
      padding-left: 16px;
      font-size: 10px;
      color: #334155;
    }
    .rationale-list li {
      margin-bottom: 2px;
    }

    .no-data-text {
      font-style: italic;
      color: #64748b;
      font-size: 10px;
    }

    .footer-stamp {
      margin-top: 24px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #64748b;
      font-family: monospace;
    }
  </style>
</head>
<body>

  <!-- Screen Toolbar (Hidden on print) -->
  <div class="no-print-toolbar no-print">
    <div class="toolbar-title">
      <span>🖨️ SemiSharp Print Preview</span>
      <span style="color:#94a3b8; font-weight:normal;">| Entry #${entryId || '—'}</span>
    </div>
    <div class="toolbar-actions">
      <button class="btn-action" onclick="window.print()">Print Document</button>
      <button class="btn-action btn-secondary" onclick="window.close()">Close Preview</button>
    </div>
  </div>

  <!-- Header -->
  <div class="header-box">
    <div class="header-top">
      <div>
        <h1 class="title-main">SemiSharp Season Summary</h1>
        <p class="subtitle-main">${entryLabel}${survivorSweatName ? ` • ${survivorSweatName}` : ''}</p>
      </div>
      <div style="text-align: right; font-family: monospace; font-size: 10px; color: #475569;">
        <div><strong>NFL Season:</strong> ${season}</div>
        <div><strong>Active Leg:</strong> Week ${currentWeek}</div>
      </div>
    </div>

    <div class="header-meta-grid">
      <div class="meta-item">
        <span class="meta-label">Entry ID & Label</span>
        <span class="meta-value">#${entryId || '—'} • ${entryLabel}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Contest Format</span>
        <span class="meta-value">${contestFormat}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Strategy Path</span>
        <span class="meta-value">${selectedStrategyName}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Current NFL Week</span>
        <span class="meta-value">Week ${currentWeek}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Generated Timestamp</span>
        <span class="meta-value">${generatedTimestamp}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Print Status</span>
        <span class="meta-value">Official Database Record</span>
      </div>
    </div>
  </div>

  <!-- Season Survival Callout -->
  <div class="survival-callout">
    <div class="survival-info">
      <span class="survival-label">Projected Probability of Surviving the Remaining Season</span>
      <span class="survival-desc">Cumulative multi-week survival likelihood across remaining selections for ${selectedStrategyName} strategy.</span>
    </div>
    <div class="survival-value">${seasonSurvivalProbFormatted}</div>
  </div>

  <!-- Section 1: Teams Already Used -->
  <div class="section-head">
    <span>Section 1: Teams Already Used (Past Selections)</span>
    <span class="section-count">${historicalPicks.length} Past Legs Recorded</span>
  </div>

  ${historicalPicks.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th style="width: 15%;">NFL Week</th>
          <th style="width: 35%;">Selected Team</th>
          <th style="width: 20%;">Pick Source</th>
          <th style="width: 15%;">Pick Status</th>
          <th style="width: 15%;">Recorded Timestamp</th>
        </tr>
      </thead>
      <tbody>
        ${historicalPicks.map(hp => `
          <tr>
            <td><strong>Week ${hp.week}</strong></td>
            <td>
              <span class="team-badge">${hp.teamCode}</span>
              <strong>${hp.teamName}</strong>
            </td>
            <td>${hp.pickSource || 'USER_ENTRY'}</td>
            <td><span class="status-badge-locked">${hp.status || 'CONFIRMED'}</span></td>
            <td style="font-family: monospace; font-size: 9.5px;">${hp.timestamp}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : `
    <p class="no-data-text">No historical picks recorded for prior weeks yet. Entry is currently in Week ${currentWeek}.</p>
  `}

  <!-- Section 2: Team Picked This Week -->
  <div class="section-head">
    <span>Section 2: Team Picked This Week</span>
    <span class="section-count">Week ${currentWeek} Active Pick</span>
  </div>

  ${currentWeekPick ? `
    <div class="current-week-card">
      <div class="current-week-top">
        <div class="team-highlight">
          <span class="team-code-big">${currentWeekPick.teamCode}</span>
          <div>
            <div class="team-name-big">${currentWeekPick.teamName}</div>
            <div style="font-size: 10px; color: #475569;">
              Matchup / Opponent: <strong>${currentWeekPick.opponent || 'Scheduled Matchup'}</strong> • Source: <strong>${currentWeekPick.pickSource}</strong>
            </div>
          </div>
        </div>
        <div>
          <span class="status-badge-locked" style="font-size: 11px; padding: 4px 10px;">LOCKED IN DATABASE</span>
        </div>
      </div>

      <div class="current-metrics-grid">
        <div class="metric-col">
          <span class="lbl">Win Probability</span>
          <span class="val" style="color: #047857;">${currentWeekPick.winProbFormatted}</span>
        </div>
        <div class="metric-col">
          <span class="lbl">Upset Risk</span>
          <span class="val">${currentWeekPick.riskLevel}</span>
        </div>
        <div class="metric-col">
          <span class="lbl">Point Spread & Edge</span>
          <span class="val">${currentWeekPick.spreadText}</span>
        </div>
        <div class="metric-col">
          <span class="lbl">Recorded Timestamp</span>
          <span class="val" style="font-size: 10px;">${currentWeekPick.timestamp}</span>
        </div>
      </div>

      ${currentWeekPick.rationaleBullets && currentWeekPick.rationaleBullets.length > 0 ? `
        <div style="margin-top: 8px;">
          <strong style="font-size: 9.5px; text-transform: uppercase; color: #475569;">Strategy Rationale & Notes:</strong>
          <ul class="rationale-list">
            ${currentWeekPick.rationaleBullets.map(b => `<li>${b}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  ` : `
    <p class="no-data-text">No active pick locked in database for Week ${currentWeek}.</p>
  `}

  <!-- Section 3: Suggested Future Picks -->
  <div class="section-head">
    <span>Section 3: Suggested Future Picks</span>
    <span class="section-count">${futurePicks.length} Remaining Legs Planned</span>
  </div>

  ${futurePicks.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th style="width: 12%;">Future Week</th>
          <th style="width: 32%;">Recommended Team</th>
          <th style="width: 18%;">Matchup</th>
          <th style="width: 18%;">Projected Win %</th>
          <th style="width: 20%;">Option Value / Status</th>
        </tr>
      </thead>
      <tbody>
        ${futurePicks.map(fp => `
          <tr>
            <td><strong>Week ${fp.week}</strong></td>
            <td>
              <span class="team-badge" style="background: #fef3c7; color: #92400e;">${fp.teamCode}</span>
              <strong>${fp.teamName}</strong>
            </td>
            <td>${fp.opponent || 'TBD'}</td>
            <td><strong style="color: #047857;">${fp.winProbFormatted}</strong></td>
            <td><span style="font-size: 9.5px; font-weight: 700; color: #475569; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${fp.optionValueStatus || 'PLANNED'}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : `
    <p class="no-data-text">No remaining future roadmap picks found for this strategy path.</p>
  `}

  <!-- Footer -->
  <div class="footer-stamp">
    <span>SemiSharp Survivor Decision Support System</span>
    <span>Entry #${entryId || '—'} • ${generatedTimestamp}</span>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
