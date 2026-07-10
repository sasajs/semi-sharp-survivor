import subprocess
import json
import os


def run_strategy(script, args):
    command = [
        "python3",
        script
    ] + args

    result = subprocess.run(
        command,
        capture_output=True,
        text=True,
        env={
            **os.environ,
            "PYTHONPATH": "."
        }
    )

    if result.returncode != 0:
        raise Exception(result.stderr)

    return json.loads(result.stdout)


def current_week_highest_win(
    season,
    contest_format,
    rating_week=1,
    hfa_source="SEMISHARP_2026"
):
    return run_strategy(
        "scripts/strategy/current_week_highest_win.py",
        [
            "--season", str(season),
            "--contest-format", contest_format,
            "--rating-week", str(rating_week),
            "--hfa-source", hfa_source
        ]
    )


def future_value(season, contest_format, rating_week=1, hfa_source="SEMISHARP_2026"):
    return run_strategy(
        "scripts/strategy/future_value.py",
        [
            "--season", str(season),
            "--contest-format", contest_format,
            "--rating-week", str(rating_week),
            "--hfa-source", hfa_source
        ]
    )


def multiple_entry(season, contest_format, rating_week=1, hfa_source="SEMISHARP_2026"):
    return run_strategy(
        "scripts/strategy/multiple_entry_portfolio.py",
        [
            "--season", str(season),
            "--contest-format", contest_format,
            "--rating-week", str(rating_week),
            "--hfa-source", hfa_source
        ]
    )


def circa_holiday(season, rating_week=1, hfa_source="SEMISHARP_2026"):
    return run_strategy(
        "scripts/strategy/circa_holiday_reserve.py",
        [
            "--season", str(season),
            "--rating-week", str(rating_week),
            "--hfa-source", hfa_source
        ]
    )


def projection_edge(
    season,
    contest_format
):
    return run_strategy(
        "scripts/strategy/projection_edge.py",
        [
            "--season", str(season),
            "--contest-format", contest_format
        ]
    )


def monte_carlo(
    season,
    contest_format,
    rating_week=1,
    hfa_source="SEMISHARP_2026"
):
    return run_strategy(
        "scripts/strategy/monte_carlo_survivor.py",
        [
            "--season", str(season),
            "--contest-format", contest_format,
            "--rating-week", str(rating_week),
            "--hfa-source", hfa_source
        ]
    )


def dynamic_programming(
    season,
    contest_format,
    rating_week=1,
    hfa_source="SEMISHARP_2026"
):
    return run_strategy(
        "scripts/strategy/dynamic_programming.py",
        [
            "--season", str(season),
            "--contest-format", contest_format,
            "--rating-week", str(rating_week),
            "--hfa-source", hfa_source
        ]
    )


def bottom_six_road_fade(
    season,
    contest_format,
    rating_week=1,
    hfa_source="SEMISHARP_2026"
):
    return run_strategy(
        "scripts/strategy/bottom_six_road_fade.py",
        [
            "--season", str(season),
            "--contest-format", contest_format,
            "--rating-week", str(rating_week),
            "--hfa-source", hfa_source
        ]
    )


def market_arbitrage_exit(
    season,
    contest_format,
    rating_week=1,
    hfa_source="SEMISHARP_2026"
):
    return run_strategy(
        "scripts/strategy/market_arbitrage_exit.py",
        [
            "--season", str(season),
            "--contest-format", contest_format,
            "--rating-week", str(rating_week),
            "--hfa-source", hfa_source
        ]
    )
