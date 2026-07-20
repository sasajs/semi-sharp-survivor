import React, { useState, useEffect } from 'react';
import { SemiSharpApi } from '../api';
import { GameMatchup } from '../types';
import { Card, LoadingSpinner, Alert } from './ui';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  MapPin, 
  RefreshCw, 
  Search, 
  Clock, 
  AlertOctagon, 
  Zap, 
  Scale, 
  TrendingUp, 
  AlertTriangle, 
  Database,
  ChevronDown,
  ChevronUp,
  Star
} from 'lucide-react';

interface WeeklyGameAnalysisProps {
  season: number;
  week: number;
}

export const WeeklyGameAnalysis: React.FC<WeeklyGameAnalysisProps> = ({ season, week }) => {
  const { selectedEntry } = useAuth();
  const [games, setGames] = useState<GameMatchup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeEndpoint, setActiveEndpoint] = useState<string>('');

  // Projections and Win Probabilities states
  const [projections, setProjections] = useState<Record<string, any>>({});
  const [loadingProjections, setLoadingProjections] = useState<boolean>(true);
  const [errorProjections, setErrorProjections] = useState<string | null>(null);

  const [probabilities, setProbabilities] = useState<Record<string, any>>({});
  const [loadingProbabilities, setLoadingProbabilities] = useState<boolean>(true);
  const [errorProbabilities, setErrorProbabilities] = useState<string | null>(null);

  // Teams Mapping, Risks, Market Edge, and Methodology states
  const [teamsMap, setTeamsMap] = useState<Record<string, number>>({});

  const [risks, setRisks] = useState<Record<string, any>>({});
  const [loadingRisks, setLoadingRisks] = useState<boolean>(true);
  const [errorRisks, setErrorRisks] = useState<string | null>(null);

  const [marketEdges, setMarketEdges] = useState<Record<string, any>>({});
  const [loadingMarketEdges, setLoadingMarketEdges] = useState<boolean>(true);
  const [errorMarketEdges, setErrorMarketEdges] = useState<string | null>(null);

  const [methodology, setMethodology] = useState<any>(null);
  const [loadingMethodology, setLoadingMethodology] = useState<boolean>(true);
  const [errorMethodology, setErrorMethodology] = useState<string | null>(null);
  const [isMethodologyExpanded, setIsMethodologyExpanded] = useState<boolean>(false);

  const fetchSchedule = async () => {
    setLoading(true);
    setError(null);
    
    // Construct endpoints for indicator
    const endpoint = `/schedule/${season}/${week}`;
    
    try {
      setActiveEndpoint(`GET ${endpoint}`);
      const response = await SemiSharpApi.getSchedule(season, week);
      
      if (response && response.games) {
        setGames(response.games);
      } else if (response && (response as any).schedule) {
        setGames((response as any).schedule);
      } else {
        setGames([]);
      }
    } catch (err: any) {
      console.error('Error fetching weekly game analysis schedule:', err);
      let errorDetails = 'Network/API connection failed';
      if (err instanceof Error) {
        errorDetails = err.message;
      } else if (err && typeof err === 'object') {
        errorDetails = err.detail || err.message || JSON.stringify(err);
      } else if (err) {
        errorDetails = String(err);
      }
      setError(errorDetails);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectionsOnly = async () => {
    setLoadingProjections(true);
    setErrorProjections(null);
    try {
      const response = await SemiSharpApi.getProjections(season, week);
      if (response && response.games) {
        const projMap: Record<string, any> = {};
        response.games.forEach((g) => {
          projMap[g.game_id] = g;
        });
        setProjections(projMap);
      } else {
        setProjections({});
      }
    } catch (err: any) {
      console.error('Error fetching projections:', err);
      let errorDetails = 'Projection data failed to load';
      if (err instanceof Error) {
        errorDetails = err.message;
      } else if (err && typeof err === 'object') {
        errorDetails = err.detail || err.message || JSON.stringify(err);
      }
      setErrorProjections(errorDetails);
    } finally {
      setLoadingProjections(false);
    }
  };

  const fetchProbabilitiesOnly = async () => {
    setLoadingProbabilities(true);
    setErrorProbabilities(null);
    try {
      const format = selectedEntry?.format_code || 'STANDARD';
      const response = await SemiSharpApi.getStrategyHighestWin(season, format);
      if (response && response.recommendations) {
        const probMap: Record<string, any> = {};
        response.recommendations.forEach((rec: any) => {
          const key = `${rec.game_id}_${rec.team}`;
          probMap[key] = rec;
        });
        setProbabilities(probMap);
      } else {
        setProbabilities({});
      }
    } catch (err: any) {
      console.error('Error fetching win probabilities:', err);
      let errorDetails = 'Probability data failed to load';
      if (err instanceof Error) {
        errorDetails = err.message;
      } else if (err && typeof err === 'object') {
        errorDetails = err.detail || err.message || JSON.stringify(err);
      }
      setErrorProbabilities(errorDetails);
    } finally {
      setLoadingProbabilities(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await SemiSharpApi.getTeams();
      if (response && response.teams) {
        const mapping: Record<string, number> = {};
        response.teams.forEach((t: any) => {
          const abbr = t.team_abbr || t.abbr;
          const id = t.team_id || t.id;
          if (abbr && id) {
            mapping[abbr] = id;
          }
        });
        setTeamsMap(mapping);
        return mapping;
      }
    } catch (err) {
      console.error('Error fetching teams mapping:', err);
    }
    return {};
  };

  const fetchRisksOnly = async (tMap?: Record<string, number>) => {
    setLoadingRisks(true);
    setErrorRisks(null);
    try {
      const response = await SemiSharpApi.getRisk(season, week);
      if (response && response.risks) {
        let currentTeamsMap = tMap || teamsMap;
        if (Object.keys(currentTeamsMap).length === 0) {
          currentTeamsMap = await fetchTeams();
        }

        const rMap: Record<string, any> = {};
        response.risks.forEach((r: any) => {
          const teamId = currentTeamsMap[r.team];
          if (teamId !== undefined) {
            const key = `${r.game_id}_${teamId}`;
            rMap[key] = r;
          } else {
            const key = `${r.game_id}_${r.team}`;
            rMap[key] = r;
          }
        });
        setRisks(rMap);
      } else {
        setRisks({});
      }
    } catch (err: any) {
      console.error('Error fetching risk ratings:', err);
      let errorDetails = 'Risk data failed to load';
      if (err instanceof Error) {
        errorDetails = err.message;
      } else if (err && typeof err === 'object') {
        errorDetails = err.detail || err.message || JSON.stringify(err);
      }
      setErrorRisks(errorDetails);
    } finally {
      setLoadingRisks(false);
    }
  };

  const fetchMarketEdgesOnly = async (tMap?: Record<string, number>) => {
    setLoadingMarketEdges(true);
    setErrorMarketEdges(null);
    try {
      const response = await SemiSharpApi.getProjectionEdge(season, week);
      if (response && response.projection_edges) {
        let currentTeamsMap = tMap || teamsMap;
        if (Object.keys(currentTeamsMap).length === 0) {
          currentTeamsMap = await fetchTeams();
        }

        const mMap: Record<string, any> = {};
        response.projection_edges.forEach((m: any) => {
          const teamId = currentTeamsMap[m.team];
          if (teamId !== undefined) {
            const key = `${m.game_id}_${teamId}`;
            mMap[key] = m;
          } else {
            const key = `${m.game_id}_${m.team}`;
            mMap[key] = m;
          }
        });
        setMarketEdges(mMap);
      } else {
        setMarketEdges({});
      }
    } catch (err: any) {
      console.error('Error fetching market edge:', err);
      let errorDetails = 'Market data failed to load';
      if (err instanceof Error) {
        errorDetails = err.message;
      } else if (err && typeof err === 'object') {
        errorDetails = err.detail || err.message || JSON.stringify(err);
      }
      setErrorMarketEdges(errorDetails);
    } finally {
      setLoadingMarketEdges(false);
    }
  };

  const fetchMethodologyOnly = async () => {
    setLoadingMethodology(true);
    setErrorMethodology(null);
    try {
      const response = await SemiSharpApi.getRiskMethodology();
      if (response) {
        setMethodology(response);
      } else {
        setMethodology(null);
      }
    } catch (err: any) {
      console.error('Error fetching risk methodology:', err);
      let errorDetails = 'Methodology data failed to load';
      if (err instanceof Error) {
        errorDetails = err.message;
      } else if (err && typeof err === 'object') {
        errorDetails = err.detail || err.message || JSON.stringify(err);
      }
      setErrorMethodology(errorDetails);
    } finally {
      setLoadingMethodology(false);
    }
  };

  const handleRefresh = async () => {
    const tMap = await fetchTeams();
    await Promise.all([
      fetchSchedule(),
      fetchProjectionsOnly(),
      fetchProbabilitiesOnly(),
      fetchRisksOnly(tMap),
      fetchMarketEdgesOnly(tMap),
      fetchMethodologyOnly()
    ]);
  };

  // Load team map on mount once
  useEffect(() => {
    fetchTeams();
  }, []);

  // We load schedule, projections, win probabilities, risk, and methodology on mount/season/week change.
  // Changing the selected entry updates the header info but does not refetch the games.
  useEffect(() => {
    fetchSchedule();
    fetchProjectionsOnly();
    fetchProbabilitiesOnly();
    fetchRisksOnly();
    fetchMarketEdgesOnly();
    fetchMethodologyOnly();
  }, [season, week]);

  // Refetch format-specific probabilities when selected entry format code changes
  useEffect(() => {
    fetchProbabilitiesOnly();
  }, [selectedEntry?.format_code]);

  // Scroll to section when navigated from dashboard
  useEffect(() => {
    const scrollTarget = sessionStorage.getItem('scroll_target_section');
    if (scrollTarget) {
      // Wait for all data to finish loading
      if (!loading && !loadingProjections && !loadingProbabilities && !loadingRisks && !loadingMarketEdges) {
        const timer = setTimeout(() => {
          const element = document.querySelector(`.analytical-${scrollTarget}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-2', 'ring-indigo-500/50', 'ring-offset-2', 'transition-all');
            const highlightTimer = setTimeout(() => {
              element.classList.remove('ring-2', 'ring-indigo-500/50', 'ring-offset-2');
              sessionStorage.removeItem('scroll_target_section');
            }, 3000);
            return () => clearTimeout(highlightTimer);
          } else {
            sessionStorage.removeItem('scroll_target_section');
          }
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, loadingProjections, loadingProbabilities, loadingRisks, loadingMarketEdges]);

  const formatGameDate = (dateStr: string, timeStr?: string) => {
    if (!dateStr) return 'TBD';
    try {
      const combinedStr = timeStr ? `${dateStr}T${timeStr}` : dateStr;
      const date = new Date(combinedStr);
      if (isNaN(date.getTime())) {
        return timeStr ? `${dateStr} ${timeStr}` : dateStr;
      }
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: timeStr ? 'numeric' : undefined,
        minute: timeStr ? '2-digit' : undefined,
        timeZoneName: timeStr ? 'short' : undefined,
      });
    } catch {
      return timeStr ? `${dateStr} ${timeStr}` : dateStr;
    }
  };

  // Filter games based on team name or game ID
  const filteredGames = games.filter(game => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    
    const gameIdMatch = game.game_id.toLowerCase().includes(query);
    const awayMatch = game.away_team?.toLowerCase().includes(query) || false;
    const homeMatch = game.home_team?.toLowerCase().includes(query) || false;
    
    return gameIdMatch || awayMatch || homeMatch;
  });

  return (
    <div className="space-y-6">
      {/* Active Backend Context Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase font-mono">ACTIVE BACKEND CONTEXT</span>
            <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md uppercase tracking-wider font-mono">
              LIVE
            </span>
          </div>
          <h3 className="text-xs font-semibold text-slate-400">Review every current-week matchup in one unified analytical workspace.</h3>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 md:gap-8">
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Season</span>
            <span className="text-xs font-extrabold text-slate-100 font-sans">{season} NFL</span>
          </div>
          <div className="h-6 w-px bg-slate-800 hidden sm:block" />
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">NFL Week</span>
            <span className="text-xs font-extrabold text-slate-100 font-sans">Week {week}</span>
          </div>
          <div className="h-6 w-px bg-slate-800 hidden sm:block" />
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Active Entry</span>
            <span className="text-xs font-extrabold text-slate-100 font-sans">
              {selectedEntry?.entry_label || 'No Active Entry'}
            </span>
          </div>
          <div className="h-6 w-px bg-slate-800 hidden sm:block" />
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Contest Format</span>
            <span className="text-xs font-extrabold text-slate-100 font-sans">
              {selectedEntry?.format_name || 'No Format Assigned'}
            </span>
          </div>
        </div>
      </div>

      {/* Search and Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by team code or game ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl outline-none focus:border-slate-900 focus:bg-white transition-colors"
          />
        </div>
        
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {activeEndpoint && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono bg-slate-50 border border-slate-100 px-2 py-1 rounded-md">
              {activeEndpoint}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={loading || loadingProjections || loadingProbabilities || loadingRisks || loadingMarketEdges || loadingMethodology}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-slate-50 border border-slate-200/80 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading || loadingProjections || loadingProbabilities || loadingRisks || loadingMarketEdges || loadingMethodology ? 'animate-spin' : ''}`} />
            Refresh Games
          </button>
        </div>
      </div>

      {/* Risk Methodology - Collapsed by default */}
      <Card className="border border-slate-100 shadow-3xs bg-white overflow-hidden">
        <button
          type="button"
          onClick={() => setIsMethodologyExpanded(!isMethodologyExpanded)}
          className="w-full flex items-center justify-between p-4 text-left font-sans hover:bg-slate-50 transition-colors focus:outline-none cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide font-mono">
                Risk Methodology
              </h4>
              <p className="text-[10px] text-slate-500 font-medium">
                Learn about the factors driving the upset & risk index calculations.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {methodology && (
              <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                {methodology.version}
              </span>
            )}
            {isMethodologyExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </button>

        {isMethodologyExpanded && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-4 text-xs">
            {loadingMethodology ? (
              <div className="flex items-center gap-2 text-slate-400 py-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                <span className="font-medium text-[11px]">Fetching risk methodology...</span>
              </div>
            ) : errorMethodology ? (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-between">
                <span className="text-[11px] text-rose-600 font-medium">
                  {errorMethodology}
                </span>
                <button
                  onClick={fetchMethodologyOnly}
                  className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-[10px] font-bold transition-colors cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : methodology ? (
              <div className="space-y-4">
                <p className="text-slate-600 leading-relaxed font-medium">
                  {methodology.description}
                </p>

                {methodology.historical_basis && (
                  <div className="p-3 bg-white border border-slate-100 rounded-xl grid grid-cols-3 gap-4 text-center">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                        Seasons
                      </span>
                      <span className="text-xs font-extrabold text-slate-800 font-sans">
                        {methodology.historical_basis.seasons}
                      </span>
                    </div>
                    <div className="border-x border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                        Games Analyzed
                      </span>
                      <span className="text-xs font-extrabold text-slate-800 font-sans">
                        {methodology.historical_basis.games_analyzed?.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                        Baseline Upset Rate
                      </span>
                      <span className="text-xs font-extrabold text-indigo-600 font-sans">
                        {methodology.historical_basis.baseline_upset_rate}%
                      </span>
                    </div>
                  </div>
                )}

                {methodology.primary_factors && methodology.primary_factors.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                      Primary Risk Factors
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {methodology.primary_factors.map((factor: any, index: number) => (
                        <div key={index} className="p-3 bg-white border border-slate-100 rounded-xl space-y-1">
                          <span className="text-xs font-black text-slate-800 block">
                            {factor.name}
                          </span>
                          <p className="text-[10px] text-slate-500 leading-relaxed">
                            {factor.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <span className="text-slate-400 italic block">
                Methodology details are temporarily unavailable.
              </span>
            )}
          </div>
        )}
      </Card>

      {/* Main Workspace Area */}
      {loading ? (
        <div className="py-20">
          <LoadingSpinner size="md" message="Loading weekly game schedule…" />
        </div>
      ) : error ? (
        <div className="space-y-4">
          <Alert
            type="error"
            title="FastAPI Communication Error"
            message={error}
          />
          <Card className="p-8 text-center bg-white border border-slate-100">
            <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium mb-4">
              Could not establish connection with FastAPI schedule database registry.
            </p>
            <button
              onClick={fetchSchedule}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 cursor-pointer transition-colors"
            >
              Retry API Request
            </button>
          </Card>
        </div>
      ) : filteredGames.length === 0 ? (
        <Card className="p-16 text-center space-y-4 bg-white border border-slate-100">
          <AlertOctagon className="w-12 h-12 mx-auto text-slate-300" />
          <h3 className="text-sm font-bold text-slate-800">No Matchups Scheduled</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            {searchQuery.trim() 
              ? `No scheduled games matched your search criteria: "${searchQuery}".`
              : "No scheduled games were returned for the active week."}
          </p>
          {searchQuery.trim() && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline"
            >
              Clear Search Query
            </button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredGames.map((game) => {
            const isNeutral = game.location === 'Neutral';
            // We do not calculate rest advantage, but we show a label if one of the team rest parameters is explicitly different
            const restAdvantageStr = game.away_rest !== undefined && game.home_rest !== undefined && game.away_rest !== game.home_rest
              ? game.away_rest > game.home_rest 
                ? `${game.away_team} +${game.away_rest - game.home_rest} days`
                : `${game.home_team} +${game.home_rest - game.away_rest} days`
              : null;

            const projGame = projections[game.game_id];
            const awayProbKey = `${game.game_id}_${game.away_team}`;
            const homeProbKey = `${game.game_id}_${game.home_team}`;
            const awayProb = probabilities[awayProbKey];
            const homeProb = probabilities[homeProbKey];
            const modelName = awayProb?.probability_model || homeProb?.probability_model;

            const awayTeamId = game.away_team ? teamsMap[game.away_team] : undefined;
            const homeTeamId = game.home_team ? teamsMap[game.home_team] : undefined;

            const awayRiskKey = awayTeamId !== undefined ? `${game.game_id}_${awayTeamId}` : `${game.game_id}_${game.away_team}`;
            const homeRiskKey = homeTeamId !== undefined ? `${game.game_id}_${homeTeamId}` : `${game.game_id}_${game.home_team}`;

            const awayRisk = risks[awayRiskKey];
            const homeRisk = risks[homeRiskKey];

            const awayEdgeKey = awayTeamId !== undefined ? `${game.game_id}_${awayTeamId}` : `${game.game_id}_${game.away_team}`;
            const homeEdgeKey = homeTeamId !== undefined ? `${game.game_id}_${homeTeamId}` : `${game.game_id}_${game.home_team}`;

            const awayEdge = marketEdges[awayEdgeKey];
            const homeEdge = marketEdges[homeEdgeKey];

            return (
              <Card key={game.game_id} className="p-5 hover:border-slate-200 transition-all flex flex-col justify-between border border-slate-100 shadow-3xs bg-white">
                <div className="space-y-5">
                  
                  {/* --- LEVEL 1: GAME --- */}
                  <div className="analytical-game space-y-4">
                    {/* Game Metadata Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        ID: {game.game_id}
                      </span>
                      <div className="flex items-center gap-2">
                        {isNeutral && (
                          <span className="text-[9px] font-extrabold bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-mono">
                            Neutral Site
                          </span>
                        )}
                        {(game.thanksgiving || game.christmas) && (
                          <span className="text-[9px] font-extrabold bg-rose-50 text-rose-700 border border-rose-100 px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-mono">
                            Holiday Special
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Matchup Teams Banner */}
                    <div className="grid grid-cols-3 items-center text-center">
                      {/* Away Team */}
                      <div className="space-y-1">
                        <span className="text-xl font-black text-slate-900 tracking-tight font-sans">
                          {game.away_team}
                        </span>
                        <span className="text-[9px] font-semibold text-slate-400 block font-mono">
                          AWAY (REST: {game.away_rest ?? 'TBD'}d)
                        </span>
                      </div>

                      {/* VS divider */}
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-black text-slate-300 font-mono italic uppercase tracking-wider">
                          AT
                        </span>
                      </div>

                      {/* Home Team */}
                      <div className="space-y-1">
                        <span className="text-xl font-black text-slate-900 tracking-tight font-sans">
                          {game.home_team}
                        </span>
                        <span className="text-[9px] font-semibold text-slate-400 block font-mono">
                          HOME (REST: {game.home_rest ?? 'TBD'}d)
                        </span>
                      </div>
                    </div>

                    {/* Kickoff and Location Detail */}
                    <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/50 p-3 rounded-xl border border-slate-100 font-medium">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {formatGameDate(game.date, game.time)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate" title={game.stadium || 'TBD'}>
                          {game.stadium || 'Venue TBD'}
                        </span>
                      </div>
                    </div>

                    {/* Rest Advantage Block */}
                    {restAdvantageStr && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-[10px] font-bold text-indigo-700">
                        <Scale className="w-3.5 h-3.5" />
                        <span>Rest Advantage: {restAdvantageStr}</span>
                      </div>
                    )}
                  </div>

                  {/* Staged Analytical Sections */}
                  <div className="flex flex-col gap-4.5 pt-4 border-t border-slate-100">
                    
                    {/* --- LEVEL 2: PROJECTION --- */}
                    <div className="analytical-projection bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider font-mono">
                            Model Projection
                          </span>
                        </div>
                        {projGame && (
                          <span className="text-[8px] text-slate-400 font-mono scale-90 origin-right">
                            {projGame.model}
                          </span>
                        )}
                      </div>
                      
                      {loadingProjections ? (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 py-1">
                          <RefreshCw className="w-2.5 h-2.5 animate-spin text-slate-300" />
                          <span>Loading...</span>
                        </div>
                      ) : errorProjections ? (
                        <div className="space-y-1 py-0.5">
                          <span className="text-[10px] text-rose-500 font-medium block">
                            Projection data failed to load.
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              fetchProjectionsOnly();
                            }}
                            className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 underline flex items-center gap-0.5"
                          >
                            <RefreshCw className="w-2 h-2" /> Retry
                          </button>
                        </div>
                      ) : !projGame ? (
                        <span className="text-[10px] text-slate-400 italic block py-1">
                          Projection data unavailable.
                        </span>
                      ) : (
                        <div className="text-[11px] space-y-1 bg-white p-2.5 rounded border border-slate-100">
                          <div className="flex justify-between items-center text-slate-600">
                            <span>Projected Favorite:</span>
                            <span className="font-extrabold text-slate-900">{projGame.favorite}</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-600">
                            <span>Projected Spread:</span>
                            <span className="font-mono font-extrabold text-slate-900">{projGame.projected_spread}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* --- LEVEL 3: WIN PROBABILITY --- */}
                    <div className="analytical-win-probability bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider font-mono">
                            Win Probability
                          </span>
                        </div>
                        {modelName && (
                          <span className="text-[8px] text-slate-400 font-mono scale-90 origin-right">
                            {modelName}
                          </span>
                        )}
                      </div>

                      {loadingProbabilities ? (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 py-1">
                          <RefreshCw className="w-2.5 h-2.5 animate-spin text-slate-300" />
                          <span>Loading...</span>
                        </div>
                      ) : errorProbabilities ? (
                        <div className="space-y-1 py-0.5">
                          <span className="text-[10px] text-rose-500 font-medium block">
                            Probability data failed to load.
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              fetchProbabilitiesOnly();
                            }}
                            className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 underline flex items-center gap-0.5"
                          >
                            <RefreshCw className="w-2 h-2" /> Retry
                          </button>
                        </div>
                      ) : (!awayProb && !homeProb) ? (
                        <span className="text-[10px] text-slate-400 italic block py-1">
                          Probability data unavailable.
                        </span>
                      ) : (
                        <div className="text-[10px] space-y-2 bg-white p-2.5 rounded border border-slate-100">
                          {/* Away Team Probabilities */}
                          {awayProb && (
                            <div className="border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                              <span className="font-extrabold text-slate-800 block mb-1">{game.away_team}</span>
                              <div className="grid grid-cols-2 gap-x-2 text-[9px] text-slate-600">
                                <div>
                                  <span className="block text-slate-400 font-bold scale-90 origin-left">Baseline Prob</span>
                                  <span className="font-mono font-bold text-slate-800">{awayProb.baseline_wp !== undefined ? String(awayProb.baseline_wp) : 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="block text-slate-400 font-bold scale-90 origin-left">Risk-Adjusted</span>
                                  <span className="font-mono font-black text-indigo-700">{awayProb.risk_adjusted_wp !== undefined ? String(awayProb.risk_adjusted_wp) : 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Home Team Probabilities */}
                          {homeProb && (
                            <div className="pt-1">
                              <span className="font-extrabold text-slate-800 block mb-1">{game.home_team}</span>
                              <div className="grid grid-cols-2 gap-x-2 text-[9px] text-slate-600">
                                <div>
                                  <span className="block text-slate-400 font-bold scale-90 origin-left">Baseline Prob</span>
                                  <span className="font-mono font-bold text-slate-800">{homeProb.baseline_wp !== undefined ? String(homeProb.baseline_wp) : 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="block text-slate-400 font-bold scale-90 origin-left">Risk-Adjusted</span>
                                  <span className="font-mono font-black text-indigo-700">{homeProb.risk_adjusted_wp !== undefined ? String(homeProb.risk_adjusted_wp) : 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* --- LEVEL 4: RISK --- */}
                    <div className="analytical-risk bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <AlertOctagon className="w-3.5 h-3.5 text-rose-500" />
                          <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider font-mono">
                            Risk Index
                          </span>
                        </div>
                      </div>

                      {loadingRisks ? (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 py-1">
                          <RefreshCw className="w-2.5 h-2.5 animate-spin text-slate-300" />
                          <span>Loading...</span>
                        </div>
                      ) : errorRisks ? (
                        <div className="space-y-1 py-0.5">
                          <span className="text-[10px] text-rose-500 font-medium block leading-snug">
                            {errorRisks}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              fetchRisksOnly();
                            }}
                            className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <RefreshCw className="w-2 h-2" /> Retry
                          </button>
                        </div>
                      ) : (!awayRisk && !homeRisk) ? (
                        <span className="text-[10px] text-slate-400 italic block py-1">
                          Risk data unavailable.
                        </span>
                      ) : (
                        <div className="text-[10px] space-y-2 bg-white p-2.5 rounded border border-slate-100">
                          {[
                            { team: game.away_team, risk: awayRisk },
                            { team: game.home_team, risk: homeRisk }
                          ]
                            .filter(item => item.risk)
                            .map((item, idx) => (
                              <div key={idx} className="border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                                <span className="font-extrabold text-slate-800 block mb-1">{item.team}</span>
                                <div className="grid grid-cols-2 gap-x-2 text-[9px] text-slate-500 font-medium">
                                  <div>
                                    <span className="block text-slate-400 font-bold scale-90 origin-left">Risk Points</span>
                                    <span className="font-mono font-bold text-rose-600">{item.risk.risk_points} pts</span>
                                  </div>
                                  <div>
                                    <span className="block text-slate-400 font-bold scale-90 origin-left">Risk Factors</span>
                                    <span className="font-mono font-bold text-slate-700">{item.risk.risk_factor_count} factors</span>
                                  </div>
                                </div>
                                {item.risk.risk_types && (
                                  <div className="mt-1.5 flex flex-wrap gap-1">
                                    {item.risk.risk_types.split(',').map((type: string, tIdx: number) => (
                                      <span key={tIdx} className="text-[8px] font-bold font-mono bg-rose-50 text-rose-700 border border-rose-100 px-1 py-0.5 rounded">
                                        {type.trim()}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* --- LEVEL 5: MARKET EDGE --- */}
                    <div className="analytical-market-edge bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider font-mono">
                            Market Edge
                          </span>
                        </div>
                      </div>

                      {loadingMarketEdges ? (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 py-1">
                          <RefreshCw className="w-2.5 h-2.5 animate-spin text-slate-300" />
                          <span>Loading...</span>
                        </div>
                      ) : errorMarketEdges ? (
                        <div className="space-y-1 py-0.5">
                          <span className="text-[10px] text-rose-500 font-medium block leading-snug">
                            {errorMarketEdges}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              fetchMarketEdgesOnly();
                            }}
                            className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <RefreshCw className="w-2 h-2" /> Retry
                          </button>
                        </div>
                      ) : (!awayEdge && !homeEdge) ? (
                        <span className="text-[10px] text-slate-400 italic block py-1">
                          Market data unavailable.
                        </span>
                      ) : (
                        <div className="text-[10px] space-y-2 bg-white p-2.5 rounded border border-slate-100">
                          {[
                            { team: game.away_team, edge: awayEdge },
                            { team: game.home_team, edge: homeEdge }
                          ]
                            .filter(item => item.edge)
                            .map((item, idx) => (
                              <div key={idx} className="border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-extrabold text-slate-800">{item.team}</span>
                                  {item.edge.sportsbook_count !== undefined && (
                                    <span className="text-[8px] font-mono text-slate-400 font-bold bg-slate-100 px-1.5 py-0.2 rounded">
                                      {item.edge.sportsbook_count} books
                                    </span>
                                  )}
                                </div>
                                <div className="grid grid-cols-3 gap-x-1.5 text-[9px] text-slate-500 mt-1 font-medium">
                                  <div>
                                    <span className="block text-slate-400 font-bold scale-90 origin-left">SemiSharp</span>
                                    <span className="font-mono font-bold text-slate-700">{item.edge.semisharp_spread}</span>
                                  </div>
                                  <div>
                                    <span className="block text-slate-400 font-bold scale-90 origin-left">Market</span>
                                    <span className="font-mono font-bold text-slate-700">{item.edge.market_spread}</span>
                                  </div>
                                  <div>
                                    <span className="block text-emerald-500 font-bold scale-90 origin-left">Edge Pts</span>
                                    <span className="font-mono font-black text-emerald-600">+{item.edge.edge_points}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
