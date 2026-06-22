import { AuthService } from "./AuthService";
import { SessionService } from "./SessionService";
import { AuthAuditService } from "./AuthAuditService";
import { SecurityStatus } from "../../../src/types/admin";

export class SecurityStatusService {
  /**
   * Aggregates active session telemetry, security policies, and 24h audit metrics
   */
  static async getStatus(): Promise<SecurityStatus> {
    const authenticationEnabled = AuthService.isAuthEnabled();
    const timeoutEnv = process.env.AUTH_SESSION_TIMEOUT_MINUTES || process.env.ADMIN_SESSION_TTL_MINUTES || "60";
    const sessionTimeoutMinutes = parseInt(timeoutEnv, 10);
    const activeSessions = SessionService.getActiveSessionsCount();

    const logs24h = await AuthAuditService.getLogs24h();
    const failedLogins24h = logs24h.filter(log => log.eventType === "LOGIN_FAILURE").length;
    const unauthorizedAttempts24h = logs24h.filter(log => 
      log.eventType === "UNAUTHORIZED_ATTEMPT" || log.eventType === "FORBIDDEN_ATTEMPT"
    ).length;

    const recentAttempts = await AuthAuditService.getRecentLogs(25);

    return {
      authenticationEnabled,
      sessionTimeoutMinutes,
      activeSessions,
      failedLogins24h,
      unauthorizedAttempts24h,
      recentAttempts
    };
  }
}

export default SecurityStatusService;
