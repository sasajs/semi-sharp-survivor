/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, LoadingSpinner, Alert } from './ui';
import { SemiSharpApi, ApiError } from '../api';
import { SemiSharpContext } from '../types';
import {
  Compass,
  Brain,
  CheckCircle2,
  Award,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Info,
  Sparkles,
  X,
  Lock,
  Check,
  Calendar,
  AlertTriangle,
  ChevronRight,
  Trash2,
  BarChart2,
  FileText,
  Clock,
  Layers
} from 'lucide-react';

interface ExecutiveDashboardProps {
  context: SemiSharpContext | null;
  onNavigate: (tab: string) => void;
  onRefreshContext: () => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  context,
  onNavigate,
  onRefreshContext
}) => {
  const { selectedEntry } = useAuth();

  // State management
  const [stratContext, setStratContext] = useState<any>(null);
  const [validPicksData, setValidPicksData] = useState<any>(null);
  const [picksData, setPicksData] = useState<any>(null);
  const [comparisonData, setComparisonData] = useState<any>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Quick Pick Lock-In Modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [targetSelection, setTargetSelection] = useState<{
    team_id?: number;
    team_name: string;
    team_abbr?: string;
    contest_leg_id: number;
    leg_name?: string;
    strategy_name?: string;
  } | null>(null);
  
  const [submittingPick, setSubmittingPick] = useState<boolean>(false);
  const [pickSubmitError, setPickSubmitError] = useState<string | null>(null);
  const [pickSubmitSuccess, setPickSubmitSuccess] = useState<string | null>(null);

  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

  const getFormat = () => selectedEntry?.format_code || 'STANDARD';
  const format = getFormat();

  // Helper to extract key explanatory bullet points for why a pick was recommended
  const getRecommendationKeyPoints = (rec: any) => {
    if (!rec) return [];
    
    const wp = formatPercentage(rec.risk_adjusted_wp || rec.baseline_wp);
    const risk = rec.risk_level ? String(rec.risk_level).toLowerCase() : 'low';
    const edge = rec.edge_points !== undefined && rec.edge_points !== null ? Number(rec.edge_points) : null;
    const fv = rec.future_value_rank ? `Rank #${rec.future_value_rank}` : 'Low future cost';

    return [
      `Highest projected win probability this week (${wp})`,
      `${risk === 'low' ? 'Lowest' : 'Controlled'} estimated upset risk (${risk.toUpperCase()} risk level)`,
      `Preserves stronger future survivor opportunities (${fv})`,
      edge !== null && edge > 0 
        ? `Positive market edge (+${edge.toFixed(1)} pts) versus consensus spread`
        : `Aligned with consensus market lines`
    ];
  };

  // Helper to format strategy display names
  const formatStrategyName = (name?: string) => {
    if (!name) return 'Season Optimizer';
    if (/dynamic\s*programming/i.test(name) || /dynamic_programming/i.test(name)) {
      return 'Season Optimizer';
    }
    return name;
  };

  // Helper to convert technical jargon into plain survivor language
  const cleanRationaleText = (text: string, teamName: string) => {
    if (!text) {
      return `Selecting ${teamName} offers the highest projected win probability for this week while conserving top-tier teams for upcoming high-leverage weeks.`;
    }
    return text
      .replace(/beam search/gi, 'strategy optimization model')
      .replace(/beam-search/gi, 'strategy optimization model')
      .replace(/dynamic programming/gi, 'season-long path planning')
      .replace(/retained remaining-season path/gi, 'conserved future week options')
      .replace(/risk-adjusted WP/gi, 'safety-adjusted win probability')
      .replace(/risk-adjusted win probability/gi, 'safety-adjusted win probability');
  };

  // Fetch all Decision Support Data in Parallel
  const fetchDecisionData = async () => {
    if (!context || !selectedEntry) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const season = context.season;
      const formatStr = getFormat();
      const entryId = selectedEntry.entry_id;

      const [picksRes, stratRes, compareRes] = await Promise.all([
        SemiSharpApi.getEntryPicks(entryId).catch(() => null),
        SemiSharpApi.getStrategyContext(entryId, formatStr).catch(() => null),
        SemiSharpApi.compareStrategies(season, formatStr, entryId).catch(() => null)
      ]);

      setPicksData(picksRes);
      setStratContext(stratRes);
      setComparisonData(compareRes);

      const legId = stratRes?.current_contest_leg_id;
      if (legId !== undefined && legId !== null) {
        try {
          const validPicks = await SemiSharpApi.getValidPicks(entryId, legId);
          setValidPicksData(validPicks);
        } catch {
          // Valid picks optional fallback
        }
      }
    } catch (err) {
      console.error("Decision data load failure:", err);
      setError("Failed to load strategy recommendations from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecisionData();
  }, [context, selectedEntry]);

  const handleRefresh = async () => {
    setRefreshing(true);
    onRefreshContext();
    await fetchDecisionData();
    setRefreshing(false);
  };

  // Helper to extract official recorded pick for current leg
  const getCurrentLegPick = () => {
    if (!picksData?.picks || !Array.isArray(picksData.picks) || picksData.picks.length === 0) {
      return null;
    }
    const legId = stratContext?.current_contest_leg_id;
    if (legId !== undefined && legId !== null) {
      const matched = picksData.picks.find((p: any) => {
        const pLegId = p.contest_leg?.contest_leg_id || p.contest_leg_id;
        return String(pLegId) === String(legId);
      });
      if (matched) return matched;
    }
    return picksData.picks[0];
  };

  const currentPick = getCurrentLegPick();

  // Extract strategy recommendations
  const getStrategiesList = (): any[] => {
    if (comparisonData && Array.isArray(comparisonData.strategies)) {
      return comparisonData.strategies;
    }
    return [];
  };

  const strategies = getStrategiesList();

  // Determine Primary Recommendation
  const getPrimaryRecommendation = () => {
    if (!strategies || strategies.length === 0) return null;
    
    // Find highest win or consensus recommendation
    const primaryStrat = strategies.find((s: any) => 
      s.strategy_code === 'HIGHEST_WIN' || s.strategy_code === 'DYNAMIC_PROGRAMMING'
    ) || strategies[0];

    return {
      strategy: primaryStrat,
      rec: primaryStrat?.primary_recommendation
    };
  };

  const primaryObj = getPrimaryRecommendation();
  const primaryRec = primaryObj?.rec;
  const primaryStrat = primaryObj?.strategy;

  // Derive Alternative Recommendations (excluding primary)
  const getAlternativeRecommendations = () => {
    if (!strategies || strategies.length <= 1) return [];
    
    const altMap = new Map<string, any>();
    
    strategies.forEach((strat: any) => {
      const r = strat.primary_recommendation;
      if (!r) return;
      const teamKey = (r.team || r.team_abbr || r.team_name || '').toUpperCase();
      const primaryKey = (primaryRec?.team || primaryRec?.team_abbr || primaryRec?.team_name || '').toUpperCase();
      
      if (teamKey && teamKey !== primaryKey && !altMap.has(teamKey)) {
        altMap.set(teamKey, {
          strategyName: strat.display_name || strat.strategy_code,
          strategyCode: strat.strategy_code,
          rec: r
        });
      }
    });

    return Array.from(altMap.values());
  };

  const alternativeRecs = getAlternativeRecommendations();

  // Format percentages safely
  const formatPercentage = (val: any) => {
    const num = Number(val);
    if (isNaN(num)) return String(val || 'N/A');
    if (num <= 1) {
      return `${(num * 100).toFixed(1)}%`;
    }
    return `${num.toFixed(1)}%`;
  };

  // Open Lock-In Confirmation Modal
  const initiateLockIn = (recItem: any, sourceStratName?: string) => {
    if (!recItem) return;

    const legId = stratContext?.current_contest_leg_id || validPicksData?.contest_leg?.contest_leg_id;
    if (!legId) {
      setPickSubmitError("Current contest leg ID unavailable.");
      return;
    }

    // Match team_id from validPicksData if available
    let teamIdToUse = recItem.team_id;
    if (!teamIdToUse && validPicksData?.valid_teams && Array.isArray(validPicksData.valid_teams)) {
      const matchedTeam = validPicksData.valid_teams.find((vt: any) => {
        const vtAbbr = (vt.team_abbr || vt.abbr || vt.team_code || vt.team_name || '').toUpperCase();
        const recAbbr = (recItem.team || recItem.team_abbr || recItem.team_name || '').toUpperCase();
        return vtAbbr === recAbbr || vt.team_id === recItem.team_id;
      });
      if (matchedTeam) {
        teamIdToUse = matchedTeam.team_id;
      }
    }

    setTargetSelection({
      team_id: teamIdToUse,
      team_name: recItem.team_name || recItem.team || 'Recommended Team',
      team_abbr: recItem.team || recItem.team_abbr,
      contest_leg_id: Number(legId),
      leg_name: validPicksData?.contest_leg?.leg_name || `Contest Leg ${legId}`,
      strategy_name: sourceStratName || primaryStrat?.display_name || 'SemiSharp Strategy'
    });

    setPickSubmitError(null);
    setConfirmModalOpen(true);
  };

  // Submit Official Pick
  const handleConfirmPickSubmission = async () => {
    if (!selectedEntry || !targetSelection) return;

    setSubmittingPick(true);
    setPickSubmitError(null);

    try {
      if (!targetSelection.team_id) {
        throw new Error("Unable to resolve team ID for this selection. Please pick directly via My Entries.");
      }

      const payload = {
        contest_leg_id: targetSelection.contest_leg_id,
        team_id: targetSelection.team_id
      };

      const res = await SemiSharpApi.createPick(selectedEntry.entry_id, payload);
      const teamLabel = res?.team_name || res?.team || targetSelection.team_name;
      const legLabel = targetSelection.leg_name;

      setPickSubmitSuccess(`Official pick recorded: ${teamLabel} locked in for ${legLabel}.`);
      setConfirmModalOpen(false);
      setTargetSelection(null);

      // Refresh decision data
      fetchDecisionData();
    } catch (err: any) {
      console.error("Error submitting pick:", err);
      const msg = err instanceof ApiError ? err.message : err.message || "Failed to record official pick.";
      setPickSubmitError(msg);
    } finally {
      setSubmittingPick(false);
    }
  };

  // Used Teams List
  const usedPicks = picksData?.picks || [];
  const usedTeamsCount = usedPicks.length;
  const remainingTeamsCount = Math.max(0, 32 - usedTeamsCount);

  if (!selectedEntry) {
    return (
      <div className="space-y-6 animate-fade-in text-left font-sans">
        <Card className="p-12 text-center border border-dashed border-slate-200 bg-slate-50/50 space-y-4 rounded-xl">
          <Compass className="w-10 h-10 text-slate-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900 tracking-tight">Select a Survivor Entry</h3>
            <p className="text-xs font-semibold text-slate-500 max-w-md mx-auto">
              Choose an active survivor entry from the header menu to make this week's decision.
            </p>
          </div>
          <Button 
            onClick={() => onNavigate('season_management')}
            size="sm"
            className="bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs uppercase font-bold"
          >
            Go to My Entries
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in text-left font-sans text-slate-900">
      
      {/* 1. COMPACT ENTRY HEADER */}
      <div className="bg-slate-950 text-white rounded-xl p-4 shadow-sm border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          
          <div className="flex items-center gap-3">
            <div className="px-2.5 py-1 bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 rounded font-mono font-black text-xs uppercase tracking-wider">
              Entry Decision
            </div>
            <div>
              <h1 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                <span>{selectedEntry.entry_label}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                  selectedEntry.is_active 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                }`}>
                  {selectedEntry.is_active ? 'ACTIVE' : 'ELIMINATED'}
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="text-slate-500">Updated:</span>
            <span className="text-slate-200 font-bold">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="text-slate-700">|</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white text-[11px] font-mono py-1 px-2.5 h-auto"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

        </div>

        {/* COMPACT METRIC STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 font-mono text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contest Format</span>
            <span className="font-extrabold text-indigo-300 block">{format}</span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Season & Week</span>
            <span className="font-extrabold text-slate-100 block">
              {context?.season ?? 2026} • Week {context?.current_week ?? context?.week ?? 1}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contest Leg</span>
            <span className="font-extrabold text-slate-100 block truncate">
              {validPicksData?.contest_leg?.leg_name || (stratContext?.current_contest_leg_id ? `Leg ${stratContext.current_contest_leg_id}` : 'Syncing...')}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Used Teams ({usedTeamsCount})</span>
            <div className="flex items-center gap-1 overflow-hidden pt-0.5">
              {usedPicks.length === 0 ? (
                <span className="text-slate-500 font-normal">None</span>
              ) : (
                usedPicks.slice(0, 3).map((p: any, idx: number) => (
                  <span key={idx} className="bg-slate-800 text-slate-300 text-[10px] px-1 py-0.2 rounded font-bold">
                    {p.team?.abbr || p.team_abbr || p.team}
                  </span>
                ))
              )}
              {usedPicks.length > 3 && (
                <span className="text-[10px] text-slate-400 font-bold">+{usedPicks.length - 3}</span>
              )}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Remaining Available</span>
            <span className="font-extrabold text-emerald-400 block">{remainingTeamsCount} Teams</span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Official Selection</span>
            {currentPick ? (
              <span className="font-black text-emerald-400 block truncate">
                ✓ {currentPick.team?.abbr || currentPick.team_abbr || currentPick.team || 'LOCKED'}
              </span>
            ) : (
              <span className="font-extrabold text-amber-400 block text-[11px]">
                ⚠ NOT RECORDED
              </span>
            )}
          </div>
        </div>
      </div>

      {/* FEEDBACK MESSAGES */}
      {pickSubmitSuccess && (
        <Alert
          type="success"
          title="Selection Confirmed"
          message={pickSubmitSuccess}
          className="border-emerald-200 bg-emerald-50 text-emerald-900"
        />
      )}

      {pickSubmitError && (
        <Alert
          type="error"
          title="Unable to Record Selection"
          message={pickSubmitError}
        />
      )}

      {loading ? (
        <Card className="p-12 text-center">
          <LoadingSpinner size="md" message="Evaluating strategy matrix for this week's decision..." />
        </Card>
      ) : error ? (
        <Card className="p-6 bg-rose-50 border-rose-200">
          <Alert type="error" title="Strategy Evaluation Error" message={error} />
        </Card>
      ) : (
        <div className="space-y-5">
          
          {/* 1. DEDICATED OFFICIAL PICK (LOCKED) CARD (DECISION MANAGEMENT MODE) */}
          {currentPick && (
            <Card className="p-6 border-2 border-emerald-500/30 bg-emerald-950 text-white shadow-md rounded-xl space-y-5">
              
              {/* Header / Title */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-emerald-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/40">
                    <Lock className="w-5 h-5 shrink-0" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-black uppercase text-emerald-300 tracking-wider block">
                      OFFICIAL PICK (LOCKED)
                    </span>
                    <h3 className="text-sm font-extrabold text-white">
                      Current Official Selection
                    </h3>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 px-3 py-1 rounded-full font-mono text-xs font-bold uppercase tracking-wider">
                  <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  Status: Locked
                </span>
              </div>

              {/* Pick Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs bg-slate-900/90 p-4 rounded-xl border border-emerald-900/60">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Official Pick Team</span>
                  <div className="text-base font-black text-white mt-0.5 flex items-center gap-2">
                    <span className="bg-emerald-500 text-slate-950 px-2 py-0.5 rounded text-xs font-bold">
                      {currentPick.team?.abbr || currentPick.team_abbr || currentPick.team}
                    </span>
                    <span>{currentPick.team?.name || currentPick.team_name || currentPick.team}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Recorded Date / Time</span>
                  <div className="text-xs font-bold text-slate-200 mt-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      {currentPick.created_at ? new Date(currentPick.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Confirmed'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Entry Status</span>
                  <div className="text-xs font-bold text-emerald-300 mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Active & Locked</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-1 flex flex-wrap items-center gap-2.5">
                <Button
                  size="sm"
                  onClick={() => initiateLockIn(primaryRec)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-black uppercase px-4 py-2 cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Change Official Pick
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const el = document.getElementById('alt-strategies-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white font-mono text-xs font-bold uppercase"
                >
                  <Layers className="w-3.5 h-3.5 mr-1 text-indigo-400" />
                  Compare Strategies
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigate('game_analysis')}
                  className="bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white font-mono text-xs font-bold uppercase"
                >
                  View Weekly Game Analysis
                </Button>
              </div>

            </Card>
          )}

          {/* 2. PRIMARY RECOMMENDATION / WHY THIS PICK WAS RECOMMENDED SECTION */}
          {primaryRec ? (
            <Card className="p-6 border border-slate-200 shadow-sm bg-white rounded-xl space-y-6">
              
              {/* EXPLICIT RECOMMENDATION BANNER */}
              <div className="bg-slate-950 text-white p-5 rounded-xl border border-slate-800 space-y-3">
                
                {/* Meta Bar: Recommended Action Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-black uppercase bg-indigo-500/30 border border-indigo-400/50 text-indigo-200 px-2.5 py-0.5 rounded tracking-wider">
                      {currentPick ? 'WHY THIS PICK WAS RECOMMENDED' : 'SEASON OPTIMIZER RECOMMENDATION'}
                    </span>
                    {primaryStrat?.display_name && (
                      <span className="text-xs font-mono text-slate-400">
                        via {formatStrategyName(primaryStrat.display_name)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Primary Headline Message */}
                <div className="pt-1 pb-1">
                  {currentPick ? (
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                        <span className="text-indigo-400 underline decoration-indigo-500/50 underline-offset-4">{primaryRec.team_name || primaryRec.team}</span> ({primaryRec.team || primaryRec.team_abbr})
                      </h2>
                    </div>
                  ) : (
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                        Select <span className="text-indigo-400 underline decoration-indigo-500/50 underline-offset-4">{primaryRec.team_name || primaryRec.team}</span> ({primaryRec.team || primaryRec.team_abbr}) as your {context?.current_week ? `Week ${context.current_week}` : (stratContext?.current_contest_leg_id ? `Leg ${stratContext.current_contest_leg_id}` : 'current')} survivor pick.
                      </h2>
                    </div>
                  )}
                  {primaryRec.opponent && (
                    <p className="text-xs font-mono text-slate-400 mt-1">
                      Matchup: <strong className="text-slate-200">{primaryRec.team_location === 'HOME' ? 'vs' : '@'} {primaryRec.opponent}</strong>
                      {primaryRec.gameday ? ` • ${primaryRec.gameday}` : ''}
                    </p>
                  )}
                </div>

                {/* Main Action Bar (Only shown in Decision Mode when no pick locked) */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                  <div className="text-xs font-mono text-slate-400">
                    {currentPick ? (
                      (currentPick.team?.abbr || currentPick.team_abbr || currentPick.team) === (primaryRec.team || primaryRec.team_abbr) ? (
                        'Current recommendation matches your official pick.'
                      ) : (
                        'Current recommendation differs from your official pick.'
                      )
                    ) : (
                      'Lock in your official pick to update your entry status.'
                    )}
                  </div>

                  {!currentPick && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onNavigate('game_analysis')}
                        className="bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white text-xs font-mono uppercase font-bold"
                      >
                        View Game Analysis <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => initiateLockIn(primaryRec)}
                        disabled={!selectedEntry?.is_active}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono uppercase font-black px-5 py-2 shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Record Official Pick
                      </Button>
                    </div>
                  )}
                </div>

              </div>

              {/* CASUAL-FRIENDLY METRICS GRID */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
                
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Win Probability (Safety)</span>
                  <div className="text-lg font-black text-slate-900 mt-0.5">
                    {formatPercentage(primaryRec.risk_adjusted_wp || primaryRec.baseline_wp)}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Baseline market: {formatPercentage(primaryRec.baseline_wp)}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Future Option Value</span>
                  <div className="text-lg font-black text-slate-900 mt-0.5">
                    {primaryRec.future_value_rank ? `Rank #${primaryRec.future_value_rank}` : 'Low Future Cost'}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Preserves high-value future legs
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Upset Risk Level</span>
                  <div className="mt-1">
                    <span className={`text-[11px] font-black px-2 py-0.5 rounded uppercase tracking-wider border ${
                      String(primaryRec.risk_level).toUpperCase() === 'LOW'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : String(primaryRec.risk_level).toUpperCase() === 'MEDIUM'
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}>
                      {primaryRec.risk_level || 'BALANCED'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Favorable win projection
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Point Spread & Edge</span>
                  <div className="text-lg font-black text-slate-900 mt-0.5">
                    {primaryRec.projected_line !== undefined && primaryRec.projected_line !== null 
                      ? `${primaryRec.projected_line}` 
                      : '—'}
                  </div>
                  {primaryRec.edge_points !== undefined ? (
                    <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">
                      Edge: +{Number(primaryRec.edge_points).toFixed(1)} pts
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 block mt-0.5">Aligned with market</span>
                  )}
                </div>

              </div>

              {/* EXPLANATION / RATIONALE SECTION WITH EXPLANATORY BULLETS */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                
                {/* Key takeaway bullets explaining WHY */}
                <div className="space-y-2">
                  <div className="text-xs font-mono font-black uppercase text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    {currentPick ? 'Why This Pick Was Recommended' : 'Why This Recommendation?'}
                  </div>
                  <ul className="space-y-1.5 text-xs font-medium text-slate-700 pl-1">
                    {getRecommendationKeyPoints(primaryRec).map((bullet: string, bIdx: number) => (
                      <li key={bIdx} className="flex items-start gap-2">
                        <span className="text-indigo-600 font-bold shrink-0">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Plain Language Rationale */}
                <div className="pt-3 border-t border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-500 block">
                    Detailed Model Rationale
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {cleanRationaleText(primaryRec.rationale || primaryRec.explanation, primaryRec.team_name || primaryRec.team)}
                  </p>
                </div>

                {/* Collapsible Technical Details */}
                <div className="pt-2 border-t border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                    className="text-xs font-mono font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>{showTechnicalDetails ? 'Hide Model Technical Details' : 'Show Model Technical Details'}</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showTechnicalDetails ? 'rotate-90' : ''}`} />
                  </button>

                  {showTechnicalDetails && (
                    <div className="mt-3 p-3.5 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono space-y-2 border border-slate-800 animate-fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400">Strategy Model:</span>{' '}
                          <strong className="text-indigo-300">{formatStrategyName(primaryStrat?.display_name)}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Model Code:</span>{' '}
                          <strong className="text-slate-100">{primaryStrat?.strategy_code || 'STANDARD'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Baseline Win Prob:</span>{' '}
                          <strong className="text-slate-100">{formatPercentage(primaryRec.baseline_wp)}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Risk Adjusted WP:</span>{' '}
                          <strong className="text-emerald-400">{formatPercentage(primaryRec.risk_adjusted_wp)}</strong>
                        </div>
                        {primaryRec.risk_score !== undefined && (
                          <div>
                            <span className="text-slate-400">Raw Risk Score:</span>{' '}
                            <strong className="text-slate-100">{Number(primaryRec.risk_score).toFixed(2)}</strong>
                          </div>
                        )}
                        {primaryRec.future_value_rank && (
                          <div>
                            <span className="text-slate-400">Future Value Rank:</span>{' '}
                            <strong className="text-slate-100">#{primaryRec.future_value_rank}</strong>
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                        Evaluated using path optimization algorithms across full season legs, factoring in contestant distribution and future leg leverage.
                      </p>
                    </div>
                  )}
                </div>

              </div>

            </Card>
          ) : (
            <Card className="p-8 text-center bg-slate-50 border-dashed border-slate-200">
              <Info className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">No primary recommendation available</h4>
              <p className="text-xs text-slate-500 mt-1">Check entry format parameters or select an active entry.</p>
            </Card>
          )}

          {/* 3. ALTERNATIVE RECOMMENDATION (DISPLAYS ONLY THE BEST ALTERNATIVE) */}
          {alternativeRecs.length > 0 && (() => {
            const alt = alternativeRecs[0];
            const r = alt.rec;
            const name = r.team_name || r.team;
            const abbr = r.team || r.team_abbr;
            const wp = r.risk_adjusted_wp || r.baseline_wp;

            return (
              <div id="alt-strategies-section" className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 gap-1">
                  <div>
                    <h3 className="text-xs font-black uppercase font-mono tracking-wider text-slate-800 flex items-center gap-2">
                      <Award className="w-4 h-4 text-indigo-600" />
                      Alternative Recommendation
                    </h3>
                    <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                      The best alternative option if you decide to change your official pick.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 self-start sm:self-auto">
                    Evaluated via {formatStrategyName(alt.strategyName)}
                  </span>
                </div>

                <Card className="p-5 border border-slate-200 hover:border-slate-300 transition-colors bg-white rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-black text-xs bg-slate-900 text-white px-2.5 py-1 rounded">
                        {abbr}
                      </span>
                      <div>
                        <span className="font-extrabold text-base text-slate-950 block">{name}</span>
                        {r.opponent && (
                          <span className="text-xs font-mono text-slate-500 block">
                            Matchup: {r.team_location === 'HOME' ? 'vs' : '@'} {r.opponent}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                      {formatStrategyName(alt.strategyName)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Safety WP</span>
                      <span className="font-black text-slate-900">{formatPercentage(wp)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Spread Line</span>
                      <span className="font-black text-slate-900">{r.projected_line ?? '—'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Upset Risk</span>
                      <span className="font-bold text-slate-800">{r.risk_level || 'BALANCED'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Future Cost</span>
                      <span className="font-bold text-slate-800">{r.future_value_rank ? `Rank #${r.future_value_rank}` : 'Low'}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {r.rationale || `Alternative path prioritizing ${alt.strategyName.toLowerCase()} trade-offs.`}
                  </p>

                  <div className="pt-1 flex items-center justify-between border-t border-slate-100">
                    <span className="text-[11px] font-mono text-slate-500">
                      Second-ranked strategy option
                    </span>
                    <Button
                      size="sm"
                      onClick={() => initiateLockIn(r, alt.strategyName)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold uppercase py-1.5 px-4 cursor-pointer"
                    >
                      {currentPick ? 'Switch to this Pick' : 'Select Alternative Pick'}
                    </Button>
                  </div>
                </Card>
              </div>
            );
          })()}

        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {confirmModalOpen && targetSelection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <Card className="max-w-md w-full p-6 bg-white border border-slate-200 shadow-2xl space-y-5 text-left rounded-xl">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black uppercase font-mono text-slate-900 tracking-tight">
                  Confirm Survivor Pick
                </h3>
              </div>
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700 font-sans">
              <p className="font-medium leading-relaxed">
                Confirm locking in your official selection for <strong className="text-slate-900">{selectedEntry.entry_label}</strong>:
              </p>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 uppercase text-[10px]">Selected Team:</span>
                  <span className="font-black text-slate-950 text-sm">
                    {targetSelection.team_name} {targetSelection.team_abbr ? `(${targetSelection.team_abbr})` : ''}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 uppercase text-[10px]">Contest Leg:</span>
                  <span className="font-bold text-slate-800">{targetSelection.leg_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 uppercase text-[10px]">Strategy Source:</span>
                  <span className="font-bold text-indigo-600">{targetSelection.strategy_name}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setConfirmModalOpen(false)}
                className="flex-1 font-mono text-xs uppercase font-bold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmPickSubmission}
                isLoading={submittingPick}
                className="flex-1 bg-slate-950 hover:bg-slate-800 text-white font-mono text-xs uppercase font-bold"
              >
                Confirm Lock In
              </Button>
            </div>

          </Card>
        </div>
      )}

    </div>
  );
};
