/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, LoadingSpinner, Alert } from './ui';
import { SemiSharpApi } from '../api';
import { SemiSharpContext, StrategyRecommendation, StrategyBackendPick } from '../types';
import {
  Compass,
  Award,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  RefreshCw,
  User,
  Sliders,
  TrendingUp,
  Sparkles,
  Layers,
  ShieldAlert,
  FileText,
  ChevronRight,
  Info,
  Calendar,
  Cpu,
  GitBranch,
  Check,
  AlertOctagon,
  Radio,
  ExternalLink
} from 'lucide-react';

interface Step2StrategyPlannerProps {
  context: SemiSharpContext | null;
  onNavigate: (tab: string) => void;
}

const ALLOWED_STRATEGY_CODES = [
  'BOTTOM_SIX_ROAD_FADE',
  'CURRENT_WEEK_HIGHEST_WIN',
  'DYNAMIC_PROGRAMMING',
  'FUTURE_VALUE',
  'MARKET_ARBITRAGE_EXIT',
  'MONTE_CARLO'
];

// Known production strategy metadata fallbacks in case database strategy.registry lacks descriptions
const FALLBACK_STRATEGY_DEFS = [
  {
    strategy_code: 'BOTTOM_SIX_ROAD_FADE',
    display_name: 'Bottom Six Road Fade',
    description: 'Targets matchups where a bottom-tier NFL team plays on the road, defaulting to safe favorites only when no such fade opportunities exist.',
    classification: 'RISK FADE',
    endpoint_slug: 'bottom-six-road-fade',
    characteristics: ['Target Weak Opponents', 'Home Favorites Emphasis', 'High Discrepancy Fades']
  },
  {
    strategy_code: 'CURRENT_WEEK_HIGHEST_WIN',
    display_name: 'Current Week Highest Win',
    description: 'Maximizes immediate survival by selecting the safest favorite for the current week, adjusted by V3 risk scores to avoid high-volatility games.',
    classification: 'RECOMMENDED',
    endpoint_slug: 'current-week-highest-win',
    characteristics: ['Immediate Survival Focus', 'Low Variance', 'V3 Risk Penalized']
  },
  {
    strategy_code: 'DYNAMIC_PROGRAMMING',
    display_name: 'Dynamic Programming Optimizer',
    description: 'Optimizes team selections across all remaining season legs using backward induction to discover the global maximum expected value path.',
    classification: 'DYNAMIC OPTIMIZATION',
    endpoint_slug: 'dynamic-programming',
    characteristics: ['Backward Induction Engine', 'Global Season Optimum', 'Full Slate Horizon']
  },
  {
    strategy_code: 'FUTURE_VALUE',
    display_name: 'Future Value Preservation',
    description: 'Evaluates picks by applying a future value penalty, discouraging using elite teams (e.g. KC, BAL, PHI) when they hold high option value in later, more difficult legs.',
    classification: 'PRESERVATION',
    endpoint_slug: 'future-value',
    characteristics: ['Late-Season Optimization', 'Elite Team Conservation', 'Path EV Maximization']
  },
  {
    strategy_code: 'MARKET_ARBITRAGE_EXIT',
    display_name: 'Market Arbitrage Exit',
    description: 'Optimizes team selections for a Week 8 exit or hedge horizon by balancing spread strength against risk scores to maximize asset value.',
    classification: 'EXIT HORIZON',
    endpoint_slug: 'market-arbitrage-exit',
    characteristics: ['Mid-Season Exit Horizon', 'Asset Hedge Maximization', 'Short-Term Capital Protection']
  },
  {
    strategy_code: 'MONTE_CARLO',
    display_name: 'Monte Carlo Survivor',
    description: 'Uses V3 risk-expanded distribution scales to simulate 10,000+ survival paths, identifying the strategy that maximizes cumulative survival probability.',
    classification: 'MONTE CARLO',
    endpoint_slug: 'monte-carlo',
    characteristics: ['10,000+ Path Simulations', 'Stochastic Distribution', 'Tail-Risk Resistant']
  }
];

const getCategoryBadgeStyle = (classification?: string, code?: string) => {
  const norm = (classification || code || '').toUpperCase();
  if (norm.includes('RECOMMENDED') || norm.includes('HIGHEST_WIN')) {
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  }
  if (norm.includes('PRESERVATION') || norm.includes('VALUE')) {
    return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
  }
  if (norm.includes('DYNAMIC') || norm.includes('GLOBAL')) {
    return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
  }
  if (norm.includes('MONTE') || norm.includes('SIMULATION')) {
    return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
  }
  if (norm.includes('EDGE') || norm.includes('PROJECTION')) {
    return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  }
  if (norm.includes('FADE') || norm.includes('ROAD')) {
    return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  }
  if (norm.includes('HOLIDAY') || norm.includes('CIRCA')) {
    return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
  }
  return 'bg-slate-500/10 text-slate-300 border-slate-500/30';
};

const formatSpread = (val?: number) => {
  if (val === undefined || val === null || isNaN(val)) return '—';
  return val > 0 ? `+${val.toFixed(1)}` : val.toFixed(1);
};

const formatProb = (val?: number) => {
  if (val === undefined || val === null || isNaN(val)) return '—';
  const pct = val <= 1 && val >= 0 ? val * 100 : val;
  return `${pct.toFixed(1)}%`;
};

export const Step2StrategyPlanner: React.FC<Step2StrategyPlannerProps> = ({
  context,
  onNavigate,
}) => {
  const { selectedEntry } = useAuth();

  // Active Context State
  const [systemContext, setSystemContext] = useState<SemiSharpContext | null>(context);

  // Strategy Registry State
  const [registry, setRegistry] = useState<any[]>([]);
  const [loadingRegistry, setLoadingRegistry] = useState<boolean>(true);
  const [registryError, setRegistryError] = useState<string | null>(null);

  // Selection & Roadmap State
  const [selectedStrategyCode, setSelectedStrategyCode] = useState<string>('CURRENT_WEEK_HIGHEST_WIN');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [roadmapData, setRoadmapData] = useState<StrategyRecommendation | null>(null);
  const [roadmapError, setRoadmapError] = useState<string | null>(null);

  // 1. Fetch System Context from GET /context/current if not provided
  useEffect(() => {
    let isMounted = true;
    const fetchSystemContext = async () => {
      try {
        const ctx = await SemiSharpApi.getContext();
        if (isMounted) {
          setSystemContext(ctx);
        }
      } catch (err) {
        console.warn('Unable to load current context from backend:', err);
      }
    };

    if (!context) {
      fetchSystemContext();
    } else {
      setSystemContext(context);
    }

    return () => { isMounted = false; };
  }, [context]);

  // 2. Fetch Strategy Registry from GET /strategies
  useEffect(() => {
    let isMounted = true;
    const fetchRegistry = async () => {
      setLoadingRegistry(true);
      setRegistryError(null);
      try {
        const data = await SemiSharpApi.getStrategyRegistry();
        if (isMounted && Array.isArray(data)) {
          setRegistry(data);
          if (data.length > 0 && data[0].strategy_code) {
            setSelectedStrategyCode(data[0].strategy_code);
          }
        }
      } catch (err: any) {
        console.error('Error fetching strategy registry:', err);
        if (isMounted) {
          setRegistryError(err?.message || 'Failed to connect to backend strategy registry.');
        }
      } finally {
        if (isMounted) setLoadingRegistry(false);
      }
    };

    fetchRegistry();
    return () => { isMounted = false; };
  }, []);

  // Combine Registry data with Fallbacks to guarantee complete descriptions for 6 active strategies
  const availableStrategies = useMemo(() => {
    const sourceList = registry.length > 0 ? registry : FALLBACK_STRATEGY_DEFS;

    // Filter strictly to the 6 active production strategy codes
    const filteredSource = sourceList.filter(item => ALLOWED_STRATEGY_CODES.includes(item.strategy_code));
    const activeList = filteredSource.length > 0 ? filteredSource : FALLBACK_STRATEGY_DEFS;

    return activeList.map(item => {
      const fallback = FALLBACK_STRATEGY_DEFS.find(f => f.strategy_code === item.strategy_code);
      return {
        strategy_code: item.strategy_code,
        display_name: item.display_name || fallback?.display_name || item.strategy_code,
        description: item.description || fallback?.description || 'Production survivor strategy model.',
        classification: item.classification || item.runtime_classification || fallback?.classification || 'PRODUCTION',
        endpoint_slug: item.endpoint_slug || item.slug || fallback?.endpoint_slug || null,
        characteristics: fallback?.characteristics || ['Live API Registered', 'V3 Engine Powered']
      };
    });
  }, [registry]);

  const activeStrategyObj = useMemo(() => {
    return availableStrategies.find(s => s.strategy_code === selectedStrategyCode) || availableStrategies[0];
  }, [availableStrategies, selectedStrategyCode]);

  // Sync selected strategy code to localStorage for Step 2 consumption
  useEffect(() => {
    if (selectedStrategyCode) {
      try {
        localStorage.setItem('selected_strategy_code', selectedStrategyCode);
        if (activeStrategyObj?.display_name) {
          localStorage.setItem('selected_strategy_name', activeStrategyObj.display_name);
        }
      } catch (e) {
        console.warn('LocalStorage error:', e);
      }
    }
  }, [selectedStrategyCode, activeStrategyObj]);

  // Active Context Parameters
  const activeSeason = systemContext?.season || 2026;
  const activeContestFormat = (systemContext as any)?.contest_format || (systemContext as any)?.format_code || selectedEntry?.format_code || 'STANDARD';
  const activeEntryId = selectedEntry?.entry_id;

  // 3. Action Handler: Generate & Review Season Roadmap
  const handleGenerateRoadmap = useCallback(async () => {
    if (!selectedStrategyCode) return;
    setIsGenerating(true);
    setRoadmapError(null);
    setRoadmapData(null);

    try {
      const data = await SemiSharpApi.getStrategyRoadmap(
        selectedStrategyCode,
        activeSeason,
        activeContestFormat,
        activeEntryId,
        activeStrategyObj?.endpoint_slug || undefined
      );
      setRoadmapData(data);
    } catch (err: any) {
      console.error('Error generating strategy roadmap:', err);
      setRoadmapError(err?.message || 'Failed to generate season strategy roadmap from backend API.');
    } finally {
      setIsGenerating(false);
    }
  }, [selectedStrategyCode, activeSeason, activeContestFormat, activeEntryId, activeStrategyObj]);

  // Auto-generate roadmap when entry or strategy selection changes
  useEffect(() => {
    if (selectedStrategyCode && activeSeason && activeContestFormat) {
      handleGenerateRoadmap();
    }
  }, [selectedStrategyCode, activeSeason, activeContestFormat, activeEntryId, handleGenerateRoadmap]);

  // Extract picks array from backend response
  const roadmapPicks = useMemo(() => {
    if (!roadmapData) return [];
    if (roadmapData.entries && roadmapData.entries.length > 0) {
      const match = activeEntryId
        ? roadmapData.entries.find((e: any) => String(e.entry_id) === String(activeEntryId))
        : null;
      return match?.picks || roadmapData.entries[0]?.picks || [];
    }
    return (roadmapData as any).picks || roadmapData.recommendations || [];
  }, [roadmapData, activeEntryId]);

  // Extract path survival probability if present
  const pathSurvivalProb = useMemo(() => {
    if (!roadmapData) return null;
    if (roadmapData.entries && roadmapData.entries.length > 0) {
      const match = activeEntryId
        ? roadmapData.entries.find((e: any) => String(e.entry_id) === String(activeEntryId))
        : null;
      return match?.estimated_path_survival_probability ?? roadmapData.entries[0]?.estimated_path_survival_probability;
    }
    return (roadmapData as any).estimated_path_survival_probability ?? null;
  }, [roadmapData, activeEntryId]);

  return (
    <div className="space-y-6 animate-fade-in text-left font-sans text-slate-900" id="step1_strategy_selection_workspace">

      {/* 1. STATUS HEADER */}
      <div className="p-4 bg-slate-900 text-white border border-slate-800 rounded-2xl shadow-3xs">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-extrabold font-mono text-emerald-400 tracking-wider uppercase">
              STATUS: OPERATIONAL • LIVE API REGISTERED
            </span>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
              GET /strategies
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
            <span className="px-2.5 py-1 bg-slate-800 rounded-lg border border-slate-700 text-slate-200">
              Season {activeSeason}
            </span>
            <span className="px-2.5 py-1 bg-slate-800 rounded-lg border border-slate-700 text-indigo-300">
              Format: {activeContestFormat}
            </span>
            {selectedEntry && (
              <span className="px-2.5 py-1 bg-indigo-950 text-indigo-300 rounded-lg border border-indigo-800">
                {selectedEntry.entry_label || `Entry #${selectedEntry.entry_id}`}
              </span>
            )}
          </div>
        </div>

      </div>

      {/* 2. STRATEGY REGISTRY GRID / CARDS */}
      <Card className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-3xs space-y-6" id="card_strategy_grid">
        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 font-mono uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <span>Available Algorithmic Survivor Strategies</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Select a strategy from the backend strategy registry to inspect its optimization rules and generate a multi-week roadmap.
            </p>
          </div>

          {loadingRegistry && (
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
              <LoadingSpinner size="sm" />
              <span>Connecting to GET /strategies...</span>
            </div>
          )}
        </div>

        {registryError && (
          <Alert type="warning" message={`${registryError} (Using offline production fallback strategy definitions)`} />
        )}

        {/* Grid of Available Strategies */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableStrategies.map((strat) => {
            const isSelected = selectedStrategyCode === strat.strategy_code;
            const categoryBadge = getCategoryBadgeStyle(strat.classification, strat.strategy_code);

            return (
              <div
                key={strat.strategy_code}
                onClick={() => setSelectedStrategyCode(strat.strategy_code)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                  isSelected
                    ? 'bg-slate-900 text-white border-indigo-500 ring-2 ring-indigo-500/30 shadow-md scale-[1.01]'
                    : 'bg-white text-slate-900 border-slate-200/90 hover:border-slate-300 hover:shadow-2xs'
                }`}
              >
                <div className="space-y-3">
                  {/* Card Header & Radio selection indicator */}
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase border ${categoryBadge}`}>
                      {strat.classification}
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="radio"
                        name="strategy_selection"
                        checked={isSelected}
                        onChange={() => setSelectedStrategyCode(strat.strategy_code)}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className={`text-sm font-extrabold font-mono tracking-tight ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {strat.display_name}
                    </h4>
                    <div className={`mt-2.5 p-2.5 rounded-lg border text-xs leading-relaxed font-semibold transition-colors ${
                      isSelected
                        ? 'bg-slate-800/90 border-slate-700/90 text-slate-100 shadow-inner'
                        : 'bg-slate-50 border-slate-200/90 text-slate-800 shadow-2xs'
                    }`}>
                      {strat.description}
                    </div>
                  </div>
                </div>

                {/* Characteristics list */}
                <div className="space-y-2 border-t pt-3 border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap gap-1.5">
                    {strat.characteristics.map((feat: string, idx: number) => (
                      <span
                        key={idx}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          isSelected
                            ? 'bg-slate-800 text-slate-300 border border-slate-700'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        ✓ {feat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. PROMINENT ACTION BUTTON */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-0.5 text-center sm:text-left">
            <span className="text-xs font-bold font-mono text-slate-900 block">
              Selected Model: <span className="text-indigo-600">{activeStrategyObj?.display_name}</span>
            </span>
            <span className="text-[11px] text-slate-500 block">
              Executes GET /strategies/{activeStrategyObj?.endpoint_slug || activeStrategyObj?.strategy_code?.toLowerCase().replace(/_/g, '-')}/{activeSeason}/{activeContestFormat}
            </span>
          </div>

          <Button
            onClick={handleGenerateRoadmap}
            disabled={isGenerating || !selectedStrategyCode}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-xs font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2.5 shadow-md cursor-pointer shrink-0"
            id="btn_generate_roadmap"
          >
            {isGenerating ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Generating Season Roadmap...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Generate & Review Season Roadmap</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>

      </Card>

      {/* 4. ROADMAP DISPLAY SECTION */}
      {roadmapError && (
        <Alert type="error" message={roadmapError} />
      )}

      {roadmapData && (
        <Card className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-3xs space-y-6 animate-fade-in" id="card_roadmap_results">
          
          {/* Roadmap Header & Probability Summary */}
          <div className="border-b border-slate-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-md uppercase">
                  ROADMAP COMPUTED
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Strategy Code: {roadmapData.strategy || selectedStrategyCode}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 font-mono mt-1 flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-indigo-600" />
                <span>Season Roadmap — {roadmapData.strategy_name || activeStrategyObj?.display_name}</span>
              </h3>
            </div>

            {pathSurvivalProb !== null && pathSurvivalProb !== undefined && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-emerald-800 block">
                    Projected Path Survival Probability
                  </span>
                  <span className="text-lg font-black font-mono text-emerald-900">
                    {formatProb(pathSurvivalProb)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Roadmap Table / Cards */}
          {roadmapPicks.length === 0 ? (
            <div className="p-8 text-center space-y-2 bg-slate-50 border border-slate-200 rounded-xl">
              <Info className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="text-xs font-mono font-bold text-slate-700">No multi-week picks returned by strategy endpoint.</p>
              <p className="text-xs text-slate-500">The strategy model did not generate a path for this entry or context.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-900 text-white font-mono text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Leg / Week</th>
                    <th className="py-3 px-4">Recommended Team</th>
                    <th className="py-3 px-4">Matchup / Game</th>
                    <th className="py-3 px-4 text-center">Projected Line</th>
                    <th className="py-3 px-4 text-center">Win Probability</th>
                    <th className="py-3 px-4">Risk Profile</th>
                    <th className="py-3 px-4">Strategy Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {roadmapPicks.map((pick: StrategyBackendPick, idx: number) => {
                    const legName = pick.leg_name || `Week ${pick.leg_number || idx + 1}`;
                    const teamName = pick.team || 'TBD';
                    const spread = pick.projected_line ?? pick.semisharp_spread;
                    const prob = pick.adjusted_probability;
                    const riskLevel = pick.risk_level || 'Standard Risk';
                    const rationale = pick.rationale || pick.risk_summary || 'Model optimal selection for leg.';

                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 shrink-0">
                          <span className="px-2 py-1 bg-slate-100 rounded border border-slate-200 text-slate-800">
                            {legName}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-extrabold text-indigo-950">
                          <span className="text-sm font-black px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-900 inline-block">
                            {teamName}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {pick.game_id ? (
                            <span className="font-mono text-[11px] text-slate-600">{pick.game_id}</span>
                          ) : (
                            <span className="text-slate-400 font-mono">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                          {formatSpread(spread)}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-extrabold text-emerald-700">
                          {formatProb(prob)}
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-200 rounded">
                            {riskLevel}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 text-xs leading-normal">
                          {rationale}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Bottom Navigation & Workflow Actions */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Button
              onClick={() => onNavigate('power_rankings')}
              variant="outline"
              className="w-full sm:w-auto font-mono text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <span>View Model Reference Data</span>
            </Button>

            <Button
              onClick={() => onNavigate('step_3')}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              id="btn_continue_to_step_3_from_roadmap"
            >
              <span>Continue to Step 3 – Active Weekly Pick Selection</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

        </Card>
      )}

    </div>
  );
};
