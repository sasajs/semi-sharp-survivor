import React from "react";
import { Team, TeamWeekLine } from "../types";

export interface RecommendationItem {
  team: Team;
  line: TeamWeekLine;
  insight: string;
}

export interface RecommendationTableProps {
  recommendations: RecommendationItem[];
  handleLockPick: (teamId: string) => void;
  setActiveTab: (tab: string) => void;
}

export const RecommendationTable: React.FC<RecommendationTableProps> = ({
  recommendations,
  handleLockPick,
  setActiveTab
}) => {
  return (
    <div className="space-y-4">
      <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">
        Top Dynamic Recommendations
      </h3>

      <div className="space-y-3">
        {recommendations.map((item, index) => (
          <div key={item.team.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm space-y-4 hover:shadow transition-shadow">
            
            {/* Header details */}
            <div className="flex flex-wrap justify-between items-start gap-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-400">#{index + 1}</span>
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: item.team.primary_color }}></div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm">
                    {item.team.name} ({item.team.abbreviation.toUpperCase()})
                  </h4>
                  <span className="text-[10px] text-slate-500">
                    Colors: {item.team.primary_color} / {item.team.secondary_color}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                  Contest Equity Score
                </span>
                <span className="text-md font-black text-indigo-700">
                  {item.line.contest_equity_score.toFixed(3)}
                </span>
              </div>
            </div>

            {/* Insight paragraph */}
            <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100">
              💡 <strong>Strategic Insight:</strong> {item.insight}
            </p>

            {/* Visualization Bars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-500">Win Probability</span>
                  <span className="font-bold">{(item.line.win_probability * 100).toFixed(1)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500" 
                    style={{ width: `${item.line.win_probability * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-500">Pick Popularity</span>
                  <span className="font-bold">{(item.line.pick_popularity * 100).toFixed(1)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500" 
                    style={{ width: `${item.line.pick_popularity * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-500">Future Value</span>
                  <span className="font-bold">{(item.line.future_value * 100).toFixed(1)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-rose-500" 
                    style={{ width: `${item.line.future_value * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Pick lock selector directly within recommendations */}
            <div className="pt-2 border-t flex justify-end">
              <button 
                onClick={() => {
                  handleLockPick(item.team.id);
                  setActiveTab("picks");
                }}
                className="bg-indigo-600 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded transition-colors"
              >
                Lock in {item.team.abbreviation.toUpperCase()} Choice
              </button>
            </div>

          </div>
        ))}

        {recommendations.length === 0 && (
          <div className="text-center py-6 text-slate-500 italic border rounded-xl">
            No compatible teams available to pick for this leg.
          </div>
        )}
      </div>
    </div>
  );
};
