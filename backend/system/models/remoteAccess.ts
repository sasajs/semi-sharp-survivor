export interface RemoteAccessStatus {
  lanUrl: string;
  localPort: number;
  recommendedPublicAccess: string;
  httpsRequired: boolean;
  authRecommended: boolean;
  cloudflareTunnelConfigured: boolean;
  tailscaleConfigured: boolean;
  warnings: string[];
  nextSteps: string[];
}
