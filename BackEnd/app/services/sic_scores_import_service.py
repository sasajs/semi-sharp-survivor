from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from app.db import get_connection
from app.repositories.team_repository import get_team_lookup


class SicScoresImportError(ValueError):
    pass


BACKEND_ROOT = Path(__file__).resolve().parents[2]
PROJECT_ROOT = BACKEND_ROOT.parent

DEFAULT_INPUT_FILE = (
    PROJECT_ROOT
    / "Input"
    / "sic"
    / "team_sic_scores.csv"
)

SOURCE_SYSTEM = "SPORTS_INJURY_CENTRAL"

REQUIRED_COLUMNS = {
    "season",
    "week",
    "team_abbr",
    "sic_score",
    "source_note",
}


@dataclass(frozen=True)
class ParsedSicScore:
    team_id: int
    team_abbr: str
    sic_score: float
    source_note: str


def _clean(value: Any) -> str | None:
    if value is None:
        return None

    cleaned = str(value).strip()

    if not cleaned or cleaned.lower() in {
        "null",
        "none",
        "na",
        "n/a",
    }:
        return None

    return cleaned


def _validate_season_week(
    season: int,
    week: int,
) -> None:
    if season < 2000 or season > 2100:
        raise SicScoresImportError(
            "Season must be between 2000 and 2100."
        )

    if week < 1 or week > 22:
        raise SicScoresImportError(
            "Week must be between 1 and 22."
        )


def _resolve_input_file(
    input_file: str | Path | None,
) -> Path:
    if input_file is None:
        path = DEFAULT_INPUT_FILE
    else:
        path = Path(input_file).expanduser()

        if not path.is_absolute():
            path = (BACKEND_ROOT / path).resolve()

    path = path.resolve()

    if not path.exists():
        raise SicScoresImportError(
            f"SIC input file was not found: {path}"
        )

    if not path.is_file():
        raise SicScoresImportError(
            f"SIC input path is not a file: {path}"
        )

    return path


def _parse_rows(
    *,
    season: int,
    week: int,
    input_file: str | Path | None = None,
) -> tuple[Path, list[ParsedSicScore]]:
    _validate_season_week(
        season=season,
        week=week,
    )

    path = _resolve_input_file(input_file)
    team_lookup = get_team_lookup()

    parsed_rows: list[ParsedSicScore] = []
    seen_team_ids: set[int] = set()

    try:
        file_handle = path.open(
            newline="",
            encoding="utf-8-sig",
        )
    except OSError as exc:
        raise SicScoresImportError(
            f"Unable to open SIC input file: {exc}"
        ) from exc

    with file_handle:
        reader = csv.DictReader(file_handle)

        if reader.fieldnames is None:
            raise SicScoresImportError(
                "SIC input file has no header row."
            )

        actual_columns = {
            column.strip()
            for column in reader.fieldnames
            if column
        }

        missing_columns = REQUIRED_COLUMNS - actual_columns

        if missing_columns:
            missing = ", ".join(sorted(missing_columns))

            raise SicScoresImportError(
                f"SIC input file is missing columns: {missing}"
            )

        for line_number, row in enumerate(
            reader,
            start=2,
        ):
            team_abbr = _clean(row.get("team_abbr"))

            if team_abbr is None:
                raise SicScoresImportError(
                    f"Line {line_number}: team_abbr is required."
                )

            team_abbr = team_abbr.upper()
            team_id = team_lookup.get(team_abbr)

            if team_id is None:
                raise SicScoresImportError(
                    f"Line {line_number}: no team alias exists "
                    f"for SIC code '{team_abbr}'."
                )

            try:
                row_season = int(
                    _clean(row.get("season")) or ""
                )
                row_week = int(
                    _clean(row.get("week")) or ""
                )
            except ValueError as exc:
                raise SicScoresImportError(
                    f"Line {line_number}: season and week "
                    "must be integers."
                ) from exc

            if row_season != season:
                raise SicScoresImportError(
                    f"Line {line_number}: CSV season "
                    f"{row_season} does not match requested "
                    f"season {season}."
                )

            if row_week != week:
                raise SicScoresImportError(
                    f"Line {line_number}: CSV week "
                    f"{row_week} does not match requested "
                    f"week {week}."
                )

            try:
                sic_score = float(
                    _clean(row.get("sic_score")) or ""
                )
            except ValueError as exc:
                raise SicScoresImportError(
                    f"Line {line_number}: sic_score must "
                    "be numeric."
                ) from exc

            if sic_score < 0 or sic_score > 100:
                raise SicScoresImportError(
                    f"Line {line_number}: sic_score must "
                    "be between 0 and 100."
                )

            if team_id in seen_team_ids:
                raise SicScoresImportError(
                    f"Line {line_number}: duplicate team "
                    f"'{team_abbr}'."
                )

            source_note = (
                _clean(row.get("source_note"))
                or "Sports Injury Central"
            )

            parsed_rows.append(
                ParsedSicScore(
                    team_id=team_id,
                    team_abbr=team_abbr,
                    sic_score=sic_score,
                    source_note=source_note,
                )
            )

            seen_team_ids.add(team_id)

    if len(parsed_rows) != 32:
        raise SicScoresImportError(
            "SIC input must contain exactly 32 unique teams; "
            f"found {len(parsed_rows)}."
        )

    return path, parsed_rows


def validate_sic_scores(
    *,
    season: int | None = None,
    week: int | None = None,
    input_file: str | Path | None = None,
) -> dict[str, Any]:
    path = _resolve_input_file(input_file)

    if season is None or week is None:
        try:
            with path.open(
                newline="",
                encoding="utf-8-sig",
            ) as file_handle:
                reader = csv.DictReader(file_handle)
                first_row = next(reader, None)
        except OSError as exc:
            raise SicScoresImportError(
                f"Unable to read SIC input file: {exc}"
            ) from exc

        if first_row is None:
            raise SicScoresImportError(
                "SIC input file contains no data rows."
            )

        try:
            detected_season = int(
                _clean(first_row.get("season")) or ""
            )
            detected_week = int(
                _clean(first_row.get("week")) or ""
            )
        except ValueError as exc:
            raise SicScoresImportError(
                "Unable to detect a valid season and week "
                "from the SIC input file."
            ) from exc

        season = detected_season
        week = detected_week

    path, rows = _parse_rows(
        season=season,
        week=week,
        input_file=path,
    )

    scores = [
        row.sic_score
        for row in rows
    ]

    return {
        "status": "valid",
        "season": season,
        "week": week,
        "teams_found": len(rows),
        "minimum_sic_score": min(scores),
        "maximum_sic_score": max(scores),
        "source_system": SOURCE_SYSTEM,
        "source_file": str(path),
    }


def import_sic_scores(
    *,
    season: int,
    week: int,
    replace_existing: bool = False,
    input_file: str | Path | None = None,
) -> dict[str, Any]:
    path, rows = _parse_rows(
        season=season,
        week=week,
        input_file=input_file,
    )

    conn = get_connection()

    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT COUNT(*)
                FROM injuries.team_sic_scores
                WHERE season = %s
                  AND week = %s
                  AND source_system = %s;
                """,
                (
                    season,
                    week,
                    SOURCE_SYSTEM,
                ),
            )

            existing_count = int(cur.fetchone()[0])

            if existing_count and not replace_existing:
                raise SicScoresImportError(
                    f"{season} Week {week} already contains "
                    f"{existing_count} SIC score rows."
                )

            if existing_count:
                cur.execute(
                    """
                    DELETE FROM injuries.team_sic_scores
                    WHERE season = %s
                      AND week = %s
                      AND source_system = %s;
                    """,
                    (
                        season,
                        week,
                        SOURCE_SYSTEM,
                    ),
                )

            for row in rows:
                cur.execute(
                    """
                    INSERT INTO injuries.team_sic_scores (
                        season,
                        week,
                        team_id,
                        sic_score,
                        source_system,
                        source_note,
                        imported_at
                    )
                    VALUES (
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        now()
                    );
                    """,
                    (
                        season,
                        week,
                        row.team_id,
                        row.sic_score,
                        SOURCE_SYSTEM,
                        row.source_note,
                    ),
                )

        conn.commit()

    except SicScoresImportError:
        conn.rollback()
        raise

    except Exception as exc:
        conn.rollback()

        raise SicScoresImportError(
            f"SIC import failed: {exc}"
        ) from exc

    finally:
        conn.close()

    return {
        "status": "success",
        "season": season,
        "week": week,
        "teams_imported": len(rows),
        "replaced_existing": bool(existing_count),
        "source_system": SOURCE_SYSTEM,
        "source_file": str(path),
    }
