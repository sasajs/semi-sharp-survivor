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
  Activity
} from "lucide-react";
import { apiService } from "../services/apiService";
import { SurvivorPlan } from "../types";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  Legend,
  LineChart,
  Line
} from "recharts";

export const SurvivorPlanningPanel: React.FC = () => {
  const [plans, setPlans] = useState<SurvivorPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recalculating, setRecalculating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [seasonInput, setSeasonInput] = useState("2026");
  const [weekInput, setWeekInput] = useState("1");
  const [agentVersionInput, setAgentVersionInput] = useState("v0.50");

  // Selection states
  const [selectedEntryId, setSelectedEntryId] = useState<string>("");
  const [selectedContestId, setSelectedContestId] = useState<string>("");
  const [selectedPlanName, setSelectedPlanName] = useState<string>("");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.fetchLatestSurvivorPlans();
      setPlans(data);
      if (data.length > 0) {
        setSelectedEntryId(data[0].entry_id);
        setSelectedContestId(data[0].contest_id);
        setSelectedPlanName(data[0].plan_name);
      }
    } catch (err: any) {
      setError("Failed to fetch latest survivor plans: " + err.message);
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
      await apiService.runSurvivorPlansCalculate(seasonInput, weekVal, agentVersionInput);
      setSuccessMsg(`V0.50 Survivor multi-week plans optimized successfully for ${seasonInput} Week ${weekVal}.`);
      await loadData();
    } catch (err: any) {
      setError("Failed to calculate survivor plans: " + err.message);
    } finally {
      setRecalculating(false);
    }
  };

  // Find unique entries, contests, and plans
  const uniqueEntries: string[] = Array.from(new Set(plans.map(p => p.entry_id as string))) as string[];
  const uniqueContests: string[] = Array.from(new Set(plans.map(p => p.contest_id as string))) as string[];
  const uniquePlanNames: string[] = Array.from(new Set(plans.map(p => p.plan_name as string))) as string[];

  // Sync state if needed
  useEffect(() => {
    if (uniqueEntries.length > 0 && !uniqueEntries.includes(selectedEntryId)) {
      setSelectedEntryId(uniqueEntries[0]);
    }
    if (uniqueContests.length > 0 && !uniqueContests.includes(selectedContestId)) {
      setSelectedContestId(uniqueContests[0]);
    }
    if (uniquePlanNames.length > 0 && !uniquePlanNames.includes(selectedPlanName)) {
      setSelectedPlanName(uniquePlanNames[0]);
    }
  }, [plans]);

  // Find active plan
  const activePlan = plans.find(
    p => p.entry_id === selectedEntryId && p.contest_id === selectedContestId && p.plan_name === selectedPlanName
  );

  // Parse JSON data for path timeline
  let activeDetails: any = null;
  if (activePlan && activePlan.plan_json) {
    try {
      activeDetails = JSON.parse(activePlan.plan_json);
    } catch (e) {
      console.error("Failed to parse plan JSON:", e);
    }
  }

  // Multi-week survival and future value charts preparation
  const chartData = activeDetails?.sequence?.map((s: any, idx: number) => {
    // Cumulative survival probability calculation
    let cumulative = 1.0;
    for (let i = 0; i <= idx; i++) {
      cumulative *= activeDetails.sequence[i].projected_win_prob;
    }
    return {
      weekLabel: `W${s.week}`,
      team: s.team_id.toUpperCase(),
      winProb: Number((s.projected_win_prob * 100).toFixed(1)),
      cumulativeSurvival: Number((cumulative * 100).toFixed(2)),
      popularity: s.projected_popularity
    };
  }) || [];

  return (
    <div id="survivor-plans-container" className="space-y-6 text-gray-100">
      
      {/* SECTION 1: HEADER & CONTROLS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gray-900/80 p-5 rounded-2xl border border-gray-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-950/80 border border-indigo-800 rounded-lg text-indigo-400">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white font-sans">
              Survivor Multi-Week Plans <span className="text-xs font-mono px-2 py-0.5 ml-2 rounded bg-indigo-950 border border-indigo-800 text-indigo-400">v0.50</span>
            </h2>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            Autonomous multi-week optimization targeting tournament survival, scheduling preservation, and equity maximization.
          </p>
        </div>

        {/* Trigger/Config Form */}
        <div className="flex flex-wrap items-center gap-2.5 bg-gray-950/80 p-3 rounded-xl border border-gray-800">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono text-gray-500 uppercase">Season</span>
            <input 
              type="text" 
              value={seasonInput}
              onChange={(e) => setSeasonInput(e.target.value)}
              className="w-16 px-2 py-1 bg-gray-900 border border-gray-800 rounded text-sm text-center focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono text-gray-500 uppercase">Start Week</span>
            <select
              value={weekInput}
              onChange={(e) => setWeekInput(e.target.value)}
              className="px-2 py-1 bg-gray-900 border border-gray-800 rounded text-sm focus:outline-none focus:border-indigo-500 font-mono"
            >
              {Array.from({ length: 18 }).map((_, i) => (
                <option key={i + 1} value={i + 1}>W{i + 1}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono text-gray-500 uppercase">Agent</span>
            <input 
              type="text" 
              value={agentVersionInput}
              onChange={(e) => setAgentVersionInput(e.target.value)}
              className="w-16 px-2 py-1 bg-gray-900 border border-gray-800 rounded text-sm text-center focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 rounded transition duration-200 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`} />
            {recalculating ? 'Optimizing...' : 'Calculate Path'}
          </button>
        </div>
      </div>

      {/* SUCCESS / ERROR ALERTS */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-emerald-950/50 border border-emerald-800 p-4 rounded-xl text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <p>{successMsg}</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 bg-rose-950/50 border border-rose-800 p-4 rounded-xl text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* FILTER & SELECTOR NAVIGATION BAR */}
      <div className="flex flex-col md:flex-row gap-3 bg-gray-950 border border-gray-800 p-3 rounded-xl">
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Select Entry</label>
          <div className="relative">
            <select
              value={selectedEntryId}
              onChange={(e) => setSelectedEntryId(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 hover:border-gray-700 focus:border-indigo-500 text-sm py-2 px-3 rounded-lg focus:outline-none appearance-none cursor-pointer"
            >
              {uniqueEntries.length === 0 ? (
                <option value="">No Entries Found</option>
              ) : (
                uniqueEntries.map(id => (
                  <option key={id} value={id}>Entry: {id.toUpperCase()}</option>
                ))
              )}
            </select>
          </div>
        </div>

        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Select Contest</label>
          <div className="relative">
            <select
              value={selectedContestId}
              onChange={(e) => setSelectedContestId(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 hover:border-gray-700 focus:border-indigo-500 text-sm py-2 px-3 rounded-lg focus:outline-none appearance-none cursor-pointer"
            >
              {uniqueContests.length === 0 ? (
                <option value="">No Contests Found</option>
              ) : (
                uniqueContests.map(id => (
                  <option key={id} value={id}>Contest: {id.toUpperCase()}</option>
                ))
              )}
            </select>
          </div>
        </div>

        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Optimization Profile</label>
          <div className="flex gap-2">
            {uniquePlanNames.map(name => (
              <button
                key={name}
                onClick={() => setSelectedPlanName(name)}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition duration-200 border cursor-pointer ${
                  selectedPlanName === name
                    ? 'bg-indigo-650 text-white border-indigo-500 shadow-lg shadow-indigo-950/50'
                    : 'bg-gray-900 text-gray-400 border-gray-800 hover:border-gray-700'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-950/50 border border-gray-900 rounded-2xl">
          <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
          <p className="text-gray-400 text-sm font-mono">Compiling optimal survivor paths...</p>
        </div>
      ) : activePlan ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT 2 COLUMNS: METRICS, CHARTS, TIMELINE */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Bento-Grid KPI Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gray-900/80 border border-gray-800/80 p-4 rounded-xl text-center">
                <div className="flex justify-center mb-1 text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="text-xs text-gray-500 font-mono uppercase tracking-wider">Path Survival</div>
                <div className="text-xl font-black font-sans text-emerald-400 mt-1">
                  {(activePlan.projected_survival_probability * 100).toFixed(3)}%
                </div>
              </div>

              <div className="bg-gray-900/80 border border-gray-800/80 p-4 rounded-xl text-center">
                <div className="flex justify-center mb-1 text-amber-400">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div className="text-xs text-gray-500 font-mono uppercase tracking-wider">FV Remaining</div>
                <div className="text-xl font-black font-sans text-amber-400 mt-1">
                  {activePlan.future_value_remaining.toFixed(1)}
                </div>
              </div>

              <div className="bg-gray-900/80 border border-gray-800/80 p-4 rounded-xl text-center">
                <div className="flex justify-center mb-1 text-indigo-400">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="text-xs text-gray-500 font-mono uppercase tracking-wider">Path Efficiency</div>
                <div className="text-xl font-black font-sans text-indigo-400 mt-1">
                  {activePlan.efficiency_score.toFixed(1)}
                </div>
              </div>

              <div className="bg-gray-900/80 border border-gray-800/80 p-4 rounded-xl text-center">
                <div className="flex justify-center mb-1 text-rose-400">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="text-xs text-gray-500 font-mono uppercase tracking-wider">Risk Index</div>
                <div className="text-xl font-black font-sans text-rose-400 mt-1">
                  {activePlan.risk_index.toFixed(1)}
                </div>
              </div>
            </div>

            {/* Charts Section: Cumulative Survival Curve & Weekly Win Probability */}
            <div className="bg-gray-900/50 border border-gray-800 p-5 rounded-2xl">
              <h3 className="text-sm font-bold text-gray-300 font-mono mb-4 uppercase tracking-wider flex items-center gap-2">
                <BarChart4 className="w-4 h-4 text-indigo-400" /> Multi-Week Performance Timeline
              </h3>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSurvival" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorWin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="weekLabel" stroke="#9ca3af" fontSize={11} fontStyle="italic" />
                    <YAxis stroke="#9ca3af" fontSize={11} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#0b0f19", borderColor: "#1f2937", borderRadius: "8px" }}
                      labelStyle={{ color: "#ffffff", fontWeight: "bold" }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Area 
                      name="Cumulative Survival Probability (%)"
                      type="monotone" 
                      dataKey="cumulativeSurvival" 
                      stroke="#4f46e5" 
                      fillOpacity={1} 
                      fill="url(#colorSurvival)" 
                      strokeWidth={2.5}
                    />
                    <Area 
                      name="Individual Game Win Prob (%)"
                      type="monotone" 
                      dataKey="winProb" 
                      stroke="#10b981" 
                      fillOpacity={1} 
                      fill="url(#colorWin)" 
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Path Reasonings and Explanations */}
            <div className="bg-gray-900/50 border border-gray-800 p-5 rounded-2xl space-y-4">
              <div>
                <h4 className="text-xs font-bold text-indigo-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> AGENT COGNITIVE JUSTIFICATION
                </h4>
                <p className="text-gray-300 text-sm mt-2 leading-relaxed italic">
                  "{activePlan.plan_reasoning}"
                </p>
              </div>

              {activeDetails?.reasons && (
                <div className="pt-3 border-t border-gray-800">
                  <h5 className="text-xs font-bold text-gray-400 font-mono uppercase tracking-wider mb-2">Detailed Strategic Pillars</h5>
                  <ul className="space-y-2">
                    {activeDetails.reasons.map((r: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-400 leading-normal">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: DETAILED WEEKLY PICKS SEQUENCE */}
          <div className="space-y-6">
            <div className="bg-gray-900/80 border border-gray-800 p-5 rounded-2xl">
              <h3 className="text-sm font-bold text-gray-300 font-mono uppercase tracking-wider flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-indigo-400" /> Planned Pick Sequence
              </h3>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {activeDetails?.sequence?.map((s: any, idx: number) => {
                  let cumulative = 1.0;
                  for (let i = 0; i <= idx; i++) {
                    cumulative *= activeDetails.sequence[i].projected_win_prob;
                  }
                  
                  return (
                    <div 
                      key={s.week}
                      className="bg-gray-950 p-3 rounded-xl border border-gray-800 hover:border-indigo-950 transition duration-200"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-black font-mono text-indigo-400">WEEK {s.week}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-900 border border-gray-800 text-gray-500">
                          {s.team_id.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-white">{s.team_name}</span>
                        <span className="font-mono text-emerald-400">{(s.projected_win_prob * 100).toFixed(1)}% WP</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-900 text-[10px] text-gray-500">
                        <div>
                          <span className="font-mono">Cumulative WP:</span> <span className="font-bold text-gray-400">{(cumulative * 100).toFixed(1)}%</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono">Projected popularity:</span> <span className="font-bold text-gray-400">{s.projected_popularity}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Model Drift & Compliance Warning */}
            <div className="bg-amber-950/30 border border-amber-900/60 p-4 rounded-xl flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-300 font-mono uppercase tracking-wider">Dynamic Re-balancing Warning</h4>
                <p className="text-gray-400 text-[11px] mt-1 leading-normal">
                  Future-week projections are based on current model outputs. Model drift (V045) and rolling validation (V044) metrics are continuously evaluated. It is highly recommended to re-optimize this path weekly as live NFL results materialize.
                </p>
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="text-center py-16 bg-gray-950 border border-gray-900 rounded-2xl">
          <AlertCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <h3 className="text-gray-400 font-bold">No Plans Generated</h3>
          <p className="text-gray-500 text-xs mt-1">Select week and click 'Calculate Path' to kick off the autonomous multi-week path optimization.</p>
        </div>
      )}

    </div>
  );
};
