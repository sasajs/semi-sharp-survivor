import React, { useState, useEffect } from "react";
import { 
  Award,
  Cpu,
  RefreshCw,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Info,
  Calendar,
  Layers,
  Sparkles,
  Search,
  BookOpen,
  Filter,
  User,
  Clock,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Activity,
  Compass
} from "lucide-react";
import { SurvivorRecommendation, RecommendationTier } from "../../types";

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

const STRATEGY_LABELS: Record<string, string> = {
  CHAMPIONSHIP_EV: "Championship EV (Game Theory High Weight)",
  PORTFOLIO_EV: "Portfolio EV (Diversified Risk-Reward)",
  MARKETPLACE_SURVIVAL: "Marketplace Survival (Progression Priority)",
  GROUP_SURVIVAL: "Group Survival (Safety Maximizer)"
};

export const SurvivorRecommendationsPanel: React.FC = () => {
  const [season, setSeason] = useState<string>("2026");
  const [week, setWeek] = useState<number>(1);
  const [recommendations, setRecommendations] = useState<SurvivorRecommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<string>("all");
  const [selectedTier, setSelectedTier] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedEntries, setExpandedEntries] = useState<Record<string, boolean>>({});

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/recommendations/history");
      if (!res.ok) throw new Error("Failed to load survivor recommendations");
      const data: SurvivorRecommendation[] = await res.json();
      
      // Filter for active season and week
      const filtered = data.filter(
        r => r.season === season && r.week === week
      );
      setRecommendations(filtered);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [season, week]);

  const handleCalculate = async () => {
    try {
      setCalculating(true);
      setError(null);
      setSuccess(null);
      const res = await fetch("/api/recommendations/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ season, week })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to calculate recommendations");
      }
      
      setSuccess(`Generated and snapshots stored for Season ${season}, Week ${week}!`);
      await fetchRecommendations();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCalculating(false);
    }
  };

  const toggleExpandEntry = (entryId: string) => {
    setExpandedEntries(prev => ({
      ...prev,
      [entryId]: !prev[entryId]
    }));
  };

  // Extract unique entries for the filter list
  const uniqueEntries = Array.from(new Set(recommendations.map(r => r.entry_id)));

  // Filter recommendations based on selection and query
  const filteredRecs = recommendations.filter(r => {
    const matchesEntry = selectedEntry === "all" || r.entry_id === selectedEntry;
    const matchesTier = selectedTier === "all" || r.recommendation_tier === selectedTier;
    const matchesSearch = searchQuery === "" || 
      r.entry_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.recommended_team_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (TEAM_NAMES[r.recommended_team_id.toLowerCase()] || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesEntry && matchesTier && matchesSearch;
  });

  // Group recommendations by Entry ID
  const recsByEntry: Record<string, SurvivorRecommendation[]> = {};
  filteredRecs.forEach(r => {
    if (!recsByEntry[r.entry_id]) {
      recsByEntry[r.entry_id] = [];
    }
    recsByEntry[r.entry_id].push(r);
  });

  // Sort within each entry by recommendation rank
  Object.keys(recsByEntry).forEach(entryId => {
    recsByEntry[entryId].sort((a, b) => a.recommendation_rank - b.recommendation_rank);
  });

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "STRONG_RECOMMENDATION":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "RECOMMENDATION":
        return "bg-indigo-50 text-indigo-700 border-indigo-100";
      case "VIABLE_OPTION":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "LONGSHOT":
        return "bg-rose-50 text-rose-700 border-rose-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div id="survivor-recommendations-panel" className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden font-sans">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100/55">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Survivor Recommendation Engine
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 border border-indigo-200/50 uppercase">v0.35</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate, explain, and audit ranked candidate recommendations based on strategy-weighted scoring parameters.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Season Selector */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="bg-transparent border-none outline-none pr-2 cursor-pointer"
            >
              <option value="2026">2026 Season</option>
              <option value="2025">2025 Season</option>
            </select>
          </div>

          {/* Week Selector */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={week}
              onChange={(e) => setWeek(parseInt(e.target.value, 10))}
              className="bg-transparent border-none outline-none pr-2 cursor-pointer"
            >
              {Array.from({ length: 18 }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w}>
                  Week {w}
                </option>
              ))}
            </select>
          </div>

          {/* Execute Button */}
          <button
            onClick={handleCalculate}
            disabled={calculating}
            className={`text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm shadow-indigo-100 disabled:opacity-50 cursor-pointer`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${calculating ? "animate-spin" : ""}`} />
            {calculating ? "Calculating..." : "Run Recommendations"}
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mx-6 mt-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 text-xs text-rose-800 leading-relaxed">
          <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="mx-6 mt-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3 text-xs text-emerald-800 leading-relaxed">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p>{success}</p>
        </div>
      )}

      {/* Filters Area */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/20 flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search entry, team ID, or team name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 bg-white placeholder-slate-400"
          />
        </div>

        {/* Entry ID Filter */}
        <div className="flex items-center gap-1.5 w-full md:w-auto">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
            <User className="w-3.5 h-3.5" /> Entry:
          </span>
          <select
            value={selectedEntry}
            onChange={(e) => setSelectedEntry(e.target.value)}
            className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer outline-none focus:border-indigo-500"
          >
            <option value="all">All Entries ({uniqueEntries.length})</option>
            {uniqueEntries.map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>

        {/* Tier Filter */}
        <div className="flex items-center gap-1.5 w-full md:w-auto">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Tier:
          </span>
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer outline-none focus:border-indigo-500"
          >
            <option value="all">All Tiers</option>
            <option value="STRONG_RECOMMENDATION">Strong Recommendation</option>
            <option value="RECOMMENDATION">Recommendation</option>
            <option value="VIABLE_OPTION">Viable Option</option>
            <option value="LONGSHOT">Longshot</option>
          </select>
        </div>
      </div>

      {/* Body / Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
            <p className="text-xs font-semibold">Retrieving recommendation matrix...</p>
          </div>
        ) : filteredRecs.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-2xl">
            <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">No Recommendations Snapped</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              No recommendations match the current query, or none have been computed for Season {season}, Week {week}.
            </p>
            <button
              onClick={handleCalculate}
              disabled={calculating}
              className="mt-4 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-4 py-2 rounded-xl transition inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate Recommendation Snapshot
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(recsByEntry).map(entryId => {
              const entryRecs = recsByEntry[entryId];
              const isExpanded = expandedEntries[entryId] !== false; // Default to expanded
              const topRec = entryRecs.find(r => r.recommendation_rank === 1);
              const alternatives = entryRecs.filter(r => r.recommendation_rank > 1);

              return (
                <div 
                  key={entryId} 
                  className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-slate-300/80 transition"
                >
                  {/* Entry Card Header */}
                  <div 
                    onClick={() => toggleExpandEntry(entryId)}
                    className="p-4 bg-slate-50/40 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3 cursor-pointer hover:bg-slate-50/70 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold text-xs uppercase">
                        {entryId.substring(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{entryId}</span>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-mono">
                            {entryRecs[0].strategy_profile}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                          <Compass className="w-3 h-3 shrink-0" />
                          {STRATEGY_LABELS[entryRecs[0].strategy_profile] || entryRecs[0].strategy_profile}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      {topRec && (
                        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-100 py-1 px-3 rounded-lg text-xs font-black">
                          🏆 Recommended: {topRec.recommended_team_id.toUpperCase()}
                        </div>
                      )}
                      <div className="text-slate-400 hover:text-slate-600 transition p-1">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Entry Card Expanded Body */}
                  {isExpanded && (
                    <div className="p-5 space-y-5 bg-white">
                      
                      {/* Top Pick Highlight Card */}
                      {topRec && (
                        <div className="border border-indigo-100 bg-gradient-to-br from-indigo-50/10 to-indigo-50/30 rounded-xl p-5 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/10 rounded-full blur-2xl pointer-events-none"></div>
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="space-y-1.5 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-black px-2 py-0.5 bg-indigo-600 text-white rounded font-mono uppercase tracking-wider">TOP PICK</span>
                                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${getTierColor(topRec.recommendation_tier)}`}>
                                  {topRec.recommendation_tier.replace("_", " ")}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(topRec.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <h4 className="text-xl font-black text-slate-900 flex items-baseline gap-2">
                                {TEAM_NAMES[topRec.recommended_team_id.toLowerCase()] || topRec.recommended_team_id.toUpperCase()}
                                <span className="text-sm font-semibold text-slate-400 uppercase">({topRec.recommended_team_id})</span>
                              </h4>
                              <p className="text-xs text-slate-600 leading-relaxed font-medium bg-white border border-slate-100 p-3 rounded-lg shadow-sm">
                                {topRec.recommendation_reason}
                              </p>
                            </div>

                            {/* Large Score Indicator */}
                            <div className="shrink-0 bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center w-full md:w-32 flex flex-row md:flex-col justify-between md:justify-center items-center">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Composite</span>
                                <div className="text-3xl font-black text-indigo-600 mt-0.5">{topRec.recommendation_score.toFixed(1)}</div>
                              </div>
                              <div className="border-t border-slate-100 w-full pt-2 mt-2 hidden md:block">
                                <span className="text-[10px] text-slate-500 font-bold bg-slate-50 px-2 py-0.5 rounded border">Rank 1 / {entryRecs.length}</span>
                              </div>
                            </div>
                          </div>

                          {/* Metric Breakdown Progress Bars */}
                          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 mt-5 pt-5 border-t border-slate-100/80">
                            <div>
                              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase font-mono mb-1">
                                <span>Candidate Score</span>
                                <span>{topRec.candidate_score.toFixed(1)}</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-slate-500 rounded-full" style={{ width: `${topRec.candidate_score}%` }}></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase font-mono mb-1">
                                <span>Survivor Equity</span>
                                <span>{topRec.survivor_equity_score.toFixed(1)}</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${topRec.survivor_equity_score}%` }}></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase font-mono mb-1">
                                <span>Future Value Impact</span>
                                <span>{topRec.future_team_value_score.toFixed(1)}</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-rose-400 rounded-full" style={{ width: `${topRec.future_team_value_score}%` }}></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase font-mono mb-1">
                                <span>Crowd Ownership</span>
                                <span>{topRec.projected_ownership_pct.toFixed(1)}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.min(100, topRec.projected_ownership_pct * 2)}%` }}></div>
                              </div>
                            </div>

                            <div className="col-span-2 lg:col-span-1">
                              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase font-mono mb-1">
                                <span>Contest Equity Adj</span>
                                <span className="text-indigo-600 font-extrabold">+{topRec.contest_equity_adjustment.toFixed(1)}</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, topRec.contest_equity_adjustment * 4)}%` }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Alternative Picks Section */}
                      {alternatives.length > 0 && (
                        <div className="space-y-3">
                          <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5" /> Alternative Ranked Picks
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {alternatives.slice(0, 4).map(alt => (
                              <div 
                                key={alt.id}
                                className="border border-slate-100 hover:border-slate-200 bg-slate-50/20 hover:bg-slate-50/40 rounded-xl p-4 space-y-3 transition flex flex-col justify-between"
                              >
                                <div className="space-y-1.5">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded mr-2 uppercase">Rank {alt.recommendation_rank}</span>
                                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getTierColor(alt.recommendation_tier)}`}>
                                        {alt.recommendation_tier.replace("_", " ")}
                                      </span>
                                    </div>
                                    <div className="text-xs font-black text-slate-700 bg-white px-2 py-0.5 border rounded">
                                      {alt.recommendation_score.toFixed(1)} pts
                                    </div>
                                  </div>
                                  <h6 className="text-sm font-bold text-slate-800">
                                    {TEAM_NAMES[alt.recommended_team_id.toLowerCase()] || alt.recommended_team_id.toUpperCase()}
                                    <span className="text-xs font-normal text-slate-400 ml-1">({alt.recommended_team_id.toUpperCase()})</span>
                                  </h6>
                                  <p className="text-[11px] text-slate-500 leading-relaxed italic">
                                    "{alt.recommendation_reason}"
                                  </p>
                                </div>

                                <div className="grid grid-cols-3 gap-1.5 pt-3 border-t border-slate-100/60 text-center font-mono">
                                  <div className="bg-white border p-1 rounded">
                                    <div className="text-[8px] font-bold text-slate-400 uppercase">Equity</div>
                                    <div className="text-[10px] font-bold text-slate-700">{alt.survivor_equity_score.toFixed(0)}</div>
                                  </div>
                                  <div className="bg-white border p-1 rounded">
                                    <div className="text-[8px] font-bold text-slate-400 uppercase">FTV</div>
                                    <div className="text-[10px] font-bold text-slate-700">{alt.future_team_value_score.toFixed(0)}</div>
                                  </div>
                                  <div className="bg-white border p-1 rounded">
                                    <div className="text-[8px] font-bold text-slate-400 uppercase">Own %</div>
                                    <div className="text-[10px] font-bold text-slate-700">{alt.projected_ownership_pct.toFixed(1)}%</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
