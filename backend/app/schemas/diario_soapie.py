import datetime
from typing import Annotated

from pydantic import BaseModel, StringConstraints

# Le sezioni SOAPIE sono obbligatorie e non possono essere vuote o solo spazi.
# Il vincolo vive solo su Create: Read resta permissivo per non fallire su righe
# storiche eventualmente incomplete.
SezioneSoapie = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class VoceDiarioSoapieBase(BaseModel):
    turno_id: int | None = None
    coscienza: str
    emotivita: str
    dolore: str
    emodinamica: str
    mobilizzazione: str
    allert: str


class VoceDiarioSoapieCreate(VoceDiarioSoapieBase):
    coscienza: SezioneSoapie
    emotivita: SezioneSoapie
    dolore: SezioneSoapie
    emodinamica: SezioneSoapie
    mobilizzazione: SezioneSoapie
    allert: SezioneSoapie


class VoceDiarioSoapieRead(VoceDiarioSoapieBase):
    id: int
    paziente_id: int
    autore_id: int
    timestamp: datetime.datetime

    model_config = {"from_attributes": True}
