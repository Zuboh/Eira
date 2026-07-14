from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models  # noqa: F401 — registra tutti i modelli su Base.metadata
from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.models.enums import RuoloUtente, StatoUtente
from app.models.profilo_infermiere import ProfiloInfermiere
from app.models.reparto import Reparto
from app.models.utente import Utente
from app.routers import (
    auth,
    banca_ore,
    cambi_turno,
    consegne_sbar,
    dashboard,
    diario_cedema,
    pazienti,
    reparti,
    turni,
    utenti,
    valutazioni,
)

app = FastAPI(title="Consegne Infermieristiche API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_V1_PREFIX = "/api/v1"
app.include_router(auth.router, prefix=API_V1_PREFIX)
app.include_router(utenti.router, prefix=API_V1_PREFIX)
app.include_router(pazienti.router, prefix=API_V1_PREFIX)
app.include_router(turni.router, prefix=API_V1_PREFIX)
app.include_router(cambi_turno.router, prefix=API_V1_PREFIX)
app.include_router(consegne_sbar.router, prefix=API_V1_PREFIX)
app.include_router(diario_cedema.router, prefix=API_V1_PREFIX)
app.include_router(valutazioni.router, prefix=API_V1_PREFIX)
app.include_router(banca_ore.router, prefix=API_V1_PREFIX)
app.include_router(dashboard.router, prefix=API_V1_PREFIX)
app.include_router(reparti.router, prefix=API_V1_PREFIX)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    _seed_dev_data()


def _seed_dev_data() -> None:
    """Garantisce dati minimi di sviluppo senza duplicare record esistenti."""
    db = SessionLocal()
    try:
        reparto_seed = _get_or_create_reparto(db, settings.seed_reparto_nome)
        _get_or_create_reparto(db, settings.seed_secondo_reparto_nome)

        caposala = db.query(Utente).filter(Utente.ruolo == RuoloUtente.caposala).first()
        if caposala is None:
            caposala = Utente(
                email="caposala@eira.local",
                password_hash=hash_password(settings.seed_caposala_password),
                nome=settings.seed_caposala_nome,
                cognome=settings.seed_caposala_cognome,
                ruolo=RuoloUtente.caposala,
                reparto_id=reparto_seed.id,
                stato=StatoUtente.attivo,
            )
            db.add(caposala)
            db.flush()

        reparto_principale = db.get(Reparto, caposala.reparto_id) or reparto_seed

        infermiere = (
            db.query(Utente)
            .filter(Utente.email == settings.seed_infermiere_email)
            .first()
        )
        if infermiere is None:
            infermiere = Utente(
                email=settings.seed_infermiere_email,
                password_hash=hash_password(settings.seed_infermiere_password),
                nome=settings.seed_infermiere_nome,
                cognome=settings.seed_infermiere_cognome,
                ruolo=RuoloUtente.infermiere,
                reparto_id=reparto_principale.id,
                stato=StatoUtente.attivo,
            )
            db.add(infermiere)
            db.flush()
        else:
            infermiere.ruolo = RuoloUtente.infermiere
            infermiere.reparto_id = reparto_principale.id
            infermiere.stato = StatoUtente.attivo

        if db.get(ProfiloInfermiere, infermiere.id) is None:
            db.add(
                ProfiloInfermiere(
                    utente_id=infermiere.id,
                    ore_contrattuali_mensili=(
                        settings.seed_infermiere_ore_contrattuali_mensili
                    ),
                )
            )

        db.commit()
        db.refresh(reparto_principale)
        db.refresh(caposala)
        db.refresh(infermiere)
        print(
            f"[seed] Dati dev disponibili: reparto principale "
            f"'{reparto_principale.nome}' (id={reparto_principale.id}), "
            f"caposala username={caposala.id} "
            f"(password settings.seed_caposala_password), "
            f"infermiere username={infermiere.id} "
            f"(password settings.seed_infermiere_password)."
        )
    finally:
        db.close()


def _get_or_create_reparto(db, nome: str) -> Reparto:
    reparto = db.query(Reparto).filter(Reparto.nome == nome).first()
    if reparto is not None:
        return reparto

    reparto = Reparto(nome=nome)
    db.add(reparto)
    db.flush()
    return reparto


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
