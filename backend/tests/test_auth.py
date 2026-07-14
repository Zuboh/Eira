from app.models.enums import StatoUtente
from app.models.utente import Utente


def test_login_rejects_in_attesa(client, caposala_a, db_session):
    caposala_a.stato = StatoUtente.in_attesa
    db_session.commit()
    response = client.post(
        "/api/v1/auth/token",
        data={"username": str(caposala_a.id), "password": "password123"},
    )
    assert response.status_code == 401, response.text


def test_login_rejects_disattivato(client, caposala_a, db_session):
    caposala_a.stato = StatoUtente.disattivato
    db_session.commit()
    response = client.post(
        "/api/v1/auth/token",
        data={"username": str(caposala_a.id), "password": "password123"},
    )
    assert response.status_code == 401, response.text


def test_login_non_numeric_username_401(client, caposala_a):
    response = client.post(
        "/api/v1/auth/token",
        data={"username": "not-an-id", "password": "password123"},
    )
    assert response.status_code == 401, response.text


def test_login_active_account_succeeds(client, caposala_a):
    response = client.post(
        "/api/v1/auth/token",
        data={"username": str(caposala_a.id), "password": "password123"},
    )
    assert response.status_code == 200, response.text


def test_register_happy_path(client, reparti, db_session):
    reparto_a, _ = reparti
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "newbie@example.com",
            "password": "password123",
            "nome": "New",
            "cognome": "Bie",
            "reparto_id": reparto_a.id,
        },
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["stato"] == "in_attesa"
    assert body["ruolo"] == "infermiere"

    # not surfaced in the tile list (filtered to attivo)
    tiles = client.get(f"/api/v1/reparti/{reparto_a.id}/utenti")
    assert tiles.json() == []

    # cannot log in while pending
    login = client.post(
        "/api/v1/auth/token",
        data={"username": str(body["id"]), "password": "password123"},
    )
    assert login.status_code == 401, login.text

    # flip to attivo manually and confirm login now works
    utente = db_session.get(Utente, body["id"])
    utente.stato = StatoUtente.attivo
    db_session.commit()
    login2 = client.post(
        "/api/v1/auth/token",
        data={"username": str(body["id"]), "password": "password123"},
    )
    assert login2.status_code == 200, login2.text


def test_register_duplicate_email_409(client, reparti, caposala_a):
    reparto_a, _ = reparti
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": caposala_a.email,
            "password": "password123",
            "nome": "Dup",
            "cognome": "Licate",
            "reparto_id": reparto_a.id,
        },
    )
    assert response.status_code == 409, response.text


def test_register_unknown_reparto_404(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "someone@example.com",
            "password": "password123",
            "nome": "A",
            "cognome": "B",
            "reparto_id": 9999,
        },
    )
    assert response.status_code == 404, response.text
