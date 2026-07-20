#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


@dataclass
class ValidationResult:
    failures: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    observations: list[str] = field(default_factory=list)

    def fail(self, message: str) -> None:
        self.failures.append(message)

    def warn(self, message: str) -> None:
        self.warnings.append(message)

    def observe(self, message: str) -> None:
        self.observations.append(message)


def fetch_json(url: str, timeout: int = 30) -> dict[str, Any]:
    request = urllib.request.Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "SemiSharp-Validation/1.0",
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            if response.status != 200:
                raise RuntimeError(
                    f"Expected HTTP 200, received {response.status}"
                )

            body = response.read().decode("utf-8")
            return json.loads(body)

    except urllib.error.HTTPError as exc:
        raise RuntimeError(
            f"HTTP error {exc.code}: {exc.reason}"
        ) from exc

    except urllib.error.URLError as exc:
        raise RuntimeError(
            f"Connection error: {exc.reason}"
        ) from exc

    except json.JSONDecodeError as exc:
        raise RuntimeError(
            f"Endpoint returned invalid JSON: {exc}"
        ) from exc


def require_keys(
    result: ValidationResult,
    value: dict[str, Any],
    keys: set[str],
    location: str,
) -> None:
    missing = sorted(keys - value.keys())

    if missing:
        result.fail(
            f"{location}: missing required keys: {', '.join(missing)}"
        )


def validate_team(
    result: ValidationResult,
    team: Any,
    location: str,
) -> None:
    if not isinstance(team, dict):
        result.fail(f"{location}: expected object")
        return

    require_keys(
        result,
        team,
        {
            "team_id",
            "team_abbr",
            "team_name",
            "power_rating",
        },
        location,
    )

    if not team.get("team_abbr"):
        result.fail(f"{location}.team_abbr is empty")

    if not team.get("team_name"):
        result.fail(f"{location}.team_name is empty")


def validate_sportsbook(
    result: ValidationResult,
    book: Any,
    location: str,
) -> None:
    if not isinstance(book, dict):
        result.fail(f"{location}: expected object")
        return

    require_keys(
        result,
        book,
        {
            "bookmaker_key",
            "bookmaker_title",
            "away_spread",
            "away_price",
            "home_spread",
            "home_price",
            "last_update",
            "pulled_at",
        },
        location,
    )

    away_spread = book.get("away_spread")
    home_spread = book.get("home_spread")

    if away_spread is None or home_spread is None:
        result.warn(
            f"{location}: incomplete two-sided spread"
        )
        return

    if abs(float(away_spread) + float(home_spread)) > 0.001:
        result.fail(
            f"{location}: spread signs do not balance: "
            f"{away_spread} + {home_spread}"
        )


def validate_game(
    result: ValidationResult,
    game: Any,
    index: int,
) -> None:
    location = f"games[{index}]"

    if not isinstance(game, dict):
        result.fail(f"{location}: expected object")
        return

    require_keys(
        result,
        game,
        {
            "game_id",
            "season",
            "week",
            "game_type",
            "gameday",
            "gametime",
            "away_team",
            "home_team",
            "schedule_reference",
            "semisharp_projection",
            "market",
            "risk",
        },
        location,
    )

    game_id = game.get("game_id", location)

    validate_team(
        result,
        game.get("away_team"),
        f"{game_id}.away_team",
    )

    validate_team(
        result,
        game.get("home_team"),
        f"{game_id}.home_team",
    )

    projection = game.get("semisharp_projection")

    if not isinstance(projection, dict):
        result.fail(
            f"{game_id}.semisharp_projection: expected object"
        )
    else:
        require_keys(
            result,
            projection,
            {
                "rating_week",
                "power_rating_diff",
                "home_field_points",
                "projected_home_margin",
                "projected_favorite_team_id",
                "projected_favorite_abbr",
                "projected_spread",
                "source_system",
                "created_at",
                "home_win_probability",
                "away_win_probability",
            },
            f"{game_id}.semisharp_projection",
        )

        if projection.get("projected_spread") is None:
            result.fail(
                f"{game_id}: missing SemiSharp projected spread"
            )

        if projection.get("home_win_probability") is not None:
            probability = float(
                projection["home_win_probability"]
            )

            if not 0.0 <= probability <= 1.0:
                result.fail(
                    f"{game_id}: invalid home win probability "
                    f"{probability}"
                )

    market = game.get("market")

    if not isinstance(market, dict):
        result.fail(f"{game_id}.market: expected object")
        return

    require_keys(
        result,
        market,
        {
            "away_consensus_spread",
            "away_consensus_price",
            "home_consensus_spread",
            "home_consensus_price",
            "sportsbook_count",
            "latest_snapshot",
            "away_edge",
            "home_edge",
            "sportsbooks",
        },
        f"{game_id}.market",
    )

    away_consensus = market.get("away_consensus_spread")
    home_consensus = market.get("home_consensus_spread")

    if away_consensus is None or home_consensus is None:
        result.warn(
            f"{game_id}: no complete market consensus"
        )
    elif abs(
        float(away_consensus) + float(home_consensus)
    ) > 0.001:
        result.fail(
            f"{game_id}: consensus signs do not balance"
        )

    sportsbooks = market.get("sportsbooks")

    if not isinstance(sportsbooks, list):
        result.fail(
            f"{game_id}.market.sportsbooks: expected list"
        )
    else:
        for book_index, book in enumerate(sportsbooks):
            validate_sportsbook(
                result,
                book,
                f"{game_id}.sportsbooks[{book_index}]",
            )

        declared_count = market.get("sportsbook_count")

        if (
            declared_count is not None
            and int(declared_count) != len(sportsbooks)
        ):
            result.warn(
                f"{game_id}: sportsbook_count={declared_count}, "
                f"returned_books={len(sportsbooks)}"
            )

    away_edge = market.get("away_edge") or {}
    home_edge = market.get("home_edge") or {}

    if (
        away_edge.get("edge_points") is None
        or home_edge.get("edge_points") is None
    ):
        result.warn(
            f"{game_id}: projection edge is not populated"
        )


def build_markdown_report(
    result: ValidationResult,
    url: str,
    payload: dict[str, Any],
) -> str:
    lines = [
        "# SemiSharp Weekly Analysis Validation",
        "",
        f"- Endpoint: `{url}`",
        f"- Season: `{payload.get('season')}`",
        f"- Week: `{payload.get('week')}`",
        f"- Game count: `{payload.get('game_count')}`",
        f"- Failures: `{len(result.failures)}`",
        f"- Warnings: `{len(result.warnings)}`",
        "",
        "## Result",
        "",
        (
            "**PASS**"
            if not result.failures
            else "**FAIL**"
        ),
        "",
    ]

    if result.failures:
        lines.extend([
            "## Failures",
            "",
        ])
        lines.extend(
            f"- {message}"
            for message in result.failures
        )
        lines.append("")

    if result.warnings:
        lines.extend([
            "## Warnings",
            "",
        ])
        lines.extend(
            f"- {message}"
            for message in result.warnings
        )
        lines.append("")

    if result.observations:
        lines.extend([
            "## Observations",
            "",
        ])
        lines.extend(
            f"- {message}"
            for message in result.observations
        )
        lines.append("")

    lines.extend([
        "## Scope",
        "",
        "This validation checks the public aggregation contract for:",
        "",
        "- weekly schedule coverage",
        "- team identity and power ratings",
        "- SemiSharp spread projections",
        "- consensus market lines",
        "- sportsbook line pairing",
        "- risk objects",
        "- projection-edge availability",
        "",
        "Warnings do not fail the run. Contract violations and invalid "
        "numeric relationships do fail the run.",
        "",
    ])

    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--base-url",
        default="http://127.0.0.1:8000",
    )
    parser.add_argument(
        "--season",
        type=int,
        default=2026,
    )
    parser.add_argument(
        "--week",
        type=int,
        default=1,
    )
    parser.add_argument(
        "--report",
        type=Path,
        default=Path(
            "artifacts/validation/analysis_api_validation.md"
        ),
    )
    parser.add_argument(
        "--json-output",
        type=Path,
        default=Path(
            "artifacts/validation/analysis_api_response.json"
        ),
    )

    args = parser.parse_args()

    url = (
        f"{args.base_url.rstrip('/')}"
        f"/analysis/week/{args.season}/{args.week}"
    )

    try:
        payload = fetch_json(url)
    except RuntimeError as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        return 2

    result = ValidationResult()

    require_keys(
        result,
        payload,
        {
            "season",
            "week",
            "game_count",
            "games",
        },
        "response",
    )

    games = payload.get("games")

    if not isinstance(games, list):
        result.fail("response.games: expected list")
        games = []

    if payload.get("game_count") != len(games):
        result.fail(
            "response.game_count does not match games length"
        )

    game_ids: list[str] = []

    for index, game in enumerate(games):
        validate_game(result, game, index)

        if isinstance(game, dict) and game.get("game_id"):
            game_ids.append(game["game_id"])

    duplicate_game_ids = sorted({
        game_id
        for game_id in game_ids
        if game_ids.count(game_id) > 1
    })

    if duplicate_game_ids:
        result.fail(
            "Duplicate game IDs: "
            + ", ".join(duplicate_game_ids)
        )

    result.observe(
        f"Validated {len(games)} games."
    )

    args.report.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    args.json_output.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    args.json_output.write_text(
        json.dumps(payload, indent=2, sort_keys=True)
        + "\n"
    )

    args.report.write_text(
        build_markdown_report(result, url, payload)
    )

    print(
        f"Validated endpoint: {url}"
    )
    print(
        f"Games: {len(games)}"
    )
    print(
        f"Failures: {len(result.failures)}"
    )
    print(
        f"Warnings: {len(result.warnings)}"
    )
    print(
        f"Report: {args.report}"
    )

    for failure in result.failures:
        print(f"FAIL: {failure}")

    for warning in result.warnings:
        print(f"WARN: {warning}")

    return 1 if result.failures else 0


if __name__ == "__main__":
    raise SystemExit(main())

