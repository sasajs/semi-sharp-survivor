/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppEnvironment } from './types';

// We allow storing a custom backend URL in localStorage to support dynamic override in the sandbox
const STORAGE_KEY_BACKEND_URL = 'semisharp_backend_url';
const STORAGE_KEY_AUTH_HEADERS = 'semisharp_custom_headers';

// Immediate self-executing cleanup block to purge any legacy localhost/127.0.0.1 backend URL from browser localStorage
try {
  const stored = localStorage.getItem(STORAGE_KEY_BACKEND_URL);
  if (stored && (stored.includes('localhost') || stored.includes('127.0.0.1') || stored.includes('8000'))) {
    localStorage.removeItem(STORAGE_KEY_BACKEND_URL);
  }
} catch (e) {
  console.error('Error running immediate localStorage cleanup:', e);
}

// Retrieve values from Vite's environment variables with clean fallbacks
const getCleanDefaultUrl = (): string => {
  const envVal = (import.meta as any).env.VITE_API_BASE_URL || (import.meta as any).env.VITE_BACKEND_URL;
  if (envVal && (envVal.includes('localhost') || envVal.includes('127.0.0.1') || envVal.includes('8000'))) {
    return 'https://api.steveschilhabel.com';
  }
  return envVal || 'https://api.steveschilhabel.com';
};

const DEFAULT_BACKEND_URL = getCleanDefaultUrl();
const DEFAULT_API_VERSION = (import.meta as any).env.VITE_API_VERSION || '1.0';
const DEFAULT_ENVIRONMENT = (import.meta as any).env.VITE_ENVIRONMENT || 'development';

export const getBackendUrl = (): string => {
  const stored = localStorage.getItem(STORAGE_KEY_BACKEND_URL);
  if (stored && (stored.includes('localhost') || stored.includes('127.0.0.1') || stored.includes('8000'))) {
    // Stale local development URLs detected, clean them to default to the production backend
    localStorage.removeItem(STORAGE_KEY_BACKEND_URL);
    return DEFAULT_BACKEND_URL;
  }
  return stored || DEFAULT_BACKEND_URL;
};

export const API_BASE_URL = getBackendUrl();

export const setBackendUrl = (url: string): void => {
  if (!url) {
    localStorage.removeItem(STORAGE_KEY_BACKEND_URL);
  } else {
    // Normalize URL: remove trailing slash
    const normalized = url.trim().replace(/\/+$/, '');
    localStorage.setItem(STORAGE_KEY_BACKEND_URL, normalized);
  }
};

export const getCustomHeaders = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH_HEADERS);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Error parsing custom headers from localStorage:', e);
    return {};
  }
};

export const setCustomHeaders = (headers: Record<string, string>): void => {
  localStorage.setItem(STORAGE_KEY_AUTH_HEADERS, JSON.stringify(headers));
};

export const AppConfig: AppEnvironment = {
  get BACKEND_URL() {
    return getBackendUrl();
  },
  API_VERSION: DEFAULT_API_VERSION,
  ENVIRONMENT: DEFAULT_ENVIRONMENT,
  AUTH_HEADER_KEY: 'X-SemiSharp-Auth-Token',
};

export default AppConfig;
