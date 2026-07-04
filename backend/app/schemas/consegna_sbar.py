import datetime

from pydantic import BaseModel

from app.models.enums import PrioritaConsegna


class ConsegnaSbarCreate(BaseModel):
    paziente_id: int
    turno_id: int
    situation: str
    background: str
    assessment: str
    recommendation: str
    priorita: PrioritaConsegna = PrioritaConsegna.normale


class ConsegnaSbarUpdate(BaseModel):
    situation: str | None = None
    background: str | None = None
    assessment: str | None = None
    recommendation: str | None = None
    priorita: PrioritaConsegna | None = None


class ConsegnaSbarRead(BaseModel):
    id: int
    paziente_id: int
    turno_id: int
    autore_id: int
    situation: str
    background: str
    assessment: str
    recommendation: str
    priorita: PrioritaConsegna
    creata_il: datetime.datetime

    model_config = {"from_attributes": True}
