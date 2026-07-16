import React, { useState, useEffect } from 'react';
import { SemiSharpApi } from '../api';
import { SicHealthScore } from '../types';
import { Card, LoadingSpinner, Alert, Button, Input } from './ui';
import { Heart, RefreshCw, Search, ArrowUpDown, Info, ShieldAlert, Award, Hash, ArrowUpRight, ArrowDownRight, ChevronDown, ChevronUp } from 'lucide-react';

interface TeamHealthProps {
  season: number;
  week: number;
  onLoaded?: (loaded: boolean) => void;
}

export const TeamHealth: React.FC<TeamHealthProps> = ({ season, week, onLoaded }) => {
  const [scores, setScores] = useState<SicHealthScore[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeEndpoint, setActiveEndpoint] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'team' | 'score_desc' | 'score_asc'>('team');
  const [futureExpanded, setFutureExpanded] = useState<boolean>(false);

  const fetchSicHealth = async () => {
    setLoading(true);
    setError(null);
    const endpoint = `/injuries/sic/${season}/${week}`;
    setActiveEndpoint(`GET ${endpoint}`);

    try {
      const response = await SemiSharpApi.getSicHealth(season, week);
      if (response && response.sic_scores) {
        setScores(response.sic_scores);
        if (onLoaded) {
          onLoaded(true);
        }
      } else {
        setScores([]);
      }
    } catch (err: any) {
      console.error('Error fetching SIC health scores:', err);
      let errorDetails = 'Connection failed';
      if (err instanceof Error) {
        errorDetails = err.message;
      } else if (err && typeof err === 'object') {
        errorDetails = err.detail || err.message || JSON.stringify(err);
      }
      setError(errorDetails);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSicHealth();
  }, [season, week]);

  // Calculations derived directly from response
  const recordCount = scores.length;
  const averageScore = recordCount > 0 
    ? (scores.reduce((sum, s) => sum + s.sic_score, 0) / recordCount) 
    : 0;

  let highestScore = -Infinity;
  let lowestScore = Infinity;
  let highestTeams: string[] = [];
  let lowestTeams: string[] = [];

  scores.forEach(s => {
    const score = s.sic_score;
    if (score > highestScore) {
      highestScore = score;
      highestTeams = [s.team];
    } else if (score === highestScore) {
      highestTeams.push(s.team);
    }

    if (score < lowestScore) {
      lowestScore = score;
      lowestTeams = [s.team];
    } else if (score === lowestScore) {
      lowestTeams.push(s.team);
    }
  });

  // Display the source & import timestamp if returned from the endpoint
  const firstRecord = scores[0];
  const sourceName = firstRecord?.source || 'SPORTS_INJURY_CENTRAL';
  const importTimestamp = firstRecord?.imported_at || firstRecord?.import_date;

  // Check if all scores are identical
  const allScoresIdentical = scores.length > 0 && scores.every(s => s.sic_score === scores[0].sic_score);

  // Filter and Sort teams
  const filteredScores = scores
    .filter(s => {
      const query = searchQuery.toLowerCase();
      const teamAbbrev = s.team.toLowerCase();
      const teamName = (s.team_name || '').toLowerCase();
      return teamAbbrev.includes(query) || teamName.includes(query);
    })
    .sort((a, b) => {
      if (sortBy === 'team') {
        return a.team.localeCompare(b.team);
      } else if (sortBy === 'score_desc') {
        return b.sic_score - a.sic_score || a.team.localeCompare(b.team);
      } else if (sortBy === 'score_asc') {
        return a.sic_score - b.sic_score || a.team.localeCompare(b.team);
      }
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* Offseason Data Notice Compact Informational Banner */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex gap-3.5 items-start shadow-3xs">
        <div className="p-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Offseason Data Notice</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Current Sports Injury Central (SIC) team health scores have been initialized for the offseason. Differentiated health scores will appear once regular-season injury data becomes available.
          </p>
        </div>
      </div>

      {/* Header and status control */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 text-slate-800 p-2 rounded-xl border border-slate-200/60 font-semibold text-xs font-mono">
            NFL {season} | WEEK {week}
          </div>
          {scores.length > 0 && !loading && !error && (
            <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
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
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchSicHealth}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-slate-600 border-slate-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {loading && (
        <Card className="p-16 text-center">
          <LoadingSpinner size="md" message="Loading team health index scores from Sports Injury Central..." />
        </Card>
      )}

      {error && !loading && (
        <div className="space-y-4">
          <Alert 
            type="error" 
            title="Endpoint Loading Failure" 
            message={`Failed to retrieve SIC health scores from '${activeEndpoint}': ${error}`} 
          />
          <Card className="p-8 text-center bg-white border border-slate-100 shadow-xs">
            <p className="text-sm text-slate-500 mb-4">
              Please verify your API backend service is running and accessible.
            </p>
            <Button variant="primary" size="sm" onClick={fetchSicHealth}>
              Retry Loading Team Health
            </Button>
          </Card>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Summary Cards (Dynamic switch based on allScoresIdentical check) */}
          {allScoresIdentical ? (
            <div className={`grid grid-cols-1 md:grid-cols-${importTimestamp ? 4 : 3} gap-4`}>
              <Card className="bg-white border border-slate-100 p-5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Teams Loaded</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-bold text-slate-900 tracking-tight">{recordCount}</span>
                    <span className="text-xs text-slate-400 font-medium">NFL Teams</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-4 text-[10px] text-slate-400 font-mono">
                  <Hash className="w-3.5 h-3.5 text-slate-400" />
                  <span>Full League Coverage</span>
                </div>
              </Card>

              <Card className="bg-white border border-slate-100 p-5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Data Source</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-lg font-bold text-slate-900 tracking-tight truncate max-w-full block" title={sourceName}>
                      {sourceName}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-4 text-[10px] text-slate-400 font-mono">
                  <Award className="w-3.5 h-3.5 text-slate-400" />
                  <span>Sports Injury Central</span>
                </div>
              </Card>

              <Card className="bg-white border border-slate-100 p-5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Current Season / Week</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-xl font-bold text-slate-900 tracking-tight">{season} / W{week}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-4 text-[10px] text-slate-400 font-mono">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  <span>Active Frame</span>
                </div>
              </Card>

              {importTimestamp && (
                <Card className="bg-white border border-slate-100 p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Last Import Date</span>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-sm font-bold text-slate-900 tracking-tight truncate max-w-full block" title={importTimestamp}>
                        {importTimestamp}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-4 text-[10px] text-slate-400 font-mono">
                    <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                    <span>Database Last Sync</span>
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-white border border-slate-100 p-5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Record Count</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-bold text-slate-900 tracking-tight">{recordCount}</span>
                    <span className="text-xs text-slate-400 font-medium">NFL Teams</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-4 text-[10px] text-slate-400 font-mono">
                  <Hash className="w-3.5 h-3.5 text-slate-400" />
                  <span>Full League Coverage</span>
                </div>
              </Card>

              <Card className="bg-white border border-slate-100 p-5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Average SIC Score</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-bold text-slate-900 tracking-tight">{averageScore.toFixed(1)}</span>
                    <span className="text-xs text-slate-400 font-medium">Out of 100</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-4 text-[10px] text-slate-400 font-mono">
                  <Award className="w-3.5 h-3.5 text-slate-400" />
                  <span>Mean Index Value</span>
                </div>
              </Card>

              <Card className="bg-white border border-slate-100 p-5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Highest SIC Score</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-bold text-slate-900 tracking-tight">{highestScore.toFixed(1)}</span>
                  </div>
                </div>
                <div className="mt-4 text-[10px] text-slate-500 font-mono flex items-center gap-1 truncate" title={highestTeams.join(', ')}>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-bold text-slate-700 shrink-0">Teams:</span>
                  <span className="truncate">{highestTeams.length === 32 ? 'All' : highestTeams.join(', ')}</span>
                </div>
              </Card>

              <Card className="bg-white border border-slate-100 p-5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Lowest SIC Score</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-bold text-slate-900 tracking-tight">{lowestScore.toFixed(1)}</span>
                  </div>
                </div>
                <div className="mt-4 text-[10px] text-slate-500 font-mono flex items-center gap-1 truncate" title={lowestTeams.join(', ')}>
                  <ArrowDownRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-bold text-slate-700 shrink-0">Teams:</span>
                  <span className="truncate">{lowestTeams.length === 32 ? 'All' : lowestTeams.join(', ')}</span>
                </div>
              </Card>
            </div>
          )}

          {/* Model Information Banner */}
          <Card className="bg-slate-50 border border-slate-100 p-5 relative overflow-hidden">
            <div className="flex items-start gap-3.5">
              <div className="p-2 bg-slate-900 text-white rounded-lg mt-0.5">
                <Heart className="w-4 h-4 text-slate-100" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">How SemiSharp Uses Team Health</h4>
                <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">
                  Sports Injury Central provides a team-level health score used by SemiSharp as one analytical input. It is considered alongside projections, probabilities, risk, market information, and contest constraints. No single health metric determines a recommendation. Team health is one component of SemiSharp's analytical models and should always be considered together with projections, probabilities, risk, and market information.
                </p>
                {importTimestamp && (
                  <div className="text-[10px] text-slate-400 font-mono mt-2">
                    Source: <span className="font-semibold text-slate-500">{sourceName}</span>
                    {importTimestamp && (
                      <>
                        <span className="mx-1.5">|</span>
                        Last Imported: <span className="font-semibold text-slate-500">{importTimestamp}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Filters & Grid Container */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-white p-4 rounded-xl border border-slate-100">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by team or city..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-100 rounded-lg focus:outline-none focus:border-slate-300 focus:bg-white transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto self-start sm:self-auto">
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5 shrink-0">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  Sort By:
                </span>
                <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
                  <button
                    onClick={() => setSortBy('team')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${sortBy === 'team' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    Alphabetical
                  </button>
                  <button
                    onClick={() => setSortBy('score_desc')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${sortBy === 'score_desc' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    Highest Score
                  </button>
                  <button
                    onClick={() => setSortBy('score_asc')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${sortBy === 'score_asc' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    Lowest Score
                  </button>
                </div>
              </div>
            </div>

            {/* Grid display with neutral team-card styling */}
            {filteredScores.length === 0 ? (
              <Card className="p-12 text-center text-slate-400 text-xs">
                No team health scores found matching "{searchQuery}"
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredScores.map(score => (
                  <Card 
                    key={score.team} 
                    className="p-4 bg-white border border-slate-100 hover:border-slate-200 transition-all text-center flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-10 h-10 mx-auto rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-sm text-slate-700 tracking-tight shadow-3xs font-mono mb-2">
                        {score.team}
                      </div>
                      <h5 className="text-[11px] font-bold text-slate-900 truncate leading-tight" title={score.team_name || score.team}>
                        {score.team_name || score.team}
                      </h5>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-50/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">SIC Score</span>
                      <span className="text-xl font-extrabold text-slate-900 tracking-tight block mt-0.5 font-mono">
                        {score.sic_score.toFixed(1)}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Future Features Collapsible Section */}
          <Card className="bg-white border border-slate-100 overflow-hidden shadow-3xs mt-6">
            <button
              onClick={() => setFutureExpanded(!futureExpanded)}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors focus:outline-none"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                  Coming in Future Releases
                </span>
                <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                  Roadmap
                </span>
              </div>
              {futureExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>
            
            {futureExpanded && (
              <div className="px-5 pb-5 pt-1 border-t border-slate-100 space-y-4 bg-slate-50/20">
                <p className="text-xs text-slate-500 leading-relaxed">
                  The following features represent planned enhancements scheduled for subsequent releases. These are not currently implemented, but are actively being designed to further enrich the Team Health capability:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1 shadow-3xs">
                    <div className="text-xs font-bold text-slate-700 font-mono">Historical Team Health Trends</div>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Compare current team health index scores against historical multi-season averages to contextualize year-over-year roster strength.
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1 shadow-3xs">
                    <div className="text-xs font-bold text-slate-700 font-mono">Weekly Health Movement</div>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Track week-to-week changes in team health index scores with dynamic delta indicators indicating relative upward or downward trajectory.
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1 shadow-3xs">
                    <div className="text-xs font-bold text-slate-700 font-mono">Structured Injury Information</div>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Expose precise injury details directly mapped from primary diagnostic and practice reports for affected impact players.
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1 shadow-3xs">
                    <div className="text-xs font-bold text-slate-700 font-mono">AI-Generated Health Summaries</div>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Automated high-level narrative synthesis of roster health implications using server-side large language modeling.
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1 shadow-3xs md:col-span-2">
                    <div className="text-xs font-bold text-slate-700 font-mono">Weekly Game Analysis Integration</div>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Inject team health deltas directly into the matchups and game analysis modules for integrated contest-level risk scoring.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};
