# Tailscale VPN Reference Guide for Private Remote Access

This document discusses configuring **Tailscale** as a high-security, peer-to-peer wireguard VPN mesh alternative to expose **Semi-Sharp** across remote devices without publishing the web app on the public internet.

---

## Why Tailscale?

If you do not want to configure public DNS or expose public HTTP routes to any non-authenticated client, Tailscale provides a private, encrypted overlay network (tailnet) where only authorized personal devices can interact with port `3000`.

---

## ⚠️ Security Enforcement

Even with a private VPN network, it is strongly recommended to enable standard administrative security:
```bash
AUTH_ENABLED=true
ADMIN_PASSWORD="your_private_strong_password"
```

---

## Setup Playbook

### Step 1: Install Tailscale on your Host Server
Download the daemon onto your Semi-Sharp host server machine:
* **Ubuntu/Debian auto-installation script:**
  ```bash
  curl -fsSL https://tailscale.com/install.sh | sh
  ```

### Step 2: Authenticate and Connect
Launch the tailscale helper to authorize your server on your personal Tailnet network:
```bash
sudo tailscale up
```
Click the provided web link to authenticate with your tailscale admin account.

### Step 3: Record your Tailscale Private IP
Retrieve the newly assigned private wireguard IPv4 address:
```bash
tailscale ip -4
```
This address (commonly in the `100.x.y.z` range) represents your server's secure endpoint on your tailnet mesh.

### Step 4: Install Tailscale on client devices
Download and boot the Tailscale app client on your remote laptop, tablet, or phone. Authentic using the same tailnet account credentials.

### Step 5: Secure Local Access
Once connected, you can navigate directly to:
```
http://<YOUR_TAILSCALE_IP>:3000
```
This is fully secure. Traffic is encrypted end-to-end between your devices using robust noise protocol keys. Ports do not need to be forwarded on your physical router.

---

## Optional: Enable HTTPS with MagicDNS
Tailscale provides automated SSL/TLS certificates via MagicDNS:
1. Enable **MagicDNS** in your Admin console.
2. Enable **HTTPS Certificates** from your tailnet settings pane.
3. On the host server machine, demand your certificates:
   ```bash
   sudo tailscale cert
   ```
This provides a certified domain path for beautiful trusted HTTPS transport over your private tailscale mesh network.
