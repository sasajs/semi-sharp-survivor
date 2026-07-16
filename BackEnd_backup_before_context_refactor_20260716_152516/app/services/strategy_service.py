import subprocess
import json
import os

def run_strategy(script, args):
    """Executes a strategy script and returns the JSON output."""
    command = ["python3", script] + args
    result = subprocess.run(
        command,
        capture_output=True,
        text=True,
        env={**os.environ, "PYTHONPATH": "."}
    )
    if result.returncode != 0:
        raise Exception(result.stderr)
    return json.loads(result.stdout)

def current_week_highest_win(season, contest_format, rating_week, hfa_source, entry_id):
    return run_strategy("scripts/strategy/current_week_highest_win.py", [
        "--season", str(season), "--contest-format", contest_format,
        "--rating-week", str(rating_week), "--hfa-source", hfa_source, "--entry-id", str(entry_id)
    ])

def future_value(season, contest_format, rating_week, hfa_source, entry_id):
    return run_strategy("scripts/strategy/future_value.py", [
        "--season", str(season), "--contest-format", contest_format, 
        "--rating-week", str(rating_week), "--hfa-source", hfa_source, "--entry-id", str(entry_id)
    ])

def multiple_entry(season, contest_format, rating_week, hfa_source, user_id):
    """Fixed: Removed default values to ensure required arguments are explicitly provided."""
    return run_strategy("scripts/strategy/multiple_entry_portfolio.py", [
        "--season", str(season), "--contest-format", contest_format,
        "--rating-week", str(rating_week), "--hfa-source", hfa_source, "--user-id", str(user_id)
    ])

def circa_holiday(season, rating_week, hfa_source):
    return run_strategy("scripts/strategy/circa_holiday_reserve.py", [
        "--season", str(season), "--rating-week", str(rating_week), "--hfa-source", hfa_source
    ])

def projection_edge(season, contest_format):
    return run_strategy("scripts/strategy/projection_edge.py", [
        "--season", str(season), "--contest-format", contest_format
    ])

def monte_carlo(
    season,
    contest_format,
    rating_week,
    hfa_source,
    entry_id=None,
):
    args = [
        "--season", str(season), "--contest-format", contest_format,
        "--rating-week", str(rating_week), "--hfa-source", hfa_source
    ]
    if entry_id is not None:
        args.extend(["--entry-id", str(entry_id)])
    return run_strategy(
        "scripts/strategy/monte_carlo_survivor.py",
        args,
    )

def dynamic_programming(
    season,
    contest_format,
    rating_week,
    hfa_source,
    entry_id=None,
):
    args = [
        "--season", str(season), "--contest-format", contest_format,
        "--rating-week", str(rating_week), "--hfa-source", hfa_source
    ]
    if entry_id is not None:
        args.extend(["--entry-id", str(entry_id)])
    return run_strategy(
        "scripts/strategy/dynamic_programming.py",
        args,
    )

def bottom_six_road_fade(season, contest_format, rating_week, hfa_source):
    return run_strategy("scripts/strategy/bottom_six_road_fade.py", [
        "--season", str(season), "--contest-format", contest_format,
        "--rating-week", str(rating_week), "--hfa-source", hfa_source
    ])

def market_arbitrage_exit(season, contest_format, rating_week, hfa_source):
    return run_strategy("scripts/strategy/market_arbitrage_exit.py", [
        "--season", str(season), "--contest-format", contest_format,
        "--rating-week", str(rating_week), "--hfa-source", hfa_source
    ])
