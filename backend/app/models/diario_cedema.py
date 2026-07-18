import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class VoceDiarioCedema(Base):
    __tablename__ = "voce_diario_cedema"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    paziente_id: Mapped[int] = mapped_column(sa.ForeignKey("paziente.id"))
    autore_id: Mapped[int] = mapped_column(sa.ForeignKey("utente.id"))
    turno_id: Mapped[int | None] = mapped_column(sa.ForeignKey("turno.id"), default=None)
    timestamp: Mapped[datetime.datetime] = mapped_column(
        default=lambda: datetime.datetime.now(datetime.UTC)
    )
    coscienza: Mapped[str] = mapped_column(sa.Text)
    emotivita: Mapped[str] = mapped_column(sa.Text)
    dolore: Mapped[str] = mapped_column(sa.Text)
    emodinamica: Mapped[str] = mapped_column(sa.Text)
    mobilizzazione: Mapped[str] = mapped_column(sa.Text)
    allert: Mapped[str] = mapped_column(sa.Text)
