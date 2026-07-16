import csv
from app.db import get_connection

CSV_PATH = "../Input/nflverse/teams.csv"


def normalize_alias(value):
    return value.strip().upper()


def upsert_team(cur, row):
    cur.execute(
        """
        INSERT INTO reference.teams (
            nflverse_team_id,
            team_abbr,
            team_name,
            team_nick,
            conference,
            division
        )
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (team_abbr)
        DO UPDATE SET
            nflverse_team_id = EXCLUDED.nflverse_team_id,
            team_name = EXCLUDED.team_name,
            team_nick = EXCLUDED.team_nick,
            conference = EXCLUDED.conference,
            division = EXCLUDED.division
        RETURNING team_id;
        """,
        (
            row["team_id"],
            row["team_abbr"],
            row["team_name"],
            row["team_nick"],
            row["team_conf"],
            row["team_division"],
        ),
    )
    return cur.fetchone()[0]


def upsert_alias(cur, team_id, source_system, alias_value, alias_type):
    if not alias_value:
        return

    cur.execute(
        """
        INSERT INTO reference.team_aliases (
            team_id,
            source_system,
            alias_value,
            alias_normalized,
            alias_type
        )
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (source_system, alias_normalized)
        DO UPDATE SET
            team_id = EXCLUDED.team_id,
            alias_value = EXCLUDED.alias_value,
            alias_type = EXCLUDED.alias_type,
            is_active = TRUE;
        """,
        (
            team_id,
            source_system,
            alias_value,
            normalize_alias(alias_value),
            alias_type,
        ),
    )


def main():
    with open(CSV_PATH, newline="") as f:
        reader = csv.DictReader(f)

        with get_connection() as conn:
            with conn.cursor() as cur:
                for row in reader:
                    team_id = upsert_team(cur, row)

                    upsert_alias(cur, team_id, "NFLVERSE", row["team_abbr"], "ABBR")
                    upsert_alias(cur, team_id, "NFLVERSE", row["team_name"], "FULL_NAME")
                    upsert_alias(cur, team_id, "NFLVERSE", row["team_nick"], "NICKNAME")

            conn.commit()

    print("Imported NFLVerse teams and aliases.")


if __name__ == "__main__":
    main()
