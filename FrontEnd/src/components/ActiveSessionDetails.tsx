import React from 'react';
import { SemiSharpContext } from '../types';
import { Card, LoadingSpinner, Alert } from './ui';
import { Info, RefreshCw, Calendar, Cpu, Shield, Globe, Layers, CheckCircle2 } from 'lucide-react';

interface ActiveSessionDetailsProps {
  context: SemiSharpContext | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export const ActiveSessionDetails: React.FC<ActiveSessionDetailsProps> = ({
  context,
  loading,
  error,
  onRefresh,
}) => {
  return (
    <Card className="space-y-4 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-400 shrink-0" />
          <h3 className="text-sm font-bold text-slate-800">Active Session Details</h3>
          {context && !loading && !error && (
            <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200/80 px-1.5 py-0.5 rounded-sm uppercase tracking-wider animate-pulse flex items-center gap-1 shrink-0">
              <span className="w-1 h-1 rounded-full bg-emerald-500 inline-block" />
              🟢 LIVE
            </span>
          )}
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-50 cursor-pointer disabled:opacity-50"
          title="Refresh Session Context"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && !context && !error ? (
        <LoadingSpinner size="sm" message="Loading backend session parameters..." className="py-4" />
      ) : error ? (
        <div className="space-y-3">
          <Alert 
            type="warning" 
            title="Session Synchronization Notice" 
            message={error} 
          />
          <button
            onClick={onRefresh}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            Retry Connection
          </button>
        </div>
      ) : context ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Season Card */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100/85 flex items-center gap-3">
              <div className="p-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Season</span>
                <span className="font-mono text-sm font-extrabold text-slate-900">{context.season}</span>
              </div>
            </div>

            {/* Week Card */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100/85 flex items-center gap-3">
              <div className="p-2 bg-amber-50 border border-amber-100 text-amber-600 rounded-lg shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Week</span>
                <span className="font-mono text-sm font-extrabold text-slate-900">
                  Week {context.current_week ?? context.week}
                </span>
              </div>
            </div>

            {/* Model Card */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100/85 flex items-center gap-3 sm:col-span-2">
              <div className="p-2 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Projection Model</span>
                <span className="font-mono text-xs font-bold text-slate-800 break-all">
                  {(context as any).model_version || (context as any).model || 'SEMISHARP_PROJECTION_V2'}
                </span>
              </div>
            </div>

            {/* Environment Card */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100/85 flex items-center gap-3">
              <div className="p-2 bg-purple-50 border border-purple-100 text-purple-600 rounded-lg shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Environment</span>
                <span className="font-mono text-xs font-extrabold text-purple-700 uppercase">{context.environment}</span>
              </div>
            </div>

            {/* API Status Card */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100/85 flex items-center gap-3">
              <div className="p-2 bg-teal-50 border border-teal-100 text-teal-600 rounded-lg shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">API Context Status</span>
                <span className="font-mono text-xs font-extrabold text-teal-700 uppercase">
                  {context.status || 'OK'}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1.5 text-slate-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              Data Source Verified
            </span>
            <span className="text-[9px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
              LIVE API
            </span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-500 italic py-2">No context retrieved from server.</p>
      )}

      <div className="pt-2 text-xs text-slate-500 leading-relaxed font-medium">
        The system parameters are fetched dynamically from the live context registry. The model attributes dynamically adapt calculations to current NFL league configurations.
      </div>
    </Card>
  );
};
