import React from "react";
import { Team, SurvivorPick, ContestLeg } from "../types";

export interface InventoryTableProps {
  teams: Team[];
  picks: SurvivorPick[];
  legs: ContestLeg[];
  selectedEntryId: string;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  teams,
  picks,
  legs,
  selectedEntryId
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
        {teams.map(team => {
          // Check if team has been picked previously by selected entry
          const isUsed = picks.some(p => p.entry_id === selectedEntryId && p.team_id === team.id);
          // Match pick object
          const pickInfo = picks.find(p => p.entry_id === selectedEntryId && p.team_id === team.id);
          // Match associated leg
          const pickLeg = pickInfo ? legs.find(l => l.id === pickInfo.contest_leg_id) : null;

          return (
            <div 
              key={team.id}
              className={`relative border rounded-xl p-3 flex flex-col justify-between transition-all h-28 ${
                isUsed 
                  ? "bg-slate-100/60 border-slate-200 opacity-60 flex-shrink-0" 
                  : "bg-white border-slate-200 hover:shadow-md hover:border-slate-300"
              }`}
            >
              {/* Inner color tag */}
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ backgroundColor: team.primary_color }}></div>
              
              <div className="space-y-1">
                <span className="text-xs font-black block tracking-wider text-slate-400 uppercase">{team.abbreviation}</span>
                <span className="text-xs font-bold text-slate-800 line-clamp-1">{team.name}</span>
              </div>

              <div className="pt-2 border-t border-slate-100">
                {isUsed ? (
                  <div>
                    <span className="text-[9px] bg-slate-250 text-slate-600 px-1.5 py-0.5 rounded font-black uppercase">
                      USED
                    </span>
                    <span className="block text-[8px] text-slate-400 mt-1 whitespace-nowrap overflow-hidden text-ellipsis">
                      {pickLeg ? pickLeg.name : "Early Leg"}
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold uppercase whitespace-nowrap">
                      AVAILABLE
                    </span>
                    <span className="block text-[8px] text-slate-400 mt-1">
                      Bye wk: {team.bye_week}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Future conservation plan check */}
      <div className="bg-slate-50 p-4 rounded-xl border flex flex-col md:flex-row justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Titans Conservation Check</h4>
          <p className="text-xs text-slate-500">
            Check availability of power house contenders for deep run weeks.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          {['kc', 'sf', 'bal', 'phi', 'det', 'buf'].map(tId => {
            const tObj = teams.find(t => t.id === tId);
            const isUsedObj = picks.some(p => p.entry_id === selectedEntryId && p.team_id === tId);
            if (!tObj) return null;
            return (
              <div key={tId} className="flex items-center gap-1.5 bg-white border px-3 py-2 rounded-lg text-xs shadow-sm">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tObj.primary_color }}></span>
                <span className="font-semibold">{tObj.abbreviation.toUpperCase()}</span>
                <span className={`text-[10px] font-bold ${isUsedObj ? "text-rose-600" : "text-emerald-600"}`}>
                  {isUsedObj ? "USED" : "AVAILABLE"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
