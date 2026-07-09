import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_

from app.deps import CurrentUserDep, DbDep, require_roles
from app.models.cambio_turno import RichiestaCambioTurno
from app.models.enums import RuoloUtente, StatoAssegnazione, StatoCambioTurno
from app.models.turno import AssegnazioneTurno, Turno
from app.models.utente import Utente
from app.schemas.cambio_turno import (
    RichiestaCambioTurnoCreate,
    RichiestaCambioTurnoRead,
    RispostaCaposalaRequest,
    RispostaCollegaRequest,
)

router = APIRouter(prefix="/cambi-turno", tags=["cambi-turno"])


@router.post("/", dependencies=[Depends(require_roles(RuoloUtente.infermiere))])
def create_richiesta(
    payload: RichiestaCambioTurnoCreate, current_user: CurrentUserDep, db: DbDep
) -> RichiestaCambioTurnoRead:
    assegnazione = db.get(AssegnazioneTurno, payload.assegnazione_turno_id)
    if assegnazione is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Assegnazione non trovata"
        )
    if assegnazione.infermiere_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Puoi richiedere il cambio solo di un tuo turno",
        )
    if assegnazione.stato != StatoAssegnazione.attiva:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Assegnazione non più attiva"
        )

    if payload.collega_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Non puoi scambiare turno con te stessa"
        )
    collega = db.get(Utente, payload.collega_id)
    if collega is None or collega.reparto_id != current_user.reparto_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Collega di un altro reparto"
        )

    richiesta = RichiestaCambioTurno(
        assegnazione_turno_id=payload.assegnazione_turno_id,
        richiedente_id=current_user.id,
        collega_id=payload.collega_id,
        stato=StatoCambioTurno.in_attesa_collega,
    )
    db.add(richiesta)
    db.commit()
    db.refresh(richiesta)
    return RichiestaCambioTurnoRead.model_validate(richiesta)


@router.get("/")
def list_richieste(current_user: CurrentUserDep, db: DbDep) -> list[RichiestaCambioTurnoRead]:
    if current_user.ruolo == RuoloUtente.caposala:
        richieste = (
            db.query(RichiestaCambioTurno)
            .join(
                AssegnazioneTurno,
                RichiestaCambioTurno.assegnazione_turno_id == AssegnazioneTurno.id,
            )
            .join(Turno, AssegnazioneTurno.turno_id == Turno.id)
            .filter(Turno.reparto_id == current_user.reparto_id)
            .order_by(RichiestaCambioTurno.creata_il.desc())
            .all()
        )
    else:
        richieste = (
            db.query(RichiestaCambioTurno)
            .filter(
                or_(
                    RichiestaCambioTurno.richiedente_id == current_user.id,
                    RichiestaCambioTurno.collega_id == current_user.id,
                )
            )
            .order_by(RichiestaCambioTurno.creata_il.desc())
            .all()
        )
    return [RichiestaCambioTurnoRead.model_validate(r) for r in richieste]


@router.post(
    "/{richiesta_id}/risposta-collega", dependencies=[Depends(require_roles(RuoloUtente.infermiere))]
)
def risposta_collega(
    richiesta_id: int, payload: RispostaCollegaRequest, current_user: CurrentUserDep, db: DbDep
) -> RichiestaCambioTurnoRead:
    richiesta = db.get(RichiestaCambioTurno, richiesta_id)
    if richiesta is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Richiesta non trovata")
    if richiesta.collega_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo il collega interpellato può rispondere",
        )
    if richiesta.stato != StatoCambioTurno.in_attesa_collega:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Richiesta non in attesa di risposta collega"
        )

    richiesta.stato = (
        StatoCambioTurno.in_attesa_caposala if payload.accetta else StatoCambioTurno.rifiutata_collega
    )
    richiesta.risposta_collega_il = datetime.datetime.now(datetime.timezone.utc)
    db.commit()
    db.refresh(richiesta)
    return RichiestaCambioTurnoRead.model_validate(richiesta)


@router.post(
    "/{richiesta_id}/risposta-caposala", dependencies=[Depends(require_roles(RuoloUtente.caposala))]
)
def risposta_caposala(
    richiesta_id: int, payload: RispostaCaposalaRequest, current_user: CurrentUserDep, db: DbDep
) -> RichiestaCambioTurnoRead:
    richiesta = db.get(RichiestaCambioTurno, richiesta_id)
    if richiesta is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Richiesta non trovata")

    assegnazione = db.get(AssegnazioneTurno, richiesta.assegnazione_turno_id)
    turno = db.get(Turno, assegnazione.turno_id)
    if turno.reparto_id != current_user.reparto_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Richiesta di un altro reparto"
        )
    if richiesta.stato != StatoCambioTurno.in_attesa_caposala:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Richiesta non in attesa di approvazione caposala"
        )

    if payload.accetta:
        doppio_turno = (
            db.query(AssegnazioneTurno)
            .join(Turno, AssegnazioneTurno.turno_id == Turno.id)
            .filter(
                AssegnazioneTurno.infermiere_id == richiesta.collega_id,
                AssegnazioneTurno.stato == StatoAssegnazione.attiva,
                Turno.data == turno.data,
                AssegnazioneTurno.id != assegnazione.id,
            )
            .first()
        )
        if doppio_turno is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Collega già assegnato a un turno in questa data",
            )
        assegnazione.infermiere_id = richiesta.collega_id
        richiesta.stato = StatoCambioTurno.approvata
    else:
        richiesta.stato = StatoCambioTurno.rifiutata_caposala
        richiesta.motivo_rifiuto = payload.motivo_rifiuto

    richiesta.risposta_caposala_id = current_user.id
    richiesta.risposta_caposala_il = datetime.datetime.now(datetime.timezone.utc)
    db.commit()
    db.refresh(richiesta)
    return RichiestaCambioTurnoRead.model_validate(richiesta)
