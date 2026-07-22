/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TeamInfo } from '../../types/analysis';
import { TeamLogo } from './TeamLogo';

interface ProjectedMarginGaugeProps {
  awayTeam: TeamInfo;
  homeTeam: TeamInfo;
  projectedHomeMargin: number;
  homeFieldPoints: number;
  powerRatingDiff: number;
  projectedFavoriteAbbr: string;
  projectedSpread: number;
  className?: string;
}

export const ProjectedMarginGauge: React.FC<ProjectedMarginGaugeProps> = ({
  awayTeam,
  homeTeam,
  projectedHomeMargin,
  homeFieldPoints,
  powerRatingDiff,
  projectedFavoriteAbbr,
  projectedSpread,
  className = '',
}) => {
  // Power rating widths (proportional to total)
  const awayRating = awayTeam.power_rating;
  const homeRating = homeTeam.power_rating;

  // Offset base for calculation
  const minVal = -10;
  const maxVal = 10;
  const normAway = Math.max(minVal, Math.min(maxVal, awayRating));
  const normHome = Math.max(minVal, Math.min(maxVal, homeRating));

  const totalRange = 30; // -10 to +20
  const awayPct = Math.max(15, Math.min(85, ((normAway + 10) / totalRange) * 100));
  const homePct = Math.max(15, Math.min(85, ((normHome + 10) / totalRange) * 100));

  // Margin gauge: projectedHomeMargin from -14 to +14
  const marginClamped = Math.max(-14, Math.min(14, projectedHomeMargin));
  const marginPct = ((marginClamped + 14) / 28) * 100;

  const isHomeFavorite = projectedHomeMargin > 0;
  const isAwayFavorite = projectedHomeMargin < 0;

  return (
    <div className={`p-5 bg-white border border-slate-100 rounded-xl space-y-6 shadow-2xs ${className}`}>
      {/* 1. Power Rating Bar Comparison */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono font-bold uppercase text-slate-500">
          <div className="flex items-center gap-2">
            <TeamLogo abbr={awayTeam.team_abbr} size="md" />
            <span>{awayTeam.team_abbr} Power ({awayRating >= 0 ? `+${awayRating.toFixed(2)}` : awayRating.toFixed(2)})</span>
          </div>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-extrabold">
            PFF POWER RATINGS
          </span>
          <div className="flex items-center gap-2">
            <span>{homeTeam.team_abbr} Power ({homeRating >= 0 ? `+${homeRating.toFixed(2)}` : homeRating.toFixed(2)})</span>
            <TeamLogo abbr={homeTeam.team_abbr} size="md" />
          </div>
        </div>

        {/* Dual Bar (increased height by ~20% from h-3 to h-4.5) */}
        <div className="grid grid-cols-2 gap-1.5 h-4.5 bg-slate-100 rounded-full p-0.5 overflow-hidden">
          <div className="flex justify-end items-center pr-1 bg-slate-200 rounded-l-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-l-full transition-all duration-500"
              style={{ width: `${awayPct}%` }}
            />
          </div>
          <div className="flex justify-start items-center pl-1 bg-slate-200 rounded-r-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-r-full transition-all duration-500"
              style={{ width: `${homePct}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
          <span>{awayTeam.team_name}</span>
          <span className="font-extrabold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
            Net Power Difference: {powerRatingDiff >= 0 ? `+${powerRatingDiff.toFixed(2)}` : powerRatingDiff.toFixed(2)} pts
          </span>
          <span>{homeTeam.team_name}</span>
        </div>
      </div>

      {/* 2. Projected Home Margin Gauge (increased height by ~50% from h-3 to h-7) */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-black text-slate-800 uppercase tracking-wider">
            Projected Margin & Spread Meter
          </span>
          <span className="text-xs font-mono font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200 shadow-2xs">
            Fav: {projectedFavoriteAbbr} ({projectedSpread > 0 ? `+${projectedSpread.toFixed(1)}` : projectedSpread.toFixed(1)})
          </span>
        </div>

        {/* Meter Track with Marker */}
        <div className="relative pt-7 pb-2">
          {/* Label callout floating above marker */}
          <div
            className="absolute top-0 transform -translate-x-1/2 transition-all duration-500 text-xs font-mono font-black px-3 py-1 rounded-md text-white shadow-md z-20 whitespace-nowrap"
            style={{
              left: `${marginPct}%`,
              backgroundColor: isHomeFavorite ? '#10b981' : isAwayFavorite ? '#6366f1' : '#64748b',
            }}
          >
            {projectedHomeMargin > 0
              ? `${homeTeam.team_abbr} +${projectedHomeMargin.toFixed(1)} pts`
              : `${awayTeam.team_abbr} +${Math.abs(projectedHomeMargin).toFixed(1)} pts`}
          </div>

          {/* Meter Track - Increased to h-7 (~50% height boost) */}
          <div className="relative w-full h-7 bg-slate-100 rounded-full border border-slate-300 shadow-inner overflow-visible">
            {/* Center Zero Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-slate-500 z-10" />

            {/* Range Bar from Center */}
            <div
              className={`absolute top-0 bottom-0 transition-all duration-500 ${
                isHomeFavorite ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-r-full' : 'bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-l-full'
              }`}
              style={{
                left: isHomeFavorite ? '50%' : `${marginPct}%`,
                width: `${Math.abs(marginPct - 50)}%`,
              }}
            />

            {/* Pointer Dot - Prominent 28px indicator */}
            <div
              className="absolute top-1/2 -mt-3.5 -ml-3.5 w-7 h-7 bg-white border-3 border-slate-900 rounded-full shadow-lg z-30 transition-all duration-500 flex items-center justify-center"
              style={{ left: `${marginPct}%` }}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${isHomeFavorite ? 'bg-emerald-600' : isAwayFavorite ? 'bg-indigo-600' : 'bg-slate-600'}`} />
            </div>
          </div>

          <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-2 font-bold">
            <span className="text-indigo-600">← {awayTeam.team_abbr} Fav (-14)</span>
            <span className="text-slate-600">EVEN (0.0)</span>
            <span className="text-emerald-600">{homeTeam.team_abbr} Fav (+14) →</span>
          </div>
        </div>

        {/* HFA Note */}
        <div className="flex items-center justify-between text-xs font-mono text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
          <span>Home Field Advantage Adjustment (HFA):</span>
          <span className="font-bold text-slate-900">+{homeFieldPoints.toFixed(1)} pts</span>
        </div>
      </div>
    </div>
  );
};
