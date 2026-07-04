import datetime

from pydantic import BaseModel


class PazienteBase(BaseModel):
    nome: str
    cognome: str
    eta: int
    letto: str
    data_ricovero: datetime.date
    diagnosi_ingresso: str
    reparto_id: int


class PazienteCreate(PazienteBase):
    pass


class PazienteUpdate(BaseModel):
    letto: str | None = None
    diagnosi_ingresso: str | None = None
    dimesso: bool | None = None


class PazienteRead(PazienteBase):
    id: int
    dimesso: bool

    model_config = {"from_attributes": True}
