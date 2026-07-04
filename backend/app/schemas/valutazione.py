import datetime

from pydantic import BaseModel


class ValutazioneNortonCreate(BaseModel):
    data_valutazione: datetime.date
    condizioni_generali: int
    stato_mentale: int
    attivita: int
    mobilita: int
    incontinenza: int


class ValutazioneNortonRead(ValutazioneNortonCreate):
    id: int
    paziente_id: int
    autore_id: int
    punteggio_totale: int

    model_config = {"from_attributes": True}


class ValutazioneConleyCreate(BaseModel):
    data_valutazione: datetime.date
    storia_cadute: int
    deficit_visivo: int
    alterazione_eliminazione: int
    agitazione: int
    deficit_vista_osservato: int
    andatura_alterata: int


class ValutazioneConleyRead(ValutazioneConleyCreate):
    id: int
    paziente_id: int
    autore_id: int
    punteggio_totale: int

    model_config = {"from_attributes": True}


class ValutazioniAggregateRead(BaseModel):
    norton: list[ValutazioneNortonRead]
    conley: list[ValutazioneConleyRead]
