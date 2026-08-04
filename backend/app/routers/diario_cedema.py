from fastapi import APIRouter, Depends, status

from app.deps import CurrentUserDep, DbDep, require_roles
from app.models.diario_cedema import VoceDiarioCedema
from app.models.enums import RuoloUtente
from app.openapi_errors import FORBIDDEN, NOT_FOUND, UNAUTHORIZED, errors
from app.schemas.diario_cedema import VoceDiarioCedemaCreate, VoceDiarioCedemaRead
from app.services.clinical_access import require_patient_access

router = APIRouter(prefix="/pazienti", tags=["diario-cedema"])


@router.post(
    "/{paziente_id}/diario-cedema",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(RuoloUtente.infermiere))],
    responses=errors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND),
)
def create_voce(
    paziente_id: int, payload: VoceDiarioCedemaCreate, current_user: CurrentUserDep, db: DbDep
) -> VoceDiarioCedemaRead:
    require_patient_access(db, current_user, paziente_id, turno_id=payload.turno_id)

    voce = VoceDiarioCedema(**payload.model_dump(), paziente_id=paziente_id, autore_id=current_user.id)
    db.add(voce)
    db.commit()
    db.refresh(voce)
    return VoceDiarioCedemaRead.model_validate(voce)


@router.get(
    "/{paziente_id}/diario-cedema/ultima",
    responses=errors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND),
)
def get_ultima_voce(
    paziente_id: int, current_user: CurrentUserDep, db: DbDep
) -> VoceDiarioCedemaRead | None:
    """Ultima voce CEDEMA del paziente, o `null` se il diario e' vuoto.

    Simmetrico a `/consegne-sbar/pazienti/{id}/ultima`: alimenta il
    copy-forward del dialog consegna.
    """
    require_patient_access(db, current_user, paziente_id)

    voce = (
        db.query(VoceDiarioCedema)
        .filter(VoceDiarioCedema.paziente_id == paziente_id)
        .order_by(VoceDiarioCedema.timestamp.desc())
        .first()
    )
    return VoceDiarioCedemaRead.model_validate(voce) if voce is not None else None


@router.get(
    "/{paziente_id}/diario-cedema", responses=errors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND)
)
def list_voci(paziente_id: int, current_user: CurrentUserDep, db: DbDep) -> list[VoceDiarioCedemaRead]:
    require_patient_access(db, current_user, paziente_id)

    voci = (
        db.query(VoceDiarioCedema)
        .filter(VoceDiarioCedema.paziente_id == paziente_id)
        .order_by(VoceDiarioCedema.timestamp.desc())
        .all()
    )
    return [VoceDiarioCedemaRead.model_validate(v) for v in voci]
