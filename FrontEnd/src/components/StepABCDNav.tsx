/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronRight, Layers, Check, ShieldCheck, Lock } from 'lucide-react';

interface StepABCDNavProps {
  currentStep: 'step_1' | 'step_2' | 'step_3' | 'step_4' | string;
  onNavigate: (step: string) => void;
  step1Verified?: boolean;
  step2Generated?: boolean;
  step3Selected?: boolean;
}

export const StepABCDNav: React.FC<StepABCDNavProps> = ({
  currentStep,
  onNavigate,
  step1Verified = true,
  step2Generated = false,
  step3Selected = false,
}) => {
  const steps = [
    { id: 'step_1', label: 'Step 1', name: 'Verify Previous Picks', num: 1 },
    { id: 'step_2', label: 'Step 2', name: 'Strategy Roadmap', num: 2 },
    { id: 'step_3', label: 'Step 3', name: 'Weekly Selection', num: 3 },
    { id: 'step_4', label: 'Step 4', name: 'Final Confirmation', num: 4 },
  ];

  const currentIdx = steps.findIndex(s => s.id === currentStep);
  const currentStepNum = currentIdx >= 0 ? currentIdx + 1 : 1;

  return (
    <div className="w-full bg-slate-950 border border-slate-800/90 rounded-2xl p-3.5 sm:p-4 shadow-xl space-y-3 font-sans">
      {/* Top Workflow Progress Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-black uppercase tracking-wider text-slate-200">
                Decision Support Workflow
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                Step {currentStepNum} of 4
              </span>
            </div>
          </div>
        </div>

        {/* Progress Dots / Stage Indicator */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-400">
          <span className="hidden md:inline text-slate-400 font-medium">Stage:</span>
          {steps.map((s, idx) => {
            const isDone = idx < currentIdx;
            const isCurrent = idx === currentIdx;

            return (
              <React.Fragment key={s.id}>
                <span
                  className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-extrabold transition-all ${
                    isCurrent
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : isDone
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                        : 'bg-slate-900 text-slate-300 border border-slate-800'
                  }`}
                >
                  {isDone ? `✓ S${s.num}` : `S${s.num}`}
                </span>
                {idx < steps.length - 1 && <span className="text-slate-300 text-[10px]">›</span>}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Stepper Cards Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {steps.map((step, idx) => {
          const isActive = currentStep === step.id;
          const isPassed = idx < currentIdx;
          const isFuture = idx > currentIdx;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onNavigate(step.id)}
              className={`relative flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer font-sans text-left group ${
                isActive
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg ring-2 ring-amber-400/30'
                  : isPassed
                    ? 'bg-slate-900/90 text-slate-200 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850'
                    : 'bg-slate-900/60 text-slate-300 border-slate-800/80 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Number or Checkmark Circle */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-black shrink-0 transition-colors ${
                    isActive
                      ? 'bg-slate-950 text-amber-400 shadow-2xs'
                      : isPassed
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {isPassed ? <Check className="w-4 h-4 stroke-[3]" /> : step.num}
                </div>

                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-mono font-black uppercase tracking-wider ${
                        isActive ? 'text-slate-900' : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </span>
                    {isActive && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-950 text-amber-300 font-extrabold uppercase">
                        Current
                      </span>
                    )}
                    {isPassed && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-extrabold">
                        ✓
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-xs font-bold truncate ${
                      isActive ? 'text-slate-950' : 'text-slate-200 group-hover:text-white'
                    }`}
                  >
                    {step.name}
                  </div>
                </div>
              </div>

              <ChevronRight
                className={`w-4 h-4 shrink-0 transition-transform ${
                  isActive
                    ? 'text-slate-950 translate-x-0.5'
                    : 'text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

