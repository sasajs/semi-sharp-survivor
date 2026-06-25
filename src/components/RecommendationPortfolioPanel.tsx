import React, { useState, useEffect } from "react";
import { 
  RefreshCw, 
  Activity, 
  CheckCircle2, 
  AlertTriangle,
  Database,
  BarChart4,
  Scale,
  Award,
  TrendingUp,
  ShieldCheck,
  Zap,
  Info,
  Layers,
  Fingerprint
} from "lucide-react";
import { apiService } from "../services/apiService";
import { RecommendationPortfolio } from "../types";

export interface RecommendationPortfolioPanelProps {
  entries: { id: string; name: string }[];
  teams: { id: string; name: string; abbreviation: string }[];
}

export const RecommendationPortfolioPanel: React.FC<RecommendationPortfolioPanelProps> = ({
  entries = [],
  teams = []
}) => {
  const [portfolios, setPortfolios] = useState<RecommendationPortfolio[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters and active views
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>("latest");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.fetchPortfolioHistory();
      setPortfolios(data);
      if (data.length > 0) {
        // Find latest portfolio ID
        const latestId = data[0].portfolio_id;
        setSelectedPortfolioId(latestId);
      }
    } catch (err: any) {
      setError("Failed to fetch recommendation portfolio data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunOptimizer = async () => {
    setOptimizing(true);
    setError(null);
    setSuccessMsg(null);
    try {
      // Trigger recalculation for Season 2026, Week 1, Version v1.0.0
      await apiService.calculatePortfolio("2026", 1, "v1.0.0");
      setSuccessMsg("Portfolio Optimizer calculated and persisted successfully.");
      await loadData();
    } catch (err: any) {
      setError("Failed to optimize portfolio: " + err.message);
    } finally {
      setOptimizing(false);
    }
  };

  // Get unique portfolios
  const uniquePortfolioIds = Array.from(new Set(portfolios.map(p => p.portfolio_id))) as string[];

  // Filtered portfolio allocations
  const activeAllocations = portfolios.filter(p => p.portfolio_id === selectedPortfolioId);

  // Compute summary metrics for the active portfolio
  const totalEntries = activeAllocations.length;
  const avgPortfolioScore = totalEntries > 0 
    ? activeAllocations.reduce((acc, curr) => acc + curr.portfolio_score, 0) / totalEntries 
    : 0;
  const avgDiversificationScore = totalEntries > 0 
    ? activeAllocations[0].diversification_score 
    : 0;
  const avgCorrelationPenalty = totalEntries > 0 
    ? activeAllocations.reduce((acc, curr) => acc + curr.correlation_penalty, 0) / totalEntries 
    : 0;

  const getTeamName = (teamId: string) => {
    const t = teams.find(item => item.id.toLowerCase() === teamId.toLowerCase());
    return t ? t.name : teamId.toUpperCase();
  };

  const getEntryName = (entryId: string) => {
    const e = entries.find(item => item.id === entryId);
    return e ? e.name : `Entry ${entryId}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (score >= 70) return "text-blue-700 bg-blue-50 border-blue-200";
    if (score >= 50) return "text-amber-700 bg-amber-50 border-amber-200";
    return "text-rose-700 bg-rose-50 border-rose-200";
  };

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in" id="portfolio-header">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wide border border-emerald-200">
              Layer 4 Game-Theory Portfolio
            </span>
            <span className="text-slate-400 text-xs font-mono">v0.39-recommendation-portfolio-optimizer</span>
          </div>
          <h2 className="font-black text-slate-900 text-xl tracking-tight mt-1">
            Recommendation Portfolio Optimizer
          </h2>
          <p className="text-slate-500 text-sm mt-0.5 max-w-2xl">
            Simultaneously optimizes selections across all entries to maximize survival probability and hedge contest failure risks.
          </p>
        </div>
        
        <div className="flex items-center gap-2 self-stretch md:self-auto">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-xl transition duration-150"
            id="refresh-portfolio-btn"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          
          <button
            onClick={handleRunOptimizer}
            disabled={optimizing}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition duration-150 disabled:opacity-70"
            id="run-portfolio-btn"
          >
            <Zap className={`w-3.5 h-3.5 ${optimizing ? "animate-spin" : ""}`} />
            Optimize Portfolio
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
      {activeAllocations.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="portfolio-metrics">
          
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Portfolio ID</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Fingerprint className="w-4 h-4 text-indigo-500" />
                  <p className="text-slate-800 text-sm font-mono font-bold leading-tight uppercase">
                    {selectedPortfolioId.substring(0, 16)}...
                  </p>
                </div>
              </div>
              <div className="bg-slate-100 p-2 rounded-xl text-slate-500">
                <Database className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Portfolio Score</p>
                <p className="text-slate-900 text-2xl font-black mt-1 leading-none">
                  {avgPortfolioScore.toFixed(1)}
                </p>
              </div>
              <div className="bg-emerald-50 text-emerald-700 p-2 rounded-xl border border-emerald-200">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="text-[10px] text-slate-500 font-medium mt-2">
              Combined asset recommendation index
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Diversification</p>
                <p className="text-slate-900 text-2xl font-black mt-1 leading-none">
                  {avgDiversificationScore.toFixed(1)}%
                </p>
              </div>
              <div className="bg-blue-50 text-blue-700 p-2 rounded-xl border border-blue-200">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-[10px] text-slate-500 font-medium mt-2">
              Unique team paths across all {totalEntries} entries
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Correlation Penalty</p>
                <p className={`text-2xl font-black mt-1 leading-none ${avgCorrelationPenalty > 0 ? "text-rose-600" : "text-slate-900"}`}>
                  -{avgCorrelationPenalty.toFixed(1)}
                </p>
              </div>
              <div className="bg-rose-50 text-rose-700 p-2 rounded-xl border border-rose-200">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <div className="text-[10px] text-slate-500 font-medium mt-2">
              Repeated selection risk deductions
            </div>
          </div>

        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Side: Portfolio Select / History */}
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3">
              Optimizer History
            </h3>
            
            {loading && uniquePortfolioIds.length === 0 ? (
              <div className="py-8 flex justify-center text-slate-400 text-xs font-medium">
                Loading history...
              </div>
            ) : uniquePortfolioIds.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No optimization cycles recorded yet. Click 'Optimize Portfolio' to start.
              </div>
            ) : (
              <div className="space-y-2">
                {uniquePortfolioIds.map(id => {
                  const items = portfolios.filter(p => p.portfolio_id === id);
                  const season = items[0]?.season || "2026";
                  const week = items[0]?.week || 1;
                  const score = items.reduce((acc, c) => acc + c.portfolio_score, 0) / items.length;

                  return (
                    <button
                      key={id}
                      onClick={() => setSelectedPortfolioId(id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all duration-150 flex items-center justify-between ${
                        selectedPortfolioId === id
                          ? "border-emerald-600 bg-emerald-50/40 font-semibold"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="text-slate-800 text-xs font-bold font-mono">
                          {season} Week {week}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                          {id.substring(0, 16)}
                        </div>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded font-bold border ${getScoreColor(score)}`}>
                        {score.toFixed(1)}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Allocation Details Table */}
        <div className="xl:col-span-3">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                Optimized Portfolio Allocations
              </h3>
              <span className="text-[10px] bg-slate-200 text-slate-700 font-mono px-2 py-0.5 rounded uppercase font-bold">
                {activeAllocations.length} Active Entries
              </span>
            </div>

            {loading && activeAllocations.length === 0 ? (
              <div className="py-16 text-center text-slate-400 font-medium text-sm">
                Loading allocations...
              </div>
            ) : activeAllocations.length === 0 ? (
              <div className="py-16 text-center text-slate-400 font-medium text-sm">
                No active allocations to display. Run the optimizer to create one.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {activeAllocations.map(alloc => (
                  <div key={alloc.id} className="p-6 hover:bg-slate-50/40 transition duration-150 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    
                    {/* Entry & Team Details */}
                    <div className="space-y-1.5 max-w-sm">
                      <div className="text-xs text-slate-400 font-mono uppercase font-black tracking-wider">
                        {getEntryName(alloc.entry_id)}
                      </div>
                      <div className="font-black text-slate-900 text-base tracking-tight">
                        {getTeamName(alloc.recommended_team_id)}
                      </div>
                      <p className="text-xs text-slate-500 leading-normal">
                        {alloc.allocation_reason}
                      </p>
                    </div>

                    {/* Scores Metrics */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-center px-2.5 py-1 border border-slate-200 bg-white rounded-lg">
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Rec</div>
                        <div className="text-xs font-extrabold text-slate-800">{alloc.recommendation_score.toFixed(0)}</div>
                      </div>

                      <div className="text-center px-2.5 py-1 border border-slate-200 bg-white rounded-lg">
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Conf</div>
                        <div className="text-xs font-extrabold text-slate-800">{alloc.confidence_score.toFixed(0)}</div>
                      </div>

                      <div className="text-center px-2.5 py-1 border border-slate-200 bg-white rounded-lg">
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Cons</div>
                        <div className="text-xs font-extrabold text-slate-800">{alloc.consensus_score.toFixed(0)}</div>
                      </div>

                      <div className="text-center px-2.5 py-1 border border-slate-200 bg-white rounded-lg">
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Penalty</div>
                        <div className={`text-xs font-extrabold ${alloc.correlation_penalty > 0 ? "text-rose-600" : "text-slate-400"}`}>
                          -{alloc.correlation_penalty.toFixed(0)}
                        </div>
                      </div>

                      <div className={`text-center px-3 py-1 rounded-xl border font-black shadow-xs ${getScoreColor(alloc.portfolio_score)}`}>
                        <div className="text-[9px] uppercase tracking-wide opacity-80">Portfolio</div>
                        <div className="text-sm">{alloc.portfolio_score.toFixed(1)}</div>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
