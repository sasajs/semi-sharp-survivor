/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Filter, 
  Search, 
  RotateCcw, 
  RefreshCw, 
  TrendingUp, 
  AlertTriangle, 
  ShieldCheck, 
  Star, 
  X,
  SlidersHorizontal,
  Check
} from 'lucide-react';

export interface FilterState {
  season: number;
  week: number;
  searchQuery: string;
  positiveEdgeOnly: boolean;
  highRiskOnly: boolean;
  lowRiskOnly: boolean;
  showFavorites: boolean;
  showUnderdogs: boolean;
  hideCompleted: boolean;
  minBooks: number;
}

interface WeeklyFilterBarProps {
  filters: FilterState;
  onChange: (newFilters: FilterState) => void;
  onReset: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  totalGames: number;
  filteredCount: number;
}

export const WeeklyFilterBar: React.FC<WeeklyFilterBarProps> = ({
  filters,
  onChange,
  onReset,
  onRefresh,
  isRefreshing,
  totalGames,
  filteredCount,
}) => {
  const seasons = [2024, 2025, 2026];
  const weeks = Array.from({ length: 18 }, (_, i) => i + 1);

  const setFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  const isAnyFilterActive = 
    filters.searchQuery.trim() !== '' ||
    filters.positiveEdgeOnly ||
    filters.highRiskOnly ||
    filters.lowRiskOnly ||
    filters.showFavorites ||
    filters.showUnderdogs ||
    filters.hideCompleted ||
    filters.minBooks > 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-3.5">
      {/* Top Row: Primary Selectors & Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Season Selector */}
          <div className="flex items-center gap-1.5">
            <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Season</label>
            <select
              value={filters.season}
              onChange={(e) => setFilter('season', Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono font-bold rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            >
              {seasons.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Week Selector */}
          <div className="flex items-center gap-1.5">
            <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Week</label>
            <select
              value={filters.week}
              onChange={(e) => setFilter('week', Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono font-bold rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            >
              {weeks.map((w) => (
                <option key={w} value={w}>Week {w}</option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search team or matchup..."
              value={filters.searchQuery}
              onChange={(e) => setFilter('searchQuery', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-xs font-mono font-semibold text-slate-800 pl-8 pr-7 py-1.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            {filters.searchQuery && (
              <button
                onClick={() => setFilter('searchQuery', '')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Refresh & Actions */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-500 font-semibold hidden sm:inline">
            Showing <strong className="text-slate-900 font-extrabold">{filteredCount}</strong> of {totalGames} games
          </span>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-mono font-bold rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-all shadow-3xs cursor-pointer"
            title="Refresh analytics and sportsbook line snapshots"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh Analytics'}</span>
          </button>

          {isAnyFilterActive && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Row: Quick Analytical Toggles */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase text-slate-400 mr-2">
          <Filter className="w-3 h-3" />
          <span>Quick Filters:</span>
        </div>

        {/* Positive Edge Only */}
        <button
          onClick={() => setFilter('positiveEdgeOnly', !filters.positiveEdgeOnly)}
          className={`
            px-2.5 py-1 text-xs font-mono font-bold rounded-md border transition-all flex items-center gap-1.5 select-none cursor-pointer
            ${filters.positiveEdgeOnly
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-200'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }
          `}
        >
          <TrendingUp className="w-3 h-3 text-emerald-600" />
          <span>Positive Edge</span>
        </button>

        {/* High Risk Only */}
        <button
          onClick={() => {
            setFilter('highRiskOnly', !filters.highRiskOnly);
            if (!filters.highRiskOnly) setFilter('lowRiskOnly', false);
          }}
          className={`
            px-2.5 py-1 text-xs font-mono font-bold rounded-md border transition-all flex items-center gap-1.5 select-none cursor-pointer
            ${filters.highRiskOnly
              ? 'bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-200'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }
          `}
        >
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          <span>High Risk Only</span>
        </button>

        {/* Low Risk Only */}
        <button
          onClick={() => {
            setFilter('lowRiskOnly', !filters.lowRiskOnly);
            if (!filters.lowRiskOnly) setFilter('highRiskOnly', false);
          }}
          className={`
            px-2.5 py-1 text-xs font-mono font-bold rounded-md border transition-all flex items-center gap-1.5 select-none cursor-pointer
            ${filters.lowRiskOnly
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-200'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }
          `}
        >
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>Low Risk Only</span>
        </button>

        {/* Show Favorites */}
        <button
          onClick={() => setFilter('showFavorites', !filters.showFavorites)}
          className={`
            px-2.5 py-1 text-xs font-mono font-bold rounded-md border transition-all flex items-center gap-1.5 select-none cursor-pointer
            ${filters.showFavorites
              ? 'bg-indigo-50 text-indigo-800 border-indigo-300 ring-1 ring-indigo-200'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }
          `}
        >
          <Star className="w-3 h-3 text-indigo-600" />
          <span>Show Favorites</span>
        </button>

        {/* Active Sportsbooks (>0 books) */}
        <button
          onClick={() => setFilter('minBooks', filters.minBooks > 0 ? 0 : 1)}
          className={`
            px-2.5 py-1 text-xs font-mono font-bold rounded-md border transition-all flex items-center gap-1.5 select-none cursor-pointer
            ${filters.minBooks > 0
              ? 'bg-slate-900 text-white border-slate-950 font-bold shadow-3xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }
          `}
        >
          <span>Active Books Only</span>
        </button>
      </div>
    </div>
  );
};
