import datetime
from typing import Annotated

from pydantic import BaseModel, StringConstraints

from app.models.enums import PrioritaConsegna

# Le sezioni SBAR sono obbligatorie e non possono essere vuote o solo spazi.
# Vincolo sul boundary: la validazione frontend resta UX.
SezioneSbar = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class ConsegnaSbarCreate(BaseModel):
    paziente_id: int
    turno_id: int
    situation: SezioneSbar
    background: SezioneSbar
    assessment: SezioneSbar
    recommendation: SezioneSbar
    priorita: PrioritaConsegna = PrioritaConsegna.normale


class ConsegnaSbarUpdate(BaseModel):
    situation: SezioneSbar | None = None
    background: SezioneSbar | None = None
    assessment: SezioneSbar | None = None
    recommendation: SezioneSbar | None = None
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


class ConsegneSbarPage(BaseModel):
    items: list[ConsegnaSbarRead]
    total: int
