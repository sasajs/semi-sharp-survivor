from __future__ import annotations

import argparse
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[2]

if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.services.sic_scores_import_service import (
    SicScoresImportError,
    import_sic_scores,
)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Import the current Sports Injury Central CSV."
    )
    parser.add_argument(
        "--season",
        type=int,
        required=True,
    )
    parser.add_argument(
        "--week",
        type=int,
        required=True,
        choices=range(1, 23),
        metavar="1-22",
    )
    parser.add_argument(
        "--replace-existing",
        action="store_true",
        help="Replace an existing season/week SIC import.",
    )

    return parser.parse_args()


def main():
    args = parse_args()

    try:
        result = import_sic_scores(
            season=args.season,
            week=args.week,
            replace_existing=args.replace_existing,
        )
    except SicScoresImportError as exc:
        raise SystemExit(
            f"Import failed: {exc}"
        ) from exc

    print(
        f"Imported SIC scores: "
        f"{result['teams_imported']}"
    )
    print(f"Season: {result['season']}")
    print(f"Week: {result['week']}")
    print(f"File: {result['source_file']}")
    print(
        f"Replaced existing: "
        f"{result['replaced_existing']}"
    )


if __name__ == "__main__":
    main()
