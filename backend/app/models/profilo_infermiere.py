import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ProfiloInfermiere(Base):
    __tablename__ = "profilo_infermiere"

    utente_id: Mapped[int] = mapped_column(sa.ForeignKey("utente.id"), primary_key=True)
    ore_contrattuali_mensili: Mapped[int]
