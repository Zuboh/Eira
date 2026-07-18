from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, func
from sqlalchemy.exc import IntegrityError

from app.deps import CurrentUserDep, DbDep, require_roles
from app.models.consegna_sbar import ConsegnaSbar
from app.models.enums import RuoloUtente, StatoAssegnazione
from app.models.paziente import Paziente
from app.models.turno import AssegnazioneTurno, Turno
from app.openapi_errors import CONFLICT, FORBIDDEN, NOT_FOUND, UNAUTHORIZED, errors
from app.schemas.consegna_sbar import (
    ConsegnaSbarCreate,
    ConsegnaSbarRead,
    ConsegnaSbarUpdate,
    ConsegneSbarPage,
)

router = APIRouter(prefix="/consegne-sbar", tags=["consegne-sbar"])


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(RuoloUtente.infermiere))],
    responses=errors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT),
)
def create_consegna(
    payload: ConsegnaSbarCreate, current_user: CurrentUserDep, db: DbDep
) -> ConsegnaSbarRead:
    turno = db.get(Turno, payload.turno_id)
    if turno is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turno non trovato")
    if turno.reparto_id != current_user.reparto_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Turno di un altro reparto")

    assegnazione = (
        db.query(AssegnazioneTurno)
        .filter(
            AssegnazioneTurno.turno_id == payload.turno_id,
            AssegnazioneTurno.infermiere_id == current_user.id,
            AssegnazioneTurno.stato == StatoAssegnazione.attiva,
        )
        .first()
    )
    if assegnazione is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Non sei assegnata a questo turno"
        )

    paziente = db.get(Paziente, payload.paziente_id)
    if paziente is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paziente non trovato")
    if paziente.reparto_id != current_user.reparto_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Paziente di un altro reparto"
        )

    consegna = ConsegnaSbar(**payload.model_dump(), autore_id=current_user.id)
    db.add(consegna)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Consegna già esistente per questo paziente/turno",
        ) from exc
    db.refresh(consegna)
    return ConsegnaSbarRead.model_validate(consegna)


@router.get("/", responses=errors(UNAUTHORIZED))
def list_consegne(
    current_user: CurrentUserDep,
    db: DbDep,
    skip: int = Query(0, ge=0),
    limit: int = Query(25, ge=1, le=200),
) -> ConsegneSbarPage:
    if current_user.ruolo == RuoloUtente.caposala:
        query = (
            db.query(ConsegnaSbar)
            .join(Turno, ConsegnaSbar.turno_id == Turno.id)
            .filter(Turno.reparto_id == current_user.reparto_id)
        )
    else:
        query = db.query(ConsegnaSbar).join(
            AssegnazioneTurno,
            and_(
                AssegnazioneTurno.turno_id == ConsegnaSbar.turno_id,
                AssegnazioneTurno.infermiere_id == current_user.id,
                AssegnazioneTurno.stato == StatoAssegnazione.attiva,
            ),
        )

    total = query.with_entities(func.count()).scalar() or 0
    consegne = query.order_by(ConsegnaSbar.creata_il.desc()).offset(skip).limit(limit).all()
    return ConsegneSbarPage(
        items=[ConsegnaSbarRead.model_validate(consegna) for consegna in consegne],
        total=total,
    )


@router.patch(
    "/{consegna_id}",
    dependencies=[Depends(require_roles(RuoloUtente.infermiere))],
    responses=errors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND),
)
def update_consegna(
    consegna_id: int, payload: ConsegnaSbarUpdate, current_user: CurrentUserDep, db: DbDep
) -> ConsegnaSbarRead:
    consegna = db.get(ConsegnaSbar, consegna_id)
    if consegna is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consegna non trovata")
    if consegna.autore_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo l'autrice può modificare questa consegna",
        )

    if payload.situation is not None:
        consegna.situation = payload.situation
    if payload.background is not None:
        consegna.background = payload.background
    if payload.assessment is not None:
        consegna.assessment = payload.assessment
    if payload.recommendation is not None:
        consegna.recommendation = payload.recommendation
    if payload.priorita is not None:
        consegna.priorita = payload.priorita
    db.commit()
    db.refresh(consegna)
    return ConsegnaSbarRead.model_validate(consegna)
