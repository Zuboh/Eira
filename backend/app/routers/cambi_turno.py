import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_

from app.deps import CurrentUserDep, DbDep, require_roles
from app.models.cambio_turno import RichiestaCambioTurno
from app.models.enums import RuoloUtente, StatoAssegnazione, StatoCambioTurno, StatoUtente
from app.models.turno import AssegnazioneTurno, Turno
from app.models.utente import Utente
from app.openapi_errors import BAD_REQUEST, CONFLICT, FORBIDDEN, NOT_FOUND, UNAUTHORIZED, errors
from app.schemas.cambio_turno import (
    RichiestaCambioTurnoCreate,
    RichiestaCambioTurnoRead,
    RispostaCaposalaRequest,
    RispostaCollegaRequest,
)
from app.services.cambi_turno import richiesta_cambio_turno_read

router = APIRouter(prefix="/cambi-turno", tags=["cambi-turno"])


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(RuoloUtente.infermiere))],
    responses=errors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT, BAD_REQUEST),
)
def create_richiesta(
    payload: RichiestaCambioTurnoCreate, current_user: CurrentUserDep, db: DbDep
) -> RichiestaCambioTurnoRead:
    """Apre una richiesta di cambio turno, stato iniziale `in_attesa_collega`.

    Il flusso a doppia conferma richiede poi la risposta del collega
    interpellato (`/risposta-collega`) e infine l'approvazione della
    caposala (`/risposta-caposala`) prima che lo scambio diventi effettivo.
    """
    assegnazione = db.get(AssegnazioneTurno, payload.assegnazione_turno_id)
    if assegnazione is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assegnazione non trovata")
    if assegnazione.infermiere_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Puoi richiedere il cambio solo di un tuo turno",
        )
    if assegnazione.stato != StatoAssegnazione.attiva:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Assegnazione non più attiva")
    turno_richiedente = db.get(Turno, assegnazione.turno_id)
    if turno_richiedente is None or turno_richiedente.data < datetime.date.today():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Non è possibile cambiare un turno passato",
        )

    if payload.collega_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Non puoi scambiare turno con te stessa"
        )
    collega = db.get(Utente, payload.collega_id)
    if (
        collega is None
        or collega.reparto_id != current_user.reparto_id
        or collega.ruolo != RuoloUtente.infermiere
        or collega.stato != StatoUtente.attivo
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Collega di un altro reparto")

    assegnazione_collega = None
    if payload.assegnazione_collega_id is not None:
        assegnazione_collega = db.get(
            AssegnazioneTurno,
            payload.assegnazione_collega_id,
        )
        if assegnazione_collega is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assegnazione del collega non trovata",
            )
        if (
            assegnazione_collega.infermiere_id != payload.collega_id
            or assegnazione_collega.stato != StatoAssegnazione.attiva
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Il turno scelto non appartiene al collega",
            )
        turno_collega = db.get(Turno, assegnazione_collega.turno_id)
        if (
            turno_richiedente is None
            or turno_collega is None
            or turno_collega.reparto_id != current_user.reparto_id
            or turno_collega.data < datetime.date.today()
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Turno del collega di un altro reparto",
            )
        if turno_richiedente.id == turno_collega.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Seleziona due turni diversi",
            )

    richiesta = RichiestaCambioTurno(
        assegnazione_turno_id=payload.assegnazione_turno_id,
        assegnazione_collega_id=payload.assegnazione_collega_id,
        richiedente_id=current_user.id,
        collega_id=payload.collega_id,
        stato=StatoCambioTurno.in_attesa_collega,
    )
    db.add(richiesta)
    db.commit()
    db.refresh(richiesta)
    return richiesta_cambio_turno_read(db, richiesta)


@router.delete(
    "/{richiesta_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles(RuoloUtente.infermiere))],
    responses=errors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT),
)
def delete_richiesta(richiesta_id: int, current_user: CurrentUserDep, db: DbDep) -> None:
    """Il richiedente annulla una richiesta ancora pendente (non ancora
    approvata/rifiutata)."""
    richiesta = db.get(RichiestaCambioTurno, richiesta_id)
    if richiesta is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Richiesta non trovata")
    if richiesta.richiedente_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Puoi annullare solo le tue richieste"
        )
    if richiesta.stato not in (
        StatoCambioTurno.in_attesa_collega,
        StatoCambioTurno.in_attesa_caposala,
    ):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Richiesta non più annullabile")
    db.delete(richiesta)
    db.commit()


@router.get("/", responses=errors(UNAUTHORIZED))
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
    return [richiesta_cambio_turno_read(db, richiesta) for richiesta in richieste]


@router.post(
    "/{richiesta_id}/risposta-collega",
    dependencies=[Depends(require_roles(RuoloUtente.infermiere))],
    responses=errors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT),
)
def risposta_collega(
    richiesta_id: int, payload: RispostaCollegaRequest, current_user: CurrentUserDep, db: DbDep
) -> RichiestaCambioTurnoRead:
    """Il collega interpellato accetta o rifiuta lo scambio.

    Accettando, la richiesta passa a `in_attesa_caposala`; rifiutando,
    diventa `rifiutata_collega` e il flusso si ferma qui.
    """
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
    richiesta.risposta_collega_il = datetime.datetime.now(datetime.UTC)
    db.commit()
    db.refresh(richiesta)
    return richiesta_cambio_turno_read(db, richiesta)


@router.post(
    "/{richiesta_id}/risposta-caposala",
    dependencies=[Depends(require_roles(RuoloUtente.caposala))],
    responses=errors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT),
)
def risposta_caposala(
    richiesta_id: int, payload: RispostaCaposalaRequest, current_user: CurrentUserDep, db: DbDep
) -> RichiestaCambioTurnoRead:
    """La caposala approva o rifiuta lo scambio già accettato dal collega.

    Approvando una nuova richiesta, le due assegnazioni selezionate vengono
    scambiate se non creano doppi turni. Le richieste storiche senza turno
    offerto mantengono il precedente comportamento di trasferimento.
    """
    richiesta = db.get(RichiestaCambioTurno, richiesta_id)
    if richiesta is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Richiesta non trovata")

    assegnazione = db.get(AssegnazioneTurno, richiesta.assegnazione_turno_id)
    if assegnazione is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Assegnazione del richiedente non più disponibile",
        )
    turno = db.get(Turno, assegnazione.turno_id)
    if turno is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Turno del richiedente non più disponibile",
        )
    if turno.reparto_id != current_user.reparto_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Richiesta di un altro reparto")
    if turno.data < datetime.date.today():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Il turno della richiesta è ormai passato",
        )
    if richiesta.stato != StatoCambioTurno.in_attesa_caposala:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Richiesta non in attesa di approvazione caposala"
        )

    if payload.accetta:
        richiedente = db.get(Utente, richiesta.richiedente_id)
        collega = db.get(Utente, richiesta.collega_id)
        if (
            richiedente is None
            or collega is None
            or richiedente.stato != StatoUtente.attivo
            or collega.stato != StatoUtente.attivo
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Uno degli infermieri non è più attivo",
            )
        if richiesta.assegnazione_collega_id is not None:
            assegnazione_collega = db.get(
                AssegnazioneTurno,
                richiesta.assegnazione_collega_id,
            )
            if (
                assegnazione.infermiere_id != richiesta.richiedente_id
                or assegnazione_collega is None
                or assegnazione_collega.infermiere_id != richiesta.collega_id
                or assegnazione_collega.stato != StatoAssegnazione.attiva
            ):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Le assegnazioni sono cambiate dopo la richiesta",
                )
            turno_collega = db.get(Turno, assegnazione_collega.turno_id)
            if turno_collega is None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Turno del collega non più disponibile",
                )
            if turno_collega.data < datetime.date.today():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Il turno del collega è ormai passato",
                )

            ids_scambio = (assegnazione.id, assegnazione_collega.id)
            conflitto_richiedente = (
                db.query(AssegnazioneTurno)
                .join(Turno, AssegnazioneTurno.turno_id == Turno.id)
                .filter(
                    AssegnazioneTurno.infermiere_id == richiesta.richiedente_id,
                    AssegnazioneTurno.stato == StatoAssegnazione.attiva,
                    Turno.data == turno_collega.data,
                    AssegnazioneTurno.id.notin_(ids_scambio),
                )
                .first()
            )
            conflitto_collega = (
                db.query(AssegnazioneTurno)
                .join(Turno, AssegnazioneTurno.turno_id == Turno.id)
                .filter(
                    AssegnazioneTurno.infermiere_id == richiesta.collega_id,
                    AssegnazioneTurno.stato == StatoAssegnazione.attiva,
                    Turno.data == turno.data,
                    AssegnazioneTurno.id.notin_(ids_scambio),
                )
                .first()
            )
            if conflitto_richiedente is not None or conflitto_collega is not None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Lo scambio creerebbe un doppio turno",
                )

            assegnazione.infermiere_id = richiesta.collega_id
            assegnazione_collega.infermiere_id = richiesta.richiedente_id
        else:
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
    richiesta.risposta_caposala_il = datetime.datetime.now(datetime.UTC)
    db.commit()
    db.refresh(richiesta)
    return richiesta_cambio_turno_read(db, richiesta)
