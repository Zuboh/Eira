import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, func
from sqlalchemy.exc import IntegrityError

from app.deps import CurrentUserDep, DbDep, require_roles
from app.models.cambio_turno import RichiestaCambioTurno
from app.models.enums import RuoloUtente, StatoAssegnazione, StatoCambioTurno
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

COPERTURA_MINIMA_TURNO = 2

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
def list_calendario_turni(current_user: CurrentUserDep, db: DbDep) -> list[TurnoCalendarioRead]:
    turni = db.query(Turno).filter(Turno.reparto_id == current_user.reparto_id).order_by(Turno.data).all()
    assegnazioni = (
        db.query(AssegnazioneTurno)
        .join(Turno, AssegnazioneTurno.turno_id == Turno.id)
        .filter(
            Turno.reparto_id == current_user.reparto_id,
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
    turni = (
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
        .filter(Turno.reparto_id == current_user.reparto_id)
        .group_by(Turno.id)
        .having(func.count(Utente.id) < COPERTURA_MINIMA_TURNO)
        .order_by(Turno.data)
        .all()
    )
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
    limite = max(1, min(limit, 10))
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

    infermiere = db.get(Utente, payload.infermiere_id)
    if (
        infermiere is None
        or infermiere.reparto_id != current_user.reparto_id
        or infermiere.ruolo != RuoloUtente.infermiere
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

    richiesta_pendente = (
        db.query(RichiestaCambioTurno)
        .filter(
            RichiestaCambioTurno.assegnazione_turno_id == assegnazione_id,
            RichiestaCambioTurno.stato.in_(
                (StatoCambioTurno.in_attesa_collega, StatoCambioTurno.in_attesa_caposala)
            ),
        )
        .first()
    )
    if richiesta_pendente is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Esiste una richiesta di cambio turno pendente su questa assegnazione",
        )

    db.delete(assegnazione)
    db.commit()


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
    return [AssegnazioneTurnoRead.model_validate(a) for a in assegnazioni]
