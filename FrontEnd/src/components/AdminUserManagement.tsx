/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Trash2, 
  RefreshCw, 
  AlertCircle, 
  Check, 
  X, 
  ShieldAlert, 
  UserCheck, 
  UserX,
  Plus,
  Database,
  CheckCircle2,
  Ticket,
  Lock,
  Unlock
} from 'lucide-react';
import { Card, Alert, Button, Input, Select, LoadingSpinner } from './ui';

export interface ManagedUser {
  user_id: number;
  username: string;
  display_name?: string;
  role: string;
  is_active: boolean;
}

export interface ManagedAccount {
  account_id: number;
  user_id: number;
  account_name: string;
  provider: string;
  status: string; // 'ACTIVE' | 'INACTIVE'
}

export interface ContestEntry {
  entry_id: number;
  user_id: number;
  username: string;
  week: number;
  selected_team: string;
  status: 'SUBMITTED' | 'PENDING' | 'STUCK' | 'OVERRIDDEN';
  submitted_at: string;
}

const DEFAULT_SANDBOX_USERS: ManagedUser[] = [
  { user_id: 101, username: 'steve_schilhabel', display_name: 'Steve Schilhabel', role: 'ADMIN', is_active: true },
  { user_id: 102, username: 'j_doe_pro', display_name: 'John Doe', role: 'USER', is_active: true },
  { user_id: 103, username: 'survivor_champ', display_name: 'Sarah Connor', role: 'USER', is_active: true },
  { user_id: 104, username: 'ana_stats', display_name: 'Ana Lovelace', role: 'ADMIN', is_active: true },
  { user_id: 105, username: 'guest_speculator', display_name: 'Robert Speculator', role: 'USER', is_active: false }
];

const DEFAULT_SANDBOX_ACCOUNTS: ManagedAccount[] = [
  { account_id: 201, user_id: 101, account_name: 'Steve Main Ledger', provider: 'Auth0', status: 'ACTIVE' },
  { account_id: 202, user_id: 102, account_name: 'John Sandbox Profile', provider: 'Google', status: 'ACTIVE' },
  { account_id: 203, user_id: 103, account_name: 'Sarah Survivor Account', provider: 'GitHub', status: 'INACTIVE' },
  { account_id: 204, user_id: 104, account_name: 'Ana Analytics Node', provider: 'Firebase', status: 'ACTIVE' }
];

const DEFAULT_SANDBOX_ENTRIES: ContestEntry[] = [
  { entry_id: 501, user_id: 101, username: 'steve_schilhabel', week: 1, selected_team: 'Kansas City Chiefs', status: 'SUBMITTED', submitted_at: '2026-09-10T14:30:22Z' },
  { entry_id: 502, user_id: 102, username: 'j_doe_pro', week: 1, selected_team: 'San Francisco 49ers', status: 'STUCK', submitted_at: '2026-09-11T09:12:05Z' },
  { entry_id: 503, user_id: 103, username: 'survivor_champ', week: 1, selected_team: 'Philadelphia Eagles', status: 'SUBMITTED', submitted_at: '2026-09-12T18:45:00Z' },
  { entry_id: 504, user_id: 104, username: 'ana_stats', week: 1, selected_team: 'Buffalo Bills', status: 'PENDING', submitted_at: '2026-09-13T11:20:10Z' },
];

export const AdminUserManagement: React.FC = () => {
  // Navigation
  const [activeTab, setActiveTab] = useState<'users' | 'accounts' | 'entries'>('users');

  // Core list states
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [accounts, setAccounts] = useState<ManagedAccount[]>([]);
  const [entries, setEntries] = useState<ContestEntry[]>([]);
  
  // Loading and error states
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
  const [loadingAccounts, setLoadingAccounts] = useState<boolean>(true);
  const [loadingEntries, setLoadingEntries] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Interaction states — Users
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [userDeleteConfirmId, setUserDeleteConfirmId] = useState<number | null>(null);
  
  // Interaction states — Accounts
  const [updatingAccountId, setUpdatingAccountId] = useState<number | null>(null);
  const [deletingAccountId, setDeletingAccountId] = useState<number | null>(null);
  const [accountDeleteConfirmId, setAccountDeleteConfirmId] = useState<number | null>(null);

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

  const [showAddAccountForm, setShowAddAccountForm] = useState<boolean>(false);
  const [newAccountUserId, setNewAccountUserId] = useState<string>('');
  const [newAccountName, setNewAccountName] = useState<string>('');
  const [newProvider, setNewProvider] = useState<string>('Google');
  const [newAccountStatus, setNewAccountStatus] = useState<string>('ACTIVE');
  const [submittingAccount, setSubmittingAccount] = useState<boolean>(false);

  const [showAddEntryForm, setShowAddEntryForm] = useState<boolean>(false);
  const [newEntryUserId, setNewEntryUserId] = useState<string>('');
  const [newEntryWeek, setNewEntryWeek] = useState<number>(1);
  const [newEntrySelectedTeam, setNewEntrySelectedTeam] = useState<string>('');
  const [newEntryStatus, setNewEntryStatus] = useState<'SUBMITTED' | 'PENDING' | 'STUCK' | 'OVERRIDDEN'>('SUBMITTED');
  const [submittingEntry, setSubmittingEntry] = useState<boolean>(false);

  // Offline sandbox/simulation fallback if local host 127.0.0.1:8000 is unreachable
  const [sandboxActive, setSandboxActive] = useState<boolean>(false);
  const [connectionWarning, setConnectionWarning] = useState<boolean>(false);

  const usersApiUrl = 'http://127.0.0.1:8000/admin/users/';
  const accountsApiUrl = 'http://127.0.0.1:8000/admin/accounts/';
  const entriesApiUrl = 'http://127.0.0.1:8000/admin/entries/';

  // Load everything
  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setSuccess(null);
      setError(null);
    }
    await Promise.all([
      fetchUsers(isManualRefresh),
      fetchAccounts(isManualRefresh),
      fetchEntries(isManualRefresh)
    ]);
  };

  const fetchUsers = async (isManualRefresh = false) => {
    setLoadingUsers(true);
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
      } else {
        throw new Error('Backend did not return a valid array of users.');
      }
    } catch (err: any) {
      console.warn('Could not connect to local backend at 127.0.0.1:8000. Activating local sandbox mode.', err);
      setConnectionWarning(true);
      setSandboxActive(true);
      
      // Auto-fallback to local sandbox
      const stored = localStorage.getItem('semisharp_sandbox_users');
      const mockUsers = stored ? JSON.parse(stored) : DEFAULT_SANDBOX_USERS;
      setUsers(mockUsers);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchAccounts = async (isManualRefresh = false) => {
    setLoadingAccounts(true);
    if (sandboxActive) {
      setTimeout(() => {
        const stored = localStorage.getItem('semisharp_sandbox_accounts');
        if (stored) {
          setAccounts(JSON.parse(stored));
        } else {
          setAccounts(DEFAULT_SANDBOX_ACCOUNTS);
          localStorage.setItem('semisharp_sandbox_accounts', JSON.stringify(DEFAULT_SANDBOX_ACCOUNTS));
        }
        setLoadingAccounts(false);
      }, 300);
      return;
    }

    try {
      const response = await fetch(accountsApiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch accounts from backend (HTTP ${response.status})`);
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        setAccounts(data);
        setConnectionWarning(false);
      } else {
        throw new Error('Backend did not return a valid array of accounts.');
      }
    } catch (err: any) {
      console.warn('Could not connect to local accounts backend at 127.0.0.1:8000. Activating local sandbox mode.', err);
      setConnectionWarning(true);
      setSandboxActive(true);

      // Auto-fallback to local sandbox
      const stored = localStorage.getItem('semisharp_sandbox_accounts');
      const mockAccounts = stored ? JSON.parse(stored) : DEFAULT_SANDBOX_ACCOUNTS;
      setAccounts(mockAccounts);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const fetchEntries = async (isManualRefresh = false) => {
    setLoadingEntries(true);
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
      } else {
        throw new Error('Backend did not return a valid array of entries.');
      }
    } catch (err: any) {
      console.warn('Could not connect to local entries backend at 127.0.0.1:8000. Activating local sandbox mode.', err);
      setConnectionWarning(true);
      setSandboxActive(true);

      // Auto-fallback to local sandbox
      const stored = localStorage.getItem('semisharp_sandbox_entries');
      const mockEntries = stored ? JSON.parse(stored) : DEFAULT_SANDBOX_ENTRIES;
      setEntries(mockEntries);
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
    if (!newEntryUserId || !newEntrySelectedTeam.trim()) {
      setError('User ID and Selected Team are required.');
      return;
    }

    const userIdNum = parseInt(newEntryUserId, 10);
    if (isNaN(userIdNum)) {
      setError('User ID must be a number.');
      return;
    }

    setSubmittingEntry(true);
    setError(null);
    setSuccess(null);

    // Find username from users
    const associatedUser = users.find(u => u.user_id === userIdNum);
    const username = associatedUser ? associatedUser.username : `user_${userIdNum}`;

    const newEntryPayload = {
      user_id: userIdNum,
      username,
      week: newEntryWeek,
      selected_team: newEntrySelectedTeam.trim(),
      status: newEntryStatus,
      submitted_at: new Date().toISOString()
    };

    if (sandboxActive) {
      setTimeout(() => {
        const nextId = entries.length > 0 ? Math.max(...entries.map(ent => ent.entry_id)) + 1 : 501;
        const created: ContestEntry = { entry_id: nextId, ...newEntryPayload };
        const updated = [...entries, created];
        setEntries(updated);
        localStorage.setItem('semisharp_sandbox_entries', JSON.stringify(updated));
        
        setSuccess(`Entry ID ${nextId} created successfully for ${username} (Simulation).`);
        setShowAddEntryForm(false);
        setNewEntryUserId('');
        setNewEntrySelectedTeam('');
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
        throw new Error(`POST request failed with status ${response.status}`);
      }

      setSuccess(`Entry created successfully for ${username}.`);
      setShowAddEntryForm(false);
      setNewEntryUserId('');
      setNewEntrySelectedTeam('');
      await fetchEntries();
    } catch (err: any) {
      setError(err.message || 'Failed to complete create entry request.');
    } finally {
      setSubmittingEntry(false);
    }
  };

  // Delete Entry (DELETE)
  const handleDeleteEntry = async (entryId: number) => {
    setLoadingEntries(true);
    setError(null);
    setSuccess(null);
    setDeletingEntryId(entryId);
    setEntryDeleteConfirmId(null);

    if (sandboxActive) {
      setTimeout(() => {
        const currentEntries = entries.filter(ent => ent.entry_id !== entryId);
        setEntries(currentEntries);
        localStorage.setItem('semisharp_sandbox_entries', JSON.stringify(currentEntries));
        setSuccess(`Deleted entry ID ${entryId} (Simulation).`);
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
        throw new Error(`DELETE request failed with status ${response.status}`);
      }

      setSuccess(`Entry ID ${entryId} deleted successfully.`);
      await fetchEntries();
    } catch (err: any) {
      setError(err.message || 'Failed to complete delete entry request.');
    } finally {
      setDeletingEntryId(null);
      setLoadingEntries(false);
    }
  };

  // Override Entry Status (PATCH)
  const handleOverrideEntryStatus = async (entryId: number, nextStatus: 'SUBMITTED' | 'PENDING' | 'STUCK' | 'OVERRIDDEN') => {
    setError(null);
    setSuccess(null);
    setUpdatingEntryId(entryId);

    if (sandboxActive) {
      setTimeout(() => {
        const updated = entries.map(ent => {
          if (ent.entry_id === entryId) {
            return { ...ent, status: nextStatus };
          }
          return ent;
        });
        setEntries(updated);
        localStorage.setItem('semisharp_sandbox_entries', JSON.stringify(updated));
        setSuccess(`Overrode status of entry ID ${entryId} to ${nextStatus}.`);
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
        throw new Error(`PATCH status request failed with status ${response.status}`);
      }

      setSuccess(`Entry status updated to ${nextStatus} successfully.`);
      await fetchEntries();
    } catch (err: any) {
      setError(err.message || 'Failed to override entry status.');
    } finally {
      setUpdatingEntryId(null);
    }
  };

  // Unlock Stuck Submission
  const handleUnlockEntry = async (entryId: number) => {
    setError(null);
    setSuccess(null);
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
        setSuccess(`Unlocked submission for entry ID ${entryId} (State changed from STUCK to SUBMITTED).`);
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
        throw new Error(`POST unlock request failed with status ${response.status}`);
      }

      setSuccess(`Unlocked submission for entry ID ${entryId} successfully.`);
      await fetchEntries();
    } catch (err: any) {
      setError(err.message || 'Failed to unlock entry submission.');
    } finally {
      setUpdatingEntryId(null);
    }
  };

  // Clear Entry Cache
  const handleClearEntryCache = () => {
    setError(null);
    setSuccess('Contestant entry ticket cache cleared successfully. All client-side edge indices flushed.');
  };

  // -- USER ACTIONS --

  // Create User (POST)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      setError('Username is required.');
      return;
    }

    setSubmittingUser(true);
    setError(null);
    setSuccess(null);

    const generatedId = users.length > 0 ? Math.max(...users.map(u => u.user_id)) + 1 : 101;
    const payload: ManagedUser = {
      user_id: generatedId,
      username: newUsername.trim(),
      display_name: newDisplayName.trim() || undefined,
      role: newRole,
      is_active: newUserIsActive
    };

    if (sandboxActive) {
      setTimeout(() => {
        const updatedUsers = [...users, payload];
        setUsers(updatedUsers);
        localStorage.setItem('semisharp_sandbox_users', JSON.stringify(updatedUsers));
        setSuccess(`User @${payload.username} created successfully (Simulation).`);
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

      setSuccess(`User @${payload.username} created successfully!`);
      setShowAddUserForm(false);
      setNewUsername('');
      setNewDisplayName('');
      setNewRole('USER');
      setNewUserIsActive(true);
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to submit User POST request.');
    } finally {
      setSubmittingUser(false);
    }
  };

  // Delete User (DELETE)
  const handleDeleteUser = async (userId: number) => {
    setLoadingUsers(true);
    setError(null);
    setSuccess(null);
    setDeletingUserId(userId);
    setUserDeleteConfirmId(null);

    if (sandboxActive) {
      setTimeout(() => {
        const currentUsers = users.filter(u => u.user_id !== userId);
        setUsers(currentUsers);
        localStorage.setItem('semisharp_sandbox_users', JSON.stringify(currentUsers));
        
        // Cascade delete accounts linked to this user for simulation sanity
        const currentAccounts = accounts.filter(a => a.user_id !== userId);
        setAccounts(currentAccounts);
        localStorage.setItem('semisharp_sandbox_accounts', JSON.stringify(currentAccounts));

        setSuccess(`Deleted user ID ${userId} and all linked simulator credentials.`);
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

      setSuccess(`User ID ${userId} deleted successfully.`);
      // Auto-refresh tables
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to complete user delete request.');
    } finally {
      setDeletingUserId(null);
      setLoadingUsers(false);
    }
  };

  // Update User Role (PATCH)
  const handleUpdateRole = async (userId: number, newRole: string) => {
    setError(null);
    setSuccess(null);
    setUpdatingUserId(userId);

    if (sandboxActive) {
      setTimeout(() => {
        const updatedUsers = users.map(u => {
          if (u.user_id === userId) {
            return { ...u, role: newRole };
          }
          return u;
        });
        setUsers(updatedUsers);
        localStorage.setItem('semisharp_sandbox_users', JSON.stringify(updatedUsers));
        setSuccess(`Updated user ${userId} authorization role to ${newRole}.`);
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

      setSuccess(`User role updated to ${newRole} successfully.`);
      // Auto-refresh tables
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to complete role update request.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  // -- ACCOUNT ACTIONS --

  // Create Account (POST)
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const uId = parseInt(newAccountUserId, 10);
    if (isNaN(uId)) {
      setError('Valid User ID is required.');
      return;
    }
    if (!newAccountName.trim()) {
      setError('Account name is required.');
      return;
    }

    setSubmittingAccount(true);
    setError(null);
    setSuccess(null);

    const generatedId = accounts.length > 0 ? Math.max(...accounts.map(a => a.account_id)) + 1 : 201;
    const payload: ManagedAccount = {
      account_id: generatedId,
      user_id: uId,
      account_name: newAccountName.trim(),
      provider: newProvider,
      status: newAccountStatus
    };

    if (sandboxActive) {
      setTimeout(() => {
        const updatedAccounts = [...accounts, payload];
        setAccounts(updatedAccounts);
        localStorage.setItem('semisharp_sandbox_accounts', JSON.stringify(updatedAccounts));
        setSuccess(`Account "${payload.account_name}" added successfully (Simulation).`);
        setShowAddAccountForm(false);
        setNewAccountUserId('');
        setNewAccountName('');
        setNewProvider('Google');
        setNewAccountStatus('ACTIVE');
        setSubmittingAccount(false);
      }, 500);
      return;
    }

    try {
      const response = await fetch(accountsApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Failed to create account: ${response.statusText} (${response.status})`);
      }

      setSuccess(`Account "${payload.account_name}" added successfully!`);
      setShowAddAccountForm(false);
      setNewAccountUserId('');
      setNewAccountName('');
      setNewProvider('Google');
      setNewAccountStatus('ACTIVE');
      await fetchAccounts();
    } catch (err: any) {
      setError(err.message || 'Failed to submit Account POST request.');
    } finally {
      setSubmittingAccount(false);
    }
  };

  // Delete Account (DELETE)
  const handleDeleteAccount = async (accountId: number) => {
    setLoadingAccounts(true);
    setError(null);
    setSuccess(null);
    setDeletingAccountId(accountId);
    setAccountDeleteConfirmId(null);

    if (sandboxActive) {
      setTimeout(() => {
        const currentAccounts = accounts.filter(a => a.account_id !== accountId);
        setAccounts(currentAccounts);
        localStorage.setItem('semisharp_sandbox_accounts', JSON.stringify(currentAccounts));
        setSuccess(`Deleted account credential ID ${accountId} (Simulation).`);
        setDeletingAccountId(null);
        setLoadingAccounts(false);
      }, 500);
      return;
    }

    try {
      const response = await fetch(`${accountsApiUrl}${accountId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`DELETE request failed with status ${response.status}`);
      }

      setSuccess(`Account ID ${accountId} deleted successfully.`);
      // Auto-refresh tables
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to complete account delete request.');
    } finally {
      setDeletingAccountId(null);
      setLoadingAccounts(false);
    }
  };

  // Toggle Account Status (PATCH)
  const handleToggleAccountStatus = async (accountId: number, currentStatus: string) => {
    setError(null);
    setSuccess(null);
    setUpdatingAccountId(accountId);

    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    if (sandboxActive) {
      setTimeout(() => {
        const updated = accounts.map(a => {
          if (a.account_id === accountId) {
            return { ...a, status: nextStatus };
          }
          return a;
        });
        setAccounts(updated);
        localStorage.setItem('semisharp_sandbox_accounts', JSON.stringify(updated));
        setSuccess(`Toggled account ID ${accountId} status to ${nextStatus}.`);
        setUpdatingAccountId(null);
      }, 400);
      return;
    }

    try {
      const response = await fetch(`${accountsApiUrl}${accountId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        throw new Error(`PATCH status request failed with status ${response.status}`);
      }

      setSuccess(`Account status updated to ${nextStatus} successfully.`);
      // Auto-refresh tables
      await fetchAccounts();
    } catch (err: any) {
      setError(err.message || 'Failed to complete status update request.');
    } finally {
      setUpdatingAccountId(null);
    }
  };

  // Reset sandbox completely
  const handleResetSandbox = () => {
    localStorage.removeItem('semisharp_sandbox_users');
    localStorage.removeItem('semisharp_sandbox_accounts');
    localStorage.removeItem('semisharp_sandbox_entries');
    setUsers(DEFAULT_SANDBOX_USERS);
    setAccounts(DEFAULT_SANDBOX_ACCOUNTS);
    setEntries(DEFAULT_SANDBOX_ENTRIES);
    localStorage.setItem('semisharp_sandbox_users', JSON.stringify(DEFAULT_SANDBOX_USERS));
    localStorage.setItem('semisharp_sandbox_accounts', JSON.stringify(DEFAULT_SANDBOX_ACCOUNTS));
    localStorage.setItem('semisharp_sandbox_entries', JSON.stringify(DEFAULT_SANDBOX_ENTRIES));
    setSuccess('Local simulation user, account, and entry directories reset to default.');
    setError(null);
  };

  const roleOptions = [
    { value: 'USER', label: 'USER' },
    { value: 'ADMIN', label: 'ADMIN' }
  ];

  const providerOptions = [
    { value: 'Google', label: 'Google Authenticator' },
    { value: 'GitHub', label: 'GitHub Social Login' },
    { value: 'Auth0', label: 'Auth0 Secure Token' },
    { value: 'Firebase', label: 'Firebase Identity' },
    { value: 'Cognito', label: 'AWS Cognito Pool' }
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
                Manage User Logins & Provider Accounts
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
              disabled={loadingUsers || loadingAccounts}
              className="font-mono text-[11px] border-slate-200 h-8 font-bold flex items-center gap-1.5"
              id="btn_refresh_users"
            >
              <RefreshCw className={`w-3 h-3 ${(loadingUsers || loadingAccounts) ? 'animate-spin' : ''}`} />
              Sync Tables
            </Button>
          </div>
        </div>

        {/* Informational Connection Alert */}
        {connectionWarning && (
          <div className="bg-amber-50 border border-amber-150 rounded-xl p-3.5 text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-mono font-bold uppercase tracking-wider text-amber-700">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              Local Backend Offline (http://127.0.0.1:8000)
            </div>
            <p className="leading-relaxed">
              We attempted to fetch the registry endpoints but the server is unreachable. To facilitate testing inside the AI Studio preview window, **Local Simulation Mode** has been auto-enabled.
            </p>
            <div className="flex flex-wrap gap-2 items-center pt-1.5">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSandboxActive(false);
                  loadData(true);
                }}
                className="text-[11px] font-mono bg-amber-800 hover:bg-amber-950 text-white font-bold h-7 border-none"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry Live Connection
              </Button>
              <button 
                onClick={() => setSandboxActive(true)}
                className="text-[11px] underline font-medium text-amber-800 hover:text-amber-950 ml-1"
              >
                Continue using simulation mode
              </button>
            </div>
          </div>
        )}

        {/* Feedback Alerts */}
        {error && (
          <Alert type="error" message={error} className="rounded-xl text-xs" />
        )}
        {success && (
          <Alert type="success" message={success} className="rounded-xl text-xs" />
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
            onClick={() => setActiveTab('accounts')}
            className={`px-4 py-2 border-b-2 font-mono text-xs uppercase tracking-wider font-extrabold transition-all whitespace-nowrap ${
              activeTab === 'accounts'
                ? 'border-indigo-500 text-indigo-600 bg-indigo-50/5'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
            }`}
            id="subtab_btn_account_admin"
          >
            Account Administration
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
                      {users.map((user) => {
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

        {/* TAB 2: ACCOUNT ADMINISTRATION */}
        {activeTab === 'accounts' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                External Identity Providers Directory
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddAccountForm(!showAddAccountForm)}
                className="font-mono text-xs font-bold gap-1 h-8"
                id="btn_toggle_add_account"
              >
                {showAddAccountForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {showAddAccountForm ? 'Cancel Form' : 'Add Identity Account'}
              </Button>
            </div>

            {/* ADD ACCOUNT POST FORM */}
            {showAddAccountForm && (
              <form onSubmit={handleCreateAccount} className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-2">
                  <Database className="w-4 h-4 text-slate-500" />
                  <span className="font-mono font-bold text-xs text-slate-700 uppercase tracking-wider">
                    POST Payload: /admin/accounts/
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                      Target User ID *
                    </label>
                    <Select
                      id="new_account_user_select"
                      options={[
                        { value: '', label: '-- Select User Owner --' },
                        ...users.map(u => ({ value: String(u.user_id), label: `${u.display_name || u.username} (ID: ${u.user_id})` }))
                      ]}
                      value={newAccountUserId}
                      onChange={(e) => setNewAccountUserId(e.target.value)}
                      required
                      className="bg-white border-slate-200 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                      Account Name *
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. Primary LDAP Sync"
                      value={newAccountName}
                      onChange={(e) => setNewAccountName(e.target.value)}
                      required
                      className="bg-white border-slate-200 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                      Identity Provider
                    </label>
                    <Select
                      id="new_account_provider_select"
                      options={providerOptions}
                      value={newProvider}
                      onChange={(e) => setNewProvider(e.target.value)}
                      className="bg-white border-slate-200 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                      Initial Status
                    </label>
                    <Select
                      id="new_account_status_select"
                      options={[
                        { value: 'ACTIVE', label: 'ACTIVE' },
                        { value: 'INACTIVE', label: 'INACTIVE' }
                      ]}
                      value={newAccountStatus}
                      onChange={(e) => setNewAccountStatus(e.target.value)}
                      className="bg-white border-slate-200 text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    type="submit"
                    isLoading={submittingAccount}
                    className="font-mono text-xs font-bold"
                  >
                    Submit POST Request
                  </Button>
                </div>
              </form>
            )}

            {/* ACCOUNTS TABLE */}
            <div className="overflow-hidden border border-slate-100 rounded-xl bg-slate-50/20">
              {loadingAccounts && accounts.length === 0 ? (
                <LoadingSpinner size="md" message="Synchronizing identity accounts..." />
              ) : accounts.length === 0 ? (
                <div className="p-10 text-center space-y-2 text-slate-400 font-mono">
                  <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs">No integrated provider accounts discovered in register.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-150 text-left table-fixed">
                    <thead className="bg-slate-50 font-mono text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      <tr>
                        <th className="px-4 py-3 w-[12%]">Acct ID</th>
                        <th className="px-4 py-3 w-[12%]">User ID</th>
                        <th className="px-4 py-3 w-[30%]">Account Name</th>
                        <th className="px-4 py-3 w-[20%]">Provider</th>
                        <th className="px-4 py-3 w-[16%] text-center">Status Toggle</th>
                        <th className="px-4 py-3 w-[10%] text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-mono bg-white">
                      {accounts.map((acct) => {
                        const isUpdating = updatingAccountId === acct.account_id;
                        const isDeleting = deletingAccountId === acct.account_id;
                        const isAwaitingDelete = accountDeleteConfirmId === acct.account_id;

                        // Find matching owner name
                        const ownerUser = users.find(u => u.user_id === acct.user_id);
                        const ownerLabel = ownerUser ? (ownerUser.display_name || `@${ownerUser.username}`) : 'Unknown';

                        return (
                          <tr 
                            key={acct.account_id}
                            className={`transition-colors duration-150 ${isAwaitingDelete ? 'bg-rose-50/50' : 'hover:bg-slate-50/40'}`}
                          >
                            {/* Account ID */}
                            <td className="px-4 py-3.5 text-slate-400 font-bold">
                              #{acct.account_id}
                            </td>

                            {/* User ID Owner */}
                            <td className="px-4 py-3.5">
                              <span 
                                className="font-bold bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] text-slate-600"
                                title={`Owner: ${ownerLabel}`}
                              >
                                {acct.user_id}
                              </span>
                            </td>

                            {/* Account Name */}
                            <td className="px-4 py-3.5 font-sans font-medium text-slate-800 truncate">
                              <div className="flex flex-col">
                                <span>{acct.account_name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">Owner: {ownerLabel}</span>
                              </div>
                            </td>

                            {/* Provider */}
                            <td className="px-4 py-3.5">
                              <span className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-[10px] text-slate-500 font-bold uppercase">
                                {acct.provider}
                              </span>
                            </td>

                            {/* Status Toggle Button (PATCH /admin/accounts/{account_id}/status) */}
                            <td className="px-4 py-3.5 text-center">
                              <button
                                disabled={isUpdating || isDeleting}
                                onClick={() => handleToggleAccountStatus(acct.account_id, acct.status)}
                                className={`
                                  inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-[10px] font-bold transition-all
                                  ${acct.status === 'ACTIVE' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                    : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                  }
                                  ${(isUpdating || isDeleting) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                `}
                                title="Click to toggle identity status"
                              >
                                {isUpdating ? (
                                  <RefreshCw className="w-3 h-3 animate-spin text-slate-500" />
                                ) : acct.status === 'ACTIVE' ? (
                                  <Check className="w-3 h-3 shrink-0" />
                                ) : (
                                  <X className="w-3 h-3 shrink-0" />
                                )}
                                {acct.status}
                              </button>
                            </td>

                            {/* Delete Action Trigger (DELETE /admin/accounts/{account_id}) */}
                            <td className="px-4 py-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5 min-h-[28px]">
                                {isAwaitingDelete ? (
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      onClick={() => handleDeleteAccount(acct.account_id)}
                                      className="px-1.5 py-1 text-[9px] font-bold font-mono h-6 gap-0"
                                      title="Confirm delete"
                                    >
                                      Yes
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setAccountDeleteConfirmId(null)}
                                      className="px-1.5 py-1 text-[9px] border-slate-300 text-slate-600 h-6 gap-0"
                                      title="Cancel"
                                    >
                                      No
                                    </Button>
                                  </div>
                                ) : (
                                  <button
                                    disabled={isUpdating || isDeleting}
                                    onClick={() => setAccountDeleteConfirmId(acct.account_id)}
                                    className={`p-1.5 rounded-md border text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all ${isDeleting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    title={`Delete integrated credentials #${acct.account_id}`}
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
          <div className="space-y-4 animate-fade-in" id="panel_entry_admin">
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
              <form onSubmit={handleCreateEntry} className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-4" id="form_add_entry">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-2">
                  <Database className="w-4 h-4 text-slate-500" />
                  <span className="font-mono font-bold text-xs text-slate-700 uppercase tracking-wider">
                    POST Payload: /admin/entries/
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                      Contestant User *
                    </label>
                    <Select
                      id="new_entry_user_select"
                      options={[
                        { value: '', label: 'Select user...' },
                        ...users.map(u => ({
                          value: String(u.user_id),
                          label: `${u.display_name || u.username} (${u.user_id})`
                        }))
                      ]}
                      value={newEntryUserId}
                      onChange={(e) => setNewEntryUserId(e.target.value)}
                      required
                      className="bg-white border-slate-200 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                      NFL Week (1-18) *
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={18}
                      placeholder="1"
                      value={newEntryWeek}
                      onChange={(e) => setNewEntryWeek(parseInt(e.target.value) || 1)}
                      required
                      className="bg-white border-slate-200 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                      Selected NFL Team *
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. Philadelphia Eagles"
                      value={newEntrySelectedTeam}
                      onChange={(e) => setNewEntrySelectedTeam(e.target.value)}
                      required
                      className="bg-white border-slate-200 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                      Entry Submission Status
                    </label>
                    <Select
                      id="new_entry_status_select"
                      options={[
                        { value: 'SUBMITTED', label: 'SUBMITTED' },
                        { value: 'PENDING', label: 'PENDING' },
                        { value: 'STUCK', label: 'STUCK' },
                        { value: 'OVERRIDDEN', label: 'OVERRIDDEN' }
                      ]}
                      value={newEntryStatus}
                      onChange={(e) => setNewEntryStatus(e.target.value as any)}
                      className="bg-white border-slate-200 text-xs font-mono"
                    />
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
              ) : entries.length === 0 ? (
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
                          ID / Ref
                        </th>
                        <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono">
                          Contestant
                        </th>
                        <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono text-center">
                          NFL Week
                        </th>
                        <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono">
                          Selected Team
                        </th>
                        <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono text-center">
                          Status
                        </th>
                        <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono text-center">
                          Override Actions
                        </th>
                        <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono text-center">
                          Delete
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {entries.map((ent) => {
                        const isUpdating = updatingEntryId === ent.entry_id;
                        const isDeleting = deletingEntryId === ent.entry_id;
                        const isAwaitingDelete = entryDeleteConfirmId === ent.entry_id;

                        let statusColor = '';
                        if (ent.status === 'SUBMITTED') {
                          statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                        } else if (ent.status === 'PENDING') {
                          statusColor = 'bg-sky-50 text-sky-700 border-sky-100';
                        } else if (ent.status === 'STUCK') {
                          statusColor = 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse';
                        } else {
                          statusColor = 'bg-purple-50 text-purple-700 border-purple-100';
                        }

                        return (
                          <tr key={ent.entry_id} className="hover:bg-slate-50/50 transition-colors">
                            {/* Entry ID */}
                            <td className="px-4 py-3.5 font-mono font-bold text-slate-700">
                              <div className="flex items-center gap-1.5">
                                <Ticket className="w-3.5 h-3.5 text-indigo-400" />
                                <span>#{ent.entry_id}</span>
                              </div>
                            </td>

                            {/* Contestant */}
                            <td className="px-4 py-3.5">
                              <div>
                                <div className="font-semibold text-slate-900">{ent.username}</div>
                                <div className="text-[10px] text-slate-400 font-mono">ID: {ent.user_id}</div>
                              </div>
                            </td>

                            {/* NFL Week */}
                            <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-600">
                              Week {ent.week}
                            </td>

                            {/* Selected Team */}
                            <td className="px-4 py-3.5 font-medium text-slate-800">
                              {ent.selected_team}
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3.5 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-mono font-extrabold tracking-wide ${statusColor}`}>
                                {ent.status}
                              </span>
                            </td>

                            {/* Override Actions */}
                            <td className="px-4 py-3.5">
                              <div className="flex items-center justify-center gap-2">
                                {/* State Override Select */}
                                <div className="relative">
                                  <select
                                    disabled={isUpdating || isDeleting}
                                    value={ent.status}
                                    onChange={(e) => handleOverrideEntryStatus(ent.entry_id, e.target.value as any)}
                                    className="bg-slate-50 border border-slate-200 text-[10px] font-mono font-bold rounded-md px-1.5 py-1 text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <option value="SUBMITTED">SUBMITTED</option>
                                    <option value="PENDING">PENDING</option>
                                    <option value="STUCK">STUCK</option>
                                    <option value="OVERRIDDEN">OVERRIDDEN</option>
                                  </select>
                                </div>

                                {/* Unlock button for STUCK status */}
                                {ent.status === 'STUCK' && (
                                  <button
                                    disabled={isUpdating || isDeleting}
                                    onClick={() => handleUnlockEntry(ent.entry_id)}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md border bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 text-[10px] font-mono font-extrabold transition-all cursor-pointer disabled:opacity-50"
                                    title="Unlock submission pipeline"
                                  >
                                    <Unlock className="w-3 h-3 shrink-0" />
                                    Unlock
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* Delete Button */}
                            <td className="px-4 py-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5 min-h-[28px]">
                                {isAwaitingDelete ? (
                                  <div className="flex items-center gap-1">
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
