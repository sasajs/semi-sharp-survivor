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
  BookOpen
} from "lucide-react";
import { StrategyType, AuditableRecommendationCandidate } from "../../types";

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

export const RecommendationCandidatesPanel: React.FC = () => {
  const [season, setSeason] = useState<string>("2026");
  const [week, setWeek] = useState<number>(1);
  const [candidates, setCandidates] = useState<AuditableRecommendationCandidate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<AuditableRecommendationCandidate | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showIneligible, setShowIneligible] = useState<boolean>(true);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/recommendation-candidates/history");
      if (!res.ok) throw new Error("Failed to load recommendation candidates");
      const data: AuditableRecommendationCandidate[] = await res.json();
      
      // Filter for active season and week
      const filtered = data.filter(
        c => c.season === season && c.week === week
      );
      setCandidates(filtered);
      
      if (filtered.length > 0) {
        setSelectedCandidate(filtered[0]);
      } else {
        setSelectedCandidate(null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [season, week]);

  const handleCalculate = async () => {
    try {
      setCalculating(true);
      setError(null);
      setSuccess(null);
      const res = await fetch("/api/recommendation-candidates/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ season, week })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to calculate recommendation candidates");
      }
      
      setSuccess(`Generated recommendation candidates for Season ${season}, Week ${week}!`);
      await fetchCandidates();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCalculating(false);
    }
  };

  // Group candidates by entry
  const groupedCandidates: Record<string, AuditableRecommendationCandidate[]> = {};
  candidates.forEach(c => {
    if (!groupedCandidates[c.entry_id]) {
      groupedCandidates[c.entry_id] = [];
    }
    groupedCandidates[c.entry_id].push(c);
  });

  // Filter & sort entries candidates
  const getFilteredCandidates = (entryCandidates: AuditableRecommendationCandidate[]) => {
    let list = [...entryCandidates];
    
    if (!showIneligible) {
      list = list.filter(c => c.eligibility_status === "eligible");
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        c => c.team_id.toLowerCase().includes(q) || 
             (TEAM_NAMES[c.team_id.toLowerCase()] || "").toLowerCase().includes(q)
      );
    }

    // Sort: Rank ascending, ineligible at the bottom
    return list.sort((a, b) => {
      if (a.eligibility_status === "eligible" && b.eligibility_status !== "eligible") return -1;
      if (a.eligibility_status !== "eligible" && b.eligibility_status === "eligible") return 1;
      if (a.eligibility_status === "eligible") {
        return a.candidate_rank - b.candidate_rank;
      }
      return b.candidate_score - a.candidate_score;
    });
  };

  return (
    <div id="recommendation-candidates-panel" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Recommendation Candidate Engine (v0.33)
            </h3>
            <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200/50">
              AUDIT ONLY
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-xl">
            Filters teams, applies eligibility checks, and ranks them per active entry using strategy profile weights. 
            <strong className="text-slate-700 ml-1">Candidates only — not final recommendations.</strong>
          </p>
        </div>

        <button
          onClick={handleCalculate}
          disabled={calculating}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-100 shrink-0"
        >
          {calculating ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          {calculating ? "Calculating..." : "Run Candidate Calculations"}
        </button>
      </div>

      {/* Selectors and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Season Context
          </label>
          <select
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg text-xs px-2.5 py-1.5 font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="2026">NFL 2026 Season</option>
            <option value="2025">NFL 2025 Season</option>
            <option value="2024">NFL 2024 Season</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
            <Layers className="w-3 h-3" /> Contest Leg / Week
          </label>
          <select
            value={week}
            onChange={(e) => setWeek(parseInt(e.target.value, 10))}
            className="w-full bg-white border border-slate-200 rounded-lg text-xs px-2.5 py-1.5 font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {Array.from({ length: 18 }, (_, i) => i + 1).map((w) => (
              <option key={w} value={w}>
                NFL Week {w} Matchups
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
            <Search className="w-3 h-3" /> Search Team
          </label>
          <input
            type="text"
            placeholder="Type team (e.g. BUF)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg text-xs px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-300"
          />
        </div>

        <div className="flex items-center pt-5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showIneligible}
              onChange={(e) => setShowIneligible(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
            />
            <span className="text-xs font-semibold text-slate-600">Show Ineligible Options</span>
          </label>
        </div>
      </div>

      {/* Notices */}
      {error && (
        <div className="bg-rose-50 border border-rose-200/50 rounded-xl p-3 text-xs text-rose-700 font-semibold flex items-center gap-2">
          <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200/50 rounded-xl p-3 text-xs text-emerald-700 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          {success}
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
          <span className="text-xs text-slate-400 font-semibold">Parsing active entries and executing analytical filters...</span>
        </div>
      ) : Object.keys(groupedCandidates).length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-10 text-center space-y-2">
          <Info className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs font-semibold text-slate-500">No candidates found for S{season} W{week}.</p>
          <p className="text-[11px] text-slate-400">Click &quot;Run Candidate Calculations&quot; above to calculate candidates for this week.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Candidates List */}
          <div className="lg:col-span-2 space-y-6">
            {Object.keys(groupedCandidates).map(entryId => {
              const entryCands = groupedCandidates[entryId];
              const filteredCands = getFilteredCandidates(entryCands);
              
              if (filteredCands.length === 0) return null;

              const strategyType = entryCands[0]?.strategy_profile || "UNKNOWN";

              return (
                <div key={entryId} className="border border-slate-100 rounded-xl p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">
                        Entry ID: <span className="text-indigo-600">{entryId}</span>
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Contest Leg Week {week} candidates
                      </p>
                    </div>
                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-100">
                      Profile: {strategyType}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="py-2">Rank</th>
                          <th className="py-2">Team</th>
                          <th className="py-2 text-center">Score</th>
                          <th className="py-2">Status</th>
                          <th className="py-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredCands.slice(0, 8).map(c => {
                          const isSelected = selectedCandidate && selectedCandidate.entry_id === c.entry_id && selectedCandidate.team_id === c.team_id;
                          const isEligible = c.eligibility_status === "eligible";
                          
                          return (
                            <tr 
                              key={c.team_id}
                              onClick={() => setSelectedCandidate(c)}
                              className={`text-xs hover:bg-slate-50 cursor-pointer transition ${isSelected ? "bg-indigo-50/40" : ""}`}
                            >
                              <td className="py-2.5 font-bold text-slate-500">
                                {isEligible ? `#${c.candidate_rank}` : "—"}
                              </td>
                              <td className="py-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-800 uppercase bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                                    {c.team_id}
                                  </span>
                                  <span className="text-slate-500 font-medium hidden sm:inline text-[11px]">
                                    {TEAM_NAMES[c.team_id.toLowerCase()] || c.team_id}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2.5 text-center font-bold text-slate-900">
                                {isEligible ? c.candidate_score.toFixed(2) : "0.00"}
                              </td>
                              <td className="py-2.5">
                                {isEligible ? (
                                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 inline-flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Eligible
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 inline-flex items-center gap-1 max-w-[150px] truncate" title={c.eligibility_reason || "Ineligible"}>
                                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" /> {c.eligibility_reason || "Ineligible"}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 text-right pr-2 text-indigo-500 font-bold text-[10px] hover:underline">
                                Inspect
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sidebar Audit Inspector */}
          <div className="space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 sticky top-6">
              <div className="flex items-center gap-1.5 border-b border-slate-200 pb-3">
                <BookOpen className="w-4 h-4 text-slate-600" />
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Audit Inspector
                </h4>
              </div>

              {selectedCandidate ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase">
                        {TEAM_NAMES[selectedCandidate.team_id.toLowerCase()] || selectedCandidate.team_id.toUpperCase()}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">
                        {selectedCandidate.team_id.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Entry: <span className="font-semibold text-slate-700">{selectedCandidate.entry_id}</span>
                    </p>
                  </div>

                  <div className="space-y-2 bg-white border border-slate-100 rounded-lg p-3">
                    <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-1.5">
                      <span className="text-slate-400 font-medium">Candidate Score</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {selectedCandidate.eligibility_status === "eligible" ? selectedCandidate.candidate_score.toFixed(2) : "0.00"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-slate-400">Survivor Equity (70%)</span>
                      <span className="font-semibold text-slate-700">
                        {selectedCandidate.survivor_equity_score.toFixed(1)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Survival Prob (20%)</span>
                      <span className="font-semibold text-slate-700">
                        {selectedCandidate.survival_probability.toFixed(1)}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Strategy Fit (10%)</span>
                      <span className="font-semibold text-indigo-600">
                        {selectedCandidate.survivor_equity_score.toFixed(1)} {/* Default proxy fit or calculated fit */}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Future Team Value</span>
                      <span className="font-semibold text-rose-500">
                        {selectedCandidate.future_team_value_score.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 bg-white border border-slate-100 rounded-lg p-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                      Verbal Narrative Rationale
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {selectedCandidate.explanation}
                    </p>
                  </div>

                  <div className="bg-amber-50/60 border border-amber-200/50 rounded-lg p-3 text-[10px] text-amber-800 leading-normal font-semibold">
                    ⚠️ **AUDIT ONLY PARAMETER**: These are strategic viable candidates calculated at snapshot creation time. Final locking decision is isolated in Recommendation Policy models.
                  </div>

                  <div className="text-[9px] text-slate-400 font-mono flex flex-col gap-0.5 border-t border-slate-200 pt-3">
                    <span>Engine Version: {selectedCandidate.calculation_version}</span>
                    <span>Created: {selectedCandidate.created_at ? new Date(selectedCandidate.created_at).toLocaleString() : "N/A"}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 text-xs font-semibold">
                  Select a team row to inspect full mathematical and verbal explanation auditing values.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
