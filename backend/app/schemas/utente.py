from pydantic import BaseModel

from app.models.enums import RuoloUtente


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
    attivo: bool | None = None


class UtenteRead(UtenteBase):
    id: int
    attivo: bool

    model_config = {"from_attributes": True}
