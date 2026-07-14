from app.core.security import hash_password
from app.models.enums import RuoloUtente, StatoUtente
from app.models.utente import Utente


def test_list_reparti(client, reparti):
    reparto_a, reparto_b = reparti
    response = client.get("/api/v1/reparti/")
    assert response.status_code == 200, response.text
    nomi = {r["nome"] for r in response.json()}
    assert nomi == {"Cardiologia", "Oncologia"}


def test_list_utenti_by_reparto(client, db_session, reparti):
    reparto_a, _ = reparti
    utente = Utente(
        email="attivo@example.com",
        password_hash=hash_password("password123"),
        nome="Mario",
        cognome="Bianchi",
        ruolo=RuoloUtente.infermiere,
        reparto_id=reparto_a.id,
        stato=StatoUtente.attivo,
    )
    pending = Utente(
        email="pending@example.com",
        password_hash=hash_password("password123"),
        nome="Luca",
        cognome="Verdi",
        ruolo=RuoloUtente.infermiere,
        reparto_id=reparto_a.id,
        stato=StatoUtente.in_attesa,
    )
    db_session.add_all([utente, pending])
    db_session.commit()

    response = client.get(f"/api/v1/reparti/{reparto_a.id}/utenti")
    assert response.status_code == 200, response.text
    body = response.json()
    assert len(body) == 1
    assert body[0]["nome"] == "Mario"
    assert "email" not in body[0]


def test_list_utenti_by_reparto_empty(client, reparti):
    reparto_a, _ = reparti
    response = client.get(f"/api/v1/reparti/{reparto_a.id}/utenti")
    assert response.status_code == 200, response.text
    assert response.json() == []


def test_list_utenti_by_reparto_unknown_id_404(client, reparti):
    response = client.get("/api/v1/reparti/9999/utenti")
    assert response.status_code == 404, response.text
