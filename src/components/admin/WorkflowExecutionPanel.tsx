import React, { useState, useEffect } from "react";
import { adminApiService } from "../../services/adminApiService";
import { apiService } from "../../services/apiService";
import { WorkflowRun } from "../../types/admin";
import { Contest, ContestLeg } from "../../types";
import { Play, CheckCircle2, XCircle, Loader2, ChevronRight, RefreshCw, Terminal, Search } from "lucide-react";

interface WorkflowExecutionPanelProps {
  onWorkflowTriggered?: () => void;
}

export const WorkflowExecutionPanel: React.FC<WorkflowExecutionPanelProps> = ({ onWorkflowTriggered }) => {
  const [contests, setContests] = useState<Contest[]>([]);
  const [legs, setLegs] = useState<ContestLeg[]>([]);
  const [selectedContest, setSelectedContest] = useState<string>("");
  const [selectedLeg, setSelectedLeg] = useState<string>("");
  const [selectedStrategy, setSelectedStrategy] = useState<string>("safe");
  
  const [triggering, setTriggering] = useState<boolean>(false);
  const [activeRun, setActiveRun] = useState<WorkflowRun | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pollingRunId, setPollingRunId] = useState<string | null>(null);

  // Fetch contests, legs to populate selects
  useEffect(() => {
    const loadSelectionOptions = async () => {
      try {
        const [cList, lList] = await Promise.all([
          apiService.fetchContests(),
          apiService.fetchLegs()
        ]);
        setContests(cList);
        setLegs(lList);

        if (cList.length > 0) setSelectedContest(cList[0].id);
        if (lList.length > 0) setSelectedLeg(lList[0].id);
      } catch (err) {
        console.error("Failed to load options for manual workflow triggers:", err);
      }
    };
    loadSelectionOptions();
  }, []);

  // Poll status of executing workflow
  useEffect(() => {
    if (!pollingRunId) return;

    let stopped = false;
    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/orchestration/workflows/runs/${pollingRunId}/status`);
        if (!res.ok) return;
        const statusData = await res.json();
        
        if (stopped) return;
        setActiveRun(statusData);

        if (statusData.status === "completed" || statusData.status === "failed") {
          setPollingRunId(null);
          setTriggering(false);
          if (onWorkflowTriggered) onWorkflowTriggered();
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    const interval = setInterval(pollStatus, 1500);
    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [pollingRunId]);

  const handleStartRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContest || !selectedLeg) {
      setErrorMessage("Please select both a target contest and active leg.");
      return;
    }

    setTriggering(true);
    setErrorMessage(null);
    setActiveRun(null);

    try {
      const run = await adminApiService.executeWorkflow({
        contestId: selectedContest,
        legId: selectedLeg,
        strategy_profile: selectedStrategy
      });
      setActiveRun(run);
      setPollingRunId(run.id);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to trigger workflow execution registry");
      setTriggering(false);
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-rose-500 shrink-0" />;
      case "running":
        return <Loader2 className="w-4 h-4 text-indigo-500 animate-spin shrink-0" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-slate-200 shrink-0" />;
    }
  };

  const getStepBg = (status: string) => {
    switch (status) {
      case "completed": return "bg-emerald-50/50 border-emerald-100";
      case "failed": return "bg-rose-50/50 border-rose-100";
      case "running": return "bg-indigo-50/50 border-indigo-100 animate-pulse";
      default: return "bg-slate-50/30 border-slate-100";
    }
  };

  return (
    <div id="admin-workflow-execution-panel" className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
      <div className="flex items-center space-x-3 border-b border-gray-50 pb-4 mb-6">
        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
          <Play className="w-5 h-5 fill-current" />
        </div>
        <div>
          <h3 className="font-sans font-medium text-gray-900 tracking-tight text-lg">Trigger Manual Workflow</h3>
          <p className="font-sans text-xs text-gray-500">Initiate automated reporting and Monte Carlo processing sequences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Playbook form fields */}
        <form onSubmit={handleStartRun} className="lg:col-span-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 font-sans">
              Target Contest
            </label>
            <select
              id="select-workflow-contest"
              value={selectedContest}
              onChange={(e) => setSelectedContest(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-sans"
              disabled={triggering}
            >
              {contests.length === 0 ? (
                <option value="">No Contests Available</option>
              ) : (
                contests.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.year || 2026})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 font-sans">
              Contest Leg
            </label>
            <select
              id="select-workflow-leg"
              value={selectedLeg}
              onChange={(e) => setSelectedLeg(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
              disabled={triggering}
            >
              {legs.length === 0 ? (
                <option value="">No Legs Available</option>
              ) : (
                legs.map((l) => (
                  <option key={l.id} value={l.id}>
                    Week {l.nfl_week} — {l.leg_type.toUpperCase()}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 font-sans">
              Sim preference strategy
            </label>
            <select
              id="select-workflow-strategy"
              value={selectedStrategy}
              onChange={(e) => setSelectedStrategy(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-sans"
              disabled={triggering}
            >
              <option value="safe">Preservation Safe Strategy (Minimize FV Overuse)</option>
              <option value="aggressive">Aggressive Survival Yield (High Win Prob Only)</option>
              <option value="contrarian">Contrarian Pick (Fading popularity spikes)</option>
            </select>
          </div>

          {errorMessage && (
            <p className="text-xs text-rose-600 font-sans font-medium px-1 pt-1">
              Error triggering run: {errorMessage}
            </p>
          )}

          <button
            id="btn-execute-workflow"
            type="submit"
            disabled={triggering}
            className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-slate-300 disabled:cursor-not-allowed px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            {triggering ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running Pipeline Steps...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current text-white" />
                <span>Execute Complete Playbook</span>
              </>
            )}
          </button>
        </form>

        {/* Runtime monitor logs */}
        <div className="lg:col-span-7 flex flex-col h-[340px] border border-slate-100 rounded-xl bg-slate-50 overflow-hidden">
          <div className="flex items-center justify-between bg-slate-100/60 px-4 py-2 border-b border-slate-200/50">
            <span className="flex items-center space-x-2 text-xs font-semibold text-slate-700 font-sans">
              <Terminal className="w-3.5 h-3.5 text-slate-500" />
              <span>Real-time Active Execution Trace</span>
            </span>
            {activeRun && (
              <span className="text-[10px] font-mono bg-slate-200 px-1.5 py-0.5 rounded text-slate-600">
                Run: {activeRun.id.slice(0, 8)}
              </span>
            )}
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {!activeRun ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 font-sans">
                <p className="text-sm font-medium">Pipeline Monitor Standby</p>
                <p className="text-xs mt-1">Select parameters on the left to begin a live transactional run</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Step visual track */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold font-sans text-slate-500 uppercase tracking-wider">Sequential Process Steps</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeRun.steps.map((sk, index) => (
                      <div
                        key={sk.name}
                        className={`flex items-center space-x-3 p-2.5 border rounded-lg text-xs font-sans transition-all ${getStepBg(sk.status)}`}
                      >
                        {getStepIcon(sk.status)}
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate capitalize">{sk.name.replace(/_/g, " ")}</p>
                          <p className="text-[10px] text-slate-400 capitalize">{sk.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Log outputs terminal */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold font-sans text-slate-500 uppercase tracking-wider">Output Stream Logs</h4>
                  <div className="bg-slate-900 rounded-lg p-3 font-mono text-[10px] text-zinc-300 h-28 overflow-y-auto space-y-1">
                    {activeRun.logs.length === 0 ? (
                      <p className="text-zinc-500 italic">Initializing runtime streams...</p>
                    ) : (
                      activeRun.logs.map((logStr, i) => (
                        <p key={i} className="leading-relaxed">
                          <span className="text-zinc-500">[{new Date().toLocaleTimeString()}]</span> {logStr}
                        </p>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
