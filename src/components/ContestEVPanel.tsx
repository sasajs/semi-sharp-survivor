import React, { useState, useEffect } from "react";
import { 
  RefreshCw, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  Database,
  BarChart4,
  Award,
  Zap,
  ShieldCheck,
  Search,
  Filter,
  TrendingUp,
  Sliders,
  DollarSign,
  PieChart
} from "lucide-react";
import { apiService } from "../services/apiService";
import { ContestEV, ContestType } from "../types";

export interface ContestEVPanelProps {
  entries: { id: string; name: string }[];
  teams: { id: string; name: string; abbreviation: string }[];
}

export const ContestEVPanel: React.FC<ContestEVPanelProps> = ({
  entries = [],
  teams = []
}) => {
  const [contestEVs, setContestEVs] = useState<ContestEV[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [selectedContestId, setSelectedContestId] = useState<string>("all");
  const [selectedContestType, setSelectedContestType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.fetchContestEVHistory();
      setContestEVs(data);
    } catch (err: any) {
      setError("Failed to fetch Contest Expected Value data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunEVEngine = async () => {
    setCalculating(true);
    setError(null);
    setSuccessMsg(null);
    try {
      // Trigger calculation for Season 2026, Week 1, Version v1.0.0
      await apiService.generateContestEV("2026", 1, "v1.0.0");
      setSuccessMsg("Contest Expected Value (Contest EV) calculated and snapshotted successfully.");
      await loadData();
    } catch (err: any) {
      setError("Failed to run Contest EV engine: " + err.message);
    } finally {
      setCalculating(false);
    }
  };

  const getTeamName = (teamId: string) => {
    const t = teams.find(item => item.id.toLowerCase() === teamId.toLowerCase());
    return t ? t.name : teamId.toUpperCase();
  };

  const getEntryName = (entryId: string) => {
    const e = entries.find(item => item.id === entryId);
    return e ? e.name : `Entry ${entryId}`;
  };

  const getEVColorClass = (score: number) => {
    if (score >= 80) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (score >= 50) return "text-amber-700 bg-amber-50 border-amber-200";
    return "text-rose-700 bg-rose-50 border-rose-200";
  };

  const getContestLabel = (contestId: string) => {
    switch (contestId) {
      case "circa-2026": return "Circa Survivor 2026";
      case "public-mega": return "Public Mega Contest";
      case "private-highroller": return "Private High-Roller Pool";
      case "group-office": return "Office Group Pool";
      case "marketplace-champ": return "Marketplace Championship";
      default: return contestId.toUpperCase();
    }
  };

  // Extract unique contests and types for dropdowns
  const uniqueContestIds = Array.from(new Set(contestEVs.map(ev => ev.contest_id))) as string[];
  const uniqueContestTypes = Array.from(new Set(contestEVs.map(ev => ev.contest_type).filter(Boolean))) as string[];

  // Filter list
  const filteredEVs = contestEVs.filter(ev => {
    const matchesContest = selectedContestId === "all" || ev.contest_id === selectedContestId;
    const matchesType = selectedContestType === "all" || ev.contest_type === selectedContestType;
    
    const entryName = getEntryName(ev.entry_id).toLowerCase();
    const teamName = getTeamName(ev.recommended_team_id).toLowerCase();
    const textSearch = searchTerm.toLowerCase();
    const matchesSearch = entryName.includes(textSearch) || teamName.includes(textSearch) || ev.explanation.toLowerCase().includes(textSearch);

    return matchesContest && matchesType && matchesSearch;
  });

  // Calculate high level KPI metrics
  const avgEV = filteredEVs.length > 0 
    ? filteredEVs.reduce((acc, c) => acc + c.contest_ev_score, 0) / filteredEVs.length 
    : 0;

  const maxChampionshipProb = filteredEVs.length > 0
    ? Math.max(...filteredEVs.map(ev => ev.championship_probability))
    : 0;

  const totalRiskAdjustmentSum = filteredEVs.length > 0
    ? filteredEVs.reduce((acc, c) => acc + c.risk_adjustment, 0)
    : 0;

  const highEVCount = filteredEVs.filter(ev => ev.contest_ev_score >= 80).length;

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in" id="ev-header">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wide border border-indigo-200">
              Layer 5 Championship EV Optimization
            </span>
            <span className="text-slate-400 text-xs font-mono">V0.40 Contest Expected Value Engine</span>
          </div>
          <h2 className="font-black text-slate-900 text-xl tracking-tight mt-1">
            Contest Expected Value (Contest EV) Engine
          </h2>
          <p className="text-slate-500 text-sm mt-0.5 max-w-2xl">
            Optimizes selections by modeling win probabilities, equity hedges, ownership concentrations, and correlation risks specifically calibrated for targeted contest types.
          </p>
        </div>
        
        <div className="flex items-center gap-2 self-stretch md:self-auto">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-xl transition duration-150"
            id="refresh-ev-btn"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          
          <button
            onClick={handleRunEVEngine}
            disabled={calculating}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition duration-150 disabled:opacity-70"
            id="run-ev-btn"
          >
            <Zap className={`w-3.5 h-3.5 ${calculating ? "animate-spin" : ""}`} />
            Generate Contest EV
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-800 p-4 rounded-xl flex items-start gap-3 animate-slide-in">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-bold">System Error:</span> {error}
          </div>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-150 text-emerald-900 p-4 rounded-xl flex items-start gap-3 animate-slide-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-bold">Success:</span> {successMsg}
          </div>
        </div>
      )}

      {/* Metrics Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="ev-kpi-metrics">
        
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Average Contest EV</p>
              <p className="text-slate-900 text-2xl font-black mt-1 leading-none">
                {avgEV.toFixed(1)}
              </p>
            </div>
            <div className="bg-indigo-50 text-indigo-700 p-2 rounded-xl border border-indigo-200">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-2">
            Average game-theory EV score across active pools
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Peak Champ Prob</p>
              <p className="text-slate-900 text-2xl font-black mt-1 leading-none">
                {maxChampionshipProb > 0 ? `${maxChampionshipProb.toFixed(4)}%` : "0.000%"}
              </p>
            </div>
            <div className="bg-emerald-50 text-emerald-700 p-2 rounded-xl border border-emerald-200">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-2">
            Highest calibrated championship probability
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">High EV Options</p>
              <p className="text-slate-900 text-2xl font-black mt-1 leading-none">
                {highEVCount}
              </p>
            </div>
            <div className="bg-blue-50 text-blue-700 p-2 rounded-xl border border-blue-200">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-2">
            Selections with EV score &gt;= 80
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Agg Risk Adjustment</p>
              <p className="text-rose-600 text-2xl font-black mt-1 leading-none">
                -{totalRiskAdjustmentSum.toFixed(1)}
              </p>
            </div>
            <div className="bg-rose-50 text-rose-700 p-2 rounded-xl border border-rose-200">
              <Sliders className="w-4 h-4" />
            </div>
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-2">
            Total public ownership chalk deductions applied
          </div>
        </div>

      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between" id="ev-filters">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          
          <div className="relative flex-1 md:flex-none min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search entry or team..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs w-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 border border-slate-200 px-3 py-1.5 rounded-xl bg-slate-50 text-xs font-medium text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Contest:</span>
            <select
              value={selectedContestId}
              onChange={(e) => setSelectedContestId(e.target.value)}
              className="bg-transparent border-none p-0 focus:ring-0 cursor-pointer font-bold"
            >
              <option value="all">All Contests</option>
              {uniqueContestIds.map(id => (
                <option key={id} value={id}>{getContestLabel(id)}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 border border-slate-200 px-3 py-1.5 rounded-xl bg-slate-50 text-xs font-medium text-slate-700">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>Type:</span>
            <select
              value={selectedContestType}
              onChange={(e) => setSelectedContestType(e.target.value)}
              className="bg-transparent border-none p-0 focus:ring-0 cursor-pointer font-bold"
            >
              <option value="all">All Types</option>
              {uniqueContestTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

        </div>

        <div className="text-slate-400 text-xs font-mono font-medium self-end md:self-auto shrink-0">
          Showing {filteredEVs.length} of {contestEVs.length} calculations
        </div>
      </div>

      {/* Main Allocations and Expected Value Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden" id="ev-allocations-table">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-indigo-600" />
            Championship Expected Value Optimizations
          </h3>
          <span className="text-[10px] bg-slate-200 text-slate-700 font-mono px-2 py-0.5 rounded uppercase font-bold">
            Season 2026 • Week 1
          </span>
        </div>

        {loading && filteredEVs.length === 0 ? (
          <div className="py-20 text-center text-slate-400 font-medium text-sm">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-slate-300 mb-2" />
            Loading Contest Expected Value records...
          </div>
        ) : filteredEVs.length === 0 ? (
          <div className="py-20 text-center text-slate-400 font-medium text-sm">
            No Contest EV records found matching the active filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-6">Contest &amp; Type</th>
                  <th className="py-3 px-4">Entry &amp; Choice</th>
                  <th className="py-3 px-4 text-center">Contest Size (Rem)</th>
                  <th className="py-3 px-4 text-center">Ownership</th>
                  <th className="py-3 px-4 text-center">Win Prob</th>
                  <th className="py-3 px-4 text-center">Ftv Score</th>
                  <th className="py-3 px-4 text-center">Equity</th>
                  <th className="py-3 px-4 text-center">Portfolio</th>
                  <th className="py-3 px-4 text-center">Consensus</th>
                  <th className="py-3 px-4 text-center">Risk Adj</th>
                  <th className="py-3 px-4 text-center">EV Score</th>
                  <th className="py-3 px-6 text-center">Championship Prob</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredEVs.map(ev => (
                  <React.Fragment key={ev.id}>
                    
                    <tr className="hover:bg-slate-50/50 transition duration-150 font-medium text-slate-700">
                      
                      {/* Contest details */}
                      <td className="py-4 px-6">
                        <div className="font-extrabold text-slate-900 leading-tight">
                          {getContestLabel(ev.contest_id)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase font-bold">
                          {ev.contest_type}
                        </div>
                      </td>

                      {/* Entry and choice */}
                      <td className="py-4 px-4">
                        <div className="text-slate-500 font-bold">
                          {getEntryName(ev.entry_id)}
                        </div>
                        <div className="font-black text-slate-950 text-sm mt-0.5 leading-none">
                          {getTeamName(ev.recommended_team_id)}
                        </div>
                      </td>

                      {/* Contest size */}
                      <td className="py-4 px-4 text-center font-mono font-semibold">
                        <div>{ev.contest_size.toLocaleString()}</div>
                        <div className="text-[10px] text-emerald-600">({ev.remaining_entries.toLocaleString()})</div>
                      </td>

                      {/* Ownership */}
                      <td className="py-4 px-4 text-center font-mono font-semibold">
                        {ev.estimated_ownership.toFixed(1)}%
                      </td>

                      {/* Win Prob */}
                      <td className="py-4 px-4 text-center font-mono font-semibold">
                        {((ev.win_probability || 0.75) * 100).toFixed(0)}%
                      </td>

                      {/* FTV */}
                      <td className="py-4 px-4 text-center font-mono font-semibold">
                        {ev.future_team_value.toFixed(0)}
                      </td>

                      {/* Equity */}
                      <td className="py-4 px-4 text-center font-mono font-semibold">
                        {ev.survivor_equity.toFixed(0)}
                      </td>

                      {/* Portfolio Score */}
                      <td className="py-4 px-4 text-center font-mono font-semibold">
                        {ev.portfolio_score.toFixed(0)}
                      </td>

                      {/* Consensus */}
                      <td className="py-4 px-4 text-center font-mono font-semibold">
                        {ev.consensus_score.toFixed(0)}
                      </td>

                      {/* Risk Adj */}
                      <td className="py-4 px-4 text-center font-mono font-extrabold text-rose-600">
                        -{ev.risk_adjustment.toFixed(1)}
                      </td>

                      {/* EV Score */}
                      <td className="py-4 px-4 text-center">
                        <div className={`inline-block px-2.5 py-1 rounded-lg border font-black text-xs ${getEVColorClass(ev.contest_ev_score)}`}>
                          {ev.contest_ev_score.toFixed(1)}
                        </div>
                      </td>

                      {/* Championship Probability */}
                      <td className="py-4 px-6 text-center">
                        <div className="font-extrabold text-slate-900 font-mono text-sm">
                          {ev.championship_probability.toFixed(4)}%
                        </div>
                        <div className="text-[9px] text-slate-400 font-medium">
                          {(ev.championship_probability / (100 / ev.remaining_entries)).toFixed(2)}x baseline
                        </div>
                      </td>

                    </tr>

                    {/* Explanatory Dropdown Row */}
                    <tr>
                      <td colSpan={12} className="px-6 pb-4 pt-1 bg-slate-50/40 text-[11px] leading-relaxed text-slate-500 border-b border-slate-100 font-medium">
                        <div className="flex items-start gap-1.5">
                          <Database className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span>
                            <span className="font-bold text-slate-700">Audit Log Explanation:</span> {ev.explanation}
                          </span>
                        </div>
                      </td>
                    </tr>

                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
