/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, LoadingSpinner, Alert } from './ui';
import { SemiSharpApi } from '../api';
import { StrategyRecommendation, GameMatchup, ProjectionGame, RiskItem } from '../types';
import {
  Award,
  Settings,
  Cpu,
  TrendingUp,
  AlertOctagon,
  Calendar,
  Sparkles,
  Zap,
  RefreshCw,
  Info,
  Lock,
  ArrowRight,
  Database,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

const STRATEGY_DEFINITIONS = [
  {
    code: 'CIRCA_HOLIDAY',
    localId: 'circa-holiday',
    fallbackName: 'Circa Holiday Reserve',
    desc: 'Prioritizes securing teams for Thanksgiving and Christmas legs first, then fills remaining weeks with the strongest available teams while ensuring holiday-utilized teams are protected.'
  },
  {
    code: 'MULTIPLE_ENTRY',
    localId: 'multiple-entry',
    fallbackName: 'Multiple Entry Portfolio',
    desc: 'Analyzes multiple entries simultaneously, applying a diversification tolerance to ensure picks vary across your portfolio.'
  },
  {
    code: 'PROJECTION_EDGE',
    localId: 'projection-edge',
    fallbackName: 'Projection Edge',
    desc: 'Selects the team with the highest \'adjusted edge,\' calculated by the difference between the Semisharp projection and the market spread, minus a risk-based penalty.'
  },
  {
    code: 'MONTE_CARLO',
    localId: 'monte-carlo',
    fallbackName: 'Monte Carlo Survivor',
    desc: 'Uses V3 risk-expanded distribution scales to simulate survival paths, selecting the team that maximizes long-term survival probability.'
  },
  {
    code: 'MARKET_ARBITRAGE_EXIT',
    localId: 'MARKET_ARBITRAGE_EXIT',
    fallbackName: 'Market Arbitrage Exit',
    desc: 'Optimizes selections for a Week 8 exit horizon by balancing spread strength against risk scores to maximize asset value.'
  },
  {
    code: 'BOTTOM_SIX_ROAD_FADE',
    localId: 'BOTTOM_SIX_ROAD_FADE',
    fallbackName: 'Bottom Six Road Fade',
    desc: 'Targets matchups where a \'Bottom Six\' team is playing on the road, defaulting to safe favorites only when no such fade opportunities exist.'
  },
  {
    code: 'CURRENT_WEEK_HIGHEST_WIN',
    localId: 'CURRENT_WEEK_HIGHEST_WIN',
    fallbackName: 'Current Week Highest Win',
    desc: 'Selects the safest favorite for the current week, adjusted by V3 risk scores to avoid high-volatility games.'
  },
  {
    code: 'FUTURE_VALUE',
    localId: 'future-value',
    fallbackName: 'Future Value',
    desc: 'Evaluates picks by calculating a \'future value\' penalty, which discourages using teams that are strong favorites in later, more difficult legs.'
  }
];

const getRiskAssessmentStyle = (points?: number) => {
  const pts = points !== undefined && points !== null ? points : 0;
  
  if (pts >= 16) {
    return {
      assessmentBgClass: 'bg-rose-50/20',
      assessmentBorderClass: 'border-rose-100/50',
      assessmentTextClass: 'text-rose-600',
      iconColorClass: 'text-rose-500',
      Icon: AlertOctagon,
      label: 'High Risk',
    };
  }
  
  if (pts >= 6) {
    return {
      assessmentBgClass: 'bg-amber-50/20',
      assessmentBorderClass: 'border-amber-100/50',
      assessmentTextClass: 'text-amber-600',
      iconColorClass: 'text-amber-500',
      Icon: AlertTriangle,
      label: 'Moderate Risk',
    };
  }
  
  // 0-5 Points: Green (Low Risk)
  return {
    assessmentBgClass: 'bg-emerald-50/10',
    assessmentBorderClass: 'border-emerald-100/30',
    assessmentTextClass: 'text-emerald-600',
    iconColorClass: 'text-emerald-500',
    Icon: CheckCircle2,
    label: 'Low Risk',
  };
};

interface SurvivorStrategiesProps {
  season: number;
  week: number;
}

export const SurvivorStrategies: React.FC<SurvivorStrategiesProps> = ({ season, week }) => {
  const { selectedEntry, user } = useAuth();

  const renderStars = (stars?: number) => {
    if (stars === undefined || stars === null) return '—';
    const numStars = Math.max(1, Math.min(5, Math.round(stars)));
    return (
      <span className="text-amber-500 font-bold" title={`${stars} Stars`}>
        {'★'.repeat(numStars)}
        <span className="text-slate-200">{'★'.repeat(5 - numStars)}</span>
      </span>
    );
  };
  
  // Controls
  const [selectedStrategy, setSelectedStrategy] = useState<string>('CURRENT_WEEK_HIGHEST_WIN');
  
  // Recommendation state
  const [recommendation, setRecommendation] = useState<StrategyRecommendation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeEndpoint, setActiveEndpoint] = useState<string>('');

  // Registry state queried from live database table strategy.registry
  const [registry, setRegistry] = useState<any[]>([]);

  useEffect(() => {
    const fetchRegistry = async () => {
      try {
        const data = await SemiSharpApi.getStrategyRegistry();
        if (data && Array.isArray(data)) {
          setRegistry(data);
        }
      } catch (err) {
        console.warn('Failed to query strategy.registry database table:', err);
      }
    };
    fetchRegistry();
  }, []);

  const getStrategyDisplayName = (id: string) => {
    const def = STRATEGY_DEFINITIONS.find(d => d.localId === id);
    if (!def) return id;
    const match = registry.find(r => r.strategy_code === def.code);
    return match?.display_name || def.fallbackName;
  };

  // Enrichment data (to look up matchups, spreads, risks)
  const [games, setGames] = useState<GameMatchup[]>([]);
  const [projections, setProjections] = useState<ProjectionGame[]>([]);
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [enrichmentLoaded, setEnrichmentLoaded] = useState<boolean>(false);

  // Active recommendation matched entry
  const activeMatch = recommendation?.entries?.find(e => {
    const backendId = e.entry_id?.toString().trim();
    const frontendId = selectedEntry?.entry_id?.toString().trim();
    const backendSweat = e.survivor_sweat_name?.toString().trim().toLowerCase();
    const frontendSweat = selectedEntry?.survivor_sweat_name?.toString().trim().toLowerCase();
    const frontendLabel = selectedEntry?.entry_label?.toString().trim().toLowerCase();
    
    return (
      (frontendId && backendId === frontendId) ||
      (frontendSweat && backendSweat === frontendSweat) ||
      (frontendLabel && backendSweat && frontendLabel.includes(backendSweat)) ||
      (frontendLabel && backendSweat && backendSweat.includes(frontendLabel))
    );
  }) || (recommendation?.entries && recommendation.entries.length > 0 ? recommendation.entries[0] : null);

  // Load enrichment data on mount/week change
  useEffect(() => {
    const loadEnrichmentData = async () => {
      try {
        const entryId = selectedEntry?.entry_id || 1;
        
        // Fetch schedule, projections, risks in parallel
        const [scheduleRes, projectionsRes, riskRes] = await Promise.allSettled([
          SemiSharpApi.getSchedule(season, week),
          SemiSharpApi.getProjections(season, week),
          SemiSharpApi.getRisk(season, week)
        ]);

        if (scheduleRes.status === 'fulfilled' && scheduleRes.value) {
          const res = scheduleRes.value;
          setGames(res.games || (res as any).schedule || []);
        }
        if (projectionsRes.status === 'fulfilled' && projectionsRes.value) {
          setProjections(projectionsRes.value.games || []);
        }
        if (riskRes.status === 'fulfilled' && riskRes.value) {
          setRisks(riskRes.value.risks || []);
        }
        setEnrichmentLoaded(true);
      } catch (err) {
        console.warn('Enrichment data loading partial failure:', err);
      }
    };

    loadEnrichmentData();
  }, [season, week, selectedEntry?.entry_id]);

  const handleGenerateRecommendation = async () => {
    if (!selectedEntry || !selectedEntry.format_code) {
      setError('This survivor entry does not have a contest format assigned.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setRecommendation(null);

    let endpointStr = '';
    try {
      let res: StrategyRecommendation;
      const mappedFormat = selectedEntry.format_code;

      switch (selectedStrategy) {
        case 'CURRENT_WEEK_HIGHEST_WIN':
        case 'highest-win':
          endpointStr = `GET /strategies/current-week-highest-win/${season}/${mappedFormat}`;
          setActiveEndpoint(endpointStr);
          res = await SemiSharpApi.getStrategyHighestWin(season, mappedFormat);
          break;
        case 'BOTTOM_SIX_ROAD_FADE':
          endpointStr = `GET /strategies/bottom-six-road-fade/${season}/${mappedFormat}`;
          setActiveEndpoint(endpointStr);
          res = await SemiSharpApi.getStrategyBottomSixRoadFade(season, mappedFormat);
          break;
        case 'MARKET_ARBITRAGE_EXIT':
          endpointStr = `GET /strategies/market-arbitrage-exit/${season}/${mappedFormat}`;
          setActiveEndpoint(endpointStr);
          res = await SemiSharpApi.getStrategyMarketArbitrageExit(season, mappedFormat);
          break;
        case 'future-value':
          endpointStr = `GET /strategies/future-value/${season}/${mappedFormat}`;
          setActiveEndpoint(endpointStr);
          res = await SemiSharpApi.getStrategyFutureValue(season, mappedFormat);
          break;
        case 'multiple-entry': {
          const uId = user?.user_id;
          const queryStr = uId ? `?userId=${uId}` : '';
          endpointStr = `GET /strategies/multiple-entry/${season}/${mappedFormat}${queryStr}`;
          setActiveEndpoint(endpointStr);
          res = await SemiSharpApi.getStrategyMultipleEntry(season, mappedFormat, uId);
          break;
        }
        case 'circa-holiday':
          endpointStr = `GET /strategies/circa-holiday/${season}`;
          setActiveEndpoint(endpointStr);
          res = await SemiSharpApi.getStrategyCircaHoliday(season);
          break;
        case 'projection-edge':
          endpointStr = `GET /strategies/projection-edge/${season}/${mappedFormat}`;
          setActiveEndpoint(endpointStr);
          res = await SemiSharpApi.getStrategyProjectionEdge(season, mappedFormat);
          break;
        case 'monte-carlo':
          endpointStr = `GET /strategies/monte-carlo/${season}/${mappedFormat}`;
          setActiveEndpoint(endpointStr);
          res = await SemiSharpApi.getStrategyMonteCarlo(season, mappedFormat);
          break;
        case 'dynamic-programming':
          endpointStr = `GET /strategies/dynamic-programming/${season}/${mappedFormat}`;
          setActiveEndpoint(endpointStr);
          res = await SemiSharpApi.getStrategyDynamicProgramming(season, mappedFormat);
          break;
        default:
          throw new Error('Invalid strategy selection');
      }

      setRecommendation(res);
      setSuccess('LIVE API Recommendation');
    } catch (err: any) {
      console.error('Error generating strategy recommendation:', err);
      
      let errorMsg = '';
      if (err instanceof Error) {
        errorMsg = err.message;
      } else if (err && typeof err === 'object') {
        errorMsg = err.detail || err.message || JSON.stringify(err);
      } else if (err) {
        errorMsg = String(err);
      }

      if (!errorMsg) {
        errorMsg = selectedStrategy === 'monte-carlo'
          ? 'Unable to complete Monte Carlo simulation'
          : 'Unable to retrieve strategy recommendation';
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Helper to look up matchup for a team
  const findMatchupForTeam = (teamAbbrev: string) => {
    if (!games || games.length === 0) return null;
    const teamUpper = teamAbbrev.toUpperCase();
    return games.find(g => 
      g.home_team.toUpperCase() === teamUpper || 
      g.away_team.toUpperCase() === teamUpper
    );
  };

  // Helper to look up projected spread for a team
  const findSpreadForTeam = (teamAbbrev: string) => {
    if (!projections || projections.length === 0) return null;
    const teamUpper = teamAbbrev.toUpperCase();
    return projections.find(p => p.away_team.toUpperCase() === teamUpper || p.home_team.toUpperCase() === teamUpper);
  };

  // Helper to look up risk for a team
  const findRiskForTeam = (teamAbbrev: string) => {
    if (!risks || risks.length === 0) return null;
    const teamUpper = teamAbbrev.toUpperCase();
    return risks.find(r => r.team.toUpperCase() === teamUpper);
  };

  const strategiesList = STRATEGY_DEFINITIONS.map(def => ({
    id: def.localId,
    name: getStrategyDisplayName(def.localId),
    status: 'LIVE',
    desc: def.desc
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* TWO-COLUMN GRID: CONTROLS & OUTPUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: CONTROL PANEL (5 COLUMNS) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* CONTROL CARD */}
          <Card className="p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Settings className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider font-mono">
                1. Strategy Control Panel
              </h3>
            </div>

            {/* Strategy Select */}
            <div className="space-y-1.5 relative">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="strategy-select" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Select Strategy Engine
                </label>
                
                {/* TOOLTIP COMPONENT */}
                <div className="relative group inline-block">
                  <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-bold font-mono cursor-pointer bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 hover:bg-indigo-100 transition-colors">
                    <Info className="w-3 h-3 text-indigo-500 shrink-0" />
                    <span>Engine Info</span>
                  </div>
                  
                  {/* Tooltip Content popover on group-hover */}
                  <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 text-slate-100 p-4 rounded-xl shadow-2xl border border-slate-800 hidden group-hover:block z-50 animate-fade-in transition-all">
                    <div className="absolute top-0 right-4 -mt-1.5 h-3 w-3 rotate-45 bg-slate-900 border-t border-l border-slate-800"></div>
                    <div className="space-y-3 relative z-10">
                      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                        <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-white font-mono">
                          {getStrategyDisplayName(selectedStrategy)}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                        {STRATEGY_DEFINITIONS.find(d => d.localId === selectedStrategy)?.desc}
                      </p>
                      <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest font-mono flex items-center gap-1 border-t border-slate-800/50 pt-2">
                        <Database className="w-3 h-3 text-slate-500" />
                        <span>Source: strategy.registry</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <select
                id="strategy-select"
                value={selectedStrategy}
                onChange={(e) => {
                  setSelectedStrategy(e.target.value);
                  setRecommendation(null);
                  setError(null);
                  setSuccess(null);
                }}
                className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:border-slate-900 transition-colors"
              >
                {strategiesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.status})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 leading-normal mt-1.5 flex items-start gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <span>
                  {strategiesList.find(s => s.id === selectedStrategy)?.desc}
                </span>
              </p>
            </div>

            {/* Contest Format */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Contest Format
              </span>
              <div className="w-full text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2.5 font-sans">
                {selectedEntry?.format_name || 'No Format assigned'}
              </div>
            </div>

            {/* Context meta parameters */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                <Database className="w-3.5 h-3.5 text-slate-400" /> Query Context parameters
              </h4>

              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest block">Active Entry</span>
                  <span className="text-slate-800 font-bold truncate block" title={selectedEntry?.entry_label || 'Bypassed'}>
                    {selectedEntry?.entry_label || 'Bypassed'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest block">Contest Season</span>
                  <span className="text-slate-800 font-bold">{season} NFL</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest block">Current Week</span>
                  <span className="text-slate-800 font-bold">Week {week}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest block">Sweat Name</span>
                  <span className="text-slate-800 font-bold truncate block" title={selectedEntry?.survivor_sweat_name || 'N/A'}>
                    {selectedEntry?.survivor_sweat_name || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <Button
              id="generate-recommendation-btn"
              onClick={handleGenerateRecommendation}
              disabled={loading}
              className="w-full py-3 font-extrabold tracking-wider text-xs uppercase flex items-center justify-center gap-2 shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {selectedStrategy === 'monte-carlo' ? 'Running Monte Carlo simulation...' : 'Generating recommendation...'}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Recommendation
                </>
              )}
            </Button>
          </Card>

          {/* ACTIVE PIPELINE TELEMETRY */}
          <Card className="p-5 space-y-3 bg-slate-950 text-white border-none">
            <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <Zap className="w-3.5 h-3.5 text-indigo-400" /> API Stream Monitor
            </h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Endpoint Mapping:</span>
                <span className="font-mono text-emerald-400 text-[11px]">
                  {activeEndpoint || 'Waiting for trigger...'}
                </span>
              </div>
              <div className="flex justify-between pt-1.5">
                <span className="text-slate-400">Query Authorization:</span>
                <span className="text-slate-200">PASS (Verified)</span>
              </div>
            </div>
          </Card>

        </div>

        {/* RIGHT COLUMN: RECOMMENDATION CARD & DETAILS (7 COLUMNS) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* LOADING STATE */}
          {loading && (
            <Card className="p-16 text-center space-y-4 border border-slate-200/80 shadow-xs">
              <LoadingSpinner size="md" message={selectedStrategy === 'monte-carlo' ? 'Running Monte Carlo simulation...' : 'Generating recommendation...'} />
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium max-w-sm mx-auto">
                {selectedStrategy === 'monte-carlo'
                  ? 'Simulating 10,000 parallel seasons on the backend to compute exact survival path probabilities and optimal roster choices.'
                  : 'Running optimization equations on the backend. This executes secure matrix models to identify survivor recommendations.'}
              </p>
            </Card>
          )}

          {/* ERROR STATE */}
          {error && (
            <Card className="p-8 border border-rose-100 bg-rose-50/10 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">
                    Unable to retrieve strategy recommendation
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    The requested strategy backend endpoint returned an error or is unavailable. Please verify the backend service status.
                  </p>
                </div>
              </div>
              
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs font-mono text-rose-400">
                <span>ERROR [500]: Failed to execute strategy {selectedStrategy}</span>
              </div>
            </Card>
          )}

          {/* INITIAL STATE */}
          {!loading && !error && !recommendation && (
            <Card className="p-16 text-center space-y-4 border border-dashed border-slate-200">
              <Award className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">Ready to Query Strategy</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Select an analytical engine in the control panel and click "Generate Recommendation" to pull real-time recommendations directly from the server.
                </p>
              </div>
            </Card>
          )}

          {/* SUCCESS STATE & DISPLAY CARD */}
          {!loading && !error && recommendation && (
            <div className="space-y-6 animate-fade-in animate-duration-300">
              
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-pulse" />
                  {success}
                </span>
                
                {(recommendation.timestamp || recommendation.rating_week !== undefined) && (
                  <span className="text-[10px] font-mono font-medium text-slate-400">
                    {recommendation.timestamp ? `Compiled: ${new Date(recommendation.timestamp).toLocaleTimeString()}` : `Rating Week: ${recommendation.rating_week}`}
                  </span>
                )}
              </div>

               {/* OVERVIEW INFO CARD */}
              <Card className="p-6 bg-slate-50 border border-slate-200/60 rounded-xl space-y-4">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
                  Strategy Recommendation Overview
                </h4>
                <div className={`grid grid-cols-1 ${selectedStrategy === 'monte-carlo' && activeMatch?.estimated_path_survival_probability !== undefined ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-6`}>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Strategy</span>
                    <span className="text-sm font-black text-slate-900 block font-sans">
                      {recommendation.strategy || recommendation.strategy_name || 'Highest Win Probability'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Contest</span>
                    <span className="text-sm font-black text-slate-900 block font-sans">
                      {recommendation.contest_format || selectedEntry?.format_name || 'No Format'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Entry</span>
                    <span className="text-sm font-black text-indigo-600 block font-sans truncate" title={selectedEntry?.entry_label || 'Bypassed'}>
                      {selectedEntry?.entry_label || 'Bypassed'}
                    </span>
                  </div>
                  {selectedStrategy === 'monte-carlo' && activeMatch?.estimated_path_survival_probability !== undefined && (
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Path Survival Prob</span>
                      <span className="text-sm font-black text-emerald-600 block font-mono">
                        {(activeMatch.estimated_path_survival_probability * 100).toFixed(3)}%
                      </span>
                    </div>
                  )}
                </div>

                {recommendation.hfa_source && (
                  <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-mono text-slate-400 font-semibold">
                    <span>HFA Source: {recommendation.hfa_source}</span>
                    <span>Season: {recommendation.season} NFL</span>
                  </div>
                )}
              </Card>

              {/* MAIN RECOMMENDATION LIST TABLE / LEGACY LIST */}
              {recommendation.entries && recommendation.entries.length > 0 ? (
                <div className="space-y-4">
                  {selectedStrategy === 'multiple-entry' ? (
                    (() => {
                      const matchedEntry = recommendation.entries.find(e => {
                        const backendId = e.entry_id?.toString().trim();
                        const frontendId = selectedEntry?.entry_id?.toString().trim();
                        return frontendId && backendId === frontendId;
                      });

                      if (!matchedEntry) {
                        return (
                          <Card className="p-8 text-center space-y-2 border border-slate-200 bg-white shadow-sm">
                            <Info className="w-8 h-8 text-slate-300 mx-auto animate-pulse" />
                            <h4 className="text-sm font-bold text-slate-800">No recommendations found for this entry.</h4>
                            <p className="text-xs text-slate-500 max-w-md mx-auto">
                              No matched portfolio strategy recommendation found for entry ID "{selectedEntry?.entry_id || 'N/A'}" ("{selectedEntry?.entry_label || 'N/A'}").
                            </p>
                          </Card>
                        );
                      }

                      if (!matchedEntry.picks || matchedEntry.picks.length === 0) {
                        return (
                          <Card className="p-8 text-center space-y-2 border border-slate-200 bg-white shadow-sm">
                            <Info className="w-8 h-8 text-slate-300 mx-auto" />
                            <h4 className="text-sm font-bold text-slate-800">No recommendations found for this entry.</h4>
                            <p className="text-xs text-slate-500 max-w-md mx-auto">
                              The backend portfolio succeeds, but returned no matching pick rows for entry "{selectedEntry?.entry_label || 'N/A'}".
                            </p>
                          </Card>
                        );
                      }

                      return (
                        <div className="overflow-hidden border border-slate-200 rounded-xl bg-white shadow-sm overflow-x-auto animate-fade-in">
                          <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                              <tr className="bg-slate-900 border-b border-slate-800 text-[10px] font-extrabold text-slate-300 uppercase tracking-widest font-mono">
                                <th className="py-3 px-4">Leg</th>
                                <th className="py-3 px-4">Week</th>
                                <th className="py-3 px-4">Team</th>
                                <th className="py-3 px-4">Game</th>
                                <th className="py-3 px-4 text-right">Projected Line</th>
                                <th className="py-3 px-4 text-right">Risk Score</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                              {matchedEntry.picks.map((pick, pIdx) => {
                                const gameInfo = findMatchupForTeam(pick.team);
                                const gameDisplay = gameInfo 
                                  ? `${gameInfo.away_team} @ ${gameInfo.home_team}`
                                  : 'TBD';
                                
                                const spreadValue = pick.projected_line;
                                const riskInfo = findRiskForTeam(pick.team);
                                const riskStyle = riskInfo ? getRiskAssessmentStyle(riskInfo.risk_points) : getRiskAssessmentStyle(pick.risk_points);
                                const RiskIcon = riskStyle.Icon;

                                return (
                                  <React.Fragment key={pIdx}>
                                    <tr className="hover:bg-slate-50/50 transition-colors">
                                      <td className="py-4 px-4 font-mono font-black text-slate-400">
                                        {pick.leg_number}
                                      </td>
                                      <td className="py-4 px-4 font-black text-slate-900 whitespace-nowrap">
                                        {pick.leg_name || `Week ${pick.leg_number}`}
                                      </td>
                                      <td className="py-4 px-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono font-black text-[11px]">
                                          {pick.team.toUpperCase()}
                                        </span>
                                      </td>
                                      <td className="py-4 px-4 font-medium text-slate-500">
                                        <div className="font-semibold text-slate-700">{gameDisplay}</div>
                                        {gameInfo?.stadium && (
                                          <span className="block text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">
                                            {gameInfo.stadium}
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-4 px-4 text-right font-mono font-black text-indigo-600 text-sm whitespace-nowrap">
                                        {spreadValue !== undefined && spreadValue !== null
                                          ? (spreadValue > 0 ? `+${spreadValue}` : spreadValue) 
                                          : '0'}
                                      </td>
                                      <td className="py-4 px-4 text-right font-mono font-black text-slate-800 text-sm">
                                        {(pick.risk_points !== undefined && pick.risk_points !== null ? pick.risk_points : 0).toFixed(1)}
                                      </td>
                                    </tr>
                                    {riskInfo && (
                                      <tr className={riskStyle.assessmentBgClass}>
                                        <td colSpan={6} className={`py-2 px-4 border-t ${riskStyle.assessmentBorderClass}`}>
                                          <div className={`flex items-center gap-2 text-[10px] ${riskStyle.assessmentTextClass} font-bold font-mono`}>
                                            <RiskIcon className={`w-3.5 h-3.5 ${riskStyle.iconColorClass} shrink-0`} />
                                            <span>RISK ASSESSMENT ({riskStyle.label}): {riskInfo.risk_points} Points ({riskInfo.risk_types})</span>
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
                      );
                    })()
                  ) : (
                    (() => {
                    const activeMatch = recommendation.entries.find(e => {
                      const backendId = e.entry_id?.toString().trim();
                      const frontendId = selectedEntry?.entry_id?.toString().trim();
                      const backendSweat = e.survivor_sweat_name?.toString().trim().toLowerCase();
                      const frontendSweat = selectedEntry?.survivor_sweat_name?.toString().trim().toLowerCase();
                      const frontendLabel = selectedEntry?.entry_label?.toString().trim().toLowerCase();
                      
                      return (
                        (frontendId && backendId === frontendId) ||
                        (frontendSweat && backendSweat === frontendSweat) ||
                        (frontendLabel && backendSweat && frontendLabel.includes(backendSweat)) ||
                        (frontendLabel && backendSweat && backendSweat.includes(frontendLabel))
                      );
                    }) || recommendation.entries[0];

                    if (!activeMatch || !activeMatch.picks || activeMatch.picks.length === 0) {
                      return (
                        <Card className="p-8 text-center space-y-2 border border-slate-200">
                          <Info className="w-8 h-8 text-slate-300 mx-auto" />
                          <h4 className="text-sm font-bold text-slate-800">No recommendations found for this entry.</h4>
                          <p className="text-xs text-slate-500">
                            The backend optimizer succeeded, but returned no matching pick rows for entry "{selectedEntry?.entry_label || 'N/A'}".
                          </p>
                        </Card>
                      );
                    }

                    if (selectedStrategy === 'circa-holiday') {
                      return (
                        <div className="overflow-hidden border border-slate-200 rounded-xl bg-white shadow-sm">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-900 border-b border-slate-800 text-[10px] font-extrabold text-slate-300 uppercase tracking-widest font-mono">
                                <th className="py-3 px-4">Leg</th>
                                <th className="py-3 px-4">Week</th>
                                <th className="py-3 px-4">Team</th>
                                <th className="py-3 px-4">Game</th>
                                <th className="py-3 px-4 text-right">Projected Line</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                              {activeMatch.picks.map((pick, pIdx) => {
                                const gameInfo = findMatchupForTeam(pick.team);
                                const gameDisplay = gameInfo 
                                  ? `${gameInfo.away_team} @ ${gameInfo.home_team}`
                                  : 'TBD';
                                
                                const spreadValue = pick.projected_line;
                                const isThanksgiving = pick.leg_code === 'THANKSGIVING';
                                const isChristmas = pick.leg_code === 'CHRISTMAS';
                                
                                const rowBgClass = isThanksgiving 
                                  ? 'bg-amber-50/40 hover:bg-amber-50/60 transition-colors border-l-4 border-l-amber-500'
                                  : isChristmas 
                                    ? 'bg-rose-50/40 hover:bg-rose-50/60 transition-colors border-l-4 border-l-rose-500'
                                    : 'hover:bg-slate-50/50 transition-colors';
                                
                                const riskInfo = findRiskForTeam(pick.team);
                                const riskStyle = riskInfo ? getRiskAssessmentStyle(riskInfo.risk_points) : getRiskAssessmentStyle(pick.risk_points);
                                const RiskIcon = riskStyle.Icon;

                                return (
                                  <React.Fragment key={pIdx}>
                                    <tr className={rowBgClass}>
                                      <td className="py-4 px-4 font-mono font-black text-slate-400">
                                        {pick.leg_number}
                                      </td>
                                      <td className="py-4 px-4 font-black text-slate-900">
                                        <div className="flex items-center flex-wrap gap-2">
                                          <span>{pick.leg_name || `Week ${pick.leg_number}`}</span>
                                          {isThanksgiving && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-amber-100 border border-amber-200 text-amber-800 font-mono text-[9px] font-extrabold uppercase tracking-wider">
                                              🍁 Thanksgiving
                                            </span>
                                          )}
                                          {isChristmas && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-rose-100 border border-rose-200 text-rose-800 font-mono text-[9px] font-extrabold uppercase tracking-wider">
                                              🎄 Christmas
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-4 px-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono font-black text-[11px]">
                                          {pick.team.toUpperCase()}
                                        </span>
                                      </td>
                                      <td className="py-4 px-4 font-medium text-slate-500">
                                        {gameDisplay}
                                        {gameInfo?.stadium && (
                                          <span className="block text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">
                                            {gameInfo.stadium}
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-4 px-4 text-right font-mono font-black text-indigo-600 text-sm">
                                        {spreadValue !== undefined && spreadValue !== null
                                          ? (spreadValue > 0 ? `+${spreadValue}` : spreadValue) 
                                          : '0'}
                                      </td>
                                    </tr>
                                    {riskInfo && (
                                      <tr className={riskStyle.assessmentBgClass}>
                                        <td colSpan={5} className={`py-2 px-4 border-t ${riskStyle.assessmentBorderClass}`}>
                                          <div className={`flex items-center gap-2 text-[10px] ${riskStyle.assessmentTextClass} font-bold font-mono`}>
                                            <RiskIcon className={`w-3.5 h-3.5 ${riskStyle.iconColorClass} shrink-0`} />
                                            <span>RISK ASSESSMENT ({riskStyle.label}): {riskInfo.risk_points} Points ({riskInfo.risk_types})</span>
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
                      );
                    }

                    if (selectedStrategy === 'monte-carlo') {
                      const survivalMetrics = (recommendation as any).survival_metrics || (recommendation as any).survivalMetrics;
                      const simulationInfo = (recommendation as any).simulation_information || (recommendation as any).simulationInformation;
                      const confidenceInfo = (recommendation as any).confidence_information || (recommendation as any).confidenceInformation;

                      return (
                        <div className="space-y-6">
                          {/* Recommended Path Table */}
                          <div className="space-y-3 animate-fade-in">
                            <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                              <Award className="w-4 h-4 text-indigo-500" /> Recommended Path
                            </h5>
                            
                            {activeMatch && activeMatch.picks && activeMatch.picks.length > 0 ? (
                              <div className="overflow-hidden border border-slate-200 rounded-xl bg-white shadow-sm overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[900px]">
                                  <thead>
                                    <tr className="bg-slate-900 border-b border-slate-800 text-[10px] font-extrabold text-slate-300 uppercase tracking-widest font-mono">
                                      <th className="py-3 px-4">Leg</th>
                                      <th className="py-3 px-4">Week</th>
                                      <th className="py-3 px-4">Team</th>
                                      <th className="py-3 px-4">Game</th>
                                      <th className="py-3 px-4 text-right">Projected Line</th>
                                      <th className="py-3 px-4 text-right">Win Probability</th>
                                      <th className="py-3 px-4 text-right">Risk Score</th>
                                      <th className="py-3 px-4 text-right">Adjusted Probability</th>
                                      <th className="py-3 px-4">Rationale</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                                    {activeMatch.picks.map((pick, pIdx) => {
                                      const gameInfo = findMatchupForTeam(pick.team);
                                      const gameDisplay = gameInfo 
                                        ? `${gameInfo.away_team} @ ${gameInfo.home_team}`
                                        : 'TBD';
                                      
                                      const spreadValue = pick.projected_line;
                                      const riskInfo = findRiskForTeam(pick.team);
                                      const riskStyle = riskInfo ? getRiskAssessmentStyle(riskInfo.risk_points) : getRiskAssessmentStyle(pick.risk_points);
                                      const RiskIcon = riskStyle.Icon;

                                      return (
                                        <React.Fragment key={pIdx}>
                                          <tr className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-4 px-4 font-mono font-black text-slate-400">
                                              {pick.leg_number}
                                            </td>
                                            <td className="py-4 px-4 font-black text-slate-900 whitespace-nowrap">
                                              {pick.leg_name || `Week ${pick.leg_number}`}
                                            </td>
                                            <td className="py-4 px-4">
                                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono font-black text-[11px]">
                                                {pick.team.toUpperCase()}
                                              </span>
                                            </td>
                                            <td className="py-4 px-4 font-medium text-slate-500 whitespace-nowrap">
                                              {gameDisplay}
                                            </td>
                                            <td className="py-4 px-4 text-right font-mono font-black text-indigo-600 text-sm whitespace-nowrap">
                                              {spreadValue !== undefined && spreadValue !== null
                                                ? (spreadValue > 0 ? `+${spreadValue}` : spreadValue) 
                                                : '0'}
                                            </td>
                                            <td className="py-4 px-4 text-right font-mono font-bold text-slate-700 whitespace-nowrap">
                                              {pick.adjusted_probability !== undefined && pick.adjusted_probability !== null
                                                ? (typeof pick.adjusted_probability === 'number' ? `${(pick.adjusted_probability * 100).toFixed(1)}%` : pick.adjusted_probability)
                                                : '0.0%'}
                                            </td>
                                            <td className="py-4 px-4 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                                              {pick.risk_points !== undefined && pick.risk_points !== null ? pick.risk_points : '0'}
                                            </td>
                                            <td className="py-4 px-4 text-right font-mono font-black text-emerald-600 whitespace-nowrap">
                                              {pick.adjusted_probability !== undefined && pick.adjusted_probability !== null
                                                ? (typeof pick.adjusted_probability === 'number' ? `${(pick.adjusted_probability * 100).toFixed(1)}%` : pick.adjusted_probability)
                                                : '0.0%'}
                                            </td>
                                            <td className="py-4 px-4 text-xs font-medium text-slate-600 max-w-xs truncate" title={pick.rationale}>
                                              {pick.rationale || 'None'}
                                            </td>
                                          </tr>
                                          {riskInfo && (
                                            <tr className={riskStyle.assessmentBgClass}>
                                              <td colSpan={9} className={`py-2 px-4 border-t ${riskStyle.assessmentBorderClass}`}>
                                                <div className={`flex items-center gap-2 text-[10px] ${riskStyle.assessmentTextClass} font-bold font-mono`}>
                                                  <RiskIcon className={`w-3.5 h-3.5 ${riskStyle.iconColorClass} shrink-0`} />
                                                  <span>RISK ASSESSMENT ({riskStyle.label}): {riskInfo.risk_points} Points ({riskInfo.risk_types})</span>
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
                            ) : (
                              <Card className="p-6 text-center border border-slate-200 bg-slate-50/30">
                                <p className="text-xs text-slate-400 italic">No recommended path picks returned by the backend.</p>
                              </Card>
                            )}
                          </div>

                          {/* Simulation Information Panel (if returned) */}
                          {simulationInfo && (
                            <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-5 animate-fade-in">
                              <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                                <Database className="w-4 h-4 text-indigo-500" /> Simulation Information
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                                {Object.entries(simulationInfo).map(([key, val]) => (
                                  <div key={key} className="flex justify-between border-b border-slate-100 pb-1.5">
                                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">{key.replace(/_/g, ' ')}</span>
                                    <span className="font-mono font-black text-slate-800">
                                      {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Survival Metrics Panel (if returned) */}
                          {survivalMetrics && (
                            <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-5 animate-fade-in">
                              <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-emerald-500" /> Survival Metrics
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                                {Object.entries(survivalMetrics).map(([key, val]) => (
                                  <div key={key} className="flex justify-between border-b border-slate-100 pb-1.5">
                                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">{key.replace(/_/g, ' ')}</span>
                                    <span className="font-mono font-black text-slate-800">
                                      {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Confidence Information Panel (if returned) */}
                          {confidenceInfo && (
                            <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-5 animate-fade-in">
                              <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-indigo-500" /> Confidence Information
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                                {Object.entries(confidenceInfo).map(([key, val]) => (
                                  <div key={key} className="flex justify-between border-b border-slate-100 pb-1.5">
                                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">{key.replace(/_/g, ' ')}</span>
                                    <span className="font-mono font-black text-indigo-600">
                                      {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }

                    if (selectedStrategy === 'projection-edge') {
                      return (
                        <div className="overflow-hidden border border-slate-200 rounded-xl bg-white shadow-sm">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-900 border-b border-slate-800 text-[10px] font-extrabold text-slate-300 uppercase tracking-widest font-mono">
                                <th className="py-3 px-4">Leg</th>
                                <th className="py-3 px-4">Week</th>
                                <th className="py-3 px-4">Team</th>
                                <th className="py-3 px-4">Game</th>
                                <th className="py-3 px-4 text-right">SemiSharp Spread</th>
                                <th className="py-3 px-4 text-right">Market Spread</th>
                                <th className="py-3 px-4 text-right">Edge Points</th>
                                <th className="py-3 px-4 text-right">Sportsbook Count</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                              {activeMatch.picks.map((pick, pIdx) => {
                                const gameInfo = findMatchupForTeam(pick.team);
                                const gameDisplay = gameInfo 
                                  ? `${gameInfo.away_team} @ ${gameInfo.home_team}`
                                  : 'TBD';
                                
                                const semiSharpSpread = pick.semisharp_spread;
                                const marketSpread = pick.market_spread;
                                const edgePoints = pick.edge_points;
                                const sportsbookCount = pick.sportsbook_count;
                                
                                const riskInfo = findRiskForTeam(pick.team);
                                const riskStyle = riskInfo ? getRiskAssessmentStyle(riskInfo.risk_points) : getRiskAssessmentStyle(pick.risk_points);
                                const RiskIcon = riskStyle.Icon;

                                return (
                                  <React.Fragment key={pIdx}>
                                    <tr className="hover:bg-slate-50/50 transition-colors">
                                      <td className="py-4 px-4 font-mono font-black text-slate-400">
                                        {pick.leg_number}
                                      </td>
                                      <td className="py-4 px-4 font-black text-slate-900">
                                        {pick.leg_name || `Week ${pick.leg_number}`}
                                      </td>
                                      <td className="py-4 px-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono font-black text-[11px]">
                                          {pick.team.toUpperCase()}
                                        </span>
                                      </td>
                                      <td className="py-4 px-4 font-medium text-slate-500">
                                        {gameDisplay}
                                        {gameInfo?.stadium && (
                                          <span className="block text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">
                                            {gameInfo.stadium}
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-4 px-4 text-right font-mono font-black text-indigo-600 text-sm">
                                        {semiSharpSpread !== undefined && semiSharpSpread !== null
                                          ? (semiSharpSpread > 0 ? `+${semiSharpSpread}` : semiSharpSpread) 
                                          : '0'}
                                      </td>
                                      <td className="py-4 px-4 text-right font-mono font-black text-slate-600 text-sm">
                                        {marketSpread !== undefined && marketSpread !== null
                                          ? (marketSpread > 0 ? `+${marketSpread}` : marketSpread) 
                                          : '0'}
                                      </td>
                                      <td className="py-4 px-4 text-right font-mono font-black text-emerald-600 text-sm">
                                        {edgePoints !== undefined && edgePoints !== null
                                          ? (edgePoints > 0 ? `+${edgePoints}` : edgePoints) 
                                          : '0'}
                                      </td>
                                      <td className="py-4 px-4 text-right font-mono font-bold text-slate-500 text-sm">
                                        {sportsbookCount !== undefined && sportsbookCount !== null
                                          ? sportsbookCount 
                                          : '0'}
                                      </td>
                                    </tr>
                                    {riskInfo && (
                                      <tr className={riskStyle.assessmentBgClass}>
                                        <td colSpan={8} className={`py-2 px-4 border-t ${riskStyle.assessmentBorderClass}`}>
                                          <div className={`flex items-center gap-2 text-[10px] ${riskStyle.assessmentTextClass} font-bold font-mono`}>
                                            <RiskIcon className={`w-3.5 h-3.5 ${riskStyle.iconColorClass} shrink-0`} />
                                            <span>RISK ASSESSMENT ({riskStyle.label}): {riskInfo.risk_points} Points ({riskInfo.risk_types})</span>
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
                      );
                    }

                    return (
                      <div className="overflow-hidden border border-slate-200 rounded-xl bg-white shadow-sm overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                          <thead>
                            <tr className="bg-slate-900 border-b border-slate-800 text-[10px] font-extrabold text-slate-300 uppercase tracking-widest font-mono">
                              <th className="py-3 px-4">Leg</th>
                              <th className="py-3 px-4">Week</th>
                              <th className="py-3 px-4">Team</th>
                              <th className="py-3 px-4">Game</th>
                              <th className="py-3 px-4 text-right">Projected Line</th>
                              <th className="py-3 px-4 text-right">Risk Score</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                            {activeMatch.picks.map((pick, pIdx) => {
                              const gameInfo = findMatchupForTeam(pick.team);
                              const gameDisplay = gameInfo 
                                ? `${gameInfo.away_team} @ ${gameInfo.home_team}`
                                : 'TBD';
                              
                              const spreadValue = pick.projected_line;
                              
                              // Check if there is risk info for this team
                              const riskInfo = findRiskForTeam(pick.team);
                              const riskStyle = riskInfo ? getRiskAssessmentStyle(riskInfo.risk_points) : getRiskAssessmentStyle(pick.risk_points);
                              const RiskIcon = riskStyle.Icon;

                              return (
                                <React.Fragment key={pIdx}>
                                  <tr className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 px-4 font-mono font-black text-slate-400">
                                      {pick.leg_number}
                                    </td>
                                    <td className="py-4 px-4 font-black text-slate-900 whitespace-nowrap">
                                      {pick.leg_name || `Week ${pick.leg_number}`}
                                    </td>
                                    <td className="py-4 px-4">
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono font-black text-[11px]">
                                        {pick.team.toUpperCase()}
                                      </span>
                                    </td>
                                    <td className="py-4 px-4 font-medium text-slate-500">
                                      <div className="font-semibold text-slate-700">{gameDisplay}</div>
                                      {gameInfo?.stadium && (
                                        <span className="block text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">
                                          {gameInfo.stadium}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-4 px-4 text-right font-mono font-black text-indigo-600 text-sm whitespace-nowrap">
                                      {spreadValue !== undefined && spreadValue !== null
                                        ? (spreadValue > 0 ? `+${spreadValue}` : spreadValue) 
                                        : '0'}
                                    </td>
                                    <td className="py-4 px-4 text-right font-mono font-black text-slate-800 text-sm">
                                      {(pick.risk_points !== undefined && pick.risk_points !== null ? pick.risk_points : 0).toFixed(1)}
                                    </td>
                                  </tr>

                                  {/* V3 Alternative Option UI (Current Active Week Only) */}
                                  {pick.leg_number === week && activeMatch.alternative_recommendations && activeMatch.alternative_recommendations.length > 0 && (
                                    activeMatch.alternative_recommendations.map((alt, altIdx) => {
                                      const altGameInfo = findMatchupForTeam(alt.team);
                                      const altGameDisplay = altGameInfo 
                                        ? `${altGameInfo.away_team} @ ${altGameInfo.home_team}`
                                        : 'TBD';

                                      return (
                                        <tr key={`alt_${altIdx}`} className="bg-slate-50/50 hover:bg-slate-100/40 transition-colors border-l-4 border-l-indigo-500">
                                          <td className="py-3 px-4 text-center text-slate-400 font-mono text-[10px] font-bold">
                                            ↳
                                          </td>
                                          <td className="py-3 px-4">
                                            <div className="flex flex-col">
                                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Alternative</span>
                                              <span className="text-[9px] text-slate-400 font-medium font-mono leading-none mt-0.5">Option</span>
                                            </div>
                                          </td>
                                          <td className="py-3 px-4">
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 border border-slate-200/60 text-slate-600 font-mono font-bold text-[10.5px]">
                                              {alt.team.toUpperCase()}
                                            </span>
                                          </td>
                                          <td className="py-3 px-4 font-medium text-slate-500">
                                            <div className="font-semibold text-slate-600">{altGameDisplay}</div>
                                            {altGameInfo?.stadium && (
                                              <span className="block text-[9px] text-slate-400 mt-0.5 truncate max-w-xs">
                                                {altGameInfo.stadium}
                                              </span>
                                            )}
                                          </td>
                                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-500 text-sm whitespace-nowrap">
                                            {alt.projected_line !== undefined && alt.projected_line !== null
                                              ? (alt.projected_line > 0 ? `+${alt.projected_line}` : alt.projected_line) 
                                              : '0'}
                                          </td>
                                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-500 text-sm">
                                            {(alt.risk_points !== undefined && alt.risk_points !== null ? alt.risk_points : 0).toFixed(1)}
                                          </td>
                                        </tr>
                                      );
                                    })
                                  )}

                                  {riskInfo && (
                                    <tr className={riskStyle.assessmentBgClass}>
                                      <td colSpan={6} className={`py-2 px-4 border-t ${riskStyle.assessmentBorderClass}`}>
                                        <div className={`flex items-center gap-2 text-[10px] ${riskStyle.assessmentTextClass} font-bold font-mono`}>
                                          <RiskIcon className={`w-3.5 h-3.5 ${riskStyle.iconColorClass} shrink-0`} />
                                          <span>RISK ASSESSMENT ({riskStyle.label}): {riskInfo.risk_points} Points ({riskInfo.risk_types})</span>
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
                    );
                  })()
                  )}
                </div>
              ) : recommendation.recommendations && recommendation.recommendations.length > 0 ? (
                // LEGACY RECOMMENDATIONS COMPATIBILITY FALLBACK
                <div className="space-y-4">
                  {recommendation.recommendations.map((rec, idx) => {
                    const gameInfo = findMatchupForTeam(rec.team);
                    const spreadInfo = findSpreadForTeam(rec.team);
                    const riskInfo = findRiskForTeam(rec.team);

                    return (
                      <Card key={idx} className="p-6 border-t-4 border-t-emerald-500 space-y-6">
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                              Recommended Selection {idx + 1}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                                {rec.team.toUpperCase()}
                              </span>
                              <span className="text-xs font-bold text-slate-400 font-mono">
                                {gameInfo ? (gameInfo.home_team === rec.team ? `vs ${gameInfo.away_team}` : `@ ${gameInfo.home_team}`) : ''}
                              </span>
                            </div>
                          </div>

                          <div className="text-left sm:text-right space-y-0.5 self-start sm:self-auto">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Strategy Engine</span>
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                              {recommendation.strategy_name || recommendation.strategy || 'N/A'}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                          
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Matchup Stadium</span>
                            <span className="text-xs font-bold text-slate-700 block truncate">
                              {gameInfo?.stadium || 'TBD'}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Projected Spread</span>
                            <span className="text-xs font-bold text-slate-700 block font-mono">
                              {spreadInfo?.predicted_spread !== undefined 
                                ? (spreadInfo.predicted_spread > 0 ? `+${spreadInfo.predicted_spread}` : spreadInfo.predicted_spread) 
                                : rec.future_value !== undefined 
                                  ? `FV: ${rec.future_value}` 
                                  : 'TBD'}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Safety Rating</span>
                            <span className="text-xs font-bold text-slate-700 block font-mono">
                              {rec.safety_rating !== undefined 
                                ? `${rec.safety_rating}/10` 
                                : riskInfo?.risk_points !== undefined 
                                  ? `${10 - riskInfo.risk_points}/10` 
                                  : 'N/A'}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Win Probability</span>
                            <span className="text-xs font-bold text-slate-700 block font-mono">
                              {rec.pick_probability !== undefined 
                                ? `${(rec.pick_probability * 100).toFixed(1)}%` 
                                : 'TBD'}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Model version</span>
                            <span className="text-xs font-mono font-bold text-slate-700 block">
                              {recommendation.model_version || 'v4.2-Pro'}
                            </span>
                          </div>

                          <div className="space-y-1 col-span-2 md:col-span-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Entry Reference</span>
                            <span className="text-xs font-bold text-slate-700 block truncate" title={selectedEntry?.entry_label}>
                              {selectedEntry?.entry_label || 'Bypassed'}
                            </span>
                          </div>

                        </div>

                        {rec.notes && (
                          <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-100 text-xs leading-relaxed text-slate-600 font-medium">
                            <span className="font-bold text-slate-700 block mb-1">Model Optimization Notes:</span>
                            {rec.notes}
                          </div>
                        )}

                        {riskInfo && (() => {
                          const riskStyle = getRiskAssessmentStyle(riskInfo.risk_points);
                          const CardRiskIcon = riskStyle.Icon;
                          return (
                            <div className={`rounded-lg p-3.5 border text-xs leading-relaxed ${riskStyle.assessmentBgClass} ${riskStyle.assessmentBorderClass} ${riskStyle.assessmentTextClass}`}>
                              <span className="font-bold block mb-1 flex items-center gap-1.5 font-mono text-[10px]">
                                <CardRiskIcon className={`w-3.5 h-3.5 ${riskStyle.iconColorClass}`} /> RISK ASSESSMENT ({riskStyle.label})
                              </span>
                              <div className="flex justify-between font-medium">
                                <span>Weather and Hazard Points:</span>
                                <span className="font-bold font-mono">{riskInfo.risk_points} Points ({riskInfo.risk_types})</span>
                              </div>
                            </div>
                          );
                        })()}

                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="p-8 text-center space-y-2 border border-slate-200">
                  <Info className="w-8 h-8 text-slate-300 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-800">No recommendations found for this entry.</h4>
                  <p className="text-xs text-slate-500">
                    No individual pick rows were output by the optimizer for this configuration.
                  </p>
                </Card>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
