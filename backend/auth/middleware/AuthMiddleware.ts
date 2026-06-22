import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/AuthService";
import { SessionService } from "../services/SessionService";
import { AuthAuditService } from "../services/AuthAuditService";

// Extend Express Request interface to hold the session details safely
export interface AuthenticatedRequest extends Request {
  userSession?: {
    token: string;
    expiresAt: string;
    role: "ADMIN" | "USER";
  };
}

export const extractToken = (req: Request): string | undefined => {
  const customHeader = req.headers["x-admin-token"];
  if (typeof customHeader === "string") return customHeader;

  const authHeader = req.headers["authorization"];
  if (typeof authHeader === "string" && authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.substring(7);
  }

  // Fallback check
  if (typeof req.query.token === "string" && req.query.token) {
    return req.query.token;
  }

  return undefined;
};

/**
 * Authentication Middleware:
 * Rejects requests if authentication is enabled and no valid session is found.
 */
export const AuthenticationMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const enabled = AuthService.isAuthEnabled();
  if (!enabled) {
    // If authentication is disabled, inject a mock administrative session for compatibility
    req.userSession = {
      token: "disabled_bypass",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      role: "ADMIN"
    };
    return next();
  }

  const token = extractToken(req);
  if (!token || !SessionService.validateSession(token)) {
    // Audit failed access attempt
    AuthAuditService.log({
      eventType: "UNAUTHORIZED_ATTEMPT",
      username: "unauthenticated",
      ipAddress: req.ip || "unknown",
      userAgent: req.headers["user-agent"],
      result: `Rejected unauthenticated connection request to: ${req.originalUrl}`
    }).catch(err => console.error("Error logging unauthorized attempt:", err));

    return res.status(401).json({
      success: false,
      error: "UNAUTHORIZED",
      message: "Authentication token missing, invalid, or expired."
    });
  }

  const session = SessionService.getSession(token);
  if (!session) {
    return res.status(401).json({
      success: false,
      error: "UNAUTHORIZED",
      message: "Session is inactive."
    });
  }

  req.userSession = session;
  return next();
};

/**
 * Role Middleware:
 * Verifies that the authenticated user possesses the required role.
 * Returns HTTP 403 Forbidden with standard JSON if unauthorized.
 */
export const RoleMiddleware = (requiredRole: "ADMIN" | "USER") => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // If auth is not enabled, let it pass
    if (!AuthService.isAuthEnabled()) {
      return next();
    }

    const session = req.userSession;
    if (!session) {
      return res.status(401).json({
        success: false,
        error: "UNAUTHORIZED"
      });
    }

    // Role Hierarchy check: ADMIN satisfies both roles. USER only satisfies requiredRole === "USER".
    const isAuthorized = 
      session.role === requiredRole || 
      (requiredRole === "USER" && (session.role === "ADMIN" || session.role === "USER")) ||
      (session.role === "ADMIN");

    if (!isAuthorized) {
      // Audit forbidden access attempt
      AuthAuditService.log({
        eventType: "FORBIDDEN_ATTEMPT",
        username: session.role === "ADMIN" ? "admin" : "user",
        ipAddress: req.ip || "unknown",
        userAgent: req.headers["user-agent"],
        result: `Blocked role ${session.role} trying to access: ${req.originalUrl} (required: ${requiredRole})`
      }).catch(err => console.error("Error logging forbidden attempt:", err));

      return res.status(403).json({
        success: false,
        error: "FORBIDDEN"
      });
    }

    return next();
  };
};
