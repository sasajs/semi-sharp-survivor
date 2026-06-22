import React, { useState, useEffect } from "react";
import { SystemHealthPanel } from "../components/admin/SystemHealthPanel";
import { DatabaseStatusPanel } from "../components/admin/DatabaseStatusPanel";
import { WorkflowExecutionPanel } from "../components/admin/WorkflowExecutionPanel";
import { WorkflowHistoryPanel } from "../components/admin/WorkflowHistoryPanel";
import { ReportArtifactsPanel } from "../components/admin/ReportArtifactsPanel";
import { ExportArtifactsPanel } from "../components/admin/ExportArtifactsPanel";
import { ScheduledWorkflowsPanel } from "../components/admin/ScheduledWorkflowsPanel";
import { DataIngestionPanel } from "../components/admin/DataIngestionPanel";
import { PostgresReadinessPanel } from "../components/admin/PostgresReadinessPanel";
import { PreseasonReadinessPanel } from "../components/admin/PreseasonReadinessPanel";
import { HistoricalReplayPanel } from "../components/admin/HistoricalReplayPanel";
import { WeeklyPipelinePanel } from "../components/admin/WeeklyPipelinePanel";
import { RemoteAccessPanel } from "../components/admin/RemoteAccessPanel";
import { SecurityStatusPanel } from "../components/admin/SecurityStatusPanel";
import { SystemMemoryPanel } from "../components/admin/SystemMemoryPanel";
import { AdminErrorBoundary } from "../components/admin/AdminErrorBoundary";
import { AdminLoginPanel } from "../components/admin/AdminLoginPanel";
import { AuthStatus } from "../types/auth";
import { ShieldCheck, ShieldAlert, LogOut, Loader2 } from "lucide-react";

export const AdminDashboard: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(localStorage.getItem("admin_token"));

  const fetchAuthStatus = async (chkToken: string | null) => {
    try {
      const headers: Record<string, string> = {};
      if (chkToken) {
        headers["x-admin-token"] = chkToken;
      }
      const res = await fetch("/api/auth/status", { headers });
      if (res.ok) {
        const data: AuthStatus = await res.json();
        setAuthStatus(data);
        if (!data.authenticated) {
          // If expired or invalid, clear token
          localStorage.removeItem("admin_token");
          setToken(null);
        }
      } else {
        // Fallback if API fails
        setAuthStatus({ enabled: false, authenticated: true, session: null });
      }
    } catch {
      setAuthStatus({ enabled: false, authenticated: true, session: null });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthStatus(token);
  }, [token]);

  const handleLoginSuccess = (newToken: string) => {
    setToken(newToken);
  };

  const handleLogout = async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers["x-admin-token"] = token;
      }
      await fetch("/api/auth/logout", {
        method: "POST",
        headers
      });
    } catch (err) {
      console.error("Logout request failure", err);
    } finally {
      localStorage.removeItem("admin_token");
      setToken(null);
      setAuthStatus(prev => prev ? { ...prev, authenticated: false, session: null } : null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3 font-sans">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-xs text-slate-500">Retrieving security posture from node...</p>
      </div>
    );
  }

  const isEnabled = authStatus?.enabled ?? false;
  const isAuthenticated = authStatus?.authenticated ?? true;

  if (isEnabled && !isAuthenticated) {
    return (
      <AdminErrorBoundary>
        <AdminLoginPanel onLoginSuccess={handleLoginSuccess} />
      </AdminErrorBoundary>
    );
  }

  return (
    <AdminErrorBoundary>
      <div id="admin-dashboard-container" className="space-y-8 animate-fade-in w-full">
        {/* Page Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <h2 className="text-2xl font-black text-slate-950 tracking-tight">
                Semi-Sharp Admin Dashboard
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Operational control panel for research workflows, health checks, database status, and artifacts.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-3">
            {isEnabled && (
              <button
                onClick={handleLogout}
                className="text-xs font-bold text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 border border-slate-200 py-2 px-3 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            )}
            <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider font-mono border ${
              authStatus?.session?.role === "USER"
                ? "bg-amber-50 text-amber-700 border-amber-100"
                : "bg-indigo-50 text-indigo-700 border-indigo-100"
            }`}>
              {authStatus?.session?.role || "ADMIN"} Session
            </span>
          </div>
        </div>

        {authStatus?.session?.role === "USER" && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-3 text-xs leading-relaxed text-amber-900 shadow-sm animate-fade-in">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Standard User Security Context (Read-Only Privileges)</p>
              <p className="mt-0.5 text-slate-600">
                You are currently logged in with read-only operational telemetry privileges. Attempting to trigger pipelines, run backtests, override ingestion policies, reset data states, or execute workflows will be intercepted by server-side role validators, caught as security audit events, and rejected with an HTTP <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px] text-rose-700 font-bold">403 Forbidden</code> response.
              </p>
            </div>
          </div>
        )}

      {/* Grid of panels for organized operational visual hierarchy */}
      <div className="space-y-8">
        {/* Section 1: System Health */}
        <section id="admin-section-health" className="space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-205 pb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">01. Infrastructure Live Monitor</span>
          </div>
          <SystemHealthPanel />
        </section>

        {/* Section 1.5: Security Gatekeeper Policy & Audit Trails */}
        <section id="admin-section-security-audits" className="space-y-3 font-sans">
          <div className="flex items-center space-x-2 border-b border-slate-205 pb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">01.5. Security Gatekeeper Policy & Audit Trails</span>
          </div>
          <SecurityStatusPanel />
        </section>

        {/* Section 1.8: System Memory & Architectural Foundation */}
        <section id="admin-section-system-memory" className="space-y-3 font-sans">
          <div className="flex items-center space-x-2 border-b border-slate-205 pb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">01.8. System Memory & Architectural Foundation</span>
          </div>
          <SystemMemoryPanel />
        </section>

        {/* Section 2: Database Status */}
        <section id="admin-section-database" className="space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-205 pb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">02. Persistent Database Metrics</span>
          </div>
          <DatabaseStatusPanel />
        </section>

        {/* Section 2.5: PostgreSQL Cutover Readiness Validation */}
        <section id="admin-section-postgres-readiness" className="space-y-3 font-sans">
          <div className="flex items-center space-x-2 border-b border-slate-205 pb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">03. PostgreSQL Cutover Readiness Validation</span>
          </div>
          <PostgresReadinessPanel />
        </section>

        {/* Section 2.7: Preseason Readiness Testing Framework */}
        <section id="admin-section-preseason-readiness" className="space-y-3 font-sans">
          <div className="flex items-center space-x-2 border-b border-slate-205 pb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">03.5. Preseason Readiness Testing Framework</span>
          </div>
          <PreseasonReadinessPanel />
        </section>

        {/* Section 2.9: Historical Replay & Strategy Backtesting */}
        <section id="admin-section-historical-replay" className="space-y-3 font-sans">
          <div className="flex items-center space-x-2 border-b border-slate-205 pb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">03.7. Historical Replay & Strategy Backtesting</span>
          </div>
          <HistoricalReplayPanel />
        </section>

        {/* Section 2.10: Automated Weekly Research Pipeline */}
        <section id="admin-section-weekly-pipeline" className="space-y-3 font-sans">
          <div className="flex items-center space-x-2 border-b border-slate-205 pb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">03.8. Automated Weekly Research Pipeline</span>
          </div>
          <WeeklyPipelinePanel />
        </section>

        {/* Section 3: Manual Workflow Execution */}
        <section id="admin-section-workflow-exec" className="space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-205 pb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">04. Execution Controls</span>
          </div>
          <WorkflowExecutionPanel />
        </section>

        {/* Section 3.5: Scheduled Workflows Engine */}
        <section id="admin-section-scheduled-workflows" className="space-y-3 font-sans">
          <div className="flex items-center space-x-2 border-b border-slate-205 pb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">05. Scheduled Automation Blueprints</span>
          </div>
          <ScheduledWorkflowsPanel />
        </section>

        {/* Section 3.8: Data Ingestion Framework */}
        <section id="admin-section-data-ingestion" className="space-y-3 font-sans">
          <div className="flex items-center space-x-2 border-b border-slate-205 pb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">06. Data Ingestion Architecture</span>
          </div>
          <DataIngestionPanel />
        </section>

        {/* Section 4: Workflow History */}
        <section id="admin-section-workflow-history" className="space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-205 pb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">07. Event Pipeline Logs</span>
          </div>
          <WorkflowHistoryPanel />
        </section>

        {/* Section 5: Reports */}
        <section id="admin-section-reports" className="space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-205 pb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">08. Evaluation Artifacts</span>
          </div>
          <ReportArtifactsPanel />
        </section>

        {/* Section 6: Exports */}
        <section id="admin-section-exports" className="space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-205 pb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">09. Documents and Audited Studies</span>
          </div>
          <ExportArtifactsPanel />
        </section>

        {/* Section 7: Remote Access & Deployment Encryption Readiness */}
        <section id="admin-section-remote-access" className="space-y-3 font-sans">
          <div className="flex items-center space-x-2 border-b border-slate-205 pb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">10. Secure Remote Access & Port Ingress</span>
          </div>
          <RemoteAccessPanel />
        </section>
      </div>
    </div>
    </AdminErrorBoundary>
  );
};
