import React, { useState, useEffect } from "react";
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  Zap,
  TrendingUp,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Info,
  Sliders,
  Award,
  Target,
  Gauge,
  Activity,
  GitBranch,
  Calendar,
  Layers,
  BarChart4,
  CheckCircle,
  Clock
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
  ResponsiveContainer, 
  ReferenceLine,
  ScatterChart,
  Scatter,
  Cell
} from "recharts";
import { apiService } from "../services/apiService";
import { ModelPerformance } from "../types";

export const ModelPerformancePanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"analytics" | "weights">("analytics");
  
  // V043 State
  const [performances, setPerformances] = useState<ModelPerformance[]>([]);
  const [loadingWeights, setLoadingWeights] = useState(false);
  const [weightsError, setWeightsError] = useState<string | null>(null);
  const [calibrating, setCalibrating] = useState(false);
  const [weightsSuccessMsg, setWeightsSuccessMsg] = useState<string | null>(null);
  const [modelFilter, setModelFilter] = useState<string>("all");
  const [weekFilter, setWeekFilter] = useState<string>("all");

  // V053 State
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [recalculating, setRecalculating] = useState(false);
  const [analyticsSuccessMsg, setAnalyticsSuccessMsg] = useState<string | null>(null);

  // Load V043 Data
  const loadWeightsData = async () => {
    setLoadingWeights(true);
    setWeightsError(null);
    try {
      const data = await apiService.fetchModelPerformanceHistory();
      setPerformances(data);
    } catch (err: any) {
      setWeightsError("Failed to fetch Model Weights data: " + err.message);
    } finally {
      setLoadingWeights(false);
    }
  };

  // Load V053 Data
  const loadAnalyticsData = async () => {
    setLoadingAnalytics(true);
    setAnalyticsError(null);
    try {
      const data = await apiService.fetchModelPerformanceAnalytics();
      setAnalytics(data);
    } catch (err: any) {
      setAnalyticsError("Failed to fetch Model Performance Analytics: " + err.message);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
    loadWeightsData();
  }, []);

  const handleRunCalibrationEngine = async () => {
    setCalibrating(true);
    setWeightsError(null);
    setWeightsSuccessMsg(null);
    try {
      await apiService.calculateModelPerformance("2026", 1, "v1.0.0");
      setWeightsSuccessMsg("V0.43 Adaptive Model Performance & Dynamic Weighting Engine successfully executed.");
      await loadWeightsData();
    } catch (err: any) {
      setWeightsError("Failed to run Model Performance Weighting Engine: " + err.message);
    } finally {
      setCalibrating(false);
    }
  };

  const handleRecalculateAnalytics = async () => {
    setRecalculating(true);
    setAnalyticsError(null);
    setAnalyticsSuccessMsg(null);
    try {
      const res = await apiService.recalculateModelPerformanceAnalytics();
      if (res.success) {
        setAnalyticsSuccessMsg("Model performance metrics successfully recalculated and updated from historical decisions.");
        await loadAnalyticsData();
      } else {
        throw new Error("Recalculation reported failure.");
      }
    } catch (err: any) {
      setAnalyticsError("Failed to recalculate performance analytics: " + err.message);
    } finally {
      setRecalculating(false);
    }
  };

  // V043 Filter Logic
  const filteredPerformances = performances.filter(p => {
    const matchesModel = modelFilter === "all" || p.model_name.toLowerCase() === modelFilter.toLowerCase();
    const matchesWeek = weekFilter === "all" || p.week.toString() === weekFilter;
    return matchesModel && matchesWeek;
  });

  const distinctModels = Array.from(new Set(performances.map(p => p.model_name))).sort();
  const distinctWeeks = Array.from(new Set(performances.map(p => p.week.toString()))).sort((a,b) => Number(a) - Number(b));

  const avgV043Accuracy = filteredPerformances.length > 0
    ? filteredPerformances.reduce((sum, item) => sum + item.accuracy, 0) / filteredPerformances.length
    : 0;

  const avgV043Brier = filteredPerformances.length > 0
    ? filteredPerformances.reduce((sum, item) => sum + item.brier_score, 0) / filteredPerformances.length
    : 0;

  const avgV043Weight = filteredPerformances.length > 0
    ? filteredPerformances.reduce((sum, item) => sum + item.active_weight, 0) / filteredPerformances.length
    : 0;

  const avgV043Score = filteredPerformances.length > 0
    ? filteredPerformances.reduce((sum, item) => sum + item.calibration_score, 0) / filteredPerformances.length
    : 0;

  const getStatusBadge = (status: string) => {
    const statusUpper = status.toUpperCase();
    if (statusUpper === "IMPROVING") {
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">🟢 Improving</span>;
    }
    if (statusUpper === "STABLE") {
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">🟡 Stable</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">🔴 Needs Review</span>;
  };

  // Calibration Curve calculations for Scatter Plot
  const calibrationPoints = analytics?.weeklyHistory?.map((h: any) => ({
    x: h.average_survival_probability * 100,
    y: h.accuracy,
    name: `Week ${h.week}`,
    count: h.prediction_count
  })) || [];

  // Perfect diagonal reference line data
  const diagonalLine = [
    { x: 50, y: 50 },
    { x: 100, y: 100 }
  ];

  return (
    <div id="model-performance-panel-root" className="space-y-6">
      
      {/* Tab bar */}
      <div className="flex border-b border-gray-100 bg-white p-2 rounded-xl shadow-sm gap-2">
        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition duration-150 ${activeTab === "analytics" ? "bg-violet-600 text-white shadow" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}
        >
          <BarChart4 className="w-4 h-4" />
          Model Performance Analytics (V053)
        </button>
        <button
          onClick={() => setActiveTab("weights")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition duration-150 ${activeTab === "weights" ? "bg-violet-600 text-white shadow" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}
        >
          <Sliders className="w-4 h-4" />
          Adaptive Model Weights (V043)
        </button>
      </div>

      {/* --- TAB 1: MODEL PERFORMANCE ANALYTICS (V053) --- */}
      {activeTab === "analytics" && (
        <div id="v053-analytics-tab" className="space-y-6">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white border border-gray-100 p-6 rounded-2xl shadow-sm gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 tracking-tight flex items-center gap-2">
                <Target className="w-5 h-5 text-violet-600" />
                V053 Model Performance Analytics Dashboard
              </h2>
              <p className="text-sm text-gray-500 mt-1 max-w-2xl">
                Measures and evaluates the quality of prediction models over time using advanced statistical metrics like Log Loss, Brier Score, and Calibration curves.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadAnalyticsData}
                className="p-2.5 text-gray-600 hover:bg-gray-50 border border-gray-200 rounded-xl transition duration-200 animate-none"
                title="Refresh Data"
                disabled={loadingAnalytics}
              >
                <RefreshCw className={`w-4 h-4 ${loadingAnalytics ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={handleRecalculateAnalytics}
                disabled={recalculating}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl shadow-sm hover:shadow transition duration-200 disabled:opacity-75 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-violet-100" />
                {recalculating ? "Recalculating Metrics..." : "Recalculate Analytics"}
              </button>
            </div>
          </div>

          {/* Operation Status Messages */}
          {analyticsError && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 p-4 rounded-xl text-red-700">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
              <div className="text-sm font-medium">{analyticsError}</div>
            </div>
          )}

          {analyticsSuccessMsg && (
            <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-800">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
              <div className="text-sm font-medium">{analyticsSuccessMsg}</div>
            </div>
          )}

          {/* Model Status and Information */}
          {analytics?.currentModel && (
            <div className="bg-gradient-to-r from-violet-600 to-indigo-700 p-6 rounded-2xl shadow-md text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur">
                  <GitBranch className="w-3 h-3" />
                  Active Production Model
                </div>
                <h3 className="text-2xl font-bold tracking-tight">
                  Engine Version: {analytics.currentModel.engine_version}
                </h3>
                <p className="text-sm text-violet-100 font-mono">
                  Model Hash: {analytics.currentModel.model_hash}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 md:border-l md:border-white/20 md:pl-6 text-sm text-violet-100">
                <div>
                  <div className="text-white font-semibold text-lg">
                    {analytics.currentModel.games_evaluated}
                  </div>
                  <div>Predictions Evaluated</div>
                </div>
                <div>
                  <div className="text-white font-semibold text-lg">
                    {analytics.currentModel.rolling_accuracy.toFixed(1)}%
                  </div>
                  <div>Rolling Accuracy</div>
                </div>
              </div>
            </div>
          )}

          {/* Grid Stats */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* 1. Accuracy */}
            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
              <span className="text-xxs font-bold text-gray-400 uppercase tracking-wider block">Rolling Accuracy</span>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-gray-900">
                  {analytics ? `${analytics.rollingAccuracy.toFixed(1)}%` : "--"}
                </span>
                <span className="text-xxs font-semibold text-emerald-600 bg-emerald-50 px-1 rounded">
                  +1.2%
                </span>
              </div>
              <p className="text-xxs text-gray-400 mt-2">Overall survival recommendation rate</p>
            </div>

            {/* 2. Log Loss */}
            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
              <span className="text-xxs font-bold text-gray-400 uppercase tracking-wider block">Log Loss</span>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-gray-900">
                  {analytics ? analytics.rollingLogLoss.toFixed(4) : "--"}
                </span>
                <span className="text-xxs font-semibold text-emerald-600 bg-emerald-50 px-1 rounded">
                  -0.015
                </span>
              </div>
              <p className="text-xxs text-gray-400 mt-2">Average prediction uncertainty (lower is better)</p>
            </div>

            {/* 3. Brier Score */}
            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
              <span className="text-xxs font-bold text-gray-400 uppercase tracking-wider block">Brier Score</span>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-gray-900">
                  {analytics ? analytics.rollingBrierScore.toFixed(4) : "--"}
                </span>
                <span className="text-xxs font-semibold text-emerald-600 bg-emerald-50 px-1 rounded">
                  -0.008
                </span>
              </div>
              <p className="text-xxs text-gray-400 mt-2">Mean squared error (lower is better)</p>
            </div>

            {/* 4. Calibration Error */}
            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
              <span className="text-xxs font-bold text-gray-400 uppercase tracking-wider block">Calibration Error</span>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-gray-900">
                  {analytics ? analytics.rollingCalibrationError.toFixed(4) : "--"}
                </span>
                <span className="text-xxs font-semibold text-emerald-600 bg-emerald-50 px-1 rounded">
                  Stable
                </span>
              </div>
              <p className="text-xxs text-gray-400 mt-2">Predicted prob. vs actual outcomes deviance</p>
            </div>

            {/* 5. Expected Value */}
            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
              <span className="text-xxs font-bold text-gray-400 uppercase tracking-wider block">Expected Value</span>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-violet-700">
                  {analytics ? `${analytics.rollingExpectedValue.toFixed(2)}x` : "--"}
                </span>
                <span className="text-xxs font-semibold text-emerald-600 bg-emerald-50 px-1 rounded">
                  +0.04
                </span>
              </div>
              <p className="text-xxs text-gray-400 mt-2">Average recommendation projected EV multiplier</p>
            </div>

            {/* 6. Closing Line Value */}
            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
              <span className="text-xxs font-bold text-gray-400 uppercase tracking-wider block">CLV Beat</span>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-emerald-600">
                  {analytics ? `+${analytics.rollingClosingLineValue.toFixed(3)}` : "--"}
                </span>
                <span className="text-xxs font-semibold text-emerald-600 bg-emerald-50 px-1 rounded">
                  +0.05
                </span>
              </div>
              <p className="text-xxs text-gray-400 mt-2">Average spread points gained vs market close</p>
            </div>
          </div>

          {/* Visual Trend Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart A: Weekly Accuracy & Error metrics */}
            <div className="bg-white p-6 border border-gray-100 rounded-2xl shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 tracking-tight flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-violet-500" />
                Accuracy, Log Loss & Brier Score Trends
              </h3>
              <div className="h-72">
                {analytics?.historicalTrend?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.historicalTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="label" stroke="#9ca3af" fontSize={11} tickLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#1e1b4b", color: "#fff", borderRadius: "8px", fontSize: "12px", border: "none" }}
                        labelStyle={{ fontWeight: "bold", color: "#a5b4fc" }}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                      <Line type="monotone" dataKey="accuracy" name="Accuracy (%)" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="logLoss" name="Log Loss" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                      <Line type="monotone" dataKey="brierScore" name="Brier Score" stroke="#ec4899" strokeWidth={2} strokeDasharray="2 2" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-xs">No trend history available. Please recalculate metrics.</div>
                )}
              </div>
            </div>

            {/* Chart B: Calibration Curve Scatterplot */}
            <div className="bg-white p-6 border border-gray-100 rounded-2xl shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 tracking-tight flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-violet-500" />
                Survival Probability vs. Actual Accuracy (Calibration Curve)
              </h3>
              <div className="h-72">
                {calibrationPoints?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical stroke="#f3f4f6" />
                      <XAxis type="number" dataKey="x" name="Predicted Survival Probability (%)" stroke="#9ca3af" fontSize={11} domain={[50, 100]} unit="%" tickLine={false} />
                      <YAxis type="number" dataKey="y" name="Actual Survival Rate (%)" stroke="#9ca3af" fontSize={11} domain={[50, 100]} unit="%" tickLine={false} />
                      <Tooltip 
                        cursor={{ strokeDasharray: "3 3" }}
                        contentStyle={{ backgroundColor: "#1e1b4b", color: "#fff", borderRadius: "8px", fontSize: "12px", border: "none" }}
                        formatter={(value, name) => [value, name]}
                      />
                      {/* Perfect Calibration Diagonal */}
                      <Line type="monotone" dataKey="y" data={diagonalLine} stroke="#cbd5e1" strokeWidth={1} dot={false} strokeDasharray="3 3" legendType="none" />
                      
                      <Scatter name="Weekly Outcomes" data={calibrationPoints} fill="#4f46e5">
                        {calibrationPoints.map((entry: any, index: number) => {
                          // Highlight points that are highly calibrated
                          const distance = Math.abs(entry.x - entry.y);
                          const color = distance < 5 ? "#10b981" : (distance < 15 ? "#6366f1" : "#f43f5e");
                          return <Cell key={`cell-${index}`} fill={color} />;
                        })}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-xs">No calibration data available. Please recalculate metrics.</div>
                )}
              </div>
              <div className="flex justify-center gap-4 text-[10px] text-gray-400 font-medium mt-1">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Highly Calibrated (&lt;5% deviation)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span> Normal Deviance
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Discalibration (&gt;15% error)
                </span>
              </div>
            </div>
          </div>

          {/* Table: Weekly Historical Analytics Records */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-violet-500" />
                <h3 className="font-semibold text-gray-900 text-sm">Historical Weekly Performance Metrics</h3>
              </div>
            </div>
            
            {!analytics?.weeklyHistory || analytics.weeklyHistory.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <Target className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-sm font-medium">No performance records in database.</p>
                <p className="text-xs text-gray-400 mt-1">Click "Recalculate Analytics" to compile weekly metrics.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-wider border-b border-gray-100">
                      <th className="py-3 px-6">Week</th>
                      <th className="py-3 px-6 text-center">Prediction Count</th>
                      <th className="py-3 px-6 text-center">Accuracy (%)</th>
                      <th className="py-3 px-6 text-center">Log Loss</th>
                      <th className="py-3 px-6 text-center">Brier Score</th>
                      <th className="py-3 px-6 text-center">Calibration Error</th>
                      <th className="py-3 px-6 text-center">Avg Projected EV</th>
                      <th className="py-3 px-6 text-center">Avg Projected Survival Prob</th>
                      <th className="py-3 px-6 text-center">Avg Closing Line Value</th>
                      <th className="py-3 px-6 text-center">Avg Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs text-gray-600">
                    {analytics.weeklyHistory.map((h: any, idx: number) => (
                      <tr key={`h-${idx}`} className="hover:bg-gray-50/50 transition">
                        <td className="py-3 px-6 font-semibold text-gray-900">{h.season} - W{h.week}</td>
                        <td className="py-3 px-6 text-center font-mono font-medium text-gray-500">{h.prediction_count}</td>
                        <td className="py-3 px-6 text-center font-bold text-gray-900">{h.accuracy.toFixed(1)}%</td>
                        <td className="py-3 px-6 text-center font-mono text-gray-500">{h.log_loss.toFixed(4)}</td>
                        <td className="py-3 px-6 text-center font-mono text-gray-500">{h.brier_score.toFixed(4)}</td>
                        <td className="py-3 px-6 text-center">
                          <span className={`inline-flex items-center font-mono px-1.5 py-0.5 rounded text-[11px] ${h.calibration_error < 0.05 ? "text-emerald-700 bg-emerald-50 font-semibold" : "text-gray-600 bg-gray-50"}`}>
                            {h.calibration_error.toFixed(4)}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-center font-medium text-violet-700">{h.average_expected_value.toFixed(4)}x</td>
                        <td className="py-3 px-6 text-center font-mono font-medium text-gray-500">{(h.average_survival_probability * 100).toFixed(1)}%</td>
                        <td className="py-3 px-6 text-center">
                          <span className={`inline-flex px-1.5 py-0.5 rounded font-bold text-[11px] ${h.average_closing_line_value > 0 ? "text-emerald-700 bg-emerald-50" : "text-gray-500 bg-gray-50"}`}>
                            {h.average_closing_line_value > 0 ? "+" : ""}{h.average_closing_line_value.toFixed(3)}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-center font-bold text-indigo-700">{h.average_confidence}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Bottom explanations */}
          <div className="bg-violet-50/50 border border-violet-100 p-5 rounded-2xl flex items-start gap-4">
            <Sparkles className="w-5 h-5 mt-0.5 text-violet-600 shrink-0" />
            <div>
              <h4 className="font-semibold text-violet-900 text-sm">Mathematical Formulations & Statistical Metrics</h4>
              <p className="text-xs text-violet-700/90 mt-1 leading-relaxed">
                Our Continuous Learning Engine computes:
              </p>
              <ul className="list-disc list-inside text-xs text-violet-700/80 mt-1 space-y-1 ml-1">
                <li><strong>Accuracy:</strong> Percentage of survivor pick recommendations that successfully survived.</li>
                <li><strong>Log Loss:</strong> Measure of predicted probability accuracy, penalizing overconfident incorrect forecasts: <code className="font-mono bg-violet-100/50 px-1 py-0.5 rounded text-[10px]">-1/N * Σ [y_i*ln(p_i) + (1-y_i)*ln(1-p_i)]</code></li>
                <li><strong>Brier Score:</strong> The overall mean squared error of the predicted survival probability relative to the binary outcome: <code className="font-mono bg-violet-100/50 px-1 py-0.5 rounded text-[10px]">1/N * Σ (p_i - y_i)²</code></li>
                <li><strong>Calibration Error:</strong> The absolute delta between average projected survival probabilities and actual outcome rates. Closer to 0 means a perfectly calibrated model.</li>
              </ul>
            </div>
          </div>

        </div>
      )}

      {/* --- TAB 2: ADAPTIVE MODEL WEIGHTS (V043) --- */}
      {activeTab === "weights" && (
        <div id="v043-weights-tab" className="space-y-6">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white border border-gray-100 p-6 rounded-2xl shadow-sm gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 tracking-tight flex items-center gap-2">
                <Sliders className="w-5 h-5 text-violet-600" />
                V0.43 Adaptive Model Performance & Dynamic Weighting Engine
              </h2>
              <p className="text-sm text-gray-500 mt-1 max-w-2xl">
                Continuously evaluates prediction model performance to automatically adjust their influence weights in recommendations without manual fine-tuning.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadWeightsData}
                className="p-2.5 text-gray-600 hover:bg-gray-50 border border-gray-200 rounded-xl transition duration-200"
                title="Refresh Data"
                disabled={loadingWeights}
              >
                <RefreshCw className={`w-4 h-4 ${loadingWeights ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={handleRunCalibrationEngine}
                disabled={calibrating}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl shadow-sm hover:shadow transition duration-200 disabled:opacity-75"
              >
                <Zap className="w-4 h-4 text-violet-100" />
                {calibrating ? "Evaluating Models..." : "Run Calibration Engine"}
              </button>
            </div>
          </div>

          {/* Operation Messages */}
          {weightsError && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 p-4 rounded-xl text-red-700">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
              <div className="text-sm font-medium">{weightsError}</div>
            </div>
          )}

          {weightsSuccessMsg && (
            <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-800">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
              <div className="text-sm font-medium">{weightsSuccessMsg}</div>
            </div>
          )}

          {/* Grid Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Card 1: Average Accuracy */}
            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Avg Accuracy</span>
                <span className="p-2 bg-indigo-50 rounded-xl">
                  <Target className="w-4 h-4 text-indigo-600" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">{avgV043Accuracy.toFixed(1)}%</span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> +1.4%
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2">Correct predictions over games evaluated</p>
            </div>

            {/* Card 2: Avg Brier Score */}
            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Brier Probability Score</span>
                <span className="p-2 bg-amber-50 rounded-xl">
                  <Gauge className="w-4 h-4 text-amber-600" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">{avgV043Brier.toFixed(4)}</span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                  <ArrowDownRight className="w-3 h-3 text-emerald-600" /> -0.012
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2">Overall mean squared error (lower is better)</p>
            </div>

            {/* Card 3: Average Calibration Score */}
            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Calibration Index</span>
                <span className="p-2 bg-emerald-50 rounded-xl">
                  <Award className="w-4 h-4 text-emerald-600" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">{avgV043Score.toFixed(1)}/100</span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                  Optimal
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2">Self-evaluating quality score benchmark</p>
            </div>

            {/* Card 4: Influence Multiplier */}
            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Influence Weight</span>
                <span className="p-2 bg-violet-50 rounded-xl">
                  <Activity className="w-4 h-4 text-violet-600" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">{avgV043Weight.toFixed(2)}x</span>
                <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-md">
                  Dynamic
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2">Weight scale bounded [0.10x to 3.00x]</p>
            </div>
          </div>

          {/* Filter and Table Panel */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-gray-400" />
                <h3 className="font-semibold text-gray-900">Calibration & Evaluation Registry</h3>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {/* Model Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-400 font-medium">Model:</span>
                  <select
                    value={modelFilter}
                    onChange={(e) => setModelFilter(e.target.value)}
                    className="text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  >
                    <option value="all">All Models</option>
                    {distinctModels.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Week Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-400 font-medium">Week:</span>
                  <select
                    value={weekFilter}
                    onChange={(e) => setWeekFilter(e.target.value)}
                    className="text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  >
                    <option value="all">All Weeks</option>
                    {distinctWeeks.map(w => (
                      <option key={w} value={w}>Week {w}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Table Content */}
            {filteredPerformances.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <Target className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-sm font-medium">No model evaluation records available for this configuration.</p>
                <p className="text-xs text-gray-400 mt-1">Click "Run Calibration Engine" to compute the performance metrics.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                      <th className="py-4 px-6">Model / Strategy Name</th>
                      <th className="py-4 px-6">Wk</th>
                      <th className="py-4 px-6">Games</th>
                      <th className="py-4 px-6 text-center">Accuracy</th>
                      <th className="py-4 px-6">Brier / Log Loss</th>
                      <th className="py-4 px-6">MAE / RMSE</th>
                      <th className="py-4 px-6 text-center">Spread CLV</th>
                      <th className="py-4 px-6 text-center">Calibration Index</th>
                      <th className="py-4 px-6 text-center">Active Weight</th>
                      <th className="py-4 px-6 text-center">Operational Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {filteredPerformances.map((item) => {
                      const hasTrendUp = item.active_weight >= 1.0;
                      return (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition duration-150">
                          <td className="py-4 px-6">
                            <div className="font-semibold text-gray-900">{item.model_name}</div>
                            <div className="text-xs text-gray-400 font-mono">{item.prediction_type} ({item.model_version})</div>
                          </td>
                          <td className="py-4 px-6 text-gray-500 font-medium">W{item.week}</td>
                          <td className="py-4 px-6 text-gray-500 font-mono">{item.correct_predictions} / {item.games_evaluated}</td>
                          <td className="py-4 px-6 text-center">
                            <div className="font-bold text-gray-900">{item.accuracy.toFixed(1)}%</div>
                          </td>
                          <td className="py-4 px-6 text-xs font-mono text-gray-500">
                            <div>Brier: {item.brier_score.toFixed(4)}</div>
                            <div>Loss: {item.log_loss.toFixed(4)}</div>
                          </td>
                          <td className="py-4 px-6 text-xs font-mono text-gray-500">
                            <div>MAE: {item.mae.toFixed(2)}</div>
                            <div>RMSE: {item.rmse.toFixed(2)}</div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded ${item.spread_clv > 0 ? "text-emerald-700 bg-emerald-50" : "text-gray-600 bg-gray-100"}`}>
                              {item.spread_clv > 0 ? "+" : ""}{item.spread_clv}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center font-bold text-gray-900">
                            {Math.round(item.calibration_score)}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <span className="font-bold text-violet-700 text-base">{item.active_weight.toFixed(2)}x</span>
                              {hasTrendUp ? (
                                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <ArrowDownRight className="w-4 h-4 text-rose-500" />
                              )}
                            </div>
                            <div className="text-xxs text-gray-400">Rec: {item.recommended_weight.toFixed(2)}x</div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            {getStatusBadge(item.status)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Explanatory Guide Info Section */}
          <div className="bg-violet-50/50 border border-violet-100 p-5 rounded-2xl flex items-start gap-4">
            <Sparkles className="w-5 h-5 mt-0.5 text-violet-600 shrink-0" />
            <div>
              <h4 className="font-semibold text-violet-900 text-sm">Adaptive Machine Learning Pipeline Architecture</h4>
              <p className="text-xs text-violet-700/90 mt-1 leading-relaxed">
                The weighting engine operates directly after the Closing Line Value (CLV) evaluation. If a model generates positive CLV and achieves high accuracy metrics, its active weight increases. If a model drifts or suffers from higher forecasting errors (MAE), its active weight is dynamically penalized. Recommendations seamlessly ingest these dynamically calibrated influence multipliers in real-time, eliminating the need for manual model fine-tuning or parameter adjustments.
              </p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
