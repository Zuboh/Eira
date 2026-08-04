from fastapi import APIRouter, Depends, status

from app.deps import CurrentUserDep, DbDep, require_roles
from app.models.enums import RuoloUtente
from app.models.parametri_vitali import ParametriVitali
from app.openapi_errors import FORBIDDEN, NOT_FOUND, UNAUTHORIZED, errors
from app.schemas.parametri_vitali import ParametriVitaliCreate, ParametriVitaliRead
from app.services.clinical_access import require_patient_access

router = APIRouter(prefix="/pazienti", tags=["parametri-vitali"])


@router.post(
    "/{paziente_id}/parametri-vitali",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(RuoloUtente.infermiere))],
    responses=errors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND),
)
def create_parametri_vitali(
    paziente_id: int, payload: ParametriVitaliCreate, current_user: CurrentUserDep, db: DbDep
) -> ParametriVitaliRead:
    require_patient_access(db, current_user, paziente_id, turno_id=payload.turno_id)

    parametri = ParametriVitali(
        **payload.model_dump(), paziente_id=paziente_id, autore_id=current_user.id
    )
    db.add(parametri)
    db.commit()
    db.refresh(parametri)
    return ParametriVitaliRead.model_validate(parametri)


@router.get(
    "/{paziente_id}/parametri-vitali", responses=errors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND)
)
def list_parametri_vitali(
    paziente_id: int, current_user: CurrentUserDep, db: DbDep
) -> list[ParametriVitaliRead]:
    require_patient_access(db, current_user, paziente_id)

    entries = (
        db.query(ParametriVitali)
        .filter(ParametriVitali.paziente_id == paziente_id)
        .order_by(ParametriVitali.timestamp.desc())
        .all()
    )
    return [ParametriVitaliRead.model_validate(entry) for entry in entries]
