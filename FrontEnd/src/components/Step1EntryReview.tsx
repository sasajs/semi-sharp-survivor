/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { SemiSharpContext } from '../types';
import { SemiSharpApi, ApiError } from '../api';
import { Card, Button, LoadingSpinner } from './ui';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ArrowRight, 
  ShieldCheck, 
  Calendar, 
  Layers, 
  Edit3, 
  RefreshCw, 
  CheckSquare, 
  Lock, 
  Plus, 
  User, 
  Tag,
  Compass,
  Zap,
  Search,
  Check,
  ChevronDown,
  ChevronUp,
  Award,
  Sparkles,
  RotateCcw
} from 'lucide-react';

interface Step1EntryReviewProps {
  context: SemiSharpContext | null;
  onNavigate: (tab: string) => void;
}

export const Step1EntryReview: React.FC<Step1EntryReviewProps> = ({
  context,
  onNavigate,
}) => {
  const { selectedEntry, selectEntry, user } = useAuth();

  const [isChangingEntry, setIsChangingEntry] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState<any | null>(null);

  // Strategy Carry-Forward State
  const [selectedStrategyCode, setSelectedStrategyCode] = useState<string>(() => {
    try {
      return localStorage.getItem('selected_strategy_code') || 'CURRENT_WEEK_HIGHEST_WIN';
    } catch (e) {
      return 'CURRENT_WEEK_HIGHEST_WIN';
    }
  });
  const [selectedStrategyName, setSelectedStrategyName] = useState<string>(() => {
    try {
      return localStorage.getItem('selected_strategy_name') || 'Current Week Highest Win';
    } catch (e) {
      return 'Current Week Highest Win';
    }
  });

  const [loadingStrategyRec, setLoadingStrategyRec] = useState<boolean>(false);
  const [strategyRec, setStrategyRec] = useState<any | null>(null);
  const [strategyRecError, setStrategyRecError] = useState<string | null>(null);

  // Valid / Unused Teams State
  const [loadingValidPicks, setLoadingValidPicks] = useState<boolean>(false);
  const [validPickOptions, setValidPickOptions] = useState<any[]>([]);
  const [validPicksError, setValidPicksError] = useState<string | null>(null);
  const [teamSearch, setTeamSearch] = useState<string>('');

  // Active Selection & Submission State
  const [activeSelection, setActiveSelection] = useState<{
    team_id: number | string;
    team_name: string;
    team_code: string;
    opponent?: string;
    spread?: string | number;
    win_probability?: number | string;
    projected_ev?: number | string;
    is_strategy_recommendation: boolean;
    rationale?: string;
  } | null>(null);

  const [isPickLocked, setIsPickLocked] = useState<boolean>(false);
  const [submittingPick, setSubmittingPick] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Housekeeping / Prior Legs Review State
  const [showHousekeeping, setShowHousekeeping] = useState<boolean>(false);

  // Pick Modal state for missing prior legs
  const [pickModalOpen, setPickModalOpen] = useState<boolean>(false);
  const [activeLeg, setActiveLeg] = useState<any | null>(null);
  const [modalValidPicks, setModalValidPicks] = useState<any[]>([]);
  const [loadingModalValidPicks, setLoadingModalValidPicks] = useState<boolean>(false);
  const [selectedTeamId, setSelectedTeamId] = useState<number | string>('');
  const [changeReason, setChangeReason] = useState<string>('Manual pick review update');
  const [savingPick, setSavingPick] = useState<boolean>(false);
  const [pickError, setPickError] = useState<string | null>(null);

  // Determine active entry ID strictly from selectedEntry
  const entryId = selectedEntry?.entry_id || null;
  const userEntries = user?.entries || [];

  // Helper to format clean team names (eliminating duplicate words like "Seattle Seattle Seahawks")
  const cleanTeamName = (team: any): string => {
    if (!team) return 'Team';
    let name = team.team_name || team.name || team.team_code || '';
    if (!name && team.team_id) name = `Team #${team.team_id}`;
    name = String(name).trim();

    // Remove duplicated words at the start e.g. "Seattle Seattle Seahawks" -> "Seattle Seahawks"
    const words = name.split(/\s+/);
    if (words.length >= 2 && words[0].toLowerCase() === words[1].toLowerCase()) {
      name = words.slice(1).join(' ');
    }

    return name || 'Team';
  };

  // Helper to format clean user-friendly errors
  const formatErrorMessage = (err: any, fallback: string): string => {
    if (!err) return fallback;
    let raw = '';
    if (err instanceof ApiError) {
      raw = err.message;
    } else if (typeof err === 'string') {
      raw = err;
    } else if (err?.message && typeof err.message === 'string') {
      raw = err.message;
    } else {
      raw = fallback;
    }

    if (raw.includes('{') || raw.includes('Traceback (most recent call last)')) {
      return fallback;
    }
    return raw || fallback;
  };

  // 1. Fetch Review Data: GET /season-management/entries/{entry_id}/review
  const fetchReview = async (idToFetch?: string | number) => {
    const id = idToFetch || entryId;
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await SemiSharpApi.getEntryReview(id);
      setReviewData(data);
    } catch (err: any) {
      console.error('Failed to load entry review:', err);
      const msg = formatErrorMessage(err, 'Failed to connect to backend entry review endpoint.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (entryId && !isChangingEntry) {
      fetchReview(entryId);
    } else {
      setLoading(false);
    }
  }, [entryId, isChangingEntry]);

  // Derived Context Values
  const currentWeek = reviewData?.application_context?.current_week || context?.current_week || context?.week || 1;
  const contestLegId = reviewData?.application_context?.current_leg_id || reviewData?.application_context?.contest_leg_id || currentWeek;
  const season = reviewData?.application_context?.season || context?.season || 2026;
  const formatCode = selectedEntry?.format_code || reviewData?.contest_format?.format_code || 'STANDARD';

  // Detect prior history and existing recorded pick for active leg
  const priorHistory = useMemo(() => {
    return Array.isArray(reviewData?.prior_pick_history) ? reviewData.prior_pick_history : [];
  }, [reviewData]);

  const existingCurrentLegPick = useMemo(() => {
    if (!reviewData) return null;
    return priorHistory.find((leg: any) => 
      (Number(leg.contest_leg_id) === Number(contestLegId) || Number(leg.week) === Number(currentWeek) || Number(leg.nfl_week) === Number(currentWeek)) &&
      leg.team_id && !leg.is_missing
    ) || null;
  }, [reviewData, priorHistory, contestLegId, currentWeek]);

  // Sync existing pick into activeSelection and lock state
  useEffect(() => {
    if (existingCurrentLegPick && existingCurrentLegPick.team_id) {
      const tId = existingCurrentLegPick.team_id || existingCurrentLegPick.team_code;
      const tName = cleanTeamName(existingCurrentLegPick);
      const tCode = existingCurrentLegPick.team_code || existingCurrentLegPick.team || '';

      setActiveSelection({
        team_id: tId,
        team_name: tName,
        team_code: tCode,
        opponent: existingCurrentLegPick.opponent || existingCurrentLegPick.opponent_code || '',
        spread: existingCurrentLegPick.spread,
        win_probability: existingCurrentLegPick.win_probability || existingCurrentLegPick.win_prob,
        projected_ev: existingCurrentLegPick.projected_ev || existingCurrentLegPick.ev,
        is_strategy_recommendation: Boolean(existingCurrentLegPick.is_strategy_recommendation || existingCurrentLegPick.pick_source === 'STRATEGY'),
        rationale: existingCurrentLegPick.change_reason || existingCurrentLegPick.rationale || `Active recorded pick locked in for Week ${currentWeek}.`
      });
      setIsPickLocked(true);
    }
  }, [existingCurrentLegPick, currentWeek]);

  // Set of locked out / used teams from prior weeks
  const usedTeamSet = useMemo(() => {
    const set = new Set<string>();
    const usedList = Array.isArray(reviewData?.used_teams) ? reviewData.used_teams : [];
    usedList.forEach((t: any) => {
      if (typeof t === 'string') {
        set.add(t.toLowerCase().trim());
      } else if (t) {
        if (t.team_id) set.add(String(t.team_id));
        if (t.team_code) set.add(String(t.team_code).toLowerCase().trim());
        if (t.team_name) set.add(String(t.team_name).toLowerCase().trim());
      }
    });

    // Also include prior leg history from earlier weeks (excluding active leg)
    priorHistory.forEach((leg: any) => {
      if (Number(leg.contest_leg_id) !== Number(contestLegId) && Number(leg.week) !== Number(currentWeek)) {
        if (leg.team_id) set.add(String(leg.team_id));
        if (leg.team_code) set.add(String(leg.team_code).toLowerCase().trim());
        if (leg.team_name) set.add(String(leg.team_name).toLowerCase().trim());
      }
    });

    return set;
  }, [reviewData, priorHistory, contestLegId, currentWeek]);

  // 2. Fetch Carry-Forward Strategy Recommendation from Step 1 strategy execution endpoint
  useEffect(() => {
    if (!entryId || !reviewData) return;

    let isMounted = true;
    const fetchStrategyRec = async () => {
      setLoadingStrategyRec(true);
      setStrategyRecError(null);

      // Re-read strategy code from localStorage in case user changed it
      let stratCode = 'CURRENT_WEEK_HIGHEST_WIN';
      let stratName = 'Current Week Highest Win';
      try {
        stratCode = localStorage.getItem('selected_strategy_code') || 'CURRENT_WEEK_HIGHEST_WIN';
        stratName = localStorage.getItem('selected_strategy_name') || 'Current Week Highest Win';
        setSelectedStrategyCode(stratCode);
        setSelectedStrategyName(stratName);
      } catch (e) {
        console.warn('LocalStorage access warning:', e);
      }

      try {
        const roadmap = await SemiSharpApi.getStrategyRoadmap(
          stratCode,
          season,
          formatCode,
          entryId
        );

        if (!isMounted) return;

        // Extract pick recommendation for current week
        const picksList = roadmap?.entries?.[0]?.picks || (roadmap as any)?.picks || (roadmap as any)?.recommendations || [];
        const currentPick = picksList.find((p: any) => 
          Number(p.week) === Number(currentWeek) || Number(p.contest_leg_id) === Number(contestLegId)
        ) || picksList[0] || null;

        setStrategyRec(currentPick);

        // Auto-select strategy recommendation as draft if no active selection yet and no existing pick
        if (currentPick && !existingCurrentLegPick) {
          const recTeamId = currentPick.team_id || currentPick.team_code;
          const recTeamName = cleanTeamName(currentPick);
          const recTeamCode = currentPick.team_code || currentPick.team || currentPick.team_name || '';

          setActiveSelection({
            team_id: recTeamId,
            team_name: recTeamName,
            team_code: recTeamCode,
            opponent: currentPick.opponent || currentPick.opponent_code || '',
            spread: currentPick.spread,
            win_probability: currentPick.win_probability || currentPick.win_prob,
            projected_ev: currentPick.projected_ev || currentPick.ev,
            is_strategy_recommendation: true,
            rationale: currentPick.rationale || currentPick.reasoning || currentPick.recommendation_notes || `Recommended by Step 1 strategy (${stratName}) to maximize survival probability.`
          });
        }
      } catch (err: any) {
        console.error('Error fetching strategy recommendation:', err);
        if (isMounted) {
          setStrategyRecError(formatErrorMessage(err, 'Failed to fetch strategy recommendation for current week.'));
        }
      } finally {
        if (isMounted) setLoadingStrategyRec(false);
      }
    };

    fetchStrategyRec();

    return () => { isMounted = false; };
  }, [entryId, reviewData, currentWeek, contestLegId, season, formatCode, existingCurrentLegPick]);

  // 3. Fetch Unused / Valid Teams: GET /season-management/entries/{entry_id}/valid-picks/{contest_leg_id}
  useEffect(() => {
    if (!entryId || !reviewData) return;

    let isMounted = true;
    const fetchUnusedValidTeams = async () => {
      setLoadingValidPicks(true);
      setValidPicksError(null);

      try {
        const resp = await SemiSharpApi.getValidPicks(entryId, contestLegId);
        if (!isMounted) return;

        const options = resp?.options || (Array.isArray(resp) ? resp : []);
        setValidPickOptions(options);
      } catch (err: any) {
        console.error('Error fetching valid/unused teams:', err);
        if (isMounted) {
          setValidPicksError(formatErrorMessage(err, 'Failed to load unused teams grid from server.'));
        }
      } finally {
        if (isMounted) setLoadingValidPicks(false);
      }
    };

    fetchUnusedValidTeams();

    return () => { isMounted = false; };
  }, [entryId, reviewData, contestLegId]);

  // Filter unused teams by user search query
  const filteredValidTeams = useMemo(() => {
    if (!teamSearch.trim()) return validPickOptions;
    const q = teamSearch.toLowerCase().trim();
    return validPickOptions.filter((t: any) => {
      const name = (cleanTeamName(t) || '').toLowerCase();
      const opp = (t.opponent || t.opponent_code || '').toLowerCase();
      return name.includes(q) || opp.includes(q);
    });
  }, [validPickOptions, teamSearch]);

  // Core function to save/update weekly pick via POST or PUT /season-management/entries/{entry_id}/picks
  const savePickToBackend = async (selection: any, autoNavigateStepD: boolean = false): Promise<boolean> => {
    if (!entryId || !selection || !selection.team_id || !contestLegId) {
      if (!selection || !selection.team_id) {
        setSubmitError(`Please select an eligible team for Week ${currentWeek}.`);
      }
      return false;
    }

    setSubmittingPick(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    const reasonText = selection.is_strategy_recommendation
      ? `Accepted Step 2 strategy recommendation (${selectedStrategyName})`
      : `Selected team (${selection.team_name}) in Step 3`;

    try {
      let hasExistingPick = false;
      let existingPickId = existingCurrentLegPick?.entry_pick_id || existingCurrentLegPick?.pick_id;

      if (!existingPickId) {
        try {
          const picksResp = await SemiSharpApi.getEntryPicks(entryId);
          const picksArr = Array.isArray(picksResp?.picks) ? picksResp.picks : (Array.isArray(picksResp) ? picksResp : []);
          const matchingPick = picksArr.find((p: any) => 
            Number(p.contest_leg_id) === Number(contestLegId) || Number(p.week) === Number(currentWeek) || Number(p.nfl_week) === Number(currentWeek)
          );
          if (matchingPick) {
            existingPickId = matchingPick.entry_pick_id || matchingPick.pick_id;
            hasExistingPick = true;
          }
        } catch (e) {
          console.warn('Checking existing picks:', e);
        }
      } else {
        hasExistingPick = true;
      }

      if (hasExistingPick) {
        // Update existing pick row via PUT /season-management/entries/{entry_id}/picks/{contest_leg_id}
        await SemiSharpApi.updatePick(entryId, contestLegId, {
          team_id: Number(selection.team_id),
          pick_source: 'USER_ENTRY',
          pick_status: 'CONFIRMED',
          change_reason: reasonText,
          contest_leg_id: Number(contestLegId),
        });
      } else {
        // Attempt creating new pick row via POST /season-management/entries/{entry_id}/picks
        try {
          await SemiSharpApi.createPick(entryId, {
            contest_leg_id: Number(contestLegId),
            team_id: Number(selection.team_id),
            pick_source: 'USER_ENTRY',
            pick_status: 'CONFIRMED',
            change_reason: reasonText,
          });
        } catch (createErr: any) {
          console.warn('POST pick failed, falling back to PUT with contest_leg_id...', createErr);
          await SemiSharpApi.updatePick(entryId, contestLegId, {
            team_id: Number(selection.team_id),
            pick_source: 'USER_ENTRY',
            pick_status: 'CONFIRMED',
            change_reason: reasonText,
            contest_leg_id: Number(contestLegId),
          });
        }
      }

      setIsPickLocked(true);
      setSubmitSuccess(`✓ Saved pick for ${selection.team_name} in database for Week ${currentWeek}.`);
      await fetchReview(entryId);

      if (autoNavigateStepD) {
        setTimeout(() => {
          onNavigate('step_4');
        }, 400);
      }
      return true;
    } catch (err: any) {
      console.error('Error saving weekly pick:', err);
      setIsPickLocked(false);
      setSubmitError(formatErrorMessage(err, 'Failed to record weekly pick on server. Please try again.'));
      return false;
    } finally {
      setSubmittingPick(false);
    }
  };

  // Select a team from the Unused Teams Grid
  const handleSelectGridTeam = (team: any) => {
    const tId = team.team_id || team.team_code;
    const rawName = team.team_name || team.team_code || team.name || '';
    const tName = cleanTeamName(team);
    const tCode = team.team_code || team.name || team.team_name || '';

    // Check if team was previously used in a prior week
    const isUsed = Boolean(
      (tId && usedTeamSet.has(String(tId))) ||
      (tCode && usedTeamSet.has(String(tCode).toLowerCase().trim())) ||
      (rawName && usedTeamSet.has(String(rawName).toLowerCase().trim())) ||
      (tName && usedTeamSet.has(String(tName).toLowerCase().trim())) ||
      team.is_used === true ||
      team.is_eligible === false
    );

    if (isUsed) {
      setSubmitError(`"${tName}" was previously used in a prior week and cannot be selected again for this entry.`);
      return;
    }

    // Check if this grid team matches the strategy recommended team
    const isStrategyRec = Boolean(
      strategyRec && (
        String(tId) === String(strategyRec.team_id) || 
        tCode.toUpperCase() === (strategyRec.team_code || strategyRec.team || '').toUpperCase()
      )
    );

    const selection = {
      team_id: tId,
      team_name: tName,
      team_code: tCode,
      opponent: team.opponent || team.opponent_code || '',
      spread: team.spread,
      win_probability: team.win_probability || team.win_prob,
      projected_ev: team.projected_ev || team.ev,
      is_strategy_recommendation: isStrategyRec,
      rationale: isStrategyRec 
        ? strategyRec?.rationale || `Accepted Step 2 recommendation (${selectedStrategyName}).`
        : `Selected alternate unused team ${tName} for Week ${currentWeek}.`
    };

    setActiveSelection(selection);
    setSubmitError(null);
    setSubmitSuccess(null);

    // Immediately invoke backend mutation on selection
    savePickToBackend(selection, false);
  };

  // Explicitly Accept Strategy Recommendation
  const handleAcceptStrategyRec = () => {
    if (!strategyRec) return;
    const recTeamId = strategyRec.team_id || strategyRec.team_code;
    const recTeamName = cleanTeamName(strategyRec);
    const recTeamCode = strategyRec.team_code || strategyRec.team || strategyRec.team_name || '';

    const selection = {
      team_id: recTeamId,
      team_name: recTeamName,
      team_code: recTeamCode,
      opponent: strategyRec.opponent || strategyRec.opponent_code || '',
      spread: strategyRec.spread,
      win_probability: strategyRec.win_probability || strategyRec.win_prob,
      projected_ev: strategyRec.projected_ev || strategyRec.ev,
      is_strategy_recommendation: true,
      rationale: strategyRec.rationale || strategyRec.reasoning || strategyRec.recommendation_notes || `Recommended by Step 2 strategy (${selectedStrategyName}).`
    };

    setActiveSelection(selection);
    setSubmitError(null);
    setSubmitSuccess(null);

    // Immediately invoke backend mutation on selection
    savePickToBackend(selection, false);
  };

  // Action to reset selection / unlock pick state
  const handleResetOrChangePick = () => {
    setIsPickLocked(false);
    setSubmitSuccess(null);
    setSubmitError(null);
  };

  // Handle "Continue to Step 4" button
  const handleLockInPickAndProceed = async () => {
    if (isPickLocked && existingCurrentLegPick) {
      onNavigate('step_4');
      return;
    }

    if (activeSelection && activeSelection.team_id) {
      await savePickToBackend(activeSelection, true);
    } else {
      setSubmitError(`Please select an eligible team for Week ${currentWeek} before proceeding to Step 4.`);
    }
  };

  // Open Enter/Edit Pick Modal for missing prior leg in Housekeeping
  const handleOpenPickModal = async (leg: any) => {
    if (!entryId) return;
    setActiveLeg(leg);
    setPickModalOpen(true);
    setLoadingModalValidPicks(true);
    setPickError(null);
    setSelectedTeamId(leg.team_id || '');
    setChangeReason('Manual pick review update');

    try {
      const resp = await SemiSharpApi.getValidPicks(entryId, leg.contest_leg_id);
      const picksList = resp?.options || (Array.isArray(resp) ? resp : []);
      setModalValidPicks(picksList);
    } catch (err: any) {
      console.error('Error fetching valid picks:', err);
      setPickError(formatErrorMessage(err, 'Failed to load valid team options from server.'));
    } finally {
      setLoadingModalValidPicks(false);
    }
  };

  // Save Modal Pick for missing prior legs
  const handleSaveModalPick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryId || !activeLeg || !selectedTeamId) return;

    setSavingPick(true);
    setPickError(null);

    const existingPickId = activeLeg.entry_pick_id || activeLeg.pick_id;
    const pickStatus = 'CONFIRMED';

    try {
      if (existingPickId) {
        await SemiSharpApi.updatePick(entryId, existingPickId, {
          team_id: Number(selectedTeamId),
          pick_source: 'ADMIN_CORRECTION',
          pick_status: pickStatus,
          change_reason: changeReason || 'Manual pick correction',
          contest_leg_id: Number(activeLeg.contest_leg_id),
        });
      } else {
        await SemiSharpApi.createPick(entryId, {
          contest_leg_id: Number(activeLeg.contest_leg_id),
          team_id: Number(selectedTeamId),
          pick_source: 'USER_ENTRY',
          pick_status: pickStatus,
          change_reason: changeReason || 'Initial pick entry',
        });
      }

      setPickModalOpen(false);
      setActiveLeg(null);
      setSelectedTeamId('');
      
      await fetchReview(entryId);
    } catch (err: any) {
      console.error('Error saving modal pick:', err);
      setPickError(formatErrorMessage(err, 'Failed to record survivor pick. Please check selection and retry.'));
    } finally {
      setSavingPick(false);
    }
  };

  // Render STATE 1: Inline Entry Switcher
  if (!selectedEntry || isChangingEntry) {
    return (
      <div className="space-y-6 animate-fade-in text-left font-sans text-slate-900" id="step2_entry_workspace">
        <Card className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-3xs space-y-5" id="card_my_survivor_entries">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 font-mono flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                <span>My Survivor Entries</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Select an entry to make your active weekly pick selection in Step 2.
              </p>
            </div>
            {selectedEntry && isChangingEntry && (
              <Button
                onClick={() => setIsChangingEntry(false)}
                variant="outline"
                className="text-xs font-mono font-bold border-slate-200 text-slate-600 hover:bg-slate-100 self-start sm:self-auto cursor-pointer"
              >
                Cancel
              </Button>
            )}
          </div>

          {userEntries.length === 0 ? (
            <div className="p-8 bg-slate-50 border border-slate-200/70 rounded-xl text-center space-y-2">
              <p className="text-xs font-bold text-slate-700 font-mono">No active survivor entries found in session.</p>
              <p className="text-xs text-slate-500">Contact system administration or register a contest entry to proceed.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userEntries.map((ent: any) => {
                const isCurrent = selectedEntry && Number(selectedEntry.entry_id) === Number(ent.entry_id);
                return (
                  <div
                    key={ent.entry_id}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                      isCurrent
                        ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md">
                          Entry #{ent.entry_id}
                        </span>
                        <span className="text-[10px] font-mono font-extrabold text-slate-500">
                          {ent.format_name || ent.format_code || 'Standard'}
                        </span>
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900 font-mono">
                        {ent.entry_label || `Entry #${ent.entry_id}`}
                      </h4>
                      {ent.survivor_sweat_name && (
                        <p className="text-xs text-slate-500 font-medium">
                          Sweat: {ent.survivor_sweat_name}
                        </p>
                      )}
                    </div>

                    <Button
                      onClick={() => {
                        selectEntry(ent);
                        setIsChangingEntry(false);
                      }}
                      className={`w-full text-xs font-mono font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-3xs ${
                        isCurrent
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>{isCurrent ? 'Currently Selected' : 'Select Entry'}</span>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    );
  }

  // Extract fields directly from backend response
  const appCtx = reviewData?.application_context || {};
  const entryObj = reviewData?.entry || selectedEntry || {};
  const formatObj = reviewData?.contest_format || {};
  const entryStatus = reviewData?.entry_status || null;
  const priorPickHistory = Array.isArray(reviewData?.prior_pick_history) ? reviewData.prior_pick_history : [];
  const usedTeams = Array.isArray(reviewData?.used_teams) ? reviewData.used_teams : [];

  const isEntryReady = Boolean(
    reviewData?.entry_ready || 
    reviewData?.is_ready || 
    reviewData?.readiness_status === 'READY'
  );

  return (
    <div className="space-y-4 animate-fade-in text-left font-sans text-slate-900" id="step2_active_pick_workspace">

      {/* STATUS HEADER */}
      <div className="p-3.5 sm:p-4 bg-slate-900 text-white border border-slate-800 rounded-2xl shadow-3xs" id="active_entry_header_banner">
        
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
              GET /season-management/entries/{entryId}/valid-picks/{contestLegId}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
            <span className="px-2.5 py-1 bg-slate-800 rounded-lg border border-slate-700 text-slate-200">
              Entry #{entryId}
            </span>
            <span className="px-2.5 py-1 bg-slate-800 rounded-lg border border-slate-700 text-indigo-300">
              {selectedEntry.format_name || selectedEntry.format_code || 'Standard'}
            </span>
            <Button
              onClick={() => setIsChangingEntry(true)}
              variant="outline"
              className="text-[11px] font-mono font-bold border-slate-700 text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white cursor-pointer px-2.5 py-1 rounded-lg flex items-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3 text-indigo-400" />
              <span>Change Entry</span>
            </Button>
          </div>
        </div>

      </div>

      {loading ? (
        <Card className="p-12 text-center space-y-4">
          <LoadingSpinner size="md" message={`Loading entry review data for Entry #${entryId}...`} />
        </Card>
      ) : error ? (
        <Card className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 space-y-3">
          <div className="flex items-center gap-2 font-mono font-bold text-sm text-rose-700">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>API Error Loading Entry Review</span>
          </div>
          <p className="text-xs font-sans text-rose-800">{error}</p>
          <Button
            onClick={() => fetchReview()}
            className="text-xs font-mono font-bold bg-rose-600 hover:bg-rose-700 text-white py-1.5 px-4 rounded-xl cursor-pointer"
          >
            Retry Connection
          </Button>
        </Card>
      ) : (
        <>
          {/* SECTION 1: USED TEAMS ROSTER HEADER */}
          <Card className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-3xs space-y-3" id="card_used_teams_roster_header">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 font-mono flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-700" />
                  <span>Used Teams Roster ({usedTeams.length} Team{usedTeams.length === 1 ? '' : 's'} Locked Out)</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Teams previously selected by <span className="font-bold text-slate-800">{selectedEntry.entry_label || `Entry #${entryId}`}</span> in prior weeks and unavailable for Week {currentWeek}.
                </p>
              </div>

              <span className="text-[10px] font-mono font-extrabold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 self-start sm:self-auto shrink-0">
                {32 - usedTeams.length} Available Teams Remaining
              </span>
            </div>

            {usedTeams.length === 0 ? (
              <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 text-emerald-900 rounded-xl text-xs font-mono flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All 32 NFL teams are eligible and available (Week 1 — No prior used teams).</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {priorPickHistory.filter((leg: any) => leg.team_name || leg.team_code || leg.team_id).map((leg: any, idx: number) => {
                  const legWeek = leg.nfl_week || leg.week || idx + 1;
                  const tName = cleanTeamName(leg);
                  const tCode = leg.team_code || leg.team || tName;
                  return (
                    <div
                      key={leg.contest_leg_id || idx}
                      className="px-3 py-1.5 bg-slate-100 border border-slate-200/90 rounded-xl text-xs font-mono font-bold text-slate-800 flex items-center gap-2 shadow-2xs"
                    >
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.5 rounded-md">
                        Week {legWeek}
                      </span>
                      <span className="flex items-center gap-1">
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>{tName} ({tCode})</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* SECTION 2: FEATURED STRATEGY RECOMMENDATION BANNER */}
          <Card className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-3xs space-y-5" id="card_step1_recommendation">
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-extrabold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    Step 2 Strategy
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md uppercase">
                    {selectedStrategyCode}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 font-mono flex items-center gap-2 mt-1">
                  <Compass className="w-5 h-5 text-indigo-600" />
                  <span>Featured Strategy Recommendation: {selectedStrategyName}</span>
                </h3>
              </div>

              <Button
                onClick={() => onNavigate('step_2')}
                variant="outline"
                className="text-xs font-mono font-bold border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer self-start sm:self-auto"
              >
                Change Strategy in Step 2
              </Button>
            </div>

            {loadingStrategyRec ? (
              <div className="py-8 text-center space-y-2">
                <LoadingSpinner size="sm" message={`Calculating current week pick recommendation for strategy ${selectedStrategyCode}...`} />
              </div>
            ) : strategyRecError ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
                <p className="font-bold font-mono">⚠ Strategy Execution Note</p>
                <p className="text-slate-700">{strategyRecError}</p>
                <p className="text-slate-500">You may select an alternate team directly from the Unused Teams Grid below.</p>
              </div>
            ) : strategyRec ? (
              <div className={`p-5 rounded-2xl border transition-all space-y-4 ${
                activeSelection?.is_strategy_recommendation
                  ? 'bg-indigo-900 text-white border-indigo-700 shadow-sm ring-2 ring-indigo-500/30'
                  : 'bg-slate-50 text-slate-900 border-slate-200'
              }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Team & Matchup Identity */}
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-mono font-black text-lg border shrink-0 ${
                      activeSelection?.is_strategy_recommendation
                        ? 'bg-indigo-800 border-indigo-600 text-indigo-200 shadow-inner'
                        : 'bg-white border-slate-200 text-indigo-900 shadow-3xs'
                    }`}>
                      {strategyRec.team_code || strategyRec.team || 'REC'}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded uppercase flex items-center gap-1 ${
                          activeSelection?.is_strategy_recommendation
                            ? 'bg-indigo-800 text-indigo-200 border border-indigo-700'
                            : 'bg-amber-100 text-amber-900 border border-amber-300 font-black'
                        }`}>
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          PRIMARY MODEL RECOMMENDATION • WEEK {currentWeek}
                        </span>
                      </div>
                      <h4 className="text-lg font-black font-mono tracking-tight">
                        {strategyRec.team_name || strategyRec.team_code || strategyRec.team || 'Recommended Team'}
                      </h4>
                      {strategyRec.opponent && (
                        <p className={`text-xs font-mono font-bold ${activeSelection?.is_strategy_recommendation ? 'text-indigo-200' : 'text-slate-600'}`}>
                          Matchup: vs {strategyRec.opponent} {strategyRec.spread ? `(${strategyRec.spread})` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quantitative Metrics & Action */}
                  <div className="flex items-center gap-3 font-mono text-xs shrink-0 flex-wrap">
                    {strategyRec.win_probability && (
                      <div className={`px-3 py-2 rounded-xl border text-center ${
                        activeSelection?.is_strategy_recommendation
                          ? 'bg-indigo-950/80 border-indigo-800 text-emerald-400'
                          : 'bg-white border-slate-200 text-emerald-700 shadow-3xs'
                      }`}>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Win Prob</div>
                        <div className="text-sm font-black">
                          {typeof strategyRec.win_probability === 'number' && strategyRec.win_probability <= 1
                            ? `${(strategyRec.win_probability * 100).toFixed(1)}%`
                            : `${strategyRec.win_probability}%`
                          }
                        </div>
                      </div>
                    )}

                    {(strategyRec.projected_ev || strategyRec.ev) && (
                      <div className={`px-3 py-2 rounded-xl border text-center ${
                        activeSelection?.is_strategy_recommendation
                          ? 'bg-indigo-950/80 border-indigo-800 text-indigo-300'
                          : 'bg-white border-slate-200 text-indigo-900 shadow-3xs'
                      }`}>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Projected EV</div>
                        <div className="text-sm font-black">
                          {strategyRec.projected_ev || strategyRec.ev}
                        </div>
                      </div>
                    )}

                    {/* Accept Recommendation Trigger */}
                    <Button
                      onClick={handleAcceptStrategyRec}
                      className={`font-mono text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 cursor-pointer shadow-3xs ${
                        activeSelection?.is_strategy_recommendation
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      {activeSelection?.is_strategy_recommendation ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Recommendation Accepted</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          <span>Accept Recommendation</span>
                        </>
                      )}
                    </Button>
                  </div>

                </div>

                {/* Rationale Text */}
                {(strategyRec.rationale || strategyRec.reasoning || strategyRec.recommendation_notes) && (
                  <div className={`p-3 rounded-xl border text-xs leading-relaxed font-sans ${
                    activeSelection?.is_strategy_recommendation
                      ? 'bg-indigo-950/70 border-indigo-800/80 text-slate-200'
                      : 'bg-white border-slate-200/90 text-slate-700'
                  }`}>
                    <span className="font-mono font-bold text-indigo-400 mr-1.5">STRATEGY RATIONALE:</span>
                    {strategyRec.rationale || strategyRec.reasoning || strategyRec.recommendation_notes}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 font-mono text-center">
                No active strategy recommendation returned for current week. Please choose from the unused teams grid below.
              </div>
            )}
          </Card>

          {/* SECTION 3: COMPREHENSIVE UNUSED TEAMS / GAME GRID */}
          <Card className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-3xs space-y-5" id="card_unused_teams_grid">
            <div className="border-b border-slate-100 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 font-mono flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <span>Unused Teams / Game Grid ({validPickOptions.length} Teams Available)</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Complete grid of available unused teams for Week {currentWeek}. The strategy recommendation tile is highlighted below.
                </p>
              </div>

              {/* Search Filter */}
              <div className="relative w-full md:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search unused teams..."
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            {loadingValidPicks ? (
              <div className="py-8 text-center">
                <LoadingSpinner size="sm" message="Loading valid unused team options for this entry..." />
              </div>
            ) : validPicksError ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 font-mono">
                ⚠ {validPicksError}
              </div>
            ) : filteredValidTeams.length === 0 ? (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 font-mono text-center">
                {teamSearch ? `No unused teams match "${teamSearch}".` : 'No valid unused team options available for this entry leg.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {filteredValidTeams.map((team: any, idx: number) => {
                  const tId = team.team_id || team.team_code;
                  const rawName = team.team_name || team.team_code || team.name || '';
                  const tName = cleanTeamName(team);
                  const tCode = team.team_code || team.name || team.team_name || '';
                  const opponent = team.opponent || team.opponent_code || '—';

                  const isUsed = Boolean(
                    (tId && usedTeamSet.has(String(tId))) ||
                    (tCode && usedTeamSet.has(String(tCode).toLowerCase().trim())) ||
                    (rawName && usedTeamSet.has(String(rawName).toLowerCase().trim())) ||
                    (tName && usedTeamSet.has(String(tName).toLowerCase().trim())) ||
                    team.is_used === true ||
                    team.is_eligible === false
                  );

                  const isSelected = activeSelection && String(activeSelection.team_id) === String(tId);

                  const isStrategyRec = Boolean(
                    strategyRec && (
                      String(tId) === String(strategyRec.team_id) || 
                      tCode.toUpperCase() === (strategyRec.team_code || strategyRec.team || '').toUpperCase()
                    )
                  );

                  return (
                    <div
                      key={tId || idx}
                      onClick={() => !isUsed && !submittingPick && handleSelectGridTeam(team)}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-3 relative ${
                        isSelected
                          ? 'bg-indigo-900 text-white border-indigo-700 ring-2 ring-indigo-500/40 shadow-xs cursor-pointer'
                          : isStrategyRec
                            ? 'bg-gradient-to-b from-amber-50/90 to-amber-100/50 text-slate-900 border-amber-300 ring-2 ring-amber-400/50 shadow-xs hover:border-amber-400 hover:shadow-md cursor-pointer'
                            : isUsed
                              ? 'bg-slate-50 text-slate-400 border-slate-200/80 opacity-60 cursor-not-allowed'
                              : 'bg-white text-slate-900 border-slate-200 hover:border-indigo-300 hover:bg-slate-50/80 cursor-pointer'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          {isStrategyRec && !isSelected ? (
                            <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-amber-400 text-amber-950 border border-amber-500 shadow-3xs flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-amber-900" />
                              STRATEGY RECOMMENDED
                            </span>
                          ) : (
                            <span className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded ${
                              isSelected
                                ? 'bg-indigo-800 text-indigo-100 border border-indigo-700'
                                : isUsed
                                  ? 'bg-slate-200 text-slate-600 border border-slate-300'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}>
                              {isSelected ? '✓ SELECTED' : isUsed ? 'PREVIOUSLY USED' : 'ELIGIBLE'}
                            </span>
                          )}

                          <span className={`text-[10px] font-mono font-bold ml-auto ${
                            isSelected ? 'text-indigo-300' : isStrategyRec ? 'text-amber-800' : 'text-slate-400'
                          }`}>
                            #{tCode || tId}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-black text-xs border shrink-0 ${
                            isSelected
                              ? 'bg-indigo-800 border-indigo-600 text-white'
                              : isStrategyRec
                                ? 'bg-amber-400 border-amber-500 text-amber-950'
                                : isUsed
                                  ? 'bg-slate-200 border-slate-300 text-slate-500'
                                  : 'bg-slate-100 border-slate-200 text-slate-800'
                          }`}>
                            {tCode || 'NFL'}
                          </div>
                          <div>
                            <h4 className={`text-xs font-black font-mono tracking-tight leading-snug ${
                              isSelected ? 'text-white' : isUsed ? 'text-slate-500 line-through' : 'text-slate-900'
                            }`}>
                              {tName}
                            </h4>
                            <p className={`text-[11px] font-mono ${isSelected ? 'text-indigo-200' : isStrategyRec ? 'text-amber-900 font-bold' : 'text-slate-500'}`}>
                              vs {opponent} {team.spread ? `(${team.spread})` : ''}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                        <span className={isSelected ? 'text-indigo-200' : isStrategyRec ? 'text-amber-900 font-bold' : isUsed ? 'text-slate-400' : 'text-slate-600'}>
                          {team.win_probability ? `Win: ${team.win_probability}%` : isUsed ? 'Unavailable' : 'Available'}
                        </span>

                        <Button
                          type="button"
                          variant="outline"
                          disabled={isUsed || submittingPick}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isUsed && !submittingPick) handleSelectGridTeam(team);
                          }}
                          className={`text-[10px] font-mono font-bold py-0.5 px-2.5 h-auto rounded-lg ${
                            isSelected
                              ? 'bg-emerald-500 text-white border-emerald-400 hover:bg-emerald-600'
                              : isStrategyRec
                                ? 'bg-amber-400 text-amber-950 border-amber-500 hover:bg-amber-500 font-extrabold'
                                : isUsed
                                  ? 'border-slate-200 text-slate-400 bg-slate-100 cursor-not-allowed'
                                  : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {isSelected ? '✓ Choice' : isStrategyRec ? '★ Rec' : isUsed ? 'Used' : 'Select'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* SECTION 4: ENTRY HOUSEKEEPING & HISTORICAL AUDIT (COLLAPSIBLE) */}
          <Card className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-3xs space-y-4" id="card_housekeeping_collapsible">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 font-mono uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>Entry Housekeeping & Historical Pick History</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Verify prior leg picks and check readiness status returned by the server.
                </p>
              </div>

              <Button
                onClick={() => setShowHousekeeping(!showHousekeeping)}
                variant="outline"
                className="text-xs font-mono font-bold border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5"
              >
                <span>{showHousekeeping ? 'Hide History' : 'Show History'}</span>
                {showHousekeeping ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </Button>
            </div>

            {showHousekeeping && (
              <div className="space-y-4 pt-2">
                {/* Official Pick History Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4 font-bold">Leg</th>
                        <th className="py-3 px-4 font-bold">NFL Week</th>
                        <th className="py-3 px-4 font-bold">Team</th>
                        <th className="py-3 px-4 font-bold">Status</th>
                        <th className="py-3 px-4 font-bold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {priorPickHistory.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-slate-500 font-mono text-xs">
                            No prior leg pick history recorded for this entry.
                          </td>
                        </tr>
                      ) : (
                        priorPickHistory.map((leg: any, idx: number) => {
                          const isMissing = Boolean(leg.is_missing || (!leg.team_name && !leg.team_code && !leg.team_id));
                          const legLabel = leg.leg_name || leg.leg_label || leg.leg || `Leg #${leg.contest_leg_id || idx + 1}`;
                          const nflWeek = leg.nfl_week || leg.week || leg.regular_week || '—';
                          const teamText = isMissing ? 'Missing' : (leg.team_name || leg.team_code || leg.team || 'Selected Team');

                          return (
                            <tr key={leg.contest_leg_id || idx} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-4 font-bold text-slate-900">
                                {legLabel}
                              </td>
                              <td className="py-3 px-4 font-medium text-slate-700">
                                Week {nflWeek}
                              </td>
                              <td className={`py-3 px-4 font-bold ${isMissing ? 'text-rose-600 italic' : 'text-slate-900'}`}>
                                {teamText}
                              </td>
                              <td className="py-3 px-4">
                                {isMissing ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md uppercase">
                                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                                    Required
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md uppercase">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    Confirmed
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <Button
                                  onClick={() => handleOpenPickModal(leg)}
                                  variant={isMissing ? 'primary' : 'outline'}
                                  className={`text-[11px] font-mono font-bold py-1 px-3 rounded-lg flex items-center gap-1.5 ml-auto cursor-pointer ${
                                    isMissing 
                                      ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                                      : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>{isMissing ? 'Enter Pick' : 'Edit Pick'}</span>
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Used Teams Badge List */}
                <div className="pt-2">
                  <div className="text-xs font-mono font-bold text-slate-700 mb-2">Locked Out Season Teams ({usedTeams.length}):</div>
                  {usedTeams.length === 0 ? (
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-500 font-mono text-center">
                      No teams locked out yet.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {usedTeams.map((t: any, idx: number) => {
                        const teamName = typeof t === 'string' ? t : (t.team_name || t.team_code || t.name || `Team #${t.team_id || idx}`);
                        return (
                          <div
                            key={idx}
                            className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-bold font-mono rounded-lg flex items-center gap-1.5"
                          >
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>{teamName}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* SECTION 3: FORCED SELECTION & PROGRESSION CONTROL BAR */}
          <Card className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-md space-y-4" id="card_active_pick_submission">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-extrabold text-emerald-400 bg-emerald-950 border border-emerald-800 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                    STEP 3 PICK SUBMISSION GATE
                  </span>

                  {isPickLocked ? (
                    <span className="text-[10px] font-mono font-extrabold text-emerald-300 bg-emerald-950/90 border border-emerald-700 px-2.5 py-0.5 rounded-md uppercase flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-400" /> OFFICIAL PICK RECORDED FOR WEEK {currentWeek}
                    </span>
                  ) : activeSelection?.is_strategy_recommendation ? (
                    <span className="text-[10px] font-mono font-bold text-indigo-300 bg-indigo-950 border border-indigo-800 px-2.5 py-0.5 rounded-md uppercase">
                      ✓ STEP 1 STRATEGY RECOMMENDATION
                    </span>
                  ) : activeSelection ? (
                    <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950 border border-amber-800 px-2.5 py-0.5 rounded-md uppercase">
                      ✎ ALTERNATE UNUSED TEAM
                    </span>
                  ) : null}
                </div>

                <h3 className="text-base font-extrabold font-mono text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-400" />
                  <span>Selected Choice: {activeSelection ? activeSelection.team_name : 'No Selection Active'}</span>
                </h3>

                <p className="text-xs text-slate-300 font-normal leading-relaxed">
                  {isPickLocked
                    ? `Official pick recorded for NFL Week ${currentWeek}: ${activeSelection?.team_name}. You can change your selection or proceed directly to Final Confirmation.`
                    : activeSelection
                      ? `Lock in ${activeSelection.team_name} for NFL Week ${currentWeek} (Entry #${entryId}) and proceed to Final Confirmation.`
                      : 'Please select either the strategy recommendation or an alternate unused team above.'
                  }
                </p>
              </div>

              {/* Action Buttons: Reset / Change Pick and Lock In & Proceed */}
              <div className="shrink-0 flex items-center gap-3 self-end md:self-auto flex-wrap">
                {isPickLocked && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResetOrChangePick}
                    className="font-mono text-xs font-bold py-3 px-4 rounded-xl flex items-center gap-2 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer"
                    id="btn_reset_pick_selection"
                  >
                    <RotateCcw className="w-4 h-4 text-amber-400" />
                    <span>Change Pick</span>
                  </Button>
                )}

                <Button
                  onClick={handleLockInPickAndProceed}
                  disabled={!activeSelection || submittingPick}
                  className={`font-mono text-xs font-extrabold py-3 px-6 rounded-xl flex items-center gap-2 shadow-sm cursor-pointer ${
                    activeSelection
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                  }`}
                  id="btn_lock_in_weekly_pick"
                >
                  {submittingPick ? (
                    <LoadingSpinner size="sm" message="Posting Pick..." />
                  ) : (
                    <>
                      <span>Lock In & Proceed to Step 4: Final Confirmation</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>

            </div>

            {/* Error / Success Feedback */}
            {submitError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-200 font-mono flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {submitSuccess && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-xs text-emerald-200 font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{submitSuccess}</span>
              </div>
            )}
          </Card>
        </>
      )}

      {/* MODAL: ENTER / EDIT HISTORICAL PICK */}
      {pickModalOpen && activeLeg && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="modal_enter_pick_overlay">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-xl text-left" id="modal_enter_pick">
            
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md uppercase">
                  HISTORICAL PICK ENTRY
                </span>
                <h3 className="text-base font-extrabold text-slate-900 font-mono mt-1">
                  {activeLeg.leg_name || `Contest Leg #${activeLeg.contest_leg_id}`}
                </h3>
              </div>
              <Button
                onClick={() => setPickModalOpen(false)}
                variant="outline"
                className="text-xs font-mono font-bold border-slate-200 text-slate-600 hover:bg-slate-100 py-1 px-3"
              >
                ✕
              </Button>
            </div>

            {loadingModalValidPicks ? (
              <div className="py-8 text-center">
                <LoadingSpinner size="sm" message="Loading valid teams for this leg..." />
              </div>
            ) : (
              <form onSubmit={handleSaveModalPick} className="space-y-4 font-mono text-xs">
                
                {/* Select Team Dropdown */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">
                    Select Team:
                  </label>
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Choose Valid Team --</option>
                    {modalValidPicks.map((opt: any) => {
                      const tId = opt.team_id || opt.id || opt.team_code;
                      const tName = opt.team_name || opt.team_code || opt.name || `Team #${tId}`;
                      const opp = opt.opponent || opt.opponent_code ? ` (vs ${opt.opponent || opt.opponent_code})` : '';
                      return (
                        <option key={tId} value={tId}>
                          {tName}{opp}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Change Reason / Source Note */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">
                    Reason / Source Note:
                  </label>
                  <input
                    type="text"
                    value={changeReason}
                    onChange={(e) => setChangeReason(e.target.value)}
                    placeholder="E.g. Initial pick entry or correction"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {pickError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                    ⚠ {pickError}
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    onClick={() => setPickModalOpen(false)}
                    variant="outline"
                    className="text-xs font-mono font-bold border-slate-200 text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={savingPick || !selectedTeamId}
                    className="text-xs font-mono font-bold bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-xl cursor-pointer"
                  >
                    {savingPick ? <LoadingSpinner size="sm" message="Saving..." /> : 'Save Historical Pick'}
                  </Button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
