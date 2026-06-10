from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import (
    JWT_SECRET_KEY,
    JWT_ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def normalize_bcrypt_password(password: str) -> str:
    return password[:72]


def hash_password(password: str) -> str:
    return pwd_context.hash(normalize_bcrypt_password(password))


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(normalize_bcrypt_password(plain), hashed)


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    return jwt.encode(
        {"sub": user_id, "type": "access", "exp": expire},
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )


def create_refresh_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    return jwt.encode(
        {"sub": user_id, "type": "refresh", "exp": expire},
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )


def decode_token(token: str, expected_type: str = "access") -> str:
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])

        user_id = payload.get("sub")
        token_type = payload.get("type")

        if not user_id or token_type != expected_type:
            raise ValueError()

        return user_id

    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado.",
        )