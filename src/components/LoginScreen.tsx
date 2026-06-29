import React, { useState } from "react";
import { Lock, Eye, EyeOff, ShieldCheck, HelpCircle } from "lucide-react";

interface LoginScreenProps {
  onLogin: (username: string, password: string) => Promise<void>;
  loading: boolean;
  errorMsg: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, loading, errorMsg }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showHelper, setShowHelper] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && password.trim()) {
      onLogin(username.trim(), password.trim());
    }
  };

  const handleSetQuickCredentials = (quickUser: string) => {
    setUsername(quickUser);
    setPassword(""); // Let them type the password configured in their environment
  };

  return (
    <div id="login-screen-root" className="min-h-screen bg-slate-50 flex flex-col justify-center items-center font-sans antialiased text-slate-900 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-white text-2xl tracking-tighter shadow-md">
            S2
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-950 tracking-tight uppercase">
              Semi-Sharp Survivor
            </h1>
            <p className="text-xs text-indigo-600 font-extrabold uppercase tracking-widest mt-0.5">
              Explainable Survivor Decision Intelligence
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-extrabold text-slate-900">Sign In</h2>
            <p className="text-xs text-slate-400 mt-1">
              Please enter your credentials to authenticate and load your active workspace.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800 leading-relaxed animate-fade-in">
              <span className="text-rose-600 font-bold shrink-0">⚠️</span>
              <div>
                <p className="font-bold">Access Refused</p>
                <p className="mt-0.5 text-[11px] text-rose-700">{errorMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label htmlFor="username-input" className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                User Name
              </label>
              <input
                id="username-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ADMIN, SAS, CNS, or UWO"
                className="w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition outline-none font-medium text-slate-800 placeholder:text-slate-400"
                disabled={loading}
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="password-input" className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="•••••••••••••••••"
                  className="w-full text-xs p-3.5 pr-10 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition outline-none font-mono text-slate-800"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-extrabold text-xs p-4 rounded-xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer text-center"
            >
              {loading ? "Authenticating..." : "Login"}
            </button>
          </form>

          {/* Quick Year One Info Help */}
          <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
            <button
              onClick={() => setShowHelper(!showHelper)}
              className="text-[11px] font-extrabold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Year One Accounts Help
            </button>
            <span className="text-[10px] text-slate-400">V060 Decision Engine</span>
          </div>

          {showHelper && (
            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-[11px] text-slate-600 leading-relaxed space-y-2 animate-fade-in">
              <p className="font-extrabold text-indigo-950">Year One Registered Users:</p>
              <ul className="space-y-1.5 list-disc pl-4 font-medium">
                <li>
                  <button 
                    onClick={() => handleSetQuickCredentials("ADMIN")}
                    className="font-bold text-indigo-700 hover:underline text-left cursor-pointer"
                  >
                    ADMIN
                  </button>
                  {" — Admin (Pass: ADMIN_PASSWORD)"}
                </li>
                <li>
                  <button 
                    onClick={() => handleSetQuickCredentials("SAS")}
                    className="font-bold text-indigo-700 hover:underline text-left cursor-pointer"
                  >
                    SAS
                  </button>
                  {" — Steve Survivor Portfolio (Pass: SAS_PASSWORD)"}
                </li>
                <li>
                  <button 
                    onClick={() => handleSetQuickCredentials("CNS")}
                    className="font-bold text-indigo-700 hover:underline text-left cursor-pointer"
                  >
                    CNS
                  </button>
                  {" — Cameron (Pass: CNS_PASSWORD)"}
                </li>
                <li>
                  <button 
                    onClick={() => handleSetQuickCredentials("UWO")}
                    className="font-bold text-indigo-700 hover:underline text-left cursor-pointer"
                  >
                    UWO
                  </button>
                  {" — UW Oshkosh Group (Pass: UWO_PASSWORD)"}
                </li>
              </ul>
              <p className="text-[10px] text-slate-400 mt-1">
                For local development, these are read from your .env secrets.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
