import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_

from app.deps import CurrentUserDep, DbDep, require_roles
from app.models.cambio_turno import RichiestaCambioTurno
from app.models.enums import RuoloUtente, StatoCambioTurno
from app.models.turno import AssegnazioneTurno, Turno
from app.schemas.dashboard import DashboardCaposala
from app.schemas.turno import TurnoRead
from app.services.cambi_turno import richiesta_cambio_turno_read
from app.services.turni import query_turni_scoperti

GIORNI_DEFAULT = 7
GIORNI_MAX = 30
LIMITE_TURNI_SCOPERTI = 50
LIMITE_TURNI_SCOPERTI_MAX = 90

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/caposala", dependencies=[Depends(require_roles(RuoloUtente.caposala))])
def dashboard_caposala(
    current_user: CurrentUserDep,
    db: DbDep,
    giorni: Annotated[int, Query(ge=1, le=GIORNI_MAX)] = GIORNI_DEFAULT,
    limit: Annotated[int, Query(ge=1, le=LIMITE_TURNI_SCOPERTI_MAX)] = LIMITE_TURNI_SCOPERTI,
) -> DashboardCaposala:
    oggi = datetime.date.today()
    turni_scoperti = query_turni_scoperti(
        db,
        current_user.reparto_id,
        da_data=oggi,
        a_data=oggi + datetime.timedelta(days=giorni - 1),
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
        # la lista è troncata per non spedire centinaia di righe, il count resta
        # quello reale della finestra così il riepilogo non mente
        turni_scoperti=[TurnoRead.model_validate(t) for t in turni_scoperti[:limit]],
        turni_scoperti_count=len(turni_scoperti),
        cambi_turno_in_attesa=[richiesta_cambio_turno_read(db, richiesta) for richiesta in cambi_in_attesa],
        cambi_turno_in_attesa_count=len(cambi_in_attesa),
    )
