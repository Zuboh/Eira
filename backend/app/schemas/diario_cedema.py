import datetime

from pydantic import BaseModel


class VoceDiarioCedemaCreate(BaseModel):
    turno_id: int | None = None
    coscienza: str
    emotivita: str
    dolore: str
    emodinamica: str
    mobilizzazione: str
    allert: str


class VoceDiarioCedemaRead(VoceDiarioCedemaCreate):
    id: int
    paziente_id: int
    autore_id: int
    timestamp: datetime.datetime

    model_config = {"from_attributes": True}
