import React, { useState, useEffect } from "react";
import { adminApiService } from "../../services/adminApiService";
import { 
  Database, 
  Cpu, 
  Layers, 
  Search, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Clock, 
  ListCollapse, 
  RefreshCw,
  Sparkles
} from "lucide-react";

export const FeatureStorePanel: React.FC = () => {
  // Feature definitions state
  const [definitions, setDefinitions] = useState<any[]>([]);
  const [defLoading, setDefLoading] = useState<boolean>(false);
  const [defError, setDefError] = useState<string | null>(null);

  // Feature build runs state
  const [buildRuns, setBuildRuns] = useState<any[]>([]);
  const [runsLoading, setRunsLoading] = useState<boolean>(false);
  const [runsError, setRunsError] = useState<string | null>(null);

  // Historical snaps explorer state
  const [explorerSeason, setExplorerSeason] = useState<number>(2026);
  const [explorerWeek, setExplorerWeek] = useState<number>(1);
  const [explorerSnaps, setExplorerSnaps] = useState<any[]>([]);
  const [explorerLoading, setExplorerLoading] = useState<boolean>(false);
  const [explorerError, setExplorerError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  // Trigger Build Run state
  const [buildSeason, setBuildSeason] = useState<number>(2026);
  const [buildWeek, setBuildWeek] = useState<number>(1);
  const [buildNotes, setBuildNotes] = useState<string>("");
  const [buildTriggering, setBuildTriggering] = useState<boolean>(false);
  const [buildSuccessMsg, setBuildSuccessMsg] = useState<string | null>(null);
  const [buildError, setBuildError] = useState<string | null>(null);

  // New definition form state
  const [newFeatureId, setNewFeatureId] = useState<string>("");
  const [newFeatureName, setNewFeatureName] = useState<string>("");
  const [newCategory, setNewCategory] = useState<string>("Derived");
  const [newDescription, setNewDescription] = useState<string>("");
  const [newSport, setNewSport] = useState<string>("NFL");
  const [showAddDef, setShowAddDef] = useState<boolean>(false);
  const [addDefMsg, setAddDefMsg] = useState<string | null>(null);
  const [addDefErr, setAddDefErr] = useState<string | null>(null);

  // Load all initial definitions and run histories
  const loadData = async () => {
    setDefLoading(true);
    setDefError(null);
    try {
      const defs = await adminApiService.fetchFeatureDefinitions();
      setDefinitions(defs);
    } catch (err: any) {
      setDefError(err.message || "Failed to load feature definitions.");
    } finally {
      setDefLoading(false);
    }

    setRunsLoading(true);
    setRunsError(null);
    try {
      const runs = await adminApiService.fetchFeatureBuildRuns();
      setBuildRuns(runs);
    } catch (err: any) {
      setRunsError(err.message || "Failed to load build runs.");
    } finally {
      setRunsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Trigger snapshot build run
  const handleTriggerBuild = async (e: React.FormEvent) => {
    e.preventDefault();
    setBuildTriggering(true);
    setBuildSuccessMsg(null);
    setBuildError(null);

    try {
      const result = await adminApiService.triggerFeatureBuild(buildSeason, buildWeek, buildNotes || undefined);
      setBuildSuccessMsg(`Successfully executed build run ID ${result.run_id}! Status: ${result.status}. Compiled ${result.feature_count} snapshots.`);
      setBuildNotes("");
      
      // Reload runs
      const runs = await adminApiService.fetchFeatureBuildRuns();
      setBuildRuns(runs);

      // Auto load snapshots in explorer if completed
      if (result.status === "completed") {
        setExplorerSeason(buildSeason);
        setExplorerWeek(buildWeek);
        handleSearchExplorer(buildSeason, buildWeek);
      }
    } catch (err: any) {
      setBuildError(err.message || "Failed to compile weekly feature snapshots.");
    } finally {
      setBuildTriggering(false);
    }
  };

  // Search historical snapshots
  const handleSearchExplorer = async (seasonToSearch = explorerSeason, weekToSearch = explorerWeek) => {
    setExplorerLoading(true);
    setExplorerError(null);
    setHasSearched(true);
    try {
      const snaps = await adminApiService.fetchHistoricalSnapshots(seasonToSearch, weekToSearch);
      setExplorerSnaps(snaps);
    } catch (err: any) {
      setExplorerError(err.message || "Failed to pull snapshots.");
    } finally {
      setExplorerLoading(false);
    }
  };

  // Save new definition
  const handleAddDefinition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeatureId || !newFeatureName) {
      setAddDefErr("Feature ID and Name are required.");
      return;
    }
    setAddDefMsg(null);
    setAddDefErr(null);

    try {
      const payload = {
        feature_id: newFeatureId.trim().toLowerCase(),
        feature_name: newFeatureName.trim(),
        feature_category: newCategory,
        description: newDescription.trim(),
        sport: newSport,
        active_flag: true
      };
      await adminApiService.registerFeatureDefinition(payload);
      setAddDefMsg(`Successfully registered feature "${payload.feature_id}"!`);
      
      // Clear fields
      setNewFeatureId("");
      setNewFeatureName("");
      setNewDescription("");
      
      // Reload defs
      const defs = await adminApiService.fetchFeatureDefinitions();
      setDefinitions(defs);
    } catch (err: any) {
      setAddDefErr(err.message || "Failed to register feature definition.");
    }
  };

  return (
    <div id="admin-feature-store-panel" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm font-sans space-y-8">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-5 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 tracking-tight text-lg">Semi-Sharp Feature Store</h3>
            <p className="text-xs text-slate-500 leading-normal">Authoritative source for reproducible ML, ATS, and game model calculations</p>
          </div>
        </div>
        <button
          onClick={loadData}
          disabled={defLoading || runsLoading}
          className="flex items-center space-x-2 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 border border-slate-200 rounded-xl transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${(defLoading || runsLoading) ? "animate-spin" : ""}`} />
          <span>Sync Registry</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Feature Definitions List */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-600" />
              Active Feature Definitions ({definitions.length})
            </h4>
            <button
              onClick={() => {
                setShowAddDef(!showAddDef);
                setAddDefMsg(null);
                setAddDefErr(null);
              }}
              className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-100 transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              {showAddDef ? "Collapse Form" : "Add Definition"}
            </button>
          </div>

          {/* Add Custom Definition Form */}
          {showAddDef && (
            <form onSubmit={handleAddDefinition} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-fade-in">
              <div className="text-xs font-bold text-slate-700 border-b border-slate-200 pb-1 mb-2">Register Custom Feature Definition</div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Feature ID (lowercase, e.g. "injury_risk")</label>
                  <input
                    type="text"
                    required
                    value={newFeatureId}
                    onChange={(e) => setNewFeatureId(e.target.value)}
                    placeholder="injury_risk"
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Display Name</label>
                  <input
                    type="text"
                    required
                    value={newFeatureName}
                    onChange={(e) => setNewFeatureName(e.target.value)}
                    placeholder="Injury Risk Score"
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none"
                  >
                    <option value="Deterministic">Deterministic</option>
                    <option value="Derived">Derived</option>
                    <option value="Calculated">Calculated</option>
                    <option value="Raw">Raw</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Sport</label>
                  <input
                    type="text"
                    value={newSport}
                    onChange={(e) => setNewSport(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Description</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Normalized index representing team injury risk values..."
                  rows={2}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-lg transition"
                >
                  Save Definition
                </button>
              </div>

              {addDefMsg && <p className="text-xs text-emerald-600 font-medium pt-1">{addDefMsg}</p>}
              {addDefErr && <p className="text-xs text-rose-600 font-medium pt-1">{addDefErr}</p>}
            </form>
          )}

          {defLoading ? (
            <div className="text-xs text-slate-500">Retrieving feature definitions from store...</div>
          ) : defError ? (
            <div className="text-xs text-rose-600">Error: {defError}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {definitions.map((def) => (
                <div key={def.feature_id} className="border border-slate-100 rounded-xl p-4 bg-slate-50/40 hover:bg-slate-50 transition space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-black text-slate-900">{def.feature_name}</span>
                    <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {def.feature_category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-normal line-clamp-2">
                    {def.description || "No description provided."}
                  </p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-50">
                    <span>ID: <code className="text-emerald-700 font-bold">{def.feature_id}</code></span>
                    <span>{def.sport}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Build triggers & historical explorers */}
        <div className="lg:col-span-5 space-y-6">
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Play className="w-4 h-4 text-emerald-600" />
            Trigger Snapshots Compiler
          </h4>

          <form onSubmit={handleTriggerBuild} className="border border-slate-150 rounded-2xl p-5 bg-slate-50/30 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Target Season</label>
                <input
                  type="number"
                  required
                  value={buildSeason}
                  onChange={(e) => setBuildSeason(parseInt(e.target.value, 10))}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Weekly Leg (NFL Week)</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={18}
                  value={buildWeek}
                  onChange={(e) => setBuildWeek(parseInt(e.target.value, 10))}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Runtime Build Notes (Optional)</label>
              <input
                type="text"
                placeholder="Weekly ML compilation run for team analysis..."
                value={buildNotes}
                onChange={(e) => setBuildNotes(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={buildTriggering}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {buildTriggering ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Compiling snapshots...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Run Feature Store Compiler
                </>
              )}
            </button>

            {buildSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex gap-2 text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>{buildSuccessMsg}</p>
              </div>
            )}
            {buildError && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg flex gap-2 text-xs text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p>{buildError}</p>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Snapshot Historical Data Explorer */}
      <div className="border-t border-slate-100 pt-6 space-y-4">
        <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <Search className="w-4 h-4 text-emerald-600" />
          Feature Snapshot Historical Explorer
        </h4>

        <div className="flex flex-wrap items-end gap-3 p-4 bg-slate-50 rounded-xl border border-slate-150">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Season</label>
            <input
              type="number"
              value={explorerSeason}
              onChange={(e) => setExplorerSeason(parseInt(e.target.value, 10))}
              className="text-xs bg-white border border-slate-200 rounded-lg p-1.5 w-24 text-slate-800 font-bold focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Week</label>
            <input
              type="number"
              min={1}
              max={18}
              value={explorerWeek}
              onChange={(e) => setExplorerWeek(parseInt(e.target.value, 10))}
              className="text-xs bg-white border border-slate-200 rounded-lg p-1.5 w-20 text-slate-800 font-bold focus:outline-none"
            />
          </div>
          <button
            onClick={() => handleSearchExplorer()}
            disabled={explorerLoading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs py-1.5 px-4 rounded-lg transition h-8 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {explorerLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            Retrieve Features
          </button>
        </div>

        {explorerLoading ? (
          <div className="text-xs text-slate-500 p-4">Loading features dataset...</div>
        ) : explorerError ? (
          <div className="text-xs text-rose-500 p-4">Error loading dataset: {explorerError}</div>
        ) : hasSearched && explorerSnaps.length === 0 ? (
          <div className="text-xs text-amber-600 bg-amber-50 p-4 border border-amber-100 rounded-xl">
            No active snapshots compiled yet for Season {explorerSeason} Week {explorerWeek}. Use the "Snapshot Compiler" above to compile these!
          </div>
        ) : explorerSnaps.length > 0 ? (
          <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm max-h-[300px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  <th className="p-3 border-b border-slate-100">Team</th>
                  <th className="p-3 border-b border-slate-100">Feature</th>
                  <th className="p-3 border-b border-slate-100 text-right">Value (Scaled)</th>
                  <th className="p-3 border-b border-slate-100">Match Ref</th>
                  <th className="p-3 border-b border-slate-100 text-right">Methodology Source</th>
                </tr>
              </thead>
              <tbody>
                {explorerSnaps.map((snap, sIdx) => (
                  <tr key={sIdx} className="hover:bg-slate-50/50 text-xs text-slate-700 transition">
                    <td className="p-3 border-b border-slate-100 font-bold font-mono text-indigo-700">{snap.team_id}</td>
                    <td className="p-3 border-b border-slate-100 text-slate-800 font-mono text-slate-600 text-[11px]">{snap.feature_id}</td>
                    <td className="p-3 border-b border-slate-100 text-right font-mono font-bold text-emerald-800">{snap.feature_value.toFixed(3)}</td>
                    <td className="p-3 border-b border-slate-100 text-slate-400 font-mono text-[10px]">{snap.game_id || "Bye Week"}</td>
                    <td className="p-3 border-b border-slate-100 text-right font-mono text-slate-400 text-[9px] uppercase">{snap.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-xs text-slate-400 p-4 border border-dashed border-slate-200 rounded-xl text-center">
            Define a Season & Week above and execute query to retrieve real-time Feature Store snapshots.
          </div>
        )}
      </div>

      {/* Build Runs Audit History Logs */}
      <div className="border-t border-slate-100 pt-6 space-y-4">
        <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-emerald-600" />
          Feature Store Compiler Execution History
        </h4>

        {runsLoading ? (
          <div className="text-xs text-slate-500">Querying execution logs...</div>
        ) : runsError ? (
          <div className="text-xs text-rose-500">Error query history: {runsError}</div>
        ) : buildRuns.length === 0 ? (
          <div className="text-xs text-slate-400 p-4 border border-dashed border-slate-200 rounded-xl text-center">
            No previous compiler executions logged in persistent memory.
          </div>
        ) : (
          <div className="border border-slate-150 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  <th className="p-3 border-b border-slate-150">Run ID</th>
                  <th className="p-3 border-b border-slate-150 text-center">Span</th>
                  <th className="p-3 border-b border-slate-150">Engine Version</th>
                  <th className="p-3 border-b border-slate-150 text-center">Snapshots Compiled</th>
                  <th className="p-3 border-b border-slate-150">Execution Status</th>
                  <th className="p-3 border-b border-slate-150 text-right">Notes</th>
                </tr>
              </thead>
              <tbody>
                {buildRuns.map((r) => (
                  <tr key={r.run_id} className="hover:bg-slate-50/50 text-xs text-slate-600 transition">
                    <td className="p-3 border-b border-slate-100 font-mono text-emerald-700 font-black">{r.run_id}</td>
                    <td className="p-3 border-b border-slate-100 text-center font-mono font-bold text-slate-800">
                      S{r.season} W{r.week}
                    </td>
                    <td className="p-3 border-b border-slate-100 font-mono text-[10px] text-slate-400">{r.build_version}</td>
                    <td className="p-3 border-b border-slate-100 text-center font-mono font-bold text-indigo-700">
                      {r.feature_count}
                    </td>
                    <td className="p-3 border-b border-slate-100">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        r.status === "completed" 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : r.status === "running"
                          ? "bg-amber-50 text-amber-700 border border-amber-100 animate-pulse"
                          : "bg-rose-50 text-rose-700 border border-rose-100"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3 border-b border-slate-100 text-right text-[10px] text-slate-400 italic">
                      {r.notes || "No log records."}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
