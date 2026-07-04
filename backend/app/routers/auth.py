from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.core.security import create_access_token, verify_password
from app.deps import CurrentUserDep, DbDep
from app.models.utente import Utente
from app.schemas.auth import Token
from app.schemas.utente import UtenteRead

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/token")
def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: DbDep) -> Token:
    user = db.query(Utente).filter(Utente.email == form_data.username).first()
    if user is None or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o password non validi",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return Token(access_token=create_access_token(subject=str(user.id)))


@router.get("/me")
def read_me(current_user: CurrentUserDep) -> UtenteRead:
    return UtenteRead.model_validate(current_user)
