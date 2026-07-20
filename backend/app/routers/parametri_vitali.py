from fastapi import APIRouter, Depends, HTTPException, status

from app.deps import CurrentUserDep, DbDep, require_roles
from app.models.enums import RuoloUtente
from app.models.parametri_vitali import ParametriVitali
from app.models.paziente import Paziente
from app.models.turno import Turno
from app.openapi_errors import FORBIDDEN, NOT_FOUND, UNAUTHORIZED, errors
from app.schemas.parametri_vitali import ParametriVitaliCreate, ParametriVitaliRead

router = APIRouter(prefix="/pazienti", tags=["parametri-vitali"])


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
    "/{paziente_id}/parametri-vitali",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(RuoloUtente.infermiere))],
    responses=errors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND),
)
def create_parametri_vitali(
    paziente_id: int, payload: ParametriVitaliCreate, current_user: CurrentUserDep, db: DbDep
) -> ParametriVitaliRead:
    _get_paziente_same_reparto(paziente_id, current_user, db)

    if payload.turno_id is not None:
        turno = db.get(Turno, payload.turno_id)
        if turno is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turno non trovato")
        if turno.reparto_id != current_user.reparto_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Turno di un altro reparto"
            )

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
    _get_paziente_same_reparto(paziente_id, current_user, db)

    entries = (
        db.query(ParametriVitali)
        .filter(ParametriVitali.paziente_id == paziente_id)
        .order_by(ParametriVitali.timestamp.desc())
        .all()
    )
    return [ParametriVitaliRead.model_validate(entry) for entry in entries]
