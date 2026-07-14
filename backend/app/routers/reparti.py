from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.deps import DbDep
from app.models.enums import StatoUtente
from app.models.reparto import Reparto
from app.models.utente import Utente
from app.schemas.utente import UtenteTile

router = APIRouter(prefix="/reparti", tags=["reparti"])


class RepartoRead(BaseModel):
    id: int
    nome: str

    model_config = {"from_attributes": True}


@router.get("/")
def list_reparti(db: DbDep) -> list[RepartoRead]:
    reparti = db.query(Reparto).order_by(Reparto.nome).all()
    return [RepartoRead.model_validate(reparto) for reparto in reparti]


@router.get("/{reparto_id}/utenti")
def list_utenti_by_reparto(reparto_id: int, db: DbDep) -> list[UtenteTile]:
    reparto = db.get(Reparto, reparto_id)
    if reparto is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reparto non trovato")
    utenti = (
        db.query(Utente)
        .filter(Utente.reparto_id == reparto_id, Utente.stato == StatoUtente.attivo)
        .order_by(Utente.cognome)
        .all()
    )
    return [UtenteTile.model_validate(utente) for utente in utenti]
