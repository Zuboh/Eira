import datetime

from fastapi import APIRouter, Depends

from app.deps import CurrentUserDep, require_roles
from app.models.enums import RuoloUtente
from app.schemas.utente import UtenteCreate, UtenteRead, UtenteUpdate

router = APIRouter(prefix="/utenti", tags=["utenti"])


@router.post("/", dependencies=[Depends(require_roles(RuoloUtente.caposala))])
def create_utente(payload: UtenteCreate) -> UtenteRead:
    return UtenteRead(id=1, attivo=True, **payload.model_dump(exclude={"password"}))


@router.get("/", dependencies=[Depends(require_roles(RuoloUtente.caposala))])
def list_utenti() -> list[UtenteRead]:
    return []


@router.get("/{utente_id}")
def get_utente(utente_id: int, current_user: CurrentUserDep) -> UtenteRead:
    return UtenteRead(
        id=utente_id,
        nome="Mock",
        cognome="Utente",
        email="mock@example.com",
        ruolo=RuoloUtente.infermiere,
        reparto_id=1,
        attivo=True,
    )


@router.patch("/{utente_id}")
def update_utente(utente_id: int, payload: UtenteUpdate, current_user: CurrentUserDep) -> UtenteRead:
    return UtenteRead(
        id=utente_id,
        nome=payload.nome or "Mock",
        cognome=payload.cognome or "Utente",
        email="mock@example.com",
        ruolo=RuoloUtente.infermiere,
        reparto_id=1,
        attivo=payload.attivo if payload.attivo is not None else True,
    )
