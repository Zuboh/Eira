import datetime

from fastapi import APIRouter, HTTPException, status

from app.deps import CurrentUserDep, DbDep
from app.models.enums import RuoloUtente, StatoAssegnazione
from app.models.profilo_infermiere import ProfiloInfermiere
from app.models.turno import AssegnazioneTurno, Turno
from app.models.utente import Utente
from app.schemas.banca_ore import BancaOreRead

router = APIRouter(prefix="/banca-ore", tags=["banca-ore"])


def _ore_turno(turno: Turno) -> float:
    inizio = datetime.datetime.combine(turno.data, turno.ora_inizio)
    fine = datetime.datetime.combine(turno.data, turno.ora_fine)
    if fine <= inizio:
        fine += datetime.timedelta(days=1)
    return (fine - inizio).total_seconds() / 3600


@router.get("/{infermiere_id}")
def get_banca_ore(
    infermiere_id: int, mese: str, current_user: CurrentUserDep, db: DbDep
) -> BancaOreRead:
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

    try:
        anno, mese_num = (int(parte) for parte in mese.split("-", 1))
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Formato mese non valido, atteso YYYY-MM"
        ) from exc

    profilo = db.get(ProfiloInfermiere, infermiere_id)
    if profilo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profilo infermiere non trovato"
        )

    turni_mese = (
        db.query(Turno)
        .join(AssegnazioneTurno, AssegnazioneTurno.turno_id == Turno.id)
        .filter(
            AssegnazioneTurno.infermiere_id == infermiere_id,
            AssegnazioneTurno.stato == StatoAssegnazione.attiva,
            Turno.data >= datetime.date(anno, mese_num, 1),
            Turno.data < (datetime.date(anno, mese_num, 1) + datetime.timedelta(days=31)).replace(day=1),
        )
        .all()
    )
    ore_pianificate = sum(_ore_turno(turno) for turno in turni_mese)
    ore_contrattuali = profilo.ore_contrattuali_mensili

    return BancaOreRead(
        infermiere_id=infermiere_id,
        mese=mese,
        ore_pianificate=ore_pianificate,
        ore_contrattuali=ore_contrattuali,
        saldo=ore_pianificate - ore_contrattuali,
    )
