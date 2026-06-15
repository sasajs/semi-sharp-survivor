import React from "react";
import { Flame, Sparkles } from "lucide-react";
import { Team, SurvivorPick, SurvivorEntry } from "../types";

export interface HolidayTarget {
  team_id: string;
  text: string;
}

export interface HolidayInventoryPanelProps {
  type: "thanksgiving" | "christmas";
  teams: Team[];
  picks: SurvivorPick[];
  selectedEntryId: string;
  activeEntryObj?: SurvivorEntry;
}

export const HolidayInventoryPanel: React.FC<HolidayInventoryPanelProps> = ({
  type,
  teams,
  picks,
  selectedEntryId,
  activeEntryObj
}) => {
  const isThanksgiving = type === "thanksgiving";
  
  const targets: HolidayTarget[] = isThanksgiving 
    ? [
        { team_id: "det", text: "Detroit Lions (Traditional Home Hosts) • High win probability but heavy field popularity." },
        { team_id: "dal", text: "Dallas Cowboys (Traditional Home Hosts) • Good safety, but defense poses risk." },
        { team_id: "gb", text: "Green Bay Packers • Excellent leverage strategy option." },
        { team_id: "chi", text: "Chicago Bears • High risk leverage pick." }
      ]
    : [
        { team_id: "kc", text: "Kansas City Chiefs • Supreme Christmas target option." },
        { team_id: "sf", text: "San Francisco 49ers • Elite road safety potential." },
        { team_id: "bal", text: "Baltimore Ravens • Dynamic run team with powerful statistics." },
        { team_id: "lar", text: "Los Angeles Rams • Ideal mid-level safety play." }
      ];

  const availableCount = targets.filter(t => !picks.some(p => p.entry_id === selectedEntryId && p.team_id === t.team_id)).length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
      
      <div className="flex items-start gap-4 border-b pb-4">
        {isThanksgiving ? (
          <Flame className="w-12 h-12 text-amber-500 mt-1 shrink-0" />
        ) : (
          <Sparkles className="w-12 h-12 text-rose-600 mt-1 shrink-0" />
        )}
        <div>
          <h2 className="text-xl font-extrabold text-slate-950">
            {isThanksgiving 
              ? "Thanksgiving / Black Friday Inventory Shield (Leg 13)" 
              : "Christmas Day Inventory Suite (Leg 18)"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isThanksgiving 
              ? "Leg 13 is a custom holiday window. You are ONLY eligible to pick teams executing games specifically on Thanksgiving Thursday or Black Friday."
              : "Leg 18 isolates the standalone mid-week Christmas matches. Check which high utility contenders remain preserved."}
          </p>
        </div>
      </div>

      <div className={`p-5 rounded-2xl border ${
        isThanksgiving 
          ? "bg-amber-50/50 border-amber-200 text-amber-800" 
          : "bg-rose-50/50 border-rose-200 text-rose-800"
      }`}>
        <h3 className={`font-bold text-sm mb-1 ${isThanksgiving ? "text-amber-900" : "text-rose-900"}`}>
          {isThanksgiving ? "Contest Threat Risk:" : "Double-Game Christmas Rules:"}
        </h3>
        <p className="text-xs leading-relaxed font-medium">
          {isThanksgiving 
            ? "Because only 6 teams typically execute games during this mini-slate, your pick selections are extremely constricted! If you burn Detroit (DET), Dallas (DAL), Chicago (CHI), or Green Bay (GB) too early during regular season Weeks 1-11, you may have literally ZERO eligible favored teams remaining when Thanksgiving arrives, causing automatic elimination."
            : "Only teams scheduled on Christmas Day games are eligible for selection in Leg 18. Conserving heavy titans like Kansas City Chiefs (KC), San Francisco 49ers (SF), Baltimore Ravens (BAL) or Los Angeles Rams (LAR) is critical to guarantee a secure, high-probability victory at this late point!"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
            {isThanksgiving ? "Target Thanksgiving Teams Checklist" : "Titans Preservation Checklist"}
          </h3>

          <div className="space-y-2">
            {targets.map(({ team_id, text }) => {
              const matchingTeam = teams.find(t => t.id === team_id);
              const isUsed = picks.some(p => p.entry_id === selectedEntryId && p.team_id === team_id);

              return (
                <div key={team_id} className={`flex items-center justify-between p-3.5 border rounded-lg ${
                  isUsed ? "bg-slate-100 border-slate-200 opacity-60" : "bg-white border-slate-200"
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full inline-block" style={{ backgroundColor: matchingTeam?.primary_color }}></span>
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">{matchingTeam?.name}</span>
                      <span className="text-[10px] text-slate-500 block">{text}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] tracking-wide font-black uppercase px-2 py-0.5 rounded ${
                      isUsed ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                    }`}>
                      {isUsed ? "USED" : "AVAILABLE"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-50 p-5 rounded-2xl border space-y-4">
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
            {isThanksgiving ? "Statistical Optimization Report" : "Preservation Strategic Guidance"}
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {isThanksgiving 
              ? "Our dynamic optimization calculation tracks the Holiday Safety Multiplier which heavily scales the weights of hosting teams specifically to keep them untouched during weeks 1 through 11."
              : "Selecting KC, SF or BAL prior to week 16 gives quick short-term security but inflicts heavily on your Christmas Survival Equity. Balance this calculation closely!"}
          </p>
          
          <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Selected Entry:</span>
              <span className="font-bold text-slate-800">{activeEntryObj?.name || "None"}</span>
            </div>
            <div className="flex justify-between items-center text-xs border-t pt-2">
              <span className="text-slate-500 font-medium">Available Options:</span>
              <span className={`${availableCount > 1 ? "text-emerald-600" : "text-rose-600"} font-bold`}>
                {availableCount} of {targets.length} Teams
              </span>
            </div>
            <div className="flex justify-between items-center text-xs border-t pt-2">
              <span className="text-slate-500 font-medium">Optimal Recommended Target:</span>
              <span className="font-bold text-indigo-600">
                {isThanksgiving ? "DETROIT LIONS" : "KANSAS CITY CHIEFS"}
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
