// ScheduleImportFramework.ts
// Interfaces and adapters for importing NFL Schedules

export interface ImportRow {
  week: number;
  game_time: string;
  home_team: string;
  away_team: string;
  home_score?: number;
  away_score?: number;
  status?: 'scheduled' | 'final';
}

/**
 * Interface for future schedule APIs (NFL API, SportsDataIO, Sportradar)
 */
export interface IScheduleProviderAdapter {
  providerName: string;
  fetchGames(): Promise<ImportRow[]>;
}

export class NFLApiAdapter implements IScheduleProviderAdapter {
  providerName = "NFL API";
  async fetchGames(): Promise<ImportRow[]> {
    throw new Error("NFL API live integration is not active yet. Interface only.");
  }
}

export class SportsDataIOAdapter implements IScheduleProviderAdapter {
  providerName = "SportsDataIO";
  async fetchGames(): Promise<ImportRow[]> {
    throw new Error("SportsDataIO live integration is not active yet. Interface only.");
  }
}

export class SportradarAdapter implements IScheduleProviderAdapter {
  providerName = "Sportradar";
  async fetchGames(): Promise<ImportRow[]> {
    throw new Error("Sportradar live integration is not active yet. Interface only.");
  }
}

/**
 * Parses raw CSV schedule files
 */
export function parseCSV(content: string): ImportRow[] {
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length <= 1) return [];
  
  // Detect header
  const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/^["']|["']$/g, ""));
  const weekIdx = headers.indexOf('week');
  const timeIdx = headers.indexOf('game_time') !== -1 ? headers.indexOf('game_time') : headers.indexOf('time');
  const homeIdx = headers.indexOf('home_team') !== -1 ? headers.indexOf('home_team') : headers.indexOf('home');
  const awayIdx = headers.indexOf('away_team') !== -1 ? headers.indexOf('away_team') : headers.indexOf('away');
  const homeScoreIdx = headers.indexOf('home_score');
  const awayScoreIdx = headers.indexOf('away_score');
  const statusIdx = headers.indexOf('status');

  if (weekIdx === -1 || homeIdx === -1 || awayIdx === -1) {
    throw new Error("CSV is missing required headers. 'week', 'home_team', and 'away_team' must be present.");
  }

  const rows: ImportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    // Basic comma splitter that respects simple quotes
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let charIdx = 0; charIdx < lines[i].length; charIdx++) {
      const char = lines[i][charIdx];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^["']|["']$/g, ""));
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^["']|["']$/g, ""));

    if (values.length < Math.max(weekIdx, homeIdx, awayIdx) + 1) continue;
    
    const week = parseInt(values[weekIdx], 10);
    if (isNaN(week)) continue;

    const home_team = values[homeIdx];
    const away_team = values[awayIdx];
    if (!home_team || !away_team) continue;

    const game_time = (timeIdx !== -1 && values[timeIdx]) ? values[timeIdx] : new Date().toISOString();
    const home_score = (homeScoreIdx !== -1 && values[homeScoreIdx]) ? parseInt(values[homeScoreIdx], 10) : undefined;
    const away_score = (awayScoreIdx !== -1 && values[awayScoreIdx]) ? parseInt(values[awayScoreIdx], 10) : undefined;
    const statusVal = (statusIdx !== -1 && values[statusIdx]) ? values[statusIdx].toLowerCase() : 'scheduled';
    const status = (statusVal === 'final' || statusVal === 'closed') ? 'final' as const : 'scheduled' as const;

    rows.push({
      week,
      game_time,
      home_team,
      away_team,
      home_score: isNaN(home_score as any) ? undefined : home_score,
      away_score: isNaN(away_score as any) ? undefined : away_score,
      status
    });
  }
  return rows;
}

/**
 * Parses JSON schedule files
 */
export function parseJSON(content: string): ImportRow[] {
  const parsed = JSON.parse(content);
  const items = Array.isArray(parsed) ? parsed : (parsed.games || parsed.schedule || []);
  if (!Array.isArray(items)) {
    throw new Error("JSON must resolve to an array of game elements.");
  }
  return items.map((item: any, index) => {
    if (item.week === undefined || !item.home_team || !item.away_team) {
      throw new Error(`JSON element at index ${index} is missing required fields: 'week', 'home_team', 'away_team'.`);
    }
    return {
      week: Number(item.week),
      game_time: item.game_time || item.time || new Date().toISOString(),
      home_team: String(item.home_team),
      away_team: String(item.away_team),
      home_score: item.home_score !== undefined ? Number(item.home_score) : undefined,
      away_score: item.away_score !== undefined ? Number(item.away_score) : undefined,
      status: item.status === 'final' ? 'final' as const : 'scheduled' as const
    };
  });
}
