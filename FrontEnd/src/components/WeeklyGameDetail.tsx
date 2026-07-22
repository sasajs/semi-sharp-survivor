/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameAnalysis } from '../types/analysis';
import { SportsbookTable } from './SportsbookTable';
import { EdgeBadge } from './EdgeBadge';
import { RiskDisplay } from './RiskDisplay';
import { Calendar, Tag, HardDrive, Info, Activity } from 'lucide-react';

interface WeeklyGameDetailProps {
  game: GameAnalysis;
}

export const WeeklyGameDetail: React.FC<WeeklyGameDetailProps> = ({ game }) => {
  const {
    game_id,
    gameday,
    gametime,
    away_team,
    home_team,
    semisharp_projection,
    market,
    risk,
  } = game;

  // Format Kickoff Date/Time
  const formatKickoff = () => {
    try {
      const date = new Date(`${gameday}T${gametime}`);
      if (isNaN(date.getTime())) return `${gameday} ${gametime}`;
      
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return `${gameday} ${gametime}`;
    }
  };

  const formatSpread = (val: number) => {
    if (val === 0) return '0.0';
    return val > 0 ? `+${val.toFixed(1)}` : val.toFixed(1);
  };

  // Calculate SemiSharp Spreads from home margin
  const homeMargin = semisharp_projection.projected_home_margin;
  const homeSpread = homeMargin;
  const awaySpread = -homeMargin;

  return (
    <div className="bg-slate-50/50 p-6 rounded-b-xl border-t border-slate-100 space-y-6">
      {/* Top Metadata Row: Game Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-100">
        {/* Kickoff */}
        <div className="flex items-start gap-2.5">
          <Calendar className="w-4.5 h-4.5 text-slate-400 mt-0.5" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-bold">Kickoff</span>
            <span className="text-xs font-semibold text-slate-800">{formatKickoff()}</span>
          </div>
        </div>

        {/* Game ID */}
        <div className="flex items-start gap-2.5">
          <Tag className="w-4.5 h-4.5 text-slate-400 mt-0.5" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-bold">Game ID</span>
            <span className="text-xs font-mono font-semibold text-slate-800">{game_id}</span>
          </div>
        </div>

        {/* Projection Source */}
        <div className="flex items-start gap-2.5">
          <HardDrive className="w-4.5 h-4.5 text-slate-400 mt-0.5" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-bold">Projection Model</span>
            <span className="text-xs font-mono font-semibold text-slate-800">
              {semisharp_projection.source_system || '—'}
            </span>
          </div>
        </div>

        {/* Latest Market Snapshot */}
        <div className="flex items-start gap-2.5">
          <Activity className="w-4.5 h-4.5 text-slate-400 mt-0.5" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-bold">Latest Odds Sync</span>
            <span className="text-xs font-mono font-semibold text-slate-800 truncate">
              {market.latest_snapshot ? new Date(market.latest_snapshot).toLocaleTimeString() : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Side by Side Team Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Away Team Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 flex flex-col justify-between space-y-4 shadow-3xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-mono font-extrabold text-sm text-slate-900 bg-slate-100 border border-slate-200 rounded px-2 py-0.5">
                {away_team.team_abbr}
              </span>
              <span className="font-semibold text-sm text-slate-800">{away_team.team_name}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">AWAY</span>
          </div>

          <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs">
            {/* SemiSharp Spread */}
            <div className="flex flex-col">
              <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">SemiSharp Spread</span>
              <span className="font-mono font-bold text-slate-800 mt-1">
                {away_team.team_abbr} {formatSpread(awaySpread)}
              </span>
            </div>

            {/* Consensus Spread */}
            <div className="flex flex-col">
              <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">Market Consensus</span>
              <span className="font-mono font-bold text-slate-800 mt-1">
                {away_team.team_abbr} {formatSpread(market.away_consensus_spread)}
              </span>
            </div>

            {/* Edge */}
            <div className="flex flex-col">
              <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider mb-1">Spread Edge</span>
              <EdgeBadge value={market.away_edge?.edge_points || 0} className="w-16 h-6 shrink-0" />
            </div>

            {/* Risk */}
            <div className="flex flex-col">
              <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider mb-1">Safety Risk</span>
              <RiskDisplay score={risk.away?.score} stars={risk.away?.stars} className="h-6 shrink-0" />
            </div>
          </div>
        </div>

        {/* Home Team Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 flex flex-col justify-between space-y-4 shadow-3xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-mono font-extrabold text-sm text-slate-900 bg-slate-100 border border-slate-200 rounded px-2 py-0.5">
                {home_team.team_abbr}
              </span>
              <span className="font-semibold text-sm text-slate-800">{home_team.team_name}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">HOME</span>
          </div>

          <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs">
            {/* SemiSharp Spread */}
            <div className="flex flex-col">
              <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">SemiSharp Spread</span>
              <span className="font-mono font-bold text-slate-800 mt-1">
                {home_team.team_abbr} {formatSpread(homeSpread)}
              </span>
            </div>

            {/* Consensus Spread */}
            <div className="flex flex-col">
              <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">Market Consensus</span>
              <span className="font-mono font-bold text-slate-800 mt-1">
                {home_team.team_abbr} {formatSpread(market.home_consensus_spread)}
              </span>
            </div>

            {/* Edge */}
            <div className="flex flex-col">
              <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider mb-1">Spread Edge</span>
              <EdgeBadge value={market.home_edge?.edge_points || 0} className="w-16 h-6 shrink-0" />
            </div>

            {/* Risk */}
            <div className="flex flex-col">
              <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider mb-1">Safety Risk</span>
              <RiskDisplay score={risk.home?.score} stars={risk.home?.stars} className="h-6 shrink-0" />
            </div>
          </div>
        </div>
      </div>

      {/* Sportsbooks Table Panel */}
      <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            Sportsbook Odds Registry ({market.sportsbooks?.length || 0} Books)
          </span>
          <span className="text-[10px] font-mono text-slate-400 font-medium">Read-Only</span>
        </div>
        <SportsbookTable sportsbooks={market.sportsbooks || []} />
      </div>
    </div>
  );
};
