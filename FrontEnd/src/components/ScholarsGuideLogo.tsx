import React, { useState } from 'react';

interface LogoProps {
  variant?: 'compact' | 'full' | 'icon-only';
  className?: string;
  iconClassName?: string;
}

export const ScholarsGuideLogo: React.FC<LogoProps> = ({
  variant = 'full',
  className = '',
  iconClassName = '',
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  // High-fidelity inline SVG fallback representing the logo asset:
  // - Gold stars, gold scales, slate/dark-grey book
  // - Premium gold typography
  const renderFallbackSvg = () => {
    if (variant === 'icon-only') {
      return (
        <svg
          viewBox="0 0 100 100"
          className={`h-10 w-10 shrink-0 ${iconClassName}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Three gold stars at the top */}
          <path d="M50 8l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5L50 8z" fill="#dfb443" />
          <path d="M32 15l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2 1.2-2.8z" fill="#dfb443" />
          <path d="M68 15l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2 1.2-2.8z" fill="#dfb443" />

          {/* Balance Scale in Gold */}
          {/* Center pillar */}
          <path d="M50 32v43" stroke="#dfb443" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M44 75h12" stroke="#dfb443" strokeWidth="3" strokeLinecap="round" />
          {/* Central ornament */}
          <circle cx="50" cy="32" r="3.5" fill="#dfb443" />
          <circle cx="50" cy="40" r="1.5" fill="#dfb443" stroke="#dfb443" strokeWidth="1" />
          {/* Crossbar */}
          <path d="M28 41.5q22-5 44 0" stroke="#dfb443" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          
          {/* Left Pan */}
          <path d="M28 41.5L20 58h16L28 41.5" stroke="#dfb443" strokeWidth="1" strokeLinejoin="round" fill="none" />
          <path d="M18 58.5h20" stroke="#dfb443" strokeWidth="2" strokeLinecap="round" />
          <path d="M21 59.5q7 4 14 0" stroke="#dfb443" strokeWidth="1.5" fill="none" />

          {/* Right Pan */}
          <path d="M72 41.5L64 58h16L72 41.5" stroke="#dfb443" strokeWidth="1" strokeLinejoin="round" fill="none" />
          <path d="M62 58.5h20" stroke="#dfb443" strokeWidth="2" strokeLinecap="round" />
          <path d="M65 59.5q7 4 14 0" stroke="#dfb443" strokeWidth="1.5" fill="none" />

          {/* Open Book in Charcoal Slate */}
          <path 
            d="M14 61q18 10 36 4M86 61q-18 10-36 4" 
            stroke="#1e293b" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            fill="none" 
          />
          <path 
            d="M14 62v14q18 11 36 5v-14" 
            stroke="#1e293b" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            fill="none" 
          />
          <path 
            d="M86 62v14q-18 11-36 5v-14" 
            stroke="#1e293b" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            fill="none" 
          />
          {/* Spine center marker */}
          <path d="M50 67v13" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    }

    if (variant === 'compact') {
      return (
        <div className={`flex items-center gap-3 ${className}`}>
          {/* Icon */}
          <div className="shrink-0">
            <svg
              viewBox="0 0 100 100"
              className="h-10 w-10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M50 8l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5L50 8z" fill="#dfb443" />
              <path d="M32 15l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2 1.2-2.8z" fill="#dfb443" />
              <path d="M68 15l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2 1.2-2.8z" fill="#dfb443" />

              <path d="M50 32v43" stroke="#dfb443" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M44 75h12" stroke="#dfb443" strokeWidth="3" strokeLinecap="round" />
              <circle cx="50" cy="32" r="3.5" fill="#dfb443" />
              <circle cx="50" cy="40" r="1.5" fill="#dfb443" stroke="#dfb443" strokeWidth="1" />
              <path d="M28 41.5q22-5 44 0" stroke="#dfb443" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              
              <path d="M28 41.5L20 58h16L28 41.5" stroke="#dfb443" strokeWidth="1" strokeLinejoin="round" fill="none" />
              <path d="M18 58.5h20" stroke="#dfb443" strokeWidth="2" strokeLinecap="round" />
              <path d="M21 59.5q7 4 14 0" stroke="#dfb443" strokeWidth="1.5" fill="none" />

              <path d="M72 41.5L64 58h16L72 41.5" stroke="#dfb443" strokeWidth="1" strokeLinejoin="round" fill="none" />
              <path d="M62 58.5h20" stroke="#dfb443" strokeWidth="2" strokeLinecap="round" />
              <path d="M65 59.5q7 4 14 0" stroke="#dfb443" strokeWidth="1.5" fill="none" />

              <path d="M14 61q18 10 36 4M86 61q-18 10-36 4" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              <path d="M14 62v14q18 11 36 5v-14" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M86 62v14q-18 11-36 5v-14" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M50 67v13" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>

          {/* Text Branding */}
          <div className="flex flex-col">
            <span className="font-serif font-black text-xs text-slate-900 tracking-wider uppercase leading-none">
              The Scholar's Guide
            </span>
            <span className="font-sans font-bold text-[10px] text-amber-600 tracking-widest uppercase leading-tight">
              to Sports Analytics
            </span>
            <span className="text-[8px] text-slate-400 font-medium font-sans">
              Powered by SemiSharp™
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className={`flex flex-col items-center text-center p-4 max-w-sm mx-auto ${className}`}>
        {/* Full layout: Top Icon, Bottom Text */}
        <div className="mb-3">
          <svg
            viewBox="0 0 100 100"
            className="h-20 w-20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M50 8l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5L50 8z" fill="#dfb443" />
            <path d="M32 15l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2 1.2-2.8z" fill="#dfb443" />
            <path d="M68 15l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2 1.2-2.8z" fill="#dfb443" />

            <path d="M50 32v43" stroke="#dfb443" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M44 75h12" stroke="#dfb443" strokeWidth="3" strokeLinecap="round" />
            <circle cx="50" cy="32" r="3.5" fill="#dfb443" />
            <circle cx="50" cy="40" r="1.5" fill="#dfb443" stroke="#dfb443" strokeWidth="1" />
            <path d="M28 41.5q22-5 44 0" stroke="#dfb443" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            
            <path d="M28 41.5L20 58h16L28 41.5" stroke="#dfb443" strokeWidth="1" strokeLinejoin="round" fill="none" />
            <path d="M18 58.5h20" stroke="#dfb443" strokeWidth="2" strokeLinecap="round" />
            <path d="M21 59.5q7 4 14 0" stroke="#dfb443" strokeWidth="1.5" fill="none" />

            <path d="M72 41.5L64 58h16L72 41.5" stroke="#dfb443" strokeWidth="1" strokeLinejoin="round" fill="none" />
            <path d="M62 58.5h20" stroke="#dfb443" strokeWidth="2" strokeLinecap="round" />
            <path d="M65 59.5q7 4 14 0" stroke="#dfb443" strokeWidth="1.5" fill="none" />

            <path d="M14 61q18 10 36 4M86 61q-18 10-36 4" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M14 62v14q18 11 36 5v-14" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M86 62v14q-18 11-36 5v-14" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M50 67v13" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>

        <h2 className="font-serif font-black text-lg text-slate-900 tracking-wider uppercase leading-none mb-1">
          The Scholar's Guide
        </h2>
        <h3 className="font-sans font-bold text-xs text-amber-600 tracking-widest uppercase mb-2">
          to Sports Analytics
        </h3>
        
        <div className="border-t border-slate-100 pt-2 mt-1 w-2/3">
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
            Powered by SemiSharp™
          </p>
          <p className="text-[9px] text-slate-400 font-medium mt-0.5">
            AI-Enhanced Decision Intelligence
          </p>
        </div>
      </div>
    );
  };

  if (imgFailed) {
    return renderFallbackSvg();
  }

  // Try to load the image asset first
  if (variant === 'icon-only') {
    return (
      <img
        src="/assets/scholars-guide-logo.png"
        alt="The Scholar's Guide Logo"
        onError={() => setImgFailed(true)}
        className={`h-10 w-auto shrink-0 object-contain ${iconClassName}`}
      />
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <img
          src="/assets/scholars-guide-logo.png"
          alt="The Scholar's Guide"
          onError={() => setImgFailed(true)}
          className="h-10 w-auto shrink-0 object-contain"
        />
        <div className="flex flex-col">
          <span className="font-serif font-black text-xs text-slate-900 tracking-wider uppercase leading-none">
            The Scholar's Guide
          </span>
          <span className="font-sans font-bold text-[10px] text-amber-600 tracking-widest uppercase leading-tight">
            to Sports Analytics
          </span>
          <span className="text-[8px] text-slate-400 font-medium font-sans">
            Powered by SemiSharp™
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center text-center p-4 max-w-sm mx-auto ${className}`}>
      <img
        src="/assets/scholars-guide-logo.png"
        alt="The Scholar's Guide"
        onError={() => setImgFailed(true)}
        className="h-20 w-auto object-contain mb-3"
      />
      <h2 className="font-serif font-black text-lg text-slate-900 tracking-wider uppercase leading-none mb-1">
        The Scholar's Guide
      </h2>
      <h3 className="font-sans font-bold text-xs text-amber-600 tracking-widest uppercase mb-2">
        to Sports Analytics
      </h3>
      
      <div className="border-t border-slate-100 pt-2 mt-1 w-2/3">
        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
          Powered by SemiSharp™
        </p>
        <p className="text-[9px] text-slate-400 font-medium mt-0.5">
          AI-Enhanced Decision Intelligence
        </p>
      </div>
    </div>
  );
};
