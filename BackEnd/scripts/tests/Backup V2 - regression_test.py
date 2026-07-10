import os
import sys
import subprocess


# -------------------------------------------------
# Add BackEnd root to Python path
# -------------------------------------------------

BACKEND_DIR = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "../.."
    )
)

sys.path.insert(
    0,
    BACKEND_DIR
)


from app.db import get_connection


results = []


def assert_value(actual, expected):
    assert actual == expected, f"{actual} != {expected}"


def assert_minimum(actual, expected):
    assert actual >= expected, f"{actual} < {expected}"




def test(name, func):
    print(f"RUNNING {name}...", flush=True)
    try:
        func()
        print(f"COMPLETED {name}", flush=True)
        results.append((name, True))
    except Exception as e:
        print(f"FAILED {name}", flush=True)
        results.append((name, False, str(e)))


def db_test():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT 1;")
            assert cur.fetchone()[0] == 1


def count_test(table, expected=None):
    def run():
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(f"SELECT COUNT(*) FROM {table};")
                count = cur.fetchone()[0]
                if expected:
                    assert count >= expected, f"{table}: {count}"
    return run


def run_script(name, command):
    def run():
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True
        )
        if result.returncode != 0:
            raise Exception(result.stderr)
    return run


test("Database Connection", db_test)

test(
    "Teams Loaded",
    count_test("reference.teams", 32)
)

test(
    "Aliases Loaded",
    count_test("reference.team_aliases", 32)
)

test(
    "Schedule Loaded",
    count_test("schedule.games", 272)
)

test(
    "PFF Ratings Loaded",
    count_test("ratings.pff_power_ratings", 32)
)

test(
    "SIC Scores Loaded",
    count_test("injuries.team_sic_scores", 32)
)

test(
    "Market Events Loaded",
    count_test("market.events", 1)
)

test(
    "Market Spreads Loaded",
    count_test("market.spreads", 1)
)

test(
    "Projection Engine V2",
    count_test("projections.game_spreads", 272)
)



# Strategy execution tests

test(
    "Strategy Highest Win Probability",
    run_script(
        "Highest Win Probability",
        """
        PYTHONPATH=. python3 scripts/strategy/highest_win_probability.py \
        --season 2026 \
        --contest-format STANDARD \
        --rating-week 1 \
        --hfa-source SEMISHARP_2026 > /dev/null
        """
    )
)

test(
    "Strategy Future Value",
    run_script(
        "Future Value",
        """
        PYTHONPATH=. python3 scripts/strategy/future_value.py \
        --season 2026 \
        --contest-format STANDARD \
        --rating-week 1 \
        --hfa-source SEMISHARP_2026 > /dev/null
        """
    )
)

test(
    "Strategy Multiple Entry",
    run_script(
        "Multiple Entry",
        """
        PYTHONPATH=. python3 scripts/strategy/multiple_entry_portfolio.py \
        --season 2026 \
        --contest-format STANDARD \
        --rating-week 1 \
        --hfa-source SEMISHARP_2026 > /dev/null
        """
    )
)

test(
    "Strategy Circa Holiday",
    run_script(
        "Circa Holiday",
        """
        PYTHONPATH=. python3 scripts/strategy/circa_holiday_reserve.py \
        --season 2026 \
        --rating-week 1 \
        --hfa-source SEMISHARP_2026 > /dev/null
        """
    )
)

test(
    "Strategy Projection Edge",
    run_script(
        "Projection Edge",
        """
        PYTHONPATH=. python3 scripts/strategy/projection_edge.py \
        --season 2026 \
        --contest-format STANDARD > /dev/null
        """
    )
)

test(
    "Strategy Monte Carlo",
    run_script(
        "Monte Carlo",
        """
        PYTHONPATH=. python3 scripts/strategy/monte_carlo_survivor.py \
        --season 2026 \
        --contest-format STANDARD > /dev/null
        """
    )
)

test(
    "Strategy Dynamic Programming",
    run_script(
        "Dynamic Programming",
        """
        PYTHONPATH=. python3 scripts/strategy/dynamic_programming.py \
        --season 2026 \
        --contest-format STANDARD > /dev/null
        """
    )
)


# API endpoint tests

import httpx
import os

API_BASE = "http://127.0.0.1:8000"


def api_test(endpoint, validator=None):
    def run():
        response = httpx.get(
            API_BASE + endpoint,
            timeout=120
        )

        assert response.status_code == 200, response.text

        data = response.json()

        if validator:
            validator(data)

    return run


test(
    "API Health",
    api_test(
        "/health",
        lambda x: assert_value(x["status"], "ok")
    )
)

test(
    "API Teams",
    api_test(
        "/teams",
        lambda x: assert_minimum(x["count"], 32)
    )
)

test(
    "API Schedule",
    api_test(
        "/schedule/2026/1",
        lambda x: assert_minimum(x["count"], 16)
    )
)

test(
    "API Projections",
    api_test(
        "/projections/2026/1",
        lambda x: assert_minimum(x["count"], 16)
    )
)

test(
    "API Risk",
    api_test(
        "/risk/2026/1"
    )
)

test(
    "API Market Consensus",
    api_test(
        "/market/consensus/2026/1"
    )
)

test(
    "API Projection Edge",
    api_test(
        "/market/projection-edge/2026/1"
    )
)

test(
    "API SIC",
    api_test(
        "/injuries/sic/2026/1",
        lambda x: assert_minimum(x["count"], 32)
    )
)



test(
    "API Strategy Registry",
    api_test(
        "/strategies",
        lambda x: assert_minimum(x["count"], 7)
    )
)


test(
    "API Context GET",
    api_test(
        "/context/current",
        lambda x: assert_value(x["projection_model"], "SEMISHARP_PROJECTION_V2")
    )
)


test(
    "API Strategy Highest Win",
    api_test(
        "/strategies/highest-win/2026/STANDARD"
    )
)

test(
    "API Strategy Future Value",
    api_test(
        "/strategies/future-value/2026/STANDARD?rating_week=1&hfa_source=SEMISHARP_2026"
    )
)

test(
    "API Strategy Multiple Entry",
    api_test(
        "/strategies/multiple-entry/2026/STANDARD"
    )
)

test(
    "API Strategy Circa Holiday",
    api_test(
        "/strategies/circa-holiday/2026"
    )
)

test(
    "API Strategy Projection Edge",
    api_test(
        "/strategies/projection-edge/2026/STANDARD"
    )
)


def api_post_test(endpoint, payload=None, validator=None):
    def run():
        response = httpx.post(
            API_BASE + endpoint,
            params=payload,
            timeout=120
        )

        assert response.status_code == 200, response.text

        data = response.json()

        if validator:
            validator(data)

    return run


test(
    "API Auth Login Valid",
    api_post_test(
        "/auth/login",
        {
            "username": "SAS",
            "password": "SAS"
        },
        lambda x: assert_value(x["authenticated"], True)
    )
)


test(
    "API Auth Login Invalid Password",
    api_post_test(
        "/auth/login",
        {
            "username": "SAS",
            "password": "WRONG_PASSWORD"
        },
        lambda x: assert_value(x["authenticated"], False)
    )
)


test(
    "API Auth Returns Entries",
    api_post_test(
        "/auth/login",
        {
            "username": "SAS",
            "password": "SAS"
        },
        lambda x: assert_minimum(len(x["user"]["entries"]), 2)
    )
)


if os.getenv("SEMI_DEEP_TESTS") == "true":

    test(
        "API Strategy Monte Carlo",
        api_test(
            "/strategies/monte-carlo/2026/STANDARD"
        )
    )

    test(
        "API Strategy Dynamic Programming",
        api_test(
            "/strategies/dynamic-programming/2026/STANDARD"
        )
    )


print("\nSemiSharp Regression Test\n")

passed = 0

for result in results:
    if result[1]:
        print(f"PASS {result[0]}")
        passed += 1
    else:
        print(f"FAIL {result[0]} - {result[2]}")

print()

print(f"RESULT: {passed}/{len(results)} PASSED")


# -------------------------------------------------
# System Snapshot Generation
# -------------------------------------------------
# Only generate documentation snapshots after
# regression tests pass.
# -------------------------------------------------

if passed != len(results):

    print()
    print("REGRESSION FAILED")
    print("System snapshot NOT generated.")
    sys.exit(1)


print()
print("REGRESSION SUCCESSFUL")
print("Generating SemiSharp System Snapshot...")


snapshot_result = subprocess.run(
    [
        sys.executable,
        "scripts/documentation/generate_system_snapshot.py"
    ],
    capture_output=False
)


if snapshot_result.returncode != 0:

    print()
    print("WARNING: System snapshot generation failed")
    print("Regression tests passed, but documentation snapshot failed.")

    sys.exit(1)


print()
print("SYSTEM SNAPSHOT COMPLETE")
print("SemiSharp regression validation complete.")
