#!/bin/bash
set -e

# 1. Clear staging and extract
rm -rf ~/Projects/temp_sync/*
unzip -o ~/Downloads/semisharp-frontend-interface.zip -d ~/Projects/temp_sync/

# 2. Copy files to production
rsync -av --delete ~/Projects/temp_sync/ ~/Projects/SemiSharp/FrontEnd/

# 3. Apply permanent production fix
grep -q "allowedHosts" ~/Projects/SemiSharp/FrontEnd/vite.config.ts || sed -i '/return {/a \    preview: { allowedHosts: true },' ~/Projects/SemiSharp/FrontEnd/vite.config.ts

# 4. Build
cd ~/Projects/SemiSharp/FrontEnd
npm install
npm run build

# 5. Run Regression Tests
echo "Running regression tests..."
python3 ~/Projects/SemiSharp/BackEnd/scripts/tests/regression_test.py

# 6. Restart and Validate
echo "Tests passed. Restarting service..."
sudo systemctl restart semisharp-frontend
sleep 10
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://semisharp.steveschilhabel.com)

if [ "$RESPONSE" == "200" ]; then
  echo "Deployment successful: Site is live (HTTP 200)."
else
  echo "Deployment Warning: Site returned HTTP $RESPONSE. Please check manually."
fi
