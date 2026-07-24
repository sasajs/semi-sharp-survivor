/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { SemiSharpApi } from '../api';
import { SemiSharpContext } from '../types';
import {
  ShieldCheck,
  Calendar,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Clock,
  Layers,
  Award
} from 'lucide-react';

interface GlobalContextBarProps {
  context: SemiSharpContext | null;
  onRefreshContext: () => void;
}

export const GlobalContextBar: React.FC<GlobalContextBarProps> = ({
  context,
  onRefreshContext
}) => {
  const { user, selectedEntry, selectEntry } = useAuth();

  const [currentPick, setCurrentPick] = useState<any>(null);
  const [usedCount, setUsedCount] = useState<number>(0);
  const [legLabel, setLegLabel] = useState<string>('Leg 1');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch current pick and leg status for selected entry
  const fetchEntryContextStatus = async () => {
    if (!selectedEntry) return;

    setLoading(true);
    try {
      const entryId = selectedEntry.entry_id;
      const formatCode = selectedEntry.format_code || 'STANDARD';

      // Fetch picks and strategy context in parallel
      const [picksRes, stratRes] = await Promise.all([
        SemiSharpApi.getEntryPicks(entryId).catch(() => null),
        SemiSharpApi.getStrategyContext(entryId, formatCode).catch(() => null)
      ]);

      const picks = picksRes?.picks || [];
      setUsedCount(picks.length);

      const legId = stratRes?.current_contest_leg_id;
      if (legId) {
        setLegLabel(`Leg ${legId}`);
      } else {
        const currentWeek = context?.current_week || context?.week || 1;
        setLegLabel(`Leg ${currentWeek}`);
      }

      // Resolve current leg pick
      if (picks.length > 0) {
        if (legId) {
          const matched = picks.find((p: any) => {
            const pLegId = p.contest_leg?.contest_leg_id || p.contest_leg_id;
            return String(pLegId) === String(legId);
          });
          setCurrentPick(matched || null);
        } else {
          setCurrentPick(picks[picks.length - 1] || null);
        }
      } else {
        setCurrentPick(null);
      }

      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error("Error fetching context status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntryContextStatus();
  }, [selectedEntry, context]);

  const handleRefresh = async () => {
    setRefreshing(true);
    onRefreshContext();
    await fetchEntryContextStatus();
    setRefreshing(false);
  };

  const activeEntries = user?.entries ? user.entries.filter(e => e.is_active) : [];

  if (!user || activeEntries.length === 0) {
    return null;
  }

  const activeEntry = selectedEntry || activeEntries[0];
  if (!activeEntry) return null;

  const contestName = activeEntry.contest_name || 'NFL Survivor';
  const formatLabel = (activeEntry.format_code || activeEntry.format_name || 'STANDARD').toUpperCase();
  const seasonYear = context?.season || 2026;
  const currentWeekNum = context?.current_week || context?.week || 1;
  const remainingCount = Math.max(0, 32 - usedCount);

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-slate-100 shadow-xs font-mono text-xs select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          
          {/* LEFT GROUP: Active Entry Dropdown & Contest Attributes */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Active Entry Selector Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider hidden sm:inline">
                Entry:
              </span>
              <select
                value={activeEntry.entry_id}
                onChange={(e) => {
                  const found = user.entries.find(entry => String(entry.entry_id) === e.target.value);
                  if (found) selectEntry(found);
                }}
                className="bg-transparent text-white font-bold text-xs cursor-pointer focus:outline-none pr-4 font-mono truncate max-w-[180px] sm:max-w-[220px]"
                style={{
                  backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='%2394a3b8' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'><path d='M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z'/></svg>")`,
                  backgroundPosition: 'right 0rem center',
                  backgroundSize: '1rem',
                  backgroundRepeat: 'no-repeat'
                }}
              >
                {user.entries.map((entry) => (
                  <option key={entry.entry_id} value={entry.entry_id} className="bg-slate-900 text-white">
                    {entry.entry_label} ({entry.format_code || 'STANDARD'})
                  </option>
                ))}
              </select>
            </div>

            {/* Contest & Format */}
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-slate-300 font-bold">{contestName}</span>
              <span className="text-slate-600">•</span>
              <span className="text-indigo-300 font-extrabold bg-indigo-950/60 border border-indigo-800/50 px-1.5 py-0.2 rounded text-[10px]">
                {formatLabel}
              </span>
            </div>

            <span className="text-slate-700 hidden lg:inline">|</span>

            {/* Season, Week, Leg */}
            <div className="flex items-center gap-2 text-[11px] text-slate-300 font-semibold">
              <span>{seasonYear} Season</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-100 font-bold">Week {currentWeekNum}</span>
              <span className="text-slate-600">•</span>
              <span className="text-indigo-400 font-bold">{legLabel}</span>
            </div>

          </div>

          {/* RIGHT GROUP: Pick Status, Used Summary, Last Updated */}
          <div className="flex flex-wrap items-center gap-3 justify-between md:justify-end">
            
            {/* Pick Status Badge */}
            <div className="flex items-center gap-1.5">
              {currentPick ? (
                <span className="inline-flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Pick Recorded: <strong className="text-white ml-0.5">{currentPick.team?.abbr || currentPick.team_abbr || currentPick.team}</strong>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  No Pick Recorded
                </span>
              )}
            </div>

            {/* Used / Remaining Summary */}
            <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
              <span>Used: <strong className="text-slate-200">{usedCount}</strong></span>
              <span className="text-slate-600">|</span>
              <span>Rem: <strong className="text-emerald-400">{remainingCount}</strong></span>
            </div>

            {/* Data Updated & Refresh Button */}
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pl-2 border-l border-slate-800">
              <Clock className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="hidden sm:inline">Updated:</span>
              <span className="text-slate-300 font-bold">{lastUpdated || 'Live'}</span>
              
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                title="Refresh context status"
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded cursor-pointer ml-1 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
