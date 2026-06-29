import React, { useState, useEffect } from "react";
import { 
  RefreshCw, 
  Clock, 
  HelpCircle, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Play, 
  Sparkles, 
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Info,
  Layers,
  Search,
  CheckCircle
} from "lucide-react";
import { apiService } from "../services/apiService";
import { RecommendationEvolution, RecommendationChangeEvent, RecommendationEvolutionSummary } from "../types";

export interface RecommendationEvolutionPanelProps {
  entries?: { id: string; name: string }[];
  teams?: { id: string; name: string; abbreviation: string }[];
}

export const RecommendationEvolutionPanel: React.FC<RecommendationEvolutionPanelProps> = ({
  entries = [],
  teams = []
}) => {
  const [evolutions, setEvolutions] = useState<RecommendationEvolution[]>([]);
  const [summaries, setSummaries] = useState<RecommendationEvolutionSummary[]>([]);
  const [selectedEvo, setSelectedEvo] = useState<RecommendationEvolution | null>(null);
  const [selectedEvoEvents, setSelectedEvoEvents] = useState<RecommendationChangeEvent[]>([]);
  
  // Controls
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedTrigger, setSelectedTrigger] = useState<string>("all");
  const [searchTeam, setSearchTeam] = useState<string>("");

  // Test suite output state
  const [testResults, setTestResults] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  // Manual Trigger Params
  const [manualSeason, setManualSeason] = useState("2026");
  const [manualWeek, setManualWeek] = useState(1);
  const [manualVersion, setManualVersion] = useState("v1.0.0");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const historyData = await apiService.fetchRecommendationEvolutionHistory();
      setEvolutions(historyData);

      const summariesData = await apiService.fetchRecommendationEvolutionSummary();
      setSummaries(summariesData);
    } catch (err: any) {
      setError("Failed to load recommendation evolution tracking data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch change events when an evolution record is selected
  useEffect(() => {
    const fetchEvents = async () => {
      if (!selectedEvo || !selectedEvo.recommendation_id) {
        setSelectedEvoEvents([]);
        return;
      }
      try {
        const events = await apiService.fetchRecommendationEvolutionEvents(selectedEvo.recommendation_id);
        setSelectedEvoEvents(events);
      } catch (err: any) {
        console.error("Failed to fetch change events:", err);
      }
    };
    fetchEvents();
  }, [selectedEvo]);

  const handleRunTracking = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await apiService.runRecommendationEvolutionTrack(manualSeason, manualWeek, manualVersion);
      setSuccess(`Successfully completed evolution tracking for Season ${manualSeason} Week ${manualWeek}!`);
      await loadData();
    } catch (err: any) {
      setError("Failed to trigger tracking: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunEvaluation = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await apiService.runRecommendationEvolutionEvaluate(manualSeason, manualWeek);
      setSuccess(`Successfully evaluated outcomes for Season ${manualSeason} Week ${manualWeek}!`);
      await loadData();
    } catch (err: any) {
      setError("Failed to trigger evaluation: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunTests = async () => {
    setTesting(true);
    setError(null);
    try {
      const res = await apiService.runRecommendationEvolutionTests();
      setTestResults(res);
    } catch (err: any) {
      setError("Test suite run failed: " + err.message);
    } finally {
      setTesting(false);
    }
  };

  // Filtered evolutions
  const filteredEvolutions = evolutions.filter(evo => {
    if (selectedStatus !== "all" && evo.recommendation_status !== selectedStatus) return false;
    if (selectedTrigger !== "all" && evo.triggering_event !== selectedTrigger) return false;
    if (searchTeam && !evo.team_id?.toLowerCase().includes(searchTeam.toLowerCase())) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "UPGRADED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100"><TrendingUp className="w-3 animate-pulse" /> UPGRADED</span>;
      case "DOWNGRADED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-100"><TrendingDown className="w-3" /> DOWNGRADED</span>;
      case "NEW":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-sky-50 text-sky-700 border border-sky-100"><Sparkles className="w-3 text-sky-500" /> NEW</span>;
      case "ABANDONED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200"><XCircle className="w-3" /> ABANDONED</span>;
      case "CORRECT":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200"><CheckCircle2 className="w-3" /> CORRECT</span>;
      case "INCORRECT":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200"><XCircle className="w-3" /> INCORRECT</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-50 text-gray-700 border border-gray-100">STABLE</span>;
    }
  };

  const getTriggerBadge = (trigger: string) => {
    switch (trigger) {
      case "WEIGHT_RECALIBRATION":
        return <span className="px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-700 border border-amber-100">⚖️ Weight Shift</span>;
      case "CONTEST_LIQUIDATION":
        return <span className="px-2 py-0.5 rounded text-xs bg-purple-50 text-purple-700 border border-purple-100">🌊 Contest Liquidation</span>;
      case "LINE_MOVEMENT":
        return <span className="px-2 py-0.5 rounded text-xs bg-indigo-50 text-indigo-700 border border-indigo-100">📉 Line Movement</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs bg-gray-50 text-gray-600 border border-gray-100">⚙️ Policy Adjust</span>;
    }
  };

  return (
    <div id="recommendation-evolution-panel" className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-950 flex items-center gap-2">
            <Layers className="w-5 text-indigo-500" /> V056 Recommendation Evolution Tracking
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Track and explain recommendation trajectories, model weight transitions, and final outcome validation.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button 
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl transition-colors border border-slate-200"
          >
            <RefreshCw className={`w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button 
            onClick={handleRunTests}
            disabled={testing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-colors border border-indigo-100"
          >
            <Play className="w-3.5" /> Run Diagnostics
          </button>
        </div>
      </div>

      {/* Action Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 shrink-0 text-rose-500 mt-0.5" />
          <div>{error}</div>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 shrink-0 text-emerald-500 mt-0.5" />
          <div>{success}</div>
        </div>
      )}

      {/* Diagnostics / Test Suite Modal overlay style box */}
      {testResults && (
        <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-md font-bold text-slate-200 flex items-center gap-2">
              <Sparkles className="text-indigo-400 w-4 animate-pulse" /> Recommendation Evolution Test Suite Results
            </h3>
            <button 
              onClick={() => setTestResults(null)}
              className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 bg-slate-800 rounded-md"
            >
              Clear Results
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-800 flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-mono">TEST STATUS</span>
              <span className={`text-lg font-bold mt-1 ${testResults.success ? "text-emerald-400" : "text-rose-400"}`}>
                {testResults.success ? "PASSED" : "FAILED"}
              </span>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-800 flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-mono">OVERALL SCORE</span>
              <span className="text-xl font-extrabold mt-1 text-indigo-300">{testResults.score}%</span>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-800 flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-mono">ASSERTIONS RUN</span>
              <span className="text-lg font-bold mt-1 text-slate-200">{testResults.assertions?.length || 0}</span>
            </div>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-60 overflow-y-auto font-mono text-xs space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
            {testResults.logs.map((log: string, idx: number) => (
              <div key={idx} className={log.includes("❌") ? "text-rose-400" : log.includes("✅") ? "text-emerald-400" : "text-slate-300"}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Pipeline Invocation Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase font-mono">Season</label>
          <input 
            type="text" 
            value={manualSeason} 
            onChange={(e) => setManualSeason(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase font-mono">Week</label>
          <input 
            type="number" 
            value={manualWeek} 
            onChange={(e) => setManualWeek(Number(e.target.value))}
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase font-mono">Calculation Version</label>
          <input 
            type="text" 
            value={manualVersion} 
            onChange={(e) => setManualVersion(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div className="flex gap-2.5">
          <button 
            onClick={handleRunTracking}
            disabled={loading}
            className="flex-1 text-center py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            Track Evolution
          </button>
          <button 
            onClick={handleRunEvaluation}
            disabled={loading}
            className="flex-1 text-center py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            Evaluate Outcomes
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summaries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {summaries.slice(0, 4).map((summary, index) => (
            <div key={index} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <div className="flex justify-between items-center text-xs text-slate-400 font-mono uppercase font-semibold">
                <span>Week {summary.week} Summary</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-50 text-slate-500">Season {summary.season}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center pt-1">
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="block text-xl font-bold text-indigo-600">{summary.total_changes}</span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold font-mono">Changes</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="block text-xl font-bold text-amber-600">{summary.major_changes}</span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold font-mono">Major</span>
                </div>
              </div>
              <div className="space-y-1 text-xs border-t border-slate-100 pt-3">
                <div className="flex justify-between text-slate-500">
                  <span>Stable recommendations:</span>
                  <span className="font-semibold text-slate-800">{summary.stable_recommendations}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Avg Confidence Delta:</span>
                  <span className="font-semibold text-slate-800">{summary.average_confidence_delta.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Avg Rank Delta:</span>
                  <span className="font-semibold text-slate-800">{summary.average_rank_delta.toFixed(1)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Grid: Evolution Log & Selected Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2/3: Evolution log list */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 text-slate-400" /> Recommendation Evolution Log
            </h3>
            
            {/* Filtering elements */}
            <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-2.5 w-3.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Filter team..." 
                  value={searchTeam}
                  onChange={(e) => setSearchTeam(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none bg-white focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <select 
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="UPGRADED">Upgraded</option>
                <option value="DOWNGRADED">Downgraded</option>
                <option value="NEW">New</option>
                <option value="ABANDONED">Abandoned</option>
                <option value="STABLE">Stable</option>
                <option value="CORRECT">Correct</option>
                <option value="INCORRECT">Incorrect</option>
              </select>
              <select 
                value={selectedTrigger}
                onChange={(e) => setSelectedTrigger(e.target.value)}
                className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none"
              >
                <option value="all">All Triggers</option>
                <option value="WEIGHT_RECALIBRATION">Weight Recalibration</option>
                <option value="CONTEST_LIQUIDATION">Contest Liquidation</option>
                <option value="LINE_MOVEMENT">Line Movement</option>
                <option value="POLICY_ADJUSTMENT">Policy Adjustment</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-100 font-bold">
                <tr>
                  <th className="px-5 py-3">Week</th>
                  <th className="px-5 py-3">Team</th>
                  <th className="px-5 py-3 text-center">Ranks</th>
                  <th className="px-5 py-3 text-center">Confidence</th>
                  <th className="px-5 py-3">Trigger Event</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvolutions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <Info className="w-6 text-slate-300" />
                        <span>No recommendation evolution records found.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEvolutions.map((evo) => (
                    <tr 
                      key={evo.id} 
                      className={`hover:bg-slate-50/70 transition-colors cursor-pointer ${selectedEvo?.id === evo.id ? "bg-indigo-50/30 font-medium" : ""}`}
                      onClick={() => setSelectedEvo(evo)}
                    >
                      <td className="px-5 py-3.5 text-slate-500 font-medium font-mono">W{evo.week}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-1 text-xs font-bold font-mono rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {evo.team_id}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center font-mono">
                        {evo.previous_rank !== undefined ? (
                          <span className="text-slate-500 text-xs">R{evo.previous_rank} ➔ </span>
                        ) : null}
                        <span className="font-bold text-slate-800">R{evo.new_rank ?? "-"}</span>
                      </td>
                      <td className="px-5 py-3.5 text-center font-mono text-xs">
                        {evo.previous_confidence !== undefined ? (
                          <span className="text-slate-400">{evo.previous_confidence.toFixed(1)}% ➔ </span>
                        ) : null}
                        <span className="font-bold text-slate-800">{evo.new_confidence?.toFixed(1)}%</span>
                      </td>
                      <td className="px-5 py-3.5">
                        {getTriggerBadge(evo.triggering_event)}
                      </td>
                      <td className="px-5 py-3.5">
                        {getStatusBadge(evo.recommendation_status)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <ChevronRight className="w-4 text-slate-300 inline" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1/3: Detail Drawer / Expanded View */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-5">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-md">
              <Info className="w-4 text-indigo-500" /> Narrative & Explanations
            </h3>
            <p className="text-xs text-slate-400 mt-1">Select an evolution record on the left to inspect detailed drivers and timeline change events.</p>
          </div>

          {selectedEvo ? (
            <div className="space-y-5">
              {/* Header details */}
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 text-sm font-bold font-mono rounded bg-slate-200 text-slate-800">
                    {selectedEvo.team_id}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Week {selectedEvo.week}</span>
                </div>
                <div>{getStatusBadge(selectedEvo.recommendation_status)}</div>
              </div>

              {/* Explanatory text */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase font-mono tracking-wider block">Evolution Trajectory</span>
                <p className="text-sm text-slate-600 bg-indigo-50/20 p-4 rounded-xl border border-indigo-50/50 leading-relaxed font-sans">
                  {selectedEvo.evolution_reason}
                </p>
              </div>

              {/* Driver metrics */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-400 uppercase font-mono tracking-wider block">Decision Inputs Analysis</span>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="block text-slate-400 mb-1">Spread / Probability</span>
                    <span className="font-bold text-slate-800 font-mono text-sm">
                      {selectedEvo.previous_probability ? `${(selectedEvo.previous_probability * 100).toFixed(0)}% ➔ ` : ""}
                      {selectedEvo.new_probability ? `${(selectedEvo.new_probability * 100).toFixed(0)}%` : "-"}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="block text-slate-400 mb-1">Expected Value</span>
                    <span className="font-bold text-slate-800 font-mono text-sm">
                      {selectedEvo.previous_expected_value ? `${selectedEvo.previous_expected_value.toFixed(2)} ➔ ` : ""}
                      {selectedEvo.new_expected_value ? `${selectedEvo.new_expected_value.toFixed(2)}` : "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Itemized timeline events */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-semibold text-slate-400 uppercase font-mono tracking-wider block">Detailed Change Events</span>
                {selectedEvoEvents.length === 0 ? (
                  <div className="text-center p-4 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                    No fine-grained change events recorded for this run.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedEvoEvents.map((event, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-700 font-mono uppercase text-[10px] bg-slate-200 px-1.5 py-0.5 rounded">
                            {event.event_type}
                          </span>
                          <span className={`font-bold ${event.impact_score > 0 ? "text-emerald-600" : event.impact_score < 0 ? "text-rose-600" : "text-slate-500"}`}>
                            {event.impact_score > 0 ? "+" : ""}{event.impact_score.toFixed(1)} Impact
                          </span>
                        </div>
                        <p className="text-slate-600 font-medium">{event.event_description}</p>
                        {event.previous_value && event.new_value && (
                          <div className="text-[10px] text-slate-400 font-mono mt-1 pt-1 border-t border-slate-200/50">
                            {event.previous_value} ➔ {event.new_value}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400 space-y-2 border border-dashed border-slate-200 rounded-2xl">
              <Clock className="w-8 text-slate-300 mx-auto" />
              <p className="text-sm">Select a team recommendation evolution row to view full storyline narration.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
