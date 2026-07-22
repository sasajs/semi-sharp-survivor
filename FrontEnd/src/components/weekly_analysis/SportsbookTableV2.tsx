/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { BookmakerLine, MarketInfo } from '../../types/analysis';
import { Clock, ShieldAlert, Award, TrendingUp, Layers } from 'lucide-react';

interface SportsbookTableV2Props {
  sportsbooks: BookmakerLine[];
  market: MarketInfo;
  favoriteAbbr: string;
  awayAbbr: string;
  homeAbbr: string;
}

export const SportsbookTableV2: React.FC<SportsbookTableV2Props> = ({
  sportsbooks,
  market,
  favoriteAbbr,
  awayAbbr,
  homeAbbr,
}) => {
  // Format price helper (e.g. -110 or +105)
  const formatPrice = (price: number) => {
    if (price > 0) return `+${price}`;
    return price.toString();
  };

  const formatSpread = (val: number) => {
    if (val === 0) return '0.0';
    return val > 0 ? `+${val.toFixed(1)}` : val.toFixed(1);
  };

  const formatSnapshotTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      if (isNaN(date.getTime())) return timeStr;
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return timeStr;
    }
  };

  // Compute highlights: Best favorite price, Best underdog price, Largest line difference
  const highlights = useMemo(() => {
    if (!sportsbooks || sportsbooks.length === 0) {
      return { bestFavKey: null, bestDogKey: null, largestDiffKey: null };
    }

    const isHomeFavorite = market.home_consensus_spread < 0;

    let bestFavPrice = -9999;
    let bestFavKey: string | null = null;

    let bestDogPrice = -9999;
    let bestDogKey: string | null = null;

    let maxLineDiff = -1;
    let largestDiffKey: string | null = null;

    sportsbooks.forEach((book) => {
      // Favorite price & Underdog price
      const favPrice = isHomeFavorite ? book.home_price : book.away_price;
      const dogPrice = isHomeFavorite ? book.away_price : book.home_price;

      if (favPrice > bestFavPrice) {
        bestFavPrice = favPrice;
        bestFavKey = book.bookmaker_key;
      }

      if (dogPrice > bestDogPrice) {
        bestDogPrice = dogPrice;
        bestDogKey = book.bookmaker_key;
      }

      // Line difference from consensus
      const spread = isHomeFavorite ? book.home_spread : book.away_spread;
      const consSpread = isHomeFavorite ? market.home_consensus_spread : market.away_consensus_spread;
      const diff = Math.abs(spread - consSpread);

      if (diff > maxLineDiff) {
        maxLineDiff = diff;
        largestDiffKey = book.bookmaker_key;
      }
    });

    return { bestFavKey, bestDogKey, largestDiffKey, maxLineDiff };
  }, [sportsbooks, market]);

  if (!sportsbooks || sportsbooks.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
        <Layers className="w-8 h-8 text-slate-300 mx-auto" />
        <p className="text-xs font-mono font-bold text-slate-500">No active sportsbook lines registered</p>
        <p className="text-[11px] text-slate-400">
          Sportsbook lines for this matchup are currently pending or offline in Las Vegas consensus feeds.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Highlights Legend Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Best Favorite Price */}
        <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200/80 rounded-lg text-emerald-800 text-xs">
          <Award className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[9px] font-mono font-extrabold uppercase text-emerald-700">
              Best Favorite Price ({favoriteAbbr})
            </span>
            <span className="font-bold font-mono">
              {highlights.bestFavKey
                ? sportsbooks.find(b => b.bookmaker_key === highlights.bestFavKey)?.bookmaker_title
                : '—'}
            </span>
          </div>
        </div>

        {/* Best Underdog Price */}
        <div className="flex items-center gap-2 p-2.5 bg-indigo-50 border border-indigo-200/80 rounded-lg text-indigo-800 text-xs">
          <TrendingUp className="w-4 h-4 text-indigo-600 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[9px] font-mono font-extrabold uppercase text-indigo-700">
              Best Underdog Price
            </span>
            <span className="font-bold font-mono">
              {highlights.bestDogKey
                ? sportsbooks.find(b => b.bookmaker_key === highlights.bestDogKey)?.bookmaker_title
                : '—'}
            </span>
          </div>
        </div>

        {/* Largest Line Difference */}
        <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200/80 rounded-lg text-amber-800 text-xs">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[9px] font-mono font-extrabold uppercase text-amber-700">
              Largest Line Difference
            </span>
            <span className="font-bold font-mono">
              {highlights.largestDiffKey
                ? `${sportsbooks.find(b => b.bookmaker_key === highlights.largestDiffKey)?.bookmaker_title} (${highlights.maxLineDiff.toFixed(1)} pts)`
                : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Sportsbooks Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-3xs">
        <table className="min-w-full divide-y divide-slate-150 text-left table-fixed">
          <thead className="bg-slate-900 text-[10px] uppercase font-bold text-slate-300 tracking-wider font-mono">
            <tr>
              <th className="px-4 py-3.5 w-[24%]">Sportsbook</th>
              <th className="px-4 py-3.5 text-center w-[18%]">{awayAbbr} Spread</th>
              <th className="px-4 py-3.5 text-center w-[16%]">{awayAbbr} Price</th>
              <th className="px-4 py-3.5 text-center w-[18%]">{homeAbbr} Spread</th>
              <th className="px-4 py-3.5 text-center w-[16%]">{homeAbbr} Price</th>
              <th className="px-4 py-3.5 text-center w-[16%]">Updated</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs text-slate-800 font-sans">
            {sportsbooks.map((book) => {
              const isBestFav = book.bookmaker_key === highlights.bestFavKey;
              const isBestDog = book.bookmaker_key === highlights.bestDogKey;
              const isMaxDiff = book.bookmaker_key === highlights.largestDiffKey;

              return (
                <tr
                  key={book.bookmaker_key}
                  className={`hover:bg-slate-50 transition-colors ${
                    isBestFav || isBestDog || isMaxDiff ? 'bg-slate-50/70 font-medium' : ''
                  }`}
                >
                  {/* Sportsbook Title */}
                  <td className="px-4 py-3 font-semibold text-slate-900 truncate">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span>{book.bookmaker_title}</span>
                      {isBestFav && (
                        <span className="text-[9px] font-mono bg-emerald-100 text-emerald-800 border border-emerald-300 font-black px-1.5 py-0.5 rounded uppercase">
                          Best Fav
                        </span>
                      )}
                      {isBestDog && (
                        <span className="text-[9px] font-mono bg-indigo-100 text-indigo-800 border border-indigo-300 font-black px-1.5 py-0.5 rounded uppercase">
                          Best Dog
                        </span>
                      )}
                      {isMaxDiff && (
                        <span className="text-[9px] font-mono bg-amber-100 text-amber-800 border border-amber-300 font-black px-1.5 py-0.5 rounded uppercase">
                          Largest Diff
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Away Spread */}
                  <td className="px-4 py-3 text-center font-mono font-bold text-slate-800">
                    {formatSpread(book.away_spread)}
                  </td>

                  {/* Away Price */}
                  <td
                    className={`px-4 py-3 text-center font-mono font-bold ${
                      isBestDog && market.away_consensus_spread > 0
                        ? 'text-indigo-700 bg-indigo-50/50'
                        : isBestFav && market.away_consensus_spread < 0
                        ? 'text-emerald-700 bg-emerald-50/50'
                        : 'text-slate-600'
                    }`}
                  >
                    {formatPrice(book.away_price)}
                  </td>

                  {/* Home Spread */}
                  <td className="px-4 py-3 text-center font-mono font-bold text-slate-800">
                    {formatSpread(book.home_spread)}
                  </td>

                  {/* Home Price */}
                  <td
                    className={`px-4 py-3 text-center font-mono font-bold ${
                      isBestDog && market.home_consensus_spread > 0
                        ? 'text-indigo-700 bg-indigo-50/50'
                        : isBestFav && market.home_consensus_spread < 0
                        ? 'text-emerald-700 bg-emerald-50/50'
                        : 'text-slate-600'
                    }`}
                  >
                    {formatPrice(book.home_price)}
                  </td>

                  {/* Updated time */}
                  <td className="px-4 py-3 text-center font-mono text-slate-400 text-[11px]">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400 shrink-0 opacity-70" />
                      <span>{formatSnapshotTime(book.last_update)}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
