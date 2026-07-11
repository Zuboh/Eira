from fastapi import APIRouter, Depends
from sqlalchemy import and_, exists, or_

from app.deps import CurrentUserDep, DbDep, require_roles
from app.models.cambio_turno import RichiestaCambioTurno
from app.models.enums import RuoloUtente, StatoAssegnazione, StatoCambioTurno
from app.models.turno import AssegnazioneTurno, Turno
from app.schemas.cambio_turno import RichiestaCambioTurnoRead
from app.schemas.dashboard import DashboardCaposala
from app.schemas.turno import TurnoRead

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/caposala", dependencies=[Depends(require_roles(RuoloUtente.caposala))])
def dashboard_caposala(current_user: CurrentUserDep, db: DbDep) -> DashboardCaposala:
    coperto = exists().where(
        and_(
            AssegnazioneTurno.turno_id == Turno.id,
            AssegnazioneTurno.stato == StatoAssegnazione.attiva,
        )
    )
    turni_scoperti = (
        db.query(Turno)
        .filter(Turno.reparto_id == current_user.reparto_id, ~coperto)
        .order_by(Turno.data)
        .all()
    )

    cambi_in_attesa = (
        db.query(RichiestaCambioTurno)
        .join(
            AssegnazioneTurno,
            RichiestaCambioTurno.assegnazione_turno_id == AssegnazioneTurno.id,
        )
        .join(Turno, AssegnazioneTurno.turno_id == Turno.id)
        .filter(
            Turno.reparto_id == current_user.reparto_id,
            or_(
                RichiestaCambioTurno.stato == StatoCambioTurno.in_attesa_collega,
                RichiestaCambioTurno.stato == StatoCambioTurno.in_attesa_caposala,
            ),
        )
        .order_by(RichiestaCambioTurno.creata_il.desc())
        .all()
    )

    return DashboardCaposala(
        turni_scoperti=[TurnoRead.model_validate(t) for t in turni_scoperti],
        turni_scoperti_count=len(turni_scoperti),
        cambi_turno_in_attesa=[RichiestaCambioTurnoRead.model_validate(r) for r in cambi_in_attesa],
        cambi_turno_in_attesa_count=len(cambi_in_attesa),
    )
