from app.core.avatars import AVATAR_DIR
from tests.conftest import TEST_PNG, auth_headers


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
    assert body["avatar_url"] == "/static/avatars/default/infermiere-uomo.webp"


def test_default_avatar_is_available_for_every_supported_role(
    client, caposala_a
):
    headers = auth_headers(client, caposala_a.email, "password123")
    response = client.get(f"/api/v1/utenti/{caposala_a.id}", headers=headers)

    assert response.status_code == 200, response.text
    assert response.json()["avatar_url"] == (
        "/static/avatars/default/caposala-donna.webp"
    )

    image_response = client.get(response.json()["avatar_url"])
    assert image_response.status_code == 200
    assert image_response.headers["content-type"] == "image/webp"


def test_list_utenti_only_returns_same_reparto(client, db_session, caposala_a, reparti):
    from app.core.security import hash_password
    from app.models.enums import RuoloUtente
    from app.models.utente import Utente

    reparto_a, reparto_b = reparti
    utente_a = Utente(
        email="nurse.a@example.com",
        password_hash=hash_password("password123"),
        nome="Nurse",
        cognome="A",
        ruolo=RuoloUtente.infermiere,
        reparto_id=reparto_a.id,
    )
    utente_b = Utente(
        email="nurse.b@example.com",
        password_hash=hash_password("password123"),
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
        password_hash=hash_password("password123"),
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
        password_hash=hash_password("password123"),
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


def test_create_temporary_password_other_reparto_forbidden(
    client, db_session, caposala_a, reparti
):
    from app.core.security import hash_password
    from app.models.enums import RuoloUtente
    from app.models.utente import Utente

    _, reparto_b = reparti
    utente_b = Utente(
        email="nurse.reset.b@example.com",
        password_hash=hash_password("password123"),
        nome="Nurse",
        cognome="B",
        ruolo=RuoloUtente.infermiere,
        reparto_id=reparto_b.id,
    )
    db_session.add(utente_b)
    db_session.commit()
    db_session.refresh(utente_b)

    headers = auth_headers(client, caposala_a.email, "password123")
    response = client.post(
        f"/api/v1/utenti/{utente_b.id}/password-temporanea", headers=headers
    )

    assert response.status_code == 403


def test_create_temporary_password_caposala_forbidden(client, caposala_a):
    headers = auth_headers(client, caposala_a.email, "password123")
    response = client.post(
        f"/api/v1/utenti/{caposala_a.id}/password-temporanea", headers=headers
    )

    assert response.status_code == 403


def test_create_temporary_password_pending_user_forbidden(
    client, db_session, caposala_a, reparti
):
    from app.core.security import hash_password
    from app.models.enums import RuoloUtente, StatoUtente
    from app.models.utente import Utente

    reparto_a, _ = reparti
    utente = Utente(
        email="nurse.pending.reset@example.com",
        password_hash=hash_password("password123"),
        nome="Pending",
        cognome="Reset",
        ruolo=RuoloUtente.infermiere,
        reparto_id=reparto_a.id,
        stato=StatoUtente.in_attesa,
    )
    db_session.add(utente)
    db_session.commit()
    db_session.refresh(utente)

    headers = auth_headers(client, caposala_a.email, "password123")
    response = client.post(f"/api/v1/utenti/{utente.id}/password-temporanea", headers=headers)

    assert response.status_code == 403


def test_upload_avatar_happy_path(client, db_session, caposala_a, reparti):
    from app.core.security import hash_password
    from app.models.enums import RuoloUtente
    from app.models.utente import Utente

    reparto_a, _ = reparti
    utente = Utente(
        email="nurse.avatar@example.com",
        password_hash=hash_password("password123"),
        nome="Foto",
        cognome="Test",
        ruolo=RuoloUtente.infermiere,
        reparto_id=reparto_a.id,
    )
    db_session.add(utente)
    db_session.commit()
    db_session.refresh(utente)

    headers = auth_headers(client, caposala_a.email, "password123")
    response = client.post(
        f"/api/v1/utenti/{utente.id}/avatar",
        headers=headers,
        files={"file": ("foto.png", TEST_PNG, "image/png")},
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["avatar_url"] is not None
    assert body["avatar_url"].startswith("/static/avatars/")

    filename = body["avatar_url"].removeprefix("/static/avatars/")
    saved_path = AVATAR_DIR / filename
    assert saved_path.exists()
    saved_path.unlink(missing_ok=True)


def test_upload_avatar_rejects_unsupported_content_type(client, db_session, caposala_a, reparti):
    from app.core.security import hash_password
    from app.models.enums import RuoloUtente
    from app.models.utente import Utente

    reparto_a, _ = reparti
    utente = Utente(
        email="nurse.avatar2@example.com",
        password_hash=hash_password("password123"),
        nome="Foto",
        cognome="Bad",
        ruolo=RuoloUtente.infermiere,
        reparto_id=reparto_a.id,
    )
    db_session.add(utente)
    db_session.commit()
    db_session.refresh(utente)

    headers = auth_headers(client, caposala_a.email, "password123")
    response = client.post(
        f"/api/v1/utenti/{utente.id}/avatar",
        headers=headers,
        files={"file": ("nota.txt", b"not an image", "text/plain")},
    )

    assert response.status_code == 400


def test_upload_avatar_rejects_oversized_file(client, db_session, caposala_a, reparti):
    from app.core.security import hash_password
    from app.models.enums import RuoloUtente
    from app.models.utente import Utente

    reparto_a, _ = reparti
    utente = Utente(
        email="nurse.avatar3@example.com",
        password_hash=hash_password("password123"),
        nome="Foto",
        cognome="Big",
        ruolo=RuoloUtente.infermiere,
        reparto_id=reparto_a.id,
    )
    db_session.add(utente)
    db_session.commit()
    db_session.refresh(utente)

    headers = auth_headers(client, caposala_a.email, "password123")
    oversized = b"\xff\xd8\xff\xe0" + b"0" * (2 * 1024 * 1024 + 1)
    response = client.post(
        f"/api/v1/utenti/{utente.id}/avatar",
        headers=headers,
        files={"file": ("grande.jpg", oversized, "image/jpeg")},
    )

    assert response.status_code == 400


def test_upload_avatar_other_reparto_forbidden(client, db_session, caposala_a, reparti):
    from app.core.security import hash_password
    from app.models.enums import RuoloUtente
    from app.models.utente import Utente

    _, reparto_b = reparti
    utente_b = Utente(
        email="nurse.avatar.b@example.com",
        password_hash=hash_password("password123"),
        nome="Nurse",
        cognome="B",
        ruolo=RuoloUtente.infermiere,
        reparto_id=reparto_b.id,
    )
    db_session.add(utente_b)
    db_session.commit()
    db_session.refresh(utente_b)

    headers = auth_headers(client, caposala_a.email, "password123")
    response = client.post(
        f"/api/v1/utenti/{utente_b.id}/avatar",
        headers=headers,
        files={"file": ("foto.jpg", b"\xff\xd8\xff\xe0fake", "image/jpeg")},
    )

    assert response.status_code == 403


def test_upload_avatar_non_caposala_forbidden(client, db_session, reparti):
    from app.core.security import hash_password
    from app.models.enums import RuoloUtente
    from app.models.utente import Utente

    reparto_a, _ = reparti
    infermiere = Utente(
        email="infermiere.uploader@example.com",
        password_hash=hash_password("password123"),
        nome="Nurse",
        cognome="Uploader",
        ruolo=RuoloUtente.infermiere,
        reparto_id=reparto_a.id,
    )
    db_session.add(infermiere)
    db_session.commit()
    db_session.refresh(infermiere)

    headers = auth_headers(client, infermiere.email, "password123")
    response = client.post(
        f"/api/v1/utenti/{infermiere.id}/avatar",
        headers=headers,
        files={"file": ("foto.jpg", b"\xff\xd8\xff\xe0fake", "image/jpeg")},
    )

    assert response.status_code == 403
