import { BuildMetadata } from "../models";

export const APP_VERSION = "v0.14-systemd-lifecycle-management";
export const BUILD_VERSION = "1.0.14"; // Centralized metadata build identifier
export const API_VERSION = "v1.0.0";

export class BuildMetadataService {
  /**
   * Returns current active versions.
   */
  static getVersions() {
    return {
      applicationVersion: APP_VERSION,
      apiVersion: API_VERSION,
      buildVersion: BUILD_VERSION
    };
  }

  /**
   * Returns the complete assembled build metadata dashboard.
   */
  static getBuildMetadata(): BuildMetadata {
    return {
      applicationVersion: APP_VERSION,
      gitCommit: process.env.GIT_COMMIT || "8f9a2e31bcde4f5a6b7c8d9e0f1a2b3c4d5e6f7a",
      buildTimestamp: process.env.BUILD_TIMESTAMP || new Date("2026-06-18T00:00:00Z").toISOString(),
      environment: process.env.NODE_ENV || "development"
    };
  }
}
