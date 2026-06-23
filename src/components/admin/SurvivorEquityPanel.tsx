import React, { useState, useEffect } from "react";
import { 
  Zap, 
  Cpu, 
  Sliders, 
  RefreshCw, 
  HelpCircle, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Calendar,
  Layers,
  Award,
  Filter,
  BarChart2
} from "lucide-react";
import { StrategyType } from "../../types";

interface SurvivorEquityRecord {
  id?: number | string;
  season: string;
  week: number;
  entry_id: string;
  team_id: string;
  survival_probability: number;
  future_team_value: number;
  equity_score: number;
  equity_rank: number;
  strategy_profile: string;
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

const STRATEGY_WEIGHTS: Record<StrategyType, { survival: number; futureValue: number; utility: number }> = {
  [StrategyType.CHAMPIONSHIP_EV]: { survival: 0.30, futureValue: 0.50, utility: 0.20 },
  [StrategyType.PORTFOLIO_EV]: { survival: 0.40, futureValue: 0.40, utility: 0.20 },
  [StrategyType.MARKETPLACE_SURVIVAL]: { survival: 0.60, futureValue: 0.20, utility: 0.20 },
  [StrategyType.GROUP_SURVIVAL]: { survival: 0.70, futureValue: 0.15, utility: 0.15 }
};

const STRATEGY_LABELS: Record<StrategyType, string> = {
  [StrategyType.CHAMPIONSHIP_EV]: "Championship EV Optimization",
  [StrategyType.PORTFOLIO_EV]: "Portfolio EV Diversification",
  [StrategyType.MARKETPLACE_SURVIVAL]: "Marketplace Survival Safeguard",
  [StrategyType.GROUP_SURVIVAL]: "Group Consensus Survival"
};

export const SurvivorEquityPanel: React.FC = () => {
  const [season, setSeason] = useState<string>("2026");
  const [week, setWeek] = useState<number>(1);
  const [strategy, setStrategy] = useState<StrategyType>(StrategyType.CHAMPIONSHIP_EV);
  
  const [rankings, setRankings] = useState<SurvivorEquityRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Weights adjusters state (for interactive parameters visual display)
  const [weights, setWeights] = useState(STRATEGY_WEIGHTS[strategy]);
  
  // Selected team details state (for explainability inspector)
  const [selectedTeam, setSelectedTeam] = useState<SurvivorEquityRecord | null>(null);

  const fetchRankings = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = `/api/survivor-equity/rankings?season=${season}&week=${week}&strategy=${strategy}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load Survivor Equity rankings");
      const data = await res.json();
      setRankings(data);
      if (data.length > 0) {
        setSelectedTeam(data[0]);
      } else {
        setSelectedTeam(null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setWeights(STRATEGY_WEIGHTS[strategy]);
  }, [strategy]);

  useEffect(() => {
    fetchRankings();
  }, [season, week, strategy]);

  const handleCalculate = async () => {
    try {
      setCalculating(true);
      setError(null);
      setSuccess(null);
      const res = await fetch("/api/survivor-equity/calculate", {
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
      
      setSuccess(`Successfully ran Survivor Equity calculations for S${season} W${week}! Snapshots written.`);
      await fetchRankings();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div id="survivor-equity-panel" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 font-sans">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-600 animate-pulse" />
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Survivor Equity Engine (v0.32)
            </h3>
          </div>
          <p className="text-xs text-slate-500 max-w-xl">
            Calculates contest equity gain of surviving each week relative to the remaining contest state. Automatically coordinates with Strategy Profiles and Future Team Values.
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
            <Cpu className="w-3.5 h-3.5" />
          )}
          {calculating ? "Processing Snapshots..." : "Execute Recalculation"}
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

      {/* Configuration Weights / Strategy Presets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-slate-50/50 border border-slate-100 rounded-xl p-4">
        {/* Contest selector */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            Active Segment
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

        {/* Strategy Profile Preset */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
            <Sliders className="w-3 h-3 text-slate-400" />
            Contest Strategy Preset
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

        {/* Interactive Parameter visualizers */}
        <div className="space-y-2 bg-slate-100/60 rounded-lg p-3 text-[11px] text-slate-600 border border-slate-200 flex flex-col justify-center">
          <div className="flex items-center gap-1 text-slate-700 font-bold">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>Interactive Formula Weights</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center mt-1">
            <div className="bg-white py-1 px-1.5 rounded border border-slate-150">
              <span className="block text-[9px] font-black uppercase text-slate-400">Survival</span>
              <span className="font-mono font-black text-slate-800 text-xs">{(weights.survival * 100).toFixed(0)}%</span>
            </div>
            <div className="bg-white py-1 px-1.5 rounded border border-slate-150">
              <span className="block text-[9px] font-black uppercase text-slate-400">Future Val</span>
              <span className="font-mono font-black text-slate-800 text-xs">{(weights.futureValue * 100).toFixed(0)}%</span>
            </div>
            <div className="bg-white py-1 px-1.5 rounded border border-slate-150">
              <span className="block text-[9px] font-black uppercase text-slate-400">Utility</span>
              <span className="font-mono font-black text-slate-800 text-xs">{(weights.utility * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Table list vs Inspector Drawer */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Table List Column (2 cols wide on desktop) */}
        <div className="xl:col-span-2 space-y-3">
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-2">
                <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
                <span className="text-xs text-slate-500">Evaluating Survivor Equity matrices...</span>
              </div>
            ) : rankings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-2">
                <HelpCircle className="w-8 h-8 text-slate-300" />
                <span className="text-xs text-slate-500">No Survivor Equity records computed.</span>
                <button
                  onClick={handleCalculate}
                  className="text-xs text-indigo-600 font-bold hover:underline"
                >
                  Initiate calculation now
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="py-3 px-4 w-12">Rank</th>
                      <th className="py-3 px-4">Team Name</th>
                      <th className="py-3 px-4 text-center w-20">Survival</th>
                      <th className="py-3 px-4 text-center w-20">Future Val</th>
                      <th className="py-3 px-4 text-center w-28">Equity Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {rankings.map((r) => {
                      const teamFull = TEAM_NAMES[r.team_id] || r.team_id.toUpperCase();
                      const isSelected = selectedTeam?.team_id === r.team_id;
                      const isTopAsset = r.equity_rank <= 3;

                      return (
                        <tr 
                          key={r.team_id} 
                          onClick={() => setSelectedTeam(r)}
                          className={`hover:bg-indigo-50/20 transition-colors cursor-pointer ${
                            isSelected ? "bg-indigo-50/50 border-l-2 border-indigo-600" : ""
                          } ${isTopAsset && !isSelected ? "bg-amber-50/10" : ""}`}
                        >
                          <td className="py-3.5 px-4 font-black text-slate-900">
                            <div className="flex items-center gap-1">
                              {isTopAsset && (
                                <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              )}
                              <span>#{r.equity_rank}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col">
                              <span className="font-mono text-[9px] text-indigo-600 uppercase font-black">
                                {r.team_id}
                              </span>
                              <span className="font-bold text-slate-900">{teamFull}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-600">
                            {r.survival_probability.toFixed(1)}%
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-600">
                            {r.future_team_value.toFixed(1)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`font-black text-xs px-2.5 py-1 rounded-lg inline-block ${
                              isTopAsset 
                                ? "bg-amber-100 text-amber-900" 
                                : "bg-indigo-50 text-indigo-700"
                            }`}>
                              {r.equity_score.toFixed(1)}
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
        </div>

        {/* Explainability / Reasoning Inspector Column (1 col wide) */}
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <BarChart2 className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                  Explainability Inspector
                </h4>
              </div>

              {selectedTeam ? (
                <div className="space-y-4">
                  <div>
                    <span className="font-mono text-[10px] text-indigo-600 font-bold uppercase block">
                      {selectedTeam.team_id}
                    </span>
                    <h5 className="text-sm font-black text-slate-900">
                      {TEAM_NAMES[selectedTeam.team_id] || selectedTeam.team_id.toUpperCase()}
                    </h5>
                  </div>

                  {/* Math Formula Rationale Card */}
                  <div className="bg-white border border-slate-150 rounded-xl p-4 space-y-2.5">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      Equity Score Calculation
                    </span>
                    
                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div className="flex justify-between items-center">
                        <span>Survival component:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {selectedTeam.survival_probability.toFixed(1)}% × {(weights.survival * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Future Team Value:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {selectedTeam.future_team_value.toFixed(1)} × {(weights.futureValue * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Season Utility buffer:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {(100 * (18 - week) / 18).toFixed(1)}% × {(weights.utility * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="border-t border-slate-100 pt-2 flex justify-between items-center font-bold text-slate-900">
                        <span>Resulting score:</span>
                        <span className="font-mono text-sm text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {selectedTeam.equity_score.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Verbal Reasoning Narrative */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      Explainable Narrative Detail
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed bg-white border border-slate-150 rounded-xl p-3.5">
                      {selectedTeam.explanation || "No explanation compiled."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-1 text-slate-400">
                  <HelpCircle className="w-6 h-6 text-slate-300" />
                  <span className="text-xs">Select a team from the rankings list to inspect mathematical explainability.</span>
                </div>
              )}
            </div>

            {/* Footer version indicator */}
            {selectedTeam && (
              <div className="text-[9px] text-slate-400 font-mono flex items-center gap-1 pt-3 border-t border-slate-200">
                <Info className="w-3 h-3 text-slate-300" />
                <span>Snap version: {selectedTeam.calculation_version}</span>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
