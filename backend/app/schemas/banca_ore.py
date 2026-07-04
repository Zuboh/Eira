from pydantic import BaseModel


class BancaOreRead(BaseModel):
    infermiere_id: int
    mese: str
    ore_pianificate: float
    ore_contrattuali: float
    saldo: float
