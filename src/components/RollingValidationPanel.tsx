import React, { useState, useEffect } from "react";
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  Zap,
  TrendingUp,
  Sliders,
  Award,
  Target,
  Gauge,
  Activity,
  History,
  Shield,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Info
} from "lucide-react";
import { apiService } from "../services/apiService";
import { RollingValidation } from "../types";

export const RollingValidationPanel: React.FC = () => {
  const [validations, setValidations] = useState<RollingValidation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Backtest triggers
  const [seasonInput, setSeasonInput] = useState("2026");
  const [startWeekInput, setStartWeekInput] = useState("1");
  const [endWeekInput, setEndWeekInput] = useState("4");
  const [versionInput, setVersionInput] = useState("v1.0.0");

  // Filters
  const [modelFilter, setModelFilter] = useState<string>("all");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.fetchRollingValidationHistory();
      setValidations(data);
    } catch (err: any) {
      setError("Failed to fetch Rolling Validation & Backtesting data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunBacktest = async () => {
    setCalculating(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const startW = parseInt(startWeekInput, 10);
      const endW = parseInt(endWeekInput, 10);
      
      if (isNaN(startW) || isNaN(endW) || startW < 1 || startW > 18 || endW < 1 || endW > 18) {
        throw new Error("Weeks must be valid integers between 1 and 18");
      }
      if (startW > endW) {
        throw new Error("Start week cannot be greater than End week");
      }

      await apiService.runRollingValidation(seasonInput, startW, endW, versionInput);
      setSuccessMsg(`V0.44 Rolling Validation Engine successfully completed backtests for Weeks ${startW}-${endW}.`);
      await loadData();
    } catch (err: any) {
      setError("Failed to run backtesting engine: " + err.message);
    } finally {
      setCalculating(false);
    }
  };

  const getActionColorClass = (action: string) => {
    const actionUpper = action.toUpperCase();
    if (actionUpper === "KEEP") return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (actionUpper === "WATCH") return "text-amber-700 bg-amber-50 border-amber-200";
    if (actionUpper === "RECALIBRATE") return "text-orange-700 bg-orange-50 border-orange-200";
    return "text-rose-700 bg-rose-50 border-rose-200";
  };

  const getActionBadge = (action: string) => {
    const actionUpper = action.toUpperCase();
    if (actionUpper === "KEEP") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          🟢 Stable (KEEP)
        </span>
      );
    }
    if (actionUpper === "WATCH") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          🟡 Watch (WATCH)
        </span>
      );
    }
    if (actionUpper === "RECALIBRATE") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
          🟠 Drift (RECALIBRATE)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        🔴 Crit Drift (RETRAIN)
      </span>
    );
  };

  // Filter Logic
  const filteredValidations = validations.filter(v => {
    return modelFilter === "all" || v.model_name.toLowerCase() === modelFilter.toLowerCase();
  });

  const distinctModels = Array.from(new Set(validations.map(v => v.model_name))).sort();

  // Compute stats on filtered list
  const avgAccuracy = filteredValidations.length > 0
    ? filteredValidations.reduce((sum, item) => sum + item.accuracy, 0) / filteredValidations.length
    : 0;

  const avgBrier = filteredValidations.length > 0
    ? filteredValidations.reduce((sum, item) => sum + item.brier_score, 0) / filteredValidations.length
    : 0;

  const avgRmse = filteredValidations.length > 0
    ? filteredValidations.reduce((sum, item) => sum + item.rmse, 0) / filteredValidations.length
    : 0;

  const avgDrift = filteredValidations.length > 0
    ? filteredValidations.reduce((sum, item) => sum + item.drift_score, 0) / filteredValidations.length
    : 0;

  return (
    <div id="rolling-validation-panel" className="space-y-6">
      {/* Header Info Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white border border-gray-100 p-6 rounded-2xl shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            V0.44 Rolling Validation & Backtesting Engine
          </h2>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Continuously evaluates forecasting models over scrolling historical slices to prevent predictive drift and generate reproducible backtesting statistics.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={loadData}
            className="p-2.5 text-gray-600 hover:bg-gray-50 border border-gray-200 rounded-xl transition duration-200"
            title="Refresh Registry"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Operation Status alerts */}
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

      {/* Config Backtest Run Form & Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Backtest Trigger Form */}
        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Sliders className="w-4 h-4 text-indigo-500" />
              Configure Backtest Run
            </h3>
            
            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Season</label>
                <input
                  type="text"
                  value={seasonInput}
                  onChange={(e) => setSeasonInput(e.target.value)}
                  className="w-full text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. 2026"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Start Week</label>
                  <select
                    value={startWeekInput}
                    onChange={(e) => setStartWeekInput(e.target.value)}
                    className="w-full text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {Array.from({ length: 18 }, (_, i) => i + 1).map(w => (
                      <option key={w} value={w.toString()}>Week {w}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">End Week</label>
                  <select
                    value={endWeekInput}
                    onChange={(e) => setEndWeekInput(e.target.value)}
                    className="w-full text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {Array.from({ length: 18 }, (_, i) => i + 1).map(w => (
                      <option key={w} value={w.toString()}>Week {w}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Engine Build Version</label>
                <input
                  type="text"
                  value={versionInput}
                  onChange={(e) => setVersionInput(e.target.value)}
                  className="w-full text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleRunBacktest}
            disabled={calculating}
            className="w-full mt-6 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm transition duration-200 disabled:opacity-75"
          >
            <Zap className="w-4 h-4 text-indigo-100" />
            {calculating ? "Executing Rolling Backtests..." : "Run Rolling Validation"}
          </button>
        </div>

        {/* Right Side: Backtesting Stats Cards Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Stat 1: Rolling Validation Accuracy */}
          <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Rolling Accuracy</span>
              <span className="p-2 bg-indigo-50 rounded-xl">
                <Target className="w-4 h-4 text-indigo-600" />
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">{avgAccuracy.toFixed(1)}%</span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> Robust
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Combined backtested accuracy across evaluated weeks</p>
          </div>

          {/* Stat 2: Rolling Brier Prob Loss */}
          <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Brier probability loss</span>
              <span className="p-2 bg-amber-50 rounded-xl">
                <Gauge className="w-4 h-4 text-amber-600" />
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">{avgBrier.toFixed(4)}</span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                <ArrowDownRight className="w-3 h-3" /> Calibration Optimal
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Overall forecast probability error (lower is better)</p>
          </div>

          {/* Stat 3: Avg Root Mean Squared Error */}
          <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Rolling RMSE</span>
              <span className="p-2 bg-rose-50 rounded-xl">
                <Activity className="w-4 h-4 text-rose-600" />
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">{avgRmse.toFixed(2)}</span>
              <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md">
                Spread Bounds
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Standard deviation of point spread residual errors</p>
          </div>

          {/* Stat 4: Average Drift Index */}
          <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Predictive Drift Score</span>
              <span className="p-2 bg-purple-50 rounded-xl">
                <Shield className="w-4 h-4 text-purple-600" />
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">{avgDrift.toFixed(1)} / 100</span>
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                Divergence
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Detects decay in forecasting algorithms over time</p>
          </div>
        </div>
      </div>

      {/* Historical Validation Timeline Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Backtested Validation Ledger</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-medium">Model Profile:</span>
            <select
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
              className="text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Models</option>
              {distinctModels.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table/List Content */}
        {filteredValidations.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Target className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-medium">No rolling validation data in backtesting ledger.</p>
            <p className="text-xs text-gray-400 mt-1">Configure parameters on the left and run validation tests.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                  <th className="py-4 px-6">Model</th>
                  <th className="py-4 px-6">Validation Slice</th>
                  <th className="py-4 px-6">Games</th>
                  <th className="py-4 px-6 text-center">Wins/Losses</th>
                  <th className="py-4 px-6 text-center">Accuracy</th>
                  <th className="py-4 px-6">Error metrics (RMSE / MAE)</th>
                  <th className="py-4 px-6">Brier & Loss</th>
                  <th className="py-4 px-6 text-center">Spread CLV</th>
                  <th className="py-4 px-6 text-center">Drift Index</th>
                  <th className="py-4 px-6 text-center">Recommended Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredValidations.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition duration-150">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-gray-900">{item.model_name}</div>
                      <div className="text-xs text-gray-400 font-mono">{item.prediction_type} ({item.model_version})</div>
                    </td>
                    <td className="py-4 px-6 text-gray-500 font-medium">W{item.start_week}-W{item.end_week} ({item.season})</td>
                    <td className="py-4 px-6 text-gray-500 font-mono">{item.games_evaluated}</td>
                    <td className="py-4 px-6 text-center text-gray-500 font-mono">{item.wins}W - {item.losses}L</td>
                    <td className="py-4 px-6 text-center">
                      <div className="font-bold text-gray-900">{item.accuracy.toFixed(1)}%</div>
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-500">
                      <div>RMSE: <span className="font-mono">{item.rmse.toFixed(2)}</span></div>
                      <div>MAE: <span className="font-mono">{item.mae.toFixed(2)}</span></div>
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-500">
                      <div>Brier: <span className="font-mono">{item.brier_score.toFixed(4)}</span></div>
                      <div>LogLoss: <span className="font-mono">{item.log_loss.toFixed(4)}</span></div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded ${item.spread_clv > 0 ? "text-emerald-700 bg-emerald-50" : "text-gray-600 bg-gray-100"}`}>
                        {item.spread_clv > 0 ? "+" : ""}{item.spread_clv}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center font-bold text-gray-900">
                      {item.drift_score.toFixed(1)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {getActionBadge(item.recommended_action)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dynamic Backtesting Visualizer (Simulation/Graph Table Placeholder) */}
      <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-500" />
          Reproducible Trend Visualizer
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="text-xs font-medium text-gray-400">Future Team Value</div>
            <div className="mt-2 text-sm font-semibold text-gray-800">Trend: Stable (STABLE)</div>
            <div className="mt-1 w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "94%" }}></div>
            </div>
            <p className="text-xxs text-gray-400 mt-1.5">No noticeable drift. Excellent calibration.</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="text-xs font-medium text-gray-400">Survivor Equity</div>
            <div className="mt-2 text-sm font-semibold text-gray-800">Trend: Rising (IMPROVING)</div>
            <div className="mt-1 w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "98%" }}></div>
            </div>
            <p className="text-xxs text-gray-400 mt-1.5">Variance matches expected win density.</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="text-xs font-medium text-gray-400">Ownership Calibration</div>
            <div className="mt-2 text-sm font-semibold text-gray-800">Trend: Slow Drift (DRIFTING)</div>
            <div className="mt-1 w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: "75%" }}></div>
            </div>
            <p className="text-xxs text-gray-400 mt-1.5">Minor decay. Monitor week outcomes.</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="text-xs font-medium text-gray-400">Market Calibration</div>
            <div className="mt-2 text-sm font-semibold text-gray-800">Trend: High Drift (DECLINING)</div>
            <div className="mt-1 w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: "42%" }}></div>
            </div>
            <p className="text-xxs text-gray-400 mt-1.5">Severe degradation. Requires retraining.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
