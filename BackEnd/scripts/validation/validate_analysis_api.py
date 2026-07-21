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
        with urllib.request.urlopen(
            request,
            timeout=timeout,
        ) as response:
            if response.status != 200:
                raise RuntimeError(
                    f"Expected HTTP 200, received {response.status}"
                )

            body = response.read().decode("utf-8")
            payload = json.loads(body)

            if not isinstance(payload, dict):
                raise RuntimeError(
                    "Endpoint returned JSON that was not an object"
                )

            return payload

    except urllib.error.HTTPError as exc:
        body = ""

        try:
            body = exc.read().decode("utf-8")
        except Exception:
            body = ""

        detail = f": {body}" if body else ""

        raise RuntimeError(
            f"HTTP error {exc.code}: {exc.reason}{detail}"
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

    if not book.get("bookmaker_key"):
        result.fail(f"{location}.bookmaker_key is empty")

    if not book.get("bookmaker_title"):
        result.fail(f"{location}.bookmaker_title is empty")

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

        home_probability = projection.get(
            "home_win_probability"
        )
        away_probability = projection.get(
            "away_win_probability"
        )

        if home_probability is not None:
            probability = float(home_probability)

            if not 0.0 <= probability <= 1.0:
                result.fail(
                    f"{game_id}: invalid home win probability "
                    f"{probability}"
                )

        if away_probability is not None:
            probability = float(away_probability)

            if not 0.0 <= probability <= 1.0:
                result.fail(
                    f"{game_id}: invalid away win probability "
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
        bookmaker_keys: list[str] = []

        for book_index, book in enumerate(sportsbooks):
            validate_sportsbook(
                result,
                book,
                f"{game_id}.sportsbooks[{book_index}]",
            )

            if isinstance(book, dict):
                bookmaker_key = book.get("bookmaker_key")

                if bookmaker_key:
                    bookmaker_keys.append(
                        str(bookmaker_key)
                    )

        duplicate_bookmakers = sorted({
            bookmaker_key
            for bookmaker_key in bookmaker_keys
            if bookmaker_keys.count(bookmaker_key) > 1
        })

        if duplicate_bookmakers:
            result.fail(
                f"{game_id}: duplicate bookmakers: "
                + ", ".join(duplicate_bookmakers)
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

    risk = game.get("risk")

    if not isinstance(risk, dict):
        result.fail(f"{game_id}.risk: expected object")
    else:
        require_keys(
            result,
            risk,
            {
                "away",
                "home",
            },
            f"{game_id}.risk",
        )


def validate_game_detail(
    result: ValidationResult,
    base_url: str,
    expected_game: dict[str, Any],
) -> None:
    game_id = expected_game.get("game_id")

    if not game_id:
        result.fail(
            "Game-detail validation could not determine a game_id"
        )
        return

    endpoint = (
        f"{base_url.rstrip('/')}"
        f"/analysis/game/{game_id}"
    )

    try:
        game = fetch_json(endpoint)
    except RuntimeError as exc:
        result.fail(
            f"Game-detail request failed for {game_id}: {exc}"
        )
        return

    required_fields = {
        "game_id",
        "season",
        "week",
        "away_team",
        "home_team",
        "schedule_reference",
        "semisharp_projection",
        "market",
        "risk",
    }

    require_keys(
        result,
        game,
        required_fields,
        f"game-detail[{game_id}]",
    )

    if game.get("game_id") != game_id:
        result.fail(
            "Game-detail response returned the wrong game_id: "
            f"expected={game_id}, actual={game.get('game_id')}"
        )

    if game.get("season") != expected_game.get("season"):
        result.fail(
            f"{game_id}: game-detail season does not match "
            "weekly response"
        )

    if game.get("week") != expected_game.get("week"):
        result.fail(
            f"{game_id}: game-detail week does not match "
            "weekly response"
        )

    expected_away = expected_game.get("away_team") or {}
    expected_home = expected_game.get("home_team") or {}
    actual_away = game.get("away_team") or {}
    actual_home = game.get("home_team") or {}

    if (
        actual_away.get("team_id")
        != expected_away.get("team_id")
    ):
        result.fail(
            f"{game_id}: game-detail away team does not match "
            "weekly response"
        )

    if (
        actual_home.get("team_id")
        != expected_home.get("team_id")
    ):
        result.fail(
            f"{game_id}: game-detail home team does not match "
            "weekly response"
        )

    market = game.get("market")

    if not isinstance(market, dict):
        result.fail(
            f"{game_id}: game-detail market is not an object"
        )
        return

    sportsbooks = market.get("sportsbooks")

    if not isinstance(sportsbooks, list):
        result.fail(
            f"{game_id}: game-detail market.sportsbooks "
            "is not a list"
        )
        return

    sportsbook_count = market.get("sportsbook_count")

    if (
        sportsbook_count is not None
        and int(sportsbook_count) != len(sportsbooks)
    ):
        result.fail(
            f"{game_id}: game-detail sportsbook count "
            f"does not match array length: "
            f"{sportsbook_count} versus {len(sportsbooks)}"
        )

    bookmaker_keys = [
        str(book.get("bookmaker_key"))
        for book in sportsbooks
        if isinstance(book, dict)
        and book.get("bookmaker_key")
    ]

    duplicate_bookmakers = sorted({
        bookmaker_key
        for bookmaker_key in bookmaker_keys
        if bookmaker_keys.count(bookmaker_key) > 1
    })

    if duplicate_bookmakers:
        result.fail(
            f"{game_id}: game-detail contains duplicate "
            "bookmakers: "
            + ", ".join(duplicate_bookmakers)
        )

    if not sportsbooks:
        result.warn(
            f"{game_id}: no sportsbook rows were returned "
            "by the game-detail endpoint"
        )

    expected_market = expected_game.get("market") or {}
    expected_sportsbooks = expected_market.get(
        "sportsbooks"
    )

    if isinstance(expected_sportsbooks, list):
        expected_keys = sorted(
            str(book.get("bookmaker_key"))
            for book in expected_sportsbooks
            if isinstance(book, dict)
            and book.get("bookmaker_key")
        )

        actual_keys = sorted(bookmaker_keys)

        if expected_keys != actual_keys:
            result.fail(
                f"{game_id}: game-detail bookmaker set "
                "does not match weekly response"
            )

    result.observe(
        f"Validated game-detail endpoint for {game_id} "
        f"with {len(sportsbooks)} sportsbook rows."
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
        "- single-game analysis retrieval",
        "- team identity and power ratings",
        "- SemiSharp spread projections",
        "- consensus market lines",
        "- sportsbook line pairing",
        "- sportsbook count reconciliation",
        "- duplicate bookmaker detection",
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

    base_url = args.base_url.rstrip("/")

    url = (
        f"{base_url}"
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
            game_ids.append(str(game["game_id"]))

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
        f"Validated {len(games)} weekly games."
    )

    if games and isinstance(games[0], dict):
        validate_game_detail(
            result=result,
            base_url=base_url,
            expected_game=games[0],
        )
    else:
        result.fail(
            "Weekly analysis returned no game suitable for "
            "game-detail validation"
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
        json.dumps(
            payload,
            indent=2,
            sort_keys=True,
        )
        + "\n",
        encoding="utf-8",
    )

    args.report.write_text(
        build_markdown_report(
            result,
            url,
            payload,
        ),
        encoding="utf-8",
    )

    print(f"Validated endpoint: {url}")
    print(f"Games: {len(games)}")
    print(f"Failures: {len(result.failures)}")
    print(f"Warnings: {len(result.warnings)}")
    print(f"Report: {args.report}")

    for observation in result.observations:
        print(f"INFO: {observation}")

    for failure in result.failures:
        print(f"FAIL: {failure}")

    for warning in result.warnings:
        print(f"WARN: {warning}")

    return 1 if result.failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
