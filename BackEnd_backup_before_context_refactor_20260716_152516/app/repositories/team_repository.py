from app.db import get_connection


def get_team_lookup():
    sql = """
        SELECT
            alias_normalized,
            team_id
        FROM reference.team_lookup
    """

    lookup = {}

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)

            for alias, team_id in cur.fetchall():
                lookup[alias] = team_id

    return lookup
