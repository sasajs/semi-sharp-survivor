import React from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { SurvivorEntry, SurvivorPick, Team, ContestLeg } from "../types";

export interface EntryTableProps {
  entries: SurvivorEntry[];
  picks: SurvivorPick[];
  teams: Team[];
  legs: ContestLeg[];
  selectedEntryId: string;
  setSelectedEntryId: (id: string) => void;
  setActiveTab: (tab: string) => void;
  handleDeleteEntry: (id: string) => void;
}

export const EntryTable: React.FC<EntryTableProps> = ({
  entries,
  picks,
  teams,
  legs,
  selectedEntryId,
  setSelectedEntryId,
  setActiveTab,
  handleDeleteEntry
}) => {
  return (
    <div className="space-y-4">
      {entries.map(ent => {
        const countPicks = picks.filter(p => p.entry_id === ent.id).length;
        const entryPicks = picks.filter(p => p.entry_id === ent.id);
        
        return (
          <div 
            key={ent.id} 
            className={`p-5 rounded-2xl border transition-all hover:bg-slate-50/50 ${
              selectedEntryId === ent.id 
                ? "bg-indigo-50/20 border-indigo-200 shadow-sm" 
                : "bg-white border-slate-200"
            }`}
          >
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                  ent.status === "alive" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                }`}>
                  {ent.status.toUpperCase()}
                </span>
                
                <h4 className="font-extrabold text-slate-900 text-base mt-1 flex items-center gap-2">
                  <span>{ent.name}</span>
                  <span className="text-xs text-slate-400 font-normal">ID: {ent.id}</span>
                </h4>

                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    ent.contest_type_id === "standard" 
                      ? "bg-amber-50 text-amber-700 border-amber-200" 
                      : "bg-indigo-50 text-indigo-700 border-indigo-200"
                  }`}>
                    {ent.contest_type_id === "standard" ? "Standard Survivor" : "Circa Survivor"}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {ent.contest_type_id === "standard" ? "18 legs, Standard" : "20 legs, Thanksgiving/Christmas"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedEntryId === ent.id ? "active" : "inactive"}
                  onChange={() => setSelectedEntryId(ent.id)}
                  className="bg-slate-100 border text-xs px-2.5 py-1.5 font-semibold rounded text-slate-700"
                >
                  <option value="active">Viewing Focus</option>
                  <option value="inactive">Focus other</option>
                </select>

                <button
                  onClick={() => handleDeleteEntry(ent.id)}
                  className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 p-1.5 rounded transition-colors"
                  title="Delete Entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-600 mt-2 italic">
              "{ent.notes || 'No custom strategies logged for this entry yet. Click edit to customize.'}"
            </p>

            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap justify-between items-center">
              <span className="text-xs text-slate-500 font-medium">
                Locked Selections: <strong className="text-indigo-600 font-bold">{countPicks} / {ent.contest_type_id === "standard" ? 18 : 20} legs</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedEntryId(ent.id);
                    setActiveTab("picks");
                  }}
                  className="text-[11px] font-bold text-indigo-600 hover:underline"
                >
                  Optimize Picks &amp; Lock Selections →
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {entries.length === 0 && (
        <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <AlertTriangle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-slate-600 font-semibold text-sm">No registered entries found.</p>
          <p className="text-xs text-slate-400 mt-1">Please use the entry form to register your first Survivor entry.</p>
        </div>
      )}
    </div>
  );
};
