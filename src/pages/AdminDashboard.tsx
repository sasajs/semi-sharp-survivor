import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, ShieldAlert, LogOut, Loader2, Database, FileText, 
  RefreshCw, Settings, Activity, Brain, Server, CheckCircle2, 
  HelpCircle, Users, MapPin, Fingerprint, Navigation, Sliders, Play, AlertTriangle
} from "lucide-react";

import { isFeatureVisible } from "../config/featureVisibility";
import { apiService } from "../services/apiService";
import { AuthStatus } from "../types/auth";
import { AdminErrorBoundary } from "../components/admin/AdminErrorBoundary";
import { AdminLoginPanel } from "../components/admin/AdminLoginPanel";

// System Health Components
import { DatabaseStatusPanel } from "../components/admin/DatabaseStatusPanel";
import { SystemHealthPanel } from "../components/admin/SystemHealthPanel";
import { DataQualityLogManager } from "../components/admin/DataQualityLogManager";
import { ImportHistoryManager } from "../components/admin/ImportHistoryManager";

// Reference Data Components
import { TeamAliasesManager } from "../components/admin/TeamAliasesManager";

// Ingestion Manager
import { ScheduleImportManager } from "../components/admin/ScheduleImportManager";

// Advanced Diagnostics Components (Moved here from left navigation / main view)
import { RecommendationAuditPanel } from "../components/RecommendationAuditPanel";
import { RecommendationConfidencePanel } from "../components/RecommendationConfidencePanel";
import { RecommendationConsensusPanel } from "../components/RecommendationConsensusPanel";
import { RecommendationPortfolioPanel } from "../components/RecommendationPortfolioPanel";
import { ContestEVPanel } from "../components/ContestEVPanel";
import { OwnershipCalibrationPanel } from "../components/OwnershipCalibrationPanel";
import { MarketCalibrationPanel } from "../components/MarketCalibrationPanel";
import { ModelPerformancePanel } from "../components/ModelPerformancePanel";
import { RollingValidationPanel } from "../components/RollingValidationPanel";
import { ModelDriftPanel } from "../components/ModelDriftPanel";
import { AdaptiveModelWeightPanel } from "../components/AdaptiveModelWeightPanel";
import { DecisionPolicyPanel } from "../components/DecisionPolicyPanel";
import { SurvivorDecisionPanel } from "../components/SurvivorDecisionPanel";
import { SurvivorPlanningPanel } from "../components/SurvivorPlanningPanel";
import { ChampionshipPlanningPanel } from "../components/ChampionshipPlanningPanel";
import { DecisionAnalyticsPanel } from "../components/DecisionAnalyticsPanel";
import { WeeklyLearningLoopPanel } from "../components/WeeklyLearningLoopPanel";

// Other advanced operational panels
import { WorkflowExecutionPanel } from "../components/admin/WorkflowExecutionPanel";
import { WorkflowHistoryPanel } from "../components/admin/WorkflowHistoryPanel";
import { ScheduledWorkflowsPanel } from "../components/admin/ScheduledWorkflowsPanel";
import { PostgresReadinessPanel } from "../components/admin/PostgresReadinessPanel";
import { PreseasonReadinessPanel } from "../components/admin/PreseasonReadinessPanel";
import { HistoricalReplayPanel } from "../components/admin/HistoricalReplayPanel";
import { WeeklyPipelinePanel } from "../components/admin/WeeklyPipelinePanel";
import { RemoteAccessPanel } from "../components/admin/RemoteAccessPanel";
import { SecurityStatusPanel } from "../components/admin/SecurityStatusPanel";
import { SystemMemoryPanel } from "../components/admin/SystemMemoryPanel";
import { FeatureStorePanel } from "../components/admin/FeatureStorePanel";
import { EntryStrategyPanel } from "../components/admin/EntryStrategyPanel";
import { FutureTeamValuePanel } from "../components/admin/FutureTeamValuePanel";
import { SurvivorEquityPanel } from "../components/admin/SurvivorEquityPanel";
import { RecommendationCandidatesPanel } from "../components/admin/RecommendationCandidatesPanel";
import { SurvivorRecommendationsPanel } from "../components/admin/SurvivorRecommendationsPanel";
import { RecommendationEvolutionPanel } from "../components/RecommendationEvolutionPanel";
import { ReportArtifactsPanel } from "../components/admin/ReportArtifactsPanel";
import { ExportArtifactsPanel } from "../components/admin/ExportArtifactsPanel";

export interface AdminDashboardProps {
  initialTab?: "imports" | "reference" | "health" | "settings" | "diagnostics";
  initialImportTab?: "schedule" | "odds" | "weather" | "injuries" | "power_ratings";
  initialRefTab?: "teams" | "team-aliases" | "venues" | "venue-aliases";
  initialDiagTab?: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  initialTab,
  initialImportTab,
  initialRefTab,
  initialDiagTab,
}) => {
  // Authentication & Session
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [token, setToken] = useState<string | null>(localStorage.getItem("admin_token"));

  // Main Reorganized Tabs
  const [activeTab, setActiveTab] = useState<"imports" | "reference" | "health" | "settings" | "diagnostics">(initialTab || "imports");

  // Sub-tabs
  const [activeImportTab, setActiveImportTab] = useState<"schedule" | "odds" | "weather" | "injuries" | "power_ratings">(initialImportTab || "schedule");
  const [activeRefTab, setActiveRefTab] = useState<"teams" | "team-aliases" | "venues" | "venue-aliases">(initialRefTab || "teams");
  const [activeDiagTab, setActiveDiagTab] = useState<string>(initialDiagTab || "recommendation-audits");

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (initialImportTab) setActiveImportTab(initialImportTab);
  }, [initialImportTab]);

  useEffect(() => {
    if (initialRefTab) setActiveRefTab(initialRefTab);
  }, [initialRefTab]);

  useEffect(() => {
    if (initialDiagTab) setActiveDiagTab(initialDiagTab);
  }, [initialDiagTab]);

  // Global Data used by panels
  const [teams, setTeams] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);

  // Settings State
  const [resetting, setResetting] = useState<boolean>(false);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const fetchAuthStatus = async (chkToken: string | null) => {
    try {
      const headers: Record<string, string> = {};
      if (chkToken) {
        headers["x-admin-token"] = chkToken;
      }
      const res = await fetch("/api/auth/status", { headers });
      if (res.ok) {
        const data: AuthStatus = await res.json();
        setAuthStatus(data);
        if (!data.authenticated) {
          localStorage.removeItem("admin_token");
          setToken(null);
        }
      } else {
        setAuthStatus({ enabled: false, authenticated: true, session: null });
      }
    } catch {
      setAuthStatus({ enabled: false, authenticated: true, session: null });
    } finally {
      setLoadingAuth(false);
    }
  };

  const loadReferenceData = async () => {
    try {
      setLoadingData(true);
      const [allTeams, allEntries] = await Promise.all([
        apiService.fetchTeams(),
        apiService.fetchEntries()
      ]);
      setTeams(allTeams);
      setEntries(allEntries);
    } catch (err) {
      console.error("Failed to load reference metadata", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchAuthStatus(token);
  }, [token]);

  useEffect(() => {
    if (authStatus?.authenticated || !authStatus?.enabled) {
      loadReferenceData();
    }
  }, [authStatus]);

  const handleLoginSuccess = (newToken: string) => {
    setToken(newToken);
  };

  const handleLogout = async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers["x-admin-token"] = token;
      }
      await fetch("/api/auth/logout", {
        method: "POST",
        headers
      });
    } catch (err) {
      console.error("Logout request failure", err);
    } finally {
      localStorage.removeItem("admin_token");
      setToken(null);
      setAuthStatus(prev => prev ? { ...prev, authenticated: false, session: null } : null);
    }
  };

  // Database Reset In Settings
  const handleResetDatabase = async () => {
    if (!window.confirm("Are you sure you want to restore the application database to its factory default reference seeds? All current custom schedule imports and aliases will be restored to baseline configurations.")) {
      return;
    }
    setResetting(true);
    setSettingsSuccess(null);
    setSettingsError(null);
    try {
      await apiService.resetDatabase();
      setSettingsSuccess("Database successfully reseeded to clean, baseline starting datasets. All caches refreshed.");
      loadReferenceData();
    } catch (err: any) {
      setSettingsError(err.message || "Failed to reset application database.");
    } finally {
      setResetting(false);
    }
  };

  if (loadingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3 font-sans">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Validating security context on host...</p>
      </div>
    );
  }

  const isEnabled = authStatus?.enabled ?? false;
  const isAuthenticated = authStatus?.authenticated ?? true;

  if (isEnabled && !isAuthenticated) {
    return (
      <AdminErrorBoundary>
        <AdminLoginPanel onLoginSuccess={handleLoginSuccess} />
      </AdminErrorBoundary>
    );
  }

  // Canonical list of venues for Reference Data
  const canonicalVenues = [
    { name: "Acrisure Stadium", location: "Pittsburgh, PA", surface: "Natural Grass", type: "Open-Air", capacity: "68,400" },
    { name: "Allegiant Stadium", location: "Las Vegas, NV", surface: "Natural Grass", type: "Fixed Dome", capacity: "65,000" },
    { name: "Arrowhead Stadium", location: "Kansas City, MO", surface: "Natural Grass", type: "Open-Air", capacity: "76,416" },
    { name: "AT&T Stadium", location: "Arlington, TX", surface: "Matrix Turf", type: "Retractable Roof", capacity: "80,000" },
    { name: "Bank of America Stadium", location: "Charlotte, NC", surface: "FieldTurf", type: "Open-Air", capacity: "74,867" },
    { name: "Caesars Superdome", location: "New Orleans, LA", surface: "FieldTurf", type: "Fixed Dome", capacity: "73,000" },
    { name: "Empower Field at Mile High", location: "Denver, CO", surface: "Natural Grass", type: "Open-Air", capacity: "76,125" },
    { name: "Ford Field", location: "Detroit, MI", surface: "FieldTurf", type: "Fixed Dome", capacity: "65,000" },
    { name: "Gillette Stadium", location: "Foxborough, MA", surface: "FieldTurf", type: "Open-Air", capacity: "65,878" },
    { name: "Hard Rock Stadium", location: "Miami, FL", surface: "Natural Grass", type: "Open-Air", capacity: "65,326" },
    { name: "Highmark Stadium", location: "Orchard Park, NY", surface: "A-Turf Titan", type: "Open-Air", capacity: "71,608" },
    { name: "Lambeau Field", location: "Green Bay, WI", surface: "Desso GrassMaster", type: "Open-Air", capacity: "81,441" },
    { name: "Levi's Stadium", location: "Santa Clara, CA", surface: "Natural Grass", type: "Open-Air", capacity: "68,500" },
    { name: "Lincoln Financial Field", location: "Philadelphia, PA", surface: "Natural Grass", type: "Open-Air", capacity: "69,796" },
    { name: "Lucas Oil Stadium", location: "Indianapolis, IN", surface: "Shaw Sports Turf", type: "Retractable Roof", capacity: "67,000" },
    { name: "Lumen Field", location: "Seattle, WA", surface: "FieldTurf", type: "Open-Air", capacity: "68,740" },
    { name: "M&T Bank Stadium", location: "Baltimore, MD", surface: "Natural Grass", type: "Open-Air", capacity: "71,008" },
    { name: "Mercedes-Benz Stadium", location: "Atlanta, GA", surface: "FieldTurf", type: "Retractable Roof", capacity: "71,000" },
    { name: "MetLife Stadium", location: "East Rutherford, NJ", surface: "FieldTurf CORE", type: "Open-Air", capacity: "82,500" },
    { name: "Nissan Stadium", location: "Nashville, TN", surface: "Matrix Turf", type: "Open-Air", capacity: "69,143" },
    { name: "NRG Stadium", location: "Houston, TX", surface: "Matrix Turf", type: "Retractable Roof", capacity: "72,220" },
    { name: "Paycor Stadium", location: "Cincinnati, OH", surface: "Shaw Sports Turf", type: "Open-Air", capacity: "65,515" },
    { name: "Raymond James Stadium", location: "Tampa, FL", surface: "Natural Grass", type: "Open-Air", capacity: "65,618" },
    { name: "SoFi Stadium", location: "Inglewood, CA", surface: "Matrix Turf", type: "Fixed Dome", capacity: "70,240" },
    { name: "Soldier Field", location: "Chicago, IL", surface: "Natural Grass", type: "Open-Air", capacity: "61,500" },
    { name: "State Farm Stadium", location: "Glendale, AZ", surface: "Natural Grass", type: "Retractable Roof", capacity: "63,400" },
    { name: "U.S. Bank Stadium", location: "Minneapolis, MN", surface: "UBU Speed Series", type: "Fixed Dome", capacity: "66,655" }
  ];

  // Canonical venue synonym aliases mapping
  const venueSynonyms = [
    { original: "Heinz Field", canonical: "Acrisure Stadium", location: "Pittsburgh, PA", note: "Historic stadium name variant" },
    { original: "Mercedes-Benz Superdome", canonical: "Caesars Superdome", location: "New Orleans, LA", note: "Sponsorship update" },
    { original: "Paul Brown Stadium", canonical: "Paycor Stadium", location: "Cincinnati, OH", note: "Commercial naming rights" },
    { original: "Mile High Stadium", canonical: "Empower Field at Mile High", location: "Denver, CO", note: "Historic nomenclature" },
    { original: "Ralph Wilson Stadium", canonical: "Highmark Stadium", location: "Orchard Park, NY", note: "Former facility label" },
    { original: "FedEx Field", canonical: "Northwest Stadium", location: "Landover, MD", note: "Recent re-branding (2024)" },
    { original: "Oakland Coliseum", canonical: "RingCentral Coliseum", location: "Oakland, CA", note: "Historical franchise home" }
  ];

  return (
    <AdminErrorBoundary>
      <div id="admin-dashboard-container" className="space-y-6 animate-fade-in w-full font-sans">
        
        {/* Unified Page Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-black text-slate-950 tracking-tight">
                Administrator Control Portal
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Unified workstation for schedule data imports, team metadata, system diagnostics, and analytical review.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2.5">
            {isEnabled && (
              <button
                onClick={handleLogout}
                className="text-xs font-bold text-slate-600 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 py-1.5 px-3 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            )}
            <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1.5 rounded-full uppercase tracking-wider font-mono">
              {authStatus?.session?.role || "ADMIN"} Session
            </span>
          </div>
        </div>

        {/* Read-Only Status Alert for Users */}
        {authStatus?.session?.role === "USER" && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed text-amber-900 shadow-xs">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Read-Only Operational Context</p>
              <p className="mt-0.5 text-slate-600">
                You are currently authenticated under standard read-only credentials. Triggering imports, reseeding database states, or updating aliases is restricted to root administrators and will return a secure status rejection.
              </p>
            </div>
          </div>
        )}

        {/* Unified Operator Main Tabs */}
        <div className="flex border-b border-slate-200 overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab("imports")}
            className={`py-3 px-5 text-xs font-black border-b-2 flex items-center gap-2 cursor-pointer transition shrink-0 uppercase tracking-wider ${
              activeTab === "imports"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <Database className="w-4 h-4 text-indigo-600" />
            Schedule & Data Imports
          </button>
          <button
            onClick={() => setActiveTab("reference")}
            className={`py-3 px-5 text-xs font-black border-b-2 flex items-center gap-2 cursor-pointer transition shrink-0 uppercase tracking-wider ${
              activeTab === "reference"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <Brain className="w-4 h-4 text-indigo-600" />
            Reference Data Registry
          </button>
          <button
            onClick={() => setActiveTab("health")}
            className={`py-3 px-5 text-xs font-black border-b-2 flex items-center gap-2 cursor-pointer transition shrink-0 uppercase tracking-wider ${
              activeTab === "health"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <Activity className="w-4 h-4 text-indigo-600" />
            System Operational Health
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`py-3 px-5 text-xs font-black border-b-2 flex items-center gap-2 cursor-pointer transition shrink-0 uppercase tracking-wider ${
              activeTab === "settings"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <Settings className="w-4 h-4 text-indigo-600" />
            System Settings
          </button>
          <button
            onClick={() => setActiveTab("diagnostics")}
            className={`py-3 px-5 text-xs font-black border-b-2 flex items-center gap-2 cursor-pointer transition shrink-0 uppercase tracking-wider ${
              activeTab === "diagnostics"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <Sliders className="w-4 h-4 text-indigo-600" />
            Advanced Diagnostics
          </button>
        </div>

        {/* Tab Contents */}

        {/* 1. IMPORTS TAB */}
        {activeTab === "imports" && (
          <div className="space-y-6">
            {/* Sub navigation for specific import types */}
            <div className="flex flex-wrap gap-2 pb-1.5 border-b border-slate-100">
              <button
                onClick={() => setActiveImportTab("schedule")}
                className={`text-xs font-bold px-3.5 py-1.5 rounded-xl border transition cursor-pointer ${
                  activeImportTab === "schedule"
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                NFL Weekly Schedule
              </button>
              {isFeatureVisible("odds_import") && (
                <button
                  onClick={() => setActiveImportTab("odds")}
                  className={`text-xs font-bold px-3.5 py-1.5 rounded-xl border transition cursor-pointer ${
                    activeImportTab === "odds"
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Odds & Spreads
                </button>
              )}
              {isFeatureVisible("weather_import") && (
                <button
                  onClick={() => setActiveImportTab("weather")}
                  className={`text-xs font-bold px-3.5 py-1.5 rounded-xl border transition cursor-pointer ${
                    activeImportTab === "weather"
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Weather Forecasts
                </button>
              )}
              {isFeatureVisible("injury_import") && (
                <button
                  onClick={() => setActiveImportTab("injuries")}
                  className={`text-xs font-bold px-3.5 py-1.5 rounded-xl border transition cursor-pointer ${
                    activeImportTab === "injuries"
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Injury Reports
                </button>
              )}
              {isFeatureVisible("power_ratings") && (
                <button
                  onClick={() => setActiveImportTab("power_ratings")}
                  className={`text-xs font-bold px-3.5 py-1.5 rounded-xl border transition cursor-pointer ${
                    activeImportTab === "power_ratings"
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Power Ratings
                </button>
              )}
            </div>

            {/* Render Ingestion manager with appropriate parameters */}
            {activeImportTab === "schedule" && (
              <ScheduleImportManager type="schedule" title="NFL Schedule" />
            )}
            {activeImportTab === "odds" && (
              <ScheduleImportManager type="odds" title="Odds Market" />
            )}
            {activeImportTab === "weather" && (
              <ScheduleImportManager type="weather" title="Weather Data" />
            )}
            {activeImportTab === "injuries" && (
              <ScheduleImportManager type="injuries" title="Injury Reports" />
            )}
            {activeImportTab === "power_ratings" && (
              <ScheduleImportManager type="power_ratings" title="Power Ratings" />
            )}
          </div>
        )}

        {/* 2. REFERENCE DATA TAB */}
        {activeTab === "reference" && (
          <div className="space-y-6 animate-fade-in">
            {/* Reference Sub-navigation */}
            <div className="flex flex-wrap gap-2 pb-1.5 border-b border-slate-100">
              <button
                onClick={() => setActiveRefTab("teams")}
                className={`text-xs font-bold px-3.5 py-1.5 rounded-xl border transition cursor-pointer ${
                  activeRefTab === "teams"
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Canonical Teams list
              </button>
              <button
                onClick={() => setActiveRefTab("team-aliases")}
                className={`text-xs font-bold px-3.5 py-1.5 rounded-xl border transition cursor-pointer ${
                  activeRefTab === "team-aliases"
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Team Synonym Aliases
              </button>
              {isFeatureVisible("venues_config") && (
                <button
                  onClick={() => setActiveRefTab("venues")}
                  className={`text-xs font-bold px-3.5 py-1.5 rounded-xl border transition cursor-pointer ${
                    activeRefTab === "venues"
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Canonical Stadiums list
                </button>
              )}
              {isFeatureVisible("venue_aliases") && (
                <button
                  onClick={() => setActiveRefTab("venue-aliases")}
                  className={`text-xs font-bold px-3.5 py-1.5 rounded-xl border transition cursor-pointer ${
                    activeRefTab === "venue-aliases"
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Stadium Synonym Aliases
                </button>
              )}
            </div>

            {activeRefTab === "team-aliases" && <TeamAliasesManager />}

            {activeRefTab === "teams" && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <h4 className="text-xs font-black text-slate-950 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    Canonical NFL Franchises Registry ({teams.length} Active Records)
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Canonical definition of all active NFL teams, bye-weeks, colors, and division groupings.
                  </p>
                </div>
                {loadingData ? (
                  <div className="p-12 text-center text-slate-400 space-y-2">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-indigo-500" />
                    <p className="text-xs font-semibold">Loading master team table...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-medium">
                      <thead className="bg-slate-50 text-slate-500 font-extrabold text-[9px] uppercase tracking-wider">
                        <tr>
                          <th className="px-5 py-3">Franchise</th>
                          <th className="px-5 py-3">Abbreviation</th>
                          <th className="px-5 py-3">Conference</th>
                          <th className="px-5 py-3">Division</th>
                          <th className="px-5 py-3">Bye Week</th>
                          <th className="px-5 py-3 text-right">Brand Colors</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                        {teams.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50/50 transition">
                            <td className="px-5 py-3.5 font-bold text-slate-900">{t.name}</td>
                            <td className="px-5 py-3.5 font-mono text-indigo-600 font-black">{t.abbreviation}</td>
                            <td className="px-5 py-3.5 uppercase text-slate-500">{t.conference}</td>
                            <td className="px-5 py-3.5 uppercase text-slate-500">{t.division}</td>
                            <td className="px-5 py-3.5 font-mono">Week {t.bye_week}</td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex justify-end gap-1.5">
                                <span 
                                  className="w-4 h-4 rounded-md border border-slate-200 inline-block" 
                                  style={{ backgroundColor: t.primary_color }} 
                                  title={`Primary: ${t.primary_color}`}
                                />
                                <span 
                                  className="w-4 h-4 rounded-md border border-slate-200 inline-block" 
                                  style={{ backgroundColor: t.secondary_color }} 
                                  title={`Secondary: ${t.secondary_color}`}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeRefTab === "venues" && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <h4 className="text-xs font-black text-slate-950 uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    Canonical NFL Stadiums Index
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    System records of playing surfaces, roofs, climate, locations, and seating configurations.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-medium">
                    <thead className="bg-slate-50 text-slate-500 font-extrabold text-[9px] uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3">Stadium Facility</th>
                        <th className="px-5 py-3">Geographic Location</th>
                        <th className="px-5 py-3">Playing Surface</th>
                        <th className="px-5 py-3">Roof Construction</th>
                        <th className="px-5 py-3 text-right">Seating Capacity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                      {canonicalVenues.map((v, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition">
                          <td className="px-5 py-3.5 font-bold text-slate-900">{v.name}</td>
                          <td className="px-5 py-3.5 text-slate-500">{v.location}</td>
                          <td className="px-5 py-3.5 font-medium">{v.surface}</td>
                          <td className="px-5 py-3.5">
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                              {v.type}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right font-mono text-slate-800 font-bold">{v.capacity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeRefTab === "venue-aliases" && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <h4 className="text-xs font-black text-slate-950 uppercase tracking-wider flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-indigo-600" />
                    Stadium Synonym Alias Translation Maps
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Active translation rules mapping legacy facility names and commercial sponsor re-brands to canonical venues.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-medium">
                    <thead className="bg-slate-50 text-slate-500 font-extrabold text-[9px] uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3">Legacy / Raw Synonym</th>
                        <th className="px-5 py-3">Canonical Resolution Target</th>
                        <th className="px-5 py-3">Geographic Location</th>
                        <th className="px-5 py-3 text-right">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                      {venueSynonyms.map((vs, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition">
                          <td className="px-5 py-3.5 font-bold text-indigo-750 font-mono">{vs.original}</td>
                          <td className="px-5 py-3.5 font-bold text-slate-900">{vs.canonical}</td>
                          <td className="px-5 py-3.5 text-slate-500">{vs.location}</td>
                          <td className="px-5 py-3.5 text-right text-[11px] text-slate-400 font-medium italic">{vs.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. SYSTEM HEALTH TAB */}
        {activeTab === "health" && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DatabaseStatusPanel />
              <SystemHealthPanel />
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h4 className="text-xs font-black text-slate-950 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                Live Data Quality Audit Trails
              </h4>
              <DataQualityLogManager />
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h4 className="text-xs font-black text-slate-950 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600 shrink-0" />
                Recent Ingestion Job History logs
              </h4>
              <ImportHistoryManager />
            </div>
          </div>
        )}

        {/* 4. SETTINGS TAB */}
        {activeTab === "settings" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6 max-w-4xl animate-fade-in font-sans">
            <div className="border-b pb-4">
              <h4 className="text-xs font-black text-slate-950 uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-600 shrink-0" />
                System Maintenance & Configuration Properties
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Re-evaluate master records, purge diagnostic buffers, or restore baseline dataset seeds to start a fresh week.
              </p>
            </div>

            {settingsSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex gap-3 leading-relaxed shadow-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold">Operation Completed</p>
                  <p className="mt-0.5 text-emerald-700 font-semibold">{settingsSuccess}</p>
                </div>
              </div>
            )}

            {settingsError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-950 p-4 rounded-xl text-xs flex gap-3 leading-relaxed">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold">Operation Halted</p>
                  <p className="mt-0.5 text-rose-700 leading-relaxed">{settingsError}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block font-mono">Baseline Database Operations</span>
                  <h5 className="text-sm font-bold text-slate-900 mt-1">Reseed Database seeds</h5>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    Purge all current data modifications, override aliases, and reload the pristine baseline starting seeds. Ideal for resetting before the new NFL regular season begins.
                  </p>
                </div>
                <button
                  onClick={handleResetDatabase}
                  disabled={resetting}
                  className="w-full sm:w-fit mt-4 bg-slate-900 hover:bg-slate-800 text-white disabled:bg-slate-300 font-extrabold text-xs py-2 px-4 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {resetting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Reseeding Database...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Execute Baseline Reseed
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block font-mono">Application Ingestion Cache</span>
                  <h5 className="text-sm font-bold text-slate-900 mt-1">Clear System Cache</h5>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    Purge RAM memory lookup maps for team aliases, schedule previews, and model weights to force fresh disk re-evaluations during subsequent previews.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSettingsSuccess("System caches cleared successfully.");
                    setTimeout(() => setSettingsSuccess(null), 3000);
                  }}
                  className="w-full sm:w-fit mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  Purge Active Cache Maps
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3 flex flex-col justify-between col-span-1 md:col-span-2">
                <div>
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block font-mono">Developer Environment Controls</span>
                  <h5 className="text-sm font-bold text-slate-900 mt-1">Show Experimental/Unfinished Features</h5>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    Toggle visibility of experimental analytical engines, venue configurations, and other unreleased tools.
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={() => {
                      const current = localStorage.getItem("SHOW_EXPERIMENTAL") === "true";
                      localStorage.setItem("SHOW_EXPERIMENTAL", (!current).toString());
                      window.location.reload();
                    }}
                    className={`px-4 py-2 text-xs font-black rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer ${
                      localStorage.getItem("SHOW_EXPERIMENTAL") === "true"
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    <span>Toggle: {localStorage.getItem("SHOW_EXPERIMENTAL") === "true" ? "ENABLED (Visible)" : "DISABLED (Hidden)"}</span>
                  </button>
                  <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">
                    Active Config: {localStorage.getItem("SHOW_EXPERIMENTAL") === "true" ? "EXPERIMENTAL_MODE" : "STABLE_ONLY"}
                  </span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 5. ADVANCED DIAGNOSTICS TAB */}
        {activeTab === "diagnostics" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Left navigation list of analytical tools */}
            <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1.5 h-fit font-sans">
              <div className="px-2 pb-2 border-b border-slate-100">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Diagnostics Index
                </h4>
              </div>
              <nav className="flex flex-col gap-1 pt-1.5">
                {[
                  { id: "recommendation-audits", label: "Recommendation Audit", feature: "reports" },
                  { id: "recommendation-confidence", label: "Confidence & Stability", feature: "reports" },
                  { id: "recommendation-consensus", label: "Consensus Analysis", feature: "reports" },
                  { id: "recommendation-portfolio", label: "Portfolio Optimizer", feature: "portfolio_optimizer" },
                  { id: "contest-ev", label: "Contest EV Optimizer", feature: "contest_ev" },
                  { id: "ownership-calibration", label: "Ownership Calibration", feature: "experimental" },
                  { id: "market-calibration", label: "Market Calibration", feature: "experimental" },
                  { id: "model-performance", label: "Model Performance", feature: "model_performance" },
                  { id: "rolling-validation", label: "Rolling Validation", feature: "rolling_validation" },
                  { id: "model-drift", label: "Model Drift Analysis", feature: "model_drift" },
                  { id: "model-weights", label: "Adaptive Weights", feature: "adaptive_weights" },
                  { id: "decision-policies", label: "Decision Policies", feature: "decision_policies" },
                  { id: "survivor-decisions", label: "Survivor Decisions", feature: "experimental" },
                  { id: "survivor-plans", label: "Survivor Plans", feature: "survivor_plans" },
                  { id: "championship-plans", label: "Championship Plans", feature: "championship_plans" },
                  { id: "decision-analytics", label: "Decision Analytics", feature: "decision_analytics" },
                  { id: "weekly-learning", label: "Weekly Learning Loop", feature: "weekly_learning_loop" },
                  { id: "workflows", label: "System Workflows Engine", feature: "experimental" },
                  { id: "preseason", label: "Preseason & Backtesting", feature: "experimental" },
                  { id: "security", label: "Gatekeeper & Audits", feature: "experimental" }
                ].filter(item => {
                  if (!item.feature) return true;
                  if (item.feature === "experimental") return isFeatureVisible("odds_import");
                  return isFeatureVisible(item.feature);
                }).map((item) => {
                  const isActive = item.id === activeDiagTab;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveDiagTab(item.id)}
                      className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                        isActive
                          ? "bg-indigo-50 text-indigo-950 border-l-3 border-indigo-600 pl-2.5"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Main content display for active analytical tool */}
            <div className="lg:col-span-3 space-y-6">
              
              {activeDiagTab === "recommendation-audits" && (
                <RecommendationAuditPanel entries={entries} teams={teams} />
              )}
              {activeDiagTab === "recommendation-confidence" && (
                <RecommendationConfidencePanel entries={entries} teams={teams} />
              )}
              {activeDiagTab === "recommendation-consensus" && (
                <RecommendationConsensusPanel entries={entries} teams={teams} />
              )}
              {activeDiagTab === "recommendation-portfolio" && (
                <RecommendationPortfolioPanel entries={entries} teams={teams} />
              )}
              {activeDiagTab === "contest-ev" && (
                <ContestEVPanel entries={entries} teams={teams} />
              )}
              {activeDiagTab === "ownership-calibration" && (
                <OwnershipCalibrationPanel teams={teams} />
              )}
              {activeDiagTab === "market-calibration" && (
                <MarketCalibrationPanel teams={teams} />
              )}
              {activeDiagTab === "model-performance" && (
                <ModelPerformancePanel />
              )}
              {activeDiagTab === "rolling-validation" && (
                <RollingValidationPanel />
              )}
              {activeDiagTab === "model-drift" && (
                <ModelDriftPanel />
              )}
              {activeDiagTab === "model-weights" && (
                <AdaptiveModelWeightPanel />
              )}
              {activeDiagTab === "decision-policies" && (
                <DecisionPolicyPanel />
              )}
              {activeDiagTab === "survivor-decisions" && (
                <SurvivorDecisionPanel />
              )}
              {activeDiagTab === "survivor-plans" && (
                <SurvivorPlanningPanel />
              )}
              {activeDiagTab === "championship-plans" && (
                <ChampionshipPlanningPanel />
              )}
              {activeDiagTab === "decision-analytics" && (
                <DecisionAnalyticsPanel />
              )}
              {activeDiagTab === "weekly-learning" && (
                <WeeklyLearningLoopPanel />
              )}

              {/* Other advanced operational diagnostics combined beautifully */}
              {activeDiagTab === "workflows" && (
                <div className="space-y-6 font-sans">
                  <WorkflowExecutionPanel />
                  <WorkflowHistoryPanel />
                  <ScheduledWorkflowsPanel />
                </div>
              )}

              {activeDiagTab === "preseason" && (
                <div className="space-y-6 font-sans">
                  <PreseasonReadinessPanel />
                  <HistoricalReplayPanel />
                  <WeeklyPipelinePanel />
                </div>
              )}

              {activeDiagTab === "security" && (
                <div className="space-y-6 font-sans">
                  <SecurityStatusPanel />
                  <SystemMemoryPanel />
                  <FeatureStorePanel />
                  <EntryStrategyPanel />
                  <FutureTeamValuePanel />
                  <SurvivorEquityPanel />
                  <RecommendationCandidatesPanel />
                  <SurvivorRecommendationsPanel />
                  <RecommendationEvolutionPanel />
                  <ReportArtifactsPanel />
                  <ExportArtifactsPanel />
                  <RemoteAccessPanel />
                  <PostgresReadinessPanel />
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </AdminErrorBoundary>
  );
};
