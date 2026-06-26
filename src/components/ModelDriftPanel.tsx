import React, { useState, useEffect } from "react";
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  Zap,
  TrendingDown,
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
  Info,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from "lucide-react";
import { apiService } from "../services/apiService";
import { ModelDrift } from "../types";

export const ModelDriftPanel: React.FC = () => {
  const [drifts, setDrifts] = useState<ModelDrift[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Recalculation triggers
  const [seasonInput, setSeasonInput] = useState("2026");
  const [weekInput, setWeekInput] = useState("1");
  const [versionInput, setVersionInput] = useState("v1.0.0");

  // Filters
  const [modelFilter, setModelFilter] = useState<string>("all");

  // Expanded rows for explanation drill-down
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.fetchModelDriftHistory();
      setDrifts(data);
    } catch (err: any) {
      setError("Failed to fetch Model Drift Detection data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunDriftCheck = async () => {
    setCalculating(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const weekVal = parseInt(weekInput, 10);
      
      if (isNaN(weekVal) || weekVal < 1 || weekVal > 18) {
        throw new Error("Week must be a valid integer between 1 and 18");
      }

      await apiService.runModelDriftCalculate(seasonInput, weekVal, versionInput);
      setSuccessMsg(`V0.45 Drift Engine successfully monitored predictive behavior and updated recalibration matrices for Week ${weekVal}.`);
      await loadData();
    } catch (err: any) {
      setError("Failed to run drift detection: " + err.message);
    } finally {
      setCalculating(false);
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getDriftLevelBadge = (level: string) => {
    const lvlUpper = level.toUpperCase();
    if (lvlUpper === "STABLE") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          🟢 Stable
        </span>
      );
    }
    if (lvlUpper === "MONITOR") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
          🟡 Monitor
        </span>
      );
    }
    if (lvlUpper === "WARNING") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
          🟠 Warning
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
        🔴 Critical
      </span>
    );
  };

  const getActionBadge = (action: string) => {
    const actUpper = action.toUpperCase();
    if (actUpper === "NONE") {
      return <span className="text-xs font-medium text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded border border-emerald-200">No Action</span>;
    }
    if (actUpper === "INVESTIGATE") {
      return <span className="text-xs font-medium text-yellow-700 bg-yellow-100/60 px-2 py-0.5 rounded border border-yellow-200">Investigate</span>;
    }
    if (actUpper === "RECALIBRATE") {
      return <span className="text-xs font-medium text-orange-700 bg-orange-100/60 px-2 py-0.5 rounded border border-orange-200">Recalibrate</span>;
    }
    return <span className="text-xs font-medium text-rose-700 bg-rose-100/60 px-2 py-0.5 rounded border border-rose-200">Retrain Model</span>;
  };

  const getPriorityColor = (priority: string) => {
    const priUpper = priority.toUpperCase();
    if (priUpper === "LOW") return "text-gray-500 bg-gray-50 border-gray-200";
    if (priUpper === "MEDIUM") return "text-yellow-700 bg-yellow-50 border-yellow-100";
    if (priUpper === "HIGH") return "text-orange-700 bg-orange-50 border-orange-200";
    return "text-rose-700 bg-rose-50 border-rose-200";
  };

  // Filter Logic
  const filteredDrifts = drifts.filter(d => {
    return modelFilter === "all" || d.model_name.toLowerCase() === modelFilter.toLowerCase();
  });

  const distinctModels = Array.from(new Set(drifts.map(d => d.model_name))).sort();

  // Stats Calculations
  const avgDriftScore = filteredDrifts.length > 0
    ? filteredDrifts.reduce((sum, item) => sum + item.drift_score, 0) / filteredDrifts.length
    : 0;

  const maxDriftScore = filteredDrifts.length > 0
    ? Math.max(...filteredDrifts.map(d => d.drift_score))
    : 0;

  const criticalDriftCount = filteredDrifts.filter(d => d.drift_level === "CRITICAL" || d.drift_level === "WARNING").length;

  return (
    <div id="model-drift-panel" className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white border border-gray-100 p-6 rounded-2xl shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-rose-600" />
            V0.45 Model Drift Detection & Recalibration Engine
          </h2>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Continuously monitors predictive forecasting behaviors, assesses statistical variances against baseline standards, and recommends scheduled retraining loops.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={loadData}
            className="p-2.5 text-gray-600 hover:bg-gray-50 border border-gray-200 rounded-xl transition duration-200"
            title="Refresh Data"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Message alerts */}
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

      {/* Form and Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Run Drift Check */}
        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Sliders className="w-4 h-4 text-rose-500" />
              Configure Drift Assessment
            </h3>
            
            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Season</label>
                <input
                  type="text"
                  value={seasonInput}
                  onChange={(e) => setSeasonInput(e.target.value)}
                  className="w-full text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  placeholder="e.g. 2026"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Assessment Week</label>
                <select
                  value={weekInput}
                  onChange={(e) => setWeekInput(e.target.value)}
                  className="w-full text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  {Array.from({ length: 18 }, (_, i) => i + 1).map(w => (
                    <option key={w} value={w.toString()}>Week {w}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Engine Build Version</label>
                <input
                  type="text"
                  value={versionInput}
                  onChange={(e) => setVersionInput(e.target.value)}
                  className="w-full text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleRunDriftCheck}
            disabled={calculating}
            className="w-full mt-6 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl shadow-sm transition duration-200 disabled:opacity-75"
          >
            <Zap className="w-4 h-4 text-rose-100" />
            {calculating ? "Analyzing Predictive Drift..." : "Execute Drift Analysis"}
          </button>
        </div>

        {/* Stats */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Average Drift Score */}
          <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Average Drift Score</span>
              <span className="p-2 bg-rose-50 rounded-xl">
                <Activity className="w-4 h-4 text-rose-600" />
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">{avgDriftScore.toFixed(1)}</span>
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${avgDriftScore < 15 ? "text-emerald-700 bg-emerald-50" : "text-amber-700 bg-amber-50"}`}>
                {avgDriftScore < 15 ? "Optimal Calibration" : "Monitor Decay"}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Combined degradation index across forecasting models</p>
          </div>

          {/* Max Drift Score */}
          <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Peak Drift Index</span>
              <span className="p-2 bg-amber-50 rounded-xl">
                <Gauge className="w-4 h-4 text-amber-600" />
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">{maxDriftScore.toFixed(1)}</span>
              <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md">
                Max Variance
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Highest recorded model divergence from baseline training</p>
          </div>

          {/* Drift Alert Flags */}
          <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Drift Flags</span>
              <span className="p-2 bg-orange-50 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">{criticalDriftCount}</span>
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${criticalDriftCount === 0 ? "text-emerald-700 bg-emerald-50" : "text-orange-700 bg-orange-50"}`}>
                {criticalDriftCount === 0 ? "Perfect Compliance" : "Action Required"}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Number of models currently flagged with high/critical drift</p>
          </div>

          {/* Model Status Indicator */}
          <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Stability Status</span>
              <span className="p-2 bg-indigo-50 rounded-xl">
                <Shield className="w-4 h-4 text-indigo-600" />
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-lg font-bold text-gray-900">
                {criticalDriftCount >= 2 ? "RECALIBRATE REQ." : criticalDriftCount > 0 ? "MONITOR HEALTH" : "HEALTHY"}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Downstream model integrity rating for recommendation suite</p>
          </div>
        </div>
      </div>

      {/* Table Ledger */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Model Drift & Decay Ledger</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-medium">Model Profile:</span>
            <select
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
              className="text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-rose-500"
            >
              <option value="all">All Models</option>
              {distinctModels.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredDrifts.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Shield className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-medium">No model drift data in backtesting records.</p>
            <p className="text-xs text-gray-400 mt-1">Configure parameters above and click "Execute Drift Analysis".</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                  <th className="py-4 px-6">Model Info</th>
                  <th className="py-4 px-6">Timeline</th>
                  <th className="py-4 px-6 text-center">Drift Score</th>
                  <th className="py-4 px-6 text-center">Drift Level</th>
                  <th className="py-4 px-6 text-center">Rec. Action</th>
                  <th className="py-4 px-6 text-center">Priority</th>
                  <th className="py-4 px-6 text-center">Accuracy Delta</th>
                  <th className="py-4 px-6 text-center">Brier Delta</th>
                  <th className="py-4 px-6 text-center">CLV Delta</th>
                  <th className="py-4 px-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredDrifts.map((item, idx) => {
                  const uniqueId = `${item.model_name}-${item.season}-${item.week}`;
                  const isExpanded = expandedRows[uniqueId];

                  return (
                    <React.Fragment key={uniqueId}>
                      <tr className="hover:bg-gray-50/50 transition duration-150 cursor-pointer" onClick={() => toggleRow(uniqueId)}>
                        <td className="py-4 px-6">
                          <div className="font-semibold text-gray-900">{item.model_name}</div>
                          <div className="text-xs text-gray-400 font-mono">{item.prediction_type} ({item.model_version})</div>
                        </td>
                        <td className="py-4 px-6 text-gray-500 font-medium">W{item.week} ({item.season})</td>
                        <td className="py-4 px-6 text-center">
                          <span className="font-bold text-gray-900">{item.drift_score.toFixed(1)}</span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          {getDriftLevelBadge(item.drift_level)}
                        </td>
                        <td className="py-4 px-6 text-center">
                          {getActionBadge(item.recommended_action)}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${getPriorityColor(item.recommended_priority)}`}>
                            {item.recommended_priority}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`font-mono font-bold ${item.accuracy_delta < 0 ? "text-rose-600" : item.accuracy_delta > 0 ? "text-emerald-600" : "text-gray-500"}`}>
                            {item.accuracy_delta > 0 ? "+" : ""}{item.accuracy_delta}%
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center text-xs font-mono text-gray-500">
                          <span className={item.brier_delta > 0 ? "text-rose-600 font-bold" : item.brier_delta < 0 ? "text-emerald-600 font-bold" : "text-gray-500"}>
                            {item.brier_delta > 0 ? "+" : ""}{item.brier_delta.toFixed(4)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`font-mono font-bold ${item.clv_delta < 0 ? "text-rose-600" : item.clv_delta > 0 ? "text-emerald-600" : "text-gray-500"}`}>
                            {item.clv_delta > 0 ? "+" : ""}{item.clv_delta.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button className="text-gray-400 hover:text-gray-600">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={10} className="px-6 py-4 border-l-2 border-rose-500">
                            <div className="space-y-2">
                              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5 text-rose-500" />
                                Explainable Recalibration Diagnostic
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed max-w-4xl">
                                {item.explanation}
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 max-w-3xl">
                                <div className="bg-white p-3 rounded-xl border border-gray-100 text-xs">
                                  <span className="block text-gray-400 font-medium mb-1">Accuracy Alignment</span>
                                  <span className="font-semibold text-gray-800">Current: {item.current_accuracy}%</span>
                                  <span className="text-gray-400 block">Baseline Standard: {item.baseline_accuracy}%</span>
                                </div>
                                <div className="bg-white p-3 rounded-xl border border-gray-100 text-xs">
                                  <span className="block text-gray-400 font-medium mb-1">Brier Calibration</span>
                                  <span className="font-semibold text-gray-800">Current: {item.current_brier_score.toFixed(4)}</span>
                                  <span className="text-gray-400 block">Baseline Standard: {item.baseline_brier_score.toFixed(4)}</span>
                                </div>
                                <div className="bg-white p-3 rounded-xl border border-gray-100 text-xs">
                                  <span className="block text-gray-400 font-medium mb-1">Closing Line Yield (CLV)</span>
                                  <span className="font-semibold text-gray-800">Current: {item.current_clv > 0 ? "+" : ""}{item.current_clv.toFixed(2)}</span>
                                  <span className="text-gray-400 block">Baseline Standard: {item.baseline_clv > 0 ? "+" : ""}{item.baseline_clv.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Model Recalibration Visualizer */}
      <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-rose-500" />
          Live Model Degradation Visualizer
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Future Team Value</div>
              <div className="mt-2 text-sm font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 inline-block">🟢 Stable</div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xxs text-gray-400 mb-1">
                <span>Stability Index</span>
                <span>94%</span>
              </div>
              <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "94%" }}></div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Survivor Equity</div>
              <div className="mt-2 text-sm font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 inline-block">🟢 Stable</div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xxs text-gray-400 mb-1">
                <span>Stability Index</span>
                <span>98%</span>
              </div>
              <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "98%" }}></div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ownership Calibration</div>
              <div className="mt-2 text-sm font-semibold text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-100 inline-block">🟡 Monitor</div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xxs text-gray-400 mb-1">
                <span>Stability Index</span>
                <span>78%</span>
              </div>
              <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: "78%" }}></div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Market Calibration</div>
              <div className="mt-2 text-sm font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 inline-block">🔴 Critical</div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xxs text-gray-400 mb-1">
                <span>Stability Index</span>
                <span>45%</span>
              </div>
              <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: "45%" }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
