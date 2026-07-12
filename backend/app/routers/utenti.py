from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError

from app.core.security import hash_password
from app.deps import CurrentUserDep, DbDep, require_roles
from app.models.enums import RuoloUtente
from app.models.utente import Utente
from app.openapi_errors import CONFLICT, FORBIDDEN, NOT_FOUND, UNAUTHORIZED, errors
from app.schemas.utente import UtenteCreate, UtenteRead, UtenteUpdate

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
    dependencies=[Depends(require_roles(RuoloUtente.caposala))],
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
    if payload.attivo is not None:
        utente.attivo = payload.attivo
    db.commit()
    db.refresh(utente)
    return UtenteRead.model_validate(utente)
