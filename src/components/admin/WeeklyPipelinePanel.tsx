import React, { useState, useEffect } from "react";
import { safeDate, safeArray, safeReplace } from "../../utils/safeFormat";
import { 
  Play, 
  RotateCcw, 
  Settings, 
  Cpu, 
  Layers, 
  ShieldCheck, 
  Clock, 
  Compass, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  FileText, 
  Archive, 
  TrendingUp, 
  Zap, 
  ChevronRight,
  Info
} from "lucide-react";

interface PipelineStageResult {
  stage: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  durationMs: number;
  outputSummary: string;
  errorMessage: string | null;
}

interface ValidationLayerResult {
  isValid: boolean;
  score: number;
  details: string[];
  warnings: string[];
}

interface PipelineExecution {
  id: string;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  currentStage: string | null;
  stageResults: PipelineStageResult[];
  validation: {
    ingestion: ValidationLayerResult;
    workflow: ValidationLayerResult;
    reporting: ValidationLayerResult;
    export: ValidationLayerResult;
    replay: ValidationLayerResult;
    readiness: ValidationLayerResult;
  };
  durationMs: number;
  createdAt: string;
  completedAt: string | null;
}

interface PipelineSummary {
  pipelineId: string;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  stagesCompleted: number;
  stagesFailed: number;
  durationMs: number;
  workflowCount: number;
  reportCount: number;
  exportCount: number;
  validationScore: number;
  createdAt: string;
}

export const WeeklyPipelinePanel: React.FC = () => {
  const [history, setHistory] = useState<PipelineExecution[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [activeRun, setActiveRun] = useState<PipelineExecution | null>(null);
  const [summary, setSummary] = useState<PipelineSummary | null>(null);
  
  const [executing, setExecuting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedLayerTab, setSelectedLayerTab] = useState<"ingestion" | "workflow" | "reporting" | "export" | "replay" | "readiness">("ingestion");

  const loadPipelineData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch history
      const historyRes = await fetch("/api/pipeline/history");
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData);
        
        // Auto-select latest run if available
        if (historyData.length > 0 && !activeRunId) {
          const latestId = historyData[0].id; // newest is first if unshifted
          setActiveRunId(latestId);
          await loadExecutionDetails(latestId);
        }
      }

      // 2. Fetch summary
      const summaryRes = await fetch("/api/pipeline/summary");
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData);
      } else {
        setSummary(null);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load weekly pipeline telemetry.");
    } finally {
      setLoading(false);
    }
  };

  const loadExecutionDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/pipeline/executions/${id}`);
      if (res.ok) {
        const runData = await res.json();
        setActiveRun(runData);
      }
    } catch (err) {
      console.error("Failed to load pipeline run details", id, err);
    }
  };

  const handleExecutePipeline = async () => {
    setExecuting(true);
    setError(null);
    try {
      const res = await fetch("/api/pipeline/execute", {
        method: "POST"
      });

      if (!res.ok) {
        throw new Error("Automated research pipeline execution halted unexpectedly.");
      }

      const freshRun = await res.json();
      setActiveRunId(freshRun.id);
      
      // Reload everything
      await loadPipelineData();
      await loadExecutionDetails(freshRun.id);
    } catch (err: any) {
      setError(err.message || "Pipeline orchestration crash.");
    } finally {
      setExecuting(false);
    }
  };

  useEffect(() => {
    loadPipelineData();
  }, []);

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case "DATA_INGESTION":
        return <Compass className="w-4 h-4 text-emerald-600" />;
      case "WORKFLOW_EXECUTION":
        return <Cpu className="w-4 h-4 text-blue-600" />;
      case "REPORT_GENERATION":
        return <FileText className="w-4 h-4 text-violet-600" />;
      case "EXPORT_GENERATION":
        return <Archive className="w-4 h-4 text-amber-600" />;
      case "HISTORICAL_REPLAY_VALIDATION":
        return <TrendingUp className="w-4 h-4 text-rose-600" />;
      case "PRESEASON_READINESS_VALIDATION":
        return <ShieldCheck className="w-4 h-4 text-teal-600" />;
      default:
        return <Zap className="w-4 h-4 text-indigo-600" />;
    }
  };

  const formatStageLabel = (stage: string) => {
    return safeReplace(stage, /_/g, " ", "UNKNOWN").toLowerCase();
  };

  const activeLayerResult = activeRun ? activeRun.validation[selectedLayerTab] : null;

  return (
    <div id="weekly-pipeline-panel-root" className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden font-sans">
      
      {/* Panel Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-600" />
            Automated Weekly Research Pipeline Orchestrator
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Consolidated end-to-end weekly automation framework. Coordinates live data ingestion, algorithmic workflow execution, markdown report compiling, CSV archive generation, historical backtesting, and preseason diagnostics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-600 uppercase tracking-wider font-mono">
            Pipeline Engine: Live
          </span>
        </div>
      </div>

      {error && (
        <div className="m-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 leading-relaxed animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Pipeline Orchestrator Warning</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border-b border-slate-100">
        
        {/* Left Column: Pipeline Trigger & History Feed */}
        <div className="lg:col-span-4 p-6 border-r border-slate-100 space-y-5">
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              Manual Pipeline Dispatch
            </h4>
            
            <p className="text-[11px] text-slate-500 leading-relaxed pr-2">
              Dispatching the automated lifecycle triggers sequentially and synthesizes unified compliance validation scorecards.
            </p>

            <button
              onClick={handleExecutePipeline}
              disabled={executing}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs p-3.5 rounded-xl transition shadow-sm flex items-center justify-center gap-2"
            >
              <Play className={`w-4 h-4 ${executing ? "animate-spin" : ""}`} />
              {executing ? "Dispatching Cycle Steps..." : "Run End-to-End Pipeline"}
            </button>
          </div>

          {/* Quick Metrics Summary if it exists */}
          {summary && (
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-3">
              <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">
                Last Successful Ledger
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-[10px] text-slate-400">Compliance</p>
                  <p className="font-extrabold text-slate-800">{summary.validationScore}% Score</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Duration</p>
                  <p className="font-extrabold text-slate-800">{((summary?.durationMs ?? 0) / 1000).toFixed(2)}s</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Matchups</p>
                  <p className="font-extrabold text-slate-800">{summary.workflowCount} Loaded</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Stages Passed</p>
                  <p className="font-extrabold text-slate-800">{summary.stagesCompleted}/6 Complete</p>
                </div>
              </div>
            </div>
          )}

          {/* Core Pipeline Logs/Runs history */}
          <div className="border-t border-slate-150 pt-5 space-y-3">
            <div className="flex justify-between items-center">
              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Pipeline Runs History ({history.length})
              </h5>
              <button 
                onClick={loadPipelineData}
                className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Sync live
              </button>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {safeArray(history).length === 0 ? (
                <p className="text-[11px] text-slate-400 italic text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                  No automated pipeline executions found. Trigger an orchestration cycle!
                </p>
              ) : (
                safeArray(history).map((run: any) => (
                  <div
                    key={run?.id}
                    onClick={() => {
                      setActiveRunId(run?.id);
                      loadExecutionDetails(run?.id);
                    }}
                    className={`p-3 border rounded-xl cursor-pointer transition flex items-center justify-between text-xs ${
                      activeRunId === run?.id 
                        ? "bg-slate-50 border-indigo-500 font-bold shadow-sm" 
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="font-black text-slate-800 truncate max-w-[140px]" title={run?.id}>
                        {run?.id}
                      </p>
                      <p className="text-[9px] text-slate-400 font-mono font-normal">
                        {safeDate(run?.createdAt)} | {((run?.durationMs ?? 0) / 1000).toFixed(2)}s
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded border ${
                        run?.status === "COMPLETED" 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                          : "bg-rose-50 text-rose-700 border-rose-100"
                      }`}>
                        {run?.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Stage Stepper, Compliance & Telemetry */}
        <div className="lg:col-span-8 bg-slate-50/40 p-6 flex flex-col justify-between space-y-6">
          {activeRun ? (
            <div className="space-y-6">
              
              {/* Telemetry Header */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 font-mono">
                    Weekly Orchestrator Ledger
                  </span>
                  <h4 className="text-base font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
                    <Zap className="w-5 h-5 text-indigo-500" />
                    Compliance Report for run <span className="font-mono text-xs text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded border border-indigo-100 ml-1">{activeRun.id}</span>
                  </h4>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-mono">Executed At: {new Date(activeRun.createdAt).toLocaleDateString()}</p>
                  <p className="text-[9px] text-slate-400 font-mono">{new Date(activeRun.createdAt).toLocaleTimeString()}</p>
                </div>
              </div>

              {/* Sequential Stage Stepper Timeline */}
              <div className="space-y-3">
                <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                  Process Execution Flow
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  {activeRun.stageResults.map((step, idx) => {
                    const isCompeted = step.status === "COMPLETED";
                    return (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-xl border flex flex-col justify-between gap-2 transition ${
                          isCompeted 
                            ? "bg-white border-slate-20o/80" 
                            : "bg-rose-50/40 border-rose-200"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          {getStageIcon(step.stage)}
                          {isCompeted ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          )}
                        </div>
                        <div className="space-y-1 mt-1">
                          <p className="text-[10px] font-extrabold text-slate-800 capitalize leading-tight truncate">
                            {formatStageLabel(step.stage)}
                          </p>
                          <p className="text-[8px] text-slate-400 font-mono">
                            Time: {step.durationMs}ms
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stage Analytics Summary Text */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-[10px] text-slate-300 leading-relaxed">
                <div className="flex justify-between text-slate-400 border-b border-slate-800 pb-1.5 mb-2">
                  <span>STAGE DIAGNOSTIC SUMMARY</span>
                  <span className="text-[8px] text-indigo-400 font-bold uppercase">System Console</span>
                </div>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                  {safeArray(activeRun.stageResults).map((r: any, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-indigo-400 font-black">[{formatStageLabel(r?.stage).toUpperCase()}]</span>
                      <span className="text-slate-300">{r?.outputSummary || r?.errorMessage}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Multi-Layer Validation Details */}
              <div className="space-y-3.5">
                <div className="flex justify-between items-center">
                  <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    Structural Integrity Compliance Layers
                  </h5>
                </div>

                {/* Layer Tabs */}
                <div className="flex flex-wrap border-b border-slate-200 gap-1 text-[11px] font-bold">
                  {(["ingestion", "workflow", "reporting", "export", "replay", "readiness"] as const).map(layerKey => {
                    const lRes = activeRun.validation?.[layerKey] || { isValid: false, score: 0 };
                    return (
                      <button
                        key={layerKey}
                        onClick={() => setSelectedLayerTab(layerKey)}
                        className={`px-3 py-2 border-b-2 transition capitalize flex items-center gap-1.5 ${
                          selectedLayerTab === layerKey 
                            ? "border-indigo-600 text-indigo-700 bg-white rounded-t-lg font-extrabold" 
                            : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <span>{layerKey}</span>
                        <span className={`text-[8.5px] px-1 py-0.2 rounded font-mono ${
                          lRes.isValid 
                            ? "bg-slate-100 text-slate-700" 
                            : "bg-rose-100 text-rose-700"
                        }`}>
                          {lRes.score}%
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Tab content */}
                {activeLayerResult && (
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5 shadow-sm animate-fade-in text-xs">
                    <div className="flex justify-between items-center">
                      <h6 className="font-extrabold text-slate-800 capitalize flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-indigo-600" />
                        {selectedLayerTab} Verification Record
                      </h6>
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                        activeLayerResult.isValid 
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                          : "bg-rose-50 text-rose-800 border-rose-200"
                      }`}>
                        Score: {activeLayerResult.score}/100
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Validation Measures Checked</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {safeArray(activeLayerResult.details).map((detail: any, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50/50 border border-slate-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            <p className="text-[11px] text-slate-700 leading-relaxed font-normal">{detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>
 
                    {safeArray(activeLayerResult.warnings).length > 0 && (
                      <div className="bg-amber-50/40 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-800 space-y-1 font-normal leading-relaxed">
                        <p className="font-bold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          Sub-Service Warnings Compiled
                        </p>
                        <ul className="list-disc list-inside space-y-0.5 pl-0 text-amber-900 text-[10px]">
                          {safeArray(activeLayerResult.warnings).map((warn: any, i) => (
                            <li key={i}>{warn}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center text-slate-400 bg-white border border-dashed border-slate-200 rounded-2xl p-8">
              <Layers className="w-9 h-9 text-slate-300 stroke-[1.5]" />
              <p className="text-xs font-bold text-slate-600 mt-2">Ready for Orchestration Trigger</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[280px]">
                Initiate the master automated weekly research pipeline. View process logs, stage steppers, and multi-layer structural validation details.
              </p>
            </div>
          )}

          {/* Secure cryptographic footer */}
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono border-t border-slate-100/70 pt-4 mt-4">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-indigo-500 animate-pulse" /> Weekly Automation Layer (v0.22)
            </span>
            <span>Compliance score certified for 2026 backtesting</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyPipelinePanel;
