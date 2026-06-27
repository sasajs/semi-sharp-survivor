import React, { useState, useEffect } from "react";
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  Zap,
  Sliders,
  Shield,
  Search,
  Sparkles,
  Award,
  BarChart4,
  Cpu,
  ChevronRight,
  TrendingUp,
  Info,
  AlertCircle,
  Calendar,
  Compass,
  DollarSign,
  Activity,
  GitPullRequest,
  CheckCircle,
  XCircle,
  Bookmark
} from "lucide-react";
import { apiService } from "../services/apiService";
import { ChampionshipPlan } from "../types";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from "recharts";

export const ChampionshipPlanningPanel: React.FC = () => {
  const [plans, setPlans] = useState<ChampionshipPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recalculating, setRecalculating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [seasonInput, setSeasonInput] = useState("2026");
  const [weekInput, setWeekInput] = useState("1");
  const [plannerVersionInput, setPlannerVersionInput] = useState("v0.51");

  // Selection states
  const [selectedEntryId, setSelectedEntryId] = useState<string>("");
  const [selectedContestId, setSelectedContestId] = useState<string>("");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.fetchLatestChampionshipPlans();
      setPlans(data);
      if (data.length > 0) {
        setSelectedEntryId(data[0].entry_id);
        setSelectedContestId(data[0].contest_id);
      }
    } catch (err: any) {
      setError("Failed to fetch latest championship plans: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecalculate = async () => {
    setRecalculating(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const weekVal = parseInt(weekInput, 10);
      if (isNaN(weekVal) || weekVal < 1 || weekVal > 18) {
        throw new Error("Week must be a valid integer between 1 and 18");
      }
      await apiService.runChampionshipPlansCalculate(seasonInput, weekVal, plannerVersionInput);
      setSuccessMsg(`V0.51 Championship Optimization Engine successfully recalculated plans for ${seasonInput} Week ${weekVal}.`);
      await loadData();
    } catch (err: any) {
      setError("Failed to run optimization engine: " + err.message);
    } finally {
      setRecalculating(false);
    }
  };

  // Find unique entries and contests
  const uniqueEntries: string[] = Array.from(new Set(plans.map(p => p.entry_id))) as string[];
  const uniqueContests: string[] = Array.from(new Set(plans.map(p => p.contest_id))) as string[];

  // Sync selection states
  useEffect(() => {
    if (uniqueEntries.length > 0 && !uniqueEntries.includes(selectedEntryId)) {
      setSelectedEntryId(uniqueEntries[0]);
    }
    if (uniqueContests.length > 0 && !uniqueContests.includes(selectedContestId)) {
      setSelectedContestId(uniqueContests[0]);
    }
  }, [plans]);

  // Find active plan
  const activePlan = plans.find(
    p => p.entry_id === selectedEntryId && p.contest_id === selectedContestId
  );

  // Parse JSON data for path timeline
  let activeDetails: any = null;
  if (activePlan && activePlan.optimization_json) {
    try {
      activeDetails = JSON.parse(activePlan.optimization_json);
    } catch (e) {
      console.error("Failed to parse optimization details:", e);
    }
  }

  // Parse alternative plans
  let alternativePlans: any[] = [];
  if (activePlan && activePlan.alternative_paths) {
    try {
      alternativePlans = JSON.parse(activePlan.alternative_paths);
    } catch (e) {
      console.error("Failed to parse alternative plans:", e);
    }
  }

  // Multi-week survival charts preparation
  const chartData = activeDetails?.primary_path?.map((s: any, idx: number) => {
    // Cumulative survival probability calculation
    let cumulative = 1.0;
    for (let i = 0; i <= idx; i++) {
      cumulative *= activeDetails.primary_path[i].win_prob;
    }
    return {
      weekLabel: `W${s.week}`,
      team: s.team_id.toUpperCase(),
      winProb: Number((s.win_prob * 100).toFixed(1)),
      cumulativeSurvival: Number((cumulative * 100).toFixed(2))
    };
  }) || [];

  return (
    <div id="championship-plans-container" className="space-y-6 text-gray-100">
      
      {/* SECTION 1: HEADER & CONTROLS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gray-900/80 p-5 rounded-2xl border border-gray-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
              Version 0.51 Stable
            </span>
            <span className="text-xs text-gray-500 font-mono">Championship Optimization Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Championship Optimization Engine</h1>
          <p className="text-sm text-gray-400">
            Evaluating multi-week season strategies using bounded lookahead dynamic programming to maximize late-season expected value.
          </p>
        </div>

        {/* Engine Controller Trigger */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-gray-950 p-1.5 rounded-lg border border-gray-800">
            <div className="flex flex-col px-2">
              <span className="text-[10px] text-gray-500 font-mono uppercase">Season</span>
              <input 
                type="text" 
                value={seasonInput} 
                onChange={(e) => setSeasonInput(e.target.value)}
                className="bg-transparent text-xs text-white outline-none w-12 font-mono font-bold"
              />
            </div>
            <div className="h-6 w-px bg-gray-800" />
            <div className="flex flex-col px-2">
              <span className="text-[10px] text-gray-500 font-mono uppercase">Start Week</span>
              <input 
                type="text" 
                value={weekInput} 
                onChange={(e) => setWeekInput(e.target.value)}
                className="bg-transparent text-xs text-white outline-none w-8 font-mono font-bold"
              />
            </div>
            <div className="h-6 w-px bg-gray-800" />
            <div className="flex flex-col px-2">
              <span className="text-[10px] text-gray-500 font-mono uppercase">Planner Version</span>
              <input 
                type="text" 
                value={plannerVersionInput} 
                onChange={(e) => setPlannerVersionInput(e.target.value)}
                className="bg-transparent text-xs text-white outline-none w-16 font-mono font-bold"
              />
            </div>
          </div>

          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition shadow-lg shadow-indigo-950/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? "animate-spin" : ""}`} />
            {recalculating ? "Optimizing..." : "Trigger Optimizer"}
          </button>
        </div>
      </div>

      {/* SUCCESS / ERROR FEEDBACK */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-emerald-400 text-xs">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-rose-400 text-xs">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* FILTER CONTROLS */}
      {plans.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 bg-gray-900/50 p-4 rounded-xl border border-gray-800 text-xs">
          <div className="flex items-center gap-2">
            <Compass className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-400 font-medium">Select Entry Workspace:</span>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={selectedEntryId}
              onChange={(e) => setSelectedEntryId(e.target.value)}
              className="bg-gray-950 text-white border border-gray-800 rounded-lg px-3 py-1.5 outline-none font-mono focus:border-indigo-500 transition"
            >
              {uniqueEntries.map(id => (
                <option key={id} value={id}>Entry: {id}</option>
              ))}
            </select>

            <select
              value={selectedContestId}
              onChange={(e) => setSelectedContestId(e.target.value)}
              className="bg-gray-950 text-white border border-gray-800 rounded-lg px-3 py-1.5 outline-none font-mono focus:border-indigo-500 transition animate-fade-in"
            >
              {uniqueContests.map(id => (
                <option key={id} value={id}>Contest: {id}</option>
              ))}
            </select>
          </div>

          <div className="ml-auto text-[11px] text-gray-500 font-mono">
            Active Planning Horizon: <span className="text-indigo-400 font-semibold">Remaining Season</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-gray-900/40 rounded-2xl border border-gray-850">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
          <span className="text-sm text-gray-400">Loading championship strategies...</span>
        </div>
      ) : !activePlan ? (
        <div className="flex flex-col items-center justify-center p-12 bg-gray-900/40 rounded-2xl border border-gray-850 text-center">
          <AlertCircle className="w-8 h-8 text-gray-600 mb-2" />
          <span className="text-sm font-semibold text-gray-400">No Championship Plans Found</span>
          <p className="text-xs text-gray-500 max-w-sm mt-1">
            Trigger the optimization engine above to generate dynamic programming planning sequences.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT 2 COLS: PRIMARY PATHS & GRAPHS */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* METRICS HEADER */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-900/40 p-4 rounded-xl border border-gray-800">
                <span className="text-[10px] text-gray-500 uppercase font-mono tracking-wider">Recommended Team</span>
                <div className="text-xl font-bold text-white mt-1 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-400" />
                  {activePlan.recommended_team_id.toUpperCase()}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Primary Optimal pick</div>
              </div>

              <div className="bg-gray-900/40 p-4 rounded-xl border border-gray-800">
                <span className="text-[10px] text-gray-500 uppercase font-mono tracking-wider">Optimization Index</span>
                <div className="text-xl font-bold text-indigo-400 mt-1">
                  {activePlan.optimization_score}
                </div>
                <div className="text-[10px] text-gray-500 font-mono mt-0.5">Weighted Utility Score</div>
              </div>

              <div className="bg-gray-900/40 p-4 rounded-xl border border-gray-800">
                <span className="text-[10px] text-gray-500 uppercase font-mono tracking-wider">Championship Prob</span>
                <div className="text-xl font-bold text-emerald-400 mt-1">
                  {activePlan.projected_championship_probability}%
                </div>
                <div className="text-[10px] text-gray-500 font-mono mt-0.5">Cumulative Win Vector</div>
              </div>

              <div className="bg-gray-900/40 p-4 rounded-xl border border-gray-800">
                <span className="text-[10px] text-gray-500 uppercase font-mono tracking-wider">Remaining FTV</span>
                <div className="text-xl font-bold text-indigo-300 mt-1">
                  {activePlan.future_value_score}
                </div>
                <div className="text-[10px] text-gray-500 font-mono mt-0.5">Asset Preservation Score</div>
              </div>
            </div>

            {/* CHARTS CONTAINER */}
            <div className="bg-gray-900/60 p-5 rounded-2xl border border-gray-800 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-semibold text-white">Championship Probability Curve</h3>
                  <p className="text-xs text-gray-400">Projected cumulative survival rates step-by-step through the remaining planning steps.</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /> Survival Curve</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-indigo-500 rounded-full" /> Single Week Prob</span>
                </div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSurvival" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorSingle" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="weekLabel" stroke="#9ca3af" fontSize={10} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="#9ca3af" fontSize={10} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#0b0f19", borderColor: "#1f2937", borderRadius: "12px", fontSize: "12px" }}
                      labelStyle={{ color: "#fff", fontWeight: "bold" }}
                    />
                    <Area type="monotone" name="Championship Prob (%)" dataKey="cumulativeSurvival" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSurvival)" />
                    <Area type="monotone" name="Week Win Prob (%)" dataKey="winProb" stroke="#6366f1" strokeWidth={1.5} fillOpacity={1} fill="url(#colorSingle)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* PRIMARY PLAN DETAILS */}
            <div className="bg-gray-900/60 p-5 rounded-2xl border border-gray-800 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <GitPullRequest className="w-4 h-4 text-indigo-400" />
                Primary Championship Path Timeline
              </h3>

              <div className="relative border-l-2 border-gray-850 pl-4 space-y-6 ml-3 py-2">
                {activeDetails?.primary_path?.map((step: any, idx: number) => (
                  <div key={idx} className="relative group">
                    {/* Circle bullet */}
                    <div className="absolute -left-[25px] top-1.5 w-3 h-3 rounded-full bg-indigo-500 border-2 border-gray-950 group-hover:bg-emerald-400 transition" />
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 bg-gray-950/60 p-3.5 rounded-xl border border-gray-850 hover:border-indigo-500/40 transition">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-indigo-400 font-mono uppercase">Week {step.week}</span>
                          <span className="text-sm font-semibold text-white">{step.team_name}</span>
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5 font-mono">
                          Asset status: {step.tier === "elite" || step.win_prob > 0.82 ? "Elite asset allocation" : "Mid-tier conservative hedge"}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono">
                        <div>
                          <span className="text-gray-500 block text-[9px] uppercase">Win Probability</span>
                          <span className="text-emerald-400 font-bold">{(step.win_prob * 100).toFixed(1)}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block text-[9px] uppercase">Path survival</span>
                          <span className="text-gray-300">
                            {(chartData[idx]?.cumulativeSurvival || 0).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COL: STRATEGIC UTILITY WEIGHTS & ALTERNATIVES */}
          <div className="space-y-6">
            
            {/* OPTIMIZATION FORMULA */}
            <div className="bg-gray-900/60 p-5 rounded-2xl border border-gray-800 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                Strategic Optimization Weights
              </h3>
              <p className="text-xs text-gray-400">
                Utility function maximizes long-term championship expectation according to 5 deterministic metrics.
              </p>

              <div className="space-y-3.5 pt-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-400">Current Week Win Value</span>
                    <span className="text-indigo-400 font-bold">30%</span>
                  </div>
                  <div className="h-1.5 bg-gray-950 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: "30%" }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-400">Future Opportunity Cost</span>
                    <span className="text-indigo-400 font-bold">25%</span>
                  </div>
                  <div className="h-1.5 bg-gray-950 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: "25%" }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-400">Season-Long Survival Rate</span>
                    <span className="text-indigo-400 font-bold">20%</span>
                  </div>
                  <div className="h-1.5 bg-gray-950 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: "20%" }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-400">Future Team Roster Strength</span>
                    <span className="text-indigo-400 font-bold">15%</span>
                  </div>
                  <div className="h-1.5 bg-gray-950 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: "15%" }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-400">Contest Expected Value Index</span>
                    <span className="text-indigo-400 font-bold">10%</span>
                  </div>
                  <div className="h-1.5 bg-gray-950 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: "10%" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* MODEL REASONING */}
            <div className="bg-gray-900/60 p-5 rounded-2xl border border-gray-800 space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Optimization Engine Verdict
              </h3>
              
              <div className="bg-gray-950 p-4 rounded-xl border border-gray-850">
                <p className="text-xs text-gray-300 leading-relaxed italic">
                  "{activePlan.optimization_reason}"
                </p>
              </div>
              <div className="text-[10px] text-gray-500 font-mono">
                Reasoning generated deterministically by multi-week DP sweep.
              </div>
            </div>

            {/* TOP 5 ALTERNATIVES */}
            <div className="bg-gray-900/60 p-5 rounded-2xl border border-gray-800 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  Top Alternative Paths
                </h3>
                <span className="text-[10px] text-gray-500 font-mono">DP Candidates</span>
              </div>

              <div className="space-y-3">
                {alternativePlans.length === 0 ? (
                  <div className="text-center py-4 text-xs text-gray-500 font-mono">
                    No alternative paths evaluated.
                  </div>
                ) : (
                  alternativePlans.map((alt, idx) => (
                    <div key={idx} className="bg-gray-950 p-3.5 rounded-xl border border-gray-855 hover:border-gray-800 transition space-y-2">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-gray-400 font-bold flex items-center gap-1">
                          <Bookmark className="w-3.5 h-3.5 text-gray-500" />
                          #{idx + 1}: {alt.recommended_team_name}
                        </span>
                        <span className="text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-md text-[10px]">
                          Utility: {alt.optimization_score}
                        </span>
                      </div>

                      <div className="flex justify-between text-[11px] text-gray-500 font-mono">
                        <span>Championship Prob:</span>
                        <span className="text-emerald-400 font-semibold">{alt.projected_championship_probability}%</span>
                      </div>

                      <div className="text-[10px] text-rose-400/95 leading-relaxed bg-rose-500/5 p-2 rounded-lg border border-rose-500/10 flex items-start gap-1.5">
                        <XCircle className="w-3.5 h-3.5 flex-shrink-0 text-rose-400 mt-0.5" />
                        <span>{alt.reject_reason}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
