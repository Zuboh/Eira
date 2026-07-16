import datetime

from pydantic import BaseModel

from app.models.enums import StatoAssegnazione, TipoTurno


class TurnoBase(BaseModel):
    data: datetime.date
    tipo: TipoTurno
    reparto_id: int
    ora_inizio: datetime.time
    ora_fine: datetime.time


class TurnoCreate(TurnoBase):
    pass


class TurnoRead(TurnoBase):
    id: int

    model_config = {"from_attributes": True}


class AssegnazioneTurnoCreate(BaseModel):
    infermiere_id: int


class AssegnazioneTurnoRead(BaseModel):
    id: int
    turno_id: int
    infermiere_id: int
    stato: StatoAssegnazione

    model_config = {"from_attributes": True}


class TurnoCalendarioRead(TurnoBase):
    id: int
    assegnazioni: list[AssegnazioneTurnoRead]

    model_config = {"from_attributes": True}
