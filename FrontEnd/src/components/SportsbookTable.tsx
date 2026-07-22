/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { BookmakerLine } from '../types/analysis';
import { ArrowUpDown, ArrowUp, ArrowDown, Clock } from 'lucide-react';

interface SportsbookTableProps {
  sportsbooks: BookmakerLine[];
}

type SortField = 'bookmaker_title' | 'home_spread' | 'away_spread' | 'price' | 'last_update';
type SortOrder = 'asc' | 'desc';

export const SportsbookTable: React.FC<SportsbookTableProps> = ({ sportsbooks }) => {
  const [sortField, setSortField] = useState<SortField>('bookmaker_title');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Human-readable price formatting (e.g., -110 as -110, 100 as +100)
  const formatPrice = (price: number) => {
    if (price > 0) return `+${price}`;
    return price.toString();
  };

  const sortedSportsbooks = useMemo(() => {
    if (!sportsbooks || sportsbooks.length === 0) return [];
    
    return [...sportsbooks].sort((a, b) => {
      let valA: any = a[sortField as keyof BookmakerLine];
      let valB: any = b[sortField as keyof BookmakerLine];

      // Custom calculations for combined "price" sorting
      if (sortField === 'price') {
        valA = a.home_price + a.away_price;
        valB = b.home_price + b.away_price;
      }

      // Handle string or undefined sorting
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      }

      // Numeric sorting
      const numA = Number(valA) || 0;
      const numB = Number(valB) || 0;
      return sortOrder === 'asc' ? numA - numB : numB - numA;
    });
  }, [sportsbooks, sortField, sortOrder]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 ml-1 shrink-0" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp className="w-3.5 h-3.5 text-slate-700 ml-1 shrink-0" />
      : <ArrowDown className="w-3.5 h-3.5 text-slate-700 ml-1 shrink-0" />;
  };

  const formatSnapshotTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      if (isNaN(date.getTime())) return timeStr;
      
      // Return e.g. "Jul 18, 6:00:46 PM" or just formatted time
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return timeStr;
    }
  };

  if (!sportsbooks || sportsbooks.length === 0) {
    return (
      <div className="text-center py-6 text-slate-400 font-mono text-xs">
        No active sportsbook lines found for this matchup.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-100 bg-white shadow-2xs">
      <table className="min-w-full divide-y divide-slate-150 text-left table-fixed">
        <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">
          <tr>
            {/* Sportsbook */}
            <th 
              onClick={() => handleSort('bookmaker_title')}
              className="px-4 py-3 cursor-pointer hover:bg-slate-100/50 hover:text-slate-700 transition-colors w-[25%]"
            >
              <div className="flex items-center">
                Sportsbook
                {renderSortIcon('bookmaker_title')}
              </div>
            </th>

            {/* Home Spread */}
            <th 
              onClick={() => handleSort('home_spread')}
              className="px-4 py-3 cursor-pointer hover:bg-slate-100/50 hover:text-slate-700 transition-colors text-center w-[18%]"
            >
              <div className="flex items-center justify-center">
                Home Spread
                {renderSortIcon('home_spread')}
              </div>
            </th>

            {/* Away Spread */}
            <th 
              onClick={() => handleSort('away_spread')}
              className="px-4 py-3 cursor-pointer hover:bg-slate-100/50 hover:text-slate-700 transition-colors text-center w-[18%]"
            >
              <div className="flex items-center justify-center">
                Away Spread
                {renderSortIcon('away_spread')}
              </div>
            </th>

            {/* Price (Juice) */}
            <th 
              onClick={() => handleSort('price')}
              className="px-4 py-3 cursor-pointer hover:bg-slate-100/50 hover:text-slate-700 transition-colors text-center w-[22%]"
            >
              <div className="flex items-center justify-center">
                Price / Juice
                {renderSortIcon('price')}
              </div>
            </th>

            {/* Snapshot Time */}
            <th 
              onClick={() => handleSort('last_update')}
              className="px-4 py-3 cursor-pointer hover:bg-slate-100/50 hover:text-slate-700 transition-colors text-center w-[17%]"
            >
              <div className="flex items-center justify-center">
                Snapshot Time
                {renderSortIcon('last_update')}
              </div>
            </th>
          </tr>
        </thead>
        
        <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-sans">
          {sortedSportsbooks.map((book) => {
            const homeSpreadFormatted = book.home_spread > 0 ? `+${book.home_spread}` : book.home_spread;
            const awaySpreadFormatted = book.away_spread > 0 ? `+${book.away_spread}` : book.away_spread;

            return (
              <tr key={book.bookmaker_key} className="hover:bg-slate-50/40 transition-colors">
                {/* Sportsbook Title */}
                <td className="px-4 py-3 font-semibold text-slate-800 truncate">
                  {book.bookmaker_title}
                </td>

                {/* Home Spread */}
                <td className="px-4 py-3 text-center font-mono font-medium text-slate-800">
                  {homeSpreadFormatted}
                </td>

                {/* Away Spread */}
                <td className="px-4 py-3 text-center font-mono font-medium text-slate-800">
                  {awaySpreadFormatted}
                </td>

                {/* Price */}
                <td className="px-4 py-3 text-center font-mono text-slate-500">
                  <span className="text-[10px] text-slate-400">H:</span> {formatPrice(book.home_price)} 
                  <span className="mx-1 text-slate-300">|</span> 
                  <span className="text-[10px] text-slate-400">A:</span> {formatPrice(book.away_price)}
                </td>

                {/* Snapshot Time */}
                <td className="px-4 py-3 text-center font-mono text-slate-400 text-[11px]">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3 shrink-0 opacity-60" />
                    <span>{formatSnapshotTime(book.last_update)}</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
