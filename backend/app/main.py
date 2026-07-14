from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models  # noqa: F401 — registra tutti i modelli su Base.metadata
from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.models.enums import RuoloUtente, StatoUtente
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
    _seed_bootstrap_caposala()


def _seed_bootstrap_caposala() -> None:
    """Garantisce almeno un caposala attivo: senza, nessuno può creare
    reparti/utenti (tutte le mutazioni richiedono require_roles(caposala))
    e l'app resta bloccata su DB vuoto."""
    db = SessionLocal()
    try:
        if db.query(Utente).filter(Utente.ruolo == RuoloUtente.caposala).first() is not None:
            return

        reparto = db.query(Reparto).first()
        if reparto is None:
            reparto = Reparto(nome=settings.seed_reparto_nome)
            db.add(reparto)
            db.flush()

        caposala = Utente(
            email="caposala@eira.local",
            password_hash=hash_password(settings.seed_caposala_password),
            nome=settings.seed_caposala_nome,
            cognome=settings.seed_caposala_cognome,
            ruolo=RuoloUtente.caposala,
            reparto_id=reparto.id,
            stato=StatoUtente.attivo,
        )
        db.add(caposala)
        db.commit()
        db.refresh(caposala)
        print(
            f"[seed] Nessun caposala trovato: creato reparto "
            f"'{reparto.nome}' (id={reparto.id}) e caposala "
            f"id={caposala.id} — login con username={caposala.id} "
            f"e la password in settings.seed_caposala_password."
        )
    finally:
        db.close()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
