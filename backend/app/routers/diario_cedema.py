import datetime

from fastapi import APIRouter, Depends

from app.deps import CurrentUserDep, require_roles
from app.models.enums import RuoloUtente
from app.schemas.diario_cedema import VoceDiarioCedemaCreate, VoceDiarioCedemaRead

router = APIRouter(prefix="/pazienti", tags=["diario-cedema"])


@router.post(
    "/{paziente_id}/diario-cedema", dependencies=[Depends(require_roles(RuoloUtente.infermiere))]
)
def create_voce(paziente_id: int, payload: VoceDiarioCedemaCreate, current_user: CurrentUserDep) -> VoceDiarioCedemaRead:
    return VoceDiarioCedemaRead(
        id=1,
        paziente_id=paziente_id,
        autore_id=current_user.id,
        timestamp=datetime.datetime.now(datetime.timezone.utc),
        **payload.model_dump(),
    )


@router.get("/{paziente_id}/diario-cedema")
def list_voci(paziente_id: int, current_user: CurrentUserDep) -> list[VoceDiarioCedemaRead]:
    return []
