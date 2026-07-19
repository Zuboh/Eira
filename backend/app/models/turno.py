import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import StatoAssegnazione, TipoTurno


class Turno(Base):
    __tablename__ = "turno"
    __table_args__ = (sa.UniqueConstraint("data", "tipo", "reparto_id"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    data: Mapped[datetime.date]
    tipo: Mapped[TipoTurno] = mapped_column(sa.Enum(TipoTurno))
    reparto_id: Mapped[int] = mapped_column(sa.ForeignKey("reparto.id"), index=True)
    ora_inizio: Mapped[datetime.time]
    ora_fine: Mapped[datetime.time]


class AssegnazioneTurno(Base):
    __tablename__ = "assegnazione_turno"
    __table_args__ = (sa.UniqueConstraint("turno_id", "infermiere_id"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    turno_id: Mapped[int] = mapped_column(sa.ForeignKey("turno.id"))
    infermiere_id: Mapped[int] = mapped_column(
        sa.ForeignKey("utente.id"), index=True
    )
    stato: Mapped[StatoAssegnazione] = mapped_column(
        sa.Enum(StatoAssegnazione), default=StatoAssegnazione.attiva, index=True
    )
