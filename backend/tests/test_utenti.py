from tests.conftest import auth_headers


def test_create_utente_forces_reparto_from_current_user(client, caposala_a, reparti):
    reparto_a, reparto_b = reparti
    headers = auth_headers(client, "caposala.a@example.com", "password123")

    response = client.post(
        "/api/v1/utenti/",
        headers=headers,
        json={
            "nome": "Mario",
            "cognome": "Bianchi",
            "email": "mario@example.com",
            "ruolo": "infermiere",
            "reparto_id": reparto_b.id,
            "password": "supersegreto",
        },
    )

    assert response.status_code == 201, response.text
    body = response.json()
    assert body["reparto_id"] == reparto_a.id


def test_list_utenti_only_returns_same_reparto(client, db_session, caposala_a, reparti):
    from app.core.security import hash_password
    from app.models.enums import RuoloUtente
    from app.models.utente import Utente

    reparto_a, reparto_b = reparti
    utente_a = Utente(
        email="nurse.a@example.com",
        password_hash=hash_password("x"),
        nome="Nurse",
        cognome="A",
        ruolo=RuoloUtente.infermiere,
        reparto_id=reparto_a.id,
    )
    utente_b = Utente(
        email="nurse.b@example.com",
        password_hash=hash_password("x"),
        nome="Nurse",
        cognome="B",
        ruolo=RuoloUtente.infermiere,
        reparto_id=reparto_b.id,
    )
    db_session.add_all([utente_a, utente_b])
    db_session.commit()

    headers = auth_headers(client, "caposala.a@example.com", "password123")
    response = client.get("/api/v1/utenti/", headers=headers)

    assert response.status_code == 200
    emails = {u["email"] for u in response.json()}
    assert emails == {"nurse.a@example.com", "caposala.a@example.com"}


def test_get_utente_other_reparto_forbidden(client, db_session, caposala_a, reparti):
    from app.core.security import hash_password
    from app.models.enums import RuoloUtente
    from app.models.utente import Utente

    _, reparto_b = reparti
    utente_b = Utente(
        email="nurse.b@example.com",
        password_hash=hash_password("x"),
        nome="Nurse",
        cognome="B",
        ruolo=RuoloUtente.infermiere,
        reparto_id=reparto_b.id,
    )
    db_session.add(utente_b)
    db_session.commit()
    db_session.refresh(utente_b)

    headers = auth_headers(client, "caposala.a@example.com", "password123")
    response = client.get(f"/api/v1/utenti/{utente_b.id}", headers=headers)

    assert response.status_code == 403


def test_update_utente_other_reparto_forbidden(client, db_session, caposala_a, reparti):
    from app.core.security import hash_password
    from app.models.enums import RuoloUtente
    from app.models.utente import Utente

    _, reparto_b = reparti
    utente_b = Utente(
        email="nurse.b@example.com",
        password_hash=hash_password("x"),
        nome="Nurse",
        cognome="B",
        ruolo=RuoloUtente.infermiere,
        reparto_id=reparto_b.id,
    )
    db_session.add(utente_b)
    db_session.commit()
    db_session.refresh(utente_b)

    headers = auth_headers(client, "caposala.a@example.com", "password123")
    response = client.patch(
        f"/api/v1/utenti/{utente_b.id}", headers=headers, json={"nome": "Hacked"}
    )

    assert response.status_code == 403
