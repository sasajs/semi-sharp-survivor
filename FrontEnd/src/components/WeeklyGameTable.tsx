/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { GameAnalysis } from '../types/analysis';
import { WeeklyGameRow } from './WeeklyGameRow';
import { WeeklyGameDetail } from './WeeklyGameDetail';
import { EdgeBadge } from './EdgeBadge';
import { RiskDisplay } from './RiskDisplay';
import { Card, Alert, Button } from './ui';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  AlertTriangle, 
  Users, 
  ChevronDown, 
  ChevronUp, 
  EyeOff, 
  Filter, 
  SlidersHorizontal,
  Info
} from 'lucide-react';

interface WeeklyGameTableProps {
  games: GameAnalysis[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

type SortField = 'kickoff' | 'edge' | 'risk' | 'alphabetical';
type SortOrder = 'asc' | 'desc';

export const WeeklyGameTable: React.FC<WeeklyGameTableProps> = ({
  games,
  loading,
  error,
  onRetry,
}) => {
  // Client-side Filter States
  const [onlyPositiveEdge, setOnlyPositiveEdge] = useState(false);
  const [highRiskOnly, setHighRiskOnly] = useState(false);
  const [lowRiskOnly, setLowRiskOnly] = useState(false);
  const [hideNoMarket, setHideNoMarket] = useState(false);

  // Client-side Sorting States
  const [sortBy, setSortBy] = useState<SortField>('kickoff');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Mobile Expanded State Tracker (for the card layout)
  const [mobileExpandedGameIds, setMobileExpandedGameIds] = useState<Record<string, boolean>>({});

  const toggleMobileExpand = (gameId: string) => {
    setMobileExpandedGameIds((prev) => ({
      ...prev,
      [gameId]: !prev[gameId],
    }));
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Helper to retrieve the peak positive edge of a match
  const getGameMaxEdgeValue = (game: GameAnalysis) => {
    const awayEdge = game.market.away_edge?.edge_points || 0;
    const homeEdge = game.market.home_edge?.edge_points || 0;
    return Math.max(awayEdge, homeEdge);
  };

  // Helper to retrieve the peak risk score of a match
  const getGameMaxRiskValue = (game: GameAnalysis) => {
    const awayRisk = game.risk.away?.score || 0;
    const homeRisk = game.risk.home?.score || 0;
    return Math.max(awayRisk, homeRisk);
  };

  // Process Filtering and Sorting in Memo
  const processedGames = useMemo(() => {
    if (!games) return [];

    let filtered = [...games];

    // 1. Filter: Only Positive Edge
    if (onlyPositiveEdge) {
      filtered = filtered.filter((game) => {
        const edge = getGameMaxEdgeValue(game);
        return edge >= 0.5; // Filter standard strength positive edge
      });
    }

    // 2. Filter: High Risk
    if (highRiskOnly) {
      filtered = filtered.filter((game) => {
        const awayRisk = game.risk.away?.level === 'HIGH' || (game.risk.away?.score || 0) >= 10.0;
        const homeRisk = game.risk.home?.level === 'HIGH' || (game.risk.home?.score || 0) >= 10.0;
        return awayRisk || homeRisk;
      });
    }

    // 3. Filter: Low Risk
    if (lowRiskOnly) {
      filtered = filtered.filter((game) => {
        const awayRiskScore = game.risk.away?.score || 0;
        const homeRiskScore = game.risk.home?.score || 0;
        // Keep games where no team exceeds the low risk threshold of 4.0
        return awayRiskScore <= 4.0 && homeRiskScore <= 4.0;
      });
    }

    // 4. Filter: Hide Games Without Market
    if (hideNoMarket) {
      filtered = filtered.filter((game) => game.market.sportsbook_count > 0);
    }

    // 5. Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'kickoff': {
          const dateA = new Date(`${a.gameday}T${a.gametime}`).getTime();
          const dateB = new Date(`${b.gameday}T${b.gametime}`).getTime();
          comparison = dateA - dateB;
          break;
        }
        case 'edge': {
          comparison = getGameMaxEdgeValue(a) - getGameMaxEdgeValue(b);
          break;
        }
        case 'risk': {
          comparison = getGameMaxRiskValue(a) - getGameMaxRiskValue(b);
          break;
        }
        case 'alphabetical': {
          comparison = a.away_team.team_abbr.localeCompare(b.away_team.team_abbr);
          break;
        }
        default:
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [games, onlyPositiveEdge, highRiskOnly, lowRiskOnly, hideNoMarket, sortBy, sortOrder]);

  const renderSortIndicator = (field: SortField) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 ml-1 shrink-0" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp className="w-3.5 h-3.5 text-indigo-600 ml-1 shrink-0" />
      : <ArrowDown className="w-3.5 h-3.5 text-indigo-600 ml-1 shrink-0" />;
  };

  // Skeletons for Loading State (matches desktop layout)
  const renderSkeletons = () => {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-slate-100 h-10 w-full rounded-lg" />
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Card key={idx} className="p-5 border border-slate-100 flex flex-col gap-4 animate-pulse">
              <div className="flex justify-between items-center">
                <div className="bg-slate-200 h-6 w-32 rounded" />
                <div className="bg-slate-200 h-6 w-20 rounded" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-200 h-4 w-24 rounded" />
                <div className="bg-slate-200 h-4 w-24 rounded" />
                <div className="bg-slate-200 h-4 w-24 rounded" />
                <div className="bg-slate-200 h-4 w-24 rounded" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  // Rendering States
  if (loading) {
    return renderSkeletons();
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert 
          type="error" 
          title="Analysis Sync Failure" 
          message={error} 
        />
        <div className="flex justify-start">
          <Button variant="outline" size="sm" onClick={onRetry} className="text-xs h-8 border-rose-200 hover:bg-rose-50 text-rose-700 bg-white shadow-3xs cursor-pointer">
            Retry Network Sync
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Client-Side Control Panel (Filters and Desktop Sorters) */}
      <Card className="p-4 border border-slate-100 bg-white shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filters Panel */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold uppercase tracking-wider font-mono mr-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Analytical Filters</span>
          </div>

          {/* Only Positive Edge */}
          <button
            onClick={() => setOnlyPositiveEdge(!onlyPositiveEdge)}
            className={`
              px-3 py-1.5 text-xs rounded-lg border font-medium transition-all flex items-center gap-1.5 select-none cursor-pointer
              ${onlyPositiveEdge 
                ? 'bg-[#2ecc71]/10 text-[#219a55] border-[#2ecc71]/30 font-bold' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }
            `}
          >
            Positive Edge Only
          </button>

          {/* High Risk Filter */}
          <button
            onClick={() => {
              setHighRiskOnly(!highRiskOnly);
              if (!highRiskOnly) setLowRiskOnly(false); // Mutual exclusivity
            }}
            className={`
              px-3 py-1.5 text-xs rounded-lg border font-medium transition-all flex items-center gap-1.5 select-none cursor-pointer
              ${highRiskOnly 
                ? 'bg-amber-50 text-amber-700 border-amber-200 font-bold' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }
            `}
          >
            High Risk Only
          </button>

          {/* Low Risk Filter */}
          <button
            onClick={() => {
              setLowRiskOnly(!lowRiskOnly);
              if (!lowRiskOnly) setHighRiskOnly(false); // Mutual exclusivity
            }}
            className={`
              px-3 py-1.5 text-xs rounded-lg border font-medium transition-all flex items-center gap-1.5 select-none cursor-pointer
              ${lowRiskOnly 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }
            `}
          >
            Low Risk Only
          </button>

          {/* Hide No Market */}
          <button
            onClick={() => setHideNoMarket(!hideNoMarket)}
            className={`
              px-3 py-1.5 text-xs rounded-lg border font-medium transition-all flex items-center gap-1.5 select-none cursor-pointer
              ${hideNoMarket 
                ? 'bg-slate-900 text-white border-slate-950 font-bold shadow-xs' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }
            `}
          >
            Active Markets Only
          </button>
        </div>

        {/* Client Side Sorting indicator for Mobile UI */}
        <div className="flex md:hidden items-center gap-2 border-t border-slate-100 pt-3">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase mr-2">Sort</span>
          <select 
            value={sortBy}
            onChange={(e) => handleSort(e.target.value as SortField)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
          >
            <option value="kickoff">Kickoff Time</option>
            <option value="edge">Value Edge</option>
            <option value="risk">Safety Risk</option>
            <option value="alphabetical">Alphabetical (Away)</option>
          </select>
        </div>
      </Card>

      {/* 2. Primary Games Display */}
      {processedGames.length === 0 ? (
        <Card className="py-16 text-center space-y-4 border border-slate-100">
          <EyeOff className="w-10 h-10 mx-auto text-slate-300" />
          <p className="font-mono text-sm font-bold text-slate-500">No matching NFL matchups available</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your active filters or clear them to display all matchups registered for this week.
          </p>
        </Card>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-slate-150/80 bg-white shadow-2xs">
            <table className="min-w-full divide-y divide-slate-150 text-left table-fixed">
              <thead className="bg-slate-50 font-mono text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <tr>
                  <th 
                    onClick={() => handleSort('alphabetical')}
                    className="px-4 py-3.5 cursor-pointer hover:bg-slate-100/50 hover:text-slate-700 transition-colors w-[18%]"
                  >
                    <div className="flex items-center">
                      Away Team
                      {renderSortIndicator('alphabetical')}
                    </div>
                  </th>
                  <th className="px-4 py-3.5 w-[18%]">Home Team</th>
                  <th 
                    onClick={() => handleSort('kickoff')}
                    className="px-4 py-3.5 cursor-pointer hover:bg-slate-100/50 hover:text-slate-700 transition-colors w-[13%]"
                  >
                    <div className="flex items-center">
                      Kickoff
                      {renderSortIndicator('kickoff')}
                    </div>
                  </th>
                  <th className="px-4 py-3.5 w-[13%]">SemiSharp Spread</th>
                  <th className="px-4 py-3.5 w-[13%]">Market Line</th>
                  <th 
                    onClick={() => handleSort('edge')}
                    className="px-4 py-3.5 cursor-pointer hover:bg-slate-100/50 hover:text-slate-700 transition-colors w-[10%]"
                  >
                    <div className="flex items-center">
                      Edge
                      {renderSortIndicator('edge')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('risk')}
                    className="px-4 py-3.5 cursor-pointer hover:bg-slate-100/50 hover:text-slate-700 transition-colors w-[13%]"
                  >
                    <div className="flex items-center">
                      Risk Score
                      {renderSortIndicator('risk')}
                    </div>
                  </th>
                  <th className="px-4 py-3.5 text-center w-[7%]">Books</th>
                  <th className="px-4 py-3.5 text-center w-[5%]">Expand</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processedGames.map((game) => (
                  <WeeklyGameRow key={game.game_id} game={game} />
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARD VIEW */}
          <div className="block md:hidden space-y-4">
            {processedGames.map((game) => {
              const isExpanded = !!mobileExpandedGameIds[game.game_id];
              
              // Calculate mobile display elements
              const awayEdge = game.market.away_edge?.edge_points || 0;
              const homeEdge = game.market.home_edge?.edge_points || 0;
              const maxEdge = Math.max(awayEdge, homeEdge);
              const edgeTeam = awayEdge >= homeEdge ? game.away_team.team_abbr : game.home_team.team_abbr;

              const activeRisk = game.risk.home?.score !== null 
                ? { team: game.home_team.team_abbr, ...game.risk.home } 
                : (game.risk.away?.score !== null ? { team: game.away_team.team_abbr, ...game.risk.away } : null);

              return (
                <Card 
                  key={game.game_id} 
                  className={`p-0 overflow-hidden border transition-all ${isExpanded ? 'border-slate-300 ring-1 ring-slate-100' : 'border-slate-150'}`}
                >
                  {/* Card Header clickable brief */}
                  <div 
                    onClick={() => toggleMobileExpand(game.game_id)}
                    className="p-4 flex flex-col gap-3 cursor-pointer hover:bg-slate-50/50 transition-colors select-none"
                  >
                    {/* Top Row: Teams brief */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {game.away_team.team_abbr}
                        </span>
                        <span className="text-slate-400 font-mono text-xs font-bold">@</span>
                        <span className="font-extrabold text-xs text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {game.home_team.team_abbr}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Users className="w-2.5 h-2.5" />
                        {game.market.sportsbook_count} Books
                      </span>
                    </div>

                    {/* Middle Row: Spreads & Info */}
                    <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider font-bold">SemiSharp Spread</span>
                        <span className="font-mono text-xs font-bold text-slate-800 mt-0.5">
                          {game.semisharp_projection.projected_favorite_abbr} {game.semisharp_projection.projected_spread > 0 ? `+${game.semisharp_projection.projected_spread.toFixed(1)}` : game.semisharp_projection.projected_spread.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider font-bold">Market Consensus</span>
                        <span className="font-mono text-xs font-semibold text-slate-700 mt-0.5">
                          {game.market.away_consensus_spread < 0 
                            ? `${game.away_team.team_abbr} ${game.market.away_consensus_spread.toFixed(1)}`
                            : `${game.home_team.team_abbr} ${game.market.home_consensus_spread.toFixed(1)}`}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Badges & Expander Icon */}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-4">
                        {/* Edge display */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono text-slate-400 font-bold">EDGE:</span>
                          <span className="text-[9px] font-mono text-slate-400 font-semibold">{edgeTeam}</span>
                          <EdgeBadge value={maxEdge} />
                        </div>

                        {/* Risk display */}
                        {activeRisk && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-mono text-slate-400 font-bold">RISK:</span>
                            <span className="text-[9px] font-mono text-slate-400 font-semibold">{activeRisk.team}</span>
                            <RiskDisplay score={activeRisk.score} stars={activeRisk.stars} />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 font-mono text-[10px] text-indigo-600 font-bold uppercase tracking-wider">
                        <span>Details</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </div>

                  {/* Mobile Expanded Game Detail inside card */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/20">
                      <WeeklyGameDetail game={game} />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
