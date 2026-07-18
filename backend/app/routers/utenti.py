import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError

from app.core.security import generate_temporary_password, hash_password
from app.deps import CurrentUserDep, DbDep, require_roles
from app.models.enums import RuoloUtente, StatoUtente
from app.models.password_reset import PasswordResetRequirement
from app.models.utente import Utente
from app.openapi_errors import CONFLICT, FORBIDDEN, NOT_FOUND, UNAUTHORIZED, errors
from app.schemas.utente import (
    TemporaryPasswordResponse,
    UtenteCreate,
    UtenteRead,
    UtenteUpdate,
)

router = APIRouter(prefix="/utenti", tags=["utenti"])


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(RuoloUtente.caposala))],
    responses=errors(UNAUTHORIZED, FORBIDDEN, CONFLICT),
)
def create_utente(payload: UtenteCreate, current_user: CurrentUserDep, db: DbDep) -> UtenteRead:
    data = payload.model_dump(exclude={"password", "reparto_id"})
    utente = Utente(
        **data,
        reparto_id=current_user.reparto_id,
        password_hash=hash_password(payload.password),
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


@router.get(
    "/",
    dependencies=[Depends(require_roles(RuoloUtente.caposala, RuoloUtente.infermiere))],
    responses=errors(UNAUTHORIZED, FORBIDDEN),
)
def list_utenti(current_user: CurrentUserDep, db: DbDep) -> list[UtenteRead]:
    utenti = (
        db.query(Utente)
        .filter(Utente.reparto_id == current_user.reparto_id)
        .order_by(Utente.cognome)
        .all()
    )
    return [UtenteRead.model_validate(utente) for utente in utenti]


@router.get("/{utente_id}", responses=errors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND))
def get_utente(utente_id: int, current_user: CurrentUserDep, db: DbDep) -> UtenteRead:
    utente = db.get(Utente, utente_id)
    if utente is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utente non trovato")
    if utente.reparto_id != current_user.reparto_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Utente di un altro reparto"
        )
    return UtenteRead.model_validate(utente)


@router.post(
    "/{utente_id}/password-temporanea",
    dependencies=[Depends(require_roles(RuoloUtente.caposala))],
    responses=errors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND),
)
def create_temporary_password(
    utente_id: int, current_user: CurrentUserDep, db: DbDep
) -> TemporaryPasswordResponse:
    utente = db.get(Utente, utente_id)
    if utente is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utente non trovato")
    if utente.reparto_id != current_user.reparto_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Utente di un altro reparto"
        )
    if utente.ruolo == RuoloUtente.caposala:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Reset password caposala fuori scope",
        )
    if utente.stato != StatoUtente.attivo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Reset password disponibile solo per utenti attivi",
        )

    temporary_password = generate_temporary_password()
    utente.password_hash = hash_password(temporary_password)

    requirement = db.get(PasswordResetRequirement, utente.id)
    if requirement is None:
        requirement = PasswordResetRequirement(
            utente_id=utente.id,
            created_by_id=current_user.id,
        )
        db.add(requirement)
    else:
        requirement.created_by_id = current_user.id
        requirement.created_at = datetime.datetime.now(datetime.UTC)

    db.commit()
    return TemporaryPasswordResponse(temporary_password=temporary_password)


@router.patch(
    "/{utente_id}",
    dependencies=[Depends(require_roles(RuoloUtente.caposala))],
    responses=errors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND),
)
def update_utente(
    utente_id: int, payload: UtenteUpdate, current_user: CurrentUserDep, db: DbDep
) -> UtenteRead:
    utente = db.get(Utente, utente_id)
    if utente is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utente non trovato")
    if utente.reparto_id != current_user.reparto_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Utente di un altro reparto"
        )
    if payload.nome is not None:
        utente.nome = payload.nome
    if payload.cognome is not None:
        utente.cognome = payload.cognome
    if payload.stato is not None:
        utente.stato = payload.stato
    db.commit()
    db.refresh(utente)
    return UtenteRead.model_validate(utente)
