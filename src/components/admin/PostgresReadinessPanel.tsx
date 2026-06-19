import React, { useState, useEffect } from "react";
import { adminApiService } from "../../services/adminApiService";
import { ClientSystemReadinessResult } from "../../types/admin";
import { safeDate, safeArray, safeStatus } from "../../utils/safeFormat";
import {
  Database,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Terminal,
  Settings,
  ShieldCheck,
  Server,
  Network,
  GitMerge,
  Info,
  Layers,
  Sparkles,
  Zap,
  HelpCircle
} from "lucide-react";

export const PostgresReadinessPanel: React.FC = () => {
  const [report, setReport] = useState<ClientSystemReadinessResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "repositories" | "migrations" | "connection" | "recommendations">("summary");

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApiService.fetchPostgresReadiness();
      setReport(data);
    } catch (err: any) {
      console.error("Failed to load postgres readiness metrics:", err);
      setError(err.message || "Failed to load database cutover readiness verification state");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "HEALTHY":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "WARNING":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "FAILED":
        return <XCircle className="w-4 h-4 text-rose-500" />;
      default:
        return <HelpCircle className="w-4 h-4 text-slate-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "HEALTHY":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono bg-emerald-50 text-emerald-700 border border-emerald-100">
            Healthy
          </span>
        );
      case "WARNING":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono bg-amber-50 text-amber-700 border border-amber-100">
            Warning
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono bg-rose-50 text-rose-700 border border-rose-100">
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono bg-slate-100 text-slate-650 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  if (loading && !report) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl p-8 text-center">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-500 font-sans">Compiling PostgreSQL cutover validation checklist...</p>
      </div>
    );
  }

  return (
    <div id="postgres-readiness-panel" className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-50 pb-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <Database className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-sans font-medium text-gray-900 tracking-tight text-lg">PostgreSQL Cutover Readiness Panel</h3>
              {report && getStatusBadge(report.overallStatus)}
            </div>
            <p className="font-sans text-xs text-gray-500">Run pre-flight structural integrity audits to prove schema, repository, and driver compliance</p>
          </div>
        </div>

        <button
          id="btn-re-verify-postgres"
          onClick={loadReport}
          disabled={loading}
          className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-150 rounded-lg transition-colors cursor-pointer self-start sm:self-auto mt-3 sm:mt-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Trigger Re-audit</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-lg flex items-start space-x-3 text-rose-850 text-xs">
          <XCircle className="w-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Pre-Flight Audit Failure</p>
            <p className="text-rose-600/90 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {report && (
        <div className="space-y-6">
          {/* Bento-grid of health checklist summaries */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Repository validation summary */}
            <div 
              onClick={() => setActiveTab("repositories")}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${activeTab === "repositories" ? "border-indigo-600 bg-indigo-50/10 shadow-xs" : "border-slate-100 bg-slate-50/20 hover:border-slate-200"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans">Repository Layer</span>
                {getStatusIcon(report.repositoryValidation.status)}
              </div>
              <div className="text-xl font-bold font-mono tracking-tight text-slate-800">
                {safeArray(report.repositoryValidation?.resolvedRepositories).filter((r: any) => r?.resolved).length} / {safeArray(report.repositoryValidation?.resolvedRepositories).length}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Interfaces resolved cleanly through RepositoryFactory</p>
            </div>

            {/* Migration validation summary */}
            <div 
              onClick={() => setActiveTab("migrations")}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${activeTab === "migrations" ? "border-indigo-600 bg-indigo-50/10 shadow-xs" : "border-slate-100 bg-slate-50/20 hover:border-slate-200"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans">Schema Migrations</span>
                {getStatusIcon(report.migrationValidation.status)}
              </div>
              <div className="text-sm font-bold font-mono text-slate-800 flex items-center space-x-1">
                <span>{safeArray(report.migrationValidation?.migrations).length} Migration(s)</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">V001 Initial schema loaded cleanly on verified path</p>
            </div>

            {/* Connection settings summary */}
            <div 
              onClick={() => setActiveTab("connection")}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${activeTab === "connection" ? "border-indigo-600 bg-indigo-50/10 shadow-xs" : "border-slate-100 bg-slate-50/20 hover:border-slate-200"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans">Pool & Driver Params</span>
                {getStatusIcon(report.connectionValidation.status)}
              </div>
              <div className="text-sm font-bold font-mono text-slate-800">
                {report.connectionValidation.poolMin} min | {report.connectionValidation.poolMax} max
              </div>
              <p className="text-[10px] text-slate-500 mt-1">SSL Auto-handshakes matching verified target provider</p>
            </div>

            {/* Environment Validation summary */}
            <div 
              onClick={() => setActiveTab("summary")}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${activeTab === "summary" ? "border-indigo-600 bg-indigo-50/10 shadow-xs" : "border-slate-100 bg-slate-50/20 hover:border-slate-200"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans">Environment Profile</span>
                {getStatusIcon(report.environmentValidation.status)}
              </div>
              <div className="text-sm font-bold font-mono text-slate-850 uppercase">
                {report.connectionValidation.databaseMode === "mock" ? "Mock Active" : "Postgres Ready"}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Status parses to proof sandbox execution limits</p>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex space-x-2 border-b border-slate-100 pb-px">
            <button
              onClick={() => setActiveTab("summary")}
              className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${activeTab === "summary" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
              <span>Audit Summary</span>
            </button>
            <button
              onClick={() => setActiveTab("repositories")}
              className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${activeTab === "repositories" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
              <span>Repository Registries</span>
            </button>
            <button
              onClick={() => setActiveTab("migrations")}
              className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${activeTab === "migrations" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
              <span>Migration Files</span>
            </button>
            <button
              onClick={() => setActiveTab("connection")}
              className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${activeTab === "connection" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
              <span>Pool Config</span>
            </button>
            <button
              onClick={() => setActiveTab("recommendations")}
              className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${activeTab === "recommendations" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
              <span className="flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                <span>Recommendations ({safeArray(report.recommendations).length})</span>
              </span>
            </button>
          </div>

          {/* Tab contents */}
          {activeTab === "summary" && (
            <div className="space-y-4 font-sans">
              <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-100 flex items-start space-x-3.5">
                <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 mb-1">Pre-Flight PostgreSQL Audit Overview</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    This compliance suite verifies files, driver bindings, and repository contracts before committing your application state to the active Relational Database. Operating with <strong>USE_MOCK=true</strong> guarantees the preview container is isolated from network latency or DB credential interruptions while maintaining complete database capability verification.
                  </p>
                </div>
              </div>

              {/* Status checklist */}
              <div className="space-y-3">
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Layer Verification Handshakes</h5>
                <div className="divide-y divide-slate-50 border border-slate-100 rounded-xl overflow-hidden bg-white">
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">Repository Factories Factory-Check</span>
                      <span className="text-[11px] text-slate-400 block font-mono">RepositoryFactory Class Handlers static resolve</span>
                    </div>
                    {getStatusBadge(report.repositoryValidation.status)}
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">Database Environmental Parameters</span>
                      <span className="text-[11px] text-slate-400 block font-mono">DATABASE_URL environment settings check</span>
                    </div>
                    {getStatusBadge(report.environmentValidation.status)}
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">Relational Migrations Registry</span>
                      <span className="text-[11px] text-slate-400 block font-mono">MigrationRegistry.ts & physical filesystem SQL file tracking</span>
                    </div>
                    {getStatusBadge(report.migrationValidation.status)}
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">Database Mode Isolation status</span>
                      <span className="text-[11px] text-slate-400 block font-mono">Mock state isolation vs persistent Postgres state</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {report.connectionValidation.databaseMode.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Warnings List */}
              {safeArray(report.warnings).length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Validation System Warnings</h5>
                  <div className="space-y-1.5">
                    {safeArray(report.warnings).map((warning, idx) => (
                      <div key={idx} className="flex items-start space-x-2 text-xs text-amber-800 bg-amber-50/50 border border-amber-100 rounded-lg p-2.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>{warning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "repositories" && (
            <div className="space-y-4 font-sans">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Repository Resolution Registry</h4>
                <div className="text-[11px] text-slate-500">
                  Mock Repositories: <strong className="text-indigo-600">{report.repositoryValidation.mockActive ? "ENABLED" : "DISABLED"}</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {safeArray(report.repositoryValidation?.resolvedRepositories).map((repo: any, idx) => (
                  <div key={idx} className="border border-slate-100 rounded-xl p-4 bg-white hover:border-slate-200 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="text-xs font-bold text-slate-800 font-mono">{repo?.name}</h5>
                        <div className="flex items-center space-x-2 mt-1.5">
                          <span className="text-[9px] font-bold uppercase tracking-wider font-mono bg-slate-50 text-slate-500 border border-slate-150 px-1 py-0.5 rounded">
                            Client Type: {safeStatus(repo?.type)}
                          </span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase font-mono ${repo.resolved ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"}`}>
                        {repo.resolved ? "Resolved" : "Failed"}
                      </span>
                    </div>
                    {repo.errorMessage && (
                      <div className="text-[10px] text-rose-600 bg-rose-50/50 p-2 mt-2 border border-rose-100 rounded font-mono">
                        {repo.errorMessage}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "migrations" && (
            <div className="space-y-4 font-sans">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered SQL Migrations</h4>
                <div className="text-[11px] text-slate-500">
                  Operational Version: <strong className="font-mono text-indigo-700">{report.migrationValidation.currentVersion}</strong>
                </div>
              </div>

              <div className="space-y-3">
                {safeArray(report.migrationValidation?.migrations).map((mig: any, idx) => (
                  <div key={idx} className="border border-slate-100 rounded-xl p-4 bg-white">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono">
                            {mig.version}
                          </span>
                          <span className="text-xs font-semibold text-slate-800">{mig.description}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 font-mono">
                          Sequence Sorting check: {mig.validOrder ? "Passed (Correct alphabetical step order)" : "Unsorted order sequence"}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center space-x-2 self-start sm:self-auto text-xs">
                        <span className={`px-2 py-0.5 rounded font-bold tracking-wider uppercase text-[10px] font-mono ${mig.exists ? "bg-emerald-50 text-emerald-700 border border-emerald-105" : "bg-rose-50 text-rose-700 border border-rose-105"}`}>
                          {mig.exists ? "Found on Disk" : "Missing File"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "connection" && (
            <div className="space-y-4 font-sans">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Configuration parameters & Pool boundary checks</h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-slate-100 rounded-xl p-4 bg-white">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">State Isolation Mode</span>
                  <span className="text-sm font-bold font-mono text-slate-800 uppercase block">
                    {report.connectionValidation.databaseMode === "mock" ? "MOCK ISOLATION" : "POSTGRES PERSIST"}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-2">Driven by USE_MOCK environment variable settings</span>
                </div>

                <div className="border border-slate-105 rounded-xl p-4 bg-white">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Connection Configuration String</span>
                  <span className="text-sm font-bold font-mono text-slate-800 block">
                    {report.connectionValidation.databaseUrlProvided ? "✓ DETECTED (SECURED)" : "✗ ABSENT"}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-2">Must match target PostgreSQL coordinates</span>
                </div>

                <div className="border border-slate-100 rounded-xl p-4 bg-white">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Pool bounds Verification</span>
                  <span className="text-sm font-bold font-mono text-slate-800 block">
                    {report.connectionValidation.poolSettingsValid ? "PASSED (POOL INTEGRITY SUCCESS)" : "FAILED BOUND DETAILS"}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-2">Min size: {report.connectionValidation.poolMin} | Max size: {report.connectionValidation.poolMax}</span>
                </div>
              </div>

              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 border-dashed text-xs text-slate-500">
                <h5 className="font-semibold text-slate-700 mb-1">Dry-Run Mode Guarantee</h5>
                This readiness service checks credentials, driver scopes, and schema targets in memory and never triggers active TCP hook handshakes. This safety guarantee prevents unnecessary billing rates, timeout bottlenecks, or connection errors in the preview sandbox.
              </div>
            </div>
          )}

          {activeTab === "recommendations" && (
            <div className="space-y-4 font-sans">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dynamic Recommendations & Roadmap checklist</h4>

              <div className="space-y-2.5">
                {safeArray(report.recommendations).map((rec, idx) => (
                  <div key={idx} className="flex items-start space-x-3 border border-slate-100 rounded-xl p-3.5 bg-white shadow-3xs">
                    <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600 shrink-0 mt-0.5">
                      <Zap className="w-3.5 h-3.5 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-750 leading-relaxed">{rec}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generated timestamp indication */}
          <div className="flex items-center space-x-1 justify-end text-[10px] text-slate-400 pt-4 border-t border-slate-50 font-mono">
            <span>Report compile timestamp:</span>
            <span>{safeDate(report.generatedAt)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
