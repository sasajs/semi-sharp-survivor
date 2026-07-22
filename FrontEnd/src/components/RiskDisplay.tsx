/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface RiskDisplayProps {
  score: number | null;
  stars: number | null;
  className?: string;
}

export const RiskDisplay: React.FC<RiskDisplayProps> = ({ score, stars, className = '' }) => {
  if (score === null && stars === null) {
    return <span className="text-slate-300 font-mono">—</span>;
  }

  // Fallback star calculation: map a 0-20 score to a 0-5 scale if stars is missing
  const activeStars = stars !== null 
    ? stars 
    : Math.min(5, Math.max(0, Math.round((score || 0) / 4)));

  return (
    <div 
      className={`inline-flex items-center gap-1.5 ${className}`}
      aria-label={`Risk score: ${score !== null ? score.toFixed(1) : 'N/A'}. Stars: ${activeStars} of 5.`}
    >
      {/* 5 Star Rating System */}
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, idx) => {
          const isFilled = idx < activeStars;
          return (
            <span 
              key={idx} 
              className={`text-sm select-none leading-none ${isFilled ? 'text-[#f1c40f]' : 'text-slate-200'}`}
            >
              ★
            </span>
          );
        })}
      </div>

      {/* Numeric display */}
      {score !== null && (
        <span className="font-mono font-bold text-xs text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-150">
          {score.toFixed(1)}
        </span>
      )}
    </div>
  );
};
