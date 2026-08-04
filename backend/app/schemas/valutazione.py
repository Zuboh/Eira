import datetime

from pydantic import BaseModel, Field


class ValutazioneNortonCreate(BaseModel):
    data_valutazione: datetime.date
    condizioni_generali: int = Field(ge=1, le=4)
    stato_mentale: int = Field(ge=1, le=4)
    attivita: int = Field(ge=1, le=4)
    mobilita: int = Field(ge=1, le=4)
    incontinenza: int = Field(ge=1, le=4)


class ValutazioneNortonRead(ValutazioneNortonCreate):
    id: int
    paziente_id: int
    autore_id: int
    punteggio_totale: int

    model_config = {"from_attributes": True}


class ValutazioneConleyCreate(BaseModel):
    data_valutazione: datetime.date
    storia_cadute: int = Field(ge=0)
    deficit_visivo: int = Field(ge=0)
    alterazione_eliminazione: int = Field(ge=0)
    agitazione: int = Field(ge=0)
    deficit_vista_osservato: int = Field(ge=0)
    andatura_alterata: int = Field(ge=0)


class ValutazioneConleyRead(ValutazioneConleyCreate):
    id: int
    paziente_id: int
    autore_id: int
    punteggio_totale: int

    model_config = {"from_attributes": True}


class ValutazioniAggregateRead(BaseModel):
    norton: list[ValutazioneNortonRead]
    conley: list[ValutazioneConleyRead]
