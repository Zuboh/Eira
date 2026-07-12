from fastapi import APIRouter, Depends, HTTPException, status

from app.deps import CurrentUserDep, DbDep, require_roles
from app.models.enums import RuoloUtente
from app.models.paziente import Paziente
from app.models.valutazione import ValutazioneConley, ValutazioneNorton
from app.openapi_errors import FORBIDDEN, NOT_FOUND, UNAUTHORIZED, errors
from app.schemas.valutazione import (
    ValutazioneConleyCreate,
    ValutazioneConleyRead,
    ValutazioneNortonCreate,
    ValutazioneNortonRead,
    ValutazioniAggregateRead,
)

router = APIRouter(prefix="/pazienti", tags=["valutazioni"])


def _get_paziente_same_reparto(paziente_id: int, current_user, db) -> Paziente:
    paziente = db.get(Paziente, paziente_id)
    if paziente is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paziente non trovato")
    if paziente.reparto_id != current_user.reparto_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Paziente di un altro reparto"
        )
    return paziente


@router.post(
    "/{paziente_id}/norton",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(RuoloUtente.infermiere))],
    responses=errors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND),
)
def create_norton(
    paziente_id: int, payload: ValutazioneNortonCreate, current_user: CurrentUserDep, db: DbDep
) -> ValutazioneNortonRead:
    _get_paziente_same_reparto(paziente_id, current_user, db)

    punteggio = (
        payload.condizioni_generali
        + payload.stato_mentale
        + payload.attivita
        + payload.mobilita
        + payload.incontinenza
    )
    valutazione = ValutazioneNorton(
        **payload.model_dump(),
        paziente_id=paziente_id,
        autore_id=current_user.id,
        punteggio_totale=punteggio,
    )
    db.add(valutazione)
    db.commit()
    db.refresh(valutazione)
    return ValutazioneNortonRead.model_validate(valutazione)


@router.get("/{paziente_id}/norton", responses=errors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND))
def list_norton(paziente_id: int, current_user: CurrentUserDep, db: DbDep) -> list[ValutazioneNortonRead]:
    _get_paziente_same_reparto(paziente_id, current_user, db)

    valutazioni = (
        db.query(ValutazioneNorton)
        .filter(ValutazioneNorton.paziente_id == paziente_id)
        .order_by(ValutazioneNorton.data_valutazione.desc())
        .all()
    )
    return [ValutazioneNortonRead.model_validate(v) for v in valutazioni]


@router.post(
    "/{paziente_id}/conley",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(RuoloUtente.infermiere))],
    responses=errors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND),
)
def create_conley(
    paziente_id: int, payload: ValutazioneConleyCreate, current_user: CurrentUserDep, db: DbDep
) -> ValutazioneConleyRead:
    _get_paziente_same_reparto(paziente_id, current_user, db)

    punteggio = (
        payload.storia_cadute
        + payload.deficit_visivo
        + payload.alterazione_eliminazione
        + payload.agitazione
        + payload.deficit_vista_osservato
        + payload.andatura_alterata
    )
    valutazione = ValutazioneConley(
        **payload.model_dump(),
        paziente_id=paziente_id,
        autore_id=current_user.id,
        punteggio_totale=punteggio,
    )
    db.add(valutazione)
    db.commit()
    db.refresh(valutazione)
    return ValutazioneConleyRead.model_validate(valutazione)


@router.get("/{paziente_id}/conley", responses=errors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND))
def list_conley(paziente_id: int, current_user: CurrentUserDep, db: DbDep) -> list[ValutazioneConleyRead]:
    _get_paziente_same_reparto(paziente_id, current_user, db)

    valutazioni = (
        db.query(ValutazioneConley)
        .filter(ValutazioneConley.paziente_id == paziente_id)
        .order_by(ValutazioneConley.data_valutazione.desc())
        .all()
    )
    return [ValutazioneConleyRead.model_validate(v) for v in valutazioni]


@router.get("/{paziente_id}/valutazioni", responses=errors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND))
def get_valutazioni_aggregate(
    paziente_id: int, current_user: CurrentUserDep, db: DbDep
) -> ValutazioniAggregateRead:
    return ValutazioniAggregateRead(
        norton=list_norton(paziente_id, current_user, db),
        conley=list_conley(paziente_id, current_user, db),
    )
