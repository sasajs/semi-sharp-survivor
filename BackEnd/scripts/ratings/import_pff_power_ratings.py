import argparse
import csv
from pathlib import Path

from app.db import get_connection
from app.repositories.team_repository import get_team_lookup


def clean(value):
    if value in (None, "", "null", "NA"):
        return None
    return value


def to_float(value):
    value = clean(value)
    return float(value) if value is not None else None


def parse_args():
    parser = argparse.ArgumentParser(description="Import PFF power ratings CSV.")
    parser.add_argument("--season", type=int, required=True)
    parser.add_argument("--week", type=int, required=True)
    parser.add_argument("--file", required=True)
    return parser.parse_args()


def main():
    args = parse_args()
    csv_path = Path(args.file)

    if not csv_path.exists():
        raise FileNotFoundError(f"File not found: {csv_path}")

    lookup = get_team_lookup()
    imported = 0

    with csv_path.open(newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)

        with get_connection() as conn:
            with conn.cursor() as cur:
                for row in reader:
                    pff_code = row["Team"].strip().upper()
                    team_id = lookup.get(pff_code)

                    if team_id is None:
                        raise ValueError(f"Missing team alias for PFF code: {pff_code}")

                    cur.execute(
                        """
                        INSERT INTO ratings.pff_power_ratings (
                            season, week, team_id, pff_team_code,
                            point_spread_rating, qb_rating,
                            sos_to_date, sos_remaining,
                            projected_wins, make_playoffs_pct,
                            win_division_pct, win_conference_pct,
                            win_super_bowl_pct, source_file, imported_at
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, now())
                        ON CONFLICT (season, week, team_id)
                        DO UPDATE SET
                            pff_team_code = EXCLUDED.pff_team_code,
                            point_spread_rating = EXCLUDED.point_spread_rating,
                            qb_rating = EXCLUDED.qb_rating,
                            sos_to_date = EXCLUDED.sos_to_date,
                            sos_remaining = EXCLUDED.sos_remaining,
                            projected_wins = EXCLUDED.projected_wins,
                            make_playoffs_pct = EXCLUDED.make_playoffs_pct,
                            win_division_pct = EXCLUDED.win_division_pct,
                            win_conference_pct = EXCLUDED.win_conference_pct,
                            win_super_bowl_pct = EXCLUDED.win_super_bowl_pct,
                            source_file = EXCLUDED.source_file,
                            imported_at = now();
                        """,
                        (
                            args.season,
                            args.week,
                            team_id,
                            pff_code,
                            to_float(row["Point Spread Rating Points"]),
                            to_float(row["Point Spread Rating QB"]),
                            to_float(row["Strength of Schedule To Date"]),
                            to_float(row["Strength of Schedule Remaining"]),
                            to_float(row["Projections Avg. Wins"]),
                            to_float(row["Projections Make Playoffs"]),
                            to_float(row["Projections Win Division Title"]),
                            to_float(row["Projections Win Conf Champ"]),
                            to_float(row["Projections Win Super Bowl"]),
                            str(csv_path),
                        ),
                    )

                    imported += 1

            conn.commit()

    print(f"Imported PFF power ratings: {imported}")
    print(f"Season: {args.season}")
    print(f"Week: {args.week}")
    print(f"File: {csv_path}")


if __name__ == "__main__":
    main()
