import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import StatoCoscienza


class ParametriVitali(Base):
    __tablename__ = "parametri_vitali"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    paziente_id: Mapped[int] = mapped_column(sa.ForeignKey("paziente.id"), index=True)
    autore_id: Mapped[int] = mapped_column(sa.ForeignKey("utente.id"))
    turno_id: Mapped[int | None] = mapped_column(sa.ForeignKey("turno.id"), default=None)
    timestamp: Mapped[datetime.datetime] = mapped_column(
        default=lambda: datetime.datetime.now(datetime.UTC)
    )
    temperatura: Mapped[float] = mapped_column(sa.Float)
    frequenza_cardiaca: Mapped[int]
    pressione_sistolica: Mapped[int]
    pressione_diastolica: Mapped[int]
    frequenza_respiratoria: Mapped[int]
    saturazione_o2: Mapped[int]
    stato_coscienza: Mapped[StatoCoscienza] = mapped_column(sa.Enum(StatoCoscienza))
    ossigeno: Mapped[bool] = mapped_column(default=False)
    note: Mapped[str | None] = mapped_column(sa.Text, default=None)
