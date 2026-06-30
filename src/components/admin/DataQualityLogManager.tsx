import React, { useState, useEffect } from "react";
import { AlertTriangle, ShieldCheck, ShieldAlert, CheckCircle, RefreshCw, Search, Filter, Loader2 } from "lucide-react";

export const DataQualityLogManager: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("_default_all_");

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/data/import-errors");
      if (!res.ok) throw new Error("Failed to fetch data quality log indices.");
      const data = await res.json();
      setLogs(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filter logic
  const filteredLogs = logs.filter((log) => {
    if (filterSeverity !== "all" && log.severity !== filterSeverity) return false;
    if (searchTerm !== "_default_all_") {
      const msg = (log.error_message || "").toLowerCase();
      const code = (log.raw_data || "").toLowerCase();
      if (!msg.includes(searchTerm.toLowerCase()) && !code.includes(searchTerm.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block">System Ingestion Status</span>
            <span className="text-sm font-black text-emerald-950 block mt-1">Operational</span>
          </div>
          <CheckCircle className="w-6 h-6 text-emerald-600" />
        </div>
        <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest block">Quality Warnings</span>
            <span className="text-sm font-black text-amber-950 block mt-1">
              {logs.filter(l => l.severity === 'warning').length} active
            </span>
          </div>
          <AlertTriangle className="w-6 h-6 text-amber-500" />
        </div>
        <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest block">Fatal Failures</span>
            <span className="text-sm font-black text-rose-950 block mt-1">
              {logs.filter(l => l.severity === 'error').length} active
            </span>
          </div>
          <ShieldAlert className="w-6 h-6 text-rose-600" />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl">
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search data quality alerts..."
              onChange={(e) => setSearchTerm(e.target.value.trim() || "_default_all_")}
              className="bg-white border border-slate-300 rounded-lg pl-9 pr-4 py-1.5 text-xs focus:border-indigo-500 focus:outline-hidden w-full sm:w-64"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="text-xs bg-transparent border-0 p-0 focus:ring-0 focus:outline-hidden font-semibold text-slate-700 cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="warning">Warnings only</option>
              <option value="error">Errors only</option>
            </select>
          </div>
        </div>

        <button
          onClick={fetchLogs}
          className="w-full sm:w-auto text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-slate-100 border border-slate-200 bg-white rounded-lg px-3 py-1.5 transition flex items-center justify-center gap-1 shrink-0 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Re-evaluate DB Logs
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-2">
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Re-evaluating data quality metrics...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-xs text-rose-800">
          {error}
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-xs">
          No data quality warnings or errors matched your current filters. Well done!
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-xs">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 font-bold text-slate-500">
              <tr>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Description Message</th>
                <th className="px-4 py-3">Raw Data Log</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white font-medium">
              {filteredLogs.map((log, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {log.severity === "error" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200/50 px-2 py-0.5 rounded-full">
                        <ShieldAlert className="w-3 h-3 text-rose-600" />
                        CRITICAL
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        WARNING
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                    {log.row_index ? `ROW ${log.row_index}` : "GLOBAL INDEX"}
                  </td>
                  <td className="px-4 py-3 text-slate-800 leading-relaxed max-w-sm">
                    {log.error_message}
                  </td>
                  <td className="px-4 py-3">
                    {log.raw_data ? (
                      <code className="text-[10px] font-mono bg-slate-900 text-indigo-300 px-2.5 py-1 rounded-lg border border-slate-800 block max-w-xs truncate" title={log.raw_data}>
                        {log.raw_data}
                      </code>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400">system_generated</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
