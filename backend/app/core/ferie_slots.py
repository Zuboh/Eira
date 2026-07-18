"""Griglia dei blocchi di 2 settimane tra cui l'infermiere sceglie la
preferenza per le ferie estive (giugno-settembre). Le ferie estive non
sono un intervallo di date libero: l'infermiere puo' solo scegliere tra
questi blocchi fissi, che la caposala poi approva o rifiuta.
"""

import datetime

MESE_INIZIO_STAGIONE = 6  # giugno
MESE_FINE_STAGIONE = 9  # settembre
DURATA_SLOT_GIORNI = 14


def _anno_stagione_corrente(oggi: datetime.date) -> int:
    fine_stagione = datetime.date(oggi.year, MESE_FINE_STAGIONE, 30)
    return oggi.year if oggi <= fine_stagione else oggi.year + 1


def slot_ferie_estive(oggi: datetime.date | None = None) -> list[datetime.date]:
    """Date di inizio dei blocchi di 14 giorni della stagione estiva
    (giugno-settembre) corrente o futura."""
    oggi = oggi or datetime.date.today()
    anno = _anno_stagione_corrente(oggi)
    inizio_stagione = datetime.date(anno, MESE_INIZIO_STAGIONE, 1)
    fine_stagione = datetime.date(anno, MESE_FINE_STAGIONE, 30)

    slot = []
    cursore = inizio_stagione
    while cursore + datetime.timedelta(days=DURATA_SLOT_GIORNI - 1) <= fine_stagione:
        slot.append(cursore)
        cursore += datetime.timedelta(days=DURATA_SLOT_GIORNI)
    return slot


def is_slot_valido(data_inizio: datetime.date, oggi: datetime.date | None = None) -> bool:
    return data_inizio in slot_ferie_estive(oggi)
