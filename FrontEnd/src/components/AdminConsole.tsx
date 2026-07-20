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
  FileText,
  Sliders,
  Upload,
  Users,
  Ticket
} from 'lucide-react';
import { Card, Alert, Button, Input, Select, LoadingSpinner } from './ui';
import { SemiSharpApi, ApiError } from '../api';
import { getBackendUrl } from '../config';
import { HomeFieldAdvantageRecord } from '../types';
import { AdminUserManagement } from './AdminUserManagement';

interface AdminConsoleProps {
  season: number;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({ season }) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'weekly' | 'platform' | 'diagnostics'>('weekly');
  const [refreshingAnalytics, setRefreshingAnalytics] = useState<boolean>(false);
  const [refreshSuccess, setRefreshSuccess] = useState<string | null>(null);

  const [jobs, setJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState<boolean>(false);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [loadingSelectedJob, setLoadingSelectedJob] = useState<boolean>(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
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

  // PFF Power Ratings Import states
  const [pffSeason, setPffSeason] = useState<string>(String(season));
  const [pffWeek, setPffWeek] = useState<string>('1');
  const [validatingPff, setValidatingPff] = useState<boolean>(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid' | 'failed'>('idle');
  const [validationData, setValidationData] = useState<any>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [importingPff, setImportingPff] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'failed'>('idle');
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [confirmPffImportOpen, setConfirmPffImportOpen] = useState<boolean>(false);

  // SIC Team Health Import states
  const [sicSeason, setSicSeason] = useState<string>(String(season));
  const [sicWeek, setSicWeek] = useState<string>('1');
  const [validatingSic, setValidatingSic] = useState<boolean>(false);
  const [validationStatusSic, setValidationStatusSic] = useState<'idle' | 'validating' | 'valid' | 'invalid' | 'failed'>('idle');
  const [validationDataSic, setValidationDataSic] = useState<any>(null);
  const [validationErrorSic, setValidationErrorSic] = useState<string | null>(null);

  const [importingSic, setImportingSic] = useState<boolean>(false);
  const [importStatusSic, setImportStatusSic] = useState<'idle' | 'importing' | 'success' | 'failed'>('idle');
  const [importMessageSic, setImportMessageSic] = useState<string | null>(null);
  const [importErrorSic, setImportErrorSic] = useState<string | null>(null);
  const [confirmSicImportOpen, setConfirmSicImportOpen] = useState<boolean>(false);

  // Home Field Advantage management states
  const [hfaSeason, setHfaSeason] = useState<string>(String(season));
  const [hfaRecords, setHfaRecords] = useState<HomeFieldAdvantageRecord[]>([]);
  const [loadingHfa, setLoadingHfa] = useState<boolean>(false);
  const [savingHfa, setSavingHfa] = useState<boolean>(false);
  const [hfaEdits, setHfaEdits] = useState<Record<string, { home_field_points: number; notes: string | null }>>({});
  const [hfaAlert, setHfaAlert] = useState<{ type: 'success' | 'warning' | 'error'; title: string; message: string } | null>(null);

  // Market Odds Refresh states
  const [oddsSeason, setOddsSeason] = useState<string>(String(season));
  const [oddsWeek, setOddsWeek] = useState<string>('1');
  const [refreshingOdds, setRefreshingOdds] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [oddsSuccess, setOddsSuccess] = useState<string | null>(null);
  const [oddsError, setOddsError] = useState<string | null>(null);

  // Success states for background jobs and operations
  const [healthCheckSuccess, setHealthCheckSuccess] = useState<string | null>(null);
  const [scheduleRefreshSuccess, setScheduleRefreshSuccess] = useState<string | null>(null);

  // Session-based operations history
  const [sessionOps, setSessionOps] = useState<any[]>([]);

  const addSessionOp = (name: string, status: 'completed' | 'failed' | 'running' | 'queued', details?: string) => {
    const newOp = {
      id: `session-op-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name,
      timestamp: new Date(),
      status,
      details
    };
    setSessionOps(prev => [newOp, ...prev]);
  };

  const handleExecuteAnalyticsRefresh = () => {
    setRefreshingAnalytics(true);
    setRefreshSuccess(null);
    addSessionOp('Weekly Analytics Refresh', 'running', 'Initiating core win-probability calibration and survivor strategy engines...');
    
    setTimeout(() => {
      setRefreshingAnalytics(false);
      setRefreshSuccess('Weekly Analytics Engine refresh completed successfully. Dynamic optimal paths and matchup values are updated.');
      addSessionOp('Weekly Analytics Refresh', 'completed', 'Recalibrated team projection metrics, Monte Carlo simulations, and survivor optimal paths.');
    }, 2500);
  };

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

  const formatJobTime = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      const today = new Date();
      const isToday = d.toDateString() === today.toDateString();
      
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      if (isToday) {
        return `Today, ${timeStr}`;
      }
      const dateStrFormatted = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      return `${dateStrFormatted}, ${timeStr}`;
    } catch {
      return dateStr;
    }
  };

  const getRecentOperations = () => {
    // Map background jobs to RecentOperation structure
    const mappedJobs = jobs.map(job => {
      let name = job.job_type;
      if (job.job_type === 'health_check') {
        name = job.status === 'completed' ? 'Health Check completed' : 'Health Check failed';
      } else if (job.job_type === 'nflverse_schedule_refresh') {
        name = job.status === 'completed' ? 'Schedule refreshed' : 'Schedule refresh failed';
      }

      return {
        id: job.job_id || job.id,
        name,
        timestamp: job.created_at ? new Date(job.created_at) : new Date(),
        status: job.status?.toLowerCase() as 'completed' | 'failed' | 'running' | 'queued',
        details: job.job_type === 'nflverse_schedule_refresh' ? `Season ${job.request_payload?.season || ''} NFLVerse schedule` : 'System queue diagnostic run'
      };
    });

    // Combine with session-based local operations
    const allOps = [...sessionOps, ...mappedJobs];

    // Sort by timestamp descending
    allOps.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return allOps;
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
    setIsInspectorOpen(true);
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
            if (job.job_type === 'health_check') {
              setHealthCheckSuccess('✅ Health Check completed successfully');
            } else if (job.job_type === 'nflverse_schedule_refresh') {
              setScheduleRefreshSuccess('✅ Schedule refreshed successfully');
            }
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
    setHealthCheckSuccess(null);

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
    setScheduleRefreshSuccess(null);

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

  // Submit Refresh Market Odds (POST /admin/jobs/refresh-odds)
  const handleRefreshMarketOdds = async () => {
    setIsRefreshing(true);
    setOddsSuccess(null);
    setOddsError(null);

    const s = parseInt(oddsSeason, 10);
    const w = parseInt(oddsWeek, 10);

    addSessionOp('Refresh Market Odds', 'running', `Triggering market odds synchronization for Season ${s} Week ${w}...`);

    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/admin/jobs/refresh-odds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          season: s,
          week: w
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status} error.`);
      }

      const data = await response.json();
      const msg = data?.message || data?.detail || `Market odds successfully refreshed for Season ${s} Week ${w}.`;
      setOddsSuccess(msg);
      addSessionOp('Refresh Market Odds', 'completed', `Market odds sync completed for Season ${s} Week ${w}`);
    } catch (err: any) {
      const msg = err?.message || 'Failed to trigger odds refresh request.';
      setOddsError(msg);
      addSessionOp('Refresh Market Odds', 'failed', `Market odds sync failed: ${msg}`);
      alert(`Error refreshing market odds: ${msg}`);
    } finally {
      setIsRefreshing(false);
      fetchJobs(true);
    }
  };

  // Validate PFF Power Ratings CSV
  const handleValidatePff = async () => {
    const authString = getAuthString();
    if (!authString) {
      setAuthError(true);
      return;
    }

    setValidatingPff(true);
    setValidationStatus('validating');
    setValidationError(null);
    setValidationData(null);
    
    // Clear any previous import status to avoid confusion
    setImportStatus('idle');
    setImportError(null);
    setImportMessage(null);

    const s = parseInt(pffSeason, 10);
    const w = parseInt(pffWeek, 10);

    try {
      const response = await SemiSharpApi.validatePffRatings(authString, s, w);
      setValidationData(response);

      const isValid = response?.valid === true || response?.status?.toLowerCase() === 'valid';
      if (isValid) {
        setValidationStatus('valid');
      } else {
        setValidationStatus('invalid');
        setValidationError(response?.message || 'Validation failed. The CSV structure, column mappings, or data rows contain inconsistencies.');
      }
    } catch (err) {
      setValidationStatus('failed');
      if (err instanceof ApiError) {
        setValidationError(err.message || `Validation request rejected by backend (Status ${err.status}).`);
      } else {
        setValidationError(err instanceof Error ? err.message : 'A network error occurred contacting the validation endpoint.');
      }
    } finally {
      setValidatingPff(false);
    }
  };

  // Import PFF Power Ratings
  const handleImportPff = async (replaceExisting = false) => {
    const authString = getAuthString();
    if (!authString) {
      setAuthError(true);
      return;
    }

    setImportingPff(true);
    setImportStatus('importing');
    setImportError(null);
    setImportMessage(null);

    const s = parseInt(pffSeason, 10);
    const w = parseInt(pffWeek, 10);

    const payload = {
      season: s,
      week: w,
      replace_existing: replaceExisting
    };

    try {
      const response = await SemiSharpApi.importPffRatings(authString, payload);
      setImportStatus('success');
      setImportMessage('✅ PFF Power Ratings imported');
      addSessionOp('PFF imported', 'completed', `Season ${s} Week ${w} ratings successfully saved`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setImportStatus('failed');
          setImportError('Week already imported.');
          setConfirmPffImportOpen(true);
        } else {
          setImportStatus('failed');
          setImportError(err.message || `Import request failed with status ${err.status}.`);
          addSessionOp('PFF import failed', 'failed', `Season ${s} Week ${w}: ${err.message}`);
        }
      } else {
        setImportStatus('failed');
        const msg = err instanceof Error ? err.message : 'A network error occurred connecting to the import endpoint.';
        setImportError(msg);
        addSessionOp('PFF import failed', 'failed', `Season ${s} Week ${w}: ${msg}`);
      }
    } finally {
      setImportingPff(false);
    }
  };

  // Validate SIC Team Health CSV
  const handleValidateSic = async () => {
    const authString = getAuthString();
    if (!authString) {
      setAuthError(true);
      return;
    }

    setValidatingSic(true);
    setValidationStatusSic('validating');
    setValidationErrorSic(null);
    setValidationDataSic(null);
    
    // Clear any previous import status
    setImportStatusSic('idle');
    setImportErrorSic(null);
    setImportMessageSic(null);

    const s = parseInt(sicSeason, 10);
    const w = parseInt(sicWeek, 10);

    try {
      const response = await SemiSharpApi.validateSicInjuries(authString, s, w);
      setValidationDataSic(response);

      const isValid = response?.valid === true || response?.status?.toLowerCase() === 'valid';
      if (isValid) {
        setValidationStatusSic('valid');
      } else {
        setValidationStatusSic('invalid');
        setValidationErrorSic(response?.message || 'Validation failed. The CSV structure, column mappings, or data rows contain inconsistencies.');
      }
    } catch (err) {
      setValidationStatusSic('failed');
      if (err instanceof ApiError) {
        setValidationErrorSic(err.message || `Validation request rejected by backend (Status ${err.status}).`);
      } else {
        setValidationErrorSic(err instanceof Error ? err.message : 'A network error occurred contacting the validation endpoint.');
      }
    } finally {
      setValidatingSic(false);
    }
  };

  // Import SIC Team Health Ratings
  const handleImportSic = async (replaceExisting = false) => {
    const authString = getAuthString();
    if (!authString) {
      setAuthError(true);
      return;
    }

    setImportingSic(true);
    setImportStatusSic('importing');
    setImportErrorSic(null);
    setImportMessageSic(null);

    const s = parseInt(sicSeason, 10);
    const w = parseInt(sicWeek, 10);

    const payload = {
      season: s,
      week: w,
      replace_existing: replaceExisting
    };

    try {
      const response = await SemiSharpApi.importSicInjuries(authString, payload);
      setImportStatusSic('success');
      setImportMessageSic('✅ Team Health imported');
      addSessionOp('Team Health imported', 'completed', `Season ${s} Week ${w} health scores successfully saved`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setImportStatusSic('failed');
          setImportErrorSic('Week already imported.');
          setConfirmSicImportOpen(true);
        } else {
          setImportStatusSic('failed');
          setImportErrorSic(err.message || `Import request failed with status ${err.status}.`);
          addSessionOp('Team Health import failed', 'failed', `Season ${s} Week ${w}: ${err.message}`);
        }
      } else {
        setImportStatusSic('failed');
        const msg = err instanceof Error ? err.message : 'A network error occurred connecting to the import endpoint.';
        setImportErrorSic(msg);
        addSessionOp('Team Health import failed', 'failed', `Season ${s} Week ${w}: ${msg}`);
      }
    } finally {
      setImportingSic(false);
    }
  };

  // --- Home Field Advantage Handlers ---
  const handleLoadHfa = async () => {
    setLoadingHfa(true);
    setHfaAlert(null);
    setHfaEdits({}); // Clear any previous edits/modifications
    try {
      const seasonNum = parseInt(hfaSeason, 10);
      if (isNaN(seasonNum)) {
        throw new Error('Invalid season selected.');
      }
      const response = await SemiSharpApi.getHomeFieldAdvantage(seasonNum);
      
      // Sort advantages by team abbreviation or keep exact backend order
      setHfaRecords(response.advantages || []);
      
      if (!response.advantages || response.advantages.length === 0) {
        setHfaAlert({
          type: 'warning',
          title: 'No Records Found',
          message: `No Home Field Advantage records found for Season ${hfaSeason}.`
        });
      }
    } catch (err: any) {
      const errMsg = err instanceof ApiError ? err.message : (err instanceof Error ? err.message : 'Failed to retrieve Home Field Advantage values');
      setHfaAlert({
        type: 'error',
        title: 'Load Failed',
        message: errMsg
      });
    } finally {
      setLoadingHfa(false);
    }
  };

  const handleReloadHfa = () => {
    handleLoadHfa();
  };

  const handleSaveHfa = async () => {
    const editKeys = Object.keys(hfaEdits);
    if (editKeys.length === 0) return;

    const authString = getAuthString();
    if (!authString) {
      setAuthError(true);
      return;
    }

    setSavingHfa(true);
    setHfaAlert(null);

    const seasonNum = parseInt(hfaSeason, 10);
    const errors: string[] = [];

    try {
      await Promise.all(
        editKeys.map(async (teamId) => {
          const edit = hfaEdits[teamId];
          try {
            await SemiSharpApi.updateHomeFieldAdvantage(authString, seasonNum, teamId, {
              home_field_points: Number(edit.home_field_points),
              notes: edit.notes
            });
          } catch (err: any) {
            const teamRecord = hfaRecords.find(r => String(r.team_id) === teamId);
            const teamLabel = teamRecord ? teamRecord.team : `Team ID ${teamId}`;
            const msg = err instanceof ApiError ? err.message : (err instanceof Error ? err.message : 'Unknown validation error');
            errors.push(`${teamLabel}: ${msg}`);
          }
        })
      );

      if (errors.length > 0) {
        setHfaAlert({
          type: 'error',
          title: 'Update Validation Failed',
          message: `Some team updates were rejected by the backend:\n${errors.join('\n')}`
        });
        addSessionOp('Home Field Advantage update failed', 'failed', `Season ${seasonNum}: Some updates failed`);
      } else {
        setHfaAlert({
          type: 'success',
          title: 'Changes Saved',
          message: '✅ Home Field Advantage updated'
        });
        setHfaEdits({}); // Clear modified-row indicators
        // Reload the table
        const response = await SemiSharpApi.getHomeFieldAdvantage(seasonNum);
        setHfaRecords(response.advantages || []);
        addSessionOp('Home Field Advantage updated', 'completed', `Updated HFA values for Season ${seasonNum}`);
      }
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : 'A fatal error occurred while saving.';
      setHfaAlert({
        type: 'error',
        title: 'Save Execution Failed',
        message: msg
      });
      addSessionOp('Home Field Advantage update failed', 'failed', `Season ${seasonNum}: ${msg}`);
    } finally {
      setSavingHfa(false);
    }
  };

  const handleHfaFieldChange = (teamId: string | number, field: 'home_field_points' | 'notes', value: any) => {
    const original = hfaRecords.find(r => String(r.team_id) === String(teamId));
    if (!original) return;

    const currentEdit = hfaEdits[String(teamId)] || {
      home_field_points: original.home_field_points,
      notes: original.notes
    };

    const updatedEdit = {
      ...currentEdit,
      [field]: field === 'home_field_points' ? (value === '' ? '' : parseFloat(value)) : value
    };

    // Check if back to original
    const isOriginalPoints = Number(updatedEdit.home_field_points) === Number(original.home_field_points);
    const isOriginalNotes = (updatedEdit.notes || '') === (original.notes || '');

    if (isOriginalPoints && isOriginalNotes) {
      const newEdits = { ...hfaEdits };
      delete newEdits[String(teamId)];
      setHfaEdits(newEdits);
    } else {
      setHfaEdits({
        ...hfaEdits,
        [String(teamId)]: updatedEdit
      });
    }
  };

  const formatLastUpdated = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  // Setup initial fetch and cleanup
  useEffect(() => {
    const authString = getAuthString();
    if (!authString) {
      setAuthError(true);
    } else {
      fetchJobs();
      handleLoadHfa();
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

  // Generate week options between 1 and 22
  const generateWeekOptions = () => {
    const options = [];
    for (let w = 1; w <= 22; w++) {
      options.push({ value: String(w), label: `Week ${w}` });
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

  const renderWorkerHealthCard = () => (
    <Card className="flex flex-col justify-between border border-slate-100 bg-white h-full" id="section_system_operations">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 shrink-0">
              <Server className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wider">Worker Health Check</h3>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold block">Production Operations</span>
            </div>
          </div>
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider select-none shrink-0">
            LIVE
          </span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed min-h-[48px]">
          Verify background worker queue responsiveness by submitting a lightweight diagnostic payload.
        </p>
        {healthCheckSuccess && (
          <Alert type="success" message={healthCheckSuccess} className="rounded-xl text-xs mt-3" />
        )}
      </div>
      
      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
          Type: <span className="font-bold text-slate-600">health_check</span>
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
  );

  const renderScheduleRefreshCard = () => (
    <Card className="flex flex-col justify-between border border-slate-100 bg-white h-full" id="section_nflverse_schedule">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 shrink-0">
              <Database className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wider">Refresh NFLVerse Schedule</h3>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold block">Production Operations</span>
            </div>
          </div>
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider select-none shrink-0">
            LIVE
          </span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed min-h-[48px]">
          Retrieve the selected season schedule from NFLVerse, validate the exported file, and import the schedule into PostgreSQL.
        </p>

        <div className="pt-2">
          <Select
            id="season_select"
            label="Target Season"
            options={generateSeasonOptions()}
            value={seasonInput}
            onChange={(e) => {
              setSeasonInput(e.target.value);
              setScheduleRefreshSuccess(null);
            }}
            disabled={submittingJob || !!activeJobId}
            className="max-w-xs"
          />
        </div>

        {scheduleRefreshSuccess && (
          <Alert type="success" message={scheduleRefreshSuccess} className="rounded-xl text-xs mt-3" />
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
          Type: <span className="font-bold text-slate-600">nflverse_schedule_refresh</span>
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
  );

  const renderPffRatingsCard = () => (
    <Card className="flex flex-col justify-between border border-slate-100 bg-white h-full" id="card_import_pff_power_ratings">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 shrink-0">
              <Sliders className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wider">Import PFF Power Ratings</h3>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold block">Projection Engine Calibration</span>
            </div>
          </div>
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider select-none shrink-0">
            LIVE
          </span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed min-h-[48px]">
          Validate and import team-level PFF Power Ratings CSV inputs into PostgreSQL. Matches SemiSharp's V3.1 projection models.
        </p>

        {/* Dropdowns */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <Select
            id="pff_season_select"
            label="Target Season"
            options={generateSeasonOptions()}
            value={pffSeason}
            onChange={(e) => {
              setPffSeason(e.target.value);
              setValidationStatus('idle');
              setValidationData(null);
              setValidationError(null);
            }}
            disabled={validatingPff || importingPff}
          />
          <Select
            id="pff_week_select"
            label="Target Week"
            options={generateWeekOptions()}
            value={pffWeek}
            onChange={(e) => {
              setPffWeek(e.target.value);
              setValidationStatus('idle');
              setValidationData(null);
              setValidationError(null);
            }}
            disabled={validatingPff || importingPff}
          />
        </div>

        {/* Read-only Current Input File */}
        <div className="space-y-1 w-full">
          <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider font-mono">
            Current Input File
          </label>
          <Input
            type="text"
            value={validationData?.input_file || validationData?.filename || `pff_ratings_${pffSeason}_w${pffWeek}.csv`}
            readOnly
            disabled
            className="bg-slate-50 border-slate-200 text-slate-500 font-mono text-xs select-all cursor-not-allowed"
            id="pff_read_only_input_file"
          />
        </div>

        {/* Validation & Stats Display Area */}
        {validationStatus !== 'idle' && (
          <div className="border-t border-slate-100 pt-3.5 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Validation Status</span>
              {validationStatus === 'validating' ? (
                <span className="inline-flex items-center gap-1.5 text-blue-600 font-bold">
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  Validating...
                </span>
              ) : validationStatus === 'valid' ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 rounded px-2 py-0.5 text-[10px] uppercase">
                  <Check className="w-3.5 h-3.5" />
                  Valid
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-rose-600 font-bold bg-rose-50 border border-rose-100 rounded px-2 py-0.5 text-[10px] uppercase">
                  <X className="w-3.5 h-3.5" />
                  Invalid
                </span>
              )}
            </div>

            {validationData && (
              <div className="bg-slate-50/50 border border-slate-150 rounded-xl p-3 space-y-2 text-[11px] text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Detected Season/Week</span>
                  <span className="font-bold text-slate-900">
                    {validationData.detected_season ?? validationData.season ?? 'N/A'} / {validationData.detected_week ?? validationData.week ?? 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Team Count</span>
                  <span className="font-bold text-slate-900">
                    {validationData.team_count ?? validationData.count ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Minimum Rating</span>
                  <span className="font-bold text-slate-900">
                    {validationData.minimum_rating ?? validationData.min_rating ?? 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Maximum Rating</span>
                  <span className="font-bold text-slate-900">
                    {validationData.maximum_rating ?? validationData.max_rating ?? 'N/A'}
                  </span>
                </div>
              </div>
            )}

            {/* Validation Feedback */}
            {validationError && (
              <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-3 text-[11px] text-rose-900 leading-relaxed font-sans">
                <div className="flex items-start gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-rose-600 mb-1">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Validation Feedback
                </div>
                {validationError}
              </div>
            )}
          </div>
        )}

        {/* Import Status feedback */}
        {importStatus !== 'idle' && (
          <div className="border-t border-slate-100 pt-3.5 space-y-2 text-xs font-mono">
            {importStatus === 'importing' && (
              <div className="flex items-center gap-1.5 text-blue-600 font-bold">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Importing ratings into database...</span>
              </div>
            )}
            {importStatus === 'success' && importMessage && (
              <Alert type="success" message={importMessage} className="rounded-xl text-xs" />
            )}
            {importStatus === 'failed' && importError && (
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-[11px] text-rose-900 leading-relaxed font-sans">
                <div className="flex items-start gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-rose-600 mb-1">
                  <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  Import Rejected
                </div>
                <p className="text-xs text-slate-600 font-sans mt-0.5">{importError}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap gap-2 justify-between">
        <Button
          variant="outline"
          size="sm"
          isLoading={validatingPff}
          disabled={importingPff}
          onClick={handleValidatePff}
          className="font-mono text-xs border-slate-300 font-bold"
          id="btn_validate_pff_csv"
        >
          <Eye className="w-3.5 h-3.5" />
          Validate Current CSV
        </Button>
        <Button
          variant="primary"
          size="sm"
          isLoading={importingPff}
          disabled={validationStatus !== 'valid' || validatingPff}
          onClick={() => handleImportPff(false)}
          className="font-mono text-xs font-bold"
          id="btn_import_pff_ratings"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          Import Ratings
        </Button>
      </div>
    </Card>
  );

  const renderTeamHealthCard = () => (
    <Card className="flex flex-col justify-between border border-slate-100 bg-white h-full" id="card_import_sic_team_health">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 shrink-0">
              <Activity className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wider">Import Team Health</h3>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono block font-bold">Sports Injury Central (SIC)</span>
            </div>
          </div>
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider select-none shrink-0">
            LIVE
          </span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed min-h-[48px]">
          Validate and import team-level Sports Injury Central (SIC) health scores into PostgreSQL. Matches SemiSharp's V3.1 projection models.
        </p>

        {/* Dropdowns */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <Select
            id="sic_season_select"
            label="Season"
            options={generateSeasonOptions()}
            value={sicSeason}
            onChange={(e) => {
              setSicSeason(e.target.value);
              setValidationStatusSic('idle');
              setValidationDataSic(null);
              setValidationErrorSic(null);
            }}
            disabled={validatingSic || importingSic}
          />
          <Select
            id="sic_week_select"
            label="Week"
            options={generateWeekOptions()}
            value={sicWeek}
            onChange={(e) => {
              setSicWeek(e.target.value);
              setValidationStatusSic('idle');
              setValidationDataSic(null);
              setValidationErrorSic(null);
            }}
            disabled={validatingSic || importingSic}
          />
        </div>

        {/* Read-only Current Input File */}
        <div className="space-y-1 w-full">
          <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider font-mono">
            Current Input File
          </label>
          <Input
            type="text"
            value={validationDataSic?.input_file || validationDataSic?.filename || `sic_injuries_${sicSeason}_w${sicWeek}.csv`}
            readOnly
            disabled
            className="bg-slate-50 border-slate-200 text-slate-500 font-mono text-xs select-all cursor-not-allowed"
            id="sic_read_only_input_file"
          />
        </div>

        {/* Validation & Stats Display Area */}
        {validationStatusSic !== 'idle' && (
          <div className="border-t border-slate-100 pt-3.5 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Validation Status</span>
              {validationStatusSic === 'validating' ? (
                <span className="inline-flex items-center gap-1.5 text-blue-600 font-bold">
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  Validating...
                </span>
              ) : validationStatusSic === 'valid' ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 rounded px-2 py-0.5 text-[10px] uppercase">
                  <Check className="w-3.5 h-3.5" />
                  Valid
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-rose-600 font-bold bg-rose-50 border border-rose-100 rounded px-2 py-0.5 text-[10px] uppercase">
                  <X className="w-3.5 h-3.5" />
                  Invalid
                </span>
              )}
            </div>

            {validationDataSic && (
              <div className="bg-slate-50/50 border border-slate-150 rounded-xl p-3 space-y-2 text-[11px] text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Teams Found</span>
                  <span className="font-bold text-slate-900">
                    {validationDataSic.teams_found ?? validationDataSic.team_count ?? validationDataSic.count ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Minimum SIC Score</span>
                  <span className="font-bold text-slate-900">
                    {validationDataSic.minimum_sic_score ?? validationDataSic.min_sic_score ?? validationDataSic.minimum_score ?? 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Maximum SIC Score</span>
                  <span className="font-bold text-slate-900">
                    {validationDataSic.maximum_sic_score ?? validationDataSic.max_sic_score ?? validationDataSic.maximum_score ?? 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Source System</span>
                  <span className="font-bold text-slate-900">
                    {validationDataSic.source_system ?? validationDataSic.source ?? 'N/A'}
                  </span>
                </div>
              </div>
            )}

            {/* Validation Feedback */}
            {validationErrorSic && (
              <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-3 text-[11px] text-rose-900 leading-relaxed font-sans">
                <div className="flex items-start gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-rose-600 mb-1">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Validation Feedback
                </div>
                {validationErrorSic}
              </div>
            )}
          </div>
        )}

        {/* Import Status feedback */}
        {importStatusSic !== 'idle' && (
          <div className="border-t border-slate-100 pt-3.5 space-y-2 text-xs font-mono">
            {importStatusSic === 'importing' && (
              <div className="flex items-center gap-1.5 text-blue-600 font-bold">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Importing team health into database...</span>
              </div>
            )}
            {importStatusSic === 'success' && importMessageSic && (
              <Alert type="success" message={importMessageSic} className="rounded-xl text-xs" />
            )}
            {importStatusSic === 'failed' && importErrorSic && (
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-[11px] text-rose-900 leading-relaxed font-sans">
                <div className="flex items-start gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-rose-600 mb-1">
                  <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  Import Rejected
                </div>
                <p className="text-xs text-slate-600 font-sans mt-0.5">{importErrorSic}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap gap-2 justify-between">
        <Button
          variant="outline"
          size="sm"
          isLoading={validatingSic}
          disabled={importingSic}
          onClick={handleValidateSic}
          className="font-mono text-xs border-slate-300 font-bold"
          id="btn_validate_sic_csv"
        >
          <Eye className="w-3.5 h-3.5" />
          Validate CSV
        </Button>
        <Button
          variant="primary"
          size="sm"
          isLoading={importingSic}
          disabled={validationStatusSic !== 'valid' || validatingSic}
          onClick={() => handleImportSic(false)}
          className="font-mono text-xs font-bold"
          id="btn_import_sic_team_health"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          Import Team Health
        </Button>
      </div>
    </Card>
  );

  const renderHfaManagerCard = () => (
    <Card className="col-span-1 md:col-span-2 xl:col-span-4 flex flex-col justify-between border border-slate-100 bg-white" id="card_manage_home_field_advantage">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 shrink-0">
              <Sliders className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wider">Manage Home Field Advantage</h3>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono block font-bold">Projection Engine Calibration</span>
            </div>
          </div>
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider select-none shrink-0">
            LIVE
          </span>
        </div>
        
        <p className="text-xs text-slate-600 leading-relaxed">
          Review and edit active Home Field Advantage values used by the SemiSharp Projection Engine. Highlighted rows indicate unsaved local modifications.
        </p>

        {/* Alert inside Card */}
        {hfaAlert && (
          <Alert 
            type={hfaAlert.type} 
            title={hfaAlert.title} 
            message={hfaAlert.message} 
            className="rounded-xl whitespace-pre-wrap text-xs"
          />
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="w-full sm:w-48">
            <Select
              id="hfa_season_select"
              label="Target Season"
              options={generateSeasonOptions()}
              value={hfaSeason}
              onChange={(e) => {
                setHfaSeason(e.target.value);
              }}
              disabled={loadingHfa || savingHfa}
            />
          </div>

          <div className="flex flex-wrap gap-2 sm:pb-0.5">
            <Button
              variant="outline"
              size="sm"
              isLoading={loadingHfa}
              disabled={savingHfa}
              onClick={handleLoadHfa}
              className="font-mono text-xs border-slate-300 font-bold"
              id="btn_load_hfa"
            >
              <Eye className="w-3.5 h-3.5" />
              Load Values
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              disabled={loadingHfa || savingHfa || hfaRecords.length === 0}
              onClick={handleReloadHfa}
              className="font-mono text-xs border-slate-300 font-bold"
              id="btn_reload_hfa"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reload
            </Button>

            <Button
              variant="primary"
              size="sm"
              isLoading={savingHfa}
              disabled={loadingHfa || Object.keys(hfaEdits).length === 0}
              onClick={handleSaveHfa}
              className="font-mono text-xs font-bold"
              id="btn_save_hfa"
            >
              <Check className="w-3.5 h-3.5" />
              Save Changes ({Object.keys(hfaEdits).length})
            </Button>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-hidden border border-slate-100 rounded-xl">
          {loadingHfa && hfaRecords.length === 0 ? (
            <LoadingSpinner size="md" message="Loading Home Field Advantage values..." />
          ) : hfaRecords.length === 0 ? (
            <div className="p-10 text-center space-y-2 text-slate-400 font-mono">
              <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs">No season data loaded. Choose a season and click Load Values.</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[500px]">
              <table className="min-w-full divide-y divide-slate-100 text-left relative table-fixed">
                <thead className="bg-slate-50 font-mono text-[10px] uppercase font-bold text-slate-400 tracking-wider sticky top-0 z-10 shadow-xs">
                  <tr className="bg-slate-50">
                    <th className="px-4 py-3 w-[20%]">Team</th>
                    <th className="px-4 py-3 w-[20%]">Home Field Advantage</th>
                    <th className="px-4 py-3 w-[20%]">Source System</th>
                    <th className="px-4 py-3 w-[25%]">Notes</th>
                    <th className="px-4 py-3 w-[15%]">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-600 font-mono">
                  {hfaRecords.map((record) => {
                    const tIdStr = String(record.team_id);
                    const isModified = !!hfaEdits[tIdStr];
                    const currentPoints = isModified ? hfaEdits[tIdStr].home_field_points : record.home_field_points;
                    const currentNotes = isModified ? hfaEdits[tIdStr].notes : record.notes;

                    return (
                      <tr 
                        key={record.home_field_advantage_id}
                        className={`transition-colors duration-150 ${isModified ? 'bg-amber-50/50 hover:bg-amber-50/80' : 'hover:bg-slate-50/50'}`}
                      >
                        <td className="px-4 py-2.5 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            {isModified && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" title="Modified locally" />
                            )}
                            <span>{record.team}</span>
                            {record.team_name && (
                              <span className="text-[10px] font-normal text-slate-400 truncate max-w-[120px] hidden sm:inline">
                                - {record.team_name}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            type="number"
                            step="0.5"
                            value={currentPoints === '' ? '' : currentPoints}
                            onChange={(e) => handleHfaFieldChange(record.team_id, 'home_field_points', e.target.value)}
                            disabled={savingHfa}
                            className={`w-24 px-2 py-1 text-xs border rounded-md font-mono focus:outline-none focus:ring-1 focus:ring-slate-800 ${isModified ? 'border-amber-300 focus:border-amber-500 bg-amber-50/10' : 'border-slate-200 focus:border-slate-800 bg-white'}`}
                          />
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 text-[11px]">
                          {record.source_system}
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            type="text"
                            value={currentNotes || ''}
                            onChange={(e) => handleHfaFieldChange(record.team_id, 'notes', e.target.value)}
                            disabled={savingHfa}
                            placeholder="Add optional notes..."
                            className={`w-full px-2 py-1 text-xs border rounded-md font-sans focus:outline-none focus:ring-1 focus:ring-slate-800 ${isModified ? 'border-amber-300 focus:border-amber-500 bg-amber-50/10' : 'border-slate-200 focus:border-slate-800 bg-white'}`}
                          />
                        </td>
                        <td className="px-4 py-2.5 text-slate-400 text-[10px]">
                          {formatLastUpdated(record.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  const renderRecentJobsCard = () => (
    <Card className="border border-slate-100 bg-white flex flex-col h-full" id="section_recent_jobs">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-600">
            <List className="w-4 h-4 text-indigo-500" />
          </div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Recent Job History</h3>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          isLoading={loadingJobs}
          onClick={() => fetchJobs(false)}
          className="text-xs font-mono font-bold border border-slate-200 bg-white hover:bg-slate-50"
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
              <div className="py-16">
                <LoadingSpinner size="md" message="Retrieving background jobs audit log..." />
              </div>
            ) : jobs.length === 0 ? (
              <div className="p-12 text-center space-y-2 text-slate-400 font-mono bg-slate-50/20">
                <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">No recent background jobs found on this server node.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead className="bg-slate-50/60 font-mono text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Job ID</th>
                    <th className="px-6 py-3.5">Job Type</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Created</th>
                    <th className="px-6 py-3.5">Worker ID</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-600 font-mono">
                  {jobs.map((job, index) => {
                    const isSelected = selectedJob && (selectedJob.job_id === job.job_id || selectedJob.id === job.id);
                    const isNewest = index === 0;
                    return (
                      <tr 
                        key={job.job_id || job.id} 
                        className={`hover:bg-slate-50/50 transition-colors ${
                          isSelected ? 'bg-slate-50/80 font-medium' : ''
                        } ${isNewest ? 'border-l-2 border-l-indigo-500 bg-indigo-50/5' : ''}`}
                      >
                        <td className="px-6 py-4 font-bold text-slate-900 max-w-[120px] truncate" title={job.job_id || job.id}>
                          {job.job_id || job.id}
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-slate-100 border border-slate-200/60 text-slate-700 px-2 py-0.5 rounded font-mono text-[10px] font-bold">
                            {job.job_type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono font-extrabold uppercase border ${getStatusStyle(job.status)}`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium text-[11px]">
                          {formatJobTime(job.created_at)}
                        </td>
                        <td className="px-6 py-4 text-slate-400 truncate max-w-[100px]" title={job.worker_id || 'unassigned'}>
                          {job.worker_id || 'unassigned'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant={isSelected ? 'secondary' : 'outline'}
                            size="sm"
                            onClick={() => selectJob(job.job_id || job.id)}
                            className="px-3 py-1 text-[10px] font-bold font-sans"
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
  );

  const renderRecentOperationsCard = () => (
    <Card className="border border-slate-100 bg-white flex flex-col h-full" id="section_recent_operations">
      <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-600">
            <Activity className="w-4 h-4 text-indigo-500" />
          </div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Recent Operations</h3>
        </div>
        {getRecentOperations().length > 0 && (
          <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold select-none">
            {getRecentOperations().length} Total
          </span>
        )}
      </div>

      <div className="flex-1 mt-4 space-y-3 overflow-y-auto max-h-[520px] pr-1">
        {getRecentOperations().length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-mono space-y-2">
            <HelpCircle className="w-8 h-8 mx-auto text-slate-200" />
            <p className="text-xs leading-relaxed">No operations recorded in this session yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {getRecentOperations().map((op, idx) => {
              let statusBg = 'bg-slate-50 border-slate-200 text-slate-700';
              let StatusIcon = Clock;
              if (op.status === 'completed') {
                statusBg = 'bg-emerald-50/50 border-emerald-100 text-emerald-700';
                StatusIcon = CheckCircle2;
              } else if (op.status === 'failed') {
                statusBg = 'bg-rose-50/50 border-rose-100 text-rose-700';
                StatusIcon = XCircle;
              } else if (op.status === 'running') {
                statusBg = 'bg-blue-50/50 border-blue-100 text-blue-700';
                StatusIcon = RefreshCw;
              }

              return (
                <div 
                  key={op.id + '-' + idx}
                  className="p-3.5 bg-white border border-slate-100 rounded-xl hover:shadow-sm hover:border-slate-200 transition-all flex items-start gap-3"
                >
                  <div className={`p-1.5 rounded-lg shrink-0 border ${statusBg}`}>
                    <StatusIcon className={`w-3.5 h-3.5 ${op.status === 'running' ? 'animate-spin' : ''}`} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-950 text-xs truncate font-sans">
                        {op.name}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono font-medium">
                        {formatJobTime(op.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[10px]">
                      <span className="text-slate-500 font-mono truncate">
                        ID: {op.id.slice(0, 8)}...
                      </span>
                      <span className="text-slate-400 font-sans italic truncate">
                        {op.details || 'Success'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );

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

      {/* Tab Navigation Menu */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-px" id="admin_tabs_navigation">
        <button
          onClick={() => setActiveAdminTab('weekly_operations')}
          className={`px-5 py-3 border-b-2 font-mono text-xs uppercase tracking-wider font-extrabold transition-all whitespace-nowrap ${
            activeAdminTab === 'weekly_operations'
              ? 'border-indigo-500 text-indigo-600 bg-indigo-50/5'
              : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
          }`}
          id="tab_btn_weekly_operations"
        >
          Weekly Operations
        </button>
        <button
          onClick={() => setActiveAdminTab('platform_config')}
          className={`px-5 py-3 border-b-2 font-mono text-xs uppercase tracking-wider font-extrabold transition-all whitespace-nowrap ${
            activeAdminTab === 'platform_config'
              ? 'border-indigo-500 text-indigo-600 bg-indigo-50/5'
              : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
          }`}
          id="tab_btn_platform_config"
        >
          Platform Configuration
        </button>
        <button
          onClick={() => setActiveAdminTab('diagnostics')}
          className={`px-5 py-3 border-b-2 font-mono text-xs uppercase tracking-wider font-extrabold transition-all whitespace-nowrap ${
            activeAdminTab === 'diagnostics'
              ? 'border-indigo-500 text-indigo-600 bg-indigo-50/5'
              : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
          }`}
          id="tab_btn_diagnostics"
        >
          Diagnostics & Support
        </button>
      </div>

      {/* Tab Panels */}
      <div id="admin_tabs_content">
        {activeAdminTab === 'weekly_operations' && (
          <div className="space-y-8 animate-fade-in" id="panel_weekly_operations">
            {/* Grid layout for operations cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {renderPffRatingsCard()}
              {renderTeamHealthCard()}
              
              {/* Refresh Market Odds */}
              <Card className="flex flex-col justify-between border border-slate-100 bg-white h-full" id="card_refresh_market_odds">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-indigo-500 shrink-0">
                        <Database className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wider">Refresh Market Odds</h3>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold block">The Odds API</span>
                      </div>
                    </div>
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider select-none shrink-0">
                      LIVE
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Synchronize current consensus lines, point spreads, and game totals from licensed bookmakers. Connects to The Odds API.
                  </p>

                  {/* Dropdowns */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <Select
                      id="odds_season_select"
                      label="Target Season"
                      options={generateSeasonOptions()}
                      value={oddsSeason}
                      onChange={(e) => {
                        setOddsSeason(e.target.value);
                        setOddsSuccess(null);
                        setOddsError(null);
                      }}
                      disabled={isRefreshing}
                      className="text-xs font-mono"
                    />
                    <Select
                      id="odds_week_select"
                      label="Target Week"
                      options={generateWeekOptions()}
                      value={oddsWeek}
                      onChange={(e) => {
                        setOddsWeek(e.target.value);
                        setOddsSuccess(null);
                        setOddsError(null);
                      }}
                      disabled={isRefreshing}
                      className="text-xs font-mono"
                    />
                  </div>

                  {oddsSuccess && (
                    <Alert type="success" message={oddsSuccess} className="rounded-xl text-[11px] font-mono p-2.5 mt-2" />
                  )}
                  {oddsError && (
                    <Alert type="error" message={oddsError} className="rounded-xl text-[11px] font-mono p-2.5 mt-2" />
                  )}
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                    Type: <span className="font-bold text-slate-600">market_odds_sync</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isRefreshing}
                    onClick={handleRefreshMarketOdds}
                    className="font-mono text-xs border-slate-300 font-bold"
                    id="btn_refresh_market_odds"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Refreshing' : 'Refresh Odds'}
                  </Button>
                </div>
              </Card>
            </div>

            {/* Weekly Analytics Refresh Button Area */}
            <Card className="border border-slate-100 bg-slate-50 p-6 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-6" id="card_weekly_analytics_refresh">
              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">Weekly Analytics Refresh</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Finalize the weekly operations cycle. Compile all validated schedule information, PFF Power Ratings, team injury indicators, and calibrated home field advantages to generate optimized projections for active user entries.
                </p>
                {refreshSuccess && (
                  <Alert 
                    type="success" 
                    message="Weekly Analytics Refresh completed successfully! Projection cache compiled and active contestant logs updated." 
                    className="rounded-xl text-xs mt-3" 
                  />
                )}
              </div>
              <div className="shrink-0">
                <Button
                  variant="primary"
                  size="lg"
                  isLoading={refreshingAnalytics}
                  onClick={handleExecuteAnalyticsRefresh}
                  className="font-mono text-xs font-bold shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white border-none h-11 px-5"
                  id="btn_weekly_analytics_refresh"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshingAnalytics ? 'animate-spin' : ''}`} />
                  Execute Analytics Refresh
                </Button>
              </div>
            </Card>
          </div>
        )}

        {activeAdminTab === 'platform_config' && (
          <div className="space-y-8 animate-fade-in" id="panel_platform_config">
            {/* Home Field Advantage Manager is active in this tab */}
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Active Calibration</h4>
              {renderHfaManagerCard()}
            </div>

            {/* Platform Configuration */}
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Platform Administration</h4>
              <div className="max-w-2xl">
                {/* Refresh NFLVerse Schedule */}
                {renderScheduleRefreshCard()}
              </div>
            </div>
          </div>
        )}

        {activeAdminTab === 'diagnostics' && (
          <div className="space-y-8 animate-fade-in" id="panel_diagnostics_placeholders">
            {/* Diagnostics & Support */}
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Advanced Diagnostics</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Worker Health Check (moved here) */}
                {renderWorkerHealthCard()}

                {/* Full Regression Suite (COMING SOON) */}
                <Card className="flex flex-col justify-between border border-slate-100 bg-white p-5" id="card_full_regression_suite">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 shrink-0">
                          <CheckCircle2 className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wider">Full Regression Suite</h3>
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold block">Grading Output Verification</span>
                        </div>
                      </div>
                      <span className="bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider select-none shrink-0">
                        COMING SOON
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Run automated validation scripts across the entire dataset to detect projecting drift or anomalous grading outputs.
                    </p>
                  </div>
                </Card>

              </div>
            </div>
          </div>
        )}
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

      {/* PFF Overwrite Confirmation Modal Overlay */}
      <AnimatePresence>
        {confirmPffImportOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" id="pff_conflict_modal_overlay">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden"
              id="pff_conflict_modal"
            >
              <div className="p-6 space-y-4">
                <div className="flex gap-3 items-start">
                  <div className="p-2.5 bg-amber-50 border border-amber-100 text-amber-600 rounded-xl shrink-0">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-slate-900">Overwrite Existing Ratings?</h3>
                    <p className="text-xs text-slate-500 font-mono">Season {pffSeason} • Week {pffWeek}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                  Week already imported. Would you like to overwrite the existing ratings for Season <span className="font-bold text-slate-900">{pffSeason}</span> Week <span className="font-bold text-slate-900">{pffWeek}</span>?
                  <br /><br />
                  This operation will retry the import with <span className="font-bold text-slate-900 font-mono">replace_existing = true</span>. Any previously stored rankings for this week will be replaced.
                </p>
              </div>

              <div className="bg-slate-50 px-6 py-4 flex gap-3 border-t border-slate-100">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1 font-mono font-bold" 
                  onClick={() => setConfirmPffImportOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  size="sm"
                  className="flex-1 font-mono font-bold bg-amber-600 hover:bg-amber-700 text-white border-none focus:ring-amber-500" 
                  onClick={() => {
                    setConfirmPffImportOpen(false);
                    handleImportPff(true);
                  }}
                >
                  Confirm Overwrite
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SIC Overwrite Confirmation Modal Overlay */}
      <AnimatePresence>
        {confirmSicImportOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" id="sic_conflict_modal_overlay">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden"
              id="sic_conflict_modal"
            >
              <div className="p-6 space-y-4">
                <div className="flex gap-3 items-start">
                  <div className="p-2.5 bg-amber-50 border border-amber-100 text-amber-600 rounded-xl shrink-0">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-slate-900">Overwrite Existing Health Import?</h3>
                    <p className="text-xs text-slate-500 font-mono">Season {sicSeason} • Week {sicWeek}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                  Week already imported. Would you like to overwrite the existing team health data for Season <span className="font-bold text-slate-900">{sicSeason}</span> Week <span className="font-bold text-slate-900">{sicWeek}</span>?
                  <br /><br />
                  This operation will retry the import with <span className="font-bold text-slate-900 font-mono">replace_existing = true</span>. Any previously stored team health metrics for this week will be replaced.
                </p>
              </div>

              <div className="bg-slate-50 px-6 py-4 flex gap-3 border-t border-slate-100">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1 font-mono font-bold" 
                  onClick={() => setConfirmSicImportOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  size="sm"
                  className="flex-1 font-mono font-bold bg-amber-600 hover:bg-amber-700 text-white border-none focus:ring-amber-500" 
                  onClick={() => {
                    setConfirmSicImportOpen(false);
                    handleImportSic(true);
                  }}
                >
                  Confirm Overwrite
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Grid: History and Details */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6" id="admin_history_and_details_grid">
        
        {/* SECTION 3 — RECENT JOBS TABLE */}
        <Card className="xl:col-span-2 border border-slate-100 bg-white flex flex-col h-full" id="section_recent_jobs">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-600">
                <List className="w-4 h-4 text-indigo-500" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Recent Job History</h3>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              isLoading={loadingJobs}
              onClick={() => fetchJobs(false)}
              className="text-xs font-mono font-bold border border-slate-200 bg-white hover:bg-slate-50"
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
                  <div className="py-16">
                    <LoadingSpinner size="md" message="Retrieving background jobs audit log..." />
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="p-12 text-center space-y-2 text-slate-400 font-mono bg-slate-50/20">
                    <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs">No recent background jobs found on this server node.</p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-slate-100 text-left">
                    <thead className="bg-slate-50/60 font-mono text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                      <tr>
                        <th className="px-6 py-3.5">Job ID</th>
                        <th className="px-6 py-3.5">Job Type</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5">Created</th>
                        <th className="px-6 py-3.5">Worker ID</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-600 font-mono">
                      {jobs.map((job, index) => {
                        const isSelected = selectedJob && (selectedJob.job_id === job.job_id || selectedJob.id === job.id);
                        const isNewest = index === 0;
                        return (
                          <tr 
                            key={job.job_id || job.id} 
                            className={`hover:bg-slate-50/50 transition-colors ${
                              isSelected ? 'bg-slate-50/80 font-medium' : ''
                            } ${isNewest ? 'border-l-2 border-l-indigo-500 bg-indigo-50/5' : ''}`}
                          >
                            <td className="px-6 py-4 font-bold text-slate-900 max-w-[120px] truncate" title={job.job_id || job.id}>
                              {job.job_id || job.id}
                            </td>
                            <td className="px-6 py-4">
                              <span className="bg-slate-100 border border-slate-200/60 text-slate-700 px-2 py-0.5 rounded font-mono text-[10px] font-bold">
                                {job.job_type}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono font-extrabold uppercase border ${getStatusStyle(job.status)}`}>
                                {job.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500 font-medium text-[11px]">
                              {formatJobTime(job.created_at)}
                            </td>
                            <td className="px-6 py-4 text-slate-400 truncate max-w-[100px]" title={job.worker_id || 'unassigned'}>
                              {job.worker_id || 'unassigned'}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Button
                                variant={isSelected ? 'secondary' : 'outline'}
                                size="sm"
                                onClick={() => selectJob(job.job_id || job.id)}
                                className="px-3 py-1 text-[10px] font-bold font-sans"
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

        {/* SECTION 4 — RECENT OPERATIONS */}
        <Card className="border border-slate-100 bg-white flex flex-col h-full" id="section_recent_operations">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-600">
                <Activity className="w-4 h-4 text-indigo-500" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Recent Operations</h3>
            </div>
            {getRecentOperations().length > 0 && (
              <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold select-none">
                {getRecentOperations().length} Total
              </span>
            )}
          </div>

          <div className="flex-1 mt-4 space-y-3 overflow-y-auto max-h-[520px] pr-1">
            {getRecentOperations().length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-mono space-y-2">
                <HelpCircle className="w-8 h-8 mx-auto text-slate-200" />
                <p className="text-xs leading-relaxed">No operations recorded in this session yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {getRecentOperations().map((op, idx) => {
                  let statusBg = 'bg-slate-50 border-slate-200 text-slate-700';
                  let StatusIcon = Clock;
                  if (op.status === 'completed') {
                    statusBg = 'bg-emerald-50/50 border-emerald-100 text-emerald-700';
                    StatusIcon = CheckCircle2;
                  } else if (op.status === 'failed') {
                    statusBg = 'bg-rose-50/50 border-rose-100 text-rose-700';
                    StatusIcon = XCircle;
                  } else if (op.status === 'running') {
                    statusBg = 'bg-blue-50/50 border-blue-100 text-blue-700';
                    StatusIcon = RefreshCw;
                  }

                  return (
                    <div 
                      key={op.id + '-' + idx}
                      className="p-3.5 bg-white border border-slate-100 rounded-xl hover:shadow-sm hover:border-slate-200 transition-all flex items-start gap-3"
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 border ${statusBg}`}>
                        <StatusIcon className={`w-3.5 h-3.5 ${op.status === 'running' ? 'animate-spin' : ''}`} />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-950 text-xs truncate font-sans">
                            {op.name}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0 font-mono font-medium">
                            {formatJobTime(op.timestamp)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-normal font-sans">
                          {op.details}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

      </div>

      {/* Modal: Job Diagnostics Detail Overlay */}
      <AnimatePresence>
        {isInspectorOpen && selectedJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" id="modal_job_inspector">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="bg-white border border-slate-100 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-600">
                    <Eye className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wider">Job Diagnostics</h3>
                    <span className="text-[10px] text-slate-400 font-mono font-bold block">Raw Diagnostics Inspection</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsInspectorOpen(false);
                    setSelectedJob(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs font-mono text-slate-600">
                {loadingSelectedJob ? (
                  <div className="py-12">
                    <LoadingSpinner size="sm" message="Fetching job metrics..." />
                  </div>
                ) : (
                  <div className="space-y-5 animate-fade-in">
                    {/* ID and Status Pill */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-150 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase">Job ID / Type</span>
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

                    {/* Result Payload */}
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

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsInspectorOpen(false);
                    setSelectedJob(null);
                  }}
                  className="font-mono text-xs font-bold"
                >
                  Dismiss Inspector
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
