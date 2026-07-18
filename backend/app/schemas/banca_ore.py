from pydantic import BaseModel


class BancaOreRead(BaseModel):
    infermiere_id: int
    mese: str
    ore_effettuate: float
    ore_contrattuali: float
    saldo: float
