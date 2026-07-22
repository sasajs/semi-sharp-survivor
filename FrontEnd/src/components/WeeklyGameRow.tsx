/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameAnalysis } from '../types/analysis';
import { EdgeBadge } from './EdgeBadge';
import { RiskDisplay } from './RiskDisplay';
import { WeeklyGameDetail } from './WeeklyGameDetail';
import { ChevronDown, ChevronUp, Users } from 'lucide-react';

interface WeeklyGameRowProps {
  game: GameAnalysis;
}

export const WeeklyGameRow: React.FC<WeeklyGameRowProps> = ({ game }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    away_team,
    home_team,
    gameday,
    gametime,
    semisharp_projection,
    market,
    risk,
  } = game;

  // Format Kickoff Time for table scanning (e.g. "Sep 13, 8:20 PM" or "Sunday 8:20 PM")
  const formatTimeBrief = () => {
    try {
      const date = new Date(`${gameday}T${gametime}`);
      if (isNaN(date.getTime())) return `${gameday} ${gametime}`;
      
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
      const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      return `${dayOfWeek} ${timeStr}`;
    } catch {
      return `${gameday} ${gametime}`;
    }
  };

  // Format spreads
  const getSemiSharpSpreadStr = () => {
    const favAbbr = semisharp_projection.projected_favorite_abbr;
    const spread = semisharp_projection.projected_spread;
    
    if (!favAbbr || spread === null) return '—';
    const spreadFormatted = spread > 0 ? `+${spread.toFixed(1)}` : spread.toFixed(1);
    return `${favAbbr} ${spreadFormatted}`;
  };

  const getConsensusSpreadStr = () => {
    const awayCons = market.away_consensus_spread;
    const homeCons = market.home_consensus_spread;

    if (awayCons === null || homeCons === null) return '—';

    // Favorite is represented with the negative spread
    if (awayCons < 0) {
      return `${away_team.team_abbr} ${awayCons.toFixed(1)}`;
    } else if (homeCons < 0) {
      return `${home_team.team_abbr} ${homeCons.toFixed(1)}`;
    } else if (awayCons === 0 || homeCons === 0) {
      return 'PK';
    }
    
    // Fallback if both are positive (which shouldn't happen under normal line setups)
    return `${away_team.team_abbr} +${awayCons.toFixed(1)}`;
  };

  // Find active team edge
  const getActiveEdge = () => {
    const awayEdge = market.away_edge?.edge_points || 0;
    const homeEdge = market.home_edge?.edge_points || 0;
    
    // Choose the team with the higher positive edge, or whichever is larger
    if (awayEdge >= homeEdge) {
      return { team: away_team.team_abbr, val: awayEdge };
    } else {
      return { team: home_team.team_abbr, val: homeEdge };
    }
  };

  // Determine active risk to show in the high-level row
  const getActiveRisk = () => {
    if (risk.home?.score !== null && risk.home?.score !== undefined) {
      return { team: home_team.team_abbr, ...risk.home };
    }
    if (risk.away?.score !== null && risk.away?.score !== undefined) {
      return { team: away_team.team_abbr, ...risk.away };
    }
    return null;
  };

  const activeEdge = getActiveEdge();
  const activeRisk = getActiveRisk();

  return (
    <>
      <tr 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          hover:bg-slate-50/70 border-b border-slate-100 transition-all cursor-pointer select-none
          ${isExpanded ? 'bg-indigo-50/10 font-medium' : ''}
        `}
        id={`row_game_${game.game_id}`}
      >
        {/* Away Team Column */}
        <td className="px-4 py-3.5 font-sans">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-white flex items-center justify-center font-mono font-bold text-xs shadow-3xs shrink-0">
              {away_team.team_abbr}
            </div>
            <div className="flex flex-col truncate">
              <span className="font-bold text-slate-800 text-sm leading-tight">{away_team.team_abbr}</span>
              <span className="text-[10px] text-slate-400 font-medium leading-none mt-1">{away_team.team_name}</span>
            </div>
          </div>
        </td>

        {/* Home Team Column */}
        <td className="px-4 py-3.5 font-sans">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-mono font-bold text-xs shadow-3xs shrink-0">
              {home_team.team_abbr}
            </div>
            <div className="flex flex-col truncate">
              <span className="font-bold text-slate-800 text-sm leading-tight">{home_team.team_abbr}</span>
              <span className="text-[10px] text-slate-400 font-medium leading-none mt-1">{home_team.team_name}</span>
            </div>
          </div>
        </td>

        {/* Kickoff Time Column */}
        <td className="px-4 py-3.5 font-mono text-xs text-slate-500 font-medium whitespace-nowrap">
          {formatTimeBrief()}
        </td>

        {/* SemiSharp Spread Column */}
        <td className="px-4 py-3.5 font-mono text-xs text-slate-800 font-bold whitespace-nowrap">
          {getSemiSharpSpreadStr()}
        </td>

        {/* Consensus Spread Column */}
        <td className="px-4 py-3.5 font-mono text-xs text-slate-600 font-semibold whitespace-nowrap">
          {getConsensusSpreadStr()}
        </td>

        {/* Edge Column */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-[10px] text-slate-400 font-mono font-bold">{activeEdge.team}</span>
            <EdgeBadge value={activeEdge.val} />
          </div>
        </td>

        {/* Risk Column */}
        <td className="px-4 py-3.5">
          {activeRisk ? (
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-[10px] text-slate-400 font-mono font-bold">{activeRisk.team}</span>
              <RiskDisplay score={activeRisk.score} stars={activeRisk.stars} />
            </div>
          ) : (
            <span className="text-slate-300 font-mono text-xs">—</span>
          )}
        </td>

        {/* Sportsbook Count Column */}
        <td className="px-4 py-3.5 text-center font-mono text-xs text-slate-500 font-medium">
          <div className="inline-flex items-center gap-1 bg-slate-100/60 border border-slate-200/40 px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-600">
            <Users className="w-2.5 h-2.5 shrink-0" />
            <span>{market.sportsbook_count}</span>
          </div>
        </td>

        {/* Expand Action Column */}
        <td className="px-4 py-3.5 text-center">
          <button 
            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label={isExpanded ? "Collapse game analysis details" : "Expand game analysis details"}
            id={`btn_expand_game_${game.game_id}`}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </td>
      </tr>

      {/* Expanded Details Row */}
      {isExpanded && (
        <tr>
          <td colSpan={9} className="p-0 border-none">
            <WeeklyGameDetail game={game} />
          </td>
        </tr>
      )}
    </>
  );
};
