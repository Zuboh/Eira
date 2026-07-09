from fastapi import APIRouter, Depends, HTTPException, status

from app.deps import CurrentUserDep, DbDep, require_roles
from app.models.diario_cedema import VoceDiarioCedema
from app.models.enums import RuoloUtente
from app.models.paziente import Paziente
from app.models.turno import Turno
from app.schemas.diario_cedema import VoceDiarioCedemaCreate, VoceDiarioCedemaRead

router = APIRouter(prefix="/pazienti", tags=["diario-cedema"])


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
    "/{paziente_id}/diario-cedema", dependencies=[Depends(require_roles(RuoloUtente.infermiere))]
)
def create_voce(
    paziente_id: int, payload: VoceDiarioCedemaCreate, current_user: CurrentUserDep, db: DbDep
) -> VoceDiarioCedemaRead:
    _get_paziente_same_reparto(paziente_id, current_user, db)

    if payload.turno_id is not None:
        turno = db.get(Turno, payload.turno_id)
        if turno is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turno non trovato")
        if turno.reparto_id != current_user.reparto_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Turno di un altro reparto"
            )

    voce = VoceDiarioCedema(**payload.model_dump(), paziente_id=paziente_id, autore_id=current_user.id)
    db.add(voce)
    db.commit()
    db.refresh(voce)
    return VoceDiarioCedemaRead.model_validate(voce)


@router.get("/{paziente_id}/diario-cedema")
def list_voci(paziente_id: int, current_user: CurrentUserDep, db: DbDep) -> list[VoceDiarioCedemaRead]:
    _get_paziente_same_reparto(paziente_id, current_user, db)

    voci = (
        db.query(VoceDiarioCedema)
        .filter(VoceDiarioCedema.paziente_id == paziente_id)
        .order_by(VoceDiarioCedema.timestamp.desc())
        .all()
    )
    return [VoceDiarioCedemaRead.model_validate(v) for v in voci]
