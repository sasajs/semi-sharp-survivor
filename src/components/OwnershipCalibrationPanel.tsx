import React, { useState, useEffect } from "react";
import { 
  RefreshCw, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  Database,
  BarChart4,
  Zap,
  Sliders,
  TrendingUp,
  Percent,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Info
} from "lucide-react";
import { apiService } from "../services/apiService";
import { OwnershipCalibration } from "../types";

export interface OwnershipCalibrationPanelProps {
  teams: { id: string; name: string; abbreviation: string }[];
}

export const OwnershipCalibrationPanel: React.FC<OwnershipCalibrationPanelProps> = ({
  teams = []
}) => {
  const [calibrations, setCalibrations] = useState<OwnershipCalibration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [selectedContestId, setSelectedContestId] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.fetchOwnershipCalibrationHistory();
      setCalibrations(data);
    } catch (err: any) {
      setError("Failed to fetch Ownership Calibration data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunCalibrationEngine = async () => {
    setCalculating(true);
    setError(null);
    setSuccessMsg(null);
    try {
      // Trigger calculation for Season 2026, Week 1, Version v1.0.0
      await apiService.generateOwnershipCalibration("2026", 1, "v1.0.0");
      setSuccessMsg("V041 Ownership Calibration Engine run executed and snapshotted successfully.");
      await loadData();
    } catch (err: any) {
      setError("Failed to run Ownership Calibration Engine: " + err.message);
    } finally {
      setCalculating(false);
    }
  };

  const getTeamName = (teamId: string) => {
    const t = teams.find(item => item.id.toLowerCase() === teamId.toLowerCase());
    return t ? t.name : teamId.toUpperCase();
  };

  const getTeamAbbrev = (teamId: string) => {
    const t = teams.find(item => item.id.toLowerCase() === teamId.toLowerCase());
    return t ? t.abbreviation : teamId.substring(0, 3).toUpperCase();
  };

  const getCalibrationScoreColorClass = (score: number) => {
    if (score >= 85) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (score >= 70) return "text-amber-700 bg-amber-50 border-amber-200";
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

  // Filter & Search Logic
  const filteredCalibrations = calibrations.filter(c => {
    const matchesContest = selectedContestId === "all" || c.contest_id === selectedContestId;
    const teamName = getTeamName(c.team_id).toLowerCase();
    const teamAbbrev = getTeamAbbrev(c.team_id).toLowerCase();
    const matchesSearch = teamName.includes(searchTerm.toLowerCase()) || teamAbbrev.includes(searchTerm.toLowerCase());
    return matchesContest && matchesSearch;
  });

  return (
    <div id="ownership-calibration-panel" className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white border border-gray-100 p-6 rounded-2xl shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600" />
            V041 Ownership Calibration Engine
          </h2>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Calibrate baseline public survivor ownership data against sharp concentration multipliers, contest sizes, and variance factors to identify highest-leverage picks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="reload-calibration-btn"
            onClick={loadData}
            disabled={loading || calculating}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-xl transition duration-150 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          
          <button
            id="run-calibration-btn"
            onClick={handleRunCalibrationEngine}
            disabled={calculating || loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-sm transition duration-150 disabled:opacity-50 cursor-pointer"
          >
            <Zap className={`w-4 h-4 ${calculating ? "animate-bounce text-indigo-200" : ""}`} />
            {calculating ? "Calibrating..." : "Execute Calibration"}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{error}</div>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{successMsg}</div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            id="calibration-search-input"
            type="text"
            placeholder="Search by team..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap">Contest:</span>
          <select
            id="calibration-contest-filter"
            value={selectedContestId}
            onChange={(e) => setSelectedContestId(e.target.value)}
            className="w-full sm:w-56 py-2 px-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150"
          >
            <option value="all">All Contests</option>
            <option value="circa-2026">Circa Survivor 2026</option>
            <option value="public-mega">Public Mega Contest</option>
            <option value="private-highroller">Private High-Roller Pool</option>
            <option value="group-office">Office Group Pool</option>
            <option value="marketplace-champ">Marketplace Championship</option>
          </select>
        </div>

        <div className="text-xs text-gray-400 sm:ml-auto">
          Showing <strong>{filteredCalibrations.length}</strong> calibrations
        </div>
      </div>

      {/* Main Grid: Data Visualization and Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Table View (Takes 2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Database className="w-4 h-4 text-gray-500" />
              Ownership Calibration Snapshots
            </span>
            <span className="text-xs text-gray-400 font-mono">Week 1 (Calculated)</span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
              <p className="text-sm text-gray-500">Loading ownership calibrations...</p>
            </div>
          ) : filteredCalibrations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <Layers className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-900 font-medium text-base">No calibrations found</p>
              <p className="text-sm text-gray-500 max-w-sm mt-1">
                There are no calibrations recorded for this week. Click the &quot;Execute Calibration&quot; button to run the engine.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/25 text-xs font-semibold uppercase text-gray-400 tracking-wider">
                    <th className="px-6 py-4">Team</th>
                    <th className="px-6 py-4">Contest</th>
                    <th className="px-6 py-4 text-center">Baseline</th>
                    <th className="px-6 py-4 text-center">Calibrated</th>
                    <th className="px-6 py-4 text-center">Leverage Δ</th>
                    <th className="px-6 py-4 text-center">Calibration Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCalibrations.map((c) => {
                    const diff = c.calibrated_ownership - c.baseline_ownership;
                    const diffIsPositive = diff >= 0;

                    return (
                      <React.Fragment key={c.id}>
                        <tr className="hover:bg-gray-50/40 transition duration-100">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-800">{getTeamAbbrev(c.team_id)}</span>
                              <span className="text-xs text-gray-400 hidden sm:inline">{getTeamName(c.team_id)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600 font-medium">
                              {getContestLabel(c.contest_id)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center whitespace-nowrap text-sm font-mono text-gray-500">
                            {c.baseline_ownership.toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <span className="text-base font-bold font-mono text-indigo-700 bg-indigo-50/60 px-2.5 py-1 rounded-lg border border-indigo-100">
                              {c.calibrated_ownership.toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 text-xs font-bold font-mono px-2 py-0.5 rounded-full ${
                              diffIsPositive 
                                ? "text-emerald-700 bg-emerald-50" 
                                : "text-rose-700 bg-rose-50"
                            }`}>
                              {diffIsPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                              {diffIsPositive ? "+" : ""}{diff.toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center border px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${getCalibrationScoreColorClass(c.calibration_score)}`}>
                              {c.calibration_score.toFixed(0)}
                            </span>
                          </td>
                        </tr>
                        
                        {/* Secondary Audit Row */}
                        <tr className="bg-gray-50/15">
                          <td colSpan={6} className="px-6 py-2.5 border-b border-gray-100 text-xs text-gray-500">
                            <div className="flex items-start gap-2 max-w-4xl">
                              <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-semibold text-gray-600 uppercase tracking-wide mr-1">Game Theory Analysis:</span>
                                {c.explanation}
                              </div>
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Engine Metadata & Multipliers (Takes 1 Col) */}
        <div className="space-y-6">
          
          {/* Quick Explanation */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800">
            <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-300" />
              Engine Strategy Guide
            </h3>
            <p className="text-xs text-indigo-200 leading-relaxed mb-4">
              Our calibration models integrate sharp behavior heuristics with mathematical scaling parameters based on pool size to generate realistic, optimized ownership figures.
            </p>

            <div className="space-y-3 border-t border-indigo-800/40 pt-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-indigo-300">Default Sharp Multiplier</span>
                <span className="font-mono bg-indigo-950 text-indigo-200 px-2 py-0.5 rounded border border-indigo-800/60">0.80x - 1.45x</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-indigo-300">Contest Size Factor</span>
                <span className="font-mono bg-indigo-950 text-indigo-200 px-2 py-0.5 rounded border border-indigo-800/60">0.70x - 1.30x</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-indigo-300">Calculation Engine Target</span>
                <span className="font-mono bg-indigo-950 text-indigo-200 px-2 py-0.5 rounded border border-indigo-800/60">Leverage Optima</span>
              </div>
            </div>
          </div>

          {/* Key Parameters */}
          <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart4 className="w-4 h-4 text-gray-500" />
              Contest Parameter Weights
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-gray-600">Circa Survivor 2026</span>
                  <span className="text-gray-500 font-semibold">1.25x Sharp / 1.30x Size</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: "90%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-gray-600">Public Mega Contest</span>
                  <span className="text-gray-500 font-semibold">0.95x Sharp / 1.20x Size</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: "75%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-gray-600">Private High-Roller Pool</span>
                  <span className="text-gray-500 font-semibold">1.15x Sharp / 0.85x Size</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-600 h-full rounded-full" style={{ width: "65%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-gray-600">Office Group Pool</span>
                  <span className="text-gray-500 font-semibold">0.80x Sharp / 0.70x Size</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: "45%" }}></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
