/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sliders, 
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
  Activity,
  Award,
  ShieldCheck
} from 'lucide-react';
import { Card, Button, Input, LoadingSpinner, Alert } from './ui';
import { SemiSharpApi, ApiError } from '../api';
import { HomeFieldAdvantageResponse, HomeFieldAdvantageRecord } from '../types';

interface HomeFieldAdvantageProps {
  season: number;
  onLoaded?: (loaded: boolean) => void;
}

export const HomeFieldAdvantage: React.FC<HomeFieldAdvantageProps> = ({ 
  season, 
  onLoaded 
}) => {
  // Core state
  const [data, setData] = useState<HomeFieldAdvantageResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter, search and sorting states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [conferenceFilter, setConferenceFilter] = useState<'ALL' | 'AFC' | 'NFC'>('ALL');
  const [sortBy, setSortBy] = useState<'RANK' | 'HIGHEST' | 'LOWEST' | 'ALPHABETICAL'>('RANK');

  // Interactive states
  const [selectedTeam, setSelectedTeam] = useState<HomeFieldAdvantageRecord | null>(null);
  const [educationOpen, setEducationOpen] = useState<boolean>(false);

  // Load home-field advantage values from backend
  const loadHomeFieldAdvantage = async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const response = await SemiSharpApi.getHomeFieldAdvantage(season);
      setData(response);
      if (onLoaded) {
        onLoaded(true);
      }
    } catch (err) {
      if (onLoaded) {
        onLoaded(false);
      }
      if (err instanceof ApiError) {
        setError(err.message || 'API error retrieving home-field advantage values.');
      } else {
        setError('A network error occurred connecting to the backend.');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  // Run load on mount or when season changes
  useEffect(() => {
    loadHomeFieldAdvantage();
  }, [season]);

  // Handle manual Refresh Values (preserving local configuration states)
  const handleRefresh = async () => {
    await loadHomeFieldAdvantage(true);
  };

  // Formatting helpers
  const formatPoints = (val: number | null | undefined): string => {
    if (val === null || val === undefined) return 'Not available';
    return val.toFixed(1);
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
    const isNull = value === null || value === undefined || value === '';
    const formatted = isNull ? 'Not available' : formatter ? formatter(value) : String(value);
    
    return (
      <div className="flex flex-col gap-1 py-2 border-b border-slate-50 font-mono">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
          {label}
        </span>
        <span className={`text-xs font-bold ${isNull ? 'text-slate-400 italic font-normal' : 'text-slate-800'}`}>
          {formatted}
        </span>
      </div>
    );
  };

  // Filter & sorting pipeline
  const processedAdvantages = useMemo(() => {
    if (!data || !data.advantages) return [];

    let filtered = [...data.advantages];

    // 1. Search filter matches abbreviation, name, nickname, division, conference
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

    // 3. Sorting (Presentation behavior only)
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'HIGHEST':
          return b.home_field_points - a.home_field_points;
        case 'LOWEST':
          return a.home_field_points - b.home_field_points;
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

  // Summary statistics mapping
  const summaryMetrics = useMemo(() => {
    if (!data || !data.advantages || data.advantages.length === 0) return null;

    const advantages = data.advantages;

    // Use backend-returned minimum/maximum fields
    const minVal = data.minimum_home_field_points;
    const maxVal = data.maximum_home_field_points;

    // List all tied team abbreviations
    const tiedMaxTeams = advantages
      .filter(item => item.home_field_points === maxVal)
      .map(item => item.team);

    const tiedMinTeams = advantages
      .filter(item => item.home_field_points === minVal)
      .map(item => item.team);

    const activeSource = data.source_systems && data.source_systems.length > 0
      ? data.source_systems[0]
      : 'Not available';

    return {
      totalTeams: advantages.length,
      maxVal,
      minVal,
      tiedMaxTeamsStr: tiedMaxTeams.join(', '),
      tiedMinTeamsStr: tiedMinTeams.join(', '),
      activeSource
    };
  }, [data]);

  // Auto-sync selected team reference if it is updated in the database
  useEffect(() => {
    if (selectedTeam && data?.advantages) {
      const refreshed = data.advantages.find(r => r.team === selectedTeam.team);
      if (refreshed) {
        setSelectedTeam(refreshed);
      }
    }
  }, [data, selectedTeam]);

  // Render Loader State
  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4" id="hfa_loading_state">
        <LoadingSpinner size="lg" message="Loading home-field advantage values…" />
      </div>
    );
  }

  // Render Error State
  if (error) {
    return (
      <div className="space-y-6" id="hfa_error_state">
        <Alert 
          type="error" 
          title="Failed to Load Home Field Advantage" 
          message={error} 
          className="rounded-xl border-rose-200 bg-rose-50/50 text-rose-900"
        />
        <Card className="p-8 text-center flex flex-col items-center justify-center space-y-4 border border-slate-200 bg-white">
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-full text-rose-600">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 font-mono">Reference Service Unavailable</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Could not retrieve active team home-field advantage point values. Please verify connection and retry.
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => loadHomeFieldAdvantage()}
            className="font-mono font-bold mt-2"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" />
            Retry Home Field Advantage
          </Button>
        </Card>
      </div>
    );
  }

  // Render Empty Response State
  if (!data || !data.advantages || data.advantages.length === 0) {
    return (
      <div className="space-y-6" id="hfa_empty_state">
        <Alert 
          type="warning" 
          title="Empty Dataset" 
          message="No active home-field advantage values were returned for the selected season." 
          className="rounded-xl border-amber-200 bg-amber-50/50 text-amber-900"
        />
        <Card className="p-10 text-center flex flex-col items-center justify-center space-y-4 border border-slate-200 bg-white">
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-full text-slate-400">
            <Info className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 font-mono">No Records Found</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            The reference service returned an empty set of home-field configurations for Season {season}.
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => loadHomeFieldAdvantage()}
            className="font-mono font-bold mt-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Home Field Advantage
          </Button>
        </Card>
      </div>
    );
  }

  // Safely extract values for Model Transparency Panel
  const firstSourceSystem = data.source_systems && data.source_systems.length > 0 
    ? data.source_systems[0] 
    : 'Not available';

  return (
    <div className="space-y-8" id="home_field_advantage_page_root">
      
      {/* 1. ACTIVE CONTEXT BANNER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800/80 shadow-xs font-mono" id="hfa_active_context_banner">
        <div className="space-y-1">
          <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Season Context</span>
          <span className="text-sm font-extrabold text-slate-200 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            {data.season}
          </span>
        </div>
        <div className="space-y-1">
          <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Team Count</span>
          <span className="text-sm font-extrabold text-slate-200 flex items-center gap-1.5">
            <Database className="w-4 h-4 text-slate-400" />
            {data.count} Teams
          </span>
        </div>
        <div className="space-y-1">
          <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Source System</span>
          <span className="text-sm font-extrabold text-slate-200 flex items-center gap-1.5 truncate max-w-full" title={firstSourceSystem}>
            <FileText className="w-4 h-4 text-slate-400" />
            {firstSourceSystem}
          </span>
        </div>
        <div className="space-y-1">
          <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Min HFA Points</span>
          <span className="text-sm font-extrabold text-slate-200 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-slate-400" />
            {formatPoints(data.minimum_home_field_points)} pts
          </span>
        </div>
        <div className="space-y-1">
          <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Max HFA Points</span>
          <span className="text-sm font-extrabold text-slate-200 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-slate-400" />
            {formatPoints(data.maximum_home_field_points)} pts
          </span>
        </div>
      </div>

      {/* 2. SUMMARY STATISTIC CARDS */}
      {summaryMetrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="hfa_summary_cards_grid">
          
          {/* Teams Loaded */}
          <Card className="border border-slate-100 bg-white" id="card_hfa_teams_loaded">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
                Teams Loaded
              </span>
              <span className="text-3xl font-extrabold text-slate-900 font-mono">
                {summaryMetrics.totalTeams}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Active models in selected season
              </span>
            </div>
          </Card>

          {/* Highest Home-Field Value */}
          <Card className="border border-slate-100 bg-white" id="card_hfa_highest_val">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
                Highest Home-Field Value
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-950 font-mono text-emerald-600">
                  {formatPoints(summaryMetrics.maxVal)}
                </span>
                <span className="text-[10px] font-extrabold text-slate-500 uppercase font-mono tracking-wide">
                  pts
                </span>
              </div>
              <span className="text-[10px] text-slate-600 font-semibold font-mono truncate" title={summaryMetrics.tiedMaxTeamsStr}>
                Tied: {summaryMetrics.tiedMaxTeamsStr || 'N/A'}
              </span>
            </div>
          </Card>

          {/* Lowest Home-Field Value */}
          <Card className="border border-slate-100 bg-white" id="card_hfa_lowest_val">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
                Lowest Home-Field Value
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-950 font-mono text-slate-700">
                  {formatPoints(summaryMetrics.minVal)}
                </span>
                <span className="text-[10px] font-extrabold text-slate-500 uppercase font-mono tracking-wide">
                  pts
                </span>
              </div>
              <span className="text-[10px] text-slate-600 font-semibold font-mono truncate" title={summaryMetrics.tiedMinTeamsStr}>
                Tied: {summaryMetrics.tiedMinTeamsStr || 'N/A'}
              </span>
            </div>
          </Card>

          {/* Active Source */}
          <Card className="border border-slate-100 bg-white" id="card_hfa_active_source">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
                Active Source
              </span>
              <span className="text-md font-extrabold text-slate-950 font-mono truncate py-1.5" title={summaryMetrics.activeSource}>
                {summaryMetrics.activeSource}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Primary recalibration engine
              </span>
            </div>
          </Card>

        </div>
      )}

      {/* Informational Note */}
      <div className="flex items-center gap-2.5 px-4 py-3 bg-blue-50/80 border border-blue-200/80 rounded-xl text-blue-900 text-xs font-medium shadow-2xs" id="hfa_recalibration_note">
        <Info className="w-4 h-4 text-blue-600 shrink-0" />
        <span>These values are recalculated once each NFL season and remain fixed unless a new model calibration is released.</span>
      </div>

      {/* 3. CONTROLS BAR (Search, Filters, Sort & Refresh) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-3xs space-y-4" id="hfa_controls_panel">
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
              id="hfa_search_input"
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
              id="btn_refresh_values"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" />
              Refresh Values
            </Button>
          </div>

        </div>

        {/* Filters and Sorting selectors row */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-3 border-t border-slate-100 text-xs">
          
          {/* Conference Filter */}
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
              id="hfa_sort_select"
            >
              <option value="RANK">Backend Rank</option>
              <option value="HIGHEST">Highest Home-Field Points</option>
              <option value="LOWEST">Lowest Home-Field Points</option>
              <option value="ALPHABETICAL">Alphabetical</option>
            </select>
          </div>

        </div>
      </div>

      {/* 4. TABLE AND DETAIL PANEL VIEW */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start" id="hfa_rankings_display_grid">
        
        {/* Table List Card */}
        <Card className={`xl:col-span-3 border border-slate-100 bg-white flex flex-col p-0 overflow-hidden transition-all duration-300 ${selectedTeam ? 'xl:col-span-3' : 'xl:col-span-4'}`} id="card_hfa_table">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-slate-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Home-Field Adjustments Log</h3>
            </div>
            <div className="text-[10px] text-slate-400 font-mono font-bold">
              Displaying {processedAdvantages.length} of {data.count} records
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50 font-mono text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-center w-14">Rank</th>
                  <th className="px-5 py-3">Team</th>
                  <th className="px-4 py-3">Conference</th>
                  <th className="px-4 py-3">Division</th>
                  <th className="px-4 py-3 text-right">Home-Field Points</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-mono">
                {processedAdvantages.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center space-y-2 text-slate-400">
                      <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="text-xs font-mono font-bold">No home-field records matched the current criteria.</p>
                    </td>
                  </tr>
                ) : (
                  processedAdvantages.map((record) => {
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
                        
                        {/* Team Column */}
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-900">
                              {record.team}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]" title={record.team_name || ''}>
                              {record.team_name || 'Not available'}
                            </span>
                          </div>
                        </td>

                        {/* Conference Column */}
                        <td className="px-4 py-3.5 font-bold text-slate-600">
                          {record.conference || 'Not available'}
                        </td>

                        {/* Division Column */}
                        <td className="px-4 py-3.5 text-slate-500">
                          {record.division || 'Not available'}
                        </td>

                        {/* Home-Field Points Column (Formatted to one decimal place) */}
                        <td className="px-4 py-3.5 text-right font-extrabold text-slate-950">
                          {formatPoints(record.home_field_points)}
                        </td>

                        {/* Source Column */}
                        <td className="px-4 py-3.5 text-slate-500 text-[11px] max-w-[100px] truncate" title={record.source_system}>
                          {record.source_system}
                        </td>

                        {/* Created Column */}
                        <td className="px-4 py-3.5 text-slate-400 text-[10px]">
                          {record.created_at ? new Date(record.created_at).toLocaleDateString() : 'Not available'}
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
          <div className="xl:col-span-1" id="hfa_detail_panel">
            <Card className="border border-slate-200 bg-white p-5 flex flex-col space-y-4 shadow-md sticky top-24" id="hfa_team_detail_card">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="bg-slate-900 text-white font-mono font-extrabold text-xs px-2.5 py-1 rounded">
                    {selectedTeam.team}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 font-mono truncate max-w-[120px]" title={selectedTeam.team_name || ''}>
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
                  </div>
                </div>

                {/* 2. Home-Field Model */}
                <div className="space-y-1.5">
                  <h5 className="text-[10px] font-extrabold text-slate-900 uppercase font-mono tracking-wider bg-slate-50 px-2 py-1 rounded">
                    Home-Field Model
                  </h5>
                  <div className="px-1">
                    {renderDetailField('Home-Field Points', selectedTeam.home_field_points, formatPoints)}
                    {renderDetailField('Source System', selectedTeam.source_system)}
                    {renderDetailField('Season', selectedTeam.season)}
                    {renderDetailField('Model Rank', selectedTeam.rank)}
                    {renderDetailField('Is Active', selectedTeam.is_active ? 'Yes' : 'No')}
                  </div>
                </div>

                {/* 3. Model Notes */}
                <div className="space-y-1.5">
                  <h5 className="text-[10px] font-extrabold text-slate-900 uppercase font-mono tracking-wider bg-slate-50 px-2 py-1 rounded">
                    Model Notes
                  </h5>
                  <div className="px-1 py-1 font-mono text-xs text-slate-600 bg-slate-50/50 rounded p-2 leading-relaxed whitespace-pre-wrap">
                    {selectedTeam.notes ? selectedTeam.notes : 'Not available'}
                  </div>
                </div>

                {/* 4. Source Metadata */}
                <div className="space-y-1.5">
                  <h5 className="text-[10px] font-extrabold text-slate-900 uppercase font-mono tracking-wider bg-slate-50 px-2 py-1 rounded">
                    Source Metadata
                  </h5>
                  <div className="px-1">
                    {renderDetailField('HFA ID', selectedTeam.home_field_advantage_id)}
                    {renderDetailField('Created At', selectedTeam.created_at, formatDateTime)}
                  </div>
                </div>

              </div>
              
            </Card>
          </div>
        )}

      </div>

      {/* 5. MODEL TRANSPARENCY & EDUCATIONAL GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="hfa_transparency_and_edu_grid">
        
        {/* Model Transparency Panel */}
        <Card className="lg:col-span-1 border border-slate-200 bg-white p-5 flex flex-col space-y-4 shadow-2xs" id="hfa_transparency_panel">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <ShieldCheck className="w-4 h-4 text-slate-800" />
            <h4 className="text-xs font-bold text-slate-900 font-mono uppercase tracking-wider">Model Transparency Panel</h4>
          </div>
          <div className="space-y-3.5 text-xs">
            <div className="flex flex-col gap-1 font-mono">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Current Source</span>
              <span className="font-bold text-slate-800">{firstSourceSystem}</span>
            </div>
            <div className="flex flex-col gap-1 font-mono">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Current Range</span>
              <span className="font-bold text-slate-800">
                {formatPoints(data.minimum_home_field_points)} pts to {formatPoints(data.maximum_home_field_points)} pts
              </span>
            </div>
            <div className="flex flex-col gap-1.5 font-mono">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Model Notes</span>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                The currently active values reflect the backend’s documented recalibration source.
              </p>
            </div>
          </div>
        </Card>

        {/* Educational Panel */}
        <Card className="lg:col-span-2 border border-slate-200 bg-white p-5 flex flex-col" id="hfa_education_panel">
          <button
            onClick={() => setEducationOpen(!educationOpen)}
            className="w-full flex items-center justify-between font-mono text-xs font-extrabold text-slate-800 uppercase tracking-wider py-1 cursor-pointer focus:outline-none"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-500" />
              <span>How SemiSharp Uses Home-Field Advantage</span>
            </div>
            {educationOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {educationOpen ? (
            <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600 leading-relaxed max-w-3xl space-y-4">
              <p>
                Home-field advantage represents the point adjustment assigned to a team when it plays at home. SemiSharp combines this value with team power ratings, quarterback ratings, team health, schedule context, and other analytical inputs when producing projected spreads.
              </p>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-slate-500 flex gap-2 items-start font-mono text-[11px]">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>Neutral-site games receive no home-field adjustment through the backend projection process.</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 font-sans italic mt-3">
              Click to expand the guide details on how home-field point adjustments are structured within the modeling system.
            </p>
          )}
        </Card>

      </div>

    </div>
  );
};
