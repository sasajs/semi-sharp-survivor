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
  Scale,
  Brain,
  Cpu,
  Layers
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { apiService } from "../services/apiService";
import { AdaptiveModelWeight } from "../types";

export const AdaptiveModelWeightPanel: React.FC = () => {
  // Navigation: "v0.55" (Production) vs "v0.46" (Legacy)
  const [activeEngine, setActiveEngine] = useState<"v0.55" | "v0.46">("v0.55");

  // V0.46 State
  const [legacyWeights, setLegacyWeights] = useState<AdaptiveModelWeight[]>([]);
  const [legacyLoading, setLegacyLoading] = useState(false);
  const [legacyRecalculating, setLegacyRecalculating] = useState(false);
  const [legacySeasonInput, setLegacySeasonInput] = useState("2026");
  const [legacyWeekInput, setLegacyWeekInput] = useState("1");
  const [legacyVersionInput, setLegacyVersionInput] = useState("v1.0.0");
  const [legacyModelFilter, setLegacyModelFilter] = useState<string>("all");

  // V0.55 State
  const [activeReweights, setActiveReweights] = useState<any[]>([]);
  const [reweightsHistory, setReweightsHistory] = useState<any[]>([]);
  const [v55Loading, setV55Loading] = useState(false);
  const [v55Adapting, setV55Adapting] = useState(false);
  const [v55Season, setV55Season] = useState("2026");
  const [v55Week, setV55Week] = useState(1);
  const [v55Policy, setV55Policy] = useState("v0.55");
  const [selectedHistory, setSelectedHistory] = useState<any>(null);

  // Global Messages
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load V0.55 Data
  const loadV55Data = async () => {
    setV55Loading(true);
    setError(null);
    try {
      const active = await apiService.fetchActiveModelReweights();
      const history = await apiService.fetchModelReweightsHistory();
      setActiveReweights(active);
      setReweightsHistory(history);
      
      if (history.length > 0 && !selectedHistory) {
        setSelectedHistory(history[0]);
      }
    } catch (err: any) {
      setError("Failed to load V0.55 reweighting telemetry: " + err.message);
    } finally {
      setV55Loading(false);
    }
  };

  // Load V0.46 Data
  const loadV46Data = async () => {
    setLegacyLoading(true);
    setError(null);
    try {
      const data = await apiService.fetchModelWeightsHistory();
      setLegacyWeights(data);
    } catch (err: any) {
      setError("Failed to load legacy V0.46 weights: " + err.message);
    } finally {
      setLegacyLoading(false);
    }
  };

  useEffect(() => {
    if (activeEngine === "v0.55") {
      loadV55Data();
    } else {
      loadV46Data();
    }
  }, [activeEngine]);

  // V0.55 Form Trigger
  const handleV55Adapt = async (e: React.FormEvent) => {
    e.preventDefault();
    setV55Adapting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await apiService.runModelReweightsAdapt(v55Season, Number(v55Week), v55Policy);
      if (res.success) {
        setSuccessMsg(`Successfully executed V0.55 automatic reweighting for ${v55Season} Week ${v55Week}.`);
        await loadV55Data();
      }
    } catch (err: any) {
      setError(`Failed to run reweighting: ${err.message}`);
    } finally {
      setV55Adapting(false);
    }
  };

  // V0.46 Form Trigger
  const handleLegacyRecalculate = async () => {
    setLegacyRecalculating(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const weekVal = parseInt(legacyWeekInput, 10);
      if (isNaN(weekVal) || weekVal < 1 || weekVal > 18) {
        throw new Error("Week must be a valid integer between 1 and 18");
      }
      await apiService.runModelWeightsRecalculate(legacySeasonInput, weekVal, legacyVersionInput);
      setSuccessMsg(`Legacy V0.46 weights updated successfully for ${legacySeasonInput} Week ${weekVal}.`);
      await loadV46Data();
    } catch (err: any) {
      setError("Failed to recalculate weights: " + err.message);
    } finally {
      setLegacyRecalculating(false);
    }
  };

  // V0.55 Historical Chart Data grouping
  const historicalWeeks = Array.from(new Set(reweightsHistory.map((h: any) => h.week as number))).sort((a: any, b: any) => a - b);
  const v55ChartData = historicalWeeks.map(wk => {
    const row: any = { label: `Week ${wk}`, weekNum: wk };
    reweightsHistory.filter(h => h.week === wk).forEach(h => {
      row[h.model_name] = Number((h.new_weight * 100).toFixed(1));
    });
    return row;
  });

  const uniqueModelsV55 = Array.from(new Set(activeReweights.map((w: any) => w.model_name as string))) as string[];

  // Resolve legacy grouping
  const legacyLatestVersion = legacyWeights.length > 0 ? legacyWeights[0].calculation_version : "";
  const legacyLatestWeights = legacyWeights.filter(w => w.calculation_version === legacyLatestVersion);
  const legacyFilteredWeights = legacyModelFilter === "all" 
    ? legacyLatestWeights 
    : legacyLatestWeights.filter(w => w.model_name === legacyModelFilter);
  const legacyUniqueModels = Array.from(new Set(legacyWeights.map(w => w.model_name)));

  const themeColors = [
    "#4f46e5", // indigo
    "#0d9488", // teal
    "#f59e0b", // amber
    "#e11d48", // rose
    "#8b5cf6", // violet
  ];

  const themeBgClasses = [
    "bg-indigo-600",
    "bg-teal-600",
    "bg-amber-500",
    "bg-rose-500",
    "bg-violet-500",
  ];

  const themeBorderCardClasses = [
    "border-indigo-100 text-indigo-700 bg-indigo-50/40",
    "border-teal-100 text-teal-700 bg-teal-50/40",
    "border-amber-100 text-amber-700 bg-amber-50/40",
    "border-rose-100 text-rose-700 bg-rose-50/40",
    "border-violet-100 text-violet-700 bg-violet-50/40",
  ];

  return (
    <div className="space-y-6" id="adaptive-model-weights-panel">
      {/* Subsystem Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="bg-indigo-500/10 text-indigo-400 p-2 rounded-lg border border-indigo-500/20">
              <Scale className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-1.5">
                Model Ensemble Influence Controller
                <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-indigo-500/30">
                  V0.55 Active
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Adapts model voting weights dynamically based on recent forecasting validation evidence and accuracy tracking.
              </p>
            </div>
          </div>
        </div>

        {/* Engine Mode Toggle Tabs */}
        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700/60 self-start md:self-auto">
          <button
            onClick={() => setActiveEngine("v0.55")}
            className={`flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeEngine === "v0.55" 
                ? "bg-indigo-600 text-white shadow-md" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Brain className="h-3.5 w-3.5" />
            V0.55 Auto Reweighting
          </button>
          <button
            onClick={() => setActiveEngine("v0.46")}
            className={`flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeEngine === "v0.46" 
                ? "bg-indigo-600 text-white shadow-md" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            V0.46 Legacy Engine
          </button>
        </div>
      </div>

      {/* Global Status Banner Messages */}
      {error && (
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-start gap-3 text-rose-800 text-sm">
          <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Subsystem Warning:</span> {error}
          </div>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3 text-emerald-800 text-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Action Completed:</span> {successMsg}
          </div>
        </div>
      )}

      {/* V0.55 AUTOMATIC MODEL REWEIGHTING PANEL */}
      {activeEngine === "v0.55" && (
        <div className="space-y-6">
          
          {/* Active Distribution & Trigger grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Automatic Reweighting Manual Trigger */}
            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Sliders className="h-4 w-4 text-indigo-600" />
                  Manual V0.55 Adaptation Trigger
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Force the learning loop to run immediate adaptive calculations using trailing historical accuracy logs.
                </p>
              </div>

              <form onSubmit={handleV55Adapt} className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Target Season</label>
                  <select
                    value={v55Season}
                    onChange={(e) => setV55Season(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-semibold focus:ring-1 focus:ring-indigo-500 outline-none"
                  >
                    <option value="2026">2026 NFL Season</option>
                    <option value="2025">2025 NFL Season</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Up to NFL Week</label>
                  <input
                    type="number"
                    min="1"
                    max="18"
                    value={v55Week}
                    onChange={(e) => setV55Week(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-semibold focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Policy Guideline Version</label>
                  <input
                    type="text"
                    value={v55Policy}
                    onChange={(e) => setV55Policy(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-semibold focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={v55Adapting || v55Loading}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
                >
                  {v55Adapting ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Adapting Ensemble Weights...
                    </>
                  ) : (
                    <>
                      <Zap className="h-3.5 w-3.5 fill-indigo-100" />
                      Recalibrate Model Weights
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Active Weight Allocation Segment */}
            <div className="lg:col-span-2 bg-white border border-slate-100 rounded-xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-indigo-600" />
                  Active Production Weight Distribution
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Intelligent allocation adapted based on recent evidence. Strictly clamped between <strong>5% safety floors</strong> and <strong>50% influence ceilings</strong>.
                </p>
              </div>

              {v55Loading && activeReweights.length === 0 ? (
                <div className="h-28 flex items-center justify-center text-xs text-slate-400">
                  <RefreshCw className="h-4 w-4 animate-spin mr-1.5" /> Loading model active distribution...
                </div>
              ) : activeReweights.length === 0 ? (
                <div className="h-28 flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                  No active model weights initialized. Submit the adaptation form on the left to seed.
                </div>
              ) : (
                <div className="space-y-4 pt-4">
                  {/* Dynamic Stacked Distribution Bar */}
                  <div className="w-full h-8 rounded-xl overflow-hidden flex shadow-inner bg-slate-50 border border-slate-100">
                    {activeReweights.map((w, idx) => {
                      const percentage = w.normalized_weight * 100;
                      return (
                        <div 
                          key={idx}
                          style={{ width: `${percentage}%` }}
                          className={`${themeBgClasses[idx % themeBgClasses.length]} transition-all duration-500 relative group`}
                          title={`${w.model_name}: ${percentage.toFixed(1)}%`}
                        >
                          <span className="sr-only">{w.model_name}: {percentage.toFixed(1)}%</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Weight block legends */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {activeReweights.map((w, idx) => {
                      const colorCard = themeBorderCardClasses[idx % themeBorderCardClasses.length];
                      const dotColor = themeBgClasses[idx % themeBgClasses.length];
                      return (
                        <div key={idx} className={`p-2.5 rounded-lg border ${colorCard} flex flex-col justify-between`}>
                          <div className="flex items-center gap-1 mb-1">
                            <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                            <span className="text-[10px] font-black truncate text-slate-700" title={w.model_name}>{w.model_name}</span>
                          </div>
                          <div className="text-lg font-black text-slate-900">
                            {Number(w.normalized_weight * 100).toFixed(1)}%
                          </div>
                          <div className="text-[9px] text-slate-500 mt-0.5">
                            Acc: {w.rolling_accuracy.toFixed(1)}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Core Analytics Model Cards (V0.55 Active Weights Detail) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {activeReweights.map((w, idx) => {
              const borderDotColor = themeBgClasses[idx % themeBgClasses.length];
              return (
                <div key={idx} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${borderDotColor}`} />
                      <h4 className="text-xs font-black text-slate-900 truncate" title={w.model_name}>{w.model_name}</h4>
                    </div>
                    <span className="text-[9px] font-semibold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 uppercase">
                      Prediction: {w.prediction_type}
                    </span>
                  </div>

                  <div className="space-y-2 border-t border-slate-50 pt-2.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400">Ensemble Weight</span>
                      <span className="font-extrabold text-slate-800">{Number(w.normalized_weight * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400">Rolling Accuracy</span>
                      <span className="font-bold text-slate-800">{w.rolling_accuracy.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400">Brier Error</span>
                      <span className="font-mono text-slate-800">{w.rolling_brier.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400">Calibration Score</span>
                      <span className="font-bold text-emerald-600">{w.calibration_score.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-2 text-[10px] text-slate-500 leading-normal border border-slate-100/60 font-medium">
                    Last sync: {w.last_updated ? new Date(w.last_updated).toLocaleTimeString() : "N/A"}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Historical Learning Trend Chart & Explanation Drawer split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Multi-line weight drift timeline */}
            <div className="lg:col-span-2 bg-white border border-slate-100 rounded-xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Dynamic Weight Adaptation Timeline</h3>
                <p className="text-xs text-slate-400 mt-0.5">Tracks how individual model weights adapted dynamically week-over-week in response to performance feedback loops.</p>
              </div>

              <div className="h-[260px] w-full mt-4">
                {v55ChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={v55ChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                      <XAxis dataKey="label" stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} domain={[0, 60]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff", fontSize: "11px" }}
                        labelStyle={{ color: "#94a3b8", fontWeight: "bold" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "9px", marginTop: "10px" }} />
                      {uniqueModelsV55.map((modelName, idx) => (
                        <Line
                          key={idx}
                          type="monotone"
                          dataKey={modelName}
                          stroke={themeColors[idx % themeColors.length]}
                          strokeWidth={2.5}
                          activeDot={{ r: 5 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded-lg text-xs text-slate-400">
                    No historical records available to construct the timeline graph. Complete a learning loop week to populate.
                  </div>
                )}
              </div>
            </div>

            {/* Selected History Record Explainability Audit */}
            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start border-b border-slate-50 pb-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Explainable Shift Audit Card</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Audit trace details for selected model adjustment.</p>
                </div>
                {selectedHistory && (
                  <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-2.5 py-1 rounded-md text-[10px] font-mono">
                    W{selectedHistory.week} logs
                  </span>
                )}
              </div>

              {selectedHistory ? (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">Target Predictor</div>
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                      {selectedHistory.model_name}
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                      <div>
                        <div className="text-[9px] text-slate-400">Previous Weight</div>
                        <div className="text-xs font-bold text-slate-600">
                          {Number(selectedHistory.previous_weight * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-400">Adjusted Weight</div>
                        <div className="text-xs font-bold text-indigo-700">
                          {Number(selectedHistory.new_weight * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-indigo-50/45 p-3.5 rounded-xl border border-indigo-100/45 space-y-2.5">
                    <div className="flex items-center gap-1 text-xs font-bold text-indigo-800">
                      <Info className="h-4 w-4 text-indigo-500" />
                      Weight Shift Justification Reason
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed italic">
                      "{selectedHistory.reason}"
                    </p>
                  </div>

                  {selectedHistory.metrics_snapshot && (
                    <div className="border-t border-slate-100 pt-3">
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Metrics Snapshot for backtrace</div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50/50 p-2 rounded-lg font-mono">
                        {(() => {
                          try {
                            const parsed = JSON.parse(selectedHistory.metrics_snapshot);
                            return Object.entries(parsed).map(([key, val]: any) => (
                              <div key={key} className="flex justify-between px-1">
                                <span className="text-slate-400 truncate max-w-[100px]" title={key}>{key.replace('rolling_', '')}</span>
                                <span className="text-slate-700 font-bold">{typeof val === 'number' ? val.toFixed(2) : String(val)}</span>
                              </div>
                            ));
                          } catch {
                            return <span className="text-slate-400 italic">Snapshot parsing error</span>;
                          }
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-xs text-slate-400 italic">
                  Select an audit record from the ledger table below to trace specific model weight shift explanations.
                </div>
              )}
            </div>
          </div>

          {/* Historical Model Reweight Ledger table */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-800">Reweight Adaptation Ledger Audit Logs</h3>
              <p className="text-xs text-slate-400 mt-0.5">Immutable historical logs documenting automatic model weight shifts calculated in the continuous learning loop.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-bold uppercase">
                    <th className="pb-3 pl-2">Season/Week</th>
                    <th className="pb-3">Ensemble Model</th>
                    <th className="pb-3">Prev Weight</th>
                    <th className="pb-3">New Weight</th>
                    <th className="pb-3">Shift Delta</th>
                    <th className="pb-3">Policy Version</th>
                    <th className="pb-3 pr-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-slate-600 text-xs divide-y divide-slate-50">
                  {reweightsHistory.length > 0 ? (
                    reweightsHistory.slice(0, 40).map((h: any, idx: number) => {
                      const delta = Number((h.new_weight - h.previous_weight).toFixed(4));
                      const isPositive = delta > 0;
                      const isNegative = delta < 0;
                      const isSelected = selectedHistory?.id === h.id || (selectedHistory?.week === h.week && selectedHistory?.model_name === h.model_name);
                      
                      return (
                        <tr 
                          key={idx}
                          onClick={() => setSelectedHistory(h)}
                          className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${isSelected ? 'bg-indigo-50/15 font-semibold' : ''}`}
                        >
                          <td className="py-3 pl-2 font-bold text-slate-900">
                            {h.season} Week {h.week}
                          </td>
                          <td className="py-3 font-semibold text-slate-800">{h.model_name}</td>
                          <td className="py-3">{Number(h.previous_weight * 100).toFixed(1)}%</td>
                          <td className="py-3 font-black text-slate-900">{Number(h.new_weight * 100).toFixed(1)}%</td>
                          <td className="py-3">
                            {isPositive && (
                              <span className="text-emerald-600 font-bold flex items-center">
                                <ArrowUpRight className="h-3.5 w-3.5" /> +{Number(delta * 100).toFixed(1)}%
                              </span>
                            )}
                            {isNegative && (
                              <span className="text-rose-600 font-bold flex items-center">
                                <ArrowDownRight className="h-3.5 w-3.5" /> {Number(delta * 100).toFixed(1)}%
                              </span>
                            )}
                            {!isPositive && !isNegative && (
                              <span className="text-slate-400">0.0%</span>
                            )}
                          </td>
                          <td className="py-3 text-slate-400 font-mono text-[10px]">{h.policy_version}</td>
                          <td className="py-3 pr-2 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedHistory(h);
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Trace Log
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                        No model weight history records logged yet. Trigger V0.55 adaptation manually or process a completed week in the Weekly Learning Loop.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* V0.46 LEGACY ADAPTIVE WEIGHTS PANEL */}
      {activeEngine === "v0.46" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-600" />
                Run Ensemble Recalculation
              </h2>
              <p className="text-slate-500 text-xs">
                Trigger the V0.46 legacy adaptive engine to ingest rolling parameters and recompute optimal ensemble distribution.
              </p>
              
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Season</label>
                  <input 
                    type="text" 
                    value={legacySeasonInput}
                    onChange={(e) => setLegacySeasonInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Week</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="18"
                    value={legacyWeekInput}
                    onChange={(e) => setLegacyWeekInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Calculation Version</label>
                  <input 
                    type="text" 
                    value={legacyVersionInput}
                    onChange={(e) => setLegacyVersionInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleLegacyRecalculate}
                disabled={legacyRecalculating || legacyLoading}
                className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2 px-4 rounded-xl text-xs transition-all shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 ${legacyRecalculating ? 'animate-spin' : ''}`} />
                {legacyRecalculating ? "Calculating..." : "Recalculate Weights"}
              </button>
            </div>

            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-indigo-600" />
                    V0.46 Ensemble Distribution
                  </h2>
                  {legacyLatestVersion && (
                    <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2.5 py-1 rounded-full">
                      Version: {legacyLatestVersion}
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-xs">
                  Current mathematical allocation across legacy models under V0.46 parameters.
                </p>
              </div>

              {legacyLatestWeights.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No weights calculated. Run recalculation to populate.
                </div>
              ) : (
                <div className="space-y-5 pt-4">
                  <div className="w-full h-8 rounded-xl overflow-hidden flex shadow-inner bg-slate-100">
                    {legacyLatestWeights.map((w, idx) => {
                      return (
                        <div 
                          key={idx}
                          style={{ width: `${w.final_weight}%` }}
                          className={`${themeBgClasses[idx % themeBgClasses.length]} transition-all duration-500`}
                          title={`${w.model_name}: ${w.final_weight}%`}
                        />
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {legacyLatestWeights.map((w, idx) => {
                      const colorCard = themeBorderCardClasses[idx % themeBorderCardClasses.length];
                      const dotColor = themeBgClasses[idx % themeBgClasses.length];
                      return (
                        <div key={idx} className={`p-3 rounded-xl border ${colorCard}`}>
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

          {/* Legacy Filter Toolbar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-500">Filter Models:</span>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setLegacyModelFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  legacyModelFilter === "all" ? "bg-slate-900 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600"
                }`}
              >
                All Models
              </button>
              {legacyUniqueModels.map(m => (
                <button
                  key={m}
                  onClick={() => setLegacyModelFilter(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all truncate max-w-[150px] ${
                    legacyModelFilter === m ? "bg-slate-900 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Legacy model list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {legacyFilteredWeights.map((w, idx) => {
              return (
                <div key={idx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm p-6 space-y-4 flex flex-col justify-between">
                  <div className="flex justify-between items-start border-b border-slate-50 pb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-md">{w.model_name}</h3>
                      <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded">{w.model_version}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-slate-900">{w.final_weight.toFixed(1)}%</span>
                      <div className="text-[9px] text-slate-400">Legacy Weight</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-[11px] bg-slate-50 p-2.5 rounded-xl">
                    <div>
                      <span className="text-slate-400">Accuracy</span>
                      <div className="font-bold text-slate-700">{w.performance_score.toFixed(1)}%</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Validation</span>
                      <div className="font-bold text-slate-700">{w.rolling_validation_score.toFixed(1)}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">CLV Score</span>
                      <div className="font-bold text-slate-700">{w.clv_score.toFixed(1)}</div>
                    </div>
                  </div>

                  <div className="bg-indigo-50/45 p-3 rounded-xl border border-indigo-100/40 text-slate-600 text-xs flex gap-1.5">
                    <Info className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                    <span>{w.recommendation_reason}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
