/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  RefreshCw, 
  Play, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Server, 
  Database, 
  Calendar, 
  List, 
  Eye, 
  Clock, 
  ArrowUpRight, 
  Check, 
  X, 
  Lock,
  ChevronRight,
  ShieldAlert,
  HelpCircle,
  FileText
} from 'lucide-react';
import { Card, Alert, Button, Input, Select, LoadingSpinner } from './ui';
import { SemiSharpApi, ApiError } from '../api';

interface AdminConsoleProps {
  season: number;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({ season }) => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState<boolean>(false);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [loadingSelectedJob, setLoadingSelectedJob] = useState<boolean>(false);
  const [seasonInput, setSeasonInput] = useState<string>(String(season));
  const [confirmRefreshOpen, setConfirmRefreshOpen] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<boolean>(false);
  
  // Job execution states
  const [submittingJob, setSubmittingJob] = useState<boolean>(false);
  const [activeJobId, setActiveJobId] = useState<string | number | null>(null);
  const [pollingMessage, setPollingMessage] = useState<string | null>(null);
  const [timeoutMessage, setTimeoutMessage] = useState<string | null>(null);

  // Poll state management
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollStartRef = useRef<number>(0);

  // Retrieve basic auth from sessionStorage
  const getAuthString = (): string | null => {
    return sessionStorage.getItem('semisharp_admin_auth');
  };

  const handleApiError = (err: any) => {
    if (err instanceof ApiError) {
      if (err.status === 401) {
        setAuthError(true);
        setActiveJobId(null);
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        return;
      }
      setApiError(err.message);
    } else {
      setApiError(err?.message || 'A network error occurred connecting to the backend.');
    }
  };

  // Fetch job history (GET /admin/jobs?limit=25)
  const fetchJobs = async (silent = false) => {
    const authString = getAuthString();
    if (!authString) {
      setAuthError(true);
      return;
    }

    if (!silent) {
      setLoadingJobs(true);
      setApiError(null);
    }

    try {
      const response = await SemiSharpApi.getAdminJobs(authString, 25);
      // Backend might return wrapped jobs array or straight array
      const jobsList = Array.isArray(response) ? response : (response?.jobs || []);
      setJobs(jobsList);
      
      // If a job is selected, refresh its details from the list or fetch it specifically
      if (selectedJob) {
        const updated = jobsList.find((j: any) => j.job_id === selectedJob.job_id);
        if (updated) {
          setSelectedJob(updated);
        }
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      if (!silent) {
        setLoadingJobs(false);
      }
    }
  };

  // Fetch specific job details (GET /admin/jobs/{job_id})
  const selectJob = async (jobId: string | number) => {
    const authString = getAuthString();
    if (!authString) {
      setAuthError(true);
      return;
    }

    setLoadingSelectedJob(true);
    setApiError(null);
    try {
      const job = await SemiSharpApi.getAdminJob(authString, jobId);
      setSelectedJob(job);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoadingSelectedJob(false);
    }
  };

  // Polling logic
  const startPolling = (jobId: string | number) => {
    // Clear any existing poll
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
    }

    setActiveJobId(jobId);
    pollStartRef.current = Date.now();
    setPollingMessage(`Submitted Job ID: ${jobId}. Monitoring status...`);
    setTimeoutMessage(null);

    pollTimerRef.current = setInterval(async () => {
      const authString = getAuthString();
      if (!authString) {
        setAuthError(true);
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        return;
      }

      // 5 Minutes timeout check (300,000 ms)
      if (Date.now() - pollStartRef.current > 300000) {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        setActiveJobId(null);
        setPollingMessage(null);
        setTimeoutMessage('The operation monitoring has timed out (5 minutes limit reached). The background worker might still be executing the task.');
        // Refresh job list once at timeout
        fetchJobs(true);
        return;
      }

      try {
        const job = await SemiSharpApi.getAdminJob(authString, jobId);
        
        // Update selection if the user is looking at this job
        setSelectedJob(job);
        
        // Silently refresh the list to keep background state updated
        fetchJobs(true);

        if (job.status === 'completed' || job.status === 'failed') {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setActiveJobId(null);
          setPollingMessage(null);
          
          if (job.status === 'completed') {
            // Completed state
          } else {
            // Failed state
          }
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          setAuthError(true);
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setActiveJobId(null);
          setPollingMessage(null);
          return;
        }
        // Transient network error during polling, we can let it retry next tick
        console.warn('Poll fetch failed, retrying...', err);
      }
    }, 2000);
  };

  // Submit Worker Health Check (POST /admin/jobs)
  const handleRunHealthCheck = async () => {
    const authString = getAuthString();
    if (!authString) {
      setAuthError(true);
      return;
    }

    setSubmittingJob(true);
    setSubmitError(null);
    setApiError(null);
    setTimeoutMessage(null);

    const payload = {
      job_type: 'health_check',
      request_payload: {
        message: 'Admin Console health check'
      }
    };

    try {
      const response = await SemiSharpApi.createAdminJob(authString, payload);
      const jobId = response.job_id || response.id;
      if (jobId) {
        // Automatically fetch detail and start polling
        await selectJob(jobId);
        startPolling(jobId);
      } else {
        throw new Error('No Job ID returned from server.');
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setAuthError(true);
      } else {
        setSubmitError(err instanceof Error ? err.message : 'Failed to submit health check.');
      }
    } finally {
      setSubmittingJob(false);
      fetchJobs(true);
    }
  };

  // Submit NFLVerse Schedule Refresh (POST /admin/jobs)
  const handleRefreshSchedule = async () => {
    const authString = getAuthString();
    if (!authString) {
      setAuthError(true);
      return;
    }

    setConfirmRefreshOpen(false);
    setSubmittingJob(true);
    setSubmitError(null);
    setApiError(null);
    setTimeoutMessage(null);

    const selectedSeason = parseInt(seasonInput, 10);
    const payload = {
      job_type: 'nflverse_schedule_refresh',
      request_payload: {
        season: selectedSeason
      }
    };

    try {
      const response = await SemiSharpApi.createAdminJob(authString, payload);
      const jobId = response.job_id || response.id;
      if (jobId) {
        // Automatically fetch detail and start polling
        await selectJob(jobId);
        startPolling(jobId);
      } else {
        throw new Error('No Job ID returned from server.');
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setAuthError(true);
      } else {
        setSubmitError(err instanceof Error ? err.message : 'Failed to submit schedule refresh.');
      }
    } finally {
      setSubmittingJob(false);
      fetchJobs(true);
    }
  };

  // Setup initial fetch and cleanup
  useEffect(() => {
    const authString = getAuthString();
    if (!authString) {
      setAuthError(true);
    } else {
      fetchJobs();
    }

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

  // Helper to style status badges
  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'queued':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'running':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'failed':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'retry':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  // Generate 4-digit seasons between 1999 and 2100
  const generateSeasonOptions = () => {
    const options = [];
    for (let y = 1999; y <= 2100; y++) {
      options.push({ value: y, label: String(y) });
    }
    return options;
  };

  // Format bytes for display
  const formatBytes = (bytes: number | null | undefined): string => {
    if (bytes === null || bytes === undefined) return 'N/A';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Return full authentication blocker if missing or 401
  if (authError) {
    return (
      <div className="space-y-6 animate-fade-in" id="admin_auth_blocker">
        <Alert
          type="error"
          title="Administrative Session Required"
          message="Please sign out and sign back in to establish a secure operations console session. Your administrator credentials must be verified for background job access."
          className="rounded-2xl p-6 border-rose-200 shadow-md bg-rose-50 text-rose-900"
        />
        <Card className="p-10 border border-slate-200/80 shadow-3xs flex flex-col items-center justify-center text-center space-y-4 max-w-xl mx-auto bg-white mt-4">
          <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-rose-600">
            <Lock className="w-10 h-10" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Admin Authentication Refused</h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
            Access to server-side jobs, task dispatching, and schedule synchronizers is restricted to authenticated administrators. Hardcoded fallbacks are disabled.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" id="admin_console_wrapper">
      
      {/* Dynamic Alerts / Banners */}
      {apiError && (
        <Alert 
          type="error" 
          title="API Operational Error" 
          message={apiError} 
          className="rounded-xl"
        />
      )}

      {submitError && (
        <Alert 
          type="error" 
          title="Submission Refused" 
          message={submitError} 
          className="rounded-xl"
        />
      )}

      {timeoutMessage && (
        <Alert 
          type="warning" 
          title="Monitoring Timeout" 
          message={timeoutMessage} 
          className="rounded-xl"
        />
      )}

      {activeJobId && pollingMessage && (
        <div className="bg-blue-50/80 border border-blue-100 rounded-xl p-4 flex items-center justify-between shadow-3xs">
          <div className="flex items-center gap-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </div>
            <span className="text-xs font-semibold text-blue-800 font-mono">
              {pollingMessage}
            </span>
          </div>
          <div className="text-[10px] text-blue-500 font-mono flex items-center gap-1.5 bg-blue-100/60 border border-blue-100/80 px-2.5 py-1 rounded-md">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            <span>Polling every 2s</span>
          </div>
        </div>
      )}

      {/* Grid: Operations controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="admin_system_operations_grid">
        
        {/* SECTION 1 — SYSTEM OPERATIONS */}
        <Card className="flex flex-col justify-between border border-slate-100 bg-white" id="section_system_operations">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-700">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wider">Worker Health Check</h3>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold block">Section 1</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Submit a lightweight background job to confirm the SemiSharp worker, queue, and database result pipeline are operational.
            </p>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-100/80 flex items-center justify-between">
            <div className="text-[11px] text-slate-400 font-mono">
              Job Type: <span className="font-bold text-slate-600">health_check</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              isLoading={submittingJob && !confirmRefreshOpen}
              disabled={submittingJob || !!activeJobId}
              onClick={handleRunHealthCheck}
              className="font-mono text-xs border-slate-300 font-bold"
              id="btn_run_health_check"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Run Health Check
            </Button>
          </div>
        </Card>

        {/* SECTION 2 — NFLVERSE SCHEDULE */}
        <Card className="flex flex-col justify-between border border-slate-100 bg-white" id="section_nflverse_schedule">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-700">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wider">Refresh NFLVerse Schedule</h3>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold block">Section 2</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Retrieve the selected season schedule from NFLVerse, validate the exported file, and import the schedule into PostgreSQL.
            </p>

            <div className="pt-2">
              <Select
                id="season_select"
                label="Target Season"
                options={generateSeasonOptions()}
                value={seasonInput}
                onChange={(e) => setSeasonInput(e.target.value)}
                disabled={submittingJob || !!activeJobId}
                className="max-w-xs"
              />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100/80 flex items-center justify-between">
            <div className="text-[11px] text-slate-400 font-mono">
              Job Type: <span className="font-bold text-slate-600">nflverse_schedule_refresh</span>
            </div>
            <Button
              variant="primary"
              size="sm"
              isLoading={submittingJob && confirmRefreshOpen}
              disabled={submittingJob || !!activeJobId}
              onClick={() => setConfirmRefreshOpen(true)}
              className="font-mono text-xs font-bold"
              id="btn_refresh_schedule"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Schedule
            </Button>
          </div>
        </Card>
      </div>

      {/* Confirmation Modal Overlay (Pure CSS & state overlay to stay clean) */}
      <AnimatePresence>
        {confirmRefreshOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden"
              id="confirmation_modal"
            >
              <div className="p-6 space-y-4">
                <div className="flex gap-3 items-start">
                  <div className="p-2.5 bg-amber-50 border border-amber-100 text-amber-600 rounded-xl shrink-0">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-slate-900">Confirm Schedule Refresh</h3>
                    <p className="text-xs text-slate-500 font-mono">Target Season: {seasonInput}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                  Refresh the NFLVerse schedule for <span className="font-bold text-slate-900">{seasonInput}</span>?
                  <br /><br />
                  This operation will retrieve, validate, and import the season schedule. Existing games may be updated through the backend’s idempotent import process.
                </p>
              </div>

              <div className="bg-slate-50 px-6 py-4 flex gap-3 border-t border-slate-100">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1 font-mono font-bold" 
                  onClick={() => setConfirmRefreshOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  size="sm"
                  className="flex-1 font-mono font-bold" 
                  onClick={handleRefreshSchedule}
                >
                  Proceed
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Grid: History and Details */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6" id="admin_history_and_details_grid">
        
        {/* SECTION 3 — RECENT JOBS TABLE */}
        <Card className="xl:col-span-2 border border-slate-100 bg-white flex flex-col" id="section_recent_jobs">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-600">
                <List className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Recent Job History</h3>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              isLoading={loadingJobs}
              onClick={() => fetchJobs(false)}
              className="text-xs font-mono font-bold border border-slate-200 bg-white"
              id="btn_refresh_job_history"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Job History
            </Button>
          </div>

          <div className="overflow-x-auto -mx-6 mt-4">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden border-t border-slate-100">
                {loadingJobs && jobs.length === 0 ? (
                  <LoadingSpinner size="md" message="Retrieving background jobs audit log..." />
                ) : jobs.length === 0 ? (
                  <div className="p-10 text-center space-y-2 text-slate-400 font-mono">
                    <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs">No recent jobs found on this server node.</p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-slate-100 text-left">
                    <thead className="bg-slate-50 font-mono text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      <tr>
                        <th className="px-6 py-3">Job ID</th>
                        <th className="px-6 py-3">Job Type</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Created</th>
                        <th className="px-6 py-3">Worker ID</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-600 font-mono">
                      {jobs.map((job) => {
                        const isSelected = selectedJob && (selectedJob.job_id === job.job_id || selectedJob.id === job.id);
                        return (
                          <tr 
                            key={job.job_id || job.id} 
                            className={`hover:bg-slate-50/50 transition-colors ${isSelected ? 'bg-slate-50 font-medium' : ''}`}
                          >
                            <td className="px-6 py-3.5 font-bold text-slate-900 max-w-[120px] truncate" title={job.job_id || job.id}>
                              {job.job_id || job.id}
                            </td>
                            <td className="px-6 py-3.5">
                              <span className="bg-slate-100 border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded-sm font-semibold text-[10px]">
                                {job.job_type}
                              </span>
                            </td>
                            <td className="px-6 py-3.5">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getStatusStyle(job.status)}`}>
                                {job.status}
                              </span>
                            </td>
                            <td className="px-6 py-3.5 text-slate-400">
                              {job.created_at ? new Date(job.created_at).toLocaleTimeString() : 'N/A'}
                            </td>
                            <td className="px-6 py-3.5 text-slate-400 truncate max-w-[100px]" title={job.worker_id || 'unassigned'}>
                              {job.worker_id || 'unassigned'}
                            </td>
                            <td className="px-6 py-3.5 text-right">
                              <Button
                                variant={isSelected ? 'secondary' : 'outline'}
                                size="sm"
                                onClick={() => selectJob(job.job_id || job.id)}
                                className="px-2.5 py-1 text-[10px] font-bold"
                              >
                                <Eye className="w-3 h-3" />
                                Details
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* SECTION 4 — JOB DETAIL */}
        <Card className="border border-slate-100 bg-white flex flex-col h-full" id="section_job_detail">
          <div className="pb-4 border-b border-slate-100 flex items-center gap-2">
            <div className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-600">
              <Eye className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Job Inspector</h3>
          </div>

          <div className="flex-1 mt-4 space-y-5 overflow-y-auto">
            {!selectedJob ? (
              <div className="p-8 text-center text-slate-400 font-mono space-y-2">
                <HelpCircle className="w-8 h-8 mx-auto text-slate-200" />
                <p className="text-xs leading-relaxed">Select a background job from the audit log table to view active payloads, stdout streams, and error diagnostics.</p>
              </div>
            ) : loadingSelectedJob ? (
              <LoadingSpinner size="sm" message="Fetching job metrics..." />
            ) : (
              <div className="space-y-5 animate-fade-in text-xs font-mono text-slate-600">
                
                {/* ID and Status Pill */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100/80 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase font-mono">Job ID / Type</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${getStatusStyle(selectedJob.status)}`}>
                      {selectedJob.status}
                    </span>
                  </div>
                  <div className="text-slate-900 font-extrabold truncate max-w-full block" title={selectedJob.job_id || selectedJob.id}>
                    {selectedJob.job_id || selectedJob.id}
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold bg-slate-100/60 border border-slate-200/40 rounded-sm px-1.5 py-0.5 inline-block mt-1">
                    {selectedJob.job_type}
                  </div>
                </div>

                {/* Audit Fields */}
                <div className="space-y-2 border-b border-slate-100 pb-4">
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Metrics & Metadata</h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Created</span>
                      <span className="text-slate-800 break-words">{selectedJob.created_at ? new Date(selectedJob.created_at).toLocaleString() : 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Started</span>
                      <span className="text-slate-800 break-words">{selectedJob.started_at ? new Date(selectedJob.started_at).toLocaleString() : 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Completed</span>
                      <span className="text-slate-800 break-words">{selectedJob.completed_at ? new Date(selectedJob.completed_at).toLocaleString() : 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Claimed</span>
                      <span className="text-slate-800 break-words">{selectedJob.claimed_at ? new Date(selectedJob.claimed_at).toLocaleString() : 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Worker ID</span>
                      <span className="text-slate-800 break-all">{selectedJob.worker_id || 'unassigned'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Attempt Count</span>
                      <span className="text-slate-800 font-bold">{selectedJob.attempt_count ?? 0}</span>
                    </div>
                  </div>
                </div>

                {/* Specific Backend Results when NFLVerse Job is complete */}
                {selectedJob.job_type === 'nflverse_schedule_refresh' && selectedJob.status === 'completed' && selectedJob.result_payload && (
                  <div className="space-y-2.5 bg-emerald-50/40 border border-emerald-100 rounded-xl p-3.5">
                    <h4 className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Import Achievements
                    </h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[11px] text-slate-700">
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-semibold">Season</span>
                        <span className="font-extrabold text-slate-900">{selectedJob.result_payload.season ?? 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-semibold">Source</span>
                        <span className="font-bold text-slate-900">{selectedJob.result_payload.source ?? 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-semibold">Rows Validated</span>
                        <span className="font-bold text-slate-900">{selectedJob.result_payload.rows_validated ?? 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-semibold">Unique Games</span>
                        <span className="font-bold text-slate-900">{selectedJob.result_payload.unique_games ?? 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-semibold">File Size</span>
                        <span className="font-bold text-slate-900">{formatBytes(selectedJob.result_payload.file_size_bytes)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-semibold">Completed At</span>
                        <span className="font-bold text-slate-900">{selectedJob.result_payload.completed_at ? new Date(selectedJob.result_payload.completed_at).toLocaleString() : 'N/A'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500 block text-[9px] uppercase font-semibold">Output File</span>
                        <span className="font-mono text-[10px] break-all bg-white border border-slate-200 rounded px-1.5 py-0.5 block mt-1 select-all">
                          {selectedJob.result_payload.output_file ?? 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Stdout Streams for details inspection */}
                    {selectedJob.result_payload.export_stdout && (
                      <div className="space-y-1 pt-1.5">
                        <span className="text-slate-500 block text-[9px] uppercase font-semibold">Export Standard Output</span>
                        <pre className="bg-slate-950 text-slate-200 p-2 rounded-lg text-[9px] font-mono overflow-x-auto max-h-32 select-all leading-relaxed border border-slate-800">
                          {selectedJob.result_payload.export_stdout}
                        </pre>
                      </div>
                    )}

                    {selectedJob.result_payload.import_stdout && (
                      <div className="space-y-1 pt-1.5">
                        <span className="text-slate-500 block text-[9px] uppercase font-semibold">Import Standard Output</span>
                        <pre className="bg-slate-950 text-slate-200 p-2 rounded-lg text-[9px] font-mono overflow-x-auto max-h-32 select-all leading-relaxed border border-slate-800">
                          {selectedJob.result_payload.import_stdout}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Error Banner */}
                {selectedJob.error_message && (
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-3.5 space-y-1 text-rose-900">
                    <span className="text-[10px] font-extrabold text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      Failure Diagnosis
                    </span>
                    <p className="text-xs break-words font-semibold font-mono leading-relaxed">
                      {selectedJob.error_message}
                    </p>
                  </div>
                )}

                {/* Request Payload */}
                <div className="space-y-1">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Request Payload</span>
                  <pre className="bg-slate-900 text-slate-100 p-3 rounded-xl overflow-x-auto text-[10px] font-mono max-h-48 leading-relaxed">
                    {JSON.stringify(selectedJob.request_payload || {}, null, 2)}
                  </pre>
                </div>

                {/* Result Payload (Only if not already beautifully rendered as schedule results above) */}
                {!(selectedJob.job_type === 'nflverse_schedule_refresh' && selectedJob.status === 'completed') && (
                  <div className="space-y-1">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Result Payload</span>
                    <pre className="bg-slate-900 text-slate-100 p-3 rounded-xl overflow-x-auto text-[10px] font-mono max-h-48 leading-relaxed">
                      {JSON.stringify(selectedJob.result_payload || {}, null, 2)}
                    </pre>
                  </div>
                )}

              </div>
            )}
          </div>
        </Card>

      </div>

    </div>
  );
};
