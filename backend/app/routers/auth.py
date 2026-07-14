from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from sqlalchemy.exc import IntegrityError

from app.core.security import create_access_token, hash_password, verify_password
from app.deps import CurrentUserDep, DbDep
from app.models.enums import RuoloUtente, StatoUtente
from app.models.reparto import Reparto
from app.models.utente import Utente
from app.schemas.auth import Token
from app.schemas.utente import UtenteRead, UtenteRegister

router = APIRouter(prefix="/auth", tags=["auth"])

_INVALID_CREDENTIALS = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Email o password non validi",
    headers={"WWW-Authenticate": "Bearer"},
)


@router.post("/token")
def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: DbDep) -> Token:
    try:
        utente_id = int(form_data.username)
    except ValueError:
        raise _INVALID_CREDENTIALS from None

    user = db.get(Utente, utente_id)
    if user is None or not verify_password(form_data.password, user.password_hash):
        raise _INVALID_CREDENTIALS
    if user.stato != StatoUtente.attivo:
        raise _INVALID_CREDENTIALS
    return Token(access_token=create_access_token(subject=str(user.id)))


@router.get("/me")
def read_me(current_user: CurrentUserDep) -> UtenteRead:
    return UtenteRead.model_validate(current_user)


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: UtenteRegister, db: DbDep) -> UtenteRead:
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
