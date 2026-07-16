import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Award, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Clock, 
  Database, 
  Lock, 
  Sparkles,
  Binary,
  FileText,
  AlertOctagon,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { Card, Button, LoadingSpinner, Alert } from './ui';
import { SemiSharpApi } from '../api';
import { motion, AnimatePresence } from 'motion/react';

interface SeasonTimelineProps {
  picks: any[];
  picksLoading: boolean;
  picksError: string | null;
  selectedEntry: any;
  hasBackendRecommendation: (legId: number | string) => boolean;
  getLegStatus: (legId: any, index: number, legs: any[]) => 'Past' | 'Current' | 'Future';
  setActiveTab: (tab: 'timeline' | 'pick_options') => void;
  fetchPicks: () => void;
  
  // New props for task 2 integration
  comparisonData?: any;
  comparisonLoading?: boolean;
  comparisonError?: string | null;
  onRetryTimeline?: () => void;
  currentValidPicksData?: any;
  currentLegPickOptionsSection?: React.ReactNode;
}

export const SeasonTimeline: React.FC<SeasonTimelineProps> = ({
  picks,
  picksLoading,
  picksError,
  selectedEntry,
  hasBackendRecommendation,
  getLegStatus,
  setActiveTab,
  fetchPicks,
  comparisonData,
  comparisonLoading,
  comparisonError,
  onRetryTimeline,
  currentValidPicksData,
  currentLegPickOptionsSection,
}) => {
  // State to track which card is expanded (one at a time)
  const [expandedLegId, setExpandedLegId] = useState<number | string | null>(null);
  
  // Local cache for valid picks / eligible teams per expanded contest leg
  const [expandedPicksCache, setExpandedPicksCache] = useState<Record<string | number, any>>({});
  const [expandedPicksLoading, setExpandedPicksLoading] = useState<Record<string | number, boolean>>({});
  const [expandedPicksError, setExpandedPicksError] = useState<Record<string | number, string | null>>({});

  const timelineLegs = comparisonData?.leg_comparison || [];
  const isLoading = picksLoading || comparisonLoading;
  const errorMsg = picksError || comparisonError;

  // Reset expansion when entry changes
  useEffect(() => {
    setExpandedLegId(null);
    setExpandedPicksCache({});
    setExpandedPicksLoading({});
    setExpandedPicksError({});
  }, [selectedEntry]);

  // Auto-expand current leg on load / when picks change
  useEffect(() => {
    if (timelineLegs && timelineLegs.length > 0 && expandedLegId === null) {
      const currentLeg = timelineLegs.find((leg, index) => {
        const legId = leg.contest_leg_id;
        return getLegStatus(legId, index, timelineLegs) === 'Current';
      });
      if (currentLeg) {
        const currentLegId = currentLeg.contest_leg_id;
        setExpandedLegId(currentLegId);
        if (currentValidPicksData) {
          setExpandedPicksCache(prev => ({ ...prev, [currentLegId]: currentValidPicksData }));
        }
      }
    }
  }, [timelineLegs, currentValidPicksData, getLegStatus]);

  // Retrieve backend recommendations for a given leg ID
  const getBackendRecommendationsForLeg = (legId: any) => {
    if (!timelineLegs) return [];
    
    const matchedLeg = timelineLegs.find((leg: any) => String(leg.contest_leg_id) === String(legId));
    if (!matchedLeg || !matchedLeg.strategy_picks) return [];
    
    const results: { strategyName: string; teamAbbr: string; teamName: string; rationale?: string }[] = [];
    
    for (const [stratName, pickObj] of Object.entries(matchedLeg.strategy_picks)) {
      if (pickObj && typeof pickObj === 'object') {
        const pObj = pickObj as any;
        const teamAbbr = pObj.team || pObj.team_abbr || '';
        const teamName = pObj.team_name || pObj.team || 'Unknown Team';
        
        // Map backend strategy code/key to display name
        const formatStratName = (name: string) => {
          const dictionary: Record<string, string> = {
            'FUTURE_VALUE': 'Future Value',
            'BOTTOM_SIX_ROAD_FADE': 'Bottom Six Road Fade',
            'MARKET_ARBITRAGE_EXIT': 'Market Arbitrage Exit',
            'MONTE_CARLO': 'Monte Carlo',
            'DYNAMIC_PROGRAMMING': 'Dynamic Programming'
          };
          return dictionary[name] || name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        };

        results.push({
          strategyName: formatStratName(stratName),
          teamAbbr: String(teamAbbr).toUpperCase(),
          teamName: teamName,
          rationale: pObj.rationale || pObj.notes
        });
      }
    }
    return results;
  };

  // Trigger loading valid pick options on expand
  const handleToggleExpand = async (legId: number | string, index: number) => {
    if (expandedLegId === legId) {
      setExpandedLegId(null);
      return;
    }

    setExpandedLegId(legId);

    // If we already have cached data, don't refetch
    if (expandedPicksCache[legId]) {
      return;
    }

    const legStatus = getLegStatus(legId, index, picks);

    // If it's the current leg and we have valid picks data passed down, cache it immediately
    if (legStatus === 'Current' && currentValidPicksData) {
      setExpandedPicksCache(prev => ({ ...prev, [legId]: currentValidPicksData }));
      return;
    }

    // Otherwise, fetch on-demand from database
    setExpandedPicksLoading(prev => ({ ...prev, [legId]: true }));
    setExpandedPicksError(prev => ({ ...prev, [legId]: null }));
    
    try {
      const data = await SemiSharpApi.getValidPicks(selectedEntry.entry_id, legId);
      setExpandedPicksCache(prev => ({ ...prev, [legId]: data }));
    } catch (err: any) {
      console.error(`Error loading valid picks for leg ${legId}:`, err);
      setExpandedPicksError(prev => ({ 
        ...prev, 
        [legId]: err?.message || "Could not retrieve eligible team status for this week." 
      }));
    } finally {
      setExpandedPicksLoading(prev => ({ ...prev, [legId]: false }));
    }
  };

  return (
    <section className="space-y-6 text-left">
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider font-mono">
            Interactive Season Workspace
          </h3>
        </div>
        {selectedEntry && (
          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
            Click any leg card below to expand its detailed weekly workspace
          </span>
        )}
      </div>

      {!selectedEntry ? (
        <Card className="p-12 text-center text-slate-400 border border-slate-200 shadow-sm bg-white">
          <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <span className="text-xs font-semibold">Select a survivor entry to retrieve the season planning workspace.</span>
        </Card>
      ) : isLoading ? (
        <Card className="py-12 bg-white">
          <LoadingSpinner size="md" message="Building season strategy timeline…" />
        </Card>
      ) : errorMsg ? (
        <Card className="p-6 border-rose-100 bg-rose-50/50">
          <div className="space-y-3">
            <Alert type="error" title="Timeline Request Failure" message={errorMsg} />
            <Button size="sm" variant="outline" onClick={onRetryTimeline || fetchPicks} className="text-xs">
              Retry Timeline Load
            </Button>
          </div>
        </Card>
      ) : timelineLegs && timelineLegs.length > 0 ? (
        <div className="relative pl-6 ml-4 space-y-6">
          {timelineLegs.map((leg: any, index: number) => {
            const legId = leg.contest_leg_id;
            const legName = leg.leg_name || `Leg ${legId}`;
            const nflWeek = leg.nfl_week;
            const legCode = leg.leg_code || `LEG_${legId}`;
            
            const isThanksgiving = leg.is_special_leg && leg.special_leg_type === 'THANKSGIVING';
            const isChristmas = leg.is_special_leg && leg.special_leg_type === 'CHRISTMAS';
            
            const legStatus = getLegStatus(legId, index, timelineLegs);
            const isExpanded = expandedLegId === legId;
            const recs = getBackendRecommendationsForLeg(legId);
            
            // Find official pick matching this contest_leg_id only
            const matchedPick = picks.find(p => {
              const pLegId = p.contest_leg?.contest_leg_id || p.contest_leg_id;
              return pLegId !== undefined && pLegId !== null && String(pLegId) === String(legId);
            });
            
            const teamAbbr = matchedPick?.team?.abbr || matchedPick?.team_abbr || matchedPick?.team;
            const teamName = matchedPick?.team?.name || matchedPick?.team_name || matchedPick?.team;
            const hasPick = !!teamAbbr;
            const pick = matchedPick || {};

            // Define bullet color on the vertical timeline
            const bulletColorClass = legStatus === 'Current'
              ? 'bg-indigo-600 ring-4 ring-indigo-100'
              : legStatus === 'Past'
              ? 'bg-slate-400 border border-slate-300'
              : 'bg-white border-2 border-slate-300';

            return (
              <div key={legId || index} className="relative group">
                {/* Timeline connector segment line */}
                {index < timelineLegs.length - 1 && (
                  <div className={`absolute -left-[27px] top-5 bottom-[-24px] w-0.5 z-0 ${
                    legStatus === 'Past' 
                      ? 'bg-slate-300' 
                      : legStatus === 'Current' 
                      ? 'bg-indigo-400' 
                      : 'border-l-2 border-dashed border-slate-200'
                  }`} />
                )}

                {/* Timeline Bullet */}
                <div className={`absolute -left-[31px] top-5 w-2.5 h-2.5 rounded-full transition-all duration-300 z-10 ${bulletColorClass}`} />

                {/* Main Card */}
                <Card
                  className={`border transition-all duration-300 overflow-hidden cursor-pointer ${
                    isExpanded 
                      ? isThanksgiving 
                        ? 'border-amber-500 bg-amber-50/5 ring-2 ring-amber-500/10 shadow-lg'
                        : isChristmas
                        ? 'border-rose-500 bg-rose-50/5 ring-2 ring-rose-500/10 shadow-lg'
                        : 'border-indigo-600 bg-white ring-2 ring-indigo-500/10 shadow-lg'
                      : legStatus === 'Current'
                      ? 'border-indigo-400 bg-indigo-50/10 hover:bg-indigo-50/20 shadow-xs'
                      : legStatus === 'Past'
                      ? 'border-slate-200 bg-slate-50/40 opacity-90 hover:bg-slate-50/80 hover:opacity-100'
                      : isThanksgiving
                      ? 'border-amber-200 bg-amber-50/10 hover:border-amber-300'
                      : isChristmas
                      ? 'border-rose-200 bg-rose-50/10 hover:border-rose-300'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs'
                  }`}
                  onClick={() => handleToggleExpand(legId, index)}
                >
                  {/* Card Header (Visible Always) */}
                  <div className={`p-5 flex flex-wrap items-center justify-between gap-4 select-none ${
                    isThanksgiving 
                      ? 'bg-gradient-to-r from-amber-50/30 via-transparent to-transparent' 
                      : isChristmas 
                      ? 'bg-gradient-to-r from-rose-50/30 via-transparent to-transparent' 
                      : ''
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-black text-slate-900 leading-none">
                            {legName}
                          </h4>
                          {isThanksgiving && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 border border-amber-200 text-amber-800 font-mono text-[8px] font-black uppercase tracking-wider">
                              🍁 Thanksgiving Leg
                            </span>
                          )}
                          {isChristmas && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-100 border border-rose-200 text-rose-800 font-mono text-[8px] font-black uppercase tracking-wider">
                              🎄 Christmas Leg
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] font-bold text-slate-500 font-mono leading-none">
                          {nflWeek && (
                            <span>
                              NFL Week {nflWeek}
                            </span>
                          )}
                          {nflWeek && (leg.consensus_team || leg.agreement_count !== undefined) && (
                            <span className="text-slate-300">•</span>
                          )}
                          {leg.consensus_team && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-extrabold uppercase">
                              Consensus: {leg.consensus_team}
                            </span>
                          )}
                          {leg.consensus_team && leg.agreement_count !== undefined && (
                            <span className="text-slate-300">•</span>
                          )}
                          {leg.agreement_count !== undefined && leg.agreement_count !== null && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-extrabold uppercase">
                              Agreement: {leg.agreement_count}{leg.available_strategy_count ? `/${leg.available_strategy_count}` : ''}
                            </span>
                          )}
                          {(leg.consensus_team || leg.agreement_count !== undefined) && recs.length > 0 && (
                            <span className="text-slate-300">•</span>
                          )}
                          {recs.length > 0 ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-extrabold uppercase">
                              <Sparkles className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                              Recommendation Available
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-400 text-[10px] font-extrabold uppercase">
                              No Recommendations
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Compact Overview (When Collapsed) */}
                      {!isExpanded && (
                        <div className="hidden sm:flex items-center gap-4 text-xs">
                          {recs.length > 0 ? (
                            <div className="flex items-center gap-1 text-indigo-600 font-mono font-bold text-[10px] uppercase tracking-wider bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded">
                              <Sparkles className="w-3 h-3" />
                              {recs.length} Recommendations
                            </div>
                          ) : (
                            <div className="text-slate-400 font-mono text-[10px]">No Recs</div>
                          )}

                          {hasPick ? (
                            <div className="flex items-center gap-1.5 text-emerald-700 font-mono font-bold text-[10px] uppercase bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Pick: {teamAbbr.toUpperCase()}
                            </div>
                          ) : (
                            <div className="text-slate-400 font-mono text-[10px] uppercase tracking-wider bg-slate-100 border px-2 py-0.5 rounded">
                              No Pick
                            </div>
                          )}
                        </div>
                      )}

                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                        legStatus === 'Current'
                          ? 'bg-indigo-600 text-white animate-pulse'
                          : legStatus === 'Past'
                          ? 'bg-slate-200 text-slate-600'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {legStatus === 'Current' ? '★ Active Leg' : legStatus}
                      </span>

                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Detailed Weekly Workspace */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="border-t border-slate-100 bg-slate-50/20"
                        onClick={(e) => e.stopPropagation()} // Stop toggle when interacting with workspace
                      >
                        <div className="p-6 space-y-6">
                          
                          {/* Workspace Grid */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            
                            {/* Left Side: Metadata & Recommendation */}
                            <div className="space-y-4">
                              {/* Recommendations (All Legs) */}
                              <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-3xs space-y-4">
                                <div className="flex items-center gap-2 border-b border-indigo-50 pb-3">
                                  <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-700 font-mono">
                                    Recommended Team (Not Stored)
                                  </h5>
                                </div>

                                <div className="p-3 bg-amber-50/60 border border-amber-200/50 rounded-xl text-xs font-semibold text-amber-900 leading-relaxed mb-4">
                                  💡 <strong>Reference Only:</strong> These recommended selections are calculated by backend mathematical algorithms. They are <strong>separate</strong> from your official pick and will NOT be automatically recorded or submitted.
                                </div>

                                {recs.length > 0 ? (
                                  <div className="space-y-3">
                                    {recs.map((rec, rIdx) => (
                                      <div key={rIdx} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-start gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white font-mono font-black flex items-center justify-center text-xs shrink-0">
                                          {rec.teamAbbr}
                                        </div>
                                        <div>
                                          <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100/50 uppercase tracking-wider font-mono">
                                            {rec.strategyName} Recommendation
                                          </span>
                                          <p className="text-xs font-black text-slate-800 mt-1">{rec.teamName}</p>
                                          {rec.rationale && (
                                            <p className="text-[10px] text-slate-500 font-medium mt-1 italic">
                                              "{rec.rationale}"
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                    <p className="text-[10px] text-slate-400 font-medium">
                                      * Recommender parameters calculated by SemiSharp dynamic programming model. No client-side survivor logic applied.
                                    </p>
                                  </div>
                                ) : (
                                  <div className="p-4 text-center border border-dashed border-slate-200 bg-slate-50 rounded-xl text-xs text-slate-500 font-medium">
                                    No backend recommendation available for this contest leg.
                                  </div>
                                )}
                              </div>

                              {/* Eligible Team Summary */}
                              <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-3xs space-y-4">
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                  <Database className="w-4 h-4 text-slate-500" />
                                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-700 font-mono">
                                    Eligible Team Summary
                                  </h5>
                                </div>

                                {expandedPicksLoading[legId] ? (
                                  <div className="py-6 text-center">
                                    <LoadingSpinner size="sm" message="Connecting to live database..." />
                                  </div>
                                ) : expandedPicksError[legId] ? (
                                  <Alert type="error" title="Database Sync Offline" message={expandedPicksError[legId] || ''} />
                                ) : expandedPicksCache[legId]?.options ? (
                                  <div className="space-y-4">
                                    {/* Approved Eligible List */}
                                    <div>
                                      <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
                                        Approved / Available
                                      </span>
                                      <div className="flex flex-wrap gap-1.5 mt-2">
                                        {expandedPicksCache[legId].options
                                          .filter((opt: any) => opt.eligible && !opt.already_used)
                                          .map((opt: any) => (
                                            <div 
                                              key={opt.team} 
                                              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-800 hover:border-emerald-400 hover:bg-emerald-50/10 cursor-help transition-all duration-150 font-mono"
                                              title={`${opt.team_name} (WP: ${opt.baseline_win_probability || 'N/A'})`}
                                            >
                                              {opt.team}
                                            </div>
                                          ))}
                                        {expandedPicksCache[legId].options.filter((opt: any) => opt.eligible && !opt.already_used).length === 0 && (
                                          <p className="text-xs text-slate-400 italic">No approved teams available.</p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Slashed Unavailable List */}
                                    <div>
                                      <span className="text-[9px] font-black text-slate-500 bg-slate-100 border px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
                                        Used / Ineligible ({expandedPicksCache[legId].options.filter((opt: any) => !opt.eligible || opt.already_used).length})
                                      </span>
                                      <div className="flex flex-wrap gap-1.5 mt-2 opacity-60">
                                        {expandedPicksCache[legId].options
                                          .filter((opt: any) => !opt.eligible || opt.already_used)
                                          .map((opt: any) => (
                                            <div 
                                              key={opt.team} 
                                              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-400 line-through cursor-help font-mono"
                                              title={`${opt.team_name} - ${opt.ineligible_reason || 'Already used or ineligible'}`}
                                            >
                                              {opt.team}
                                            </div>
                                          ))}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-4 text-center border border-dashed border-slate-200 bg-slate-50 rounded-xl text-xs text-slate-400 font-mono">
                                    Retrieve teams summary via active database connection
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Right Side: Official Pick & Actions */}
                            <div className="space-y-4">
                              
                              {/* Official Pick Header */}
                              <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-3xs space-y-4">
                                <div className="flex items-center gap-2 border-b border-emerald-50 pb-3">
                                  <FileText className="w-4 h-4 text-emerald-600" />
                                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-700 font-mono">
                                    Official Pick Registry
                                  </h5>
                                </div>

                                {hasPick ? (
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                                      <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white font-mono font-black flex items-center justify-center text-lg shrink-0">
                                        {teamAbbr.toUpperCase()}
                                      </div>
                                      <div>
                                        <span className="text-[9px] font-black text-emerald-800 uppercase tracking-wider font-mono block bg-emerald-100 px-1.5 py-0.5 rounded w-max leading-none mb-1">
                                          Official Stored Selection
                                        </span>
                                        <h6 className="text-sm font-black text-slate-900 leading-tight">
                                          {teamName}
                                        </h6>
                                      </div>
                                    </div>

                                    {/* Audit Logs for Completed Legs */}
                                    {legStatus === 'Past' && (
                                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-[11px] font-medium text-slate-600">
                                        <div className="flex justify-between">
                                          <span className="text-slate-400 font-mono uppercase text-[9px] font-bold">Pick Source</span>
                                          <span className="font-bold font-mono text-slate-800">{pick.pick_source || pick.source || 'USER_ENTRY'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-slate-400 font-mono uppercase text-[9px] font-bold">Record Timestamp</span>
                                          <span className="font-bold text-slate-800">
                                            {pick.picked_timestamp || pick.updated_at || pick.timestamp || pick.created_at || '—'}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-slate-400 font-mono uppercase text-[9px] font-bold">Registry Status</span>
                                          <span className="font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.2 select-none uppercase text-[9px]">
                                            {pick.pick_status || pick.status || 'CONFIRMED'}
                                          </span>
                                        </div>
                                        {/* Winning/Losing status if returned by backend */}
                                        {(pick.winning_status || pick.outcome || pick.result || (pick.is_winner !== undefined && pick.is_winner !== null)) && (
                                          <div className="flex justify-between border-t border-slate-100 pt-1.5 mt-1.5">
                                            <span className="text-slate-400 font-mono uppercase text-[9px] font-bold">Game Outcome</span>
                                            <span className={`font-extrabold rounded px-1.5 py-0.2 select-none uppercase text-[9px] ${
                                              String(pick.winning_status || pick.outcome || pick.result || (pick.is_winner ? 'WON' : 'LOST')).toUpperCase().includes('WON') || pick.is_winner === true
                                                ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                                                : 'text-rose-700 bg-rose-50 border border-rose-200'
                                            }`}>
                                              {String(pick.winning_status || pick.outcome || pick.result || (pick.is_winner ? 'WON' : 'LOST')).toUpperCase()}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-4">
                                    <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 font-mono font-black flex items-center justify-center text-base shrink-0 select-none">
                                      TBD
                                    </div>
                                    <div>
                                      <span className="text-[9px] font-bold text-amber-800 uppercase tracking-wider font-mono block">
                                        Registration Missing
                                      </span>
                                      <p className="text-xs font-bold text-amber-900">
                                        No official pick recorded.
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Workspace Action Area */}
                              <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-3xs space-y-4">
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                  <Lock className="w-4 h-4 text-slate-400" />
                                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-700 font-mono">
                                    Action Console
                                  </h5>
                                </div>

                                {legStatus === 'Current' ? (
                                  <div className="space-y-4">
                                    <div className="p-3.5 bg-indigo-50 border border-indigo-100/60 rounded-xl text-xs font-medium text-indigo-950 flex items-start gap-2.5">
                                      <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                                      <p>
                                        <strong>Active Leg Workspace:</strong> You can record, clear, or modify the official stored survivor pick directly below. All changes commit securely in real-time.
                                      </p>
                                    </div>
                                    
                                    {/* Embed Current Leg Pick Options Section */}
                                    <div className="border-t border-slate-100 pt-4 text-left">
                                      {currentLegPickOptionsSection || (
                                        <div className="p-4 text-center border text-xs text-slate-400">
                                          Pick Options console is loading...
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : legStatus === 'Future' ? (
                                  <div className="p-5 bg-slate-50 border border-slate-200 border-dashed rounded-xl text-center space-y-2">
                                    <Lock className="w-8 h-8 text-slate-300 mx-auto" />
                                    <p className="text-xs font-black text-slate-700 font-mono uppercase tracking-wider">
                                      Registry Closed
                                    </p>
                                    <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                                      Pick entry opens when this contest leg becomes active. Do not allow recording future picks.
                                    </p>
                                  </div>
                                ) : (
                                  <div className="p-5 bg-slate-50 border border-slate-200 border-dashed rounded-xl text-center space-y-2">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                                    <p className="text-xs font-black text-slate-700 font-mono uppercase tracking-wider">
                                      Leg Locked / Past
                                    </p>
                                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                      Official stored picks for completed contest legs are locked down and protected. Do not allow edits.
                                    </p>
                                  </div>
                                )}
                              </div>

                            </div>

                          </div>

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="p-8 text-center border border-dashed border-slate-200 bg-slate-50/20">
          <Info className="w-8 h-8 text-slate-400 mx-auto" />
          <div className="space-y-1 mt-2">
            <h4 className="text-sm font-bold text-slate-800">No contest legs were returned for the active contest context.</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Verify your active survivor entry with the administration team.
            </p>
          </div>
        </Card>
      )}
    </section>
  );
};
