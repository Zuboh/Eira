import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import PrioritaConsegna


class ConsegnaSbar(Base):
    __tablename__ = "consegna_sbar"
    __table_args__ = (sa.UniqueConstraint("paziente_id", "turno_id"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    paziente_id: Mapped[int] = mapped_column(sa.ForeignKey("paziente.id"))
    turno_id: Mapped[int] = mapped_column(sa.ForeignKey("turno.id"), index=True)
    autore_id: Mapped[int] = mapped_column(sa.ForeignKey("utente.id"))
    situation: Mapped[str] = mapped_column(sa.Text)
    background: Mapped[str] = mapped_column(sa.Text)
    assessment: Mapped[str] = mapped_column(sa.Text)
    recommendation: Mapped[str] = mapped_column(sa.Text)
    priorita: Mapped[PrioritaConsegna] = mapped_column(
        sa.Enum(PrioritaConsegna), default=PrioritaConsegna.normale
    )
    creata_il: Mapped[datetime.datetime] = mapped_column(
        default=lambda: datetime.datetime.now(datetime.UTC)
    )
