import csv
from datetime import date
from app.db import get_connection
from app.repositories.team_repository import get_team_lookup

CSV_PATH = "../Input/nflverse/schedule_2026.csv"


def clean(value):
    if value in (None, "", "NA"):
        return None
    return value


def to_int(value):
    value = clean(value)
    return int(value) if value is not None else None


def to_float(value):
    value = clean(value)
    return float(value) if value is not None else None


def to_bool(value):
    value = clean(value)
    if value is None:
        return None
    return str(value).strip() in ("1", "true", "TRUE", "t", "T")


def is_thanksgiving(gameday):
    return gameday is not None and gameday[5:] == "11-26"


def is_christmas(gameday):
    return gameday is not None and gameday[5:] == "12-25"


def main():
    team_lookup = get_team_lookup()
    imported = 0

    with open(CSV_PATH, newline="") as f:
        reader = csv.DictReader(f)

        with get_connection() as conn:
            with conn.cursor() as cur:
                for row in reader:
                    away_alias = row["away_team"].strip().upper()
                    home_alias = row["home_team"].strip().upper()

                    away_team_id = team_lookup.get(away_alias)
                    home_team_id = team_lookup.get(home_alias)

                    if away_team_id is None or home_team_id is None:
                        raise ValueError(
                            f"Could not resolve team alias: "
                            f"away={away_alias}, home={home_alias}, game_id={row['game_id']}"
                        )

                    cur.execute(
                        """
                        INSERT INTO schedule.games (
                            game_id,
                            season,
                            week,
                            game_type,
                            gameday,
                            weekday,
                            gametime,
                            away_team_id,
                            home_team_id,
                            away_team_abbr,
                            home_team_abbr,
                            away_score,
                            home_score,
                            location,
                            result,
                            total,
                            overtime,
                            away_rest,
                            home_rest,
                            spread_line,
                            total_line,
                            div_game,
                            roof,
                            surface,
                            temp,
                            wind,
                            stadium_id,
                            stadium,
                            away_coach,
                            home_coach,
                            is_thanksgiving,
                            is_christmas,
                            source_system,
                            source_loaded_at
                        )
                        VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                            %s, %s, 'NFLVERSE', now()
                        )
                        ON CONFLICT (game_id)
                        DO UPDATE SET
                            season = EXCLUDED.season,
                            week = EXCLUDED.week,
                            game_type = EXCLUDED.game_type,
                            gameday = EXCLUDED.gameday,
                            weekday = EXCLUDED.weekday,
                            gametime = EXCLUDED.gametime,
                            away_team_id = EXCLUDED.away_team_id,
                            home_team_id = EXCLUDED.home_team_id,
                            away_team_abbr = EXCLUDED.away_team_abbr,
                            home_team_abbr = EXCLUDED.home_team_abbr,
                            away_score = EXCLUDED.away_score,
                            home_score = EXCLUDED.home_score,
                            location = EXCLUDED.location,
                            result = EXCLUDED.result,
                            total = EXCLUDED.total,
                            overtime = EXCLUDED.overtime,
                            away_rest = EXCLUDED.away_rest,
                            home_rest = EXCLUDED.home_rest,
                            spread_line = EXCLUDED.spread_line,
                            total_line = EXCLUDED.total_line,
                            div_game = EXCLUDED.div_game,
                            roof = EXCLUDED.roof,
                            surface = EXCLUDED.surface,
                            temp = EXCLUDED.temp,
                            wind = EXCLUDED.wind,
                            stadium_id = EXCLUDED.stadium_id,
                            stadium = EXCLUDED.stadium,
                            away_coach = EXCLUDED.away_coach,
                            home_coach = EXCLUDED.home_coach,
                            is_thanksgiving = EXCLUDED.is_thanksgiving,
                            is_christmas = EXCLUDED.is_christmas,
                            source_system = EXCLUDED.source_system,
                            source_loaded_at = now();
                        """,
                        (
                            row["game_id"],
                            to_int(row["season"]),
                            to_int(row["week"]),
                            row["game_type"],
                            clean(row["gameday"]),
                            clean(row["weekday"]),
                            clean(row["gametime"]),
                            away_team_id,
                            home_team_id,
                            away_alias,
                            home_alias,
                            to_int(row["away_score"]),
                            to_int(row["home_score"]),
                            clean(row["location"]),
                            to_int(row["result"]),
                            to_float(row["total"]),
                            to_bool(row["overtime"]),
                            to_int(row["away_rest"]),
                            to_int(row["home_rest"]),
                            to_float(row["spread_line"]),
                            to_float(row["total_line"]),
                            to_bool(row["div_game"]),
                            clean(row["roof"]),
                            clean(row["surface"]),
                            to_int(row["temp"]),
                            to_int(row["wind"]),
                            clean(row["stadium_id"]),
                            clean(row["stadium"]),
                            clean(row["away_coach"]),
                            clean(row["home_coach"]),
                            is_thanksgiving(clean(row["gameday"])),
                            is_christmas(clean(row["gameday"])),
                        ),
                    )

                    imported += 1

            conn.commit()

    print(f"Imported schedule games: {imported}")


if __name__ == "__main__":
    main()
