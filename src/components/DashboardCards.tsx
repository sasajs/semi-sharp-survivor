import React from "react";
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
      <div id="card-strategy-equity" className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow transition-shadow">
        <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Contest Strategy Equity</div>
        <div className="text-2xl font-black text-indigo-600">
          {activeEntryObj ? (activeEntryObj.status === "alive" ? "1.42x" : "0.00x") : "No Active Entry"}
        </div>
        <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
          <span>+12% vs Contest Field</span>
        </div>
      </div>

      <div id="card-future-value" className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow transition-shadow">
        <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Future Value Lockups</div>
        <div className="text-2xl font-black text-slate-900">Highly Conserved</div>
        <div className="text-[10px] text-slate-500 mt-1">
          KC, SF, BAL available for Christmas
        </div>
      </div>

      <div id="card-thanksgiving-shield" className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow transition-shadow">
        <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Thanksgiving Slate</div>
        <div className="text-2xl font-black text-amber-600">Shield Active</div>
        <div className="text-[10px] text-slate-500 mt-1">
          DET or DAL mapped for Thanksgiving (Leg 13)
        </div>
      </div>

      <div id="card-next-leg" className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow transition-shadow">
        <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Next Playoff Leg</div>
        <div className="text-2xl font-black text-slate-950">{activeLegObj?.name || "Week 1"}</div>
        <div className="text-[10px] text-indigo-600 font-medium mt-1">
          {games.length} games scheduled in current leg
        </div>
      </div>
    </div>
  );
};
