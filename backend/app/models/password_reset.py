import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

EXPIRY = datetime.timedelta(hours=48)


class PasswordResetRequirement(Base):
    __tablename__ = "password_reset_requirement"

    utente_id: Mapped[int] = mapped_column(sa.ForeignKey("utente.id"), primary_key=True)
    created_by_id: Mapped[int] = mapped_column(sa.ForeignKey("utente.id"))
    created_at: Mapped[datetime.datetime] = mapped_column(
        default=lambda: datetime.datetime.now(datetime.UTC)
    )

    def is_expired(self, now: datetime.datetime | None = None) -> bool:
        now = now or datetime.datetime.now(datetime.UTC)
        created_at = self.created_at
        if created_at.tzinfo is None:
            # SQLite drops tzinfo on round-trip; created_at is always written in UTC.
            created_at = created_at.replace(tzinfo=datetime.UTC)
        return now - created_at > EXPIRY
