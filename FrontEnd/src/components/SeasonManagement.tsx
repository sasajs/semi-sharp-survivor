/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { SemiSharpApi, ApiError } from '../api';
import { Card, Button, Alert, LoadingSpinner } from './ui';
import { SurvivorEntry, Team } from '../types';
import {
  Calendar,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Lock,
  Edit3,
  Plus,
  Trash2,
  Info,
  RefreshCw,
  UserCheck,
  Award,
  X,
  Sliders,
  Check,
  ChevronRight,
  FileText
} from 'lucide-react';

export const SeasonManagement: React.FC = () => {
  const { user, selectedEntry, selectEntry } = useAuth();

  // State for entries and operational context
  const [managedEntry, setManagedEntry] = useState<SurvivorEntry | null>(
    selectedEntry || (user?.entries && user.entries.length > 0 ? user.entries[0] : null)
  );
  const [context, setContext] = useState<any>(null);
  
  // Picks mapping per entryId: { [entryId]: { picks: any[], loading: boolean, error: string | null } }
  const [picksMap, setPicksMap] = useState<Record<string, { picks: any[]; loading: boolean; error: string | null }>>({});
  
  // Strategy context map per entryId
  const [stratContextMap, setStratContextMap] = useState<Record<string, any>>({});
  
  // Teams master list
  const [teams, setTeams] = useState<Team[]>([]);

  // Main page loading & refresh
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Edit Used Teams modal state
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [selectedTeamForEdit, setSelectedTeamForEdit] = useState<Team | null>(null);
  const [targetLegId, setTargetLegId] = useState<number>(1);
  const [editSubmitting, setEditSubmitting] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  // Keep managedEntry in sync with selectedEntry if user changes top header selection
  useEffect(() => {
    if (selectedEntry) {
      setManagedEntry(selectedEntry);
    } else if (user?.entries && user.entries.length > 0 && !managedEntry) {
      setManagedEntry(user.entries[0]);
    }
  }, [selectedEntry, user]);

  // Load all entries data in parallel
  const loadAllEntriesData = async () => {
    setLoading(true);
    setGlobalError(null);

    try {
      // 1. Fetch current context
      const ctx = await SemiSharpApi.getContext().catch(() => null);
      setContext(ctx);

      // 2. Fetch master teams list
      const teamsRes = await SemiSharpApi.getTeams().catch(() => ({ teams: [] }));
      if (teamsRes?.teams) {
        setTeams(teamsRes.teams);
      }

      // 3. Fetch picks and strategy context for each entry
      if (user?.entries && user.entries.length > 0) {
        const newPicksMap: Record<string, { picks: any[]; loading: boolean; error: string | null }> = {};
        const newStratMap: Record<string, any> = {};

        await Promise.all(
          user.entries.map(async (entry) => {
            const entryKey = String(entry.entry_id);
            try {
              const picksRes = await SemiSharpApi.getEntryPicks(entry.entry_id).catch(() => null);
              newPicksMap[entryKey] = {
                picks: picksRes?.picks || [],
                loading: false,
                error: null
              };

              const stratRes = await SemiSharpApi.getStrategyContext(
                entry.entry_id,
                entry.format_code || 'STANDARD'
              ).catch(() => null);
              if (stratRes) {
                newStratMap[entryKey] = stratRes;
              }
            } catch (err: any) {
              newPicksMap[entryKey] = {
                picks: [],
                loading: false,
                error: err.message || 'Failed to fetch entry details'
              };
            }
          })
        );

        setPicksMap(newPicksMap);
        setStratContextMap(newStratMap);
      }
    } catch (err: any) {
      console.error("Error loading entries data:", err);
      setGlobalError("Failed to initialize entry management telemetry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllEntriesData();
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllEntriesData();
    setRefreshing(false);
  };

  // Helper to resolve picks for an entry
  const getEntryPicksList = (entryId: string | number) => {
    return picksMap[String(entryId)]?.picks || [];
  };

  // Helper to resolve current leg for an entry
  const getEntryCurrentLeg = (entry: SurvivorEntry) => {
    const strat = stratContextMap[String(entry.entry_id)];
    if (strat?.current_contest_leg_id) {
      return `Leg ${strat.current_contest_leg_id}`;
    }
    return `Leg ${context?.current_week || context?.week || 1}`;
  };

  // Helper to resolve current recorded pick for an entry
  const getEntryCurrentPick = (entry: SurvivorEntry) => {
    const picks = getEntryPicksList(entry.entry_id);
    if (!picks || picks.length === 0) return null;
    
    const strat = stratContextMap[String(entry.entry_id)];
    const legId = strat?.current_contest_leg_id;
    if (legId) {
      const matched = picks.find((p: any) => {
        const pLegId = p.contest_leg?.contest_leg_id || p.contest_leg_id;
        return String(pLegId) === String(legId);
      });
      if (matched) return matched;
    }
    return picks[picks.length - 1];
  };

  // Handle Add/Edit Pick Submission in Modal
  const handleRecordPickSubmit = async () => {
    if (!managedEntry || !selectedTeamForEdit) return;

    setEditSubmitting(true);
    setEditError(null);
    setEditSuccess(null);

    try {
      const teamIdToUse = selectedTeamForEdit.team_id || 1;
      const payload = {
        contest_leg_id: Number(targetLegId),
        team_id: teamIdToUse
      };

      const res = await SemiSharpApi.createPick(managedEntry.entry_id, payload);
      const teamLabel = res?.team_name || selectedTeamForEdit.name;

      setEditSuccess(`Recorded ${teamLabel} for Leg ${targetLegId}.`);
      
      // Reload picks for this entry
      const updatedPicks = await SemiSharpApi.getEntryPicks(managedEntry.entry_id);
      setPicksMap(prev => ({
        ...prev,
        [String(managedEntry.entry_id)]: {
          picks: updatedPicks?.picks || [],
          loading: false,
          error: null
        }
      }));

      setTimeout(() => {
        setEditModalOpen(false);
        setSelectedTeamForEdit(null);
        setEditSuccess(null);
      }, 1200);

    } catch (err: any) {
      console.error("Error editing used teams:", err);
      const msg = err instanceof ApiError ? err.message : err.message || "Failed to record pick.";
      setEditError(msg);
    } finally {
      setEditSubmitting(false);
    }
  };

  // Format Code Label Helper
  const getFormatLabel = (code: string) => {
    if (!code) return 'STANDARD';
    const uc = code.toUpperCase();
    if (uc.includes('CIRCA')) return 'CIRCA SURVIVOR';
    if (uc.includes('HOLIDAY')) return 'CIRCA HOLIDAY';
    return uc;
  };

  // Format Notes Helper
  const getFormatNotes = (code: string) => {
    const uc = (code || '').toUpperCase();
    if (uc.includes('CIRCA')) {
      return 'Circa Survivor rules: 20 total picks required including Thanksgiving/Christmas holiday legs. No repeat team selections.';
    }
    return 'Standard Survivor rules: 18 NFL regular season weeks. Single pick per week. No repeat team selections permitted.';
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in text-left">
        <Card className="p-12 text-center">
          <LoadingSpinner size="md" message="Loading survivor contest entries..." />
        </Card>
      </div>
    );
  }

  const entriesList = user?.entries || [];
  const currentManagedPicks = managedEntry ? getEntryPicksList(managedEntry.entry_id) : [];
  const managedCurrentPick = managedEntry ? getEntryCurrentPick(managedEntry) : null;
  const currentStrat = managedEntry ? stratContextMap[managedEntry.entry_id] : null;

  return (
    <div className="space-y-6 animate-fade-in text-left font-sans text-slate-900">
      
      {/* HEADER STRIP */}
      <div className="bg-slate-950 text-white rounded-xl p-5 shadow-sm border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black uppercase font-mono tracking-tight text-white flex items-center gap-2">
                My Entries
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Central account management hub for all active survivor contest entries
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white text-xs font-mono py-1 px-3"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Entries
          </Button>
        </div>

        {globalError && (
          <Alert type="error" title="Telemetry Alert" message={globalError} />
        )}
      </div>

      {/* 1. ENTRY LIST SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <h2 className="text-xs font-black uppercase font-mono tracking-wider text-slate-800 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-indigo-600" />
            Contest Entries ({entriesList.length})
          </h2>
          <span className="text-[10px] font-mono text-slate-500">
            Select entry to set active session context
          </span>
        </div>

        {entriesList.length === 0 ? (
          <Card className="p-8 text-center bg-slate-50 border-dashed border-slate-200">
            <Info className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">No survivor entries found</h4>
            <p className="text-xs text-slate-500 mt-1">Log in with an account associated with active survivor entries.</p>
          </Card>
        ) : (
          <Card className="overflow-hidden border border-slate-200 shadow-xs bg-white rounded-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-slate-300 font-mono text-[10px] uppercase tracking-wider border-b border-slate-800">
                    <th className="py-3 px-4 font-bold">Entry Name</th>
                    <th className="py-3 px-4 font-bold">Contest</th>
                    <th className="py-3 px-4 font-bold">Format</th>
                    <th className="py-3 px-4 font-bold">Current Leg</th>
                    <th className="py-3 px-4 font-bold">Current Pick</th>
                    <th className="py-3 px-4 font-bold text-center">Status</th>
                    <th className="py-3 px-4 font-bold text-right">Used / Rem.</th>
                    <th className="py-3 px-4 font-bold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {entriesList.map((entry) => {
                    const isSelectedSession = selectedEntry?.entry_id === entry.entry_id;
                    const isManaged = managedEntry?.entry_id === entry.entry_id;
                    const picks = getEntryPicksList(entry.entry_id);
                    const currentLegLabel = getEntryCurrentLeg(entry);
                    const currentPick = getEntryCurrentPick(entry);
                    const usedCount = picks.length;
                    const remCount = Math.max(0, 32 - usedCount);

                    return (
                      <tr
                        key={entry.entry_id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isManaged ? 'bg-indigo-50/20' : ''
                        }`}
                      >
                        {/* Entry Name */}
                        <td className="py-3.5 px-4 font-bold text-slate-950 font-sans">
                          <div className="flex items-center gap-2">
                            <span>{entry.entry_label}</span>
                            {isSelectedSession && (
                              <span className="text-[9px] font-mono font-black uppercase bg-indigo-600 text-white px-1.5 py-0.2 rounded">
                                ACTIVE SESSION
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Contest */}
                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          {entry.contest_name || 'NFL Survivor'}
                        </td>

                        {/* Format */}
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                          {getFormatLabel(entry.format_code)}
                        </td>

                        {/* Current Leg */}
                        <td className="py-3.5 px-4 font-mono text-slate-800 font-medium">
                          {currentLegLabel}
                        </td>

                        {/* Current Pick */}
                        <td className="py-3.5 px-4 font-mono">
                          {currentPick ? (
                            <span className="font-black text-emerald-600 flex items-center gap-1">
                              ✓ {currentPick.team?.abbr || currentPick.team_abbr || currentPick.team || 'RECORDED'}
                            </span>
                          ) : (
                            <span className="font-bold text-amber-500 text-[11px]">
                              ⚠ No Pick
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded uppercase tracking-wider border ${
                            entry.is_active
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : 'bg-rose-50 border-rose-200 text-rose-800'
                          }`}>
                            {entry.is_active ? 'ACTIVE' : 'ELIMINATED'}
                          </span>
                        </td>

                        {/* Used / Rem */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800">
                          <span className="text-slate-900">{usedCount}</span>
                          <span className="text-slate-400 mx-1">/</span>
                          <span className="text-emerald-600">{remCount}</span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {!isSelectedSession && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  selectEntry(entry);
                                  setManagedEntry(entry);
                                }}
                                className="text-[10px] font-mono font-bold uppercase py-1 px-2.5 bg-white hover:bg-slate-50"
                              >
                                Select
                              </Button>
                            )}

                            <Button
                              size="sm"
                              onClick={() => setManagedEntry(entry)}
                              className={`text-[10px] font-mono font-bold uppercase py-1 px-2.5 ${
                                isManaged
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-900 text-white hover:bg-slate-800'
                              }`}
                            >
                              Manage
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* MANAGED ENTRY DETAILS & PICK MANAGEMENT SECTION */}
      {managedEntry && (
        <div className="space-y-5 pt-2">
          
          {/* SECTION HEADER */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="space-y-0.5">
              <h2 className="text-xs font-black uppercase font-mono tracking-wider text-slate-800 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                Entry Details: {managedEntry.entry_label}
              </h2>
              <p className="text-xs text-slate-500 font-semibold">
                Inspecting pick history and unavailable teams for selected entry
              </p>
            </div>

            {selectedEntry?.entry_id !== managedEntry.entry_id && (
              <Button
                size="sm"
                onClick={() => selectEntry(managedEntry)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-mono uppercase font-bold"
              >
                Set as Active Session Entry
              </Button>
            )}
          </div>

          {/* 2. ENTRY DETAILS COMPACT CARD */}
          <Card className="p-5 border border-slate-200 shadow-xs bg-white rounded-xl space-y-4">
            
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 font-mono text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Entry Name</span>
                <span className="font-extrabold text-slate-950 block truncate">{managedEntry.entry_label}</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contest</span>
                <span className="font-extrabold text-slate-800 block truncate">{managedEntry.contest_name || 'NFL Survivor'}</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Format</span>
                <span className="font-extrabold text-indigo-600 block">{getFormatLabel(managedEntry.format_code)}</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Season / Week</span>
                <span className="font-extrabold text-slate-800 block">
                  {context?.season ?? 2026} • W{context?.current_week ?? context?.week ?? 1}
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Leg</span>
                <span className="font-extrabold text-slate-900 block">{getEntryCurrentLeg(managedEntry)}</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Pick</span>
                <span className={`font-black block ${managedCurrentPick ? 'text-emerald-600' : 'text-amber-500'}`}>
                  {managedCurrentPick ? (managedCurrentPick.team?.abbr || managedCurrentPick.team_abbr || managedCurrentPick.team) : 'None'}
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Used Teams</span>
                <span className="font-extrabold text-slate-900 block">{currentManagedPicks.length}</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Remaining</span>
                <span className="font-extrabold text-emerald-600 block">{Math.max(0, 32 - currentManagedPicks.length)}</span>
              </div>
            </div>

            {/* CONTEST RULES & NOTES */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-start gap-2 text-xs text-slate-600">
              <FileText className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold font-mono text-[11px] text-slate-800 uppercase block">Contest Rules:</span>
                <p className="font-medium text-[11px] leading-relaxed">
                  {getFormatNotes(managedEntry.format_code)}
                </p>
              </div>
            </div>

          </Card>

          {/* 3. USED TEAMS SECTION */}
          <Card className="p-5 border border-slate-200 shadow-xs bg-white rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-black uppercase font-mono tracking-wider text-slate-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-400" />
                  Used Teams ({currentManagedPicks.length})
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Teams listed here are locked and unavailable for future picks in this entry.
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => {
                  setEditError(null);
                  setEditSuccess(null);
                  setSelectedTeamForEdit(null);
                  setTargetLegId(currentStrat?.current_contest_leg_id || 1);
                  setEditModalOpen(true);
                }}
                className="bg-slate-950 hover:bg-slate-800 text-white font-mono text-xs uppercase font-bold flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Used Teams
              </Button>
            </div>

            {currentManagedPicks.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs font-medium bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                No teams have been used yet. All 32 NFL teams are available!
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 font-mono text-xs">
                {currentManagedPicks.map((pick: any, idx: number) => {
                  const teamAbbr = pick.team?.abbr || pick.team_abbr || pick.team || 'USED';
                  const teamName = pick.team?.name || pick.team_name || pick.team || 'Team';
                  const legLabel = pick.contest_leg?.leg_name || pick.leg_name || `Leg ${pick.contest_leg_id || (idx + 1)}`;

                  return (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-2 text-slate-700"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="font-bold bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded text-[10px] shrink-0">
                          {teamAbbr}
                        </span>
                        <span className="font-bold text-slate-800 font-sans truncate line-through opacity-80 text-[11px]">
                          {teamName}
                        </span>
                      </div>

                      <span className="text-[9px] font-bold text-slate-400 shrink-0">
                        {legLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* 4. PICK HISTORY SECTION */}
          <Card className="p-5 border border-slate-200 shadow-xs bg-white rounded-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-black uppercase font-mono tracking-wider text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" />
                Pick History & Results
              </h3>
              <span className="text-[10px] font-mono text-slate-500">
                Chronological record of selections
              </span>
            </div>

            {currentManagedPicks.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs font-medium bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                No pick history recorded yet for this entry.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-mono text-[10px] uppercase tracking-wider border-b border-slate-200">
                      <th className="py-2.5 px-3 font-bold">Leg / Week</th>
                      <th className="py-2.5 px-3 font-bold">Team Selected</th>
                      <th className="py-2.5 px-3 font-bold">Status / Result</th>
                      <th className="py-2.5 px-3 font-bold">Recommendation Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {currentManagedPicks.map((pick: any, idx: number) => {
                      const teamAbbr = pick.team?.abbr || pick.team_abbr || pick.team || 'TBD';
                      const teamName = pick.team?.name || pick.team_name || pick.team || 'Team';
                      const legName = pick.contest_leg?.leg_name || pick.leg_name || `Leg ${pick.contest_leg_id || (idx + 1)}`;
                      const status = pick.pick_status || 'RECORDED';

                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                            {legName}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-950">
                            <div className="flex items-center gap-2">
                              <span className="font-mono bg-slate-900 text-white px-1.5 py-0.5 rounded text-[10px]">
                                {teamAbbr}
                              </span>
                              <span>{teamName}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase">
                              {status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                            {pick.is_recommendation ? (
                              <span className="text-indigo-600 font-bold">✓ SemiSharp Recommended</span>
                            ) : (
                              <span>Custom Pick</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

        </div>
      )}

      {/* EDIT USED TEAMS MODAL */}
      {editModalOpen && managedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <Card className="max-w-lg w-full p-6 bg-white border border-slate-200 shadow-2xl space-y-5 text-left rounded-xl">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black uppercase font-mono text-slate-900 tracking-tight">
                  Edit Used Teams & Pick History
                </h3>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <Alert type="error" title="Action Failed" message={editError} />
            )}

            {editSuccess && (
              <Alert type="success" title="Success" message={editSuccess} />
            )}

            <div className="space-y-4 text-xs font-sans text-slate-700">
              <p className="font-medium text-slate-600 leading-relaxed">
                Manually record or update a team selection for <strong className="text-slate-900">{managedEntry.entry_label}</strong>.
              </p>

              {/* Contest Leg Selection */}
              <div className="space-y-1.5 font-mono">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">
                  Select Contest Leg Number
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={targetLegId}
                  onChange={(e) => setTargetLegId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold text-xs"
                />
              </div>

              {/* Team Selection List */}
              <div className="space-y-1.5 font-mono">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">
                  Select NFL Team to Mark as Used
                </label>
                
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50 space-y-1 text-xs">
                  {teams.length === 0 ? (
                    <p className="text-slate-400 py-2 text-center">Loading teams...</p>
                  ) : (
                    teams.map((t, idx) => {
                      const tId = t.team_id || (idx + 1);
                      const isAlreadyUsed = currentManagedPicks.some((p: any) => {
                        const abbr = (p.team?.abbr || p.team_abbr || p.team || '').toUpperCase();
                        return (t.abbr || t.name || '').toUpperCase() === abbr || p.team_id === tId;
                      });

                      const isSelected = selectedTeamForEdit && (
                        (selectedTeamForEdit.team_id && selectedTeamForEdit.team_id === tId) ||
                        selectedTeamForEdit.abbr === t.abbr
                      );

                      return (
                        <button
                          key={t.abbr || idx}
                          type="button"
                          onClick={() => setSelectedTeamForEdit({ ...t, team_id: tId })}
                          className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-indigo-600 text-white font-bold'
                              : isAlreadyUsed
                              ? 'bg-slate-200/60 text-slate-500 cursor-pointer'
                              : 'bg-white hover:bg-slate-100 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-black ${
                              isSelected ? 'bg-indigo-800 text-white' : 'bg-slate-900 text-white'
                            }`}>
                              {t.abbr}
                            </span>
                            <span className="font-sans font-bold">{t.name}</span>
                          </div>

                          {isAlreadyUsed && !isSelected && (
                            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">
                              Already Used
                            </span>
                          )}

                          {isSelected && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setEditModalOpen(false)}
                className="flex-1 font-mono text-xs uppercase font-bold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRecordPickSubmit}
                isLoading={editSubmitting}
                disabled={!selectedTeamForEdit}
                className="flex-1 bg-slate-950 hover:bg-slate-800 text-white font-mono text-xs uppercase font-bold"
              >
                Record Selection
              </Button>
            </div>

          </Card>
        </div>
      )}

    </div>
  );
};
