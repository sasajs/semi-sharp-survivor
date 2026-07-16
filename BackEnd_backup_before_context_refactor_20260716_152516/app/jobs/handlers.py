import csv
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[2]
PROJECT_DIR = BACKEND_DIR.parent
INPUT_DIR = PROJECT_DIR / "Input"


def health_check(payload):
    return {
        "status": "ok",
        "message": payload.get(
            "message",
            "SemiSharp worker healthy"
        )
    }


def build_features(payload):
    season = payload.get("season")
    week = payload.get("week")

    if season is None or week is None:
        raise ValueError(
            "build_features requires season and week"
        )

    return {
        "status": "ok",
        "job": "build_features",
        "season": season,
        "week": week,
        "message": "Feature build placeholder complete"
    }


def _run_command(command, cwd):
    completed = subprocess.run(
        command,
        cwd=cwd,
        capture_output=True,
        text=True,
        check=False,
    )

    if completed.returncode != 0:
        raise RuntimeError(
            "Command failed.\n"
            f"Command: {' '.join(str(part) for part in command)}\n"
            f"Exit code: {completed.returncode}\n"
            f"STDOUT:\n{completed.stdout}\n"
            f"STDERR:\n{completed.stderr}"
        )

    return {
        "stdout": completed.stdout.strip(),
        "stderr": completed.stderr.strip(),
        "return_code": completed.returncode,
    }


def _validate_schedule_csv(csv_path, expected_season):
    if not csv_path.exists():
        raise FileNotFoundError(
            f"NFLVerse schedule export was not created: {csv_path}"
        )

    if csv_path.stat().st_size == 0:
        raise ValueError(
            f"NFLVerse schedule export is empty: {csv_path}"
        )

    required_columns = {
        "game_id",
        "season",
        "week",
        "away_team",
        "home_team",
    }

    row_count = 0
    game_ids = set()
    season_values = set()

    with csv_path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)

        actual_columns = set(reader.fieldnames or [])
        missing_columns = required_columns - actual_columns

        if missing_columns:
            raise ValueError(
                "NFLVerse schedule export is missing required columns: "
                + ", ".join(sorted(missing_columns))
            )

        for row in reader:
            row_count += 1

            game_id = (row.get("game_id") or "").strip()
            season_value = (row.get("season") or "").strip()

            if not game_id:
                raise ValueError(
                    f"Schedule row {row_count} has no game_id."
                )

            if game_id in game_ids:
                raise ValueError(
                    f"Duplicate game_id in schedule export: {game_id}"
                )

            game_ids.add(game_id)
            season_values.add(season_value)

    if row_count == 0:
        raise ValueError(
            "NFLVerse returned zero schedule records."
        )

    if season_values != {str(expected_season)}:
        raise ValueError(
            "Schedule export contains unexpected season values: "
            f"{sorted(season_values)}"
        )

    return {
        "row_count": row_count,
        "unique_game_count": len(game_ids),
        "season_values": sorted(season_values),
        "file_size_bytes": csv_path.stat().st_size,
    }


def nflverse_schedule_refresh(payload):
    season = payload.get("season")

    if season is None:
        raise ValueError(
            "nflverse_schedule_refresh requires season"
        )

    try:
        season = int(season)
    except (TypeError, ValueError) as exc:
        raise ValueError(
            "season must be an integer"
        ) from exc

    if season < 1999 or season > 2100:
        raise ValueError(
            "season must be between 1999 and 2100"
        )

    output_path = (
        INPUT_DIR
        / "nflverse"
        / f"schedule_{season}.csv"
    )

    output_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    export_result = _run_command(
        [
            "/usr/bin/Rscript",
            "r/export_nflverse_schedule.R",
            str(season),
            str(output_path),
        ],
        cwd=BACKEND_DIR,
    )

    validation = _validate_schedule_csv(
        output_path,
        expected_season=season,
    )

    import_result = _run_command(
        [
            sys.executable,
            "-m",
            "scripts.schedule.import_schedule",
            "--csv",
            str(output_path),
        ],
        cwd=BACKEND_DIR,
    )

    return {
        "status": "ok",
        "job": "nflverse_schedule_refresh",
        "season": season,
        "source": "NFLVERSE",
        "output_file": str(output_path),
        "rows_validated": validation["row_count"],
        "unique_games": validation["unique_game_count"],
        "file_size_bytes": validation["file_size_bytes"],
        "export_stdout": export_result["stdout"],
        "import_stdout": import_result["stdout"],
        "completed_at": datetime.now(
            timezone.utc
        ).isoformat(),
    }
