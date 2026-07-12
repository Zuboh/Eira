from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, exists
from sqlalchemy.exc import IntegrityError

from app.deps import CurrentUserDep, DbDep, require_roles
from app.models.enums import RuoloUtente, StatoAssegnazione
from app.models.turno import AssegnazioneTurno, Turno
from app.models.utente import Utente
from app.openapi_errors import CONFLICT, FORBIDDEN, NOT_FOUND, UNAUTHORIZED, errors
from app.schemas.turno import (
    AssegnazioneTurnoCreate,
    AssegnazioneTurnoRead,
    TurnoCreate,
    TurnoRead,
)

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
    turni = (
        db.query(Turno)
        .filter(Turno.reparto_id == current_user.reparto_id)
        .order_by(Turno.data)
        .all()
    )
    return [TurnoRead.model_validate(turno) for turno in turni]


@router.get(
    "/scoperti",
    dependencies=[Depends(require_roles(RuoloUtente.caposala))],
    responses=errors(UNAUTHORIZED, FORBIDDEN),
)
def list_turni_scoperti(current_user: CurrentUserDep, db: DbDep) -> list[TurnoRead]:
    coperto = exists().where(
        and_(
            AssegnazioneTurno.turno_id == Turno.id,
            AssegnazioneTurno.stato == StatoAssegnazione.attiva,
        )
    )
    turni = (
        db.query(Turno)
        .filter(Turno.reparto_id == current_user.reparto_id, ~coperto)
        .order_by(Turno.data)
        .all()
    )
    return [TurnoRead.model_validate(turno) for turno in turni]


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
    if infermiere is None or infermiere.reparto_id != current_user.reparto_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Infermiere di un altro reparto"
        )

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
    responses=errors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND),
)
def rimuovi_assegnazione(
    turno_id: int, assegnazione_id: int, current_user: CurrentUserDep, db: DbDep
) -> None:
    assegnazione = db.get(AssegnazioneTurno, assegnazione_id)
    if assegnazione is None or assegnazione.turno_id != turno_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Assegnazione non trovata"
        )
    turno = db.get(Turno, turno_id)
    if turno is None or turno.reparto_id != current_user.reparto_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Turno di un altro reparto")
    db.delete(assegnazione)
    db.commit()


@router.get(
    "/mie-assegnazioni",
    dependencies=[Depends(require_roles(RuoloUtente.infermiere))],
    responses=errors(UNAUTHORIZED, FORBIDDEN),
)
def list_mie_assegnazioni(
    current_user: CurrentUserDep, db: DbDep
) -> list[AssegnazioneTurnoRead]:
    assegnazioni = (
        db.query(AssegnazioneTurno)
        .filter(
            AssegnazioneTurno.infermiere_id == current_user.id,
            AssegnazioneTurno.stato == StatoAssegnazione.attiva,
        )
        .all()
    )
    return [AssegnazioneTurnoRead.model_validate(a) for a in assegnazioni]
