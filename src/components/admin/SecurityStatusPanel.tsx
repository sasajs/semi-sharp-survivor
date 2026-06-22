import React, { useState, useEffect } from "react";
import { adminApiService } from "../../services/adminApiService";
import { SecurityStatus, AuthAuditRecord } from "../../types/admin";
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Users, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  Terminal, 
  Lock, 
  Unlock,
  AlertOctagon,
  Eye,
  Settings,
  UserCheck
} from "lucide-react";

export const SecurityStatusPanel: React.FC = () => {
  const [status, setStatus] = useState<SecurityStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApiService.fetchSecurityStatus();
      setStatus(data);
    } catch (err: any) {
      setError(err?.message || "Failed to query secure audit databases.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const getEventBadgeColor = (type: string) => {
    switch (type) {
      case "LOGIN_SUCCESS":
        return "bg-emerald-50 text-emerald-800 border-emerald-150";
      case "LOGIN_FAILURE":
        return "bg-rose-50 text-rose-800 border-rose-150";
      case "LOGOUT":
        return "bg-slate-50 text-slate-700 border-slate-200";
      case "SESSION_EXPIRATION":
        return "bg-amber-50 text-amber-800 border-amber-150";
      case "UNAUTHORIZED_ATTEMPT":
        return "bg-rose-50 text-rose-800 border-rose-150 font-bold animate-pulse";
      case "FORBIDDEN_ATTEMPT":
        return "bg-red-50 text-red-800 border-red-150 font-bold";
      default:
        return "bg-indigo-50 text-indigo-700 border-indigo-150";
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "LOGIN_SUCCESS":
        return <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />;
      case "LOGIN_FAILURE":
      case "UNAUTHORIZED_ATTEMPT":
      case "FORBIDDEN_ATTEMPT":
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />;
      case "SESSION_EXPIRATION":
        return <Clock className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <Terminal className="w-3.5 h-3.5 text-indigo-500" />;
    }
  };

  return (
    <div id="admin-security-status-panel" className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden font-sans">
      
      {/* Panel Header */}
      <div className="border-b border-slate-100 p-5 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Administrative Gatekeeper & Authorization Audit</h3>
            <p className="text-xs text-slate-500 mt-0.5">Control API restrictions, capture policy enforcement, detect intrusion attempts, and manage sessions</p>
          </div>
        </div>
        
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-250 text-xs font-bold text-slate-700 rounded-xl hover:bg-slate-50 disabled:bg-slate-50 transition cursor-pointer shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Registry
        </button>
      </div>

      {/* Main Panel Content */}
      <div className="p-6 space-y-6">
        
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-xs flex gap-2.5 items-start">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Security Query Inoperative</p>
              <p className="mt-0.5">{error}. Admin rights or a valid token may be missing.</p>
            </div>
          </div>
        )}

        {status && (
          <>
            {/* Telemetry Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              
              <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/10 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Gateway Gate</span>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {status.authenticationEnabled ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-100 font-mono uppercase">
                        <Lock className="w-3 h-3" /> SECURED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-100 font-mono uppercase">
                        <Unlock className="w-3 h-3" /> UNGUARDED
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-3 text-[10px] text-slate-500">
                  <span>Policy path enforcement</span>
                </div>
              </div>

              <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/10 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Session Limit TTL</span>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-bold text-slate-900">{status.sessionTimeoutMinutes} Mins</span>
                  </div>
                </div>
                <div className="mt-3 text-[10px] text-slate-500">
                  <span>Expired tokens discarded</span>
                </div>
              </div>

              <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/10 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Connected Sessions</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-bold text-slate-950 font-mono">{status.activeSessions}</span>
                  </div>
                </div>
                <div className="mt-3 text-[10px] text-slate-500">
                  <span>Concurrent active links</span>
                </div>
              </div>

              <div className={`border rounded-xl p-4 flex flex-col justify-between transition-all ${
                status.failedLogins24h > 0 
                  ? "border-rose-200 bg-rose-50/10" 
                  : "border-slate-150 bg-slate-50/10"
              }`}>
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Failed Entries (24h)</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <AlertTriangle className={`w-4 h-4 ${status.failedLogins24h > 0 ? "text-rose-500" : "text-slate-400"}`} />
                    <span className={`text-sm font-bold font-mono ${status.failedLogins24h > 0 ? "text-rose-600" : "text-slate-900"}`}>
                      {status.failedLogins24h}
                    </span>
                  </div>
                </div>
                <div className="mt-3 text-[10px] text-slate-500">
                  <span>Password validation fails</span>
                </div>
              </div>

              <div className={`border rounded-xl p-4 flex flex-col justify-between transition-all ${
                status.unauthorizedAttempts24h > 0 
                  ? "border-red-250 bg-red-50/10 animate-border-flash" 
                  : "border-slate-150 bg-slate-50/10"
              }`}>
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Intrusions Intercepted</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <AlertOctagon className={`w-4 h-4 ${status.unauthorizedAttempts24h > 0 ? "text-red-500" : "text-slate-400"}`} />
                    <span className={`text-sm font-bold font-mono ${status.unauthorizedAttempts24h > 0 ? "text-red-600 animate-pulse" : "text-slate-900"}`}>
                      {status.unauthorizedAttempts24h}
                    </span>
                  </div>
                </div>
                <div className="mt-3 text-[10px] text-slate-500">
                  <span>Blocked API / Admin calls</span>
                </div>
              </div>

            </div>

            {/* Audit Log Table */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] bg-slate-100 text-slate-700 font-black px-2.5 py-1 rounded font-mono uppercase tracking-wider">
                  Authentication Audit Terminal
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Displaying last 25 operations</span>
              </div>

              {(!status.recentAttempts || status.recentAttempts.length === 0) ? (
                <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400">
                  <UserCheck className="w-6 h-6 mx-auto text-slate-300 mb-2" />
                  No security events have been logged in the active lifecycle yet.
                </div>
              ) : (
                <div className="border border-slate-150 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-extrabold uppercase text-slate-400 border-b border-slate-150">
                          <th className="py-2.5 px-4">Timestamp</th>
                          <th className="py-2.5 px-4">Event Classification</th>
                          <th className="py-2.5 px-4">User</th>
                          <th className="py-2.5 px-4">IP Address</th>
                          <th className="py-2.5 px-4 hidden md:table-cell">Client Agent</th>
                          <th className="py-2.5 px-4">Detailed Result Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
                        {status.recentAttempts.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/50 transition">
                            <td className="py-2 px-4 text-slate-500 whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleString(undefined, {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                                hour12: false
                              })}
                            </td>
                            <td className="py-2 px-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold border capitalize ${getEventBadgeColor(log.eventType)}`}>
                                {getEventIcon(log.eventType)}
                                {log.eventType.replace("_", " ").toLowerCase()}
                              </span>
                            </td>
                            <td className="py-2 px-4 font-bold text-slate-900 whitespace-nowrap">
                              {log.username}
                            </td>
                            <td className="py-2 px-4 text-slate-500 text-[10px]">
                              {log.ipAddress}
                            </td>
                            <td className="py-2 px-4 text-slate-400 text-[10px] max-w-[120px] truncate hidden md:table-cell" title={log.userAgent}>
                              {log.userAgent}
                            </td>
                            <td className="py-2 px-4 text-slate-600 max-w-[250px] truncate" title={log.result}>
                              {log.result}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Access control quick summary rules */}
            <div className="flex gap-3 bg-indigo-50/40 border border-indigo-100 rounded-xl p-4 text-[11px] leading-relaxed text-indigo-950">
              <Settings className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Production Role Hierarchy (RBAC) Policies:</p>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-600">
                  <li><span className="font-bold text-slate-800">ADMIN:</span> Full permissions. Retains access to all databases, orchestration workflows, schedulers, and pipelines.</li>
                  <li><span className="font-bold text-slate-800">USER:</span> Read-only status panel views only. Intercepted with HTTP <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">403</code> and rejected upon attempting workflows or data modification scripts.</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
};

export default SecurityStatusPanel;
