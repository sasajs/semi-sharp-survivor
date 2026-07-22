/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameAnalysis } from '../../types/analysis';
import { TeamLogo } from './TeamLogo';
import { EdgeBadge } from '../EdgeBadge';
import { RiskDisplay } from '../RiskDisplay';
import { ExpandableGamePanel } from './ExpandableGamePanel';
import { ChevronDown, ChevronUp, Users, Calendar } from 'lucide-react';

interface WeeklySlateRowProps {
  game: GameAnalysis;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const WeeklySlateRow: React.FC<WeeklySlateRowProps> = ({
  game,
  isExpanded,
  onToggleExpand,
}) => {
  const {
    gameday,
    gametime,
    away_team,
    home_team,
    semisharp_projection,
    market,
    risk,
  } = game;

  // Edge calculations
  const awayEdge = market.away_edge?.edge_points || 0;
  const homeEdge = market.home_edge?.edge_points || 0;
  const maxEdge = Math.max(awayEdge, homeEdge);
  const maxEdgeTeam = awayEdge >= homeEdge ? away_team.team_abbr : home_team.team_abbr;

  // Active risk calculation
  const awayRiskScore = risk.away?.score || 0;
  const homeRiskScore = risk.home?.score || 0;
  const activeRisk = homeRiskScore >= awayRiskScore ? risk.home : risk.away;

  // Format kickoff
  const formatKickoff = () => {
    try {
      const date = new Date(`${gameday}T${gametime}`);
      if (isNaN(date.getTime())) return { day: gameday, time: gametime };
      return {
        day: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      };
    } catch {
      return { day: gameday, time: gametime };
    }
  };

  const kickoff = formatKickoff();

  // Formatting spreads
  const formatSpread = (val: number) => {
    if (val === 0) return '0.0';
    return val > 0 ? `+${val.toFixed(1)}` : val.toFixed(1);
  };

  // Row highlight styles
  const isLargeEdge = maxEdge >= 2.0;
  const isPositiveEdge = maxEdge >= 0.5;

  return (
    <>
      <tr
        onClick={onToggleExpand}
        className={`
          group cursor-pointer transition-all border-b border-slate-100 select-none
          ${isExpanded ? 'bg-slate-900/5 font-semibold ring-1 ring-slate-300' : 'hover:bg-slate-50/80'}
          ${isLargeEdge ? 'bg-emerald-50/30' : ''}
        `}
      >
        {/* Away Team */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <TeamLogo abbr={away_team.team_abbr} name={away_team.team_name} size="md" />
            <div>
              <span className="font-extrabold text-sm text-slate-900 font-mono block">
                {away_team.team_abbr}
              </span>
              <span className="text-[10px] text-slate-500 font-medium truncate max-w-[120px] block">
                {away_team.team_name}
              </span>
            </div>
          </div>
        </td>

        {/* Home Team */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <TeamLogo abbr={home_team.team_abbr} name={home_team.team_name} size="md" />
            <div>
              <span className="font-extrabold text-sm text-slate-900 font-mono block">
                {home_team.team_abbr}
              </span>
              <span className="text-[10px] text-slate-500 font-medium truncate max-w-[120px] block">
                {home_team.team_name}
              </span>
            </div>
          </div>
        </td>

        {/* Kickoff */}
        <td className="px-4 py-3.5 font-mono text-xs text-slate-600">
          <div className="flex flex-col">
            <span className="font-bold text-slate-800">{kickoff.day}</span>
            <span className="text-[10px] text-slate-400">{kickoff.time}</span>
          </div>
        </td>

        {/* SemiSharp Spread */}
        <td className="px-4 py-3.5 font-mono text-xs font-black text-slate-900">
          <div className="flex items-center gap-1">
            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
              {semisharp_projection.projected_favorite_abbr}
            </span>
            <span>
              {semisharp_projection.projected_spread > 0
                ? `+${semisharp_projection.projected_spread.toFixed(1)}`
                : semisharp_projection.projected_spread.toFixed(1)}
            </span>
          </div>
        </td>

        {/* Consensus Spread */}
        <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-700">
          {market.away_consensus_spread < 0
            ? `${away_team.team_abbr} ${market.away_consensus_spread.toFixed(1)}`
            : `${home_team.team_abbr} ${market.home_consensus_spread.toFixed(1)}`}
        </td>

        {/* Edge Badge */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-slate-400 font-bold">{maxEdgeTeam}</span>
            <EdgeBadge value={maxEdge} />
          </div>
        </td>

        {/* Favorite */}
        <td className="px-4 py-3.5">
          <span className="text-xs font-mono font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
            {semisharp_projection.projected_favorite_abbr}
          </span>
        </td>

        {/* Risk Score */}
        <td className="px-4 py-3.5">
          <RiskDisplay score={activeRisk?.score ?? null} stars={activeRisk?.stars ?? null} />
        </td>

        {/* Books Count */}
        <td className="px-4 py-3.5 text-center font-mono text-xs text-slate-500">
          <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full text-[11px] inline-flex items-center gap-1">
            <Users className="w-3 h-3 text-slate-400" />
            {market.sportsbook_count}
          </span>
        </td>

        {/* Expand Action Button */}
        <td className="px-3 py-3.5 text-center">
          <button
            type="button"
            className={`
              inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap shadow-3xs
              ${isExpanded 
                ? 'bg-slate-900 text-emerald-400 border border-slate-700 hover:bg-slate-800' 
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 group-hover:border-emerald-300'
              }
            `}
            aria-label={isExpanded ? 'Hide Analysis' : 'View Analysis'}
          >
            <span>{isExpanded ? 'Hide Analysis' : 'View Analysis'}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            )}
          </button>
        </td>
      </tr>

      {/* Accordion Detail Panel */}
      {isExpanded && (
        <tr>
          <td colSpan={10} className="p-0 border-b border-slate-200">
            <ExpandableGamePanel gameId={game.game_id} fallbackGame={game} />
          </td>
        </tr>
      )}
    </>
  );
};
