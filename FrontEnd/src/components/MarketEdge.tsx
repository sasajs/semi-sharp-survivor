import React, { useState, useEffect, useMemo } from 'react';
import { SemiSharpApi } from '../api';
import { ConsensusMarketLine, ProjectionEdge } from '../types';
import { Card, LoadingSpinner, Alert } from './ui';
import { 
  Database, 
  RefreshCw, 
  AlertTriangle, 
  Search, 
  ArrowUpDown, 
  Layers, 
  TrendingUp, 
  Clock, 
  HelpCircle,
  Tag,
  Hash
} from 'lucide-react';

interface MarketEdgeProps {
  season: number;
  week: number;
}

type TabType = 'projection-edge' | 'consensus';
type SortOption = 'edge-desc' | 'spread-asc' | 'team-name' | 'sportsbooks-desc';

export const MarketEdge: React.FC<MarketEdgeProps> = ({ season, week }) => {
  const [activeTab, setActiveTab] = useState<TabType>('projection-edge');
  const [consensusLines, setConsensusLines] = useState<ConsensusMarketLine[]>([]);
  const [projectionEdges, setProjectionEdges] = useState<ProjectionEdge[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('edge-desc');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Call both endpoints in parallel
      const [consensusRes, edgesRes] = await Promise.all([
        SemiSharpApi.getMarketConsensus(season, week),
        SemiSharpApi.getProjectionEdge(season, week)
      ]);

      if (consensusRes && consensusRes.consensus_lines) {
        setConsensusLines(consensusRes.consensus_lines);
      } else {
        setConsensusLines([]);
      }

      if (edgesRes && edgesRes.projection_edges) {
        setProjectionEdges(edgesRes.projection_edges);
      } else {
        setProjectionEdges([]);
      }
    } catch (err: any) {
      console.error('Error fetching market edge data:', err);
      let errorDetails = 'Connection failed';
      if (err instanceof Error) {
        errorDetails = err.message;
      } else if (err && typeof err === 'object') {
        errorDetails = err.detail || err.message || JSON.stringify(err);
      } else if (err) {
        errorDetails = String(err);
      }
      setError(errorDetails);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [season, week]);

  // Handle Filtering & Sorting for Projection Edges
  const processedEdges = useMemo(() => {
    let result = [...projectionEdges];

    // Filter by search term
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        r => r.team.toLowerCase().includes(term) || 
             r.game_id.toLowerCase().includes(term)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'edge-desc':
          return b.edge_points - a.edge_points;
        case 'spread-asc':
          return a.semisharp_spread - b.semisharp_spread;
        case 'team-name':
          return a.team.localeCompare(b.team);
        case 'sportsbooks-desc':
          return b.sportsbook_count - a.sportsbook_count;
        default:
          return 0;
      }
    });

    return result;
  }, [projectionEdges, searchTerm, sortBy]);

  // Handle Filtering & Sorting for Consensus Lines
  const processedConsensus = useMemo(() => {
    let result = [...consensusLines];

    // Filter by search term
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        r => r.team.toLowerCase().includes(term) || 
             r.game_id.toLowerCase().includes(term)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'spread-asc':
          return a.consensus_spread - b.consensus_spread;
        case 'team-name':
          return a.team.localeCompare(b.team);
        case 'sportsbooks-desc':
          return b.sportsbook_count - a.sportsbook_count;
        default:
          // Default to sorting by team name
          return a.team.localeCompare(b.team);
      }
    });

    return result;
  }, [consensusLines, searchTerm, sortBy]);

  const hasData = consensusLines.length > 0 || projectionEdges.length > 0;

  return (
    <div className="space-y-6">
      {/* Top Bar with Status and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 text-slate-800 p-2 rounded-xl border border-slate-200/60 font-semibold text-xs font-mono">
            NFL {season} | WEEK {week} MARKET METRICS
          </div>
          {hasData && !loading && !error && (
            <span className="text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 inline-block" />
              🟢 LIVE API
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md">
              GET /market/consensus/...
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md">
              GET /market/projection-edge/...
            </span>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-slate-50 border border-slate-200/80 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20">
          <LoadingSpinner size="md" message={`Querying live market consensus and projection-edge statistics from FastAPI...`} />
        </div>
      ) : error ? (
        <div className="space-y-4">
          <Alert
            type="warning"
            title="Market API Connection Issue"
            message={error}
          />
          <Card className="p-8 text-center bg-white border border-slate-100">
            <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium mb-4">
              Failed to connect with FastAPI market monitoring endpoints.
            </p>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 cursor-pointer transition-colors"
            >
              Retry Connection
            </button>
          </Card>
        </div>
      ) : !hasData ? (
        <Card className="p-16 text-center space-y-4 bg-white border border-slate-100">
          <Database className="w-12 h-12 mx-auto text-slate-300" />
          <h3 className="text-sm font-bold text-slate-800">No Market Data Available</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            There is currently no market consensus or projection edge information on file for Season {season} Week {week}.
          </p>
        </Card>
      ) : (
        <>
          {/* Header Info Block */}
          <Card className="p-5 bg-white border border-slate-100 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">Market Integration Pipeline</h3>
                <p className="text-xs text-slate-500 leading-normal font-medium">
                  This interface maps the current vegas consensus spread records directly beside our deep model expectations. All calculations and margins are fully executed at the server-level; this panel acts purely as a presentation layout for backend fields.
                </p>
              </div>
            </div>
          </Card>

          {/* Tab Selection, Searching, and Sorting Panel */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-4">
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
              {/* Tab Toggles */}
              <div className="flex bg-slate-100 p-1 rounded-xl self-start">
                <button
                  onClick={() => {
                    setActiveTab('projection-edge');
                    if (sortBy === 'spread-asc' || sortBy === 'team-name' || sortBy === 'sportsbooks-desc') {
                      // Keep it
                    } else {
                      setSortBy('edge-desc');
                    }
                  }}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'projection-edge'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Model Projection Edges ({projectionEdges.length})
                </button>
                <button
                  onClick={() => {
                    setActiveTab('consensus');
                    if (sortBy === 'edge-desc') {
                      setSortBy('spread-asc');
                    }
                  }}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'consensus'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Consensus Market Lines ({consensusLines.length})
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-1 lg:justify-end">
                {/* Search Box */}
                <div className="relative w-full sm:max-w-xs">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by team or game id..."
                    className="block w-full pl-9 pr-3 py-1.5 text-xs font-semibold text-slate-800 placeholder-slate-400 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                {/* Sort dropdown */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 font-mono uppercase">
                    <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="block bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {activeTab === 'projection-edge' && (
                      <option value="edge-desc">Highest Edge Points First</option>
                    )}
                    <option value="spread-asc">Spread (Lowest First)</option>
                    <option value="team-name">Team Name (A-Z)</option>
                    <option value="sportsbooks-desc">Most Sportsbooks Covered</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Data Cards Rendering */}
          {activeTab === 'projection-edge' ? (
            processedEdges.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-medium text-xs bg-white rounded-xl border border-slate-100">
                No matching projection edge records found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {processedEdges.map((item) => (
                  <Card 
                    key={`${item.game_id}_${item.team}`}
                    className="relative overflow-hidden bg-white hover:border-slate-300 transition-all hover:shadow-xs p-5 flex flex-col justify-between gap-4 border border-slate-100 group"
                  >
                    {/* Top Accent bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 group-hover:bg-indigo-500 transition-all" />

                    <div className="space-y-3">
                      {/* Meta Header */}
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3 text-slate-400" />
                          {item.game_id}
                        </span>
                        <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-sm flex items-center gap-1 font-sans">
                          <TrendingUp className="w-3 h-3" /> Edge Node
                        </span>
                      </div>

                      {/* Team Name */}
                      <div className="space-y-0.5">
                        <span className="text-xl font-black text-slate-800 tracking-tight block">
                          {item.team}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          Evaluated Team
                        </span>
                      </div>
                    </div>

                    {/* Metrics Body */}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      {/* SemiSharp Spread (API Value) */}
                      <div className="flex justify-between items-center text-xs py-1">
                        <span className="font-bold text-slate-500">SemiSharp Spread</span>
                        <span className="font-mono font-black text-slate-800">
                          {item.semisharp_spread > 0 ? `+${item.semisharp_spread.toFixed(2)}` : item.semisharp_spread.toFixed(2)}
                        </span>
                      </div>

                      {/* Market Spread (API Value) */}
                      <div className="flex justify-between items-center text-xs py-1">
                        <span className="font-bold text-slate-500">Market Spread</span>
                        <span className="font-mono font-semibold text-slate-600">
                          {item.market_spread > 0 ? `+${item.market_spread.toFixed(2)}` : item.market_spread.toFixed(2)}
                        </span>
                      </div>

                      {/* Edge Points (API Value) */}
                      <div className="flex justify-between items-center bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100/60 text-xs mt-2">
                        <span className="font-extrabold text-indigo-800">Value Edge Points</span>
                        <span className="font-mono font-black text-indigo-700 text-sm">
                          {item.edge_points.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Meta Footer */}
                    <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-[9px] font-semibold text-slate-400">
                      <span>Books: {item.sportsbook_count}</span>
                      <span className="flex items-center gap-1">
                        <HelpCircle className="w-3 h-3 text-slate-400" />
                        API Sourced
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )
          ) : (
            processedConsensus.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-medium text-xs bg-white rounded-xl border border-slate-100">
                No matching consensus records found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {processedConsensus.map((item) => (
                  <Card 
                    key={`${item.game_id}_${item.team}`}
                    className="relative overflow-hidden bg-white hover:border-slate-300 transition-all hover:shadow-xs p-5 flex flex-col justify-between gap-4 border border-slate-100 group"
                  >
                    {/* Top Accent bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 group-hover:bg-slate-400 transition-all" />

                    <div className="space-y-3">
                      {/* Meta Header */}
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3 text-slate-400" />
                          {item.game_id}
                        </span>
                        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-sm flex items-center gap-1 font-sans">
                          <Database className="w-3 h-3" /> Consensus Node
                        </span>
                      </div>

                      {/* Team Name */}
                      <div className="space-y-0.5">
                        <span className="text-xl font-black text-slate-800 tracking-tight block">
                          {item.team}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          Consensus Team
                        </span>
                      </div>
                    </div>

                    {/* Metrics Body */}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      {/* Consensus Spread (API Value) */}
                      <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                        <span className="font-bold text-slate-600">Consensus Spread</span>
                        <span className="font-mono font-black text-slate-800 text-sm">
                          {item.consensus_spread > 0 ? `+${item.consensus_spread.toFixed(2)}` : item.consensus_spread.toFixed(2)}
                        </span>
                      </div>

                      {/* Sportsbooks Covered */}
                      <div className="flex justify-between items-center text-xs py-1">
                        <span className="font-bold text-slate-500">Sportsbooks Covered</span>
                        <span className="font-mono font-bold text-slate-700">
                          {item.sportsbook_count}
                        </span>
                      </div>
                    </div>

                    {/* Meta Footer */}
                    <div className="pt-2 border-t border-slate-50 flex flex-col gap-1 text-[9px] font-semibold text-slate-400">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          Snapshot:
                        </span>
                        <span className="font-mono">{item.latest_snapshot}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
};
