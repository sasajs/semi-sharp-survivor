import React, { useState, useEffect } from "react";
import { History, FileText, CheckCircle, RefreshCw, XCircle, Loader2, Calendar, User, Clock } from "lucide-react";

export const ImportHistoryManager: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/data/import-jobs");
      if (!res.ok) throw new Error("Failed to fetch import jobs.");
      const data = await res.json();
      setJobs(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectJob = async (jobId: string) => {
    try {
      const res = await fetch(`/api/admin/data/import-jobs/${jobId}`);
      if (!res.ok) throw new Error("Failed to fetch job details.");
      const data = await res.json();
      setSelectedJob(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <History className="w-4 h-4 text-indigo-500" />
          Ingestion Audit Trail Logs
        </h4>
        <button
          onClick={fetchJobs}
          className="px-2.5 py-1 text-[11px] font-extrabold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:bg-slate-50 border border-slate-200 rounded-lg cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Audit Trail
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-2">
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
          <p className="text-xs text-slate-500">Querying ingestion receipts from DB...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-xs text-rose-800 leading-relaxed">
          {error}
        </div>
      ) : jobs.length === 0 ? (
        <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-xs">
          No ingestion jobs have been run yet. Use the Schedule Imports panel to execute a pipeline.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List of Jobs */}
          <div className="lg:col-span-2 overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-xs">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 font-bold text-slate-500">
                <tr>
                  <th className="px-4 py-3">File / Provider</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Rows</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Executed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {jobs.map((job) => {
                  const isSelected = selectedJob?.id === job.id;
                  return (
                    <tr
                      key={job.id}
                      onClick={() => handleSelectJob(job.id)}
                      className={`hover:bg-slate-50 cursor-pointer transition ${isSelected ? "bg-indigo-50/50" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-extrabold text-slate-900 truncate max-w-[180px]" title={job.file_name}>
                          {job.file_name || "Unknown File"}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{job.provider}</div>
                      </td>
                      <td className="px-4 py-3">
                        {job.status === "completed" && (
                          <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Success
                          </span>
                        )}
                        {job.status === "dry_run" && (
                          <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Dry Run
                          </span>
                        )}
                        {job.status === "failed" && (
                          <span className="text-[9px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Failed
                          </span>
                        )}
                        {job.status === "pending" && (
                          <span className="text-[9px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-700">
                        {job.rows_processed || 0} / {job.rows_read || 0}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500">
                        {job.duration || 0} ms
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {job.started_at ? new Date(job.started_at).toLocaleString() : "N/A"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Job Details Sidebar Panel */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
            {selectedJob ? (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-3">
                  <span className="text-[9px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full block w-fit mb-1">
                    JOB: {selectedJob.id.substring(0, 8)}...
                  </span>
                  <h5 className="text-xs font-black text-slate-900 truncate">
                    {selectedJob.file_name}
                  </h5>
                </div>

                {/* Technical Metrics list */}
                <div className="space-y-2 text-[11px] text-slate-600">
                  <div className="flex justify-between items-center bg-white px-2.5 py-1.5 rounded-lg border border-slate-100">
                    <span className="font-bold flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400" /> Operator</span>
                    <span className="font-mono text-slate-950">{selectedJob.initiated_by}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white px-2.5 py-1.5 rounded-lg border border-slate-100">
                    <span className="font-bold flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" /> Duration</span>
                    <span className="font-mono text-slate-950">{selectedJob.duration || 0} ms</span>
                  </div>
                  <div className="flex justify-between items-center bg-white px-2.5 py-1.5 rounded-lg border border-slate-100">
                    <span className="font-bold flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Completed</span>
                    <span className="font-mono text-slate-950">
                      {selectedJob.completed_at ? new Date(selectedJob.completed_at).toLocaleTimeString() : "Pending"}
                    </span>
                  </div>
                </div>

                {/* File Metadata */}
                {selectedJob.files && selectedJob.files.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Associated File</span>
                    <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[10px] leading-relaxed shadow-inner">
                      <p className="text-indigo-400 truncate">{selectedJob.files[0].filename}</p>
                      <p className="text-slate-500 mt-1">Size: {(selectedJob.files[0].file_size / 1024).toFixed(2)} KB</p>
                      <p className="text-slate-500 truncate mt-0.5">SHA: {selectedJob.files[0].checksum}</p>
                    </div>
                  </div>
                )}

                {/* Errors & Warnings */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Errors & Warnings ({selectedJob.errors?.length || 0})</span>
                  {selectedJob.errors && selectedJob.errors.length > 0 ? (
                    <div className="max-h-40 overflow-y-auto divide-y divide-slate-200/50 bg-white border border-slate-200 rounded-xl px-3 py-1 pr-1.5">
                      {selectedJob.errors.map((err: any, idx: number) => (
                        <div key={idx} className="py-2 text-[11px] leading-relaxed flex flex-col gap-0.5">
                          <div className="flex items-center justify-between gap-3">
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${err.severity === 'error' ? 'text-rose-700 bg-rose-50' : 'text-amber-700 bg-amber-50'}`}>
                              {err.severity.toUpperCase()}
                            </span>
                            {err.row_index && <span className="text-[9px] font-mono text-slate-400">Row {err.row_index}</span>}
                          </div>
                          <span className="text-slate-700 font-medium mt-1">{err.error_message}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex gap-1.5 items-center">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      No errors or warnings recorded.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 text-xs">
                <FileText className="w-8 h-8 text-slate-300 mb-2" />
                Select a job from the list to display details, logs, and errors.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
