/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, LoadingSpinner, Alert } from './ui';
import { SemiSharpApi } from '../api';
import { SemiSharpContext } from '../types';
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Award,
  UserCheck,
  Server,
  Activity,
  Brain,
  Sliders,
  Sparkles,
  Database,
  ArrowRight,
  Info,
  AlertOctagon,
  TrendingUp,
  CheckCircle2,
  RefreshCw,
  Star
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
  const { user, selectedEntry } = useAuth();
  
  // Backend health status states
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [checkingHealth, setCheckingHealth] = useState<boolean>(false);
  const [healthError, setHealthError] = useState<string | null>(null);

  // Operational states for independent widgets
  const [stratContext, setStratContext] = useState<any>(null);
  const [validPicksData, setValidPicksData] = useState<any>(null);
  
  const [picksData, setPicksData] = useState<any>(null);
  const [loadingPicks, setLoadingPicks] = useState<boolean>(true);
  const [picksError, setPicksError] = useState<string | null>(null);

  const [comparisonData, setComparisonData] = useState<any>(null);
  const [loadingComparison, setLoadingComparison] = useState<boolean>(true);
  const [comparisonError, setComparisonError] = useState<string | null>(null);

  const [riskData, setRiskData] = useState<any>(null);
  const [loadingRisk, setLoadingRisk] = useState<boolean>(true);
  const [riskError, setRiskError] = useState<string | null>(null);

  const [marketData, setMarketData] = useState<any>(null);
  const [loadingMarket, setLoadingMarket] = useState<boolean>(true);
  const [marketError, setMarketError] = useState<string | null>(null);

  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Active Contest Format Helper
  const getFormat = () => {
    return selectedEntry?.format_code || '';
  };

  const format = getFormat();

  // Widget 1: Health Check Endpoint Call
  const fetchHealth = async () => {
    setCheckingHealth(true);
    setHealthError(null);
    try {
      const health = await SemiSharpApi.checkHealth();
      setIsHealthy(health.status === 'ok' || (health as any).status === 'healthy');
    } catch (e: any) {
      console.error("Health check failure:", e);
      setIsHealthy(false);
      setHealthError("Health node offline.");
    } finally {
      setCheckingHealth(false);
    }
  };

  // Widget 2: Risk Endpoint Call
  const fetchRisk = async () => {
    if (!context) return;
    setLoadingRisk(true);
    setRiskError(null);
    try {
      const season = context.season;
      const week = context.current_week ?? context.week;
      const res = await SemiSharpApi.getRisk(season, week);
      setRiskData(res);
    } catch (e: any) {
      console.error("Risk load failure:", e);
      setRiskError("Risk telemetry offline.");
    } finally {
      setLoadingRisk(false);
    }
  };

  // Widget 3: Market Projection Edge Endpoint Call
  const fetchMarket = async () => {
    if (!context) return;
    setLoadingMarket(true);
    setMarketError(null);
    try {
      const season = context.season;
      const week = context.current_week ?? context.week;
      const res = await SemiSharpApi.getProjectionEdge(season, week);
      setMarketData(res);
    } catch (e: any) {
      console.error("Market load failure:", e);
      setMarketError("Market telemetry offline.");
    } finally {
      setLoadingMarket(false);
    }
  };

  // Widget 4: Entry Picks & Leg Context Endpoints Call
  const fetchPicksAndLegs = async () => {
    if (!context) return;
    if (!selectedEntry) {
      setLoadingPicks(false);
      setPicksData(null);
      setStratContext(null);
      setValidPicksData(null);
      return;
    }
    if (!selectedEntry.format_code) {
      setLoadingPicks(false);
      setPicksData(null);
      setStratContext(null);
      setValidPicksData(null);
      return;
    }
    setLoadingPicks(true);
    setPicksError(null);
    try {
      const formatStr = getFormat();
      const [picksRes, stratRes] = await Promise.all([
        SemiSharpApi.getEntryPicks(selectedEntry.entry_id),
        SemiSharpApi.getStrategyContext(selectedEntry.entry_id, formatStr)
      ]);
      setPicksData(picksRes);
      setStratContext(stratRes);

      const legId = stratRes?.current_contest_leg_id;
      if (legId !== undefined && legId !== null) {
        try {
          const validPicks = await SemiSharpApi.getValidPicks(selectedEntry.entry_id, legId);
          setValidPicksData(validPicks);
        } catch (e) {
          console.error("Valid picks fetch failed:", e);
        }
      }
    } catch (e: any) {
      console.error("Picks load failure:", e);
      setPicksError("Picks telemetry offline.");
    } finally {
      setLoadingPicks(false);
    }
  };

  // Widget 5: Recommendation Comparison Endpoint Call
  const fetchComparison = async () => {
    if (!context) return;
    if (!selectedEntry) {
      setLoadingComparison(false);
      setComparisonData(null);
      return;
    }
    if (!selectedEntry.format_code) {
      setLoadingComparison(false);
      setComparisonData(null);
      return;
    }
    setLoadingComparison(true);
    setComparisonError(null);
    try {
      const season = context.season;
      const formatStr = getFormat();
      const res = await SemiSharpApi.compareStrategies(season, formatStr, selectedEntry.entry_id);
      setComparisonData(res);
    } catch (e: any) {
      console.error("Comparison load failure:", e);
      setComparisonError("Strategies telemetry offline.");
    } finally {
      setLoadingComparison(false);
    }
  };

  // Initialize and load all widgets independently in parallel
  const loadAllWidgets = (isRefresh = false) => {
    if (!context) return;
    
    if (isRefresh) {
      setRefreshing(true);
    }

    // Trigger each async operation independently to prevent any blocking
    fetchHealth();
    fetchRisk();
    fetchMarket();
    fetchPicksAndLegs();
    fetchComparison();

    if (isRefresh) {
      setRefreshing(false);
    }
  };

  // Load when context or active entry changes
  useEffect(() => {
    loadAllWidgets();
  }, [context, selectedEntry]);

  // Handle Refresh Command
  const handleRefreshAll = () => {
    onRefreshContext();
    loadAllWidgets(true);
  };

  // Entry status resolver
  const getEntryStatus = () => {
    if (picksData && 'is_active' in picksData) {
      return picksData.is_active ? 'Active' : 'Eliminated';
    }
    if (picksData && 'status' in picksData) {
      return picksData.status;
    }
    return selectedEntry ? (selectedEntry.is_active ? 'Active' : 'Eliminated') : 'No Entry Selected';
  };

  const entryStatus = getEntryStatus();

  // Pick history resolver for current week
  const getCurrentPick = () => {
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

  const currentPick = getCurrentPick();

  // Risk summary data extractor
  const getRiskSummary = () => {
    if (!riskData) return null;
    // Only use backend-designated summary fields. No sorting, reduce, min, max or client-side ranking.
    if (riskData.highest_risk_game || riskData.lowest_risk_game || riskData.risk_summary) {
      return {
        highest: riskData.highest_risk_game || null,
        lowest: riskData.lowest_risk_game || null,
        summary: riskData.risk_summary || null
      };
    }
    return null;
  };

  const riskSummary = getRiskSummary();

  // Market edge summary extractor
  const getMarketSummary = () => {
    if (!marketData) return null;
    // Only use backend-designated summary fields. No sorting, reduce, min, max or client-side ranking.
    if (marketData.largest_edge || marketData.primary_edge || marketData.market_summary || marketData.largest_market_edge) {
      return marketData.largest_edge || marketData.primary_edge || marketData.market_summary || marketData.largest_market_edge;
    }
    return null;
  };

  const largestEdge = getMarketSummary();

  // Contract mismatch detector between endpoints
  const getContractMismatches = () => {
    const mismatches: string[] = [];
    if (!context) return mismatches;

    // Season check
    const cSeason = context.season;
    const sSeason = stratContext?.season;
    const vSeason = validPicksData?.contest_leg?.season;
    if (sSeason !== undefined && sSeason !== null && cSeason !== sSeason) {
      mismatches.push(`Season mismatch: ${cSeason} (GET /context/current) vs ${sSeason} (GET /strategy-context)`);
    }
    if (vSeason !== undefined && vSeason !== null && cSeason !== vSeason) {
      mismatches.push(`Season mismatch: ${cSeason} (GET /context/current) vs ${vSeason} (GET /season-management/entries/.../valid-picks)`);
    }

    // Week check
    const cWeek = context.current_week ?? context.week;
    const sWeek = stratContext?.current_week ?? stratContext?.week;
    const vWeek = validPicksData?.contest_leg?.nfl_week;
    if (cWeek !== undefined && sWeek !== undefined && sWeek !== null && cWeek !== sWeek) {
      mismatches.push(`NFL Week mismatch: Week ${cWeek} (GET /context/current) vs Week ${sWeek} (GET /strategy-context)`);
    }
    if (cWeek !== undefined && vWeek !== undefined && vWeek !== null && cWeek !== vWeek) {
      mismatches.push(`NFL Week mismatch: Week ${cWeek} (GET /context/current) vs Week ${vWeek} (GET /season-management/entries/.../valid-picks)`);
    }

    // Format check
    const sFormat = stratContext?.contest_format;
    const vFormat = validPicksData?.contest_leg?.contest_format;
    if (sFormat !== undefined && vFormat !== undefined && vFormat !== null && sFormat !== vFormat) {
      mismatches.push(`Contest Format mismatch: ${sFormat} (GET /strategy-context) vs ${vFormat} (GET /season-management/entries/.../valid-picks)`);
    }

    // Leg ID check
    const sLeg = stratContext?.current_contest_leg_id;
    const vLeg = validPicksData?.contest_leg?.contest_leg_id;
    if (sLeg !== undefined && vLeg !== undefined && vLeg !== null && String(sLeg) !== String(vLeg)) {
      mismatches.push(`Contest Leg ID mismatch: ${sLeg} (GET /strategy-context) vs ${vLeg} (GET /season-management/entries/.../valid-picks)`);
    }

    return mismatches;
  };

  const contractMismatches = getContractMismatches();

  return (
    <div className="space-y-8 animate-fade-in text-left">
      
      {/* COMMAND CENTER HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-xs mt-0.5">
            <LayoutDashboard className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase font-mono">
                Survivor Command Center
              </h2>
              {context && isHealthy === true ? (
                <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  LIVE API
                </span>
              ) : (
                <span className="text-[10px] font-extrabold bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
                  API SYNCING
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1.5 font-semibold font-mono uppercase tracking-widest">
              What do I need to know right now?
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={refreshing}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </Button>
        </div>
      </div>

      {selectedEntry && !selectedEntry.format_code ? (
        <Card className="p-8 text-center text-rose-800 border border-rose-200 bg-rose-50/50">
          <AlertOctagon className="w-8 h-8 text-rose-600 mx-auto mb-2 animate-bounce" />
          <h3 className="text-sm font-black text-rose-950 mb-1 uppercase tracking-wider font-mono">Missing Contest Format</h3>
          <p className="text-xs font-semibold text-rose-800">
            This survivor entry does not have a contest format assigned.
          </p>
        </Card>
      ) : (
        /* INDEPENDENT WIDGETS BENTO GRID */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN PRIMARY WORKSPACE */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* WIDGET 1: CURRENT CONTEST */}
          <Card className="p-6 border-l-4 border-l-slate-900 bg-white shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 font-mono">
                <Activity className="w-4 h-4 text-slate-400" /> Current Contest
              </h3>
              <button
                onClick={() => onNavigate('season_management')}
                className="text-xs font-black text-slate-900 hover:text-slate-600 flex items-center gap-1 cursor-pointer transition-colors font-mono uppercase tracking-wider"
              >
                Open Season Management <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {contractMismatches.length > 0 && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5 font-mono uppercase">
                  <AlertOctagon className="w-4 h-4 text-amber-600" />
                  Contract Mismatch Warning
                </p>
                <ul className="list-disc pl-5 text-[11px] text-amber-700 space-y-1 font-mono">
                  {contractMismatches.map((m, idx) => (
                    <li key={idx}>{m}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="space-y-1 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Season</span>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-extrabold text-slate-800">{context?.season ?? 'N/A'} NFL</span>
                </div>
                <span className="text-[8px] text-slate-400 block font-mono">Source: GET /context/current</span>
              </div>

              <div className="space-y-1 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">NFL Week</span>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-extrabold text-slate-800">
                    Week {context?.current_week ?? context?.week ?? 'N/A'}
                  </span>
                </div>
                <span className="text-[8px] text-slate-400 block font-mono">Source: GET /context/current</span>
              </div>

              <div className="space-y-1 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Contest-Leg ID</span>
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-extrabold text-slate-800">
                    {loadingPicks ? 'Loading...' : (stratContext?.current_contest_leg_id ?? 'N/A')}
                  </span>
                </div>
                <span className="text-[8px] text-slate-400 block font-mono">Source: GET /strategy-context</span>
              </div>

              <div className="space-y-1 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Contest-Leg Label</span>
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-extrabold text-slate-800">
                    {loadingPicks ? 'Loading...' : (validPicksData?.contest_leg?.leg_name ?? 'N/A')}
                  </span>
                </div>
                <span className="text-[8px] text-slate-400 block font-mono">Source: GET /.../valid-picks</span>
              </div>

              <div className="space-y-1 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Contest Format</span>
                <div className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-extrabold text-slate-800">
                    {loadingPicks ? 'Loading...' : (stratContext?.contest_format ?? format ?? 'STANDARD')}
                  </span>
                </div>
                <span className="text-[8px] text-slate-400 block font-mono">Source: GET /strategy-context</span>
              </div>

              <div className="space-y-1 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Active Entry</span>
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-extrabold text-slate-800 truncate max-w-[120px]" title={selectedEntry?.entry_label || 'None Selected'}>
                    {selectedEntry?.entry_label || 'None Selected'}
                  </span>
                </div>
                <span className="text-[8px] text-slate-400 block font-mono">Source: AuthContext</span>
              </div>

              <div className="space-y-1 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Entry Status</span>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${entryStatus.toLowerCase().includes('active') ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  <span className="text-xs font-extrabold text-slate-800">
                    {entryStatus}
                  </span>
                </div>
                <span className="text-[8px] text-slate-400 block font-mono">Source: GET /.../picks</span>
              </div>
            </div>
          </Card>

          {/* WIDGET 2: RECOMMENDATION */}
          <Card className="p-6 border-l-4 border-l-indigo-500 bg-white shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 font-mono">
                <Brain className="w-4 h-4 text-indigo-500" /> Recommendation
              </h3>
              <button
                onClick={() => onNavigate('recommendation_workspace')}
                className="text-xs font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition-colors font-mono uppercase tracking-wider"
              >
                Open Recommendation Workspace <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {loadingComparison ? (
              <div className="py-6 flex items-center justify-center">
                <LoadingSpinner size="sm" message="Connecting strategy engine comparison node..." />
              </div>
            ) : comparisonError ? (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl space-y-2">
                <p className="text-xs text-rose-700 font-bold flex items-center gap-1.5">
                  <Info className="w-4 h-4" />
                  {comparisonError}
                </p>
                <button
                  onClick={fetchComparison}
                  className="text-[10px] font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1 cursor-pointer font-mono uppercase bg-rose-100/50 border border-rose-200 px-2 py-1 rounded"
                >
                  <RefreshCw className="w-3 h-3" /> Retry Recommendation Fetch
                </button>
              </div>
            ) : !selectedEntry ? (
              <div className="p-6 text-center bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                <Info className="w-5 h-5 text-amber-500 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No survivor entry selected.</p>
                <p className="text-[10px] text-slate-400 font-medium">Please select an entry in the sidebar header to query recommendations.</p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-indigo-50/20 p-4 rounded-xl border border-indigo-100/50">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">
                      SYSTEM CONTRACT STATUS
                    </span>
                    <h4 className="text-base font-black text-indigo-950 tracking-tight flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      Recommendation available
                    </h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-md">
                      Backend strategy engines have finished processing live projection runs. Click below to review the multi-engine recommendations.
                    </p>
                  </div>

                  <div className="self-start sm:self-auto">
                    <Button
                      size="sm"
                      onClick={() => onNavigate('recommendation_workspace')}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                    >
                      Open Recommendation Workspace <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {comparisonData?.agreement_summary && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
                    {comparisonData.agreement_summary.compared_strategies_count !== undefined && comparisonData.agreement_summary.compared_strategies_count !== null && (
                      <div className="text-xs font-medium space-y-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Strategies Evaluated</span>
                        <span className="font-bold text-slate-800 font-mono">
                          {comparisonData.agreement_summary.compared_strategies_count}
                        </span>
                      </div>
                    )}
                    {comparisonData.agreement_summary.compared_leg_count !== undefined && comparisonData.agreement_summary.compared_leg_count !== null && (
                      <div className="text-xs font-medium space-y-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Legs Compared</span>
                        <span className="font-bold text-slate-800 font-mono">
                          {comparisonData.agreement_summary.compared_leg_count}
                        </span>
                      </div>
                    )}
                    {comparisonData.agreement_summary.complete_agreement_leg_count !== undefined && comparisonData.agreement_summary.complete_agreement_leg_count !== null && (
                      <div className="text-xs font-medium space-y-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Complete-Agreement Legs</span>
                        <span className="font-bold text-emerald-600 font-mono">
                          {comparisonData.agreement_summary.complete_agreement_leg_count}
                        </span>
                      </div>
                    )}
                    {comparisonData.agreement_summary.disagreement_leg_count !== undefined && comparisonData.agreement_summary.disagreement_leg_count !== null && (
                      <div className="text-xs font-medium space-y-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Disagreement Legs</span>
                        <span className="font-bold text-rose-600 font-mono">
                          {comparisonData.agreement_summary.disagreement_leg_count}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* WIDGET 3: CURRENT PICK */}
          <Card className="p-6 border-l-4 border-l-emerald-500 bg-white shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Current Pick
              </h3>
              <button
                onClick={() => onNavigate('season_management')}
                className="text-xs font-black text-emerald-600 hover:text-emerald-800 flex items-center gap-1 cursor-pointer transition-colors font-mono uppercase tracking-wider"
              >
                Manage Pick <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {loadingPicks ? (
              <div className="py-6 flex items-center justify-center">
                <LoadingSpinner size="sm" message="Querying active entry pick records..." />
              </div>
            ) : picksError ? (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl space-y-2">
                <p className="text-xs text-rose-700 font-bold flex items-center gap-1.5">
                  <Info className="w-4 h-4" />
                  {picksError}
                </p>
                <button
                  onClick={fetchPicksAndLegs}
                  className="text-[10px] font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1 cursor-pointer font-mono uppercase bg-rose-100/50 border border-rose-200 px-2 py-1 rounded"
                >
                  <RefreshCw className="w-3 h-3" /> Retry Picks Fetch
                </button>
              </div>
            ) : !selectedEntry ? (
              <div className="p-6 text-center bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                <Info className="w-5 h-5 text-amber-500 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No entry selected.</p>
                <p className="text-[10px] text-slate-400 font-medium">Please select a survivor entry to inspect official pick statuses.</p>
              </div>
            ) : !currentPick ? (
              <div className="p-6 text-center border border-dashed border-slate-200 bg-slate-50/40 rounded-xl space-y-2">
                <Info className="w-5 h-5 text-amber-500 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No official pick recorded.</p>
                <p className="text-[10px] text-slate-400 font-medium">
                  Select a backend-approved team under season management to lock in this week's sweat.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-1 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                    OFFICIAL PICK TEAM
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono font-bold bg-slate-950 text-white px-2 py-0.5 rounded text-xs">
                      {currentPick.team?.abbr || currentPick.team_abbr || currentPick.team || 'TBD'}
                    </span>
                    <span className="font-extrabold text-slate-800 text-xs truncate max-w-[120px]">
                      {currentPick.team?.name || currentPick.team_name || currentPick.team || 'TBD'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                    CONTEST LEG
                  </span>
                  <span className="text-xs font-bold text-slate-800 block mt-1">
                    {currentPick.contest_leg?.leg_name || currentPick.leg_name || `Leg ${currentPick.contest_leg_id}`}
                  </span>
                </div>

                <div className="space-y-1 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                    RECORDED DATE
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-800 block mt-1">
                    {currentPick.picked_timestamp || currentPick.updated_at || currentPick.timestamp || currentPick.created_at ? (
                      new Date(currentPick.picked_timestamp || currentPick.updated_at || currentPick.timestamp || currentPick.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    ) : '—'}
                  </span>
                </div>
              </div>
            )}
          </Card>

        </div>

        {/* RIGHT COLUMN SIDEBAR PANEL */}
        <div className="space-y-8">
          
          {/* WIDGET 4: RISK SUMMARY */}
          <Card className="p-6 border-t-4 border-t-amber-500 bg-white shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 font-mono">
                <AlertOctagon className="w-4 h-4 text-amber-500" /> Risk Summary
              </h3>
              <button
                onClick={() => {
                  sessionStorage.setItem('scroll_target_section', 'risk');
                  onNavigate('game_analysis');
                }}
                className="text-[10px] font-black text-amber-600 hover:text-amber-800 flex items-center gap-0.5 cursor-pointer transition-colors font-mono uppercase tracking-wider"
              >
                Open Risk Analysis <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {loadingRisk ? (
              <div className="py-6 flex items-center justify-center">
                <LoadingSpinner size="sm" message="Sensing risk parameters..." />
              </div>
            ) : riskError ? (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl space-y-2">
                <p className="text-xs text-rose-700 font-bold flex items-center gap-1.5">
                  <Info className="w-4 h-4" />
                  {riskError}
                </p>
                <button
                  onClick={fetchRisk}
                  className="text-[10px] font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1 cursor-pointer font-mono uppercase bg-rose-100/50 border border-rose-200 px-2 py-1 rounded"
                >
                  <RefreshCw className="w-3 h-3" /> Retry Risk Fetch
                </button>
              </div>
            ) : !riskSummary ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <p className="text-xs text-slate-600 font-bold leading-relaxed">Risk analysis available for the current week.</p>
                </div>
                {riskData && (
                  <div className="grid grid-cols-2 gap-4 text-[10px] font-semibold text-slate-500 font-mono">
                    {riskData.count !== undefined && riskData.count !== null && (
                      <div>
                        RECORDS: <span className="text-slate-800 font-bold">{riskData.count}</span>
                      </div>
                    )}
                    {riskData.season !== undefined && riskData.season !== null && (
                      <div>
                        SEASON: <span className="text-slate-800 font-bold">{riskData.season}</span>
                      </div>
                    )}
                    {riskData.week !== undefined && riskData.week !== null && (
                      <div>
                        WEEK: <span className="text-slate-800 font-bold">Week {riskData.week}</span>
                      </div>
                    )}
                    {(riskData.model_version || riskData.model) && (
                      <div>
                        MODEL: <span className="text-slate-800 font-bold">{riskData.model_version || riskData.model}</span>
                      </div>
                    )}
                    {(riskData.data_status || riskData.status) && (
                      <div>
                        STATUS: <span className="text-slate-800 font-bold">{riskData.data_status || riskData.status}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {riskSummary.highest && (
                  <div className="space-y-1.5 pb-3 border-b border-dashed border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest font-mono">
                        ● Highest Risk Game
                      </span>
                      <span className="text-xs font-black text-rose-600 font-mono bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded">
                        {riskSummary.highest.risk_points} pts
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 font-mono">
                      {riskSummary.highest.team}
                    </div>
                    <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                      Factors: <span className="text-slate-700 italic">{riskSummary.highest.risk_types || 'Multi-engine risks flagged'}</span>
                    </p>
                  </div>
                )}

                {riskSummary.lowest && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest font-mono">
                        ● Lowest Risk Game
                      </span>
                      <span className="text-xs font-black text-emerald-600 font-mono bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                        {riskSummary.lowest.risk_points} pts
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 font-mono">
                      {riskSummary.lowest.team}
                    </div>
                    <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                      Factors: <span className="text-slate-700 italic">{riskSummary.lowest.risk_types || 'Minimal risk exposures'}</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* WIDGET 5: MARKET SUMMARY */}
          <Card className="p-6 border-t-4 border-t-emerald-500 bg-white shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 font-mono">
                <TrendingUp className="w-4 h-4 text-emerald-500" /> Market Summary
              </h3>
              <button
                onClick={() => {
                  sessionStorage.setItem('scroll_target_section', 'market-edge');
                  onNavigate('game_analysis');
                }}
                className="text-[10px] font-black text-emerald-600 hover:text-emerald-800 flex items-center gap-0.5 cursor-pointer transition-colors font-mono uppercase tracking-wider"
              >
                Open Market Edge <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {loadingMarket ? (
              <div className="py-6 flex items-center justify-center">
                <LoadingSpinner size="sm" message="Analyzing market lines..." />
              </div>
            ) : marketError ? (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl space-y-2">
                <p className="text-xs text-rose-700 font-bold flex items-center gap-1.5">
                  <Info className="w-4 h-4" />
                  {marketError}
                </p>
                <button
                  onClick={fetchMarket}
                  className="text-[10px] font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1 cursor-pointer font-mono uppercase bg-rose-100/50 border border-rose-200 px-2 py-1 rounded"
                >
                  <RefreshCw className="w-3 h-3" /> Retry Market Fetch
                </button>
              </div>
            ) : !largestEdge ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <p className="text-xs text-slate-600 font-bold leading-relaxed">Market edge analysis available for the current week.</p>
                </div>
                {marketData && (
                  <div className="grid grid-cols-2 gap-4 text-[10px] font-semibold text-slate-500 font-mono">
                    {marketData.count !== undefined && marketData.count !== null && (
                      <div>
                        RECORDS: <span className="text-slate-800 font-bold">{marketData.count}</span>
                      </div>
                    )}
                    {marketData.season !== undefined && marketData.season !== null && (
                      <div>
                        SEASON: <span className="text-slate-800 font-bold">{marketData.season}</span>
                      </div>
                    )}
                    {marketData.week !== undefined && marketData.week !== null && (
                      <div>
                        WEEK: <span className="text-slate-800 font-bold">Week {marketData.week}</span>
                      </div>
                    )}
                    {(marketData.model_version || marketData.model) && (
                      <div>
                        MODEL: <span className="text-slate-800 font-bold">{marketData.model_version || marketData.model}</span>
                      </div>
                    )}
                    {(marketData.data_status || marketData.status) && (
                      <div>
                        STATUS: <span className="text-slate-800 font-bold">{marketData.data_status || marketData.status}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                  LARGEST MARKET EDGE
                </span>
                
                <div className="flex items-center justify-between bg-emerald-50/25 border border-emerald-100 p-3 rounded-lg">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-slate-800 block font-mono">
                      {largestEdge.team}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold block leading-tight">
                      SemiSharp vs Vegas lines
                    </span>
                  </div>
                  <span className="text-sm font-black text-emerald-600 font-mono">
                    +{largestEdge.edge_points} pts
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-500 pt-1">
                  <div>
                    SemiSharp Line: <span className="text-slate-800 font-bold font-mono">{largestEdge.semisharp_spread}</span>
                  </div>
                  <div>
                    Consensus Line: <span className="text-slate-800 font-bold font-mono">{largestEdge.market_spread}</span>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* WIDGET 6: SYSTEM STATUS */}
          <Card className="p-6 border-t-4 border-t-slate-900 bg-white shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 font-mono">
                <Server className="w-4 h-4 text-slate-900" /> System Status
              </h3>
            </div>

            <div className="space-y-4 text-xs font-medium">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-slate-500">Backend Health:</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                  isHealthy === true ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  checkingHealth ? 'bg-slate-50 text-slate-400 border border-slate-100' :
                  'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isHealthy === true ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  {isHealthy === true ? 'ACTIVE' : checkingHealth ? 'CHECKING...' : 'INACTIVE'}
                </span>
              </div>

              <div className="space-y-1 pb-2 border-b border-slate-100">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest block font-mono">Models Active</span>
                <div className="grid grid-cols-1 gap-1 text-[11px] text-slate-500">
                  <div className="flex justify-between">
                    <span>Projection:</span>
                    <span className="font-bold text-slate-700 font-mono truncate max-w-[130px]">{context?.projection_model ?? 'Not Provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Risk:</span>
                    <span className="font-bold text-slate-700 font-mono truncate max-w-[130px]">{context?.risk_model ?? 'Not Provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Probability:</span>
                    <span className="font-bold text-slate-700 font-mono truncate max-w-[130px]">{context?.probability_model ?? 'Not Provided'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest block font-mono">Active Versions</span>
                <div className="grid grid-cols-1 gap-1 text-[11px] text-slate-500">
                  <div className="flex justify-between">
                    <span>API Endpoints:</span>
                    <span className="font-bold text-slate-700 font-mono">{context?.api_version ?? 'Not Provided'}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

        </div>

      </div>
      )}

    </div>
  );
};
