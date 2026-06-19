import React, { useState, useEffect } from "react";
import { safeDate, safeArray, safeString } from "../../utils/safeFormat";
import { 
  Play, 
  RotateCcw, 
  Settings, 
  TrendingUp, 
  Layers, 
  ShieldAlert, 
  Trophy, 
  Clock, 
  Calendar,
  Zap,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronDown,
  Info
} from "lucide-react";

const renderMarkdownLog = (text: string) => {
  const lines = safeString(text).split("\n");
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={idx} className="h-1" />;

    if (trimmed.startsWith("## ")) {
      return (
        <h4 key={idx} className="text-xs font-black text-slate-100 mt-3 mb-1.5 border-b border-slate-800 pb-1 uppercase tracking-wider">
          {trimmed.replace("## ", "")}
        </h4>
      );
    }

    if (trimmed.startsWith("### ")) {
      return (
        <h5 key={idx} className="text-[11px] font-bold text-indigo-400 mt-2.5 mb-1">
          {trimmed.replace("### ", "")}
        </h5>
      );
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const content = trimmed.substring(2);
      const parts = content.split("**");
      return (
        <div key={idx} className="flex items-start gap-1 pl-1 text-[10px] text-slate-300 my-0.5 leading-relaxed">
          <span className="text-indigo-500 font-extrabold">•</span>
          <span>
            {parts.map((p, i) => i % 2 === 1 ? <strong key={i} className="text-white font-black">{p}</strong> : p)}
          </span>
        </div>
      );
    }

    if (trimmed.startsWith("|")) {
      const parts = trimmed.split("|").map(p => p.trim()).filter(p => p !== "");
      if (parts.length === 0 || parts[0].includes("---")) return null;
      return (
        <div key={idx} className="grid grid-cols-4 gap-2 py-1 px-1 bg-slate-950/20 border-b border-slate-800/60 text-[9px] text-slate-300 font-mono">
          {parts.map((p, i) => (
            <span key={i} className={i === 0 ? "font-bold text-indigo-300" : ""}>{p}</span>
          ))}
        </div>
      );
    }

    const parts = trimmed.split("**");
    return (
      <p key={idx} className="text-[10px] text-slate-300 pl-1 leading-relaxed">
        {parts.map((p, i) => i % 2 === 1 ? <strong key={i} className="text-white font-black">{p}</strong> : p)}
      </p>
    );
  });
};

interface SeasonMetadata {
  season: string;
  weeksCount: number;
  description: string;
  notableUpset: string;
}

interface ReplayWeek {
  weekNumber: number;
  selectedPick: string;
  outcome: "SURVIVED" | "ELIMINATED" | "PENDING";
  pointsScored: number;
  inventorySpent: string[];
}

interface ReplayExecution {
  id: string;
  configuration: {
    season: string;
    strategyPreference: "safe" | "aggressive" | "balanced";
    startWeek: number;
    endWeek: number;
  };
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  results: {
    season: string;
    weeksPlayed: number;
    weeksSurvived: number;
    eliminated: boolean;
    eliminatedWeek: number | null;
    weeklyResults: ReplayWeek[];
  };
  evaluation: {
    survivalRate: number;
    inventoryEfficiencyScore: number;
    recommendationScore: number;
    confidenceScore: number;
  };
  generatedAt: string;
  markdownReport?: string;
}

export const HistoricalReplayPanel: React.FC = () => {
  const [seasons, setSeasons] = useState<SeasonMetadata[]>([]);
  const [executions, setExecutions] = useState<ReplayExecution[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>("2023");
  const [strategy, setStrategy] = useState<"safe" | "aggressive" | "balanced">("safe");
  const [startWeek, setStartWeek] = useState<number>(1);
  const [endWeek, setEndWeek] = useState<number>(18);
  
  const [activeExecId, setActiveExecId] = useState<string | null>(null);
  const [activeExecDetails, setActiveExecDetails] = useState<ReplayExecution | null>(null);
  
  const [executing, setExecuting] = useState<boolean>(false);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch seasons metadata & execution history
  const loadInitialData = async () => {
    setLoadingHistory(true);
    setError(null);
    try {
      // 1. Fetch seasons
      const seasonsRes = await fetch("/api/replay/seasons");
      if (seasonsRes.ok) {
        const data = await seasonsRes.json();
        setSeasons(data);
      } else {
        throw new Error("Failed to load available seasons.");
      }

      // 2. Fetch executions
      await loadExecutions();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while loading replay assets.");
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadExecutions = async () => {
    const listRes = await fetch("/api/replay/executions");
    if (listRes.ok) {
      const execs = await listRes.json();
      setExecutions(execs);
      
      // If we have executions and none is active, auto-select the latest
      if (execs.length > 0 && !activeExecId) {
        selectExecution(execs[execs.length - 1].id);
      }
    }
  };

  const selectExecution = async (execId: string) => {
    setActiveExecId(execId);
    try {
      const res = await fetch(`/api/replay/executions/${execId}`);
      if (res.ok) {
        const details = await res.json();
        setActiveExecDetails(details);
      }
    } catch (err: any) {
      console.error("Failed to load details for execution", execId, err);
    }
  };

  const handleExecuteReplay = async () => {
    setExecuting(true);
    setError(null);
    try {
      const res = await fetch("/api/replay/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          season: selectedSeason,
          strategyPreference: strategy,
          startWeek,
          endWeek
        })
      });

      if (!res.ok) {
        throw new Error("Replay execution failed on backend service.");
      }

      const newExec = await res.json();
      await loadExecutions();
      await selectExecution(newExec.id);
    } catch (err: any) {
      setError(err.message || "Simulation failed to start.");
    } finally {
      setExecuting(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const getMetricBadge = (score: number) => {
    if (score >= 90) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    } else if (score >= 70) {
      return "bg-amber-50 text-amber-700 border-amber-200";
    } else {
      return "bg-rose-50 text-rose-700 border-rose-200";
    }
  };

  const selectedSeasonMeta = safeArray(seasons).find((s: any) => s?.season === selectedSeason);

  return (
    <div id="historical-replay-panel-root" className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden font-sans">
      
      {/* Panel Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Historical Replay & Strategy Backtesting Engine
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Replay prior NFL seasons with customizable pick heuristics. Evaluate model safety margins, survival stats, and inventory consumption curves.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-600 uppercase tracking-wider font-mono">
            USE_MOCK = TRUE
          </span>
        </div>
      </div>

      {error && (
        <div className="m-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 leading-relaxed animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Backtesting Engine Error</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border-b border-slate-100">
        
        {/* Left Column: Interactive Simulation Control */}
        <div className="lg:col-span-5 p-6 border-r border-slate-100 space-y-6">
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-800 tracking-wider uppercase flex items-center gap-1.5Packed">
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              Configure Backtest Run
            </h4>

            {/* Season Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Historical NFL Season</label>
              <div className="grid grid-cols-3 gap-2">
                {["2023", "2024", "2025"].map(year => (
                  <button
                    key={year}
                    onClick={() => setSelectedSeason(year)}
                    className={`px-3 py-2.5 text-xs font-bold rounded-xl border transition flex flex-col items-center justify-between gap-1 ${
                      selectedSeason === year 
                        ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>NFL {year}</span>
                    <span className="text-[9px] font-normal text-slate-400">18 Weeks</span>
                  </button>
                ))}
              </div>
              {selectedSeasonMeta && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mt-2">
                  <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                    {selectedSeasonMeta.description}
                  </p>
                  <p className="text-[9px] text-indigo-700 font-mono mt-1">
                    🎯 Key Upset: {selectedSeasonMeta.notableUpset}
                  </p>
                </div>
              )}
            </div>

            {/* Heuristics Strategy */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Strategy Picking Heuristic</label>
              <div className="grid grid-cols-3 gap-2">
                {(["safe", "aggressive", "balanced"] as const).map(opt => (
                  <button
                    key={opt}
                    onClick={() => setStrategy(opt)}
                    className={`p-2.5 rounded-xl border text-center transition capitalize ${
                      strategy === opt 
                        ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <p className="text-xs font-bold leading-none">{opt}</p>
                    <p className="text-[8px] text-slate-400 mt-1">
                      {opt === "safe" ? "Strength priority" : opt === "aggressive" ? "Save strength" : "Balanced weight"}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Weeks Frame */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Simulate Start Week</label>
                <select
                  value={startWeek}
                  onChange={(e) => setStartWeek(Number(e.target.value))}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-400 bg-white"
                >
                  {Array.from({ length: 18 }, (_, idx) => (
                    <option key={idx+1} value={idx+1}>Week {idx+1}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Simulate End Week</label>
                <select
                  value={endWeek}
                  onChange={(e) => setEndWeek(Number(e.target.value))}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-400 bg-white"
                >
                  {Array.from({ length: 18 }, (_, idx) => (
                    <option key={idx+1} value={idx+1} disabled={idx+1 < startWeek}>Week {idx+1}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Replay action button */}
          <button
            onClick={handleExecuteReplay}
            disabled={executing || endWeek < startWeek}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs p-3.5 rounded-xl transition shadow-sm flex items-center justify-center gap-2"
          >
            <Play className={`w-4 h-4 ${executing ? "animate-pulse" : ""}`} />
            {executing ? "Processing Replay Cycles..." : "Run Replay Backtest"}
          </button>

          {/* Execution History Feed */}
          <div className="border-t border-slate-100 pt-5 space-y-3">
            <div className="flex justify-between items-center">
              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Completed Backtests ({executions.length})
              </h5>
              <button 
                onClick={loadExecutions}
                className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Refresh history
              </button>
            </div>
            
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {safeArray(executions).length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                  No completed historical replays stored. Trigger your first run!
                </p>
              ) : (
                safeArray(executions).map((item: any) => (
                  <div
                    key={item?.id}
                    onClick={() => selectExecution(item?.id)}
                    className={`p-3 border rounded-xl cursor-pointer transition flex items-center justify-between text-xs ${
                      activeExecId === item?.id 
                        ? "bg-slate-50 border-indigo-400 font-bold shadow-sm" 
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-800">
                          NFL {item?.configuration?.season}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 capitalize">
                          {item?.configuration?.strategyPreference}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono font-normal">
                        Weeks: {item?.configuration?.startWeek}-{item?.configuration?.endWeek} | {safeDate(item?.generatedAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{item.evaluation.survivalRate}% Survival</p>
                      <p className="text-[9px] font-mono text-slate-500 font-normal">
                        {item.results.eliminated ? `Out Wk ${item.results.eliminatedWeek}` : "🏆 Survived"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Active Simulation Insights & Scorecard */}
        <div className="lg:col-span-7 bg-slate-50/50 p-6 flex flex-col justify-between">
          {activeExecDetails ? (
            <div className="space-y-6">
              
              {/* Scorecard Title checks */}
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-mono">
                    Simulation Analytics Ledger
                  </span>
                  <h4 className="text-base font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
                    {activeExecDetails.results.eliminated ? (
                      <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    ) : (
                      <Trophy className="w-5 h-5 text-emerald-500 shrink-0" />
                    )}
                    NFL {activeExecDetails.configuration.season} Backtest Run Summary
                  </h4>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                    activeExecDetails.results.eliminated ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}>
                    {activeExecDetails.results.eliminated ? "ELIMINATED" : "CHAMPION"}
                  </span>
                </div>
              </div>

              {/* Scorecard Dashboard grids */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                {/* Survival rating */}
                <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm text-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Survival Rate</span>
                  <span className="text-2xl font-black text-slate-900 block mt-1">{activeExecDetails.evaluation.survivalRate}%</span>
                  <span className={`inline-block text-[8px] font-bold px-1.5 py-0.5 rounded border mt-2 capitalize ${getMetricBadge(activeExecDetails.evaluation.survivalRate)}`}>
                    {activeExecDetails.results.weeksSurvived}/{activeExecDetails.results.weeksPlayed} Weeks
                  </span>
                </div>

                {/* Inventory Efficiency */}
                <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm text-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Inventory Efficiency</span>
                  <span className="text-2xl font-black text-slate-900 block mt-1">{activeExecDetails.evaluation.inventoryEfficiencyScore}%</span>
                  <span className={`inline-block text-[8px] font-bold px-1.5 py-0.5 rounded border mt-2 capitalize ${getMetricBadge(activeExecDetails.evaluation.inventoryEfficiencyScore)}`}>
                    Asset optimization
                  </span>
                </div>

                {/* Recommendation Score */}
                <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm text-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Decisive Yield</span>
                  <span className="text-2xl font-black text-slate-900 block mt-1">{activeExecDetails.evaluation.recommendationScore}%</span>
                  <span className={`inline-block text-[8px] font-bold px-1.5 py-0.5 rounded border mt-2 capitalize ${getMetricBadge(activeExecDetails.evaluation.recommendationScore)}`}>
                    Decision accuracy
                  </span>
                </div>

                {/* Confidence Level */}
                <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm text-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Confidence Score</span>
                  <span className="text-2xl font-black text-slate-900 block mt-1">{activeExecDetails.evaluation.confidenceScore}%</span>
                  <span className={`inline-block text-[8px] font-bold px-1.5 py-0.5 rounded border mt-2 capitalize ${getMetricBadge(activeExecDetails.evaluation.confidenceScore)}`}>
                    Model assurance
                  </span>
                </div>
              </div>

              {/* Weekly Steps Breakdown Table */}
              <div className="space-y-2.5">
                <h5 className="text-xs font-bold text-slate-700 tracking-wider uppercase">Weekly Selection Outcomes</h5>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="max-h-[160px] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-bold text-[10px] uppercase">
                          <th className="py-2.5 px-3">Week</th>
                          <th className="py-2.5 px-3">Selected Pick</th>
                          <th className="py-2.5 px-3 text-center">Outcome</th>
                          <th className="py-2.5 px-3 text-center">Yield Margin</th>
                          <th className="py-2.5 px-3">Inventory Spent</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {safeArray(activeExecDetails.results?.weeklyResults).map((wk: any, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-semibold text-slate-500 font-mono">
                              Wk {wk?.weekNumber}
                            </td>
                            <td className="py-2 px-3 font-extrabold text-slate-900">
                              {wk?.selectedPick}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                wk?.outcome === "SURVIVED" 
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-100" 
                                  : "bg-rose-50 text-rose-800 border-rose-100"
                              }`}>
                                {wk?.outcome}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center font-mono text-slate-600">
                              {wk?.outcome === "SURVIVED" ? `+${wk?.pointsScored} pts` : "--"}
                            </td>
                            <td className="py-2 px-3 text-slate-400 text-[10px] max-w-[120px] truncate" title={safeArray(wk?.inventorySpent).join(", ")}>
                              {safeArray(wk?.inventorySpent).join(", ")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Expansion block: Analytical markdown report terminal */}
              {activeExecDetails.markdownReport && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-slate-700 tracking-wider uppercase flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    Analytical Intel Report
                  </h5>
                  <div className="bg-slate-900 text-slate-200 p-5 rounded-2xl font-mono text-[11px] leading-relaxed max-h-[160px] overflow-y-auto relative border border-slate-800">
                    <div className="absolute top-2 right-4 text-[9px] text-slate-400 select-none">CONSOLE LOG REPORT [v0.21]</div>
                    <div className="markdown-body text-[10px] space-y-1 text-slate-300">
                      {renderMarkdownLog(activeExecDetails.markdownReport)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center text-slate-400 bg-white border border-dashed border-slate-200 rounded-2xl p-8">
              <Layers className="w-8 h-8 text-slate-300 stroke-[1.5]" />
              <p className="text-xs font-bold text-slate-600 mt-2">No Active Backtest Details Loaded</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[280px]">
                Trigger a backtest on the left configuration panel to view live dashboard charts, weekly metrics, and diagnostic analytical logs.
              </p>
            </div>
          )}

          {/* Secure cryptographic footer */}
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono border-t border-slate-100/70 pt-4 mt-6">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-indigo-500" /> State backtesting secure layer (v0.21)
            </span>
            <span>Local memory database isolated</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoricalReplayPanel;
