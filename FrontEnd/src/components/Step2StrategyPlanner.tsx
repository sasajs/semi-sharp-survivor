/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Card, Button } from './ui';
import { SemiSharpContext } from '../types';
import { 
  Award, 
  ArrowRight, 
  Sparkles, 
  Compass, 
  CheckCircle2, 
  BarChart2, 
  GitBranch, 
  Calendar, 
  Printer, 
  ShieldAlert, 
  Layers, 
  Clock,
  TrendingUp,
  Sliders
} from 'lucide-react';

interface Step2StrategyPlannerProps {
  context: SemiSharpContext | null;
  onNavigate: (tab: string) => void;
}

export const Step2StrategyPlanner: React.FC<Step2StrategyPlannerProps> = ({
  context,
  onNavigate,
}) => {
  const season = context?.season || 2026;
  const currentWeek = context?.current_week ?? context?.week ?? 1;

  return (
    <div className="space-y-6 animate-fade-in text-left font-sans text-slate-900" id="step2_strategy_planner_container">
      
      {/* 1. INFORMATIONAL HIGHLIGHT PANEL */}
      <div className="p-4 bg-slate-900 text-white border border-slate-800 rounded-2xl shadow-3xs flex items-start gap-3.5">
        <div className="p-2.5 bg-slate-800 text-amber-400 rounded-xl shrink-0 mt-0.5">
          <Compass className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <span>Workflow Step 2</span>
            <span className="text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
              🟡 IN PROGRESS
            </span>
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">
            This page will become the primary analytical workspace for evaluating the remainder of the survivor season before locking in this week's official pick.
          </p>
        </div>
      </div>

      {/* 2. WORKFLOW STEP ILLUSTRATION */}
      <Card className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-3xs" id="card_step2_workflow">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest font-mono mb-4">
          Guided Survivor Decision Workflow
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
          
          {/* Node 1: Run Strategies */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-mono font-black text-xs flex items-center justify-center shrink-0">
              1
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 font-mono">Run Strategies</div>
              <div className="text-[10px] text-slate-500 font-medium">Execute models</div>
            </div>
          </div>

          {/* Node 2: Compare Results */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-mono font-black text-xs flex items-center justify-center shrink-0">
              2
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 font-mono">Compare Results</div>
              <div className="text-[10px] text-slate-500 font-medium">Evaluate season paths</div>
            </div>
          </div>

          {/* Node 3: Choose Preferred Strategy */}
          <div className="p-3 bg-indigo-50/80 border-2 border-indigo-600 rounded-xl flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-mono font-black text-xs flex items-center justify-center shrink-0">
              3
            </div>
            <div>
              <div className="text-xs font-extrabold text-indigo-950 font-mono">Choose Strategy</div>
              <div className="text-[10px] text-indigo-700 font-medium">Select preferred path</div>
            </div>
          </div>

          {/* Node 4: Continue to Step 3 */}
          <button
            onClick={() => onNavigate('dashboard')}
            className="p-3 bg-emerald-600 text-white border border-emerald-700 rounded-xl flex items-center justify-between hover:bg-emerald-700 transition-all text-left cursor-pointer group shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-emerald-800 text-white font-mono font-black text-xs flex items-center justify-center shrink-0">
                4
              </div>
              <div>
                <div className="text-xs font-bold font-mono">Step 3: Decision</div>
                <div className="text-[10px] text-emerald-100 font-medium">Lock in weekly pick</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-100 group-hover:translate-x-0.5 transition-transform" />
          </button>

        </div>
      </Card>

      {/* 3. COMING IN VERSION 5.2 PREVIEW SECTION */}
      <Card className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-3xs space-y-6" id="card_coming_in_v52">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 font-mono uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Coming in Version 5.2</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Capabilities under active development for the Season Strategy Planner.
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 px-2.5 py-1 rounded-md">
            Season Strategy Workspace
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs font-mono">
              <GitBranch className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Strategy Comparison Matrix</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Compare all production survivor strategies side-by-side: Highest Win Probability, Dynamic Programming Season Path, Risk-Adjusted Safety, and Future Value Conservation.
            </p>
          </div>

          <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs font-mono">
              <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Weekly Recommended Teams</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Map out the recommended team selection for every remaining week of the NFL season through Week 18.
            </p>
          </div>

          <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs font-mono">
              <TrendingUp className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Weekly Win Probabilities</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Inspect model-derived win probabilities for each projected leg match to pinpoint potential landmines.
            </p>
          </div>

          <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs font-mono">
              <BarChart2 className="w-4 h-4 text-purple-600 shrink-0" />
              <span>Estimated Survival Probability</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Calculate cumulative multi-week survival probabilities across the rest of the season for each strategy path.
            </p>
          </div>

          <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs font-mono">
              <Layers className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Future Team Preservation Analysis</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Quantify the future value of elite teams (e.g. KC, BAL, PHI) to avoid burning top option value prematurely.
            </p>
          </div>

          <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs font-mono">
              <Award className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Holiday Week Planning for Circa</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Dedicated leg optimization for Circa Survivor Thanksgiving and Christmas holiday slates.
            </p>
          </div>

        </div>

        <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs font-mono">
            <Printer className="w-4 h-4 text-slate-700 shrink-0" />
            <span>Printable Season Strategy Report</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono font-medium">Export strategy roadmap to PDF or CSV</span>
        </div>

        {/* Action Button to Step 3 */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <Button
            onClick={() => onNavigate('step1_entry_review')}
            variant="outline"
            className="font-mono text-xs font-bold border-slate-200 text-slate-700"
          >
            ← Back to Step 1
          </Button>

          <Button
            onClick={() => onNavigate('dashboard')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 shadow-xs"
            id="btn_continue_to_step3"
          >
            <span>Continue to Step 3 – This Week's Decision</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

      </Card>

    </div>
  );
};
