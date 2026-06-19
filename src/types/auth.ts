export interface AdminSession {
  token: string;
  expiresAt: string;
}

export interface AuthStatus {
  enabled: boolean;
  authenticated: boolean;
  session: AdminSession | null;
}

export interface LoginResult {
  success: boolean;
  error?: string;
  session?: AdminSession | null;
}
