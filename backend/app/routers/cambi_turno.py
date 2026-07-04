import datetime

from fastapi import APIRouter, Depends

from app.deps import CurrentUserDep, require_roles
from app.models.enums import RuoloUtente, StatoCambioTurno
from app.schemas.cambio_turno import (
    RichiestaCambioTurnoCreate,
    RichiestaCambioTurnoRead,
    RispostaCaposalaRequest,
    RispostaCollegaRequest,
)

router = APIRouter(prefix="/cambi-turno", tags=["cambi-turno"])


@router.post("/", dependencies=[Depends(require_roles(RuoloUtente.infermiere))])
def create_richiesta(payload: RichiestaCambioTurnoCreate, current_user: CurrentUserDep) -> RichiestaCambioTurnoRead:
    return RichiestaCambioTurnoRead(
        id=1,
        assegnazione_turno_id=payload.assegnazione_turno_id,
        richiedente_id=current_user.id,
        collega_id=payload.collega_id,
        stato=StatoCambioTurno.in_attesa_collega,
        creata_il=datetime.datetime.now(datetime.timezone.utc),
    )


@router.get("/")
def list_richieste(current_user: CurrentUserDep) -> list[RichiestaCambioTurnoRead]:
    return []


@router.post(
    "/{richiesta_id}/risposta-collega", dependencies=[Depends(require_roles(RuoloUtente.infermiere))]
)
def risposta_collega(richiesta_id: int, payload: RispostaCollegaRequest) -> RichiestaCambioTurnoRead:
    stato = StatoCambioTurno.in_attesa_caposala if payload.accetta else StatoCambioTurno.rifiutata_collega
    return RichiestaCambioTurnoRead(
        id=richiesta_id,
        assegnazione_turno_id=1,
        richiedente_id=1,
        collega_id=2,
        stato=stato,
        creata_il=datetime.datetime.now(datetime.timezone.utc),
        risposta_collega_il=datetime.datetime.now(datetime.timezone.utc),
    )


@router.post(
    "/{richiesta_id}/risposta-caposala", dependencies=[Depends(require_roles(RuoloUtente.caposala))]
)
def risposta_caposala(
    richiesta_id: int, payload: RispostaCaposalaRequest, current_user: CurrentUserDep
) -> RichiestaCambioTurnoRead:
    stato = StatoCambioTurno.approvata if payload.accetta else StatoCambioTurno.rifiutata_caposala
    return RichiestaCambioTurnoRead(
        id=richiesta_id,
        assegnazione_turno_id=1,
        richiedente_id=1,
        collega_id=2,
        stato=stato,
        creata_il=datetime.datetime.now(datetime.timezone.utc),
        risposta_caposala_id=current_user.id,
        risposta_caposala_il=datetime.datetime.now(datetime.timezone.utc),
        motivo_rifiuto=payload.motivo_rifiuto,
    )
