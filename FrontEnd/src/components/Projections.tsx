import React, { useState, useEffect, useMemo } from 'react';
import { SemiSharpApi } from '../api';
import { ProjectionGame } from '../types';
import { Card, LoadingSpinner, Alert } from './ui';
import { 
  TrendingUp, 
  RefreshCw, 
  ShieldAlert, 
  Search, 
  ArrowUpDown, 
  Sparkles, 
  BarChart3, 
  Info, 
  Gauge, 
  CheckCircle2,
  Bookmark
} from 'lucide-react';

interface ProjectionsProps {
  season: number;
  week: number;
}

type SortOption = 'spread-desc' | 'spread-asc' | 'team-name' | 'game-id';

export const Projections: React.FC<ProjectionsProps> = ({ season, week }) => {
  const [games, setGames] = useState<ProjectionGame[]>([]);
  const [modelName, setModelName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('spread-desc');

  const fetchProjections = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await SemiSharpApi.getProjections(season, week);
      if (response) {
        setGames(response.games || []);
        setModelName(response.model || 'SEMISHARP_PROJECTION_V2');
      } else {
        setGames([]);
        setModelName('');
      }
    } catch (err: any) {
      console.error('Error fetching projections:', err);
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
    fetchProjections();
  }, [season, week]);

  // Compute analytics from the live data
  const analytics = useMemo(() => {
    if (games.length === 0) return null;

    let strongestGame = games[0];
    let totalSpread = 0;

    games.forEach(game => {
      totalSpread += Math.abs(game.projected_spread);
      if (Math.abs(game.projected_spread) > Math.abs(strongestGame.projected_spread)) {
        strongestGame = game;
      }
    });

    const averageSpread = totalSpread / games.length;

    return {
      strongestFavorite: strongestGame.favorite,
      strongestSpread: Math.abs(strongestGame.projected_spread),
      strongestOpponent: strongestGame.favorite === strongestGame.home_team ? strongestGame.away_team : strongestGame.home_team,
      averageSpread,
      totalGames: games.length
    };
  }, [games]);

  // Handle Filtering & Sorting
  const processedGames = useMemo(() => {
    let result = [...games];

    // Filter by search term (teams)
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        g => g.away_team.toLowerCase().includes(term) || 
             g.home_team.toLowerCase().includes(term) ||
             g.game_id.toLowerCase().includes(term)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'spread-desc':
          return Math.abs(b.projected_spread) - Math.abs(a.projected_spread);
        case 'spread-asc':
          return Math.abs(a.projected_spread) - Math.abs(b.projected_spread);
        case 'team-name':
          return a.away_team.localeCompare(b.away_team);
        case 'game-id':
          return a.game_id.localeCompare(b.game_id);
        default:
          return 0;
      }
    });

    return result;
  }, [games, searchTerm, sortBy]);

  return (
    <div className="space-y-6">
      {/* Top Bar with Status and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 text-slate-800 p-2 rounded-xl border border-slate-200/60 font-semibold text-xs font-mono">
            NFL {season} | WEEK {week} PROJECTIONS
          </div>
          {games.length > 0 && !loading && !error && (
            <span className="text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 inline-block" />
              🟢 LIVE API
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono bg-slate-50 border border-slate-100 px-2 py-1 rounded-md">
            GET /projections/{season}/{week}
          </span>
          <button
            onClick={fetchProjections}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-slate-50 border border-slate-200/80 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Projections
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20">
          <LoadingSpinner size="md" message={`Synthesizing analytical projections for Season ${season} Week ${week} from FastAPI...`} />
        </div>
      ) : error ? (
        <div className="space-y-4">
          <Alert
            type="warning"
            title="Projections Gateway Error"
            message={error}
          />
          <Card className="p-8 text-center bg-white border border-slate-100">
            <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium mb-4">
              Could not establish connection with FastAPI projection engine services.
            </p>
            <button
              onClick={fetchProjections}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 cursor-pointer transition-colors"
            >
              Retry API Request
            </button>
          </Card>
        </div>
      ) : games.length === 0 ? (
        <Card className="p-16 text-center space-y-4 bg-white border border-slate-100">
          <BarChart3 className="w-12 h-12 mx-auto text-slate-300" />
          <h3 className="text-sm font-bold text-slate-800">No Projections Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            There are no projection records returned by the engine for Season {season} Week {week}.
          </p>
        </Card>
      ) : (
        <>
          {/* Analytical summary banner */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white border border-slate-100 p-5 space-y-2 relative overflow-hidden">
                <div className="absolute right-3 top-3 opacity-10">
                  <Sparkles className="w-12 h-12 text-indigo-600" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Projection Model Source
                </span>
                <span className="text-sm font-black text-slate-800 font-mono block">
                  {modelName}
                </span>
                <p className="text-[10.5px] text-slate-500 font-medium">
                  Currently running active predictive algorithms calculated server-side in the live schedule loop.
                </p>
              </Card>

              <Card className="bg-white border border-slate-100 p-5 space-y-2 relative overflow-hidden">
                <div className="absolute right-3 top-3 opacity-10">
                  <Gauge className="w-12 h-12 text-indigo-600" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Strongest Favorite
                </span>
                <span className="text-base font-black text-indigo-600 block">
                  {analytics.strongestFavorite} by -{analytics.strongestSpread.toFixed(2)}
                </span>
                <p className="text-[10.5px] text-slate-500 font-medium">
                  Strongest projected spread for this slate (vs {analytics.strongestOpponent}).
                </p>
              </Card>

              <Card className="bg-white border border-slate-100 p-5 space-y-2 relative overflow-hidden">
                <div className="absolute right-3 top-3 opacity-10">
                  <BarChart3 className="w-12 h-12 text-indigo-600" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Slate Spread Average
                </span>
                <span className="text-base font-black text-slate-800 block">
                  {analytics.averageSpread.toFixed(2)} Points
                </span>
                <p className="text-[10.5px] text-slate-500 font-medium">
                  Average projected margin across all {analytics.totalGames} games on the active week's calendar.
                </p>
              </Card>
            </div>
          )}

          {/* Filtering and Sorting Row */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-100">
            {/* Search Box */}
            <div className="relative w-full sm:max-w-xs">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search team or game ID..."
                className="block w-full pl-9 pr-3 py-1.5 text-xs font-semibold text-slate-800 placeholder-slate-400 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1 font-mono uppercase">
                <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="block bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="spread-desc">Largest Margin First</option>
                <option value="spread-asc">Smallest Margin First</option>
                <option value="team-name">Team Name (A-Z)</option>
                <option value="game-id">Game ID</option>
              </select>
            </div>
          </div>

          {/* Projections Display Grid */}
          {processedGames.length === 0 ? (
            <div className="text-center py-10 text-slate-400 font-medium text-xs">
              No matching projections found for "{searchTerm}".
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {processedGames.map((game) => {
                const spreadAbs = Math.abs(game.projected_spread);
                const isHomeFavorite = game.favorite === game.home_team;
                const isAwayFavorite = game.favorite === game.away_team;

                return (
                  <Card 
                    key={game.game_id}
                    className="relative overflow-hidden bg-white hover:border-slate-300 transition-all hover:shadow-xs p-5 flex flex-col justify-between gap-4 border border-slate-100 group"
                  >
                    {/* Top highlight bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 group-hover:bg-indigo-500 transition-all" />

                    <div className="space-y-3">
                      {/* Top Metadata Row */}
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 font-mono">
                        <span>ID: {game.game_id}</span>
                        <span className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded-sm">
                          <Bookmark className="w-2.5 h-2.5" /> Model Output
                        </span>
                      </div>

                      {/* Matchup Layout with Favorite highlights */}
                      <div className="flex items-center justify-between gap-2 py-1">
                        {/* Away Team */}
                        <div className="flex flex-col items-start w-5/12 min-w-0">
                          <div className="flex items-center gap-1.5 w-full">
                            <span className={`text-lg font-extrabold truncate tracking-tight ${isAwayFavorite ? 'text-indigo-600' : 'text-slate-800'}`}>
                              {game.away_team}
                            </span>
                            {isAwayFavorite && (
                              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" title="Projected Favorite" />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {isAwayFavorite ? 'Favorite' : 'Underdog'}
                          </span>
                        </div>

                        {/* Mid Indicator */}
                        <div className="flex flex-col items-center shrink-0 w-2/12">
                          <span className="text-[9px] font-black text-slate-400 bg-slate-100 border border-slate-200/60 rounded-sm px-1.5 py-0.5 font-mono uppercase">
                            VS
                          </span>
                        </div>

                        {/* Home Team */}
                        <div className="flex flex-col items-end text-right w-5/12 min-w-0">
                          <div className="flex items-center justify-end gap-1.5 w-full">
                            {isHomeFavorite && (
                              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" title="Projected Favorite" />
                            )}
                            <span className={`text-lg font-extrabold truncate tracking-tight ${isHomeFavorite ? 'text-indigo-600' : 'text-slate-800'}`}>
                              {game.home_team}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {isHomeFavorite ? 'Favorite' : 'Underdog'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Analytics Metrics Section */}
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      {/* Projection Figure */}
                      <div className="flex items-center justify-between bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                            <TrendingUp className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[11px] font-bold text-slate-600">Projected Spread</span>
                        </div>
                        <span className="font-mono text-sm font-black text-slate-800">
                          {game.favorite} -{spreadAbs.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Bottom model tag */}
                    <div className="flex items-center gap-1 text-[9.5px] font-bold text-slate-400 pt-1 border-t border-slate-50">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Validated via {game.model}</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
