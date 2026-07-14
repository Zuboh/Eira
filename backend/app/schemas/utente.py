from pydantic import BaseModel

from app.models.enums import RuoloUtente, StatoUtente


class UtenteBase(BaseModel):
    nome: str
    cognome: str
    email: str
    ruolo: RuoloUtente
    reparto_id: int


class UtenteCreate(UtenteBase):
    password: str


class UtenteUpdate(BaseModel):
    nome: str | None = None
    cognome: str | None = None
    stato: StatoUtente | None = None


class UtenteRead(UtenteBase):
    id: int
    stato: StatoUtente

    model_config = {"from_attributes": True}


class UtenteTile(BaseModel):
    id: int
    nome: str
    cognome: str
    ruolo: RuoloUtente

    model_config = {"from_attributes": True}


class UtenteRegister(BaseModel):
    email: str
    password: str
    nome: str
    cognome: str
    reparto_id: int


class TemporaryPasswordResponse(BaseModel):
    temporary_password: str
