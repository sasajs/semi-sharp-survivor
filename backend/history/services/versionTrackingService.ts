export class VersionTrackingService {
  private static versionMap: Record<string, {
    data_version: number;
    feature_version: number;
    inventory_version: number;
    risk_version: number;
    recommendation_version: number;
    policy_version: number;
  }> = {};

  /**
   * Retrieves the current active versions for a given contest leg.
   * If not initialized, defaults to base version (1).
   */
  static getVersionsForLeg(legId: string) {
    if (!this.versionMap[legId]) {
      this.versionMap[legId] = {
        data_version: 1,
        feature_version: 1,
        inventory_version: 1,
        risk_version: 1,
        recommendation_version: 1,
        policy_version: 1
      };
    }
    return { ...this.versionMap[legId] };
  }

  /**
   * Increments a specific version component for a contest leg.
   */
  static incrementVersion(
    legId: string, 
    component: "data_version" | "feature_version" | "inventory_version" | "risk_version" | "recommendation_version" | "policy_version"
  ): number {
    const versions = this.getVersionsForLeg(legId);
    versions[component] += 1;
    this.versionMap[legId] = versions;
    return versions[component];
  }

  /**
   * Overrides versions for a contest leg.
   */
  static setVersions(
    legId: string, 
    versions: {
      data_version?: number;
      feature_version?: number;
      inventory_version?: number;
      risk_version?: number;
      recommendation_version?: number;
      policy_version?: number;
    }
  ) {
    const current = this.getVersionsForLeg(legId);
    this.versionMap[legId] = {
      data_version: versions.data_version ?? current.data_version,
      feature_version: versions.feature_version ?? current.feature_version,
      inventory_version: versions.inventory_version ?? current.inventory_version,
      risk_version: versions.risk_version ?? current.risk_version,
      recommendation_version: versions.recommendation_version ?? current.recommendation_version,
      policy_version: versions.policy_version ?? current.policy_version
    };
    return { ...this.versionMap[legId] };
  }
}
