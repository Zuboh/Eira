from fastapi import FastAPI

import app.models  # noqa: F401 — registra tutti i modelli su Base.metadata
from app.core.database import Base, engine

app = FastAPI(title="Consegne Infermieristiche API", version="0.1.0")


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
