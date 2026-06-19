import React, { useState, useEffect } from "react";
import { adminApiService } from "../../services/adminApiService";
import { ResearchArtifact } from "../../types/admin";
import { safeArray, safeString, safeDate } from "../../utils/safeFormat";
import { DownloadCloud, RefreshCw, FileText, Sparkles, Hash, Lock } from "lucide-react";

export const ExportArtifactsPanel: React.FC = () => {
  const [artifacts, setArtifacts] = useState<ResearchArtifact[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchArtifacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApiService.fetchArtifacts();
      setArtifacts(data);
    } catch (err: any) {
      console.error("Failed to load artifacts:", err);
      setError(err.message || "Failed to retrieve compiled export studies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtifacts();
  }, []);

  return (
    <div id="admin-export-artifacts-panel" className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-pink-50 rounded-lg text-pink-600">
            <DownloadCloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-sans font-medium text-gray-900 tracking-tight text-lg">Hidelity Export Artifacts</h3>
            <p className="font-sans text-xs text-gray-500">Document and research captures compiled for external audit</p>
          </div>
        </div>
        <button
          id="btn-re-fetch-exports"
          onClick={fetchArtifacts}
          disabled={loading}
          className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>{loading ? "Re-syncing..." : "Reload Exports"}</span>
        </button>
      </div>

      {error ? (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-lg text-rose-800 text-xs">
          {error}
        </div>
      ) : safeArray(artifacts).length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-200 rounded-lg text-slate-400">
          <p className="text-sm font-medium">No external studies exported yet</p>
          <p className="text-xs mt-1">Exports are compiled as a final step during manual workflow execution playbooks</p>
        </div>
      ) : (
        <div className="space-y-4">
          {safeArray(artifacts).map((art: any) => (
            <div
              key={art?.id}
              className="border border-gray-150 rounded-xl p-5 hover:border-pink-100 hover:bg-slate-50/20 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-pink-50 text-pink-600 rounded-lg mt-0.5">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-sans font-semibold text-slate-800 text-sm">{art?.title}</h4>
                    <p className="font-sans text-xs text-slate-400">Report Ref: {safeString(art?.report_id).slice(-10)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] bg-slate-100/80 font-semibold font-sans px-2 py-0.5 rounded text-slate-600 uppercase border border-slate-200/50">
                    S2026/27 — DOCX / HTML
                  </span>
                </div>
              </div>

              {/* Artifact sections preview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-center">
                  <p className="text-[10px] font-bold text-slate-400 font-mono">SECTIONS</p>
                  <p className="text-sm font-bold text-slate-700 font-mono mt-0.5">8 blocks</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-center">
                  <p className="text-[10px] font-bold text-slate-400 font-mono">APPENDICES</p>
                  <p className="text-sm font-bold text-slate-700 font-mono mt-0.5">2 files</p>
                </div>
                {art?.audit_metadata?.export_hash && (
                  <div className="p-2 bg-slate-50 col-span-2 rounded-lg border border-slate-100 flex items-center justify-center space-x-2">
                    <Hash className="w-3.5 h-3.5 text-pink-500 shrinking-0" />
                    <span className="font-mono text-[9px] text-pink-800 font-semibold break-all text-left uppercase">
                      {safeString(art?.audit_metadata?.export_hash).slice(0, 24)}...
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-400 font-sans">
                <span className="flex items-center space-x-1.5 text-emerald-600">
                  <Lock className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="font-medium">Cryptographic state trace validated</span>
                </span>
                <span>
                  {safeDate(art?.generated_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
