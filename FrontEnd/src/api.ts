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
      throw new ApiError(
        typeof errorData === 'string' ? errorData : errorData?.detail || `API request failed with status ${response.status}`,
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
    // API contract explicitly shows: POST /auth/login?username=SAS&password=SAS
    const encodedUser = encodeURIComponent(username);
    const encodedPass = encodeURIComponent(password);
    return request<LoginResponse>(`/auth/login?username=${encodedUser}&password=${encodedPass}`, {
      method: 'POST',
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
  async getSchedule(season: number, week: number, entryId?: string | number): Promise<{ games: GameMatchup[] }> {
    if (entryId !== undefined && entryId !== null) {
      return request<{ games: GameMatchup[] }>(`/schedule/${season}/${week}/${entryId}`);
    }
    return request<{ games: GameMatchup[] }>(`/schedule/${season}/${week}`);
  },

  async getScheduleWithoutEntry(season: number, week: number): Promise<{ games: GameMatchup[] }> {
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

  // --- Strategy Engine ---
  async getStrategyHighestWin(season: number, contestFormat: string): Promise<StrategyRecommendation> {
    return request<StrategyRecommendation>(`/strategies/highest-win/${season}/${contestFormat}`);
  },

  async getStrategyFutureValue(season: number, contestFormat: string): Promise<StrategyRecommendation> {
    return request<StrategyRecommendation>(`/strategies/future-value/${season}/${contestFormat}`);
  },

  async getStrategyMultipleEntry(season: number, contestFormat: string): Promise<StrategyRecommendation> {
    return request<StrategyRecommendation>(`/strategies/multiple-entry/${season}/${contestFormat}`);
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
};
