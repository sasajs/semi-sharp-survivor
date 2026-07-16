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

# 5. Generate System Documentation (New Step)
echo "Generating system documentation snapshots..."
cd ~/Projects/SemiSharp/BackEnd
source .venv/bin/activate
python3 scripts/documentation/generate_system_snapshot.py

# 6. Run Regression Tests
echo "Running regression tests..."
python3 scripts/tests/regression_test.py
TEST_RESULT=$?

# 7. Validate and Restart
if [ $TEST_RESULT -eq 0 ]; then
    echo "Tests passed. Restarting backend and frontend services..."
    sudo systemctl restart semisharp-backend
    sudo systemctl restart semisharp-frontend
    sleep 10
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://semisharp.steveschilhabel.com)

    if [ "$RESPONSE" == "200" ]; then
      echo "Deployment successful: Site is live (HTTP 200)."
    else
      echo "Deployment Warning: Site returned HTTP $RESPONSE. Please check manually."
    fi
else
    echo "Deployment aborted: Regression tests failed (Exit Code: $TEST_RESULT)."
    exit 1
fi
