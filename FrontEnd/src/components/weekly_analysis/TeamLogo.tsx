/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

interface TeamLogoProps {
  abbr: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const TeamLogo: React.FC<TeamLogoProps> = ({
  abbr,
  name,
  size = 'md',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  const cleanAbbr = (abbr || 'NFL').toUpperCase();

  // Size mapping
  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-11 h-11 text-sm',
    xl: 'w-16 h-16 text-base',
  };

  const imgSizes = {
    sm: 24,
    md: 32,
    lg: 44,
    xl: 64,
  };

  // ESPN CDN image URL format
  // Normalize abbreviations like WSH/WAS, LA/LAR, etc if needed
  let espnAbbr = cleanAbbr.toLowerCase();
  if (espnAbbr === 'was') espnAbbr = 'wsh';
  if (espnAbbr === 'lar') espnAbbr = 'la';

  const logoUrl = `https://a.espncdn.com/i/teamlogos/nfl/500/${espnAbbr}.png`;

  if (hasError) {
    return (
      <div
        className={`inline-flex items-center justify-center font-mono font-black rounded-lg bg-slate-900 text-white shadow-3xs shrink-0 select-none ${sizeClasses[size]} ${className}`}
        title={name || cleanAbbr}
      >
        {cleanAbbr.slice(0, 3)}
      </div>
    );
  }

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${sizeClasses[size]} ${className}`}>
      <img
        src={logoUrl}
        alt={name || `${cleanAbbr} Logo`}
        width={imgSizes[size]}
        height={imgSizes[size]}
        className="w-full h-full object-contain drop-shadow-xs"
        onError={() => setHasError(true)}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
