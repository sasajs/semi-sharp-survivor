import React, { useState, useEffect } from "react";
import { 
  Flame, 
  TrendingUp, 
  Activity, 
  Award, 
  ShieldAlert, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  FileText, 
  Settings2, 
  Sparkles, 
  Database,
  Columns,
  History,
  ShieldCheck,
  Zap,
  Layers,
  Sliders,
  Scale,
  Target,
  Shield,
  Cpu,
  Compass,
  BrainCircuit,
  Loader2
} from "lucide-react";

import { useAppData } from "./hooks/useAppData";
import { DashboardCards } from "./components/DashboardCards";
import { EntryTable } from "./components/EntryTable";
import { InventoryTable } from "./components/InventoryTable";
import { RecommendationTable } from "./components/RecommendationTable";
import { HolidayInventoryPanel } from "./components/HolidayInventoryPanel";
import { RecommendationAuditPanel } from "./components/RecommendationAuditPanel";
import { RecommendationConfidencePanel } from "./components/RecommendationConfidencePanel";
import { RecommendationConsensusPanel } from "./components/RecommendationConsensusPanel";
import { RecommendationPortfolioPanel } from "./components/RecommendationPortfolioPanel";
import { ContestEVPanel } from "./components/ContestEVPanel";
import { OwnershipCalibrationPanel } from "./components/OwnershipCalibrationPanel";
import { MarketCalibrationPanel } from "./components/MarketCalibrationPanel";
import { ModelPerformancePanel } from "./components/ModelPerformancePanel";
import { RollingValidationPanel } from "./components/RollingValidationPanel";
import { ModelDriftPanel } from "./components/ModelDriftPanel";
import { AdaptiveModelWeightPanel } from "./components/AdaptiveModelWeightPanel";
import { DecisionPolicyPanel } from "./components/DecisionPolicyPanel";
import { SurvivorDecisionPanel } from "./components/SurvivorDecisionPanel";
import { SurvivorPlanningPanel } from "./components/SurvivorPlanningPanel";
import { ChampionshipPlanningPanel } from "./components/ChampionshipPlanningPanel";
import { DecisionAnalyticsPanel } from "./components/DecisionAnalyticsPanel";
import { WeeklyLearningLoopPanel } from "./components/WeeklyLearningLoopPanel";
import { AdminDashboard } from "./pages/AdminDashboard";

import { LoginScreen } from "./components/LoginScreen";
import { OwnerWorkspaceDashboard } from "./components/OwnerWorkspaceDashboard";
import { apiService } from "./services/apiService";
import { StrategyType } from "./types";

export default function App() {
  const {
    activeTab,
    setActiveTab,
    contests,
    legs,
    teams,
    entries,
    picks,
    games,
    lines,
    selectedEntryId,
    setSelectedEntryId,
    selectedLegId,
    setSelectedLegId,
    recReport,
    loadingRecs,
    newEntryName,
    setNewEntryName,
    newEntryNotes,
    setNewEntryNotes,
    newEntryContestTypeId,
    setNewEntryContestTypeId,
    contestTypes,
    successMsg,
    setSuccessMsg,
    errorMsg,
    setErrorMsg,
    loading,
    handleLockPick,
    handleCreateEntry,
    handleDeleteEntry,
    handleResetAppDb,
    loadAllData,
    activeEntryObj,
    activeLegObj,
    totalEntriesCount,
    aliveEntriesCount,
    eliminatedEntriesCount,
    currentPickForLeg
  } = useAppData();

  // Monkeypatch window.fetch for session authentication
  useEffect(() => {
    if (typeof window !== "undefined" && !(window as any).__fetchPatched) {
      try {
        const originalFetch = window.fetch;
        Object.defineProperty(window, "fetch", {
          configurable: true,
          enumerable: true,
          writable: true,
          value: function (input: any, init: any) {
            const t = localStorage.getItem("admin_token");
            if (t) {
              init = init || {};
              const headers = new Headers(init.headers);
              if (!headers.has("Authorization")) {
                headers.set("Authorization", `Bearer ${t}`);
              }
              if (!headers.has("X-Admin-Token")) {
                headers.set("X-Admin-Token", t);
              }
              init.headers = headers;
            }
            return originalFetch.call(window, input, init);
          }
        });
        (window as any).__fetchPatched = true;
      } catch (e) {
        console.warn("Could not monkeypatch window.fetch globally, using local service fallbacks:", e);
        try {
          // Fallback simple assignment in case writable is true but defineProperty is restricted
          const originalFetch = window.fetch;
          (window as any).fetch = function (input: any, init: any) {
            const t = localStorage.getItem("admin_token");
            if (t) {
              init = init || {};
              const headers = new Headers(init.headers);
              if (!headers.has("Authorization")) {
                headers.set("Authorization", `Bearer ${t}`);
              }
              if (!headers.has("X-Admin-Token")) {
                headers.set("X-Admin-Token", t);
              }
              init.headers = headers;
            }
            return originalFetch.call(window, input, init);
          };
          (window as any).__fetchPatched = true;
        } catch (innerError) {
          console.warn("Global fetch assignment fallback failed:", innerError);
        }
      }
    }
  }, []);

  // Auth State
  const [token, setToken] = useState<string | null>(localStorage.getItem("admin_token"));
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>("");

  const [workspace, setWorkspace] = useState<any[]>([]);
  const [loadingWorkspace, setLoadingWorkspace] = useState<boolean>(false);
  const [workspaceError, setWorkspaceError] = useState<string>("");

  // Load session
  const checkSession = async () => {
    try {
      const curToken = localStorage.getItem("admin_token");
      if (!curToken) {
        setCurrentUser(null);
        setAuthLoading(false);
        return;
      }

      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
          setToken(curToken);
        } else {
          localStorage.removeItem("admin_token");
          setToken(null);
          setCurrentUser(null);
        }
      } else {
        localStorage.removeItem("admin_token");
        setToken(null);
        setCurrentUser(null);
      }
    } catch (err) {
      console.error("Session check error:", err);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, [token]);

  // Load workspace for user
  const loadWorkspace = async () => {
    if (!token || !currentUser) return;
    try {
      setLoadingWorkspace(true);
      setWorkspaceError("");
      const res = await apiService.getCurrentOwnerWorkspace();
      if (res.success) {
        setWorkspace(res.workspace || []);
      }
    } catch (err: any) {
      console.error("Workspace load error:", err);
      const isAuthErr = err.message?.includes("Unauthorized") || err.message?.includes("expired") || err.message?.includes("401") || err.message?.includes("403");
      if (isAuthErr) {
        setWorkspaceError("Unauthorized: Invalid or expired token. Please log out and log in again.");
        setErrorMsg("Unauthorized: Your session has expired. Please log in again.");
      } else {
        setWorkspaceError(err.message || "Failed to load owner workspace");
        setErrorMsg("Failed to load owner workspace: " + (err.message || "Unknown error"));
      }
    } finally {
      setLoadingWorkspace(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadWorkspace();
    }
  }, [currentUser]);

  const handleLogin = async (usernameInput: string, passwordInput: string) => {
    setLoginLoading(true);
    setAuthError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });
      const data = await res.json();
      if (res.ok && data.success && data.session?.token) {
        localStorage.setItem("admin_token", data.session.token);
        setToken(data.session.token);
        setCurrentUser(data.user);
        // Force reload useAppData to make sure it pulls fresh/auth-guarded data
        await loadAllData(true);
      } else {
        setAuthError(data.error || "Authentication failed.");
      }
    } catch (err: any) {
      setAuthError(err.message || "Network error. Failed to authenticate.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout request failure", err);
    } finally {
      localStorage.removeItem("admin_token");
      setToken(null);
      setCurrentUser(null);
      setWorkspace([]);
    }
  };

  const handleChangeStrategy = async (entryId: string, strategyType: StrategyType) => {
    try {
      const res = await fetch("/api/strategies/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entry_id: entryId,
          strategy_type: strategyType
        })
      });
      if (!res.ok) {
        throw new Error("Failed to update strategy profile");
      }
      // Refresh both workspace and standard data
      await loadWorkspace();
      await loadAllData(false);
    } catch (err) {
      console.error("Strategy update error:", err);
    }
  };

  // Redirect non-admin users if activeTab is not allowed
  useEffect(() => {
    if (currentUser && currentUser.role !== "admin") {
      const allowed = ["dashboard", "entries", "roadmaps", "recommendations", "reports"];
      if (!allowed.includes(activeTab)) {
        setActiveTab("dashboard");
      }
    }
  }, [currentUser, activeTab, setActiveTab]);

  // Filter entries & picks for non-admin owners
  const filteredEntries = currentUser && currentUser.role !== "admin"
    ? entries.filter(e => e.owner_id === currentUser.owner_id)
    : entries;

  const filteredPicks = currentUser && currentUser.role !== "admin"
    ? picks.filter(p => {
        const entry = entries.find(e => e.id === p.entry_id);
        return entry && entry.owner_id === currentUser.owner_id;
      })
    : picks;

  const ownerName = workspace[0]?.owner?.name || currentUser?.owner_id?.replace("owner-", "").toUpperCase() || "Portfolio";

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4 font-sans">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-500 animate-pulse">Initializing Security Posture & Database Connection...</p>
      </div>
    );
  }

  if (!currentUser || !token) {
    return (
      <LoginScreen 
        onLogin={handleLogin} 
        loading={loginLoading} 
        errorMsg={authError} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased text-slate-900 flex flex-col justify-between">
      
      {/* ==========================================
          HEADER SECTION
          ========================================== */}
      <span className="hidden">Semi-Sharp V2 Enterprise</span>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo / Title Block */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-650 rounded-xl flex items-center justify-center font-extrabold text-white text-lg tracking-tighter shadow-sm shrink-0">
                S2
              </div>
              <div>
                <h1 className="text-sm font-extrabold text-slate-950 uppercase tracking-wide flex items-center gap-1.5 leading-none">
                  Semi-Sharp Survivor
                </h1>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">
                  Circa Survivor Contest Portfolio Optimizer
                </p>
              </div>
            </div>

            {/* Quick Stats Summary Pills & User Profile */}
            <div className="flex items-center gap-4">
              {currentUser?.role === "admin" && (
                <div className="hidden xl:flex items-center gap-4">
                  <div className="bg-slate-100 border px-3 py-1 bg-white/70 rounded-full text-xs flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                    <span className="text-slate-500 font-bold">ACTIVE CONTEST:</span>
                    <strong className="text-slate-800">CIRCA SURVIVOR 2026</strong>
                  </div>

                  <div className="bg-slate-100 border px-3 py-1 bg-white/70 rounded-full text-xs flex items-center gap-2">
                    <span className="text-slate-500 font-bold">TOTAL PORTFOLIO LINES:</span>
                    <strong className="text-slate-850 font-black">{totalEntriesCount}</strong>
                  </div>

                  <button 
                    onClick={handleResetAppDb}
                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-4 py-1.5 text-[11px] font-black tracking-wide flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Database className="w-3.5 h-3.5 text-indigo-300" />
                    RESEED TEST SCENARIOS
                  </button>
                </div>
              )}

              {currentUser && (
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 px-3">
                  <div className="hidden md:flex flex-col text-right leading-tight text-[11px]">
                    <div className="font-extrabold text-slate-800">
                      Logged in as: <span className="text-indigo-600 font-black">{currentUser.display_name}</span>
                    </div>
                    {currentUser.role !== "admin" ? (
                      <>
                        <div className="text-[10px] text-slate-500 font-bold">
                          Owner: {ownerName}
                        </div>
                        <div className="text-[10px] text-indigo-600 font-black">
                          Entries Visible: {filteredEntries.length}
                        </div>
                      </>
                    ) : (
                      <div className="text-[10px] text-indigo-600 font-black">
                        Entries Visible: {filteredEntries.length} (ALL)
                      </div>
                    )}
                    <div className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">
                      Role: {currentUser.role}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                    <button
                      onClick={handleLogout}
                      className="text-[10px] font-black uppercase text-slate-600 hover:text-rose-600 bg-white border border-slate-200 px-2 py-1.5 rounded-xl transition cursor-pointer hover:bg-rose-50"
                    >
                      Logout
                    </button>
                    <button
                      onClick={handleLogout}
                      className="text-[10px] font-black uppercase bg-indigo-600 text-white hover:bg-indigo-700 px-2.5 py-1.5 rounded-xl transition cursor-pointer shadow-sm"
                    >
                      Switch User
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* ==========================================
          MAIN AREA & NAVIGATION
          ========================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-4">
            
            <div className="p-1">
              <h3 className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">
                Portfolio Dashboard Selector
              </h3>
              <p className="text-xs text-slate-500 leading-tight">
                Evaluate win probabilities, field popularity arrays, future value ratings, and custom holiday leg shields.
              </p>
            </div>

            {/* Sidebar selection menu */}
            <nav className="space-y-1">
              {(currentUser?.role === "admin"
                ? [
                    { id: "dashboard", label: "Dashboard Overview", icon: Activity },
                    { id: "contest-setup", label: "Circa Survivor Rules & Leg Map", icon: Award },
                    { id: "entries", label: "Portfolio Entries", icon: Columns },
                    { id: "picks", label: "Weekly Pick Matrix", icon: TrendingUp },
                    { id: "inventory", label: "Full 32 Team Inventory", icon: Settings2 },
                    { id: "thanksgiving", label: "Thanksgiving Shield", icon: Flame, badge: "Leg 13" },
                    { id: "christmas", label: "Christmas Day Preservation", icon: Sparkles, badge: "Leg 18" },
                    { id: "reports", label: "Contest Equity Report", icon: FileText },
                    { id: "recommendation-audits", label: "Recommendation Audit", icon: History, badge: "New" },
                    { id: "recommendation-confidence", label: "Confidence & Stability", icon: ShieldCheck, badge: "Layer 2" },
                    { id: "recommendation-consensus", label: "Consensus Analysis", icon: Zap, badge: "Layer 2" },
                    { id: "recommendation-portfolio", label: "Portfolio Optimizer", icon: Layers, badge: "v0.39" },
                    { id: "contest-ev", label: "Contest EV Optimizer", icon: Award, badge: "v0.40" },
                    { id: "ownership-calibration", label: "Ownership Calibration", icon: Sliders, badge: "v0.41" },
                    { id: "market-calibration", label: "Market Calibration", icon: Scale, badge: "v0.42" },
                    { id: "model-performance", label: "Model Performance", icon: Target, badge: "v0.43" },
                    { id: "rolling-validation", label: "Rolling Validation", icon: History, badge: "v0.44" },
                    { id: "model-drift", label: "Model Drift Analysis", icon: Shield, badge: "v0.45" },
                    { id: "model-weights", label: "Adaptive Weights", icon: Scale, badge: "v0.46" },
                    { id: "decision-policies", label: "Decision Policies", icon: Shield, badge: "v0.48" },
                    { id: "survivor-decisions", label: "Survivor Decisions", icon: Cpu, badge: "v0.49" },
                    { id: "survivor-plans", label: "Survivor Plans", icon: Compass, badge: "v0.50" },
                    { id: "championship-plans", label: "Championship Plans", icon: Award, badge: "v0.51" },
                    { id: "decision-analytics", label: "Decision Analytics", icon: Activity, badge: "v0.52" },
                    { id: "weekly-learning", label: "Weekly Learning Loop", icon: BrainCircuit, badge: "v0.54" },
                    { id: "admin", label: "Admin Dashboard", icon: ShieldAlert, badge: "Secure" },
                  ]
                : [
                    { id: "dashboard", label: "My Dashboard", icon: Activity },
                    { id: "entries", label: "My Entries", icon: Columns },
                    { id: "roadmaps", label: "My Roadmaps", icon: Compass },
                    { id: "recommendations", label: "My Recommendations", icon: TrendingUp },
                    { id: "reports", label: "Reports", icon: FileText },
                  ]
              ).map(tab => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`tab-btn-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      isSelected 
                        ? "bg-slate-900 text-white shadow-md shadow-indigo-650/5" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isSelected ? "text-indigo-400" : "text-slate-400"}`} />
                      <span>{tab.label}</span>
                    </div>
                    {tab.badge && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        isSelected ? "bg-indigo-600/35 text-indigo-100" : "bg-slate-100 text-slate-500"
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

          </div>

          {/* Quick Info Box */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-950 text-white rounded-2xl p-5 shadow-md space-y-3 relative overflow-hidden">
            <span className="text-[10px] text-indigo-300 font-extrabold uppercase tracking-wider block">
              Contest Rule Highlight:
            </span>
            <p className="text-xs text-indigo-105 leading-relaxed font-semibold">
              "A tie constitutes a loss." Under Circa Survivor rules, matches ending in ties automatically eliminate entries, even if they selected the undefeated candidate. 
            </p>
            <div className="text-[10px] text-indigo-250 italic bg-white/7.5 p-2 rounded">
              💡 Our dynamic model applies a penalty metric directly to tie probabilities.
            </div>
          </div>
        </aside>

        {/* Content Panel Area */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* ==========================================
              NOTIFICATIONS & ALERTS
              ========================================== */}
          {successMsg && (
            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-xl flex items-start gap-3 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-emerald-800 font-semibold">{successMsg}</p>
              </div>
              <button 
                onClick={() => setSuccessMsg("")}
                className="text-emerald-400 hover:text-emerald-600 text-xs font-bold font-mono"
              >
                ✕
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl flex items-start gap-3 shadow-sm">
              <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-rose-850 font-bold">{errorMsg}</p>
              </div>
              <button 
                onClick={() => setErrorMsg("")}
                className="text-rose-400 hover:text-rose-600 text-xs font-bold font-mono"
              >
                ✕
              </button>
            </div>
          )}

          {loading ? (
            <div className="bg-white border rounded-2xl p-16 flex flex-col items-center justify-center space-y-3 shadow-sm">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900"></div>
              <p className="text-xs text-slate-500 font-medium">Synchronizing application database state...</p>
            </div>
          ) : (
            <>
              
              {/* ========================================================
                  VIEW 1: DASHBOARD
                  ======================================================== */}
              {activeTab === "dashboard" && (
                currentUser?.role === "admin" ? (
                  <div className="space-y-6">
                    
                    {/* Hero Title Box */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <h2 className="text-2xl font-black text-slate-950 tracking-tight">
                        Contest Portfolio Overview &amp; Optimization Dashboard
                      </h2>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        This MVP leverages advanced analytical calculations to assist you in managing multiple entry tracks, conserving powerhouse teams for Thanksgiving or Christmas, and generating optimal Survivor picks.
                      </p>
                    </div>

                    {/* Reusable Dashboard Cards Component */}
                    <DashboardCards 
                      activeEntryObj={activeEntryObj}
                      activeLegObj={activeLegObj}
                      games={games}
                    />

                    {/* Quick Active Entries Status Grid */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
                      <div className="border-b pb-3">
                        <h3 className="font-extrabold text-slate-900 text-sm uppercase">My Active Entries &amp; Current Week Status</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">Quick lookup of all portfolio lines currently contesting the prize bank.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {entries.map(ent => {
                          const nextPick = picks.find(p => p.entry_id === ent.id && p.contest_leg_id === selectedLegId);
                          const pickedTeamObj = nextPick ? teams.find(t => t.id === nextPick.team_id) : null;
                          
                          return (
                            <div 
                              key={ent.id}
                              className={`border rounded-xl p-4 flex justify-between items-center ${
                                ent.status === "alive" ? "bg-emerald-50/10 border-emerald-100" : "bg-rose-50/10 border-rose-100 opacity-60"
                              }`}
                            >
                              <div>
                                <h4 className="font-bold text-xs text-slate-900">{ent.name}</h4>
                                <p className="text-[10px] text-slate-400 mt-0.5">Focus Track • Code: {ent.id}</p>
                                
                                <div className="mt-2.5 flex items-center gap-2">
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                                    ent.status === "alive" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                                  }`}>
                                    {ent.status.toUpperCase()}
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                    Choice Selection for {activeLegObj?.name}:
                                  </span>
                                </div>
                              </div>

                              <div className="text-right">
                                {pickedTeamObj ? (
                                  <div className="flex flex-col items-end gap-1">
                                    <span className="text-[10px] font-semibold text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded animate-pulse">
                                      🏈 {pickedTeamObj.name}
                                    </span>
                                    <span className="text-[8px] text-slate-400 font-mono text-xs">LOCKED CONTENDER</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setSelectedEntryId(ent.id);
                                      setActiveTab("picks");
                                    }}
                                    className="text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-2.5 py-1.5 rounded"
                                  >
                                    PLACE SURVIVOR PICK
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                ) : (
                  <OwnerWorkspaceDashboard
                    workspace={workspace}
                    teams={teams}
                    onViewRoadmap={(entryId) => {
                      setSelectedEntryId(entryId);
                      setActiveTab("roadmaps");
                    }}
                    onViewRecommendation={(entryId) => {
                      setSelectedEntryId(entryId);
                      setActiveTab("recommendations");
                    }}
                    onChangeStrategy={handleChangeStrategy}
                    loadingWorkspace={loadingWorkspace}
                    onRefresh={loadWorkspace}
                    userDisplayName={currentUser?.display_name || "Owner"}
                    ownerName={ownerName}
                    workspaceError={workspaceError}
                  />
                )
              )}

              {/* ========================================================
                  VIEW 2: CONTEST SETUP
                  ======================================================== */}
              {activeTab === "contest-setup" && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
                  
                  <div className="border-b pb-4">
                    <h2 className="text-xl font-extrabold text-slate-950">Circa Survivor Rules &amp; Contest Leg Map (20 Legs)</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Detailed view of regular NFL weeks mapped with specific custom Holiday legs.
                    </p>
                  </div>

                  <div className="bg-indigo-50/30 border border-indigo-100 p-5 rounded-2xl space-y-3">
                    <h3 className="font-bold text-indigo-950 text-sm">Official Contest Rules &amp; Tie Mechanics</h3>
                    <p className="text-xs text-indigo-900 leading-relaxed">
                      The Circa Survivor is the premier professional contest. Major constraints are fully modeled in this MVP context:
                    </p>
                    <ul className="list-disc pl-5 text-xs text-indigo-900 space-y-1.5 leading-relaxed font-semibold">
                      <li><strong>No Split Points on Ties:</strong> If an NFL matchup ends in a tie, the select is scored a loss. Your entry is instantly eliminated.</li>
                      <li><strong>Solo Selection:</strong> Each NFL squad can be selected exactly ONE time during the duration of an entry's lifespan.</li>
                      <li><strong>Double Holiday Slates:</strong> Thanksgiving (Leg 13) and Christmas (Leg 18) are scored as distinct, isolated standalone weeks. Strategic team preservation is mandatory for success.</li>
                    </ul>
                  </div>

                  {/* Complete 20-Leg Visual Grid */}
                  <div>
                    <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-widest block mb-3">CONTEST LEG MAP GRID</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {legs.map(l => {
                        const isHoliday = l.leg_type !== "regular";
                        return (
                          <div 
                            key={l.id}
                            className={`p-3.5 border rounded-xl flex items-center justify-between ${
                              isHoliday 
                                ? "bg-amber-50/40 border-amber-200" 
                                : "bg-white border-slate-200"
                            }`}
                          >
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">CONTEST LEG {l.display_order}</span>
                              <span className="font-black text-xs text-slate-900 block leading-tight">{l.name}</span>
                              <span className="text-[9px] text-slate-500 block">Scoring Week Reference: NFL Week {l.nfl_week}</span>
                            </div>

                            {isHoliday ? (
                              <span className="text-[9px] bg-amber-100 text-amber-800 font-black uppercase px-2 py-0.5 rounded tracking-wide shrink-0">
                                HOLIDAY SLATE
                              </span>
                            ) : (
                              <span className="text-[9px] bg-indigo-50 text-indigo-600 font-serif font-semibold px-2 py-0.5 rounded shrink-0">
                                Standard
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

              {/* ========================================================
                  VIEW 3: ENTRY MANAGEMENT
                  ======================================================== */}
              {activeTab === "entries" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Register Form Box */}
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4 h-fit">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm uppercase">Register Contest Entry</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Register a new Survivor tracking line to your active portfolio.</p>
                    </div>

                    <form onSubmit={handleCreateEntry} className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Line / Entry Identifier
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Semi-Sharp #5"
                          value={newEntryName}
                          onChange={(e) => setNewEntryName(e.target.value)}
                          className="w-full text-xs font-bold border rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Contest Type
                        </label>
                        <div className="space-y-2">
                          <label className={`block border p-3 rounded-lg cursor-pointer transition-all ${
                            newEntryContestTypeId === 'circa' 
                              ? 'border-indigo-500 bg-indigo-50/20 ring-1 ring-indigo-500' 
                              : 'border-slate-200 hover:border-slate-300'
                          }`} id="contest-type-circa-card">
                            <input 
                              type="radio" 
                              name="contest_type_id" 
                              value="circa" 
                              checked={newEntryContestTypeId === 'circa'} 
                              onChange={() => setNewEntryContestTypeId('circa')} 
                              className="sr-only"
                              id="contest-type-circa-input"
                            />
                            <div className="flex items-start">
                              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center mt-0.5 mr-2 ${
                                newEntryContestTypeId === 'circa' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                              }`}>
                                {newEntryContestTypeId === 'circa' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                              <div>
                                <span className="block text-xs font-bold text-slate-900">Circa Survivor</span>
                                <span className="block text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                                  20 contest legs including Thanksgiving and Christmas. Holiday preservation strategy required.
                                </span>
                              </div>
                            </div>
                          </label>

                          <label className={`block border p-3 rounded-lg cursor-pointer transition-all ${
                            newEntryContestTypeId === 'standard' 
                              ? 'border-indigo-500 bg-indigo-50/20 ring-1 ring-indigo-500' 
                              : 'border-slate-200 hover:border-slate-300'
                          }`} id="contest-type-standard-card">
                            <input 
                              type="radio" 
                              name="contest_type_id" 
                              value="standard" 
                              checked={newEntryContestTypeId === 'standard'} 
                              onChange={() => setNewEntryContestTypeId('standard')} 
                              className="sr-only"
                              id="contest-type-standard-input"
                            />
                            <div className="flex items-start">
                              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center mt-0.5 mr-2 ${
                                newEntryContestTypeId === 'standard' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                              }`}>
                                {newEntryContestTypeId === 'standard' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                              <div>
                                <span className="block text-xs font-bold text-slate-900">Standard Survivor</span>
                                <span className="block text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                                  Traditional 18-week Survivor contest with no separate holiday legs.
                                </span>
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Custom Strategy Log / Notes
                        </label>
                        <textarea
                          placeholder="Reserve Detroit Lions for Leg 13, target underdogs in Week 4..."
                          rows={3}
                          value={newEntryNotes}
                          onChange={(e) => setNewEntryNotes(e.target.value)}
                          className="w-full text-xs border rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 bg-white"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-slate-900 hover:bg-slate-850 text-white font-extrabold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        REGISTER SURVIVOR ENTRY
                      </button>
                    </form>
                  </div>

                  {/* Registered Entry list Cards */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                      <div className="border-b pb-3 mb-4 flex justify-between items-center">
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-sm uppercase">Currently Tracked Entries ({filteredEntries.length})</h3>
                          <p className="text-[11px] text-slate-400 mt-0.5">Select visual tabs below to inspect team availability grids or execute simulation tracks.</p>
                        </div>
                      </div>

                      <EntryTable 
                        entries={filteredEntries}
                        picks={filteredPicks}
                        teams={teams}
                        legs={legs}
                        selectedEntryId={selectedEntryId}
                        setSelectedEntryId={setSelectedEntryId}
                        setActiveTab={setActiveTab}
                        handleDeleteEntry={handleDeleteEntry}
                      />
                    </div>
                  </div>

                </div>
              )}

              {/* ========================================================
                  VIEW 4: WEEKLY PICK DASHBOARD
                  ======================================================== */}
              {activeTab === "picks" && (
                <div className="space-y-6">
                  
                  {/* Selectors Header Box */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                          1️⃣ Choose Entry
                        </label>
                        <select
                          value={selectedEntryId}
                          onChange={(e) => setSelectedEntryId(e.target.value)}
                          className="text-xs font-bold bg-slate-100 border rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                        >
                          {filteredEntries.map(e => (
                            <option key={e.id} value={e.id}>{e.name} ({e.status.toUpperCase()})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                          2️⃣ Select Week / Leg
                        </label>
                        <select
                          value={selectedLegId}
                          onChange={(e) => setSelectedLegId(e.target.value)}
                          className="text-xs font-bold bg-slate-100 border rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                        >
                          {legs.map(l => (
                            <option key={l.id} value={l.id}>{l.name} ({l.leg_type.toUpperCase()})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-500 block font-medium">
                        Locked selection for this Leg:
                      </span>
                      {currentPickForLeg ? (
                        <span className="text-sm font-black text-indigo-650 block animate-pulse">
                          🏈 {teams.find(t => t.id === currentPickForLeg.team_id)?.name.toUpperCase()} (LOCKED)
                        </span>
                      ) : (
                        <span className="text-xs italic text-rose-500 block font-semibold">
                          No team selected yet - Choose below!
                        </span>
                      )}
                    </div>
                  </div>

                  {activeEntryObj?.status === "eliminated" && (
                    <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-md">
                      <div className="flex gap-2">
                        <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
                        <div>
                          <h4 className="text-sm font-bold text-rose-900">Entry is Eliminated</h4>
                          <p className="text-xs text-rose-700 mt-1">
                            This entry has previously failed a selection (or experienced a tie). Under official Circa Survivor rules, eliminated lines are banned from placing new selections.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pick Matrix */}
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-sm uppercase">
                          Weekly Survivor Matchups &amp; Metrics Optimizer
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Filter active matches. Compares Win Probability, Pick Popularity, and Future Value dynamically.
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-slate-400 uppercase tracking-wider font-bold border-b bg-slate-50">
                            <th className="p-4">Matchup Schedule</th>
                            <th className="p-4">Favored Team</th>
                            <th className="p-4">Win Prob</th>
                            <th className="p-4">Pick Pop (Field)</th>
                            <th className="p-4">Future Value</th>
                            <th className="p-4 text-center">Contest Equity Score</th>
                            <th className="p-4 text-center">Eligibility Guard</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {games.map(game => {
                            const homeTeamObj = teams.find(t => t.id === game.home_team_id);
                            const awayTeamObj = teams.find(t => t.id === game.away_team_id);
                            if (!homeTeamObj || !awayTeamObj) return null;

                            // Retrieve analytical parameters
                            const homeLine = lines.find(l => l.team_id === game.home_team_id);
                            const awayLine = lines.find(l => l.team_id === game.away_team_id);

                            return [
                              { currentTeam: homeTeamObj, opposingTeam: awayTeamObj, currentLine: homeLine, isHome: true },
                              { currentTeam: awayTeamObj, opposingTeam: homeTeamObj, currentLine: awayLine, isHome: false }
                            ].map(({ currentTeam, opposingTeam, currentLine, isHome }) => {
                              // Verify if team has already been used by this entry previously
                              const isUsedTeam = picks.some(p => p.entry_id === selectedEntryId && p.team_id === currentTeam.id && p.contest_leg_id !== selectedLegId);
                              const isCurrentlyPickedLeg = currentPickForLeg && currentPickForLeg.team_id === currentTeam.id;

                              return (
                                <tr 
                                  key={game.id + "-" + currentTeam.id}
                                  className={`hover:bg-slate-50 transition-colors ${
                                    isCurrentlyPickedLeg ? "bg-indigo-50/50 border-l-4 border-indigo-500" : ""
                                  }`}
                                >
                                  {/* Matchup Schedule */}
                                  <td className="p-4">
                                    <div className="font-semibold text-slate-900">
                                      {isHome ? (
                                        <span>{currentTeam.name} <span className="text-slate-400 font-normal">v {opposingTeam.name}</span></span>
                                      ) : (
                                        <span>{currentTeam.name} <span className="text-slate-400 font-normal">@ {opposingTeam.name}</span></span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-slate-400">
                                      {game.game_time} • {game.status.toUpperCase()}
                                    </span>
                                  </td>

                                  {/* Team Branding Tag */}
                                  <td className="p-4">
                                    <div className="flex items-center gap-2">
                                      <span 
                                        className="w-2.5 h-2.5 rounded-full" 
                                        style={{ backgroundColor: currentTeam.primary_color }}
                                      ></span>
                                      <span className="font-extrabold text-slate-800">{currentTeam.name}</span>
                                    </div>
                                  </td>

                                  {/* Win Prob */}
                                  <td className="p-4 font-bold text-slate-700">
                                    {currentLine ? `${Math.round(currentLine.win_probability * 100)}%` : "50%"}
                                  </td>

                                  {/* Pick Popularity */}
                                  <td className="p-4 text-slate-600">
                                    {currentLine ? `${(currentLine.pick_popularity * 100).toFixed(1)}%` : "3.0%"}
                                  </td>

                                  {/* Future Value */}
                                  <td className="p-4 font-semibold">
                                    {currentLine ? (
                                      <span className={`${
                                        currentLine.future_value > 0.75 
                                          ? "text-rose-600 font-black tracking-tight" 
                                          : currentLine.future_value > 0.4 
                                          ? "text-slate-600" 
                                          : "text-slate-400"
                                      }`}>
                                        {currentLine.future_value > 0.75 ? "🔴 High Locked" : currentLine.future_value > 0.4 ? "🟡 Medium" : "🟢 Low"}
                                      </span>
                                    ) : "Medium"}
                                  </td>

                                  {/* Equity Score */}
                                  <td className="p-4 text-center">
                                    {currentLine ? (
                                      <span className="text-xs font-black text-indigo-650 bg-indigo-50 px-2.5 py-1 rounded">
                                        {currentLine.contest_equity_score.toFixed(3)}
                                      </span>
                                    ) : "1.00"}
                                  </td>

                                  {/* Eligibility Constraint action */}
                                  <td className="p-4 text-center animate-fade-in">
                                    {isUsedTeam ? (
                                      <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-1 rounded font-bold uppercase tracking-wider">
                                        Already Picked
                                      </span>
                                    ) : activeEntryObj?.status === "eliminated" ? (
                                      <span className="text-[10px] bg-slate-50 text-slate-400 px-2 py-1 rounded italic">
                                        Eliminated
                                      </span>
                                    ) : (
                                      <button 
                                        id={`lock-btn-${currentTeam.id}`}
                                        onClick={() => handleLockPick(currentTeam.id)}
                                        className={`px-3 py-1.5 rounded text-[11px] font-black tracking-wide transition-all cursor-pointer ${
                                          isCurrentlyPickedLeg 
                                            ? "bg-emerald-600 text-white hover:bg-emerald-500" 
                                            : "bg-slate-900 text-white hover:bg-slate-800"
                                        }`}
                                      >
                                        {isCurrentlyPickedLeg ? "✓ LOCKED IN" : "LOCK TEAM"}
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            });
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* ========================================================
                  VIEW 5: TEAM INVENTORY DASHBOARD
                  ======================================================== */}
              {activeTab === "inventory" && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
                  
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-950">Contest Team Inventory Status Grid</h2>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                        <span>Tracking which of the 32 NFL teams have been utilized. Filtered specifically for: </span>
                        <strong>{activeEntryObj?.name || "Choose selection entry"}</strong>
                        {activeEntryObj && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            activeEntryObj.contest_type_id === "standard" 
                              ? "bg-amber-50 text-amber-700 border-amber-200" 
                              : "bg-indigo-50 text-indigo-700 border-indigo-200"
                          }`}>
                            {activeEntryObj.contest_type_id === "standard" ? "Standard" : "Circa"}
                          </span>
                        )}
                      </p>
                    </div>
                    {activeEntryObj && (
                      <span className={`text-xs px-3 py-1.5 rounded-lg font-bold font-mono ${
                        activeEntryObj.status === "alive" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}>
                        ENTRY STATUS: {activeEntryObj.status.toUpperCase()}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Under strict Circa Survivor rules, <strong>reusing a team is permanently prohibited</strong>. This layout tracks available options. Teams marked as <span className="inline-block bg-slate-100 border border-slate-200 px-1.5 py-0.2 mx-1 text-slate-450 uppercase text-[10px] rounded font-extrabold">USED</span> cannot be chosen in current scheduled games.
                  </p>

                  <InventoryTable 
                    teams={teams}
                    picks={picks}
                    legs={legs}
                    selectedEntryId={selectedEntryId}
                  />

                </div>
              )}

              {/* ========================================================
                  VIEW 6: THANKSGIVING INVENTORY DASHBOARD
                  ======================================================== */}
              {activeTab === "thanksgiving" && (
                <HolidayInventoryPanel 
                  type="thanksgiving"
                  teams={teams}
                  picks={picks}
                  selectedEntryId={selectedEntryId}
                  activeEntryObj={activeEntryObj}
                />
              )}

              {/* ========================================================
                  VIEW 7: CHRISTMAS INVENTORY DASHBOARD
                  ======================================================== */}
              {activeTab === "christmas" && (
                <HolidayInventoryPanel 
                  type="christmas"
                  teams={teams}
                  picks={picks}
                  selectedEntryId={selectedEntryId}
                  activeEntryObj={activeEntryObj}
                />
              )}

              {/* ========================================================
                  VIEW 8: RECOMMENDATION REPORT PAGE
                  ======================================================== */}
              {activeTab === "reports" && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
                  
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-950">Contest Equity Recommendation Report</h2>
                      <p className="text-xs text-slate-500 mt-1">
                        High-fidelity analytical calculation evaluating optimal survival paths specifically for choice entry &amp; leg.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <select
                        value={selectedEntryId}
                        onChange={(e) => setSelectedEntryId(e.target.value)}
                        className="text-xs font-bold bg-slate-100 border rounded px-3 py-1.5 focus:outline-none"
                      >
                        {filteredEntries.map(e => (
                          <option key={e.id} value={e.id}>{e.name}</option>
                        ))}
                      </select>

                      <select
                        value={selectedLegId}
                        onChange={(e) => setSelectedLegId(e.target.value)}
                        className="text-xs font-bold bg-slate-100 border rounded px-3 py-1.5 focus:outline-none"
                      >
                        {legs.map(l => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Mathematical Formula Banner */}
                  <div className="bg-indigo-950 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] text-indigo-300 font-extrabold uppercase tracking-widest block mb-1">
                          Optimization Architecture
                        </span>
                        <h3 className="text-base font-black">Mathematical Contest Equity Score Formula</h3>
                        <p className="text-xs text-indigo-200 mt-1 max-w-xl font-medium">
                          Calculated as: <strong>Win Probability × Leverage Multiplier × Future Value Multiplier × Holiday Safety Multiplier</strong>.
                        </p>
                      </div>
                      <div className="bg-white/10 px-4 py-2.5 rounded-xl border border-white/15">
                        <code className="text-xs font-mono text-indigo-200">
                          WP * LM * FVM * HSM = CES
                        </code>
                      </div>
                    </div>
                  </div>

                  {loadingRecs ? (
                    <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-2"></div>
                      <p className="text-xs font-medium">Processing Contest Equity Ratios...</p>
                    </div>
                  ) : recReport ? (
                    <div className="space-y-6">
                      
                      <div className="border-l-4 border-indigo-600 bg-indigo-50/20 p-4 rounded-r-lg">
                        <h4 className="text-sm font-bold text-slate-900">Weekly Strategic Summary:</h4>
                        <p className="text-xs text-slate-650 mt-1 font-medium">
                          You are evaluating <strong>{recReport.leg?.name}</strong> for <strong>{recReport.entry?.name}</strong>. Previously chosen teams on this entry:{" "}
                          <span className="font-extrabold text-slate-800">
                            {recReport.used_teams?.length > 0 
                              ? recReport.used_teams.map((code: string) => code.toUpperCase()).join(", ") 
                              : "No prior picks."}
                          </span>
                        </p>
                      </div>

                      {/* Top Recommended List with bars */}
                      <RecommendationTable 
                        recommendations={recReport.recommendations || []}
                        handleLockPick={handleLockPick}
                        setActiveTab={setActiveTab}
                      />

                      {/* Portfolio Allocation Integration */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 mt-6" id="report-portfolio-integration">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-black text-slate-950 flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-emerald-600" />
                            Multi-Entry Portfolio Hedging &amp; Allocation
                          </h4>
                          <button 
                            onClick={() => setActiveTab("recommendation-portfolio")}
                            className="text-xs text-emerald-700 hover:text-emerald-800 font-extrabold transition duration-150 cursor-pointer"
                          >
                            Open Portfolio Optimizer →
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                          Version 0.39 introduces multi-entry portfolio optimization. Instead of choosing identical chalk selections on every entry, the system evaluates all active entries simultaneously to minimize correlation failure risk, apply diversification benefits, and maximize collective contest survival probability.
                        </p>
                      </div>

                    </div>
                  ) : (
                    <div className="text-center py-10 bg-slate-50 border rounded-xl">
                      <p className="text-slate-600 font-semibold">Please choose an active Entry &amp; Leg above to process recommendations.</p>
                    </div>
                  )}

                </div>
              )}

              {activeTab === "recommendation-audits" && (
                <RecommendationAuditPanel 
                  entries={entries}
                  teams={teams}
                />
              )}

              {activeTab === "recommendation-confidence" && (
                <RecommendationConfidencePanel 
                  entries={entries}
                  teams={teams}
                />
              )}

              {activeTab === "recommendation-consensus" && (
                <RecommendationConsensusPanel 
                  entries={entries}
                  teams={teams}
                />
              )}

              {activeTab === "recommendation-portfolio" && (
                <RecommendationPortfolioPanel 
                  entries={entries}
                  teams={teams}
                />
              )}

              {activeTab === "contest-ev" && (
                <ContestEVPanel 
                  entries={entries}
                  teams={teams}
                />
              )}

              {activeTab === "ownership-calibration" && (
                <OwnershipCalibrationPanel 
                  teams={teams}
                />
              )}

              {activeTab === "market-calibration" && (
                <MarketCalibrationPanel 
                  teams={teams}
                />
              )}

              {activeTab === "model-performance" && (
                <ModelPerformancePanel />
              )}

              {activeTab === "rolling-validation" && (
                <RollingValidationPanel />
              )}

              {activeTab === "model-drift" && (
                <ModelDriftPanel />
              )}

              {activeTab === "model-weights" && (
                <AdaptiveModelWeightPanel />
              )}

              {activeTab === "decision-policies" && (
                <DecisionPolicyPanel />
              )}

              {activeTab === "survivor-decisions" && (
                <SurvivorDecisionPanel />
              )}

              {activeTab === "survivor-plans" && (
                <SurvivorPlanningPanel />
              )}

              {activeTab === "championship-plans" && (
                <ChampionshipPlanningPanel />
              )}

              {activeTab === "decision-analytics" && (
                <DecisionAnalyticsPanel />
              )}

              {activeTab === "weekly-learning" && (
                <WeeklyLearningLoopPanel />
              )}

              {activeTab === "admin" && (
                <AdminDashboard />
              )}

              {/* ========================================================
                  OWNER VIEW: ROADMAPS
                  ======================================================== */}
              {activeTab === "roadmaps" && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
                  <div className="border-b pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-950">Dynamic Contest Roadmaps</h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Weekly projected selections and safety ratings mapped for your active entries.
                      </p>
                    </div>
                    <select
                      value={selectedEntryId}
                      onChange={(e) => setSelectedEntryId(e.target.value)}
                      className="text-xs font-bold bg-slate-100 border rounded px-3 py-1.5 focus:outline-none text-slate-800"
                    >
                      {filteredEntries.map(e => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                  </div>

                  {(() => {
                    const entryDash = workspace.flatMap(sec => sec.entries || []).find((ed: any) => ed.entry.id === selectedEntryId) 
                      || workspace.flatMap(sec => sec.entries || [])[0];

                    if (!entryDash) {
                      return (
                        <div className="text-center py-12 text-slate-400 text-xs">
                          No active entry found or workspace still synchronizing.
                        </div>
                      );
                    }

                    const { entry, roadmap, holidayReservations, strategy } = entryDash;
                    return (
                      <div className="space-y-6">
                        <div className="bg-slate-50 border border-slate-150 p-5 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4">
                          <div>
                            <span className="text-[9px] font-black uppercase text-slate-400">Entry Context</span>
                            <h3 className="text-lg font-bold text-slate-900">{entry.name}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Strategy Profile: <strong className="text-indigo-600 font-bold uppercase">{strategy?.strategy_name || strategy?.strategy_type || "Standard"}</strong></p>
                          </div>
                          <div className="bg-white border px-4 py-2 rounded-xl text-center">
                            <span className="block text-[8px] font-black uppercase text-slate-400">Roadmap Confidence</span>
                            <span className="text-sm font-black text-indigo-600">
                              {roadmap ? `${Math.round(roadmap.roadmap_confidence * 100)}%` : "N/A"}
                            </span>
                          </div>
                        </div>

                        {roadmap?.scheduled_weeks ? (
                          <div className="border border-slate-150 rounded-2xl overflow-hidden">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-150 text-slate-400 uppercase tracking-wider font-bold">
                                  <th className="p-3">Leg / Week</th>
                                  <th className="p-3">Selected Team</th>
                                  <th className="p-3">Opponent</th>
                                  <th className="p-3">Safety Rating</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                {roadmap.scheduled_weeks.map((week: any, idx: number) => {
                                  const teamObj = teams.find(t => t.id.toLowerCase() === week.team_id?.toLowerCase() || t.abbreviation.toLowerCase() === week.team_id?.toLowerCase());
                                  return (
                                    <tr key={idx} className="hover:bg-slate-50/50">
                                      <td className="p-3 font-bold text-slate-900">Leg {week.leg_order || idx + 1}</td>
                                      <td className="p-3 flex items-center gap-2">
                                        {teamObj ? (
                                          <>
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: teamObj.primary_color }}></span>
                                            <span className="font-bold text-slate-800">{teamObj.name}</span>
                                          </>
                                        ) : (
                                          <span className="text-slate-500 font-semibold">{week.team_id || "TBD"}</span>
                                        )}
                                      </td>
                                      <td className="p-3 text-slate-500">{week.opponent_id || "N/A"}</td>
                                      <td className="p-3">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                          (week.safety_rating || 0.8) > 0.8 ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-50 text-amber-700 border border-amber-100"
                                        }`}>
                                          {Math.round((week.safety_rating || 0.8) * 100)}% Match Safety
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="border border-dashed p-10 text-center rounded-2xl text-slate-400 text-xs">
                            No scheduled roadmap sequences calculated yet for this strategy profiles.
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ========================================================
                  OWNER VIEW: RECOMMENDATIONS
                  ======================================================== */}
              {activeTab === "recommendations" && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
                  <div className="border-b pb-4">
                    <h2 className="text-xl font-extrabold text-slate-950">Active Recommendations Engine</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Target recommendations and hedge alternatives generated for your portfolio lines.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {workspace.flatMap(sec => sec.entries || []).map((entryDash: any) => {
                      const { entry, currentRecommendation, strategy } = entryDash;
                      const teamObj = currentRecommendation?.teamId ? teams.find(t => t.id.toLowerCase() === currentRecommendation.teamId.toLowerCase()) : null;
                      const altTeamObj = currentRecommendation?.alternateTeamId ? teams.find(t => t.id.toLowerCase() === currentRecommendation.alternateTeamId.toLowerCase()) : null;

                      return (
                        <div key={entry.id} className="border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-extrabold text-slate-900 text-sm">{entry.name}</h3>
                                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Strategy: {strategy?.strategy_name || "Standard"}</span>
                              </div>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded ${
                                entry.status === "alive" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                              }`}>{entry.status.toUpperCase()}</span>
                            </div>

                            {currentRecommendation ? (
                              <div className="bg-slate-50 border p-3 rounded-xl space-y-2">
                                <div className="flex justify-between text-[11px] font-bold text-slate-500 border-b pb-1">
                                  <span>Primary Pick</span>
                                  <span className="text-emerald-600 font-extrabold">Win Prob: {Math.round(currentRecommendation.winProb * 100)}%</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {teamObj ? (
                                    <>
                                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: teamObj.primary_color }}></span>
                                      <strong className="text-slate-900 text-xs">{teamObj.name} ({teamObj.abbreviation})</strong>
                                    </>
                                  ) : (
                                    <strong className="text-slate-900 text-xs">{currentRecommendation.teamId}</strong>
                                  )}
                                </div>
                                {currentRecommendation.alternateTeamId && (
                                  <div className="text-[10px] text-slate-400 font-semibold border-t pt-1.5 flex justify-between">
                                    <span>Hedge Alt:</span>
                                    <span>{altTeamObj ? altTeamObj.name : currentRecommendation.alternateTeamId}</span>
                                  </div>
                                )}
                                {currentRecommendation.note && (
                                  <p className="text-[10px] text-slate-500 italic mt-1 leading-tight">
                                    "{currentRecommendation.note}"
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs text-slate-400 py-4 italic text-center">
                                No recommendations found.
                              </div>
                            )}
                          </div>

                          {currentRecommendation && (
                            <button
                              onClick={async () => {
                                try {
                                  // Lock the recommended pick for this entry
                                  await apiService.makePick(entry.id, selectedLegId, currentRecommendation.teamId);
                                  await loadAllData(false);
                                  await loadWorkspace();
                                } catch (err) {
                                  console.error("Lock pick error:", err);
                                }
                              }}
                              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2 rounded-lg cursor-pointer"
                            >
                              CONFIRM &amp; LOCK SELECTION
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </>
          )}

        </div>

      </main>

    </div>
  );
}
