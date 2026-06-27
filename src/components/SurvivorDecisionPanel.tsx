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
  AlertCircle
} from "lucide-react";
import { apiService } from "../services/apiService";
import { SurvivorDecision } from "../types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  Legend
} from "recharts";

export const SurvivorDecisionPanel: React.FC = () => {
  const [decisions, setDecisions] = useState<SurvivorDecision[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recalculating, setRecalculating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [seasonInput, setSeasonInput] = useState("2026");
  const [weekInput, setWeekInput] = useState("1");
  const [agentVersionInput, setAgentVersionInput] = useState("v0.49");

  // Selection states (Multi-Contest & Entry Support)
  const [selectedEntryId, setSelectedEntryId] = useState<string>("");
  const [selectedContestId, setSelectedContestId] = useState<string>("");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.fetchLatestSurvivorDecisions();
      setDecisions(data);
      if (data.length > 0) {
        setSelectedEntryId(data[0].entry_id);
        setSelectedContestId(data[0].contest_id);
      }
    } catch (err: any) {
      setError("Failed to fetch latest survivor decisions: " + err.message);
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
      await apiService.runSurvivorDecisionsCalculate(seasonInput, weekVal, agentVersionInput);
      setSuccessMsg(`V0.49 Survivor decisions compiled successfully for ${seasonInput} Week ${weekVal}.`);
      await loadData();
    } catch (err: any) {
      setError("Failed to compile survivor decisions: " + err.message);
    } finally {
      setRecalculating(false);
    }
  };

  // Find unique entries and contests from loaded decisions
  const uniqueEntries = Array.from(new Set(decisions.map(d => d.entry_id as string)));
  const uniqueContests = Array.from(new Set(decisions.map(d => d.contest_id as string)));

  // If selection gets out of sync, auto-adjust
  useEffect(() => {
    if (uniqueEntries.length > 0 && !uniqueEntries.includes(selectedEntryId)) {
      setSelectedEntryId(uniqueEntries[0]);
    }
    if (uniqueContests.length > 0 && !uniqueContests.includes(selectedContestId)) {
      setSelectedContestId(uniqueContests[0]);
    }
  }, [decisions]);

  // Selected decision record
  const activeDecision = decisions.find(
    d => d.entry_id === selectedEntryId && d.contest_id === selectedContestId
  );

  // Parse JSON data for advanced details
  let activeDetails: any = null;
  if (activeDecision && activeDecision.decision_json) {
    try {
      activeDetails = JSON.parse(activeDecision.decision_json);
    } catch (e) {
      console.error("Failed to parse decision JSON:", e);
    }
  }

  // Get color configurations for Confidence Tiers
  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case "Elite":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-950 border border-green-800 text-green-300">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            ELITE
          </span>
        );
      case "Strong":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/50 border border-emerald-800/80 text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            STRONG
          </span>
        );
      case "Average":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-950 border border-blue-800 text-blue-300">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            AVERAGE
          </span>
        );
      case "Weak":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-950 border border-yellow-800 text-yellow-300">
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            WEAK
          </span>
        );
      case "Avoid":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-950 border border-red-800 text-red-300">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            AVOID
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-850 border border-slate-700 text-slate-300">
            {confidence.toUpperCase()}
          </span>
        );
    }
  };

  // Prepare chart data comparing candidates
  const chartData = activeDetails?.all_candidates?.map((c: any) => ({
    name: c.teamName.toUpperCase(),
    "Decision Score": Number(c.score.toFixed(1)),
    "Win Probability": Number(c.normalized_scores.policyScore.toFixed(1)),
    "Contest EV": Number(c.normalized_scores.evScore.toFixed(1)),
    "Future Preservation": Number(c.normalized_scores.ftvScore.toFixed(1))
  })) || [];

  return (
    <div id="survivor-decision-panel" className="space-y-6">
      {/* Configuration Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            Survivor Decision Agent <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded-full">V0.49</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Autonomous decision engine resolving policies into deterministic survivor selections.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-400">Season:</label>
            <input 
              type="text" 
              value={seasonInput}
              onChange={(e) => setSeasonInput(e.target.value)}
              className="w-16 px-2 py-1 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-400">Week:</label>
            <input 
              type="number" 
              value={weekInput}
              onChange={(e) => setWeekInput(e.target.value)}
              className="w-14 px-2 py-1 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-400">Agent Version:</label>
            <input 
              type="text" 
              value={agentVersionInput}
              onChange={(e) => setAgentVersionInput(e.target.value)}
              className="w-20 px-2 py-1 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={handleRecalculate}
            disabled={recalculating || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800/40 text-xs font-semibold text-white rounded transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? "animate-spin" : ""}`} />
            Compile Decisions
          </button>
        </div>
      </div>

      {/* Feedbacks */}
      {error && (
        <div className="flex items-start gap-2.5 p-4 rounded-lg bg-red-950/30 border border-red-900/50 text-red-300 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start gap-2.5 p-4 rounded-lg bg-emerald-950/30 border border-emerald-900/50 text-emerald-300 text-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <div>{successMsg}</div>
        </div>
      )}

      {/* Selector Filter Tabs */}
      {decisions.length > 0 && (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-indigo-400" />
                Active Context Selection
              </span>
              <span className="text-xs text-slate-500">
                Loaded {decisions.length} Active Records
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Select Entry Portfolio:</label>
                <select
                  value={selectedEntryId}
                  onChange={(e) => setSelectedEntryId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {uniqueEntries.map((entry: any) => (
                    <option key={entry} value={entry}>
                      Portfolio: {(entry as string).toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Select Contest Type:</label>
                <select
                  value={selectedContestId}
                  onChange={(e) => setSelectedContestId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {uniqueContests.map((contest: any) => (
                    <option key={contest} value={contest}>
                      Ruleset: {(contest as string).toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
          <span>Synchronizing Survivor Agent decisions with backend registries...</span>
        </div>
      ) : activeDecision ? (
        <div className="space-y-6">
          {/* Section 6 - Primary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Final Recommendation */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 relative overflow-hidden flex flex-col justify-between h-32">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Award className="w-16 h-16 text-indigo-400" />
              </div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Final Selection
              </div>
              <div className="text-2xl font-black text-white tracking-tight mt-1">
                {activeDecision.recommended_team_id.toUpperCase()}
              </div>
              <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-2">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                Deterministic primary choice
              </div>
            </div>

            {/* KPI 2: Confidence Rating */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between h-32">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Confidence Rating
              </div>
              <div className="mt-1 flex items-center">
                {getConfidenceBadge(activeDecision.confidence)}
              </div>
              <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-2">
                <Shield className="w-3 h-3 text-indigo-400 shrink-0" />
                Aggregated decision certainty
              </div>
            </div>

            {/* KPI 3: Championship EV */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between h-32">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Championship EV
              </div>
              <div className="text-2xl font-mono font-bold text-indigo-300 mt-1">
                {(activeDecision.championship_ev || 0).toFixed(4)}%
              </div>
              <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-2">
                <TrendingUp className="w-3 h-3 text-indigo-400 shrink-0" />
                Relative championship probability
              </div>
            </div>

            {/* KPI 4: Future Opportunity Cost */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between h-32">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Future Value Score
              </div>
              <div className="text-2xl font-mono font-bold text-amber-400 mt-1">
                {activeDecision.future_value_score.toFixed(1)}
              </div>
              <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-2">
                <Info className="w-3 h-3 text-amber-400 shrink-0" />
                Lower score saves elite teams
              </div>
            </div>
          </div>

          {/* Detailed Analytical Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Semantic Explanations & Alternatives */}
            <div className="lg:col-span-2 space-y-6">
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  Decision Agent Semantic Logic
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-lg border border-slate-800/80">
                  {activeDecision.decision_reason}
                </p>

                {/* Positives and Negatives Checklist */}
                {activeDetails?.explanation && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-900/30 space-y-2">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Positive Drivers
                      </span>
                      {activeDetails.explanation.positive?.length > 0 ? (
                        <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc pl-4">
                          {activeDetails.explanation.positive.map((pos: string, idx: number) => (
                            <li key={idx}>{pos}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[10px] text-slate-500">No major positive multipliers.</p>
                      )}
                    </div>

                    <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-900/30 space-y-2">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Risk & Drawbacks
                      </span>
                      {activeDetails.explanation.negative?.length > 0 ? (
                        <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc pl-4">
                          {activeDetails.explanation.negative.map((neg: string, idx: number) => (
                            <li key={idx}>{neg}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[10px] text-slate-500">No critical drag factors identified.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Chart of Candidate Options */}
              {chartData.length > 0 && (
                <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <BarChart4 className="w-4 h-4 text-indigo-400" />
                    Comparative Candidate Assessment
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={10} />
                        <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={60} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "8px", fontSize: "11px" }}
                          labelClassName="text-slate-200 font-bold"
                        />
                        <Legend wrapperStyle={{ fontSize: "10px" }} />
                        <Bar dataKey="Decision Score" fill="#6366f1" radius={[0, 4, 4, 0]}>
                          {chartData.map((entry: any, index: number) => {
                            const isRecommended = entry.name.toLowerCase() === activeDecision.recommended_team_id.toLowerCase();
                            return <Cell key={`cell-${index}`} fill={isRecommended ? "#4f46e5" : "#475569"} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Stats and Alternatives List */}
            <div className="space-y-6">
              {/* Overall Multi-factor Score */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-4">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Overall Decision Score
                </div>
                <div className="inline-flex items-center justify-center p-6 bg-slate-950 border-4 border-indigo-500 rounded-full w-28 h-28 text-3xl font-black text-indigo-300">
                  {activeDecision.decision_score.toFixed(1)}
                </div>
                <div className="text-xs text-slate-400">
                  Weighted Score (Policy 35%, EV 20%, FTV 20%, Equity 15%, Portfolio 10%)
                </div>
              </div>

              {/* Candidates & Alternates ranking list */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  Candidate Rankings
                </h3>

                <div className="space-y-2">
                  {activeDetails?.all_candidates?.map((c: any, idx: number) => {
                    const isSelected = c.team_id.toLowerCase() === activeDecision.recommended_team_id.toLowerCase();
                    return (
                      <div 
                        key={c.team_id}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition ${
                          isSelected 
                            ? "bg-indigo-950/20 border-indigo-700/50 text-indigo-200" 
                            : "bg-slate-950 border-slate-800/80 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-500">#{idx + 1}</span>
                          <span className="font-bold text-slate-200">{c.teamName}</span>
                          {isSelected && <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">PICK</span>}
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="font-semibold text-slate-300">Score: {c.score.toFixed(1)}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Supporting decision policy model tracking */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3 text-xs text-slate-400">
                <h4 className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  Governance & Versioning
                </h4>
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span>Agent State:</span>
                    <span className="text-emerald-400">Deterministic</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Algorithm:</span>
                    <span className="text-slate-200">Autonomous V1</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Supporting Policy ID:</span>
                    <span className="text-slate-200">{activeDecision.decision_policy_id || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>NFL Week:</span>
                    <span className="text-slate-200">Week {activeDecision.week}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-20 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs space-y-4">
          <AlertCircle className="w-8 h-8 text-amber-500" />
          <div className="text-center">
            <span className="block font-bold text-slate-200">No Survivor Decision Data Available</span>
            <span className="block text-[11px] text-slate-500 mt-1">Please select a different week or click "Compile Decisions" to trigger the autonomous calculation loop.</span>
          </div>
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? "animate-spin" : ""}`} />
            Compile Decisions
          </button>
        </div>
      )}
    </div>
  );
};
