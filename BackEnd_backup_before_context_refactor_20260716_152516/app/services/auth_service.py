import bcrypt

from app.repositories.user_repository import get_user_by_username, get_user_entries


def authenticate_user(username, password):
    user = get_user_by_username(username)

    if user is None:
        return None

    if not user["is_active"]:
        return None

    if user["password_hash"] is None:
        return None

    password_valid = bcrypt.checkpw(
        password.encode(),
        user["password_hash"].encode()
    )

    if not password_valid:
        return None

    users = get_user_entries()

    entries = []

    for profile in users:
        if profile["user_id"] == user["user_id"]:
            entries = profile["entries"]
            break

    return {
        "user_id": user["user_id"],
        "username": user["username"],
        "display_name": user["display_name"],
        "role": user["role"],
        "entries": entries
    }
