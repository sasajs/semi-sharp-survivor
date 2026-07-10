import csv
from pathlib import Path

from app.db import get_connection
from app.repositories.team_repository import get_team_lookup

CSV_PATH = Path("../Input/sic/team_sic_scores.csv")


def main():
    lookup = get_team_lookup()
    imported = 0

    with CSV_PATH.open(newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)

        with get_connection() as conn:
            with conn.cursor() as cur:
                for row in reader:
                    team_abbr = row["team_abbr"].strip().upper()
                    team_id = lookup.get(team_abbr)

                    if team_id is None:
                        raise ValueError(f"Missing team alias: {team_abbr}")

                    cur.execute("""
                        INSERT INTO injuries.team_sic_scores (
                            season,
                            week,
                            team_id,
                            sic_score,
                            source_note
                        )
                        VALUES (%s, %s, %s, %s, %s)
                        ON CONFLICT (season, week, team_id, source_system)
                        DO UPDATE SET
                            sic_score = EXCLUDED.sic_score,
                            source_note = EXCLUDED.source_note,
                            imported_at = now();
                    """, (
                        int(row["season"]),
                        int(row["week"]),
                        team_id,
                        float(row["sic_score"]),
                        row.get("source_note") or "Sports Injury Central"
                    ))

                    imported += 1

            conn.commit()

    print(f"Imported SIC scores: {imported}")


if __name__ == "__main__":
    main()
