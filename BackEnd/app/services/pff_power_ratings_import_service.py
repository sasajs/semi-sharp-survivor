from __future__ import annotations

import csv
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from app.db import get_connection
from app.repositories.team_repository import get_team_lookup


class PffPowerRatingsImportError(ValueError):
    pass


BACKEND_ROOT = Path(__file__).resolve().parents[2]
PROJECT_ROOT = BACKEND_ROOT.parent

DEFAULT_INPUT_FILE = (
    PROJECT_ROOT
    / "Input"
    / "pff"
    / "power_ratings"
    / "nfl-power-ratings.csv"
)

REQUIRED_COLUMNS = {
    "Team",
    "Point Spread Rating Points",
    "Point Spread Rating QB",
    "Strength of Schedule To Date",
    "Strength of Schedule Remaining",
    "Projections Avg. Wins",
    "Projections Make Playoffs",
    "Projections Win Division Title",
    "Projections Win Conf Champ",
    "Projections Win Super Bowl",
}


@dataclass(frozen=True)
class ParsedRating:
    team_id: int
    pff_team_code: str
    point_spread_rating: float | None
    qb_rating: float | None
    sos_to_date: float | None
    sos_remaining: float | None
    projected_wins: float | None
    make_playoffs_pct: float | None
    win_division_pct: float | None
    win_conference_pct: float | None
    win_super_bowl_pct: float | None


def _clean(value: Any) -> Any:
    if value in (None, "", "null", "NA"):
        return None

    if isinstance(value, str):
        stripped = value.strip()

        if stripped in ("", "null", "NA"):
            return None

        return stripped

    return value


def _to_float(value: Any) -> float | None:
    cleaned = _clean(value)

    if cleaned is None:
        return None

    return float(cleaned)


def get_pff_input_file() -> Path:
    configured = os.getenv(
        "PFF_POWER_RATINGS_INPUT_FILE",
        str(DEFAULT_INPUT_FILE),
    )

    path = Path(configured).expanduser()

    if not path.is_absolute():
        path = PROJECT_ROOT / path

    return path.resolve()


def parse_and_validate_pff_file(
    csv_path: Path | None = None,
) -> list[ParsedRating]:
    path = csv_path or get_pff_input_file()

    if not path.exists():
        raise PffPowerRatingsImportError(
            f"PFF input file not found: {path}"
        )

    if not path.is_file():
        raise PffPowerRatingsImportError(
            f"PFF input path is not a file: {path}"
        )

    lookup = get_team_lookup()
    parsed: list[ParsedRating] = []
    seen_codes: set[str] = set()
    seen_team_ids: set[int] = set()

    with path.open(
        newline="",
        encoding="utf-8-sig",
    ) as file_handle:
        reader = csv.DictReader(file_handle)

        if reader.fieldnames is None:
            raise PffPowerRatingsImportError(
                "CSV file does not contain a header row."
            )

        missing_columns = REQUIRED_COLUMNS - set(
            reader.fieldnames
        )

        if missing_columns:
            missing = ", ".join(
                sorted(missing_columns)
            )
            raise PffPowerRatingsImportError(
                f"Missing required CSV columns: {missing}"
            )

        for row_number, row in enumerate(
            reader,
            start=2,
        ):
            raw_team = row.get("Team")

            if raw_team is None or not raw_team.strip():
                raise PffPowerRatingsImportError(
                    f"Missing Team value on row {row_number}."
                )

            pff_code = raw_team.strip().upper()

            if pff_code in seen_codes:
                raise PffPowerRatingsImportError(
                    f"Duplicate PFF team code on row "
                    f"{row_number}: {pff_code}"
                )

            team_id = lookup.get(pff_code)

            if team_id is None:
                raise PffPowerRatingsImportError(
                    f"Missing team alias for PFF code: "
                    f"{pff_code}"
                )

            if team_id in seen_team_ids:
                raise PffPowerRatingsImportError(
                    f"Multiple CSV rows map to "
                    f"team_id {team_id}."
                )

            try:
                parsed.append(
                    ParsedRating(
                        team_id=team_id,
                        pff_team_code=pff_code,
                        point_spread_rating=_to_float(
                            row[
                                "Point Spread Rating Points"
                            ]
                        ),
                        qb_rating=_to_float(
                            row["Point Spread Rating QB"]
                        ),
                        sos_to_date=_to_float(
                            row[
                                "Strength of Schedule To Date"
                            ]
                        ),
                        sos_remaining=_to_float(
                            row[
                                "Strength of Schedule Remaining"
                            ]
                        ),
                        projected_wins=_to_float(
                            row["Projections Avg. Wins"]
                        ),
                        make_playoffs_pct=_to_float(
                            row[
                                "Projections Make Playoffs"
                            ]
                        ),
                        win_division_pct=_to_float(
                            row[
                                "Projections Win Division Title"
                            ]
                        ),
                        win_conference_pct=_to_float(
                            row[
                                "Projections Win Conf Champ"
                            ]
                        ),
                        win_super_bowl_pct=_to_float(
                            row[
                                "Projections Win Super Bowl"
                            ]
                        ),
                    )
                )
            except (TypeError, ValueError) as exc:
                raise PffPowerRatingsImportError(
                    f"Invalid numeric value on row "
                    f"{row_number}: {exc}"
                ) from exc

            seen_codes.add(pff_code)
            seen_team_ids.add(team_id)

    if len(parsed) != 32:
        raise PffPowerRatingsImportError(
            f"Expected 32 NFL teams, found {len(parsed)}."
        )

    return parsed


def validate_pff_power_ratings() -> dict[str, Any]:
    path = get_pff_input_file()
    rows = parse_and_validate_pff_file(path)

    ratings = [
        row.point_spread_rating
        for row in rows
        if row.point_spread_rating is not None
    ]

    return {
        "status": "valid",
        "teams_found": len(rows),
        "source_file": str(path),
        "minimum_point_spread_rating": (
            min(ratings) if ratings else None
        ),
        "maximum_point_spread_rating": (
            max(ratings) if ratings else None
        ),
    }


def import_pff_power_ratings(
    *,
    season: int,
    week: int,
    replace_existing: bool = False,
) -> dict[str, Any]:
    if season < 2000 or season > 2100:
        raise PffPowerRatingsImportError(
            "Season must be between 2000 and 2100."
        )

    if week < 1 or week > 22:
        raise PffPowerRatingsImportError(
            "Week must be between 1 and 22."
        )

    path = get_pff_input_file()
    rows = parse_and_validate_pff_file(path)

    conn = get_connection()

    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT COUNT(*)
                FROM ratings.pff_power_ratings
                WHERE season = %s
                  AND week = %s;
                """,
                (
                    season,
                    week,
                ),
            )

            existing_count = cur.fetchone()[0]

            if existing_count and not replace_existing:
                raise PffPowerRatingsImportError(
                    f"{season} Week {week} already contains "
                    f"{existing_count} power-rating rows."
                )

            if existing_count:
                cur.execute(
                    """
                    DELETE FROM ratings.pff_power_ratings
                    WHERE season = %s
                      AND week = %s;
                    """,
                    (
                        season,
                        week,
                    ),
                )

            for row in rows:
                cur.execute(
                    """
                    INSERT INTO ratings.pff_power_ratings (
                        season,
                        week,
                        team_id,
                        pff_team_code,
                        point_spread_rating,
                        qb_rating,
                        sos_to_date,
                        sos_remaining,
                        projected_wins,
                        make_playoffs_pct,
                        win_division_pct,
                        win_conference_pct,
                        win_super_bowl_pct,
                        source_file,
                        imported_at
                    )
                    VALUES (
                        %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, now()
                    );
                    """,
                    (
                        season,
                        week,
                        row.team_id,
                        row.pff_team_code,
                        row.point_spread_rating,
                        row.qb_rating,
                        row.sos_to_date,
                        row.sos_remaining,
                        row.projected_wins,
                        row.make_playoffs_pct,
                        row.win_division_pct,
                        row.win_conference_pct,
                        row.win_super_bowl_pct,
                        str(path),
                    ),
                )

        conn.commit()

    except Exception:
        conn.rollback()
        raise

    finally:
        conn.close()

    return {
        "status": "success",
        "season": season,
        "week": week,
        "teams_imported": len(rows),
        "replaced_existing": bool(existing_count),
        "source_file": str(path),
    }
