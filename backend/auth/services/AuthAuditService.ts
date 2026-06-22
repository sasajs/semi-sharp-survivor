import { authAuditRepo } from "../../repositories/index";
import { AuthAuditRecord } from "../../../src/types/admin";

export class AuthAuditService {
  /**
   * Logs an authentication event to the audit repository
   */
  static async log(params: {
    eventType: string;
    username: string;
    ipAddress?: string;
    userAgent?: string;
    result: string;
  }): Promise<AuthAuditRecord> {
    return authAuditRepo.create({
      eventType: params.eventType,
      username: params.username,
      ipAddress: params.ipAddress || "unknown",
      userAgent: params.userAgent || "unknown",
      result: params.result
    });
  }

  /**
   * Gets recent audit log entries
   */
  static async getRecentLogs(limit: number = 50): Promise<AuthAuditRecord[]> {
    return authAuditRepo.getRecent(limit);
  }

  /**
   * Gets all audit log records from the last 24 hours
   */
  static async getLogs24h(): Promise<AuthAuditRecord[]> {
    const logs = await authAuditRepo.getAll();
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return logs.filter(log => new Date(log.timestamp).getTime() > oneDayAgo);
  }
}

export default AuthAuditService;
