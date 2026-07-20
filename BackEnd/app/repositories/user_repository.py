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
            entry_is_active,
            contest_format_id,
            format_code,
            format_name
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
                "is_active": row["entry_is_active"],
                "contest_format_id": row["contest_format_id"],
                "format_code": row["format_code"],
                "format_name": row["format_name"]
            })
    return list(users.values())

def get_user_by_username(username):
    sql = "SELECT * FROM auth.users WHERE username = %s;"
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (username,))
            row = cur.fetchone()
            if row is None: return None
            columns = [desc[0] for desc in cur.description]
            return dict(zip(columns, row))

# --- New User CRUD Functions ---

def get_all_users(db):
    sql = "SELECT user_id, username, display_name, role, is_active FROM auth.users"
    with db.cursor() as cur:
        cur.execute(sql)
        columns = [desc[0] for desc in cur.description]
        return [dict(zip(columns, row)) for row in cur.fetchall()]

def create_user(db, username, display_name, role):
    sql = "INSERT INTO auth.users (username, display_name, role, is_active) VALUES (%s, %s, %s, true)"
    with db.cursor() as cur:
        cur.execute(sql, (username, display_name, role))
    db.commit()

def delete_user_by_id(db, user_id):
    sql = "DELETE FROM auth.users WHERE user_id = %s"
    with db.cursor() as cur:
        cur.execute(sql, (user_id,))
    db.commit()

def update_user_role(db, user_id, role):
    sql = "UPDATE auth.users SET role = %s WHERE user_id = %s"
    with db.cursor() as cur:
        cur.execute(sql, (role, user_id))
    db.commit()
