/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { GameAnalysis } from '../../types/analysis';
import { WeeklySlateRow } from './WeeklySlateRow';
import { ExpandableGamePanel } from './ExpandableGamePanel';
import { TeamLogo } from './TeamLogo';
import { EdgeBadge } from '../EdgeBadge';
import { RiskDisplay } from '../RiskDisplay';
import { Card } from '../ui';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  EyeOff, 
  ChevronDown, 
  ChevronUp, 
  Users,
  SlidersHorizontal
} from 'lucide-react';

interface WeeklySlateTableProps {
  games: GameAnalysis[];
  expandedGameId: string | null;
  onToggleExpand: (gameId: string) => void;
}

type SortField = 'kickoff' | 'edge' | 'risk' | 'alphabetical' | 'spread';
type SortOrder = 'asc' | 'desc';

export const WeeklySlateTable: React.FC<WeeklySlateTableProps> = ({
  games,
  expandedGameId,
  onToggleExpand,
}) => {
  const [sortBy, setSortBy] = useState<SortField>('kickoff');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getGameMaxEdgeValue = (game: GameAnalysis) => {
    const awayEdge = game.market.away_edge?.edge_points || 0;
    const homeEdge = game.market.home_edge?.edge_points || 0;
    return Math.max(awayEdge, homeEdge);
  };

  const getGameMaxRiskValue = (game: GameAnalysis) => {
    const awayRisk = game.risk.away?.score || 0;
    const homeRisk = game.risk.home?.score || 0;
    return Math.max(awayRisk, homeRisk);
  };

  const sortedGames = useMemo(() => {
    if (!games || games.length === 0) return [];

    return [...games].sort((a, b) => {
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
        case 'spread': {
          comparison = Math.abs(a.semisharp_projection.projected_spread) - Math.abs(b.semisharp_projection.projected_spread);
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
  }, [games, sortBy, sortOrder]);

  const renderSortIndicator = (field: SortField) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 ml-1 shrink-0" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp className="w-3.5 h-3.5 text-indigo-600 ml-1 shrink-0" />
      : <ArrowDown className="w-3.5 h-3.5 text-indigo-600 ml-1 shrink-0" />;
  };

  if (sortedGames.length === 0) {
    return (
      <Card className="py-16 text-center space-y-4 border border-slate-200 bg-white">
        <EyeOff className="w-10 h-10 mx-auto text-slate-300" />
        <p className="font-mono text-sm font-bold text-slate-600">No matching NFL matchups available</p>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Try adjusting your active analytical filters or search criteria to display all scheduled matchups for this week.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile Sort Controls */}
      <div className="flex md:hidden items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold font-mono">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Sort Games:</span>
        </div>
        <select
          value={sortBy}
          onChange={(e) => handleSort(e.target.value as SortField)}
          className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-slate-800 font-mono font-bold"
        >
          <option value="kickoff">Kickoff Time</option>
          <option value="edge">Value Edge</option>
          <option value="risk">Safety Risk</option>
          <option value="spread">Spread Size</option>
          <option value="alphabetical">Alphabetical</option>
        </select>
      </div>

      {/* DESKTOP WORKSPACE TABLE */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <table className="min-w-full divide-y divide-slate-150 text-left table-fixed">
          <thead className="bg-slate-900 text-[10px] uppercase font-bold text-slate-300 tracking-wider font-mono">
            <tr>
              <th
                onClick={() => handleSort('alphabetical')}
                className="px-4 py-3.5 cursor-pointer hover:text-white transition-colors w-[18%]"
              >
                <div className="flex items-center">
                  Away Team
                  {renderSortIndicator('alphabetical')}
                </div>
              </th>
              <th className="px-4 py-3.5 w-[18%]">Home Team</th>
              <th
                onClick={() => handleSort('kickoff')}
                className="px-4 py-3.5 cursor-pointer hover:text-white transition-colors w-[13%]"
              >
                <div className="flex items-center">
                  Kickoff
                  {renderSortIndicator('kickoff')}
                </div>
              </th>
              <th
                onClick={() => handleSort('spread')}
                className="px-4 py-3.5 cursor-pointer hover:text-white transition-colors w-[13%]"
              >
                <div className="flex items-center">
                  SemiSharp
                  {renderSortIndicator('spread')}
                </div>
              </th>
              <th className="px-4 py-3.5 w-[13%]">Consensus</th>
              <th
                onClick={() => handleSort('edge')}
                className="px-4 py-3.5 cursor-pointer hover:text-white transition-colors w-[10%]"
              >
                <div className="flex items-center">
                  Edge
                  {renderSortIndicator('edge')}
                </div>
              </th>
              <th className="px-4 py-3.5 w-[8%]">Favorite</th>
              <th
                onClick={() => handleSort('risk')}
                className="px-4 py-3.5 cursor-pointer hover:text-white transition-colors w-[11%]"
              >
                <div className="flex items-center">
                  Risk
                  {renderSortIndicator('risk')}
                </div>
              </th>
              <th className="px-4 py-3.5 text-center w-[5%]">Books</th>
              <th className="px-3 py-3.5 text-center w-[10%]">Analysis</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {sortedGames.map((game) => (
              <WeeklySlateRow
                key={game.game_id}
                game={game}
                isExpanded={expandedGameId === game.game_id}
                onToggleExpand={() => onToggleExpand(game.game_id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE RESPONSIVE CARDS */}
      <div className="block md:hidden space-y-4">
        {sortedGames.map((game) => {
          const isExpanded = expandedGameId === game.game_id;
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
              className={`p-0 overflow-hidden border transition-all bg-white ${
                isExpanded ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200'
              }`}
            >
              {/* Card Summary Header */}
              <div
                onClick={() => onToggleExpand(game.game_id)}
                className="p-4 flex flex-col gap-3 cursor-pointer hover:bg-slate-50 transition-colors select-none"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TeamLogo abbr={game.away_team.team_abbr} size="sm" />
                    <span className="font-extrabold text-xs text-slate-900 font-mono">
                      {game.away_team.team_abbr}
                    </span>
                    <span className="text-slate-400 font-mono text-xs font-bold">@</span>
                    <TeamLogo abbr={game.home_team.team_abbr} size="sm" />
                    <span className="font-extrabold text-xs text-slate-900 font-mono">
                      {game.home_team.team_abbr}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Users className="w-2.5 h-2.5" />
                    {game.market.sportsbook_count} Books
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2.5">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">SemiSharp Spread</span>
                    <span className="font-mono text-xs font-bold text-slate-900 mt-0.5">
                      {game.semisharp_projection.projected_favorite_abbr}{' '}
                      {game.semisharp_projection.projected_spread > 0
                        ? `+${game.semisharp_projection.projected_spread.toFixed(1)}`
                        : game.semisharp_projection.projected_spread.toFixed(1)}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">Market Consensus</span>
                    <span className="font-mono text-xs font-semibold text-slate-800 mt-0.5">
                      {game.market.away_consensus_spread < 0
                        ? `${game.away_team.team_abbr} ${game.market.away_consensus_spread.toFixed(1)}`
                        : `${game.home_team.team_abbr} ${game.market.home_consensus_spread.toFixed(1)}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-mono text-slate-400 font-bold">EDGE:</span>
                      <EdgeBadge value={maxEdge} />
                    </div>
                    {activeRisk && (
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-mono text-slate-400 font-bold">RISK:</span>
                        <RiskDisplay score={activeRisk.score} stars={activeRisk.stars} />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 font-mono text-[11px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 font-bold uppercase tracking-wider">
                    <span>{isExpanded ? 'Hide Analysis' : 'View Analysis'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>

              {/* Mobile Expanded Detail Panel */}
              {isExpanded && (
                <div className="border-t border-slate-200">
                  <ExpandableGamePanel gameId={game.game_id} fallbackGame={game} />
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
