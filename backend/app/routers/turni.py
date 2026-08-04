import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError

from app.deps import CurrentUserDep, DbDep, require_roles
from app.models.cambio_turno import RichiestaCambioTurno
from app.models.enums import (
    RuoloUtente,
    StatoAssegnazione,
    StatoUtente,
)
from app.models.turno import AssegnazioneTurno, Turno
from app.models.utente import Utente
from app.openapi_errors import CONFLICT, FORBIDDEN, NOT_FOUND, UNAUTHORIZED, errors
from app.schemas.turno import (
    AssegnazioneTurnoCreate,
    AssegnazioneTurnoRead,
    ProssimoTurnoConColleghiRead,
    TurnoCalendarioRead,
    TurnoCreate,
    TurnoRead,
)
from app.schemas.utente import UtenteTile
from app.services.turni import (
    COPERTURA_MINIMA_TURNO,
    FINESTRA_CALENDARIO_GIORNI,
    query_turni_scoperti,
)

__all__ = ["COPERTURA_MINIMA_TURNO", "router"]

router = APIRouter(prefix="/turni", tags=["turni"])


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(RuoloUtente.caposala))],
    responses=errors(UNAUTHORIZED, FORBIDDEN, CONFLICT),
)
def create_turno(payload: TurnoCreate, current_user: CurrentUserDep, db: DbDep) -> TurnoRead:
    data = payload.model_dump()
    data["reparto_id"] = current_user.reparto_id
    turno = Turno(**data)
    db.add(turno)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Turno già esistente per questa data/tipo/reparto",
        ) from exc
    db.refresh(turno)
    return TurnoRead.model_validate(turno)


@router.get("/", responses=errors(UNAUTHORIZED))
def list_turni(current_user: CurrentUserDep, db: DbDep) -> list[TurnoRead]:
    turni = db.query(Turno).filter(Turno.reparto_id == current_user.reparto_id).order_by(Turno.data).all()
    return [TurnoRead.model_validate(turno) for turno in turni]


@router.get(
    "/calendario",
    dependencies=[Depends(require_roles(RuoloUtente.caposala))],
    responses=errors(UNAUTHORIZED, FORBIDDEN),
)
def list_calendario_turni(
    current_user: CurrentUserDep,
    db: DbDep,
    da: datetime.date | None = None,
    a: datetime.date | None = None,
) -> list[TurnoCalendarioRead]:
    # senza finestra il calendario spediva ogni turno mai pianificato: default
    # alla settimana corrente, il client sposta la finestra con da/a
    da_data = da or datetime.date.today()
    a_data = a or da_data + datetime.timedelta(days=FINESTRA_CALENDARIO_GIORNI - 1)
    turni = (
        db.query(Turno)
        .filter(
            Turno.reparto_id == current_user.reparto_id,
            Turno.data >= da_data,
            Turno.data <= a_data,
        )
        .order_by(Turno.data)
        .all()
    )
    assegnazioni = (
        db.query(AssegnazioneTurno)
        .join(Turno, AssegnazioneTurno.turno_id == Turno.id)
        .filter(
            Turno.reparto_id == current_user.reparto_id,
            Turno.data >= da_data,
            Turno.data <= a_data,
            AssegnazioneTurno.stato == StatoAssegnazione.attiva,
        )
        .all()
    )
    per_turno: dict[int, list[AssegnazioneTurno]] = {}
    for assegnazione in assegnazioni:
        per_turno.setdefault(assegnazione.turno_id, []).append(assegnazione)

    return [
        TurnoCalendarioRead.model_validate(
            {**TurnoRead.model_validate(turno).model_dump(), "assegnazioni": per_turno.get(turno.id, [])}
        )
        for turno in turni
    ]


@router.get(
    "/scoperti",
    dependencies=[Depends(require_roles(RuoloUtente.caposala))],
    responses=errors(UNAUTHORIZED, FORBIDDEN),
)
def list_turni_scoperti(current_user: CurrentUserDep, db: DbDep) -> list[TurnoRead]:
    turni = query_turni_scoperti(db, current_user.reparto_id, da_data=datetime.date.today())
    return [TurnoRead.model_validate(turno) for turno in turni]


@router.get(
    "/miei-prossimi-turni",
    dependencies=[Depends(require_roles(RuoloUtente.infermiere))],
    responses=errors(UNAUTHORIZED, FORBIDDEN),
)
def list_miei_prossimi_turni(
    current_user: CurrentUserDep, db: DbDep, limit: int = 4
) -> list[ProssimoTurnoConColleghiRead]:
    oggi = datetime.date.today()
    limite = max(1, min(limit, 60))
    miei_turni = (
        db.query(Turno)
        .join(AssegnazioneTurno, AssegnazioneTurno.turno_id == Turno.id)
        .filter(
            Turno.reparto_id == current_user.reparto_id,
            Turno.data >= oggi,
            AssegnazioneTurno.infermiere_id == current_user.id,
            AssegnazioneTurno.stato == StatoAssegnazione.attiva,
        )
        .order_by(Turno.data.asc(), Turno.ora_inizio.asc())
        .limit(limite)
        .all()
    )

    turno_ids = [turno.id for turno in miei_turni]
    colleghi_per_turno: dict[int, list[UtenteTile]] = {turno_id: [] for turno_id in turno_ids}
    if turno_ids:
        assegnazioni_colleghi = (
            db.query(AssegnazioneTurno, Utente)
            .join(Utente, AssegnazioneTurno.infermiere_id == Utente.id)
            .filter(
                AssegnazioneTurno.turno_id.in_(turno_ids),
                AssegnazioneTurno.stato == StatoAssegnazione.attiva,
                AssegnazioneTurno.infermiere_id != current_user.id,
                Utente.reparto_id == current_user.reparto_id,
            )
            .order_by(Utente.cognome.asc(), Utente.nome.asc())
            .all()
        )
        for assegnazione, collega in assegnazioni_colleghi:
            colleghi_per_turno.setdefault(assegnazione.turno_id, []).append(
                UtenteTile.model_validate(collega)
            )

    return [
        ProssimoTurnoConColleghiRead(
            turno=TurnoRead.model_validate(turno),
            colleghi=colleghi_per_turno.get(turno.id, []),
        )
        for turno in miei_turni
    ]


@router.post(
    "/{turno_id}/assegnazioni",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(RuoloUtente.caposala))],
    responses=errors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT),
)
def assegna_turno(
    turno_id: int, payload: AssegnazioneTurnoCreate, current_user: CurrentUserDep, db: DbDep
) -> AssegnazioneTurnoRead:
    turno = db.get(Turno, turno_id)
    if turno is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turno non trovato")
    if turno.reparto_id != current_user.reparto_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Turno di un altro reparto")
    if turno.data < datetime.date.today():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Non è possibile assegnare un turno passato"
        )

    infermiere = db.get(Utente, payload.infermiere_id)
    if (
        infermiere is None
        or infermiere.reparto_id != current_user.reparto_id
        or infermiere.ruolo != RuoloUtente.infermiere
        or infermiere.stato != StatoUtente.attivo
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Infermiere non assegnabile")

    doppio_turno = (
        db.query(AssegnazioneTurno)
        .join(Turno, AssegnazioneTurno.turno_id == Turno.id)
        .filter(
            AssegnazioneTurno.infermiere_id == payload.infermiere_id,
            AssegnazioneTurno.stato == StatoAssegnazione.attiva,
            Turno.data == turno.data,
        )
        .first()
    )
    if doppio_turno is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Infermiere già assegnato a un turno in questa data",
        )

    assegnazione = AssegnazioneTurno(
        turno_id=turno_id, infermiere_id=payload.infermiere_id, stato=StatoAssegnazione.attiva
    )
    db.add(assegnazione)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Assegnazione già esistente per questo turno/infermiere",
        ) from exc
    db.refresh(assegnazione)
    return AssegnazioneTurnoRead.model_validate(assegnazione)


@router.delete(
    "/{turno_id}/assegnazioni",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles(RuoloUtente.caposala))],
    responses=errors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT),
)
def rimuovi_assegnazione(
    turno_id: int, assegnazione_id: int, current_user: CurrentUserDep, db: DbDep
) -> None:
    assegnazione = db.get(AssegnazioneTurno, assegnazione_id)
    if assegnazione is None or assegnazione.turno_id != turno_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assegnazione non trovata")
    turno = db.get(Turno, turno_id)
    if turno is None or turno.reparto_id != current_user.reparto_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Turno di un altro reparto")

    richiesta_collegata = (
        db.query(RichiestaCambioTurno)
        .filter(
            or_(
                RichiestaCambioTurno.assegnazione_turno_id == assegnazione_id,
                RichiestaCambioTurno.assegnazione_collega_id == assegnazione_id,
            ),
        )
        .first()
    )
    if richiesta_collegata is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Esiste una richiesta di cambio turno collegata a questa assegnazione",
        )

    db.delete(assegnazione)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Assegnazione collegata a dati storici non eliminabili",
        ) from exc


@router.get(
    "/mie-assegnazioni",
    dependencies=[Depends(require_roles(RuoloUtente.infermiere))],
    responses=errors(UNAUTHORIZED, FORBIDDEN),
)
def list_mie_assegnazioni(current_user: CurrentUserDep, db: DbDep) -> list[AssegnazioneTurnoRead]:
    assegnazioni = (
        db.query(AssegnazioneTurno)
        .filter(
            AssegnazioneTurno.infermiere_id == current_user.id,
            AssegnazioneTurno.stato == StatoAssegnazione.attiva,
        )
        .all()
    )
    turni_per_id = {
        turno.id: turno for turno in db.query(Turno).filter(Turno.id.in_([a.turno_id for a in assegnazioni]))
    }
    return [
        AssegnazioneTurnoRead(
            id=a.id,
            turno_id=a.turno_id,
            infermiere_id=a.infermiere_id,
            stato=a.stato,
            turno=TurnoRead.model_validate(turni_per_id[a.turno_id]),
        )
        for a in assegnazioni
    ]


@router.get(
    "/assegnazioni-scambiabili",
    dependencies=[Depends(require_roles(RuoloUtente.infermiere))],
    responses=errors(UNAUTHORIZED, FORBIDDEN),
)
def list_assegnazioni_scambiabili(
    current_user: CurrentUserDep,
    db: DbDep,
) -> list[AssegnazioneTurnoRead]:
    oggi = datetime.date.today()
    assegnazioni = (
        db.query(AssegnazioneTurno)
        .join(Turno, AssegnazioneTurno.turno_id == Turno.id)
        .join(Utente, AssegnazioneTurno.infermiere_id == Utente.id)
        .filter(
            Turno.reparto_id == current_user.reparto_id,
            Turno.data >= oggi,
            AssegnazioneTurno.infermiere_id != current_user.id,
            AssegnazioneTurno.stato == StatoAssegnazione.attiva,
            Utente.ruolo == RuoloUtente.infermiere,
            Utente.stato == StatoUtente.attivo,
        )
        .order_by(Turno.data.asc(), Turno.ora_inizio.asc())
        .all()
    )
    turni_per_id = {
        turno.id: turno for turno in db.query(Turno).filter(Turno.id.in_([a.turno_id for a in assegnazioni]))
    }
    return [
        AssegnazioneTurnoRead(
            id=a.id,
            turno_id=a.turno_id,
            infermiere_id=a.infermiere_id,
            stato=a.stato,
            turno=TurnoRead.model_validate(turni_per_id[a.turno_id]),
        )
        for a in assegnazioni
    ]
