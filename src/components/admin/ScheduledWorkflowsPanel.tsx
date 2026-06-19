import React, { useState, useEffect } from "react";
import { adminApiService } from "../../services/adminApiService";
import { ScheduledWorkflow, ScheduledWorkflowRun } from "../../types/admin";
import { safeDate, safeArray, safeReplace } from "../../utils/safeFormat";
import { 
  Calendar, 
  Play, 
  Pause, 
  Settings, 
  RefreshCw, 
  Clock, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  ListRestart, 
  Sliders, 
  ChevronRight, 
  Activity, 
  X,
  FileCode2
} from "lucide-react";

export const ScheduledWorkflowsPanel: React.FC = () => {
  const [schedules, setSchedules] = useState<ScheduledWorkflow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Selected schedule for runs inspect
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [scheduleRuns, setScheduleRuns] = useState<ScheduledWorkflowRun[]>([]);
  const [loadingRuns, setLoadingRuns] = useState<boolean>(false);

  // New schedule form state
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [workflowType, setWorkflowType] = useState<string>("FULL_WEEKLY_RESEARCH");
  const [season, setSeason] = useState<string>("2026");
  const [week, setWeek] = useState<number>(1);
  const [scheduleExpression, setScheduleExpression] = useState<string>("0 4 * * 1");
  const [scheduleTimezone, setScheduleTimezone] = useState<string>("America/New_York");
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState<boolean>(false);

  // Trigger state matching
  const [triggeringId, setTriggeringId] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const fetchSchedules = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApiService.fetchSchedules();
      setSchedules(data);
    } catch (err: any) {
      console.error("Failed to load scheduler list:", err);
      setError(err.message || "Failed to load active schedule configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const loadScheduleRuns = async (id: string) => {
    setLoadingRuns(true);
    setScheduleRuns([]);
    try {
      const data = await adminApiService.fetchScheduleRuns(id);
      setScheduleRuns(data);
    } catch (err) {
      console.error(`Failed to load runs for schedule ${id}:`, err);
    } finally {
      setLoadingRuns(false);
    }
  };

  const handleSelectSchedule = (id: string) => {
    if (selectedScheduleId === id) {
      setSelectedScheduleId(null);
      setScheduleRuns([]);
    } else {
      setSelectedScheduleId(id);
      loadScheduleRuns(id);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);

    if (!name.trim() || !description.trim() || !scheduleExpression.trim()) {
      setCreateError("All core parameters must be filled before submission");
      setCreating(false);
      return;
    }

    try {
      const payload = {
        name,
        description,
        workflowType,
        season,
        week: Number(week),
        scheduleExpression,
        scheduleTimezone
      };
      await adminApiService.createSchedule(payload);
      
      // Reset form variables
      setName("");
      setDescription("");
      setWorkflowType("FULL_WEEKLY_RESEARCH");
      setWeek(1);
      setScheduleExpression("0 4 * * 1");
      setShowCreateForm(false);
      
      setActionSuccessMessage("Scheduled workflow registry defined successfully!");
      fetchSchedules();
    } catch (err: any) {
      setCreateError(err.message || "Failed to submit scheduled job specifications");
    } finally {
      setCreating(false);
    }
  };

  const handleTriggerSchedule = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTriggeringId(id);
    setError(null);
    setActionSuccessMessage(null);
    try {
      await adminApiService.triggerSchedule(id);
      setActionSuccessMessage(`Successfully triggered manual run for scheduler ID: ${id}`);
      fetchSchedules();
      if (selectedScheduleId === id) {
        loadScheduleRuns(id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to trigger automated playbook");
    } finally {
      setTriggeringId(null);
    }
  };

  const handleEnable = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await adminApiService.enableSchedule(id);
      setActionSuccessMessage("Schedule enabled successfully");
      fetchSchedules();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDisable = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await adminApiService.disableSchedule(id);
      setActionSuccessMessage("Schedule disabled successfully");
      fetchSchedules();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePause = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await adminApiService.pauseSchedule(id);
      setActionSuccessMessage("Schedule paused successfully");
      fetchSchedules();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getStatusBadge = (status: string, enabled: boolean) => {
    if (!enabled) {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wider font-mono border border-slate-200">
          Disabled
        </span>
      );
    }
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 uppercase tracking-wider font-mono border border-emerald-100">
            Active
          </span>
        );
      case "PAUSED":
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 uppercase tracking-wider font-mono border border-amber-100">
            Paused
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 uppercase tracking-wider font-mono border border-rose-100 animate-pulse">
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 uppercase tracking-wider font-mono">
            {status}
          </span>
        );
    }
  };

  const getWorkflowTypeBadge = (wt: string) => {
    return (
      <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase border border-indigo-100">
        {safeReplace(wt, /_/, " ", "UNKNOWN")}
      </span>
    );
  };

  return (
    <div id="admin-scheduled-workflows-panel" className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
      {/* Panel header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-50 pb-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-sans font-medium text-gray-900 tracking-tight text-lg">Scheduled Platform Workflows</h3>
            <p className="font-sans text-xs text-gray-500">Define, manually trigger, and audit cron-based automation pipelines</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 mt-3 sm:mt-0">
          <button
            id="btn-show-create-schedule"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Schedule</span>
          </button>
          <button
            id="btn-refresh-scheduler"
            onClick={fetchSchedules}
            disabled={loading}
            className="p-1.5 text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {actionSuccessMessage && (
        <div className="mb-6 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-800 text-xs font-sans font-medium flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button onClick={() => setActionSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-lg flex items-start space-x-3 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <div>
            <p className="font-semibold">Scheduler System Incident Detected</p>
            <p className="text-rose-600/90 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Form Section */}
      {showCreateForm && (
        <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-5 animate-fade-in relative">
          <button 
            onClick={() => { setShowCreateForm(false); setCreateError(null); }}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4.5 h-4.5" />
          </button>
          
          <h4 className="font-sans font-bold text-slate-800 text-sm mb-4 flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <span>Define New Automation Rule Blueprint</span>
          </h4>

          <form onSubmit={handleCreateSchedule} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 font-sans">
                  Schedule Name/Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Weekly Research Document Compile"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 font-sans">
                  Target Workflow Engine Pipeline *
                </label>
                <select
                  value={workflowType}
                  onChange={(e) => setWorkflowType(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-sans"
                >
                  <option value="FULL_WEEKLY_RESEARCH">Full weekly research & simulation</option>
                  <option value="IMPORT_ONLY">Data import pipeline only</option>
                  <option value="FEATURE_REFRESH_ONLY">Feature store refresh pipeline</option>
                  <option value="RECOMMENDATION_ONLY">Recommendation compilation pipeline</option>
                  <option value="SIMULATION_ONLY">Monte carlo simulator run only</option>
                  <option value="REPORT_ONLY">Executive pdf report compile only</option>
                  <option value="EXPORT_ONLY">DOCX zip export compiler only</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 font-sans">
                Description explaining business trigger *
              </label>
              <textarea
                placeholder="Describe the operational purpose of this scheduled task run..."
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-sans"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 font-sans">
                  NFL Season Year
                </label>
                <input
                  type="text"
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 font-sans">
                  NFL Week Number (1-22)
                </label>
                <input
                  type="number"
                  min={1}
                  max={22}
                  value={week}
                  onChange={(e) => setWeek(Number(e.target.value))}
                  className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 font-sans">
                  Cron Expression (5-field) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 0 4 * * 1"
                  value={scheduleExpression}
                  onChange={(e) => setScheduleExpression(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-mono font-semibold"
                />
                <span className="text-[9px] text-slate-400 font-sans">0 4 * * 1 = Mondays at 4 AM</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 font-sans">
                  Timezone
                </label>
                <input
                  type="text"
                  value={scheduleTimezone}
                  onChange={(e) => setScheduleTimezone(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-sans"
                />
              </div>
            </div>

            {createError && (
              <p className="text-xs text-rose-600 font-sans font-medium">
                Invalid inputs: {createError}
              </p>
            )}

            <button
              type="submit"
              disabled={creating}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-slate-300 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>{creating ? "Creating schedule..." : "Save Scheduled Task Rule"}</span>
            </button>
          </form>
        </div>
      )}

      {/* Main Lists Section */}
      {safeArray(schedules).length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-200 rounded-lg text-slate-400">
          <p className="text-sm font-medium">No scheduled playbooks configured</p>
          <p className="text-xs mt-1">Use the "Create Schedule" controls above to define automated workflows</p>
        </div>
      ) : (
        <div className="space-y-4">
          {safeArray(schedules).map((sch: any) => {
            const isSelected = selectedScheduleId === sch?.id;
            return (
              <div
                key={sch.id}
                onClick={() => handleSelectSchedule(sch.id)}
                className={`border rounded-xl p-5 hover:bg-slate-50/20 transition-all cursor-pointer ${isSelected ? "border-indigo-200 bg-indigo-50/10 shadow-xs" : "border-slate-100"}`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Title and Descriptions */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-sans font-semibold text-slate-900 text-sm tracking-tight">
                        {sch.name}
                      </h4>
                      {getWorkflowTypeBadge(sch.workflowType)}
                      {getStatusBadge(sch.status, sch.enabled)}
                    </div>
                    <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                      {sch.description}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-400 font-mono pt-1">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Expression: <strong>{sch.scheduleExpression}</strong></span>
                      </span>
                      <span>•</span>
                      <span>TZ: {sch.scheduleTimezone}</span>
                      <span>•</span>
                      <span>Season: {sch.season} (Wk {sch.week})</span>
                    </div>
                  </div>

                  {/* Actions column */}
                  <div className="flex flex-col sm:flex-row items-center gap-2 lg:self-start shrink-0">
                    <div className="flex rounded-md border border-slate-200 p-0.5 bg-slate-50">
                      {sch.enabled ? (
                        <button
                          onClick={(e) => handleDisable(sch.id, e)}
                          title="Disable schedule completely"
                          className="text-[10px] font-semibold px-2 py-1 rounded text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          Disable
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleEnable(sch.id, e)}
                          title="Enable schedule rule"
                          className="text-[10px] font-semibold px-2 py-1 rounded text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                        >
                          Enable
                        </button>
                      )}
                      <button
                        onClick={(e) => handlePause(sch.id, e)}
                        title="Pause schedule executions"
                        className="text-[10px] font-semibold px-2 py-1 rounded text-amber-600 hover:bg-amber-50 cursor-pointer"
                      >
                        Pause
                      </button>
                    </div>

                    <button
                      id={`btn-trigger-${sch.id}`}
                      onClick={(e) => handleTriggerSchedule(sch.id, e)}
                      disabled={triggeringId === sch.id}
                      className="flex items-center justify-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg text-[10px] font-bold tracking-wide uppercase cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current text-white shrink-0" />
                      <span>{triggeringId === sch.id ? "Launching..." : "Manual Run"}</span>
                    </button>
                  </div>
                </div>

                {/* Timing statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100/60 text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Last executed run</span>
                    <span className="font-sans font-medium text-slate-700">
                      {safeDate(sch?.lastRunAt, "Never launched")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Next automatic trigger</span>
                    <span className="font-sans font-medium text-indigo-600">
                      {safeDate(sch?.nextRunAt, "Standby/Paused")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">ID REF</span>
                    <span className="font-mono text-[10px] text-slate-500">
                      {sch?.id}
                    </span>
                  </div>
                  <div className="flex items-center justify-end text-slate-400">
                    <span className="text-[11px] font-sans">
                      {isSelected ? "Collapse Runs" : "Inspect Runs Audit"}
                    </span>
                    <ChevronRight className={`w-4 h-4 ml-1 transition-transform ${isSelected ? "rotate-90 text-indigo-500" : ""}`} />
                  </div>
                </div>

                {/* Runs list under selected schedule */}
                {isSelected && (
                  <div 
                    onClick={(e) => e.stopPropagation()} 
                    className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/50 rounded-lg p-4 space-y-3 cursor-default"
                  >
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold font-sans text-slate-700 uppercase tracking-wider flex items-center space-x-1">
                        <Activity className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Execution log runs history for {sch.name}</span>
                      </h5>
                      <button 
                        onClick={() => loadScheduleRuns(sch.id)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-700"
                        title="Reload logs"
                      >
                        <RefreshCw className={`w-3 h-3 ${loadingRuns ? "animate-spin" : ""}`} />
                      </button>
                    </div>

                    {loadingRuns ? (
                      <div className="text-center py-4 text-xs text-slate-400">
                        Querying run trace logs...
                      </div>
                    ) : safeArray(scheduleRuns).length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No manual or scheduled traces exist for this blueprint</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {safeArray(scheduleRuns).map((run: any) => (
                          <div 
                            key={run?.id}
                            className="bg-white border border-slate-150 p-2.5 rounded-lg flex items-center justify-between text-[11px] hover:border-slate-200 transition-colors"
                          >
                            <div className="space-y-0.5">
                              <p className="font-mono font-medium text-slate-800">
                                Run: {run?.id}
                                {run?.workflowRunId && <span className="ml-2 text-[10px] text-slate-400">Ref: {run?.workflowRunId}</span>}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                Type: <span className="capitalize font-mono">{run?.triggerType}</span> | Launched: {safeDate(run?.startedAt)}
                              </p>
                              {run?.errorMessage && (
                                <p className="text-[10px] text-rose-600 font-sans font-medium">Error: {run?.errorMessage}</p>
                              )}
                            </div>
                            <div>
                              {run?.status === "completed" ? (
                                <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold font-mono text-[9px] uppercase border border-emerald-100 rounded">
                                  Succeeded
                                </span>
                              ) : run?.status === "running" ? (
                                <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 font-bold font-mono text-[9px] uppercase border border-indigo-100 rounded animate-pulse">
                                  Running
                                </span>
                              ) : run?.status === "failed" ? (
                                <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 font-bold font-mono text-[9px] uppercase border border-rose-100 rounded">
                                  Failed
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 font-bold font-mono text-[9px] uppercase rounded">
                                  {run?.status}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
