import React, { useState, useEffect } from 'react';
import { SemiSharpApi } from '../api';
import { GameMatchup } from '../types';
import { Card, LoadingSpinner, Alert } from './ui';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, RefreshCw, Info, AlertTriangle, Clock, Trophy, ShieldAlert } from 'lucide-react';

interface WeeklyMatchupsProps {
  season: number;
  week: number;
}

export const WeeklyMatchups: React.FC<WeeklyMatchupsProps> = ({ season, week }) => {
  const { selectedEntry } = useAuth();
  const [games, setGames] = useState<GameMatchup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeEndpoint, setActiveEndpoint] = useState<string>('');

  const fetchSchedule = async () => {
    setLoading(true);
    setError(null);
    const entryId = selectedEntry?.entry_id || 1;
    
    // Construct predicted endpoints for indicator
    const primaryEndpoint = `/schedule/${season}/${week}/${entryId}`;
    const fallbackEndpoint = `/schedule/${season}/${week}`;
    
    try {
      let response;
      try {
        setActiveEndpoint(`GET ${primaryEndpoint}`);
        response = await SemiSharpApi.getSchedule(season, week, entryId);
      } catch (err: any) {
        console.warn(`Primary schedule endpoint ${primaryEndpoint} failed, attempting fallback to ${fallbackEndpoint}`, err);
        setActiveEndpoint(`GET ${fallbackEndpoint}`);
        response = await SemiSharpApi.getScheduleWithoutEntry(season, week);
      }
      
      if (response && response.games) {
        setGames(response.games);
      } else if (response && (response as any).schedule) {
        setGames((response as any).schedule);
      } else {
        setGames([]);
      }
    } catch (err: any) {
      console.error('Error fetching weekly matchups:', err);
      
      let errorDetails = 'Connection failed';
      if (err instanceof Error) {
        errorDetails = err.message;
      } else if (err && typeof err === 'object') {
        errorDetails = err.detail || err.message || JSON.stringify(err);
      } else if (err) {
        errorDetails = String(err);
      }
      
      setError(errorDetails);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [season, week, selectedEntry?.entry_id]);

  const formatGameDate = (dateStr: string, timeStr?: string) => {
    if (!dateStr) return 'TBD';
    try {
      const combinedStr = timeStr ? `${dateStr}T${timeStr}` : dateStr;
      const date = new Date(combinedStr);
      if (isNaN(date.getTime())) {
        return timeStr ? `${dateStr} ${timeStr}` : dateStr;
      }
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: timeStr ? 'numeric' : undefined,
        minute: timeStr ? '2-digit' : undefined,
        timeZoneName: timeStr ? 'short' : undefined,
      });
    } catch {
      return timeStr ? `${dateStr} ${timeStr}` : dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and status control */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 text-slate-800 p-2 rounded-xl border border-slate-200/60 font-semibold text-xs font-mono">
            NFL {season} | WEEK {week}
          </div>
          {games.length > 0 && !loading && !error && (
            <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              🟢 LIVE API
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeEndpoint && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono bg-slate-50 border border-slate-100 px-2 py-1 rounded-md">
              {activeEndpoint}
            </span>
          )}
          <button
            onClick={fetchSchedule}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-slate-50 border border-slate-200/80 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Games
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20">
          <LoadingSpinner size="md" message={`Retrieving active matchups for Season ${season} Week ${week} from FastAPI...`} />
        </div>
      ) : error ? (
        <div className="space-y-4">
          <Alert
            type="warning"
            title="Gateway Communication Error"
            message={error}
          />
          <Card className="p-8 text-center bg-white border border-slate-100">
            <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium mb-4">
              Could not establish connection with FastAPI schedule database registry.
            </p>
            <button
              onClick={fetchSchedule}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 cursor-pointer transition-colors"
            >
              Retry API Request
            </button>
          </Card>
        </div>
      ) : games.length === 0 ? (
        <Card className="p-16 text-center space-y-4 bg-white border border-slate-100">
          <Trophy className="w-12 h-12 mx-auto text-slate-300" />
          <h3 className="text-sm font-bold text-slate-800">No Matchups Scheduled</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            There are no games returned by the API registry for Season {season} Week {week}. The schedule might be empty or still pending setup in the database.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => {
            const awayTeam = game.away_team || (game.matchup ? game.matchup.split('@')[0]?.trim() : '') || 'AWAY';
            const homeTeam = game.home_team || (game.matchup ? game.matchup.split('@')[1]?.trim() : '') || 'HOME';
            const isNeutral = game.location?.toLowerCase() === 'neutral';
            
            // Handle special holiday flags
            const hasHoliday = game.thanksgiving || game.christmas || game.holiday_flags;
            const holidayLabel = game.thanksgiving 
              ? 'Thanksgiving' 
              : game.christmas 
                ? 'Christmas' 
                : typeof game.holiday_flags === 'string'
                  ? game.holiday_flags
                  : Array.isArray(game.holiday_flags)
                    ? game.holiday_flags.join(', ')
                    : hasHoliday ? 'Holiday Special' : null;

            return (
              <Card 
                key={game.game_id} 
                className="group relative overflow-hidden bg-white hover:border-slate-300/80 transition-all hover:shadow-xs p-5 flex flex-col justify-between gap-4 border border-slate-100"
              >
                {/* Side line indicator */}
                <div className="absolute top-0 left-0 w-1 group-hover:h-full h-2 bg-indigo-500 transition-all duration-300" />
                
                {/* Game Title Row */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                      ID: {game.game_id}
                    </span>
                    {holidayLabel && (
                      <span className="text-[9px] font-extrabold bg-rose-50 text-rose-700 border border-rose-100 px-1.5 py-0.5 rounded-sm uppercase tracking-wider flex items-center gap-1 shrink-0">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        {holidayLabel}
                      </span>
                    )}
                  </div>

                  {/* Matchup Layout */}
                  <div className="flex items-center justify-between gap-2 py-2">
                    <div className="flex flex-col items-start w-5/12 min-w-0">
                      <span className="text-lg font-extrabold text-slate-900 tracking-tight block truncate w-full group-hover:text-indigo-600 transition-colors">
                        {awayTeam}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Away</span>
                    </div>

                    <div className="flex flex-col items-center justify-center shrink-0 w-2/12">
                      <span className="text-[10px] font-black text-slate-400 bg-slate-50 border border-slate-100 rounded-full w-6 h-6 flex items-center justify-center font-mono uppercase">
                        {isNeutral ? 'vs' : '@'}
                      </span>
                    </div>

                    <div className="flex flex-col items-end text-right w-5/12 min-w-0">
                      <span className="text-lg font-extrabold text-slate-900 tracking-tight block truncate w-full group-hover:text-indigo-600 transition-colors">
                        {homeTeam}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Home</span>
                    </div>
                  </div>
                </div>

                {/* Game Details */}
                <div className="pt-3 border-t border-slate-50 space-y-2 text-[11px] font-semibold text-slate-600">
                  {/* Date & Time */}
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{formatGameDate(game.date, game.time)}</span>
                  </div>

                  {/* Stadium & Location */}
                  {(game.stadium || game.location) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="truncate leading-tight">
                        {game.stadium || 'TBD Stadium'}{isNeutral ? ' (Neutral Site)' : ''}
                      </span>
                    </div>
                  )}

                  {/* Rest Information, if present */}
                  {(game.away_rest !== undefined || game.home_rest !== undefined || game.rest_information) && (
                    <div className="mt-2 bg-slate-50 border border-slate-100 rounded-lg p-2 flex items-start gap-1.5 text-[10px] text-slate-500">
                      <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                      <span className="leading-normal font-medium">
                        {game.rest_information || `Rest Advantage: Away ${game.away_rest}d vs Home ${game.home_rest}d`}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
