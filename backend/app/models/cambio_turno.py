import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import StatoCambioTurno


class RichiestaCambioTurno(Base):
    __tablename__ = "richiesta_cambio_turno"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    assegnazione_turno_id: Mapped[int] = mapped_column(sa.ForeignKey("assegnazione_turno.id"))
    richiedente_id: Mapped[int] = mapped_column(sa.ForeignKey("utente.id"))
    collega_id: Mapped[int] = mapped_column(sa.ForeignKey("utente.id"))
    stato: Mapped[StatoCambioTurno] = mapped_column(
        sa.Enum(StatoCambioTurno), default=StatoCambioTurno.in_attesa_collega
    )
    creata_il: Mapped[datetime.datetime] = mapped_column(
        default=lambda: datetime.datetime.now(datetime.timezone.utc)
    )
    risposta_collega_il: Mapped[datetime.datetime | None] = mapped_column(default=None)
    risposta_caposala_id: Mapped[int | None] = mapped_column(
        sa.ForeignKey("utente.id"), default=None
    )
    risposta_caposala_il: Mapped[datetime.datetime | None] = mapped_column(default=None)
    motivo_rifiuto: Mapped[str | None] = mapped_column(sa.String(512), default=None)
