import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base
from app.core.security import hash_password
from app.deps import get_db
from app.main import app
from app.models.enums import RuoloUtente
from app.models.reparto import Reparto
from app.models.utente import Utente


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def reparti(db_session):
    reparto_a = Reparto(nome="Cardiologia")
    reparto_b = Reparto(nome="Oncologia")
    db_session.add_all([reparto_a, reparto_b])
    db_session.commit()
    db_session.refresh(reparto_a)
    db_session.refresh(reparto_b)
    return reparto_a, reparto_b


@pytest.fixture()
def caposala_a(db_session, reparti):
    reparto_a, _ = reparti
    utente = Utente(
        email="caposala.a@example.com",
        password_hash=hash_password("password123"),
        nome="Anna",
        cognome="Rossi",
        ruolo=RuoloUtente.caposala,
        reparto_id=reparto_a.id,
    )
    db_session.add(utente)
    db_session.commit()
    db_session.refresh(utente)
    return utente


def auth_headers(client: TestClient, email: str, password: str) -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/token", data={"username": email, "password": password}
    )
    assert response.status_code == 200, response.text
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
