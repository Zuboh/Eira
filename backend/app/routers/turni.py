import datetime

from fastapi import APIRouter, Depends

from app.deps import CurrentUserDep, require_roles
from app.models.enums import RuoloUtente, StatoAssegnazione
from app.schemas.turno import (
    AssegnazioneTurnoCreate,
    AssegnazioneTurnoRead,
    TurnoCreate,
    TurnoRead,
)

router = APIRouter(prefix="/turni", tags=["turni"])


@router.post("/", dependencies=[Depends(require_roles(RuoloUtente.caposala))])
def create_turno(payload: TurnoCreate) -> TurnoRead:
    return TurnoRead(id=1, **payload.model_dump())


@router.get("/")
def list_turni(current_user: CurrentUserDep) -> list[TurnoRead]:
    return []


@router.get("/scoperti", dependencies=[Depends(require_roles(RuoloUtente.caposala))])
def list_turni_scoperti() -> list[TurnoRead]:
    return []


@router.post(
    "/{turno_id}/assegnazioni", dependencies=[Depends(require_roles(RuoloUtente.caposala))]
)
def assegna_turno(turno_id: int, payload: AssegnazioneTurnoCreate) -> AssegnazioneTurnoRead:
    return AssegnazioneTurnoRead(
        id=1, turno_id=turno_id, infermiere_id=payload.infermiere_id, stato=StatoAssegnazione.attiva
    )


@router.delete(
    "/{turno_id}/assegnazioni", dependencies=[Depends(require_roles(RuoloUtente.caposala))]
)
def rimuovi_assegnazione(turno_id: int, assegnazione_id: int) -> None:
    return None


@router.get("/mie-assegnazioni", dependencies=[Depends(require_roles(RuoloUtente.infermiere))])
def list_mie_assegnazioni() -> list[AssegnazioneTurnoRead]:
    return []
