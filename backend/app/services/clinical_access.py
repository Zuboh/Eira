import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.enums import RuoloUtente, StatoAssegnazione
from app.models.paziente import Paziente
from app.models.turno import AssegnazioneTurno, Turno
from app.models.utente import Utente


def has_active_shift_today(db: Session, user_id: int, reparto_id: int) -> bool:
    return (
        db.query(AssegnazioneTurno)
        .join(Turno, AssegnazioneTurno.turno_id == Turno.id)
        .filter(
            AssegnazioneTurno.infermiere_id == user_id,
            AssegnazioneTurno.stato == StatoAssegnazione.attiva,
            Turno.data == datetime.date.today(),
            Turno.reparto_id == reparto_id,
        )
        .first()
        is not None
    )


def require_patient_access(
    db: Session,
    current_user: Utente,
    paziente_id: int,
    *,
    turno_id: int | None = None,
) -> Paziente:
    """Policy unica per lettura/scrittura della cartella clinica di reparto."""
    paziente = db.get(Paziente, paziente_id)
    if paziente is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paziente non trovato")
    if paziente.reparto_id != current_user.reparto_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Paziente di un altro reparto"
        )
    if current_user.ruolo == RuoloUtente.infermiere and not has_active_shift_today(
        db, current_user.id, current_user.reparto_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Nessun turno attivo assegnato"
        )
    if turno_id is not None:
        assegnazione = (
            db.query(AssegnazioneTurno)
            .join(Turno, AssegnazioneTurno.turno_id == Turno.id)
            .filter(
                AssegnazioneTurno.turno_id == turno_id,
                AssegnazioneTurno.infermiere_id == current_user.id,
                AssegnazioneTurno.stato == StatoAssegnazione.attiva,
                Turno.reparto_id == current_user.reparto_id,
                Turno.data == datetime.date.today(),
            )
            .first()
        )
        if assegnazione is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Turno non assegnato all'autore",
            )
    return paziente
