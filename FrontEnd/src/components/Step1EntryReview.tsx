/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { SemiSharpContext } from '../types';
import { Card, Button } from './ui';
import { 
  CheckCircle2, 
  ArrowRight, 
  Info, 
  ShieldCheck, 
  FileText, 
  Calendar, 
  Layers, 
  Sparkles, 
  CheckSquare, 
  Edit3, 
  HelpCircle,
  Compass
} from 'lucide-react';

interface Step1EntryReviewProps {
  context: SemiSharpContext | null;
  onNavigate: (tab: string) => void;
}

export const Step1EntryReview: React.FC<Step1EntryReviewProps> = ({
  context,
  onNavigate,
}) => {
  const { selectedEntry, user } = useAuth();

  const season = context?.season || 2026;
  const currentWeek = context?.current_week ?? context?.week ?? 1;

  return (
    <div className="space-y-6 animate-fade-in text-left font-sans text-slate-900" id="step1_entry_review_container">
      
      {/* 1. INFORMATIONAL HIGHLIGHT PANEL */}
      <div className="p-4 bg-slate-900 text-white border border-slate-800 rounded-2xl shadow-3xs flex items-start gap-3.5">
        <div className="p-2.5 bg-slate-800 text-indigo-400 rounded-xl shrink-0 mt-0.5">
          <Info className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <span>Workflow Step 1</span>
            <span className="text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
              🟡 IN PROGRESS
            </span>
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">
            Step 1 ensures SemiSharp is working from an accurate representation of your survivor entry before running strategy models.
          </p>
        </div>
      </div>

      {/* 2. WORKFLOW STEP DIAGRAM */}
      <Card className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-3xs" id="card_step1_workflow">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest font-mono mb-4">
          Guided Survivor Decision Workflow
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          
          {/* Step 1 Node (Active) */}
          <div className="p-4 bg-indigo-50/80 border-2 border-indigo-600 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-mono font-black text-sm flex items-center justify-center shrink-0">
              1
            </div>
            <div>
              <div className="text-xs font-extrabold text-indigo-950 font-mono">Validate Entry</div>
              <div className="text-[11px] text-indigo-700 font-medium">Current Step: Review history & status</div>
            </div>
          </div>

          {/* Arrow Divider 1 */}
          <div className="hidden md:flex justify-center text-slate-300">
            <ArrowRight className="w-6 h-6" />
          </div>

          {/* Step 2 Node */}
          <button 
            onClick={() => onNavigate('step2_strategy_planner')}
            className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between hover:bg-slate-100/80 transition-all text-left cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-mono font-black text-sm flex items-center justify-center shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                2
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 font-mono">Proceed to Strategy Planner</div>
                <div className="text-[11px] text-slate-500 font-medium">Step 2: Compare season paths</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
          </button>

        </div>
      </Card>

      {/* 3. CURRENT ACTIVE CONTEST CONTEXT CARD */}
      <Card className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-3xs space-y-4" id="card_current_contest_status">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-extrabold text-slate-900 font-mono">
              Active Entry Context
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">
            Season {season} • Week {currentWeek}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-mono">Selected Entry</span>
            <span className="text-sm font-black text-slate-900 font-mono block mt-0.5">
              {selectedEntry ? selectedEntry.entry_label : 'No Entry Selected'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-mono">Entry Status</span>
            <span className="text-sm font-black font-mono block mt-0.5">
              {selectedEntry ? (
                selectedEntry.is_active ? (
                  <span className="text-emerald-700">🟢 ACTIVE</span>
                ) : (
                  <span className="text-rose-700">🔴 ELIMINATED</span>
                )
              ) : (
                <span className="text-amber-700">🟡 SELECT ENTRY</span>
              )}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-mono">Contest Format</span>
            <span className="text-sm font-black text-slate-900 font-mono block mt-0.5">
              {selectedEntry?.format_name || selectedEntry?.contest_name || 'Standard Survivor'}
            </span>
          </div>
        </div>
      </Card>

      {/* 4. PLANNED VERSION 5.2 ENTRY REVIEW CAPABILITIES */}
      <Card className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-3xs space-y-6" id="card_planned_entry_review_capabilities">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 font-mono uppercase tracking-wider">
              Step 1 Planned Capabilities
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Upcoming feature set being introduced in Version 5.2.
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-md">
            Phase 5.2 Development
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Review Contest Information</span>
            </div>
            <p className="text-xs text-slate-600 font-normal pl-6 leading-relaxed">
              Verify league rules, pick deadlines, double-pick weeks, and holiday leg rules for Circa Survivor and custom pools.
            </p>
          </div>

          <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Review Previous Survivor Picks</span>
            </div>
            <p className="text-xs text-slate-600 font-normal pl-6 leading-relaxed">
              Audit recorded picks week-by-week to ensure alignment with your official pool host platform.
            </p>
          </div>

          <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Review Previously Used Teams</span>
            </div>
            <p className="text-xs text-slate-600 font-normal pl-6 leading-relaxed">
              Ensure team usage availability matrix correctly locks out used teams for remaining strategy calculations.
            </p>
          </div>

          <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Correct Entry History</span>
            </div>
            <p className="text-xs text-slate-600 font-normal pl-6 leading-relaxed">
              Quickly edit or override historical picks if you missed recording an earlier week in SemiSharp.
            </p>
          </div>

          <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Validate Active Survivor Entry</span>
            </div>
            <p className="text-xs text-slate-600 font-normal pl-6 leading-relaxed">
              Run automated entry health checks to confirm active status before running strategy optimization models.
            </p>
          </div>

          <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Confirm Season & Contest Week</span>
            </div>
            <p className="text-xs text-slate-600 font-normal pl-6 leading-relaxed">
              Ensure model execution is synchronized with the latest active NFL contest slate.
            </p>
          </div>

        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <Button
            onClick={() => onNavigate('step2_strategy_planner')}
            className="bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 shadow-xs"
            id="btn_proceed_to_step2"
          >
            <span>Proceed to Step 2 – Season Strategy Planner</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

      </Card>

    </div>
  );
};
