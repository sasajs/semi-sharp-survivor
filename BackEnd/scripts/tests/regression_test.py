import os
import sys
import subprocess
import httpx
from dotenv import load_dotenv
from app.db import get_connection

# Load environment variables to ensure sub-processes have database credentials
load_dotenv()

# Path management
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
sys.path.insert(0, BACKEND_DIR)
API_BASE = "http://127.0.0.1:8000"
results = []

def test(name, func):
    print(f"RUNNING {name}...", flush=True)
    try:
        func()
        print(f"COMPLETED {name}", flush=True)
        results.append((name, True, "OK"))
    except Exception as e:
        print(f"FAILED {name}: {str(e)}", flush=True)
        results.append((name, False, str(e)))

def run_script(path, args):
    def run():
        env = os.environ.copy()
        env["PYTHONPATH"] = BACKEND_DIR
        python_path = os.path.join(BACKEND_DIR, ".venv", "bin", "python3")
        result = subprocess.run([python_path, path] + args, check=False, env=env, capture_output=True, text=True)
        if result.returncode != 0:
            raise Exception(f"Exit {result.returncode}: {result.stderr}")
    return run

def api_get(endpoint, params=None):
    def run():
        response = httpx.get(f"{API_BASE}{endpoint}", params=params, timeout=120)
        if response.status_code != 200: 
            raise Exception(f"Status {response.status_code}: {response.text}")
    return run

def api_post(endpoint, payload, expected_status=200):
    def run():
        response = httpx.post(f"{API_BASE}{endpoint}", json=payload, timeout=120)
        if response.status_code != expected_status: 
            raise Exception(f"Status {response.status_code}: {response.text}")
    return run

# --- THE 38-TEST SUITE ---
# Database
test("[01] Database Connection", lambda: get_connection().cursor().execute("SELECT 1;"))
test("[02] Teams Loaded", lambda: get_connection().cursor().execute("SELECT COUNT(*) FROM reference.teams"))
test("[03] Aliases Loaded", lambda: get_connection().cursor().execute("SELECT COUNT(*) FROM reference.team_aliases"))
test("[04] Schedule Loaded", lambda: get_connection().cursor().execute("SELECT COUNT(*) FROM schedule.games"))
test("[05] PFF Ratings Loaded", lambda: get_connection().cursor().execute("SELECT COUNT(*) FROM ratings.pff_power_ratings"))
test("[06] SIC Scores Loaded", lambda: get_connection().cursor().execute("SELECT COUNT(*) FROM injuries.team_sic_scores"))
test("[07] Market Events Loaded", lambda: get_connection().cursor().execute("SELECT COUNT(*) FROM market.events"))
test("[08] Market Spreads Loaded", lambda: get_connection().cursor().execute("SELECT COUNT(*) FROM market.spreads"))
test("[09] Projection Engine V2", lambda: get_connection().cursor().execute("SELECT COUNT(*) FROM projections.game_spreads"))

# Strategy Scripts
test("[10] Strategy Current Week Highest Win", run_script("scripts/strategy/current_week_highest_win.py", ["--season", "2026", "--contest-format", "CIRCA", "--rating-week", "1", "--hfa-source", "SEMISHARP_2026", "--entry-id", "1"]))
test("[11] Strategy Future Value", run_script("scripts/strategy/future_value.py", ["--season", "2026", "--contest-format", "CIRCA", "--rating-week", "1", "--hfa-source", "SEMISHARP_2026", "--entry-id", "1"]))
test("[12] Strategy Multiple Entry", run_script("scripts/strategy/multiple_entry_portfolio.py", ["--season", "2026", "--contest-format", "CIRCA", "--rating-week", "1", "--hfa-source", "SEMISHARP_2026", "--user-id", "2"]))
test("[13] Strategy Circa Holiday", run_script("scripts/strategy/circa_holiday_reserve.py", ["--season", "2026", "--rating-week", "1", "--hfa-source", "SEMISHARP_2026"]))
test("[14] Strategy Projection Edge", run_script("scripts/strategy/projection_edge.py", ["--season", "2026", "--contest-format", "CIRCA"]))
test("[15] Strategy Monte Carlo", run_script("scripts/strategy/monte_carlo_survivor.py", ["--season", "2026", "--contest-format", "CIRCA", "--rating-week", "1", "--hfa-source", "SEMISHARP_2026"]))
test("[16] Strategy Dynamic Programming", run_script("scripts/strategy/dynamic_programming.py", ["--season", "2026", "--contest-format", "CIRCA", "--rating-week", "1", "--hfa-source", "SEMISHARP_2026"]))
test("[17] Strategy Bottom Six Road Fade", run_script("scripts/strategy/bottom_six_road_fade.py", ["--season", "2026", "--contest-format", "CIRCA", "--rating-week", "1", "--hfa-source", "SEMISHARP_2026"]))
test("[18] Strategy Market Arbitrage Exit", run_script("scripts/strategy/market_arbitrage_exit.py", ["--season", "2026", "--contest-format", "CIRCA", "--rating-week", "1", "--hfa-source", "SEMISHARP_2026"]))

# API Endpoints
test("[19] API Health", api_get("/health"))
test("[20] API Teams", api_get("/teams"))
test("[21] API Schedule", api_get("/schedule/2026/1"))
test("[22] API Projections", api_get("/projections/2026/1"))
test("[23] API Risk", api_get("/risk/2026/1"))
test("[24] API Market Consensus", api_get("/market/consensus/2026/1"))
test("[25] API Projection Edge", api_get("/market/projection-edge/2026/1"))
test("[26] API SIC", api_get("/injuries/sic/2026/1"))
test("[27] API Strategy Registry", api_get("/strategies"))
test("[28] API Context GET", api_get("/context/current"))

# Strategy API Tests
test("[29] API Strategy Current Week Highest Win", api_get("/strategies/current-week-highest-win/2026/CIRCA", {"rating_week": 1, "hfa_source": "SEMISHARP_2026", "entry_id": 1}))
test("[30] API Strategy Multiple Entry", api_get("/strategies/multiple-entry/2026/CIRCA", {"user_id": 2}))
test("[31] API Strategy Circa Holiday", api_get("/strategies/circa-holiday/2026", {"rating_week": 1, "hfa_source": "SEMISHARP_2026"}))
test("[32] API Strategy Projection Edge", api_get("/strategies/projection-edge/2026/CIRCA"))
test("[33] API Strategy Monte Carlo", api_get("/strategies/monte-carlo/2026/CIRCA"))
test("[34] API Strategy Dynamic Programming", api_get("/strategies/dynamic-programming/2026/CIRCA"))
test("[35] API Strategy Bottom Six Road Fade", api_get("/strategies/bottom-six-road-fade/2026/CIRCA"))
test("[36] API Strategy Market Arbitrage Exit", api_get("/strategies/market-arbitrage-exit/2026/CIRCA"))

# Auth Tests
test("[37] API Auth Login Valid", api_post("/auth/login", {"username": "SAS", "password": "SAS"}, expected_status=200))
test("[38] API Auth Login Invalid", api_post("/auth/login", {"username": "SAS", "password": "WRONG"}, expected_status=401))

print(f"\nTOTAL SCORE: {sum(1 for r in results if r[1])}/{len(results)} PASSED")
for r in results:
    if not r[1]: print(f"FAILED: {r[0]} - {r[2]}")
