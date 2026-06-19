import { AdminSession } from "../models";

export class SessionService {
  private static sessions: Map<string, AdminSession> = new Map();

  /**
   * Generates a new session with configured TTL
   */
  static createSession(): AdminSession {
    const ttlMinutes = parseInt(process.env.ADMIN_SESSION_TTL_MINUTES || "480", 10);
    const token = "sess_" + Math.random().toString(36).substring(2, 10) + "_" + Date.now().toString(36);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();
    
    const session: AdminSession = {
      token,
      expiresAt
    };

    this.sessions.set(token, session);
    this.cleanupExpiredSessions();
    return session;
  }

  /**
   * Validates if a token is active and not expired
   */
  static validateSession(token: string): boolean {
    this.cleanupExpiredSessions();
    if (!token) return false;
    
    const session = this.sessions.get(token);
    if (!session) return false;

    const expired = new Date(session.expiresAt).getTime() < Date.now();
    if (expired) {
      this.sessions.delete(token);
      return false;
    }

    return true;
  }

  /**
   * Retrieves active session details
   */
  static getSession(token: string): AdminSession | null {
    if (this.validateSession(token)) {
      return this.sessions.get(token) || null;
    }
    return null;
  }

  /**
   * Invalidates a session by token
   */
  static destroySession(token: string): void {
    if (token) {
      this.sessions.delete(token);
    }
  }

  /**
   * Clear all active sessions (e.g. on config reload or administrative clear)
   */
  static clearAllSessions(): void {
    this.sessions.clear();
  }

  /**
   * Prune expired sessions from in-memory cache
   */
  private static cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [token, session] of this.sessions.entries()) {
      if (new Date(session.expiresAt).getTime() < now) {
        this.sessions.delete(token);
      }
    }
  }
}
export default SessionService;
