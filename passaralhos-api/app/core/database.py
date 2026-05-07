import json
import os
from typing import Optional

DB_PATH = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "..", "data.json")
)


def _load() -> dict:
    if not os.path.exists(DB_PATH):
        return {"users": []}

    with open(DB_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def _save(data: dict) -> None:
    with open(DB_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2, default=str)


def get_user_by_email(email: str) -> Optional[dict]:
    data = _load()

    return next(
        (
            user
            for user in data.get("users", [])
            if user.get("email", "").lower() == email.lower()
        ),
        None,
    )


def get_user_by_id(user_id: str) -> Optional[dict]:
    data = _load()

    return next(
        (
            user
            for user in data.get("users", [])
            if user.get("id") == user_id
        ),
        None,
    )


def create_user(user: dict) -> dict:
    data = _load()

    if "users" not in data:
        data["users"] = []

    data["users"].append(user)
    _save(data)

    return user


def update_user(user_id: str, fields: dict) -> Optional[dict]:
    data = _load()

    for user in data.get("users", []):
        if user.get("id") == user_id:
            user.update(fields)
            _save(data)
            return user

    return None


def replace_user(user_id: str, updated_user: dict) -> Optional[dict]:
    data = _load()

    for index, user in enumerate(data.get("users", [])):
        if user.get("id") == user_id:
            data["users"][index] = updated_user
            _save(data)
            return updated_user

    return None


def delete_user(user_id: str) -> bool:
    data = _load()

    users = data.get("users", [])
    new_users = [user for user in users if user.get("id") != user_id]

    if len(new_users) == len(users):
      return False

    data["users"] = new_users
    _save(data)

    return True