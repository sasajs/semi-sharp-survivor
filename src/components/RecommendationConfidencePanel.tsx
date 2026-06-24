import React, { useState, useEffect } from "react";
import { 
  RefreshCw, 
  SlidersHorizontal, 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  AlertTriangle,
  HelpCircle,
  Database,
  BarChart4,
  Flame,
  Scale
} from "lucide-react";
import { apiService } from "../services/apiService";
import { RecommendationConfidenceSnapshot, ConfidenceTier, StabilityTier } from "../types";

export interface RecommendationConfidencePanelProps {
  entries: { id: string; name: string }[];
  teams: { id: string; name: string; abbreviation: string }[];
}

export const RecommendationConfidencePanel: React.FC<RecommendationConfidencePanelProps> = ({
  entries = [],
  teams = []
}) => {
  const [snapshots, setSnapshots] = useState<RecommendationConfidenceSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedEntry, setSelectedEntry] = useState<string>("all");
  const [selectedConfidenceTier, setSelectedConfidenceTier] = useState<string>("all");
  const [selectedStabilityTier, setSelectedStabilityTier] = useState<string>("all");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.fetchConfidenceHistory();
      setSnapshots(data);
    } catch (err: any) {
      setError("Failed to fetch recommendation confidence snapshots: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Snapshots
  const filteredSnapshots = snapshots.filter(s => {
    if (selectedEntry !== "all" && s.entry_id !== selectedEntry) return false;
    if (selectedConfidenceTier !== "all" && s.confidence_tier !== selectedConfidenceTier) return false;
    if (selectedStabilityTier !== "all" && s.stability_tier !== selectedStabilityTier) return false;
    return true;
  });

  // Dynamic Reports computations
  const totalCount = filteredSnapshots.length;

  const highestConfidence = [...filteredSnapshots]
    .sort((a, b) => b.confidence_score - a.confidence_score)
    .slice(0, 5);

  const lowestConfidence = [...filteredSnapshots]
    .sort((a, b) => a.confidence_score - b.confidence_score)
    .slice(0, 5);

  const mostStable = [...filteredSnapshots]
    .sort((a, b) => b.stability_score - a.stability_score)
    .slice(0, 5);

  const mostVolatile = [...filteredSnapshots]
    .sort((a, b) => b.recommendation_volatility - a.recommendation_volatility)
    .slice(0, 5);

  // Risk Classification counting
  // "Fragile" = Low/Very Low confidence OR Unstable/Highly Unstable stability
  const fragileCount = filteredSnapshots.filter(s => 
    s.confidence_tier === ConfidenceTier.LOW || 
    s.confidence_tier === ConfidenceTier.VERY_LOW ||
    s.stability_tier === StabilityTier.UNSTABLE ||
    s.stability_tier === StabilityTier.HIGHLY_UNSTABLE
  ).length;

  // "Solid" = High/Very High confidence AND Stable/Very Stable stability
  const solidCount = filteredSnapshots.filter(s => 
    (s.confidence_tier === ConfidenceTier.HIGH || s.confidence_tier === ConfidenceTier.VERY_HIGH) &&
    (s.stability_tier === StabilityTier.STABLE || s.stability_tier === StabilityTier.VERY_STABLE)
  ).length;

  const moderateCount = totalCount - fragileCount - solidCount;

  const getConfidenceBadge = (tier: string) => {
    switch (tier) {
      case ConfidenceTier.VERY_HIGH:
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case ConfidenceTier.HIGH:
        return "bg-teal-50 text-teal-800 border-teal-200";
      case ConfidenceTier.MEDIUM:
        return "bg-amber-50 text-amber-800 border-amber-200";
      case ConfidenceTier.LOW:
        return "bg-orange-100 text-orange-850 border-orange-200";
      case ConfidenceTier.VERY_LOW:
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStabilityBadge = (tier: string) => {
    switch (tier) {
      case StabilityTier.VERY_STABLE:
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case StabilityTier.STABLE:
        return "bg-sky-50 text-sky-800 border-sky-200";
      case StabilityTier.MODERATE:
        return "bg-slate-100 text-slate-800 border-slate-200";
      case StabilityTier.UNSTABLE:
        return "bg-orange-50 text-orange-800 border-orange-200";
      case StabilityTier.HIGHLY_UNSTABLE:
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const formatLabel = (val: string) => {
    return val.replace(/_/g, " ");
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-150 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wide border border-emerald-200">
              Layer 2 Trust Layer
            </span>
            <span className="text-slate-400 text-xs font-mono">v0.37-confidence-stability-engine</span>
          </div>
          <h2 className="font-black text-slate-900 text-xl tracking-tight mt-1">
            Recommendation Confidence &amp; Stability Engine
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Differentiate solid recommendations from fragile, close alternatives. Measure volatility, score margins, and audit confidence intervals dynamically.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-250 px-4 py-2 rounded-xl text-xs font-black text-slate-700 transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-slate-500" : ""}`} />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl flex items-center gap-3 shadow-sm text-xs font-semibold text-rose-800">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* METRICS & RISK RATIOS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Total Snapshots */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Analyzed Profiles
          </span>
          <div className="flex justify-between items-end">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{totalCount}</span>
            <Database className="w-5 h-5 text-indigo-500 mb-1" />
          </div>
          <p className="text-[10px] text-slate-400">Total snapshot counts across currently selected entry profiles.</p>
        </div>

        {/* Solid & Trusted Ratio */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Solid &amp; Trusted (High Trust)
          </span>
          <div className="flex justify-between items-end">
            <span className="text-3xl font-black text-emerald-700 tracking-tight">{solidCount}</span>
            <ShieldCheck className="w-5 h-5 text-emerald-500 mb-1" />
          </div>
          <p className="text-[10px] text-slate-400">
            {totalCount > 0 ? Math.round((solidCount / totalCount) * 100) : 0}% profiles have high confidence + high stability.
          </p>
        </div>

        {/* Moderate Risk */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Moderate / Viable Alternatives
          </span>
          <div className="flex justify-between items-end">
            <span className="text-3xl font-black text-slate-700 tracking-tight">{moderateCount}</span>
            <Scale className="w-5 h-5 text-slate-500 mb-1" />
          </div>
          <p className="text-[10px] text-slate-400">
            {totalCount > 0 ? Math.round((moderateCount / totalCount) * 100) : 0}% profiles have medium risk/return attributes.
          </p>
        </div>

        {/* Fragile & High Risk */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Fragile &amp; Risky Picks
          </span>
          <div className="flex justify-between items-end">
            <span className="text-3xl font-black text-rose-700 tracking-tight">{fragileCount}</span>
            <ShieldAlert className="w-5 h-5 text-rose-500 mb-1" />
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            {totalCount > 0 ? Math.round((fragileCount / totalCount) * 100) : 0}% require cautious sizing due to low score gaps or high volatility.
          </p>
        </div>

      </div>

      {/* REPORTING INTEGRATION SLATE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Highest Confidence */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-black text-slate-900 text-xs">Highest Confidence</h3>
              <p className="text-[9px] text-slate-400">Highly reliable recommendation margins.</p>
            </div>
          </div>
          <div className="space-y-2">
            {highestConfidence.length > 0 ? (
              highestConfidence.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100 text-xs">
                  <span className="font-mono bg-slate-200 px-1.5 py-0.5 rounded font-black text-slate-700">
                    {item.team_id}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-400">Score {item.recommendation_score}</span>
                    <span className="font-bold text-emerald-600 font-mono">{item.confidence_score}%</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">No entries found</div>
            )}
          </div>
        </div>

        {/* Lowest Confidence */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <div>
              <h3 className="font-black text-slate-900 text-xs">Lowest Confidence / Fragile</h3>
              <p className="text-[9px] text-slate-400">Thin margins, susceptible to change.</p>
            </div>
          </div>
          <div className="space-y-2">
            {lowestConfidence.length > 0 ? (
              lowestConfidence.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100 text-xs">
                  <span className="font-mono bg-slate-200 px-1.5 py-0.5 rounded font-black text-slate-700">
                    {item.team_id}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-400">Score {item.recommendation_score}</span>
                    <span className="font-bold text-rose-600 font-mono">{item.confidence_score}%</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">No entries found</div>
            )}
          </div>
        </div>

        {/* Most Stable */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-black text-slate-900 text-xs">Most Stable Picks</h3>
              <p className="text-[9px] text-slate-400">Highly resilient to recalculation loops.</p>
            </div>
          </div>
          <div className="space-y-2">
            {mostStable.length > 0 ? (
              mostStable.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100 text-xs">
                  <span className="font-mono bg-slate-200 px-1.5 py-0.5 rounded font-black text-slate-700">
                    {item.team_id}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-400">Vol {item.recommendation_volatility}%</span>
                    <span className="font-bold text-indigo-600 font-mono">{item.stability_score}%</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">No entries found</div>
            )}
          </div>
        </div>

        {/* Most Volatile */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Flame className="w-5 h-5 text-amber-600" />
            <div>
              <h3 className="font-black text-slate-900 text-xs">Most Volatile Picks</h3>
              <p className="text-[9px] text-slate-400">Highest movement and tier sensitivity.</p>
            </div>
          </div>
          <div className="space-y-2">
            {mostVolatile.length > 0 ? (
              mostVolatile.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100 text-xs">
                  <span className="font-mono bg-slate-200 px-1.5 py-0.5 rounded font-black text-slate-700">
                    {item.team_id}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-400">Stability {item.stability_score}%</span>
                    <span className="font-bold text-amber-600 font-mono">{item.recommendation_volatility}%</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">No entries found</div>
            )}
          </div>
        </div>

      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-3">
        <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-indigo-650" />
          <span>Interactive Risk &amp; Trust Filters</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Entry Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 block uppercase mb-1">
              Filter by Entry
            </label>
            <select
              value={selectedEntry}
              onChange={e => setSelectedEntry(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-indigo-650"
            >
              <option value="all">All Portfolio Entries</option>
              {entries.map(e => (
                <option key={e.id} value={e.id}>{e.name} ({e.id})</option>
              ))}
            </select>
          </div>

          {/* Confidence Tier Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 block uppercase mb-1">
              Confidence Tier
            </label>
            <select
              value={selectedConfidenceTier}
              onChange={e => setSelectedConfidenceTier(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-indigo-650"
            >
              <option value="all">All Confidence Tiers</option>
              {Object.values(ConfidenceTier).map(tier => (
                <option key={tier} value={tier}>{formatLabel(tier)}</option>
              ))}
            </select>
          </div>

          {/* Stability Tier Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 block uppercase mb-1">
              Stability Tier
            </label>
            <select
              value={selectedStabilityTier}
              onChange={e => setSelectedStabilityTier(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-indigo-650"
            >
              <option value="all">All Stability Tiers</option>
              {Object.values(StabilityTier).map(tier => (
                <option key={tier} value={tier}>{formatLabel(tier)}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* DETAIL TABLE SNAPSHOTS */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
            <BarChart4 className="w-4.5 h-4.5 text-emerald-650" />
            <span>Recommendation Trust &amp; Confidence Matrix Ledger</span>
          </h3>
          <span className="text-[10px] font-mono bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-black">
            STABILITY SNAPSHOTS
          </span>
        </div>

        <div className="overflow-x-auto">
          {filteredSnapshots.length > 0 ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-500 border-b border-slate-200 font-bold">
                  <th className="p-3.5">Entry ID</th>
                  <th className="p-3.5">Team</th>
                  <th className="p-3.5 text-center">Rank</th>
                  <th className="p-3.5 text-right">Score</th>
                  <th className="p-3.5 text-right text-emerald-700 font-black">Confidence</th>
                  <th className="p-3.5 text-right text-indigo-700 font-black">Stability</th>
                  <th className="p-3.5 text-right">Score Gap (Next)</th>
                  <th className="p-3.5 text-right">Score Gap (Top)</th>
                  <th className="p-3.5 text-right">Volatility</th>
                  <th className="p-3.5">Analytical Explanation &amp; Drivers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {filteredSnapshots.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-bold text-slate-600">{item.entry_id}</td>
                    <td className="p-3.5">
                      <span className="font-black font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-800">
                        {item.team_id}
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-700">
                      Rank {item.recommendation_rank}
                    </td>
                    <td className="p-3.5 text-right font-bold font-mono">
                      {Number(item.recommendation_score).toFixed(1)}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-black font-mono text-emerald-600 text-xs">
                          {Number(item.confidence_score).toFixed(1)}%
                        </span>
                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${getConfidenceBadge(item.confidence_tier)} mt-0.5`}>
                          {formatLabel(item.confidence_tier)}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-black font-mono text-indigo-600 text-xs">
                          {Number(item.stability_score).toFixed(1)}%
                        </span>
                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${getStabilityBadge(item.stability_tier)} mt-0.5`}>
                          {formatLabel(item.stability_tier)}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5 text-right font-semibold font-mono text-slate-600">
                      +{Number(item.score_gap_to_next).toFixed(1)}
                    </td>
                    <td className="p-3.5 text-right font-semibold font-mono text-slate-550">
                      -{Number(item.score_gap_to_top).toFixed(1)}
                    </td>
                    <td className="p-3.5 text-right font-semibold font-mono text-slate-500">
                      {Number(item.recommendation_volatility).toFixed(1)}%
                    </td>
                    <td className="p-3.5 text-slate-600 max-w-sm">
                      <p className="line-clamp-2" title={item.explanation}>
                        {item.explanation}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs font-medium space-y-2">
              <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No confidence snapshots available matching filters.</p>
              <p className="text-[10px] text-slate-400">Run a recommendation calculation to generate confidence snapshots.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
