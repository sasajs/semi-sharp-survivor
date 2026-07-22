import React, { useState, useEffect, useMemo } from 'react';
import { SemiSharpApi } from '../api';
import { RiskItem, RiskResponse } from '../types';
import { Card, LoadingSpinner, Alert, Button } from './ui';
import { RiskDisplay } from './RiskDisplay';
import { 
  AlertOctagon, 
  RefreshCw, 
  ShieldAlert, 
  Search, 
  ArrowUpDown, 
  Activity, 
  Tag,
  Gauge,
  ChevronDown,
  ChevronUp,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Info,
  Calendar,
  BarChart2,
  X,
  Eye,
  Sliders,
  CheckCircle2
} from 'lucide-react';

interface RiskAnalysisProps {
  season: number;
  week: number;
}

type SortOption = 'points-desc' | 'points-asc' | 'team-name' | 'factors-desc';

const getRiskLevel = (points: number) => {
  if (points <= 5) {
    return {
      label: 'LOW',
      badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      barClass: 'bg-emerald-500',
    };
  }
  if (points <= 15) {
    return {
      label: 'MODERATE',
      badgeClass: 'text-amber-700 bg-amber-50 border-amber-200',
      barClass: 'bg-amber-400',
    };
  }
  if (points <= 25) {
    return {
      label: 'ELEVATED',
      badgeClass: 'text-orange-700 bg-orange-50 border-orange-200',
      barClass: 'bg-orange-500',
    };
  }
  return {
    label: 'HIGH',
    badgeClass: 'text-rose-700 bg-rose-50 border-rose-200',
    barClass: 'bg-rose-600',
  };
};

const mapRiskType = (type: string): string => {
  const cleanType = type.trim().toUpperCase();
  switch (cleanType) {
    case 'SMALL_FAVORITE_RISK':
      return 'Small Favorite Risk';
    case 'QB_QUALITY_GAP':
      return 'Quarterback Quality Gap';
    case 'PFF_STRENGTH_GAP':
      return 'Team Strength Gap';
    case 'INJURY_CLUSTER':
      return 'Injury Cluster Risk';
    case 'WEATHER_EXPOSURE':
      return 'Weather Exposure Risk';
    case 'REST_DISADVANTAGE':
      return 'Rest Disadvantage';
    default:
      return cleanType
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
  }
};

export const RiskAnalysis: React.FC<RiskAnalysisProps> = ({ season: initialSeason, week: initialWeek }) => {
  const [selectedSeason, setSelectedSeason] = useState<number>(initialSeason);
  const [selectedWeek, setSelectedWeek] = useState<number>(initialWeek);
  
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [apiResponse, setApiResponse] = useState<RiskResponse | null>(null);
  const [methodologyData, setMethodologyData] = useState<any>(null);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('points-desc');
  const [showMethodology, setShowMethodology] = useState<boolean>(true);

  // Detail Modal State
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<RiskItem | null>(null);
  const [gameDetailData, setGameDetailData] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Sync with props if updated
  useEffect(() => {
    setSelectedSeason(initialSeason);
    setSelectedWeek(initialWeek);
  }, [initialSeason, initialWeek]);

  // Fetch risks for current season & week
  const fetchRisks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await SemiSharpApi.getRisk(selectedSeason, selectedWeek);
      if (response && response.risks) {
        setRisks(response.risks);
        setApiResponse(response);
      } else {
        setRisks([]);
        setApiResponse(null);
      }
    } catch (err: any) {
      console.error('Error fetching risks:', err);
      let errorDetails = 'Connection failed';
      if (err && typeof err === 'object') {
        errorDetails = err.message || err.detail || JSON.stringify(err);
      } else if (err) {
        errorDetails = String(err);
      }
      setError(errorDetails);
    } finally {
      setLoading(false);
    }
  };

  // Fetch methodology once or on reload
  const fetchMethodology = async () => {
    try {
      const data = await SemiSharpApi.getRiskMethodology();
      if (data) {
        setMethodologyData(data);
      }
    } catch (err) {
      console.warn('Methodology endpoint info unavailable, using fallback stats', err);
    }
  };

  useEffect(() => {
    fetchRisks();
  }, [selectedSeason, selectedWeek]);

  useEffect(() => {
    fetchMethodology();
  }, []);

  // Handle View Details modal trigger
  const handleOpenDetails = async (item: RiskItem) => {
    setSelectedItem(item);
    setSelectedGameId(item.game_id);
    setDetailLoading(true);
    setDetailError(null);
    setGameDetailData(null);

    try {
      const details = await SemiSharpApi.getRiskGame(item.game_id);
      setGameDetailData(details);
    } catch (err: any) {
      console.warn('Game-level risk endpoint notice:', err);
      // Even if game endpoint returns error, we still have the row item details
      setDetailError('Detailed game endpoint response unavailable. Displaying summary risk metrics.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedGameId(null);
    setSelectedItem(null);
    setGameDetailData(null);
  };

  // Filter & Sort Risks
  const processedRisks = useMemo(() => {
    let result = [...risks];

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(r => {
        const mappedTypes = r.risk_types
          ? r.risk_types.split(',').map(s => mapRiskType(s).toLowerCase()).join(' ')
          : '';
        return r.team.toLowerCase().includes(term) || 
               r.game_id.toLowerCase().includes(term) ||
               r.risk_types.toLowerCase().includes(term) ||
               mappedTypes.includes(term);
      });
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'points-desc':
          return b.risk_points - a.risk_points;
        case 'points-asc':
          return a.risk_points - b.risk_points;
        case 'team-name':
          return a.team.localeCompare(b.team);
        case 'factors-desc':
          return b.risk_factor_count - a.risk_factor_count;
        default:
          return 0;
      }
    });

    return result;
  }, [risks, searchTerm, sortBy]);

  // Summary Metrics calculations
  const summaryMetrics = useMemo(() => {
    if (!risks || risks.length === 0) {
      return {
        teamsEvaluated: 0,
        highestRiskTeam: 'N/A',
        highestRiskScore: 0,
        averageRiskScore: 0,
        version: methodologyData?.engine_version || (apiResponse as any)?.model_version || 'V3.0',
      };
    }

    let highestItem = risks[0];
    let totalScore = 0;

    risks.forEach(r => {
      totalScore += r.risk_points;
      if (r.risk_points > highestItem.risk_points) {
        highestItem = r;
      }
    });

    const avg = totalScore / risks.length;

    return {
      teamsEvaluated: risks.length,
      highestRiskTeam: highestItem.team,
      highestRiskScore: highestItem.risk_points,
      averageRiskScore: avg,
      version: methodologyData?.engine_version || (apiResponse as any)?.model_version || 'V3.0',
    };
  }, [risks, apiResponse, methodologyData]);

  return (
    <div className="space-y-6 animate-fade-in" id="risk_analysis_container">
      
      {/* 1. CONTROLS & FILTERING BAR */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-3xs space-y-4" id="risk_controls_panel">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search by team name, game ID, or risk factor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all font-mono"
              id="risk_search_input"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action & Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Season Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs font-mono">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Season:</span>
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(Number(e.target.value))}
                className="bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                id="select_risk_season"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
                <option value={2024}>2024</option>
              </select>
            </div>

            {/* Week Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs font-mono">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Week:</span>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                className="bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                id="select_risk_week"
              >
                {Array.from({ length: 18 }, (_, i) => i + 1).map((w) => (
                  <option key={w} value={w}>Week {w}</option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRisks}
              disabled={loading}
              className="font-mono text-xs font-bold border-slate-200 bg-white"
              id="btn_refresh_risks"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Sort selector bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400 font-mono uppercase tracking-wider text-[10px]">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl px-3 py-1 focus:outline-hidden cursor-pointer font-mono"
              id="select_risk_sort"
            >
              <option value="points-desc">Highest Risk Score First</option>
              <option value="points-asc">Lowest Risk Score First</option>
              <option value="team-name">Team Name (A-Z)</option>
              <option value="factors-desc">Most Risk Factors</option>
            </select>
          </div>

          <div className="text-[11px] font-mono text-slate-400 font-bold">
            Evaluated Teams: <span className="text-slate-800 font-extrabold">{processedRisks.length}</span>
          </div>
        </div>
      </div>

      {/* 2. SUMMARY CARDS */}
      {!loading && !error && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3" id="risk_summary_cards">
          
          {/* Card 1: Teams Evaluated */}
          <Card className="border border-slate-200/80 bg-white p-4" id="card_teams_evaluated">
            <div className="flex flex-col justify-between h-full">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
                Teams Evaluated
              </span>
              <div className="py-2">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {summaryMetrics.teamsEvaluated}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                Season {selectedSeason} • Week {selectedWeek}
              </span>
            </div>
          </Card>

          {/* Card 2: Highest Risk Team */}
          <Card className="border border-slate-200/80 bg-white p-4" id="card_highest_risk_team">
            <div className="flex flex-col justify-between h-full">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
                Highest Risk Team
              </span>
              <div className="py-2 flex items-center justify-between">
                <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                  {summaryMetrics.highestRiskTeam}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                Peak vulnerability
              </span>
            </div>
          </Card>

          {/* Card 3: Highest Risk Score */}
          <Card className="border border-slate-200/80 bg-white p-4" id="card_highest_risk_score">
            <div className="flex flex-col justify-between h-full">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
                Highest Risk Score
              </span>
              <div className="py-2">
                <RiskDisplay score={summaryMetrics.highestRiskScore} stars={null} />
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                Max points rating
              </span>
            </div>
          </Card>

          {/* Card 4: Average Risk Score */}
          <Card className="border border-slate-200/80 bg-white p-4" id="card_avg_risk_score">
            <div className="flex flex-col justify-between h-full">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
                Average Risk Score
              </span>
              <div className="py-2">
                <RiskDisplay score={summaryMetrics.averageRiskScore} stars={null} />
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                Weekly slate mean
              </span>
            </div>
          </Card>

          {/* Card 5: Risk Engine Version */}
          <Card className="border border-slate-200/80 bg-white p-4 col-span-2 md:col-span-1" id="card_engine_version">
            <div className="flex flex-col justify-between h-full">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
                Risk Engine Version
              </span>
              <div className="py-2">
                <span className="text-xl font-black text-slate-900 font-mono">
                  {summaryMetrics.version}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                SemiSharp Risk Model
              </span>
            </div>
          </Card>

        </div>
      )}

      {/* 3. METHODOLOGY & TRANSPARENCY ACCORDION */}
      <Card className="overflow-hidden bg-white border border-slate-200/85 rounded-2xl shadow-3xs transition-all" id="risk_methodology_card">
        <div 
          onClick={() => setShowMethodology(!showMethodology)}
          className="flex items-center justify-between p-5 bg-slate-50/60 border-b border-slate-100 cursor-pointer select-none hover:bg-slate-50 transition-colors"
          id="toggle_methodology_header"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 text-white rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight font-mono uppercase">How SemiSharp Calculates Risk</h2>
              <p className="text-[10px] text-slate-500 font-medium font-sans">
                Methodology, Historical Foundation & Decision Support Guidelines
              </p>
            </div>
          </div>
          <button className="p-1.5 rounded-lg hover:bg-slate-200/60 text-slate-500 transition-all cursor-pointer">
            {showMethodology ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showMethodology && (
          <div className="p-6 space-y-6">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
              <p className="text-xs text-slate-700 leading-relaxed font-sans font-medium">
                SemiSharp Risk Analysis identifies games where projected favorites have an elevated probability of an upset. The goal is not to predict winners directly. Instead, the system identifies fragile favorites — teams that appear safe based on market expectations but contain characteristics historically associated with increased upset probability.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Historical Foundation */}
              <div className="space-y-4 p-4 rounded-xl border border-slate-200/70 bg-white shadow-3xs">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Calendar className="w-4 h-4 text-slate-700" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Historical Foundation</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  SemiSharp Risk Engine {summaryMetrics.version} was developed using extensive historical NFL game analysis combined with real-time matchup data.
                </p>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 text-center">
                    <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest font-mono mb-1">Seasons Analyzed</span>
                    <span className="text-xs font-mono font-black text-slate-900">
                      {methodologyData?.historical_foundation?.seasons_analyzed || '2015–2025'}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 text-center">
                    <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest font-mono mb-1">Games Analyzed</span>
                    <span className="text-xs font-mono font-black text-slate-900">
                      {methodologyData?.historical_foundation?.games_analyzed?.toLocaleString() || '3,028'}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 text-center">
                    <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest font-mono mb-1">Baseline Upset Rate</span>
                    <span className="text-xs font-mono font-black text-slate-900">
                      {methodologyData?.historical_foundation?.baseline_upset_rate || '34.08%'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Spread Breakdown Table */}
              <div className="space-y-3 p-4 rounded-xl border border-slate-200/70 bg-white shadow-3xs">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <TrendingUp className="w-4 h-4 text-slate-700" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Spread vs. Upset Probability</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  Favorite spread size is the single strongest historical predictor of upset risk.
                </p>
                
                <div className="overflow-hidden border border-slate-200/70 rounded-lg text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase font-bold border-b border-slate-200/70">
                        <th className="py-1.5 px-3">Favorite Spread</th>
                        <th className="py-1.5 px-3 text-right">Historical Upset Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono font-medium text-slate-700">
                      <tr>
                        <td className="py-1.5 px-3">0 – 3 points</td>
                        <td className="py-1.5 px-3 text-right font-bold text-amber-700">44.98%</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3">3 – 7 points</td>
                        <td className="py-1.5 px-3 text-right font-bold text-slate-800">32.61%</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3">7 – 14 points</td>
                        <td className="py-1.5 px-3 text-right font-bold text-slate-800">19.65%</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3">14+ points</td>
                        <td className="py-1.5 px-3 text-right font-bold text-emerald-700">8.47%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Risk Factors List */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-slate-700" /> Evaluated Risk Factors
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-left space-y-1">
                  <h4 className="text-[11px] font-extrabold text-slate-900 uppercase font-mono">Market Confidence</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-sans">Favorite spread size is the primary historical risk indicator.</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-left space-y-1">
                  <h4 className="text-[11px] font-extrabold text-slate-900 uppercase font-mono">Team Strength</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-sans">Power Rating gaps and overall quality differences are evaluated.</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-left space-y-1">
                  <h4 className="text-[11px] font-extrabold text-slate-900 uppercase font-mono">Quarterback Quality</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-sans">Quarterback tier differences and backup statuses are factored.</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-left space-y-1">
                  <h4 className="text-[11px] font-extrabold text-slate-900 uppercase font-mono">Injuries</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-sans">Cluster injuries and key position health affect vulnerability.</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-left space-y-1">
                  <h4 className="text-[11px] font-extrabold text-slate-900 uppercase font-mono">Situational Factors</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-sans">Rest advantage, travel distance, and weather exposure adjustments.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* 4. WEEKLY RISK TABLE */}
      <Card className="bg-white border border-slate-200/85 rounded-2xl shadow-3xs overflow-hidden" id="risk_table_card">
        
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Weekly Team Risk Evaluation</h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono font-bold">
            Showing {processedRisks.length} records
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <LoadingSpinner size="md" message={`Loading risk metrics for Season ${selectedSeason} Week ${selectedWeek}...`} />
          </div>
        ) : error ? (
          <div className="p-6">
            <Alert type="warning" title="API Notice" message={error} />
            <div className="mt-4 text-center">
              <Button size="sm" onClick={fetchRisks} variant="outline">
                Retry Connection
              </Button>
            </div>
          </div>
        ) : processedRisks.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <AlertOctagon className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No Risk Records Found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No risk entries match the current season, week, or filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="tbl_risk_analysis">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider font-mono">
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4">Game</th>
                  <th className="py-3 px-4">Risk Score</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4 text-center">Risk Factors</th>
                  <th className="py-3 px-4">Detected Risk Categories</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
                {processedRisks.map((item) => {
                  const level = getRiskLevel(item.risk_points);
                  const typesArray = item.risk_types
                    ? item.risk_types.split(',').map(s => s.trim()).filter(Boolean)
                    : [];

                  return (
                    <tr 
                      key={`${item.game_id}_${item.team}`} 
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Team */}
                      <td className="py-3.5 px-4 font-extrabold font-mono text-slate-900 text-sm">
                        {item.team}
                      </td>

                      {/* Game */}
                      <td className="py-3.5 px-4 font-mono text-slate-600 text-xs">
                        {item.game_id}
                      </td>

                      {/* Risk Score */}
                      <td className="py-3.5 px-4">
                        <RiskDisplay score={item.risk_points} stars={null} />
                      </td>

                      {/* Risk Level */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold font-mono border ${level.badgeClass}`}>
                          {level.label}
                        </span>
                      </td>

                      {/* Number of Risk Factors */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                        {item.risk_factor_count}
                      </td>

                      {/* Risk Factors Tags */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-md">
                          {typesArray.length > 0 ? (
                            typesArray.map((t, idx) => (
                              <span 
                                key={idx} 
                                className="text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80 px-2 py-0.5 rounded font-mono"
                              >
                                {mapRiskType(t)}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">None</span>
                          )}
                        </div>
                      </td>

                      {/* View Details */}
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenDetails(item)}
                          className="text-xs font-bold font-mono text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                          id={`btn_view_details_${item.game_id}_${item.team}`}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
                          View Details
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 5. RISK DETAIL MODAL */}
      {selectedGameId && selectedItem && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in" id="modal_risk_details">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-slate-900 text-white rounded-xl">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 font-mono uppercase">
                    Risk Breakdown: {selectedItem.team}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Game ID: {selectedItem.game_id} • Season {selectedSeason} Week {selectedWeek}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseDetails}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                id="btn_close_risk_modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {detailLoading ? (
                <div className="py-12">
                  <LoadingSpinner size="md" message={`Fetching risk analysis details for ${selectedItem.game_id}...`} />
                </div>
              ) : (
                <>
                  {detailError && (
                    <Alert type="info" title="Note" message={detailError} />
                  )}

                  {/* Metrics Row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 text-center">
                      <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono mb-1">
                        Team
                      </span>
                      <span className="text-lg font-black font-mono text-slate-900">
                        {selectedItem.team}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 text-center">
                      <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono mb-1">
                        Risk Score
                      </span>
                      <div className="flex justify-center pt-1">
                        <RiskDisplay score={selectedItem.risk_points} stars={null} />
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 text-center">
                      <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono mb-1">
                        Risk Factors
                      </span>
                      <span className="text-lg font-black font-mono text-slate-900">
                        {selectedItem.risk_factor_count}
                      </span>
                    </div>
                  </div>

                  {/* Individual Risk Factors List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-slate-700" /> Individual Risk Factors
                    </h4>

                    {selectedItem.risk_types ? (
                      <div className="space-y-2">
                        {selectedItem.risk_types.split(',').map((typeStr, idx) => {
                          const mapped = mapRiskType(typeStr);
                          return (
                            <div 
                              key={idx}
                              className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl flex items-start gap-3"
                            >
                              <div className="p-1 bg-amber-100 text-amber-800 rounded-md shrink-0 mt-0.5">
                                <AlertOctagon className="w-3.5 h-3.5" />
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-xs font-extrabold text-slate-900 font-mono block">
                                  {mapped}
                                </span>
                                <p className="text-[11px] text-slate-600 font-sans leading-relaxed font-medium">
                                  Identified by SemiSharp Risk Engine as a contributing factor to favorite vulnerability.
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No specific risk factor categories returned for this matchup.</p>
                    )}
                  </div>

                  {/* Additional API detail metadata if present */}
                  {gameDetailData && typeof gameDetailData === 'object' && (
                    <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2 text-xs">
                      <span className="font-extrabold text-slate-700 font-mono text-[10px] uppercase block">
                        Game Risk Payload Details
                      </span>
                      <pre className="text-[10px] font-mono text-slate-600 bg-white p-2.5 rounded border border-slate-200/60 overflow-x-auto">
                        {JSON.stringify(gameDetailData, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Decision Support Guidance Note */}
                  <div className="flex items-start gap-3 p-4 bg-blue-50/80 border border-blue-200/80 rounded-xl text-blue-900 text-xs shadow-2xs">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-bold text-blue-950 font-mono text-[11px] uppercase tracking-wide block">
                        Decision Support Guidance
                      </span>
                      <p className="text-slate-700 leading-relaxed font-sans font-medium">
                        Risk Analysis supplements Win Probability and should be interpreted as an additional decision-support metric rather than a prediction of the game outcome.
                      </p>
                    </div>
                  </div>

                </>
              )}

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <Button size="sm" variant="outline" onClick={handleCloseDetails} className="font-mono text-xs">
                Close
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
