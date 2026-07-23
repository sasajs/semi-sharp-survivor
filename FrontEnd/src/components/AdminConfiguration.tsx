/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Input, LoadingSpinner } from './ui';
import { SemiSharpApi, ApiError } from '../api';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Info, 
  ShieldAlert, 
  Database, 
  Clock, 
  Sliders, 
  CheckSquare, 
  Layers,
  Cpu
} from 'lucide-react';

interface IncompleteEntry {
  entry_id?: number | string;
  entry_name?: string;
  entry_label?: string;
  missing_weeks?: string | number[];
  incomplete_weeks?: string | number[];
  [key: string]: any;
}

export const AdminConfiguration: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Status data from backend GET /season-management/status
  const [statusData, setStatusData] = useState<any>(null);
  
  // Editable form state
  const [season, setSeason] = useState<number>(2026);
  const [currentWeek, setCurrentWeek] = useState<number>(1);
  const [ratingWeek, setRatingWeek] = useState<number>(1);
  const [allowBackward, setAllowBackward] = useState<boolean>(false);

  // Initial loaded values for reset
  const [initialFormState, setInitialFormState] = useState({
    season: 2026,
    currentWeek: 1,
    ratingWeek: 1,
    allowBackward: false,
  });

  // Incomplete entries for Validation and Readiness table
  const [incompleteEntries, setIncompleteEntries] = useState<IncompleteEntry[]>([]);

  // Load status on mount
  const fetchStatus = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await SemiSharpApi.getSeasonManagementStatus();
      setStatusData(data);

      const appCtx = data?.application_context || {};
      const loadedSeason = Number(appCtx.season || appCtx.current_season || 2026);
      const loadedCurrentWeek = Number(appCtx.current_week ?? appCtx.week ?? 1);
      const loadedRatingWeek = Number(appCtx.rating_week ?? appCtx.current_week ?? loadedCurrentWeek);
      const loadedAllowBackward = Boolean(appCtx.allow_backward || false);

      const formValues = {
        season: loadedSeason,
        currentWeek: loadedCurrentWeek,
        ratingWeek: loadedRatingWeek,
        allowBackward: loadedAllowBackward,
      };

      setSeason(loadedSeason);
      setCurrentWeek(loadedCurrentWeek);
      setRatingWeek(loadedRatingWeek);
      setAllowBackward(loadedAllowBackward);
      setInitialFormState(formValues);

      // Parse incomplete entries if present
      if (Array.isArray(data?.entries)) {
        const incomplete = data.entries.filter((e: any) => 
          !e.is_ready || 
          (Array.isArray(e.missing_weeks) && e.missing_weeks.length > 0) ||
          (Array.isArray(e.incomplete_weeks) && e.incomplete_weeks.length > 0) ||
          e.missing_regular_weeks
        );
        setIncompleteEntries(incomplete);
      } else {
        setIncompleteEntries([]);
      }
    } catch (err) {
      console.error('Failed to load season management status:', err);
      const msg = err instanceof ApiError ? err.message : 'Failed to connect to backend season status endpoint.';
      setFetchError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Form Reset handler
  const handleReset = () => {
    setSeason(initialFormState.season);
    setCurrentWeek(initialFormState.currentWeek);
    setRatingWeek(initialFormState.ratingWeek);
    setAllowBackward(initialFormState.allowBackward);
    setSaveSuccess(false);
    setSaveError(null);
  };

  // Form Save handler (PUT /season-management/current-week)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    const payload = {
      season: Number(season),
      current_week: Number(currentWeek),
      rating_week: Number(ratingWeek),
      allow_backward: Boolean(allowBackward),
    };

    try {
      const resp = await SemiSharpApi.updateSeasonManagementCurrentWeek(payload);
      setSaveSuccess(true);
      
      // Update initial form state to newly saved values
      setInitialFormState({
        season: Number(season),
        currentWeek: Number(currentWeek),
        ratingWeek: Number(ratingWeek),
        allowBackward: Boolean(allowBackward),
      });

      // Refresh backend status
      if (resp?.entries) {
        if (Array.isArray(resp.entries)) {
          const incomplete = resp.entries.filter((e: any) => !e.is_ready || (Array.isArray(e.missing_weeks) && e.missing_weeks.length > 0));
          setIncompleteEntries(incomplete);
        }
      } else {
        await fetchStatus();
      }
    } catch (err: any) {
      console.error('Error updating configuration:', err);
      const msg = err instanceof ApiError ? err.message : 'Failed to update configuration settings.';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const appCtx = statusData?.application_context || {};

  return (
    <div className="space-y-6 animate-fade-in text-left font-sans text-slate-900" id="admin_configuration_container">
      
      {/* 4. SAFETY NOTICE */}
      <div className="p-4 bg-amber-50 border border-amber-200/90 text-amber-950 rounded-2xl shadow-3xs flex items-start gap-3.5" id="safety_notice_panel">
        <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0 mt-0.5">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xs font-bold font-mono text-amber-900 uppercase tracking-wider">
            Safety Notice
          </h2>
          <p className="text-xs text-amber-900 font-medium leading-relaxed">
            Changing the active week affects all users and all pages. Entries with incomplete prior-week pick history must complete Step 1 before using the Season Strategy Planner.
          </p>
        </div>
      </div>

      {loading ? (
        <Card className="p-12 text-center space-y-4">
          <LoadingSpinner size="md" message="Loading season configuration context..." />
        </Card>
      ) : (
        <div className="space-y-6">

          {fetchError && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{fetchError}</span>
            </div>
          )}

          {/* 1. ACTIVE SEASON CONTEXT (EDITABLE FORM) */}
          <Card className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-3xs space-y-6" id="card_active_season_context">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 font-mono uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>1. Active Season Context</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Configure global parameters governing week advancement and rating execution.
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-md">
                🟢 LIVE
              </span>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                
                {/* Season Field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 font-mono uppercase tracking-wider">
                    Season
                  </label>
                  <Input
                    type="number"
                    min={2020}
                    max={2030}
                    value={season}
                    onChange={(e) => setSeason(Number(e.target.value))}
                    className="font-mono text-sm font-bold bg-slate-50 border-slate-200 text-slate-900 rounded-xl"
                    required
                  />
                  <p className="text-[10px] text-slate-400">NFL Regular Season Year</p>
                </div>

                {/* Current NFL Week Field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 font-mono uppercase tracking-wider">
                    Current NFL Week
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={18}
                    value={currentWeek}
                    onChange={(e) => setCurrentWeek(Number(e.target.value))}
                    className="font-mono text-sm font-bold bg-slate-50 border-slate-200 text-slate-900 rounded-xl"
                    required
                  />
                  <p className="text-[10px] text-slate-400">Active NFL slate (1 - 18)</p>
                </div>

                {/* Rating Week Field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 font-mono uppercase tracking-wider">
                    Rating Week
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={18}
                    value={ratingWeek}
                    onChange={(e) => setRatingWeek(Number(e.target.value))}
                    className="font-mono text-sm font-bold bg-slate-50 border-slate-200 text-slate-900 rounded-xl"
                    required
                  />
                  <p className="text-[10px] text-slate-400">Power ratings week index</p>
                </div>

              </div>

              {/* Allow Backward Movement Toggle/Checkbox */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                <input
                  type="checkbox"
                  id="allow_backward_checkbox"
                  checked={allowBackward}
                  onChange={(e) => setAllowBackward(e.target.checked)}
                  className="mt-0.5 h-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                />
                <div className="space-y-0.5">
                  <label htmlFor="allow_backward_checkbox" className="text-xs font-extrabold text-slate-900 font-mono cursor-pointer block">
                    Allow Backward Movement
                  </label>
                  <span className="inline-block text-[10px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md uppercase tracking-wider font-mono">
                    Testing and recovery use only.
                  </span>
                  <p className="text-xs text-slate-500 mt-1 font-normal">
                    Permits regressing the active season week to a prior week. Exercise caution in production environments.
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <Button
                  type="button"
                  onClick={handleReset}
                  variant="outline"
                  disabled={saving}
                  className="font-mono text-xs font-bold border-slate-200 text-slate-700 flex items-center gap-2"
                  id="btn_reset_changes"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Changes</span>
                </Button>

                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
                  id="btn_save_configuration"
                >
                  {saving ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Save Configuration</span>
                </Button>
              </div>

            </form>
          </Card>

          {/* 3. VALIDATION AND READINESS AREA */}
          <Card className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-3xs space-y-4" id="card_validation_readiness">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 font-mono uppercase tracking-wider flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                  <span>3. Validation and Readiness</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Backend response status, week advancement checks, and pick completeness audit.
                </p>
              </div>
            </div>

            {/* Success State */}
            {saveSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-extrabold font-mono flex items-center gap-2.5 animate-fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Configuration updated successfully.</span>
              </div>
            )}

            {/* Error State */}
            {saveError && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs font-bold flex items-start gap-2.5 animate-fade-in">
                <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-mono font-extrabold block text-rose-950">
                    Configuration Update Error
                  </span>
                  <p className="text-[11px] text-rose-800 font-normal">
                    {saveError}
                  </p>
                </div>
              </div>
            )}

            {/* Incomplete Entries Table */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-slate-800 font-mono uppercase tracking-wider flex items-center gap-2">
                <span>Active Entries Readiness Audit</span>
                {incompleteEntries.length > 0 ? (
                  <span className="text-[10px] font-mono bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold">
                    {incompleteEntries.length} Incomplete
                  </span>
                ) : (
                  <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    All Entries Ready
                  </span>
                )}
              </h4>

              {incompleteEntries.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-500 font-medium text-center font-mono">
                  🟢 All active survivor entries have complete prior pick histories. Ready for week advancement.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-2.5 px-4 font-bold">Entry</th>
                        <th className="py-2.5 px-4 font-bold">Missing Regular Weeks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {incompleteEntries.map((entry, idx) => {
                        const entryLabel = entry.entry_label || entry.entry_name || entry.name || `Entry #${entry.entry_id || idx + 1}`;
                        let missingWeeksText = 'None';

                        if (Array.isArray(entry.missing_weeks) && entry.missing_weeks.length > 0) {
                          missingWeeksText = entry.missing_weeks.map(w => `Week ${w}`).join(', ');
                        } else if (Array.isArray(entry.incomplete_weeks) && entry.incomplete_weeks.length > 0) {
                          missingWeeksText = entry.incomplete_weeks.map(w => `Week ${w}`).join(', ');
                        } else if (entry.missing_regular_weeks) {
                          missingWeeksText = String(entry.missing_regular_weeks);
                        } else if (entry.missing_weeks_count) {
                          missingWeeksText = `${entry.missing_weeks_count} week(s) missing`;
                        } else {
                          missingWeeksText = 'Prior regular weeks incomplete';
                        }

                        return (
                          <tr key={entry.entry_id || idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {entryLabel}
                            </td>
                            <td className="py-3 px-4 font-bold text-rose-700">
                              {missingWeeksText}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </Card>

          {/* 2. CURRENT SYSTEM CONTEXT (READ-ONLY) */}
          <Card className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-3xs space-y-4" id="card_current_system_context">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 font-mono uppercase tracking-wider flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-slate-700" />
                  <span>2. Current System Context</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Read-only architectural models and analytical engines active in the current deployment environment.
                </p>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Read-Only</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              
              <div className="p-3.5 bg-slate-50/80 border border-slate-200/70 rounded-xl space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono block">Projection Model</span>
                <span className="text-xs font-bold text-slate-900 font-mono block">
                  {appCtx.projection_model || appCtx.model_name || 'SemiSharp Ensemble Spread Model v5.2'}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50/80 border border-slate-200/70 rounded-xl space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono block">Home Field Advantage Source</span>
                <span className="text-xs font-bold text-slate-900 font-mono block">
                  {appCtx.hfa_source || appCtx.home_field_advantage_source || '2026 Calibrated HFA Matrix'}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50/80 border border-slate-200/70 rounded-xl space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono block">Risk Model</span>
                <span className="text-xs font-bold text-slate-900 font-mono block">
                  {appCtx.risk_model || 'Composite Variance & Injury Index'}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50/80 border border-slate-200/70 rounded-xl space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono block">Probability Model</span>
                <span className="text-xs font-bold text-slate-900 font-mono block">
                  {appCtx.probability_model || 'Logistic Spreads & Odds Implied'}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50/80 border border-slate-200/70 rounded-xl space-y-1 sm:col-span-2 lg:col-span-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono block">Last Updated</span>
                <span className="text-xs font-bold text-slate-900 font-mono block flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {appCtx.updated_at ? new Date(appCtx.updated_at).toLocaleString() : new Date().toLocaleString()}
                  </span>
                </span>
              </div>

            </div>
          </Card>

        </div>
      )}

    </div>
  );
};
