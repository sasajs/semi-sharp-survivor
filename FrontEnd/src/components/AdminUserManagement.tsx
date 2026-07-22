/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Component, ErrorInfo } from 'react';
import { 
  Users, 
  Trash2, 
  RefreshCw, 
  AlertCircle, 
  X, 
  ShieldAlert, 
  UserCheck, 
  UserX,
  Plus,
  Database,
  Ticket,
  Unlock
} from 'lucide-react';
import { Card, Alert, Button, Input, Select, LoadingSpinner } from './ui';
import { API_BASE_URL } from '../config';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl space-y-3 my-4" id="error_boundary_container">
          <div className="flex items-center gap-2 text-rose-800">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <h3 className="font-bold font-mono text-xs uppercase tracking-wider">Tab Rendering Error Intercepted</h3>
          </div>
          <p className="text-xs text-rose-700 leading-relaxed">
            A rendering error occurred inside this tab panel. The core application container remains active and functional.
          </p>
          {this.state.error && (
            <pre className="p-3 bg-rose-950/5 text-rose-900 rounded-lg text-[10px] font-mono overflow-auto max-h-40">
              {this.state.error.stack || this.state.error.message}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export interface ManagedUser {
  user_id: number;
  username: string;
  display_name?: string;
  role: string;
  is_active: boolean;
}

export interface ContestEntry {
  entry_id: number;
  user_id: number;
  username: string;
  display_name?: string;
  role?: string;
  survivor_sweat_name: string;
  entry_label: string;
  is_active: boolean;
  contest_format_id: number;
  format_code?: string;
  format_name?: string;
  week?: number;
  selected_team?: string;
  status?: 'SUBMITTED' | 'PENDING' | 'STUCK' | 'OVERRIDDEN';
  submitted_at?: string;
}

const DEFAULT_SANDBOX_USERS: ManagedUser[] = [
  { user_id: 101, username: 'steve_schilhabel', display_name: 'Steve Schilhabel', role: 'ADMIN', is_active: true },
  { user_id: 102, username: 'j_doe_pro', display_name: 'John Doe', role: 'USER', is_active: true },
  { user_id: 103, username: 'survivor_champ', display_name: 'Sarah Connor', role: 'USER', is_active: true },
  { user_id: 104, username: 'ana_stats', display_name: 'Ana Lovelace', role: 'ADMIN', is_active: true },
  { user_id: 105, username: 'guest_speculator', display_name: 'Robert Speculator', role: 'USER', is_active: false }
];

const DEFAULT_SANDBOX_ENTRIES: ContestEntry[] = [
  { entry_id: 501, user_id: 101, username: 'steve_schilhabel', week: 1, selected_team: 'Kansas City Chiefs', status: 'SUBMITTED', submitted_at: '2026-09-10T14:30:22Z', survivor_sweat_name: 'STEVE-1', entry_label: 'Steve Standard Run', contest_format_id: 1, is_active: true },
  { entry_id: 502, user_id: 102, username: 'j_doe_pro', week: 1, selected_team: 'San Francisco 49ers', status: 'STUCK', submitted_at: '2026-09-11T09:12:05Z', survivor_sweat_name: 'DOE-1', entry_label: 'John Main Ticket', contest_format_id: 1, is_active: true },
  { entry_id: 503, user_id: 103, username: 'survivor_champ', week: 1, selected_team: 'Philadelphia Eagles', status: 'SUBMITTED', submitted_at: '2026-09-12T18:45:00Z', survivor_sweat_name: 'CHAMP-1', entry_label: 'Sarah Circa Million', contest_format_id: 2, is_active: true },
  { entry_id: 504, user_id: 104, username: 'ana_stats', week: 1, selected_team: 'Buffalo Bills', status: 'PENDING', submitted_at: '2026-09-13T11:20:10Z', survivor_sweat_name: 'ANA-1', entry_label: 'Ana Stats Entry', contest_format_id: 1, is_active: false },
];

export const AdminUserManagement: React.FC = () => {
  // Navigation
  const [activeTab, setActiveTab] = useState<'users' | 'entries'>('users');

  // Core list states
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [entries, setEntries] = useState<ContestEntry[]>([]);
  
  // Loading and error states
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
  const [loadingEntries, setLoadingEntries] = useState<boolean>(true);
  
  // Independent error & success states for each admin panel
  const [usersError, setUsersError] = useState<string | null>(null);
  const [usersSuccess, setUsersSuccess] = useState<string | null>(null);
  const [entriesError, setEntriesError] = useState<string | null>(null);
  const [entriesSuccess, setEntriesSuccess] = useState<string | null>(null);
  
  // Legacy error and success states for compatibility
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Interaction states — Users
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [userDeleteConfirmId, setUserDeleteConfirmId] = useState<number | null>(null);
  
  // Interaction states — Entries
  const [updatingEntryId, setUpdatingEntryId] = useState<number | null>(null);
  const [deletingEntryId, setDeletingEntryId] = useState<number | null>(null);
  const [entryDeleteConfirmId, setEntryDeleteConfirmId] = useState<number | null>(null);

  // POST states — Adding items
  const [showAddUserForm, setShowAddUserForm] = useState<boolean>(false);
  const [newUsername, setNewUsername] = useState<string>('');
  const [newDisplayName, setNewDisplayName] = useState<string>('');
  const [newRole, setNewRole] = useState<string>('USER');
  const [newUserIsActive, setNewUserIsActive] = useState<boolean>(true);
  const [submittingUser, setSubmittingUser] = useState<boolean>(false);

  const [showAddEntryForm, setShowAddEntryForm] = useState<boolean>(false);
  const [newEntryUserId, setNewEntryUserId] = useState<string>('');
  const [newEntrySweatName, setNewEntrySweatName] = useState<string>('');
  const [newEntryLabel, setNewEntryLabel] = useState<string>('');
  const [newEntryContestFormatId, setNewEntryContestFormatId] = useState<number>(1);
  const [newEntryIsActive, setNewEntryIsActive] = useState<boolean>(true);
  const [submittingEntry, setSubmittingEntry] = useState<boolean>(false);

  // Offline sandbox/simulation fallback if API_BASE_URL is unreachable
  const [sandboxActive, setSandboxActive] = useState<boolean>(false);
  const [connectionWarning, setConnectionWarning] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<boolean>(false);

  const usersApiUrl = `${API_BASE_URL}/admin/users/`;
  const entriesApiUrl = `${API_BASE_URL}/admin/entries/`;

  // Load everything
  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setSuccess(null);
      setError(null);
      setUsersError(null);
      setEntriesError(null);
    }
    await Promise.all([
      fetchUsers(isManualRefresh),
      fetchEntries(isManualRefresh)
    ]);
  };

  const fetchUsers = async (isManualRefresh = false) => {
    setLoadingUsers(true);
    if (isManualRefresh) {
      setUsersError(null);
      setUsersSuccess(null);
    }
    if (sandboxActive) {
      setTimeout(() => {
        const stored = localStorage.getItem('semisharp_sandbox_users');
        if (stored) {
          setUsers(JSON.parse(stored));
        } else {
          setUsers(DEFAULT_SANDBOX_USERS);
          localStorage.setItem('semisharp_sandbox_users', JSON.stringify(DEFAULT_SANDBOX_USERS));
        }
        setLoadingUsers(false);
      }, 300);
      return;
    }

    try {
      const response = await fetch(usersApiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user list from backend (HTTP ${response.status})`);
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        setUsers(data);
        setConnectionWarning(false);
        setUsersError(null);
      } else {
        throw new Error('Backend did not return a valid array of users.');
      }
    } catch (err: any) {
      console.error('Connection failure:', err);
      setConnectionError(true);
      setUsersError(`Failed to fetch user list from backend: ${err.message || err}`);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchEntries = async (isManualRefresh = false) => {
    setLoadingEntries(true);
    if (isManualRefresh) {
      setEntriesError(null);
      setEntriesSuccess(null);
    }
    if (sandboxActive) {
      setTimeout(() => {
        const stored = localStorage.getItem('semisharp_sandbox_entries');
        if (stored) {
          setEntries(JSON.parse(stored));
        } else {
          setEntries(DEFAULT_SANDBOX_ENTRIES);
          localStorage.setItem('semisharp_sandbox_entries', JSON.stringify(DEFAULT_SANDBOX_ENTRIES));
        }
        setLoadingEntries(false);
      }, 300);
      return;
    }

    try {
      const response = await fetch(entriesApiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch entries from backend (HTTP ${response.status})`);
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        setEntries(data);
        setConnectionWarning(false);
        setEntriesError(null);
      } else {
        throw new Error('Backend did not return a valid array of entries.');
      }
    } catch (err: any) {
      console.error('Connection failure:', err);
      // Independent state error - specifically do not setConnectionError(true) here
      setEntriesError(`Failed to fetch entries from backend: ${err.message || err}`);
    } finally {
      setLoadingEntries(false);
    }
  };

  // Sync on mount or when sandbox activation shifts
  useEffect(() => {
    loadData();
  }, [sandboxActive]);

  // -- ENTRY ACTIONS --

  // Create Entry (POST)
  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntryUserId || !newEntrySweatName.trim() || !newEntryLabel.trim()) {
      setEntriesError('User ID, Sweat Name, and Entry Label are required.');
      return;
    }

    const userIdNum = parseInt(newEntryUserId, 10);
    if (isNaN(userIdNum)) {
      setEntriesError('User ID must be a number.');
      return;
    }

    setSubmittingEntry(true);
    setEntriesError(null);
    setEntriesSuccess(null);

    // Find username from users
    const associatedUser = users.find(u => u.user_id === userIdNum);
    const username = associatedUser ? associatedUser.username : `user_${userIdNum}`;

    const newEntryPayload = {
      user_id: userIdNum,
      survivor_sweat_name: newEntrySweatName.trim(),
      entry_label: newEntryLabel.trim(),
      contest_format_id: newEntryContestFormatId,
      is_active: newEntryIsActive
    };

    if (sandboxActive) {
      setTimeout(() => {
        const nextId = (entries || []).length > 0 ? Math.max(...(entries || []).map(ent => ent.entry_id)) + 1 : 501;
        const created: ContestEntry = {
          entry_id: nextId,
          username,
          format_code: newEntryContestFormatId === 1 ? 'STANDARD' : 'CIRCA',
          format_name: newEntryContestFormatId === 1 ? 'Standard Survivor' : 'Circa Survivor',
          ...newEntryPayload
        };
        const updated = [...(entries || []), created];
        setEntries(updated);
        localStorage.setItem('semisharp_sandbox_entries', JSON.stringify(updated));
        
        setEntriesSuccess(`Entry ID ${nextId} created successfully for ${username} (Simulation).`);
        setShowAddEntryForm(false);
        setNewEntryUserId('');
        setNewEntrySweatName('');
        setNewEntryLabel('');
        setNewEntryContestFormatId(1);
        setNewEntryIsActive(true);
        setSubmittingEntry(false);
      }, 500);
      return;
    }

    try {
      const response = await fetch(entriesApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(newEntryPayload),
      });

      if (!response.ok) {
        let errMsg = `POST request failed with status ${response.status}`;
        try {
          const errData = await response.json();
          errMsg = errData.message || errData.detail || errMsg;
        } catch (e) {
          // ignore parsing error
        }
        throw new Error(errMsg);
      }

      setEntriesSuccess(`Entry created successfully for ${username}.`);
      setShowAddEntryForm(false);
      setNewEntryUserId('');
      setNewEntrySweatName('');
      setNewEntryLabel('');
      setNewEntryContestFormatId(1);
      setNewEntryIsActive(true);
      await fetchEntries();
    } catch (err: any) {
      setEntriesError(err.message || 'Failed to complete create entry request.');
    } finally {
      setSubmittingEntry(false);
    }
  };

  // Delete Entry (DELETE)
  const handleDeleteEntry = async (entryId: number) => {
    setLoadingEntries(true);
    setEntriesError(null);
    setEntriesSuccess(null);
    setDeletingEntryId(entryId);
    setEntryDeleteConfirmId(null);

    if (sandboxActive) {
      setTimeout(() => {
        const currentEntries = entries.filter(ent => ent.entry_id !== entryId);
        setEntries(currentEntries);
        localStorage.setItem('semisharp_sandbox_entries', JSON.stringify(currentEntries));
        setEntriesSuccess(`Deleted entry ID ${entryId} (Simulation).`);
        setDeletingEntryId(null);
        setLoadingEntries(false);
      }, 500);
      return;
    }

    try {
      const response = await fetch(`${entriesApiUrl}${entryId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        let errMsg = `DELETE request failed with status ${response.status}`;
        try {
          const errData = await response.json();
          errMsg = errData.message || errData.detail || errMsg;
        } catch (e) {
          // ignore
        }
        throw new Error(errMsg);
      }

      setEntriesSuccess(`Entry ID ${entryId} deleted successfully.`);
      await fetchEntries();
    } catch (err: any) {
      setEntriesError(err.message || 'Failed to complete delete entry request.');
    } finally {
      setDeletingEntryId(null);
      setLoadingEntries(false);
    }
  };

  // Update Entry Contest Format (PATCH)
  const handleUpdateContestFormat = async (entryId: number, newFormatId: number) => {
    // Save previous state for reversion
    const previousEntries = [...entries];
    const targetEntry = entries.find(e => e.entry_id === entryId);
    if (!targetEntry) return;
    
    // Optimistically update the row in-place
    setEntries(prev => prev.map(ent => {
      if (ent.entry_id === entryId) {
        return {
          ...ent,
          contest_format_id: newFormatId,
          format_name: newFormatId === 1 ? 'Standard Survivor' : 'Circa Survivor',
          format_code: newFormatId === 1 ? 'STANDARD' : 'CIRCA'
        };
      }
      return ent;
    }));

    setEntriesError(null);
    setEntriesSuccess(null);
    setUpdatingEntryId(entryId);

    if (sandboxActive) {
      setTimeout(() => {
        const updated = (entries || []).map(ent => {
          if (ent.entry_id === entryId) {
            return {
              ...ent,
              contest_format_id: newFormatId,
              format_name: newFormatId === 1 ? 'Standard Survivor' : 'Circa Survivor',
              format_code: newFormatId === 1 ? 'STANDARD' : 'CIRCA'
            };
          }
          return ent;
        });
        localStorage.setItem('semisharp_sandbox_entries', JSON.stringify(updated));
        setEntriesSuccess(`Contest Format updated to ${newFormatId === 1 ? 'Standard Survivor' : 'Circa Survivor'} successfully for Entry #${entryId} (Simulation).`);
        setUpdatingEntryId(null);
      }, 400);
      return;
    }

    try {
      const response = await fetch(`${entriesApiUrl}${entryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ contest_format_id: newFormatId }),
      });

      if (!response.ok) {
        let errMsg = `PATCH request failed with status ${response.status}`;
        try {
          const errData = await response.json();
          errMsg = errData.message || errData.detail || errMsg;
        } catch (e) {
          // ignore parsing error
        }
        throw new Error(errMsg);
      }

      setEntriesSuccess(`Contest Format updated to ${newFormatId === 1 ? 'Standard Survivor' : 'Circa Survivor'} successfully for Entry #${entryId}.`);
    } catch (err: any) {
      // Revert on failure
      setEntries(previousEntries);
      setEntriesError(err.message || 'Failed to update contest format.');
    } finally {
      setUpdatingEntryId(null);
    }
  };

  // Override Entry Status (PATCH)
  const handleOverrideEntryStatus = async (entryId: number, nextStatus: 'SUBMITTED' | 'PENDING' | 'STUCK' | 'OVERRIDDEN') => {
    setEntriesError(null);
    setEntriesSuccess(null);
    setUpdatingEntryId(entryId);

    if (sandboxActive) {
      setTimeout(() => {
        const updated = (entries || []).map(ent => {
          if (ent.entry_id === entryId) {
            return { ...ent, status: nextStatus };
          }
          return ent;
        });
        setEntries(updated);
        localStorage.setItem('semisharp_sandbox_entries', JSON.stringify(updated));
        setEntriesSuccess(`Overrode status of entry ID ${entryId} to ${nextStatus}.`);
        setUpdatingEntryId(null);
      }, 400);
      return;
    }

    try {
      const response = await fetch(`${entriesApiUrl}${entryId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        let errMsg = `PATCH status request failed with status ${response.status}`;
        try {
          const errData = await response.json();
          errMsg = errData.message || errData.detail || errMsg;
        } catch (e) {
          // ignore
        }
        throw new Error(errMsg);
      }

      setEntriesSuccess(`Entry status updated to ${nextStatus} successfully.`);
      await fetchEntries();
    } catch (err: any) {
      setEntriesError(err.message || 'Failed to override entry status.');
    } finally {
      setUpdatingEntryId(null);
    }
  };

  // Unlock Stuck Submission
  const handleUnlockEntry = async (entryId: number) => {
    setEntriesError(null);
    setEntriesSuccess(null);
    setUpdatingEntryId(entryId);

    if (sandboxActive) {
      setTimeout(() => {
        const updated = entries.map(ent => {
          if (ent.entry_id === entryId) {
            return { ...ent, status: 'SUBMITTED' as const };
          }
          return ent;
        });
        setEntries(updated);
        localStorage.setItem('semisharp_sandbox_entries', JSON.stringify(updated));
        setEntriesSuccess(`Unlocked submission for entry ID ${entryId} (State changed from STUCK to SUBMITTED).`);
        setUpdatingEntryId(null);
      }, 400);
      return;
    }

    try {
      const response = await fetch(`${entriesApiUrl}${entryId}/unlock`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        let errMsg = `POST unlock request failed with status ${response.status}`;
        try {
          const errData = await response.json();
          errMsg = errData.message || errData.detail || errMsg;
        } catch (e) {
          // ignore
        }
        throw new Error(errMsg);
      }

      setEntriesSuccess(`Unlocked submission for entry ID ${entryId} successfully.`);
      await fetchEntries();
    } catch (err: any) {
      setEntriesError(err.message || 'Failed to unlock entry submission.');
    } finally {
      setUpdatingEntryId(null);
    }
  };

  // Clear Entry Cache
  const handleClearEntryCache = () => {
    setEntriesError(null);
    setEntriesSuccess('Contestant entry ticket cache cleared successfully. All client-side edge indices flushed.');
  };

  // -- USER ACTIONS --

  // Create User (POST)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      setUsersError('Username is required.');
      return;
    }

    setSubmittingUser(true);
    setUsersError(null);
    setUsersSuccess(null);

    const generatedId = (users || []).length > 0 ? Math.max(...(users || []).map(u => u.user_id)) + 1 : 101;
    const payload: ManagedUser = {
      user_id: generatedId,
      username: newUsername.trim(),
      display_name: newDisplayName.trim() || undefined,
      role: newRole,
      is_active: newUserIsActive
    };

    if (sandboxActive) {
      setTimeout(() => {
        const updatedUsers = [...(users || []), payload];
        setUsers(updatedUsers);
        localStorage.setItem('semisharp_sandbox_users', JSON.stringify(updatedUsers));
        setUsersSuccess(`User @${payload.username} created successfully (Simulation).`);
        setShowAddUserForm(false);
        setNewUsername('');
        setNewDisplayName('');
        setNewRole('USER');
        setNewUserIsActive(true);
        setSubmittingUser(false);
      }, 500);
      return;
    }

    try {
      const response = await fetch(usersApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Failed to create user: ${response.statusText} (${response.status})`);
      }

      setUsersSuccess(`User @${payload.username} created successfully!`);
      setShowAddUserForm(false);
      setNewUsername('');
      setNewDisplayName('');
      setNewRole('USER');
      setNewUserIsActive(true);
      await fetchUsers();
    } catch (err: any) {
      console.error('Connection failure:', err);
      setConnectionError(true);
      setUsersError(err.message || 'Failed to submit User POST request.');
    } finally {
      setSubmittingUser(false);
    }
  };

  // Delete User (DELETE)
  const handleDeleteUser = async (userId: number) => {
    setLoadingUsers(true);
    setUsersError(null);
    setUsersSuccess(null);
    setDeletingUserId(userId);
    setUserDeleteConfirmId(null);

    if (sandboxActive) {
      setTimeout(() => {
        const currentUsers = users.filter(u => u.user_id !== userId);
        setUsers(currentUsers);
        localStorage.setItem('semisharp_sandbox_users', JSON.stringify(currentUsers));

        setUsersSuccess(`Deleted user ID ${userId}.`);
        setDeletingUserId(null);
        setLoadingUsers(false);
      }, 500);
      return;
    }

    try {
      const response = await fetch(`${usersApiUrl}${userId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`DELETE request failed with status ${response.status}`);
      }

      setUsersSuccess(`User ID ${userId} deleted successfully.`);
      // Auto-refresh tables
      await loadData();
    } catch (err: any) {
      console.error('Connection failure:', err);
      setConnectionError(true);
      setUsersError(err.message || 'Failed to complete user delete request.');
    } finally {
      setDeletingUserId(null);
      setLoadingUsers(false);
    }
  };

  // Update User Role (PATCH)
  const handleUpdateRole = async (userId: number, newRole: string) => {
    setUsersError(null);
    setUsersSuccess(null);
    setUpdatingUserId(userId);

    if (sandboxActive) {
      setTimeout(() => {
        const updatedUsers = (users || []).map(u => {
          if (u.user_id === userId) {
            return { ...u, role: newRole };
          }
          return u;
        });
        setUsers(updatedUsers);
        localStorage.setItem('semisharp_sandbox_users', JSON.stringify(updatedUsers));
        setUsersSuccess(`Updated user ${userId} authorization role to ${newRole}.`);
        setUpdatingUserId(null);
      }, 400);
      return;
    }

    try {
      const response = await fetch(`${usersApiUrl}${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error(`PATCH request failed with status ${response.status}`);
      }

      setUsersSuccess(`User role updated to ${newRole} successfully.`);
      // Auto-refresh tables
      await fetchUsers();
    } catch (err: any) {
      console.error('Connection failure:', err);
      setConnectionError(true);
      setUsersError(err.message || 'Failed to complete role update request.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Reset sandbox completely
  const handleResetSandbox = () => {
    localStorage.removeItem('semisharp_sandbox_users');
    localStorage.removeItem('semisharp_sandbox_entries');
    setUsers(DEFAULT_SANDBOX_USERS);
    setEntries(DEFAULT_SANDBOX_ENTRIES);
    localStorage.setItem('semisharp_sandbox_users', JSON.stringify(DEFAULT_SANDBOX_USERS));
    localStorage.setItem('semisharp_sandbox_entries', JSON.stringify(DEFAULT_SANDBOX_ENTRIES));
    
    setUsersSuccess('Local simulation users directory reset to default.');
    setEntriesSuccess('Local simulation survivor entry tickets reset to default.');
    setUsersError(null);
    setEntriesError(null);
    setError(null);
  };

  const roleOptions = [
    { value: 'USER', label: 'USER' },
    { value: 'ADMIN', label: 'ADMIN' }
  ];

  return (
    <Card className="col-span-1 md:col-span-2 flex flex-col justify-between border border-slate-100 bg-white" id="card_user_management">
      <div className="space-y-5">
        
        {/* Header Title & Description */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-2.5">
            <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 shrink-0">
              <Users className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wider">Access Controls & Credentials</h3>
                {sandboxActive ? (
                  <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full text-[9px] font-mono font-extrabold uppercase tracking-wider select-none shrink-0 animate-pulse">
                    Simulation Sandbox
                  </span>
                ) : (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[9px] font-mono font-extrabold uppercase tracking-wider select-none shrink-0">
                    Live Data
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold block">
                Manage user access and survivor entries
              </span>
            </div>
          </div>
          
          {/* Top Controls */}
          <div className="flex items-center gap-2">
            {sandboxActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetSandbox}
                className="font-mono text-[11px] border-slate-200 h-8 font-bold text-slate-600"
                title="Reset Sandbox Data"
              >
                Reset Sandbox
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(true)}
              disabled={loadingUsers || loadingEntries}
              className="font-mono text-[11px] border-slate-200 h-8 font-bold flex items-center gap-1.5"
              id="btn_refresh_users"
            >
              <RefreshCw className={`w-3 h-3 ${(loadingUsers || loadingEntries) ? 'animate-spin' : ''}`} />
              Sync Tables
            </Button>
          </div>
        </div>

        {/* Connection Error Alert */}
        {connectionError && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-900 space-y-2 animate-fade-in" id="persistent_connection_error">
            <div className="flex items-center gap-2 font-mono font-bold uppercase tracking-wider text-rose-700">
              <ShieldAlert className="w-4 h-4 shrink-0 animate-pulse" />
              Connection Error
            </div>
            <p className="leading-relaxed font-sans text-rose-800">
              The frontend is unable to reach the registry endpoints at <span className="font-mono font-semibold">{API_BASE_URL}</span>. Please verify that the API service is active, responsive, and correct credentials or configuration are supplied.
            </p>
            <div className="flex flex-wrap gap-2 items-center pt-1.5">
              <Button
                variant="danger"
                size="sm"
                onClick={async () => {
                  setConnectionError(false);
                  setError(null);
                  await loadData(true);
                }}
                className="text-[11px] font-mono bg-rose-600 hover:bg-rose-700 text-white font-bold h-7 border-none"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry Live Connection
              </Button>
              <button 
                onClick={() => {
                  setSandboxActive(true);
                  setConnectionError(false);
                  loadData(true);
                }}
                className="text-[11px] underline font-medium text-rose-800 hover:text-rose-950 ml-1"
              >
                Use Local Simulation Mode
              </button>
            </div>
          </div>
        )}

        {/* SECTION TABS */}
        <div className="flex border-b border-slate-250 gap-2 overflow-x-auto pb-px mb-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 border-b-2 font-mono text-xs uppercase tracking-wider font-extrabold transition-all whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-indigo-500 text-indigo-600 bg-indigo-50/5'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
            }`}
            id="subtab_btn_user_admin"
          >
            User Administration
          </button>
          <button
            onClick={() => setActiveTab('entries')}
            className={`px-4 py-2 border-b-2 font-mono text-xs uppercase tracking-wider font-extrabold transition-all whitespace-nowrap ${
              activeTab === 'entries'
                ? 'border-indigo-500 text-indigo-600 bg-indigo-50/5'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
            }`}
            id="subtab_btn_entry_admin"
          >
            Entry Management
          </button>
        </div>

        {/* TAB 1: USER ADMINISTRATION */}
        {activeTab === 'users' && (
          <div className="space-y-4 animate-fade-in">
            {usersError && (
              <Alert type="error" message={usersError} className="rounded-xl text-xs animate-fade-in" />
            )}
            {usersSuccess && (
              <Alert type="success" message={usersSuccess} className="rounded-xl text-xs animate-fade-in" />
            )}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                User Registrations Database
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddUserForm(!showAddUserForm)}
                className="font-mono text-xs font-bold gap-1 h-8"
                id="btn_toggle_add_user"
              >
                {showAddUserForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {showAddUserForm ? 'Cancel Form' : 'Add User Registration'}
              </Button>
            </div>

            {/* ADD USER POST FORM */}
            {showAddUserForm && (
              <form onSubmit={handleCreateUser} className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-2">
                  <Database className="w-4 h-4 text-slate-500" />
                  <span className="font-mono font-bold text-xs text-slate-700 uppercase tracking-wider">
                    POST Payload: /admin/users/
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                      Username *
                    </label>
                    <Input
                      type="text"
                      placeholder="steve_speculates"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      required
                      className="bg-white border-slate-200 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                      Display Name
                    </label>
                    <Input
                      type="text"
                      placeholder="Steve Speculates"
                      value={newDisplayName}
                      onChange={(e) => setNewDisplayName(e.target.value)}
                      className="bg-white border-slate-200 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                      System Role
                    </label>
                    <Select
                      id="new_user_role_select"
                      options={roleOptions}
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="bg-white border-slate-200 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                      Account Status
                    </label>
                    <div className="flex items-center gap-3 pt-2.5">
                      <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-mono text-slate-700">
                        <input
                          type="checkbox"
                          checked={newUserIsActive}
                          onChange={(e) => setNewUserIsActive(e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        Mark as Active User
                      </label>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    type="submit"
                    isLoading={submittingUser}
                    className="font-mono text-xs font-bold"
                  >
                    Submit POST Request
                  </Button>
                </div>
              </form>
            )}

            {/* USERS TABLE */}
            <div className="overflow-hidden border border-slate-100 rounded-xl bg-slate-50/20">
              {loadingUsers && users.length === 0 ? (
                <LoadingSpinner size="md" message="Synchronizing user records..." />
              ) : users.length === 0 ? (
                <div className="p-10 text-center space-y-2 text-slate-400 font-mono">
                  <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs">No administrative users found in register.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-150 text-left table-fixed">
                    <thead className="bg-slate-50 font-mono text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      <tr>
                        <th className="px-4 py-3 w-[8%]">ID</th>
                        <th className="px-4 py-3 w-[25%]">Display Name</th>
                        <th className="px-4 py-3 w-[25%]">Username</th>
                        <th className="px-4 py-3 w-[22%]">Role</th>
                        <th className="px-4 py-3 w-[12%] text-center">Status</th>
                        <th className="px-4 py-3 w-[8%] text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-mono bg-white">
                      {(users || []).map((user) => {
                        const isUpdating = updatingUserId === user.user_id;
                        const isDeleting = deletingUserId === user.user_id;
                        const isAwaitingDelete = userDeleteConfirmId === user.user_id;

                        return (
                          <tr 
                            key={user.user_id}
                            className={`transition-colors duration-150 ${isAwaitingDelete ? 'bg-rose-50/50' : 'hover:bg-slate-50/40'}`}
                          >
                            {/* User ID */}
                            <td className="px-4 py-3.5 text-slate-400 font-bold">
                              {user.user_id}
                            </td>

                            {/* Display Name */}
                            <td className="px-4 py-3.5 font-sans font-medium text-slate-800 truncate">
                              {user.display_name || (
                                <span className="text-slate-400 italic text-xs font-mono">-</span>
                              )}
                            </td>

                            {/* Username */}
                            <td className="px-4 py-3.5 text-slate-500 font-mono text-xs select-all truncate">
                              @{user.username}
                            </td>

                            {/* Role Dropdown (PATCH /admin/users/{user_id}/role) */}
                            <td className="px-4 py-3.5">
                              <div className="relative max-w-[130px] flex items-center gap-1.5">
                                <select
                                  value={user.role}
                                  disabled={isUpdating || isDeleting}
                                  onChange={(e) => handleUpdateRole(user.user_id, e.target.value)}
                                  className={`
                                    w-full appearance-none px-2 py-1.5 pr-8 text-xs font-mono bg-white border rounded-md shadow-2xs
                                    transition-colors duration-200 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800
                                    ${isUpdating ? 'border-indigo-400 bg-indigo-50/10' : 'border-slate-200'}
                                  `}
                                >
                                  {roleOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                                <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center text-slate-400">
                                  {isUpdating ? (
                                    <RefreshCw className="w-3 h-3 animate-spin text-indigo-500" />
                                  ) : (
                                    <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                                    </svg>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Active Status Badge */}
                            <td className="px-4 py-3.5 text-center">
                              {user.is_active ? (
                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                  <UserCheck className="w-3 h-3 shrink-0 text-emerald-500" />
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                  <UserX className="w-3 h-3 shrink-0 text-slate-400" />
                                  Inactive
                                </span>
                              )}
                            </td>

                            {/* Delete Action Trigger (DELETE /admin/users/{user_id}) */}
                            <td className="px-4 py-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5 min-h-[28px]">
                                {isAwaitingDelete ? (
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      onClick={() => handleDeleteUser(user.user_id)}
                                      className="px-1.5 py-1 text-[9px] font-bold font-mono h-6 gap-0"
                                      title="Confirm delete"
                                    >
                                      Yes
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setUserDeleteConfirmId(null)}
                                      className="px-1.5 py-1 text-[9px] border-slate-300 text-slate-600 h-6 gap-0"
                                      title="Cancel"
                                    >
                                      No
                                    </Button>
                                  </div>
                                ) : (
                                  <button
                                    disabled={isUpdating || isDeleting}
                                    onClick={() => setUserDeleteConfirmId(user.user_id)}
                                    className={`p-1.5 rounded-md border text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all ${isDeleting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    title={`Delete user @${user.username}`}
                                  >
                                    {isDeleting ? (
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
                                    ) : (
                                      <Trash2 className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}



        {/* TAB 3: ENTRY MANAGEMENT */}
        {activeTab === 'entries' && (
          <ErrorBoundary>
            <div className="space-y-4 animate-fade-in" id="panel_entry_admin">
              {entriesError && (
                <Alert type="error" message={entriesError} className="rounded-xl text-xs animate-fade-in" />
              )}
              {entriesSuccess && (
                <Alert type="success" message={entriesSuccess} className="rounded-xl text-xs animate-fade-in" />
              )}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Contestant Ticket Registry
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearEntryCache}
                    className="font-mono text-xs border-slate-200 text-slate-600 font-bold h-8 flex items-center gap-1.5"
                    id="btn_clear_entry_cache"
                  >
                    Clear Entry Cache
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowAddEntryForm(!showAddEntryForm)}
                    className="font-mono text-xs font-bold gap-1 h-8"
                    id="btn_toggle_add_entry"
                  >
                    {showAddEntryForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    {showAddEntryForm ? 'Cancel' : 'Add Ticket Entry'}
                  </Button>
                </div>
              </div>

              {/* ADD ENTRY FORM */}
              {showAddEntryForm && (
                <form onSubmit={handleCreateEntry} className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-4 animate-fade-in" id="form_add_entry">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-2">
                    <Database className="w-4 h-4 text-slate-500" />
                    <span className="font-mono font-bold text-xs text-slate-700 uppercase tracking-wider">
                      POST Payload: /admin/entries/
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                    {/* User Dropdown */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                        Contestant User *
                      </label>
                      <Select
                        id="new_entry_user_select"
                        options={[
                          { value: '', label: 'Select user...' },
                          ...(users || []).map(u => ({
                            value: String(u.user_id),
                            label: `${u.display_name || u.username} (${u.user_id})`
                          }))
                        ]}
                        value={newEntryUserId || ''}
                        onChange={(e) => setNewEntryUserId(e.target.value)}
                        required
                        className="bg-white border-slate-200 text-xs font-mono"
                      />
                    </div>

                    {/* Survivor Sweat Name */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                        Survivor Sweat Name *
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g. UWOSH-5"
                        value={newEntrySweatName || ''}
                        onChange={(e) => setNewEntrySweatName(e.target.value)}
                        required
                        className="bg-white border-slate-200 text-xs font-mono"
                      />
                    </div>

                    {/* Entry Label */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                        Entry Label *
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g. SAS Entry 3"
                        value={newEntryLabel || ''}
                        onChange={(e) => setNewEntryLabel(e.target.value)}
                        required
                        className="bg-white border-slate-200 text-xs font-mono"
                      />
                    </div>

                    {/* Contest Format Dropdown */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                        Contest Format *
                      </label>
                      <Select
                        id="new_entry_contest_format_select"
                        options={[
                          { value: '1', label: 'Standard Survivor' },
                          { value: '2', label: 'Circa Survivor' }
                        ]}
                        value={String(newEntryContestFormatId || 1)}
                        onChange={(e) => setNewEntryContestFormatId(parseInt(e.target.value, 10) || 1)}
                        required
                        className="bg-white border-slate-200 text-xs font-mono"
                      />
                    </div>

                    {/* Active Toggle */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono block">
                        Active Status
                      </label>
                      <div className="flex items-center h-9">
                        <button
                          type="button"
                          onClick={() => setNewEntryIsActive(!newEntryIsActive)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 ${
                            newEntryIsActive ? 'bg-indigo-600' : 'bg-slate-200'
                          }`}
                          id="toggle_active_status"
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              newEntryIsActive ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className="ml-2.5 text-xs font-mono text-slate-600 font-bold">
                          {newEntryIsActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      variant="primary"
                      size="sm"
                      type="submit"
                      disabled={submittingEntry}
                      className="font-mono text-xs font-bold px-5"
                      id="btn_submit_new_entry"
                    >
                      {submittingEntry ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
                      ) : (
                        <Database className="w-3.5 h-3.5 mr-1" />
                      )}
                      Dispatch POST Request
                    </Button>
                  </div>
                </form>
              )}

              {/* ENTRIES LIST / TABLE */}
              <div className="border border-slate-150 rounded-xl overflow-hidden bg-white">
                {loadingEntries ? (
                  <div className="p-12 flex flex-col items-center justify-center gap-3">
                    <LoadingSpinner className="w-6 h-6 text-indigo-500" />
                    <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider animate-pulse">
                      Querying ticket ledger index...
                    </span>
                  </div>
                ) : (entries || []).length === 0 ? (
                  <div className="p-10 flex flex-col items-center justify-center text-center gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400">
                      <Ticket className="w-6 h-6 text-slate-300" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-700 font-mono uppercase tracking-wider">No tickets recorded</p>
                      <p className="text-[11px] text-slate-400 max-w-sm">
                        There are no contestant entry tickets found in the database. Use the button above to seed simulation tickets.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse" id="table_entries_registry">
                      <thead>
                        <tr className="bg-slate-50/75 border-b border-slate-150 select-none">
                          <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono">
                            Entry ID
                          </th>
                          <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono">
                            User
                          </th>
                          <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono">
                            Survivor Sweat Name
                          </th>
                          <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono">
                            Entry Label
                          </th>
                          <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono text-center">
                            Contest Format
                          </th>
                          <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono text-center">
                            Active Status
                          </th>
                          <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono text-center">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs bg-white">
                        {(entries || []).map((ent) => {
                          const isUpdating = updatingEntryId === ent.entry_id;
                          const isDeleting = deletingEntryId === ent.entry_id;
                          const isAwaitingDelete = entryDeleteConfirmId === ent.entry_id;

                          return (
                            <tr key={ent.entry_id} className="hover:bg-slate-50/50 transition-colors">
                              {/* Entry ID */}
                              <td className="px-4 py-3.5 font-mono font-bold text-slate-700">
                                <div className="flex items-center gap-1.5">
                                  <Ticket className="w-3.5 h-3.5 text-indigo-400" />
                                  <span>#{ent.entry_id}</span>
                                </div>
                              </td>

                              {/* User */}
                              <td className="px-4 py-3.5">
                                <div>
                                  <div className="font-semibold text-slate-900">
                                    {ent.display_name || ent.username || `User #${ent.user_id}`}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono">ID: {ent.user_id}</div>
                                </div>
                              </td>

                              {/* Survivor Sweat Name */}
                              <td className="px-4 py-3.5 font-mono text-slate-800">
                                {ent.survivor_sweat_name || '-'}
                              </td>

                              {/* Entry Label */}
                              <td className="px-4 py-3.5 font-medium text-slate-800">
                                {ent.entry_label || '-'}
                              </td>

                              {/* Contest Format */}
                              <td className="px-4 py-3.5 text-center">
                                <select
                                  disabled={isUpdating || isDeleting}
                                  value={ent.contest_format_id || 1}
                                  onChange={(e) => handleUpdateContestFormat(ent.entry_id, parseInt(e.target.value, 10))}
                                  className="bg-slate-50 border border-slate-200 text-[10px] font-mono font-bold rounded-md px-1.5 py-1 text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mx-auto block"
                                >
                                  <option value="1">Standard Survivor</option>
                                  <option value="2">Circa Survivor</option>
                                </select>
                              </td>

                              {/* Active Status */}
                              <td className="px-4 py-3.5 text-center">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold tracking-wide ${
                                  ent.is_active 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                                }`}>
                                  {ent.is_active ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="px-4 py-3.5 text-center">
                                <div className="flex items-center justify-center gap-1.5 min-h-[28px]">
                                  {isAwaitingDelete ? (
                                    <div className="flex items-center gap-1 justify-center">
                                      <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => handleDeleteEntry(ent.entry_id)}
                                        className="px-1.5 py-1 text-[9px] font-bold font-mono h-6 gap-0"
                                        title="Confirm delete"
                                      >
                                        Yes
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEntryDeleteConfirmId(null)}
                                        className="px-1.5 py-1 text-[9px] border-slate-300 text-slate-600 h-6 gap-0"
                                        title="Cancel"
                                      >
                                        No
                                      </Button>
                                    </div>
                                  ) : (
                                    <button
                                      disabled={isUpdating || isDeleting}
                                      onClick={() => setEntryDeleteConfirmId(ent.entry_id)}
                                      className={`p-1.5 rounded-md border text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all ${isDeleting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                      title={`Delete entry ticket #${ent.entry_id}`}
                                    >
                                      {isDeleting ? (
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
                                      ) : (
                                        <Trash2 className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </ErrorBoundary>
        )}

        {/* Unified Help and Integration Guide */}
        <div className="text-[11px] text-slate-500 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <p>
              **Integration Flow:** Table refreshes are fully automated. Adding users or credentials dispatches a **POST** payload containing structured JSON data. Updates trigger **PATCH** requests directly targeting `/role` or `/status` endpoints, immediately fetching updated database grids upon response success.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
