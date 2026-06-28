import React, { useState, useEffect } from "react";
import { 
  RefreshCw, 
  BrainCircuit, 
  TrendingUp, 
  Sparkles, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  Play, 
  Compass, 
  ShieldCheck, 
  Zap, 
  Flame, 
  Gauge, 
  BookOpen, 
  Award,
  Plus,
  HelpCircle
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { apiService } from "../services/apiService";

export const WeeklyLearningLoopPanel: React.FC = () => {
  // State variables
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Manual Trigger Form State
  const [season, setSeason] = useState("2026");
  const [week, setWeek] = useState(1);
  const [analyzing, setAnalyzing] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);

  // Selected week for detailed qualitative modal/drawer display
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.fetchLearningAnalytics();
      setAnalytics(data);
      // Auto-select latest week as the default detailed record if none is chosen yet
      if (data && data.history && data.history.length > 0 && !selectedRecord) {
        setSelectedRecord(data.history[0]);
      }
    } catch (err: any) {
      setError("Failed to fetch weekly learning data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAnalyzeWeek = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnalyzing(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await apiService.runWeeklyLearningAnalysis(season, Number(week));
      if (res.success) {
        setSuccessMsg(`Successfully executed learning loop analysis for ${season} Week ${week}.`);
        await loadData();
        // If successful, highlight this new record
        if (res.data) {
          setSelectedRecord(res.data);
        }
      }
    } catch (err: any) {
      setError(`Failed to analyze ${season} Week ${week}: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRebuildHistory = async () => {
    if (!window.confirm("Are you sure you want to rebuild the entire learning loop history? This will re-analyze all historical decisions.")) return;
    setRebuilding(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await apiService.rebuildLearningHistory();
      if (res.success) {
        setSuccessMsg(`Successfully reconstructed learning loops for ${res.count} weeks of historical decision data.`);
        await loadData();
      }
    } catch (err: any) {
      setError(`Failed to rebuild learning loop history: ${err.message}`);
    } finally {
      setRebuilding(false);
    }
  };

  // Safe metrics resolving
  const history = analytics?.history || [];
  const trends = analytics?.trends || [];
  const overallAccuracy = analytics?.overallAccuracy || 0;
  const averageConfidence = analytics?.averageConfidence || 0;
  const recommendationsCount = analytics?.recommendationsCount || 0;
  const strengths = analytics?.strengths || [];
  const weaknesses = analytics?.weaknesses || [];

  // Sort history chronologically for the charts
  const chartData = [...history]
    .sort((a: any, b: any) => {
      if (a.season !== b.season) return a.season.localeCompare(b.season);
      return a.week - b.week;
    })
    .map((h: any) => ({
      label: `W${h.week}`,
      accuracy: h.accuracy,
      confidence: h.average_confidence,
      clv: parseFloat((h.average_closing_line_value * 100).toFixed(1)), // CLV in cents/percentage multiplier for readability
      ev: parseFloat(h.average_expected_value.toFixed(2))
    }));

  // Find dynamic composite score trend
  const learningScoreTrend = trends.find((t: any) => t.metric_name === "Weekly Learning Score");
  const accuracyTrend = trends.find((t: any) => t.metric_name === "Prediction Accuracy");
  const confidenceTrend = trends.find((t: any) => t.metric_name === "Confidence Calibration");

  return (
    <div className="space-y-6" id="learning-loop-panel">
      {/* Upper Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white border border-slate-100 rounded-xl p-5 shadow-sm gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="bg-indigo-50 text-indigo-600 p-2 rounded-lg">
              <BrainCircuit className="h-6 w-6" id="brain-icon" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
                Weekly Learning Loop Subsystem
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-indigo-100">
                  v0.54 Active
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Closes the continuous learning loop by measuring forecasting accuracy, calibrating models, and extracting actionable qualitative insights.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            title="Refresh feedback statistics"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleRebuildHistory}
            disabled={rebuilding || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50"
            title="Reconstruct historical learning loop runs"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            {rebuilding ? "Rebuilding..." : "Rebuild History"}
          </button>
        </div>
      </div>

      {/* Messaging Layers */}
      {error && (
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-start gap-3 text-rose-800 text-sm">
          <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Execution Warning:</span> {error}
          </div>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3 text-emerald-800 text-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Success:</span> {successMsg}
          </div>
        </div>
      )}

      {/* Core Feedback Loop Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Composite Score */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500">Learning Score</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
              learningScoreTrend?.trend_direction === 'UP' 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                : learningScoreTrend?.trend_direction === 'DOWN'
                ? 'bg-rose-50 text-rose-700 border border-rose-100'
                : 'bg-slate-50 text-slate-600 border border-slate-100'
            }`}>
              {learningScoreTrend?.trend_direction === 'UP' ? '▲' : learningScoreTrend?.trend_direction === 'DOWN' ? '▼' : '●'}
              {Math.abs(learningScoreTrend?.percent_change || 0)}%
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-slate-900">
              {learningScoreTrend ? learningScoreTrend.current_value.toFixed(1) : "0.0"}
              <span className="text-slate-400 text-xs font-normal"> / 100</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-indigo-500" />
              Weighted composite performance index
            </p>
          </div>
        </div>

        {/* Card 2: Historical Prediction Accuracy */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500">Prediction Accuracy</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
              accuracyTrend?.trend_direction === 'UP' 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                : 'bg-slate-50 text-slate-600'
            }`}>
              Avg {overallAccuracy.toFixed(1)}%
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-slate-900">
              {accuracyTrend ? accuracyTrend.current_value.toFixed(1) : "0.0"}%
            </div>
            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
              <Award className="h-3 w-3 text-amber-500" />
              Latest completed week survival rate
            </p>
          </div>
        </div>

        {/* Card 3: Confidence Calibration */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500">Confidence Match</span>
            <span className="text-[10px] font-semibold text-slate-400">
              Avg {averageConfidence.toFixed(1)}%
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-slate-900">
              {confidenceTrend ? confidenceTrend.current_value.toFixed(1) : "0.0"}%
            </div>
            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
              <Gauge className="h-3 w-3 text-emerald-500" />
              Predicted self-reported confidence
            </p>
          </div>
        </div>

        {/* Card 4: Total Recommendations */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500">Total Recommendations</span>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
              Active Runs
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-slate-900">
              {recommendationsCount}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-slate-400" />
              Decisions committed to history
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Charts and Manual Input Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Graph Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Weekly Learning Timeline & Calibration</h3>
            <p className="text-xs text-slate-400 mt-0.5">Visualizes performance accuracy vs predicted confidence to track model calibration.</p>
          </div>
          <div className="h-[250px] w-full mt-4">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff" }}
                    labelStyle={{ color: "#94a3b8", fontWeight: "bold" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "10px", marginTop: "10px" }} />
                  <Line type="monotone" dataKey="accuracy" name="Survival Accuracy (%)" stroke="#4f46e5" strokeWidth={3} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="confidence" name="Avg Confidence (%)" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="clv" name="Avg CLV Beat (¢)" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded-lg text-xs text-slate-400">
                Trigger a completed week analysis or rebuild history to populate trend charts.
              </div>
            )}
          </div>
        </div>

        {/* Manual Week Execution Form */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Play className="h-4 w-4 text-indigo-600 fill-indigo-100" />
              Manual Learning Trigger
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Analyze a specific completed week to generate learning outcomes and calibrate the trends.
            </p>

            <form onSubmit={handleAnalyzeWeek} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Season Target</label>
                <select
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-semibold focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                  <option value="2026">2026 NFL Season</option>
                  <option value="2025">2025 NFL Season</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">NFL Week Number</label>
                <input
                  type="number"
                  min="1"
                  max="18"
                  value={week}
                  onChange={(e) => setWeek(Number(e.target.value))}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-semibold focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={analyzing || loading}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors disabled:opacity-50 mt-4"
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Executing Learning Loops...
                  </>
                ) : (
                  <>
                    <BrainCircuit className="h-3.5 w-3.5" />
                    Analyze Week {week} Results
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 mt-4">
            <div className="flex gap-2 items-start">
              <Info className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
              <div className="text-[10px] text-slate-500 leading-relaxed">
                <span className="font-semibold text-slate-700">Automation Trigger:</span> Completed week analysis is executed automatically in production at the close of every weekly decision workflow cycle.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Split Block: Qualitative Insights and Detailed Week View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Strengths and Weaknesses Dashboard */}
        <div className="lg:col-span-1 bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Dynamic Model Strengths & Weaknesses</h3>
            <p className="text-xs text-slate-400 mt-0.5">Discovered via automated continuous learning analysis across all weeks.</p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md mb-2 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Aggregated Strengths (Highly Calibrated)
              </div>
              {strengths.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {strengths.map((s: string, idx: number) => (
                    <span key={idx} className="bg-slate-50 text-slate-600 text-[10px] px-2 py-1 rounded-full border border-slate-100 font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 italic">No model strengths identified yet.</p>
              )}
            </div>

            <div className="border-t border-slate-50 pt-2">
              <div className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-1 rounded-md mb-2 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                Aggregated Blindspots & Weaknesses
              </div>
              {weaknesses.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {weaknesses.map((w: string, idx: number) => (
                    <span key={idx} className="bg-slate-50 text-slate-600 text-[10px] px-2 py-1 rounded-full border border-slate-100 font-medium">
                      {w}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 italic">No model weaknesses identified yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Qualitative Week Analyzer */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Lessons Learned & Feedback loop Card</h3>
              <p className="text-xs text-slate-400 mt-0.5">Selected completed week's qualitative audit data.</p>
            </div>
            {selectedRecord && (
              <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded-lg text-xs">
                {selectedRecord.season} Week {selectedRecord.week}
              </span>
            )}
          </div>

          {selectedRecord ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Engine</div>
                  <div className="text-xs font-bold text-slate-700">{selectedRecord.engine_version}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Accuracy</div>
                  <div className="text-xs font-bold text-slate-700">{selectedRecord.accuracy}%</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Model Hash</div>
                  <div className="text-xs font-bold text-slate-700 font-mono truncate max-w-[80px]" title={selectedRecord.model_hash}>
                    {selectedRecord.model_hash}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Policy Version</div>
                  <div className="text-xs font-bold text-slate-700">{selectedRecord.policy_version}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-indigo-50/45 rounded-xl p-4 border border-indigo-100/30">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-800 mb-1">
                    <BookOpen className="h-4 w-4 text-indigo-500" />
                    Lessons Learned
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    "{selectedRecord.lessons_learned}"
                  </p>
                </div>

                <div className="bg-purple-50/45 rounded-xl p-4 border border-purple-100/30">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-800 mb-1">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    Actionable Recommendations for Improvement
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedRecord.recommendations_for_improvement}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-xs text-slate-400 italic">
              No week record selected. Click the detailed folder icon in the table below to select a week.
            </div>
          )}
        </div>
      </div>

      {/* Historical Learning Logs Grid Table */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-800">Historical Learning & Feedback Logs</h3>
          <p className="text-xs text-slate-400 mt-0.5">Complete ledger of automatically saved continuous learning runs.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold">
                <th className="pb-3 pl-2">Season/Week</th>
                <th className="pb-3">Recommendations</th>
                <th className="pb-3">Success / Fails</th>
                <th className="pb-3">Accuracy</th>
                <th className="pb-3">Avg Confidence</th>
                <th className="pb-3">Avg Expected Value</th>
                <th className="pb-3">Avg CLV Beat</th>
                <th className="pb-3 pr-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-slate-600 text-xs divide-y divide-slate-50">
              {history.length > 0 ? (
                history.map((h: any, idx: number) => {
                  const isSelected = selectedRecord?.season === h.season && selectedRecord?.week === h.week;
                  return (
                    <tr 
                      key={idx} 
                      className={`hover:bg-slate-50/65 transition-colors cursor-pointer ${isSelected ? 'bg-indigo-50/20 font-medium' : ''}`}
                      onClick={() => setSelectedRecord(h)}
                    >
                      <td className="py-3.5 pl-2 font-bold text-slate-900">
                        {h.season} NFL Week {h.week}
                      </td>
                      <td className="py-3.5">{h.recommendations} Decisions</td>
                      <td className="py-3.5 text-slate-500">
                        <span className="text-emerald-600 font-bold">{h.correct_predictions} survived</span>
                        {" / "}
                        <span className="text-rose-500 font-medium">{h.incorrect_predictions} eliminated</span>
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded font-bold text-[10px] ${
                          h.accuracy >= 85 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : h.accuracy >= 60
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          {h.accuracy.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3.5">{h.average_confidence.toFixed(1)}%</td>
                      <td className="py-3.5 font-mono text-slate-500">{h.average_expected_value.toFixed(4)}x</td>
                      <td className="py-3.5 font-bold text-slate-800">+{h.average_closing_line_value.toFixed(3)}</td>
                      <td className="py-3.5 pr-2 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecord(h);
                          }}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${
                            isSelected 
                              ? 'bg-indigo-600 text-white' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Analyze Logs
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                    No learning loop records stored. Click "Rebuild History" or run a manual week analysis to generate.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
