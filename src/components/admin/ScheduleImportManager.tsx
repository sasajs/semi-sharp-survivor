import React, { useState, useRef } from "react";
import { Upload, Play, RefreshCw, CheckCircle, AlertTriangle, XCircle, FileText, Loader2, ArrowRight } from "lucide-react";

export const ScheduleImportManager: React.FC = () => {
  const [provider, setProvider] = useState<string>("Custom Upload");
  const [content, setContent] = useState<string>("");
  const [filename, setFilename] = useState<string>("schedule.csv");
  const [loading, setLoading] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [result, setResult] = useState<any | null>(null);
  const [preview, setPreview] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setContent(text);
      setPreview(null);
      setResult(null);
      setError(null);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const loadSampleCSV = () => {
    const sample = `week,game_time,home_team,away_team,home_score,away_score,status
1,2026-09-10T20:20:00Z,Kansas City Chiefs,Detroit Lions,20,21,final
1,2026-09-13T13:00:00Z,ARI,WAS,,,scheduled
1,2026-09-13T13:00:00Z,bal,hou,25,9,final
2,2026-09-17T20:15:00Z,Philadelphia Eagles,Minnesota Vikings,,,scheduled
19,2026-09-20T13:00:00Z,nyg,dal,,,scheduled
2,2026-09-14T20:00:00Z,Invalid Team,buf,,,scheduled`;
    setContent(sample);
    setFilename("sample_schedule.csv");
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const loadSampleJSON = () => {
    const sample = [
      { "week": 1, "game_time": "2026-09-10T20:20:00Z", "home_team": "KC", "away_team": "DET", "home_score": 20, "away_score": 21, "status": "final" },
      { "week": 1, "game_time": "2026-09-13T13:00:00Z", "home_team": "Arizona Cardinals", "away_team": "Washington Commanders", "status": "scheduled" },
      { "week": 2, "game_time": "2026-09-17T20:15:00Z", "home_team": "PHI", "away_team": "MIN", "status": "scheduled" }
    ];
    setContent(JSON.stringify(sample, null, 2));
    setFilename("sample_schedule.json");
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const handlePreview = async () => {
    if (!content.trim()) {
      setError("Please paste file content or upload a schedule file first.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/data/import-jobs/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, content, provider })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to generate preview.");
      }
      const data = await res.json();
      setPreview(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (mode: 'dry_run' | 'commit') => {
    if (!content.trim()) {
      setError("Please paste file content or upload a schedule file first.");
      return;
    }
    setLoading(true);
    setError(null);
    setPreview(null);
    try {
      const res = await fetch("/api/admin/data/import-jobs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, content, provider, mode, initiated_by: "admin" })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to execute ingestion pipeline.");
      }
      const data = await res.json();
      setResult({ ...data, mode });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input and Upload */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Inbound Data Provider
                </label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value="Custom Upload">Custom File Upload (CSV or JSON)</option>
                  <option value="NFL API">NFL API Connector (Adapter)</option>
                  <option value="SportsDataIO">SportsDataIO Feed (Adapter)</option>
                  <option value="Sportradar">Sportradar Ingestion (Adapter)</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={loadSampleCSV}
                  className="px-2.5 py-1 text-[10px] font-bold bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg transition"
                >
                  Load Sample CSV
                </button>
                <button
                  onClick={loadSampleJSON}
                  className="px-2.5 py-1 text-[10px] font-bold bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg transition"
                >
                  Load Sample JSON
                </button>
              </div>
            </div>

            {/* Drag & Drop Area */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 ${
                dragActive ? "border-indigo-500 bg-indigo-50" : "border-slate-300 bg-white hover:bg-slate-50"
              }`}
            >
              <Upload className="w-8 h-8 text-slate-400" />
              <div>
                <p className="text-xs font-bold text-slate-700">Drag schedule file here or click to browse</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Supports standard NFL format CSV or JSON</p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv,.json"
                className="hidden"
              />
            </div>

            {/* Manual Text Input */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500 font-mono flex items-center gap-1">
                  <FileText className="w-3 h-3 text-slate-400" />
                  FILE: {filename}
                </span>
                {content && (
                  <button
                    onClick={() => setContent("")}
                    className="text-[10px] font-extrabold text-rose-600 hover:underline"
                  >
                    Clear Content
                  </button>
                )}
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your CSV raw lines or JSON arrays here..."
                rows={8}
                className="w-full text-xs font-mono p-3 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 focus:border-indigo-500 focus:outline-hidden leading-relaxed shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Execution Panel */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 h-fit">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            Import Actions
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Choose an operation below to parse, analyze, dry-run, or execute the 8-stage Weekly Ingestion Pipeline.
          </p>

          <div className="space-y-2 pt-2">
            <button
              onClick={handlePreview}
              disabled={loading || !content}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-extrabold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Generate Live Preview
            </button>

            <button
              onClick={() => handleImport('dry_run')}
              disabled={loading || !content}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-extrabold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Dry Run Validation
            </button>

            <button
              onClick={() => handleImport('commit')}
              disabled={loading || !content}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Commit Ingestion Pipeline
            </button>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-950 p-3 rounded-xl text-xs flex gap-2">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold">Ingestion Error</p>
                <p className="text-[11px] mt-0.5 text-rose-700 leading-relaxed">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Result Display */}
      {preview && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              Schedule File Preview: {preview.filename}
            </h4>
            <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
              SHA-256: {preview.checksum.substring(0, 12)}...
            </span>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Read Rows</span>
              <span className="text-xl font-black text-slate-900 block mt-1">{preview.rows_read}</span>
            </div>
            <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl text-center">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block">To Insert</span>
              <span className="text-xl font-black text-emerald-800 block mt-1">{preview.rows_inserted}</span>
            </div>
            <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-xl text-center">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest block">To Update</span>
              <span className="text-xl font-black text-amber-800 block mt-1">{preview.rows_updated}</span>
            </div>
            <div className="bg-rose-50/50 border border-rose-100 p-3 rounded-xl text-center">
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest block">To Reject</span>
              <span className="text-xl font-black text-rose-800 block mt-1">{preview.rows_rejected}</span>
            </div>
          </div>

          {/* Warnings List */}
          {preview.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
              <h5 className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Data Quality Warning Logs ({preview.warnings.length})
              </h5>
              <div className="max-h-40 overflow-y-auto divide-y divide-amber-200/50 pr-2">
                {preview.warnings.map((warn: any, idx: number) => (
                  <div key={idx} className="py-2 text-[11px] text-amber-800 flex items-start justify-between gap-4">
                    <span>{warn.message}</span>
                    {warn.row_index && <span className="font-mono text-[9px] bg-amber-200/50 px-1.5 py-0.5 rounded-md shrink-0">Row {warn.row_index}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview Table */}
          <div className="space-y-2">
            <h5 className="text-xs font-extrabold text-slate-800">Inbound Games & Alias Resolution Mappings</h5>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold">
                  <tr>
                    <th className="px-4 py-2.5">Week</th>
                    <th className="px-4 py-2.5">Inbound Home Team</th>
                    <th className="px-4 py-2.5">Resolved ID</th>
                    <th className="px-4 py-2.5">Inbound Away Team</th>
                    <th className="px-4 py-2.5">Resolved ID</th>
                    <th className="px-4 py-2.5">Status / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {preview.preview_rows.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-bold text-slate-700">W{row.week}</td>
                      <td className="px-4 py-2.5 font-medium">{row.home_team}</td>
                      <td className="px-4 py-2.5 font-mono text-[11px]">
                        {row.resolved_home ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md">{row.resolved_home}</span>
                        ) : (
                          <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md">unresolved</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-medium">{row.away_team}</td>
                      <td className="px-4 py-2.5 font-mono text-[11px]">
                        {row.resolved_away ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md">{row.resolved_away}</span>
                        ) : (
                          <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md">unresolved</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {row.action === 'insert' && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Insert Game
                          </span>
                        )}
                        {row.action === 'update' && (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Update Game
                          </span>
                        )}
                        {row.action === 'reject' && (
                          <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full uppercase tracking-wider" title={row.reason}>
                            Reject: {row.reason}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Execution Results Summary */}
      {result && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Ingestion Pipeline Results: {result.status.toUpperCase()}
            </h4>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Mode: {result.mode}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Read Rows</span>
              <span className="text-xl font-black text-slate-900 block mt-1">{result.rows_read}</span>
            </div>
            <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl text-center">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block">Inserted</span>
              <span className="text-xl font-black text-emerald-800 block mt-1">{result.rows_inserted}</span>
            </div>
            <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-xl text-center">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest block">Updated</span>
              <span className="text-xl font-black text-amber-800 block mt-1">{result.rows_updated}</span>
            </div>
            <div className="bg-rose-50/50 border border-rose-100 p-3 rounded-xl text-center">
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest block">Rejected</span>
              <span className="text-xl font-black text-rose-800 block mt-1">{result.rows_rejected}</span>
            </div>
            <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl text-center col-span-2 md:col-span-1">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">Duration</span>
              <span className="text-xl font-black text-indigo-800 block mt-1">{result.duration_ms} ms</span>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
              <h5 className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Pipeline Warnings & Anomalies Detected ({result.errors.length})
              </h5>
              <div className="max-h-40 overflow-y-auto divide-y divide-amber-200/50 pr-2">
                {result.errors.map((err: any, idx: number) => (
                  <div key={idx} className="py-2 text-[11px] text-amber-800 flex items-start justify-between gap-4">
                    <span>{err.message}</span>
                    {err.row_index && <span className="font-mono text-[9px] bg-amber-200/50 px-1.5 py-0.5 rounded-md shrink-0">Row {err.row_index}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.status === "completed" && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3 text-xs text-emerald-800 leading-relaxed shadow-inner">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-emerald-950">Ingestion Committed Successfully & Downstream Features Generated</p>
                <p className="mt-0.5 text-emerald-700">
                  The Weekly Pipeline Coordinator has finished stage execution! Inbound NFL games were saved, and default weekly inputs, team features, and game features have been generated to protect analytical pipelines.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
