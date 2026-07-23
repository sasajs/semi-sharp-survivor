/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getBackendUrl, getCustomHeaders } from './config';
import {
  LoginResponse,
  SemiSharpContext,
  Team,
  GameMatchup,
  PowerRating,
  SicHealthScore,
  ProjectedSpread,
  ProjectionGame,
  ProjectionsResponse,
  ConsensusMarketLine,
  ConsensusResponse,
  ProjectionEdge,
  ProjectionEdgeResponse,
  RiskFactor,
  RiskItem,
  RiskResponse,
  StrategyRecommendation,
  PffPowerRankingsResponse,
  PffRankingRecord,
  HomeFieldAdvantageResponse,
  HomeFieldAdvantageRecord,
} from './types';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Clean, low-level fetch utility with base configuration, 
 * header injection, and robust error parsing.
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getBackendUrl();
  const url = `${baseUrl}${path}`;

  const headers = new Headers(options.headers);
  
  // Inject default headers
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Inject any custom configured auth headers or tokens
  const customHeaders = getCustomHeaders();
  Object.entries(customHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }

      let errorMessage = `API request failed with status ${response.status}`;
      if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (errorData && typeof errorData === 'object') {
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail
              .map((err: any) => {
                const field = err.loc ? err.loc.filter((l: any) => l !== 'body' && l !== 'query').join('.') : '';
                const msg = err.msg || '';
                return field ? `${field}: ${msg}` : msg;
              })
              .filter(Boolean)
              .join(', ');
          } else if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else {
            errorMessage = JSON.stringify(errorData.detail);
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      }

      throw new ApiError(
        errorMessage,
        response.status,
        errorData
      );
    }

    // Handle empty or 204 No Content responses safely
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json() as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or other runtime errors
    const msg = error instanceof Error ? error.message : 'Network error connecting to backend';
    throw new ApiError(msg, 0);
  }
}

/**
 * SemiSharp API Client Module
 */
export const SemiSharpApi = {
  // --- System ---
  async checkHealth(): Promise<{ status: string; service?: string; [key: string]: any }> {
    return request<{ status: string; service?: string; [key: string]: any }>('/health');
  },

  // --- Authentication ---
  /**
   * Performs user login against POST /auth/login.
   * Matches BOTH query parameter and JSON payload formats for maximum server compatibility.
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    return request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username,
        password,
      }),
    });
  },

  // --- Context & Dashboard ---
  async getContext(): Promise<SemiSharpContext> {
    // Contract lists both GET /context and GET /context/current.
    // We try to request /context/current first, and fallback if necessary.
    try {
      return await request<SemiSharpContext>('/context/current');
    } catch {
      return await request<SemiSharpContext>('/context');
    }
  },

  // --- Reference Data ---
  async getTeams(): Promise<{ teams: Team[] }> {
    return request<{ teams: Team[] }>('/teams');
  },

  // --- Schedule ---
  async getSchedule(season: number, week: number): Promise<{ games: GameMatchup[] }> {
    return request<{ games: GameMatchup[] }>(`/schedule/${season}/${week}`);
  },

  // --- Ratings ---
  async getPffRatings(season: number, week: number): Promise<{ ratings: PowerRating[] }> {
    return request<{ ratings: PowerRating[] }>(`/ratings/pff/${season}/${week}`);
  },

  // --- Injuries ---
  async getSicHealth(season: number, week: number): Promise<{ sic_scores: SicHealthScore[] }> {
    return request<{ sic_scores: SicHealthScore[] }>(`/injuries/sic/${season}/${week}`);
  },

  // --- Projection Engine ---
  async getProjections(season: number, week: number): Promise<ProjectionsResponse> {
    return request<ProjectionsResponse>(`/projections/${season}/${week}`);
  },

  // --- Market Engine ---
  async getMarketConsensus(season: number, week: number): Promise<ConsensusResponse> {
    return request<ConsensusResponse>(`/market/consensus/${season}/${week}`);
  },

  async getProjectionEdge(season: number, week: number): Promise<ProjectionEdgeResponse> {
    return request<ProjectionEdgeResponse>(`/market/projection-edge/${season}/${week}`);
  },

  // --- Risk Engine ---
  async getRisk(season: number, week: number): Promise<RiskResponse> {
    return request<RiskResponse>(`/risk/${season}/${week}`);
  },

  async getRiskWeek(season: number, week: number): Promise<RiskResponse> {
    return request<RiskResponse>(`/risk/week/${season}/${week}`);
  },

  async getRiskGame(gameId: string): Promise<any> {
    return request<any>(`/risk/game/${encodeURIComponent(gameId)}`);
  },

  async getRiskMethodology(): Promise<any> {
    return request<any>('/risk/methodology');
  },

  // --- Strategy Engine ---
  async getStrategyRegistry(): Promise<any[]> {
    return request<any[]>('/strategies');
  },

  async getStrategyHighestWin(season: number, contestFormat: string): Promise<StrategyRecommendation> {
    return request<StrategyRecommendation>(`/strategies/current-week-highest-win/${season}/${contestFormat}`);
  },

  async getStrategyFutureValue(season: number, contestFormat: string): Promise<StrategyRecommendation> {
    return request<StrategyRecommendation>(`/strategies/future-value/${season}/${contestFormat}`);
  },

  async getStrategyMultipleEntry(season: number, contestFormat: string, userId?: string | number): Promise<StrategyRecommendation> {
    const query = userId ? `?userId=${userId}&user_id=${userId}` : '';
    return request<StrategyRecommendation>(`/strategies/multiple-entry/${season}/${contestFormat}${query}`);
  },

  async getStrategyCircaHoliday(season: number): Promise<StrategyRecommendation> {
    return request<StrategyRecommendation>(`/strategies/circa-holiday/${season}`);
  },

  async getStrategyProjectionEdge(season: number, contestFormat: string): Promise<StrategyRecommendation> {
    return request<StrategyRecommendation>(`/strategies/projection-edge/${season}/${contestFormat}`);
  },

  async getStrategyMonteCarlo(season: number, contestFormat: string): Promise<StrategyRecommendation> {
    return request<StrategyRecommendation>(`/strategies/monte-carlo/${season}/${contestFormat}`);
  },

  async getStrategyDynamicProgramming(season: number, contestFormat: string): Promise<StrategyRecommendation> {
    return request<StrategyRecommendation>(`/strategies/dynamic-programming/${season}/${contestFormat}`);
  },

  async getStrategyBottomSixRoadFade(season: number, contestFormat: string): Promise<StrategyRecommendation> {
    return request<StrategyRecommendation>(`/strategies/bottom-six-road-fade/${season}/${contestFormat}`);
  },

  async getStrategyMarketArbitrageExit(season: number, contestFormat: string): Promise<StrategyRecommendation> {
    return request<StrategyRecommendation>(`/strategies/market-arbitrage-exit/${season}/${contestFormat}`);
  },

  async compareStrategies(season: number, contestFormat: string, entryId?: string | number): Promise<any> {
    const query = entryId ? `?entry_id=${entryId}` : '';
    return request<any>(`/strategies/compare/${season}/${contestFormat}${query}`);
  },

  async getStrategyRoadmap(
    strategyCode: string,
    season: number,
    contestFormat: string,
    entryId?: string | number,
    endpointSlug?: string
  ): Promise<StrategyRecommendation> {
    const slugMap: Record<string, string> = {
      CURRENT_WEEK_HIGHEST_WIN: 'current-week-highest-win',
      FUTURE_VALUE: 'future-value',
      MULTIPLE_ENTRY: 'multiple-entry',
      CIRCA_HOLIDAY: 'circa-holiday',
      PROJECTION_EDGE: 'projection-edge',
      MONTE_CARLO: 'monte-carlo',
      DYNAMIC_PROGRAMMING: 'dynamic-programming',
      BOTTOM_SIX_ROAD_FADE: 'bottom-six-road-fade',
      MARKET_ARBITRAGE_EXIT: 'market-arbitrage-exit',
    };

    const slug = endpointSlug || slugMap[strategyCode] || strategyCode.toLowerCase().replace(/_/g, '-');
    const query = entryId ? `?entry_id=${entryId}` : '';

    if (strategyCode === 'CIRCA_HOLIDAY') {
      try {
        return await request<StrategyRecommendation>(`/strategies/circa-holiday/${season}${query}`);
      } catch {
        return await request<StrategyRecommendation>(`/strategies/CIRCA_HOLIDAY/${season}${query}`);
      }
    }

    try {
      return await request<StrategyRecommendation>(`/strategies/${slug}/${season}/${contestFormat}${query}`);
    } catch (err) {
      if (strategyCode !== slug) {
        return await request<StrategyRecommendation>(`/strategies/${strategyCode}/${season}/${contestFormat}${query}`);
      }
      throw err;
    }
  },

  // --- Season Management ---
  async getSeasonManagementStatus(): Promise<{
    application_context: any;
    entries: any[];
    all_entries_ready: boolean;
  }> {
    return request<any>('/season-management/status');
  },

  async updateSeasonManagementCurrentWeek(payload: {
    season: number;
    current_week: number;
    rating_week: number;
    allow_backward: boolean;
  }): Promise<any> {
    return request<any>('/season-management/current-week', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async getEntryPicks(entryId: string | number): Promise<{
    entry_id: number;
    picks: any[];
  }> {
    return request<any>(`/season-management/entries/${entryId}/picks`);
  },

  async getEntryReview(entryId: string | number): Promise<any> {
    return request<any>(`/season-management/entries/${entryId}/review`);
  },

  async getStrategyContext(entryId: string | number, contestFormat: string): Promise<any> {
    return request<any>(`/strategy-context/${entryId}?contest_format=${encodeURIComponent(contestFormat)}`);
  },

  async getValidPicks(entryId: string | number, contestLegId: string | number): Promise<any> {
    return request<any>(`/season-management/entries/${entryId}/valid-picks/${contestLegId}`);
  },

  async createPick(entryId: string | number, payload: { 
    contest_leg_id: number; 
    team_id: number;
    pick_source?: string;
    pick_status?: string;
    change_reason?: string;
  }): Promise<any> {
    return request<any>(`/season-management/entries/${entryId}/picks`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updatePick(entryId: string | number, contestLegId: string | number, payload: {
    team_id: number;
    pick_source?: string;
    pick_status?: string;
    change_reason?: string;
    contest_leg_id?: number;
  }): Promise<any> {
    return request<any>(`/season-management/entries/${entryId}/picks/${contestLegId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  // --- Admin Jobs ---
  async getAdminJobTypes(authString: string): Promise<string[]> {
    return request<string[]>('/admin/jobs/types', {
      headers: {
        'Authorization': `Basic ${authString}`
      }
    });
  },

  async getAdminJobs(authString: string, limit = 25): Promise<any> {
    return request<any>(`/admin/jobs?limit=${limit}`, {
      headers: {
        'Authorization': `Basic ${authString}`
      }
    });
  },

  async getAdminJob(authString: string, jobId: string | number): Promise<any> {
    return request<any>(`/admin/jobs/${jobId}`, {
      headers: {
        'Authorization': `Basic ${authString}`
      }
    });
  },

  async createAdminJob(authString: string, payload: { job_type: string; request_payload: any }): Promise<any> {
    return request<any>('/admin/jobs', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  },

  async validatePffRatings(authString: string, season: number, week: number): Promise<any> {
    return request<any>(`/admin/ratings/pff/validate?season=${season}&week=${week}`, {
      headers: {
        'Authorization': `Basic ${authString}`
      }
    });
  },

  async importPffRatings(authString: string, payload: { season: number; week: number; replace_existing: boolean }): Promise<any> {
    return request<any>('/admin/ratings/pff/import', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  },

  async validateSicInjuries(authString: string, season: number, week: number): Promise<any> {
    return request<any>(`/admin/injuries/sic/validate?season=${season}&week=${week}`, {
      headers: {
        'Authorization': `Basic ${authString}`
      }
    });
  },

  async importSicInjuries(authString: string, payload: { season: number; week: number; replace_existing: boolean }): Promise<any> {
    return request<any>('/admin/injuries/sic/import', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  },

  async refreshMarketOdds(authString: string | null, payload: { season: number; week: number }): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (authString) {
      headers['Authorization'] = `Basic ${authString}`;
    }
    return request<any>('/market/refresh-odds', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
  },

  async getPffPowerRankings(season: number, week: number): Promise<PffPowerRankingsResponse> {
    return request<PffPowerRankingsResponse>(`/ratings/pff/${season}/${week}`);
  },

  async getHomeFieldAdvantage(season: number): Promise<HomeFieldAdvantageResponse> {
    return request<HomeFieldAdvantageResponse>(`/reference/home-field-advantage/${season}`);
  },

  async updateHomeFieldAdvantage(authString: string, season: number, teamId: string | number, payload: { home_field_points: number; notes: string | null }): Promise<any> {
    return request<any>(`/reference/home-field-advantage/${season}/${teamId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  },
};
