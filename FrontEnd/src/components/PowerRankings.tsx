/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  BookOpen, 
  Info, 
  X,
  AlertCircle,
  Clock,
  Database,
  Calendar,
  CheckCircle2,
  FileText,
  Activity
} from 'lucide-react';
import { Card, Button, Input, LoadingSpinner, Alert } from './ui';
import { SemiSharpApi, ApiError } from '../api';
import { PffPowerRankingsResponse, PffRankingRecord } from '../types';

interface PowerRankingsProps {
  season: number;
  week: number;
  onLoaded?: (loaded: boolean) => void;
}

export const PowerRankings: React.FC<PowerRankingsProps> = ({ 
  season, 
  week, 
  onLoaded 
}) => {
  // Core state
  const [data, setData] = useState<PffPowerRankingsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter, search and sorting states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [conferenceFilter, setConferenceFilter] = useState<'ALL' | 'AFC' | 'NFC'>('ALL');
  const [sortBy, setSortBy] = useState<
    'RANK' | 'POWER_RATING' | 'QB_RATING' | 'PROJECTED_WINS' | 'PLAYOFF_PROB' | 'ALPHABETICAL'
  >('RANK');

  // Interactive states
  const [selectedTeam, setSelectedTeam] = useState<PffRankingRecord | null>(null);
  const [educationOpen, setEducationOpen] = useState<boolean>(false);

  // Load power rankings from the backend
  const loadRankings = async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const response = await SemiSharpApi.getPffPowerRankings(season, week);
      setData(response);
      if (onLoaded) {
        onLoaded(true);
      }
    } catch (err) {
      if (onLoaded) {
        onLoaded(false);
      }
      if (err instanceof ApiError) {
        setError(err.message || 'API error retrieving PFF power rankings.');
      } else {
        setError('A network error occurred connecting to the backend.');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  // Run load on mount or when context params change
  useEffect(() => {
    loadRankings();
  }, [season, week]);

  // Handle manual Refresh Rankings
  const handleRefresh = async () => {
    await loadRankings(true);
  };

  // Formatting helpers (does not alter underlying backend values)
  const formatSpread = (val: number | null | undefined): string => {
    if (val === null || val === undefined) return 'Not available';
    return val.toFixed(2);
  };

  const formatQbRating = (val: number | null | undefined): string => {
    if (val === null || val === undefined) return 'Not available';
    return val.toFixed(1);
  };

  const formatWins = (val: number | null | undefined): string => {
    if (val === null || val === undefined) return 'Not available';
    return val.toFixed(2);
  };

  const formatPercent = (val: number | null | undefined): string => {
    if (val === null || val === undefined) return 'Not available';
    // If the backend returns probability as fraction <= 1, convert to percentage format
    const displayNum = Math.abs(val) <= 1 && val !== 0 ? val * 100 : val;
    return `${displayNum.toFixed(2)}%`;
  };

  const formatDateTime = (val: string | null | undefined): string => {
    if (!val) return 'Not available';
    try {
      return new Date(val).toLocaleString();
    } catch {
      return val;
    }
  };

  // Helper to safely render optional detail fields
  const renderDetailField = (
    label: string, 
    value: any, 
    formatter?: (v: any) => string
  ) => {
    const isNull = value === null || value === undefined;
    const formatted = isNull ? 'Not available' : formatter ? formatter(value) : String(value);
    
    return (
      <div className="flex flex-col gap-1 py-2 border-b border-slate-50 font-mono">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
          {label}
        </span>
        <span className={`text-xs font-bold ${isNull ? 'text-slate-400 italic' : 'text-slate-800'}`}>
          {formatted}
        </span>
      </div>
    );
  };

  // Rankings sorting & filtering pipeline (presentation behavior only)
  const processedRankings = useMemo(() => {
    if (!data || !data.rankings) return [];

    let filtered = [...data.rankings];

    // 1. Text Search Filter (matches abbreviation, name, nickname, division, conference)
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item => {
        const teamAbbr = (item.team || '').toLowerCase();
        const teamName = (item.team_name || '').toLowerCase();
        const teamNick = (item.team_nick || '').toLowerCase();
        const division = (item.division || '').toLowerCase();
        const conference = (item.conference || '').toLowerCase();
        
        return (
          teamAbbr.includes(query) ||
          teamName.includes(query) ||
          teamNick.includes(query) ||
          division.includes(query) ||
          conference.includes(query)
        );
      });
    }

    // 2. Conference Filter
    if (conferenceFilter !== 'ALL') {
      filtered = filtered.filter(item => 
        (item.conference || '').toUpperCase() === conferenceFilter
      );
    }

    // 3. Sorting (Presentation only - does not recalculate rank)
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'POWER_RATING': {
          const ratingA = a.point_spread_rating ?? -Infinity;
          const ratingB = b.point_spread_rating ?? -Infinity;
          return ratingB - ratingA;
        }
        case 'QB_RATING': {
          const qbA = a.qb_rating ?? -Infinity;
          const qbB = b.qb_rating ?? -Infinity;
          return qbB - qbA;
        }
        case 'PROJECTED_WINS': {
          const winsA = a.projected_wins ?? -Infinity;
          const winsB = b.projected_wins ?? -Infinity;
          return winsB - winsA;
        }
        case 'PLAYOFF_PROB': {
          const probA = a.make_playoffs_pct ?? -Infinity;
          const probB = b.make_playoffs_pct ?? -Infinity;
          return probB - probA;
        }
        case 'ALPHABETICAL': {
          const teamA = (a.team || '').toUpperCase();
          const teamB = (b.team || '').toUpperCase();
          return teamA.localeCompare(teamB);
        }
        case 'RANK':
        default:
          return a.rank - b.rank;
      }
    });

    return filtered;
  }, [data, searchQuery, conferenceFilter, sortBy]);

  // Derived Summary Metrics from original rankings array (direct comparisons)
  const summaryMetrics = useMemo(() => {
    if (!data || !data.rankings || data.rankings.length === 0) return null;

    const originalRankings = data.rankings;

    // Total teams ranked
    const totalTeams = originalRankings.length;

    // Top-ranked team (minimum backend rank field)
    const topTeam = originalRankings.reduce((prev, curr) => 
      curr.rank < prev.rank ? curr : prev
    , originalRankings[0]);

    // Highest QB rating
    const topQb = originalRankings.reduce((prev, curr) => {
      const prevVal = prev.qb_rating ?? -Infinity;
      const currVal = curr.qb_rating ?? -Infinity;
      return currVal > prevVal ? curr : prev;
    }, originalRankings[0]);

    // Latest Import
    const latestImport = originalRankings.reduce((prev, curr) => {
      if (!prev.imported_at) return curr;
      if (!curr.imported_at) return prev;
      return new Date(curr.imported_at) > new Date(prev.imported_at) ? curr : prev;
    }, originalRankings[0]);

    return {
      totalTeams,
      topTeam,
      topQb,
      latestImportTimestamp: latestImport?.imported_at || data.latest_imported_at || null
    };
  }, [data]);

  // Auto-sync selected team reference if it is updated in the data
  useEffect(() => {
    if (selectedTeam && data?.rankings) {
      const refreshed = data.rankings.find(r => r.team === selectedTeam.team);
      if (refreshed) {
        setSelectedTeam(refreshed);
      }
    }
  }, [data, selectedTeam]);

  // Render Loader State
  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4" id="pff_loading_state">
        <LoadingSpinner size="lg" message="Loading power rankings…" />
      </div>
    );
  }

  // Render Error State
  if (error) {
    return (
      <div className="space-y-6" id="pff_error_state">
        <Alert 
          type="error" 
          title="Failed to Load PFF Power Rankings" 
          message={error} 
          className="rounded-xl border-rose-200 bg-rose-50/50 text-rose-900"
        />
        <Card className="p-8 text-center flex flex-col items-center justify-center space-y-4 border border-slate-200 bg-white">
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-full text-rose-600">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 font-mono">Ratings Service Unavailable</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Could not retrieve team PFF ratings, quarterback evaluations, or season outlooks. Please verify your connection status and retry the query.
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => loadRankings()}
            className="font-mono font-bold mt-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Power Rankings
          </Button>
        </Card>
      </div>
    );
  }

  // Render Empty Response State
  if (!data || !data.rankings || data.rankings.length === 0) {
    return (
      <div className="space-y-6" id="pff_empty_state">
        <Alert 
          type="warning" 
          title="Empty Dataset" 
          message="No PFF power rankings were returned for the selected season and rating week." 
          className="rounded-xl border-amber-200 bg-amber-50/50 text-amber-900"
        />
        <Card className="p-10 text-center flex flex-col items-center justify-center space-y-4 border border-slate-200 bg-white">
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-full text-slate-400">
            <Info className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 font-mono">No Records Found</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            The database node does not contain any power ratings for Season {season}, Week {week}.
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => loadRankings()}
            className="font-mono font-bold mt-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Rankings
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8" id="power_rankings_page_root">
      
      {/* 1. ACTIVE CONTEXT BANNER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800/80 shadow-xs font-mono" id="pff_active_context_banner">
        <div className="space-y-1">
          <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Season Context</span>
          <span className="text-sm font-extrabold text-slate-200 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            {data.season}
          </span>
        </div>
        <div className="space-y-1">
          <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Rating Week</span>
          <span className="text-sm font-extrabold text-slate-200 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-400" />
            Week {data.week}
          </span>
        </div>
        <div className="space-y-1">
          <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Record Count</span>
          <span className="text-sm font-extrabold text-slate-200 flex items-center gap-1.5">
            <Database className="w-4 h-4 text-slate-400" />
            {data.count} Teams
          </span>
        </div>
        <div className="space-y-1">
          <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Data Source</span>
          <span className="text-sm font-extrabold text-slate-200 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-slate-400" />
            {data.source || 'PFF Export'}
          </span>
        </div>
        <div className="space-y-1 sm:col-span-2 lg:col-span-1">
          <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Latest Import</span>
          <span className="text-[11px] font-extrabold text-slate-300 truncate block mt-0.5" title={formatDateTime(data.latest_imported_at)}>
            {data.latest_imported_at ? new Date(data.latest_imported_at).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </div>

      {/* 2. SUMMARY METRIC CARDS */}
      {summaryMetrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="pff_summary_cards_grid">
          
          {/* CARD 1: Teams Ranked */}
          <Card className="border border-slate-100 bg-white" id="card_teams_ranked">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
                Teams Ranked
              </span>
              <span className="text-3xl font-extrabold text-slate-900 font-mono">
                {summaryMetrics.totalTeams}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Active season database entries
              </span>
            </div>
          </Card>

          {/* CARD 2: Top-Ranked Team */}
          <Card className="border border-slate-100 bg-white" id="card_top_team">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
                Top-Ranked Team
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-950 font-mono">
                  {summaryMetrics.topTeam?.team}
                </span>
                <span className="text-xs font-bold text-slate-500 uppercase font-mono">
                  Rank {summaryMetrics.topTeam?.rank}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium truncate" title={summaryMetrics.topTeam?.team_name}>
                {summaryMetrics.topTeam?.team_name || 'N/A'}
              </span>
            </div>
          </Card>

          {/* CARD 3: Highest QB Rating */}
          <Card className="border border-slate-100 bg-white" id="card_highest_qb">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
                Highest QB Rating
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-950 font-mono">
                  {formatQbRating(summaryMetrics.topQb?.qb_rating)}
                </span>
                <span className="text-xs font-bold text-slate-500 uppercase font-mono">
                  {summaryMetrics.topQb?.team}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium truncate" title={summaryMetrics.topQb?.team_name}>
                {summaryMetrics.topQb?.team_name || 'N/A'}
              </span>
            </div>
          </Card>

          {/* CARD 4: Latest Import */}
          <Card className="border border-slate-100 bg-white" id="card_latest_import">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
                Latest Import
              </span>
              <span className="text-sm font-extrabold text-slate-950 font-mono break-words leading-relaxed py-1.5">
                {summaryMetrics.latestImportTimestamp ? new Date(summaryMetrics.latestImportTimestamp).toLocaleDateString() : 'N/A'}
                <span className="text-xs text-slate-400 font-normal block">
                  {summaryMetrics.latestImportTimestamp ? new Date(summaryMetrics.latestImportTimestamp).toLocaleTimeString() : ''}
                </span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                PFF schedule ingest audit
              </span>
            </div>
          </Card>

        </div>
      )}

      {/* 3. CONTROLS BAR (Search, Filters, Sort & Refresh) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-3xs space-y-4" id="pff_controls_panel">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search by team, nickname, division, conference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all font-mono"
              id="pff_search_input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Configuration and Refresh Action */}
          <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="font-mono text-xs font-bold border-slate-200 bg-white"
              id="btn_refresh_rankings"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" />
              Refresh Rankings
            </Button>
          </div>

        </div>

        {/* Filters and Sorting selectors row */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-3 border-t border-slate-100 text-xs">
          
          {/* Conference filter selector tabs */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400 font-mono uppercase tracking-wider text-[10px]">Conference:</span>
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 font-mono text-[10px] font-extrabold uppercase">
              {(['ALL', 'AFC', 'NFC'] as const).map((conf) => (
                <button
                  key={conf}
                  onClick={() => setConferenceFilter(conf)}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    conferenceFilter === conf 
                      ? 'bg-white text-slate-900 shadow-3xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {conf === 'ALL' ? 'All Teams' : conf}
                </button>
              ))}
            </div>
          </div>

          {/* Sort By option dropdown */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400 font-mono uppercase tracking-wider text-[10px]">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-extrabold font-mono px-3 py-1.5 pr-8 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='currentColor' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'><path d='M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z'/></svg>")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundSize: '1rem',
                backgroundRepeat: 'no-repeat'
              }}
              id="pff_sort_select"
            >
              <option value="RANK">Backend Rank</option>
              <option value="POWER_RATING">Highest Power Rating</option>
              <option value="QB_RATING">Highest QB Rating</option>
              <option value="PROJECTED_WINS">Highest Projected Wins</option>
              <option value="PLAYOFF_PROB">Highest Playoff Probability</option>
              <option value="ALPHABETICAL">Alphabetical</option>
            </select>
          </div>

        </div>
      </div>

      {/* 4. TABLE AND DETAIL PANEL VIEW */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start" id="pff_rankings_display_grid">
        
        {/* Table List Card */}
        <Card className={`xl:col-span-3 border border-slate-100 bg-white flex flex-col p-0 overflow-hidden transition-all duration-300 ${selectedTeam ? 'xl:col-span-3' : 'xl:col-span-4'}`} id="card_rankings_table">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">PFF Team Evaluations Log</h3>
            </div>
            <div className="text-[10px] text-slate-400 font-mono font-bold">
              Displaying {processedRankings.length} of {data.count} records
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50 font-mono text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-center w-14">Rank</th>
                  <th className="px-5 py-3">Team</th>
                  <th className="px-4 py-3 text-right">Point Spread Rating</th>
                  <th className="px-4 py-3 text-right">QB Rating</th>
                  <th className="px-4 py-3 text-right">Projected Wins</th>
                  <th className="px-4 py-3 text-right">Make Playoffs %</th>
                  <th className="px-4 py-3 text-right">Win Division %</th>
                  <th className="px-4 py-3 text-right">Win Conference %</th>
                  <th className="px-4 py-3 text-right text-slate-500">Win Super Bowl %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-mono">
                {processedRankings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center space-y-2 text-slate-400">
                      <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="text-xs font-mono font-bold">No power rankings matched the current search query and filters.</p>
                    </td>
                  </tr>
                ) : (
                  processedRankings.map((record) => {
                    const isSelected = selectedTeam && selectedTeam.team === record.team;
                    return (
                      <tr
                        key={record.team}
                        onClick={() => setSelectedTeam(isSelected ? null : record)}
                        className={`hover:bg-slate-50/70 transition-colors cursor-pointer ${
                          isSelected ? 'bg-slate-50 border-l-2 border-l-slate-950 font-semibold' : ''
                        }`}
                      >
                        {/* Rank Column */}
                        <td className="px-4 py-3.5 text-center font-extrabold text-slate-900 text-sm bg-slate-50/40">
                          {record.rank}
                        </td>
                        
                        {/* Team Column with sub-details */}
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-900">
                              {record.team}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]" title={record.team_name}>
                              {record.team_name || 'N/A'}
                            </span>
                          </div>
                        </td>

                        {/* Point Spread Rating */}
                        <td className="px-4 py-3.5 text-right font-extrabold text-slate-900">
                          {formatSpread(record.point_spread_rating)}
                        </td>

                        {/* QB Rating */}
                        <td className="px-4 py-3.5 text-right font-bold text-slate-800">
                          {formatQbRating(record.qb_rating)}
                        </td>

                        {/* Projected Wins */}
                        <td className="px-4 py-3.5 text-right text-slate-700">
                          {formatWins(record.projected_wins)}
                        </td>

                        {/* Make Playoffs % */}
                        <td className="px-4 py-3.5 text-right font-bold text-emerald-600">
                          {formatPercent(record.make_playoffs_pct)}
                        </td>

                        {/* Win Division % */}
                        <td className="px-4 py-3.5 text-right text-slate-700">
                          {formatPercent(record.win_division_pct)}
                        </td>

                        {/* Win Conference % */}
                        <td className="px-4 py-3.5 text-right text-slate-700">
                          {formatPercent(record.win_conference_pct)}
                        </td>

                        {/* Win Super Bowl % */}
                        <td className="px-4 py-3.5 text-right font-semibold text-slate-500">
                          {formatPercent(record.win_super_bowl_pct)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Selected Team Detail Panel */}
        {selectedTeam && (
          <div className="xl:col-span-1" id="pff_detail_panel">
            <Card className="border border-slate-200 bg-white p-5 flex flex-col space-y-4 shadow-md sticky top-24" id="team_detail_card">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="bg-slate-900 text-white font-mono font-extrabold text-xs px-2.5 py-1 rounded">
                    {selectedTeam.team}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 font-mono truncate max-w-[120px]" title={selectedTeam.team_name}>
                      {selectedTeam.team_name || 'Team Details'}
                    </h4>
                    <span className="text-[9px] text-slate-400 font-bold font-mono">
                      RANK {selectedTeam.rank}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTeam(null)}
                  className="p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                  title="Close Inspector"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Inspector Content Accordions/Blocks */}
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                
                {/* 1. Team Identity */}
                <div className="space-y-1.5">
                  <h5 className="text-[10px] font-extrabold text-slate-900 uppercase font-mono tracking-wider bg-slate-50 px-2 py-1 rounded">
                    Team Identity
                  </h5>
                  <div className="px-1">
                    {renderDetailField('Canonical Abbreviation', selectedTeam.team)}
                    {renderDetailField('Team Name', selectedTeam.team_name)}
                    {renderDetailField('Nickname', selectedTeam.team_nick)}
                    {renderDetailField('Conference', selectedTeam.conference)}
                    {renderDetailField('Division', selectedTeam.division)}
                    {renderDetailField('PFF Source Code', selectedTeam.pff_team_code)}
                    {renderDetailField('Team ID', selectedTeam.team_id)}
                  </div>
                </div>

                {/* 2. Current Ratings */}
                <div className="space-y-1.5">
                  <h5 className="text-[10px] font-extrabold text-slate-900 uppercase font-mono tracking-wider bg-slate-50 px-2 py-1 rounded">
                    Current Ratings
                  </h5>
                  <div className="px-1">
                    {renderDetailField('PFF Rank', selectedTeam.rank)}
                    {renderDetailField('Point Spread Rating', selectedTeam.point_spread_rating, formatSpread)}
                    {renderDetailField('QB Rating', selectedTeam.qb_rating, formatQbRating)}
                  </div>
                </div>

                {/* 3. Strength of Schedule */}
                <div className="space-y-1.5">
                  <h5 className="text-[10px] font-extrabold text-slate-900 uppercase font-mono tracking-wider bg-slate-50 px-2 py-1 rounded">
                    Strength of Schedule
                  </h5>
                  <div className="px-1">
                    {renderDetailField('SOS To Date', selectedTeam.sos_to_date, formatSpread)}
                    {renderDetailField('SOS Remaining', selectedTeam.sos_remaining, formatSpread)}
                  </div>
                </div>

                {/* 4. Season Outlook */}
                <div className="space-y-1.5">
                  <h5 className="text-[10px] font-extrabold text-slate-900 uppercase font-mono tracking-wider bg-slate-50 px-2 py-1 rounded">
                    Season Outlook
                  </h5>
                  <div className="px-1">
                    {renderDetailField('Projected Wins', selectedTeam.projected_wins, formatWins)}
                    {renderDetailField('Make Playoffs %', selectedTeam.make_playoffs_pct, formatPercent)}
                    {renderDetailField('Win Division %', selectedTeam.win_division_pct, formatPercent)}
                    {renderDetailField('Win Conference %', selectedTeam.win_conference_pct, formatPercent)}
                    {renderDetailField('Win Super Bowl %', selectedTeam.win_super_bowl_pct, formatPercent)}
                  </div>
                </div>

                {/* 5. Source Metadata */}
                <div className="space-y-1.5">
                  <h5 className="text-[10px] font-extrabold text-slate-900 uppercase font-mono tracking-wider bg-slate-50 px-2 py-1 rounded">
                    Source Metadata
                  </h5>
                  <div className="px-1">
                    {renderDetailField('Source File', selectedTeam.source_file)}
                    {renderDetailField('Imported Timestamp', selectedTeam.imported_at, formatDateTime)}
                    {renderDetailField('PFF Power Rating ID', selectedTeam.pff_power_rating_id)}
                    {renderDetailField('Season', selectedTeam.season)}
                    {renderDetailField('Week', selectedTeam.week)}
                    {renderDetailField('Contest Leg ID', selectedTeam.contest_leg_id)}
                  </div>
                </div>

              </div>
              
            </Card>
          </div>
        )}

      </div>

      {/* 5. EDUCATIONAL PANEL (Accordion) */}
      <Card className="border border-slate-200 bg-white" id="pff_education_panel">
        <button
          onClick={() => setEducationOpen(!educationOpen)}
          className="w-full flex items-center justify-between font-mono text-xs font-extrabold text-slate-800 uppercase tracking-wider py-1 cursor-pointer focus:outline-none"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-500" />
            <span>How SemiSharp Uses Power Ratings</span>
          </div>
          {educationOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {educationOpen && (
          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600 leading-relaxed max-w-3xl space-y-2">
            <p>
              PFF power ratings and quarterback ratings are used as analytical inputs within SemiSharp’s projection, risk, and strategy processes. They are considered alongside schedule context, team health, home-field advantage, market information, and contest constraints. No single rating determines a recommendation.
            </p>
          </div>
        )}
      </Card>

    </div>
  );
};
