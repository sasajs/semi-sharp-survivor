import React, { useState, useEffect } from "react";
import { 
  RefreshCw, 
  SlidersHorizontal, 
  TrendingUp, 
  TrendingDown, 
  PlusCircle, 
  MinusCircle, 
  Activity, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
  FileCheck
} from "lucide-react";
import { apiService } from "../services/apiService";
import { RecommendationAudit, RecommendationChangeCategory } from "../types";

export interface RecommendationAuditPanelProps {
  entries: { id: string; name: string }[];
  teams: { id: string; name: string; abbreviation: string }[];
}

export const RecommendationAuditPanel: React.FC<RecommendationAuditPanelProps> = ({
  entries = [],
  teams = []
}) => {
  const [audits, setAudits] = useState<RecommendationAudit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [selectedEntry, setSelectedEntry] = useState<string>("all");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Load audits
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const history = await apiService.fetchAuditsHistory();
      setAudits(history);
    } catch (err: any) {
      setError("Failed to fetch recommendation audits: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered audits
  const filteredAudits = audits.filter(audit => {
    if (selectedEntry !== "all" && audit.entry_id !== selectedEntry) return false;
    if (selectedTeam !== "all" && audit.team_id.toUpperCase() !== selectedTeam.toUpperCase()) return false;
    if (selectedCategory !== "all" && audit.change_category !== selectedCategory) return false;
    return true;
  });

  // Calculate statistics for the selected subset
  const totalCount = filteredAudits.length;
  const unchangedCount = filteredAudits.filter(a => a.change_category === RecommendationChangeCategory.UNCHANGED).length;
  const changedCount = totalCount - unchangedCount;
  const stabilityIndex = totalCount > 0 ? Math.round((unchangedCount / totalCount) * 100) : 100;

  // Biggest Risers: Teams with positive rank_delta or positive score_delta (top 5)
  const risers = [...filteredAudits]
    .filter(a => a.score_delta > 0 || a.rank_delta > 0)
    .sort((a, b) => b.score_delta - a.score_delta)
    .slice(0, 5);

  // Biggest Fallers: Teams with negative score_delta (top 5)
  const fallers = [...filteredAudits]
    .filter(a => a.score_delta < 0 || a.rank_delta < 0)
    .sort((a, b) => a.score_delta - b.score_delta)
    .slice(0, 5);

  // New Recommendations
  const newRecs = filteredAudits.filter(a => a.change_category === RecommendationChangeCategory.NEW_RECOMMENDATION);

  // Removed Recommendations
  const removedRecs = filteredAudits.filter(a => a.change_category === RecommendationChangeCategory.REMOVED_RECOMMENDATION);

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case RecommendationChangeCategory.MAJOR_IMPROVEMENT:
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case RecommendationChangeCategory.MINOR_IMPROVEMENT:
        return "bg-teal-50 text-teal-700 border-teal-100";
      case RecommendationChangeCategory.UNCHANGED:
        return "bg-slate-100 text-slate-600 border-slate-200";
      case RecommendationChangeCategory.MINOR_DECLINE:
        return "bg-orange-50 text-orange-700 border-orange-100";
      case RecommendationChangeCategory.MAJOR_DECLINE:
        return "bg-rose-100 text-rose-800 border-rose-200";
      case RecommendationChangeCategory.NEW_RECOMMENDATION:
        return "bg-blue-100 text-blue-800 border-blue-200";
      case RecommendationChangeCategory.REMOVED_RECOMMENDATION:
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.replace(/_/g, " ");
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Controls */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wide">
              Layer 2 Intelligence
            </span>
            <span className="text-slate-400 text-xs font-mono">v0.36-audit-engine</span>
          </div>
          <h2 className="font-black text-slate-900 text-xl tracking-tight mt-1">
            Recommendation Audit &amp; Traceability Log
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Track why and how survivor recommendations change across calculation cycles to guarantee explainable and audit-proof decision logic.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-250 px-4 py-2 rounded-xl text-xs font-black text-slate-700 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-slate-500" : ""}`} />
            <span>Refresh Logs</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl flex items-center gap-3 shadow-sm text-xs font-semibold text-rose-800">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-xl flex items-center justify-between gap-3 shadow-sm text-xs font-semibold text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="font-black text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* STABILITY AND PERFORMANCE ANALYTICS SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Stability score card */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Recommendation Stability
            </span>
            <span className="bg-indigo-50 p-1.5 rounded-lg">
              <Activity className="w-4 h-4 text-indigo-600" />
            </span>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {stabilityIndex}%
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">
              {unchangedCount} of {totalCount} recommendation profiles remained stable
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-indigo-600" style={{ width: `${stabilityIndex}%` }}></div>
          </div>
        </div>

        {/* Change volume card */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Calculation Volatility
            </span>
            <span className="bg-amber-50 p-1.5 rounded-lg">
              <SlidersHorizontal className="w-4 h-4 text-amber-600" />
            </span>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {changedCount}
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">
              Active recommendation updates generated in latest snapshots
            </span>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Updates run automatically on recalculation</span>
          </div>
        </div>

        {/* New Recommendations Card */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Newly Surfaced Teams
            </span>
            <span className="bg-blue-50 p-1.5 rounded-lg">
              <PlusCircle className="w-4 h-4 text-blue-600" />
            </span>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {newRecs.length}
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">
              Recommendations newly promoted into viable lists
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            {newRecs.slice(0, 3).map(n => n.team_id).join(", ") || "None in active filters"}
          </div>
        </div>

        {/* Removed Recommendations Card */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Removed Recommendations
            </span>
            <span className="bg-red-50 p-1.5 rounded-lg">
              <MinusCircle className="w-4 h-4 text-red-600" />
            </span>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {removedRecs.length}
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">
              Previously recommended teams that lost viability
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            {removedRecs.slice(0, 3).map(r => r.team_id).join(", ") || "None in active filters"}
          </div>
        </div>

      </div>

      {/* DETAILED RECOMMENDATION AUDIT ANALYSIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Biggest Risers Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-black text-slate-900 text-sm">Biggest Recommendation Risers</h3>
              <p className="text-[10px] text-slate-400">Teams whose score or rank increased the most in the latest calculations.</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {risers.length > 0 ? (
              risers.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-black">
                      {item.team_id}
                    </span>
                    <span className="text-xs text-slate-500">Entry: {item.entry_id}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {item.rank_delta > 0 && (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                        <ArrowUpRight className="w-3.5 h-3.5" /> Rank +{item.rank_delta}
                      </span>
                    )}
                    <span className="text-xs font-mono font-black text-indigo-700">
                      Score +{item.score_delta.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs font-medium">No risers matching current filters</div>
            )}
          </div>
        </div>

        {/* Biggest Fallers Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <TrendingDown className="w-5 h-5 text-rose-600" />
            <div>
              <h3 className="font-black text-slate-900 text-sm">Biggest Recommendation Fallers</h3>
              <p className="text-[10px] text-slate-400">Teams whose expected value score dropped most severely.</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {fallers.length > 0 ? (
              fallers.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-black">
                      {item.team_id}
                    </span>
                    <span className="text-xs text-slate-500">Entry: {item.entry_id}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {item.rank_delta < 0 && (
                      <span className="text-xs font-bold text-rose-600 flex items-center gap-0.5">
                        <ArrowDownRight className="w-3.5 h-3.5" /> Rank {item.rank_delta}
                      </span>
                    )}
                    <span className="text-xs font-mono font-black text-rose-700">
                      Score {item.score_delta.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs font-medium">No fallers matching current filters</div>
            )}
          </div>
        </div>

      </div>

      {/* FILTER SLATE */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-3">
        <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-indigo-650" />
          <span>Interactive Audit Filters</span>
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

          {/* Team Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 block uppercase mb-1">
              Filter by Team
            </label>
            <select
              value={selectedTeam}
              onChange={e => setSelectedTeam(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-indigo-650"
            >
              <option value="all">All NFL Teams</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.id.toUpperCase()})</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 block uppercase mb-1">
              Filter by Change Category
            </label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-indigo-650"
            >
              <option value="all">All Categories</option>
              {Object.values(RecommendationChangeCategory).map(cat => (
                <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* LOG TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
            <FileCheck className="w-4.5 h-4.5 text-indigo-600" />
            <span>Traceability Ledger ({totalCount} snapshots loaded)</span>
          </h3>
          <span className="text-[10px] font-mono bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-black">
            IMMUTABLE RECORDS
          </span>
        </div>

        <div className="overflow-x-auto">
          {filteredAudits.length > 0 ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-500 border-b border-slate-200 font-bold">
                  <th className="p-3.5">Entry ID</th>
                  <th className="p-3.5">Team</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5 text-center">Rank</th>
                  <th className="p-3.5 text-right">Score Delta</th>
                  <th className="p-3.5">Audit Narrative &amp; Attribution drivers</th>
                  <th className="p-3.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {filteredAudits.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-bold text-slate-600">{item.entry_id}</td>
                    <td className="p-3.5">
                      <span className="font-black font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-800">
                        {item.team_id}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getCategoryBadgeClass(item.change_category)}`}>
                        {getCategoryLabel(item.change_category)}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      {item.previous_rank !== null && item.current_rank !== null ? (
                        <div className="flex flex-col items-center">
                          <span className="text-slate-400 text-[10px]">Rank {item.previous_rank} → {item.current_rank}</span>
                          <span className={`font-mono text-[10px] font-black ${item.rank_delta > 0 ? "text-emerald-600" : item.rank_delta < 0 ? "text-rose-600" : "text-slate-400"}`}>
                            {item.rank_delta > 0 ? `+${item.rank_delta}` : item.rank_delta}
                          </span>
                        </div>
                      ) : item.current_rank !== null ? (
                        <span className="font-bold">Rank {item.current_rank}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right font-bold font-mono">
                      <span className={item.score_delta > 0 ? "text-emerald-600" : item.score_delta < 0 ? "text-rose-600" : "text-slate-400"}>
                        {item.score_delta > 0 ? `+${item.score_delta.toFixed(1)}` : item.score_delta.toFixed(1)}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600 max-w-sm">
                      <p className="line-clamp-2" title={item.audit_summary}>{item.audit_summary}</p>
                    </td>
                    <td className="p-3.5 text-right text-slate-400 font-mono text-[10px]">
                      {item.created_at ? new Date(item.created_at).toLocaleTimeString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs font-medium space-y-2">
              <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No audit snapshots available matching filters.</p>
              <p className="text-[10px] text-slate-400">Run a recommendation calculation to generate audit history traces.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
