import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Paziente(Base):
    __tablename__ = "paziente"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nome: Mapped[str] = mapped_column(sa.String(64))
    cognome: Mapped[str] = mapped_column(sa.String(64))
    eta: Mapped[int]
    letto: Mapped[str] = mapped_column(sa.String(16))
    data_ricovero: Mapped[datetime.date]
    diagnosi_ingresso: Mapped[str] = mapped_column(sa.String(512))
    reparto_id: Mapped[int] = mapped_column(sa.ForeignKey("reparto.id"))
    dimesso: Mapped[bool] = mapped_column(default=False)
