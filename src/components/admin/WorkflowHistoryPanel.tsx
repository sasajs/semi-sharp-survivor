import React, { useState, useEffect } from "react";
import { adminApiService } from "../../services/adminApiService";
import { WorkflowRun, WorkflowSummaryResponse } from "../../types/admin";
import { safeArray, safeString, safeDate, safeReplace } from "../../utils/safeFormat";
import { History, RefreshCw, CheckCircle, XCircle, Loader2, Filter, Settings, Activity } from "lucide-react";

export const WorkflowHistoryPanel: React.FC = () => {
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [summary, setSummary] = useState<WorkflowSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rData, sData] = await Promise.all([
        adminApiService.fetchWorkflowRuns(),
        adminApiService.fetchWorkflowSummaries()
      ]);
      setRuns(rData);
      setSummary(sData);
    } catch (err: any) {
      console.error("Failed to load workflow execution history:", err);
      setError(err.message || "Failed to retrieve historic log logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            <span>Success</span>
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Failed</span>
          </span>
        );
      case "running":
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-800 animate-pulse">
            <Loader2 className="w-3 h-3 text-indigo-600 animate-spin" />
            <span>Running</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800">
            <span>Standby</span>
          </span>
        );
    }
  };

  const calculateDuration = (run: WorkflowRun): string => {
    if (!run.created_at) return "—";
    const start = new Date(run.created_at).getTime();
    const end = run.completed_at ? new Date(run.completed_at).getTime() : Date.now();
    const ms = end - start;
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const filteredRuns = safeArray(runs).filter((run: any) => {
    if (selectedFilter === "all" || !selectedFilter) return true;
    return run?.status === selectedFilter;
  });

  return (
    <div id="admin-workflow-history-panel" className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-50 pb-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-600">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-sans font-medium text-gray-900 tracking-tight text-lg">Workflow History & Execution stats</h3>
            <p className="font-sans text-xs text-gray-500">Historic tracing registers for distributed Monte Carlo tasks</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 mt-3 sm:mt-0">
          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50/50">
            {["all", "completed", "failed", "running"].map((fl) => (
              <button
                key={fl}
                onClick={() => setSelectedFilter(fl)}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-all capitalize cursor-pointer ${selectedFilter === fl ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                {fl === "completed" ? "Success" : fl}
              </button>
            ))}
          </div>
          <button
            id="btn-refresh-workflow-history"
            onClick={fetchHistory}
            disabled={loading}
            className="p-1.5 text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl">
            <span className="text-[10px] text-slate-400 font-mono block mb-1">TOTAL EXECUTIONS</span>
            <span className="text-xl font-bold font-mono text-slate-800">{summary?.totalRuns ?? 0}</span>
          </div>
          <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl">
            <span className="text-[10px] text-emerald-600 font-mono block mb-1">SUCCESS RATE</span>
            <span className="text-xl font-bold font-mono text-emerald-600">
              {(summary?.totalRuns ?? 0) > 0 ? `${Math.round(((summary?.successCount ?? 0) / summary.totalRuns) * 100)}%` : "0%"}
            </span>
          </div>
          <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl">
            <span className="text-[10px] text-rose-600 font-mono block mb-1">FAILURE COUNT</span>
            <span className="text-xl font-bold font-mono text-rose-600">{summary?.failureCount ?? 0}</span>
          </div>
          <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl">
            <span className="text-[10px] text-indigo-600 font-mono block mb-1">IN-FLIGHT RUNNING</span>
            <span className="text-xl font-bold font-mono text-indigo-600">{summary?.runningCount ?? 0}</span>
          </div>
        </div>
      )}

      {error ? (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-lg text-rose-800 text-xs">
          {error}
        </div>
      ) : filteredRuns.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-200 rounded-lg text-slate-400">
          <p className="text-sm font-medium">No pipeline logs found matching current filter</p>
          <p className="text-xs mt-1">Manual triggers will establish new log traces here</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-slate-400 font-semibold uppercase font-sans">
                <th className="pb-3 pl-3">Execution ID</th>
                <th className="pb-3">Trigger Type</th>
                <th className="pb-3">Context Metadata</th>
                <th className="pb-3">Uptime Duration</th>
                <th className="pb-3">Steps Run</th>
                <th className="pb-3">Initiated Time</th>
                <th className="pb-3 pr-3">Status Badge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs text-slate-600">
              {safeArray(filteredRuns).map((run: any) => (
                <tr key={run?.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="py-3 pl-3 font-mono font-medium text-slate-900">{safeString(run?.id).slice(0, 12)}...</td>
                  <td className="py-3 font-sans capitalize">{safeReplace(run?.type ?? run?.workflowType, /_/g, " ", "UNKNOWN")}</td>
                  <td className="py-3 font-mono text-[10px] text-slate-500">
                    Contest ID: {safeString(run?.context?.contestId).slice(0, 8)}... <br />
                    Leg ID: {safeString(run?.context?.legId).slice(0, 8)}...
                  </td>
                  <td className="py-3 font-mono">{calculateDuration(run)}</td>
                  <td className="py-3 font-sans">
                    {safeArray(run?.steps).length} steps (
                    {safeArray(run?.steps).filter((s: any) => s?.status === "completed").length} Completed)
                  </td>
                  <td className="py-3 font-sans text-slate-500">
                    {safeDate(run?.created_at)}
                  </td>
                  <td className="py-3 pr-3">{getStatusBadge(run?.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
