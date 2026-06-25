import React, { useState, useEffect } from "react";
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  Zap,
  TrendingUp,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Info,
  Sliders,
  Scale,
  Award
} from "lucide-react";
import { apiService } from "../services/apiService";
import { MarketCalibration } from "../types";

export interface MarketCalibrationPanelProps {
  teams: { id: string; name: string; abbreviation: string }[];
}

export const MarketCalibrationPanel: React.FC<MarketCalibrationPanelProps> = ({
  teams = []
}) => {
  const [calibrations, setCalibrations] = useState<MarketCalibration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [weekFilter, setWeekFilter] = useState<string>("all");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.fetchMarketCalibrationHistory();
      setCalibrations(data);
    } catch (err: any) {
      setError("Failed to fetch Market Calibration data: " + err.message);
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
      // Trigger V042 calculation for Season 2026, Week 1, Version v1.0.0
      await apiService.generateMarketCalibration("2026", 1, "v1.0.0");
      setSuccessMsg("V0.42 Market Calibration & Closing Line Value (CLV) Engine successfully executed and stored.");
      await loadData();
    } catch (err: any) {
      setError("Failed to run Market Calibration Engine: " + err.message);
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

  // Helper to calculate quality score dynamically for visualization
  const getQualityScore = (item: MarketCalibration) => {
    // Quality score from 0-100: starts at 70, increases with positive CLV, decreases with error
    const score = Math.max(0, Math.min(100, Math.round(75 + (item.spread_clv * 15) - (item.prediction_error * 2))));
    return score;
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 80) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (score >= 60) return "text-amber-700 bg-amber-50 border-amber-200";
    return "text-rose-700 bg-rose-50 border-rose-200";
  };

  // Filter & Search Logic
  const filteredCalibrations = calibrations.filter(c => {
    const matchesWeek = weekFilter === "all" || c.week.toString() === weekFilter;
    const teamName = getTeamName(c.team_id).toLowerCase();
    const teamAbbrev = getTeamAbbrev(c.team_id).toLowerCase();
    const matchesSearch = teamName.includes(searchTerm.toLowerCase()) || teamAbbrev.includes(searchTerm.toLowerCase());
    return matchesWeek && matchesSearch;
  });

  // Calculate Rolling Stats
  const avgSpreadCLV = filteredCalibrations.length > 0 
    ? filteredCalibrations.reduce((sum, item) => sum + item.spread_clv, 0) / filteredCalibrations.length 
    : 0;

  const avgMarketEdge = filteredCalibrations.length > 0
    ? filteredCalibrations.reduce((sum, item) => sum + item.market_edge, 0) / filteredCalibrations.length
    : 0;

  const avgPredictionError = filteredCalibrations.length > 0
    ? filteredCalibrations.reduce((sum, item) => sum + item.prediction_error, 0) / filteredCalibrations.length
    : 0;

  const avgQualityScore = filteredCalibrations.length > 0
    ? filteredCalibrations.reduce((sum, item) => sum + getQualityScore(item), 0) / filteredCalibrations.length
    : 0;

  // List of distinct weeks for filter
  const distinctWeeks = Array.from(new Set(calibrations.map(c => c.week.toString()))).sort((a,b) => Number(a) - Number(b));

  return (
    <div id="market-calibration-panel" className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white border border-gray-100 p-6 rounded-2xl shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-600" />
            V0.42 Market Calibration & Closing Line Value Engine
          </h2>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Evaluate predictive performance, measure how consistently predictions beat closing lines (Spread & Total CLV), and calibrate confidence weightings to isolate market edges.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="reload-mkt-calibration-btn"
            onClick={loadData}
            disabled={loading || calculating}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-xl transition duration-150 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          
          <button
            id="run-mkt-calibration-btn"
            onClick={handleRunCalibrationEngine}
            disabled={calculating || loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-sm transition duration-150 disabled:opacity-50 cursor-pointer"
          >
            <Zap className={`w-4 h-4 ${calculating ? "animate-bounce text-indigo-200" : ""}`} />
            {calculating ? "Processing..." : "Calibrate Closing Value"}
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

      {/* Rolling Stats Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Quality Score */}
        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Calibrated Quality Score</span>
            <span className="text-2xl font-bold text-gray-900 mt-1 block">{avgQualityScore > 0 ? avgQualityScore.toFixed(1) : "0.0"}</span>
            <span className="text-xs text-indigo-600 mt-1 block font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Predictive model score
            </span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Avg Spread CLV */}
        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Average Spread CLV</span>
            <span className="text-2xl font-bold text-gray-900 mt-1 block">
              {avgSpreadCLV > 0 ? `+${avgSpreadCLV.toFixed(2)}` : avgSpreadCLV.toFixed(2)}
            </span>
            <span className="text-xs text-emerald-600 mt-1 block font-medium flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> Beating the closing line
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        {/* Avg Market Edge */}
        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Average Market Edge</span>
            <span className="text-2xl font-bold text-gray-900 mt-1 block">{avgMarketEdge.toFixed(2)} pts</span>
            <span className="text-xs text-amber-600 mt-1 block font-medium">Model vs Market deviation</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Sliders className="w-6 h-6" />
          </div>
        </div>

        {/* Avg Prediction Error */}
        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Prediction Error (MAE)</span>
            <span className="text-2xl font-bold text-gray-900 mt-1 block">{avgPredictionError.toFixed(2)} pts</span>
            <span className="text-xs text-gray-500 mt-1 block">Absolute forecast error</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters Area */}
      <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            id="mkt-search-input"
            type="text"
            placeholder="Search teams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
          />
        </div>

        <div className="flex gap-2">
          <select
            id="mkt-week-filter"
            value={weekFilter}
            onChange={(e) => setWeekFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
          >
            <option value="all">All Weeks</option>
            {distinctWeeks.map(w => (
              <option key={w} value={w}>Week {w}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Calibrations Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-sm font-medium">Analyzing market calibration history...</p>
          </div>
        ) : filteredCalibrations.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Scale className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-gray-700">No Market Calibration snapshots recorded yet</p>
            <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
              Execute the calibration engine using the button in the top right to start learning from line movements and evaluating closing outcomes.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-4 px-6">Matchup</th>
                  <th className="py-4 px-4 text-center">Opening Line</th>
                  <th className="py-4 px-4 text-center">Closing Line</th>
                  <th className="py-4 px-4 text-center">Model Line</th>
                  <th className="py-4 px-4 text-center">Spread CLV</th>
                  <th className="py-4 px-4 text-center">Total CLV</th>
                  <th className="py-4 px-4 text-center">Market Edge</th>
                  <th className="py-4 px-4 text-center">Prediction Error</th>
                  <th className="py-4 px-4 text-center">Confidence Weight</th>
                  <th className="py-4 px-6 text-center">Quality Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredCalibrations.map((item) => {
                  const qScore = getQualityScore(item);
                  const qColor = getScoreColorClass(qScore);

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition">
                      <td className="py-4 px-6">
                        <div>
                          <span className="font-semibold text-gray-900 block">{getTeamName(item.team_id)}</span>
                          <span className="text-xs text-gray-400 font-medium">Season {item.season} • Week {item.week}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center font-mono text-xs text-gray-700">
                        {item.opening_spread > 0 ? `+${item.opening_spread}` : item.opening_spread}
                      </td>

                      <td className="py-4 px-4 text-center font-mono text-xs text-gray-700">
                        {item.closing_spread > 0 ? `+${item.closing_spread}` : item.closing_spread}
                      </td>

                      <td className="py-4 px-4 text-center font-mono text-xs font-medium text-indigo-600 bg-indigo-50/35 rounded-lg py-1 px-1.5 inline-block mx-auto">
                        {item.model_spread > 0 ? `+${item.model_spread}` : item.model_spread}
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center gap-0.5 font-mono text-xs font-semibold px-2 py-1 rounded-full ${
                          item.spread_clv > 0 ? "text-emerald-700 bg-emerald-50" : item.spread_clv < 0 ? "text-rose-700 bg-rose-50" : "text-gray-500 bg-gray-100"
                        }`}>
                          {item.spread_clv > 0 ? "+" : ""}{item.spread_clv}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center gap-0.5 font-mono text-xs font-semibold px-2 py-1 rounded-full ${
                          item.total_clv > 0 ? "text-emerald-700 bg-emerald-50" : item.total_clv < 0 ? "text-rose-700 bg-rose-50" : "text-gray-500 bg-gray-100"
                        }`}>
                          {item.total_clv > 0 ? "+" : ""}{item.total_clv}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center font-mono text-xs text-gray-700 font-medium">
                        {item.market_edge.toFixed(2)}
                      </td>

                      <td className="py-4 px-4 text-center font-mono text-xs text-rose-600 bg-rose-50/15">
                        {item.prediction_error.toFixed(2)}
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className="font-semibold text-gray-700 font-mono text-xs">
                          {item.calibration_weight}x
                        </span>
                      </td>

                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center justify-center font-mono text-xs font-bold px-2.5 py-1 rounded-full border ${qColor}`}>
                          {qScore}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Card explaining CLV */}
      <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex gap-4 items-start">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
          <Info className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Understanding Closing Line Value (CLV) & Market Edge</h3>
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
            The core engine of V0.42 tracks the differences between our model spreads and market-offered lines. 
            <strong> Spread CLV</strong> measures our margin over closing market lines. Consistently beating the closing line is the absolute gold standard of sports predictive analytics, proving long-term profitability even before outcomes are finalized. 
            <strong> Market Edge</strong> isolates how drastically our model opposes the public consensus, pointing to significant value discrepancies.
          </p>
        </div>
      </div>
    </div>
  );
};
