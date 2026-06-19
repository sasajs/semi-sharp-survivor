import React, { useState, useEffect } from "react";
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  ArrowRight, 
  Workflow, 
  Calendar, 
  Database, 
  FileText, 
  Download,
  Info
} from "lucide-react";

interface SubsystemResult {
  status: "PASSED" | "FAILED" | "WARNING";
  score: number;
  details: string[];
  errorMessage: string | null;
}

interface Scorecard {
  overallStatus: "READY" | "NEEDS_ATTENTION" | "NOT_READY";
  overallScore: number;
  workflowScore: number;
  schedulerScore: number;
  ingestionScore: number;
  reportingScore: number;
  exportScore: number;
  workflowResult: SubsystemResult;
  schedulerResult: SubsystemResult;
  ingestionResult: SubsystemResult;
  reportingResult: SubsystemResult;
  exportResult: SubsystemResult;
  warnings: string[];
  recommendations: string[];
  generatedAt: string;
}

export const PreseasonReadinessPanel: React.FC = () => {
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubsystem, setSelectedSubsystem] = useState<string | null>(null);

  // Fetch the current preseason readiness scorecard
  const fetchScorecard = async (triggerTest: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = triggerTest ? "/api/testing/readiness" : "/api/testing/readiness";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load: ${response.statusText}`);
      }
      const data = await response.json();
      setScorecard(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while running the certification.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScorecard(false);
  }, []);

  const getStatusBadge = (status: "READY" | "NEEDS_ATTENTION" | "NOT_READY") => {
    switch (status) {
      case "READY":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            READY
          </span>
        );
      case "NEEDS_ATTENTION":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            NEEDS ATTENTION
          </span>
        );
      case "NOT_READY":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5" />
            NOT READY
          </span>
        );
      default:
        return null;
    }
  };

  const getSubsystemStatusClass = (status: "PASSED" | "FAILED" | "WARNING") => {
    switch (status) {
      case "PASSED":
        return "text-emerald-700 bg-emerald-50 border-emerald-200";
      case "WARNING":
        return "text-amber-700 bg-amber-50 border-amber-200";
      case "FAILED":
        return "text-rose-700 bg-rose-50 border-rose-200";
      default:
        return "text-slate-500 bg-slate-50 border-slate-200";
    }
  };

  return (
    <div id="preseason-readiness-panel-root" className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden font-sans">
      {/* Panel Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
            Preseason Readiness Certification
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Verify major platform subsystem integrations (Workflow, Scheduler, Ingestion, Reporting, Exports) for the 2026 NFL Season.
          </p>
        </div>
        <button
          onClick={() => fetchScorecard(true)}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Running Certification..." : "Trigger Full System Certification"}
        </button>
      </div>

      {error && (
        <div className="m-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 leading-relaxed">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Execution Error</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {scorecard && (
        <div className="p-6 space-y-6">
          {/* Main Scoring Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Overall Score */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Overall Readiness Status</span>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-3xl font-black text-slate-900 tracking-tight">{scorecard.overallScore}%</span>
                  {getStatusBadge(scorecard.overallStatus)}
                </div>
              </div>
              <div className="space-y-1.5Packed font-normal">
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      scorecard.overallStatus === "READY" ? "bg-emerald-500" : 
                      scorecard.overallStatus === "NEEDS_ATTENTION" ? "bg-amber-500" : "bg-rose-500"
                    }`}
                    style={{ width: `${scorecard.overallScore}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Minimum Required: 90%</span>
                  <span>Certified: 2026 Season</span>
                </div>
              </div>
            </div>

            {/* Warnings Log */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex flex-col space-y-2.5">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1 text-slate-500">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Triggered Warnings ({scorecard.warnings.length})
              </span>
              <div className="flex-1 overflow-y-auto max-h-[110px] space-y-1.5 pr-1">
                {scorecard.warnings.length === 0 ? (
                  <p className="text-xs text-slate-500 italic mt-1">No active system warnings triggered.</p>
                ) : (
                  scorecard.warnings.map((warn, idx) => (
                    <div key={idx} className="flex gap-1.5 text-[11px] text-amber-800 leading-relaxed items-start bg-amber-50/55 p-1.5 rounded-lg border border-amber-100/40">
                      <span className="font-extrabold">•</span>
                      <span>{warn}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex flex-col space-y-2.5">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1 text-indigo-500">
                <Info className="w-3.5 h-3.5" />
                Operational Recommendations ({scorecard.recommendations.length})
              </span>
              <div className="flex-1 overflow-y-auto max-h-[110px] space-y-1.5 pr-1">
                {scorecard.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex gap-1.5 text-[11px] text-indigo-800 leading-relaxed items-start bg-indigo-50/50 p-1.5 rounded-lg border border-indigo-100/40">
                    <ArrowRight className="w-3 h-3 mt-0.5 text-indigo-500 shrink-0" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Subsystem Score-grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 tracking-wider uppercase">Subsystem Testing Breakdown</h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Workflow */}
              <div 
                onClick={() => setSelectedSubsystem(selectedSubsystem === "workflow" ? null : "workflow")}
                className={`p-4 border rounded-xl flex flex-col justify-between gap-4 cursor-pointer hover:border-indigo-300 transition ${
                  selectedSubsystem === "workflow" ? "bg-indigo-50/40 border-indigo-400 shadow-sm" : "bg-white border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <Workflow className="w-4 h-4 text-slate-600" />
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${getSubsystemStatusClass(scorecard.workflowResult.status)}`}>
                    {scorecard.workflowResult.status}
                  </span>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-800 truncate">Workflow Engine</p>
                  <div className="flex justify-between items-baseline mt-1">
                    <span className="text-xs text-slate-500">Score:</span>
                    <span className="text-md font-extrabold text-slate-900">{scorecard.workflowScore}%</span>
                  </div>
                </div>
              </div>

              {/* Scheduler */}
              <div 
                onClick={() => setSelectedSubsystem(selectedSubsystem === "scheduler" ? null : "scheduler")}
                className={`p-4 border rounded-xl flex flex-col justify-between gap-4 cursor-pointer hover:border-indigo-300 transition ${
                  selectedSubsystem === "scheduler" ? "bg-indigo-50/40 border-indigo-400 shadow-sm" : "bg-white border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <Calendar className="w-4 h-4 text-slate-600" />
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${getSubsystemStatusClass(scorecard.schedulerResult.status)}`}>
                    {scorecard.schedulerResult.status}
                  </span>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-800 truncate">Scheduler</p>
                  <div className="flex justify-between items-baseline mt-1">
                    <span className="text-xs text-slate-500">Score:</span>
                    <span className="text-md font-extrabold text-slate-900">{scorecard.schedulerScore}%</span>
                  </div>
                </div>
              </div>

              {/* Ingestion */}
              <div 
                onClick={() => setSelectedSubsystem(selectedSubsystem === "ingestion" ? null : "ingestion")}
                className={`p-4 border rounded-xl flex flex-col justify-between gap-4 cursor-pointer hover:border-indigo-300 transition ${
                  selectedSubsystem === "ingestion" ? "bg-indigo-50/40 border-indigo-400 shadow-sm" : "bg-white border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <Database className="w-4 h-4 text-slate-600" />
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${getSubsystemStatusClass(scorecard.ingestionResult.status)}`}>
                    {scorecard.ingestionResult.status}
                  </span>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-800 truncate">Data Ingestion</p>
                  <div className="flex justify-between items-baseline mt-1">
                    <span className="text-xs text-slate-500">Score:</span>
                    <span className="text-md font-extrabold text-slate-900">{scorecard.ingestionScore}%</span>
                  </div>
                </div>
              </div>

              {/* Reporting */}
              <div 
                onClick={() => setSelectedSubsystem(selectedSubsystem === "reporting" ? null : "reporting")}
                className={`p-4 border rounded-xl flex flex-col justify-between gap-4 cursor-pointer hover:border-indigo-300 transition ${
                  selectedSubsystem === "reporting" ? "bg-indigo-50/40 border-indigo-400 shadow-sm" : "bg-white border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${getSubsystemStatusClass(scorecard.reportingResult.status)}`}>
                    {scorecard.reportingResult.status}
                  </span>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-800 truncate">Weekly Reporting</p>
                  <div className="flex justify-between items-baseline mt-1">
                    <span className="text-xs text-slate-500">Score:</span>
                    <span className="text-md font-extrabold text-slate-900">{scorecard.reportingScore}%</span>
                  </div>
                </div>
              </div>

              {/* Export */}
              <div 
                onClick={() => setSelectedSubsystem(selectedSubsystem === "export" ? null : "export")}
                className={`p-4 border rounded-xl flex flex-col justify-between gap-4 cursor-pointer hover:border-indigo-300 transition ${
                  selectedSubsystem === "export" ? "bg-indigo-50/40 border-indigo-400 shadow-sm" : "bg-white border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <Download className="w-4 h-4 text-slate-600" />
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${getSubsystemStatusClass(scorecard.exportResult.status)}`}>
                    {scorecard.exportResult.status}
                  </span>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-800 truncate">Reports Export</p>
                  <div className="flex justify-between items-baseline mt-1">
                    <span className="text-xs text-slate-500">Score:</span>
                    <span className="text-md font-extrabold text-slate-900">{scorecard.exportScore}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Subsystem Details Expandable Terminal */}
          {selectedSubsystem ? (
            <div className="bg-slate-900 text-slate-200 p-5 rounded-2xl font-mono text-[11px] leading-relaxed relative animate-fade-in">
              <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-wider pb-3 border-b border-slate-800 mb-3">
                <span>Subsystem Console Logs: {selectedSubsystem}</span>
                <span className="cursor-pointer hover:text-white" onClick={() => setSelectedSubsystem(null)}>Collapse [x]</span>
              </div>
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {selectedSubsystem === "workflow" && (
                  <>
                    <p className="text-slate-400">Subsystem Score: {scorecard.workflowScore}% | Status: {scorecard.workflowResult.status}</p>
                    {scorecard.workflowResult.errorMessage && <p className="text-rose-400 font-bold">Error: {scorecard.workflowResult.errorMessage}</p>}
                    {scorecard.workflowResult.details.map((log, i) => (
                      <p key={i} className={log.includes("SUCCESS") ? "text-emerald-400" : log.includes("CRITICAL") ? "text-rose-400" : "text-slate-300"}>
                        {log}
                      </p>
                    ))}
                  </>
                )}
                {selectedSubsystem === "scheduler" && (
                  <>
                    <p className="text-slate-400">Subsystem Score: {scorecard.schedulerScore}% | Status: {scorecard.schedulerResult.status}</p>
                    {scorecard.schedulerResult.errorMessage && <p className="text-rose-400 font-bold">Error: {scorecard.schedulerResult.errorMessage}</p>}
                    {scorecard.schedulerResult.details.map((log, i) => (
                      <p key={i} className={log.includes("SUCCESS") ? "text-emerald-400" : log.includes("CRITICAL") ? "text-rose-400" : "text-slate-300"}>
                        {log}
                      </p>
                    ))}
                  </>
                )}
                {selectedSubsystem === "ingestion" && (
                  <>
                    <p className="text-slate-400">Subsystem Score: {scorecard.ingestionScore}% | Status: {scorecard.ingestionResult.status}</p>
                    {scorecard.ingestionResult.errorMessage && <p className="text-rose-400 font-bold">Error: {scorecard.ingestionResult.errorMessage}</p>}
                    {scorecard.ingestionResult.details.map((log, i) => (
                      <p key={i} className={log.includes("SUCCESS") ? "text-emerald-400" : log.includes("CRITICAL") ? "text-rose-400" : "text-slate-300"}>
                        {log}
                      </p>
                    ))}
                  </>
                )}
                {selectedSubsystem === "reporting" && (
                  <>
                    <p className="text-slate-400">Subsystem Score: {scorecard.reportingScore}% | Status: {scorecard.reportingResult.status}</p>
                    {scorecard.reportingResult.errorMessage && <p className="text-rose-400 font-bold">Error: {scorecard.reportingResult.errorMessage}</p>}
                    {scorecard.reportingResult.details.map((log, i) => (
                      <p key={i} className={log.includes("SUCCESS") ? "text-emerald-400" : log.includes("CRITICAL") ? "text-rose-400" : "text-slate-300"}>
                        {log}
                      </p>
                    ))}
                  </>
                )}
                {selectedSubsystem === "export" && (
                  <>
                    <p className="text-slate-400">Subsystem Score: {scorecard.exportScore}% | Status: {scorecard.exportResult.status}</p>
                    {scorecard.exportResult.errorMessage && <p className="text-rose-400 font-bold">Error: {scorecard.exportResult.errorMessage}</p>}
                    {scorecard.exportResult.details.map((log, i) => (
                      <p key={i} className={log.includes("SUCCESS") ? "text-emerald-400" : log.includes("CRITICAL") ? "text-rose-400" : "text-slate-300"}>
                        {log}
                      </p>
                    ))}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
              💡 Tip: Click on any subsystem card above to explore deep verification console logs and diagnostic execution reports.
            </div>
          )}

          {/* Verification timestamp */}
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono border-t border-slate-100 pt-3">
            <span>Certification Authority Layer (Secured)</span>
            <span>Generated: {new Date(scorecard.generatedAt).toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};
export default PreseasonReadinessPanel;
