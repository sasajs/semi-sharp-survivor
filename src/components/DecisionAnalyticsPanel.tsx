import React, { useState, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Activity, 
  Target, 
  ShieldAlert, 
  Zap, 
  RefreshCw, 
  Award,
  BookOpen
} from "lucide-react";

interface SummaryRecord {
  season: string;
  week: number;
  recommendations: number;
  wins: number;
  losses: number;
  survival_rate: number;
  average_confidence: number;
  average_expected_value: number;
  average_future_value: number;
  average_championship_probability: number;
  average_closing_line_value: number;
}

interface HistoryRecord {
  id?: number;
  season: string;
  week: number;
  contest_id: string;
  recommendation_id: string;
  engine_version: string;
  selected_team: string;
  projected_survival_probability: number;
  projected_championship_probability: number;
  projected_expected_value: number;
  projected_future_value: number;
  confidence_score: number;
  created_at: string;
  outcome?: {
    game_result: string;
    survived: boolean;
    eliminated: boolean;
    actual_win_probability: number;
    market_open_line: number;
    closing_line: number;
    closing_line_value: number;
    evaluation_notes: string;
  };
}

export function DecisionAnalyticsPanel() {
  const [summaries, setSummaries] = useState<SummaryRecord[]>([]);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // Evaluation input form state
  const [evalSeason, setEvalSeason] = useState("2026");
  const [evalWeek, setEvalWeek] = useState(1);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/decision-analytics");
      if (!res.ok) {
        throw new Error(`Failed to fetch decision analytics: ${res.statusText}`);
      }
      const data = await res.json();
      setSummaries(data.summaries || []);
      setHistory(data.history || []);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred fetching performance data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEvaluateWeek = async (e: React.FormEvent) => {
    e.preventDefault();
    setEvaluating(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/decision-analytics/evaluate-week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ season: evalSeason, week: evalWeek })
      });
      if (!res.ok) {
        throw new Error(`Evaluation failed: ${res.statusText}`);
      }
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Successfully evaluated Week ${evalWeek}. Survival Rate: ${data.data.survival_rate}%`);
        await fetchData();
      } else {
        throw new Error(data.error || "Evaluation returned an unsuccessful state.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to trigger week evaluation.");
    } finally {
      setEvaluating(false);
    }
  };

  // Helper stats calculations
  const totalDecisions = history.length;
  const survivedDecisions = history.filter(h => h.outcome?.survived).length;
  const averageWinRate = totalDecisions > 0 ? parseFloat(((survivedDecisions / totalDecisions) * 100).toFixed(1)) : 0;
  
  const clvList = history.map(h => h.outcome?.closing_line_value ?? 0);
  const totalCLV = clvList.reduce((sum, val) => sum + val, 0);
  const averageCLV = clvList.length > 0 ? parseFloat((totalCLV / clvList.length).toFixed(2)) : 0;

  const confList = history.map(h => h.confidence_score);
  const totalConf = confList.reduce((sum, val) => sum + val, 0);
  const averageConfidence = confList.length > 0 ? parseFloat((totalConf / confList.length).toFixed(1)) : 0;

  // Prepare chart datasets
  const chartData = [...summaries].sort((a, b) => a.week - b.week).map(s => ({
    week: `W${s.week}`,
    "Survival Rate (%)": s.survival_rate,
    "Avg Confidence (%)": s.average_confidence,
    "CLV Beat (Points)": s.average_closing_line_value
  }));

  return (
    <div className="space-y-6" id="decision-analytics-panel">
      
      {/* Title block */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-full">
              Decision Analytics &amp; Continuous Learning
            </span>
            <h2 className="text-2xl font-black text-slate-950 tracking-tight mt-2.5">
              Continuous Learning Foundation &amp; Performance Reports
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              V0.52 of Semi-Sharp introduces an automated performance logging ledger and closing line value (CLV) validation matrix to audit the decisions made by the engine over time.
            </p>
          </div>
          <button 
            onClick={fetchData}
            disabled={loading}
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-4 py-2 text-xs font-black tracking-wide flex items-center gap-2 cursor-pointer shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-400" : ""}`} />
            REFRESH LEDGER DATA
          </button>
        </div>
      </div>

      {/* Status messages */}
      {successMsg && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-xl flex items-start gap-3 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-emerald-800 font-semibold">{successMsg}</p>
          </div>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-400 hover:text-emerald-600 text-xs font-bold font-mono">✕</button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl flex items-start gap-3 shadow-sm">
          <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-rose-850 font-bold">{errorMsg}</p>
          </div>
          <button onClick={() => setErrorMsg("")} className="text-rose-400 hover:text-rose-600 text-xs font-bold font-mono">✕</button>
        </div>
      )}

      {/* Metric cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Tracked Decisions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Tracked Decisions</p>
              <h4 className="text-3xl font-black text-slate-900 mt-2">{totalDecisions}</h4>
            </div>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[10px] text-slate-500 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            IMMUTABLE LEDGER ENTRIES
          </div>
        </div>

        {/* Aggregate Survival (Win) Rate */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Survivor Win Rate</p>
              <h4 className="text-3xl font-black text-slate-900 mt-2">{averageWinRate}%</h4>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-[10px] text-emerald-600 font-extrabold uppercase">
            {averageWinRate >= 80 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {survivedDecisions} / {totalDecisions} RECOMMENDED PATHS survived
          </div>
        </div>

        {/* Avg Closing Line Value (CLV) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Avg Closing Line Value</p>
              <h4 className="text-3xl font-black text-slate-900 mt-2">
                {averageCLV >= 0 ? "+" : ""}{averageCLV}
              </h4>
            </div>
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[10px] text-slate-500 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
            SPREAD BEAT IN POINTS
          </div>
        </div>

        {/* Avg Decision Confidence */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Avg Decision Confidence</p>
              <h4 className="text-3xl font-black text-slate-900 mt-2">{averageConfidence}%</h4>
            </div>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[10px] text-slate-500 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            PORTFOLIO RISK OPTIMIZATION COHERENCE
          </div>
        </div>

      </div>

      {/* Charts Area */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Chart 1: Win Rate vs Confidence */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-black text-slate-950 uppercase tracking-wide mb-4">
              Model Calibration (Win Rate vs Average Confidence)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="week" stroke="#94A3B8" fontSize={11} fontWeight="600" />
                  <YAxis stroke="#94A3B8" fontSize={11} fontWeight="600" />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0" }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Line 
                    type="monotone" 
                    dataKey="Survival Rate (%)" 
                    stroke="#10B981" 
                    strokeWidth={3} 
                    activeDot={{ r: 8 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Avg Confidence (%)" 
                    stroke="#6366F1" 
                    strokeWidth={3} 
                    strokeDasharray="5 5" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Average CLV Beaten */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-black text-slate-950 uppercase tracking-wide mb-4">
              Average Closing Line Value (CLV Beat) By Week
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="week" stroke="#94A3B8" fontSize={11} fontWeight="600" />
                  <YAxis stroke="#94A3B8" fontSize={11} fontWeight="600" />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0" }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar dataKey="CLV Beat (Points)" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* Active week evaluation trigger form */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-black text-slate-950 uppercase tracking-wide flex items-center gap-2">
          <Zap className="w-4 h-4 text-indigo-600" />
          Trigger Performance Outcome Evaluation
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Simulate game endings and score finalizations. This processes all active entries for the specified week, grades recommendation success against final game scores, and commits closing line values to the immutable ledger.
        </p>
        <form onSubmit={handleEvaluateWeek} className="mt-4 flex flex-wrap gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-extrabold uppercase">Contest Season</label>
            <select 
              value={evalSeason}
              onChange={(e) => setEvalSeason(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
            >
              <option value="2026">Circa Survivor 2026</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-extrabold uppercase">Regular Season Week</label>
            <select 
              value={evalWeek}
              onChange={(e) => setEvalWeek(parseInt(e.target.value))}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 w-28"
            >
              {Array.from({ length: 18 }, (_, idx) => idx + 1).map(w => (
                <option key={w} value={w}>Week {w}</option>
              ))}
            </select>
          </div>
          <button 
            type="submit"
            disabled={evaluating}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl px-4 py-2 text-xs font-black tracking-wide cursor-pointer transition-all flex items-center gap-2 h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${evaluating ? "animate-spin" : ""}`} />
            {evaluating ? "EVALUATING..." : "RUN EVALUATION ENGINE"}
          </button>
        </form>
      </div>

      {/* Weekly summaries list table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-black text-slate-950 uppercase tracking-wide">
              Weekly Performance Analytics Ledger
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">
              Historical summaries aggregated on a weekly basis
            </p>
          </div>
        </div>
        {loading && summaries.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs font-medium">
            Fetching weekly metrics summaries...
          </div>
        ) : summaries.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">
            No weekly performance summaries compiled yet. Run an evaluation above to generate stats!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 text-slate-400 uppercase font-extrabold text-[9px] border-b border-slate-200">
                  <th className="px-6 py-3.5">Season/Week</th>
                  <th className="px-6 py-3.5">Decisions</th>
                  <th className="px-6 py-3.5">Wins/Losses</th>
                  <th className="px-6 py-3.5">Survival Rate</th>
                  <th className="px-6 py-3.5">Avg EV Metric</th>
                  <th className="px-6 py-3.5">Avg Model Conf.</th>
                  <th className="px-6 py-3.5">Avg CLV Beaten</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {summaries.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      NFL {s.season} Week {s.week}
                    </td>
                    <td className="px-6 py-4">{s.recommendations}</td>
                    <td className="px-6 py-4">
                      <span className="text-emerald-600">{s.wins}W</span>
                      <span className="text-slate-300 mx-1.5">|</span>
                      <span className="text-rose-600">{s.losses}L</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        s.survival_rate >= 80 ? "bg-emerald-50 text-emerald-700" : (s.survival_rate >= 50 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700")
                      }`}>
                        {s.survival_rate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-500">
                      {s.average_expected_value.toFixed(3)} EV
                    </td>
                    <td className="px-6 py-4">{s.average_confidence}%</td>
                    <td className={`px-6 py-4 font-bold ${s.average_closing_line_value >= 0 ? "text-sky-600" : "text-rose-500"}`}>
                      {s.average_closing_line_value >= 0 ? "+" : ""}{s.average_closing_line_value} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Immutable ledger history */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200">
          <h3 className="text-sm font-black text-slate-950 uppercase tracking-wide">
            Immutable Decision Ledger &amp; Outcomes (V0.52 Audit)
          </h3>
          <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">
            Cryptographically tracked recommendations and actual outcomes
          </p>
        </div>
        {loading && history.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs font-medium">
            Fetching logged decisions...
          </div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">
            No decisions logged yet. Trigger recommendations calculation or run a workflow execution to log decisions.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 text-slate-400 uppercase font-extrabold text-[9px] border-b border-slate-200">
                  <th className="px-6 py-3.5">Season/Week</th>
                  <th className="px-6 py-3.5">Contest ID</th>
                  <th className="px-6 py-3.5">Selected Team</th>
                  <th className="px-6 py-3.5">Model Survival %</th>
                  <th className="px-6 py-3.5">Confidence</th>
                  <th className="px-6 py-3.5">Outcome Status</th>
                  <th className="px-6 py-3.5">CLV Audit</th>
                  <th className="px-6 py-3.5">Audit Evaluation Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {history.map((h, idx) => {
                  const hasOutcome = !!h.outcome;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        W{h.week} ({h.season})
                      </td>
                      <td className="px-6 py-4 text-slate-500">{h.contest_id}</td>
                      <td className="px-6 py-4">
                        <span className="font-extrabold text-slate-900 bg-slate-100 px-2 py-1 rounded">
                          {h.selected_team.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-500">
                        {(h.projected_survival_probability * 100).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4">{h.confidence_score}%</td>
                      <td className="px-6 py-4">
                        {hasOutcome ? (
                          h.outcome!.survived ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                              <CheckCircle2 className="w-3 h-3" />
                              Survived
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                              <XCircle className="w-3 h-3" />
                              Eliminated
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                            <HelpCircle className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {hasOutcome ? (
                          <span className={`font-bold ${h.outcome!.closing_line_value >= 0 ? "text-sky-600" : "text-rose-500"}`}>
                            {h.outcome!.closing_line_value >= 0 ? "+" : ""}{h.outcome!.closing_line_value} pts
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={h.outcome?.evaluation_notes}>
                        {h.outcome?.evaluation_notes || "Awaiting game result finalizations..."}
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
  );
}
