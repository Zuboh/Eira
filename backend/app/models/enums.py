import enum


class RuoloUtente(str, enum.Enum):
    infermiere = "infermiere"
    caposala = "caposala"


class StatoUtente(str, enum.Enum):
    in_attesa = "in_attesa"
    attivo = "attivo"
    disattivato = "disattivato"


class TipoTurno(str, enum.Enum):
    mattina = "mattina"
    pomeriggio = "pomeriggio"
    notte = "notte"
    riposo = "riposo"
    ferie = "ferie"
    ferie_estive = "ferie_estive"


class StatoAssegnazione(str, enum.Enum):
    attiva = "attiva"


class PrioritaConsegna(str, enum.Enum):
    normale = "normale"
    urgente = "urgente"


class StatoCoscienza(str, enum.Enum):
    vigile = "vigile"
    verbale = "verbale"
    dolore = "dolore"
    coma = "coma"


class StatoCambioTurno(str, enum.Enum):
    in_attesa_collega = "in_attesa_collega"
    rifiutata_collega = "rifiutata_collega"
    in_attesa_caposala = "in_attesa_caposala"
    rifiutata_caposala = "rifiutata_caposala"
    approvata = "approvata"


class StatoRichiestaFerie(str, enum.Enum):
    in_attesa = "in_attesa"
    approvata = "approvata"
    rifiutata = "rifiutata"
