from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_
from sqlalchemy.exc import IntegrityError

from app.deps import CurrentUserDep, DbDep, require_roles
from app.models.consegna_sbar import ConsegnaSbar
from app.models.enums import RuoloUtente, StatoAssegnazione
from app.models.paziente import Paziente
from app.models.turno import AssegnazioneTurno, Turno
from app.schemas.consegna_sbar import ConsegnaSbarCreate, ConsegnaSbarRead, ConsegnaSbarUpdate

router = APIRouter(prefix="/consegne-sbar", tags=["consegne-sbar"])


@router.post("/", dependencies=[Depends(require_roles(RuoloUtente.infermiere))])
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


@router.get("/")
def list_consegne(current_user: CurrentUserDep, db: DbDep) -> list[ConsegnaSbarRead]:
    if current_user.ruolo == RuoloUtente.caposala:
        consegne = (
            db.query(ConsegnaSbar)
            .join(Turno, ConsegnaSbar.turno_id == Turno.id)
            .filter(Turno.reparto_id == current_user.reparto_id)
            .order_by(ConsegnaSbar.creata_il.desc())
            .all()
        )
    else:
        consegne = (
            db.query(ConsegnaSbar)
            .join(
                AssegnazioneTurno,
                and_(
                    AssegnazioneTurno.turno_id == ConsegnaSbar.turno_id,
                    AssegnazioneTurno.infermiere_id == current_user.id,
                    AssegnazioneTurno.stato == StatoAssegnazione.attiva,
                ),
            )
            .order_by(ConsegnaSbar.creata_il.desc())
            .all()
        )
    return [ConsegnaSbarRead.model_validate(consegna) for consegna in consegne]


@router.patch("/{consegna_id}", dependencies=[Depends(require_roles(RuoloUtente.infermiere))])
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
