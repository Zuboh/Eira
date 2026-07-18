import datetime

from pydantic import BaseModel

from app.models.enums import StatoRichiestaFerie


class RichiestaFerieCreate(BaseModel):
    preferenze: list[datetime.date]


class PreferenzaFerieRead(BaseModel):
    rank: int
    data_inizio: datetime.date
    data_fine: datetime.date

    model_config = {"from_attributes": True}


class RichiestaFerieRead(BaseModel):
    id: int
    infermiere_id: int
    data_inizio: datetime.date | None = None
    data_fine: datetime.date | None = None
    preferenze: list[PreferenzaFerieRead] = []
    stato: StatoRichiestaFerie
    creata_il: datetime.datetime
    risposta_caposala_id: int | None = None
    risposta_caposala_il: datetime.datetime | None = None
    motivo_rifiuto: str | None = None

    model_config = {"from_attributes": True}


class RispostaFerieRequest(BaseModel):
    accetta: bool
    preferenza_rank: int | None = None
    motivo_rifiuto: str | None = None
