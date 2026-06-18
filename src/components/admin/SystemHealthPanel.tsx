import React, { useState, useEffect } from "react";
import { adminApiService } from "../../services/adminApiService";
import { SystemHealthResponse, SystemStatusResponse } from "../../types/admin";
import { Activity, ShieldAlert, CheckCircle, RefreshCw, Clock, Server, Monitor, FileText } from "lucide-react";

export const SystemHealthPanel: React.FC = () => {
  const [health, setHealth] = useState<SystemHealthResponse | null>(null);
  const [status, setStatus] = useState<SystemStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHealthData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [hData, sData] = await Promise.all([
        adminApiService.fetchHealth(),
        adminApiService.fetchStatus()
      ]);
      setHealth(hData);
      setStatus(sData);
    } catch (err: any) {
      setError(err.message || "Failed to load system health metadata");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    const interval = setInterval(fetchHealthData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number): string => {
    if (!seconds) return "0s";
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(" ");
  };

  return (
    <div id="admin-system-health-panel" className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-sans font-medium text-gray-900 tracking-tight text-lg">System Health & Live Monitoring</h3>
            <p className="font-sans text-xs text-gray-500">Real-time status indicators and validator diagnostics</p>
          </div>
        </div>
        <button
          id="btn-trigger-health-check"
          onClick={fetchHealthData}
          disabled={loading}
          className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>{loading ? "Diagnosing..." : "Run Health Check"}</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-lg flex items-start space-x-3 text-rose-800 text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Connectivity or Diagnostics Failure</p>
            <p className="text-xs text-rose-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Core Status Card */}
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100/50 flex flex-col justify-between">
          <div>
            <span className="font-mono text-xs text-slate-500 uppercase tracking-wider block mb-1">Application State</span>
            <div className="flex items-center space-x-2">
              <div className={`w-2.5 h-2.5 rounded-full ${status ? (status.validation?.passed ? "bg-emerald-500 animate-pulse" : "bg-amber-500") : "bg-gray-400"}`} />
              <span className="font-sans font-semibold text-xl text-slate-800 capitalize">
                {status?.applicationState || "Unknown"}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200/50 flex items-center justify-between text-xs text-slate-500">
            <span>Environment</span>
            <span className="font-mono uppercase bg-slate-200/60 px-1.5 py-0.5 rounded text-[10px] font-bold">
              {status?.environment || "production"}
            </span>
          </div>
        </div>

        {/* Uptime Card */}
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100/50 flex flex-col justify-between">
          <div>
            <span className="font-mono text-xs text-slate-500 uppercase tracking-wider block mb-1">Uptime Duration</span>
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-indigo-500 shrink-0" />
              <span className="font-mono font-semibold text-lg text-slate-800">
                {status ? formatUptime(status.uptime) : "0s"}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200/50 flex items-center justify-between text-xs text-slate-500">
            <span>Started At</span>
            <span className="font-mono text-[10px] text-slate-600">
              {status?.startedAt ? new Date(status.startedAt).toLocaleTimeString() : "—"}
            </span>
          </div>
        </div>

        {/* Startup Validation Card */}
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100/50 flex flex-col justify-between">
          <div>
            <span className="font-mono text-xs text-slate-500 uppercase tracking-wider block mb-1">Startup Verification</span>
            <div className="flex items-center space-x-2">
              {status?.validation?.passed ? (
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
              )}
              <span className="font-sans font-semibold text-base text-slate-800">
                {status?.validation?.passed ? "Valid Security Base" : "Incongruent Setup"}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200/50 flex items-center justify-between text-xs text-slate-500">
            <span>Last Diagnostics Check</span>
            <span className="font-mono text-[10px] text-slate-600">
              {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : "Pending"}
            </span>
          </div>
        </div>
      </div>

      {/* Services List Panel */}
      <h4 className="font-sans font-medium text-sm text-slate-800 mb-3">Service Subsystem Checklist</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Database Service Status */}
        <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-slate-50/50 transition-colors">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${health?.services?.database?.status === "healthy" ? "bg-emerald-50 text-emerald-600" : health?.services?.database?.status === "mock" ? "bg-blue-50 text-blue-600" : "bg-rose-50 text-rose-600"}`}>
              <Server className="w-4 h-4" />
            </div>
            <div>
              <p className="font-sans font-medium text-xs text-gray-800">PostgreSQL / Mock Store</p>
              <p className="font-mono text-[10px] text-gray-500">
                {health?.services?.database?.latencyMs ? `${health.services.database.latencyMs}ms delay` : "Active Memory Repo"}
              </p>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${health?.services?.database?.status === "healthy" ? "bg-emerald-100 text-emerald-800" : health?.services?.database?.status === "mock" ? "bg-blue-100 text-blue-800 font-medium" : "bg-rose-100 text-rose-800"}`}>
            {health?.services?.database?.status || "disconnected"}
          </span>
        </div>

        {/* Memory Service Status */}
        <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-slate-50/50 transition-colors">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Monitor className="w-4 h-4" />
            </div>
            <div>
              <p className="font-sans font-medium text-xs text-gray-800">Dynamic RAM Memory Pool</p>
              <p className="font-sans text-[10px] text-gray-500">
                {health?.services?.memory?.freeBytes 
                  ? `${Math.floor(health.services.memory.freeBytes / (1024 * 1024))}MB available` 
                  : "Normal allocation"}
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-semibold uppercase">
            {health?.services?.memory?.status || "HEALTHY"}
          </span>
        </div>

        {/* Disk Storage Status */}
        <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-slate-50/50 transition-colors">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="font-sans font-medium text-xs text-gray-800">Storage Partition</p>
              <p className="font-sans text-[10px] text-gray-500">
                {health?.services?.disk?.freeBytes 
                  ? `${Math.floor(health.services.disk.freeBytes / (1024 * 1024 * 1024))}GB free` 
                  : "Bounded safe IO"}
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-semibold uppercase">
            {health?.services?.disk?.status || "HEALTHY"}
          </span>
        </div>

        {/* Task Scheduler Status */}
        <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-slate-50/50 transition-colors">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="font-sans font-medium text-xs text-gray-800">Event Loop Process Uptime</p>
              <p className="font-sans text-[10px] text-gray-500">
                {health?.services?.scheduler?.tasksActive ? `${health.services.scheduler.tasksActive} operations active` : "Zero lock threads"}
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-semibold uppercase">
            {health?.services?.scheduler?.status || "ONLINE"}
          </span>
        </div>
      </div>
    </div>
  );
};
