/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getBackendUrl, getCustomHeaders } from '../config';
import { WeeklyAnalysisResponse, GameAnalysis } from '../types/analysis';

export const analysisApi = {
  /**
   * Fetch Weekly Game Analysis for a given season and week.
   */
  async getWeeklyAnalysis(season: number, week: number): Promise<WeeklyAnalysisResponse> {
    const baseUrl = getBackendUrl();
    const url = `${baseUrl}/analysis/week/${season}/${week}`;
    
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');

    // Inject custom headers (like auth tokens) to remain integrated with auth system
    const customHeaders = getCustomHeaders();
    Object.entries(customHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        } else if (errorData && errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // Fallback to text response or status
      }
      throw new Error(errorMessage);
    }

    return await response.json() as WeeklyAnalysisResponse;
  },

  /**
   * Fetch Individual Game Analysis for a given game_id.
   */
  async getGameAnalysis(gameId: string): Promise<GameAnalysis> {
    const baseUrl = getBackendUrl();
    const url = `${baseUrl}/analysis/game/${gameId}`;
    
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');

    const customHeaders = getCustomHeaders();
    Object.entries(customHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        } else if (errorData && errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // Fallback
      }
      throw new Error(errorMessage);
    }

    return await response.json() as GameAnalysis;
  }
};
