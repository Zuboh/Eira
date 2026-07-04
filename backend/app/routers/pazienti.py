import datetime

from fastapi import APIRouter, Depends

from app.deps import CurrentUserDep, require_roles
from app.models.enums import RuoloUtente
from app.schemas.paziente import PazienteCreate, PazienteRead, PazienteUpdate

router = APIRouter(prefix="/pazienti", tags=["pazienti"])


@router.post("/", dependencies=[Depends(require_roles(RuoloUtente.caposala))])
def create_paziente(payload: PazienteCreate) -> PazienteRead:
    return PazienteRead(id=1, dimesso=False, **payload.model_dump())


@router.get("/")
def list_pazienti(current_user: CurrentUserDep) -> list[PazienteRead]:
    return []


@router.get("/{paziente_id}")
def get_paziente(paziente_id: int, current_user: CurrentUserDep) -> PazienteRead:
    return PazienteRead(
        id=paziente_id,
        nome="Mock",
        cognome="Paziente",
        eta=70,
        letto="1A",
        data_ricovero=datetime.date.today(),
        diagnosi_ingresso="mock",
        reparto_id=1,
        dimesso=False,
    )


@router.patch("/{paziente_id}", dependencies=[Depends(require_roles(RuoloUtente.caposala))])
def update_paziente(paziente_id: int, payload: PazienteUpdate) -> PazienteRead:
    return PazienteRead(
        id=paziente_id,
        nome="Mock",
        cognome="Paziente",
        eta=70,
        letto=payload.letto or "1A",
        data_ricovero=datetime.date.today(),
        diagnosi_ingresso=payload.diagnosi_ingresso or "mock",
        reparto_id=1,
        dimesso=payload.dimesso if payload.dimesso is not None else False,
    )
