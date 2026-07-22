/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface EdgeBadgeProps {
  value: number;
  className?: string;
}

export const EdgeBadge: React.FC<EdgeBadgeProps> = ({ value, className = '' }) => {
  // Format the decimal value
  const formattedValue = value.toFixed(1);
  const displayValue = value > 0 ? `+${formattedValue}` : formattedValue;

  // Define colors based on edge strength
  let colorClasses = '';
  
  if (value >= 0.5) {
    // Positive edge -> Green (#2ecc71)
    colorClasses = 'text-[#2ecc71] bg-[#2ecc71]/10 border-[#2ecc71]/20 font-bold';
  } else if (value <= -0.5) {
    // Negative edge -> Red (#e74c3c)
    colorClasses = 'text-[#e74c3c] bg-[#e74c3c]/10 border-[#e74c3c]/20 font-bold';
  } else {
    // Near zero -> Neutral gray
    colorClasses = 'text-slate-400 bg-slate-100 border-slate-200 font-medium';
  }

  return (
    <span 
      className={`inline-flex items-center justify-center px-2 py-1 rounded font-mono text-xs border ${colorClasses} ${className}`}
      aria-label={`Betting edge of ${displayValue} points`}
    >
      {displayValue}
    </span>
  );
};
