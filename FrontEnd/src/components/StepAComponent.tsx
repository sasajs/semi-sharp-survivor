/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, LoadingSpinner, Alert } from './ui';
import { SemiSharpApi, ApiError } from '../api';
import { SemiSharpContext } from '../types';
import { StepABCDNav } from './StepABCDNav';
import {
  History,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Compass,
  Lock,
  Unlock,
  Layers,
  Calendar,
  Check,
  ChevronRight
} from 'lucide-react';

interface StepAComponentProps {
  context: SemiSharpContext | null;
  onNavigate: (tab: string) => void;
}

export const StepAComponent: React.FC<StepAComponentProps> = ({
  context,
  onNavigate
}) => {
  const { selectedEntry } = useAuth();

  // Data state
  const [reviewData, setReviewData] = useState<any>(null);
  const [picksData, setPicksData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Historical leg editing state
  const [editingLegId, setEditingLegId] = useState<number | null>(null);
  const [validTeamsForLeg, setValidTeamsForLeg] = useState<any[]>([]);
  const [loadingValidTeams, setLoadingValidTeams] = useState<boolean>(false);
  const [selectedTeamForLeg, setSelectedTeamForLeg] = useState<number | null>(null);
  const [savingLegPick, setSavingLegPick] = useState<boolean>(false);
  const [legActionSuccess, setLegActionSuccess] = useState<string | null>(null);
  const [legActionError, setLegActionError] = useState<string | null>(null);

  const entryId = selectedEntry?.entry_id || null;
  const currentWeek = reviewData?.application_context?.current_week || context?.current_week || context?.week || 1;
  const season = reviewData?.application_context?.season || context?.season || 2026;

  // Helper to format clean team names without duplication
  const cleanTeamName = (team: any): string => {
    if (!team) return 'Team';
    let name = team.team_name || team.name || team.team_code || '';
    if (!name && team.team_id) name = `Team #${team.team_id}`;
    name = String(name).trim();

    const words = name.split(/\s+/);
    if (words.length >= 2 && words[0].toLowerCase() === words[1].toLowerCase()) {
      name = words.slice(1).join(' ');
    }

    return name || 'Team';
  };

  const formatErrorMessage = (err: any, fallback: string): string => {
    if (!err) return fallback;
    if (typeof err === 'string') return err;
    if (err instanceof ApiError) return err.message;
    if (err.message) return err.message;
    return fallback;
  };

  // Fetch Review & Picks Data directly from live backend
  const fetchData = async () => {
    if (!entryId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [revResp, picksResp] = await Promise.all([
        SemiSharpApi.getEntryReview(entryId),
        SemiSharpApi.getEntryPicks(entryId).catch(() => ({ picks: [] }))
      ]);

      setReviewData(revResp);
      const rawPicks = Array.isArray(picksResp?.picks) ? picksResp.picks : (Array.isArray(picksResp) ? picksResp : []);
      setPicksData(rawPicks);
    } catch (err: any) {
      console.error("Error loading historical review data for Step 1:", err);
      setError(formatErrorMessage(err, "Failed to load entry historical review data."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [entryId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  // Derive prior pick history
  const priorPickHistory = useMemo(() => {
    if (Array.isArray(reviewData?.prior_pick_history) && reviewData.prior_pick_history.length > 0) {
      return reviewData.prior_pick_history;
    }
    return picksData;
  }, [reviewData, picksData]);

  // Derive required historical legs (Weeks 1 through currentWeek - 1)
  const auditLegs = useMemo(() => {
    const legs: any[] = [];
    if (currentWeek <= 1) return [];

    for (let w = 1; w < currentWeek; w++) {
      // Find matching pick in priorPickHistory or picksData
      const existingPick = priorPickHistory.find((p: any) => {
        const pWeek = Number(p.week || p.nfl_week || p.contest_leg_id || p.contest_leg || 0);
        return pWeek === w;
      });

      legs.push({
        week: w,
        contest_leg_id: existingPick?.contest_leg_id || existingPick?.leg_id || w,
        pick: existingPick || null,
        isResolved: !!(existingPick && (existingPick.team_id || existingPick.team_code || existingPick.team_name)),
      });
    }

    return legs;
  }, [currentWeek, priorPickHistory]);

  // Check progression gate status
  const missingLegsCount = useMemo(() => {
    if (currentWeek <= 1) return 0;
    return auditLegs.filter((l) => !l.isResolved).length;
  }, [currentWeek, auditLegs]);

  const isGateUnlocked = missingLegsCount === 0;

  // Open edit modal / selector for a historical leg
  const handleStartEditLeg = async (leg: any) => {
    const parsedEntryId = Number(entryId);
    const parsedLegId = Number(leg.contest_leg_id || leg.week);

    if (!parsedEntryId || !parsedLegId || isNaN(parsedLegId)) {
      setLegActionError("Invalid entry ID or contest leg ID.");
      return;
    }

    setEditingLegId(parsedLegId);
    setSelectedTeamForLeg(leg.pick?.team_id ? Number(leg.pick.team_id) : null);
    setLegActionError(null);
    setLegActionSuccess(null);

    try {
      setLoadingValidTeams(true);
      const res = await SemiSharpApi.getValidPicks(parsedEntryId, parsedLegId);

      let teams: any[] = [];
      if (Array.isArray(res)) {
        teams = res;
      } else if (res && typeof res === 'object') {
        if (Array.isArray(res.options)) teams = res.options;
        else if (Array.isArray(res.valid_teams)) teams = res.valid_teams;
        else if (Array.isArray(res.valid_picks)) teams = res.valid_picks;
        else if (Array.isArray(res.teams)) teams = res.teams;
        else if (Array.isArray(res.data)) teams = res.data;
        else if (Array.isArray(res.available_teams)) teams = res.available_teams;
        else if (Array.isArray(res.eligible_teams)) teams = res.eligible_teams;
        else if (Array.isArray(res.valid_options)) teams = res.valid_options;
        else if (Array.isArray(res.items)) teams = res.items;
        else if (res.result && Array.isArray(res.result)) teams = res.result;
      }

      setValidTeamsForLeg(teams);
    } catch (err: any) {
      console.error("Error fetching valid teams for historical leg:", err);
      setValidTeamsForLeg([]);
      setLegActionError(formatErrorMessage(err, "Could not fetch eligible teams for this past leg."));
    } finally {
      setLoadingValidTeams(false);
    }
  };

  // Save updated or new historical pick
  const handleSaveLegPick = async (leg: any, teamIdToSave?: number) => {
    const targetTeamId = teamIdToSave || selectedTeamForLeg;
    const parsedEntryId = Number(entryId);
    const parsedLegId = Number(editingLegId);

    if (!parsedEntryId || !targetTeamId || !parsedLegId) {
      setLegActionError("Please select a valid team before saving.");
      return;
    }

    setSavingLegPick(true);
    setLegActionError(null);
    setLegActionSuccess(null);

    const existingPick = leg.pick;
    let existingPickId = existingPick?.entry_pick_id || existingPick?.pick_id || existingPick?.id;
    if (!existingPickId && Array.isArray(picksData)) {
      const match = picksData.find((p: any) => 
        Number(p.contest_leg_id || p.leg_id || p.week) === parsedLegId
      );
      if (match) {
        existingPickId = match.entry_pick_id || match.pick_id || match.id;
      }
    }

    const reasonText = "Historical pick verified/reconciled in Step 1 Gatekeeper";

    try {
      if (existingPickId) {
        await SemiSharpApi.updatePick(parsedEntryId, existingPickId, {
          team_id: targetTeamId,
          pick_source: 'ADMIN_CORRECTION',
          pick_status: 'CONFIRMED',
          change_reason: reasonText,
          contest_leg_id: parsedLegId
        });
      } else {
        await SemiSharpApi.createPick(parsedEntryId, {
          contest_leg_id: parsedLegId,
          team_id: targetTeamId,
          pick_source: 'USER_ENTRY',
          pick_status: 'CONFIRMED',
          change_reason: reasonText
        });
      }

      setLegActionSuccess(`✓ Historical pick successfully recorded in database for Week ${parsedLegId}.`);
      setEditingLegId(null);
      setSelectedTeamForLeg(null);
      await fetchData();
    } catch (err: any) {
      console.error("Error saving historical pick:", err);
      setLegActionError(formatErrorMessage(err, "Failed to update historical pick on server."));
    } finally {
      setSavingLegPick(false);
    }
  };

  if (!selectedEntry) {
    return (
      <div className="space-y-6 animate-fade-in text-left font-sans text-slate-900">
        <Card className="p-12 text-center border border-dashed border-slate-200 bg-slate-50/50 space-y-4 rounded-xl font-sans">
          <History className="w-10 h-10 text-slate-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900 tracking-tight">Select a Survivor Entry</h3>
            <p className="text-xs font-semibold text-slate-500 max-w-md mx-auto">
              Please choose an active survivor entry to perform historical pick auditing and unlock progression.
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
    <div className="space-y-4 animate-fade-in text-left font-sans text-slate-900">
      
      {/* 1. COMPACT ENTRY & SYSTEM WEEK INSPECTION HEADER */}
      <div className="bg-slate-950 text-white rounded-2xl p-4 shadow-xl border border-slate-800 space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>{selectedEntry.entry_label}</span>
                <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-md font-extrabold border uppercase tracking-wider ${
                  selectedEntry.is_active 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                }`}>
                  {selectedEntry.is_active ? 'ACTIVE' : 'ELIMINATED'}
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {selectedEntry.contest_name || (selectedEntry as any).contest_format || 'Survivor Contest'} • Season {season} • Active Week {currentWeek}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              variant="outline"
              size="sm"
              className="bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 text-xs font-mono font-bold shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
              Verify Previous Picks
            </Button>

            {isGateUnlocked ? (
              <div className="px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-mono font-extrabold flex items-center gap-1.5 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Ready to Continue</span>
              </div>
            ) : (
              <div className="px-3 py-1.5 bg-rose-500/15 border border-rose-500/30 text-rose-200 rounded-xl text-xs font-mono font-extrabold flex items-center gap-1.5 shadow-2xs">
                <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Verification Pending</span>
              </div>
            )}
          </div>
        </div>

        {/* System Inspection Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          
          {/* Card 1: Current NFL Week */}
          <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              <span>Current NFL Week</span>
              <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            </div>
            <div className="text-base font-black text-amber-400">
              Week {currentWeek}
            </div>
          </div>

          {/* Card 2: Past Legs Requiring Audit */}
          <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              <span>Past Weeks to Verify</span>
              <History className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </div>
            <div className="text-base font-black text-white">
              {currentWeek <= 1 ? (
                <span className="text-slate-300 font-bold">0 <span className="text-xs text-slate-400 font-normal">(Week 1 Active)</span></span>
              ) : (
                <span>{currentWeek - 1} <span className="text-xs text-slate-400 font-normal">Weeks</span></span>
              )}
            </div>
          </div>

          {/* Card 3: Resolved Historical Picks */}
          <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              <span>Verified Previous Picks</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            </div>
            <div className="text-base font-black text-emerald-400">
              {currentWeek <= 1 ? '100% Synced' : `${auditLegs.filter(l => l.isResolved).length} / ${auditLegs.length} Verified`}
            </div>
          </div>

          {/* Card 4: Progression Status (Strong Emphasis) */}
          <div className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-1.5 shadow-sm transition-all ${
            isGateUnlocked
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
          }`}>
            <div className="flex items-center justify-between text-[10px] uppercase font-extrabold tracking-wider">
              <span className={isGateUnlocked ? 'text-emerald-400' : 'text-rose-400'}>Ready to Continue</span>
              {isGateUnlocked ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {isGateUnlocked ? (
                <div className="flex items-center gap-1.5 font-black text-sm text-emerald-300 tracking-tight">
                  <Unlock className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>READY</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 font-black text-sm text-rose-300 tracking-tight">
                  <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{missingLegsCount} ACTION NEEDED</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* 2. PROGRESSION GATE STATUS ALERT */}
      {currentWeek === 1 ? (
        <Alert
          type="success"
          title="Week 1 Active – Ready to Generate Roadmap"
          message="Since this entry is currently in Week 1, there are no prior weeks to verify. You are ready to generate your strategy roadmap in Step 2."
        />
      ) : !isGateUnlocked ? (
        <Alert
          type="warning"
          title={`Action Needed – Verify ${missingLegsCount} Previous Pick(s)`}
          message={`Please select and save historical picks for all unverified past weeks (Weeks 1 through ${currentWeek - 1}) below to update your records and proceed to Step 2.`}
        />
      ) : (
        <Alert
          type="success"
          title="✓ Previous Picks Verified – Ready to Continue"
          message={`All ${auditLegs.length} prior week(s) are verified and recorded. Click below to generate your strategy roadmap in Step 2.`}
        />
      )}

      {/* ACTION ALERTS */}
      {legActionError && (
        <Alert
          type="error"
          title="Action Failed"
          message={legActionError}
        />
      )}
      {legActionSuccess && (
        <Alert
          type="success"
          title="Success"
          message={legActionSuccess}
        />
      )}

      {/* 3. HISTORICAL PICK AUDIT TABLE & RECONCILIATION CARDS */}
      <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              <span>Verify Previous Picks (Weeks 1 to {currentWeek - 1})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review team records for past weeks. Select "Verify Pick" or "Update Pick" to ensure accurate entry history.
            </p>
          </div>
          {loading && <LoadingSpinner size="sm" message="Loading review data..." />}
        </div>

        {currentWeek <= 1 ? (
          <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <div className="text-sm font-bold text-slate-800">No Past Weeks to Audit</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your contest entry is currently starting in Week 1. Review the gatekeeper authorization status below to proceed.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {auditLegs.map((legItem) => {
              const legWeek = legItem.week;
              const pick = legItem.pick;
              const isResolved = legItem.isResolved;
              const isEditing = editingLegId === Number(legItem.contest_leg_id || legWeek);

              const teamName = pick ? cleanTeamName(pick) : null;
              const teamCode = pick?.team_code || pick?.team || pick?.team_abbr || null;

              return (
                <div
                  key={legWeek}
                  className={`p-4 sm:p-4.5 rounded-xl border transition-all shadow-2xs ${
                    !isResolved
                      ? 'bg-rose-50/70 border-rose-200 hover:border-rose-300 border-l-4 border-l-rose-500'
                      : 'bg-white border-slate-200/90 hover:border-slate-300 border-l-4 border-l-emerald-500'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono font-black text-sm shrink-0 shadow-2xs ${
                        isResolved
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800 animate-pulse'
                      }`}>
                        W{legWeek}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-slate-900 text-sm tracking-tight">
                            Week {legWeek} Historical Pick
                          </span>
                          <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-md font-extrabold tracking-wider border uppercase flex items-center gap-1 ${
                            isResolved
                              ? 'bg-emerald-100/90 text-emerald-900 border-emerald-300'
                              : 'bg-rose-100 text-rose-900 border-rose-300'
                          }`}>
                            {isResolved ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                <span>RESOLVED</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-3 h-3 text-rose-700" />
                                <span>MISSING PICK</span>
                              </>
                            )}
                          </span>
                        </div>

                        <div>
                          {isResolved ? (
                            <div className="flex items-center gap-2 flex-wrap mt-0.5">
                              <span className="text-xs text-slate-500 font-medium">Recorded:</span>
                              <div className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-2.5 py-1 rounded-md font-mono text-xs font-black shadow-2xs">
                                <span className="text-amber-300 font-bold">{teamName}</span>
                                {teamCode && (
                                  <span className="text-[10px] font-mono font-extrabold bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded uppercase">
                                    {teamCode}
                                  </span>
                                )}
                              </div>
                              {pick?.pick_source && (
                                <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  [{pick.pick_source}]
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-rose-700 font-bold flex items-center gap-1.5 mt-0.5">
                              <span>No historical pick recorded for Week {legWeek}. Action required.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 self-end sm:self-center">
                      <Button
                        size="sm"
                        variant={isResolved ? "outline" : "primary"}
                        onClick={() => handleStartEditLeg(legItem)}
                        className={
                          isResolved
                            ? "border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 text-xs font-mono font-bold shadow-2xs"
                            : "bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono font-black shadow-md"
                        }
                      >
                        {isResolved ? "Update Pick" : "Resolve Pick"}
                      </Button>
                    </div>
                  </div>

                  {/* EDIT / RESOLVE INTERACTIVE TEAM GRID PANEL */}
                  {isEditing && (
                    <div className="mt-4 p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-3 font-mono text-xs shadow-inner">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-amber-400 flex items-center gap-1.5">
                          <span>Select Historical Team for Week {legWeek}:</span>
                        </span>
                        {loadingValidTeams && <LoadingSpinner size="sm" message="Fetching eligible teams..." />}
                      </div>

                      {validTeamsForLeg.length > 0 ? (
                        <div className="space-y-3">
                          {/* Team Tiles Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-56 overflow-y-auto p-1.5 bg-slate-950/60 rounded-lg border border-slate-800">
                            {validTeamsForLeg.map((vt: any) => {
                              const vtName = cleanTeamName(vt);
                              const vtId = vt.team_id ?? vt.id ?? vt.teamId ?? vt.team_code;
                              const vtCode = vt.team_code || vt.team_abbr || vt.code || vt.name || vtId;
                              const isSelected = Number(selectedTeamForLeg) === Number(vtId);

                              return (
                                <button
                                  key={vtId}
                                  type="button"
                                  onClick={() => setSelectedTeamForLeg(Number(vtId))}
                                  className={`p-2.5 rounded-lg border text-left font-mono transition-all cursor-pointer flex flex-col justify-between ${
                                    isSelected
                                      ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-2 ring-amber-400'
                                      : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750 hover:border-slate-600'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-1 font-bold text-xs">
                                    <span className="truncate">{vtName}</span>
                                    <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded uppercase font-mono">
                                      {vtCode}
                                    </span>
                                  </div>
                                  {vt.opponent && (
                                    <div className="text-[10px] text-slate-400 mt-1">
                                      vs {vt.opponent} {vt.spread !== undefined ? `(${vt.spread > 0 ? `+${vt.spread}` : vt.spread})` : ''}
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                            <select
                              value={selectedTeamForLeg || ''}
                              onChange={(e) => setSelectedTeamForLeg(Number(e.target.value))}
                              className="w-full sm:w-auto flex-1 bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                            >
                              <option value="">-- Choose Historical Team --</option>
                              {validTeamsForLeg.map((vt: any) => {
                                const vtName = cleanTeamName(vt);
                                const vtId = vt.team_id ?? vt.id ?? vt.teamId ?? vt.team_code;
                                const vtCode = vt.team_code || vt.team_abbr || vt.code || vt.name || vtId;
                                return (
                                  <option key={vtId} value={vtId}>
                                    {vtName} ({vtCode})
                                  </option>
                                );
                              })}
                            </select>

                            <Button
                              onClick={() => handleSaveLegPick(legItem)}
                              disabled={!selectedTeamForLeg || savingLegPick}
                              className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 font-black font-mono text-xs py-2.5 px-5 rounded-lg cursor-pointer shrink-0"
                            >
                              {savingLegPick ? <LoadingSpinner size="sm" message="Saving..." /> : 'Save Historical Pick'}
                            </Button>
                          </div>
                        </div>
                      ) : !loadingValidTeams ? (
                        <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700 space-y-2">
                          <p className="text-slate-300 text-xs font-sans">
                            No eligible teams returned from valid-picks endpoint for Week {legWeek}.
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStartEditLeg(legItem)}
                            className="text-[11px] font-mono border-slate-600 text-slate-300 hover:bg-slate-700"
                          >
                            Retry Fetching Valid Teams
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* 4. PROGRESSION GATEFOOTER CARD */}
      <Card className="p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-extrabold uppercase text-amber-400">Step 1 Verification</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${isGateUnlocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {isGateUnlocked ? 'READY TO CONTINUE' : 'ACTION NEEDED'}
            </span>
          </div>
          <p className="text-xs text-slate-300 font-sans">
            {isGateUnlocked
              ? "All previous picks are verified. Continue to Step 2 to generate your strategy roadmap."
              : `Verify all ${missingLegsCount} missing previous pick(s) above to continue to Step 2.`}
          </p>
        </div>

        <Button
          onClick={() => isGateUnlocked && onNavigate('step_2')}
          disabled={!isGateUnlocked}
          className={`shrink-0 font-mono text-xs font-black py-3 px-6 rounded-xl transition-all ${
            isGateUnlocked
              ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 cursor-pointer shadow-lg shadow-amber-950/50'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
          }`}
        >
          {isGateUnlocked ? (
            <span className="flex items-center gap-2">
              <span>Generate Strategy Roadmap</span>
              <ChevronRight className="w-4 h-4" />
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span>Complete Verification to Continue</span>
            </span>
          )}
        </Button>
      </Card>
    </div>
  );
};
