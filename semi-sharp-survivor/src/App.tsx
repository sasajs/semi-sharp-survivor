import React, { useState, useEffect } from "react";
import { 
  Trophy, 
  Settings, 
  Users, 
  CheckSquare, 
  Calendar, 
  PieChart, 
  Sparkles, 
  History, 
  RotateCcw, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  XCircle, 
  Bookmark,
  ShieldAlert,
  Dribbble,
  Maximize2,
  ListFilter,
  Flame,
  HelpCircle
} from "lucide-react";
import { 
  Contest, 
  ContestLeg, 
  Team, 
  Game, 
  TeamWeekLine, 
  SurvivorEntry, 
  SurvivorPick 
} from "./types";

export default function App() {
  // Navigation State (8 views)
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Domain state
  const [contests, setContests] = useState<Contest[]>([]);
  const [legs, setLegs] = useState<ContestLeg[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [entries, setEntries] = useState<SurvivorEntry[]>([]);
  const [picks, setPicks] = useState<SurvivorPick[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [lines, setLines] = useState<TeamWeekLine[]>([]);

  // Selection state for dynamic interactive views
  const [selectedEntryId, setSelectedEntryId] = useState<string>("");
  const [selectedLegId, setSelectedLegId] = useState<string>("leg-1");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  // Recommendation Report Data
  const [recReport, setRecReport] = useState<any>(null);
  const [loadingRecs, setLoadingRecs] = useState<boolean>(false);

  // New forms UI state
  const [newEntryName, setNewEntryName] = useState<string>("");
  const [newEntryNotes, setNewEntryNotes] = useState<string>("");
  
  // Feedback banners
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Loading Indicator
  const [loading, setLoading] = useState<boolean>(true);

  // Initial Data Fetching
  const loadAllData = async () => {
    try {
      setLoading(true);
      const [resC, resL, resT, resE, resP] = await Promise.all([
        fetch("/api/contests").then(r => r.json()),
        fetch("/api/legs").then(r => r.json()),
        fetch("/api/teams").then(r => r.json()),
        fetch("/api/entries").then(r => r.json()),
        fetch("/api/picks").then(r => r.json())
      ]);

      setContests(resC);
      setLegs(resL);
      setTeams(resT);
      setEntries(resE);
      setPicks(resP);

      // Auto-select first entry if exists and nothing is selected
      if (resE.length > 0 && !selectedEntryId) {
        // Prefer first ALIVE entry
        const aliveEntry = resE.find((e: any) => e.status === "alive");
        setSelectedEntryId(aliveEntry ? aliveEntry.id : resE[0].id);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error loaded application database: ", err);
      setErrorMsg("Failed to connect to full-stack API server. Please retry.");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Fetch games & lines whenever the active leg changes
  useEffect(() => {
    if (!selectedLegId) return;
    
    const fetchLegSpecifics = async () => {
      try {
        const [resG, resLines] = await Promise.all([
          fetch(`/api/games?leg_id=${selectedLegId}`).then(r => r.json()),
          fetch(`/api/lines?leg_id=${selectedLegId}`).then(r => r.json())
        ]);
        setGames(resG);
        setLines(resLines);
      } catch (err) {
        console.error("Error fetching match particulars: ", err);
      }
    };
    fetchLegSpecifics();
  }, [selectedLegId]);

  // Fetch Recommendations Report when active entry or leg changes, or on view
  useEffect(() => {
    if (!selectedEntryId || !selectedLegId) return;

    const fetchRecs = async () => {
      try {
        setLoadingRecs(true);
        const res = await fetch(`/api/recommendations?entry_id=${selectedEntryId}&leg_id=${selectedLegId}`);
        if (res.ok) {
          const data = await res.json();
          setRecReport(data);
        }
        setLoadingRecs(false);
      } catch (err) {
        console.error("Error loading mathematical recommendations:", err);
        setLoadingRecs(false);
      }
    };

    fetchRecs();
  }, [selectedEntryId, selectedLegId, picks, activeTab]);

  // Handle Pick Locking Action
  const handleLockPick = async (teamId: string) => {
    if (!selectedEntryId) {
      setErrorMsg("Please select an entry in Entry Management first.");
      showAndAutoDismiss();
      return;
    }
    if (!selectedLegId) {
      setErrorMsg("Please choose an NFL Contest Leg.");
      showAndAutoDismiss();
      return;
    }

    try {
      const res = await fetch("/api/picks/make", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entry_id: selectedEntryId,
          contest_leg_id: selectedLegId,
          team_id: teamId
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Failed to finalize selection.");
        setSuccessMsg("");
      } else {
        setSuccessMsg(`Successfully selected and locked the ${teams.find(t => t.id === teamId)?.name}!`);
        setErrorMsg("");
        
        // Refresh full application status state
        await loadAllData();
      }
      showAndAutoDismiss();
    } catch (err) {
      console.error(err);
      setErrorMsg("Network failure occurred submitting survivor pick.");
      showAndAutoDismiss();
    }
  };

  // Create Entry Action
  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntryName.trim()) return;

    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newEntryName,
          notes: newEntryNotes
        })
      });

      if (res.ok) {
        const added = await res.json();
        setSuccessMsg(`Entry '${added.name}' created successfully.`);
        setNewEntryName("");
        setNewEntryNotes("");
        await loadAllData();
        setSelectedEntryId(added.id);
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || "Error creating entry.");
      }
      showAndAutoDismiss();
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to reach server to create entry.");
      showAndAutoDismiss();
    }
  };

  // Delete Entry Action
  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this Entry from Circa Survivor?")) {
      return;
    }
    try {
      const res = await fetch(`/api/entries/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setSuccessMsg("Entry deleted safely.");
        await loadAllData();
        if (selectedEntryId === id) {
          setSelectedEntryId("");
        }
      } else {
        setErrorMsg("Failed to delete entry.");
      }
      showAndAutoDismiss();
    } catch (err) {
      console.error(err);
    }
  };

  // Database reseed/reset back to clean template constraints
  const handleResetAppDb = async () => {
    if (!window.confirm("This will reset all Survivor Picks, Alive statuses, and restore original clean mock configurations. Proceed?")) {
      return;
    }
    try {
      const res = await fetch("/api/admin/reset", { method: "POST" });
      if (res.ok) {
        setSuccessMsg("Database reseeded with fresh NFL lines & pristine survivor configurations.");
        setErrorMsg("");
        setSelectedLegId("leg-1");
        await loadAllData();
      }
      showAndAutoDismiss();
    } catch (err) {
      console.error(err);
    }
  };

  const showAndAutoDismiss = () => {
    setTimeout(() => {
      // Auto dismiss message block to keep UI pristine
    }, 5000);
  };

  // Utility to locate selected active entry details
  const activeEntryObj = entries.find(e => e.id === selectedEntryId);
  const activeLegObj = legs.find(l => l.id === selectedLegId);

  // Total calculated metrics
  const totalEntriesCount = entries.length;
  const aliveEntriesCount = entries.filter(e => e.status === "alive").length;
  const eliminatedEntriesCount = entries.filter(e => e.status === "eliminated").length;

  // Track if active selection has already committed a team this week
  const currentPickForLeg = picks.find(p => p.entry_id === selectedEntryId && p.contest_leg_id === selectedLegId);

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 overflow-hidden font-sans">
      
      {/* Toast Notification HUD */}
      {(successMsg || errorMsg) && (
        <div id="toast-notify" className="absolute top-4 right-4 z-50 flex flex-col gap-2 max-w-md animate-bounce">
          {successMsg && (
            <div className="bg-emerald-600 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">{successMsg}</p>
              </div>
              <button onClick={() => setSuccessMsg("")} className="text-white hover:text-slate-200 text-xs ml-auto">✕</button>
            </div>
          )}
          {errorMsg && (
            <div className="bg-rose-600 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <div>
                <p className="text-sm font-bold">Rule Constraint Exception</p>
                <p className="text-xs opacity-90">{errorMsg}</p>
              </div>
              <button onClick={() => setErrorMsg("")} className="text-white hover:text-slate-200 text-xs ml-auto">✕</button>
            </div>
          )}
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside id="sidebar" className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-2 border-b border-slate-800">
          <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center font-bold text-xl">S</div>
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-md">SEMI-SHARP V2</span>
            <span className="text-[10px] text-indigo-400 font-medium tracking-wider">CIRCA SURVIVOR ENGINE</span>
          </div>
        </div>

        {/* Global Entry Quick Selector Hooked to Sidebar */}
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800">
          <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">
            Active Survivor Entry
          </label>
          <select 
            id="global-entry-select"
            value={selectedEntryId}
            onChange={(e) => setSelectedEntryId(e.target.value)}
            className="w-full bg-slate-800 text-white text-xs rounded border border-slate-700 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
          >
            {entries.map(e => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.status.toUpperCase()})
              </option>
            ))}
            {entries.length === 0 && <option value="">No entries - create one</option>}
          </select>
          {activeEntryObj && (
            <div className="mt-1.5 flex items-center justify-between text-[10px]">
              <span className="text-slate-400">Current Status:</span>
              <span className={`font-bold px-1.5 py-0.2 rounded ${
                activeEntryObj.status === "alive" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
              }`}>
                {activeEntryObj.status.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 py-4 overflow-y-auto space-y-1">
          <button 
            id="nav-dash"
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium gap-3 transition-all ${
              activeTab === "dashboard" ? "bg-indigo-600 text-white border-r-4 border-indigo-300" : "text-slate-300 hover:text-white hover:bg-slate-850"
            }`}
          >
            <Trophy className="w-4.5 h-4.5" />
            <span>Dashboard</span>
          </button>

          <button 
            id="nav-setup"
            onClick={() => setActiveTab("setup")}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium gap-3 transition-all ${
              activeTab === "setup" ? "bg-indigo-600 text-white border-r-4 border-indigo-300" : "text-slate-300 hover:text-white hover:bg-slate-850"
            }`}
          >
            <Settings className="w-4.5 h-4.5" />
            <span>Contest Setup</span>
          </button>

          <button 
            id="nav-entries"
            onClick={() => setActiveTab("entries")}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium gap-3 transition-all ${
              activeTab === "entries" ? "bg-indigo-600 text-white border-r-4 border-indigo-300" : "text-slate-300 hover:text-white hover:bg-slate-850"
            }`}
          >
            <Users className="w-4.5 h-4.5" />
            <span>Entry Management</span>
            <span className="ml-auto text-[10px] bg-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded-full font-bold">
              {entries.length}
            </span>
          </button>

          <button 
            id="nav-picks"
            onClick={() => setActiveTab("picks")}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium gap-3 transition-all ${
              activeTab === "picks" ? "bg-indigo-600 text-white border-r-4 border-indigo-300" : "text-slate-300 hover:text-white hover:bg-slate-850"
            }`}
          >
            <CheckSquare className="w-4.5 h-4.5" />
            <span>Weekly Pick Optimizer</span>
          </button>

          <div className="pt-2 pb-1 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Contest Inventory
          </div>

          <button 
            id="nav-inventory"
            onClick={() => setActiveTab("inventory")}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium gap-3 transition-all ${
              activeTab === "inventory" ? "bg-indigo-600 text-white border-r-4 border-indigo-300" : "text-slate-300 hover:text-white hover:bg-slate-850"
            }`}
          >
            <Calendar className="w-4.5 h-4.5" />
            <span>Team Inventory</span>
          </button>

          <button 
            id="nav-thanks"
            onClick={() => setActiveTab("thanksgiving")}
            className={`w-full flex items-center px-6 py-3 text-xs font-semibold gap-3 transition-all ${
              activeTab === "thanksgiving" ? "bg-amber-600 text-white border-r-4 border-amber-300" : "text-amber-200/80 hover:text-white hover:bg-amber-950/30"
            }`}
          >
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Thanksgiving Slate</span>
            <span className="ml-auto text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
              L13
            </span>
          </button>

          <button 
            id="nav-xmas"
            onClick={() => setActiveTab("christmas")}
            className={`w-full flex items-center px-6 py-3 text-xs font-semibold gap-3 transition-all ${
              activeTab === "christmas" ? "bg-rose-700 text-white border-r-4 border-rose-350" : "text-rose-200/85 hover:text-white hover:bg-rose-950/20"
            }`}
          >
            <Sparkles className="w-4 h-4 text-rose-400" />
            <span>Christmas Holidayer</span>
            <span className="ml-auto text-[9px] bg-rose-500/25 text-rose-300 px-1.5 py-0.5 rounded">
              L18
            </span>
          </button>

          <div className="pt-2 pb-1 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Reports & Analysis
          </div>

          <button 
            id="nav-reports"
            onClick={() => setActiveTab("reports")}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium gap-3 transition-all ${
              activeTab === "reports" ? "bg-indigo-600 text-white border-r-4 border-indigo-300" : "text-slate-300 hover:text-white hover:bg-slate-850"
            }`}
          >
            <PieChart className="w-4.5 h-4.5" />
            <span>Recommendation Report</span>
          </button>
        </nav>

        {/* Database Control Status Foot Box */}
        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <div className="text-xs text-slate-500 uppercase tracking-widest mb-1.5">Database Status</div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-xs text-slate-300">PostgreSQL (In-Memory Simulation)</span>
          </div>
          <button 
            onClick={handleResetAppDb}
            className="w-full flex items-center justify-center gap-1.5 text-[10px] text-slate-400 bg-slate-905 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 hover:text-white py-1 rounded transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset simulated data DDL
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <header id="header" className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900 uppercase">
              Circa Survivor MVP <span className="text-indigo-600 font-normal">/ {activeTab.replace("-", " ")}</span>
            </h1>
            <span className="hidden md:inline-flex bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded">
              Contest Year 2026
            </span>
          </div>

          {/* Quick HUD Metrics */}
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Entries Status</div>
              <div className="text-sm font-bold text-slate-800">
                <span className="text-emerald-600">{aliveEntriesCount} Alive</span>
                <span className="text-slate-300 mx-1.5">|</span>
                <span className="text-rose-600">{eliminatedEntriesCount} Out</span>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Circa Pool Cash</div>
              <div className="text-sm font-extrabold text-indigo-600">$14,260,500</div>
            </div>

            <button 
              onClick={() => {
                setActiveTab("entries");
                setNewEntryName(`Survivor Pick Entry ${entries.length + 1}`);
              }}
              className="bg-slate-900 hover:bg-indigo-600 text-white px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Entry</span>
            </button>
          </div>
        </header>

        {/* Content Box */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mb-2"></div>
              <p className="text-sm">Retrieving Relational Postgres Records...</p>
            </div>
          ) : (
            <>
              {/* Active Tab Views Switcher */}
              
              {/* ========================================================
                  VIEW 1: DASHBOARD
                  ======================================================== */}
              {activeTab === "dashboard" && (
                <div className="space-y-6">
                  
                  {/* Top Overview KPI Row */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow transition-shadow">
                      <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Contest Strategy Equity</div>
                      <div className="text-2xl font-black text-indigo-600">
                        {activeEntryObj ? (activeEntryObj.status === "alive" ? "1.42x" : "0.00x") : "No Active Entry"}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                        <span>+12% vs Contest Field</span>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow transition-shadow">
                      <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Future Value Lockups</div>
                      <div className="text-2xl font-black text-slate-900">Highly Conserved</div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        KC, SF, BAL available for Christmas
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow transition-shadow">
                      <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Thanksgiving Slate</div>
                      <div className="text-2xl font-black text-amber-600">Shield Active</div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        DET or DAL mapped for Thanksgiving (Leg 13)
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow transition-shadow">
                      <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Next Playoff Leg</div>
                      <div className="text-2xl font-black text-slate-950">{activeLegObj?.name || "Week 1"}</div>
                      <div className="text-[10px] text-indigo-600 font-medium mt-1">
                        {games.length} games scheduled in current leg
                      </div>
                    </div>
                  </div>

                  {/* Two Container Layout split */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Welcome Context and Contest Details */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                          <Trophy className="w-64 h-64" />
                        </div>
                        <span className="bg-indigo-500/35 text-indigo-300 text-[10px] px-2.5 py-1 rounded font-bold uppercase tracking-widest">
                          Contest Equity Optimization
                        </span>
                        <h2 className="text-2xl font-black mt-2">Circa Survivor Survivor Pools MVP</h2>
                        <p className="text-sm text-slate-300 mt-2 max-w-xl">
                          Circa Survivor is the ultimate test of NFL survival strategy. Unlike basic single-elimination pools, Circa incorporates 20 total legs (18 regular season weeks plus Thanksgiving/Black Friday and Christmas Day schedules).
                        </p>
                        <div className="mt-4 flex flex-wrap gap-4 text-xs text-indigo-200">
                          <div className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-lg">
                            <span className="w-2 h-2 rounded bg-indigo-400"></span>
                            <span>No ties allowed (Tie = Loss)</span>
                          </div>
                          <div className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-lg">
                            <span className="w-2 h-2 rounded bg-amber-400"></span>
                            <span>Save teams for separate Holidays</span>
                          </div>
                          <div className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-lg">
                            <span className="w-2 h-2 rounded bg-emerald-400"></span>
                            <span>Multiple entries supported</span>
                          </div>
                        </div>
                      </div>

                      {/* Entries Status Overview */}
                      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                            My Active Entries &amp; Current Week Status
                          </h3>
                          <button 
                            onClick={() => setActiveTab("entries")}
                            className="text-xs text-indigo-600 hover:underline font-semibold"
                          >
                            Manage Entries →
                          </button>
                        </div>

                        <div className="space-y-3">
                          {entries.map(ent => {
                            // Find pick for selected leg
                            const entPick = picks.find(p => p.entry_id === ent.id && p.contest_leg_id === selectedLegId);
                            const pickedTeamObj = entPick ? teams.find(t => t.id === entPick.team_id) : null;
                            
                            return (
                              <div key={ent.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between border border-slate-100 p-3.5 rounded-lg hover:bg-slate-50 transition-colors">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-slate-800">{ent.name}</span>
                                    <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-black ${
                                      ent.status === "alive" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                                    }`}>
                                      {ent.status}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500 italic">"{ent.notes || 'No notes added'}"</p>
                                </div>

                                <div className="mt-2 sm:mt-0 flex items-center gap-3">
                                  <div className="text-right">
                                    <div className="text-[10px] text-slate-400 font-bold uppercase">Selection Status ({activeLegObj?.name})</div>
                                    <div className="text-xs font-semibold">
                                      {pickedTeamObj ? (
                                        <span className="text-slate-800" style={{ color: pickedTeamObj.primary_color }}>
                                          🏈 {pickedTeamObj.name} ({pickedTeamObj.abbreviation.toUpperCase()})
                                        </span>
                                      ) : (
                                        <span className="text-slate-400 italic">No selection locked</span>
                                      )}
                                    </div>
                                  </div>

                                  <button 
                                    onClick={() => {
                                      setSelectedEntryId(ent.id);
                                      setActiveTab("picks");
                                    }}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-2.5 py-1.5 rounded transition-colors"
                                  >
                                    Select Team
                                  </button>
                                </div>
                              </div>
                            );
                          })}

                          {entries.length === 0 && (
                            <div className="text-center py-6 text-slate-400">
                              <p className="text-sm">You haven't setup any entries yet.</p>
                              <button 
                                onClick={() => setActiveTab("entries")}
                                className="mt-2 bg-indigo-600 text-white text-xs px-3 py-1.5 rounded font-medium"
                              >
                                Create First Entry
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right-Hand Quick Recommendation Side-card */}
                    <div className="space-y-6">
                      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
                        <div className="flex items-center gap-2 text-indigo-700 font-black text-xs uppercase tracking-wider mb-3">
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                          <span>QUICK STRATEGY METRICS</span>
                        </div>
                        
                        <div className="rounded-lg bg-indigo-50/50 border border-indigo-100 p-3 space-y-2">
                          <div className="flex justify-between py-1 text-xs border-b border-indigo-100">
                            <span className="text-indigo-950">Active Contest Leg</span>
                            <span className="font-bold">{activeLegObj?.name || "Week 1"}</span>
                          </div>
                          
                          <div className="flex justify-between py-1 text-xs border-b border-indigo-100">
                            <span className="text-indigo-950">Leg Classification</span>
                            <span className="font-bold uppercase text-[10px] bg-indigo-200 text-indigo-800 px-1.5 rounded">
                              {activeLegObj?.leg_type || "REGULAR"}
                            </span>
                          </div>

                          <div className="flex justify-between py-1 text-xs">
                            <span className="text-indigo-950">Active Selected Entry</span>
                            <span className="font-bold text-slate-800">{activeEntryObj?.name || "None"}</span>
                          </div>
                        </div>

                        <div className="mt-4">
                          <h4 className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">
                            Survivor Contest General Rules:
                          </h4>
                          <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                            <li className="flex gap-1.5">
                              <span className="text-emerald-500 font-bold">✓</span>
                              <span><strong>One-and-Done:</strong> Each team can only be used <strong>once</strong> over the course of the tournament.</span>
                            </li>
                            <li className="flex gap-1.5">
                              <span className="text-rose-500 font-bold">✗</span>
                              <span><strong>No Ties:</strong> If an NFL team you pick ties, your entry is <strong>eliminated</strong> (Ties count as a loss).</span>
                            </li>
                            <li className="flex gap-1.5">
                              <span className="text-amber-500 font-bold">★</span>
                              <span><strong>Holiday Legs:</strong> Thanksgiving & Christmas are separate, standalone legs. You are forced to save strong teams specifically for these legs!</span>
                            </li>
                          </ul>
                        </div>
                      </div>

                      {/* DB DDL preview block in sidebar style */}
                      <div className="bg-slate-900 text-slate-300 rounded-xl p-4 font-mono text-[10px] overflow-x-auto shadow-inner">
                        <div className="flex justify-between items-center mb-2 border-b border-slate-800 pb-1.5">
                          <span className="text-indigo-400 font-bold uppercase tracking-wider text-[9px]">PostgreSQL DDL Rules</span>
                          <span className="bg-slate-800 text-indigo-300 text-[8px] px-1 rounded">Constraint enforced</span>
                        </div>
                        <pre className="leading-tight text-slate-400">
{`-- Double Selection Guard Constraint
CREATE UNIQUE INDEX unique_entry_team_pick 
  ON survivor_picks (entry_id, team_id);

-- Tie Equals Elimination Trigger
CREATE OR REPLACE FUNCTION check_game_ties()
  RETURNS TRIGGER AS $$
  BEGIN
    IF NEW.home_score = NEW.away_score THEN
      UPDATE survivor_entries 
      SET status = 'eliminated'
      WHERE id = NEW.entry_id;
    END IF;
  END;
$$ LANGUAGE plpgsql;`}
                        </pre>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* ========================================================
                  VIEW 2: CONTEST SETUP
                  ======================================================== */}
              {activeTab === "setup" && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-950">Circa Survivor 2026 Contest Structure</h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Review the 20 distinct legs. Planning ahead for Thanksgiving and Christmas schedules is paramount for survival.
                      </p>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-100 px-3 py-2 rounded-lg text-xs">
                      <span className="text-indigo-950 font-bold">Current Active Week:</span>{" "}
                      <select 
                        value={selectedLegId}
                        onChange={(e) => setSelectedLegId(e.target.value)}
                        className="bg-white border border-indigo-200 rounded text-xs px-2 py-0.5"
                      >
                        {legs.map(l => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Holiday Legs Alert Banner */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3">
                      <Flame className="w-10 h-10 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-amber-900">Leg 13: Thanksgiving &amp; Black Friday Slate</h4>
                        <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                          Standalone leg separated from Week 12. Only contains games playing on Thursday (Thanksgiving) &amp; Black Friday. You <strong>cannot</strong> use teams that played on Thanksgiving in your normal Week 12 picks! Ensure detroit (DET) or dallas (DAL) is saved for this leg.
                        </p>
                      </div>
                    </div>

                    <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex gap-3">
                      <Sparkles className="w-10 h-10 text-rose-700 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-rose-900">Leg 18: Christmas Holidayer Slate</h4>
                        <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                          Standalone leg separated from Week 16. Includes games scheduled specifically on Christmas Day. Requires careful conservation of heavy hitting teams (like KC, BAL, or SF) to ensure you have an active option playing.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Complete Leg Timeline Layout */}
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm mb-3 uppercase tracking-wide">
                      Active Leg Timeline Structure Progress
                    </h3>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {legs.map((leg, idx) => {
                        const isSelected = selectedLegId === leg.id;
                        return (
                          <div 
                            key={leg.id}
                            onClick={() => setSelectedLegId(leg.id)}
                            className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                              isSelected 
                                ? "bg-indigo-600 border-indigo-700 text-white shadow-md transform -translate-y-0.5" 
                                : leg.leg_type === "thanksgiving" 
                                ? "bg-amber-50 border-amber-200 hover:border-amber-400 text-amber-900"
                                : leg.leg_type === "christmas"
                                ? "bg-rose-50 border-rose-200 hover:border-rose-400 text-rose-900"
                                : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800"
                            }`}
                          >
                            <div className="text-[10px] uppercase font-bold tracking-wider opacity-75">
                              Leg {idx + 1}
                            </div>
                            <div className="text-xs font-black truncate">{leg.name}</div>
                            <div className="mt-1 text-[8px] font-semibold bg-white/20 inline-block px-1.5 py-0.5 rounded">
                              {leg.leg_type.toUpperCase()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Database Information card */}
                  <div className="bg-slate-50 p-5 rounded-xl border">
                    <h4 className="font-bold text-slate-800 text-sm mb-2">Relational PostgreSQL Schema Mapping Details</h4>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-2xl mb-4">
                      The core backend handles tracking of <code>contests</code>, <code>contest_legs</code>, and <code>survivor_entries</code>. Eligible matchups are queryable per contest leg automatically. 
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-3 rounded border border-slate-200">
                        <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">contests Table</span>
                        <code className="text-xs block text-slate-700 leading-tight">id (UUID PRIMARY KEY)<br />name (VARCHAR)<br />year (INTEGER)<br />status (VARCHAR)</code>
                      </div>
                      <div className="bg-white p-3 rounded border border-slate-200">
                        <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">contest_legs Table</span>
                        <code className="text-xs block text-slate-700 leading-tight">id (UUID PRIMARY KEY)<br />contest_id (UUID REFERENCES)<br />leg_type ('regular','thanksgiving','christmas')<br />display_order (INTEGER)</code>
                      </div>
                      <div className="bg-white p-3 rounded border border-slate-200">
                        <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">survivor_picks Table</span>
                        <code className="text-xs block text-slate-700 leading-tight">id (UUID PRIMARY KEY)<br />entry_id (UUID FK)<br />team_id (VARCHAR FK)<br />pick_status (VARCHAR)</code>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================
                  VIEW 3: ENTRY MANAGEMENT
                  ======================================================== */}
              {activeTab === "entries" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Create New Entry Column */}
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
                    <h3 className="font-bold text-slate-900 text-base uppercase border-b pb-2">
                      New Contest Entry
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Circa Survivor permits multiple entries per single contestant (up to 10). Create as many entries as you like here to explore different optimal paths.
                    </p>

                    <form onSubmit={handleCreateEntry} className="space-y-4">
                      <div>
                        <label className="block text-xs text-slate-700 font-bold uppercase mb-1">
                          Entry Name / Designation *
                        </label>
                        <input
                          type="text"
                          required
                          value={newEntryName}
                          onChange={(e) => setNewEntryName(e.target.value)}
                          placeholder="e.g. Semi-Sharp #3 - Aggressive"
                          className="w-full text-xs rounded border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-700 font-bold uppercase mb-1">
                          Strategy Strategy Notes / Future Goals
                        </label>
                        <textarea
                          rows={3}
                          value={newEntryNotes}
                          onChange={(e) => setNewEntryNotes(e.target.value)}
                          placeholder="Describe target conservation goals, Thanksgiving priorities, etc..."
                          className="w-full text-xs rounded border border-slate-300 px-3 py-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs py-3 rounded transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>REGISTER SURVIVOR ENTRY</span>
                      </button>
                    </form>
                  </div>

                  {/* List of Existing Registered Entries */}
                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <h3 className="font-bold text-slate-900 text-base uppercase">
                        Registered Entries Overview ({entries.length})
                      </h3>
                      <button 
                        onClick={loadAllData}
                        className="text-xs font-bold text-indigo-600 hover:underline"
                      >
                        Refresh Postgres State
                      </button>
                    </div>

                    <div className="space-y-4">
                      {entries.map(ent => {
                        const countPicks = picks.filter(p => p.entry_id === ent.id).length;
                        
                        return (
                          <div 
                            key={ent.id} 
                            className={`p-4 rounded-xl border transition-all ${
                              selectedEntryId === ent.id 
                                ? "border-indigo-500 bg-indigo-50/20 ring-1 ring-indigo-500" 
                                : "border-slate-200 bg-white hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-extrabold text-sm text-slate-800">{ent.name}</h4>
                                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                                  ent.status === "alive" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                                }`}>
                                  {ent.status}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400 font-bold uppercase">Status Override:</span>
                                <select
                                  value={ent.status}
                                  onChange={async (e) => {
                                    const nextStatus = e.target.value;
                                    await fetch(`/api/entries/${ent.id}`, {
                                      method: "PATCH",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ status: nextStatus })
                                    });
                                    await loadAllData();
                                  }}
                                  className="text-xs bg-slate-100 border border-slate-300 rounded px-2 py-0.5 focus:outline-none"
                                >
                                  <option value="alive">Alive</option>
                                  <option value="eliminated">Eliminated</option>
                                </select>

                                <button
                                  onClick={() => handleDeleteEntry(ent.id)}
                                  className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 p-1 rounded transition-colors"
                                  title="Delete Entry"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <p className="text-xs text-slate-600 mt-2 italic">
                              "{ent.notes || 'No custom strategies logged for this entry yet. Click edit to customize.'}"
                            </p>

                            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap justify-between items-center">
                              <span className="text-xs text-slate-500">
                                Locked Selections: <strong>{countPicks} / 20 legs</strong>
                              </span>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedEntryId(ent.id);
                                    setActiveTab("picks");
                                  }}
                                  className="text-[11px] font-bold text-indigo-600 hover:underline"
                                >
                                  Optimize Picks →
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {entries.length === 0 && (
                        <div className="text-center py-10 bg-slate-50 rounded-xl">
                          <AlertTriangle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                          <p className="text-slate-600 font-semibold text-sm">No registered entries found.</p>
                          <p className="text-xs text-slate-400 mt-1">Please use the left form to register your first Survivor entry.</p>
                        </div>
                      )}
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
                      <span className="text-xs text-slate-500 block">
                        Locked selection for this Leg:
                      </span>
                      {currentPickForLeg ? (
                        <span className="text-sm font-black text-indigo-600 block animate-pulse">
                          🏈 {teams.find(t => t.id === currentPickForLeg.team_id)?.name.toUpperCase()} (LOCKED)
                        </span>
                      ) : (
                        <span className="text-xs italic text-rose-500 block">
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
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
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
                        <tbody className="divide-y divide-slate-100">
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
                                    isCurrentlyPickedLeg ? "bg-indigo-50/50 block-highlight border-l-4 border-indigo-500" : ""
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
                                  <td className="p-4 text-center">
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
                                        className={`px-3 py-1.5 rounded text-[11px] font-black tracking-wide transition-all ${
                                          isCurrentlyPickedLeg 
                                            ? "bg-emerald-600 text-white hover:bg-emerald-500" 
                                            : "bg-slate-900 text-white hover:bg-slate-850"
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

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Under strict Circa Survivor rules, <strong>reusing a team is permanently prohibited</strong>. This layout tracks available options. Teams marked as <span className="inline-block bg-slate-100 border border-slate-200 px-1.5 py-0.2 mx-1 text-slate-400 uppercase text-[10px] rounded font-bold">USED</span> cannot be chose in current scheduled games.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                    {teams.map(team => {
                      // Check if team has been picked previously by selected entry
                      const isUsed = picks.some(p => p.entry_id === selectedEntryId && p.team_id === team.id);
                      // Match pick object
                      const pickInfo = picks.find(p => p.entry_id === selectedEntryId && p.team_id === team.id);
                      // Match associated leg
                      const pickLeg = pickInfo ? legs.find(l => l.id === pickInfo.contest_leg_id) : null;

                      return (
                        <div 
                          key={team.id}
                          className={`relative border rounded-xl p-3 flex flex-col justify-between transition-all h-28 ${
                            isUsed 
                              ? "bg-slate-100/60 border-slate-200 opacity-60 flex-shrink-0" 
                              : "bg-white border-slate-200 hover:shadow-md hover:border-slate-300"
                          }`}
                        >
                          {/* Inner color tag */}
                          <div className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ backgroundColor: team.primary_color }}></div>
                          
                          <div className="space-y-1">
                            <span className="text-xs font-black block tracking-wider text-slate-400 uppercase">{team.abbreviation}</span>
                            <span className="text-xs font-bold text-slate-800 line-clamp-1">{team.name}</span>
                          </div>

                          <div className="pt-2 border-t border-slate-100">
                            {isUsed ? (
                              <div>
                                <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-black uppercase">
                                  USED
                                </span>
                                <span className="block text-[8px] text-slate-400 mt-1 whitespace-nowrap">
                                  {pickLeg ? pickLeg.name : "Early Leg"}
                                </span>
                              </div>
                            ) : (
                              <div>
                                <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold uppercase whitespace-nowrap">
                                  AVAILABLE
                                </span>
                                <span className="block text-[8px] text-slate-400 mt-1">
                                  Bye wk: {team.bye_week}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Future conservation plan check */}
                  <div className="bg-slate-50 p-4 rounded-xl border flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Conservation Check</h4>
                      <p className="text-xs text-slate-500">
                        Check availability of power house contenders for deep run weeks.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      {['kc', 'sf', 'bal', 'phi', 'det', 'buf'].map(tId => {
                        const tObj = teams.find(t => t.id === tId);
                        const isUsedObj = picks.some(p => p.entry_id === selectedEntryId && p.team_id === tId);
                        if (!tObj) return null;
                        return (
                          <div key={tId} className="flex items-center gap-1.5 bg-white border px-3 py-2 rounded-lg text-xs shadow-sm">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tObj.primary_color }}></span>
                            <span className="font-semibold">{tObj.abbreviation.toUpperCase()}</span>
                            <span className={`text-[10px] font-bold ${isUsedObj ? "text-rose-600" : "text-emerald-600"}`}>
                              {isUsedObj ? "USED" : "AVAILABLE"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

              {/* ========================================================
                  VIEW 6: THANKSGIVING INVENTORY DASHBOARD
                  ======================================================== */}
              {activeTab === "thanksgiving" && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
                  
                  <div className="flex items-start gap-4 border-b pb-4">
                    <Flame className="w-12 h-12 text-amber-500 mt-1" />
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-950">Thanksgiving / Black Friday Inventory Shield (Leg 13)</h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Leg 13 is a custom holiday window. You are ONLY eligible to pick teams executing games specifically on Thanksgiving Thursday or Black Friday.
                      </p>
                    </div>
                  </div>

                  {/* Thanksgiving Rules Breakdown */}
                  <div className="bg-amber-50/50 border border-amber-200 p-5 rounded-2xl space-y-3">
                    <h3 className="font-bold text-amber-900 text-sm">Contest Threat Risk:</h3>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Because only 6 teams typically execute games during this mini-slate, your pick selections are extremely constricted! If you burn Detroit (DET), Dallas (DAL), Chicago (CHI), or Green Bay (GB) too early during regular season Weeks 1-11, you may have literally ZERO eligible favored teams remaining when Thanksgiving arrives, causing automatic elimination.
                    </p>
                  </div>

                  {/* Analysis of Thanksgiving target list */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    <div className="space-y-4">
                      <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                        Target Thanksgiving Teams Checklist
                      </h3>

                      <div className="space-y-2">
                        {[
                          { team_id: "det", text: "Detroit Lions (Traditional Home Hosts) • High win probability but heavy field popularity." },
                          { team_id: "dal", text: "Dallas Cowboys (Traditional Home Hosts) • Good safety, but defense poses risk." },
                          { team_id: "gb", text: "Green Bay Packers • Excellent leverage strategy option." },
                          { team_id: "chi", text: "Chicago Bears • High risk leverage pick." }
                        ].map(({ team_id, text }) => {
                          const matchingTeam = teams.find(t => t.id === team_id);
                          const isUsed = picks.some(p => p.entry_id === selectedEntryId && p.team_id === team_id);

                          return (
                            <div key={team_id} className={`flex items-center justify-between p-3.5 border rounded-lg ${
                              isUsed ? "bg-slate-100 border-slate-200 opacity-60" : "bg-white border-slate-200"
                            }`}>
                              <div className="flex items-center gap-3">
                                <span className="w-4 h-4 rounded-full inline-block" style={{ backgroundColor: matchingTeam?.primary_color }}></span>
                                <div>
                                  <span className="font-bold text-xs text-slate-900 block">{matchingTeam?.name}</span>
                                  <span className="text-[10px] text-slate-500 block">{text}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`text-[10px] tracking-wide font-black uppercase px-2 py-0.5 rounded ${
                                  isUsed ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                                }`}>
                                  {isUsed ? "USED" : "AVAILABLE"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-2xl border space-y-4">
                      <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                        Statistical Optimization Report
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Our dynamic optimization calculation tracks the <strong>Holiday Safety Multiplier</strong> which heavily scales the weights of hosting teams specifically to keep them untouched during weeks 1 through 11.
                      </p>
                      
                      <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">Selected Entry:</span>
                          <span className="font-bold text-slate-800">{activeEntryObj?.name || "None"}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs border-t pt-2">
                          <span className="text-slate-500">Available Thanksgiving Options:</span>
                          <span className="font-bold text-emerald-600">
                            {['det', 'dal', 'gb', 'chi'].filter(id => !picks.some(p => p.entry_id === selectedEntryId && p.team_id === id)).length} Teams
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs border-t pt-2">
                          <span className="text-slate-500">Optimal Target Recommendation:</span>
                          <span className="font-bold text-indigo-600">DETROIT LIONS</span>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* ========================================================
                  VIEW 7: CHRISTMAS INVENTORY DASHBOARD
                  ======================================================== */}
              {activeTab === "christmas" && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
                  
                  <div className="flex items-start gap-4 border-b pb-4">
                    <Sparkles className="w-12 h-12 text-rose-600 mt-1" />
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-950">Christmas Day Inventory Suite (Leg 18)</h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Leg 18 isolates the standalone mid-week Christmas matches. Check which high utility contenders remain preserved.
                      </p>
                    </div>
                  </div>

                  <div className="bg-rose-50/50 border border-rose-200 p-5 rounded-2xl">
                    <h3 className="font-bold text-rose-900 text-sm mb-1">Double-Game Christmas Rules:</h3>
                    <p className="text-xs text-rose-800 leading-relaxed">
                      Only teams scheduled on Christmas Day games are eligible for selection in Leg 18. Conserving heavy titans like <strong>Kansas City Chiefs (KC)</strong>, <strong>San Francisco 49ers (SF)</strong>, <strong>Baltimore Ravens (BAL)</strong> or <strong>Los Angeles Rams (LAR)</strong> is critical to guarantee a secure, high-probability victory at this late point!
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    <div className="space-y-4">
                      <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                        Titans Preservation Checklist (Christmas Targets)
                      </h3>

                      <div className="space-y-2">
                        {[
                          { team_id: "kc", text: "Kansas City Chiefs • Supreme Christmas target option." },
                          { team_id: "sf", text: "San Francisco 49ers • Elite road safety potential." },
                          { team_id: "bal", text: "Baltimore Ravens • Dynamic run team with powerful statistics." },
                          { team_id: "lar", text: "Los Angeles Rams • Ideal mid-level safety play." }
                        ].map(({ team_id, text }) => {
                          const currentTeam = teams.find(t => t.id === team_id);
                          const isUsed = picks.some(p => p.entry_id === selectedEntryId && p.team_id === team_id);

                          return (
                            <div key={team_id} className={`flex items-center justify-between p-3.5 border rounded-lg ${
                              isUsed ? "bg-slate-100 border-slate-200 opacity-60" : "bg-white border-slate-200"
                            }`}>
                              <div className="flex items-center gap-3">
                                <span className="w-4 h-4 rounded-full inline-block" style={{ backgroundColor: currentTeam?.primary_color }}></span>
                                <div>
                                  <span className="font-bold text-xs text-slate-900 block">{currentTeam?.name}</span>
                                  <span className="text-[10px] text-slate-500 block">{text}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`text-[10px] tracking-wide font-black uppercase px-2 py-0.5 rounded ${
                                  isUsed ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                                }`}>
                                  {isUsed ? "USED" : "AVAILABLE"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-2xl border space-y-4">
                      <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                        Preservation Strategic Guidance
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Selecting KC, SF or BAL prior to week 16 gives quick short-term security but inflicts heavily on your Christmas Survival Equity. Balance this calculation closely!
                      </p>

                      <div className="p-4 bg-white rounded-lg border border-slate-200">
                        <div className="text-xs text-slate-500 mb-2">
                          <strong>Active Strategic Status:</strong>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded border">
                          💡 You currently have <strong className="text-emerald-600">
                            {['kc', 'sf', 'bal', 'lar'].filter(id => !picks.some(p => p.entry_id === selectedEntryId && p.team_id === id)).length} of 4
                          </strong> major titan teams available for Leg 18.
                        </p>
                      </div>
                    </div>

                  </div>

                </div>
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
                        <p className="text-xs text-indigo-200 mt-1 max-w-xl">
                          Calculated as: <strong>Win Probability × Leverage Multiplier × Future Value Multiplier × Holiday Safety Multiplier</strong>.
                        </p>
                      </div>
                      <div className="bg-white/10 px-4 py-2.5 rounded-xl border border-white/15">
                        <code className="text-xs font-mono text-indigo-250">
                          WP * LM * FVM * HSM = CES
                        </code>
                      </div>
                    </div>
                  </div>

                  {loadingRecs ? (
                    <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-2"></div>
                      <p className="text-xs">Processing Contest Equity Ratios...</p>
                    </div>
                  ) : recReport ? (
                    <div className="space-y-6">
                      
                      <div className="border-l-4 border-indigo-600 bg-indigo-50/20 p-4 rounded-r-lg">
                        <h4 className="text-sm font-bold text-slate-900">Weekly Strategic Summary:</h4>
                        <p className="text-xs text-slate-600 leading-relaxed mt-1">
                          You are evaluating <strong>{recReport.leg?.name}</strong> for <strong>{recReport.entry?.name}</strong>. Previously chosen teams on this entry:{" "}
                          <span className="font-semibold text-slate-800">
                            {recReport.used_teams?.length > 0 
                              ? recReport.used_teams.map((code: string) => code.toUpperCase()).join(", ") 
                              : "No prior picks."}
                          </span>
                        </p>
                      </div>

                      {/* Top Recommended List with bars */}
                      <div className="space-y-4">
                        <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">
                          Top Dynamic Recommendations
                        </h3>

                        <div className="space-y-3">
                          {recReport.recommendations?.map((item: any, index: number) => (
                            <div key={item.team.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm space-y-4 hover:shadow transition-shadow">
                              
                              {/* Header details */}
                              <div className="flex flex-wrap justify-between items-start gap-2">
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-bold text-slate-400">#{index + 1}</span>
                                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: item.team.primary_color }}></div>
                                  <div>
                                    <h4 className="font-black text-slate-900 text-sm">
                                      {item.team.name} ({item.team.abbreviation.toUpperCase()})
                                    </h4>
                                    <span className="text-[10px] text-slate-400">
                                      Primary Color Tag: {item.team.primary_color} • Secondary: {item.team.secondary_color}
                                    </span>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                                    Contest Equity Score
                                  </span>
                                  <span className="text-md font-black text-indigo-700">
                                    {item.line.contest_equity_score.toFixed(3)}
                                  </span>
                                </div>
                              </div>

                              {/* Insight paragraph */}
                              <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100">
                                💡 <strong>Strategic Insight:</strong> {item.insight}
                              </p>

                              {/* Visualization Bars */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                <div>
                                  <div className="flex justify-between text-[11px] mb-1">
                                    <span className="text-slate-500">Win Probability</span>
                                    <span className="font-bold">{(item.line.win_probability * 100).toFixed(1)}%</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-emerald-500" 
                                      style={{ width: `${item.line.win_probability * 100}%` }}
                                    ></div>
                                  </div>
                                </div>

                                <div>
                                  <div className="flex justify-between text-[11px] mb-1">
                                    <span className="text-slate-500">Pick Popularity</span>
                                    <span className="font-bold">{(item.line.pick_popularity * 100).toFixed(1)}%</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-amber-500" 
                                      style={{ width: `${item.line.pick_popularity * 100}%` }}
                                    ></div>
                                  </div>
                                </div>

                                <div>
                                  <div className="flex justify-between text-[11px] mb-1">
                                    <span className="text-slate-500">Future Value</span>
                                    <span className="font-bold">{(item.line.future_value * 100).toFixed(1)}%</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-rose-500" 
                                      style={{ width: `${item.line.future_value * 100}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>

                              {/* Pick lock selector directly within recommendations */}
                              <div className="pt-2 border-t flex justify-end">
                                <button 
                                  onClick={() => {
                                    handleLockPick(item.team.id);
                                    setActiveTab("picks");
                                  }}
                                  className="bg-indigo-600 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded transition-colors"
                                >
                                  Lock in {item.team.abbreviation.toUpperCase()} Choice
                                </button>
                              </div>

                            </div>
                          ))}

                          {recReport.recommendations?.length === 0 && (
                            <div className="text-center py-6 text-slate-500 italic">
                              No compatible teams available to pick for this leg.
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="text-center py-10 bg-slate-50 border rounded-xl">
                      <p className="text-slate-600">Please choose an active Entry &amp; Leg above to process recommendations.</p>
                    </div>
                  )}

                </div>
              )}

            </>
          )}

        </div>

      </main>

    </div>
  );
}
