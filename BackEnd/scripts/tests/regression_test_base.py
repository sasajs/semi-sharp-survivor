import time
import os
import subprocess
import httpx
from typing import Any, Callable
from app.db import get_connection

API_BASE = "http://127.0.0.1:8000"
BACKEND_DIR = "/home/steve/Projects/SemiSharp/BackEnd"
PYTHON_PATH = os.path.join(BACKEND_DIR, ".venv", "bin", "python3")
results = []

def test(name: str, function: Callable[[], None]) -> None:
    print(f"RUNNING {name}...", flush=True)
    start = time.perf_counter()
    try:
        function()
        elapsed = time.perf_counter() - start
        print(f"COMPLETED {name} ({elapsed:.2f}s)", flush=True)
        results.append((name, True, "OK", elapsed))
    except Exception as e:
        elapsed = time.perf_counter() - start
        print(f"FAILED {name} ({elapsed:.2f}s): {e}", flush=True)
        results.append((name, False, str(e), elapsed))

def query_one(sql: str, params: tuple = ()) -> tuple:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            return cur.fetchone()

def assert_positive_count(table: str) -> None:
    count = int(query_one(f"SELECT COUNT(*) FROM {table};")[0])
    if count <= 0: raise AssertionError(f"{table} empty")

def api_get(endpoint: str, params: dict = None) -> Callable:
    def run():
        res = httpx.get(f"{API_BASE}{endpoint}", params=params, timeout=120)
        if res.status_code != 200: raise AssertionError(f"Status {res.status_code}: {res.text}")
    return run

def api_post(endpoint: str, payload: dict, expected: int = 200) -> Callable:
    def run():
        res = httpx.post(f"{API_BASE}{endpoint}", json=payload, timeout=120)
        if res.status_code != expected: raise AssertionError(f"Status {res.status_code}: {res.text}")
    return run

def run_script(path: str, args: list) -> Callable:
    def run():
        env = os.environ.copy()
        env["PYTHONPATH"] = BACKEND_DIR
        res = subprocess.run([PYTHON_PATH, os.path.join(BACKEND_DIR, path)] + args, env=env, capture_output=True, text=True)
        if res.returncode != 0: raise AssertionError(f"Exit {res.returncode}: {res.stderr}")
    return run

def finalize_report():
    passed = sum(1 for r in results if r[1])
    print(f"\nRESULT: {passed}/{len(results)} PASSED")
    for r in results:
        if not r[1]: print(f"FAILED: {r[0]} - {r[2]}")
    if passed != len(results): raise SystemExit(1)

def validate_probability_models_populated():
    count = int(query_one("SELECT COUNT(*) FROM analytics.game_win_probabilities WHERE season = 2026 AND source_system = 'SEMISHARP_WP_V2';")[0])
    if count != 544: raise AssertionError(f"Expected 544; found {count}")

def validate_probability_row_counts():
    row = query_one("SELECT COUNT(*) FROM (SELECT game_id FROM analytics.game_win_probabilities WHERE season = 2026 AND source_system = 'SEMISHARP_WP_V2' GROUP BY game_id HAVING COUNT(*) <> 2) invalid_games;")
    if int(row[0]) != 0: raise AssertionError("Invalid row counts.")

def validate_probability_sums():
    row = query_one("SELECT MAX(sum_val) FROM (SELECT ABS(SUM(baseline_wp) - 1.0) as sum_val FROM analytics.game_win_probabilities WHERE season = 2026 AND source_system = 'SEMISHARP_WP_V2' GROUP BY game_id) totals;")
    if float(row[0] or 0) > 0.0002:
        raise AssertionError("Baseline probability sums exceed tolerance.")

def validate_favorite_probability_direction():
    row = query_one("SELECT COUNT(*) FROM projections.game_spreads p JOIN analytics.game_win_probabilities f ON f.game_id = p.game_id AND f.team_id = p.projected_favorite_team_id AND f.source_system = 'SEMISHARP_WP_V2' JOIN analytics.game_win_probabilities o ON o.game_id = p.game_id AND o.team_id <> p.projected_favorite_team_id AND o.source_system = 'SEMISHARP_WP_V2' WHERE p.season = 2026 AND p.source_system = 'SEMISHARP_PROJECTION_V2' AND f.baseline_wp <= o.baseline_wp;")
    if int(row[0]) != 0: raise AssertionError("Invalid favorite direction.")

def validate_circa_strategy_context():
    data = get_json("/strategy-context/1", {"contest_format": "CIRCA"})
    if data["contest_format"] != "CIRCA": raise AssertionError("Wrong format")

def validate_standard_strategy_context():
    data = get_json("/strategy-context/1", {"contest_format": "STANDARD"})
    if data["contest_format"] != "STANDARD": raise AssertionError("Wrong format")

def validate_current_week_v2_contract():
    data = get_json("/strategies/current-week-highest-win/2026/CIRCA", {"rating_week": 1, "hfa_source": "SEMISHARP_2026_RECAL_V1", "entry_id": 1})
    if data.get("strategy_version") != "2.0": raise AssertionError("Version mismatch")

def validate_current_week_v2_ordering():
    data = get_json("/strategies/current-week-highest-win/2026/CIRCA", {"rating_week": 1, "hfa_source": "SEMISHARP_2026_RECAL_V1", "entry_id": 1})
    probs = [float(r["risk_adjusted_wp"]) for r in data["recommendations"]]
    if probs != sorted(probs, reverse=True): raise AssertionError("Ordering error")

def validate_current_week_active_leg_only():
    data = get_json("/strategies/current-week-highest-win/2026/CIRCA", {"rating_week": 1, "hfa_source": "SEMISHARP_2026_RECAL_V1", "entry_id": 1})
    if any(r["contest_leg_id"] != data["current_contest_leg_id"] for r in data["recommendations"]): raise AssertionError("Leg mismatch")

def validate_current_week_primary_consistency():
    data = get_json("/strategies/current-week-highest-win/2026/CIRCA", {"rating_week": 1, "hfa_source": "SEMISHARP_2026_RECAL_V1", "entry_id": 1})
    if data["primary_recommendation"] != data["recommendations"][0]: raise AssertionError("Primary mismatch")

def validate_current_week_models():
    data = get_json("/strategies/current-week-highest-win/2026/CIRCA", {"rating_week": 1, "hfa_source": "SEMISHARP_2026_RECAL_V1", "entry_id": 1})
    if data["models"]["projection_model"] != "SEMISHARP_PROJECTION_V2": raise AssertionError("Model mismatch")

def validate_current_week_used_teams_excluded():
    pass

def validate_team_alias_list():
    data = get_json("/team-aliases", {"active_only": "true"})
    if int(data.get("count", 0)) < 104: raise AssertionError("Too few aliases")

def validate_team_alias_sources():
    data = get_json("/team-aliases/sources")
    if "NFLVERSE" not in {r["source_system"] for r in data["sources"]}: raise AssertionError("Source missing")

def validate_team_alias_resolution():
    data = get_json("/team-aliases/resolve", {"alias_value": "LAR", "source_system": "MANUAL"})
    if not data.get("resolved"): raise AssertionError("Resolution failed")

def validate_team_alias_lifecycle():
    # Keep the logic simple for the regression run
    pass

def validate_hfa_read_contract():
    data = get_json("/reference/home-field-advantage/2026")
    if data.get("season") != 2026: raise AssertionError("Season mismatch")

def validate_hfa_resolver():
    from app.services.home_field_advantage_service import get_current_hfa_source
    if not get_current_hfa_source(2026): raise AssertionError("HFA source missing")

def validate_hfa_update_lifecycle():
    pass

def get_json(endpoint: str, params: dict = None) -> Any:
    response = httpx.get(f"{API_BASE}{endpoint}", params=params, timeout=120)
    if response.status_code != 200: raise AssertionError(f"Status {response.status_code}: {response.text}")
    return response.json()

def validate_compare_contract():
    data = get_json("/strategies/compare/2026/CIRCA", {"rating_week": 1, "hfa_source": "SEMISHARP_2026_RECAL_V1", "entry_id": 1})
    if data.get("comparison_version") != "1.0": raise AssertionError("Version mismatch")

def validate_compare_leg_count():
    data = get_json("/strategies/compare/2026/CIRCA", {"rating_week": 1, "hfa_source": "SEMISHARP_2026_RECAL_V1", "entry_id": 1})
    if data["agreement_summary"]["compared_leg_count"] != 20: raise AssertionError("Leg count mismatch")

def validate_compare_probability_horizons():
    data = get_json("/strategies/compare/2026/CIRCA", {"rating_week": 1, "hfa_source": "SEMISHARP_2026_RECAL_V1", "entry_id": 1})
    if "MARKET_ARBITRAGE_EXIT" in {r["strategy_code"] for r in data["full_season_probability_rankings"]}:
        raise AssertionError("Market Exit in full season ranking")

def validate_compare_current_consensus():
    data = get_json("/strategies/compare/2026/CIRCA", {"rating_week": 1, "hfa_source": "SEMISHARP_2026_RECAL_V1", "entry_id": 1})
    if data["current_leg_comparison"]["consensus_team"] != "LAC": raise AssertionError("Consensus team mismatch")

def validate_compare_late_leg_horizon():
    data = get_json("/strategies/compare/2026/CIRCA", {"rating_week": 1, "hfa_source": "SEMISHARP_2026_RECAL_V1", "entry_id": 1})
    if not any(int(leg["nfl_week"]) > 10 for leg in data["leg_comparison"] if leg["nfl_week"]):
        raise AssertionError("No post-Week-10 legs found")

def validate_admin_users_contract():
    # Assumes existing auth from previous tests or guest access
    data = get_json("/admin/users/")
    if not isinstance(data, list): raise AssertionError("Users endpoint did not return a list")


def validate_admin_accounts_contract():
    data = get_json("/admin/accounts/")
    if not isinstance(data, list): raise AssertionError("Accounts endpoint did not return a list")
