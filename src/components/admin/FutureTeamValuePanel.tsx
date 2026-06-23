import React, { useState, useEffect } from "react";
import { 
  Zap, 
  Cpu, 
  Filter, 
  Sliders, 
  RefreshCw, 
  HelpCircle, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  Info,
  Calendar,
  Layers,
  Award
} from "lucide-react";
import { StrategyType } from "../../types";

interface FutureTeamValueRecord {
  id?: string;
  season: string;
  week: number;
  team_id: string;
  future_value_score: number;
  original_score?: number;
  future_value_rank: number;
  future_weeks_considered: number;
  calculation_version: string;
  explanation?: string;
  created_at?: string;
}

const TEAM_NAMES: Record<string, string> = {
  ari: "Arizona Cardinals", atl: "Atlanta Falcons", bal: "Baltimore Ravens",
  buf: "Buffalo Bills", car: "Carolina Panthers", chi: "Chicago Bears",
  cin: "Cincinnati Bengals", cle: "Cleveland Browns", dal: "Dallas Cowboys",
  den: "Denver Broncos", det: "Detroit Lions", gb: "Green Bay Packers",
  hou: "Houston Texans", ind: "Indianapolis Colts", jax: "Jacksonville Jaguars",
  kc: "Kansas City Chiefs", lv: "Las Vegas Raiders", lac: "Los Angeles Chargers",
  lar: "Los Angeles Rams", mia: "Miami Dolphins", min: "Minnesota Vikings",
  ne: "New England Patriots", no: "New Orleans Saints", nyg: "New York Giants",
  nyj: "New York Jets", phi: "Philadelphia Eagles", pit: "Pittsburgh Steelers",
  sf: "San Francisco 49ers", sea: "Seattle Seahawks", tb: "Tampa Bay Buccaneers",
  ten: "Tennessee Titans", was: "Washington Commanders"
};

const STRATEGY_WEIGHTS: Record<StrategyType, number> = {
  [StrategyType.CHAMPIONSHIP_EV]: 1.0,
  [StrategyType.PORTFOLIO_EV]: 0.7,
  [StrategyType.MARKETPLACE_SURVIVAL]: 0.4,
  [StrategyType.GROUP_SURVIVAL]: 0.3
};

const STRATEGY_LABELS: Record<StrategyType, string> = {
  [StrategyType.CHAMPIONSHIP_EV]: "Championship EV (100%)",
  [StrategyType.PORTFOLIO_EV]: "Portfolio EV (70%)",
  [StrategyType.MARKETPLACE_SURVIVAL]: "Marketplace Survival (40%)",
  [StrategyType.GROUP_SURVIVAL]: "Group Survival (30%)"
};

export const FutureTeamValuePanel: React.FC = () => {
  const [season, setSeason] = useState<string>("2026");
  const [week, setWeek] = useState<number>(1);
  const [strategy, setStrategy] = useState<StrategyType>(StrategyType.CHAMPIONSHIP_EV);
  
  const [rankings, setRankings] = useState<FutureTeamValueRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchRankings = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = `/api/future-value/rankings?season=${season}&week=${week}&strategy=${strategy}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load Future Team Value rankings");
      const data = await res.json();
      setRankings(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, [season, week, strategy]);

  const handleCalculate = async () => {
    try {
      setCalculating(true);
      setError(null);
      setSuccess(null);
      const res = await fetch("/api/future-value/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ season, week })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to trigger calculation run");
      }
      
      setSuccess(`Successfully calculated and locked Future Team Values for S${season} W${week}!`);
      await fetchRankings();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div id="future-team-value-panel" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 font-sans">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-600 animate-pulse" />
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Future Team Value Engine (v0.31)
            </h3>
          </div>
          <p className="text-xs text-slate-500 max-w-xl">
            Estimates the preservation value of keeping teams for future legs instead of selecting them today. Reacts dynamically to strategy profile weights.
          </p>
        </div>
        
        {/* Action button */}
        <button
          onClick={handleCalculate}
          disabled={calculating}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-100 shrink-0"
        >
          {calculating ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Zap className="w-3.5 h-3.5" />
          )}
          {calculating ? "Calculating Matrix..." : "Recalculate Value Matrix"}
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 px-4 py-3 rounded-xl text-xs flex gap-2 items-center animate-fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 px-4 py-3 rounded-xl text-xs flex gap-2 items-center animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Configuration Sliders / Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-slate-50/50 border border-slate-100 rounded-xl p-4">
        {/* Season & Week */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            Contest Period
          </label>
          <div className="flex gap-2">
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg text-xs py-1.5 px-2.5 font-medium text-slate-700 focus:outline-indigo-500 w-1/2 cursor-pointer"
            >
              <option value="2026">2026 Season</option>
              <option value="2025">2025 Season</option>
            </select>
            <select
              value={week}
              onChange={(e) => setWeek(Number(e.target.value))}
              className="bg-white border border-slate-200 rounded-lg text-xs py-1.5 px-2.5 font-medium text-slate-700 focus:outline-indigo-500 w-1/2 cursor-pointer"
            >
              {Array.from({ length: 18 }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w}>
                  Week {w}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Strategy Profile Selection */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
            <Sliders className="w-3 h-3 text-slate-400" />
            Strategy Adjustment Profile
          </label>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as StrategyType)}
            className="bg-white border border-slate-200 rounded-lg text-xs py-1.5 px-2.5 font-medium text-slate-700 focus:outline-indigo-500 w-full cursor-pointer"
          >
            {Object.values(StrategyType).map((type) => (
              <option key={type} value={type}>
                {STRATEGY_LABELS[type]}
              </option>
            ))}
          </select>
        </div>

        {/* Configuration weights visualization */}
        <div className="space-y-1.5 bg-slate-100/60 rounded-lg p-2.5 text-[11px] leading-tight text-slate-600 border border-slate-200 flex flex-col justify-center">
          <div className="flex items-center gap-1 text-slate-700 font-bold mb-1">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>Profile-Specific Weighting</span>
          </div>
          <p>
            The baseline Preservation value of keeping each team is calculated and then multiplied by <span className="font-bold text-indigo-600">{STRATEGY_WEIGHTS[strategy] * 100}%</span> for the selected strategy.
          </p>
        </div>
      </div>

      {/* Main Table Matrix */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-2">
            <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
            <span className="text-xs text-slate-500">Evaluating Future Team Value metrics...</span>
          </div>
        ) : rankings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-2">
            <HelpCircle className="w-8 h-8 text-slate-300" />
            <span className="text-xs text-slate-500">No value scores calculated yet for this week.</span>
            <button
              onClick={handleCalculate}
              className="text-xs text-indigo-600 font-bold hover:underline"
            >
              Trigger calculations now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="py-3 px-4 w-12">Rank</th>
                  <th className="py-3 px-4 w-40">Team</th>
                  <th className="py-3 px-4 w-28 text-center">Engine Score</th>
                  <th className="py-3 px-4 w-28 text-center">Future Weeks</th>
                  <th className="py-3 px-4">Explainability Rationale (Reasoning)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {rankings.map((r, index) => {
                  const teamFull = TEAM_NAMES[r.team_id] || r.team_id.toUpperCase();
                  const isTopAsset = r.future_value_rank <= 3;
                  const isBottomAsset = r.future_value_score < 40;

                  return (
                    <tr 
                      key={r.team_id} 
                      className={`hover:bg-slate-50/50 transition-colors ${
                        isTopAsset ? "bg-indigo-50/10" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 font-black text-slate-900">
                        <div className="flex items-center gap-1.5">
                          {isTopAsset && (
                            <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          )}
                          <span>#{r.future_value_rank}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-950">
                        <div className="flex flex-col">
                          <span className="font-mono text-[10px] text-indigo-600 uppercase">
                            {r.team_id}
                          </span>
                          <span>{teamFull}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <span className={`font-black text-sm px-2.5 py-0.5 rounded-lg ${
                            isTopAsset 
                              ? "bg-indigo-50 text-indigo-700" 
                              : isBottomAsset
                                ? "bg-slate-100 text-slate-600"
                                : "bg-emerald-50 text-emerald-700"
                          }`}>
                            {r.future_value_score.toFixed(1)}
                          </span>
                          {r.original_score !== undefined && r.original_score !== r.future_value_score && (
                            <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                              Base: {r.original_score.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono bg-slate-100 text-slate-700 font-bold py-0.5 px-2 rounded">
                          {r.future_weeks_considered}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 leading-relaxed max-w-md">
                        {r.explanation || "No explanation compiled."}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Versioning & Footer info */}
      {!loading && rankings.length > 0 && (
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-50">
          <span>Engine Instance Version: {rankings[0].calculation_version}</span>
          <div className="flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-400" />
            <span>Updates dynamically when scheduling workflows execute.</span>
          </div>
        </div>
      )}
    </div>
  );
};
