import React, { useState } from "react";
import { 
  Compass, 
  Layers, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  Calendar, 
  Zap,
  TrendingUp,
  Award,
  Sparkles,
  Loader2,
  RefreshCw,
  Clock
} from "lucide-react";
import { Team, StrategyType } from "../types";

export interface OwnerWorkspaceDashboardProps {
  workspace: any[]; // OwnerDashboardSection[]
  teams: Team[];
  onViewRoadmap: (entryId: string) => void;
  onViewRecommendation: (entryId: string) => void;
  onChangeStrategy: (entryId: string, strategy: StrategyType) => Promise<void>;
  loadingWorkspace: boolean;
  onRefresh: () => void;
  userDisplayName: string;
  ownerName: string;
  workspaceError?: string;
}

export const OwnerWorkspaceDashboard: React.FC<OwnerWorkspaceDashboardProps> = ({
  workspace,
  teams,
  onViewRoadmap,
  onViewRecommendation,
  onChangeStrategy,
  loadingWorkspace,
  onRefresh,
  userDisplayName,
  ownerName,
  workspaceError
}) => {
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [updatingEntryId, setUpdatingEntryId] = useState<string | null>(null);
  const [tempStrategy, setTempStrategy] = useState<StrategyType | null>(null);

  const getTeamObj = (teamId: string) => {
    return teams.find(t => t.id.toLowerCase() === teamId?.toLowerCase());
  };

  const getTeamDisplayName = (teamId: string) => {
    if (!teamId) return "None Reserved";
    const team = getTeamObj(teamId);
    return team ? `${team.name} (${team.abbreviation})` : teamId.toUpperCase();
  };

  const handleStrategyChangeSubmit = async (entryId: string) => {
    if (!tempStrategy) return;
    try {
      setUpdatingEntryId(entryId);
      await onChangeStrategy(entryId, tempStrategy);
      setEditingEntryId(null);
      setTempStrategy(null);
    } catch (err) {
      console.error("Failed to update strategy:", err);
    } finally {
      setUpdatingEntryId(null);
    }
  };

  const formatPercent = (val: number | undefined | null) => {
    if (val === undefined || val === null) return "N/A";
    const num = val > 1 ? val : val * 100;
    return `${Math.round(num)}%`;
  };

  return (
    <div id="owner-workspace-root" className="space-y-8 font-sans">
      {/* Welcome & Info Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Owner Workspace</span>
          </div>
          <h2 className="text-2xl font-black text-slate-950 tracking-tight">
            Welcome back, {userDisplayName}
          </h2>
          <p className="text-xs text-slate-500 max-w-xl">
            Decision support analytics, Thanksgiving preservation mapping, Christmas protection, and strategy control for your entries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-right shrink-0">
            <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Current Portfolio</span>
            <span className="text-sm font-extrabold text-slate-900">{ownerName}</span>
          </div>

          <button
            onClick={onRefresh}
            disabled={loadingWorkspace}
            className="p-2.5 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 disabled:opacity-50 transition shadow-sm cursor-pointer"
            title="Refresh Workspace"
          >
            {loadingWorkspace ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {workspaceError ? (
        <div id="workspace-error-card" className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-extrabold text-slate-900">Workspace Connection Refused</h4>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              {workspaceError}
            </p>
          </div>
          {workspaceError.toLowerCase().includes("unauthorized") && (
            <p className="text-[10px] text-slate-400 font-bold uppercase">
              Please check your login credentials or session token. Try logging out and in again from the profile section.
            </p>
          )}
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Connection
          </button>
        </div>
      ) : loadingWorkspace && workspace.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs text-slate-500">Loading your survivor workspace and roadmaps...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
              Active Entries Overview
            </h3>
            <span className="text-xs text-slate-500 font-bold">
              {workspace.flatMap(w => w.entries || []).length} Entries Managed
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {workspace.flatMap(sec => sec.entries || []).map((entryDash: any) => {
              const { entry, strategy, holidayReservations, roadmap, currentRecommendation } = entryDash;
              const isEditing = editingEntryId === entry.id;
              const isUpdating = updatingEntryId === entry.id;
              const isCirca = entry.contest_type_id?.toLowerCase() !== "standard";

              return (
                <div 
                  key={entry.id}
                  className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col justify-between transition-all hover:shadow-md"
                >
                  {/* Top Bar / Header */}
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                            entry.status === "alive" 
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                              : "bg-rose-50 text-rose-700 border border-rose-100"
                          }`}>
                            {entry.status}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{entry.id}</span>
                        </div>
                        <h4 className="text-lg font-extrabold text-slate-900 mt-1">
                          {entry.name}
                        </h4>
                      </div>

                      <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-center">
                        <span className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">Roadmap Confidence</span>
                        <span className="text-xs font-black text-indigo-600">
                          {roadmap ? formatPercent(roadmap.roadmap_confidence) : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-6 space-y-5 flex-1">
                    {/* Strategy Block */}
                    <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Active Decision Strategy</span>
                          {isEditing ? (
                            <div className="mt-2 flex items-center gap-2">
                              <select
                                value={tempStrategy || strategy?.strategy_type}
                                onChange={(e) => setTempStrategy(e.target.value as StrategyType)}
                                className="bg-white border border-slate-200 text-xs px-2.5 py-1.5 rounded-lg outline-none font-bold"
                              >
                                <option value={StrategyType.CHAMPIONSHIP_EV}>Championship EV</option>
                                <option value={StrategyType.PORTFOLIO_EV}>Portfolio EV</option>
                                <option value={StrategyType.MARKETPLACE_SURVIVAL}>Marketplace Survival</option>
                                <option value={StrategyType.GROUP_SURVIVAL}>Group Survival</option>
                              </select>
                              <button
                                onClick={() => handleStrategyChangeSubmit(entry.id)}
                                disabled={isUpdating}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 flex items-center gap-1"
                              >
                                {isUpdating ? "Saving..." : "Save"}
                              </button>
                              <button
                                onClick={() => { setEditingEntryId(null); setTempStrategy(null); }}
                                className="px-2 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs font-extrabold text-slate-800 uppercase flex items-center gap-1.5 mt-0.5">
                              <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                              {strategy?.strategy_name || strategy?.strategy_type?.replace("_", " ") || "CHAMPIONSHIP EV"}
                            </span>
                          )}
                        </div>

                        {!isEditing && (
                          <button
                            onClick={() => {
                              setEditingEntryId(entry.id);
                              setTempStrategy(strategy?.strategy_type || StrategyType.CHAMPIONSHIP_EV);
                            }}
                            className="text-[10px] font-extrabold uppercase tracking-wide border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition text-slate-600 hover:text-indigo-600 cursor-pointer"
                          >
                            Change Strategy
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                        {strategy?.strategy_description || "Scoring algorithm weighted for highest overall survival with baseline safety variables."}
                      </p>
                    </div>

                    {/* Current Week Recommendation */}
                    <div className="border border-slate-100 p-4 rounded-2xl space-y-2">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Current Week Recommendation</span>
                      
                      {currentRecommendation ? (
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-extrabold text-slate-900">
                                {getTeamDisplayName(currentRecommendation.teamId)}
                              </span>
                              {currentRecommendation.alternateTeamId && (
                                <span className="text-[10px] text-slate-400">
                                  (Alt: {getTeamDisplayName(currentRecommendation.alternateTeamId)})
                                </span>
                              )}
                            </div>
                            {currentRecommendation.note && (
                              <p className="text-[10px] text-slate-500 italic mt-0.5 leading-tight">
                                "{currentRecommendation.note}"
                              </p>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <span className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">Win Prob / FV Cost</span>
                            <span className="text-xs font-extrabold text-slate-800">
                              {formatPercent(currentRecommendation.winProb)} / {currentRecommendation.fvCost?.toFixed(2) || "0.50"}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
                          <Clock className="w-4 h-4" />
                          <span>No recommendations generated for current week.</span>
                        </div>
                      )}
                    </div>

                    {/* Holiday Preservation Reserves */}
                    {isCirca && (
                      <div className="grid grid-cols-2 gap-4">
                        {/* Thanksgiving */}
                        <div className="border border-slate-100 p-3.5 rounded-2xl space-y-1">
                          <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            Thanksgiving Shield
                          </span>
                          <div className="text-xs font-black text-slate-800 leading-tight truncate">
                            {holidayReservations?.thanksgiving?.team_id 
                              ? getTeamDisplayName(holidayReservations.thanksgiving.team_id)
                              : "TBD"}
                          </div>
                          {holidayReservations?.thanksgiving && (
                            <div className="text-[9px] text-slate-500 font-medium">
                              Confidence: {formatPercent(holidayReservations.thanksgiving.confidence)}
                            </div>
                          )}
                        </div>

                        {/* Christmas */}
                        <div className="border border-slate-100 p-3.5 rounded-2xl space-y-1">
                          <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-red-500" />
                            Christmas Day Preservation
                          </span>
                          <div className="text-xs font-black text-slate-800 leading-tight truncate">
                            {holidayReservations?.christmas?.team_id 
                              ? getTeamDisplayName(holidayReservations.christmas.team_id)
                              : "TBD"}
                          </div>
                          {holidayReservations?.christmas && (
                            <div className="text-[9px] text-slate-500 font-medium">
                              Confidence: {formatPercent(holidayReservations.christmas.confidence)}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="p-6 bg-slate-55 border-t border-slate-100 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => onViewRoadmap(entry.id)}
                      className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      View Roadmap
                    </button>
                    <button
                      onClick={() => onViewRecommendation(entry.id)}
                      className="w-full py-2.5 px-4 border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 text-indigo-500" />
                      View Recommendation
                    </button>
                  </div>
                </div>
              );
            })}

            {workspace.length === 0 && (
              <div className="col-span-2 text-center py-12 border border-dashed rounded-3xl text-slate-400 text-sm">
                No active entries found in your owner workspace.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
