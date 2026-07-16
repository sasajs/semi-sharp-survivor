import argparse
import json
from pathlib import Path

from app.db import get_connection
from app.repositories.team_repository import get_team_lookup


def parse_args():
    parser = argparse.ArgumentParser(description="Import Odds API spread snapshot into Postgres.")
    parser.add_argument("--season", type=int, required=True)
    parser.add_argument("--week", type=int, required=True)
    parser.add_argument("--file", required=True)
    return parser.parse_args()


def normalize(value):
    return value.strip().upper()


def main():
    args = parse_args()
    path = Path(args.file)

    if not path.exists():
        raise FileNotFoundError(path)

    data = json.loads(path.read_text())
    team_lookup = get_team_lookup()

    imported_events = 0
    imported_books = 0
    imported_spreads = 0

    with get_connection() as conn:
        with conn.cursor() as cur:
            for event in data:
                home_name = event["home_team"]
                away_name = event["away_team"]

                home_team_id = team_lookup.get(normalize(home_name))
                away_team_id = team_lookup.get(normalize(away_name))

                # Try to match to SemiSharp schedule by team IDs and season/week.
                game_id = None
                if home_team_id and away_team_id:
                    cur.execute("""
                        SELECT game_id, week
                        FROM schedule.games
                        WHERE season = %s
                          AND home_team_id = %s
                          AND away_team_id = %s
                          AND gameday = (%s::timestamptz AT TIME ZONE 'America/New_York')::date
                        LIMIT 1;
                    """, (args.season, home_team_id, away_team_id, event["commence_time"]))
                    row = cur.fetchone()
                    if row:
                        game_id = row[0]
                        event_week = row[1]
                    else:
                        event_week = args.week

                cur.execute("""
                    INSERT INTO market.events (
                        odds_api_event_id,
                        game_id,
                        season,
                        week,
                        home_team_id,
                        away_team_id,
                        home_team_name,
                        away_team_name,
                        commence_time
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (odds_api_event_id)
                    DO UPDATE SET
                        game_id = EXCLUDED.game_id,
                        season = EXCLUDED.season,
                        week = EXCLUDED.week,
                        home_team_id = EXCLUDED.home_team_id,
                        away_team_id = EXCLUDED.away_team_id,
                        home_team_name = EXCLUDED.home_team_name,
                        away_team_name = EXCLUDED.away_team_name,
                        commence_time = EXCLUDED.commence_time
                    RETURNING market_event_id;
                """, (
                    event["id"],
                    game_id,
                    args.season,
                    args.week,
                    home_team_id,
                    away_team_id,
                    home_name,
                    away_name,
                    event["commence_time"],
                ))
                market_event_id = cur.fetchone()[0]
                imported_events += 1

                for book in event.get("bookmakers", []):
                    cur.execute("""
                        INSERT INTO market.bookmakers (
                            bookmaker_key,
                            bookmaker_title
                        )
                        VALUES (%s, %s)
                        ON CONFLICT (bookmaker_key)
                        DO UPDATE SET
                            bookmaker_title = EXCLUDED.bookmaker_title,
                            is_active = TRUE;
                    """, (book["key"], book["title"]))
                    imported_books += 1

                    for market in book.get("markets", []):
                        if market.get("key") != "spreads":
                            continue

                        pulled_at = market.get("last_update") or book.get("last_update")

                        for outcome in market.get("outcomes", []):
                            team_name = outcome["name"]
                            team_id = team_lookup.get(normalize(team_name))

                            team_abbr = None
                            if team_id:
                                cur.execute("""
                                    SELECT team_abbr
                                    FROM reference.teams
                                    WHERE team_id = %s;
                                """, (team_id,))
                                team_abbr = cur.fetchone()[0]

                            cur.execute("""
                                INSERT INTO market.spreads (
                                    market_event_id,
                                    bookmaker_key,
                                    team_id,
                                    team_name,
                                    team_abbr,
                                    spread_points,
                                    price,
                                    last_update,
                                    pulled_at
                                )
                                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
                            """, (
                                market_event_id,
                                book["key"],
                                team_id,
                                team_name,
                                team_abbr,
                                outcome["point"],
                                outcome.get("price"),
                                market.get("last_update"),
                                pulled_at,
                            ))
                            imported_spreads += 1

        conn.commit()

    print(f"Imported events: {imported_events}")
    print(f"Processed bookmakers: {imported_books}")
    print(f"Imported spreads: {imported_spreads}")


if __name__ == "__main__":
    main()
