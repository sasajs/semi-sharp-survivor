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
  Activity
} from "lucide-react";
import { apiService } from "../services/apiService";
import { ModelPerformance } from "../types";

export const ModelPerformancePanel: React.FC = () => {
  const [performances, setPerformances] = useState<ModelPerformance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [modelFilter, setModelFilter] = useState<string>("all");
  const [weekFilter, setWeekFilter] = useState<string>("all");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.fetchModelPerformanceHistory();
      setPerformances(data);
    } catch (err: any) {
      setError("Failed to fetch Model Performance data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunPerformanceEngine = async () => {
    setCalculating(true);
    setError(null);
    setSuccessMsg(null);
    try {
      // Trigger V043 calculation for Season 2026, Week 1, Version v1.0.0
      await apiService.calculateModelPerformance("2026", 1, "v1.0.0");
      setSuccessMsg("V0.43 Adaptive Model Performance & Dynamic Weighting Engine successfully executed and stored.");
      await loadData();
    } catch (err: any) {
      setError("Failed to run Model Performance Engine: " + err.message);
    } finally {
      setCalculating(false);
    }
  };

  const getStatusColorClass = (status: string) => {
    const statusUpper = status.toUpperCase();
    if (statusUpper === "IMPROVING") return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (statusUpper === "STABLE") return "text-amber-700 bg-amber-50 border-amber-200";
    return "text-rose-700 bg-rose-50 border-rose-200";
  };

  const getStatusBadge = (status: string) => {
    const statusUpper = status.toUpperCase();
    if (statusUpper === "IMPROVING") return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">🟢 Improving</span>;
    if (statusUpper === "STABLE") return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">🟡 Stable</span>;
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">🔴 Needs Review</span>;
  };

  // Filter Logic
  const filteredPerformances = performances.filter(p => {
    const matchesModel = modelFilter === "all" || p.model_name.toLowerCase() === modelFilter.toLowerCase();
    const matchesWeek = weekFilter === "all" || p.week.toString() === weekFilter;
    return matchesModel && matchesWeek;
  });

  // Distinct Filter options
  const distinctModels = Array.from(new Set(performances.map(p => p.model_name))).sort();
  const distinctWeeks = Array.from(new Set(performances.map(p => p.week.toString()))).sort((a,b) => Number(a) - Number(b));

  // Compute stats based on selected filters
  const avgAccuracy = filteredPerformances.length > 0
    ? filteredPerformances.reduce((sum, item) => sum + item.accuracy, 0) / filteredPerformances.length
    : 0;

  const avgBrier = filteredPerformances.length > 0
    ? filteredPerformances.reduce((sum, item) => sum + item.brier_score, 0) / filteredPerformances.length
    : 0;

  const avgWeight = filteredPerformances.length > 0
    ? filteredPerformances.reduce((sum, item) => sum + item.active_weight, 0) / filteredPerformances.length
    : 0;

  const avgScore = filteredPerformances.length > 0
    ? filteredPerformances.reduce((sum, item) => sum + item.calibration_score, 0) / filteredPerformances.length
    : 0;

  return (
    <div id="model-performance-panel" className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white border border-gray-100 p-6 rounded-2xl shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight flex items-center gap-2">
            <Target className="w-5 h-5 text-violet-600" />
            V0.43 Adaptive Model Performance & Dynamic Weighting Engine
          </h2>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Continuously evaluates prediction model performance to automatically adjust their influence weights in recommendations without manual fine-tuning.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 text-gray-600 hover:bg-gray-50 border border-gray-200 rounded-xl transition duration-200"
            title="Refresh Data"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleRunPerformanceEngine}
            disabled={calculating}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl shadow-sm hover:shadow transition duration-200 disabled:opacity-75"
          >
            <Zap className="w-4 h-4 text-violet-100" />
            {calculating ? "Evaluating Models..." : "Run Calibration Engine"}
          </button>
        </div>
      </div>

      {/* Operation Messages */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 p-4 rounded-xl text-red-700">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
          <div className="text-sm font-medium">{error}</div>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-800">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
          <div className="text-sm font-medium">{successMsg}</div>
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
            <span className="text-2xl font-bold text-gray-900">{avgAccuracy.toFixed(1)}%</span>
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
            <span className="text-2xl font-bold text-gray-900">{avgBrier.toFixed(4)}</span>
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
            <span className="text-2xl font-bold text-gray-900">{avgScore.toFixed(1)}/100</span>
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
            <span className="text-2xl font-bold text-gray-900">{avgWeight.toFixed(2)}x</span>
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
  );
};
