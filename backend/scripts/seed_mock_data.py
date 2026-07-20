"""Popola il DB dev con dati fittizi realistici per visualizzare tutte le view.

Esegue un wipe completo delle tabelle e le ripopola con reparti, personale,
pazienti, turni, assegnazioni, richieste di cambio turno, consegne SBAR,
diario CEDEMA, valutazioni Norton/Conley e carello farmaci.

Uso: da backend/  ->  uv run python scripts/seed_mock_data.py
"""

import datetime
import random
import unicodedata

from faker import Faker

import app.models  # noqa: F401 — registra tutti i modelli su Base.metadata
from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.models.cambio_turno import RichiestaCambioTurno
from app.models.consegna_sbar import ConsegnaSbar
from app.models.diario_cedema import VoceDiarioCedema
from app.models.farmaco import CarelloFarmaco, Farmaco
from app.models.enums import (
    PrioritaConsegna,
    RuoloUtente,
    StatoAssegnazione,
    StatoCambioTurno,
    StatoUtente,
    TipoTurno,
)
from app.models.paziente import Paziente
from app.models.profilo_infermiere import ProfiloInfermiere
from app.models.reparto import Reparto
from app.models.turno import AssegnazioneTurno, Turno
from app.models.utente import Utente
from app.models.valutazione import ValutazioneConley, ValutazioneNorton

SEED = 20260716
random.seed(SEED)
fake = Faker("it_IT")
Faker.seed(SEED)

UTC = datetime.UTC
OGGI = datetime.date.today()

TURNI_ORARI = {
    TipoTurno.mattina: (datetime.time(6, 0), datetime.time(14, 0)),
    TipoTurno.pomeriggio: (datetime.time(14, 0), datetime.time(22, 0)),
    TipoTurno.notte: (datetime.time(22, 0), datetime.time(6, 0)),
    TipoTurno.riposo: (datetime.time(0, 0), datetime.time(0, 0)),
}

DIAGNOSI = [
    "Polmonite in BPCO riacutizzata",
    "Frattura del collo del femore post-caduta",
    "Scompenso cardiaco congestizio",
    "Ictus ischemico in fase riabilitativa",
    "Diabete mellito tipo 2 scompensato",
    "Insufficienza renale cronica in trattamento conservativo",
    "Sepsi da infezione delle vie urinarie",
    "Post-operatorio di colecistectomia laparoscopica",
    "Anemia sideropenica da sanguinamento gastrointestinale",
    "Delirium in paziente con demenza vascolare",
    "Ulcera da pressione stadio II in trattamento",
    "Fibrillazione atriale di nuova insorgenza",
    "Riacutizzazione di artrite reumatoide",
    "Trauma cranico lieve in osservazione",
    "Post-operatorio di protesi d'anca",
]

REPARTI_NOMI = [
    settings.seed_reparto_nome,
    settings.seed_secondo_reparto_nome,
    "Cardiologia",
]

ORE_CONTRATTUALI = [100, 130, 150, 168]


def slugify(text: str) -> str:
    nfkd = unicodedata.normalize("NFKD", text)
    ascii_text = nfkd.encode("ascii", "ignore").decode("ascii")
    return ascii_text.lower().replace(" ", "").replace("'", "")


def wipe_and_create_schema() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def crea_reparti(db) -> list[Reparto]:
    reparti = [Reparto(nome=nome) for nome in REPARTI_NOMI]
    db.add_all(reparti)
    db.flush()
    return reparti


def crea_caposale(db, reparti: list[Reparto]) -> list[Utente]:
    caposale = [
        Utente(
            email="caposala@eira.local",
            password_hash=hash_password(settings.seed_caposala_password),
            nome=settings.seed_caposala_nome,
            cognome=settings.seed_caposala_cognome,
            ruolo=RuoloUtente.caposala,
            reparto_id=reparti[0].id,
            stato=StatoUtente.attivo,
        )
    ]
    for reparto in reparti[1:]:
        nome, cognome = fake.first_name(), fake.last_name()
        caposale.append(
            Utente(
                email=f"caposala.{slugify(cognome)}@eira.local",
                password_hash=hash_password("password123"),
                nome=nome,
                cognome=cognome,
                ruolo=RuoloUtente.caposala,
                reparto_id=reparto.id,
                stato=StatoUtente.attivo,
            )
        )
    db.add_all(caposale)
    db.flush()
    return caposale


def crea_infermieri(db, reparti: list[Reparto], per_reparto: int = 5) -> list[Utente]:
    infermieri = [
        Utente(
            email=settings.seed_infermiere_email,
            password_hash=hash_password(settings.seed_infermiere_password),
            nome=settings.seed_infermiere_nome,
            cognome=settings.seed_infermiere_cognome,
            ruolo=RuoloUtente.infermiere,
            reparto_id=reparti[0].id,
            stato=StatoUtente.attivo,
        )
    ]
    email_usate = {settings.seed_infermiere_email}
    for i, reparto in enumerate(reparti):
        quanti = per_reparto - 1 if i == 0 else per_reparto
        for _ in range(quanti):
            nome, cognome = fake.first_name(), fake.last_name()
            email = f"{slugify(nome)}.{slugify(cognome)}@eira.local"
            n = 2
            while email in email_usate:
                email = f"{slugify(nome)}.{slugify(cognome)}{n}@eira.local"
                n += 1
            email_usate.add(email)
            infermieri.append(
                Utente(
                    email=email,
                    password_hash=hash_password("password123"),
                    nome=nome,
                    cognome=cognome,
                    ruolo=RuoloUtente.infermiere,
                    reparto_id=reparto.id,
                    stato=StatoUtente.attivo,
                )
            )
    db.add_all(infermieri)
    db.flush()

    for infermiere in infermieri:
        db.add(
            ProfiloInfermiere(
                utente_id=infermiere.id,
                ore_contrattuali_mensili=random.choice(ORE_CONTRATTUALI),
            )
        )
    db.flush()
    return infermieri


def crea_pazienti(db, reparti: list[Reparto], per_reparto: int = 10) -> list[Paziente]:
    pazienti = []
    for reparto in reparti:
        letti = [f"{n}{lettera}" for n in range(1, 6) for lettera in "ABCD"]
        random.shuffle(letti)
        for i in range(per_reparto):
            dimesso = random.random() < 0.2
            giorni_fa = random.randint(1, 28) if not dimesso else random.randint(20, 45)
            pazienti.append(
                Paziente(
                    nome=fake.first_name(),
                    cognome=fake.last_name(),
                    eta=random.randint(40, 90),
                    letto=letti[i],
                    data_ricovero=OGGI - datetime.timedelta(days=giorni_fa),
                    diagnosi_ingresso=random.choice(DIAGNOSI),
                    reparto_id=reparto.id,
                    dimesso=dimesso,
                )
            )
    db.add_all(pazienti)
    db.flush()
    return pazienti


def crea_turni(
    db, reparti: list[Reparto], settimane_passate: int = 2, settimane_future: int = 2
) -> list[Turno]:
    giorni_totali = (settimane_passate + settimane_future) * 7
    inizio = OGGI - datetime.timedelta(days=settimane_passate * 7)
    turni = []
    for reparto in reparti:
        for offset in range(giorni_totali):
            data = inizio + datetime.timedelta(days=offset)
            for tipo, (ora_inizio, ora_fine) in TURNI_ORARI.items():
                turni.append(
                    Turno(
                        data=data,
                        tipo=tipo,
                        reparto_id=reparto.id,
                        ora_inizio=ora_inizio,
                        ora_fine=ora_fine,
                    )
                )
    db.add_all(turni)
    db.flush()
    return turni


TIPI_ROTAZIONE = [TipoTurno.mattina, TipoTurno.pomeriggio, TipoTurno.notte]
CICLO_LUNGHEZZA = 6
GIORNI_LAVORO = 4


def crea_assegnazioni(db, turni: list[Turno], infermieri: list[Utente]) -> list[AssegnazioneTurno]:
    """Assegna al massimo 1 turno/giorno per infermiere, seguendo un ciclo di 4 giorni
    lavorati e 2 di riposo. Ogni infermiere parte da un offset diverso nel ciclo (in
    base al proprio indice nel reparto) cosi' i riposi non coincidono per tutti, e
    ruota tra mattina/pomeriggio/notte a ogni blocco di 4 giorni lavorati. I giorni
    fuori ciclo vengono assegnati esplicitamente al turno riposo.
    """
    infermieri_per_reparto: dict[int, list[Utente]] = {}
    for infermiere in infermieri:
        infermieri_per_reparto.setdefault(infermiere.reparto_id, []).append(infermiere)

    turno_per_chiave = {(t.reparto_id, t.data, t.tipo): t for t in turni}
    date_ordinate = sorted({t.data for t in turni})

    assegnazioni = []
    for reparto_id, pool in infermieri_per_reparto.items():
        for indice, infermiere in enumerate(pool):
            offset = indice % CICLO_LUNGHEZZA
            tipo_iniziale = indice % len(TIPI_ROTAZIONE)
            for giorno_indice, data in enumerate(date_ordinate):
                posizione_ciclo = (giorno_indice + offset) % CICLO_LUNGHEZZA
                if posizione_ciclo >= GIORNI_LAVORO:
                    tipo = TipoTurno.riposo
                else:
                    blocco = (giorno_indice + offset) // CICLO_LUNGHEZZA
                    tipo = TIPI_ROTAZIONE[(tipo_iniziale + blocco) % len(TIPI_ROTAZIONE)]
                turno = turno_per_chiave.get((reparto_id, data, tipo))
                if turno is None:
                    continue
                assegnazioni.append(
                    AssegnazioneTurno(
                        turno_id=turno.id,
                        infermiere_id=infermiere.id,
                        stato=StatoAssegnazione.attiva,
                    )
                )
    db.add_all(assegnazioni)
    db.flush()
    return assegnazioni


def crea_richieste_cambio_turno(
    db,
    assegnazioni: list[AssegnazioneTurno],
    infermieri: list[Utente],
    caposale: list[Utente],
) -> None:
    infermieri_per_reparto: dict[int, list[Utente]] = {}
    for infermiere in infermieri:
        infermieri_per_reparto.setdefault(infermiere.reparto_id, []).append(infermiere)
    caposala_per_reparto = {c.reparto_id: c for c in caposale}
    infermieri_by_id = {i.id: i for i in infermieri}

    stati_da_generare = (
        [StatoCambioTurno.in_attesa_collega] * 2
        + [StatoCambioTurno.rifiutata_collega] * 2
        + [StatoCambioTurno.in_attesa_caposala] * 2
        + [StatoCambioTurno.rifiutata_caposala] * 2
        + [StatoCambioTurno.approvata] * 2
    )

    candidate = random.sample(assegnazioni, min(len(stati_da_generare), len(assegnazioni)))

    for assegnazione, stato in zip(candidate, stati_da_generare, strict=True):
        richiedente = infermieri_by_id[assegnazione.infermiere_id]
        pool_colleghi = [
            i for i in infermieri_per_reparto[richiedente.reparto_id] if i.id != richiedente.id
        ]
        if not pool_colleghi:
            continue
        collega = random.choice(pool_colleghi)
        creata_il = datetime.datetime.now(UTC) - datetime.timedelta(days=random.randint(1, 10))

        richiesta = RichiestaCambioTurno(
            assegnazione_turno_id=assegnazione.id,
            richiedente_id=richiedente.id,
            collega_id=collega.id,
            stato=stato,
            creata_il=creata_il,
        )

        if stato == StatoCambioTurno.rifiutata_collega:
            richiesta.risposta_collega_il = creata_il + datetime.timedelta(hours=6)
            richiesta.motivo_rifiuto = "Turno già impegnato con altro collega."
        elif stato in (
            StatoCambioTurno.in_attesa_caposala,
            StatoCambioTurno.rifiutata_caposala,
            StatoCambioTurno.approvata,
        ):
            richiesta.risposta_collega_il = creata_il + datetime.timedelta(hours=4)
            caposala = caposala_per_reparto.get(richiedente.reparto_id)
            if stato != StatoCambioTurno.in_attesa_caposala and caposala is not None:
                richiesta.risposta_caposala_id = caposala.id
                richiesta.risposta_caposala_il = creata_il + datetime.timedelta(days=1)
                if stato == StatoCambioTurno.rifiutata_caposala:
                    richiesta.motivo_rifiuto = "Copertura insufficiente per il reparto in quel turno."
                elif stato == StatoCambioTurno.approvata:
                    assegnazione.stato = StatoAssegnazione.cambiata

        db.add(richiesta)
    db.flush()


def crea_consegne_sbar(
    db, turni: list[Turno], assegnazioni: list[AssegnazioneTurno], pazienti: list[Paziente]
) -> None:
    infermieri_per_turno: dict[int, list[int]] = {}
    for assegnazione in assegnazioni:
        infermieri_per_turno.setdefault(assegnazione.turno_id, []).append(assegnazione.infermiere_id)

    turni_passati_per_reparto: dict[int, list[Turno]] = {}
    for turno in turni:
        if turno.data <= OGGI:
            turni_passati_per_reparto.setdefault(turno.reparto_id, []).append(turno)

    consegne = []
    for paziente in pazienti:
        if paziente.dimesso:
            continue
        turni_reparto = turni_passati_per_reparto.get(paziente.reparto_id, [])
        turni_recenti = sorted(turni_reparto, key=lambda t: t.data)[-6:]
        for turno in turni_recenti:
            autori = infermieri_per_turno.get(turno.id)
            if not autori:
                continue
            urgente = random.random() < 0.1
            consegne.append(
                ConsegnaSbar(
                    paziente_id=paziente.id,
                    turno_id=turno.id,
                    autore_id=random.choice(autori),
                    situation=(
                        f"Paziente {paziente.nome} {paziente.cognome}, {paziente.eta} anni, "
                        f"letto {paziente.letto}, ricoverato per {paziente.diagnosi_ingresso.lower()}."
                    ),
                    background=(
                        "Anamnesi coerente con la diagnosi d'ingresso, in trattamento secondo "
                        "protocollo di reparto, parametri vitali monitorati regolarmente."
                    ),
                    assessment=(
                        random.choice(
                            [
                                "Condizioni cliniche stabili, buona risposta alla terapia in atto.",
                                "Lieve miglioramento rispetto al turno precedente.",
                                "Quadro clinico invariato, da rivalutare a breve.",
                                "Presenta lieve agitazione, da monitorare nel prossimo turno.",
                            ]
                        )
                    ),
                    recommendation=(
                        random.choice(
                            [
                                "Proseguire terapia in corso e monitoraggio parametri vitali.",
                                "Rivalutazione medica programmata nel turno successivo.",
                                "Mobilizzazione assistita secondo tolleranza del paziente.",
                                "Controllare esami ematici in mattinata.",
                            ]
                        )
                    ),
                    priorita=PrioritaConsegna.urgente if urgente else PrioritaConsegna.normale,
                    creata_il=datetime.datetime.combine(turno.data, turno.ora_inizio, tzinfo=UTC),
                )
            )
    db.add_all(consegne)
    db.flush()


def crea_diario_cedema(
    db, turni: list[Turno], assegnazioni: list[AssegnazioneTurno], pazienti: list[Paziente]
) -> None:
    infermieri_per_turno: dict[int, list[int]] = {}
    for assegnazione in assegnazioni:
        infermieri_per_turno.setdefault(assegnazione.turno_id, []).append(assegnazione.infermiere_id)

    turni_passati_per_reparto: dict[int, list[Turno]] = {}
    for turno in turni:
        if turno.data <= OGGI:
            turni_passati_per_reparto.setdefault(turno.reparto_id, []).append(turno)

    voci = []
    for paziente in pazienti:
        if paziente.dimesso:
            continue
        turni_reparto = turni_passati_per_reparto.get(paziente.reparto_id, [])
        if not turni_reparto:
            continue
        n_voci = random.randint(2, 4)
        for turno in random.sample(turni_reparto, min(n_voci, len(turni_reparto))):
            autori = infermieri_per_turno.get(turno.id)
            if not autori:
                continue
            voci.append(
                VoceDiarioCedema(
                    paziente_id=paziente.id,
                    autore_id=random.choice(autori),
                    turno_id=turno.id,
                    timestamp=datetime.datetime.combine(turno.data, turno.ora_inizio, tzinfo=UTC),
                    coscienza=random.choice(
                        ["Vigile e orientato", "Soporoso ma risvegliabile", "Vigile, lieve confusione"]
                    ),
                    emotivita=random.choice(
                        ["Collaborante e sereno", "Ansioso per la degenza", "Tranquillo"]
                    ),
                    dolore=random.choice(
                        ["Assente (NRS 0)", "Lieve (NRS 2-3)", "Moderato (NRS 4-5), gestito con analgesia"]
                    ),
                    emodinamica=random.choice(
                        ["Parametri nella norma", "Lieve ipotensione", "Tachicardico, controllato"]
                    ),
                    mobilizzazione=random.choice(
                        ["Autonomo", "Mobilizzato con assistenza", "Allettato, cambi posturali regolari"]
                    ),
                    allert=random.choice(
                        ["Nessuno", "Rischio caduta, sponde alzate", "Da monitorare idratazione"]
                    ),
                )
            )
    db.add_all(voci)
    db.flush()


def crea_valutazioni(db, pazienti: list[Paziente], infermieri: list[Utente]) -> None:
    infermieri_per_reparto: dict[int, list[Utente]] = {}
    for infermiere in infermieri:
        infermieri_per_reparto.setdefault(infermiere.reparto_id, []).append(infermiere)

    norton_list = []
    conley_list = []
    for paziente in pazienti:
        if paziente.dimesso:
            continue
        pool = infermieri_per_reparto.get(paziente.reparto_id, [])
        if not pool:
            continue
        giorni_degenza = (OGGI - paziente.data_ricovero).days
        n_valutazioni = min(4, max(1, giorni_degenza // 7 + 1))
        for settimana in range(n_valutazioni):
            data_valutazione = paziente.data_ricovero + datetime.timedelta(days=settimana * 7)
            if data_valutazione > OGGI:
                break
            autore = random.choice(pool)

            n_subscore = [random.randint(1, 4) for _ in range(5)]
            norton_list.append(
                ValutazioneNorton(
                    paziente_id=paziente.id,
                    autore_id=autore.id,
                    data_valutazione=data_valutazione,
                    condizioni_generali=n_subscore[0],
                    stato_mentale=n_subscore[1],
                    attivita=n_subscore[2],
                    mobilita=n_subscore[3],
                    incontinenza=n_subscore[4],
                    punteggio_totale=sum(n_subscore),
                )
            )

            c_subscore = [random.randint(0, 2) for _ in range(6)]
            conley_list.append(
                ValutazioneConley(
                    paziente_id=paziente.id,
                    autore_id=autore.id,
                    data_valutazione=data_valutazione,
                    storia_cadute=c_subscore[0],
                    deficit_visivo=c_subscore[1],
                    alterazione_eliminazione=c_subscore[2],
                    agitazione=c_subscore[3],
                    deficit_vista_osservato=c_subscore[4],
                    andatura_alterata=c_subscore[5],
                    punteggio_totale=sum(c_subscore),
                )
            )
    db.add_all(norton_list)
    db.add_all(conley_list)
    db.flush()


FARMACI_CATALOGO = [
    ("Paracetamolo", "compresse", "Analgesici"),
    ("Ibuprofene", "compresse", "Antinfiammatori"),
    ("Amoxicillina", "capsule", "Antibiotici"),
    ("Furosemide", "fiale", "Diuretici"),
    ("Omeprazolo", "capsule", "Gastroprotettori"),
    ("Enoxaparina", "siringhe", "Anticoagulanti"),
]


def crea_carello_farmaci(db, reparti: list[Reparto]) -> None:
    farmaci = [
        Farmaco(nome=nome, unita_misura=unita_misura, categoria=categoria)
        for nome, unita_misura, categoria in FARMACI_CATALOGO
    ]
    db.add_all(farmaci)
    db.flush()

    carello = []
    for reparto_index, reparto in enumerate(reparti):
        for farmaco_index, farmaco in enumerate(farmaci):
            soglia = random.randint(4, 12)
            if farmaco_index % 3 == 0:
                quantita = max(0, soglia - random.randint(1, 3))
            else:
                quantita = soglia + random.randint(2, 25)
            carello.append(
                CarelloFarmaco(
                    farmaco_id=farmaco.id,
                    reparto_id=reparto.id,
                    quantita=quantita,
                    soglia_minima=soglia,
                    prossima_scadenza=OGGI + datetime.timedelta(days=7 + reparto_index * 5 + farmaco_index * 9),
                )
            )
    db.add_all(carello)
    db.flush()


def main() -> None:
    wipe_and_create_schema()
    db = SessionLocal()
    try:
        reparti = crea_reparti(db)
        caposale = crea_caposale(db, reparti)
        infermieri = crea_infermieri(db, reparti)
        pazienti = crea_pazienti(db, reparti)
        turni = crea_turni(db, reparti, settimane_passate=8, settimane_future=8)
        assegnazioni = crea_assegnazioni(db, turni, infermieri)
        crea_richieste_cambio_turno(db, assegnazioni, infermieri, caposale)
        crea_consegne_sbar(db, turni, assegnazioni, pazienti)
        crea_diario_cedema(db, turni, assegnazioni, pazienti)
        crea_valutazioni(db, pazienti, infermieri)
        crea_carello_farmaci(db, reparti)
        db.commit()

        print("[seed] Dati mock creati:")
        print(f"  reparti: {db.query(Reparto).count()}")
        n_utenti = db.query(Utente).count()
        print(f"  utenti: {n_utenti} (caposale: {len(caposale)}, infermieri: {len(infermieri)})")
        print(f"  pazienti: {db.query(Paziente).count()}")
        print(f"  turni: {db.query(Turno).count()}")
        print(f"  assegnazioni turno: {db.query(AssegnazioneTurno).count()}")
        print(f"  richieste cambio turno: {db.query(RichiestaCambioTurno).count()}")
        print(f"  consegne SBAR: {db.query(ConsegnaSbar).count()}")
        print(f"  voci diario CEDEMA: {db.query(VoceDiarioCedema).count()}")
        print(f"  valutazioni Norton: {db.query(ValutazioneNorton).count()}")
        print(f"  valutazioni Conley: {db.query(ValutazioneConley).count()}")
        print(f"  farmaci catalogo: {db.query(Farmaco).count()}")
        print(f"  carello farmaci: {db.query(CarelloFarmaco).count()}")
        print()
        print("[seed] Login di prova (username = id utente):")
        print(f"  caposala: username={caposale[0].id} password={settings.seed_caposala_password}")
        print(f"  infermiere: username={infermieri[0].id} password={settings.seed_infermiere_password}")
        print("  (tutti gli altri utenti generati hanno password 'password123')")
    finally:
        db.close()


if __name__ == "__main__":
    main()
