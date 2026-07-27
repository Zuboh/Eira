from sqlalchemy.orm import Session

from app.models.cambio_turno import RichiestaCambioTurno
from app.models.turno import AssegnazioneTurno, Turno
from app.schemas.cambio_turno import RichiestaCambioTurnoRead
from app.schemas.turno import TurnoRead


def richiesta_cambio_turno_read(
    db: Session,
    richiesta: RichiestaCambioTurno,
) -> RichiestaCambioTurnoRead:
    assegnazione_richiedente = db.get(
        AssegnazioneTurno,
        richiesta.assegnazione_turno_id,
    )
    if assegnazione_richiedente is None:
        raise ValueError("Assegnazione del richiedente non trovata")

    turno_richiedente = db.get(Turno, assegnazione_richiedente.turno_id)
    if turno_richiedente is None:
        raise ValueError("Turno del richiedente non trovato")

    turno_collega = None
    if richiesta.assegnazione_collega_id is not None:
        assegnazione_collega = db.get(
            AssegnazioneTurno,
            richiesta.assegnazione_collega_id,
        )
        if assegnazione_collega is None:
            raise ValueError("Assegnazione del collega non trovata")
        turno_collega = db.get(Turno, assegnazione_collega.turno_id)
        if turno_collega is None:
            raise ValueError("Turno del collega non trovato")

    return RichiestaCambioTurnoRead(
        **{column.name: getattr(richiesta, column.name) for column in RichiestaCambioTurno.__table__.columns},
        turno_richiedente=TurnoRead.model_validate(turno_richiedente),
        turno_collega=(TurnoRead.model_validate(turno_collega) if turno_collega is not None else None),
    )
