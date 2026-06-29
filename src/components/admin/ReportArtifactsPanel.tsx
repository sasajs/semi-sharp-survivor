import React, { useState, useEffect } from "react";
import { adminApiService } from "../../services/adminApiService";
import { apiService } from "../../services/apiService";
import { WeeklyReport } from "../../types/admin";
import { safeArray, safeString, safeDate } from "../../utils/safeFormat";
import { FileText, RefreshCw, Calendar, Eye, Hash, ShieldCheck, HelpCircle, Layers } from "lucide-react";

export const ReportArtifactsPanel: React.FC = () => {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [evolutionSummaries, setEvolutionSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, summaries] = await Promise.all([
        adminApiService.fetchReports(),
        apiService.fetchRecommendationEvolutionSummary()
      ]);
      setReports(data);
      setEvolutionSummaries(summaries);
    } catch (err: any) {
      console.error("Failed to load reports:", err);
      setError(err.message || "Failed to retrieve compiled weekly reports list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const getEvolutionSummaryForWeek = (weekNum: number): any => {
    return (evolutionSummaries || []).find((s: any) => s.week === weekNum);
  };

  return (
    <div id="admin-reports-artifacts-panel" className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-sans font-medium text-gray-900 tracking-tight text-lg">Weekly Evaluation Reports</h3>
            <p className="font-sans text-xs text-gray-500">Structured outputs compiled across Survivor contest legs</p>
          </div>
        </div>
        <button
          id="btn-re-fetch-reports"
          onClick={fetchReports}
          disabled={loading}
          className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>{loading ? "Aligning..." : "Reload Reports"}</span>
        </button>
      </div>

      {error ? (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-lg text-rose-800 text-xs">
          {error}
        </div>
      ) : safeArray(reports).length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-200 rounded-lg text-slate-400">
          <p className="text-sm font-medium">No strategy reports compiled yet</p>
          <p className="text-xs mt-1">Generate a report via the manual trigger console or simulation panels</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {safeArray(reports).map((rep: any) => (
            <div
              key={rep?.id}
              className="border border-slate-100 rounded-xl p-5 hover:border-indigo-100 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded uppercase font-mono">
                    NFL Week {rep?.week_number} Evaluation
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ID: {safeString(rep?.id).slice(-10)}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-xs text-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Season Year: </span>
                    <span className="font-semibold text-slate-800">2026/27</span>
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-slate-700">
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span>Top Recommendation: </span>
                    <span className="font-semibold text-indigo-600 bg-indigo-50/40 px-1.5 py-0.5 rounded">
                      {rep?.executive_summary?.top_recommended_pick?.team_name || "None"}
                    </span>
                  </div>

                  {(() => {
                    const sum = getEvolutionSummaryForWeek(Number(rep?.week_number));
                    return sum ? (
                      <div className="flex items-center space-x-2 text-xs text-slate-700">
                        <Layers className="w-3.5 h-3.5 text-indigo-500 font-bold" />
                        <span>Evolution Changes: </span>
                        <span className="font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                          {sum.total_changes} total ({sum.major_changes} major)
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-xs text-slate-500 italic">
                        <Layers className="w-3.5 h-3.5 text-slate-300" />
                        <span>No recommendation evolution logged for this week</span>
                      </div>
                    );
                  })()}

                  {rep?.audit_metadata?.hash && (
                    <div className="flex items-center space-x-2 text-xs text-slate-700">
                      <Hash className="w-3.5 h-3.5 text-slate-400" />
                      <span>Security SHA Hash: </span>
                      <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50/50 px-1.5 py-0.5 rounded font-bold break-all">
                        {safeString(rep?.audit_metadata?.hash).slice(0, 16)}...
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-500 font-sans">
                <span className="flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Immutable Audit Locked</span>
                </span>
                <span>
                  {safeDate(rep?.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
