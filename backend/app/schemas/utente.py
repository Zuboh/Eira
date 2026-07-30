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
    avatar_url: str | None = None

    model_config = {"from_attributes": True}


class MeRead(UtenteRead):
    """Sessione corrente: aggiunge il nome del reparto, che il client mostra
    in sidebar e dashboard. Separato da UtenteRead per non caricare il join
    anche sulle liste utenti."""

    reparto_nome: str | None


class UtenteTile(BaseModel):
    id: int
    nome: str
    cognome: str
    ruolo: RuoloUtente
    avatar_url: str | None = None

    model_config = {"from_attributes": True}


class UtenteRegister(BaseModel):
    email: str
    password: str
    nome: str
    cognome: str
    reparto_id: int


class TemporaryPasswordResponse(BaseModel):
    temporary_password: str
