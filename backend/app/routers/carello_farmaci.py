from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import joinedload

from app.deps import CurrentUserDep, DbDep, require_roles
from app.models.enums import RuoloUtente
from app.models.farmaco import CarelloFarmaco, Farmaco, MovimentoFarmaco
from app.openapi_errors import FORBIDDEN, NOT_FOUND, UNAUTHORIZED, errors
from app.schemas.farmaco import CarelloFarmacoRead, CarelloFarmacoUpdate, MovimentoFarmacoRead

router = APIRouter(prefix="/carello-farmaci", tags=["carello-farmaci"])
ROLE_CON_ACCESSO = (RuoloUtente.infermiere, RuoloUtente.caposala)


def _get_carello_same_reparto(carello_id: int, current_user, db) -> CarelloFarmaco:
    carello = (
        db.query(CarelloFarmaco)
        .options(joinedload(CarelloFarmaco.farmaco))
        .filter(CarelloFarmaco.id == carello_id)
        .first()
    )
    if carello is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farmaco non trovato")
    if carello.reparto_id != current_user.reparto_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Farmaco di un altro reparto"
        )
    return carello


@router.get(
    "/",
    dependencies=[Depends(require_roles(*ROLE_CON_ACCESSO))],
    responses=errors(UNAUTHORIZED, FORBIDDEN),
)
def list_carello_farmaci(
    current_user: CurrentUserDep,
    db: DbDep,
    search: str | None = Query(default=None),
    categoria: str | None = Query(default=None),
) -> list[CarelloFarmacoRead]:
    query = (
        db.query(CarelloFarmaco)
        .join(Farmaco, CarelloFarmaco.farmaco_id == Farmaco.id)
        .options(joinedload(CarelloFarmaco.farmaco))
        .filter(CarelloFarmaco.reparto_id == current_user.reparto_id)
    )
    if search:
        query = query.filter(Farmaco.nome.ilike(f"%{search}%"))
    if categoria:
        query = query.filter(Farmaco.categoria == categoria)

    righe = query.order_by(Farmaco.nome.asc()).all()
    return [CarelloFarmacoRead.model_validate(riga) for riga in righe]


@router.get(
    "/movimenti",
    dependencies=[Depends(require_roles(*ROLE_CON_ACCESSO))],
    responses=errors(UNAUTHORIZED, FORBIDDEN),
)
def list_movimenti_farmaci(
    current_user: CurrentUserDep,
    db: DbDep,
    farmaco_id: int | None = Query(default=None),
) -> list[MovimentoFarmacoRead]:
    query = (
        db.query(MovimentoFarmaco)
        .join(CarelloFarmaco, MovimentoFarmaco.carello_farmaco_id == CarelloFarmaco.id)
        .join(Farmaco, CarelloFarmaco.farmaco_id == Farmaco.id)
        .filter(CarelloFarmaco.reparto_id == current_user.reparto_id)
    )
    if farmaco_id is not None:
        query = query.filter(CarelloFarmaco.farmaco_id == farmaco_id)

    movimenti = query.order_by(MovimentoFarmaco.timestamp.desc()).all()
    return [
        MovimentoFarmacoRead(
            id=movimento.id,
            carello_farmaco_id=movimento.carello_farmaco_id,
            farmaco_id=movimento.carello_farmaco.farmaco_id,
            farmaco_nome=movimento.carello_farmaco.farmaco.nome,
            autore_id=movimento.autore_id,
            timestamp=movimento.timestamp,
            delta=movimento.delta,
            quantita_dopo=movimento.quantita_dopo,
        )
        for movimento in movimenti
    ]


@router.patch(
    "/{carello_id}",
    dependencies=[Depends(require_roles(*ROLE_CON_ACCESSO))],
    responses=errors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND),
)
def update_carello_farmaco(
    carello_id: int, payload: CarelloFarmacoUpdate, current_user: CurrentUserDep, db: DbDep
) -> CarelloFarmacoRead:
    carello = _get_carello_same_reparto(carello_id, current_user, db)
    nuova_quantita = max(0, carello.quantita + payload.delta)
    delta_effettivo = nuova_quantita - carello.quantita
    carello.quantita = nuova_quantita
    db.add(
        MovimentoFarmaco(
            carello_farmaco_id=carello.id,
            autore_id=current_user.id,
            delta=delta_effettivo,
            quantita_dopo=nuova_quantita,
        )
    )
    db.commit()
    db.refresh(carello)
    return CarelloFarmacoRead.model_validate(carello)
