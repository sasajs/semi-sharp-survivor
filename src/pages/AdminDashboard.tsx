import React from "react";
import { SystemHealthPanel } from "../components/admin/SystemHealthPanel";
import { DatabaseStatusPanel } from "../components/admin/DatabaseStatusPanel";
import { WorkflowExecutionPanel } from "../components/admin/WorkflowExecutionPanel";
import { WorkflowHistoryPanel } from "../components/admin/WorkflowHistoryPanel";
import { ReportArtifactsPanel } from "../components/admin/ReportArtifactsPanel";
import { ExportArtifactsPanel } from "../components/admin/ExportArtifactsPanel";
import { ScheduledWorkflowsPanel } from "../components/admin/ScheduledWorkflowsPanel";
import { DataIngestionPanel } from "../components/admin/DataIngestionPanel";
import { ShieldCheck } from "lucide-react";

export const AdminDashboard: React.FC = () => {
  return (
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
        <div className="shrink-0">
          <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-3 py-1.5 rounded-full uppercase tracking-wider font-mono border border-indigo-100">
            Secure Admin Session
          </span>
        </div>
      </div>

      {/* Grid of panels for organized operational visual hierarchy */}
      <div className="space-y-8">
        {/* Section 1: System Health */}
        <section id="admin-section-health" className="space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-205 pb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">01. Infrastructure Live Monitor</span>
          </div>
          <SystemHealthPanel />
        </section>

        {/* Section 2: Database Status */}
        <section id="admin-section-database" className="space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-205 pb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">02. Persistent Database Metrics</span>
          </div>
          <DatabaseStatusPanel />
        </section>

        {/* Section 3: Manual Workflow Execution */}
        <section id="admin-section-workflow-exec" className="space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-205 pb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">03. Execution Controls</span>
          </div>
          <WorkflowExecutionPanel />
        </section>

        {/* Section 3.5: Scheduled Workflows Engine */}
        <section id="admin-section-scheduled-workflows" className="space-y-3 font-sans">
          <div className="flex items-center space-x-2 border-b border-slate-205 pb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">04. Scheduled Automation Blueprints</span>
          </div>
          <ScheduledWorkflowsPanel />
        </section>

        {/* Section 3.8: Data Ingestion Framework */}
        <section id="admin-section-data-ingestion" className="space-y-3 font-sans">
          <div className="flex items-center space-x-2 border-b border-slate-205 pb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">05. Data Ingestion Architecture</span>
          </div>
          <DataIngestionPanel />
        </section>

        {/* Section 4: Workflow History */}
        <section id="admin-section-workflow-history" className="space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-205 pb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">06. Event Pipeline Logs</span>
          </div>
          <WorkflowHistoryPanel />
        </section>

        {/* Section 5: Reports */}
        <section id="admin-section-reports" className="space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-205 pb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">07. Evaluation Artifacts</span>
          </div>
          <ReportArtifactsPanel />
        </section>

        {/* Section 6: Exports */}
        <section id="admin-section-exports" className="space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-205 pb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">08. Documents and Audited Studies</span>
          </div>
          <ExportArtifactsPanel />
        </section>
      </div>
    </div>
  );
};
