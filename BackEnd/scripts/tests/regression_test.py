#!/usr/bin/env python3
"""
SemiSharp backend regression suite.

This suite validates both operational availability and analytical
correctness. It intentionally checks model relationships and API response
contracts rather than only confirming that scripts execute successfully.
"""

from __future__ import annotations

import os
import subprocess
import sys
import time
from typing import Any, Callable

import httpx
from dotenv import load_dotenv


BACKEND_DIR = "/home/steve/Projects/SemiSharp/BackEnd"

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

load_dotenv()

from app.db import get_connection  # noqa: E402
from app.services.home_field_advantage_service import (  # noqa: E402
    get_current_hfa_source,
    get_current_hfa_values,
)


API_BASE = "http://127.0.0.1:8000"
PYTHON_PATH = os.path.join(
    BACKEND_DIR,
    ".venv",
    "bin",
    "python3",
)

VALID_MODES = {"fast", "full"}

MODE = (
    sys.argv[1].strip().lower()
    if len(sys.argv) > 1
    else "full"
)

if MODE not in VALID_MODES:
    raise SystemExit(
        "Usage: python scripts/tests/regression_test.py [fast|full]"
    )


# These tests remain part of the full quality gate but are skipped during
# normal fast development validation.
SLOW_TEST_NAMES = {
    "[09] Projection Engine V2",
    "[19] Strategy Monte Carlo",
    "[20] Strategy Dynamic Programming",
    "[39] API Strategy Monte Carlo",
    "[40] API Strategy Dynamic Programming",
    "[49] Compare Strategies Contract",
    "[50] Compare Strategies Leg Count",
    "[51] Compare Strategies Probability Horizons",
    "[52] Compare Strategies Current Consensus",
    "[53] Compare Strategies Late-Leg Horizon",
    "[56] Season Management Smoke Test",
    "[57] Week 3 Recalculation",
}


results: list[tuple[str, bool, str, float]] = []
skipped: list[str] = []


def test(name: str, function: Callable[[], None]) -> None:
    """Execute one regression check and record its result and duration."""
    if MODE == "fast" and name in SLOW_TEST_NAMES:
        print(f"SKIPPED {name} (full mode only)", flush=True)
        skipped.append(name)
        return

    print(f"RUNNING {name}...", flush=True)
    started_at = time.perf_counter()

    try:
        function()
        elapsed = time.perf_counter() - started_at
        print(
            f"COMPLETED {name} ({elapsed:.2f}s)",
            flush=True,
        )
        results.append((name, True, "OK", elapsed))

    except Exception as exc:
        elapsed = time.perf_counter() - started_at
        message = str(exc)
        print(
            f"FAILED {name} ({elapsed:.2f}s): {message}",
            flush=True,
        )
        results.append((name, False, message, elapsed))

def query_one(
    sql: str,
    parameters: tuple[Any, ...] | None = None,
) -> tuple[Any, ...]:
    """Execute a query and return exactly one row."""
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql, parameters or ())
            row = cursor.fetchone()

    if row is None:
        raise AssertionError("Query returned no rows.")

    return row


def assert_positive_count(
    table_name: str,
) -> None:
    """Confirm a database object contains at least one row."""
    row = query_one(
        f"SELECT COUNT(*) FROM {table_name};"
    )

    count = int(row[0])

    if count <= 0:
        raise AssertionError(
            f"{table_name} contains no rows."
        )


def run_script(
    path: str,
    arguments: list[str],
) -> Callable[[], None]:
    """Return a test function that executes a backend script."""

    def run() -> None:
        environment = os.environ.copy()
        environment["PYTHONPATH"] = BACKEND_DIR

        absolute_script_path = os.path.join(
            BACKEND_DIR,
            path,
        )

        result = subprocess.run(
            [
                PYTHON_PATH,
                absolute_script_path,
                *arguments,
            ],
            check=False,
            env=environment,
            capture_output=True,
            text=True,
            timeout=180,
        )

        if result.returncode != 0:
            raise AssertionError(
                f"Exit {result.returncode}: "
                f"{result.stderr or result.stdout}"
            )

    return run


def get_json(
    endpoint: str,
    parameters: dict[str, Any] | None = None,
) -> Any:
    """Call a GET endpoint and return decoded JSON."""
    response = httpx.get(
        f"{API_BASE}{endpoint}",
        params=parameters,
        timeout=120,
    )

    if response.status_code != 200:
        raise AssertionError(
            f"Status {response.status_code}: "
            f"{response.text}"
        )

    return response.json()


def api_get(
    endpoint: str,
    parameters: dict[str, Any] | None = None,
) -> Callable[[], None]:
    """Return a test function that validates a GET endpoint."""

    def run() -> None:
        get_json(endpoint, parameters)

    return run


def api_post(
    endpoint: str,
    payload: dict[str, Any],
    expected_status: int = 200,
) -> Callable[[], None]:
    """Return a test function that validates a POST endpoint."""

    def run() -> None:
        response = httpx.post(
            f"{API_BASE}{endpoint}",
            json=payload,
            timeout=120,
        )

        if response.status_code != expected_status:
            raise AssertionError(
                f"Status {response.status_code}: "
                f"{response.text}"
            )

    return run


# ------------------------------------------------------------------
# Analytical correctness tests
# ------------------------------------------------------------------


def validate_probability_row_counts() -> None:
    """
    Every projected game must have exactly two probability rows:
    one for each team.
    """
    row = query_one(
        """
        SELECT COUNT(*)
        FROM (
            SELECT
                game_id
            FROM analytics.game_win_probabilities
            WHERE season = 2026
              AND source_system = 'SEMISHARP_WP_V2'
            GROUP BY game_id
            HAVING COUNT(*) <> 2
        ) invalid_games;
        """
    )

    invalid_count = int(row[0])

    if invalid_count != 0:
        raise AssertionError(
            f"{invalid_count} games do not have exactly "
            "two probability rows."
        )


def validate_probability_sums() -> None:
    """
    Baseline probabilities for both teams must sum to approximately 1.
    """
    row = query_one(
        """
        SELECT
            COALESCE(
                MAX(ABS(probability_sum - 1.0)),
                0
            )
        FROM (
            SELECT
                game_id,
                SUM(baseline_wp) AS probability_sum
            FROM analytics.game_win_probabilities
            WHERE season = 2026
              AND source_system = 'SEMISHARP_WP_V2'
            GROUP BY game_id
        ) totals;
        """
    )

    maximum_error = float(row[0])

    if maximum_error > 0.0002:
        raise AssertionError(
            "Baseline probability sums exceed tolerance. "
            f"Maximum error: {maximum_error}"
        )


def validate_favorite_probability_direction() -> None:
    """
    The projected favorite must have a higher baseline probability than
    the opposing team for every game.
    """
    row = query_one(
        """
        SELECT COUNT(*)
        FROM projections.game_spreads p
        JOIN analytics.game_win_probabilities favorite_wp
          ON favorite_wp.game_id = p.game_id
         AND favorite_wp.team_id =
             p.projected_favorite_team_id
         AND favorite_wp.source_system =
             'SEMISHARP_WP_V2'
        JOIN analytics.game_win_probabilities opponent_wp
          ON opponent_wp.game_id = p.game_id
         AND opponent_wp.team_id <>
             p.projected_favorite_team_id
         AND opponent_wp.source_system =
             'SEMISHARP_WP_V2'
        WHERE p.season = 2026
          AND p.source_system =
              'SEMISHARP_PROJECTION_V2'
          AND favorite_wp.baseline_wp <=
              opponent_wp.baseline_wp;
        """
    )

    invalid_count = int(row[0])

    if invalid_count != 0:
        raise AssertionError(
            f"{invalid_count} projected favorites have a "
            "probability less than or equal to the opponent."
        )


def validate_probability_models_populated() -> None:
    """Confirm the canonical probability model contains 544 team rows."""
    row = query_one(
        """
        SELECT COUNT(*)
        FROM analytics.game_win_probabilities
        WHERE season = 2026
          AND source_system = 'SEMISHARP_WP_V2';
        """
    )

    count = int(row[0])

    if count != 544:
        raise AssertionError(
            f"Expected 544 probability rows; found {count}."
        )


# ------------------------------------------------------------------
# Strategy Context tests
# ------------------------------------------------------------------


def validate_circa_strategy_context() -> None:
    payload = get_json(
        "/strategy-context/1",
        {"contest_format": "CIRCA"},
    )

    if payload["contest_format"] != "CIRCA":
        raise AssertionError(
            "CIRCA context returned the wrong format."
        )

    if payload["contest_format_id"] != 2:
        raise AssertionError(
            "CIRCA context returned the wrong format ID."
        )

    if payload["season"] != 2026:
        raise AssertionError(
            "CIRCA context returned the wrong season."
        )

    if payload["probability_model"] != "SEMISHARP_WP_V2":
        raise AssertionError(
            "CIRCA context returned the wrong "
            "probability model."
        )


def validate_standard_strategy_context() -> None:
    payload = get_json(
        "/strategy-context/1",
        {"contest_format": "STANDARD"},
    )

    if payload["contest_format"] != "STANDARD":
        raise AssertionError(
            "STANDARD context returned the wrong format."
        )

    if payload["contest_format_id"] != 1:
        raise AssertionError(
            "STANDARD context returned the wrong format ID."
        )

    if payload["current_week"] != 1:
        raise AssertionError(
            "STANDARD context returned the wrong week."
        )


# ------------------------------------------------------------------
# Current Week Highest Win V2 tests
# ------------------------------------------------------------------


def current_week_v2_payload() -> dict[str, Any]:
    return get_json(
        "/strategies/current-week-highest-win/2026/CIRCA",
        {
            "rating_week": 1,
            "hfa_source": "SEMISHARP_2026_RECAL_V1",
            "entry_id": 1,
        },
    )


def validate_current_week_v2_contract() -> None:
    payload = current_week_v2_payload()

    if payload.get("strategy_version") != "2.0":
        raise AssertionError(
            "Current Week strategy version is not 2.0."
        )

    if (
        payload.get("strategy_type")
        != "CURRENT_LEG_RANKING"
    ):
        raise AssertionError(
            "Current Week strategy type is incorrect."
        )

    recommendations = payload.get("recommendations")

    if not isinstance(recommendations, list):
        raise AssertionError(
            "Recommendations is not a list."
        )

    if len(recommendations) == 0:
        raise AssertionError(
            "Current Week strategy returned no "
            "recommendations."
        )


def validate_current_week_v2_ordering() -> None:
    payload = current_week_v2_payload()
    recommendations = payload["recommendations"]

    probabilities = [
        float(row["risk_adjusted_wp"])
        for row in recommendations
    ]

    if probabilities != sorted(
        probabilities,
        reverse=True,
    ):
        raise AssertionError(
            "Current Week recommendations are not sorted "
            "by descending risk-adjusted probability."
        )

    expected_ranks = list(
        range(1, len(recommendations) + 1)
    )

    actual_ranks = [
        int(row["rank"])
        for row in recommendations
    ]

    if actual_ranks != expected_ranks:
        raise AssertionError(
            "Current Week recommendation ranks are not "
            "sequential."
        )


def validate_current_week_active_leg_only() -> None:
    payload = current_week_v2_payload()
    expected_leg_id = payload[
        "current_contest_leg_id"
    ]

    invalid = [
        row
        for row in payload["recommendations"]
        if row["contest_leg_id"] != expected_leg_id
    ]

    if invalid:
        raise AssertionError(
            "Current Week strategy returned candidates from "
            "outside the active contest leg."
        )


def validate_current_week_primary_consistency() -> None:
    payload = current_week_v2_payload()

    recommendations = payload["recommendations"]
    primary = payload["primary_recommendation"]

    if primary != recommendations[0]:
        raise AssertionError(
            "Primary recommendation does not match rank 1."
        )

    alternatives = payload[
        "alternative_recommendations"
    ]

    if alternatives != recommendations[1:3]:
        raise AssertionError(
            "Alternative recommendations do not match "
            "ranks 2 and 3."
        )


def validate_current_week_models() -> None:
    payload = current_week_v2_payload()
    models = payload["models"]

    expected = {
        "projection_model": "SEMISHARP_PROJECTION_V2",
        "hfa_source": "SEMISHARP_2026_RECAL_V1",
        "risk_model": "SEMISHARP_RISK_V3",
        "probability_model": "SEMISHARP_WP_V2",
    }

    if models != expected:
        raise AssertionError(
            f"Unexpected model context: {models}"
        )


def validate_current_week_used_teams_excluded() -> None:
    """
    Confirm no recommendation contains a team already stored for entry 1.

    This remains valid when entry 1 has no prior picks; once picks are
    entered, the test automatically verifies their exclusion.
    """
    payload = current_week_v2_payload()

    row = query_one(
        """
        SELECT COALESCE(
            ARRAY_AGG(team_id),
            ARRAY[]::integer[]
        )
        FROM survivor.entry_picks
        WHERE entry_id = 1;
        """
    )

    used_team_ids = {
        int(team_id)
        for team_id in row[0]
    }

    recommended_team_ids = {
        int(item["team_id"])
        for item in payload["recommendations"]
    }

    overlap = used_team_ids & recommended_team_ids

    if overlap:
        raise AssertionError(
            "Current Week strategy recommended previously "
            f"used team IDs: {sorted(overlap)}"
        )



# ------------------------------------------------------------------
# Compare Strategies tests
# ------------------------------------------------------------------


def compare_strategies_payload() -> dict[str, Any]:
    return get_json(
        "/strategies/compare/2026/CIRCA",
        {
            "rating_week": 1,
            "hfa_source": "SEMISHARP_2026_RECAL_V1",
            "entry_id": 1,
        },
    )


def validate_compare_contract() -> None:
    payload = compare_strategies_payload()

    if payload.get("comparison_version") != "1.0":
        raise AssertionError(
            "Compare Strategies version is not 1.0."
        )

    if payload.get("strategy_count") != 5:
        raise AssertionError(
            "Compare Strategies did not return five strategies."
        )

    expected_codes = {
        "FUTURE_VALUE",
        "BOTTOM_SIX_ROAD_FADE",
        "MARKET_ARBITRAGE_EXIT",
        "MONTE_CARLO",
        "DYNAMIC_PROGRAMMING",
    }

    actual_codes = {
        strategy["strategy_code"]
        for strategy in payload["strategies"]
    }

    if actual_codes != expected_codes:
        raise AssertionError(
            f"Unexpected comparison strategies: {actual_codes}"
        )


def validate_compare_leg_count() -> None:
    payload = compare_strategies_payload()
    summary = payload["agreement_summary"]

    if summary["compared_leg_count"] != 20:
        raise AssertionError(
            "Compare Strategies did not return 20 CIRCA legs."
        )

    if len(payload["leg_comparison"]) != 20:
        raise AssertionError(
            "Leg comparison array does not contain 20 legs."
        )


def validate_compare_probability_horizons() -> None:
    payload = compare_strategies_payload()

    full_season_codes = {
        row["strategy_code"]
        for row in payload[
            "full_season_probability_rankings"
        ]
    }

    if "MARKET_ARBITRAGE_EXIT" in full_season_codes:
        raise AssertionError(
            "Market Exit was incorrectly included in "
            "full-season probability rankings."
        )

    expected_full_season = {
        "DYNAMIC_PROGRAMMING",
        "FUTURE_VALUE",
        "MONTE_CARLO",
        "BOTTOM_SIX_ROAD_FADE",
    }

    if full_season_codes != expected_full_season:
        raise AssertionError(
            "Full-season ranking contains the wrong strategies."
        )

    exit_rows = payload[
        "exit_horizon_probability_rankings"
    ]

    if len(exit_rows) != 1:
        raise AssertionError(
            "Expected exactly one exit-horizon strategy."
        )

    exit_row = exit_rows[0]

    if (
        exit_row["strategy_code"]
        != "MARKET_ARBITRAGE_EXIT"
    ):
        raise AssertionError(
            "Exit-horizon ranking does not contain Market Exit."
        )

    if int(exit_row["planning_horizon"]) != 10:
        raise AssertionError(
            "Market Exit planning horizon is not Week 10."
        )


def validate_compare_current_consensus() -> None:
    payload = compare_strategies_payload()
    current = payload["current_leg_comparison"]

    if current["consensus_team"] != "LAC":
        raise AssertionError(
            "Current-leg comparison consensus is not LAC."
        )

    if current["agreement_count"] != 5:
        raise AssertionError(
            "Current-leg agreement count is not five."
        )

    if current["available_strategy_count"] != 5:
        raise AssertionError(
            "Current leg does not contain all five strategies."
        )

    if not current["complete_agreement"]:
        raise AssertionError(
            "Current leg should show complete agreement."
        )


def validate_compare_late_leg_horizon() -> None:
    payload = compare_strategies_payload()

    late_legs = [
        leg
        for leg in payload["leg_comparison"]
        if leg["nfl_week"] is not None
        and int(leg["nfl_week"]) > 10
    ]

    if not late_legs:
        raise AssertionError(
            "No post-Week-10 comparison legs were found."
        )

    for leg in late_legs:
        if (
            "MARKET_ARBITRAGE_EXIT"
            in leg["strategy_picks"]
        ):
            raise AssertionError(
                "Market Exit returned a pick after Week 10."
            )

        if leg["available_strategy_count"] != 4:
            raise AssertionError(
                "Post-Week-10 legs should contain four "
                "full-season strategies."
            )



# ------------------------------------------------------------------
# Team Alias Manager tests
# ------------------------------------------------------------------


def validate_team_alias_list() -> None:
    payload = get_json(
        "/team-aliases",
        {"active_only": "true"},
    )

    if int(payload.get("count", 0)) < 104:
        raise AssertionError(
            "Expected at least 104 active team aliases."
        )

    aliases = payload.get("aliases", [])

    if not aliases:
        raise AssertionError(
            "Alias list returned no records."
        )

    required_fields = {
        "alias_id",
        "team_id",
        "team_abbr",
        "team_name",
        "source_system",
        "alias_value",
        "alias_normalized",
        "alias_type",
        "is_active",
        "created_at",
    }

    missing = required_fields - set(aliases[0])

    if missing:
        raise AssertionError(
            f"Alias response is missing fields: {sorted(missing)}"
        )


def validate_team_alias_sources() -> None:
    payload = get_json("/team-aliases/sources")
    sources = {
        row["source_system"]: row
        for row in payload.get("sources", [])
    }

    for required_source in (
        "NFLVERSE",
        "PFF",
        "MANUAL",
    ):
        if required_source not in sources:
            raise AssertionError(
                f"Alias source {required_source} was not returned."
            )

    total_count = sum(
        int(row["total_count"])
        for row in sources.values()
    )
    active_count = sum(
        int(row["active_count"])
        for row in sources.values()
    )
    inactive_count = sum(
        int(row["inactive_count"])
        for row in sources.values()
    )

    database_total = int(
        query_one(
            """
            SELECT COUNT(*)
            FROM reference.team_aliases;
            """
        )[0]
    )

    database_active = int(
        query_one(
            """
            SELECT COUNT(*)
            FROM reference.team_aliases
            WHERE is_active = TRUE;
            """
        )[0]
    )

    if total_count != database_total:
        raise AssertionError(
            "Alias source totals do not match the database."
        )

    if active_count != database_active:
        raise AssertionError(
            "Active alias source totals do not match the database."
        )

    if total_count != active_count + inactive_count:
        raise AssertionError(
            "Alias active/inactive source totals do not reconcile."
        )


def validate_team_alias_resolution() -> None:
    payload = get_json(
        "/team-aliases/resolve",
        {
            "alias_value": "LAR",
            "source_system": "MANUAL",
        },
    )

    if not payload.get("resolved"):
        raise AssertionError(
            "MANUAL/LAR did not resolve."
        )

    if payload.get("ambiguous"):
        raise AssertionError(
            "MANUAL/LAR resolved ambiguously."
        )

    matches = payload.get("matches", [])

    if len(matches) != 1:
        raise AssertionError(
            "MANUAL/LAR should return exactly one match."
        )

    match = matches[0]

    if int(match["team_id"]) != 17:
        raise AssertionError(
            "MANUAL/LAR did not resolve to team_id 17."
        )

    if match["team_abbr"] != "LA":
        raise AssertionError(
            "MANUAL/LAR did not resolve to LA."
        )


def validate_team_alias_lifecycle() -> None:
    """
    Exercise create, restore, resolve, duplicate rejection, and disable.

    The fixed regression alias is reused across runs and is left inactive,
    preventing a new database row from being created on every test run.
    """
    alias_value = "SEMISHARP_REGRESSION_ALIAS"
    source_system = "REGRESSION"

    create_response = httpx.post(
        f"{API_BASE}/team-aliases",
        json={
            "team_id": 17,
            "source_system": source_system,
            "alias_value": alias_value,
            "alias_type": "TEST",
        },
        timeout=120,
    )

    if create_response.status_code not in (201, 409):
        raise AssertionError(
            f"Create returned {create_response.status_code}: "
            f"{create_response.text}"
        )

    lookup = get_json(
        "/team-aliases",
        {
            "source_system": source_system,
            "search": alias_value,
        },
    )

    exact_matches = [
        row
        for row in lookup.get("aliases", [])
        if row["source_system"] == source_system
        and row["alias_normalized"] == alias_value
    ]

    if len(exact_matches) != 1:
        raise AssertionError(
            "Regression alias was not found exactly once."
        )

    alias_id = int(exact_matches[0]["alias_id"])

    enable_response = httpx.patch(
        f"{API_BASE}/team-aliases/{alias_id}/status",
        json={"is_active": True},
        timeout=120,
    )

    if enable_response.status_code != 200:
        raise AssertionError(
            f"Enable returned {enable_response.status_code}: "
            f"{enable_response.text}"
        )

    resolved = get_json(
        "/team-aliases/resolve",
        {
            "alias_value": alias_value,
            "source_system": source_system,
        },
    )

    if not resolved.get("resolved"):
        raise AssertionError(
            "Enabled regression alias did not resolve."
        )

    if int(resolved["matches"][0]["team_id"]) != 17:
        raise AssertionError(
            "Regression alias resolved to the wrong team."
        )

    duplicate_response = httpx.post(
        f"{API_BASE}/team-aliases",
        json={
            "team_id": 17,
            "source_system": source_system,
            "alias_value": f"  {alias_value.lower()}  ",
            "alias_type": "TEST",
        },
        timeout=120,
    )

    if duplicate_response.status_code != 409:
        raise AssertionError(
            "Normalized duplicate alias was not rejected with 409."
        )

    disable_response = httpx.patch(
        f"{API_BASE}/team-aliases/{alias_id}/status",
        json={"is_active": False},
        timeout=120,
    )

    if disable_response.status_code != 200:
        raise AssertionError(
            f"Disable returned {disable_response.status_code}: "
            f"{disable_response.text}"
        )

    resolve_disabled = httpx.get(
        f"{API_BASE}/team-aliases/resolve",
        params={
            "alias_value": alias_value,
            "source_system": source_system,
        },
        timeout=120,
    )

    if resolve_disabled.status_code != 404:
        raise AssertionError(
            "Disabled regression alias should return 404."
        )



# ------------------------------------------------------------------
# Home Field Advantage tests
# ------------------------------------------------------------------


def validate_hfa_read_contract() -> None:
    payload = get_json(
        "/reference/home-field-advantage/2026"
    )

    if int(payload.get("season", 0)) != 2026:
        raise AssertionError(
            "HFA endpoint returned the wrong season."
        )

    if int(payload.get("count", 0)) != 32:
        raise AssertionError(
            "Expected exactly 32 active HFA team rows."
        )

    advantages = payload.get("advantages", [])

    if len(advantages) != 32:
        raise AssertionError(
            "HFA advantages array does not contain 32 rows."
        )

    team_ids = {
        int(row["team_id"])
        for row in advantages
    }

    if len(team_ids) != 32:
        raise AssertionError(
            "HFA response contains duplicate or missing team IDs."
        )

    required_fields = {
        "home_field_advantage_id",
        "season",
        "team_id",
        "team",
        "team_name",
        "home_field_points",
        "source_system",
        "notes",
        "is_active",
        "created_at",
        "updated_at",
    }

    missing = required_fields - set(advantages[0])

    if missing:
        raise AssertionError(
            f"HFA response is missing fields: {sorted(missing)}"
        )

    if payload.get("minimum_home_field_points") is None:
        raise AssertionError(
            "HFA minimum value is missing."
        )

    if payload.get("maximum_home_field_points") is None:
        raise AssertionError(
            "HFA maximum value is missing."
        )


def validate_hfa_resolver() -> None:
    source = get_current_hfa_source(2026)
    values = get_current_hfa_values(2026)

    if not source:
        raise AssertionError(
            "HFA resolver returned an empty source."
        )

    if len(values) != 32:
        raise AssertionError(
            f"Expected 32 resolved HFA values; found {len(values)}."
        )

    database_sources = query_one(
        """
        SELECT COUNT(DISTINCT source_system)
        FROM reference.home_field_advantage
        WHERE season = 2026
          AND is_active = TRUE;
        """
    )

    if int(database_sources[0]) != 1:
        raise AssertionError(
            "The active HFA table contains more than one source."
        )

    database_source = query_one(
        """
        SELECT MIN(source_system)
        FROM reference.home_field_advantage
        WHERE season = 2026
          AND is_active = TRUE;
        """
    )[0]

    if source != database_source:
        raise AssertionError(
            "HFA resolver source does not match the database."
        )


def validate_hfa_update_lifecycle() -> None:
    season = 2026
    team_id = 4

    original_payload = get_json(
        f"/reference/home-field-advantage/{season}"
    )

    original = next(
        (
            row
            for row in original_payload["advantages"]
            if int(row["team_id"]) == team_id
        ),
        None,
    )

    if original is None:
        raise AssertionError(
            "Buffalo HFA row was not found."
        )

    original_points = float(
        original["home_field_points"]
    )
    original_notes = original.get("notes")

    temporary_points = round(
        original_points + 0.1,
        4,
    )
    temporary_notes = (
        "SemiSharp regression test temporary HFA update"
    )

    try:
        update_response = httpx.patch(
            (
                f"{API_BASE}/reference/"
                f"home-field-advantage/{season}/{team_id}"
            ),
            json={
                "home_field_points": temporary_points,
                "notes": temporary_notes,
            },
            timeout=120,
        )

        if update_response.status_code != 200:
            raise AssertionError(
                f"HFA PATCH returned "
                f"{update_response.status_code}: "
                f"{update_response.text}"
            )

        updated = update_response.json()

        if float(updated["home_field_points"]) != temporary_points:
            raise AssertionError(
                "HFA PATCH did not return the updated value."
            )

        if updated["notes"] != temporary_notes:
            raise AssertionError(
                "HFA PATCH did not return the updated notes."
            )

        if not updated.get("updated_at"):
            raise AssertionError(
                "HFA PATCH did not return updated_at."
            )

        display_payload = get_json(
            f"/reference/home-field-advantage/{season}"
        )

        displayed = next(
            row
            for row in display_payload["advantages"]
            if int(row["team_id"]) == team_id
        )

        if (
            float(displayed["home_field_points"])
            != temporary_points
        ):
            raise AssertionError(
                "HFA GET did not reflect the PATCH update."
            )

        invalid_response = httpx.patch(
            (
                f"{API_BASE}/reference/"
                f"home-field-advantage/{season}/{team_id}"
            ),
            json={
                "home_field_points": 11,
                "notes": "Invalid value test",
            },
            timeout=120,
        )

        if invalid_response.status_code != 422:
            raise AssertionError(
                "Out-of-range HFA value was not rejected with 422."
            )

    finally:
        restore_response = httpx.patch(
            (
                f"{API_BASE}/reference/"
                f"home-field-advantage/{season}/{team_id}"
            ),
            json={
                "home_field_points": original_points,
                "notes": original_notes,
            },
            timeout=120,
        )

        if restore_response.status_code != 200:
            raise AssertionError(
                "HFA regression test could not restore "
                f"the original Buffalo value: "
                f"{restore_response.text}"
            )

    restored_payload = get_json(
        f"/reference/home-field-advantage/{season}"
    )

    restored = next(
        row
        for row in restored_payload["advantages"]
        if int(row["team_id"]) == team_id
    )

    if float(restored["home_field_points"]) != original_points:
        raise AssertionError(
            "Buffalo HFA value was not restored."
        )

    if restored.get("notes") != original_notes:
        raise AssertionError(
            "Buffalo HFA notes were not restored."
        )


# ------------------------------------------------------------------
# Test execution
# ------------------------------------------------------------------

# Database and model availability
test(
    "[01] Database Connection",
    lambda: query_one("SELECT 1;"),
)
test(
    "[02] Teams Loaded",
    lambda: assert_positive_count("reference.teams"),
)
test(
    "[03] Aliases Loaded",
    lambda: assert_positive_count(
        "reference.team_aliases"
    ),
)
test(
    "[04] Schedule Loaded",
    lambda: assert_positive_count("schedule.games"),
)
test(
    "[05] PFF Ratings Loaded",
    lambda: assert_positive_count(
        "ratings.pff_power_ratings"
    ),
)
test(
    "[06] SIC Scores Loaded",
    lambda: assert_positive_count(
        "injuries.team_sic_scores"
    ),
)
test(
    "[07] Market Events Loaded",
    lambda: assert_positive_count("market.events"),
)
test(
    "[08] Market Spreads Loaded",
    lambda: assert_positive_count("market.spreads"),
)
test(
    "[09] Projection Engine V2",
    lambda: assert_positive_count(
        "projections.game_spreads"
    ),
)

# Probability correctness
test(
    "[10] Probability Model Row Count",
    validate_probability_models_populated,
)
test(
    "[11] Probability Two Teams Per Game",
    validate_probability_row_counts,
)
test(
    "[12] Probability Baseline Sums",
    validate_probability_sums,
)
test(
    "[13] Probability Favorite Direction",
    validate_favorite_probability_direction,
)

# Strategy scripts
test(
    "[14] Strategy Current Week Highest Win",
    run_script(
        "scripts/strategy/current_week_highest_win.py",
        [
            "--season",
            "2026",
            "--contest-format",
            "CIRCA",
            "--rating-week",
            "1",
            "--hfa-source",
            "SEMISHARP_2026_RECAL_V1",
            "--entry-id",
            "1",
        ],
    ),
)
test(
    "[15] Strategy Future Value",
    run_script(
        "scripts/strategy/future_value.py",
        [
            "--season",
            "2026",
            "--contest-format",
            "CIRCA",
            "--rating-week",
            "1",
            "--hfa-source",
            "SEMISHARP_2026_RECAL_V1",
            "--entry-id",
            "1",
        ],
    ),
)
test(
    "[19] Strategy Monte Carlo",
    run_script(
        "scripts/strategy/monte_carlo_survivor.py",
        [
            "--season",
            "2026",
            "--contest-format",
            "CIRCA",
            "--rating-week",
            "1",
            "--hfa-source",
            "SEMISHARP_2026_RECAL_V1",
        ],
    ),
)
test(
    "[20] Strategy Dynamic Programming",
    run_script(
        "scripts/strategy/dynamic_programming.py",
        [
            "--season",
            "2026",
            "--contest-format",
            "CIRCA",
            "--rating-week",
            "1",
            "--hfa-source",
            "SEMISHARP_2026_RECAL_V1",
        ],
    ),
)
test(
    "[21] Strategy Bottom Six Road Fade",
    run_script(
        "scripts/strategy/bottom_six_road_fade.py",
        [
            "--season",
            "2026",
            "--contest-format",
            "CIRCA",
            "--rating-week",
            "1",
            "--hfa-source",
            "SEMISHARP_2026_RECAL_V1",
        ],
    ),
)
test(
    "[22] Strategy Market Arbitrage Exit",
    run_script(
        "scripts/strategy/market_arbitrage_exit.py",
        [
            "--season",
            "2026",
            "--contest-format",
            "CIRCA",
            "--rating-week",
            "1",
            "--hfa-source",
            "SEMISHARP_2026_RECAL_V1",
        ],
    ),
)

# Core API endpoints
test("[23] API Health", api_get("/health"))
test("[24] API Teams", api_get("/teams"))
test(
    "[25] API Schedule",
    api_get("/schedule/2026/1"),
)
test(
    "[26] API Projections",
    api_get("/projections/2026/1"),
)
test("[27] API Risk", api_get("/risk/2026/1"))
test(
    "[28] API Market Consensus",
    api_get("/market/consensus/2026/1"),
)
test(
    "[29] API Projection Edge",
    api_get("/market/projection-edge/2026/1"),
)
test(
    "[30] API SIC",
    api_get("/injuries/sic/2026/1"),
)
test(
    "[31] API Strategy Registry",
    api_get("/strategies"),
)
test(
    "[32] API Context GET",
    api_get("/context/current"),
)

# Shared Strategy Context
test(
    "[33] Strategy Context CIRCA",
    validate_circa_strategy_context,
)
test(
    "[34] Strategy Context STANDARD",
    validate_standard_strategy_context,
)

# Strategy APIs
test(
    "[35] API Strategy Current Week Highest Win",
    api_get(
        "/strategies/current-week-highest-win/2026/CIRCA",
        {
            "rating_week": 1,
            "hfa_source": "SEMISHARP_2026_RECAL_V1",
            "entry_id": 1,
        },
    ),
)
test(
    "[39] API Strategy Monte Carlo",
    api_get(
        "/strategies/monte-carlo/2026/CIRCA"
    ),
)
test(
    "[40] API Strategy Dynamic Programming",
    api_get(
        "/strategies/dynamic-programming/2026/CIRCA"
    ),
)
test(
    "[41] API Strategy Bottom Six Road Fade",
    api_get(
        "/strategies/bottom-six-road-fade/2026/CIRCA"
    ),
)
test(
    "[42] API Strategy Market Arbitrage Exit",
    api_get(
        "/strategies/market-arbitrage-exit/2026/CIRCA"
    ),
)

# Current Week Highest Win V2 correctness
test(
    "[43] Current Week V2 Contract",
    validate_current_week_v2_contract,
)
test(
    "[44] Current Week V2 Ordering",
    validate_current_week_v2_ordering,
)
test(
    "[45] Current Week V2 Active Leg",
    validate_current_week_active_leg_only,
)
test(
    "[46] Current Week V2 Primary and Alternatives",
    validate_current_week_primary_consistency,
)
test(
    "[47] Current Week V2 Model Versions",
    validate_current_week_models,
)
test(
    "[48] Current Week V2 Used Teams Excluded",
    validate_current_week_used_teams_excluded,
)


# Compare Strategies correctness
test(
    "[49] Compare Strategies Contract",
    validate_compare_contract,
)
test(
    "[50] Compare Strategies Leg Count",
    validate_compare_leg_count,
)
test(
    "[51] Compare Strategies Probability Horizons",
    validate_compare_probability_horizons,
)
test(
    "[52] Compare Strategies Current Consensus",
    validate_compare_current_consensus,
)
test(
    "[53] Compare Strategies Late-Leg Horizon",
    validate_compare_late_leg_horizon,
)


# In-season management correctness
test(
    "[54] Season Management Status",
    api_get("/season-management/status"),
)
test(
    "[55] Season Management Valid Picks",
    api_get(
        "/season-management/entries/1/valid-picks/19"
    ),
)
test(
    "[56] Season Management Smoke Test",
    run_script(
        "scripts/tests/season_management_smoke_test.py",
        [],
    ),
)
test(
    "[57] Week 3 Recalculation",
    run_script(
        "scripts/tests/week3_recalculation_test.py",
        [],
    ),
)

# Authentication
test(
    "[58] API Auth Login Valid",
    api_post(
        "/auth/login",
        {
            "username": "SAS",
            "password": "SAS",
        },
        expected_status=200,
    ),
)
test(
    "[59] API Auth Login Invalid",
    api_post(
        "/auth/login",
        {
            "username": "SAS",
            "password": "WRONG",
        },
        expected_status=401,
    ),
)


# Team Alias Manager
test(
    "[60] Team Alias List Contract",
    validate_team_alias_list,
)
test(
    "[61] Team Alias Source Summary",
    validate_team_alias_sources,
)
test(
    "[62] Team Alias Resolution",
    validate_team_alias_resolution,
)
test(
    "[63] Team Alias Lifecycle",
    validate_team_alias_lifecycle,
)


# Home Field Advantage Manager
test(
    "[64] HFA Read Contract",
    validate_hfa_read_contract,
)
test(
    "[65] HFA Resolver",
    validate_hfa_resolver,
)
test(
    "[66] HFA Update Lifecycle",
    validate_hfa_update_lifecycle,
)


passed = sum(
    1
    for result in results
    if result[1]
)

print()
print("=" * 60)
print(f"REGRESSION MODE: {MODE.upper()}")
print(
    f"RESULT: {passed}/{len(results)} "
    "EXECUTED TESTS PASSED"
)

if skipped:
    print(f"SKIPPED: {len(skipped)} FULL-MODE TEST(S)")

print()
print("SLOWEST EXECUTED TESTS")

for name, _, _, elapsed in sorted(
    results,
    key=lambda result: result[3],
    reverse=True,
)[:10]:
    print(f"{elapsed:8.2f}s  {name}")

for name, succeeded, message, _ in results:
    if not succeeded:
        print(f"FAILED: {name} - {message}")

if passed != len(results):
    raise SystemExit(1)
