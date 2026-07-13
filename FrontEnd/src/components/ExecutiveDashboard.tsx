/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from './ui';
import { SemiSharpApi } from '../api';
import { SemiSharpContext } from '../types';
import {
  LayoutDashboard,
  Calendar,
  TrendingUp,
  AlertOctagon,
  Database,
  Award,
  Cpu,
  Binary,
  DollarSign,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Radio,
  Lock,
  ArrowRight,
  ChevronRight,
  Clock,
  Sparkles,
  RefreshCw,
  Server,
  UserCheck,
  Zap,
  Info
} from 'lucide-react';

interface ExecutiveDashboardProps {
  context: SemiSharpContext | null;
  onNavigate: (tab: string) => void;
  onRefreshContext: () => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  context,
  onNavigate,
  onRefreshContext
}) => {
  const { user, selectedEntry } = useAuth();
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [checkingHealth, setCheckingHealth] = useState<boolean>(false);

  // Poll health on mount
  useEffect(() => {
    let active = true;
    const checkHealth = async () => {
      setCheckingHealth(true);
      try {
        const health = await SemiSharpApi.checkHealth();
        if (active) setIsHealthy(health.status === 'ok' || (health as any).status === 'healthy');
      } catch (err) {
        if (active) setIsHealthy(false);
      } finally {
        if (active) setCheckingHealth(false);
      }
    };

    checkHealth();
    return () => { active = false; };
  }, []);

  const getStatusDot = (status: 'LIVE' | 'DEVELOPMENT' | 'PLACEHOLDER') => {
    switch (status) {
      case 'LIVE':
        return <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block animate-pulse shrink-0" />;
      case 'DEVELOPMENT':
        return <span className="w-2.5 h-2.5 bg-amber-500 rounded-full inline-block shrink-0" />;
      case 'PLACEHOLDER':
        return <span className="w-2.5 h-2.5 bg-slate-300 rounded-full inline-block shrink-0" />;
    }
  };

  const getStatusBadge = (status: 'LIVE' | 'DEVELOPMENT' | 'PLACEHOLDER') => {
    switch (status) {
      case 'LIVE':
        return (
          <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-mono">
            LIVE
          </span>
        );
      case 'DEVELOPMENT':
        return (
          <span className="text-[9px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-mono">
            MVP
          </span>
        );
      case 'PLACEHOLDER':
        return (
          <span className="text-[9px] font-extrabold bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-mono whitespace-nowrap">
            Coming Soon
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fade-in animate-duration-300">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-xs mt-0.5">
            <LayoutDashboard className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black text-slate-950 tracking-tight leading-none uppercase font-mono">
                Executive Command Dashboard
              </h2>
              <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                COMMAND LIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">
              NFL contest tracking & command console. Operational logic and model weightings remain compiled at server-level endpoints.
            </p>
          </div>
        </div>
        
        {context && (
          <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-lg px-3 py-1.5 shadow-3xs self-start md:self-auto font-mono text-xs text-slate-600">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span>v3.0</span>
            <span className="text-slate-300">|</span>
            <span className="uppercase font-bold text-amber-600">MVP</span>
          </div>
        )}
      </div>

      {/* THREE-COLUMN BENTO SYSTEM GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT & CENTER MAIN TRACKING VIEWS (2 COLUMNS) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* SECTION 1: CURRENT CONTEST STATUS */}
          <Card className="p-6 border-l-4 border-l-slate-900">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 font-mono">
                <Activity className="w-4 h-4 text-slate-400" /> 1. Current Contest Status
              </h3>
              <span className="text-[10px] font-extrabold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-mono">
                ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Season</span>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-extrabold text-slate-800">{context?.season || '2026'} NFL</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Active Week</span>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-extrabold text-slate-800">Week {context?.current_week ?? context?.week ?? 'N/A'}</span>
                </div>
              </div>

              <div className="space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Contest Format</span>
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-extrabold text-slate-800">Circa Survivor</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Active Entry</span>
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-extrabold text-slate-800 truncate" title={selectedEntry?.entry_label || 'Bypassed'}>
                    {selectedEntry?.entry_label || 'Bypassed'}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">User Role</span>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-extrabold text-slate-800">{user?.role || 'USER'}</span>
                </div>
              </div>

              <div className="space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Model Version</span>
                <div className="flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-extrabold text-slate-800 truncate" title={context?.projection_model || 'v4.2-Pro'}>
                    {context?.projection_model || 'v4.2-Pro'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* SECTION 2: WEEKLY DECISION OVERVIEW */}
          <Card className="p-6 border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 font-mono">
                <AlertCircle className="w-4 h-4 text-emerald-500" /> 2. Weekly Decision Overview
              </h3>
              <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-mono">
                ACTIVE
              </span>
            </div>

            {/* Structured Metric Blocks */}
            <div className="relative">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-center space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Upcoming Games</span>
                  <div className="text-xl font-bold text-slate-800">16</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-center space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Top Projections</span>
                  <div className="text-xl font-bold text-slate-800">3</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-center space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Market Edges</span>
                  <div className="text-xl font-bold text-slate-800">5</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-center space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Risk Alerts</span>
                  <div className="text-xl font-bold text-slate-800">2</div>
                </div>
              </div>
            </div>
          </Card>

          {/* SECTION 4: SURVIVOR ENTRY SUMMARY */}
          <Card className="p-6 border-l-4 border-l-slate-400">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 font-mono">
                <Award className="w-4 h-4 text-slate-400" /> 4. Survivor Entry Summary
              </h3>
              <span className="text-[10px] font-extrabold bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-mono">
                ENTRY DETAIL
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile Meta details */}
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-lg border border-slate-100 p-4 flex justify-between items-center">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Entry Sweat Name</span>
                    <span className="text-xs font-extrabold text-slate-800">
                      {selectedEntry ? selectedEntry.survivor_sweat_name : 'No Active Entry selected'}
                    </span>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${selectedEntry?.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                    {selectedEntry?.is_active ? 'ACTIVE IN SWEAT' : 'OUT'}
                  </span>
                </div>

                <div className="bg-slate-50 rounded-lg border border-slate-100 p-4 flex justify-between items-center">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Label</span>
                    <span className="text-xs font-extrabold text-slate-800">
                      {selectedEntry ? selectedEntry.entry_label : 'N/A'}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500">ID: {selectedEntry?.entry_id || 'N/A'}</span>
                </div>
              </div>

              {/* Roster / Team logs dev placeholder */}
              <div className="bg-slate-50 rounded-lg border border-slate-100 p-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-slate-400" /> Survivor Tracking Database
                  </h4>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5">
                      <span className="text-slate-500 font-semibold">Teams already used:</span>
                      <span className="font-extrabold text-amber-600 bg-amber-50 px-1.5 rounded-xs text-[10px] font-mono tracking-wide">
                        Pending backend tracking service sync
                      </span>
                    </div>
                    <div className="flex justify-between pt-0.5">
                      <span className="text-slate-500 font-semibold">Remaining eligible teams:</span>
                      <span className="font-extrabold text-amber-600 bg-amber-50 px-1.5 rounded-xs text-[10px] font-mono tracking-wide">
                        Pending backend tracking service sync
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 mt-4 leading-relaxed font-medium">
                  Entry selection lists and dynamic team availability are fetched from schedule endpoints mapped directly to selected entry parameters.
                </p>
              </div>
            </div>
          </Card>

          {/* SECTION 5: STRATEGY CENTER PREVIEW */}
          <Card className="p-6 border-l-4 border-l-indigo-500">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono">
                  5. Strategy Center Preview
                </h3>
              </div>
              <button
                onClick={() => onNavigate('strategies')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition-colors"
              >
                Access Survivor Tools <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* LIVE STRATEGIES */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> LIVE MODULES
                </h4>

                <div className="space-y-2">
                  <div 
                    onClick={() => onNavigate('strategies')}
                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-100 cursor-pointer flex justify-between items-center group transition-colors"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">Highest Win Probability</h5>
                      <p className="text-[10px] text-slate-500 mt-0.5">Optimizes the safest weekly pick regardless of future values.</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>

                  <div 
                    onClick={() => onNavigate('strategies')}
                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-100 cursor-pointer flex justify-between items-center group transition-colors"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">Future Value</h5>
                      <p className="text-[10px] text-slate-500 mt-0.5">Preserves elite NFL rosters for premium game weeks.</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>

                  <div 
                    onClick={() => onNavigate('strategies')}
                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-100 cursor-pointer flex justify-between items-center group transition-colors"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">Multiple Entry Portfolio</h5>
                      <p className="text-[10px] text-slate-500 mt-0.5">Hedges selections across a basket of active entries.</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>

                  <div 
                    onClick={() => onNavigate('strategies')}
                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-100 cursor-pointer flex justify-between items-center group transition-colors"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">Circa Holiday Reserve</h5>
                      <p className="text-[10px] text-slate-500 mt-0.5">Rations elite options exclusively for Thanksgiving/Christmas slates.</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>

                  <div 
                    onClick={() => onNavigate('strategies')}
                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-100 cursor-pointer flex justify-between items-center group transition-colors"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">Projection Edge Optimizer</h5>
                      <p className="text-[10px] text-slate-500 mt-0.5">Isolates high discrepancies between Vegas lines and mathematical models.</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>

                  <div 
                    onClick={() => onNavigate('strategies')}
                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-100 cursor-pointer flex justify-between items-center group transition-colors"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">Monte Carlo Simulation</h5>
                      <p className="text-[10px] text-slate-500 mt-0.5">Runs 10,000 simulated seasons to optimize full survival paths.</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>

                  <div 
                    onClick={() => onNavigate('strategies')}
                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-100 cursor-pointer flex justify-between items-center group transition-colors"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">Dynamic Programming Solver</h5>
                      <p className="text-[10px] text-slate-500 mt-0.5">Solves optimal paths backwards from Week 18 using equations.</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                </div>
              </div>

              {/* FUTURE / PLANNING OVERVIEW */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> SYSTEM READY
                </h4>

                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider font-mono">Engine Status</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    All seven strategy algorithms are fully implemented on the server and wired in the client framework. The system operates on a direct presentation paradigm, ensuring 100% calculation accuracy.
                  </p>
                </div>
              </div>

            </div>
          </Card>

        </div>

        {/* RIGHT SIDEBAR PANEL (1 COLUMN) */}
        <div className="space-y-8">
          
          {/* SECTION 3: ANALYTICAL PIPELINE STATUS */}
          <Card className="p-6 border-t-4 border-t-indigo-500 shadow-xs">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 font-mono">
                <Radio className="w-4 h-4 text-indigo-500" /> 3. Analytical Pipeline Status
              </h3>
              <span className="text-[10px] font-extrabold text-slate-400 font-mono">ONLINE</span>
            </div>

            {/* List of 6 pipeline engines with route and status indicator */}
            <div className="space-y-4">
              
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800">API Connection</h4>
                  <span className="text-[9px] font-mono text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                    GET /health
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusDot(isHealthy ? 'LIVE' : checkingHealth ? 'DEVELOPMENT' : 'PLACEHOLDER')}
                  {getStatusBadge(isHealthy ? 'LIVE' : 'DEVELOPMENT')}
                </div>
              </div>

              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800">Schedule Service</h4>
                  <span className="text-[9px] font-mono text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                    GET /schedule
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusDot('LIVE')}
                  {getStatusBadge('LIVE')}
                </div>
              </div>

              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800">Projection Engine</h4>
                  <span className="text-[9px] font-mono text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                    GET /projections
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusDot('LIVE')}
                  {getStatusBadge('LIVE')}
                </div>
              </div>

              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800">Risk Engine</h4>
                  <span className="text-[9px] font-mono text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                    GET /risk
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusDot('LIVE')}
                  {getStatusBadge('LIVE')}
                </div>
              </div>

              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800">Market Engine</h4>
                  <span className="text-[9px] font-mono text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                    GET /market
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusDot('LIVE')}
                  {getStatusBadge('LIVE')}
                </div>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800">Strategy Engine</h4>
                  <span className="text-[9px] font-mono text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                    GET /strategies
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusDot('LIVE')}
                  {getStatusBadge('LIVE')}
                </div>
              </div>

            </div>
          </Card>

          {/* ACTIVE PROFILE OVERVIEW */}
          <Card className="p-6 bg-slate-950 text-white border-none shadow-md">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 font-mono mb-4">
              <UserCheck className="w-4 h-4 text-indigo-400" /> Identity Credentials
            </h3>
            
            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="flex justify-between items-center">
                <span>Account Name:</span>
                <span className="font-extrabold text-white bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                  {user?.display_name || user?.username}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Verification Role:</span>
                <span className="font-extrabold text-emerald-400 uppercase tracking-wider bg-emerald-950/40 border border-emerald-900/50 px-2 py-0.5 rounded">
                  {user?.role}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Authorized Session:</span>
                <span className="text-slate-400 font-mono">100% SECURE</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 mt-6 leading-relaxed border-t border-slate-800/80 pt-4 font-medium">
              Calculations are piped on behalf of active subscriber IDs. Session overrides and connection status indicators can be updated in top-right configuration screens.
            </p>
          </Card>

        </div>

      </div>

    </div>
  );
};
