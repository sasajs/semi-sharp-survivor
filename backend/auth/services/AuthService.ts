import { AuthStatus, LoginResult } from "../models";
import { SessionService } from "./SessionService";

export class AuthService {
  /**
   * Determine if admin authentication is enabled via environment variable
   */
  static isAuthEnabled(): boolean {
    return process.env.AUTH_ENABLED === "true";
  }

  /**
   * Validate raw password input against stored ADMIN_PASSWORD environment variable
   */
  static validateAdminPassword(password?: string): boolean {
    const configuredPassword = process.env.ADMIN_PASSWORD || "admin_test_password";
    return typeof password === "string" && password === configuredPassword;
  }

  /**
   * Resolves authentication status based on the provided token
   */
  static getAuthStatus(token?: string): AuthStatus {
    const enabled = this.isAuthEnabled();
    const authenticated = !enabled || (!!token && SessionService.validateSession(token));
    const session = token ? SessionService.getSession(token) : null;

    return {
      enabled,
      authenticated,
      session
    };
  }

  /**
   * Creates a new session if password is valid
   */
  static createSession(password?: string): LoginResult {
    if (!this.validateAdminPassword(password)) {
      return { success: false, error: "Invalid administrative password.", session: null };
    }
    const session = SessionService.createSession();
    return { success: true, session };
  }

  /**
   * Destroys existing session
   */
  static destroySession(token?: string): void {
    if (token) {
      SessionService.destroySession(token);
    }
  }
}
export default AuthService;
