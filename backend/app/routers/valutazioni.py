import datetime

from fastapi import APIRouter, Depends

from app.deps import CurrentUserDep, require_roles
from app.models.enums import RuoloUtente
from app.schemas.valutazione import (
    ValutazioneConleyCreate,
    ValutazioneConleyRead,
    ValutazioneNortonCreate,
    ValutazioneNortonRead,
    ValutazioniAggregateRead,
)

router = APIRouter(prefix="/pazienti", tags=["valutazioni"])


@router.post("/{paziente_id}/norton", dependencies=[Depends(require_roles(RuoloUtente.infermiere))])
def create_norton(paziente_id: int, payload: ValutazioneNortonCreate, current_user: CurrentUserDep) -> ValutazioneNortonRead:
    punteggio = payload.condizioni_generali + payload.stato_mentale + payload.attivita + payload.mobilita + payload.incontinenza
    return ValutazioneNortonRead(
        id=1, paziente_id=paziente_id, autore_id=current_user.id, punteggio_totale=punteggio, **payload.model_dump()
    )


@router.get("/{paziente_id}/norton")
def list_norton(paziente_id: int, current_user: CurrentUserDep) -> list[ValutazioneNortonRead]:
    return []


@router.post("/{paziente_id}/conley", dependencies=[Depends(require_roles(RuoloUtente.infermiere))])
def create_conley(paziente_id: int, payload: ValutazioneConleyCreate, current_user: CurrentUserDep) -> ValutazioneConleyRead:
    punteggio = (
        payload.storia_cadute
        + payload.deficit_visivo
        + payload.alterazione_eliminazione
        + payload.agitazione
        + payload.deficit_vista_osservato
        + payload.andatura_alterata
    )
    return ValutazioneConleyRead(
        id=1, paziente_id=paziente_id, autore_id=current_user.id, punteggio_totale=punteggio, **payload.model_dump()
    )


@router.get("/{paziente_id}/conley")
def list_conley(paziente_id: int, current_user: CurrentUserDep) -> list[ValutazioneConleyRead]:
    return []


@router.get("/{paziente_id}/valutazioni")
def get_valutazioni_aggregate(paziente_id: int, current_user: CurrentUserDep) -> ValutazioniAggregateRead:
    return ValutazioniAggregateRead(norton=[], conley=[])
