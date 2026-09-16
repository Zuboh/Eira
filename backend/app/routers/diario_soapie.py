from fastapi import APIRouter, Depends, status

from app.deps import CurrentUserDep, DbDep, require_roles
from app.models.diario_soapie import VoceDiarioSoapie
from app.models.enums import RuoloUtente
from app.openapi_errors import FORBIDDEN, NOT_FOUND, UNAUTHORIZED, errors
from app.schemas.diario_soapie import VoceDiarioSoapieCreate, VoceDiarioSoapieRead
from app.services.clinical_access import require_patient_access

router = APIRouter(prefix="/pazienti", tags=["diario-soapie"])


@router.post(
    "/{paziente_id}/diario-soapie",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(RuoloUtente.infermiere))],
    responses=errors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND),
)
def create_voce(
    paziente_id: int, payload: VoceDiarioSoapieCreate, current_user: CurrentUserDep, db: DbDep
) -> VoceDiarioSoapieRead:
    require_patient_access(db, current_user, paziente_id, turno_id=payload.turno_id)

    voce = VoceDiarioSoapie(**payload.model_dump(), paziente_id=paziente_id, autore_id=current_user.id)
    db.add(voce)
    db.commit()
    db.refresh(voce)
    return VoceDiarioSoapieRead.model_validate(voce)


@router.get(
    "/{paziente_id}/diario-soapie/ultima",
    responses=errors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND),
)
def get_ultima_voce(
    paziente_id: int, current_user: CurrentUserDep, db: DbDep
) -> VoceDiarioSoapieRead | None:
    """Ultima voce SOAPIE del paziente, o `null` se il diario e' vuoto.

    Simmetrico a `/consegne-sbar/pazienti/{id}/ultima`: alimenta il
    copy-forward del dialog consegna.
    """
    require_patient_access(db, current_user, paziente_id)

    voce = (
        db.query(VoceDiarioSoapie)
        .filter(VoceDiarioSoapie.paziente_id == paziente_id)
        .order_by(VoceDiarioSoapie.timestamp.desc())
        .first()
    )
    return VoceDiarioSoapieRead.model_validate(voce) if voce is not None else None


@router.get(
    "/{paziente_id}/diario-soapie", responses=errors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND)
)
def list_voci(paziente_id: int, current_user: CurrentUserDep, db: DbDep) -> list[VoceDiarioSoapieRead]:
    require_patient_access(db, current_user, paziente_id)

    voci = (
        db.query(VoceDiarioSoapie)
        .filter(VoceDiarioSoapie.paziente_id == paziente_id)
        .order_by(VoceDiarioSoapie.timestamp.desc())
        .all()
    )
    return [VoceDiarioSoapieRead.model_validate(v) for v in voci]
