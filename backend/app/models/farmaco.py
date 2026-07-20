import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Farmaco(Base):
    __tablename__ = "farmaco"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nome: Mapped[str] = mapped_column(sa.String(120), unique=True, index=True)
    unita_misura: Mapped[str] = mapped_column(sa.String(40))
    categoria: Mapped[str] = mapped_column(sa.String(80), index=True)


class CarelloFarmaco(Base):
    __tablename__ = "carello_farmaco"
    __table_args__ = (sa.UniqueConstraint("farmaco_id", "reparto_id"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    farmaco_id: Mapped[int] = mapped_column(sa.ForeignKey("farmaco.id"))
    reparto_id: Mapped[int] = mapped_column(sa.ForeignKey("reparto.id"), index=True)
    quantita: Mapped[int] = mapped_column(default=0)
    soglia_minima: Mapped[int] = mapped_column(default=0)
    prossima_scadenza: Mapped[datetime.date | None] = mapped_column(default=None)

    farmaco: Mapped[Farmaco] = relationship()


class MovimentoFarmaco(Base):
    __tablename__ = "movimento_farmaco"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    carello_farmaco_id: Mapped[int] = mapped_column(sa.ForeignKey("carello_farmaco.id"), index=True)
    autore_id: Mapped[int] = mapped_column(sa.ForeignKey("utente.id"))
    timestamp: Mapped[datetime.datetime] = mapped_column(
        default=lambda: datetime.datetime.now(datetime.UTC), index=True
    )
    delta: Mapped[int] = mapped_column()
    quantita_dopo: Mapped[int] = mapped_column()

    carello_farmaco: Mapped[CarelloFarmaco] = relationship()
