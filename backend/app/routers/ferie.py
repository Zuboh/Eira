import datetime

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.ferie_slots import is_slot_valido, slot_ferie_estive
from app.deps import CurrentUserDep, DbDep, require_roles
from app.models.enums import RuoloUtente, StatoAssegnazione, StatoRichiestaFerie, TipoTurno
from app.models.ferie import RichiestaFerie, RichiestaFeriePreferenza
from app.models.turno import AssegnazioneTurno, Turno
from app.models.utente import Utente
from app.openapi_errors import BAD_REQUEST, CONFLICT, FORBIDDEN, NOT_FOUND, UNAUTHORIZED, errors
from app.schemas.ferie import (
    PreferenzaFerieRead,
    RichiestaFerieCreate,
    RichiestaFerieRead,
    RispostaFerieRequest,
)

router = APIRouter(prefix="/ferie", tags=["ferie"])

DURATA_SLOT_GIORNI = 14
MAX_PREFERENZE = 3
STATI_ATTIVI = (StatoRichiestaFerie.in_attesa, StatoRichiestaFerie.approvata)


def _to_read(db: DbDep, richiesta: RichiestaFerie) -> RichiestaFerieRead:
    preferenze = (
        db.query(RichiestaFeriePreferenza)
        .filter(RichiestaFeriePreferenza.richiesta_id == richiesta.id)
        .order_by(RichiestaFeriePreferenza.rank)
        .all()
    )
    read = RichiestaFerieRead.model_validate(richiesta)
    read.preferenze = [PreferenzaFerieRead.model_validate(p) for p in preferenze]
    return read


def _valida_preferenze(preferenze: list[datetime.date]) -> None:
    if not 1 <= len(preferenze) <= MAX_PREFERENZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Indica da 1 a {MAX_PREFERENZE} preferenze",
        )
    if len(set(preferenze)) != len(preferenze):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Le preferenze non possono ripetersi"
        )
    for data_inizio in preferenze:
        if not is_slot_valido(data_inizio):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Data di inizio non valida: scegli uno degli slot disponibili",
            )


def _crea_preferenze(db: DbDep, richiesta_id: int, preferenze: list[datetime.date]) -> None:
    for rank, data_inizio in enumerate(preferenze, start=1):
        db.add(
            RichiestaFeriePreferenza(
                richiesta_id=richiesta_id,
                rank=rank,
                data_inizio=data_inizio,
                data_fine=data_inizio + datetime.timedelta(days=DURATA_SLOT_GIORNI - 1),
            )
        )


@router.get("/slot-disponibili", responses=errors(UNAUTHORIZED))
def list_slot_disponibili(current_user: CurrentUserDep) -> list[datetime.date]:
    return slot_ferie_estive()


@router.post(
    "/richieste",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(RuoloUtente.infermiere))],
    responses=errors(UNAUTHORIZED, FORBIDDEN, BAD_REQUEST, CONFLICT),
)
def create_richiesta(
    payload: RichiestaFerieCreate, current_user: CurrentUserDep, db: DbDep
) -> RichiestaFerieRead:
    """Apre una richiesta con fino a 3 preferenze ordinate sui blocchi fissi
    di 2 settimane della stagione. Stato iniziale `in_attesa`, in attesa di
    approvazione della caposala. Un infermiere può avere una sola richiesta
    attiva (in_attesa o approvata) alla volta."""
    _valida_preferenze(payload.preferenze)

    richiesta_attiva = (
        db.query(RichiestaFerie)
        .filter(
            RichiestaFerie.infermiere_id == current_user.id,
            RichiestaFerie.stato.in_(STATI_ATTIVI),
        )
        .first()
    )
    if richiesta_attiva is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Hai già una richiesta di ferie attiva",
        )

    richiesta = RichiestaFerie(
        infermiere_id=current_user.id,
        stato=StatoRichiestaFerie.in_attesa,
    )
    db.add(richiesta)
    db.flush()
    _crea_preferenze(db, richiesta.id, payload.preferenze)
    db.commit()
    db.refresh(richiesta)
    return _to_read(db, richiesta)


@router.patch(
    "/richieste/{richiesta_id}",
    dependencies=[Depends(require_roles(RuoloUtente.infermiere))],
    responses=errors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT, BAD_REQUEST),
)
def update_richiesta(
    richiesta_id: int, payload: RichiestaFerieCreate, current_user: CurrentUserDep, db: DbDep
) -> RichiestaFerieRead:
    """Sostituisce le preferenze di una richiesta ancora in_attesa."""
    richiesta = db.get(RichiestaFerie, richiesta_id)
    if richiesta is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Richiesta non trovata")
    if richiesta.infermiere_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Puoi modificare solo le tue richieste"
        )
    if richiesta.stato != StatoRichiestaFerie.in_attesa:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Richiesta non più modificabile"
        )

    _valida_preferenze(payload.preferenze)

    db.query(RichiestaFeriePreferenza).filter(
        RichiestaFeriePreferenza.richiesta_id == richiesta.id
    ).delete()
    _crea_preferenze(db, richiesta.id, payload.preferenze)
    db.commit()
    db.refresh(richiesta)
    return _to_read(db, richiesta)


@router.delete(
    "/richieste/{richiesta_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles(RuoloUtente.infermiere))],
    responses=errors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT),
)
def delete_richiesta(richiesta_id: int, current_user: CurrentUserDep, db: DbDep) -> None:
    """Annulla una richiesta ancora in_attesa."""
    richiesta = db.get(RichiestaFerie, richiesta_id)
    if richiesta is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Richiesta non trovata")
    if richiesta.infermiere_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Puoi annullare solo le tue richieste"
        )
    if richiesta.stato != StatoRichiestaFerie.in_attesa:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Richiesta non più annullabile"
        )

    db.query(RichiestaFeriePreferenza).filter(
        RichiestaFeriePreferenza.richiesta_id == richiesta.id
    ).delete()
    db.delete(richiesta)
    db.commit()


@router.get("/richieste", responses=errors(UNAUTHORIZED))
def list_richieste(current_user: CurrentUserDep, db: DbDep) -> list[RichiestaFerieRead]:
    if current_user.ruolo == RuoloUtente.caposala:
        richieste = (
            db.query(RichiestaFerie)
            .join(Utente, RichiestaFerie.infermiere_id == Utente.id)
            .filter(Utente.reparto_id == current_user.reparto_id)
            .order_by(RichiestaFerie.creata_il.desc())
            .all()
        )
    else:
        richieste = (
            db.query(RichiestaFerie)
            .filter(RichiestaFerie.infermiere_id == current_user.id)
            .order_by(RichiestaFerie.creata_il.desc())
            .all()
        )
    return [_to_read(db, r) for r in richieste]


@router.post(
    "/richieste/{richiesta_id}/rispondi",
    dependencies=[Depends(require_roles(RuoloUtente.caposala))],
    responses=errors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT, BAD_REQUEST),
)
def rispondi_richiesta(
    richiesta_id: int, payload: RispostaFerieRequest, current_user: CurrentUserDep, db: DbDep
) -> RichiestaFerieRead:
    richiesta = db.get(RichiestaFerie, richiesta_id)
    if richiesta is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Richiesta non trovata")

    infermiere = db.get(Utente, richiesta.infermiere_id)
    if infermiere is None or infermiere.reparto_id != current_user.reparto_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Richiesta di un altro reparto"
        )
    if richiesta.stato != StatoRichiestaFerie.in_attesa:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Richiesta gia' evasa"
        )

    if not payload.accetta:
        richiesta.stato = StatoRichiestaFerie.rifiutata
        richiesta.motivo_rifiuto = payload.motivo_rifiuto
        richiesta.risposta_caposala_id = current_user.id
        richiesta.risposta_caposala_il = datetime.datetime.now(datetime.timezone.utc)
        db.commit()
        db.refresh(richiesta)
        return _to_read(db, richiesta)

    if payload.preferenza_rank is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Indica quale preferenza approvare",
        )
    preferenza = (
        db.query(RichiestaFeriePreferenza)
        .filter(
            RichiestaFeriePreferenza.richiesta_id == richiesta.id,
            RichiestaFeriePreferenza.rank == payload.preferenza_rank,
        )
        .first()
    )
    if preferenza is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Preferenza inesistente"
        )

    giorni = [
        preferenza.data_inizio + datetime.timedelta(days=offset)
        for offset in range(DURATA_SLOT_GIORNI)
    ]

    doppio_turno = (
        db.query(AssegnazioneTurno)
        .join(Turno, AssegnazioneTurno.turno_id == Turno.id)
        .filter(
            AssegnazioneTurno.infermiere_id == richiesta.infermiere_id,
            AssegnazioneTurno.stato == StatoAssegnazione.attiva,
            Turno.data.in_(giorni),
        )
        .first()
    )
    if doppio_turno is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Infermiere gia' assegnato a un turno in una delle date richieste",
        )

    for giorno in giorni:
        turno = (
            db.query(Turno)
            .filter(
                Turno.reparto_id == infermiere.reparto_id,
                Turno.data == giorno,
                Turno.tipo == TipoTurno.ferie_estive,
            )
            .first()
        )
        if turno is None:
            turno = Turno(
                data=giorno,
                tipo=TipoTurno.ferie_estive,
                reparto_id=infermiere.reparto_id,
                ora_inizio=datetime.time(0, 0),
                ora_fine=datetime.time(23, 59),
            )
            db.add(turno)
            db.flush()
        db.add(
            AssegnazioneTurno(
                turno_id=turno.id,
                infermiere_id=richiesta.infermiere_id,
                stato=StatoAssegnazione.attiva,
            )
        )

    richiesta.data_inizio = preferenza.data_inizio
    richiesta.data_fine = preferenza.data_fine
    richiesta.stato = StatoRichiestaFerie.approvata
    richiesta.risposta_caposala_id = current_user.id
    richiesta.risposta_caposala_il = datetime.datetime.now(datetime.timezone.utc)
    db.commit()
    db.refresh(richiesta)
    return _to_read(db, richiesta)
