from app.db import get_connection


def get_user_entries():
    sql = """
        SELECT
            user_id,
            username,
            display_name,
            role,
            entry_id,
            survivor_sweat_name,
            entry_label,
            entry_is_active
        FROM survivor.user_entries
        ORDER BY user_id, entry_id;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            columns = [desc[0] for desc in cur.description]
            rows = [dict(zip(columns, row)) for row in cur.fetchall()]

    users = {}

    for row in rows:
        user_id = row["user_id"]

        if user_id not in users:
            users[user_id] = {
                "user_id": row["user_id"],
                "username": row["username"],
                "display_name": row["display_name"],
                "role": row["role"],
                "entries": []
            }

        if row["entry_id"] is not None:
            users[user_id]["entries"].append({
                "entry_id": row["entry_id"],
                "survivor_sweat_name": row["survivor_sweat_name"],
                "entry_label": row["entry_label"],
                "is_active": row["entry_is_active"]
            })

    return list(users.values())


def get_user_by_username(username):
    sql = """
        SELECT
            user_id,
            username,
            display_name,
            role,
            password_hash,
            is_active
        FROM auth.users
        WHERE username = %s;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (username,))
            row = cur.fetchone()

            if row is None:
                return None

            columns = [desc[0] for desc in cur.description]
            return dict(zip(columns, row))
