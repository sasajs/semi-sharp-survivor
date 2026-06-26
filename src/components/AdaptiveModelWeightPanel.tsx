import React, { useState, useEffect } from "react";
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  Zap,
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
  Scale
} from "lucide-react";
import { apiService } from "../services/apiService";
import { AdaptiveModelWeight } from "../types";

export const AdaptiveModelWeightPanel: React.FC = () => {
  const [weights, setWeights] = useState<AdaptiveModelWeight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recalculating, setRecalculating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Recalculation triggers
  const [seasonInput, setSeasonInput] = useState("2026");
  const [weekInput, setWeekInput] = useState("1");
  const [versionInput, setVersionInput] = useState("v1.0.0");

  // Filters
  const [modelFilter, setModelFilter] = useState<string>("all");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.fetchModelWeightsHistory();
      setWeights(data);
    } catch (err: any) {
      setError("Failed to fetch adaptive ensemble weights: " + err.message);
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
      await apiService.runModelWeightsRecalculate(seasonInput, weekVal, versionInput);
      setSuccessMsg(`V0.46 Adaptive Ensemble Weighting updated successfully for ${seasonInput} Week ${weekVal}.`);
      await loadData();
    } catch (err: any) {
      setError("Failed to recalculate weights: " + err.message);
    } finally {
      setRecalculating(false);
    }
  };

  // Group latest records (by highest ID/most recent created_at or calculation_version)
  const latestVersion = weights.length > 0 ? weights[0].calculation_version : "";
  const latestWeights = weights.filter(w => w.calculation_version === latestVersion);

  const filteredWeights = modelFilter === "all" 
    ? latestWeights 
    : latestWeights.filter(w => w.model_name === modelFilter);

  const uniqueModels = Array.from(new Set(weights.map(w => w.model_name)));

  return (
    <div className="space-y-8" id="adaptive-model-weights-panel">
      {/* Header Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Scale className="w-48 h-48" />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Adaptive Ensemble Engine V0.46
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl text-slate-100">
            Adaptive Model Weights
          </h1>
          <p className="text-slate-400 max-w-2xl text-sm md:text-base leading-relaxed">
            Continuously learns and shifts voting power dynamically between predictive models. Weights are derived from historical backtests, current rolling accuracy, market calibration alignment, and real-time model drift penalties.
          </p>
        </div>
      </div>

      {/* Recalculate Controller */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600" />
            Run Ensemble Recalculation
          </h2>
          <p className="text-slate-500 text-xs">
            Trigger the V0.46 adaptive engine to ingest rolling parameters and recompute optimal ensemble distribution.
          </p>
          
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Season</label>
              <input 
                type="text" 
                value={seasonInput}
                onChange={(e) => setSeasonInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Week</label>
              <input 
                type="number" 
                min="1" 
                max="18"
                value={weekInput}
                onChange={(e) => setWeekInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Calculation Version</label>
              <input 
                type="text" 
                value={versionInput}
                onChange={(e) => setVersionInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <button
            onClick={handleRecalculate}
            disabled={recalculating || loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2 px-4 rounded-xl text-sm transition-all shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
            {recalculating ? "Calculating..." : "Recalculate Weights"}
          </button>
        </div>

        {/* Current Weight Breakdown Chart / Visualization */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Gauge className="w-5 h-5 text-indigo-600" />
                Active Ensemble Distribution
              </h2>
              {latestVersion && (
                <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2.5 py-1 rounded-full">
                  Version: {latestVersion}
                </span>
              )}
            </div>
            <p className="text-slate-500 text-xs">
              Current mathematical allocation across all evaluated predictive models. Sum of all weights totals exactly 100%.
            </p>
          </div>

          {latestWeights.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No weights calculated. Run recalculation to populate.
            </div>
          ) : (
            <div className="space-y-5 pt-4">
              {/* Custom Stacked Progress Bar */}
              <div className="w-full h-8 rounded-xl overflow-hidden flex shadow-inner bg-slate-100">
                {latestWeights.map((w, idx) => {
                  const colors = [
                    "bg-indigo-600",
                    "bg-teal-500",
                    "bg-amber-500",
                    "bg-rose-500"
                  ];
                  const bgClass = colors[idx % colors.length];
                  return (
                    <div 
                      key={w.id || idx}
                      style={{ width: `${w.final_weight}%` }}
                      className={`${bgClass} transition-all duration-500 relative group`}
                      title={`${w.model_name}: ${w.final_weight}%`}
                    >
                      <span className="sr-only">{w.model_name}: {w.final_weight}%</span>
                    </div>
                  );
                })}
              </div>

              {/* Legend with values */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {latestWeights.map((w, idx) => {
                  const colors = [
                    "border-indigo-600 text-indigo-700 bg-indigo-50",
                    "border-teal-500 text-teal-700 bg-teal-50",
                    "border-amber-500 text-amber-700 bg-amber-50",
                    "border-rose-500 text-rose-700 bg-rose-50"
                  ];
                  const borderColors = [
                    "bg-indigo-600",
                    "bg-teal-500",
                    "bg-amber-500",
                    "bg-rose-500"
                  ];
                  const blockClass = colors[idx % colors.length];
                  const dotColor = borderColors[idx % borderColors.length];
                  return (
                    <div key={w.id || idx} className={`p-3 rounded-xl border ${blockClass}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                        <span className="text-xs font-bold truncate max-w-[120px]">{w.model_name}</span>
                      </div>
                      <div className="text-xl font-black">{w.final_weight.toFixed(1)}%</div>
                      <div className="flex items-center gap-1 mt-0.5 text-[10px] font-semibold">
                        {w.weight_delta > 0 ? (
                          <span className="text-emerald-600 inline-flex items-center">
                            <ArrowUpRight className="w-3.5 h-3.5" /> +{w.weight_delta}%
                          </span>
                        ) : w.weight_delta < 0 ? (
                          <span className="text-rose-600 inline-flex items-center">
                            <ArrowDownRight className="w-3.5 h-3.5" /> {w.weight_delta}%
                          </span>
                        ) : (
                          <span className="text-slate-400">No Shift</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Messaging */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex gap-3 text-rose-800 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3 text-emerald-800 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-500">Filter Ensemble Models:</span>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setModelFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              modelFilter === "all" 
                ? "bg-slate-900 text-white shadow-sm" 
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            All Models
          </button>
          {uniqueModels.map(m => (
            <button
              key={m}
              onClick={() => setModelFilter(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all truncate max-w-[150px] ${
                modelFilter === m 
                  ? "bg-slate-900 text-white shadow-sm" 
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Model Cards Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredWeights.map((w, idx) => {
          const isShiftPositive = w.weight_delta > 0;
          const isShiftNegative = w.weight_delta < 0;

          return (
            <div 
              key={w.id || idx}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Card Header */}
              <div className="p-6 border-b border-slate-100 space-y-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-slate-900 text-lg">{w.model_name}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{w.model_version}</span>
                      <span>•</span>
                      <span>Type: {w.prediction_type}</span>
                    </div>
                  </div>
                  
                  {/* Final Weight Badge */}
                  <div className="text-right">
                    <span className="text-2xl font-black text-slate-900">{w.final_weight.toFixed(1)}%</span>
                    <div className="text-[10px] text-slate-400 font-medium">Ensemble Weight</div>
                  </div>
                </div>

                {/* Sub-bar showing previous weight comparison */}
                <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    Previous: <strong className="text-slate-700">{w.previous_weight.toFixed(1)}%</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    Shift: 
                    {isShiftPositive && (
                      <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded flex items-center">
                        <ArrowUpRight className="w-3.5 h-3.5" /> +{w.weight_delta.toFixed(1)}%
                      </span>
                    )}
                    {isShiftNegative && (
                      <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded flex items-center">
                        <ArrowDownRight className="w-3.5 h-3.5" /> {w.weight_delta.toFixed(1)}%
                      </span>
                    )}
                    {!isShiftPositive && !isShiftNegative && (
                      <span className="text-slate-500 font-bold bg-slate-50 px-1.5 py-0.5 rounded">
                        0.0%
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Performance Indicator Grid */}
              <div className="p-6 bg-slate-50/50 grid grid-cols-3 gap-4 border-b border-slate-100">
                <div className="text-center">
                  <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase flex justify-center items-center gap-1">
                    <Award className="w-3 h-3 text-indigo-500" />
                    Accuracy
                  </div>
                  <div className="text-sm font-extrabold text-slate-800 mt-1">
                    {w.performance_score.toFixed(1)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase flex justify-center items-center gap-1">
                    <Activity className="w-3 h-3 text-indigo-500" />
                    Validation
                  </div>
                  <div className="text-sm font-extrabold text-slate-800 mt-1">
                    {w.rolling_validation_score.toFixed(1)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase flex justify-center items-center gap-1">
                    <Target className="w-3 h-3 text-indigo-500" />
                    CLV Score
                  </div>
                  <div className="text-sm font-extrabold text-slate-800 mt-1">
                    {w.clv_score.toFixed(1)}
                  </div>
                </div>
              </div>

              {/* Drift & Confidence Footers */}
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-rose-500" /> Drift Penalty
                  </span>
                  <span className={`font-mono font-bold ${w.drift_penalty > 0 ? "text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded" : "text-slate-500"}`}>
                    -{w.drift_penalty.toFixed(1)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-teal-500" /> Confidence Score
                  </span>
                  <span className="font-mono font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg">
                    {w.confidence_score.toFixed(1)} / 100
                  </span>
                </div>

                {/* Explanation text */}
                <div className="bg-indigo-50/40 border border-indigo-100/60 rounded-xl p-3.5 text-slate-600 text-xs leading-relaxed flex gap-2">
                  <Info className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                  <span>{w.recommendation_reason}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Weights History Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              Weight Adaptation History
            </h3>
            <p className="text-slate-500 text-xs">
              Audit log of historical weight distributions computed by the system.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-6">Season</th>
                <th className="py-3.5 px-6">Week</th>
                <th className="py-3.5 px-6">Model Name</th>
                <th className="py-3.5 px-6">Prev Weight</th>
                <th className="py-3.5 px-6">Final Weight</th>
                <th className="py-3.5 px-6">Weight Shift</th>
                <th className="py-3.5 px-6">Confidence</th>
                <th className="py-3.5 px-6">Calculated At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
              {weights.slice(0, 30).map((w, idx) => {
                const isShiftPositive = w.weight_delta > 0;
                const isShiftNegative = w.weight_delta < 0;

                return (
                  <tr key={w.id || idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-6 font-semibold text-slate-800">{w.season}</td>
                    <td className="py-3 px-6 font-mono font-bold text-slate-900">W{w.week}</td>
                    <td className="py-3 px-6 font-bold text-slate-900">{w.model_name}</td>
                    <td className="py-3 px-6">{w.previous_weight.toFixed(1)}%</td>
                    <td className="py-3 px-6 font-black text-slate-900">{w.final_weight.toFixed(1)}%</td>
                    <td className="py-3 px-6">
                      {isShiftPositive && (
                        <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                          <ArrowUpRight className="w-3 h-3" /> +{w.weight_delta.toFixed(1)}%
                        </span>
                      )}
                      {isShiftNegative && (
                        <span className="text-rose-600 font-bold flex items-center gap-0.5">
                          <ArrowDownRight className="w-3 h-3" /> {w.weight_delta.toFixed(1)}%
                        </span>
                      )}
                      {!isShiftPositive && !isShiftNegative && (
                        <span className="text-slate-400">0.0%</span>
                      )}
                    </td>
                    <td className="py-3 px-6">
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                        {w.confidence_score.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-slate-400">
                      {w.created_at ? new Date(w.created_at).toLocaleString() : "N/A"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
