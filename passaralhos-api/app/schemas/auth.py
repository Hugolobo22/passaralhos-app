from pydantic import BaseModel, EmailStr
from typing import Optional
from pydantic import BaseModel

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class UserPublic(BaseModel):
    id: str
    name: str
    email: str

    xp: int
    level: int

    species_count: int
    recordings_count: int
    rare_count: int

    title: str
    bio: str
    location: str
    username: str

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    user: UserPublic
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None


class BirdRecordRequest(BaseModel):
    common_name: str
    scientific_name: str
    confidence: float = 0
    audio_url: Optional[str] = None
    location: Optional[str] = None


class BirdRecordResponse(BaseModel):
    message: str
    xp_gained: int
    level: int
    xp: int
    species_count: int
    recordings_count: int
    is_new_species: bool