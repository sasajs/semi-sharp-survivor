import React from "react";
import { Info } from "lucide-react";
import { ContestLeg, SurvivorEntry, Game } from "../types";

export interface DashboardCardsProps {
  activeEntryObj?: SurvivorEntry;
  activeLegObj?: ContestLeg;
  games: Game[];
}

export const DashboardCards: React.FC<DashboardCardsProps> = ({
  activeEntryObj,
  activeLegObj,
  games
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      
      {/* Card 1: Contest Strategy Equity */}
      <div id="card-strategy-equity" className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow transition-shadow relative">
        <div className="flex items-center gap-1.5 mb-1 group-tooltip">
          <span className="text-[10px] text-slate-500 font-bold uppercase">Contest Strategy Equity</span>
          <div className="relative group cursor-help shrink-0">
            <Info className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-600 transition" />
            <div className="absolute z-50 left-1/2 -translate-x-1/2 bottom-5 hidden group-hover:block bg-slate-900 text-white text-[10px] p-2.5 rounded-lg shadow-lg w-56 font-normal normal-case leading-normal text-slate-200 border border-slate-700">
              Contest Strategy Equity combines win probability with pick leverage and future value constraints to evaluate the overall value of a particular choice.
            </div>
          </div>
        </div>
        <div className="text-2xl font-black text-indigo-600">
          {activeEntryObj ? (activeEntryObj.status === "alive" ? "1.42x" : "0.00x") : "No Active Entry"}
        </div>
        <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
          <span>+12% vs Contest Field</span>
        </div>
      </div>

      {/* Card 2: Future Value Lockups */}
      <div id="card-future-value" className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow transition-shadow relative">
        <div className="flex items-center gap-1.5 mb-1 group-tooltip">
          <span className="text-[10px] text-slate-500 font-bold uppercase">Future Value Lockups</span>
          <div className="relative group cursor-help shrink-0">
            <Info className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-600 transition" />
            <div className="absolute z-50 left-1/2 -translate-x-1/2 bottom-5 hidden group-hover:block bg-slate-900 text-white text-[10px] p-2.5 rounded-lg shadow-lg w-56 font-normal normal-case leading-normal text-slate-200 border border-slate-700">
              Future Value ratings analyze the subsequent value of each NFL team across the remaining legs. Lower numbers mean safe to burn; higher numbers signify premium teams preserved for future weeks.
            </div>
          </div>
        </div>
        <div className="text-2xl font-black text-slate-900">Highly Conserved</div>
        <div className="text-[10px] text-slate-500 mt-1">
          KC, SF, BAL available for Christmas
        </div>
      </div>

      {/* Card 3: Thanksgiving Slate */}
      <div id="card-thanksgiving-shield" className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow transition-shadow relative">
        <div className="flex items-center gap-1.5 mb-1 group-tooltip">
          <span className="text-[10px] text-slate-500 font-bold uppercase">Thanksgiving Slate</span>
          <div className="relative group cursor-help shrink-0">
            <Info className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-600 transition" />
            <div className="absolute z-50 left-1/2 -translate-x-1/2 bottom-5 hidden group-hover:block bg-slate-900 text-white text-[10px] p-2.5 rounded-lg shadow-lg w-56 font-normal normal-case leading-normal text-slate-200 border border-slate-700">
              The Thanksgiving holiday. A three-game special slate requiring precise, dedicated team selections. A key milestone for mid-season survival profiles.
            </div>
          </div>
        </div>
        <div className="text-2xl font-black text-amber-600">Shield Active</div>
        <div className="text-[10px] text-slate-500 mt-1">
          DET or DAL mapped for Thanksgiving (Leg 13)
        </div>
      </div>

      {/* Card 4: Next Playoff Leg */}
      <div id="card-next-leg" className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow transition-shadow relative">
        <div className="flex items-center gap-1.5 mb-1 group-tooltip">
          <span className="text-[10px] text-slate-500 font-bold uppercase">Next Playoff Leg</span>
          <div className="relative group cursor-help shrink-0">
            <Info className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-600 transition" />
            <div className="absolute z-50 left-1/2 -translate-x-1/2 bottom-5 hidden group-hover:block bg-slate-900 text-white text-[10px] p-2.5 rounded-lg shadow-lg w-56 font-normal normal-case leading-normal text-slate-200 border border-slate-700">
              Upcoming tournament legs or Christmas premium legs. Strategy-aware recommendation engines reserve top-shelf assets to protect this high-leverage slate.
            </div>
          </div>
        </div>
        <div className="text-2xl font-black text-slate-950">{activeLegObj?.name || "Week 1"}</div>
        <div className="text-[10px] text-indigo-600 font-medium mt-1">
          {games.length} games scheduled in current leg
        </div>
      </div>
      
    </div>
  );
};
