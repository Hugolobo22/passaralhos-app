import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.database import get_user_by_email, get_user_by_id, create_user
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.schemas.auth import RegisterRequest, LoginRequest, RefreshRequest, AuthResponse, TokenResponse, UserPublic

router = APIRouter(prefix="/auth", tags=["auth"])
bearer = HTTPBearer()


def _to_public(user: dict) -> UserPublic:
    return UserPublic(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        xp=user.get("xp", 0),
        level=user.get("level", 1),
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
) -> dict:
    user_id = decode_token(credentials.credentials, expected_type="access")
    user = get_user_by_id(user_id)
    if not user or not user.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário não encontrado.")
    return user


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(data: RegisterRequest):
    if get_user_by_email(data.email):
        raise HTTPException(status_code=409, detail="Este e-mail já está em uso.")

    user = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "email": data.email,
        "password_hash": hash_password(data.password),
        "xp": 0,
        "level": 1,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    create_user(user)

    return AuthResponse(
        user=_to_public(user),
        access_token=create_access_token(user["id"]),
        refresh_token=create_refresh_token(user["id"]),
    )


@router.post("/login", response_model=AuthResponse)
def login(data: LoginRequest):
    user = get_user_by_email(data.email)
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos.")

    return AuthResponse(
        user=_to_public(user),
        access_token=create_access_token(user["id"]),
        refresh_token=create_refresh_token(user["id"]),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh(data: RefreshRequest):
    user_id = decode_token(data.refresh_token, expected_type="refresh")
    user = get_user_by_id(user_id)
    if not user or not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Usuário não encontrado.")

    return TokenResponse(
        access_token=create_access_token(user["id"]),
        refresh_token=create_refresh_token(user["id"]),
    )


@router.get("/me", response_model=UserPublic)
def me(current_user: dict = Depends(get_current_user)):
    return _to_public(current_user)


@router.post("/logout", status_code=204)
def logout(current_user: dict = Depends(get_current_user)):
    return None