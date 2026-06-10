import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.database import (
    get_user_by_email,
    get_user_by_id,
    create_user,
    update_user,
)
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    RefreshRequest,
    AuthResponse,
    TokenResponse,
    UserPublic,
    ProfileUpdateRequest,
    BirdRecordRequest,
    BirdRecordResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])
bearer = HTTPBearer()


def calculate_level(xp: int) -> int:
    return max(1, (xp // 1000) + 1)


def get_user_records(user: dict) -> list:
    return user.get("bird_records", [])


def has_species_already(user: dict, scientific_name: str) -> bool:
    return any(
        record.get("scientific_name", "").lower() == scientific_name.lower()
        for record in get_user_records(user)
    )


def _to_public(user: dict) -> UserPublic:
    return UserPublic(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        xp=user.get("xp", 0),
        level=user.get("level", 1),
        species_count=user.get("species_count", 0),
        recordings_count=user.get("recordings_count", 0),
        rare_count=user.get("rare_count", 0),
        title=user.get("title", "OBSERVADOR INICIANTE"),
        bio=user.get("bio", ""),
        location=user.get("location", ""),
        username=user.get("username", ""),
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
) -> dict:
    user_id = decode_token(credentials.credentials, expected_type="access")
    user = get_user_by_id(user_id)

    if not user or not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado.",
        )

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
        "username": "",
        "title": "OBSERVADOR INICIANTE",
        "bio": "",
        "location": "",
        "xp": 0,
        "level": 1,
        "species_count": 0,
        "recordings_count": 0,
        "rare_count": 0,
        "bird_records": [],
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": None,
        "deleted_at": None,
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

    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Usuário desativado.")

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

@router.get("/me/records")
def list_bird_records(current_user: dict = Depends(get_current_user)):
    records = current_user.get("bird_records", [])

    return {
        "records": records,
        "total": len(records),
    }


@router.put("/me", response_model=UserPublic)
def update_profile(
    data: ProfileUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
    payload = data.model_dump(exclude_unset=True)

    allowed_fields = {
        "name",
        "username",
        "bio",
        "location",
    }

    updates = {
        key: value
        for key, value in payload.items()
        if key in allowed_fields and value is not None
    }

    updates["updated_at"] = datetime.now(timezone.utc).isoformat()

    updated_user = update_user(current_user["id"], updates)

    if not updated_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    return _to_public(updated_user)


@router.delete("/me", status_code=204)
def delete_profile(current_user: dict = Depends(get_current_user)):
    updated_user = update_user(
        current_user["id"],
        {
            "is_active": False,
            "deleted_at": datetime.now(timezone.utc).isoformat(),
        },
    )

    if not updated_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    return None


@router.post("/me/records", response_model=BirdRecordResponse, status_code=201)
def create_bird_record(
    data: BirdRecordRequest,
    current_user: dict = Depends(get_current_user),
):
    records = get_user_records(current_user)

    is_new_species = not has_species_already(
        current_user,
        data.scientific_name,
    )

    xp_gained = 100 if is_new_species else 40

    new_record = {
        "id": str(uuid.uuid4()),
        "common_name": data.common_name,
        "scientific_name": data.scientific_name,
        "confidence": data.confidence,
        "audio_url": data.audio_url,
        "location": data.location,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    records.append(new_record)

    updates = {
        "bird_records": records,
        "recordings_count": current_user.get("recordings_count", 0) + 1,
        "xp": current_user.get("xp", 0) + xp_gained,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    updates["level"] = calculate_level(updates["xp"])

    if is_new_species:
        updates["species_count"] = current_user.get("species_count", 0) + 1
    else:
        updates["species_count"] = current_user.get("species_count", 0)

    updated_user = update_user(current_user["id"], updates)

    if not updated_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    return BirdRecordResponse(
        message="Registro criado com sucesso.",
        xp_gained=xp_gained,
        level=updated_user.get("level", 1),
        xp=updated_user.get("xp", 0),
        species_count=updated_user.get("species_count", 0),
        recordings_count=updated_user.get("recordings_count", 0),
        is_new_species=is_new_species,
    )


@router.post("/logout", status_code=204)
def logout(current_user: dict = Depends(get_current_user)):
    return None