from __future__ import annotations

"""
Unified strategy comparison service.

Runs the active season-planning strategies for one survivor entry and
returns a backend-generated comparison by contest leg.

Included strategies
-------------------
- Future Value
- Bottom Six Road Fade
- Market Arbitrage Exit
- Monte Carlo Survivor
- Dynamic Programming

Current Week Highest Win is excluded because it is a current-leg ranking
tool rather than a season-path strategy.
"""

from collections import Counter, OrderedDict
from copy import deepcopy
from threading import Lock
from time import monotonic
from typing import Any

from app.services.strategy_context_service import build_strategy_context
from app.services.strategy_service import run_strategy


STRATEGY_DEFINITIONS = (
    {
        "code": "FUTURE_VALUE",
        "display_name": "Future Value",
        "script": "scripts/strategy/future_value.py",
        "strategy_type": "SEASON_PATH",
    },
    {
        "code": "BOTTOM_SIX_ROAD_FADE",
        "display_name": "Bottom Six Road Fade",
        "script": "scripts/strategy/bottom_six_road_fade.py",
        "strategy_type": "SEASON_PATH",
    },
    {
        "code": "MARKET_ARBITRAGE_EXIT",
        "display_name": "Market Arbitrage Exit",
        "script": "scripts/strategy/market_arbitrage_exit.py",
        "strategy_type": "EXIT_HORIZON_PATH",
    },
    {
        "code": "MONTE_CARLO",
        "display_name": "Monte Carlo Survivor",
        "script": "scripts/strategy/monte_carlo_survivor.py",
        "strategy_type": "SIMULATION_OPTIMIZER",
    },
    {
        "code": "DYNAMIC_PROGRAMMING",
        "display_name": "Dynamic Programming",
        "script": "scripts/strategy/dynamic_programming.py",
        "strategy_type": "REFERENCE_OPTIMIZER",
    },
)


class CompareStrategiesError(ValueError):
    """Raised when strategy comparison cannot be completed."""


COMPARE_CACHE_TTL_SECONDS = 300.0
COMPARE_CACHE_MAX_ENTRIES = 128

_compare_cache: OrderedDict[tuple[Any, ...], tuple[float, dict[str, Any]]] = OrderedDict()
_compare_cache_lock = Lock()


def _comparison_cache_key(
    *,
    season: int,
    contest_format: str,
    rating_week: int,
    hfa_source: str,
    entry_id: int,
) -> tuple[Any, ...]:
    """Build an entry- and model-scoped cache key from authoritative context."""
    context = build_strategy_context(
        entry_id=entry_id,
        contest_format=contest_format,
    )

    return (
        season,
        contest_format,
        rating_week,
        hfa_source,
        entry_id,
        context.season,
        context.current_week,
        context.current_contest_leg_id,
        context.current_leg_number,
        context.projection_model,
        context.risk_model,
        context.probability_model,
        context.hfa_source,
        context.used_team_ids,
    )


def _get_cached_comparison(
    key: tuple[Any, ...],
) -> dict[str, Any] | None:
    now = monotonic()

    with _compare_cache_lock:
        cached = _compare_cache.get(key)

        if cached is None:
            return None

        created_at, payload = cached

        if now - created_at > COMPARE_CACHE_TTL_SECONDS:
            del _compare_cache[key]
            return None

        _compare_cache.move_to_end(key)
        return deepcopy(payload)


def _store_cached_comparison(
    key: tuple[Any, ...],
    payload: dict[str, Any],
) -> None:
    with _compare_cache_lock:
        _compare_cache[key] = (
            monotonic(),
            deepcopy(payload),
        )
        _compare_cache.move_to_end(key)

        while len(_compare_cache) > COMPARE_CACHE_MAX_ENTRIES:
            _compare_cache.popitem(last=False)


def clear_compare_strategy_cache() -> None:
    """Clear all in-process comparison results."""
    with _compare_cache_lock:
        _compare_cache.clear()


def _common_arguments(
    *,
    season: int,
    contest_format: str,
    rating_week: int,
    hfa_source: str,
    entry_id: int,
) -> list[str]:
    return [
        "--season",
        str(season),
        "--contest-format",
        contest_format,
        "--rating-week",
        str(rating_week),
        "--hfa-source",
        hfa_source,
        "--entry-id",
        str(entry_id),
    ]


def _extract_entry(
    payload: dict[str, Any],
    entry_id: int,
) -> dict[str, Any]:
    entries = payload.get("entries")

    if not isinstance(entries, list):
        raise CompareStrategiesError(
            f"{payload.get('strategy')} returned no entries list."
        )

    for entry in entries:
        if int(entry.get("entry_id", -1)) == entry_id:
            return entry

    raise CompareStrategiesError(
        f"{payload.get('strategy')} did not return entry {entry_id}."
    )


def _extract_probability(
    payload: dict[str, Any],
    entry: dict[str, Any],
) -> float | None:
    value = entry.get(
        "estimated_path_survival_probability"
    )

    if value is None:
        value = payload.get(
            "estimated_path_survival_probability"
        )

    return float(value) if value is not None else None


def _extract_conditional_probability(
    payload: dict[str, Any],
    entry: dict[str, Any],
) -> float | None:
    value = entry.get(
        "conditional_survival_probability"
    )

    if value is None:
        value = payload.get(
            "conditional_survival_probability"
        )

    return float(value) if value is not None else None


def _normalize_pick(
    pick: dict[str, Any],
) -> dict[str, Any]:
    return {
        "contest_leg_id": pick.get("contest_leg_id"),
        "leg_number": pick.get(
            "leg_number",
            pick.get("leg"),
        ),
        "leg_code": pick.get("leg_code"),
        "leg_name": pick.get("leg_name"),
        "nfl_week": pick.get("nfl_week"),
        "is_special_leg": bool(
            pick.get("is_special_leg", False)
        ),
        "special_leg_type": pick.get(
            "special_leg_type"
        ),
        "team_id": pick.get("team_id"),
        "team": pick.get("team"),
        "opponent": pick.get("opponent"),
        "game_id": pick.get("game_id"),
        "risk_adjusted_wp": pick.get(
            "risk_adjusted_wp",
            pick.get("adjusted_probability"),
        ),
        "rationale": pick.get("rationale"),
    }


def _normalize_strategy_result(
    *,
    definition: dict[str, str],
    payload: dict[str, Any],
    entry_id: int,
) -> dict[str, Any]:
    entry = _extract_entry(payload, entry_id)

    raw_picks = entry.get(
        "picks",
        payload.get("picks", []),
    )

    picks = [
        _normalize_pick(pick)
        for pick in raw_picks
    ]

    return {
        "strategy_code": definition["code"],
        "display_name": definition["display_name"],
        "strategy_version": payload.get(
            "strategy_version"
        ),
        "strategy_type": payload.get(
            "strategy_type",
            definition["strategy_type"],
        ),
        "objective": payload.get("objective"),
        "planning_horizon": (
            payload.get("exit_horizon_week")
            or payload.get("target_horizon")
            or "REMAINING_SEASON"
        ),
        "estimated_path_survival_probability": (
            _extract_probability(payload, entry)
        ),
        "conditional_survival_probability": (
            _extract_conditional_probability(
                payload,
                entry,
            )
        ),
        "path_metrics": entry.get(
            "path_metrics",
            payload.get("path_metrics"),
        ),
        "holiday_selections": entry.get(
            "holiday_selections",
            payload.get(
                "holiday_reservations",
                [],
            ),
        ),
        "simulation_metrics": entry.get(
            "simulation_metrics"
        ),
        "optimization_diagnostics": entry.get(
            "optimization_diagnostics"
        ),
        "primary_recommendation": entry.get(
            "primary_recommendation",
            payload.get("primary_recommendation"),
        ),
        "picks": picks,
    }


def _build_leg_comparison(
    strategy_results: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    leg_metadata: dict[int, dict[str, Any]] = {}
    picks_by_leg: dict[
        int,
        dict[str, dict[str, Any]],
    ] = {}

    for strategy in strategy_results:
        strategy_code = strategy["strategy_code"]

        for pick in strategy["picks"]:
            leg_number = pick.get("leg_number")

            if leg_number is None:
                continue

            leg_number = int(leg_number)

            leg_metadata.setdefault(
                leg_number,
                {
                    "contest_leg_id": pick.get(
                        "contest_leg_id"
                    ),
                    "leg_number": leg_number,
                    "leg_code": pick.get("leg_code"),
                    "leg_name": pick.get("leg_name"),
                    "nfl_week": pick.get("nfl_week"),
                    "is_special_leg": pick.get(
                        "is_special_leg"
                    ),
                    "special_leg_type": pick.get(
                        "special_leg_type"
                    ),
                },
            )

            picks_by_leg.setdefault(
                leg_number,
                {},
            )[strategy_code] = pick

    comparison: list[dict[str, Any]] = []

    for leg_number in sorted(leg_metadata):
        strategy_picks = picks_by_leg.get(
            leg_number,
            {},
        )

        team_values = [
            pick["team"]
            for pick in strategy_picks.values()
            if pick.get("team")
        ]

        counts = Counter(team_values)

        consensus_team = None
        agreement_count = 0

        if counts:
            consensus_team, agreement_count = sorted(
                counts.items(),
                key=lambda item: (
                    -item[1],
                    item[0],
                ),
            )[0]

        available_strategy_count = len(
            strategy_picks
        )

        complete_agreement = (
            available_strategy_count > 1
            and agreement_count
            == available_strategy_count
        )

        comparison.append({
            **leg_metadata[leg_number],
            "available_strategy_count": (
                available_strategy_count
            ),
            "consensus_team": consensus_team,
            "agreement_count": agreement_count,
            "complete_agreement": complete_agreement,
            "has_disagreement": (
                available_strategy_count > 1
                and not complete_agreement
            ),
            "strategy_picks": strategy_picks,
        })

    return comparison


def compare_strategies(
    *,
    season: int,
    contest_format: str,
    rating_week: int,
    hfa_source: str,
    entry_id: int,
) -> dict[str, Any]:
    format_code = contest_format.strip().upper()

    if format_code not in {"STANDARD", "CIRCA"}:
        raise CompareStrategiesError(
            "contest_format must be STANDARD or CIRCA."
        )

    cache_key = _comparison_cache_key(
        season=season,
        contest_format=format_code,
        rating_week=rating_week,
        hfa_source=hfa_source,
        entry_id=entry_id,
    )

    cached = _get_cached_comparison(cache_key)

    if cached is not None:
        return cached

    arguments = _common_arguments(
        season=season,
        contest_format=format_code,
        rating_week=rating_week,
        hfa_source=hfa_source,
        entry_id=entry_id,
    )

    strategy_results: list[dict[str, Any]] = []

    for definition in STRATEGY_DEFINITIONS:
        payload = run_strategy(
            definition["script"],
            arguments,
        )

        normalized = _normalize_strategy_result(
            definition=definition,
            payload=payload,
            entry_id=entry_id,
        )

        strategy_results.append(normalized)

    leg_comparison = _build_leg_comparison(
        strategy_results
    )

    full_season_probability_rankings = sorted(
        [
            {
                "strategy_code": result["strategy_code"],
                "display_name": result["display_name"],
                "planning_horizon": result["planning_horizon"],
                "estimated_path_survival_probability": result[
                    "estimated_path_survival_probability"
                ],
                "conditional_survival_probability": result[
                    "conditional_survival_probability"
                ],
            }
            for result in strategy_results
            if result["strategy_code"] != "MARKET_ARBITRAGE_EXIT"
            and result["estimated_path_survival_probability"] is not None
        ],
        key=lambda item: (
            -item["estimated_path_survival_probability"],
            item["strategy_code"],
        ),
    )

    exit_horizon_probability_rankings = sorted(
        [
            {
                "strategy_code": result["strategy_code"],
                "display_name": result["display_name"],
                "planning_horizon": result["planning_horizon"],
                "estimated_path_survival_probability": result[
                    "estimated_path_survival_probability"
                ],
                "conditional_survival_probability": result[
                    "conditional_survival_probability"
                ],
            }
            for result in strategy_results
            if result["strategy_code"] == "MARKET_ARBITRAGE_EXIT"
            and result["estimated_path_survival_probability"] is not None
        ],
        key=lambda item: (
            -item["estimated_path_survival_probability"],
            item["strategy_code"],
        ),
    )

    current_leg = (
        leg_comparison[0]
        if leg_comparison
        else None
    )

    disagreement_legs = [
        leg
        for leg in leg_comparison
        if leg["has_disagreement"]
    ]

    response = {
        "comparison_version": "1.0",
        "season": season,
        "contest_format": format_code,
        "rating_week": rating_week,
        "hfa_source": hfa_source,
        "entry_id": entry_id,
        "strategy_count": len(strategy_results),
        "strategies": strategy_results,
        "probability_rankings": (
            full_season_probability_rankings
        ),
        "full_season_probability_rankings": (
            full_season_probability_rankings
        ),
        "exit_horizon_probability_rankings": (
            exit_horizon_probability_rankings
        ),
        "probability_comparison_note": (
            "Market Arbitrage Exit uses a Week 10 horizon and must "
            "not be ranked directly against complete-season paths."
        ),
        "leg_comparison": leg_comparison,
        "current_leg_comparison": current_leg,
        "agreement_summary": {
            "compared_leg_count": len(
                leg_comparison
            ),
            "complete_agreement_leg_count": sum(
                1
                for leg in leg_comparison
                if leg["complete_agreement"]
            ),
            "disagreement_leg_count": len(
                disagreement_legs
            ),
            "disagreement_leg_numbers": [
                leg["leg_number"]
                for leg in disagreement_legs
            ],
        },
    }

    _store_cached_comparison(cache_key, response)
    return response
