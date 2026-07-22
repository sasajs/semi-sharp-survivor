/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { analysisApi } from '../services/analysisApi';
import { GameAnalysis, WeeklyAnalysisResponse } from '../types/analysis';
import { Card, LoadingSpinner, Alert, Button } from './ui';
import { RiskDisplay } from './RiskDisplay';
import { SportsbookTableV2 } from './weekly_analysis/SportsbookTableV2';
import { 
  Database, 
  RefreshCw, 
  Search, 
  ArrowUpDown, 
  Calendar, 
  Clock, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  TrendingUp, 
  ShieldAlert, 
  Award, 
  Eye, 
  X,
  SlidersHorizontal,
  CheckCircle2,
  BarChart2
} from 'lucide-react';

interface MarketEdgeProps {
  season: number;
  week: number;
}

type SortOption = 
  | 'kickoff'
  | 'edge-desc'
  | 'diff-desc'
  | 'winprob-desc'
  | 'risk-desc'
  | 'books-desc';

type RiskFilter = 'ALL' | 'HIGH' | 'MODERATE' | 'LOW';

export const MarketEdge: React.FC<MarketEdgeProps> = ({ season: initialSeason, week: initialWeek }) => {
  const [selectedSeason, setSelectedSeason] = useState<number>(initialSeason);
  const [selectedWeek, setSelectedWeek] = useState<number>(initialWeek);

  const [data, setData] = useState<WeeklyAnalysisResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('ALL');
  const [minWinProb, setMinWinProb] = useState<number>(0);
  const [minEdge, setMinEdge] = useState<number>(0);
  const [sortBy, setSortBy] = useState<SortOption>('kickoff');

  // Accordion state for viewing sportsbooks
  const [expandedGameId, setExpandedGameId] = useState<string | null>(null);

  // Sync props if parent changes
  useEffect(() => {
    setSelectedSeason(initialSeason);
    setSelectedWeek(initialWeek);
  }, [initialSeason, initialWeek]);

  // Master Data Fetcher
  const fetchData = useCallback(async (isSilent = false) => {
    if (isSilent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await analysisApi.getWeeklyAnalysis(selectedSeason, selectedWeek);
      setData(response);
    } catch (err: any) {
      console.error('Error fetching market comparison analysis:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to sync with SemiSharp Market Analysis API.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSeason, selectedWeek]);

  useEffect(() => {
    fetchData();
  }, [selectedSeason, selectedWeek, fetchData]);

  const handleToggleExpand = (gameId: string) => {
    setExpandedGameId(prev => (prev === gameId ? null : gameId));
  };

  // Helper function to extract normalized metrics for a game row
  const getGameMetrics = (g: GameAnalysis) => {
    const awayAbbr = g.away_team?.team_abbr || 'AWAY';
    const homeAbbr = g.home_team?.team_abbr || 'HOME';

    // 1. Consensus Line
    let consensusFav = 'PK';
    let consensusSpreadVal = 0;
    if (g.market.home_consensus_spread < 0) {
      consensusFav = homeAbbr;
      consensusSpreadVal = Math.abs(g.market.home_consensus_spread);
    } else if (g.market.away_consensus_spread < 0) {
      consensusFav = awayAbbr;
      consensusSpreadVal = Math.abs(g.market.away_consensus_spread);
    } else if (g.market.home_consensus_spread > 0) {
      consensusFav = awayAbbr;
      consensusSpreadVal = g.market.home_consensus_spread;
    } else if (g.market.away_consensus_spread > 0) {
      consensusFav = homeAbbr;
      consensusSpreadVal = g.market.away_consensus_spread;
    }

    const consensusText = consensusFav === 'PK' 
      ? 'PK' 
      : `${consensusFav} -${consensusSpreadVal.toFixed(1)}`;

    // 2. SemiSharp Projection
    const projectedFav = g.semisharp_projection.projected_favorite_abbr || 
      (g.semisharp_projection.projected_home_margin >= 0 ? homeAbbr : awayAbbr);
    const projectedSpreadVal = Math.abs(g.semisharp_projection.projected_spread || 0);
    const semisharpText = projectedSpreadVal === 0 
      ? 'PK' 
      : `${projectedFav} -${projectedSpreadVal.toFixed(1)}`;

    // 3. Difference / Edge
    let edgePoints = 0;
    if (projectedFav === awayAbbr) {
      edgePoints = g.market.away_edge?.edge_points ?? 0;
    } else {
      edgePoints = g.market.home_edge?.edge_points ?? 0;
    }

    const absDiff = Math.abs(edgePoints);

    // 4. Win Probability
    let winProbRaw: number | null = null;
    if (projectedFav === homeAbbr || g.market.home_consensus_spread < 0) {
      winProbRaw = g.semisharp_projection.home_win_probability;
    } else {
      winProbRaw = g.semisharp_projection.away_win_probability;
    }

    let winProbPct = 0;
    let formattedWinProb = 'N/A';
    if (winProbRaw != null && !isNaN(winProbRaw)) {
      winProbPct = winProbRaw <= 1 ? winProbRaw * 100 : winProbRaw;
      formattedWinProb = `${winProbPct.toFixed(1)}%`;
    }

    // 5. Risk
    const isHomeFav = projectedFav === homeAbbr || g.market.home_consensus_spread < 0;
    const favRisk = isHomeFav ? g.risk.home : g.risk.away;
    const riskScore = favRisk?.score ?? (isHomeFav ? g.risk.home?.score : g.risk.away?.score) ?? 0;
    const riskLevel = favRisk?.level ?? (riskScore >= 15 ? 'HIGH' : riskScore >= 10 ? 'ELEVATED' : riskScore >= 5 ? 'MODERATE' : 'LOW');

    return {
      awayAbbr,
      homeAbbr,
      consensusFav,
      consensusSpreadVal,
      consensusText,
      projectedFav,
      projectedSpreadVal,
      semisharpText,
      edgePoints,
      absDiff,
      winProbRaw,
      winProbPct,
      formattedWinProb,
      riskScore: riskScore || 0,
      riskLevel,
      sportsbookCount: g.market.sportsbook_count || 0,
    };
  };

  // Filtered and Sorted Games
  const processedGames = useMemo(() => {
    if (!data?.games) return [];

    let result = [...data.games];

    // Search Filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(g => {
        const awayName = (g.away_team?.team_name || '').toLowerCase();
        const awayAbbr = (g.away_team?.team_abbr || '').toLowerCase();
        const homeName = (g.home_team?.team_name || '').toLowerCase();
        const homeAbbr = (g.home_team?.team_abbr || '').toLowerCase();
        return awayName.includes(q) || awayAbbr.includes(q) || homeName.includes(q) || homeAbbr.includes(q);
      });
    }

    // Risk Filter
    if (riskFilter !== 'ALL') {
      result = result.filter(g => {
        const m = getGameMetrics(g);
        if (riskFilter === 'HIGH') return m.riskScore >= 15 || m.riskLevel === 'HIGH';
        if (riskFilter === 'MODERATE') return m.riskScore >= 5 && m.riskScore < 15;
        if (riskFilter === 'LOW') return m.riskScore < 5;
        return true;
      });
    }

    // Minimum Win Probability Filter
    if (minWinProb > 0) {
      result = result.filter(g => {
        const m = getGameMetrics(g);
        return m.winProbPct >= minWinProb;
      });
    }

    // Minimum Absolute Edge Filter
    if (minEdge > 0) {
      result = result.filter(g => {
        const m = getGameMetrics(g);
        return m.absDiff >= minEdge;
      });
    }

    // Sort
    result.sort((a, b) => {
      const mA = getGameMetrics(a);
      const mB = getGameMetrics(b);

      switch (sortBy) {
        case 'edge-desc':
          return mB.edgePoints - mA.edgePoints;
        case 'diff-desc':
          return mB.absDiff - mA.absDiff;
        case 'winprob-desc':
          return mB.winProbPct - mA.winProbPct;
        case 'risk-desc':
          return mB.riskScore - mA.riskScore;
        case 'books-desc':
          return mB.sportsbookCount - mA.sportsbookCount;
        case 'kickoff':
        default:
          return (a.gametime || a.gameday || '').localeCompare(b.gametime || b.gameday || '');
      }
    });

    return result;
  }, [data, searchTerm, riskFilter, minWinProb, minEdge, sortBy]);

  // Summary Cards Calculations
  const summaryCards = useMemo(() => {
    if (!data?.games || data.games.length === 0) {
      return {
        gamesEvaluated: 0,
        largestDiffText: 'N/A',
        highestWinProbText: 'N/A',
        highestRiskText: 'N/A',
        avgBooksText: '0',
      };
    }

    let maxDiff = -1;
    let maxDiffGame = '';

    let maxWinProb = -1;
    let maxWinProbTeam = '';

    let maxRisk = -1;
    let maxRiskTeam = '';

    let totalBooks = 0;

    data.games.forEach(g => {
      const m = getGameMetrics(g);
      totalBooks += m.sportsbookCount;

      if (m.absDiff > maxDiff) {
        maxDiff = m.absDiff;
        maxDiffGame = `${m.projectedFav} (${m.absDiff > 0 ? '+' : ''}${m.absDiff.toFixed(1)} pts)`;
      }

      if (m.winProbPct > maxWinProb) {
        maxWinProb = m.winProbPct;
        maxWinProbTeam = `${m.projectedFav} (${m.winProbPct.toFixed(1)}%)`;
      }

      if (m.riskScore > maxRisk) {
        maxRisk = m.riskScore;
        maxRiskTeam = `${m.projectedFav} (${m.riskScore.toFixed(1)})`;
      }
    });

    const avgBooks = (totalBooks / data.games.length).toFixed(1);

    return {
      gamesEvaluated: data.games.length,
      largestDiffText: maxDiff >= 0 ? maxDiffGame : 'N/A',
      highestWinProbText: maxWinProb >= 0 ? maxWinProbTeam : 'N/A',
      highestRiskText: maxRisk >= 0 ? maxRiskTeam : 'N/A',
      avgBooksText: avgBooks,
    };
  }, [data]);

  return (
    <div className="space-y-6 animate-fade-in font-sans" id="market_comparison_container">
      
      {/* 1. EXPLANATION BANNER */}
      <div className="p-4 bg-slate-900 text-white border border-slate-800 rounded-2xl shadow-3xs flex items-start gap-3.5">
        <div className="p-2.5 bg-slate-800 text-indigo-400 rounded-xl shrink-0 mt-0.5">
          <Database className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider">
            Market Comparison & Win Probability
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">
            Market Comparison shows how current sportsbook lines compare with SemiSharp's projected spread. It also displays the model's win probability and risk assessment for each matchup.
          </p>
        </div>
      </div>

      {/* 2. SUMMARY CARDS */}
      {!loading && !error && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3" id="market_summary_cards">
          
          {/* Card 1: Games Evaluated */}
          <Card className="border border-slate-200/80 bg-white p-4" id="card_market_games_evaluated">
            <div className="flex flex-col justify-between h-full">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
                Games Evaluated
              </span>
              <div className="py-2">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {summaryCards.gamesEvaluated}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                Season {selectedSeason} • Week {selectedWeek}
              </span>
            </div>
          </Card>

          {/* Card 2: Largest Market Difference */}
          <Card className="border border-slate-200/80 bg-white p-4" id="card_largest_market_difference">
            <div className="flex flex-col justify-between h-full">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
                Largest Market Diff
              </span>
              <div className="py-2">
                <span className="text-lg font-black text-slate-900 font-mono truncate block">
                  {summaryCards.largestDiffText}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                Max model vs consensus gap
              </span>
            </div>
          </Card>

          {/* Card 3: Highest Win Probability */}
          <Card className="border border-slate-200/80 bg-white p-4" id="card_highest_win_prob">
            <div className="flex flex-col justify-between h-full">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
                Highest Win Prob
              </span>
              <div className="py-2">
                <span className="text-lg font-black text-emerald-700 font-mono truncate block">
                  {summaryCards.highestWinProbText}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                Peak win probability
              </span>
            </div>
          </Card>

          {/* Card 4: Highest Risk Matchup */}
          <Card className="border border-slate-200/80 bg-white p-4" id="card_highest_risk_matchup">
            <div className="flex flex-col justify-between h-full">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
                Highest Risk Matchup
              </span>
              <div className="py-2">
                <span className="text-lg font-black text-rose-700 font-mono truncate block">
                  {summaryCards.highestRiskText}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                Most fragile favorite
              </span>
            </div>
          </Card>

          {/* Card 5: Average Active Books */}
          <Card className="border border-slate-200/80 bg-white p-4 col-span-2 md:col-span-1" id="card_avg_active_books">
            <div className="flex flex-col justify-between h-full">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
                Average Active Books
              </span>
              <div className="py-2">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {summaryCards.avgBooksText}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                Books per game
              </span>
            </div>
          </Card>

        </div>
      )}

      {/* 3. FILTERS & CONTROLS TOOLBAR */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-3xs space-y-4" id="market_controls_panel">
        
        {/* Top Row Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search team name, abbreviation, or matchup..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all font-mono"
              id="input_market_search"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Season, Week, Refresh */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Season Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs font-mono">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Season:</span>
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(Number(e.target.value))}
                className="bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                id="select_market_season"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
                <option value={2024}>2024</option>
              </select>
            </div>

            {/* Week Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs font-mono">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Week:</span>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                className="bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                id="select_market_week"
              >
                {Array.from({ length: 18 }, (_, i) => i + 1).map((w) => (
                  <option key={w} value={w}>Week {w}</option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchData(true)}
              disabled={refreshing || loading}
              className="font-mono text-xs font-bold border-slate-200 bg-white"
              id="btn_refresh_market_data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Secondary Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 font-mono">
              <span className="font-bold text-slate-400 uppercase text-[10px]">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 rounded-xl px-2.5 py-1 focus:outline-hidden cursor-pointer"
                id="select_market_sort"
              >
                <option value="kickoff">Kickoff Time (Default)</option>
                <option value="edge-desc">Largest Positive Edge</option>
                <option value="diff-desc">Largest Absolute Difference</option>
                <option value="winprob-desc">Highest Win Probability</option>
                <option value="risk-desc">Highest Risk Score</option>
                <option value="books-desc">Most Sportsbooks</option>
              </select>
            </div>

            {/* Risk Filter */}
            <div className="flex items-center gap-1.5 font-mono">
              <span className="font-bold text-slate-400 uppercase text-[10px]">Risk:</span>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value as RiskFilter)}
                className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 rounded-xl px-2.5 py-1 focus:outline-hidden cursor-pointer"
                id="select_market_risk_filter"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="HIGH">High Risk Only (&ge;15)</option>
                <option value="MODERATE">Moderate Risk (&ge;5)</option>
                <option value="LOW">Low Risk Only (&lt;5)</option>
              </select>
            </div>

            {/* Minimum Win Probability Filter */}
            <div className="flex items-center gap-1.5 font-mono">
              <span className="font-bold text-slate-400 uppercase text-[10px]">Min Win Prob:</span>
              <select
                value={minWinProb}
                onChange={(e) => setMinWinProb(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 rounded-xl px-2.5 py-1 focus:outline-hidden cursor-pointer"
                id="select_market_winprob_filter"
              >
                <option value={0}>All Probabilities</option>
                <option value={50}>50%+ Win Prob</option>
                <option value={60}>60%+ Win Prob</option>
                <option value={70}>70%+ Win Prob</option>
                <option value={80}>80%+ Win Prob</option>
              </select>
            </div>

            {/* Minimum Absolute Edge Filter */}
            <div className="flex items-center gap-1.5 font-mono">
              <span className="font-bold text-slate-400 uppercase text-[10px]">Min Edge:</span>
              <select
                value={minEdge}
                onChange={(e) => setMinEdge(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 rounded-xl px-2.5 py-1 focus:outline-hidden cursor-pointer"
                id="select_market_edge_filter"
              >
                <option value={0}>All Edges</option>
                <option value={0.5}>0.5+ pts</option>
                <option value={1.0}>1.0+ pts</option>
                <option value={2.0}>2.0+ pts</option>
                <option value={3.0}>3.0+ pts</option>
              </select>
            </div>

          </div>

          <div className="text-[11px] font-mono text-slate-400 font-bold">
            Showing <span className="text-slate-900 font-black">{processedGames.length}</span> of {data?.games?.length || 0} Games
          </div>

        </div>
      </div>

      {/* 4. COMPACT WEEKLY GAME TABLE */}
      <Card className="bg-white border border-slate-200/85 rounded-2xl shadow-3xs overflow-hidden" id="card_market_comparison_table">
        
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
              Weekly Market vs. SemiSharp Projection Matrix
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono font-bold">
            NFL {selectedSeason} • Week {selectedWeek}
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <LoadingSpinner size="md" message={`Loading market comparison metrics for Season ${selectedSeason} Week ${selectedWeek}...`} />
          </div>
        ) : error ? (
          <div className="p-6">
            <Alert type="warning" title="Market Analysis Error" message={error} />
            <div className="mt-4 text-center">
              <Button size="sm" onClick={() => fetchData()} variant="outline">
                Retry Connection
              </Button>
            </div>
          </div>
        ) : processedGames.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Database className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No Matchups Found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No games match your current filter or search selections.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="tbl_market_comparison">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider font-mono">
                  <th className="py-3 px-4">Matchup</th>
                  <th className="py-3 px-4">Consensus Line</th>
                  <th className="py-3 px-4">SemiSharp Line</th>
                  <th className="py-3 px-4">Market Edge</th>
                  <th className="py-3 px-4">Win Probability</th>
                  <th className="py-3 px-4">Risk</th>
                  <th className="py-3 px-4 text-center">Books Used</th>
                  <th className="py-3 px-4 text-right">Sportsbooks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
                {processedGames.map((game) => {
                  const m = getGameMetrics(game);
                  const isExpanded = expandedGameId === game.game_id;

                  // Edge color styling
                  let edgeBadgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (m.edgePoints >= 0.5) {
                    edgeBadgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
                  } else if (m.edgePoints <= -0.5) {
                    edgeBadgeClass = 'bg-rose-50 text-rose-800 border-rose-200/80';
                  }

                  return (
                    <React.Fragment key={game.game_id}>
                      <tr className={`hover:bg-slate-50/80 transition-colors ${isExpanded ? 'bg-slate-50/90' : ''}`}>
                        
                        {/* 1. Matchup */}
                        <td className="py-3.5 px-4 font-mono">
                          <div className="flex flex-col">
                            <span className="font-extrabold text-slate-900 text-sm tracking-tight">
                              {m.awayAbbr} @ {m.homeAbbr}
                            </span>
                            <span className="text-[10px] text-slate-500 font-sans font-medium">
                              {game.gameday ? `${game.gameday} ${game.gametime || ''}` : game.game_id}
                            </span>
                          </div>
                        </td>

                        {/* 2. Consensus Line */}
                        <td className="py-3.5 px-4 font-mono">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 text-xs">
                              {m.consensusText}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">
                              Books: {m.sportsbookCount}
                            </span>
                          </div>
                        </td>

                        {/* 3. SemiSharp Line */}
                        <td className="py-3.5 px-4 font-mono">
                          <div className="flex flex-col">
                            <span className="font-black text-indigo-950 text-xs">
                              {m.semisharpText}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">
                              Model Spread
                            </span>
                          </div>
                        </td>

                        {/* 4. Difference / Edge */}
                        <td className="py-3.5 px-4 font-mono">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-black border ${edgeBadgeClass}`}>
                            {m.edgePoints > 0 ? `+${m.edgePoints.toFixed(1)}` : m.edgePoints.toFixed(1)} pts
                          </span>
                        </td>

                        {/* 5. Win Probability */}
                        <td className="py-3.5 px-4 font-mono">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 text-xs">
                              {m.formattedWinProb}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">
                              {m.projectedFav} Win Prob
                            </span>
                          </div>
                        </td>

                        {/* 6. Risk */}
                        <td className="py-3.5 px-4 font-mono">
                          <div className="flex flex-col items-start gap-1">
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                              m.riskLevel === 'HIGH' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              m.riskLevel === 'ELEVATED' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                              m.riskLevel === 'MODERATE' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {m.riskLevel}
                            </span>
                            <span className="text-xs font-black text-slate-900 leading-none">
                              {m.riskScore.toFixed(1)}
                            </span>
                          </div>
                        </td>

                        {/* 7. Books Used */}
                        <td className="py-3.5 px-4 text-center font-mono font-extrabold text-slate-900">
                          {m.sportsbookCount}
                        </td>

                        {/* 8. View Sportsbooks */}
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            size="sm"
                            variant={isExpanded ? 'secondary' : 'outline'}
                            onClick={() => handleToggleExpand(game.game_id)}
                            className="font-mono text-xs font-bold border-slate-200 hover:bg-slate-100"
                            id={`btn_view_sportsbooks_${game.game_id}`}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
                            {isExpanded ? 'Hide Lines' : 'View Sportsbooks'}
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
                          </Button>
                        </td>

                      </tr>

                      {/* Expanded Sportsbook Detail Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 border-b border-slate-200">
                          <td colSpan={8} className="p-4 sm:p-6">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                                <span className="text-xs font-bold text-slate-900 font-mono uppercase flex items-center gap-1.5">
                                  <Database className="w-4 h-4 text-slate-700" />
                                  Individual Sportsbook Lines: {m.awayAbbr} @ {m.homeAbbr}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono font-bold">
                                  Authoritative Consensus Books: {m.sportsbookCount}
                                </span>
                              </div>

                              <SportsbookTableV2
                                sportsbooks={game.market.sportsbooks || []}
                                market={game.market}
                                favoriteAbbr={m.projectedFav}
                                awayAbbr={m.awayAbbr}
                                homeAbbr={m.homeAbbr}
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

    </div>
  );
};
