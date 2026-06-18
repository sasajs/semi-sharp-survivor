import React, { useState, useEffect } from "react";
import { adminApiService } from "../../services/adminApiService";
import { DatabaseStatusResponse } from "../../types/admin";
import { Database, RefreshCw, Layers, CheckCircle2, AlertTriangle, Cpu } from "lucide-react";

export const DatabaseStatusPanel: React.FC = () => {
  const [dbStatus, setDbStatus] = useState<DatabaseStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDbMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApiService.fetchDatabaseStatus();
      setDbStatus(data);
    } catch (err: any) {
      setError(err.message || "Failed to query live database metadata");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDbMetrics();
  }, []);

  return (
    <div id="admin-database-status-panel" className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-sans font-medium text-gray-900 tracking-tight text-lg">Postgres Database Engine</h3>
            <p className="font-sans text-xs text-gray-500">Relational SQL engine & schema migration tracking</p>
          </div>
        </div>
        <button
          id="btn-retest-db-connection"
          onClick={fetchDbMetrics}
          disabled={loading}
          className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>{loading ? "Testing..." : "Test Connectivity"}</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-lg flex items-start space-x-3 text-amber-800 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Relational Database Diagnostics Down</p>
            <p className="text-xs text-amber-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Status indicator */}
        <div className="border border-gray-100 rounded-lg p-4 bg-slate-50/50">
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-gray-400 block mb-1">State link</span>
          <div className="flex items-center space-x-2">
            {dbStatus?.connected ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            )}
            <span className={`text-sm font-semibold font-sans ${dbStatus?.connected ? "text-emerald-700" : "text-amber-700"}`}>
              {dbStatus?.connected ? "Online Integration" : "Mock Standby Mode"}
            </span>
          </div>
        </div>

        {/* Engine Type */}
        <div className="border border-gray-100 rounded-lg p-4 bg-slate-50/50">
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-gray-400 block mb-1">Store engine</span>
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="text-sm font-semibold font-sans text-slate-800 capitalize">
              {dbStatus?.databaseType === "postgres" ? "PostgreSQL Core" : "In-Memory Store"}
            </span>
          </div>
        </div>

        {/* Active Connections */}
        <div className="border border-gray-100 rounded-lg p-4 bg-slate-50/50">
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-gray-400 block mb-1">Client Pool Active</span>
          <div className="flex items-center justify-between">
            <span className="text-base font-bold font-mono text-slate-800">
              {dbStatus?.poolActive ?? 0}
            </span>
            <span className="text-xs text-slate-400">allocated leases</span>
          </div>
        </div>

        {/* Migration Version */}
        <div className="border border-gray-100 rounded-lg p-4 bg-slate-50/50">
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-gray-400 block mb-1">Migration Level</span>
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-purple-500 shrink-0" />
            <span className="text-sm font-semibold font-mono text-slate-800">
              {dbStatus?.migrationVersion || "V001_Initial"}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
        <h4 className="font-sans font-medium text-xs text-slate-700 mb-2 uppercase tracking-wide">Infrastructure Strategy</h4>
        <p className="font-sans text-xs text-slate-500 leading-relaxed">
          The platform operates on a dual-mode persistence architecture. Under mock persistence mode, state mutations are captured within high-fidelity transient repositories to enable ultra-low latency isolated environments. Under target PostgreSQL execution mode, real tables, indices, and constraints are safely managed through declarative transactional schemas.
        </p>
      </div>
    </div>
  );
};
