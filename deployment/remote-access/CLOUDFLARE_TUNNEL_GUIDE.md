# Cloudflare Tunnel Configuration Guide for Secure HTTPS Remote Access

This guide provides step-by-step instructions to configure **Cloudflare Tunnel (`cloudflared`)** for exposing our **Semi-Sharp** deployment securely over an authenticated, HTTPS-encrypted web gateway without exposing local firewall ports.

---

## ⚠️ CRITICAL SECURITY WARNING

> **CRITICAL:** Do not expose this app publicly unless administrative authentication is enabled and secured!
> Ensure the following variables are configured in your active deployment environment (`.env` or system variables):
>
> ```bash
> AUTH_ENABLED=true
> ADMIN_PASSWORD="your_extremely_strong_secure_custom_password"
> ```
> Keeping `AUTH_ENABLED=false` or utilizing the fallback default password (`admin_test_password`) will expose the administrative orchestration control panels to the public web and result in potential system compromises.

---

## Step-by-Step Server Setup Guide

Follow these sequential playbook instructions on the virtual server hosting your **Semi-Sharp** runtime instance.

### Step 1: Install `cloudflared`
Download the appropriate precompiled daemon artifact for your operating system (Debian/Ubuntu, CentOS, macOS, or Windows):
* **Ubuntu/Debian AMD64:**
  ```bash
  curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
  sudo dpkg -i cloudflared.deb
  ```
* **macOS (via Homebrew):**
  ```bash
  brew install cloudflare/cloudflare/cloudflared
  ```

### Step 2: Login to Cloudflare
Authenticate the daemon using your registered Cloudflare account:
```bash
cloudflared tunnel login
```
This command opens a browser window where you select your custom domain (e.g., `your-domain.com`) to authorize the automatic generation of an API certificate key file.

### Step 3: Create the Network Tunnel
Spin up a persistent network tunnel linked to your authorized domain credentials:
```bash
cloudflared tunnel create semi-sharp-tunnel
```
This returns a unique UUID and saves the associated credentials JSON file (e.g., `~/.cloudflared/UUID.json`). Take note of this UUID.

### Step 4: Route DNS for Custom Subdomain
Add a CNAME entry pointing a target domain path (e.g., `semi-sharp.your-domain.com`) directly to your tunnel ingress UUID:
```bash
cloudflared tunnel route dns semi-sharp-tunnel semi-sharp.your-domain.com
```

### Step 5: Establish the Configuration File
Generate the production config file `cloudflared-config.yml` (saving it to `~/.cloudflared/config.yml` or `/etc/cloudflared/config.yml`) using the template found in this directory:
```yaml
tunnel: <TUNNEL_UUID_OR_NAME>
credentials-file: /root/.cloudflared/<TUNNEL_UUID>.json

ingress:
  - hostname: semi-sharp.your-domain.com
    service: http://localhost:3000
  - service: http_status:404
```

### Step 6: Install as a Persistent Daemon Service
Configuring the tunnel to boot automatically with the host system:
* **Linux (systemd):**
  ```bash
  sudo cloudflared --config /etc/cloudflared/config.yml service install
  ```
  This creates a background systemd daemon service.

### Step 7: Launch the Tunnel Service
Start the system service and verify active process telemetry logs:
```bash
sudo systemctl start cloudflared
sudo systemctl status cloudflared
```

### Step 8: Test Public HTTPS Connectivity
Navigate to your configured custom domain (e.g., `https://semi-sharp.your-domain.com`) using any web client. Confirm that the site loads over an active, trusted Cloudflare SSL/TLS connection and prompts for your custom administrative password.
