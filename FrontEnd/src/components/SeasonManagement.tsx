/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { SemiSharpApi, ApiError } from '../api';
import { Card, Button, Alert, LoadingSpinner } from './ui';
import { 
  Calendar, 
  ShieldCheck, 
  Award, 
  Activity, 
  Sliders, 
  Database, 
  RefreshCw, 
  AlertOctagon, 
  Info, 
  Clock, 
  User, 
  CheckCircle2, 
  XCircle, 
  History,
  FileText,
  Binary,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { SeasonTimeline } from './SeasonTimeline';

export const SeasonManagement: React.FC = () => {
  const { user, selectedEntry, selectEntry } = useAuth();

  // Component state
  const [context, setContext] = useState<any>(null);
  const [contextLoading, setContextLoading] = useState<boolean>(true);
  const [contextError, setContextError] = useState<string | null>(null);

  const [statusData, setStatusData] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState<boolean>(true);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [picksData, setPicksData] = useState<any>(null);
  const [picksLoading, setPicksLoading] = useState<boolean>(true);
  const [picksError, setPicksError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'timeline' | 'pick_options'>('timeline');

  const [comparisonData, setComparisonData] = useState<any>(null);
  const [comparisonLoading, setComparisonLoading] = useState<boolean>(false);
  const [comparisonError, setComparisonError] = useState<string | null>(null);

  const [stratContext, setStratContext] = useState<any>(null);
  const [stratContextLoading, setStratContextLoading] = useState<boolean>(false);
  const [stratContextError, setStratContextError] = useState<string | null>(null);

  const [validPicksData, setValidPicksData] = useState<any>(null);
  const [validPicksLoading, setValidPicksLoading] = useState<boolean>(false);
  const [validPicksError, setValidPicksError] = useState<string | null>(null);

  const [tentativeSelection, setTentativeSelection] = useState<any>(null);
  const [unavailableCollapsed, setUnavailableCollapsed] = useState<boolean>(true);

  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasSubmittedSuccessfully, setHasSubmittedSuccessfully] = useState<boolean>(false);

  const getFormat = () => {
    return selectedEntry?.format_code || '';
  };

  // Fetch Operational Context
  const fetchContext = async () => {
    setContextLoading(true);
    setContextError(null);
    try {
      const data = await SemiSharpApi.getContext();
      setContext(data);
    } catch (err) {
      setContextError(err instanceof ApiError ? err.message : 'Failed to retrieve current operational context.');
    } finally {
      setContextLoading(false);
    }
  };

  // Fetch Season Management Status
  const fetchStatus = async () => {
    setStatusLoading(true);
    setStatusError(null);
    try {
      const data = await SemiSharpApi.getSeasonManagementStatus();
      setStatusData(data);
    } catch (err) {
      setStatusError(err instanceof ApiError ? err.message : 'Failed to retrieve season management status.');
    } finally {
      setStatusLoading(false);
    }
  };

  // Fetch Pick History
  const fetchPicks = async () => {
    if (!selectedEntry) {
      setPicksLoading(false);
      return;
    }
    setPicksLoading(true);
    setPicksError(null);
    try {
      const data = await SemiSharpApi.getEntryPicks(selectedEntry.entry_id);
      setPicksData(data);
    } catch (err) {
      setPicksError(err instanceof ApiError ? err.message : `Failed to retrieve pick history for entry ${selectedEntry.entry_label}.`);
    } finally {
      setPicksLoading(false);
    }
  };

  // Fetch Strategy Comparison
  const fetchComparison = async () => {
    if (!selectedEntry) {
      setComparisonData(null);
      setComparisonLoading(false);
      return;
    }
    if (!selectedEntry.format_code) {
      setComparisonData(null);
      setComparisonLoading(false);
      return;
    }
    setComparisonLoading(true);
    setComparisonError(null);
    try {
      const seasonValue = context?.season || 2026;
      const formatValue = getFormat();
      const res = await SemiSharpApi.compareStrategies(seasonValue, formatValue, selectedEntry.entry_id);
      setComparisonData(res);
    } catch (err) {
      console.error("Comparison load failure inside SeasonManagement:", err);
      setComparisonError(err instanceof ApiError ? err.message : "Failed to load strategy comparison details.");
    } finally {
      setComparisonLoading(false);
    }
  };

  const hasBackendRecommendation = (legId: number | string) => {
    if (!comparisonData?.strategies) return false;
    for (const strat of comparisonData.strategies) {
      const matchedEntry = strat.entries?.find((e: any) => {
        const backendId = e.entry_id?.toString().trim();
        const frontendId = selectedEntry?.entry_id?.toString().trim();
        return frontendId && backendId === frontendId;
      }) || strat.entries?.[0];

      if (matchedEntry?.picks) {
        const matchedPick = matchedEntry.picks.find((p: any) => {
          const pLegId = p.contest_leg?.contest_leg_id || p.contest_leg_id || p.leg_number;
          return String(pLegId) === String(legId);
        });
        if (matchedPick?.team) {
          return true;
        }
      }
    }
    return false;
  };

  const getLegStatus = (legId: any, index: number, legs: any[]) => {
    const currentLegId = stratContext?.current_contest_leg_id;
    if (!currentLegId) return 'Future';

    if (String(legId) === String(currentLegId)) {
      return 'Current';
    }

    const currentIndex = legs.findIndex(p => {
      const pLegId = p.contest_leg?.contest_leg_id || p.contest_leg_id;
      return String(pLegId) === String(currentLegId);
    });

    if (currentIndex === -1) return 'Future';

    return index < currentIndex ? 'Past' : 'Future';
  };

  // Fetch Strategy Context to get backend-provided contest_leg_id
  const fetchStrategyContextAndValidPicks = async () => {
    if (!selectedEntry) {
      setStratContext(null);
      setValidPicksData(null);
      setStratContextLoading(false);
      setValidPicksLoading(false);
      return;
    }
    if (!selectedEntry.format_code) {
      setStratContext(null);
      setValidPicksData(null);
      setStratContextLoading(false);
      setValidPicksLoading(false);
      return;
    }

    setStratContextLoading(true);
    setStratContextError(null);
    setValidPicksLoading(true);
    setValidPicksError(null);
    setTentativeSelection(null);
    setSuccessMessage(null);

    const format = getFormat();

    try {
      const contextData = await SemiSharpApi.getStrategyContext(selectedEntry.entry_id, format);
      setStratContext(contextData);
      setStratContextLoading(false);

      const contestLegId = contextData?.current_contest_leg_id;
      if (contestLegId !== undefined && contestLegId !== null) {
        try {
          const pData = await SemiSharpApi.getValidPicks(selectedEntry.entry_id, contestLegId);
          setValidPicksData(pData);
        } catch (err) {
          setValidPicksError(err instanceof ApiError ? err.message : `Failed to retrieve valid pick options from GET /season-management/entries/${selectedEntry.entry_id}/valid-picks/${contestLegId}`);
        } finally {
          setValidPicksLoading(false);
        }
      } else {
        setValidPicksLoading(false);
      }
    } catch (err) {
      setStratContextError(err instanceof ApiError ? err.message : 'Failed to retrieve strategy context.');
      setStratContextLoading(false);
      setValidPicksLoading(false);
    }
  };

  const handleRefreshOptions = async () => {
    if (!selectedEntry || !stratContext?.current_contest_leg_id) return;
    setValidPicksLoading(true);
    setValidPicksError(null);
    setTentativeSelection(null);
    setSuccessMessage(null);
    try {
      const pData = await SemiSharpApi.getValidPicks(selectedEntry.entry_id, stratContext.current_contest_leg_id);
      setValidPicksData(pData);
    } catch (err) {
      setValidPicksError(err instanceof ApiError ? err.message : `Failed to retrieve valid pick options from GET /season-management/entries/${selectedEntry.entry_id}/valid-picks/${stratContext.current_contest_leg_id}`);
    } finally {
      setValidPicksLoading(false);
    }
  };

  const handleConfirmAndRecord = async () => {
    if (!selectedEntry || !tentativeSelection) return;
    
    const contextLegId = stratContext?.current_contest_leg_id;
    const validPicksLegId = validPicksData?.contest_leg?.contest_leg_id;
    
    if (contextLegId !== validPicksLegId) {
      setSubmissionError("Cannot submit pick due to contest leg mismatch.");
      return;
    }
    
    const contestLegIdToUse = validPicksLegId || contextLegId;
    if (!contestLegIdToUse) {
      setSubmissionError("Contest leg ID is missing.");
      return;
    }

    setSubmitting(true);
    setSubmissionError(null);
    setSuccessMessage(null);

    try {
      const payload = {
        contest_leg_id: Number(contestLegIdToUse),
        team_id: Number(tentativeSelection.team_id)
      };

      const res = await SemiSharpApi.createPick(selectedEntry.entry_id, payload);
      
      setHasSubmittedSuccessfully(true);
      
      const teamLabel = res?.team_name || res?.team || tentativeSelection?.team_name || tentativeSelection?.team;
      const legLabel = res?.contest_leg?.leg_name || res?.leg_name || validPicksData?.contest_leg?.leg_name || `Leg ${contestLegIdToUse}`;
      
      setSuccessMessage(`Official pick recorded successfully. Recorded ${teamLabel} for ${legLabel}.`);
      setConfirmOpen(false);
      setTentativeSelection(null);

      // Refresh data
      fetchPicks();
      fetchStrategyContextAndValidPicks();
      fetchStatus();
    } catch (err: any) {
      let errorMsg = '';
      if (err instanceof ApiError) {
        errorMsg = err.message;
      } else if (err instanceof Error) {
        errorMsg = err.message;
      } else if (err && typeof err === 'object') {
        errorMsg = err.detail || err.message || JSON.stringify(err);
      } else {
        errorMsg = String(err);
      }
      setSubmissionError(errorMsg || 'An unknown error occurred while submitting.');
    } finally {
      setSubmitting(false);
    }
  };

  // Initial loads and updates on entry change
  useEffect(() => {
    fetchContext();
    fetchStatus();
  }, []);

  useEffect(() => {
    fetchPicks();
    fetchStrategyContextAndValidPicks();
    fetchComparison();
  }, [selectedEntry?.entry_id, context?.season]);

  const handleRetryAll = () => {
    fetchContext();
    fetchStatus();
    fetchPicks();
    fetchStrategyContextAndValidPicks();
    fetchComparison();
  };

  const getFormatFromPicks = () => {
    if (picksData?.picks && picksData.picks.length > 0) {
      const firstPick = picksData.picks[0];
      return firstPick.contest_leg?.contest_format || firstPick.contest_format || null;
    }
    return null;
  };

  const getActiveStatusFromPicks = () => {
    // Return backend active/eliminated field if present in the picks payload
    if (picksData && 'is_active' in picksData) {
      return picksData.is_active ? 'Active' : 'Eliminated';
    }
    if (picksData && 'status' in picksData) {
      return picksData.status;
    }
    return selectedEntry ? (selectedEntry.is_active ? 'Active' : 'Eliminated') : null;
  };

  const renderField = (label: string, value: any) => {
    if (value === undefined || value === null || value === '') return null;
    return (
      <div className="text-xs">
        <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">{label}</span>
        <span className="font-semibold text-slate-800 break-all">{String(value)}</span>
      </div>
    );
  };

  const renderCurrentLegPickOptions = () => {
    return (
      <section className="space-y-4 animate-fade-in text-left">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Binary className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider font-mono">
              Current Leg Pick Options
            </h3>
            {validPicksData && !validPicksLoading && !validPicksError && (
              <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200/80 px-1.5 py-0.5 rounded-sm uppercase tracking-wider flex items-center gap-1 shrink-0">
                <span className="w-1 h-1 rounded-full bg-emerald-500 inline-block animate-pulse" />
                LIVE API
              </span>
            )}
          </div>

          {selectedEntry && stratContext?.current_contest_leg_id && (
            <Button
              variant="outline"
              size="xs"
              onClick={handleRefreshOptions}
              disabled={validPicksLoading}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-800"
            >
              <RefreshCw className={`w-3 h-3 ${validPicksLoading ? 'animate-spin' : ''}`} />
              Refresh Options
            </Button>
          )}
        </div>

        <p className="text-xs text-slate-500 font-medium">
          Teams approved by the SemiSharp backend for the active entry and contest leg.
        </p>

        {!selectedEntry ? (
          <Card className="p-8 text-center text-slate-400 border border-slate-200 bg-slate-50/10">
            <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <span className="text-xs font-medium">Select a survivor entry to view valid pick options.</span>
          </Card>
        ) : stratContextLoading ? (
          <Card className="py-12">
            <LoadingSpinner size="sm" message="Loading current contest leg context..." />
          </Card>
        ) : stratContextError ? (
          <Card className="p-6 border-rose-100 bg-rose-50/50">
            <Alert type="error" title="Context Retrieval Failure" message={stratContextError} />
            <Button size="sm" variant="outline" onClick={fetchStrategyContextAndValidPicks} className="text-xs mt-3">
              Retry Context Request
            </Button>
          </Card>
        ) : !stratContext?.current_contest_leg_id ? (
          <Card className="p-8 text-center text-slate-400 border border-dashed border-slate-200 bg-slate-50/15">
            <AlertOctagon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <span className="text-xs font-medium">The backend did not provide a current contest leg.</span>
          </Card>
        ) : validPicksLoading && !validPicksData ? (
          <Card className="py-12">
            <LoadingSpinner size="sm" message="Loading approved pick options from live database..." />
          </Card>
        ) : validPicksError ? (
          <Card className="p-6 border-rose-100 bg-rose-50/50">
            <div className="space-y-3">
              <Alert 
                type="error" 
                title="Valid Picks Request Failure" 
                message={`Endpoint: GET /season-management/entries/${selectedEntry.entry_id}/valid-picks/${stratContext.current_contest_leg_id} - ${validPicksError}`} 
              />
              <Button size="sm" variant="outline" onClick={handleRefreshOptions} className="text-xs">
                Retry Valid Picks Connection
              </Button>
            </div>
          </Card>
        ) : validPicksData ? (
          (() => {
            const contextLegId = stratContext?.current_contest_leg_id;
            const validPicksLegId = validPicksData?.contest_leg?.contest_leg_id;
            const hasLegMismatch = 
              contextLegId !== undefined && 
              contextLegId !== null && 
              validPicksLegId !== undefined && 
              validPicksLegId !== null && 
              contextLegId !== validPicksLegId;

            return (
              <div className="space-y-6">
                
                {hasLegMismatch && (
                  <Alert
                    type="error"
                    title="Contest Leg Mismatch Detected"
                    message={`The Strategy Context current contest leg ID (${contextLegId}) does not match the Valid Picks contest leg ID (${validPicksLegId}). Pick submission is disabled to prevent corruption.`}
                  />
                )}

                {successMessage && (
                  <Alert
                    type="success"
                    title="Official Pick Recorded"
                    message={successMessage}
                  />
                )}

                {/* Contest Leg Metadata Banner */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Active Entry</span>
                    <p className="text-slate-800 font-extrabold">{selectedEntry.entry_label}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Contest Format</span>
                    <p className="text-slate-800 font-extrabold">{validPicksData.contest_leg?.contest_format || 'STANDARD'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Contest Leg</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-slate-800 font-extrabold">{validPicksData.contest_leg?.leg_name || `Leg ${validPicksData.contest_leg?.contest_leg_id}`}</p>
                      {validPicksData.contest_leg?.is_special_leg && (
                        <span className="text-[8px] bg-indigo-100 text-indigo-800 px-1 rounded-sm font-black uppercase tracking-wider">Special Leg</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">NFL Week</span>
                    <p className="text-slate-800 font-extrabold">Week {validPicksData.contest_leg?.nfl_week || 'N/A'}</p>
                  </div>
                </div>

                {/* Review Official Pick Panel */}
                {tentativeSelection && !hasLegMismatch && (
                  <Card className="p-6 border-2 border-indigo-500 bg-indigo-50/10 rounded-2xl shadow-sm animate-fade-in space-y-6 text-left">
                    <div className="flex items-center justify-between border-b border-indigo-100 pb-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-mono">
                          Review Official Pick
                        </h3>
                        {hasSubmittedSuccessfully && (
                          <span className="text-[8px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200/80 px-1.5 py-0.5 rounded-sm uppercase tracking-wider flex items-center gap-1 shrink-0">
                            <span className="w-1 h-1 rounded-full bg-emerald-500 inline-block animate-pulse" />
                            LIVE API
                          </span>
                        )}
                      </div>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => setTentativeSelection(null)}
                        className="text-xs text-slate-500 hover:text-slate-800 animate-none animate-none"
                      >
                        Clear Selection
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono block">Active Entry</span>
                        <p className="font-bold text-slate-800">{selectedEntry?.entry_label || selectedEntry?.survivor_sweat_name || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono block">Contest Leg</span>
                        <p className="font-bold text-slate-800">{validPicksData.contest_leg?.leg_name || `Leg ${validPicksData.contest_leg?.contest_leg_id}`}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono block">NFL Week</span>
                        <p className="font-bold text-slate-800">Week {validPicksData.contest_leg?.nfl_week || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono block">Team</span>
                        <p className="font-bold text-slate-800">{tentativeSelection.team_name} ({tentativeSelection.team})</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono block">Opponent</span>
                        <p className="font-bold text-slate-800">{tentativeSelection.opponent}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono block">Location</span>
                        <p className="font-bold text-slate-800">{tentativeSelection.team_location === 'HOME' ? 'Home' : 'Away'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono block">Game Date / Time</span>
                        <p className="font-bold text-slate-800">{tentativeSelection.game_time || tentativeSelection.time || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono block">Game ID</span>
                        <p className="font-mono font-bold text-slate-800">{tentativeSelection.game_id || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-indigo-100 text-xs">
                      {renderField('Projected Spread', tentativeSelection.projected_spread)}
                      {renderField('Baseline WP', tentativeSelection.baseline_win_probability)}
                      {renderField('Risk-Adjusted WP', tentativeSelection.risk_adjusted_win_probability)}
                      {renderField('Risk Score', tentativeSelection.risk_score)}
                      {renderField('Risk Stars', tentativeSelection.risk_stars)}
                      {renderField('Risk Level', tentativeSelection.risk_level)}
                      {renderField('Risk Summary', tentativeSelection.risk_summary)}
                      {renderField('Eligibility', tentativeSelection.eligibility_explanation || tentativeSelection.ineligible_reason)}
                    </div>

                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                      <AlertOctagon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider font-mono">Warning</span>
                        <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                          Recording this pick updates the authoritative survivor history for this entry.
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        onClick={() => {
                          setSubmissionError(null);
                          setConfirmOpen(true);
                        }}
                        className="text-xs font-black uppercase tracking-wider font-mono bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                      >
                        Record Official Pick
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Grid of Eligible Teams */}
                {!validPicksData.options || validPicksData.options.filter((opt: any) => opt.eligible && !opt.already_used).length === 0 ? (
                  <Card className="p-8 text-center text-slate-400 border border-dashed border-slate-200">
                    No valid pick options are available for this entry and contest leg.
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {validPicksData.options
                      .filter((opt: any) => opt.eligible && !opt.already_used)
                      .map((opt: any) => {
                        const isTentative = tentativeSelection?.team_id === opt.team_id;
                        const gameTime = opt.game_time || opt.time || null;
                        const teamLoc = opt.team_location === 'HOME' ? 'vs' : '@';

                        return (
                          <div
                            key={opt.team_id}
                            onClick={() => {
                              if (hasLegMismatch) return;
                              setTentativeSelection(isTentative ? null : opt);
                            }}
                            className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer text-left flex flex-col justify-between gap-4 ${
                              isTentative
                                ? 'bg-indigo-50/50 border-indigo-500 shadow-sm ring-1 ring-indigo-500'
                                : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/40 shadow-xs'
                            }`}
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-base font-black tracking-tight text-slate-900 font-mono">
                                    {opt.team}
                                  </span>
                                  <span className="text-[11px] text-slate-400 font-bold">{teamLoc} {opt.opponent}</span>
                                </div>
                                
                                {isTentative ? (
                                  <span className="text-[8px] bg-indigo-600 text-white font-extrabold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                                    Tentative Selection
                                  </span>
                                ) : (
                                  <span className="text-[8px] bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-extrabold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                                    Eligible
                                  </span>
                                )}
                              </div>

                              <div>
                                <h4 className="text-xs font-bold text-slate-800 leading-tight">{opt.team_name}</h4>
                                <p className="text-[10px] text-slate-400 font-semibold font-mono mt-0.5">Game ID: {opt.game_id}</p>
                              </div>
                            </div>

                            {/* Extra Returned Fields (safe check) */}
                            <div className="grid grid-cols-2 gap-x-2 gap-y-3 pt-3 border-t border-slate-50 text-left">
                              {renderField('Team ID', opt.team_id)}
                              {renderField('Game Time', gameTime)}
                              {renderField('Proj Favorite', opt.projected_favorite)}
                              {renderField('Proj Spread', opt.projected_spread)}
                              {renderField('Baseline WP', opt.baseline_win_probability)}
                              {renderField('Risk-Adjusted WP', opt.risk_adjusted_win_probability)}
                              {renderField('Risk Score', opt.risk_score)}
                              {renderField('Risk Stars', opt.risk_stars)}
                              {renderField('Risk Level', opt.risk_level)}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* Slashed Unavailable / Already Used Teams */}
                {validPicksData.options && validPicksData.options.some((opt: any) => !opt.eligible || opt.already_used) && (
                  <div className="space-y-3 border-t border-slate-200/60 pt-6 text-left">
                    <button
                      onClick={() => setUnavailableCollapsed(!unavailableCollapsed)}
                      className="flex items-center gap-2 text-xs font-black uppercase tracking-wider font-mono text-slate-500 hover:text-slate-800 focus:outline-none"
                    >
                      {unavailableCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                      <span>Unavailable Teams ({validPicksData.options.filter((opt: any) => !opt.eligible || opt.already_used).length})</span>
                    </button>

                    {!unavailableCollapsed && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-2 scrollbar-thin">
                        {validPicksData.options
                          .filter((opt: any) => !opt.eligible || opt.already_used)
                          .map((opt: any) => (
                            <div key={opt.team_id} className="p-3 bg-slate-50 border border-slate-200/50 rounded-xl text-left flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-black text-slate-400 line-through">
                                    {opt.team}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-bold">{opt.team_location === 'HOME' ? 'vs' : '@'} {opt.opponent}</span>
                                </div>
                                <h4 className="text-xs font-bold text-slate-500 truncate leading-tight mt-0.5">{opt.team_name}</h4>
                              </div>

                              <div className="shrink-0 text-right">
                                <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded block text-center">
                                  {opt.already_used ? 'Already Used' : 'Ineligible'}
                                </span>
                                Exclusion Reason: <span className="text-rose-600 font-extrabold bg-rose-50 px-2 py-0.5 rounded border border-rose-100/60 inline-block mt-0.5 sm:mt-0">{opt.ineligible_reason || 'Already used or ineligible'}</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
                
              </div>
            );
          })()
        ) : null}
      </section>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. MY SURVIVOR SEASON HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-xs mt-0.5">
            <Calendar className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-950 tracking-tight leading-none">My Survivor Season</h2>
              <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md uppercase tracking-wider">
                🟢 LIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1.5 font-medium">
              Explore your season-oriented survivor timeline, backend strategy recommendations, and official recorded picks.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetryAll}
            className="flex items-center gap-1.5"
            disabled={contextLoading || statusLoading || picksLoading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${(contextLoading || statusLoading || picksLoading || comparisonLoading) ? 'animate-spin' : ''}`} />
            Refresh Season Data
          </Button>
        </div>
      </div>

      {/* 2. HEADER METRICS PANEL */}
      <Card className="grid grid-cols-2 md:grid-cols-5 gap-6 p-5 bg-white border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">Active Entry</span>
          {selectedEntry ? (
            <div className="space-y-1">
              <p className="text-sm font-black text-slate-900 truncate leading-tight" title={selectedEntry.entry_label}>{selectedEntry.entry_label}</p>
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[9px] font-black leading-none uppercase ${
                selectedEntry.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {selectedEntry.is_active ? 'Active' : 'Eliminated'}
              </span>
            </div>
          ) : (
            <p className="text-sm font-bold text-slate-400">None Selected</p>
          )}
        </div>

        <div className="space-y-1">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">Contest Format</span>
          <p className="text-sm font-black text-indigo-600 font-mono">
            {getFormat()}
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">Season</span>
          <p className="text-sm font-black text-slate-800 font-mono">
            {context?.season ?? 'N/A'}
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">Current Leg</span>
          <p className="text-sm font-black text-slate-800">
            {validPicksData?.contest_leg?.leg_name || (stratContext?.current_contest_leg_id ? `Leg ${stratContext.current_contest_leg_id}` : 'N/A')}
          </p>
        </div>

        <div className="space-y-1 col-span-2 md:col-span-1">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">NFL Week</span>
          <p className="text-sm font-black text-slate-800 font-mono">
            Week {context?.current_week ?? context?.week ?? 'N/A'}
          </p>
        </div>
      </Card>

      {/* SEASON TIMELINE WORKSPACE */}
      {selectedEntry && !selectedEntry.format_code ? (
        <Card className="p-8 text-center text-rose-800 border border-rose-200 bg-rose-50/50">
          <AlertOctagon className="w-8 h-8 text-rose-600 mx-auto mb-2 animate-bounce" />
          <h3 className="text-sm font-black text-rose-950 mb-1 uppercase tracking-wider font-mono">Missing Contest Format</h3>
          <p className="text-xs font-semibold text-rose-800">
            This survivor entry does not have a contest format assigned.
          </p>
        </Card>
      ) : (
        <SeasonTimeline
          picks={picksData?.picks || []}
          picksLoading={picksLoading}
          picksError={picksError}
          selectedEntry={selectedEntry}
          hasBackendRecommendation={hasBackendRecommendation}
          getLegStatus={getLegStatus}
          setActiveTab={setActiveTab}
          fetchPicks={fetchPicks}
          comparisonData={comparisonData}
          comparisonLoading={comparisonLoading}
          comparisonError={comparisonError}
          onRetryTimeline={handleRetryAll}
          currentValidPicksData={validPicksData}
          currentLegPickOptionsSection={renderCurrentLegPickOptions()}
        />
      )}

      {false && (
        /* NEW SECTION: CURRENT LEG PICK OPTIONS */
        <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Binary className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider font-mono">
              Current Leg Pick Options
            </h3>
            {validPicksData && !validPicksLoading && !validPicksError && (
              <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200/80 px-1.5 py-0.5 rounded-sm uppercase tracking-wider flex items-center gap-1 shrink-0">
                <span className="w-1 h-1 rounded-full bg-emerald-500 inline-block animate-pulse" />
                LIVE API
              </span>
            )}
          </div>

          {selectedEntry && stratContext?.current_contest_leg_id && (
            <Button
              variant="outline"
              size="xs"
              onClick={handleRefreshOptions}
              disabled={validPicksLoading}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-800"
            >
              <RefreshCw className={`w-3 h-3 ${validPicksLoading ? 'animate-spin' : ''}`} />
              Refresh Options
            </Button>
          )}
        </div>

        <p className="text-xs text-slate-500 font-medium">
          Teams approved by the SemiSharp backend for the active entry and contest leg.
        </p>

        {!selectedEntry ? (
          <Card className="p-8 text-center text-slate-400 border border-slate-200 bg-slate-50/10">
            <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <span className="text-xs font-medium">Select a survivor entry to view valid pick options.</span>
          </Card>
        ) : stratContextLoading ? (
          <Card className="py-12">
            <LoadingSpinner size="sm" message="Loading current contest leg context..." />
          </Card>
        ) : stratContextError ? (
          <Card className="p-6 border-rose-100 bg-rose-50/50">
            <Alert type="error" title="Context Retrieval Failure" message={stratContextError} />
            <Button size="sm" variant="outline" onClick={fetchStrategyContextAndValidPicks} className="text-xs mt-3">
              Retry Context Request
            </Button>
          </Card>
        ) : !stratContext?.current_contest_leg_id ? (
          <Card className="p-8 text-center text-slate-400 border border-dashed border-slate-200 bg-slate-50/15">
            <AlertOctagon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <span className="text-xs font-medium">The backend did not provide a current contest leg.</span>
          </Card>
        ) : validPicksLoading && !validPicksData ? (
          <Card className="py-12">
            <LoadingSpinner size="sm" message="Loading approved pick options from live database..." />
          </Card>
        ) : validPicksError ? (
          <Card className="p-6 border-rose-100 bg-rose-50/50">
            <div className="space-y-3">
              <Alert 
                type="error" 
                title="Valid Picks Request Failure" 
                message={`Endpoint: GET /season-management/entries/${selectedEntry.entry_id}/valid-picks/${stratContext.current_contest_leg_id} - ${validPicksError}`} 
              />
              <Button size="sm" variant="outline" onClick={handleRefreshOptions} className="text-xs">
                Retry Valid Picks Connection
              </Button>
            </div>
          </Card>
        ) : validPicksData ? (
          (() => {
            const contextLegId = stratContext?.current_contest_leg_id;
            const validPicksLegId = validPicksData?.contest_leg?.contest_leg_id;
            const hasLegMismatch = 
              contextLegId !== undefined && 
              contextLegId !== null && 
              validPicksLegId !== undefined && 
              validPicksLegId !== null && 
              contextLegId !== validPicksLegId;

            return (
              <div className="space-y-6">
                
                {hasLegMismatch && (
                  <Alert
                    type="error"
                    title="Contest Leg Mismatch Detected"
                    message={`The Strategy Context current contest leg ID (${contextLegId}) does not match the Valid Picks contest leg ID (${validPicksLegId}). Pick submission is disabled to prevent corruption.`}
                  />
                )}

                {successMessage && (
                  <Alert
                    type="success"
                    title="Official Pick Recorded"
                    message={successMessage}
                  />
                )}

                {/* Contest Leg Metadata Banner */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Active Entry</span>
                    <p className="text-slate-800 font-extrabold">{selectedEntry.entry_label}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Contest Format</span>
                    <p className="text-slate-800 font-extrabold">{validPicksData.contest_leg?.contest_format || 'STANDARD'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Contest Leg</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-slate-800 font-extrabold">{validPicksData.contest_leg?.leg_name || `Leg ${validPicksData.contest_leg?.contest_leg_id}`}</p>
                      {validPicksData.contest_leg?.is_special_leg && (
                        <span className="text-[8px] bg-indigo-100 text-indigo-800 px-1 rounded-sm font-black uppercase tracking-wider">Special Leg</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">NFL Week</span>
                    <p className="text-slate-800 font-extrabold">Week {validPicksData.contest_leg?.nfl_week || 'N/A'}</p>
                  </div>
                </div>

                {/* Review Official Pick Panel */}
                {tentativeSelection && !hasLegMismatch && (
                  <Card className="p-6 border-2 border-indigo-500 bg-indigo-50/10 rounded-2xl shadow-sm animate-fade-in space-y-6 text-left">
                    <div className="flex items-center justify-between border-b border-indigo-100 pb-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-mono">
                          Review Official Pick
                        </h3>
                        {hasSubmittedSuccessfully && (
                          <span className="text-[8px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200/80 px-1.5 py-0.5 rounded-sm uppercase tracking-wider flex items-center gap-1 shrink-0">
                            <span className="w-1 h-1 rounded-full bg-emerald-500 inline-block animate-pulse" />
                            LIVE API
                          </span>
                        )}
                      </div>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => setTentativeSelection(null)}
                        className="text-xs text-slate-500 hover:text-slate-800 animate-none animate-none"
                      >
                        Clear Selection
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono block animate-none">Active Entry</span>
                        <p className="font-bold text-slate-800">{selectedEntry?.entry_label || selectedEntry?.survivor_sweat_name || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono block animate-none">Contest Leg</span>
                        <p className="font-bold text-slate-800">{validPicksData.contest_leg?.leg_name || `Leg ${validPicksData.contest_leg?.contest_leg_id}`}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono block animate-none">NFL Week</span>
                        <p className="font-bold text-slate-800">Week {validPicksData.contest_leg?.nfl_week || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono block animate-none">Team</span>
                        <p className="font-bold text-slate-800">{tentativeSelection.team_name} ({tentativeSelection.team})</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono block animate-none">Opponent</span>
                        <p className="font-bold text-slate-800">{tentativeSelection.opponent}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono block animate-none">Location</span>
                        <p className="font-bold text-slate-800">{tentativeSelection.team_location === 'HOME' ? 'Home' : 'Away'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono block animate-none">Game Date / Time</span>
                        <p className="font-bold text-slate-800">{tentativeSelection.game_time || tentativeSelection.time || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono block animate-none">Game ID</span>
                        <p className="font-mono font-bold text-slate-800">{tentativeSelection.game_id || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-indigo-100 text-xs">
                      {renderField('Projected Spread', tentativeSelection.projected_spread)}
                      {renderField('Baseline WP', tentativeSelection.baseline_win_probability)}
                      {renderField('Risk-Adjusted WP', tentativeSelection.risk_adjusted_win_probability)}
                      {renderField('Risk Score', tentativeSelection.risk_score)}
                      {renderField('Risk Stars', tentativeSelection.risk_stars)}
                      {renderField('Risk Level', tentativeSelection.risk_level)}
                      {renderField('Risk Summary', tentativeSelection.risk_summary)}
                      {renderField('Eligibility', tentativeSelection.eligibility_explanation || tentativeSelection.ineligible_reason)}
                    </div>

                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                      <AlertOctagon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider font-mono">Warning</span>
                        <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                          Recording this pick updates the authoritative survivor history for this entry.
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        onClick={() => {
                          setSubmissionError(null);
                          setConfirmOpen(true);
                        }}
                        className="text-xs font-black uppercase tracking-wider font-mono bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs animate-none animate-none"
                      >
                        Record Official Pick
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Grid of Eligible Teams */}
                {!validPicksData.options || validPicksData.options.filter((opt: any) => opt.eligible && !opt.already_used).length === 0 ? (
                  <Card className="p-8 text-center text-slate-400 border border-dashed border-slate-200">
                    No valid pick options are available for this entry and contest leg.
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {validPicksData.options
                      .filter((opt: any) => opt.eligible && !opt.already_used)
                      .map((opt: any) => {
                        const isTentative = tentativeSelection?.team_id === opt.team_id;
                        const gameTime = opt.game_time || opt.time || null;
                        const teamLoc = opt.team_location === 'HOME' ? 'vs' : '@';

                        return (
                          <div
                            key={opt.team_id}
                            onClick={() => {
                              if (hasLegMismatch) return;
                              setTentativeSelection(isTentative ? null : opt);
                            }}
                            className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer text-left flex flex-col justify-between gap-4 ${
                              isTentative
                                ? 'bg-indigo-50/50 border-indigo-500 shadow-sm ring-1 ring-indigo-500'
                                : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/40 shadow-xs'
                            }`}
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-base font-black tracking-tight text-slate-900 font-mono">
                                    {opt.team}
                                  </span>
                                  <span className="text-[11px] text-slate-400 font-bold">{teamLoc} {opt.opponent}</span>
                                </div>
                                
                                {isTentative ? (
                                  <span className="text-[8px] bg-indigo-600 text-white font-extrabold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                                    Tentative Selection
                                  </span>
                                ) : (
                                  <span className="text-[8px] bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-extrabold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                                    Eligible
                                  </span>
                                )}
                              </div>

                              <div>
                                <h4 className="text-xs font-bold text-slate-800 leading-tight">{opt.team_name}</h4>
                                <p className="text-[10px] text-slate-400 font-semibold font-mono mt-0.5">Game ID: {opt.game_id}</p>
                              </div>
                            </div>

                            {/* Extra Returned Fields (safe check) */}
                            <div className="grid grid-cols-2 gap-x-2 gap-y-3 pt-3 border-t border-slate-50 text-left">
                              {renderField('Team ID', opt.team_id)}
                              {renderField('Game Time', gameTime)}
                              {renderField('Proj Favorite', opt.projected_favorite)}
                              {renderField('Proj Spread', opt.projected_spread)}
                              {renderField('Baseline WP', opt.baseline_win_probability)}
                              {renderField('Risk-Adjusted WP', opt.risk_adjusted_win_probability)}
                              {renderField('Risk Score', opt.risk_score)}
                              {renderField('Risk Stars', opt.risk_stars)}
                              {renderField('Risk Level', opt.risk_level)}
                              {renderField('Risk Summary', opt.risk_summary)}
                              {renderField('Eligibility', opt.eligibility_explanation || opt.ineligible_reason)}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* Unavailable Teams */}
                {validPicksData.options && validPicksData.options.some((opt: any) => !opt.eligible || opt.already_used) && (
                  <div className="space-y-2 border border-slate-100 rounded-xl overflow-hidden bg-slate-50/20 shadow-xs">
                    <button
                      onClick={() => setUnavailableCollapsed(!unavailableCollapsed)}
                      className="w-full flex items-center justify-between p-4 font-bold text-xs text-slate-700 hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <AlertOctagon className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>Unavailable Teams ({validPicksData.options.filter((opt: any) => !opt.eligible || opt.already_used).length})</span>
                      </div>
                      <span className="text-[11px] text-indigo-600 font-semibold">
                        {unavailableCollapsed ? 'Show' : 'Hide'}
                      </span>
                    </button>
                    {!unavailableCollapsed && (
                      <div className="p-4 border-t border-slate-100 bg-white divide-y divide-slate-100">
                        {validPicksData.options
                          .filter((opt: any) => !opt.eligible || opt.already_used)
                          .map((opt: any, idx: number) => (
                            <div key={idx} className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black bg-slate-100 border border-slate-200/60 px-1.5 py-0.5 rounded text-slate-500">
                                  {opt.team}
                                </span>
                                <span className="font-bold text-slate-700">{opt.team_name}</span>
                              </div>
                              <div className="text-slate-500 font-medium text-[11px]">
                                Exclusion Reason: <span className="text-rose-600 font-extrabold bg-rose-50 px-2 py-0.5 rounded border border-rose-100/60 inline-block mt-0.5 sm:mt-0">{opt.ineligible_reason || 'Already used or ineligible'}</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
                
              </div>
            );
          })()
        ) : null}
      </section>
      )}

      {/* 4. SEASON MANAGEMENT STATUS */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-400" />
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider font-mono">
            Season Status Overview
          </h3>
        </div>

        {statusLoading ? (
          <Card className="py-8">
            <LoadingSpinner size="sm" message="Loading season status telemetry..." />
          </Card>
        ) : statusError ? (
          <Card className="p-6 border-rose-100 bg-rose-50/50">
            <div className="space-y-3">
              <Alert type="error" title="Status Telemetry Error" message={statusError} />
              <Button size="sm" variant="outline" onClick={fetchStatus} className="text-xs">
                Retry Connection
              </Button>
            </div>
          </Card>
        ) : statusData ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Operational Status Card */}
            <Card className="p-5 bg-white border border-slate-100 shadow-sm flex flex-col justify-between gap-4 lg:col-span-1">
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">System Eligibility State</span>
                
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl border ${
                    statusData.all_entries_ready 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {statusData.all_entries_ready ? 'Sync Ready' : 'Sync Outstanding'}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Authoritative entry readiness reported by FastAPI
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs font-mono text-slate-500 leading-relaxed">
                  <div className="font-bold text-slate-600 mb-1 flex items-center gap-1">
                    <Database className="w-3.5 h-3.5" /> Backend Telemetry
                  </div>
                  <div>all_entries_ready: <span className="font-bold text-slate-700">{statusData.all_entries_ready ? 'true' : 'false'}</span></div>
                  <div>total_registered: <span className="font-bold text-slate-700">{statusData.entries?.length || 0}</span></div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 font-bold tracking-wide">
                AUTHORITATIVE BACKEND STATUS DATA
              </div>
            </Card>

            {/* Registered Entries Card */}
            <Card className="p-5 bg-white border border-slate-100 shadow-sm space-y-4 lg:col-span-2 overflow-hidden">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Registered Entries Audit</span>
                {user?.role === 'ADMIN' && (
                  <span className="text-xs bg-slate-50 text-slate-600 px-2.5 py-0.5 rounded-full border border-slate-200 font-bold">
                    {statusData.entries?.length || 0} Total
                  </span>
                )}
              </div>

              {user?.role === 'ADMIN' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="pb-2 font-black">Entry</th>
                        <th className="pb-2 font-black">Sweat Label</th>
                        <th className="pb-2 text-center font-black">Picks</th>
                        <th className="pb-2 text-center font-black">Expected Completed</th>
                        <th className="pb-2 text-right font-black">Audit State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {statusData.entries && statusData.entries.length > 0 ? (
                        statusData.entries.map((ent: any) => {
                          const isCurrentActive = selectedEntry?.entry_id === String(ent.entry_id);
                          return (
                            <tr 
                              key={ent.entry_id} 
                              className={`hover:bg-slate-50/50 transition-colors ${
                                isCurrentActive ? 'bg-indigo-50/20 font-medium' : ''
                              }`}
                            >
                              <td className="py-2.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-slate-900 font-bold">{ent.entry_label}</span>
                                  {isCurrentActive && (
                                    <span className="text-[8px] bg-indigo-100 text-indigo-800 px-1 rounded-sm font-bold uppercase tracking-wider">Active</span>
                                  )}
                                </div>
                                <span className="text-[10px] font-mono text-slate-400">ID: {ent.entry_id}</span>
                              </td>
                              <td className="py-2.5 font-mono text-slate-600 font-semibold">{ent.survivor_sweat_name}</td>
                              <td className="py-2.5 text-center font-bold text-slate-700">{ent.stored_pick_count}</td>
                              <td className="py-2.5 text-center font-bold text-slate-700">{ent.expected_completed_week_count}</td>
                              <td className="py-2.5 text-right">
                                {ent.history_complete_for_regular_weeks ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Regular-Week History Current
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100">
                                    <AlertOctagon className="w-3 h-3 text-amber-500" /> Regular-Week History Outstanding
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-slate-400">No registered entries reported.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/30 flex flex-col justify-center items-center py-10">
                  <ShieldCheck className="w-8 h-8 text-indigo-600 mb-2" />
                  <p className="text-xs font-semibold text-slate-800">
                    Entry-level system audit is available to administrators.
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                    Your active entry and authoritative pick history timeline are displayed securely in the sections below.
                  </p>
                </div>
              )}
            </Card>

          </div>
        ) : null}
      </section>

      {/* 5. PICK HISTORY SECTION */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-slate-400" />
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider font-mono">
            Authoritative Pick History
          </h3>
        </div>

        {!selectedEntry ? (
          <Card className="p-12 text-center text-slate-400 border border-slate-200 shadow-sm">
            Select a survivor entry to retrieve the authoritative pick history timeline.
          </Card>
        ) : picksLoading ? (
          <Card className="py-12">
            <LoadingSpinner size="md" message="Connecting to FastAPI server for official picks..." />
          </Card>
        ) : picksError ? (
          <Card className="p-6 border-rose-100 bg-rose-50/50">
            <div className="space-y-3">
              <Alert type="error" title="Picks Request Failure" message={picksError} />
              <Button size="sm" variant="outline" onClick={fetchPicks} className="text-xs">
                Retry Query
              </Button>
            </div>
          </Card>
        ) : picksData?.picks && picksData.picks.length > 0 ? (
          <Card className="p-0 overflow-hidden bg-white border border-slate-100 shadow-sm">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2 bg-slate-50/30">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <h4 className="text-sm font-bold text-slate-800">Official Survivor Pick Timeline</h4>
              </div>
              <span className="text-xs bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-extrabold">
                {picksData.picks.length} Stored Picks
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                    <th className="p-4 font-black">Leg / Week</th>
                    <th className="p-4 font-black">Picked Team</th>
                    <th className="p-4 font-black">Pick Status</th>
                    <th className="p-4 font-black">Pick Source</th>
                    <th className="p-4 font-black">Record Date</th>
                    <th className="p-4 font-black">System Notes</th>
                    <th className="p-4 font-black text-right">Audit Trails</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {picksData.picks.map((pick: any, index: number) => {
                    const legName = pick.contest_leg?.leg_name || pick.leg_name || `Leg ${pick.contest_leg_id}`;
                    const legCode = pick.contest_leg?.leg_code || pick.leg_code || `LEG_${pick.contest_leg_id}`;
                    const teamName = pick.team?.name || pick.team_name || pick.team_abbr || pick.team || 'Unknown';
                    const teamAbbr = pick.team?.abbr || pick.team_abbr || pick.team || 'TBD';
                    const status = pick.pick_status || pick.status || 'CONFIRMED';
                    const source = pick.pick_source || pick.source || 'USER_ENTRY';
                    const timestamp = pick.picked_timestamp || pick.updated_at || pick.timestamp || pick.created_at;
                    const notes = pick.notes || '—';
                    const changeReason = pick.change_reason || '—';
                    const userId = pick.updated_by_user_id || 'System';

                    return (
                      <tr key={index} className="hover:bg-slate-50/30 transition-colors">
                        <td className="p-4 font-semibold text-slate-900">
                          <div>{legName}</div>
                          <span className="text-[10px] font-mono text-slate-400 block">{legCode}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded text-slate-700">
                              {teamAbbr}
                            </span>
                            <span className="font-bold text-slate-800">{teamName}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            status === 'LOST' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-slate-50 text-slate-600 border border-slate-200'
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-slate-600">{source}</td>
                        <td className="p-4 text-slate-500 font-mono">
                          {timestamp ? (
                            new Date(timestamp).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          ) : '—'}
                        </td>
                        <td className="p-4 text-slate-500 max-w-xs truncate font-medium" title={notes}>
                          {notes}
                        </td>
                        <td className="p-4 text-right text-[10px] font-mono text-slate-400">
                          <div>User ID: {userId}</div>
                          <div className="truncate max-w-xs inline-block" title={changeReason}>{changeReason}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card className="p-8 text-center space-y-4 border border-dashed border-slate-200 bg-slate-50/20">
            <Info className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800">
                No official picks have been recorded for this entry.
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Recorded picks will appear here and will become the authoritative used-team history for survivor strategies.
              </p>
            </div>
          </Card>
        )}
      </section>

      {/* Confirmation Dialog Overlay */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-white border-2 border-slate-950 rounded-2xl p-6 shadow-xl space-y-6 text-left"
          >
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-mono">
                Confirm Official Survivor Pick
              </h3>
            </div>

            <p className="text-sm font-medium text-slate-700 leading-relaxed animate-none">
              You are recording <strong className="text-slate-950">{tentativeSelection?.team_name || tentativeSelection?.team}</strong> for <strong className="text-slate-950">{selectedEntry?.entry_label}</strong> in <strong className="text-slate-950">{validPicksData?.contest_leg?.leg_name || `Leg ${validPicksData?.contest_leg?.contest_leg_id}`}</strong>. This will become part of the authoritative used-team history.
            </p>

            {submissionError && (
              <Alert
                type="error"
                title="Failed to Record Pick"
                message={submissionError}
              />
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setConfirmOpen(false);
                  setSubmissionError(null);
                }}
                disabled={submitting}
                className="text-xs font-extrabold uppercase tracking-wider font-mono animate-none"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmAndRecord}
                isLoading={submitting}
                disabled={submitting}
                className="text-xs font-black uppercase tracking-wider font-mono bg-slate-900 hover:bg-slate-800 text-white animate-none"
              >
                Confirm and Record Pick
              </Button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};
