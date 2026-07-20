import datetime

from pydantic import BaseModel

from app.models.enums import StatoCoscienza


class ParametriVitaliCreate(BaseModel):
    turno_id: int | None = None
    temperatura: float
    frequenza_cardiaca: int
    pressione_sistolica: int
    pressione_diastolica: int
    frequenza_respiratoria: int
    saturazione_o2: int
    stato_coscienza: StatoCoscienza
    ossigeno: bool = False
    note: str | None = None


class ParametriVitaliRead(ParametriVitaliCreate):
    id: int
    paziente_id: int
    autore_id: int
    timestamp: datetime.datetime

    model_config = {"from_attributes": True}
