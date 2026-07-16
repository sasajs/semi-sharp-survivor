/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, SurvivorEntry, LoginResponse } from '../types';
import { SemiSharpApi, ApiError } from '../api';
import { getBackendUrl, setBackendUrl as saveBackendUrl, getCustomHeaders, setCustomHeaders as saveCustomHeaders } from '../config';

interface AuthContextType {
  user: UserProfile | null;
  selectedEntry: SurvivorEntry | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  backendUrl: string;
  customHeaders: Record<string, string>;
  
  login: (username: string, password: string) => Promise<UserProfile>;
  logout: () => void;
  selectEntry: (entry: SurvivorEntry | null) => void;
  updateBackendUrl: (url: string) => void;
  updateCustomHeaders: (headers: Record<string, string>) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY_USER = 'semisharp_user';
const SESSION_KEY_ENTRY = 'semisharp_selected_entry';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<SurvivorEntry | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [backendUrl, setBackendUrlState] = useState<string>(getBackendUrl());
  const [customHeaders, setCustomHeadersState] = useState<Record<string, string>>(getCustomHeaders());

  // Bootstrap authentication session from localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(SESSION_KEY_USER);
      const storedEntry = localStorage.getItem(SESSION_KEY_ENTRY);

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser) as UserProfile;
        
        // Stale session check: if entries exist but lack format fields, discard and force login
        const isStale = parsedUser.entries.length > 0 && parsedUser.entries.some(e => !e.format_code);
        if (isStale) {
          localStorage.removeItem(SESSION_KEY_USER);
          localStorage.removeItem(SESSION_KEY_ENTRY);
          setUser(null);
          setSelectedEntry(null);
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        setUser(parsedUser);
        setIsAuthenticated(true);

        if (storedEntry) {
          const parsedEntry = JSON.parse(storedEntry) as SurvivorEntry;
          // Verify that the stored entry still belongs to the user and pick the fresh one from parsedUser
          const matchedEntry = parsedUser.entries.find(e => e.entry_id === parsedEntry.entry_id);
          if (matchedEntry) {
            setSelectedEntry(matchedEntry);
          } else if (parsedUser.entries.length > 0) {
            setSelectedEntry(parsedUser.entries[0]);
          }
        } else if (parsedUser.entries.length > 0) {
          setSelectedEntry(parsedUser.entries[0]);
        }
      }
    } catch (e) {
      console.error('Error recovering session from storage:', e);
      localStorage.removeItem(SESSION_KEY_USER);
      localStorage.removeItem(SESSION_KEY_ENTRY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string): Promise<UserProfile> => {
    setIsLoading(true);
    setError(null);
    try {
      const response: LoginResponse = await SemiSharpApi.login(username, password);
      
      // Map to profile
      const userProfile: UserProfile = {
        user_id: String(response.user.user_id),
        username: response.user.username,
        display_name: response.user.display_name,
        role: response.user.role,
        entries: (response.user.entries || []).map(entry => ({
          entry_id: String(entry.entry_id),
          survivor_sweat_name: entry.survivor_sweat_name,
          entry_label: entry.entry_label,
          is_active: entry.is_active,
          contest_format_id: entry.contest_format_id,
          format_code: entry.format_code,
          format_name: entry.format_name,
        })),
      };

      setUser(userProfile);
      setIsAuthenticated(true);
      localStorage.setItem(SESSION_KEY_USER, JSON.stringify(userProfile));

      // Auto-select first active entry if available
      const defaultEntry = userProfile.entries.find(e => e.is_active) || userProfile.entries[0] || null;
      setSelectedEntry(defaultEntry);
      if (defaultEntry) {
        localStorage.setItem(SESSION_KEY_ENTRY, JSON.stringify(defaultEntry));
      } else {
        localStorage.removeItem(SESSION_KEY_ENTRY);
      }

      return userProfile;
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : 'Invalid credentials or failed to contact authentication service.';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setSelectedEntry(null);
    setIsAuthenticated(false);
    setError(null);
    localStorage.removeItem(SESSION_KEY_USER);
    localStorage.removeItem(SESSION_KEY_ENTRY);
  };

  const selectEntry = (entry: SurvivorEntry | null) => {
    setSelectedEntry(entry);
    if (entry) {
      localStorage.setItem(SESSION_KEY_ENTRY, JSON.stringify(entry));
    } else {
      localStorage.removeItem(SESSION_KEY_ENTRY);
    }
  };

  const updateBackendUrl = (url: string) => {
    saveBackendUrl(url);
    setBackendUrlState(getBackendUrl());
  };

  const updateCustomHeaders = (headers: Record<string, string>) => {
    saveCustomHeaders(headers);
    setCustomHeadersState(getCustomHeaders());
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        selectedEntry,
        isAuthenticated,
        isLoading,
        error,
        backendUrl,
        customHeaders,
        login,
        logout,
        selectEntry,
        updateBackendUrl,
        updateCustomHeaders,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
