"""Query riusabili sui turni, condivise tra i router `turni` e `dashboard`."""

import datetime

from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from app.models.enums import RuoloUtente, StatoAssegnazione, TipoTurno
from app.models.turno import AssegnazioneTurno, Turno
from app.models.utente import Utente

COPERTURA_MINIMA_TURNO = 1

# riposo/ferie/ferie_estive sono assenze, non slot di organico: la copertura
# minima non si applica e non devono comparire tra i turni da coprire.
TIPI_TURNO_LAVORATIVI = (TipoTurno.mattina, TipoTurno.pomeriggio, TipoTurno.notte)

FINESTRA_CALENDARIO_GIORNI = 7


def query_turni_scoperti(
    db: Session,
    reparto_id: int,
    *,
    da_data: datetime.date | None = None,
    a_data: datetime.date | None = None,
) -> list[Turno]:
    """Turni lavorativi del reparto con meno di `COPERTURA_MINIMA_TURNO` infermieri attivi.

    `da_data` esclude i turni passati: un turno di ieri non è più assegnabile.
    `a_data` chiude la finestra sul futuro.
    """
    query = (
        db.query(Turno)
        .outerjoin(
            AssegnazioneTurno,
            and_(
                AssegnazioneTurno.turno_id == Turno.id,
                AssegnazioneTurno.stato == StatoAssegnazione.attiva,
            ),
        )
        .outerjoin(
            Utente,
            and_(
                Utente.id == AssegnazioneTurno.infermiere_id,
                Utente.ruolo == RuoloUtente.infermiere,
            ),
        )
        .filter(
            Turno.reparto_id == reparto_id,
            Turno.tipo.in_(TIPI_TURNO_LAVORATIVI),
        )
    )
    if da_data is not None:
        query = query.filter(Turno.data >= da_data)
    if a_data is not None:
        query = query.filter(Turno.data <= a_data)

    return (
        query.group_by(Turno.id)
        .having(func.count(Utente.id) < COPERTURA_MINIMA_TURNO)
        .order_by(Turno.data)
        .all()
    )
