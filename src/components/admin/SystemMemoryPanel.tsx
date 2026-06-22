import React, { useState, useEffect } from "react";
import { adminApiService } from "../../services/adminApiService";
import { ProjectMemoryResponse, ApplicationVersion, ProjectDecision } from "../../types/admin";
import { 
  Database, 
  GitBranch, 
  Tag, 
  Clock, 
  HardDrive, 
  Milestone, 
  FileText, 
  CheckCircle, 
  RefreshCw, 
  Server,
  Activity,
  AlertTriangle
} from "lucide-react";

export const SystemMemoryPanel: React.FC = () => {
  const [memory, setMemory] = useState<ProjectMemoryResponse | null>(null);
  const [versions, setVersions] = useState<ApplicationVersion[]>([]);
  const [decisions, setDecisions] = useState<ProjectDecision[]>([]);
  const [activeTab, setActiveTab] = useState<"decisions" | "versions">("decisions");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [memRes, verRes, decRes] = await Promise.all([
        adminApiService.fetchProjectMemory(),
        adminApiService.fetchApplicationVersions(),
        adminApiService.fetchDecisions()
      ]);
      setMemory(memRes);
      setVersions(verRes);
      setDecisions(decRes);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to retrieve project operational metadata.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center space-y-3 font-sans min-h-[300px]">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium font-sans">Reconstructing persistent project memory from cold logs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 flex items-start gap-4 font-sans">
        <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-rose-950 font-sans">System Memory Loader Defect</h3>
          <p className="text-xs text-rose-700 mt-1 leading-relaxed font-sans">{error}</p>
          <button 
            onClick={loadData}
            className="mt-3 text-xs font-bold text-rose-850 hover:text-white bg-rose-100 hover:bg-rose-600 border border-rose-200 rounded-lg py-1.5 px-3 transition cursor-pointer font-sans"
          >
            Retry Verification Sequence
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="system-memory-panel" className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden font-sans">
      {/* Upper Diagnostics Deck */}
      <div className="bg-slate-50 border-b border-slate-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2 font-sans">
              <Server className="w-4 h-4 text-indigo-600" />
              Active Node Environment
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5 font-sans">
              Live configuration attributes retrieved from persistent memory table <code className="bg-slate-155 px-1 py-0.2 rounded font-mono text-[9px]">system_metadata</code>.
            </p>
          </div>
          <button 
            type="button"
            onClick={loadData}
            className="self-start md:self-auto text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 p-2 rounded-lg transition-all cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Diagnostic Badges Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mt-4">
          <div className="bg-white border border-slate-150 rounded-xl p-3 shadow-2xs flex flex-col justify-between">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Software Release</span>
            <span className="text-xs font-extrabold text-slate-800 font-mono mt-1 flex items-center gap-1.5">
              <Tag className="w-3 h-3 text-indigo-500" />
              {memory?.currentVersion || "v0.27"}
            </span>
          </div>

          <div className="bg-white border border-slate-150 rounded-xl p-3 shadow-2xs flex flex-col justify-between">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Git Branch</span>
            <span className="text-xs font-extrabold text-slate-800 font-mono mt-1 flex items-center gap-1.5">
              <GitBranch className="w-3 h-3 text-emerald-500" />
              {memory?.currentBranch || "main"}
            </span>
          </div>

          <div className="bg-white border border-slate-150 rounded-xl p-3 shadow-2xs flex flex-col justify-between">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Release Tag</span>
            <span className="text-xs font-extrabold text-slate-800 font-mono mt-1 truncate max-w-full flex items-center gap-1.5" title={memory?.currentTag}>
              <Tag className="w-3 h-3 text-indigo-500" />
              {memory?.currentTag || "v0.27-pm-foundation"}
            </span>
          </div>

          <div className="bg-white border border-slate-150 rounded-xl p-3 shadow-2xs flex flex-col justify-between">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Core Hostname</span>
            <span className="text-xs font-extrabold text-slate-800 font-mono mt-1 truncate max-w-full flex items-center gap-1.5" title={memory?.hostname}>
              <Server className="w-3 h-3 text-indigo-500" />
              {memory?.hostname || "localhost"}
            </span>
          </div>

          <div className="bg-white border border-slate-150 rounded-xl p-3 shadow-2xs flex flex-col justify-between">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Database Engine</span>
            <span className="text-xs font-extrabold text-slate-800 font-mono mt-1 flex items-center gap-1.5">
              <Database className="w-3 h-3 text-blue-500" />
              {memory?.databaseStatus || "MOCK"}
            </span>
          </div>

          <div className="bg-white border border-slate-150 rounded-xl p-3 shadow-2xs flex flex-col justify-between col-span-2 lg:col-span-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Last System Boot</span>
            <span className="text-[10px] font-extrabold text-slate-850 font-mono mt-1 truncate" title={memory?.startupTimestamp ? new Date(memory.startupTimestamp).toLocaleString() : ""}>
              {memory?.startupTimestamp ? new Date(memory.startupTimestamp).toLocaleTimeString() : "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Tabbed operational panel */}
      <div className="p-6">
        <div className="flex border-b border-slate-205">
          <button 
            type="button"
            onClick={() => setActiveTab("decisions")}
            className={`cursor-pointer text-xs font-extrabold uppercase tracking-widest pb-3 px-1 border-b-2 transition flex items-center gap-2 font-sans ${
              activeTab === "decisions" 
                ? "border-indigo-600 text-indigo-700 font-extrabold" 
                : "border-transparent text-slate-400 hover:text-slate-600 font-extrabold"
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Project Decisions Index ({decisions.length})
          </button>
          
          <button 
            type="button"
            onClick={() => setActiveTab("versions")}
            className={`cursor-pointer ml-6 text-xs font-extrabold uppercase tracking-widest pb-3 px-1 border-b-2 transition flex items-center gap-2 font-sans ${
              activeTab === "versions" 
                ? "border-indigo-600 text-indigo-700 font-extrabold" 
                : "border-transparent text-slate-400 hover:text-slate-600 font-extrabold"
            }`}
          >
            <Milestone className="w-3.5 h-3.5" />
            Milestone Release Logs ({versions.length})
          </button>
        </div>

        {/* Content Section */}
        <div className="mt-6 font-sans">
          {activeTab === "decisions" ? (
            <div className="space-y-4 font-sans">
              {decisions.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-sans">
                  No decision logs registered in this persistent metadata region.
                </div>
              ) : (
                <div className="grid gap-4 font-sans">
                  {decisions.map((dec) => (
                    <div key={dec.decisionId} className="border border-slate-200 hover:border-slate-300 bg-slate-50/20 hover:bg-slate-50/50 rounded-xl p-5 shadow-xs transition-colors flex flex-col md:flex-row gap-4 items-start justify-between font-sans">
                      <div className="space-y-2 font-sans">
                        <div className="flex flex-wrap items-center gap-2 font-sans">
                          <span className="text-[10px] font-bold tracking-wider uppercase bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full inline-block font-sans">
                            {dec.category}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 font-mono">
                            Logged: {dec.decisionDate}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 tracking-tight mt-1.5 font-sans">
                          {dec.title}
                        </h4>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2 pt-1 font-sans">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 block font-sans">Technical Rationale</span>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed font-sans">
                              {dec.rationale}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 block font-sans">Functional Scope / Impact</span>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed font-sans">
                              {dec.impact}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 self-end md:self-start">
                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full border tracking-wide uppercase font-sans ${
                          dec.status === "APPROVED" 
                            ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                            : dec.status === "DEPRECATED"
                            ? "bg-slate-100 border-slate-200 text-slate-600"
                            : "bg-amber-50 border-amber-100 text-amber-800"
                        }`}>
                          {dec.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 font-sans">
              {versions.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-sans">
                  No application milestones registered in this persistent metadata region.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-slate-50/10 font-sans">
                  <table className="w-full text-left border-collapse table-auto font-sans">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 font-mono">
                        <th className="py-3 px-4">Release Version</th>
                        <th className="py-3 px-4">Milestone Context</th>
                        <th className="py-3 px-4">Release Date</th>
                        <th className="py-3 px-4">Git Commit Hash</th>
                        <th className="py-3 px-4">Architectural Milestones / Changes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-sans">
                      {versions.map((ver) => (
                        <tr key={ver.versionId} className="hover:bg-slate-50/50 bg-white">
                          <td className="py-3.5 px-4 font-bold text-slate-900 font-mono flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-indigo-600" />
                            {ver.versionTag}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-700">
                            {ver.milestoneName}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 text-[11px] font-mono">
                            {new Date(ver.releaseDate).toLocaleDateString(undefined, {
                              year: 'numeric', month: 'short', day: 'numeric'
                            })}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500">
                            <span className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[9px] font-bold" title={ver.gitCommitHash}>
                              {ver.gitCommitHash ? ver.gitCommitHash.substring(0, 7) : "N/A"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-sans leading-relaxed max-w-sm">
                            {ver.releaseNotes}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemMemoryPanel;
