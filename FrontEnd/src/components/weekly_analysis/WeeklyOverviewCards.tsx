/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { GameAnalysis } from '../../types/analysis';
import { TeamLogo } from './TeamLogo';
import { EdgeBadge } from '../EdgeBadge';
import { RiskDisplay } from '../RiskDisplay';
import { TrendingUp, AlertTriangle, Scale, BarChart2, ChevronRight } from 'lucide-react';

interface WeeklyOverviewCardsProps {
  games: GameAnalysis[];
  onExpandGame: (gameId: string) => void;
  expandedGameId: string | null;
}

export const WeeklyOverviewCards: React.FC<WeeklyOverviewCardsProps> = ({
  games,
  onExpandGame,
  expandedGameId,
}) => {
  const highlights = useMemo(() => {
    if (!games || games.length === 0) return null;

    // 1. Largest Edge
    let maxEdgeVal = -999;
    let maxEdgeGame: GameAnalysis | null = null;
    let maxEdgeTeam = '';

    // 2. Highest Risk
    let maxRiskScore = -1;
    let maxRiskGame: GameAnalysis | null = null;
    let maxRiskTeam = '';

    // 3. Closest Game (smallest spread absolute value)
    let minSpreadAbs = 999;
    let closestGame: GameAnalysis | null = null;

    // 4. Largest Consensus Variance / Spread Difference
    let maxSpreadDiff = -1;
    let maxDiffGame: GameAnalysis | null = null;

    games.forEach((game) => {
      // 1. Edge
      const awayEdge = game.market.away_edge?.edge_points || 0;
      const homeEdge = game.market.home_edge?.edge_points || 0;
      if (awayEdge > maxEdgeVal) {
        maxEdgeVal = awayEdge;
        maxEdgeGame = game;
        maxEdgeTeam = game.away_team.team_abbr;
      }
      if (homeEdge > maxEdgeVal) {
        maxEdgeVal = homeEdge;
        maxEdgeGame = game;
        maxEdgeTeam = game.home_team.team_abbr;
      }

      // 2. Risk
      const awayRiskScore = game.risk.away?.score || 0;
      const homeRiskScore = game.risk.home?.score || 0;
      if (awayRiskScore > maxRiskScore) {
        maxRiskScore = awayRiskScore;
        maxRiskGame = game;
        maxRiskTeam = game.away_team.team_abbr;
      }
      if (homeRiskScore > maxRiskScore) {
        maxRiskScore = homeRiskScore;
        maxRiskGame = game;
        maxRiskTeam = game.home_team.team_abbr;
      }

      // 3. Closest Game
      const semisharpSpreadAbs = Math.abs(game.semisharp_projection.projected_spread);
      if (semisharpSpreadAbs < minSpreadAbs) {
        minSpreadAbs = semisharpSpreadAbs;
        closestGame = game;
      }

      // 4. Spread difference (Market vs SemiSharp)
      const consAway = Math.abs(game.market.away_consensus_spread);
      const projSpread = Math.abs(game.semisharp_projection.projected_spread);
      const diff = Math.abs(consAway - projSpread);
      if (diff > maxSpreadDiff) {
        maxSpreadDiff = diff;
        maxDiffGame = game;
      }
    });

    return {
      maxEdgeGame,
      maxEdgeVal,
      maxEdgeTeam,
      maxRiskGame,
      maxRiskScore,
      maxRiskTeam,
      closestGame,
      minSpreadAbs,
      maxDiffGame,
      maxSpreadDiff,
    };
  }, [games]);

  if (!highlights || games.length === 0) return null;

  const {
    maxEdgeGame,
    maxEdgeVal,
    maxEdgeTeam,
    maxRiskGame,
    maxRiskScore,
    maxRiskTeam,
    closestGame,
    minSpreadAbs,
    maxDiffGame,
    maxSpreadDiff,
  } = highlights;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* CARD 1: LARGEST EDGE */}
      {maxEdgeGame && (
        <div
          onClick={() => onExpandGame(maxEdgeGame!.game_id)}
          className={`
            group relative p-2.5 rounded-xl border transition-all cursor-pointer bg-white shadow-3xs hover:shadow-md hover:border-emerald-300
            ${expandedGameId === maxEdgeGame.game_id ? 'ring-2 ring-emerald-500 border-emerald-400' : 'border-slate-200'}
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-emerald-600 font-mono text-[10px] uppercase font-bold tracking-wider">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Largest Value Edge</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
          </div>

          <div className="mt-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TeamLogo abbr={maxEdgeTeam} size="sm" />
              <div>
                <span className="text-xs font-black font-mono text-slate-900 block leading-tight">
                  {maxEdgeTeam}
                </span>
                <span className="text-[9px] text-slate-400 font-mono">
                  {maxEdgeGame.away_team.team_abbr} @ {maxEdgeGame.home_team.team_abbr}
                </span>
              </div>
            </div>
            <EdgeBadge value={maxEdgeVal} />
          </div>

          <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>Projection:</span>
            <span className="font-bold text-slate-900">
              {maxEdgeGame.semisharp_projection.projected_favorite_abbr}{' '}
              {maxEdgeGame.semisharp_projection.projected_spread > 0
                ? `+${maxEdgeGame.semisharp_projection.projected_spread.toFixed(1)}`
                : maxEdgeGame.semisharp_projection.projected_spread.toFixed(1)}
            </span>
          </div>
        </div>
      )}

      {/* CARD 2: HIGHEST RISK GAME */}
      {maxRiskGame && (
        <div
          onClick={() => onExpandGame(maxRiskGame!.game_id)}
          className={`
            group relative p-2.5 rounded-xl border transition-all cursor-pointer bg-white shadow-3xs hover:shadow-md hover:border-amber-300
            ${expandedGameId === maxRiskGame.game_id ? 'ring-2 ring-amber-500 border-amber-400' : 'border-slate-200'}
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-amber-600 font-mono text-[10px] uppercase font-bold tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Highest Risk Score</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
          </div>

          <div className="mt-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TeamLogo abbr={maxRiskTeam} size="sm" />
              <div>
                <span className="text-xs font-black font-mono text-slate-900 block leading-tight">
                  {maxRiskTeam}
                </span>
                <span className="text-[9px] text-slate-400 font-mono">
                  {maxRiskGame.away_team.team_abbr} @ {maxRiskGame.home_team.team_abbr}
                </span>
              </div>
            </div>
            <RiskDisplay score={maxRiskScore} stars={Math.min(5, Math.round(maxRiskScore / 4))} />
          </div>

          <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>Risk Level:</span>
            <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 uppercase">
              {maxRiskGame.risk.home?.level || maxRiskGame.risk.away?.level || 'ELEVATED'}
            </span>
          </div>
        </div>
      )}

      {/* CARD 3: CLOSEST MATCHUP */}
      {closestGame && (
        <div
          onClick={() => onExpandGame(closestGame!.game_id)}
          className={`
            group relative p-2.5 rounded-xl border transition-all cursor-pointer bg-white shadow-3xs hover:shadow-md hover:border-indigo-300
            ${expandedGameId === closestGame.game_id ? 'ring-2 ring-indigo-500 border-indigo-400' : 'border-slate-200'}
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-indigo-600 font-mono text-[10px] uppercase font-bold tracking-wider">
              <Scale className="w-3.5 h-3.5" />
              <span>Closest Spread Line</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
          </div>

          <div className="mt-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TeamLogo abbr={closestGame.away_team.team_abbr} size="sm" />
              <span className="text-[11px] font-bold font-mono text-slate-900">
                {closestGame.away_team.team_abbr} @ {closestGame.home_team.team_abbr}
              </span>
              <TeamLogo abbr={closestGame.home_team.team_abbr} size="sm" />
            </div>
            <span className="font-mono text-[11px] font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
              {minSpreadAbs === 0 ? 'PICK' : `${closestGame.semisharp_projection.projected_favorite_abbr} -${minSpreadAbs.toFixed(1)}`}
            </span>
          </div>

          <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>Consensus:</span>
            <span className="font-bold text-slate-900">
              {closestGame.market.away_consensus_spread < 0
                ? `${closestGame.away_team.team_abbr} ${closestGame.market.away_consensus_spread.toFixed(1)}`
                : `${closestGame.home_team.team_abbr} ${closestGame.market.home_consensus_spread.toFixed(1)}`}
            </span>
          </div>
        </div>
      )}

      {/* CARD 4: LARGEST CONSENSUS VARIANCE */}
      {maxDiffGame && (
        <div
          onClick={() => onExpandGame(maxDiffGame!.game_id)}
          className={`
            group relative p-2.5 rounded-xl border transition-all cursor-pointer bg-white shadow-3xs hover:shadow-md hover:border-purple-300
            ${expandedGameId === maxDiffGame.game_id ? 'ring-2 ring-purple-500 border-purple-400' : 'border-slate-200'}
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-purple-600 font-mono text-[10px] uppercase font-bold tracking-wider">
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Largest Line Variance</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
          </div>

          <div className="mt-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TeamLogo abbr={maxDiffGame.away_team.team_abbr} size="sm" />
              <span className="text-[11px] font-bold font-mono text-slate-900">
                {maxDiffGame.away_team.team_abbr} @ {maxDiffGame.home_team.team_abbr}
              </span>
              <TeamLogo abbr={maxDiffGame.home_team.team_abbr} size="sm" />
            </div>
            <span className="font-mono text-[11px] font-black text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
              Δ {maxSpreadDiff.toFixed(1)} pts
            </span>
          </div>

          <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>Books:</span>
            <span className="font-bold text-slate-900">
              {maxDiffGame.market.sportsbook_count} Active Books
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
