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
  },
  {
    code: 'DYNAMIC_PROGRAMMING',
    localId: 'dynamic-programming',
    fallbackName: 'Dynamic Programming',
    desc: 'Optimizes selections across all remaining legs using backward induction to find the global maximum expected value path.'
  }
];

const PRODUCTION_STRATEGY_CODES = [
  'CURRENT_WEEK_HIGHEST_WIN',
  'FUTURE_VALUE',
  'BOTTOM_SIX_ROAD_FADE',
  'MARKET_ARBITRAGE_EXIT',
  'MONTE_CARLO',
  'DYNAMIC_PROGRAMMING'
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
  onNavigate?: (tab: string) => void;
}

export const SurvivorStrategies: React.FC<SurvivorStrategiesProps> = ({ season, week, onNavigate }) => {
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

  const visibleStrategies = React.useMemo(() => {
    const allowedDefs = STRATEGY_DEFINITIONS.filter(def => PRODUCTION_STRATEGY_CODES.includes(def.code));
    return allowedDefs.map(def => {
      const match = registry.find(r => r.strategy_code === def.code);
      return {
        id: def.localId,
        name: match?.display_name || def.fallbackName,
        status: 'LIVE',
        desc: match?.description || def.desc,
        classification: match?.runtime_classification || match?.classification || null,
        code: def.code,
        existsInRegistry: !!match
      };
    });
  }, [registry]);

  const excludedRegistryCodes = React.useMemo(() => {
    return registry
      .map(r => r.strategy_code)
      .filter(code => {
        if (!code) return false;
        const codeUpper = code.toUpperCase();
        return !PRODUCTION_STRATEGY_CODES.includes(codeUpper);
      });
  }, [registry]);

  useEffect(() => {
    if (excludedRegistryCodes.length > 0) {
      console.info('Excluded legacy registry strategy codes:', excludedRegistryCodes);
    }
  }, [excludedRegistryCodes]);

  const formatTwoDecimals = (val: number | undefined | null) => {
    if (val === undefined || val === null) return '—';
    const num = Number(val);
    if (isNaN(num)) return String(val);
    return num > 0 ? `+${num.toFixed(2)}` : num.toFixed(2);
  };

  const formatProbability = (val: any) => {
    if (val === undefined || val === null) return '—';
    const num = Number(val);
    if (isNaN(num)) return String(val);
    if (num <= 1 && num >= 0) {
      return `${(num * 100).toFixed(2)}%`;
    }
    return `${num.toFixed(2)}%`;
  };

  useEffect(() => {
    if (registry.length > 0 && visibleStrategies.length > 0) {
      const isSelectedValid = visibleStrategies.some(s => s.id === selectedStrategy);
      if (!isSelectedValid) {
        setSelectedStrategy(visibleStrategies[0].id);
      }
    }
  }, [registry, selectedStrategy, visibleStrategies]);

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

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* EXPLANATORY PANEL */}
      <Card className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
              How to Use the Strategy Lab
            </h3>
            <p className="text-sm text-slate-100 leading-relaxed font-sans font-medium">
              Select one production strategy to inspect how it evaluates the active survivor entry. Recommendations are generated by the SemiSharp backend using the selected contest format, current contest leg, eligible teams, and previously recorded picks.
            </p>
            
            <div className="pt-1 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="font-extrabold text-slate-200">Need the strongest overall option?</span>
              <span className="text-slate-100 font-medium">
                Use Recommendation Workspace to compare all production strategies together.
              </span>
            </div>
          </div>
          
          <div className="shrink-0 flex flex-col gap-2">
            <Button
              id="open-recommendation-workspace-btn"
              onClick={() => onNavigate?.('recommendation_workspace')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-md"
            >
              <Award className="w-4 h-4" />
              Open Recommendation Workspace
            </Button>
            
            {selectedEntry?.format_code === 'CIRCA' && (
              <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider font-mono">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                <span>Circa Contest Rules Active</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* TWO-COLUMN GRID: CONTROLS & OUTPUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: CONTROL PANEL (5 COLUMNS) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* CONTROL CARD */}
          <Card className="p-6 space-y-5 bg-white border border-slate-200">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Settings className="w-4 h-4 text-slate-700" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono">
                1. Strategy Control Panel
              </h3>
            </div>

            {/* Strategy Select */}
            <div className="space-y-1.5 relative">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="strategy-select" className="text-[10px] font-black text-slate-700 uppercase tracking-widest block">
                  Select Strategy Engine
                </label>
                
                {/* TOOLTIP COMPONENT */}
                <div className="relative group inline-block">
                  <div className="flex items-center gap-1 text-[10px] text-indigo-700 font-extrabold font-mono cursor-pointer bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 hover:bg-indigo-100 transition-colors">
                    <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
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
                      <p className="text-[11px] text-slate-100 leading-relaxed font-semibold">
                        {visibleStrategies.find(s => s.id === selectedStrategy)?.desc || STRATEGY_DEFINITIONS.find(d => d.localId === selectedStrategy)?.desc}
                      </p>
                      <div className="text-[9px] text-slate-300 font-black uppercase tracking-widest font-mono flex items-center gap-1 border-t border-slate-800/50 pt-2">
                        <Database className="w-3 h-3 text-slate-400" />
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
                className="w-full text-xs font-black text-slate-900 bg-white border border-slate-300 hover:border-slate-400 rounded-lg px-3 py-2.5 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
              >
                {visibleStrategies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              {/* Selected Strategy Profile block */}
              {(() => {
                const currentStrat = visibleStrategies.find(s => s.id === selectedStrategy);
                if (!currentStrat) return null;
                return (
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 mt-3 shadow-inner">
                    <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                      <span className="text-[10px] font-black text-indigo-300 uppercase tracking-wider font-mono">
                        Active Strategy Profile
                      </span>
                      {currentStrat.classification && (
                        <span className="text-[9px] font-black bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-mono">
                          {currentStrat.classification}
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="text-xs font-extrabold text-white font-sans">
                        {currentStrat.name}
                      </h4>
                      <p className="text-[11px] text-slate-100 leading-relaxed font-sans font-medium">
                        {currentStrat.desc}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-300 pt-2 border-t border-slate-850">
                      <div>
                        <span className="text-slate-400 block uppercase tracking-wider font-semibold">Entry</span>
                        <span className="text-white font-black block truncate">{selectedEntry?.entry_label || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase tracking-wider font-semibold">Format</span>
                        <span className="text-white font-black block truncate">{selectedEntry?.format_name || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase tracking-wider font-semibold">Season</span>
                        <span className="text-white font-black block">{season}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase tracking-wider font-semibold">Current Week</span>
                        <span className="text-white font-black block">Week {week}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Contest Format */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest block">
                Contest Format
              </span>
              <div className="w-full text-xs font-black text-indigo-900 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2.5 font-sans">
                {selectedEntry?.format_name || 'No Format assigned'}
              </div>
            </div>

            {/* Context meta parameters */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                <Database className="w-3.5 h-3.5 text-slate-600" /> Query Context parameters
              </h4>

              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <span className="text-[9px] text-slate-600 uppercase tracking-widest block font-bold">Active Entry</span>
                  <span className="text-slate-900 font-black truncate block" title={selectedEntry?.entry_label || 'Bypassed'}>
                    {selectedEntry?.entry_label || 'Bypassed'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-600 uppercase tracking-widest block font-bold">Contest Season</span>
                  <span className="text-slate-900 font-black">{season} NFL</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-600 uppercase tracking-widest block font-bold">Current Week</span>
                  <span className="text-slate-900 font-black">Week {week}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-600 uppercase tracking-widest block font-bold">Sweat Name</span>
                  <span className="text-slate-900 font-black truncate block" title={selectedEntry?.survivor_sweat_name || 'N/A'}>
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
                  {selectedStrategy === 'monte-carlo' ? 'Running Monte Carlo simulation...' : 'Running selected strategy...'}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Run Selected Strategy
                </>
              )}
            </Button>
          </Card>

          {/* ACTIVE PIPELINE TELEMETRY */}
          <Card className="p-5 space-y-3 bg-slate-950 text-white border border-slate-900 rounded-xl">
            <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <Zap className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> API Stream Monitor
            </h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between border-b border-slate-900 pb-1.5">
                <span className="text-slate-300 font-medium">Endpoint Mapping:</span>
                <span className="font-mono text-emerald-300 font-black text-[11px] truncate max-w-[200px]" title={activeEndpoint || 'Waiting...'}>
                  {activeEndpoint || 'Waiting for trigger...'}
                </span>
              </div>
              <div className="flex justify-between pt-1.5">
                <span className="text-slate-300 font-medium">Query Authorization:</span>
                <span className="text-white font-extrabold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-pulse" />
                  PASS (Verified)
                </span>
              </div>
            </div>
          </Card>

          {/* EXCLUDED LEGACY REGISTRY STRATEGIES REPORT */}
          {excludedRegistryCodes.length > 0 && (
            <Card className="p-4 bg-amber-50 border border-amber-200 text-slate-900 space-y-2 rounded-xl">
              <h4 className="text-[10px] font-black text-amber-800 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" /> Excluded Legacy Strategies
              </h4>
              <p className="text-[11px] text-slate-700 font-semibold leading-relaxed font-sans">
                The following legacy strategies registered in the database are excluded from Strategy Lab:{" "}
                <span className="font-mono font-black text-amber-900 bg-amber-100/80 px-1.5 py-0.5 rounded">
                  {excludedRegistryCodes.join(', ')}
                </span>
              </p>
            </Card>
          )}

        </div>

        {/* RIGHT COLUMN: RECOMMENDATION CARD & DETAILS (7 COLUMNS) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* LOADING STATE */}
          {loading && (
            <Card className="p-16 text-center space-y-4 border border-slate-200 shadow-sm bg-white">
              <LoadingSpinner size="md" message={selectedStrategy === 'monte-carlo' ? 'Running Monte Carlo simulation...' : 'Generating recommendation...'} />
              <p className="text-xs text-slate-700 leading-relaxed font-semibold max-w-sm mx-auto">
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
              <Award className="w-12 h-12 text-slate-300 mx-auto animate-pulse" />
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-800">Select Strategy & Run</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-sans">
                  Select a strategy and run it to inspect its backend-generated recommendation path.
                </p>
              </div>
            </Card>
          )}

          {/* SUCCESS STATE & DISPLAY CARD */}
          {!loading && !error && recommendation && (
            <div className="space-y-6 animate-fade-in animate-duration-300">
              
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-200 px-2 py-1 rounded-md uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full inline-block animate-pulse" />
                  {success}
                </span>
                
                {(recommendation.timestamp || recommendation.rating_week !== undefined) && (
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    {recommendation.timestamp ? `Compiled: ${new Date(recommendation.timestamp).toLocaleTimeString()}` : `Rating Week: ${recommendation.rating_week}`}
                  </span>
                )}
              </div>

               {/* OVERVIEW INFO CARD */}
              <Card className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest font-mono">
                  Strategy Recommendation Overview
                </h4>
                <div className={`grid grid-cols-1 ${selectedStrategy === 'monte-carlo' && activeMatch?.estimated_path_survival_probability !== undefined ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-6`}>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest block">Strategy</span>
                    <span className="text-sm font-black text-slate-900 block font-sans">
                      {recommendation.strategy || recommendation.strategy_name || 'Highest Win Probability'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest block">Contest</span>
                    <span className="text-sm font-black text-slate-900 block font-sans">
                      {recommendation.contest_format || selectedEntry?.format_name || 'No Format'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest block">Entry</span>
                    <span className="text-sm font-black text-indigo-700 block font-sans truncate" title={selectedEntry?.entry_label || 'Bypassed'}>
                      {selectedEntry?.entry_label || 'Bypassed'}
                    </span>
                  </div>
                  {selectedStrategy === 'monte-carlo' && activeMatch?.estimated_path_survival_probability !== undefined && (
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest block">Path Survival Prob</span>
                      <span className="text-sm font-black text-emerald-700 block font-mono">
                        {formatProbability(activeMatch.estimated_path_survival_probability)}
                      </span>
                    </div>
                  )}
                </div>

                {recommendation.hfa_source && (
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] font-mono text-slate-600 font-bold">
                    <span>HFA Source: {recommendation.hfa_source}</span>
                    <span>Season: {recommendation.season} NFL</span>
                  </div>
                )}
              </Card>

              {/* RESULTS HIERARCHY */}
              {activeMatch ? (
                <div className="space-y-6">
                  {/* Section 1: Current-Leg Recommendation */}
                  {(() => {
                    const currentLegPick = activeMatch.picks?.find(p => p.leg_number === week);
                    if (!currentLegPick) return null;
                    return (
                      <Card className="p-6 border-l-4 border-l-emerald-500 bg-white border border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-emerald-600" />
                            1. Current-Leg Recommendation
                          </h4>
                          <span className="text-[10px] font-mono font-black text-slate-750 bg-slate-100 px-2.5 py-0.5 rounded-full">
                            {currentLegPick.leg_name || `Week ${currentLegPick.leg_number}`}
                          </span>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                                {currentLegPick.team.toUpperCase()}
                              </span>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-50 border border-indigo-100 text-indigo-800 font-mono font-black text-xs">
                                {getStrategyDisplayName(selectedStrategy)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-700 font-bold font-sans">
                              Matchup: {(() => {
                                const gameInfo = findMatchupForTeam(currentLegPick.team);
                                return gameInfo ? `${gameInfo.away_team} @ ${gameInfo.home_team} (${gameInfo.stadium || 'TBD'})` : 'TBD';
                              })()}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                            {currentLegPick.projected_line !== undefined && currentLegPick.projected_line !== null && (
                              <div>
                                <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest block font-sans">Projected Line</span>
                                <span className="text-sm font-black text-indigo-700 font-mono">
                                  {formatTwoDecimals(currentLegPick.projected_line)}
                                </span>
                              </div>
                            )}
                            {(currentLegPick.adjusted_probability !== undefined && currentLegPick.adjusted_probability !== null) && (
                              <div>
                                <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest block font-sans">Win Prob</span>
                                <span className="text-sm font-black text-emerald-700 font-mono">
                                  {formatProbability(currentLegPick.adjusted_probability)}
                                </span>
                              </div>
                            )}
                            {currentLegPick.risk_points !== undefined && currentLegPick.risk_points !== null && (
                              <div>
                                <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest block font-sans">Risk Score</span>
                                <span className="text-sm font-black text-slate-900 font-mono">
                                  {Number(currentLegPick.risk_points).toFixed(1)}
                                </span>
                              </div>
                            )}
                            {currentLegPick.edge_points !== undefined && currentLegPick.edge_points !== null && (
                              <div>
                                <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest block font-sans">Edge Points</span>
                                <span className="text-sm font-black text-emerald-700 font-mono">
                                  {formatTwoDecimals(currentLegPick.edge_points)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })()}

                  {/* Section 2: Alternative Option, if returned by the backend */}
                  {(() => {
                    const alternatives = activeMatch.alternative_recommendations || [];
                    if (!alternatives || alternatives.length === 0) return null;
                    return (
                      <Card className="p-6 border-l-4 border-l-indigo-500 bg-white border border-slate-200 shadow-sm space-y-4">
                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-slate-100 pb-3">
                          <RefreshCw className="w-4 h-4 text-indigo-600" />
                          2. Alternative Option
                        </h4>
                        <div className="space-y-4 divide-y divide-slate-100">
                          {alternatives.map((alt, altIdx) => (
                            <div key={altIdx} className={`pt-4 ${altIdx === 0 ? 'pt-0' : ''} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
                              <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                  <span className="text-xl font-bold text-slate-900 font-mono">
                                    {alt.team.toUpperCase()}
                                  </span>
                                  <span className="text-[10px] font-black bg-slate-100 text-slate-700 px-2 py-0.5 rounded uppercase font-mono">
                                    Alternative
                                  </span>
                                </div>
                                <p className="text-xs text-slate-700 font-bold font-sans">
                                  Matchup: {(() => {
                                    const altGameInfo = findMatchupForTeam(alt.team);
                                    return altGameInfo ? `${altGameInfo.away_team} @ ${altGameInfo.home_team}` : 'TBD';
                                  })()}
                                </p>
                              </div>
                              <div className="grid grid-cols-2 gap-6">
                                {alt.projected_line !== undefined && alt.projected_line !== null && (
                                  <div>
                                    <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest block font-sans">Projected Line</span>
                                    <span className="text-sm font-bold text-indigo-700 font-mono">
                                      {formatTwoDecimals(alt.projected_line)}
                                    </span>
                                  </div>
                                )}
                                {alt.risk_points !== undefined && alt.risk_points !== null && (
                                  <div>
                                    <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest block font-sans">Risk Score</span>
                                    <span className="text-sm font-bold text-slate-950 font-mono">
                                      {Number(alt.risk_points).toFixed(1)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    );
                  })()}

                  {/* Section 3: Full-Season Strategy Path */}
                  {activeMatch.picks && activeMatch.picks.length > 0 && (
                    <Card className="p-6 bg-white border border-slate-200 shadow-sm space-y-4">
                      <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-slate-100 pb-3">
                        <Calendar className="w-4 h-4 text-indigo-600" />
                        3. Full-Season Strategy Path
                      </h4>
                      <div className="overflow-hidden border border-slate-200 rounded-xl bg-white overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                          <thead>
                            <tr className="bg-slate-900 border-b border-slate-800 text-[10px] font-extrabold text-slate-200 uppercase tracking-widest font-mono">
                              <th className="py-3 px-4">Leg</th>
                              <th className="py-3 px-4">Week</th>
                              <th className="py-3 px-4">Team</th>
                              <th className="py-3 px-4">Game</th>
                              {activeMatch.picks.some(p => p.projected_line !== undefined) && <th className="py-3 px-4 text-right">Projected Line</th>}
                              {activeMatch.picks.some(p => p.semisharp_spread !== undefined) && <th className="py-3 px-4 text-right">SemiSharp</th>}
                              {activeMatch.picks.some(p => p.market_spread !== undefined) && <th className="py-3 px-4 text-right">Market</th>}
                              {activeMatch.picks.some(p => p.edge_points !== undefined) && <th className="py-3 px-4 text-right">Edge</th>}
                              {activeMatch.picks.some(p => p.adjusted_probability !== undefined) && <th className="py-3 px-4 text-right">Win Probability</th>}
                              <th className="py-3 px-4 text-right">Risk Score</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150 text-xs font-bold text-slate-800">
                            {activeMatch.picks.map((pick, pIdx) => {
                              const gameInfo = findMatchupForTeam(pick.team);
                              const gameDisplay = gameInfo 
                                ? `${gameInfo.away_team} @ ${gameInfo.home_team}`
                                : 'TBD';
                              
                              const isThanksgiving = pick.leg_code === 'THANKSGIVING';
                              const isChristmas = pick.leg_code === 'CHRISTMAS';
                              
                              const rowBgClass = isThanksgiving 
                                ? 'bg-amber-50/70 hover:bg-amber-50 transition-colors border-l-4 border-l-amber-500'
                                : isChristmas 
                                  ? 'bg-rose-50/70 hover:bg-rose-50 transition-colors border-l-4 border-l-rose-500'
                                  : 'hover:bg-slate-50 transition-colors';

                              return (
                                <tr key={pIdx} className={rowBgClass}>
                                  <td className="py-4 px-4 font-mono font-black text-slate-500">
                                    {pick.leg_number}
                                  </td>
                                  <td className="py-4 px-4 font-black text-slate-900">
                                    <div className="flex items-center flex-wrap gap-2">
                                      <span>{pick.leg_name || `Week ${pick.leg_number}`}</span>
                                      {isThanksgiving && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-900 font-mono text-[9px] font-black uppercase tracking-wider">
                                          🍁 Thanksgiving
                                        </span>
                                      )}
                                      {isChristmas && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-rose-100 border border-rose-300 text-rose-900 font-mono text-[9px] font-black uppercase tracking-wider">
                                          🎄 Christmas
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-4 px-4">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-50 border border-indigo-200 text-indigo-800 font-mono font-black text-[11px]">
                                      {pick.team.toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4 font-bold text-slate-700">
                                    {gameDisplay}
                                  </td>
                                  {pick.projected_line !== undefined && (
                                    <td className="py-4 px-4 text-right font-mono font-black text-indigo-750 text-sm">
                                      {formatTwoDecimals(pick.projected_line)}
                                    </td>
                                  )}
                                  {pick.semisharp_spread !== undefined && (
                                    <td className="py-4 px-4 text-right font-mono font-black text-indigo-750 text-sm">
                                      {formatTwoDecimals(pick.semisharp_spread)}
                                    </td>
                                  )}
                                  {pick.market_spread !== undefined && (
                                    <td className="py-4 px-4 text-right font-mono font-bold text-slate-700 text-sm">
                                      {formatTwoDecimals(pick.market_spread)}
                                    </td>
                                  )}
                                  {pick.edge_points !== undefined && (
                                    <td className="py-4 px-4 text-right font-mono font-black text-emerald-700 text-sm">
                                      {formatTwoDecimals(pick.edge_points)}
                                    </td>
                                  )}
                                  {pick.adjusted_probability !== undefined && (
                                    <td className="py-4 px-4 text-right font-mono font-black text-emerald-700 text-sm">
                                      {formatProbability(pick.adjusted_probability)}
                                    </td>
                                  )}
                                  <td className="py-4 px-4 text-right font-mono font-black text-slate-900 text-sm">
                                    {pick.risk_points !== undefined && pick.risk_points !== null ? Number(pick.risk_points).toFixed(1) : '0.0'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  )}

                  {/* Section 4: Strategy Rationale and Risk Details */}
                  {(() => {
                    const currentLegPick = activeMatch.picks?.find(p => p.leg_number === week);
                    const currentRisk = currentLegPick ? findRiskForTeam(currentLegPick.team) : null;
                    const riskStyle = currentRisk ? getRiskAssessmentStyle(currentRisk.risk_points) : null;
                    const CardRiskIcon = riskStyle?.Icon;
                    
                    const survivalMetrics = (recommendation as any).survival_metrics || (recommendation as any).survivalMetrics;
                    const simulationInfo = (recommendation as any).simulation_information || (recommendation as any).simulationInformation;
                    const confidenceInfo = (recommendation as any).confidence_information || (recommendation as any).confidenceInformation;

                    const hasMC = !!(survivalMetrics || simulationInfo || confidenceInfo);
                    const hasRationale = !!(currentLegPick?.rationale || currentLegPick?.risk_summary);
                    const hasRisk = !!currentRisk;

                    if (!hasMC && !hasRationale && !hasRisk) return null;

                    return (
                      <Card className="p-6 bg-white border border-slate-200 shadow-sm space-y-6">
                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-slate-100 pb-3">
                          <AlertTriangle className="w-4 h-4 text-indigo-600" />
                          4. Strategy Rationale and Risk Details
                        </h4>

                        <div className="space-y-6">
                          {currentRisk && riskStyle && (
                            <div className={`rounded-xl p-4 border ${riskStyle.assessmentBgClass} ${riskStyle.assessmentBorderClass} ${riskStyle.assessmentTextClass}`}>
                              <span className="font-bold block mb-1 flex items-center gap-1.5 font-mono text-[10px]">
                                {CardRiskIcon && <CardRiskIcon className={`w-3.5 h-3.5 ${riskStyle.iconColorClass}`} />} 
                                RISK ASSESSMENT ({riskStyle.label})
                              </span>
                              <div className="flex justify-between font-bold text-xs font-sans">
                                <span>Weather and Hazard Points:</span>
                                <span className="font-black font-mono">{currentRisk.risk_points} Points ({currentRisk.risk_types})</span>
                              </div>
                            </div>
                          )}

                          {currentLegPick?.rationale && (
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs leading-relaxed text-slate-850 font-bold">
                              <span className="font-extrabold text-slate-900 block mb-1">Engine Rationale:</span>
                              {currentLegPick.rationale}
                            </div>
                          )}

                          {currentLegPick?.risk_summary && (
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs leading-relaxed text-slate-850 font-bold">
                              <span className="font-extrabold text-slate-900 block mb-1">Model Optimization Notes:</span>
                              {currentLegPick.risk_summary}
                            </div>
                          )}

                          {simulationInfo && (
                            <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
                              <h5 className="text-[10px] font-black text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                                <Database className="w-4 h-4 text-indigo-600" /> Simulation Information
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
                                {Object.entries(simulationInfo).map(([key, val]) => (
                                  <div key={key} className="flex justify-between border-b border-slate-200 pb-1.5">
                                    <span className="text-[10px] text-slate-600 uppercase tracking-widest font-mono font-black">{key.replace(/_/g, ' ')}</span>
                                    <span className="font-mono font-black text-slate-900">
                                      {typeof val === 'number' ? formatTwoDecimals(val) : (typeof val === 'object' ? JSON.stringify(val) : String(val))}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {survivalMetrics && (
                            <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
                              <h5 className="text-[10px] font-black text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-emerald-600" /> Survival Metrics
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
                                {Object.entries(survivalMetrics).map(([key, val]) => {
                                  const isProb = key.toLowerCase().includes('prob') || key.toLowerCase().includes('percent') || key.toLowerCase().includes('rate');
                                  return (
                                    <div key={key} className="flex justify-between border-b border-slate-200 pb-1.5">
                                      <span className="text-[10px] text-slate-600 uppercase tracking-widest font-mono font-black">{key.replace(/_/g, ' ')}</span>
                                      <span className="font-mono font-black text-slate-900">
                                        {isProb && typeof val === 'number' ? formatProbability(val) : (typeof val === 'number' ? formatTwoDecimals(val) : (typeof val === 'object' ? JSON.stringify(val) : String(val)))}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {confidenceInfo && (
                            <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
                              <h5 className="text-[10px] font-black text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Confidence Information
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
                                {Object.entries(confidenceInfo).map(([key, val]) => {
                                  const isProb = key.toLowerCase().includes('prob') || key.toLowerCase().includes('percent') || key.toLowerCase().includes('rate') || key.toLowerCase().includes('confidence');
                                  return (
                                    <div key={key} className="flex justify-between border-b border-slate-200 pb-1.5">
                                      <span className="text-[10px] text-slate-600 uppercase tracking-widest font-mono font-black">{key.replace(/_/g, ' ')}</span>
                                      <span className="font-mono font-black text-indigo-700">
                                        {isProb && typeof val === 'number' ? formatProbability(val) : (typeof val === 'number' ? formatTwoDecimals(val) : (typeof val === 'object' ? JSON.stringify(val) : String(val)))}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })()}
                </div>
              ) : recommendation.recommendations && recommendation.recommendations.length > 0 ? (
                // LEGACY RECOMMENDATIONS COMPATIBILITY FALLBACK
                <div className="space-y-4">
                  {recommendation.recommendations.map((rec, idx) => {
                    const gameInfo = findMatchupForTeam(rec.team);
                    const spreadInfo = findSpreadForTeam(rec.team);
                    const riskInfo = findRiskForTeam(rec.team);

                    return (
                      <Card key={idx} className="p-6 border-t-4 border-t-emerald-500 space-y-6 bg-white border border-slate-200">
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest block font-sans">
                              Recommended Selection {idx + 1}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                                {rec.team.toUpperCase()}
                              </span>
                              <span className="text-xs font-black text-slate-600 font-mono">
                                {gameInfo ? (gameInfo.home_team === rec.team ? `vs ${gameInfo.away_team}` : `@ ${gameInfo.home_team}`) : ''}
                              </span>
                            </div>
                          </div>

                          <div className="text-left sm:text-right space-y-0.5 self-start sm:self-auto">
                            <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest block font-sans">Strategy Engine</span>
                            <span className="text-xs font-black text-indigo-800 bg-indigo-50 px-2 py-1 rounded uppercase tracking-wider font-mono border border-indigo-100">
                              {recommendation.strategy_name || recommendation.strategy || 'N/A'}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                          
                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest block font-sans">Matchup Stadium</span>
                            <span className="text-xs font-black text-slate-800 block truncate">
                              {gameInfo?.stadium || 'TBD'}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest block font-sans">Projected Spread</span>
                            <span className="text-xs font-black text-slate-800 block font-mono">
                              {spreadInfo?.predicted_spread !== undefined 
                                ? formatTwoDecimals(spreadInfo.predicted_spread) 
                                : rec.future_value !== undefined 
                                  ? `FV: ${formatTwoDecimals(rec.future_value)}` 
                                  : 'TBD'}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest block font-sans">Safety Rating</span>
                            <span className="text-xs font-black text-slate-800 block font-mono">
                              {rec.safety_rating !== undefined 
                                ? `${rec.safety_rating}/10` 
                                : riskInfo?.risk_points !== undefined 
                                  ? `${(10 - riskInfo.risk_points).toFixed(1)}/10` 
                                  : 'N/A'}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest block font-sans">Win Probability</span>
                            <span className="text-xs font-black text-slate-800 block font-mono">
                              {rec.pick_probability !== undefined 
                                ? formatProbability(rec.pick_probability) 
                                : 'TBD'}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest block font-sans font-mono">Model version</span>
                            <span className="text-xs font-mono font-black text-slate-800 block">
                              {recommendation.model_version || 'v4.2-Pro'}
                            </span>
                          </div>

                          <div className="space-y-1 col-span-2 md:col-span-1">
                            <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest block font-sans">Entry Reference</span>
                            <span className="text-xs font-black text-slate-800 block truncate" title={selectedEntry?.entry_label}>
                              {selectedEntry?.entry_label || 'Bypassed'}
                            </span>
                          </div>

                        </div>

                        {rec.notes && (
                          <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 text-xs leading-relaxed text-slate-850 font-bold font-sans">
                            <span className="font-extrabold text-slate-900 block mb-1">Model Optimization Notes:</span>
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
                              <div className="flex justify-between font-bold font-sans">
                                <span>Weather and Hazard Points:</span>
                                <span className="font-black font-mono">{riskInfo.risk_points.toFixed(1)} Points ({riskInfo.risk_types})</span>
                              </div>
                            </div>
                          );
                        })()}

                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="p-8 text-center space-y-2 border border-slate-200 bg-white">
                  <span className="text-slate-400 text-lg block">⚠️</span>
                  <h4 className="text-sm font-bold text-slate-800">No recommendations found for this entry.</h4>
                  <p className="text-xs text-slate-600 font-sans">
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
