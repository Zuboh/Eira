from fastapi import FastAPI

import app.models  # noqa: F401 — registra tutti i modelli su Base.metadata
from app.core.database import Base, engine
from app.routers import (
    auth,
    banca_ore,
    cambi_turno,
    consegne_sbar,
    dashboard,
    diario_cedema,
    pazienti,
    turni,
    utenti,
    valutazioni,
)

app = FastAPI(title="Consegne Infermieristiche API", version="0.1.0")

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


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
