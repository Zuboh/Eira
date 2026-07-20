import datetime

from fastapi import APIRouter, Depends, HTTPException, status

from app.deps import CurrentUserDep, DbDep, require_roles
from app.models.enums import RuoloUtente, StatoAssegnazione
from app.models.paziente import Paziente
from app.models.turno import AssegnazioneTurno, Turno
from app.openapi_errors import FORBIDDEN, NOT_FOUND, UNAUTHORIZED, errors
from app.schemas.paziente import PazienteCreate, PazienteRead, PazienteUpdate

router = APIRouter(prefix="/pazienti", tags=["pazienti"])


def _infermiere_ha_turno_attivo(current_user, db) -> bool:
    return (
        db.query(AssegnazioneTurno)
        .join(Turno, AssegnazioneTurno.turno_id == Turno.id)
        .filter(
            AssegnazioneTurno.infermiere_id == current_user.id,
            AssegnazioneTurno.stato == StatoAssegnazione.attiva,
            Turno.data == datetime.date.today(),
        )
        .first()
        is not None
    )


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(RuoloUtente.caposala))],
    responses=errors(UNAUTHORIZED, FORBIDDEN),
)
def create_paziente(
    payload: PazienteCreate, current_user: CurrentUserDep, db: DbDep
) -> PazienteRead:
    data = payload.model_dump(exclude={"reparto_id"})
    paziente = Paziente(**data, reparto_id=current_user.reparto_id)
    db.add(paziente)
    db.commit()
    db.refresh(paziente)
    return PazienteRead.model_validate(paziente)


@router.get("/", responses=errors(UNAUTHORIZED))
def list_pazienti(current_user: CurrentUserDep, db: DbDep) -> list[PazienteRead]:
    if current_user.ruolo == RuoloUtente.infermiere and not _infermiere_ha_turno_attivo(
        current_user, db
    ):
        return []

    pazienti = (
        db.query(Paziente)
        .filter(Paziente.reparto_id == current_user.reparto_id)
        .order_by(Paziente.cognome)
        .all()
    )
    return [PazienteRead.model_validate(paziente) for paziente in pazienti]


@router.get("/{paziente_id}", responses=errors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND))
def get_paziente(paziente_id: int, current_user: CurrentUserDep, db: DbDep) -> PazienteRead:
    paziente = db.get(Paziente, paziente_id)
    if paziente is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paziente non trovato")
    if paziente.reparto_id != current_user.reparto_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Paziente di un altro reparto"
        )
    if current_user.ruolo == RuoloUtente.infermiere and not _infermiere_ha_turno_attivo(
        current_user, db
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Nessun turno attivo assegnato"
        )
    return PazienteRead.model_validate(paziente)


@router.patch(
    "/{paziente_id}",
    dependencies=[Depends(require_roles(RuoloUtente.caposala))],
    responses=errors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND),
)
def update_paziente(
    paziente_id: int, payload: PazienteUpdate, current_user: CurrentUserDep, db: DbDep
) -> PazienteRead:
    paziente = db.get(Paziente, paziente_id)
    if paziente is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paziente non trovato")
    if paziente.reparto_id != current_user.reparto_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Paziente di un altro reparto"
        )
    if payload.letto is not None:
        paziente.letto = payload.letto
    if payload.diagnosi_ingresso is not None:
        paziente.diagnosi_ingresso = payload.diagnosi_ingresso
    if payload.dimesso is not None:
        paziente.dimesso = payload.dimesso
    db.commit()
    db.refresh(paziente)
    return PazienteRead.model_validate(paziente)
