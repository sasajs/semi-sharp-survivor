import React, { useState, useEffect } from "react";
import { 
  Target, 
  Shield, 
  User, 
  Zap, 
  Layers, 
  Save, 
  AlertTriangle, 
  CheckCircle, 
  Cpu, 
  Sliders, 
  RefreshCw, 
  Sparkles,
  Info
} from "lucide-react";
import { EntryStrategyProfile, EntryMetadata, StrategyType } from "../../types";

interface StrategicEntry {
  id: string;
  name: string;
  status: string;
  notes?: string;
  profile: EntryStrategyProfile | null;
  metadata: EntryMetadata | null;
}

interface DiversificationAnalysis {
  groupName: string;
  memberEntryIds: string[];
  memberNames: string[];
  objectives: Record<string, string>;
  pickDuplicationsByLeg: Record<string, { teamId: string; entryIds: string[] }[]>;
  diversificationIndex: number;
  warnings: string[];
}

export const EntryStrategyPanel: React.FC = () => {
  const [entries, setEntries] = useState<StrategicEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Active Selected Entry for Configuration/Inspection Form
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const selectedEntry = entries.find(e => e.id === selectedEntryId);

  // Edit fields for strategy profile
  const [strategyType, setStrategyType] = useState<StrategyType>(StrategyType.CHAMPIONSHIP_EV);
  const [objective, setObjective] = useState<string>("");
  const [riskTolerance, setRiskTolerance] = useState<string>("HIGH");
  const [diversificationGroup, setDiversificationGroup] = useState<string>("");
  const [marketplaceTarget, setMarketplaceTarget] = useState<string>("");
  const [profileNotes, setProfileNotes] = useState<string>("");

  // Edit fields for metadata
  const [ownerName, setOwnerName] = useState<string>("");
  const [entryDescription, setEntryDescription] = useState<string>("");
  const [primaryGoal, setPrimaryGoal] = useState<string>("");
  const [secondaryGoal, setSecondaryGoal] = useState<string>("");
  const [activeFlag, setActiveFlag] = useState<boolean>(true);

  // Diversification Analysis State
  const [activeGroupAnalysis, setActiveGroupAnalysis] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<DiversificationAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/strategies/entries");
      if (!res.ok) throw new Error("Failed to load strategic entry profiles");
      const data: StrategicEntry[] = await res.json();
      setEntries(data);
      if (data.length > 0 && !selectedEntryId) {
        selectEntry(data[0]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectEntry = (entry: StrategicEntry) => {
    setSelectedEntryId(entry.id);
    setStrategyType(entry.profile?.strategy_type || StrategyType.CHAMPIONSHIP_EV);
    setObjective(entry.profile?.objective || "");
    setRiskTolerance(entry.profile?.risk_tolerance || "MEDIUM");
    setDiversificationGroup(entry.profile?.diversification_group || "");
    setMarketplaceTarget(entry.profile?.marketplace_target || "");
    setProfileNotes(entry.profile?.notes || "");

    setOwnerName(entry.metadata?.owner_name || "");
    setEntryDescription(entry.metadata?.entry_description || "");
    setPrimaryGoal(entry.metadata?.primary_goal || "");
    setSecondaryGoal(entry.metadata?.secondary_goal || "");
    setActiveFlag(entry.metadata?.active_flag !== false);
  };

  const handleTriggerAnalysis = async (groupName: string) => {
    try {
      setAnalyzing(true);
      setActiveGroupAnalysis(groupName);
      const res = await fetch(`/api/strategies/portfolio/analyze/${groupName}`);
      if (!res.ok) throw new Error("diversification analysis api returned error");
      const analysis: DiversificationAnalysis = await res.json();
      setAnalysisData(analysis);
    } catch (err: any) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntryId) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMsg(null);

      // 1. Save metadata
      const metaRes = await fetch("/api/strategies/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entry_id: selectedEntryId,
          owner_name: ownerName,
          entry_description: entryDescription,
          primary_goal: primaryGoal,
          secondary_goal: secondaryGoal,
          active_flag: activeFlag
        })
      });

      if (!metaRes.ok) throw new Error("Failed to save entry metadata");

      // 2. Save Profile
      const profRes = await fetch("/api/strategies/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entry_id: selectedEntryId,
          strategy_type: strategyType,
          objective,
          risk_tolerance: riskTolerance,
          diversification_group: diversificationGroup || undefined,
          marketplace_target: marketplaceTarget || undefined,
          notes: profileNotes
        })
      });

      if (!profRes.ok) throw new Error("Failed to save strategy profile details");

      setSuccessMsg(`Successfully synchronized configuration profile for entry: ${selectedEntryId}`);
      setTimeout(() => setSuccessMsg(null), 5000);
      
      // Refresh list
      await fetchEntries();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const getStrategyBadgeColor = (type: StrategyType) => {
    switch (type) {
      case StrategyType.CHAMPIONSHIP_EV:
        return "bg-purple-100 text-purple-700 border-purple-200";
      case StrategyType.PORTFOLIO_EV:
        return "bg-blue-100 text-blue-700 border-blue-200";
      case StrategyType.MARKETPLACE_SURVIVAL:
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case StrategyType.GROUP_SURVIVAL:
        return "bg-indigo-100 text-indigo-700 border-indigo-200";
    }
  };

  const getRiskColor = (risk: string) => {
    const rLower = risk?.toLowerCase();
    if (rLower?.includes("high")) return "text-amber-700 bg-amber-50 border-amber-200";
    if (rLower?.includes("low")) return "text-teal-700 bg-teal-50 border-teal-200";
    return "text-slate-700 bg-slate-50 border-slate-200";
  };

  return (
    <div id="entry-strategy-panel-root" className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm font-sans">
      
      {/* Panel Top Section */}
      <div className="border-b border-slate-100 bg-slate-50 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Entry Strategy Profiles Manager
            </h3>
            <span className="bg-indigo-50 border border-indigo-100 text-[10px] text-indigo-700 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Layer 2
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative survivor entry objectives, multi-entry diversification analytics, and individual risk configurations.
          </p>
        </div>
        <button
          onClick={fetchEntries}
          className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs hover:shadow-1xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Sync Profiles
        </button>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-slate-500 text-xs gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
            Resolving entry registry...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Column 1: Strategic Entries List (Left) */}
            <div className="lg:col-span-5 space-y-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Registered Survivor Entries</span>
              
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {entries.map(ent => {
                  const isSelected = ent.id === selectedEntryId;
                  return (
                    <div
                      key={ent.id}
                      onClick={() => selectEntry(ent)}
                      className={`relative p-4 rounded-2xl border text-left cursor-pointer transition ${
                        isSelected 
                          ? "border-indigo-600 bg-indigo-50/50 shadow-2xs" 
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-black text-slate-900">{ent.name}</p>
                          <p className="text-[11px] text-slate-500 font-medium">Owner: {ent.metadata?.owner_name || "Unassigned"}</p>
                        </div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                          ent.status === "alive" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"
                        }`}>
                          {ent.status}
                        </span>
                      </div>

                      {ent.profile ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider ${getStrategyBadgeColor(ent.profile.strategy_type)}`}>
                            {ent.profile.strategy_type.replace("_", " ")}
                          </span>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider ${getRiskColor(ent.profile.risk_tolerance)}`}>
                            Risk: {ent.profile.risk_tolerance}
                          </span>
                        </div>
                      ) : (
                        <p className="mt-2 text-[11px] italic text-slate-400 flex items-center gap-1">
                          <Info className="w-3.5 h-3.5" /> No optimization goals defined
                        </p>
                      )}

                      {ent.profile?.diversification_group && (
                        <div className="mt-2 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg flex items-center gap-1.5 w-fit">
                          <Layers className="w-3 h-3" />
                          Group: {ent.profile.diversification_group}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Diversification Analytical Widgets (Steve's Portfolio Joint Optimizer) */}
              <div className="mt-6 bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 w-4 text-indigo-600" />
                  <span className="text-xs font-black text-slate-900 uppercase tracking-tight">Coordinated Portfolio Evaluator</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Avoid duplicate picks between cooperative entries. Trigger full joint-evaluation of the <strong>UWOSH_GROUP</strong> diversification pool.
                </p>
                <button
                  onClick={() => handleTriggerAnalysis("UWOSH_GROUP")}
                  className="w-full bg-slate-900 text-white font-bold hover:bg-slate-800 text-xs py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Evaluate Joint Diversification Pool
                </button>

                {activeGroupAnalysis && (
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 animate-fade-in text-xs">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="font-bold text-slate-800">{activeGroupAnalysis} Index</span>
                      {analyzing ? (
                        <span className="text-[10px] text-slate-400 animate-pulse">Running engine...</span>
                      ) : (
                        <span className={`font-mono text-sm font-black px-2 py-0.5 rounded ${
                          (analysisData?.diversificationIndex || 100) >= 70 ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"
                        }`}>
                          {analysisData?.diversificationIndex}% Unique
                        </span>
                      )}
                    </div>

                    {!analyzing && analysisData && (
                      <div className="space-y-3">
                        {/* Warnings */}
                        {analysisData.warnings.length > 0 ? (
                          <div className="space-y-1.5">
                            {analysisData.warnings.map((warn, wIdx) => (
                              <div key={wIdx} className="bg-amber-50 text-amber-900 border border-amber-100 p-2.5 rounded-lg text-[10px] flex gap-1.5 leading-relaxed">
                                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                                <div>{warn}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-emerald-700 bg-emerald-50 border border-emerald-100 p-2 rounded-lg text-[10px] flex gap-1.5 items-center">
                            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                            No selection collisions identified in active legs! Direct joint EV optimization safe.
                          </div>
                        )}

                        <div className="text-[10px] text-slate-500 leading-relaxed">
                          Analysis completed for portfolio members: <span className="font-semibold">{analysisData.memberNames.join(", ")}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Configure Selected Entry Strategy & Metadata (Right) */}
            <div className="lg:col-span-7">
              {selectedEntry ? (
                <form onSubmit={handleSaveAll} className="space-y-6 bg-slate-50/50 border border-slate-200 rounded-3xl p-6">
                  <div className="border-b border-slate-200 pb-4">
                    <span className="bg-slate-200 text-slate-700 text-[10px] font-black px-2.5 py-1 rounded-lg">ID: {selectedEntryId}</span>
                    <h4 className="text-base font-black text-slate-950 mt-2">Configure Strategy Details: {selectedEntry.name}</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Tune mathematical selection metrics, set priority objectives, and adjust owner metadata for this survivor entry.
                    </p>
                  </div>

                  {successMsg && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl text-xs flex gap-2 items-center">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>{successMsg}</div>
                    </div>
                  )}

                  {error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-900 px-4 py-3 rounded-xl text-xs flex gap-2 items-center">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <div>{error}</div>
                    </div>
                  )}

                  {/* Section A: Entry Ownership & Objectives Description */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Metadata & Ownership
                    </h5>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-600 uppercase">Primary Owner</label>
                        <input
                          type="text"
                          value={ownerName}
                          onChange={(e) => setOwnerName(e.target.value)}
                          placeholder="e.g. Steve"
                          className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-600 uppercase">Description</label>
                        <input
                          type="text"
                          value={entryDescription}
                          onChange={(e) => setEntryDescription(e.target.value)}
                          placeholder="Short description"
                          className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-600 uppercase">Primary Goal</label>
                        <input
                          type="text"
                          value={primaryGoal}
                          onChange={(e) => setPrimaryGoal(e.target.value)}
                          placeholder="e.g. Maximize Championship expected value"
                          className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-600 uppercase">Secondary Goal</label>
                        <input
                          type="text"
                          value={secondaryGoal}
                          onChange={(e) => setSecondaryGoal(e.target.value)}
                          placeholder="e.g. ROI or portfolio optimization"
                          className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section B: Algorithmic Strategy Profile Tuning */}
                  <div className="space-y-3 pt-2">
                    <h5 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-indigo-600" />
                      Algorithmic Optimizations
                    </h5>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-600 uppercase">Strategy Blueprint Type</label>
                        <select
                          value={strategyType}
                          onChange={(e) => setStrategyType(e.target.value as StrategyType)}
                          className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs focus:ring-1 focus:ring-indigo-600 focus:outline-none cursor-pointer"
                        >
                          <option value={StrategyType.CHAMPIONSHIP_EV}>Championship EV Maximization</option>
                          <option value={StrategyType.PORTFOLIO_EV}>Portfolio EV Joint Diversification</option>
                          <option value={StrategyType.MARKETPLACE_SURVIVAL}>Marketplace Mid-Season Premium Valuation</option>
                          <option value={StrategyType.GROUP_SURVIVAL}>Group Safety Consensus Survival</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-600 uppercase">Risk Tolerance Weighting</label>
                        <select
                          value={riskTolerance}
                          onChange={(e) => setRiskTolerance(e.target.value)}
                          className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs focus:ring-1 focus:ring-indigo-600 focus:outline-none cursor-pointer"
                        >
                          <option value="VERY_LOW">VERY LOW (Safety-Absolute)</option>
                          <option value="LOW">LOW (Conservative)</option>
                          <option value="MEDIUM">MEDIUM (Moderate/Balanced)</option>
                          <option value="HIGH">HIGH (Leverage/Aggressive)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-600 uppercase">Diversification Group</label>
                        <input
                          type="text"
                          value={diversificationGroup}
                          onChange={(e) => setDiversificationGroup(e.target.value)}
                          placeholder="e.g. UWOSH_GROUP"
                          className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-600 uppercase">Marketplace Resale Target</label>
                        <input
                          type="text"
                          value={marketplaceTarget}
                          onChange={(e) => setMarketplaceTarget(e.target.value)}
                          placeholder="e.g. MID_SEASON"
                          className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-600 uppercase">Optimization Logic Statement</label>
                      <textarea
                        value={objective}
                        onChange={(e) => setObjective(e.target.value)}
                        placeholder="Define the primary objective parameter for optimization algorithms."
                        rows={3}
                        className="w-full bg-white border border-slate-200 p-3 rounded-xl text-xs focus:ring-1 focus:ring-indigo-600 focus:outline-none leading-relaxed"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-600 uppercase">Administrative Notes</label>
                      <input
                        type="text"
                        value={profileNotes}
                        onChange={(e) => setProfileNotes(e.target.value)}
                        placeholder="Internal notes regarding models, participants, or historical contexts"
                        className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-between items-center pt-4 border-t border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="active_flag"
                        checked={activeFlag}
                        onChange={(e) => setActiveFlag(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <label htmlFor="active_flag" className="text-xs text-slate-700 font-bold cursor-pointer">
                        Mark Entry as Active in Simulation Runs
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-indigo-600 text-white font-black hover:bg-indigo-700 px-5 py-2.5 rounded-xl text-xs transition duration-150 flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-100"
                    >
                      {submitting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          Synchronize Config
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-12 text-center text-slate-400 text-xs">
                  Select a registered survivor entry to synchronize optimization logic and owner properties.
                </div>
              )}
            </div>

          </div>
        )}
      </div>

    </div>
  );
};
