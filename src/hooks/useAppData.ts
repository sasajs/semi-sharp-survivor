import React, { useState, useEffect } from "react";
import { 
  Contest, 
  ContestLeg, 
  Team, 
  Game, 
  TeamWeekLine, 
  SurvivorEntry, 
  SurvivorPick,
  ContestType 
} from "../types";
import { apiService } from "../services/apiService";

export function useAppData() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Domain state
  const [contests, setContests] = useState<Contest[]>([]);
  const [legs, setLegs] = useState<ContestLeg[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [entries, setEntries] = useState<SurvivorEntry[]>([]);
  const [picks, setPicks] = useState<SurvivorPick[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [lines, setLines] = useState<TeamWeekLine[]>([]);

  // Selection state
  const [selectedEntryId, setSelectedEntryId] = useState<string>("");
  const [selectedLegId, setSelectedLegId] = useState<string>("leg-1");

  // Recommendation Report Data
  const [recReport, setRecReport] = useState<any>(null);
  const [loadingRecs, setLoadingRecs] = useState<boolean>(false);

  // New forms UI state
  const [newEntryName, setNewEntryName] = useState<string>("");
  const [newEntryNotes, setNewEntryNotes] = useState<string>("");
  const [newEntryContestTypeId, setNewEntryContestTypeId] = useState<string>("circa");
  const [contestTypes, setContestTypes] = useState<ContestType[]>([]);
  
  // Feedback banners
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Loading Indicator
  const [loading, setLoading] = useState<boolean>(true);

  // Initial Data Fetching
  const loadAllData = async (shouldAutoSelect: boolean = true) => {
    try {
      setLoading(true);
      const [resC, resL, resT, resE, resP, resCT] = await Promise.all([
        apiService.fetchContests(),
        apiService.fetchLegs(),
        apiService.fetchTeams(),
        apiService.fetchEntries(),
        apiService.fetchPicks(),
        apiService.fetchContestTypes()
      ]);

      setContests(resC);
      setLegs(resL);
      setTeams(resT);
      setEntries(resE);
      setPicks(resP);
      setContestTypes(resCT);

      // Auto-select first entry if exists and nothing is selected
      if (resE.length > 0 && (shouldAutoSelect || !selectedEntryId)) {
        const aliveEntry = resE.find((e: any) => e.status === "alive");
        setSelectedEntryId(aliveEntry ? aliveEntry.id : resE[0].id);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error loading application database: ", err);
      setErrorMsg("Failed to connect to full-stack API server. Please retry.");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData(true);
  }, []);

  // Fetch games & lines whenever the active leg changes
  useEffect(() => {
    if (!selectedLegId) return;
    
    const fetchLegSpecifics = async () => {
      try {
        const [resG, resLines] = await Promise.all([
          apiService.fetchGames(selectedLegId),
          apiService.fetchLines(selectedLegId)
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
        const data = await apiService.fetchRecommendations(selectedEntryId, selectedLegId);
        setRecReport(data);
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
      return;
    }
    if (!selectedLegId) {
      setErrorMsg("Please choose an NFL Contest Leg.");
      return;
    }

    try {
      const data = await apiService.makePick(selectedEntryId, selectedLegId, teamId);
      setSuccessMsg(`Successfully selected and locked the ${teams.find(t => t.id === teamId)?.name}!`);
      setErrorMsg("");
      await loadAllData(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Network failure occurred submitting survivor pick.");
    }
  };

  // Create Entry Action
  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntryName.trim()) return;

    try {
      const added = await apiService.createEntry(newEntryName, newEntryNotes, newEntryContestTypeId);
      setSuccessMsg(`Entry '${added.name}' created successfully.`);
      setNewEntryName("");
      setNewEntryNotes("");
      setNewEntryContestTypeId("circa");
      await loadAllData(false);
      setSelectedEntryId(added.id);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Error creating entry.");
    }
  };

  // Delete Entry Action
  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this Entry from Circa Survivor?")) {
      return;
    }
    try {
      await apiService.deleteEntry(id);
      setSuccessMsg("Entry deleted safely.");
      await loadAllData(false);
      if (selectedEntryId === id) {
        setSelectedEntryId("");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to delete entry.");
    }
  };

  // Database reseed/reset back to clean template constraints
  const handleResetAppDb = async () => {
    if (!window.confirm("This will reset all Survivor Picks, Alive statuses, and restore original clean mock configurations. Proceed?")) {
      return;
    }
    try {
      await apiService.resetDatabase();
      setSuccessMsg("Database reseeded with fresh NFL lines & pristine survivor configurations.");
      setErrorMsg("");
      setSelectedLegId("leg-1");
      await loadAllData(true);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to reset database state.");
    }
  };

  const activeEntryObj = entries.find(e => e.id === selectedEntryId);
  const activeLegObj = legs.find(l => l.id === selectedLegId);

  const totalEntriesCount = entries.length;
  const aliveEntriesCount = entries.filter(e => e.status === "alive").length;
  const eliminatedEntriesCount = entries.filter(e => e.status === "eliminated").length;
  const currentPickForLeg = picks.find(p => p.entry_id === selectedEntryId && p.contest_leg_id === selectedLegId);

  return {
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
  };
}
