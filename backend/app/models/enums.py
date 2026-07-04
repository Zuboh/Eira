import enum


class RuoloUtente(str, enum.Enum):
    infermiere = "infermiere"
    caposala = "caposala"


class TipoTurno(str, enum.Enum):
    mattina = "mattina"
    pomeriggio = "pomeriggio"
    notte = "notte"


class StatoAssegnazione(str, enum.Enum):
    attiva = "attiva"
    cambiata = "cambiata"


class PrioritaConsegna(str, enum.Enum):
    normale = "normale"
    urgente = "urgente"


class StatoCambioTurno(str, enum.Enum):
    in_attesa_collega = "in_attesa_collega"
    rifiutata_collega = "rifiutata_collega"
    in_attesa_caposala = "in_attesa_caposala"
    rifiutata_caposala = "rifiutata_caposala"
    approvata = "approvata"
