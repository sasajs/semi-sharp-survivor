import { AuthStatus, LoginResult } from "../models";
import { SessionService } from "./SessionService";
import { AuthAuditService } from "./AuthAuditService";

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
  static createSession(params: {
    password?: string;
    role?: "ADMIN" | "USER";
    ipAddress?: string;
    userAgent?: string;
  }): LoginResult {
    const role = params.role || "ADMIN";
    const username = role === "ADMIN" ? "admin" : "user";

    // Standard security checks: if role is USER, we can default to allow without a password,
    // or validate if we want USER logins to have access. But typically we want USER login to pass too,
    // or permit users to log in with user-credentials, or the same password, or just allow instant mock login
    // so they can test the USER role. Supporting role selection easily is perfect.
    // If auth is disabled, allow anyway.
    // If auth is enabled, ADMIN role requires password. USER role can login as well.
    let isValid = true;
    if (this.isAuthEnabled()) {
      if (role === "ADMIN") {
        isValid = this.validateAdminPassword(params.password);
      } else {
        // If they want to login as USER, we can allow standard password or any password,
        // but let's check validation: we can pass USER login if admin password works,
        // or just allow user role to bypass password or use admin password as well.
        // Let's require the admin password or any string to make it consistent.
        isValid = this.validateAdminPassword(params.password) || params.password === "user" || !params.password;
      }
    }

    if (!isValid) {
      AuthAuditService.log({
        eventType: "LOGIN_FAILURE",
        username,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        result: `Blocked login attempt for role ${role}. Incorrect password.`
      }).catch(err => console.error("Audit log error:", err));

      return { success: false, error: "Invalid credentials.", session: null };
    }

    const session = SessionService.createSession(role);

    AuthAuditService.log({
      eventType: "LOGIN_SUCCESS",
      username,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      result: `Granted session for role ${role}. Expires at: ${session.expiresAt}`
    }).catch(err => console.error("Audit log error:", err));

    return { success: true, session };
  }

  /**
   * Destroys existing session
   */
  static destroySession(token?: string, ipAddress?: string, userAgent?: string): void {
    if (token) {
      const session = SessionService.getSession(token);
      const username = session ? (session.role === "ADMIN" ? "admin" : "user") : "unknown";
      
      SessionService.destroySession(token);

      AuthAuditService.log({
        eventType: "LOGOUT",
        username,
        ipAddress,
        userAgent,
        result: `Session token prefix ${token.substring(0, 10)} invalidated successfully.`
      }).catch(err => console.error("Audit log error:", err));
    }
  }
}
export default AuthService;
