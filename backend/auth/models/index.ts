export interface AdminSession {
  token: string;
  expiresAt: string; // ISO String
}

export interface AuthStatus {
  enabled: boolean;
  authenticated: boolean;
  session: AdminSession | null;
}

export interface LoginRequest {
  password?: string;
}

export interface LoginResult {
  success: boolean;
  error?: string;
  session?: AdminSession | null;
}
