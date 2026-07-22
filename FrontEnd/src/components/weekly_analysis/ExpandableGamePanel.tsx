/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { GameAnalysis } from '../../types/analysis';
import { analysisApi } from '../../services/analysisApi';
import { TeamLogo } from './TeamLogo';
import { ProjectedMarginGauge } from './ProjectedMarginGauge';
import { RiskGauge } from './RiskGauge';
import { SportsbookTableV2 } from './SportsbookTableV2';
import { EdgeBadge } from '../EdgeBadge';
import { Alert, Button } from '../ui';
import { 
  Sparkles, 
  TrendingUp, 
  AlertOctagon, 
  Users, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  HardDrive, 
  Activity, 
  Award,
  Database,
  Info,
  CheckCircle2,
  AlertTriangle,
  FileCode2,
  RefreshCw,
  Gauge
} from 'lucide-react';

interface ExpandableGamePanelProps {
  gameId: string;
  fallbackGame?: GameAnalysis;
  onClose?: () => void;
}

type TabType = 'projection' | 'market' | 'risk' | 'teams' | 'model';

export const ExpandableGamePanel: React.FC<ExpandableGamePanelProps> = ({
  gameId,
  fallbackGame,
}) => {
  const [detailData, setDetailData] = useState<GameAnalysis | null>(fallbackGame || null);
  const [loading, setLoading] = useState<boolean>(!fallbackGame);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('projection');

  // Fetch single game analysis detail from GET /analysis/game/{game_id}
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    analysisApi
      .getGameAnalysis(gameId)
      .then((data) => {
        if (isMounted) {
          setDetailData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error(`Error fetching game analysis for ${gameId}:`, err);
          setError(
            err instanceof Error
              ? err.message
              : `Failed to fetch game analysis payload for ${gameId}`
          );
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [gameId]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    analysisApi
      .getGameAnalysis(gameId)
      .then((data) => {
        setDetailData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load game detail.');
        setLoading(false);
      });
  };

  // Skeleton loading state
  if (loading && !detailData) {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="bg-slate-900 text-slate-100 rounded-b-xl border-t border-slate-800 p-6 space-y-6 animate-pulse overflow-hidden font-sans"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="h-6 w-64 bg-slate-800 rounded-md" />
          <div className="h-6 w-32 bg-slate-800 rounded-md" />
        </div>
        <div className="flex gap-2 border-b border-slate-800 pb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-24 bg-slate-800 rounded-t-lg" />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-800/80 rounded-xl" />
          ))}
        </div>
        <div className="h-36 bg-slate-800/50 rounded-xl" />
      </motion.div>
    );
  }

  // Error state
  if (error && !detailData) {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-slate-900 text-slate-100 rounded-b-xl border-t border-slate-800 p-6 space-y-4 font-sans"
      >
        <Alert type="error" title={`Game Analysis Pipeline Sync Error (${gameId})`} message={error} />
        <Button variant="outline" size="sm" onClick={handleRetry} className="text-xs">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Retry Connection
        </Button>
      </motion.div>
    );
  }

  if (!detailData) return null;

  const {
    game_id,
    gameday,
    gametime,
    away_team,
    home_team,
    semisharp_projection,
    market,
    risk,
  } = detailData;

  const formatKickoff = () => {
    try {
      const date = new Date(`${gameday}T${gametime}`);
      if (isNaN(date.getTime())) return `${gameday} ${gametime}`;
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return `${gameday} ${gametime}`;
    }
  };

  const formatSpread = (val: number) => {
    if (val === 0) return '0.0';
    return val > 0 ? `+${val.toFixed(1)}` : val.toFixed(1);
  };

  // Active risk calculation
  const awayRisk = risk.away;
  const homeRisk = risk.home;
  const primaryRisk = (homeRisk?.score ?? 0) >= (awayRisk?.score ?? 0) ? homeRisk : awayRisk;

  const tabs: { id: TabType; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'projection',
      label: 'Projection',
      icon: <Sparkles className="w-4 h-4" />,
      badge: `${semisharp_projection.projected_favorite_abbr} ${formatSpread(semisharp_projection.projected_spread)}`,
    },
    {
      id: 'market',
      label: 'Market',
      icon: <TrendingUp className="w-4 h-4" />,
      badge: `${market.sportsbook_count} Books`,
    },
    {
      id: 'risk',
      label: 'Risk',
      icon: <AlertOctagon className="w-4 h-4" />,
      badge: primaryRisk?.level || 'LOW',
    },
    {
      id: 'teams',
      label: 'Teams',
      icon: <Users className="w-4 h-4" />,
      badge: `${away_team.team_abbr} @ ${home_team.team_abbr}`,
    },
    {
      id: 'model',
      label: 'Model',
      icon: <FileCode2 className="w-4 h-4" />,
      badge: 'v3.1 Engine',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className="bg-slate-900 text-slate-100 rounded-b-xl border-t border-slate-800 shadow-xl overflow-hidden font-sans"
    >
      {/* Top Banner Header */}
      <div className="p-5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Teams Matchup Headline (Enlarged logos by ~20%) */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <TeamLogo abbr={away_team.team_abbr} name={away_team.team_name} size="lg" />
            <span className="text-lg font-black text-white font-mono">{away_team.team_name}</span>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500 uppercase px-2.5 py-1 bg-slate-900 rounded border border-slate-800">
            AT
          </span>
          <div className="flex items-center gap-2.5">
            <TeamLogo abbr={home_team.team_abbr} name={home_team.team_name} size="lg" />
            <span className="text-lg font-black text-white font-mono">{home_team.team_name}</span>
          </div>
        </div>

        {/* Kickoff & Game ID Badge */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1 rounded-md">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {formatKickoff()}
          </span>
          <span className="text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md">
            ID: {game_id}
          </span>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center overflow-x-auto bg-slate-950/80 border-b border-slate-800 px-4 pt-2 gap-1 scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-extrabold rounded-t-lg transition-all border-t border-x cursor-pointer shrink-0 select-none
                ${isActive
                  ? 'bg-slate-900 text-emerald-400 border-emerald-500/50 shadow-xs'
                  : 'bg-slate-950/40 text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
                }
              `}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Tab Content Canvas */}
      <div className="p-6 bg-slate-900/90 min-h-[320px]">
        {/* TAB 1: PROJECTION */}
        {activeTab === 'projection' && (() => {
          const isHomeFav = semisharp_projection.projected_favorite_abbr === home_team.team_abbr;
          const favConsensusVal = isHomeFav ? market.home_consensus_spread : market.away_consensus_spread;
          const favConsensusStr = `${semisharp_projection.projected_favorite_abbr} ${formatSpread(favConsensusVal)}`;

          const edgeVal = isHomeFav
            ? (market.home_edge?.edge_points ?? (Math.abs(semisharp_projection.projected_spread) - Math.abs(favConsensusVal)))
            : (market.away_edge?.edge_points ?? (Math.abs(semisharp_projection.projected_spread) - Math.abs(favConsensusVal)));

          const displayRiskLevel = primaryRisk?.level
            ? primaryRisk.level.charAt(0).toUpperCase() + primaryRisk.level.slice(1).toLowerCase()
            : 'Medium';

          return (
            <div className="space-y-6 animate-fade-in">
              {/* Top Stat Summary Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-extrabold">
                    Projected Favorite
                  </span>
                  <div className="flex items-center gap-2">
                    <TeamLogo abbr={semisharp_projection.projected_favorite_abbr} size="md" />
                    <span className="text-lg font-black font-mono text-emerald-400">
                      {semisharp_projection.projected_favorite_abbr}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-extrabold">
                    SemiSharp Spread
                  </span>
                  <span className="text-lg font-black font-mono text-white">
                    {semisharp_projection.projected_favorite_abbr} {formatSpread(semisharp_projection.projected_spread)}
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-extrabold">
                    Power Rating Diff
                  </span>
                  <span className="text-lg font-black font-mono text-indigo-400">
                    {semisharp_projection.power_rating_diff >= 0 ? `+${semisharp_projection.power_rating_diff.toFixed(2)}` : semisharp_projection.power_rating_diff.toFixed(2)} pts
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-extrabold">
                    Home Field Advantage (HFA)
                  </span>
                  <span className="text-lg font-black font-mono text-amber-400">
                    +{semisharp_projection.home_field_points.toFixed(1)} pts
                  </span>
                </div>
              </div>

              {/* Compact Projection Summary Panel */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 shadow-md">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Gauge className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-mono font-black uppercase text-slate-200 tracking-wider">
                    Projection Summary
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">SemiSharp</span>
                    <span className="text-sm font-black text-emerald-400 mt-0.5 block">
                      {semisharp_projection.projected_favorite_abbr} {formatSpread(semisharp_projection.projected_spread)}
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Consensus</span>
                    <span className="text-sm font-black text-white mt-0.5 block">
                      {favConsensusStr}
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Edge</span>
                    <span className="text-sm font-black text-indigo-400 mt-0.5 block">
                      {edgeVal >= 0 ? `+${edgeVal.toFixed(1)}` : edgeVal.toFixed(1)}
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Books</span>
                    <span className="text-sm font-black text-slate-200 mt-0.5 block">
                      {market.sportsbook_count}
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Risk</span>
                    <span className="text-sm font-black text-amber-400 mt-0.5 block">
                      {displayRiskLevel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Visual Gauge Component */}
              <ProjectedMarginGauge
                awayTeam={away_team}
                homeTeam={home_team}
                projectedHomeMargin={semisharp_projection.projected_home_margin}
                homeFieldPoints={semisharp_projection.home_field_points}
                powerRatingDiff={semisharp_projection.power_rating_diff}
                projectedFavoriteAbbr={semisharp_projection.projected_favorite_abbr}
                projectedSpread={semisharp_projection.projected_spread}
              />

              {/* Why This Is A Play Panel */}
              <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-xl space-y-3 shadow-lg">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-mono font-black uppercase text-emerald-400 tracking-wider">
                    Why This Is A Play
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Power Rating Diff</span>
                    <span className="text-sm font-black text-indigo-300 mt-0.5 block">
                      {semisharp_projection.power_rating_diff >= 0 ? `+${semisharp_projection.power_rating_diff.toFixed(2)}` : semisharp_projection.power_rating_diff.toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Home Field Advantage</span>
                    <span className="text-sm font-black text-amber-300 mt-0.5 block">
                      +{semisharp_projection.home_field_points.toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">SemiSharp Projection</span>
                    <span className="text-sm font-black text-emerald-400 mt-0.5 block">
                      {semisharp_projection.projected_favorite_abbr} {formatSpread(semisharp_projection.projected_spread)}
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Consensus</span>
                    <span className="text-sm font-black text-white mt-0.5 block">
                      {favConsensusStr}
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Edge</span>
                    <span className="text-sm font-black text-emerald-400 mt-0.5 block">
                      {edgeVal >= 0 ? `+${edgeVal.toFixed(1)}` : edgeVal.toFixed(1)}
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Risk</span>
                    <span className="text-sm font-black text-amber-400 mt-0.5 block">
                      {displayRiskLevel}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* TAB 2: MARKET */}
        {activeTab === 'market' && (
          <div className="space-y-6 animate-fade-in">
            {/* Market Consensus Overview Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                  Consensus Line ({away_team.team_abbr})
                </span>
                <span className="text-base font-black font-mono text-white mt-0.5">
                  {away_team.team_abbr} {formatSpread(market.away_consensus_spread)}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                  Consensus Line ({home_team.team_abbr})
                </span>
                <span className="text-base font-black font-mono text-white mt-0.5">
                  {home_team.team_abbr} {formatSpread(market.home_consensus_spread)}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                  Active Sportsbooks
                </span>
                <span className="text-base font-black font-mono text-emerald-400 mt-0.5">
                  {market.sportsbook_count} Books Registered
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                  Odds Sync Timestamp
                </span>
                <span className="text-xs font-mono font-semibold text-slate-300 mt-1 truncate">
                  {market.latest_snapshot ? new Date(market.latest_snapshot).toLocaleTimeString() : '—'}
                </span>
              </div>
            </div>

            {/* Sportsbook Registry Table with Highlights */}
            <SportsbookTableV2
              sportsbooks={market.sportsbooks || []}
              market={market}
              favoriteAbbr={semisharp_projection.projected_favorite_abbr}
              awayAbbr={away_team.team_abbr}
              homeAbbr={home_team.team_abbr}
            />
          </div>
        )}

        {/* TAB 3: RISK */}
        {activeTab === 'risk' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Away Team Risk */}
              {(() => {
                const team = away_team;
                const teamRisk = awayRisk;
                const hasFactors = teamRisk?.factors && teamRisk.factors.length > 0;

                return (
                  <div className="space-y-4 bg-slate-950 p-5 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2.5">
                        <TeamLogo abbr={team.team_abbr} name={team.team_name} size="md" />
                        <div>
                          <h4 className="text-sm font-bold text-white font-mono">{team.team_name}</h4>
                          <span className="text-[10px] font-mono text-slate-400 font-semibold">Away Risk Evaluation</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black text-amber-400 bg-amber-950/80 border border-amber-800 px-2.5 py-1 rounded">
                          Level: {teamRisk?.level || 'LOW'}
                        </span>
                        <span className="text-xs font-mono font-black text-slate-200 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded">
                          Score: {teamRisk?.score !== null && teamRisk?.score !== undefined ? teamRisk.score.toFixed(1) : '0.0'}
                        </span>
                      </div>
                    </div>

                    <RiskGauge
                      score={teamRisk?.score ?? null}
                      stars={teamRisk?.stars ?? null}
                      level={teamRisk?.level ?? null}
                      factorCount={teamRisk?.factor_count ?? null}
                    />

                    <div className="space-y-2.5 pt-2">
                      <span className="text-[11px] font-mono font-extrabold text-slate-300 uppercase tracking-wider block">
                        Risk Factors
                      </span>

                      {hasFactors ? (
                        <div className="space-y-2">
                          {teamRisk!.factors!.map((factor, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-slate-900 border border-amber-500/30 rounded-lg space-y-1.5 text-xs font-mono"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                  <span>{factor.title || factor.category || '⚠ Moderate Favorite Risk'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px]">
                                  <span className="text-amber-300 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800 uppercase font-bold">
                                    Severity: {factor.severity || 'Medium'}
                                  </span>
                                  {factor.points !== undefined && (
                                    <span className="text-slate-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 font-bold">
                                      Points: {factor.points}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-slate-300 font-sans text-xs font-medium leading-relaxed">
                                {factor.description || teamRisk?.summary || 'Favorite spread is elevated, increasing hazard.'}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : teamRisk?.summary ? (
                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono space-y-1">
                          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>Risk Summary</span>
                          </div>
                          <p className="text-slate-300 font-sans text-xs font-medium leading-relaxed">
                            {teamRisk.summary}
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg text-xs font-mono text-slate-400 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>No significant risk factors detected.</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Home Team Risk */}
              {(() => {
                const team = home_team;
                const teamRisk = homeRisk;
                const hasFactors = teamRisk?.factors && teamRisk.factors.length > 0;

                return (
                  <div className="space-y-4 bg-slate-950 p-5 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2.5">
                        <TeamLogo abbr={team.team_abbr} name={team.team_name} size="md" />
                        <div>
                          <h4 className="text-sm font-bold text-white font-mono">{team.team_name}</h4>
                          <span className="text-[10px] font-mono text-slate-400 font-semibold">Home Risk Evaluation</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black text-amber-400 bg-amber-950/80 border border-amber-800 px-2.5 py-1 rounded">
                          Level: {teamRisk?.level || 'LOW'}
                        </span>
                        <span className="text-xs font-mono font-black text-slate-200 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded">
                          Score: {teamRisk?.score !== null && teamRisk?.score !== undefined ? teamRisk.score.toFixed(1) : '0.0'}
                        </span>
                      </div>
                    </div>

                    <RiskGauge
                      score={teamRisk?.score ?? null}
                      stars={teamRisk?.stars ?? null}
                      level={teamRisk?.level ?? null}
                      factorCount={teamRisk?.factor_count ?? null}
                    />

                    <div className="space-y-2.5 pt-2">
                      <span className="text-[11px] font-mono font-extrabold text-slate-300 uppercase tracking-wider block">
                        Risk Factors
                      </span>

                      {hasFactors ? (
                        <div className="space-y-2">
                          {teamRisk!.factors!.map((factor, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-slate-900 border border-amber-500/30 rounded-lg space-y-1.5 text-xs font-mono"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                  <span>{factor.title || factor.category || '⚠ Moderate Favorite Risk'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px]">
                                  <span className="text-amber-300 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800 uppercase font-bold">
                                    Severity: {factor.severity || 'Medium'}
                                  </span>
                                  {factor.points !== undefined && (
                                    <span className="text-slate-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 font-bold">
                                      Points: {factor.points}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-slate-300 font-sans text-xs font-medium leading-relaxed">
                                {factor.description || teamRisk?.summary || 'Favorite spread is elevated, increasing hazard.'}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : teamRisk?.summary ? (
                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono space-y-1">
                          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>Risk Summary</span>
                          </div>
                          <p className="text-slate-300 font-sans text-xs font-medium leading-relaxed">
                            {teamRisk.summary}
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg text-xs font-mono text-slate-400 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>No significant risk factors detected.</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* TAB 4: TEAMS */}
        {activeTab === 'teams' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Away Team Card */}
              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <TeamLogo abbr={away_team.team_abbr} name={away_team.team_name} size="lg" />
                    <div>
                      <h4 className="text-base font-black text-white font-mono">{away_team.team_name}</h4>
                      <span className="text-xs text-slate-400 font-mono">Away Team</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-extrabold bg-indigo-950 text-indigo-300 border border-indigo-800 px-2.5 py-1 rounded">
                    AWAY
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Power Rating</span>
                    <span className="text-base font-extrabold text-indigo-400 mt-1 block">
                      {away_team.power_rating >= 0 ? `+${away_team.power_rating.toFixed(2)}` : away_team.power_rating.toFixed(2)}
                    </span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Market Consensus</span>
                    <span className="text-sm font-bold text-white mt-1 block">
                      {market.away_consensus_spread >= 0 ? `+${market.away_consensus_spread.toFixed(1)}` : market.away_consensus_spread.toFixed(1)}
                    </span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">SemiSharp Rating</span>
                    <span className="text-sm font-bold text-emerald-400 mt-1 block">
                      {(away_team.power_rating).toFixed(1)} pts
                    </span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Home Field Advantage</span>
                    <span className="text-sm font-bold text-slate-400 mt-1 block">
                      +0.0 pts (Road)
                    </span>
                  </div>
                </div>
              </div>

              {/* Home Team Card */}
              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <TeamLogo abbr={home_team.team_abbr} name={home_team.team_name} size="lg" />
                    <div>
                      <h4 className="text-base font-black text-white font-mono">{home_team.team_name}</h4>
                      <span className="text-xs text-slate-400 font-mono">Home Team</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-1 rounded">
                    HOME
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Power Rating</span>
                    <span className="text-base font-extrabold text-emerald-400 mt-1 block">
                      {home_team.power_rating >= 0 ? `+${home_team.power_rating.toFixed(2)}` : home_team.power_rating.toFixed(2)}
                    </span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Market Consensus</span>
                    <span className="text-sm font-bold text-white mt-1 block">
                      {market.home_consensus_spread >= 0 ? `+${market.home_consensus_spread.toFixed(1)}` : market.home_consensus_spread.toFixed(1)}
                    </span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">SemiSharp Rating</span>
                    <span className="text-sm font-bold text-emerald-400 mt-1 block">
                      {(home_team.power_rating + semisharp_projection.home_field_points).toFixed(1)} pts
                    </span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Home Field Advantage</span>
                    <span className="text-sm font-bold text-amber-400 mt-1 block">
                      +{semisharp_projection.home_field_points.toFixed(1)} pts
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Side-by-Side Rating Visual Comparison Bars */}
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4 font-mono">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-3">
                Rating Component Breakdown & Comparison
              </h4>

              <div className="space-y-4 text-xs">
                {/* Power Rating Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-300 font-bold">
                    <span>Power Rating Comparison</span>
                    <span>
                      {away_team.team_abbr} ({away_team.power_rating.toFixed(1)}) vs {home_team.team_abbr} ({home_team.power_rating.toFixed(1)})
                    </span>
                  </div>
                  <div className="h-3 bg-slate-900 rounded-full overflow-hidden flex">
                    <div
                      className="bg-indigo-500 h-full transition-all duration-500"
                      style={{ width: `${Math.min(90, Math.max(10, 50 + (away_team.power_rating - home_team.power_rating) * 3))}%` }}
                    />
                    <div className="bg-emerald-500 flex-1 h-full" />
                  </div>
                </div>

                {/* Home Field Advantage Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-300 font-bold">
                    <span>Home Field Impact</span>
                    <span className="text-amber-400">+{semisharp_projection.home_field_points.toFixed(1)} pts ({home_team.team_abbr})</span>
                  </div>
                  <div className="h-3 bg-slate-900 rounded-full overflow-hidden flex">
                    <div className="bg-slate-800 w-1/2 h-full" />
                    <div className="bg-amber-500 w-1/2 h-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: MODEL */}
        {activeTab === 'model' && (() => {
          const isHomeFav = semisharp_projection.projected_favorite_abbr === home_team.team_abbr;
          const favConsensusVal = isHomeFav ? market.home_consensus_spread : market.away_consensus_spread;
          const favConsensusStr = `${semisharp_projection.projected_favorite_abbr} ${formatSpread(favConsensusVal)}`;

          const edgeVal = isHomeFav
            ? (market.home_edge?.edge_points ?? (Math.abs(semisharp_projection.projected_spread) - Math.abs(favConsensusVal)))
            : (market.away_edge?.edge_points ?? (Math.abs(semisharp_projection.projected_spread) - Math.abs(favConsensusVal)));

          const displayRiskLevel = primaryRisk?.level
            ? primaryRisk.level.charAt(0).toUpperCase() + primaryRisk.level.slice(1).toLowerCase()
            : 'Medium';

          return (
            <div className="space-y-6 animate-fade-in font-mono">
              <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                      How SemiSharp Arrived At This Recommendation
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      Algorithmic breakdown & analytical pipeline metadata
                    </span>
                  </div>
                </div>

                {/* Summary Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">SemiSharp Projection</span>
                    <span className="text-sm font-black text-emerald-400 mt-0.5 block">
                      {semisharp_projection.projected_favorite_abbr} {formatSpread(semisharp_projection.projected_spread)}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Market Consensus</span>
                    <span className="text-sm font-black text-white mt-0.5 block">
                      {favConsensusStr}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Model Edge</span>
                    <span className="text-sm font-black text-indigo-400 mt-0.5 block">
                      {edgeVal >= 0 ? `+${edgeVal.toFixed(1)}` : edgeVal.toFixed(1)} pts
                    </span>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Risk Evaluation</span>
                    <span className="text-sm font-black text-amber-400 mt-0.5 block">
                      {displayRiskLevel}
                    </span>
                  </div>
                </div>

                {/* Additional Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs border-t border-slate-800 pt-4">
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Sportsbooks Reporting</span>
                    <span className="text-sm font-bold text-slate-200">{market.sportsbook_count} Active Books</span>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Last Updated</span>
                    <span className="text-xs font-semibold text-slate-300">
                      {market.latest_snapshot ? new Date(market.latest_snapshot).toLocaleString() : '—'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Model Version</span>
                    <span className="text-sm font-bold text-white">{semisharp_projection.source_system}</span>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Data Source</span>
                    <span className="text-xs font-semibold text-emerald-400">Odds API + SemiSharp Pipeline v3.1</span>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Pipeline Status</span>
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      LIVE API SYNCHRONIZED
                    </span>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Execution Environment</span>
                    <span className="text-xs font-semibold text-slate-300">Server-Side FastAPI Endpoint</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </motion.div>
  );
};
