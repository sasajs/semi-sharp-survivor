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
  Lock,
  Play,
  Scale,
  TrendingUp,
  AlertCircle,
  Clock,
  ExternalLink,
  BookOpen
} from "lucide-react";
import { apiService } from "../services/apiService";
import { DecisionPolicy } from "../types";

export const DecisionPolicyPanel: React.FC = () => {
  const [policies, setPolicies] = useState<DecisionPolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recalculating, setRecalculating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [seasonInput, setSeasonInput] = useState("2026");
  const [weekInput, setWeekInput] = useState("1");
  const [versionInput, setVersionInput] = useState("v1.0.0");

  // Filters
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.fetchLatestDecisionPolicies();
      setPolicies(data);
    } catch (err: any) {
      setError("Failed to fetch latest decision policies: " + err.message);
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
      await apiService.runDecisionPoliciesCalculate(seasonInput, weekVal, versionInput);
      setSuccessMsg(`V0.48 Decision Policies updated successfully for ${seasonInput} Week ${weekVal}.`);
      await loadData();
    } catch (err: any) {
      setError("Failed to calculate decision policies: " + err.message);
    } finally {
      setRecalculating(false);
    }
  };

  // Filter policies based on selections
  const filteredPolicies = policies.filter(p => {
    const matchesAction = actionFilter === "all" || p.recommended_action === actionFilter;
    const matchesSearch = p.team_id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.policy_reason.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAction && matchesSearch;
  });

  // Calculate high-level stats
  const totalCount = policies.length;
  const lockCount = policies.filter(p => p.recommended_action === "LOCK").length;
  const strongPlayCount = policies.filter(p => p.recommended_action === "STRONG PLAY").length;
  const playCount = policies.filter(p => p.recommended_action === "PLAY").length;
  const passCount = policies.filter(p => p.recommended_action === "PASS").length;
  const avoidCount = policies.filter(p => p.recommended_action === "AVOID").length;

  // Custom helper for action badges and coloring
  const getActionBadge = (action: string) => {
    switch (action) {
      case "LOCK":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 border border-emerald-800 text-emerald-300">
            <Lock className="w-3.5 h-3.5" />
            LOCK
          </span>
        );
      case "STRONG PLAY":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-900/40 border border-green-700/60 text-green-300">
            <TrendingUp className="w-3.5 h-3.5" />
            STRONG PLAY
          </span>
        );
      case "PLAY":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-950 border border-blue-800 text-blue-300">
            <Play className="w-3.5 h-3.5 font-bold" />
            PLAY
          </span>
        );
      case "PASS":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-950 border border-amber-800 text-amber-300">
            <AlertCircle className="w-3.5 h-3.5" />
            PASS
          </span>
        );
      case "AVOID":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-950 border border-red-800 text-red-300 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            AVOID
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-900 border border-slate-800 text-slate-300">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8" id="decision-policies-panel">
      {/* Header Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Scale className="w-48 h-48" />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            Decision Intelligence V0.48
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl text-slate-100">
            Decision Policy Engine
          </h1>
          <p className="text-slate-400 max-w-2xl text-sm md:text-base leading-relaxed">
            Transforming calibrated ensemble predictions into actionable, deterministic Survivor picks.
            Our multi-objective optimization balances Expected Utility, Portfolio fit, closing line risk, and contest EV leverage.
          </p>
        </div>
      </div>

      {/* Stats Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-emerald-950/20 border border-emerald-900/50 rounded-xl p-4 text-center">
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">LOCKS</div>
          <div className="text-3xl font-bold text-emerald-400">{lockCount}</div>
        </div>
        <div className="bg-green-950/20 border border-green-900/50 rounded-xl p-4 text-center">
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">STRONG PLAYS</div>
          <div className="text-3xl font-bold text-green-400">{strongPlayCount}</div>
        </div>
        <div className="bg-blue-950/20 border border-blue-900/50 rounded-xl p-4 text-center">
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">PLAYS</div>
          <div className="text-3xl font-bold text-blue-400">{playCount}</div>
        </div>
        <div className="bg-amber-950/20 border border-amber-900/50 rounded-xl p-4 text-center">
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">PASSES</div>
          <div className="text-3xl font-bold text-amber-400">{passCount}</div>
        </div>
        <div className="bg-red-950/20 border border-red-900/50 rounded-xl p-4 text-center">
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">AVOIDS</div>
          <div className="text-3xl font-bold text-red-400">{avoidCount}</div>
        </div>
      </div>

      {/* Main Admin Execution & Configuration Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            Policy Recalculation
          </h2>
          <p className="text-xs text-slate-400">
            Trigger deterministic decision mapping across active slate candidates. Calculates Expected Utility and alignment metrics.
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Season</label>
              <input 
                type="text" 
                value={seasonInput}
                onChange={(e) => setSeasonInput(e.target.value)}
                className="w-full text-sm bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">NFL Week</label>
              <input 
                type="number" 
                min="1"
                max="18"
                value={weekInput}
                onChange={(e) => setWeekInput(e.target.value)}
                className="w-full text-sm bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">System Version</label>
              <input 
                type="text" 
                value={versionInput}
                onChange={(e) => setVersionInput(e.target.value)}
                className="w-full text-sm bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 transition-all cursor-pointer shadow-lg shadow-indigo-600/10"
            >
              {recalculating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Calculating Policies...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-yellow-400" />
                  Trigger Inference Layer
                </>
              )}
            </button>
          </div>
        </div>

        {/* Info & Mathematical Formula Details card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            Decision Score Formulation
          </h2>
          <div className="space-y-3 text-sm text-slate-300">
            <p className="text-xs leading-relaxed text-slate-400">
              The Decision Policy Engine runs fully deterministic evaluations that prioritize long-term, high-efficiency portfolio returns. The final Decision Score integrates five key parameters:
            </p>
            <div className="bg-slate-950 rounded-lg p-3 font-mono text-xs text-indigo-300 border border-indigo-950/50">
              Score = (Win% * 0.35) + (ContestEV * 25) + (PortfolioFit * 0.15) + (Leverage * 0.15) - (Risk * 0.10)
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-400">
              <li className="flex items-start gap-1.5">
                <span className="text-indigo-400">✓</span> <strong>Ensemble Win% (35%)</strong>: Weighted win consensus.
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-indigo-400">✓</span> <strong>Contest EV (25%)</strong>: Future value vs. direct risk.
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-indigo-400">✓</span> <strong>Portfolio Fit (15%)</strong>: Hedging & multi-entry optimization.
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-indigo-400">✓</span> <strong>Leverage Score (15%)</strong>: Value captured on contrarian slates.
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-indigo-400">✓</span> <strong>Risk Penalty (10%)</strong>: Disagreement & drift adjustment.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main Results Table Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
        {/* Table Filters & Toolbar */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600/10 border border-indigo-500/20 p-2 rounded-lg text-indigo-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-200">Active Decision Policies</h3>
              <p className="text-xs text-slate-400">Filter and search current policy recommendations below</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Action Select Filter */}
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="text-xs bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Recommendations</option>
              <option value="LOCK">LOCKS</option>
              <option value="STRONG PLAY">STRONG PLAYS</option>
              <option value="PLAY">PLAYS</option>
              <option value="PASS">PASSES</option>
              <option value="AVOID">AVOIDS</option>
            </select>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search team or explanation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-4 py-2 w-48 text-slate-100 focus:outline-none focus:border-indigo-500 placeholder-slate-500"
              />
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
            </div>
          </div>
        </div>

        {/* Alerts & Messages */}
        {error && (
          <div className="p-4 bg-red-950/20 border-b border-red-900/50 text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
        {successMsg && (
          <div className="p-4 bg-emerald-950/20 border-b border-emerald-900/50 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Main Table Content */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
              Loading decision intelligence slates...
            </div>
          ) : filteredPolicies.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-400" />
              No decision policies found matching the filters.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-800">
                  <th className="py-4 px-5">Team Selection</th>
                  <th className="py-4 px-5">Decision Score</th>
                  <th className="py-4 px-5 text-center">Win Prob (Ensemble)</th>
                  <th className="py-4 px-5 text-center">Leverage Score</th>
                  <th className="py-4 px-5 text-center">Risk Score</th>
                  <th className="py-4 px-5 text-center">Portfolio Fit</th>
                  <th className="py-4 px-5">Recommendation</th>
                  <th className="py-4 px-5">Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredPolicies.map((p, index) => {
                  const isHighValue = p.recommended_action === "LOCK" || p.recommended_action === "STRONG PLAY";
                  return (
                    <React.Fragment key={index}>
                      <tr className={`hover:bg-slate-800/50 transition-colors text-sm ${isHighValue ? "bg-indigo-950/5" : ""}`}>
                        {/* Team Code */}
                        <td className="py-3 px-5 font-bold uppercase text-slate-200">
                          {p.recommended_pick}
                        </td>
                        {/* Decision Score */}
                        <td className="py-3 px-5">
                          <span className="text-base font-extrabold text-indigo-400">
                            {p.decision_score}
                          </span>
                        </td>
                        {/* Win Probability */}
                        <td className="py-3 px-5 text-center font-mono">
                          {p.ensemble_prediction.toFixed(1)}%
                        </td>
                        {/* Leverage */}
                        <td className="py-3 px-5 text-center font-mono text-emerald-400">
                          {p.leverage_score.toFixed(1)}
                        </td>
                        {/* Risk */}
                        <td className="py-3 px-5 text-center font-mono text-red-400">
                          {p.risk_score.toFixed(1)}%
                        </td>
                        {/* Portfolio Score */}
                        <td className="py-3 px-5 text-center font-mono text-indigo-300">
                          {p.portfolio_score.toFixed(1)}
                        </td>
                        {/* Recommendation Badge */}
                        <td className="py-3 px-5">
                          {getActionBadge(p.recommended_action)}
                        </td>
                        {/* Confidence Tier */}
                        <td className="py-3 px-5 font-mono text-xs text-slate-400">
                          {p.confidence_tier}
                        </td>
                      </tr>
                      {/* Reason Sub-Row */}
                      <tr className={`border-b border-slate-800/60 bg-slate-950/20 text-xs text-slate-400 ${isHighValue ? "bg-indigo-950/5" : ""}`}>
                        <td colSpan={8} className="py-2.5 px-5 leading-relaxed italic">
                          <span className="font-semibold text-slate-500 uppercase text-[10px] mr-1.5">Explanation:</span>
                          {p.policy_reason}
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
