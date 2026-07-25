import datetime
from typing import Annotated

from pydantic import BaseModel, StringConstraints

# Le sezioni CEDEMA sono obbligatorie e non possono essere vuote o solo spazi.
# Il vincolo vive solo su Create: Read resta permissivo per non fallire su righe
# storiche eventualmente incomplete.
SezioneCedema = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class VoceDiarioCedemaBase(BaseModel):
    turno_id: int | None = None
    coscienza: str
    emotivita: str
    dolore: str
    emodinamica: str
    mobilizzazione: str
    allert: str


class VoceDiarioCedemaCreate(VoceDiarioCedemaBase):
    coscienza: SezioneCedema
    emotivita: SezioneCedema
    dolore: SezioneCedema
    emodinamica: SezioneCedema
    mobilizzazione: SezioneCedema
    allert: SezioneCedema


class VoceDiarioCedemaRead(VoceDiarioCedemaBase):
    id: int
    paziente_id: int
    autore_id: int
    timestamp: datetime.datetime

    model_config = {"from_attributes": True}
