import React from 'react';
import { Card } from './ui';
import { 
  CheckCircle2, 
  HelpCircle, 
  Settings, 
  Zap, 
  Layers, 
  ShieldCheck, 
  AlertOctagon, 
  TrendingUp, 
  Calendar, 
  Database, 
  Award,
  Radio,
  FileCheck
} from 'lucide-react';

export const DevelopmentStatus: React.FC = () => {
  const liveFeatures = [
    { name: 'Authentication', desc: 'Secure backend user token and session verification with role mapping.', icon: ShieldCheck },
    { name: 'API Health', desc: 'Real-time database connection and FastAPI telemetry checks.', icon: Radio },
    { name: 'Context', desc: 'Dynamic session, season, and active week context synchronization.', icon: FileCheck },
    { name: 'Weekly Matchups', desc: 'Real NFL weekly schedule, stadium locations, and travel indices.', icon: Calendar },
    { name: 'Projections', desc: 'Deep model expectations, simulated ratings, and PFF stats.', icon: TrendingUp },
    { name: 'Risk Analysis', desc: 'Real-time FastAPI hazard metrics, points, and travel warnings.', icon: AlertOctagon },
    { name: 'Market Edge', desc: 'Consensus vegas spreads parsed against internal projection expectations.', icon: Database },
  ];

  const devFeatures = [
    { name: 'Survivor Strategies', desc: 'Tailored math recommending optimal survivor picks based on entry sweat data.', icon: Award },
  ];

  const placeholderFeatures = [
    { name: 'Future Features', desc: 'Upcoming modules including custom bracket rules, historic trends, and automated telemetry.', icon: Settings },
  ];

  return (
    <Card className="p-6 bg-white border border-slate-100 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">SemiSharp Feature Status</h3>
            <p className="text-xs text-slate-400 font-medium font-mono uppercase tracking-wider">System Integration Inventory</p>
          </div>
        </div>
        <span className="text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-lg uppercase tracking-wider font-mono">
          V1.2.0 • COMPLIANT
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* LIVE MODULES */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider font-mono">
              LIVE INTEGRATIONS ({liveFeatures.length})
            </h4>
          </div>
          <div className="space-y-2.5">
            {liveFeatures.map((feat) => {
              const Icon = feat.icon;
              return (
                <div 
                  key={feat.name}
                  className="flex items-start gap-2.5 p-3 rounded-xl border border-emerald-100 bg-emerald-50/20 hover:bg-emerald-50/40 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-xs font-bold text-slate-800">{feat.name}</span>
                    </div>
                    <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* IN DEVELOPMENT */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 bg-amber-400 rounded-full"></span>
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider font-mono">
              IN DEVELOPMENT ({devFeatures.length})
            </h4>
          </div>
          <div className="space-y-2.5">
            {devFeatures.map((feat) => {
              const Icon = feat.icon;
              return (
                <div 
                  key={feat.name}
                  className="flex items-start gap-2.5 p-3 rounded-xl border border-amber-100 bg-amber-50/20 hover:bg-amber-50/40 transition-colors"
                >
                  <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-xs font-bold text-slate-800">{feat.name}</span>
                    </div>
                    <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PLACEHOLDER */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 bg-slate-300 rounded-full"></span>
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider font-mono">
              PLACEHOLDER ({placeholderFeatures.length})
            </h4>
          </div>
          <div className="space-y-2.5">
            {placeholderFeatures.map((feat) => {
              const Icon = feat.icon;
              return (
                <div 
                  key={feat.name}
                  className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-bold text-slate-600">{feat.name}</span>
                    </div>
                    <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
};
