import fs from "fs";
import path from "path";
import os from "os";
import { RemoteAccessStatus } from "../../../src/types";
import { AuthService } from "../../auth/services/AuthService";

export class RemoteAccessStatusService {
  /**
   * Evaluates the deployment status, LAN addresses, and remote tunnel readiness configurations.
   */
  static getStatus(): RemoteAccessStatus {
    const localPort = 3000;
    
    // Evaluate the local LAN URL dynamically
    let ipAddress = "192.168.1.38";
    try {
      const interfaces = os.networkInterfaces();
      let foundIp = false;
      for (const devName in interfaces) {
        const iface = interfaces[devName];
        if (iface) {
          for (const alias of iface) {
            if (alias.family === "IPv4" && !alias.internal) {
              // Prioritize common standard IP ranges, but take any active LAN IPv4
              ipAddress = alias.address;
              foundIp = true;
              break;
            }
          }
        }
        if (foundIp) break;
      }
    } catch (e) {
      // Keep fallback
    }

    const lanUrl = process.env.LAN_URL || `http://${ipAddress}`;

    // Detect Cloudflare Tunnel template/config or process.env configuration variables
    const configPath = path.join(process.cwd(), "deployment/remote-access/cloudflared-config.yml");
    const cloudflareTunnelConfigured = 
      process.env.CLOUDFLARE_TUNNEL_CONFIGURED === "true" || 
      fs.existsSync(configPath);
      
    // Detect Tailscale config env variable
    const tailscaleConfigured = process.env.TAILSCALE_CONFIGURED === "true";

    const warnings: string[] = [];
    const nextSteps: string[] = [];

    const authEnabled = AuthService.isAuthEnabled();
    const adminPassword = process.env.ADMIN_PASSWORD;
    const isDefaultPassword = !adminPassword || adminPassword === "admin_test_password";

    // Enforce prompt security warnings
    if (!authEnabled) {
      warnings.push("Do not expose this app publicly unless AUTH_ENABLED=true and ADMIN_PASSWORD is set.");
    } else if (isDefaultPassword) {
      warnings.push("Authentication is enabled, but utilizing a default or weak ADMIN_PASSWORD. Set a secure password before exposing publicly.");
    }

    if (!cloudflareTunnelConfigured && !tailscaleConfigured) {
      warnings.push("No secure remote access tunnel has been configured. The application is currently only accessible via the local LAN network.");
    }

    // Set defaults from prompt
    const recommendedPublicAccess = "cloudflare_tunnel";
    const httpsRequired = true;
    const authRecommended = true;

    // Compile setup guiding next steps
    if (!cloudflareTunnelConfigured) {
      nextSteps.push("Install cloudflared: On the host machine running the server, download and install the Cloudflare Tunnel client daemon.");
      nextSteps.push("Login to Cloudflare: Execute 'cloudflared tunnel login' to authorize the tunnel on your cloud account.");
      nextSteps.push("Create a tunnel: Execute 'cloudflared tunnel create semi-sharp-tunnel' to build the network bridge.");
      nextSteps.push("Route DNS: Bind your custom domain Name with 'cloudflared tunnel route dns semi-sharp-tunnel your-domain.com'.");
      nextSteps.push("Create configuration: Generate 'deployment/remote-access/cloudflared-config.yml' based on the template.");
      nextSteps.push("Install service: Run 'cloudflared service install' to load the process as an automatic background service daemon.");
      nextSteps.push("Start tunnel: Start the service or run 'cloudflared tunnel run semi-sharp-tunnel' to initiate public access.");
      nextSteps.push("Test URL: Test your configured custom domain over HTTPS from an external network connection.");
    } else {
      nextSteps.push("Cloudflare Tunnel active / configuration detected. Ensure the local system daemon is up and routing correctly.");
      if (!authEnabled) {
        nextSteps.push("URGENT: Enable administrative authentication (AUTH_ENABLED=true) to prevent unauthorized public access.");
      }
    }

    return {
      lanUrl,
      localPort,
      recommendedPublicAccess,
      httpsRequired,
      authRecommended,
      cloudflareTunnelConfigured,
      tailscaleConfigured,
      warnings,
      nextSteps
    };
  }
}
