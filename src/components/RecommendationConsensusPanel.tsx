import React, { useState, useEffect } from "react";
import { 
  RefreshCw, 
  SlidersHorizontal, 
  Activity, 
  CheckCircle2, 
  AlertTriangle,
  HelpCircle,
  Database,
  BarChart4,
  Flame,
  Scale,
  Award,
  Users,
  TrendingUp,
  ShieldCheck,
  Zap,
  Info
} from "lucide-react";
import { apiService } from "../services/apiService";
import { RecommendationConsensus, ConsensusTier } from "../types";

export interface RecommendationConsensusPanelProps {
  entries: { id: string; name: string }[];
  teams: { id: string; name: string; abbreviation: string }[];
}

export const RecommendationConsensusPanel: React.FC<RecommendationConsensusPanelProps> = ({
  entries = [],
  teams = []
}) => {
  const [snapshots, setSnapshots] = useState<RecommendationConsensus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recalculating, setRecalculating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [selectedEntry, setSelectedEntry] = useState<string>("all");
  const [selectedConsensusTier, setSelectedConsensusTier] = useState<string>("all");
  const [activeTeamDetail, setActiveTeamDetail] = useState<RecommendationConsensus | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.fetchConsensusHistory();
      setSnapshots(data);
      if (data.length > 0 && !activeTeamDetail) {
        setActiveTeamDetail(data[0]);
      }
    } catch (err: any) {
      setError("Failed to fetch recommendation consensus snapshots: " + err.message);
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
      // Trigger recalculation for standard Season 2026, Week 1, Version v1.0.0
      await apiService.calculateConsensus("2026", 1, "v1.0.0");
      setSuccessMsg("Consensus calculated and persisted successfully.");
      await loadData();
    } catch (err: any) {
      setError("Failed to calculate consensus: " + err.message);
    } finally {
      setRecalculating(false);
    }
  };

  // Filtered Snapshots
  const filteredSnapshots = snapshots.filter(s => {
    if (selectedEntry !== "all" && s.entry_id !== selectedEntry) return false;
    if (selectedConsensusTier !== "all" && s.consensus_tier !== selectedConsensusTier) return false;
    return true;
  });

  // Stats Computations
  const totalCount = filteredSnapshots.length;
  const eliteCount = filteredSnapshots.filter(s => s.consensus_tier === ConsensusTier.ELITE_CONSENSUS).length;
  const strongCount = filteredSnapshots.filter(s => s.consensus_tier === ConsensusTier.STRONG_CONSENSUS).length;
  const moderateCount = filteredSnapshots.filter(s => s.consensus_tier === ConsensusTier.MODERATE_CONSENSUS).length;
  const weakCount = filteredSnapshots.filter(s => s.consensus_tier === ConsensusTier.WEAK_CONSENSUS).length;
  const noCount = filteredSnapshots.filter(s => s.consensus_tier === ConsensusTier.NO_CONSENSUS).length;

  const getConsensusTierBadge = (tier: ConsensusTier) => {
    switch (tier) {
      case ConsensusTier.ELITE_CONSENSUS:
        return "bg-amber-100 text-amber-900 border-amber-300 font-bold";
      case ConsensusTier.STRONG_CONSENSUS:
        return "bg-emerald-100 text-emerald-900 border-emerald-300 font-semibold";
      case ConsensusTier.MODERATE_CONSENSUS:
        return "bg-blue-100 text-blue-900 border-blue-300";
      case ConsensusTier.WEAK_CONSENSUS:
        return "bg-slate-100 text-slate-800 border-slate-300";
      case ConsensusTier.NO_CONSENSUS:
        return "bg-rose-100 text-rose-900 border-rose-300";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
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

  const formatTierLabel = (tier: string) => {
    return tier.replace(/_/g, " ");
  };

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in" id="consensus-header">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-150 text-indigo-800 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wide border border-indigo-200">
              Layer 2 Ensemble Consensus
            </span>
            <span className="text-slate-400 text-xs font-mono">v0.38-recommendation-consensus-engine</span>
          </div>
          <h2 className="font-black text-slate-900 text-xl tracking-tight mt-1">
            Recommendation Consensus Analysis
          </h2>
          <p className="text-slate-500 text-sm mt-0.5 max-w-2xl">
            Ensemble consensus engine evaluating agreement strength across six primary decision subsystems.
          </p>
        </div>
        
        <div className="flex items-center gap-2 self-stretch md:self-auto">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-xl transition duration-150"
            id="refresh-consensus-btn"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition duration-150 disabled:opacity-70"
            id="recalc-consensus-btn"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? "animate-spin" : ""}`} />
            {recalculating ? "Processing..." : "Calculate Consensus"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-start gap-3 animate-slide-in" id="consensus-error">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Calculation Sync Failure</h4>
            <p className="text-xs text-rose-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-start gap-3 animate-slide-in" id="consensus-success">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Consensus Generated</h4>
            <p className="text-xs text-emerald-700 mt-0.5">{successMsg}</p>
          </div>
        </div>
      )}

      {/* Ensemble Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4" id="consensus-summary-cards">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-slate-500 font-medium text-xs">Elite Consensus</span>
            <span className="p-1.5 bg-amber-50 rounded-lg text-amber-600"><Award className="w-4 h-4" /></span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-slate-900">{eliteCount}</span>
            <p className="text-[10px] text-slate-400 mt-0.5">6 of 6 systems agree</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-slate-500 font-medium text-xs">Strong Consensus</span>
            <span className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600"><ShieldCheck className="w-4 h-4" /></span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-slate-900">{strongCount}</span>
            <p className="text-[10px] text-slate-400 mt-0.5">5 of 6 systems agree</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-slate-500 font-medium text-xs">Moderate</span>
            <span className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600"><Zap className="w-4 h-4" /></span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-slate-900">{moderateCount}</span>
            <p className="text-[10px] text-slate-400 mt-0.5">4 of 6 systems agree</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-slate-500 font-medium text-xs">Weak Consensus</span>
            <span className="p-1.5 bg-slate-50 rounded-lg text-slate-500"><Info className="w-4 h-4" /></span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-slate-900">{weakCount}</span>
            <p className="text-[10px] text-slate-400 mt-0.5">3 of 6 systems agree</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col justify-between col-span-2 md:col-span-1">
          <div className="flex justify-between items-start">
            <span className="text-slate-500 font-medium text-xs">No Consensus</span>
            <span className="p-1.5 bg-rose-50 rounded-lg text-rose-600"><AlertTriangle className="w-4 h-4" /></span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-slate-900">{noCount}</span>
            <p className="text-[10px] text-slate-400 mt-0.5">&lt; 3 systems agree</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Left is Table, Right is Interactive Radar-style Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="consensus-main-layout">
        
        {/* Consensus Grid / Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 lg:col-span-2 flex flex-col space-y-4" id="consensus-table-section">
          
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-700 text-xs font-bold">
              <SlidersHorizontal className="w-4 h-4 text-slate-400" />
              Filter Consensus
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Entry Filter */}
              <div className="flex-1 sm:flex-none">
                <select
                  value={selectedEntry}
                  onChange={(e) => setSelectedEntry(e.target.value)}
                  className="w-full sm:w-auto bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All Entries</option>
                  {entries.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>

              {/* Consensus Tier Filter */}
              <div className="flex-1 sm:flex-none">
                <select
                  value={selectedConsensusTier}
                  onChange={(e) => setSelectedConsensusTier(e.target.value)}
                  className="w-full sm:w-auto bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All Tiers</option>
                  {Object.values(ConsensusTier).map(t => (
                    <option key={t} value={t}>{formatTierLabel(t)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Results Table */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
              <span className="text-sm">Retrieving consensus records...</span>
            </div>
          ) : filteredSnapshots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-200 rounded-xl bg-slate-25/50">
              <Database className="w-10 h-10 text-slate-300 mb-3" />
              <span className="text-slate-800 font-bold text-sm">No Consensus Snapshots</span>
              <p className="text-slate-400 text-xs mt-1 max-w-md text-center px-4">
                Run 'Calculate Consensus' above to process current week recommendations and assemble multi-system outputs.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" id="consensus-table">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-3">Week</th>
                    <th className="py-3 px-3">Entry</th>
                    <th className="py-3 px-3">Team</th>
                    <th className="py-3 px-3 text-center">Consensus Score</th>
                    <th className="py-3 px-3 text-center">Agreement</th>
                    <th className="py-3 px-3 text-center">Consensus Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700 text-xs font-medium">
                  {filteredSnapshots.map((item) => {
                    const isSelected = activeTeamDetail?.id === item.id;
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setActiveTeamDetail(item)}
                        className={`hover:bg-indigo-50/20 cursor-pointer transition duration-100 ${
                          isSelected ? "bg-indigo-50/50 border-l-2 border-indigo-600" : ""
                        }`}
                      >
                        <td className="py-3 px-3 text-slate-400 font-mono">W{item.week}</td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800 max-w-[120px] truncate">
                            {getEntryName(item.entry_id)}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                            <span className="font-black text-slate-900 tracking-wider font-mono">{item.team_id.toUpperCase()}</span>
                            <span className="text-slate-400 text-[10px] hidden sm:inline truncate max-w-[80px]">
                              {getTeamName(item.team_id)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-bold font-mono text-indigo-600 bg-indigo-50/10">
                          {item.consensus_score.toFixed(1)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className="font-black text-slate-800">{item.agreement_count}</span>
                            <span className="text-slate-400 font-mono">/ 6</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block border px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide shrink-0 ${getConsensusTierBadge(item.consensus_tier)}`}>
                            {formatTierLabel(item.consensus_tier)}
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

        {/* Dynamic Detail Card / Core Decision Systems Radial Comparison */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col justify-between space-y-6" id="consensus-detail-section">
          {activeTeamDetail ? (
            <div className="space-y-6 animate-fade-in" id="consensus-detail-container">
              
              {/* Card Title */}
              <div>
                <span className="text-slate-400 text-[10px] font-mono tracking-widest uppercase block">Ensemble Snapshot</span>
                <div className="flex items-center justify-between mt-1">
                  <h3 className="font-black text-slate-900 text-lg tracking-tight font-mono uppercase">
                    {activeTeamDetail.team_id.toUpperCase()} Consensus
                  </h3>
                  <span className={`border px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide font-black ${getConsensusTierBadge(activeTeamDetail.consensus_tier)}`}>
                    {formatTierLabel(activeTeamDetail.consensus_tier)}
                  </span>
                </div>
                <p className="text-slate-400 text-xs mt-1">
                  Ensemble agreement for <strong>{getEntryName(activeTeamDetail.entry_id)}</strong> in Week {activeTeamDetail.week}.
                </p>
              </div>

              {/* Consensus Meter */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Overall Agreement Score</span>
                <div className="text-4xl font-black text-indigo-600 font-mono tracking-tighter mt-1">
                  {activeTeamDetail.consensus_score.toFixed(1)}
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1">
                  {activeTeamDetail.agreement_count} of 6 systems score &gt; 70
                </div>
              </div>

              {/* Subsystems Stack - visual 0-100 meters */}
              <div className="space-y-3.5">
                <h4 className="text-[10px] text-slate-400 uppercase tracking-wider font-bold border-b border-slate-100 pb-1 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" />
                  Subsystem Breakdown
                </h4>

                {/* Subsystem 1: Win Probability (Candidate Score) */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      Win Probability (Candidate Score)
                    </span>
                    <span className={`font-mono font-bold ${activeTeamDetail.candidate_score >= 70 ? "text-emerald-600" : "text-slate-500"}`}>
                      {activeTeamDetail.candidate_score.toFixed(0)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${activeTeamDetail.candidate_score >= 70 ? "bg-emerald-500" : "bg-indigo-500"}`} 
                      style={{ width: `${activeTeamDetail.candidate_score}%` }} 
                    />
                  </div>
                </div>

                {/* Subsystem 2: Survivor Equity */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5 text-blue-500" />
                      Survivor Equity Score
                    </span>
                    <span className={`font-mono font-bold ${activeTeamDetail.survivor_equity_score >= 70 ? "text-emerald-600" : "text-slate-500"}`}>
                      {activeTeamDetail.survivor_equity_score.toFixed(0)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${activeTeamDetail.survivor_equity_score >= 70 ? "bg-emerald-500" : "bg-indigo-500"}`} 
                      style={{ width: `${activeTeamDetail.survivor_equity_score}%` }} 
                    />
                  </div>
                </div>

                {/* Subsystem 3: Recommendation Score */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1">
                      <BarChart4 className="w-3.5 h-3.5 text-indigo-500" />
                      Recommendation Score
                    </span>
                    <span className={`font-mono font-bold ${activeTeamDetail.recommendation_score >= 70 ? "text-emerald-600" : "text-slate-500"}`}>
                      {activeTeamDetail.recommendation_score.toFixed(0)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${activeTeamDetail.recommendation_score >= 70 ? "bg-emerald-500" : "bg-indigo-500"}`} 
                      style={{ width: `${activeTeamDetail.recommendation_score}%` }} 
                    />
                  </div>
                </div>

                {/* Subsystem 4: Confidence Score */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      Confidence Score
                    </span>
                    <span className={`font-mono font-bold ${activeTeamDetail.confidence_score >= 70 ? "text-emerald-600" : "text-slate-500"}`}>
                      {activeTeamDetail.confidence_score.toFixed(0)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${activeTeamDetail.confidence_score >= 70 ? "bg-emerald-500" : "bg-indigo-500"}`} 
                      style={{ width: `${activeTeamDetail.confidence_score}%` }} 
                    />
                  </div>
                </div>

                {/* Subsystem 5: Ownership Risk efficiency */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-violet-500" />
                      Ownership Score (contrarian play)
                    </span>
                    <span className={`font-mono font-bold ${activeTeamDetail.ownership_score >= 70 ? "text-emerald-600" : "text-slate-500"}`}>
                      {activeTeamDetail.ownership_score.toFixed(0)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${activeTeamDetail.ownership_score >= 70 ? "bg-emerald-500" : "bg-indigo-500"}`} 
                      style={{ width: `${activeTeamDetail.ownership_score}%` }} 
                    />
                  </div>
                </div>

                {/* Subsystem 6: Future Value efficiency */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-teal-500" />
                      Future Value Score (preservation)
                    </span>
                    <span className={`font-mono font-bold ${activeTeamDetail.future_value_score >= 70 ? "text-emerald-600" : "text-slate-500"}`}>
                      {activeTeamDetail.future_value_score.toFixed(0)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${activeTeamDetail.future_value_score >= 70 ? "bg-emerald-500" : "bg-indigo-500"}`} 
                      style={{ width: `${activeTeamDetail.future_value_score}%` }} 
                    />
                  </div>
                </div>
              </div>

              {/* Narrative Summary */}
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-start gap-2.5">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-slate-600 text-xs leading-relaxed font-medium">
                  {activeTeamDetail.consensus_summary}
                </p>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Database className="w-10 h-10 text-slate-200 mb-3" />
              <span className="text-sm">Select a row to see ensemble detailed analysis</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
