import React from "react";
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
  ShieldCheck
} from "lucide-react";

import { useAppData } from "./hooks/useAppData";
import { DashboardCards } from "./components/DashboardCards";
import { EntryTable } from "./components/EntryTable";
import { InventoryTable } from "./components/InventoryTable";
import { RecommendationTable } from "./components/RecommendationTable";
import { HolidayInventoryPanel } from "./components/HolidayInventoryPanel";
import { RecommendationAuditPanel } from "./components/RecommendationAuditPanel";
import { RecommendationConfidencePanel } from "./components/RecommendationConfidencePanel";
import { AdminDashboard } from "./pages/AdminDashboard";

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
    successMsg,
    setSuccessMsg,
    errorMsg,
    setErrorMsg,
    loading,
    handleLockPick,
    handleCreateEntry,
    handleDeleteEntry,
    handleResetAppDb,
    activeEntryObj,
    activeLegObj,
    totalEntriesCount,
    aliveEntriesCount,
    eliminatedEntriesCount,
    currentPickForLeg
  } = useAppData();

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

            {/* Quick Stats Summary Pills */}
            <div className="hidden md:flex items-center gap-4">
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
              {[
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
                { id: "admin", label: "Admin Dashboard", icon: ShieldAlert, badge: "Secure" },
              ].map(tab => {
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
                          <h3 className="font-extrabold text-slate-900 text-sm uppercase">Currently Tracked Entries ({entries.length})</h3>
                          <p className="text-[11px] text-slate-400 mt-0.5">Select visual tabs below to inspect team availability grids or execute simulation tracks.</p>
                        </div>
                      </div>

                      <EntryTable 
                        entries={entries}
                        picks={picks}
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
                          {entries.map(e => (
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
                      <p className="text-xs text-slate-500 mt-1">
                        Tracking which of the 32 NFL teams have been utilized. Filtered specifically for: {" "}
                        <strong>{activeEntryObj?.name || "Choose selection entry"}</strong>
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
                        {entries.map(e => (
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

              {activeTab === "admin" && (
                <AdminDashboard />
              )}

            </>
          )}

        </div>

      </main>

    </div>
  );
}
