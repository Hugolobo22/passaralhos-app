import json
import os
from typing import Optional

# Arquivo JSON criado automaticamente na raiz do passaralhos-api
DB_PATH = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "..", "data.json")
)


def _load() -> dict:
    """Lê o arquivo JSON. Se não existir, retorna estrutura vazia."""
    if not os.path.exists(DB_PATH):
        return {"users": []}
    with open(DB_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def _save(data: dict) -> None:
    """Grava o dicionário no arquivo JSON com indentação legível."""
    with open(DB_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2, default=str)


# ─── Operações de usuário ─────────────────────────────────────

def get_user_by_email(email: str) -> Optional[dict]:
    data = _load()
    return next((u for u in data["users"] if u["email"] == email), None)


def get_user_by_id(user_id: str) -> Optional[dict]:
    data = _load()
    return next((u for u in data["users"] if u["id"] == user_id), None)


def create_user(user: dict) -> dict:
    data = _load()
    data["users"].append(user)
    _save(data)
    return user


def update_user(user_id: str, fields: dict) -> Optional[dict]:
    data = _load()
    for u in data["users"]:
        if u["id"] == user_id:
            u.update(fields)
            _save(data)
            return u
    return None