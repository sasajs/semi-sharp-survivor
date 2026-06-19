import React, { useState } from "react";
import { Lock, ShieldAlert, ArrowRight, Eye, EyeOff } from "lucide-react";

interface AdminLoginPanelProps {
  onLoginSuccess: (token: string) => void;
}

export const AdminLoginPanel: React.FC<AdminLoginPanelProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Password cannot be blank.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ password })
      });

      const data = await res.json();

      if (res.ok && data.success && data.session?.token) {
        // Success
        localStorage.setItem("admin_token", data.session.token);
        onLoginSuccess(data.session.token);
      } else {
        setError(data.error || "Authentication failed. Incorrect admin password.");
      }
    } catch (err: any) {
      setError(err.message || "Network error. Failed to authenticate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="admin-login-panel-container" className="min-h-[70vh] flex items-center justify-center font-sans px-4">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden p-8 space-y-6">
        
        {/* Panel Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center">
            <Lock className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Administrative Vault</h2>
            <p className="text-xs text-slate-500 mt-1">
              Authentication is active. Please input the administrative passphrase to gain access to system logs and tools.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-[11px] text-rose-800 leading-relaxed animate-fade-in">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Credential Refused</p>
              <p className="mt-0.5 text-[10px] text-rose-700">{error}</p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Passphrase
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••••"
                className="w-full text-xs p-3 pr-10 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition outline-none font-mono"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs p-3.5 rounded-xl transition shadow-sm flex items-center justify-center gap-2"
          >
            {loading ? "Decrypting..." : "Access Dashboard"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Hint text */}
        <div className="text-center text-[10px] text-slate-400 font-mono scale-95">
          AUTH_ENABLED=true | Private Testing Access
        </div>

      </div>
    </div>
  );
};

export default AdminLoginPanel;
