# Remote Access & Security Readiness Checklist

Use this checklist to ensure your server deployment is ready for remote access over the WAN net or public domain channels.

## 1. Authentication Checkpoints
- [ ] `AUTH_ENABLED` is set to `true` in production environment files.
- [ ] `ADMIN_PASSWORD` is custom, strong, and does not match the default `admin_test_password`.
- [ ] No hardcoded passwords or session tokens are exposed in code files or configuration logs.

## 2. Ingress Encryption & HTTPS
- [ ] Transport communication is encrypted using **HTTPS / SSL**.
- [ ] Redirection is established via Nginx or Cloudflare Tunnel to force HTTP to HTTPS requests.
- [ ] Strict Transport Security (HSTS) headers are configured on edge routers (Nginx/Cloudflare).

## 3. Tunneling Configuration
- [ ] `cloudflared` daemon is successfully running as an automatic system service.
- [ ] The DNS CNAME records correct configure toward the active tunnel bridge UUID.
- [ ] Config files are correctly secure with read/write permissions locked to admin users.

## 4. Local LAN Safety
- [ ] The local port `3000` is bound only to secure local interfaces or closed to external untunneled IPs if required.
- [ ] External router firewalls are audited to block raw external incoming traffic direct onto local ports.
