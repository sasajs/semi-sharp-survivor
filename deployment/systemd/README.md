# Semi-Sharp V2 Deployment Guide: Systemd Services

This folder contains the production-ready systemd configuration and system lifecycle documentation to manage the Semi-Sharp V2 full-stack application lifecycle, handle automated recovery, facilitate graceful shutdowns, and prepare for future scheduled batch workers.

---

## Service Architecture

1. **`semisharp.service` (Core Web/API Server)**
   - Manages the primary web server (Express API router + Vite compiled frontend).
   - Auto-starts on server reboot.
   - Monitors health and initiates auto-restart (within 5 seconds) upon unexpected runtime crashes.
   - Listens to system signals (`SIGTERM`, `SIGINT`) to finish active Monte Carlo simulations or Weekly Reports before terminating.

2. **`semisharp-worker.service` (Background Workflows)**
   - A robust background service placeholder.
   - Designed to execute scheduled cron triggers, periodic weekly simulations, and automated telemetry inputs in production environments.
   - Sandboxed to depend on `semisharp.service` being fully operational.

---

## Installation & Setup

1. **Deploy Files to Host**
   Move the application directory into `/opt/semisharp` and compile the web-server assets:
   ```bash
   sudo mkdir -p /opt/semisharp
   sudo cp -r . /opt/semisharp
   cd /opt/semisharp
   npm install
   npm run build
   ```

2. **Configure Service Account Permissions**
   Create a non-privileged system user under which the application process runs:
   ```bash
   sudo useradd -r -s /bin/false semisharp
   sudo chown -R semisharp:semisharp /opt/semisharp
   ```

3. **Deploy Systemd Unit Files**
   Copy the systemd configuration files to the standard daemon configuration directory:
   ```bash
   sudo cp /opt/semisharp/deployment/systemd/semisharp.service /etc/systemd/system/
   sudo cp /opt/semisharp/deployment/systemd/semisharp-worker.service /etc/systemd/system/
   ```

4. **Prepare Environment Settings**
   Configure your secrets, PostgreSQL database links, and deployment flags within a standard secured `.env` environment file:
   ```bash
   sudo cp /opt/semisharp/.env.example /opt/semisharp/.env
   sudo chmod 600 /opt/semisharp/.env
   sudo chown semisharp:semisharp /opt/semisharp/.env
   ```

---

## Service Management Commands

### Daemon Reload
Whenever systemd configurations (`.service` files) are added or modified, reload the coordinator:
```bash
sudo systemctl daemon-reload
```

### Enable Service
Register the app service to start automatically during host reboot:
```bash
sudo systemctl enable semisharp
# Enable the background worker too if ready:
sudo systemctl enable semisharp-worker
```

### Start Service
Launch the core web server and initialize the lifecycle engine:
```bash
sudo systemctl start semisharp
```

### Restart Service
Force restart the service manually:
```bash
sudo systemctl restart semisharp
```

### Disable Service
Deregister the service from auto-boot routines:
```bash
sudo systemctl disable semisharp
```

### Check service active status
Verify current execution states and standard startup/lifecycle details:
```bash
sudo systemctl status semisharp
```

### Interrogate real-time logs (syslog/journald)
Display live standard outputs and error outputs:
```bash
journalctl -u semisharp -f
```

---

## Live System Operations & Upgrades

The application supports robust, continuous integration-friendly upgrades and continuous status monitoring through standard API-exposed metrics.

### 1. View Runtime Version & Health Indicators
You can monitor system and health statistics through the HTTP routes:
* **Overall Health Checklist**: `GET /api/system/health`
* **Lifecycle State & Process Uptime**: `GET /api/system/status`
* **Version Identification**: `GET /api/system/version`
* **Metadata Commits & Build Timestamps**: `GET /api/system/build-info`

### 2. Smooth Standard Upgrade Process
To upgrade the application without exposing corrupt partially compile-states to users, follow this robust workflow:

```bash
# 1. Pull latest verified repository release
cd /opt/semisharp
git pull origin main

# 2. Re-install updated dependencies and compile
npm install
npm run build

# 3. Reload daemon configurations
sudo systemctl daemon-reload

# 4. Restart services. 
# Active running simulations or exports will gracefully complete before stopping the previous loop.
sudo systemctl restart semisharp
```
