import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import RuoloUtente, StatoUtente


class Utente(Base):
    __tablename__ = "utente"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(sa.String(256), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(sa.String(256))
    nome: Mapped[str] = mapped_column(sa.String(64))
    cognome: Mapped[str] = mapped_column(sa.String(64))
    ruolo: Mapped[RuoloUtente] = mapped_column(sa.Enum(RuoloUtente))
    reparto_id: Mapped[int] = mapped_column(sa.ForeignKey("reparto.id"))
    stato: Mapped[StatoUtente] = mapped_column(
        sa.Enum(StatoUtente), default=StatoUtente.attivo
    )
