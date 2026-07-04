import datetime

from fastapi import APIRouter, Depends

from app.deps import CurrentUserDep, require_roles
from app.models.enums import RuoloUtente
from app.schemas.consegna_sbar import ConsegnaSbarCreate, ConsegnaSbarRead, ConsegnaSbarUpdate

router = APIRouter(prefix="/consegne-sbar", tags=["consegne-sbar"])


@router.post("/", dependencies=[Depends(require_roles(RuoloUtente.infermiere))])
def create_consegna(payload: ConsegnaSbarCreate, current_user: CurrentUserDep) -> ConsegnaSbarRead:
    return ConsegnaSbarRead(
        id=1,
        autore_id=current_user.id,
        creata_il=datetime.datetime.now(datetime.timezone.utc),
        **payload.model_dump(),
    )


@router.get("/")
def list_consegne(current_user: CurrentUserDep) -> list[ConsegnaSbarRead]:
    return []


@router.patch("/{consegna_id}", dependencies=[Depends(require_roles(RuoloUtente.infermiere))])
def update_consegna(consegna_id: int, payload: ConsegnaSbarUpdate, current_user: CurrentUserDep) -> ConsegnaSbarRead:
    return ConsegnaSbarRead(
        id=consegna_id,
        paziente_id=1,
        turno_id=1,
        autore_id=current_user.id,
        situation=payload.situation or "mock",
        background=payload.background or "mock",
        assessment=payload.assessment or "mock",
        recommendation=payload.recommendation or "mock",
        priorita=payload.priorita or "normale",
        creata_il=datetime.datetime.now(datetime.timezone.utc),
    )
