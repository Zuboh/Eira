from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.exc import IntegrityError

from app.core.login_attempts import record_failure, record_success, seconds_until_retry
from app.core.rate_limit import limiter
from app.core.security import create_access_token, hash_password, verify_password
from app.deps import CurrentUserDep, DbDep
from app.models.enums import RuoloUtente, StatoUtente
from app.models.password_reset import PasswordResetRequirement
from app.models.reparto import Reparto
from app.models.utente import Utente
from app.openapi_errors import FORBIDDEN, UNAUTHORIZED, errors
from app.schemas.auth import TemporaryPasswordChange, Token
from app.schemas.utente import UtenteRead, UtenteRegister

router = APIRouter(prefix="/auth", tags=["auth"])

_INVALID_CREDENTIALS = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Email o password non validi",
    headers={"WWW-Authenticate": "Bearer"},
)

_PASSWORD_CHANGE_REQUIRED = HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail="password_change_required",
)

_TEMPORARY_PASSWORD_EXPIRED = HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail="temporary_password_expired",
)


def _too_many_attempts(retry_after_seconds: float) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail="too_many_attempts",
        headers={"Retry-After": str(int(retry_after_seconds) + 1)},
    )


@router.post("/token", responses=errors(UNAUTHORIZED))
@limiter.limit("5/minute")
def login(
    request: Request, form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: DbDep
) -> Token:
    try:
        utente_id = int(form_data.username)
    except ValueError:
        raise _INVALID_CREDENTIALS from None

    retry_after = seconds_until_retry(utente_id)
    if retry_after > 0:
        raise _too_many_attempts(retry_after)

    user = db.get(Utente, utente_id)
    if user is None or not verify_password(form_data.password, user.password_hash):
        record_failure(utente_id)
        raise _INVALID_CREDENTIALS
    if user.stato != StatoUtente.attivo:
        # correct password, wrong state — not a credential guess, don't penalize
        raise _INVALID_CREDENTIALS

    record_success(utente_id)

    requirement = db.get(PasswordResetRequirement, user.id)
    if requirement is not None:
        if requirement.is_expired():
            raise _TEMPORARY_PASSWORD_EXPIRED
        raise _PASSWORD_CHANGE_REQUIRED
    return Token(access_token=create_access_token(subject=str(user.id)))


@router.get("/me", responses=errors(UNAUTHORIZED))
def read_me(current_user: CurrentUserDep) -> UtenteRead:
    return UtenteRead.model_validate(current_user)


@router.post(
    "/change-temporary-password",
    responses=errors(UNAUTHORIZED, FORBIDDEN),
)
@limiter.limit("5/minute")
def change_temporary_password(
    request: Request, payload: TemporaryPasswordChange, db: DbDep
) -> UtenteRead:
    user = db.get(Utente, payload.utente_id)
    requirement = db.get(PasswordResetRequirement, payload.utente_id) if user else None
    if user is None or user.stato != StatoUtente.attivo or requirement is None:
        raise _INVALID_CREDENTIALS
    if requirement.is_expired():
        raise _TEMPORARY_PASSWORD_EXPIRED
    if not verify_password(payload.temporary_password, user.password_hash):
        raise _INVALID_CREDENTIALS

    user.password_hash = hash_password(payload.new_password)
    db.delete(requirement)
    db.commit()
    db.refresh(user)
    return UtenteRead.model_validate(user)


@router.post("/register", status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
def register(request: Request, payload: UtenteRegister, db: DbDep) -> UtenteRead:
    reparto = db.get(Reparto, payload.reparto_id)
    if reparto is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reparto non trovato")

    utente = Utente(
        email=payload.email,
        password_hash=hash_password(payload.password),
        nome=payload.nome,
        cognome=payload.cognome,
        reparto_id=payload.reparto_id,
        ruolo=RuoloUtente.infermiere,
        stato=StatoUtente.in_attesa,
    )
    db.add(utente)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email già registrata",
        ) from exc
    db.refresh(utente)
    return UtenteRead.model_validate(utente)
