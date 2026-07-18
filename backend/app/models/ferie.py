import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import StatoRichiestaFerie


class RichiestaFerie(Base):
    __tablename__ = "richiesta_ferie"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    infermiere_id: Mapped[int] = mapped_column(sa.ForeignKey("utente.id"))
    data_inizio: Mapped[datetime.date | None] = mapped_column(default=None)
    data_fine: Mapped[datetime.date | None] = mapped_column(default=None)
    stato: Mapped[StatoRichiestaFerie] = mapped_column(
        sa.Enum(StatoRichiestaFerie), default=StatoRichiestaFerie.in_attesa
    )
    creata_il: Mapped[datetime.datetime] = mapped_column(
        default=lambda: datetime.datetime.now(datetime.timezone.utc)
    )
    risposta_caposala_id: Mapped[int | None] = mapped_column(
        sa.ForeignKey("utente.id"), default=None
    )
    risposta_caposala_il: Mapped[datetime.datetime | None] = mapped_column(default=None)
    motivo_rifiuto: Mapped[str | None] = mapped_column(sa.String(512), default=None)


class RichiestaFeriePreferenza(Base):
    __tablename__ = "richiesta_ferie_preferenza"
    __table_args__ = (sa.UniqueConstraint("richiesta_id", "rank"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    richiesta_id: Mapped[int] = mapped_column(sa.ForeignKey("richiesta_ferie.id"))
    rank: Mapped[int]
    data_inizio: Mapped[datetime.date]
    data_fine: Mapped[datetime.date]
