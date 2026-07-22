/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, Flame } from 'lucide-react';

interface RiskGaugeProps {
  score: number | null;
  stars: number | null;
  level: string | null;
  factorCount: number | null;
  className?: string;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({
  score,
  stars,
  level,
  factorCount,
  className = '',
}) => {
  const safeScore = score ?? 0;
  const safeStars = stars ?? (score !== null ? Math.min(5, Math.max(0, Math.round(score / 4))) : 0);
  const normalizedLevel = (level || 'LOW').toUpperCase();

  // Percentage for progress meter (0 to 20 scale)
  const percentage = Math.min(100, Math.max(0, (safeScore / 20) * 100));

  // Determine color theme
  let levelColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';
  let barColor = 'bg-emerald-500';
  let levelLabel = 'LOW RISK';
  let Icon = CheckCircle2;

  if (normalizedLevel === 'MEDIUM' || (safeScore >= 5 && safeScore < 10)) {
    levelColor = 'text-amber-700 bg-amber-50 border-amber-200';
    barColor = 'bg-amber-500';
    levelLabel = 'MEDIUM RISK';
    Icon = AlertTriangle;
  } else if (normalizedLevel === 'HIGH' || (safeScore >= 10 && safeScore < 15)) {
    levelColor = 'text-orange-700 bg-orange-50 border-orange-200';
    barColor = 'bg-orange-500';
    levelLabel = 'HIGH RISK';
    Icon = ShieldAlert;
  } else if (normalizedLevel === 'VERY HIGH' || safeScore >= 15) {
    levelColor = 'text-rose-700 bg-rose-50 border-rose-200';
    barColor = 'bg-rose-600';
    levelLabel = 'VERY HIGH RISK';
    Icon = Flame;
  }

  return (
    <div className={`p-4 bg-slate-900 rounded-xl text-white space-y-4 shadow-sm border border-slate-800 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-slate-300" />
          <span className="text-xs font-mono font-black uppercase tracking-wider text-slate-300">
            Hazard Assessment Meter
          </span>
        </div>
        <span className={`text-[10px] font-mono font-extrabold px-2.5 py-1 rounded-md border uppercase tracking-wider ${levelColor}`}>
          {levelLabel}
        </span>
      </div>

      {/* Main Score Display & Stars */}
      <div className="flex items-end justify-between">
        <div>
          <div className="text-3xl font-black font-mono tracking-tight text-white flex items-baseline gap-1">
            {score !== null ? score.toFixed(1) : '0.0'}
            <span className="text-xs text-slate-400 font-normal">/ 20.0</span>
          </div>
          <p className="text-[10px] font-mono text-slate-400 mt-0.5">
            Composite Risk Index • {factorCount ?? 0} active hazard factors
          </p>
        </div>

        {/* Stars */}
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={`text-lg leading-none ${
                  i < safeStars ? 'text-amber-400' : 'text-slate-700'
                }`}
              >
                ★
              </span>
            ))}
          </div>
          <span className="text-[10px] font-mono text-slate-400 mt-1">
            {safeStars} of 5 Stars
          </span>
        </div>
      </div>

      {/* Horizontal Multi-Segment Risk Meter Track (Green, Yellow, Orange, Red) */}
      <div className="space-y-2">
        <div className="relative w-full h-5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-700 shadow-inner">
          {/* Background Multi-Color Gradient Track (Green -> Yellow -> Orange -> Red) */}
          <div className="absolute inset-0.5 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 via-orange-500 to-rose-600 opacity-30" />
          
          {/* Active Filled Bar */}
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${Math.max(5, percentage)}%` }}
          />

          {/* Indicator Dot */}
          <div
            className="absolute top-1/2 -mt-2.5 -ml-2.5 w-5 h-5 bg-white border-2 border-slate-950 rounded-full shadow-md z-10 transition-all duration-500 flex items-center justify-center"
            style={{ left: `${percentage}%` }}
          >
            <div className={`w-2 h-2 rounded-full ${barColor}`} />
          </div>
        </div>

        {/* Color Legend Labels */}
        <div className="flex justify-between text-[10px] font-mono text-slate-400 font-bold px-1">
          <span className="text-emerald-400">0.0 (Low)</span>
          <span className="text-amber-400">5.0 (Medium)</span>
          <span className="text-orange-400">10.0 (High)</span>
          <span className="text-rose-400">15.0+ (Extreme)</span>
        </div>
      </div>
    </div>
  );
};
