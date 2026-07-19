import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ValutazioneNorton(Base):
    __tablename__ = "valutazione_norton"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    paziente_id: Mapped[int] = mapped_column(sa.ForeignKey("paziente.id"), index=True)
    autore_id: Mapped[int] = mapped_column(sa.ForeignKey("utente.id"))
    data_valutazione: Mapped[datetime.date]
    condizioni_generali: Mapped[int]
    stato_mentale: Mapped[int]
    attivita: Mapped[int]
    mobilita: Mapped[int]
    incontinenza: Mapped[int]
    punteggio_totale: Mapped[int]


class ValutazioneConley(Base):
    __tablename__ = "valutazione_conley"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    paziente_id: Mapped[int] = mapped_column(sa.ForeignKey("paziente.id"), index=True)
    autore_id: Mapped[int] = mapped_column(sa.ForeignKey("utente.id"))
    data_valutazione: Mapped[datetime.date]
    storia_cadute: Mapped[int]
    deficit_visivo: Mapped[int]
    alterazione_eliminazione: Mapped[int]
    agitazione: Mapped[int]
    deficit_vista_osservato: Mapped[int]
    andatura_alterata: Mapped[int]
    punteggio_totale: Mapped[int]
