import React, { useState, useEffect } from "react";
import { adminApiService } from "../../services/adminApiService";
import { RemoteAccessStatus } from "../../types/admin";
import { 
  Globe, 
  ShieldAlert, 
  ShieldCheck, 
  Cpu, 
  RefreshCw, 
  Server, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink,
  ClipboardCheck,
  Clipboard,
  Terminal,
  CheckSquare,
  Square
} from "lucide-react";

export const RemoteAccessPanel: React.FC = () => {
  const [status, setStatus] = useState<RemoteAccessStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApiService.fetchRemoteAccess();
      setStatus(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load remote access layer configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleStep = (index: number) => {
    setCompletedSteps(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  if (loading && !status) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center space-y-3 shadow-sm min-h-[300px]">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Resolving local networking configuration...</p>
      </div>
    );
  }

  return (
    <div id="remote-access-verification-panel" className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden font-sans">
      <div className="border-b border-slate-100 p-5 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Remote Access & HTTPS Encryption Posture</h3>
            <p className="text-xs text-slate-500 mt-0.5">Diagnose LAN connections, cloud tunneling, and external deployment readiness</p>
          </div>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-250 text-xs font-bold text-slate-700 rounded-xl hover:bg-slate-50 disabled:bg-slate-50 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </button>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-xs flex gap-2.5 items-start">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Query Failure</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {status && (
          <>
            {/* Status Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/20 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">LAN Access Host</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-sm font-bold text-slate-900">{status.lanUrl}</span>
                    <button 
                      onClick={() => copyToClipboard(status.lanUrl)}
                      className="text-slate-400 hover:text-indigo-600 transition p-1 rounded hover:bg-slate-100"
                      title="Copy LAN URL"
                    >
                      {copied ? <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Clipboard className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex items-center text-[10px] text-slate-500 gap-1">
                  <Server className="w-3 h-3 text-slate-400" />
                  <span>Port: <span className="font-mono font-semibold text-slate-800">{status.localPort}</span></span>
                </div>
              </div>

              <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/20 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Remote Access Bridge</span>
                  <div className="mt-1.5">
                    {status.cloudflareTunnelConfigured ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-100 uppercase">
                        <ShieldCheck className="w-3.5 h-3.5" /> Cloudflare Active
                      </span>
                    ) : status.tailscaleConfigured ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-100 uppercase">
                        <ShieldCheck className="w-3.5 h-3.5" /> Tailscale Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-800 border border-amber-100 uppercase">
                        <AlertTriangle className="w-3.5 h-3.5" /> LAN-Only Bound
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-3 text-[10px] text-slate-500">
                  <span>Recommended: <span className="font-semibold text-indigo-600">{status.recommendedPublicAccess.replace('_', ' ')}</span></span>
                </div>
              </div>

              <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/20 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">HTTPS TLS Requirement</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-sm font-bold text-slate-900">{status.httpsRequired ? "Enforced Cert" : "Standard Plain"}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  </div>
                </div>
                <div className="mt-3 text-[10px] text-slate-500">
                  <span>SSL encryption required on remote hosts</span>
                </div>
              </div>

              <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/20 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Control Authorization</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-sm font-bold ${status.warnings.some(w => w.includes("AUTH_ENABLED=true")) ? 'text-amber-600' : 'text-emerald-700'}`}>
                      {status.warnings.some(w => w.includes("AUTH_ENABLED=true")) ? "Missing Auth" : "Auth Recommended"}
                    </span>
                  </div>
                </div>
                <div className="mt-3 text-[10px] text-slate-500">
                  <span>Is credential lock mandatory? <span className="font-semibold text-slate-800">{status.authRecommended ? "YES" : "NO"}</span></span>
                </div>
              </div>
            </div>

            {/* Warn Panel */}
            {status.warnings.length > 0 && (
              <div className="border border-amber-200 bg-amber-50/45 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Security Vulnerability & Expose Warnings</span>
                </div>
                <div className="space-y-1.5">
                  {status.warnings.map((warn, i) => (
                    <div key={i} className="text-slate-700 text-xs pl-6 list-disc leading-relaxed">
                      • {warn}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Action & Config playbook block */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/45 border border-slate-150 rounded-2xl p-5">
              <div className="lg:col-span-4 space-y-3">
                <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 font-black px-2 py-1 rounded font-mono uppercase tracking-wide">
                  Architectural Recommendation
                </span>
                <h4 className="text-base font-bold text-slate-900 tracking-tight">Cloudflare Tunnel Daemon Setup</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Establish a secure outbound connection from port 3000 on your host system directly to the Cloudflare gateway. 
                  This completely routes traffic through a trusted secure HTTPS tunnel, avoiding port forwarding on physical router firewalls.
                </p>

                <div className="pt-2">
                  <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Reference Documentation</div>
                  <div className="mt-1.5 space-y-1.5">
                    <span className="flex items-center gap-1.5 text-xs text-indigo-600 border border-dashed border-indigo-150 p-2 rounded-lg bg-white">
                      <Terminal className="w-3.5 h-3.5" />
                      <span className="font-mono text-[10px]">deployment/remote-access/</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Checklist playbox */}
              <div className="lg:col-span-8 border-l border-slate-150 pl-0 lg:pl-6 space-y-3">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Setup Verification Checklist</span>
                <div className="space-y-2">
                  {status.nextSteps.map((step, idx) => {
                    const isCompleted = completedSteps[idx];
                    return (
                      <div 
                        key={idx}
                        onClick={() => toggleStep(idx)}
                        className={`p-3 rounded-lg border text-xs cursor-pointer flex items-start gap-3 transition-all ${
                          isCompleted 
                            ? 'bg-emerald-50/20 border-emerald-150/50 text-slate-600' 
                            : 'bg-white border-slate-150 text-slate-800 hover:border-indigo-150 hover:bg-slate-50/30'
                        }`}
                      >
                        <button className="shrink-0 mt-0.5 transition-transform" aria-label="Toggle Step">
                          {isCompleted ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                        <div className="leading-relaxed">
                          <span className={isCompleted ? 'line-through text-slate-400' : ''}>
                            {step}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
