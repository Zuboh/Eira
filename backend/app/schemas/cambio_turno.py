import datetime

from pydantic import BaseModel

from app.models.enums import StatoCambioTurno
from app.schemas.turno import TurnoRead


class RichiestaCambioTurnoCreate(BaseModel):
    assegnazione_turno_id: int
    collega_id: int
    assegnazione_collega_id: int | None = None


class RichiestaCambioTurnoRead(BaseModel):
    id: int
    assegnazione_turno_id: int
    assegnazione_collega_id: int | None = None
    richiedente_id: int
    collega_id: int
    turno_richiedente: TurnoRead
    turno_collega: TurnoRead | None = None
    stato: StatoCambioTurno
    creata_il: datetime.datetime
    risposta_collega_il: datetime.datetime | None = None
    risposta_caposala_id: int | None = None
    risposta_caposala_il: datetime.datetime | None = None
    motivo_rifiuto: str | None = None

    model_config = {"from_attributes": True}


class RispostaCollegaRequest(BaseModel):
    accetta: bool


class RispostaCaposalaRequest(BaseModel):
    accetta: bool
    motivo_rifiuto: str | None = None
