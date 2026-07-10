import React, { useState, useEffect, useMemo } from 'react';
import { SemiSharpApi } from '../api';
import { RiskItem } from '../types';
import { Card, LoadingSpinner, Alert } from './ui';
import { 
  AlertOctagon, 
  RefreshCw, 
  ShieldAlert, 
  Search, 
  ArrowUpDown, 
  Activity, 
  Tag,
  Gauge,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Info,
  Calendar,
  Award,
  BarChart2
} from 'lucide-react';

interface RiskAnalysisProps {
  season: number;
  week: number;
}

type SortOption = 'points-desc' | 'points-asc' | 'team-name' | 'game-id';

const getRiskLevel = (points: number) => {
  if (points <= 5) {
    return {
      label: 'LOW',
      badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200/80',
      barClass: 'bg-emerald-500',
    };
  }
  if (points <= 15) {
    return {
      label: 'MODERATE',
      badgeClass: 'text-amber-700 bg-amber-50/70 border-amber-200/80',
      barClass: 'bg-amber-400',
    };
  }
  if (points <= 25) {
    return {
      label: 'ELEVATED',
      badgeClass: 'text-orange-700 bg-orange-50/70 border-orange-200/80',
      barClass: 'bg-orange-500',
    };
  }
  return {
    label: 'HIGH',
    badgeClass: 'text-rose-700 bg-rose-50 border-rose-200/80',
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
    default:
      return cleanType
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
  }
};

const getRiskExplanations = (types: string[]): string[] => {
  const explanations: string[] = [];
  const uppercaseTypes = types.map(t => t.toUpperCase());
  
  if (uppercaseTypes.some(t => t.includes('SMALL_FAVORITE_RISK'))) {
    explanations.push('Historical analysis shows narrow favorites are significantly more vulnerable to upset.');
  }
  if (uppercaseTypes.some(t => t.includes('QB_QUALITY_GAP'))) {
    explanations.push('Quarterback quality differences increase uncertainty.');
  }
  if (uppercaseTypes.some(t => t.includes('PFF_STRENGTH_GAP'))) {
    explanations.push('Team strength differences reduce favorite confidence.');
  }
  return explanations;
};

export const RiskAnalysis: React.FC<RiskAnalysisProps> = ({ season, week }) => {
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('points-desc');
  const [showMethodology, setShowMethodology] = useState<boolean>(true);

  const fetchRisks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await SemiSharpApi.getRisk(season, week);
      if (response && response.risks) {
        setRisks(response.risks);
      } else {
        setRisks([]);
      }
    } catch (err: any) {
      console.error('Error fetching risks:', err);
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
    fetchRisks();
  }, [season, week]);

  // Handle Filtering & Sorting
  const processedRisks = useMemo(() => {
    let result = [...risks];

    // Filter by search term (teams / game_id / risk types)
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

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'points-desc':
          return b.risk_points - a.risk_points;
        case 'points-asc':
          return a.risk_points - b.risk_points;
        case 'team-name':
          return a.team.localeCompare(b.team);
        case 'game-id':
          return a.game_id.localeCompare(b.game_id);
        default:
          return 0;
      }
    });

    return result;
  }, [risks, searchTerm, sortBy]);

  return (
    <div className="space-y-6">
      {/* Top Bar with Status and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 text-slate-800 p-2 rounded-xl border border-slate-200/60 font-semibold text-xs font-mono">
            NFL {season} | WEEK {week} RISK PROFILE
          </div>
          {risks.length > 0 && !loading && !error && (
            <span className="text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 inline-block" />
              🟢 LIVE API
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono bg-slate-50 border border-slate-100 px-2 py-1 rounded-md">
            GET /risk/{season}/{week}
          </span>
          <button
            onClick={fetchRisks}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-slate-50 border border-slate-200/80 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Risks
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20">
          <LoadingSpinner size="md" message={`Analyzing risk metrics for Season ${season} Week ${week} from FastAPI backend...`} />
        </div>
      ) : error ? (
        <div className="space-y-4">
          <Alert
            type="warning"
            title="Risk Gateway Error"
            message={error}
          />
          <Card className="p-8 text-center bg-white border border-slate-100">
            <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium mb-4">
              Could not establish connection with FastAPI risk analysis services.
            </p>
            <button
              onClick={fetchRisks}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 cursor-pointer transition-colors"
            >
              Retry API Request
            </button>
          </Card>
        </div>
      ) : risks.length === 0 ? (
        <Card className="p-16 text-center space-y-4 bg-white border border-slate-100">
          <AlertOctagon className="w-12 h-12 mx-auto text-slate-300" />
          <h3 className="text-sm font-bold text-slate-800">No Risk Metrics Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            There are no risk profiles returned by the engine for Season {season} Week {week}.
          </p>
        </Card>
      ) : (
        <>
          {/* Methodology & Transparency Panel */}
          <Card className="overflow-hidden bg-white border border-slate-200/85 rounded-2xl shadow-3xs transition-all">
            {/* Header bar */}
            <div 
              onClick={() => setShowMethodology(!showMethodology)}
              className="flex items-center justify-between p-5 bg-slate-50/50 border-b border-slate-100 cursor-pointer select-none hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800 tracking-tight">How SemiSharp Calculates Risk</h2>
                  <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider font-sans">
                    The Scholar's Guide to Sports Analytics • Methodology & Transparency
                  </p>
                </div>
              </div>
              <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer">
                {showMethodology ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Content body */}
            {showMethodology && (
              <div className="p-6 space-y-6">
                {/* Introductory statement */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100/80">
                  <p className="text-xs text-slate-600 leading-relaxed font-serif">
                    "SemiSharp Risk Analysis identifies games where projected favorites have an elevated probability of an upset. The goal is not to predict winners directly. Instead, the system identifies fragile favorites — teams that appear safe based on market expectations but contain characteristics historically associated with increased upset probability."
                  </p>
                </div>

                {/* Grid for stats & historical findings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Box 1: Historical Foundation */}
                  <div className="space-y-4 p-4 rounded-xl border border-slate-100 bg-white shadow-3xs">
                    <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                      <Calendar className="w-4 h-4 text-amber-600" />
                      <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Historical Foundation</h3>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      SemiSharp Risk Engine V3 was developed using historical NFL analysis combined with current matchup data.
                    </p>
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100/80 text-center">
                        <span className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest leading-none mb-1">Seasons</span>
                        <span className="text-xs font-mono font-bold text-slate-800">2015–2025</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100/80 text-center">
                        <span className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest leading-none mb-1">Games</span>
                        <span className="text-xs font-mono font-bold text-slate-800">3,028</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100/80 text-center">
                        <span className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest leading-none mb-1">Baseline</span>
                        <span className="text-xs font-mono font-bold text-slate-800">34.08%</span>
                      </div>
                    </div>
                  </div>

                  {/* Box 2: What Historical Analysis Found */}
                  <div className="space-y-3 p-4 rounded-xl border border-slate-100 bg-white shadow-3xs">
                    <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                      <TrendingUp className="w-4 h-4 text-amber-600" />
                      <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">What Historical Analysis Found</h3>
                    </div>
                    <p className="text-[11px] text-slate-700 font-bold font-serif italic">
                      "Favorite spread size is the strongest historical predictor of upset risk."
                    </p>
                    
                    {/* Micro Table */}
                    <div className="overflow-hidden border border-slate-100 rounded-lg text-[10.5px]">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-400 font-mono text-[8px] uppercase font-bold border-b border-slate-100">
                            <th className="py-1 px-2.5">Favorite Spread</th>
                            <th className="py-1 px-2.5 text-right">Historical Upset Rate</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                          <tr>
                            <td className="py-1 px-2.5">0–3 points</td>
                            <td className="py-1 px-2.5 text-right font-mono font-bold text-amber-600">44.98%</td>
                          </tr>
                          <tr>
                            <td className="py-1 px-2.5">3–7 points</td>
                            <td className="py-1 px-2.5 text-right font-mono">32.61%</td>
                          </tr>
                          <tr>
                            <td className="py-1 px-2.5">7–14 points</td>
                            <td className="py-1 px-2.5 text-right font-mono">19.65%</td>
                          </tr>
                          <tr>
                            <td className="py-1 px-2.5">14+ points</td>
                            <td className="py-1 px-2.5 text-right font-mono">8.47%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <p className="text-[10px] text-slate-500 leading-normal italic">
                      "Small favorites are significantly more vulnerable because the expected advantage is limited."
                    </p>
                  </div>
                </div>

                {/* Model Process Flow */}
                <div className="space-y-3 p-4 rounded-xl border border-slate-100 bg-slate-50/40">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart2 className="w-3.5 h-3.5 text-amber-600" /> How the Model Was Developed
                  </h3>
                  
                  {/* Flow arrows */}
                  <div className="flex flex-col md:flex-row gap-2 items-center justify-between text-center pt-1 font-mono text-[9px] uppercase tracking-wider">
                    <div className="w-full md:w-auto flex-1 bg-white border border-slate-150 p-2 rounded-lg font-bold text-slate-700 shadow-3xs">
                      Historical NFL Data
                    </div>
                    <div className="flex justify-center text-slate-300 font-bold shrink-0">
                      <ArrowRight className="w-3.5 h-3.5 rotate-90 md:rotate-0" />
                    </div>
                    <div className="w-full md:w-auto flex-1 bg-white border border-slate-150 p-2 rounded-lg font-bold text-slate-700 shadow-3xs">
                      Statistical Analysis
                    </div>
                    <div className="flex justify-center text-slate-300 font-bold shrink-0">
                      <ArrowRight className="w-3.5 h-3.5 rotate-90 md:rotate-0" />
                    </div>
                    <div className="w-full md:w-auto flex-1 bg-white border border-slate-150 p-2 rounded-lg font-bold text-slate-700 shadow-3xs">
                      Risk Factor Identification
                    </div>
                    <div className="flex justify-center text-slate-300 font-bold shrink-0">
                      <ArrowRight className="w-3.5 h-3.5 rotate-90 md:rotate-0" />
                    </div>
                    <div className="w-full md:w-auto flex-1 bg-white border border-slate-150 p-2 rounded-lg font-bold text-slate-700 shadow-3xs">
                      Factor Weighting
                    </div>
                    <div className="flex justify-center text-slate-300 font-bold shrink-0">
                      <ArrowRight className="w-3.5 h-3.5 rotate-90 md:rotate-0" />
                    </div>
                    <div className="w-full md:w-auto flex-1 bg-white border border-slate-150 p-2 rounded-lg font-bold text-slate-700 shadow-3xs">
                      Game-Level Risk Score
                    </div>
                    <div className="flex justify-center text-slate-300 font-bold shrink-0">
                      <ArrowRight className="w-3.5 h-3.5 rotate-90 md:rotate-0" />
                    </div>
                    <div className="w-full md:w-auto flex-1 bg-amber-600 text-white p-2 rounded-lg font-extrabold shadow-3xs uppercase tracking-widest">
                      Risk Rating
                    </div>
                  </div>
                </div>

                {/* Risk Factors Grid */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-amber-600" /> Risk Factors Considered
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-left space-y-1">
                      <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-tight">Market Confidence</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Favorite spread size is the primary historical risk indicator.</p>
                    </div>
                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-left space-y-1">
                      <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-tight">Team Strength</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Team quality differences are evaluated.</p>
                    </div>
                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-left space-y-1">
                      <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-tight">Quarterback Quality</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Quarterback advantages or disadvantages are considered.</p>
                    </div>
                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-left space-y-1">
                      <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-tight">Injuries</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Current injury impact can increase uncertainty.</p>
                    </div>
                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-left space-y-1">
                      <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-tight">Situational Factors</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Travel, rest, neutral locations, and other matchup conditions may influence risk.</p>
                    </div>
                  </div>
                </div>

                {/* Transparency Disclaimer */}
                <div className="flex items-start gap-2.5 bg-amber-50/40 p-3 rounded-xl border border-amber-100 text-amber-900/85 text-[10.5px]">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="font-medium font-sans">
                    <strong>Risk Assessment Disclaimer:</strong> Risk ratings are not predictions of game outcomes. They identify situations where historical analysis suggests a higher probability of an upset.
                  </p>
                </div>
              </div>
            )}
          </Card>

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
                placeholder="Search by team, ID, or risk type..."
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
                <option value="points-desc">Highest Risk Points First</option>
                <option value="points-asc">Lowest Risk Points First</option>
                <option value="team-name">Team Name (A-Z)</option>
                <option value="game-id">Game ID</option>
              </select>
            </div>
          </div>

          {/* Risks Display Grid */}
          {processedRisks.length === 0 ? (
            <div className="text-center py-10 text-slate-400 font-medium text-xs">
              No matching risk records found for "{searchTerm}".
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {processedRisks.map((item) => {
                // Parse risk types from comma-separated string
                const typesArray = item.risk_types
                  ? item.risk_types.split(',').map(s => s.trim()).filter(Boolean)
                  : [];

                const level = getRiskLevel(item.risk_points);
                const explanations = getRiskExplanations(typesArray);

                return (
                  <Card 
                    key={`${item.game_id}_${item.team}`}
                    className="relative overflow-hidden bg-white hover:border-slate-300 transition-all hover:shadow-xs p-5 flex flex-col justify-between gap-4 border border-slate-100/90 group"
                  >
                    {/* Visual indicator bar at the top with risk level color */}
                    <div className={`absolute top-0 left-0 right-0 h-1.5 ${level.barClass} transition-all`} />

                    <div className="space-y-3.5">
                      {/* Top Metadata Row */}
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 font-mono">
                        <span>ID: {item.game_id}</span>
                        <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${level.badgeClass} uppercase font-sans tracking-wider`}>
                          <Activity className="w-2.5 h-2.5" /> {level.label} RISK
                        </span>
                      </div>

                      {/* Main Team and Risk Metric Header */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-0.5">
                          <span className="text-xl font-black text-slate-800 tracking-tight block">
                            {item.team}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                            Analyzed Team
                          </span>
                        </div>

                        {/* Risk Points Badge */}
                        <div className="text-right">
                          <span className="text-lg font-mono font-black text-slate-800 block">
                            {item.risk_points.toFixed(0)} <span className="text-xs font-semibold text-slate-400">Risk Points</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Risk Details and Flags */}
                    <div className="pt-3 border-t border-slate-100 space-y-4">
                      {/* Evaluated Factors Count */}
                      <div className="flex items-center justify-between bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-amber-100 text-amber-700 rounded-lg">
                            <Gauge className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-slate-600">Risk Factor Count</span>
                        </div>
                        <span className="font-mono font-black text-slate-800">
                          {item.risk_factor_count}
                        </span>
                      </div>

                      {/* Risk Types Tag list */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Tag className="w-3 h-3 text-slate-400" /> Detected Risk Factors
                        </span>
                        
                        {typesArray.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {typesArray.map((type, idx) => (
                              <span 
                                key={idx} 
                                className="text-[9.5px] font-bold bg-slate-50 text-slate-700 border border-slate-200/50 px-2.5 py-1 rounded-md uppercase tracking-wider"
                              >
                                {mapRiskType(type)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic font-medium">
                            No risk factor categories returned by API.
                          </span>
                        )}
                      </div>

                      {/* Risk Explanations Section */}
                      {explanations.length > 0 && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/80 space-y-2">
                          <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">
                            Methodology Insights
                          </span>
                          <ul className="list-disc pl-4 space-y-1">
                            {explanations.map((exp, idx) => (
                              <li key={idx} className="text-[10.5px] text-slate-600 leading-normal font-medium font-serif italic">
                                "{exp}"
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Footer Source Marker */}
                    <div className="flex items-center justify-between text-[9px] font-semibold text-slate-400 pt-2 border-t border-slate-50">
                      <span className="flex items-center gap-1">
                        <HelpCircle className="w-3 h-3 text-slate-400" />
                        Backend Verifiable
                      </span>
                      <span>FastAPI Live Response</span>
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
