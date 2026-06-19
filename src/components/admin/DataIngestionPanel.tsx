import React, { useState, useEffect } from "react";
import { adminApiService } from "../../services/adminApiService";
import { IngestionSource, IngestionJob, IngestionRun } from "../../types/admin";
import { safeDate, safeArray } from "../../utils/safeFormat";
import { 
  Database, 
  Workflow, 
  History, 
  RefreshCw, 
  Play, 
  CheckCircle, 
  AlertCircle, 
  X, 
  ToggleLeft, 
  ToggleRight, 
  Compass, 
  Server, 
  Activity, 
  HelpCircle,
  FileCode
} from "lucide-react";

export const DataIngestionPanel: React.FC = () => {
  const [sources, setSources] = useState<IngestionSource[]>([]);
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const [runs, setRuns] = useState<IngestionRun[]>([]);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Trigger state matching
  const [runningJobId, setRunningJobId] = useState<string | null>(null);
  const [togglingSourceId, setTogglingSourceId] = useState<string | null>(null);

  // Active Tab: "sources" | "jobs" | "runs"
  const [activeTab, setActiveTab] = useState<"sources" | "jobs" | "runs">("sources");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [allSources, allJobs, allRuns] = await Promise.all([
        adminApiService.fetchIngestionSources(),
        adminApiService.fetchIngestionJobs(),
        adminApiService.fetchIngestionRuns()
      ]);
      setSources(allSources);
      setJobs(allJobs);
      setRuns(allRuns);
    } catch (err: any) {
      console.error("Failed to load data ingestion panel state:", err);
      setError(err.message || "Failed to load dynamic data ingestion registry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleSource = async (sourceId: string, currentEnabled: boolean) => {
    setTogglingSourceId(sourceId);
    setError(null);
    setSuccessMessage(null);
    try {
      if (currentEnabled) {
        await adminApiService.disableIngestionSource(sourceId);
        setSuccessMessage(`Successfully disabled data provider stream: ${sourceId}`);
      } else {
        await adminApiService.enableIngestionSource(sourceId);
        setSuccessMessage(`Successfully state-enabled data provider stream: ${sourceId}`);
      }
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to toggle data provider state");
    } finally {
      setTogglingSourceId(null);
    }
  };

  const handleRunImport = async (jobId: string) => {
    setRunningJobId(jobId);
    setError(null);
    setSuccessMessage(null);
    try {
      const result = await adminApiService.triggerIngestionJob(jobId);
      if (result.status === "FAILED") {
        setError(`Ingestion completed with Failure status: ${result.errorMessage || "Unknown transformed record mapping anomaly"}`);
      } else {
        setSuccessMessage(`Ingestion pipeline executed! Processed ${result.recordsProcessed} record(s) successfully.`);
      }
      await loadData();
    } catch (err: any) {
      setError(err.message || "Execution exception triggered inside connection stack");
    } finally {
      setRunningJobId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCEEDED":
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 font-mono uppercase tracking-wider border border-emerald-100">
            Succeeded
          </span>
        );
      case "RUNNING":
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 font-mono uppercase tracking-wider border border-indigo-150 animate-pulse">
            Running
          </span>
        );
      case "PARTIAL_SUCCESS":
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 font-mono uppercase tracking-wider border border-amber-100">
            Partial
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 font-mono uppercase tracking-wider border border-rose-100">
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-50 text-slate-600 font-mono uppercase tracking-wider border border-slate-150">
            {status}
          </span>
        );
    }
  };

  return (
    <div id="admin-data-ingestion-panel" className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
      {/* Panel header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-50 pb-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-sans font-medium text-gray-900 tracking-tight text-lg">Platform Data Ingestion Framework</h3>
            <p className="font-sans text-xs text-gray-500">Architect, monitor, and state-transition game details, weather forecasts, lines & injuries</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 mt-3 sm:mt-0">
          <button
            id="btn-refresh-ingestion"
            onClick={loadData}
            disabled={loading}
            className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-150 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Reload Feeds</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="mb-6 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-800 text-xs font-sans font-medium flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-lg flex items-start space-x-3 text-rose-800 text-xs">
          <AlertCircle className="w-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Execution Warning Handled</p>
            <p className="text-rose-600/90 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex space-x-2 border-b border-slate-100 mb-6 pb-px">
        <button
          onClick={() => setActiveTab("sources")}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${activeTab === "sources" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          <span className="flex items-center space-x-1.5">
            <Server className="w-3.5 h-3.5" />
            <span>Data Sources ({safeArray(sources).length})</span>
          </span>
        </button>
        <button
          onClick={() => setActiveTab("jobs")}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${activeTab === "jobs" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          <span className="flex items-center space-x-1.5">
            <Workflow className="w-3.5 h-3.5" />
            <span>Ingestion Jobs ({safeArray(jobs).length})</span>
          </span>
        </button>
        <button
          onClick={() => setActiveTab("runs")}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${activeTab === "runs" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          <span className="flex items-center space-x-1.5">
            <History className="w-3.5 h-3.5" />
            <span>Recent Run Traces ({safeArray(runs).length})</span>
          </span>
        </button>
      </div>

      {/* Sources list */}
      {activeTab === "sources" && (
        <div className="space-y-4">
          {safeArray(sources).length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-lg text-slate-400">
              <p className="text-sm font-medium">No external source providers configured</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {safeArray(sources).map((src: any) => (
                <div 
                  key={src?.id}
                  className="border border-slate-100 rounded-xl p-5 hover:border-slate-200 transition-all bg-white"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-sans font-semibold text-slate-900 text-sm">{src.name}</h4>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wider font-mono uppercase ${src.enabled ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                          {src.enabled ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {src.description}
                      </p>
                    </div>

                    <button
                      onClick={() => handleToggleSource(src?.id, src?.enabled)}
                      disabled={togglingSourceId === src?.id}
                      className="ml-4 p-1 rounded-lg text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                      title={src?.enabled ? "Disable provider stream" : "Enable provider stream"}
                    >
                      {src?.enabled ? (
                        <ToggleRight className="w-7 h-7 text-indigo-600" />
                      ) : (
                        <ToggleLeft className="w-7 h-7 text-slate-400" />
                      )}
                    </button>
                  </div>
 
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-50 text-[11px] text-slate-500 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 font-sans block uppercase">Driver Profile</span>
                      <span className="font-semibold text-slate-700">{src?.adapterType}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-sans block uppercase">Identifier REF</span>
                      <span className="text-slate-600 block truncate">{src?.id}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Jobs list */}
      {activeTab === "jobs" && (
        <div className="space-y-4">
          {safeArray(jobs).length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-lg text-slate-400">
              <p className="text-sm font-medium">No ingest jobs mapped</p>
            </div>
          ) : (
            <div className="space-y-3">
              {safeArray(jobs).map((job: any) => {
                const parentSource = safeArray(sources).find((s: any) => s.id === job?.sourceId);
                const isExecutable = job?.enabled && (parentSource ? parentSource.enabled : false);

                return (
                  <div 
                    key={job?.id}
                    className={`border rounded-xl p-5 hover:bg-slate-50/20 transition-all ${isExecutable ? "border-slate-100 bg-white" : "border-slate-100 bg-slate-50/40 opacity-75"}`}
                  >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-sans font-semibold text-slate-900 text-sm">{job?.name}</h4>
                          <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded font-mono border border-indigo-100 uppercase">
                            {job?.importType}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">{job?.description}</p>
                        
                        <div className="flex items-center space-x-3 text-[11px] text-slate-400 pt-1">
                          <span className="flex items-center space-x-1">
                            <Server className="w-3.5 h-3.5" />
                            <span>Source: <strong>{parentSource?.name || job?.sourceId}</strong></span>
                          </span>
                          <span>•</span>
                          <span>Job ID: <strong className="font-mono">{job?.id}</strong></span>
                        </div>
                      </div>
 
                      <div className="shrink-0">
                        <button
                          onClick={() => handleRunImport(job?.id)}
                          disabled={runningJobId === job?.id || !isExecutable}
                          className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-500 text-white text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current text-white shrink-0" />
                          <span>{runningJobId === job?.id ? "Processing Ingest..." : "Run Import"}</span>
                        </button>
                        {!isExecutable && (
                          <span className="text-[10px] text-slate-400 block text-center mt-1">Provider disabled</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Recent runs logs */}
      {activeTab === "runs" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dynamic Trace Histories</h5>
          </div>

          {runs.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center border rounded-lg border-dashed">No recent run traces captured. Run an ingestion job above to populate records.</p>
          ) : (
            <div className="space-y-3">
              {runs.map((run) => (
                <div 
                  key={run.id}
                  className="bg-white border border-slate-100 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-200 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs text-slate-800">Route Ref: {run.id}</span>
                      {getStatusBadge(run.status)}
                    </div>
                    <p className="text-xs text-slate-500">
                      Job Ref: <strong className="font-mono text-slate-705">{run.jobId}</strong> | Type: <span className="font-mono text-indigo-700 uppercase">{run.importType}</span>
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Started: {new Date(run.startedAt).toLocaleString()}
                      {run.completedAt && ` | Finished: ${new Date(run.completedAt).toLocaleString()}`}
                    </p>
                    {run.errorMessage && (
                      <p className="text-xs text-rose-600 bg-rose-50/50 p-2 rounded border border-rose-100 font-sans mt-2">
                        <strong>Error Message:</strong> {run.errorMessage}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 shrink-0 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                    <div className="text-center min-w-16">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase font-mono tracking-wide">Processed</span>
                      <span className="font-mono text-sm font-bold text-slate-800">{run?.recordsProcessed ?? 0}</span>
                    </div>
                    <div className="border-l border-slate-200 h-6"></div>
                    <div className="text-center min-w-16">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase font-mono tracking-wide text-emerald-600">Imported</span>
                      <span className="font-mono text-sm font-bold text-emerald-600">{run?.recordsImported ?? 0}</span>
                    </div>
                    <div className="border-l border-slate-200 h-6"></div>
                    <div className="text-center min-w-16">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase font-mono tracking-wide text-rose-600">Rejected</span>
                      <span className="font-mono text-sm font-bold text-rose-600">{run?.recordsRejected ?? 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
