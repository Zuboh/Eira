import secrets
import string
from datetime import UTC, datetime, timedelta

import bcrypt
from jose import jwt

from app.core.config import settings

MIN_PASSWORD_CHARACTERS = 8
MAX_PASSWORD_BYTES = 72


def validate_password(password: str) -> str:
    size = len(password.encode("utf-8"))
    if len(password) < MIN_PASSWORD_CHARACTERS or size > MAX_PASSWORD_BYTES:
        raise ValueError(
            f"La password deve contenere almeno {MIN_PASSWORD_CHARACTERS} caratteri "
            f"e non superare {MAX_PASSWORD_BYTES} byte UTF-8"
        )
    return password


def hash_password(password: str) -> str:
    validate_password(password)
    encoded = password.encode("utf-8")
    return bcrypt.hashpw(encoded, bcrypt.gensalt(rounds=settings.bcrypt_rounds)).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        encoded = plain_password.encode("utf-8")
        # Il minimo vale sui nuovi hash. Verificare password legacy corte evita
        # di bloccare account creati prima dell'introduzione della policy.
        if len(encoded) > MAX_PASSWORD_BYTES:
            return False
        return bcrypt.checkpw(encoded, hashed_password.encode("utf-8"))
    except (TypeError, ValueError):
        return False


def generate_temporary_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def create_access_token(subject: str, expires_delta: timedelta | None = None) -> str:
    expire = datetime.now(UTC) + (
        expires_delta or timedelta(minutes=settings.jwt_access_token_expire_minutes)
    )
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
