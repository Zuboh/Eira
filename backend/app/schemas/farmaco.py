import datetime

from pydantic import BaseModel


class FarmacoRead(BaseModel):
    id: int
    nome: str
    unita_misura: str
    categoria: str

    model_config = {"from_attributes": True}


class CarelloFarmacoRead(BaseModel):
    id: int
    farmaco_id: int
    reparto_id: int
    quantita: int
    soglia_minima: int
    prossima_scadenza: datetime.date | None = None
    farmaco: FarmacoRead

    model_config = {"from_attributes": True}


class CarelloFarmacoUpdate(BaseModel):
    delta: int


class MovimentoFarmacoRead(BaseModel):
    id: int
    carello_farmaco_id: int
    farmaco_id: int
    farmaco_nome: str
    autore_id: int
    timestamp: datetime.datetime
    delta: int
    quantita_dopo: int

    model_config = {"from_attributes": True}
