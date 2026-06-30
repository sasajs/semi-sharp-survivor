import React, { useEffect, useState } from "react";
import { apiService } from "../../services/apiService";
import { Team, TeamAlias } from "../../types";
import { 
  Fingerprint, 
  Search, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  HelpCircle, 
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  Database
} from "lucide-react";

export const TeamAliasesManager: React.FC = () => {
  // Data State
  const [aliases, setAliases] = useState<TeamAlias[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter/Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Create Alias State
  const [newTeamId, setNewTeamId] = useState("");
  const [newAlias, setNewAlias] = useState("");
  const [newProvider, setNewProvider] = useState("");
  const [newType, setNewType] = useState<TeamAlias["alias_type"]>("common");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Test Resolution State
  const [testValue, setTestValue] = useState("");
  const [testProvider, setTestProvider] = useState("");
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testing, setTesting] = useState(false);

  // Load Data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [allAliases, allTeams] = await Promise.all([
        apiService.fetchTeamAliases(),
        apiService.fetchTeams()
      ]);
      setAliases(allAliases);
      setTeams(allTeams);
      if (allTeams.length > 0 && !newTeamId) {
        setNewTeamId(allTeams[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load team aliases configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Deactivate
  const handleDeactivate = async (id: string) => {
    if (!window.confirm("Are you sure you want to deactivate this team alias?")) {
      return;
    }
    try {
      const success = await apiService.deactivateTeamAlias(id);
      if (success) {
        setAliases(prev => prev.map(a => a.id === id ? { ...a, active: false } : a));
      }
    } catch (err: any) {
      alert(err.message || "Failed to deactivate alias");
    }
  };

  // Handle Create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamId || !newAlias || !newType) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      setSuccessMessage(null);
      const created = await apiService.createTeamAlias({
        team_id: newTeamId,
        alias: newAlias,
        provider_name: newProvider ? newProvider.trim() : null,
        alias_type: newType,
        active: true
      });
      setAliases(prev => [created, ...prev]);
      setNewAlias("");
      setNewProvider("");
      setSuccessMessage(`Successfully mapped "${newAlias}" to team "${newTeamId}"`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      alert(err.message || "Failed to create team alias");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Test Resolution
  const handleTestResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testValue.trim()) return;

    try {
      setTesting(true);
      setTestResult(null);
      const result = await apiService.resolveTeamAlias(testValue.trim(), testProvider ? testProvider.trim() : undefined);
      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || "Resolution service error"
      });
    } finally {
      setTesting(false);
    }
  };

  // Filter aliases based on user selections
  const filteredAliases = aliases.filter(item => {
    const matchesSearch = 
      item.alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.normalized_alias.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTeam = teamFilter ? item.team_id === teamFilter : true;
    const matchesType = typeFilter ? item.alias_type === typeFilter : true;
    return matchesSearch && matchesTeam && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Upper Grid: Creation & Testing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Creation Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">Map New Team Alias</h4>
              <p className="text-[11px] text-slate-400">Add synonym to resolve custom provider inputs</p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-3.5">
            {successMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs flex items-start gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Canonical Team *
                </label>
                <select
                  value={newTeamId}
                  onChange={(e) => setNewTeamId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-indigo-500"
                >
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.abbreviation} - {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Alias Type *
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="common">Common Name</option>
                  <option value="abbreviation">Abbreviation</option>
                  <option value="full_name">Full Name</option>
                  <option value="nickname">Nickname</option>
                  <option value="city">City/Market Name</option>
                  <option value="historical">Historical Variant</option>
                  <option value="provider_specific">Provider Specific</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Raw Alias Value *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OAK, Vegas, SD, etc."
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Provider Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ESPN, PFF, CBS"
                  value={newProvider}
                  onChange={(e) => setNewProvider(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-slate-300 font-bold text-xs py-2 px-4 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              Add Synonym Map
            </button>
          </form>
        </div>

        {/* Tester Block */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Fingerprint className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">Resolve Synonym Tester</h4>
              <p className="text-[11px] text-slate-400">Verify NFL team naming mappings in real-time</p>
            </div>
          </div>

          <form onSubmit={handleTestResolution} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Input Team Naming Value
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Oakland Raiders"
                  value={testValue}
                  onChange={(e) => setTestValue(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Optional Provider
                </label>
                <input
                  type="text"
                  placeholder="e.g. ESPN, CBS"
                  value={testProvider}
                  onChange={(e) => setTestProvider(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={testing || !testValue.trim()}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white disabled:bg-slate-300 font-bold text-xs py-2 px-4 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {testing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <SlidersHorizontal className="w-3.5 h-3.5" />
              )}
              Test Resolution Layer
            </button>
          </form>

          {/* Test results screen */}
          {testResult && (
            <div className={`rounded-xl p-4 text-xs border ${
              testResult.success 
                ? "bg-indigo-50/50 border-indigo-100" 
                : "bg-rose-50 border-rose-100 text-rose-900"
            }`}>
              {testResult.success ? (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-indigo-950 font-black">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>SYNONYM RESOLVED SUCCESSFULLY</span>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 text-slate-600 font-medium">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Input Value</p>
                      <p className="text-slate-900 font-semibold">{testValue}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Normalized Form</p>
                      <p className="font-mono text-slate-900">{testResult.normalized}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Canonical ID</p>
                      <p className="font-mono text-slate-900 font-black uppercase text-[13px] text-indigo-700">
                        {testResult.teamId}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Canonical Full Name</p>
                      <p className="text-slate-900 font-semibold">
                        {testResult.team ? testResult.team.name : "Unmapped details"}
                      </p>
                    </div>
                  </div>
                  {testResult.team && (
                    <div className="pt-2 border-t border-indigo-100/60 flex items-center gap-2">
                      <div 
                        className="w-3.5 h-3.5 rounded-full border border-slate-200" 
                        style={{ backgroundColor: testResult.team.primary_color }} 
                      />
                      <span className="text-[11px] text-slate-400">
                        Bye Week: <strong className="text-slate-700">{testResult.team.bye_week}</strong>
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>UNRESOLVABLE TEAM SYNONYM</span>
                  </div>
                  <p className="text-[11px] text-rose-700 leading-relaxed">
                    The value "{testValue}" could not be matched with any global or provider-specific alias. Consider adding a new synonym mapping.
                  </p>
                  <p className="text-[10px] text-slate-400 pt-1 font-mono">
                    Normalized version: {testResult.normalized}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Database Listing Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-black text-slate-950 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600 shrink-0" />
              Active Synonym Resolution Mapping Index
            </h4>
            <p className="text-[11px] text-slate-500">
              Total aliases mapped: <strong className="text-slate-900">{filteredAliases.length}</strong> (Filtered) / {aliases.length} (Global)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-48 sm:flex-initial">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search synonyms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            {/* Team Filter */}
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-600 cursor-pointer"
            >
              <option value="">All Teams</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.abbreviation}</option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-600 cursor-pointer"
            >
              <option value="">All Types</option>
              <option value="common">Common</option>
              <option value="abbreviation">Abbreviation</option>
              <option value="full_name">Full Name</option>
              <option value="nickname">Nickname</option>
              <option value="city">City</option>
              <option value="historical">Historical</option>
              <option value="provider_specific">Provider</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
            <p className="text-xs font-semibold">Loading team alias resolution records...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-700 space-y-2">
            <AlertCircle className="w-6 h-6 mx-auto text-rose-500" />
            <p className="text-xs font-bold">{error}</p>
          </div>
        ) : filteredAliases.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-1.5">
            <HelpCircle className="w-6 h-6 mx-auto text-slate-300" />
            <h5 className="text-xs font-bold text-slate-800">No synonym mappings found</h5>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
              No aliases match the filters "{searchQuery || "None"}" and selected team constraints. Clear the search query or map a new team synonym.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-extrabold uppercase tracking-wider text-[9px] border-b border-slate-100">
                  <th className="px-5 py-3">Canonical ID</th>
                  <th className="px-5 py-3">Raw Alias String</th>
                  <th className="px-5 py-3">Normalized Value</th>
                  <th className="px-5 py-3">Provider Specific</th>
                  <th className="px-5 py-3">Mapping Classification</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {filteredAliases.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md font-black">
                        {item.team_id}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-900 font-bold">{item.alias}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                        {item.normalized_alias}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {item.provider_name ? (
                        <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded-md">
                          {item.provider_name}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">Global</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full capitalize">
                        {item.alias_type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${
                        item.active 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                          : "bg-slate-100 text-slate-400 border border-slate-200"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${item.active ? "bg-emerald-600 animate-pulse" : "bg-slate-400"}`} />
                        {item.active ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {item.active ? (
                        <button
                          onClick={() => handleDeactivate(item.id)}
                          className="text-rose-600 hover:text-rose-800 p-1.5 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Deactivate Alias"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium px-2">Inactive</span>
                      )}
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
