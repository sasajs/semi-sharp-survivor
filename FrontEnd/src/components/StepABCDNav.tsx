/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronRight, Layers } from 'lucide-react';

interface StepABCDNavProps {
  currentStep: 'step_1' | 'step_2' | 'step_3' | 'step_4' | string;
  onNavigate: (step: string) => void;
}

export const StepABCDNav: React.FC<StepABCDNavProps> = ({ currentStep, onNavigate }) => {
  const steps = [
    { id: 'step_1', label: 'Step 1', description: 'Historical Audit & Gate' },
    { id: 'step_2', label: 'Step 2', description: 'Strategy Roadmap & Selection' },
    { id: 'step_3', label: 'Step 3', description: 'Active Weekly Pick Selection' },
    { id: 'step_4', label: 'Step 4', description: 'Final Pick Confirmation' },
  ];

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            Decision Support Workflow
          </span>
        </div>
        <span className="text-[11px] font-mono text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20 font-semibold">
          Active: {steps.find(s => s.id === currentStep)?.label || currentStep}
        </span>
      </div>

      {/* Chevron Step Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map((step, idx) => {
          const isActive = currentStep === step.id;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onNavigate(step.id)}
              className={`relative flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer font-mono ${
                isActive
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg ring-2 ring-amber-400/40 font-black'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-750 hover:border-slate-600 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shrink-0 ${
                    isActive
                      ? 'bg-slate-950 text-amber-400'
                      : 'bg-slate-900 text-slate-400 border border-slate-700'
                  }`}
                >
                  {idx + 1}
                </span>
                <div className="text-left">
                  <div className="text-sm font-extrabold uppercase tracking-wide">{step.label}</div>
                  <div
                    className={`text-[11px] font-sans ${
                      isActive ? 'text-slate-900 font-semibold' : 'text-slate-400'
                    }`}
                  >
                    {step.description}
                  </div>
                </div>
              </div>

              <ChevronRight
                className={`w-5 h-5 shrink-0 transition-transform ${
                  isActive ? 'text-slate-950 translate-x-0.5' : 'text-slate-500 group-hover:text-slate-300'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
