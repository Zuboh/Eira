from pydantic import BaseModel

from app.schemas.cambio_turno import RichiestaCambioTurnoRead
from app.schemas.turno import TurnoRead


class DashboardCaposala(BaseModel):
    turni_scoperti: list[TurnoRead]
    turni_scoperti_count: int
    cambi_turno_in_attesa: list[RichiestaCambioTurnoRead]
    cambi_turno_in_attesa_count: int
