/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Alert } from './ui';
import { SemiSharpApi, ApiError } from '../api';
import {
  Brain,
  Sliders,
  Award,
  RefreshCw,
  AlertOctagon,
  Sparkles,
  Info,
  Database,
  ChevronDown,
  Star,
  CheckCircle
} from 'lucide-react';

interface RecommendationWorkspaceProps {
  season: number;
  week: number;
}

export const RecommendationWorkspace: React.FC<RecommendationWorkspaceProps> = ({ season, week }) => {
  const { selectedEntry } = useAuth();
  
  // State variables
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [metadataExpanded, setMetadataExpanded] = useState<boolean>(false);
  const [expandedStrategies, setExpandedStrategies] = useState<Record<string | number, boolean>>({});

  const getFormat = () => {
    return selectedEntry?.format_code || '';
  };

  const format = getFormat();

  const handleGenerate = async () => {
    if (!selectedEntry || !selectedEntry.format_code) return;
    setLoading(true);
    setError(null);
    setComparisonData(null);
    setGeneratedAt(null);
    setExpandedStrategies({});

    try {
      // Execute the multi-strategy backend comparison endpoint with active entry ID parameter
      const activeEntryId = selectedEntry?.entry_id;
      const res = await SemiSharpApi.compareStrategies(season, format, activeEntryId);
      setComparisonData(res);
      setGeneratedAt(new Date().toLocaleString());
    } catch (err: any) {
      console.error('Error generating strategy comparison:', err);
      let errorMsg = '';
      if (err instanceof ApiError) {
        errorMsg = err.message;
      } else if (err instanceof Error) {
        errorMsg = err.message;
      } else if (err && typeof err === 'object') {
        errorMsg = err.detail || err.message || JSON.stringify(err);
      } else {
        errorMsg = String(err);
      }
      setError(errorMsg || 'Failed to retrieve comparison from backend.');
    } finally {
      setLoading(false);
    }
  };

  // Extract the list of strategies from the backend response structure
  const getStrategiesList = (data: any): any[] => {
    if (!data) return [];
    if (data && Array.isArray(data.strategies)) {
      return data.strategies;
    }
    return [];
  };

  // Get the agreement summary from the root response level
  const getAgreementSummary = (data: any): any => {
    if (!data) return null;
    return data.agreement_summary || null;
  };

  const strategies = getStrategiesList(comparisonData);
  const agreementSummary = getAgreementSummary(comparisonData);

  // Toggle single strategy rationale view state
  const toggleStrategyExpand = (idx: string | number) => {
    setExpandedStrategies(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // Helper getters for properties using exact backend fields
  const getStrategyName = (item: any) => item.display_name || item.strategy_code || 'Unnamed Strategy';
  const getTeamLabel = (item: any) => item.primary_recommendation?.team_name || 'No Recommendation';
  const getTeamAbbr = (item: any) => item.primary_recommendation?.team || '';
  const getOpponentLabel = (item: any) => item.primary_recommendation?.opponent || '';
  const getRank = (item: any) => item.primary_recommendation?.rank;
  const getProjectedSpread = (item: any) => item.primary_recommendation?.projected_line;
  const getBaselineWp = (item: any) => item.primary_recommendation?.baseline_wp;
  const getRiskAdjustedWp = (item: any) => item.primary_recommendation?.risk_adjusted_wp;
  const getRiskScore = (item: any) => item.primary_recommendation?.risk_score;
  const getRiskLevel = (item: any) => item.primary_recommendation?.risk_level;
  const getMarketEdge = (item: any) => item.primary_recommendation?.edge_points;

  // Extract narrative texts without any front-end modifications
  const getNarrativeExplanations = (item: any) => {
    const list: { title: string; content: string }[] = [];
    if (item.objective) {
      list.push({ title: 'Strategy Objective', content: item.objective });
    }
    if (item.primary_recommendation?.rationale) {
      list.push({ title: 'Primary Rationale', content: item.primary_recommendation.rationale });
    }
    return list;
  };

  // Format probabilities safely as percentage (detect fraction vs multiplier)
  const formatPercentage = (val: any) => {
    const num = Number(val);
    if (isNaN(num)) return String(val);
    if (num <= 1) {
      return `${(num * 100).toFixed(1)}%`;
    }
    return `${num.toFixed(1)}%`;
  };

  // Render Star Rating Helper
  const renderStars = (count: any) => {
    const starCount = Number(count) || 0;
    if (starCount <= 0) return null;
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: starCount }).map((_, i) => (
          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
        ))}
      </div>
    );
  };

  // Skeletons representing real strategies comparison cards for layout stability
  const renderSkeleton = () => {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Consensus skeleton placeholder */}
        <div className="p-5 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
          <div className="h-4 w-40 bg-slate-200 rounded"></div>
          <div className="h-3.5 w-full bg-slate-100 rounded"></div>
        </div>

        {/* Strategy comparison cards */}
        {Array.from({ length: 3 }).map((_, sIdx) => (
          <div key={sIdx} className="bg-white border-2 border-slate-100 rounded-2xl overflow-hidden shadow-sm space-y-6">
            <div className="bg-slate-100 px-6 py-4 flex justify-between items-center">
              <div className="h-4 w-32 bg-slate-200 rounded"></div>
              <div className="h-5 w-16 bg-slate-200 rounded-full"></div>
            </div>
            
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-3">
                  <div className="h-4 w-24 bg-slate-100 rounded-full"></div>
                  <div className="h-10 w-64 bg-slate-200 rounded-md"></div>
                  <div className="h-4 w-40 bg-slate-100 rounded"></div>
                </div>
                <div className="h-12 w-24 bg-slate-100 rounded-xl"></div>
              </div>

              {/* Metrics placeholder */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, mIdx) => (
                  <div key={mIdx} className="p-3 bg-slate-50 rounded-xl space-y-2">
                    <div className="h-3 w-16 bg-slate-200 rounded"></div>
                    <div className="h-5 w-12 bg-slate-300 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render Agreement Summary Panel beautifully using exact backend fields
  const renderAgreementSummaryPanel = (data: any) => {
    if (!data) return null;
    
    return (
      <Card className="p-6 border-indigo-100 bg-indigo-50/25 text-left space-y-4 animate-fade-in">
        <div className="flex items-center gap-2 text-xs font-black text-indigo-700 uppercase tracking-wider font-mono">
          <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
          <span>Strategy Consensus & Agreement Summary</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pl-4 border-l-2 border-indigo-300">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono block">
              Compared Legs
            </span>
            <span className="text-lg font-black text-slate-800 font-mono block">
              {data.compared_leg_count}
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono block">
              Complete Agreement
            </span>
            <span className="text-lg font-black text-emerald-600 font-mono block">
              {data.complete_agreement_leg_count} legs
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono block">
              Disagreement Legs
            </span>
            <span className="text-lg font-black text-rose-600 font-mono block">
              {data.disagreement_leg_count} legs
            </span>
          </div>
        </div>

        {Array.isArray(data.disagreement_leg_numbers) && data.disagreement_leg_numbers.length > 0 && (
          <div className="pl-4 border-l-2 border-indigo-300 pt-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono block">
              Legs with Disagreements
            </span>
            <span className="text-xs font-bold text-slate-700 font-mono block mt-1 leading-relaxed">
              {data.disagreement_leg_numbers.join(', ')}
            </span>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      
      {/* HEADER WITH BADGES */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-500" />
            Recommendation Workspace
          </h2>
          <p className="text-xs font-semibold text-slate-500 leading-none font-mono uppercase tracking-widest">
            Multi-Strategy Survival Evaluation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
            LIVE
          </span>
          {comparisonData && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 animate-fade-in">
              LIVE API
            </span>
          )}
        </div>
      </div>

      {selectedEntry && !selectedEntry.format_code ? (
        <Card className="p-8 text-center text-rose-800 border border-rose-200 bg-rose-50/50">
          <AlertOctagon className="w-8 h-8 text-rose-600 mx-auto mb-2 animate-bounce" />
          <h3 className="text-sm font-black text-rose-950 mb-1 uppercase tracking-wider font-mono">Missing Contest Format</h3>
          <p className="text-xs font-semibold text-rose-800">
            This survivor entry does not have a contest format assigned.
          </p>
        </Card>
      ) : (
        <>
          {/* SECTION 1: RECOMMENDATION CONTROLS */}
          <Card className="p-6 bg-white border border-slate-100 shadow-xs">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
          <Sliders className="w-4 h-4 text-slate-400" />
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider font-mono">
            Recommendation Controls
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-5 items-end">
          <div className="space-y-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Active Entry
            </span>
            <div className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200/60 px-3 py-2 rounded-lg h-[38px] flex items-center truncate">
              {selectedEntry ? selectedEntry.entry_label : 'No Entry Selected'}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Contest Format
            </span>
            <div className="text-xs font-black text-slate-800 bg-slate-50 border border-slate-200/60 px-3 py-2 rounded-lg h-[38px] flex items-center font-mono">
              {format}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Current Strategy
            </span>
            <div className="text-xs font-black text-slate-700 bg-slate-50 border border-slate-200/60 px-3 py-2 rounded-lg h-[38px] flex items-center font-mono">
              Strategy Comparison
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading || !selectedEntry}
            isLoading={loading}
            className="w-full text-xs font-black uppercase tracking-wider font-mono h-[38px] bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-xs"
          >
            Compare Strategies
          </Button>
        </div>
      </Card>

      {/* EXPLANATORY PANEL */}
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-6 shadow-xl animate-fade-in space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Description & Circa Callout */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-400 shrink-0" />
              <h3 className="text-sm font-black uppercase tracking-wider font-mono text-indigo-400">
                How SemiSharp Builds These Recommendations
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              SemiSharp compares all active production survivor strategies for the selected entry and identifies the strongest current-leg options. Recommendations are generated by the backend using the active contest format, current contest leg, previously used teams, risk-adjusted win probabilities, and future team value.
            </p>

            {/* Conditional Circa Holiday Planning block */}
            {format === 'CIRCA' && (
              <div className="p-3 bg-indigo-950/40 border border-indigo-900/60 rounded-xl space-y-1 animate-fade-in">
                <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-300 uppercase tracking-wider font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Circa Holiday Planning Active</span>
                </div>
                <p className="text-[11px] font-medium text-slate-300 leading-relaxed">
                  Thanksgiving and Christmas are separate contest legs. SemiSharp evaluates future holiday availability before recommending current-leg picks.
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Compact Checklist */}
          <div className="lg:col-span-5 bg-slate-950/50 border border-slate-800/60 rounded-xl p-4 space-y-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono block border-b border-slate-800/60 pb-1.5">
              Backend Evaluation Checklist
            </span>
            <ul className="space-y-2 text-[11px] text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Compares five active production strategies</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Excludes teams already used by this survivor entry</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Applies the selected entry’s contest format</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Uses the current contest leg and NFL week</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Evaluates current safety and future team value</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Preserves high-value holiday options for Circa entries when applicable</span>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* BODY RENDERING STATES */}
      {loading ? (
        renderSkeleton()
      ) : error ? (
        /* ERROR STATE */
        <Card className="p-6 border-rose-100 bg-rose-50/50 animate-fade-in">
          <div className="space-y-4">
            <Alert
              type="error"
              title="Strategy Retrieval Error"
              message={`Backend endpoint returned: ${error}`}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerate}
              className="text-xs font-bold flex items-center gap-1.5 bg-white border-rose-200 text-rose-700 hover:bg-rose-100 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Strategy Request
            </Button>
          </div>
        </Card>
      ) : !comparisonData ? (
        /* INITIAL STATE */
        <Card className="p-12 text-center border border-dashed border-slate-200 bg-slate-50/15 flex flex-col justify-center items-center gap-4 py-16 animate-fade-in">
          <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center shadow-2xs text-indigo-500">
            <Brain className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-lg mx-auto">
            <h4 className="text-base font-black text-slate-900 tracking-tight">Recommendation Workspace</h4>
            <p className="text-xs font-semibold text-slate-500 leading-relaxed">
              This workspace displays backend-generated survivor recommendations. Select a strategy and generate a recommendation to begin.
            </p>
          </div>
          <Button
            size="md"
            onClick={handleGenerate}
            disabled={!selectedEntry}
            className="text-xs font-black uppercase tracking-wider font-mono bg-slate-900 text-white mt-2 px-5 py-2.5 shadow-md hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Compare Strategies
          </Button>
        </Card>
      ) : strategies.length === 0 ? (
        /* EMPTY STATE FOR SUCCESSFUL REQUEST WITH ZERO STRATEGY RESULTS */
        <Card className="p-12 text-center border border-dashed border-slate-200 bg-slate-50/15 flex flex-col justify-center items-center gap-4 py-16 animate-fade-in">
          <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center shadow-2xs text-amber-500">
            <AlertOctagon className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-lg mx-auto">
            <h4 className="text-base font-black text-amber-900 tracking-tight font-sans">No Comparison Results</h4>
            <p className="text-xs font-semibold text-slate-500 leading-relaxed font-sans">
              No strategy comparison results were returned for the current context.
            </p>
          </div>
          <Button
            size="md"
            onClick={handleGenerate}
            disabled={!selectedEntry}
            className="text-xs font-black uppercase tracking-wider font-mono bg-slate-900 text-white mt-2 px-5 py-2.5 shadow-md hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        </Card>
      ) : (
        /* SUCCESS VIEW - DISPLAY MULTIPLE STRATEGIES PRESERVING ORDER */
        <div className="space-y-8 animate-fade-in">
          
          {/* CONSENSUS PANEL - ONLY IF SUPPLIED BY BACKEND */}
          {agreementSummary && renderAgreementSummaryPanel(agreementSummary)}

          {/* LIST OF STRATEGIES */}
          <div className="space-y-8">
            {strategies.map((item: any, idx: number) => {
              const stratName = getStrategyName(item);
              const teamLabel = getTeamLabel(item);
              const teamAbbr = getTeamAbbr(item);
              const opponentLabel = getOpponentLabel(item);
              const rank = getRank(item);
              const projectedSpread = getProjectedSpread(item);
              const baselineWp = getBaselineWp(item);
              const riskAdjustedWp = getRiskAdjustedWp(item);
              const riskScore = getRiskScore(item);
              const riskLevel = getRiskLevel(item);
              const marketEdge = getMarketEdge(item);
              
              // Narrative items
              const narrativeList = getNarrativeExplanations(item);
              const isExpanded = !!expandedStrategies[idx];

              return (
                <div
                  key={idx}
                  className="bg-white border-2 border-slate-900 rounded-2xl shadow-md overflow-hidden animate-fade-in flex flex-col"
                >
                  {/* Strategy Banner */}
                  <div className="bg-slate-900 px-6 py-4 flex justify-between items-center flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-indigo-400" />
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest font-mono">
                        {stratName}
                      </span>
                    </div>
                    {rank !== undefined && rank !== null && (
                      <span className="text-xs font-black bg-indigo-500 text-white px-3 py-1 rounded-full uppercase font-mono tracking-wider">
                        Rank #{rank}
                      </span>
                    )}
                  </div>

                  {/* Recommendation details (Hero presentation inside the card) */}
                  <div className="p-6 md:p-8 space-y-6">
                    
                    {/* Recommended Team section */}
                    <div className="flex flex-wrap items-center justify-between gap-6">
                      <div className="space-y-2">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-mono font-black text-xs uppercase tracking-wider border border-indigo-100">
                          Recommended Selection
                        </span>
                        <h1 className="text-4xl font-black text-slate-950 tracking-tight leading-none pt-1">
                          {teamLabel}
                        </h1>
                        
                        {/* Matchup Opponent & Game */}
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 pt-1 flex-wrap">
                          {opponentLabel && (
                            <>
                              <span className="text-slate-400 font-medium">Matchup:</span>
                              <span className="bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded font-mono text-xs text-slate-800 font-extrabold">
                                {item.primary_recommendation?.team_location === 'HOME' ? 'vs' : '@'} {opponentLabel}
                              </span>
                            </>
                          )}
                          {item.primary_recommendation?.gameday && (
                            <span className="text-slate-400 font-semibold border-l border-slate-200 pl-2">
                              {item.primary_recommendation.gameday} {item.primary_recommendation.gametime ? `at ${item.primary_recommendation.gametime}` : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Team Abbreviation box */}
                      {teamAbbr && (
                        <div className="text-4xl md:text-5xl font-black text-slate-200 tracking-tighter bg-slate-50 border border-slate-100 px-6 py-3 rounded-2xl select-none font-mono">
                          {teamAbbr}
                        </div>
                      )}
                    </div>

                    {/* Primary backend rationale callout (Always showing if rationale supplied) */}
                    {item.primary_recommendation?.rationale && (
                      <div className="p-4 bg-slate-50/80 border border-slate-100 rounded-xl space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">
                          <Brain className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>Selection Rationale</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-700 leading-relaxed italic">
                          "{item.primary_recommendation.rationale}"
                        </p>
                      </div>
                    )}

                    {/* METRICS - COMPACT SUMMARY CARDS */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                      
                      {/* 1. Baseline Win Probability */}
                      {baselineWp !== undefined && baselineWp !== null && (
                        <div className="bg-white border border-slate-100 shadow-3xs rounded-xl p-4 flex flex-col justify-between gap-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">
                            Baseline Win Prob
                          </span>
                          <span className="text-lg font-black text-slate-900 font-mono tracking-tight">
                            {formatPercentage(baselineWp)}
                          </span>
                        </div>
                      )}

                      {/* 2. Risk Adjusted Win Probability */}
                      {riskAdjustedWp !== undefined && riskAdjustedWp !== null && (
                        <div className="bg-white border border-slate-100 shadow-3xs rounded-xl p-4 flex flex-col justify-between gap-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">
                            Risk-Adjusted Win Prob
                          </span>
                          <span className="text-lg font-black text-indigo-600 font-mono tracking-tight">
                            {formatPercentage(riskAdjustedWp)}
                          </span>
                        </div>
                      )}

                      {/* 3. Market Edge */}
                      {marketEdge !== undefined && marketEdge !== null && (
                        <div className="bg-white border border-slate-100 shadow-3xs rounded-xl p-4 flex flex-col justify-between gap-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">
                            Market Edge
                          </span>
                          <span className="text-lg font-black text-emerald-600 font-mono tracking-tight">
                            {marketEdge > 0 ? `+${Number(marketEdge).toFixed(2)}` : Number(marketEdge).toFixed(2)} pts
                          </span>
                        </div>
                      )}

                      {/* 4. Risk Rating / Score */}
                      {(riskLevel || riskScore !== undefined) && (
                        <div className="bg-white border border-slate-100 shadow-3xs rounded-xl p-4 flex flex-col justify-between gap-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">
                            Risk Score / Rating
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {riskLevel && (
                              <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-sm uppercase tracking-wider border leading-none ${
                                String(riskLevel).toUpperCase() === 'LOW' 
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                  : String(riskLevel).toUpperCase() === 'MEDIUM'
                                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                                  : 'bg-rose-50 border-rose-200 text-rose-800'
                              }`}>
                                {riskLevel}
                              </span>
                            )}
                            {riskScore !== undefined && riskScore !== null && (
                              <span className="font-bold text-slate-700 font-mono text-sm">
                                ({Number(riskScore).toFixed(1)})
                              </span>
                            )}
                            {item.primary_recommendation?.risk_stars !== undefined && renderStars(item.primary_recommendation.risk_stars)}
                          </div>
                        </div>
                      )}

                      {/* Extra field: Projected Spread */}
                      {projectedSpread !== undefined && projectedSpread !== null && (
                        <div className="bg-white border border-slate-100 shadow-3xs rounded-xl p-4 flex flex-col justify-between gap-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">
                            Projected Spread
                          </span>
                          <span className="text-lg font-black text-slate-800 font-mono tracking-tight">
                            {projectedSpread}
                          </span>
                        </div>
                      )}

                    </div>

                    {/* EXPLANATIONS - DEDICATED NARRATIVE PANEL */}
                    {narrativeList.length > 0 && (
                      <div className="pt-2">
                        <button
                          onClick={() => toggleStrategyExpand(idx)}
                          className="flex items-center gap-1.5 text-xs font-extrabold text-slate-500 hover:text-slate-800 font-mono uppercase tracking-wider transition-colors focus:outline-hidden"
                        >
                          <Info className="w-3.5 h-3.5" />
                          <span>{isExpanded ? 'Hide' : 'Show'} Full Strategy Explanations</span>
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>

                        {isExpanded && (
                          <div className="mt-3 bg-slate-50 border border-slate-100 rounded-xl p-5 space-y-4 animate-fade-in">
                            <div className="space-y-4 pl-4 border-l-2 border-indigo-200">
                              {narrativeList.map((exp, expIdx) => (
                                <div key={expIdx} className="space-y-1">
                                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">
                                    {exp.title}
                                  </h5>
                                  <p className="text-xs font-semibold text-slate-700 leading-relaxed font-sans">
                                    {exp.content}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              );
            })}
          </div>

          {/* SECTION 5: TECHNICAL METADATA - COLLAPSIBLE BAR */}
          <div className="pt-4 border-t border-slate-100 animate-fade-in">
            <button
              onClick={() => setMetadataExpanded(!metadataExpanded)}
              className="w-full flex items-center justify-between py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono hover:text-slate-600 transition-colors focus:outline-hidden"
            >
              <div className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-slate-300" />
                <span>Technical Implementation Details</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${metadataExpanded ? 'rotate-180' : ''}`} />
            </button>

            {metadataExpanded && (
              <div className="mt-3 p-4 bg-slate-50 border border-slate-100 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] font-bold text-slate-500 font-mono">
                <div className="space-y-2">
                  <div>
                    <span className="text-slate-400 uppercase">Strategy Type:</span>{' '}
                    <span className="text-slate-700">Multi-Strategy Comparison</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase">Comparison Endpoint:</span>{' '}
                    <span className="text-slate-700">/strategies/compare/{season}/{format}</span>
                  </div>
                  {comparisonData.comparison_version && (
                    <div>
                      <span className="text-slate-400 uppercase">Model Version:</span>{' '}
                      <span className="text-slate-700">{comparisonData.comparison_version}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400 uppercase">Generated Timestamp:</span>{' '}
                    <span className="text-slate-700">{generatedAt || 'N/A'}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-slate-400 uppercase">Contest Format:</span>{' '}
                    <span className="text-slate-700">{format}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase">Season Parameter:</span>{' '}
                    <span className="text-slate-700">NFL {season} Season</span>
                  </div>
                  {comparisonData.hfa_source && (
                    <div>
                      <span className="text-slate-400 uppercase">HFA Source:</span>{' '}
                      <span className="text-slate-700">{comparisonData.hfa_source}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      )}
        </>
      )}

    </div>
  );
};
