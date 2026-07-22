/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { analysisApi } from '../../services/analysisApi';
import { GameAnalysis, WeeklyAnalysisResponse } from '../../types/analysis';
import { WeeklyOverviewCards } from '../../components/weekly_analysis/WeeklyOverviewCards';
import { WeeklyFilterBar, FilterState } from '../../components/weekly_analysis/WeeklyFilterBar';
import { WeeklySlateTable } from '../../components/weekly_analysis/WeeklySlateTable';
import { Card, Button, Alert } from '../../components/ui';
import { 
  BarChart3, 
  Calendar, 
  Clock, 
  Layers, 
  Database, 
  Activity, 
  RefreshCw,
  Info
} from 'lucide-react';

interface WeeklyGameAnalysisPageProps {
  season: number;
  week: number;
}

export const WeeklyGameAnalysisPage: React.FC<WeeklyGameAnalysisPageProps> = ({
  season: initialSeason,
  week: initialWeek,
}) => {
  // Master API State
  const [data, setData] = useState<WeeklyAnalysisResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Expanded Game Accordion Tracker
  const [expandedGameId, setExpandedGameId] = useState<string | null>(null);

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    season: initialSeason,
    week: initialWeek,
    searchQuery: '',
    positiveEdgeOnly: false,
    highRiskOnly: false,
    lowRiskOnly: false,
    showFavorites: false,
    showUnderdogs: false,
    hideCompleted: false,
    minBooks: 0,
  });

  // Sync props if external parent change
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      season: initialSeason,
      week: initialWeek,
    }));
  }, [initialSeason, initialWeek]);

  // Master Data Fetcher
  const fetchData = useCallback(async (season: number, week: number, isSilentRefresh = false) => {
    if (isSilentRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await analysisApi.getWeeklyAnalysis(season, week);
      setData(response);
    } catch (err: any) {
      console.error('Error fetching weekly analysis:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while syncing with the SemiSharp Analysis API.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Trigger fetch when Season or Week filter changes
  useEffect(() => {
    fetchData(filters.season, filters.week);
  }, [filters.season, filters.week, fetchData]);

  const handleRefresh = () => {
    fetchData(filters.season, filters.week, true);
  };

  const handleResetFilters = () => {
    setFilters({
      season: filters.season,
      week: filters.week,
      searchQuery: '',
      positiveEdgeOnly: false,
      highRiskOnly: false,
      lowRiskOnly: false,
      showFavorites: false,
      showUnderdogs: false,
      hideCompleted: false,
      minBooks: 0,
    });
  };

  const handleToggleExpand = (gameId: string) => {
    setExpandedGameId((prev) => (prev === gameId ? null : gameId));
  };

  // Compute Last Odds Update Timestamp
  const lastMarketSnapshot = useMemo(() => {
    if (!data?.games || data.games.length === 0) return '—';

    let latest: Date | null = null;
    data.games.forEach((g) => {
      if (g.market?.latest_snapshot) {
        const d = new Date(g.market.latest_snapshot);
        if (!isNaN(d.getTime())) {
          if (!latest || d > latest) {
            latest = d;
          }
        }
      }
    });

    if (!latest) return '—';
    return (latest as Date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  }, [data]);

  // Client-Side Analytical Filtering Engine
  const processedGames = useMemo(() => {
    if (!data?.games) return [];

    let result = [...data.games];

    // 1. Search Query Filter
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter(
        (g) =>
          g.away_team.team_abbr.toLowerCase().includes(q) ||
          g.away_team.team_name.toLowerCase().includes(q) ||
          g.home_team.team_abbr.toLowerCase().includes(q) ||
          g.home_team.team_name.toLowerCase().includes(q)
      );
    }

    // 2. Positive Edge Filter
    if (filters.positiveEdgeOnly) {
      result = result.filter((g) => {
        const awayEdge = g.market.away_edge?.edge_points || 0;
        const homeEdge = g.market.home_edge?.edge_points || 0;
        return Math.max(awayEdge, homeEdge) >= 0.5;
      });
    }

    // 3. High Risk Filter
    if (filters.highRiskOnly) {
      result = result.filter((g) => {
        const awayScore = g.risk.away?.score || 0;
        const homeScore = g.risk.home?.score || 0;
        const awayHigh = g.risk.away?.level === 'HIGH' || awayScore >= 10;
        const homeHigh = g.risk.home?.level === 'HIGH' || homeScore >= 10;
        return awayHigh || homeHigh;
      });
    }

    // 4. Low Risk Filter
    if (filters.lowRiskOnly) {
      result = result.filter((g) => {
        const awayScore = g.risk.away?.score || 0;
        const homeScore = g.risk.home?.score || 0;
        return awayScore <= 4.0 && homeScore <= 4.0;
      });
    }

    // 5. Active Sportsbooks Filter
    if (filters.minBooks > 0) {
      result = result.filter((g) => g.market.sportsbook_count >= filters.minBooks);
    }

    return result;
  }, [data, filters]);

  // Skeleton loading states
  const renderSkeletons = () => (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-slate-200 rounded-xl" />
        ))}
      </div>
      <div className="h-20 bg-slate-200 rounded-xl" />
      <div className="h-96 bg-slate-100 rounded-xl" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* COMPACT TOOLBAR HEADER */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-3.5 shadow-md flex flex-wrap items-center justify-between gap-3 font-mono">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-300">{filters.season} Season</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-bold text-emerald-400">Week {filters.week}</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-bold text-indigo-300">
              {data?.game_count ?? data?.games?.length ?? 0} Games
            </span>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Odds Updated:</span>
            <span className="font-bold text-emerald-400 truncate max-w-[120px]" title={lastMarketSnapshot}>
              {lastMarketSnapshot}
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-slate-950 border-slate-800 text-slate-200 hover:text-white hover:bg-slate-800 text-xs py-1 px-3 h-8"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* ERROR ALERT IF ANY */}
      {error && (
        <div className="space-y-3">
          <Alert type="error" title="Analysis Pipeline Sync Error" message={error} />
          <Button variant="outline" size="sm" onClick={handleRefresh} className="text-xs">
            Retry Connection
          </Button>
        </div>
      )}

      {loading ? (
        renderSkeletons()
      ) : (
        <>
          {/* SECTION 2: FILTERS BAR */}
          <WeeklyFilterBar
            filters={filters}
            onChange={setFilters}
            onReset={handleResetFilters}
            onRefresh={handleRefresh}
            isRefreshing={refreshing}
            totalGames={data?.games?.length || 0}
            filteredCount={processedGames.length}
          />

          {/* SECTION 3: WEEKLY SLATE TABLE & EXPANDABLE GAME PANEL */}
          <WeeklySlateTable
            games={processedGames}
            expandedGameId={expandedGameId}
            onToggleExpand={handleToggleExpand}
          />
        </>
      )}
    </div>
  );
};
