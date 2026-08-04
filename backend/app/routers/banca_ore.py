import datetime
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from app.deps import CurrentUserDep, DbDep
from app.models.enums import RuoloUtente, StatoAssegnazione, TipoTurno
from app.models.profilo_infermiere import ProfiloInfermiere
from app.models.turno import AssegnazioneTurno, Turno
from app.models.utente import Utente
from app.openapi_errors import BAD_REQUEST, FORBIDDEN, NOT_FOUND, UNAUTHORIZED, errors
from app.schemas.banca_ore import BancaOreRead

router = APIRouter(prefix="/banca-ore", tags=["banca-ore"])


def _ore_turno(turno: Turno) -> float:
    if turno.tipo == TipoTurno.riposo:
        return 0.0
    inizio = datetime.datetime.combine(turno.data, turno.ora_inizio)
    fine = datetime.datetime.combine(turno.data, turno.ora_fine)
    if fine <= inizio:
        fine += datetime.timedelta(days=1)
    return (fine - inizio).total_seconds() / 3600


@router.get(
    "/{infermiere_id}", responses=errors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND, BAD_REQUEST)
)
def get_banca_ore(
    infermiere_id: int,
    mese: Annotated[str, Query(pattern=r"^\d{4}-(0[1-9]|1[0-2])$")],
    current_user: CurrentUserDep,
    db: DbDep,
) -> BancaOreRead:
    """Saldo ore mensile: ore effettuate (da turni assegnati attivi, dall'inizio del
    mese fino a oggi incluso) meno ore contrattuali.

    L'infermiere può consultare solo la propria banca ore; la caposala solo
    quella degli infermieri del proprio reparto. `mese` nel formato `YYYY-MM`.
    """
    if current_user.ruolo == RuoloUtente.infermiere and current_user.id != infermiere_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Puoi consultare solo la tua banca ore",
        )
    if current_user.ruolo == RuoloUtente.caposala:
        infermiere = db.get(Utente, infermiere_id)
        if infermiere is None or infermiere.reparto_id != current_user.reparto_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Infermiere di un altro reparto",
            )

    anno, mese_num = (int(parte) for parte in mese.split("-", 1))
    try:
        inizio_mese = datetime.date(anno, mese_num, 1)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Formato mese non valido, atteso YYYY-MM",
        ) from exc

    profilo = db.get(ProfiloInfermiere, infermiere_id)
    if profilo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profilo infermiere non trovato"
        )

    oggi = datetime.date.today()
    fine_mese = (inizio_mese + datetime.timedelta(days=31)).replace(day=1)
    fine_periodo = min(oggi + datetime.timedelta(days=1), fine_mese)

    turni_mese = (
        db.query(Turno)
        .join(AssegnazioneTurno, AssegnazioneTurno.turno_id == Turno.id)
        .filter(
            AssegnazioneTurno.infermiere_id == infermiere_id,
            AssegnazioneTurno.stato == StatoAssegnazione.attiva,
            Turno.data >= inizio_mese,
            Turno.data < fine_periodo,
        )
        .all()
    )
    ore_effettuate = sum(_ore_turno(turno) for turno in turni_mese)
    ore_contrattuali = profilo.ore_contrattuali_mensili

    return BancaOreRead(
        infermiere_id=infermiere_id,
        mese=mese,
        ore_effettuate=ore_effettuate,
        ore_contrattuali=ore_contrattuali,
        saldo=ore_effettuate - ore_contrattuali,
    )
