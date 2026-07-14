import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class PasswordResetRequirement(Base):
    __tablename__ = "password_reset_requirement"

    utente_id: Mapped[int] = mapped_column(sa.ForeignKey("utente.id"), primary_key=True)
    created_by_id: Mapped[int] = mapped_column(sa.ForeignKey("utente.id"))
    created_at: Mapped[datetime.datetime] = mapped_column(
        default=lambda: datetime.datetime.now(datetime.UTC)
    )
