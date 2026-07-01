#!/bin/bash
# scripts/stop-local-server.sh
echo "=== Semi-Sharp Local Server Stop Tool ==="

# Find local dev/validation server PIDs
# Look for processes running server.ts or tsx server.ts, excluding grep and this script itself
PIDS=$(ps aux | grep -iE 'server.ts|tsx' | grep -v grep | grep -v 'stop-local-server' | awk '{print $2}')

if [ -z "$PIDS" ]; then
  echo "No active local Semi-Sharp dev or validation servers found."
else
  echo "Found the following local server processes to stop:"
  ps aux | grep -iE 'server.ts|tsx' | grep -v grep | grep -v 'stop-local-server'
  
  echo "Stopping processes: $PIDS..."
  # Try SIGTERM first
  kill $PIDS 2>/dev/null || true
  sleep 2
  
  # Check if any are still running and force kill if necessary
  STILL_RUNNING=$(ps aux | grep -iE 'server.ts|tsx' | grep -v grep | grep -v 'stop-local-server' | awk '{print $2}')
  if [ -n "$STILL_RUNNING" ]; then
    echo "Some processes did not exit cleanly. Force terminating: $STILL_RUNNING..."
    kill -9 $STILL_RUNNING 2>/dev/null || true
    sleep 1
  fi
  echo "Stop complete."
fi

# Verify port 3000 and 24678 are clear
echo "Verifying ports 3000 and 24678..."
PORT_3000_OCCUPIED=$(ss -tlnH sport = :3000 2>/dev/null || netstat -tln | grep :3000 || grep -q "0BB8" /proc/net/tcp 2>/dev/null && echo "Occupied" || echo "")
PORT_24678_OCCUPIED=$(ss -tlnH sport = :24678 2>/dev/null || netstat -tln | grep :24678 || grep -q "6066" /proc/net/tcp 2>/dev/null && echo "Occupied" || echo "")

if [ -n "$PORT_3000_OCCUPIED" ]; then
  echo "WARNING: Port 3000 is still occupied!"
else
  echo "PASS: Port 3000 is free."
fi

if [ -n "$PORT_24678_OCCUPIED" ]; then
  echo "WARNING: Port 24678 is still occupied!"
else
  echo "PASS: Port 24678 is free."
fi
