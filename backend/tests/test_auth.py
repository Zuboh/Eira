import datetime

from app.core.security import hash_password
from app.models.enums import RuoloUtente, StatoUtente
from app.models.password_reset import PasswordResetRequirement
from app.models.utente import Utente
from tests.conftest import auth_headers


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


def test_temporary_password_requires_change_before_login(client, db_session, caposala_a, reparti):
    reparto_a, _ = reparti
    infermiere = Utente(
        email="nurse.reset@example.com",
        password_hash=hash_password("old-password"),
        nome="Nurse",
        cognome="Reset",
        ruolo=RuoloUtente.infermiere,
        reparto_id=reparto_a.id,
        stato=StatoUtente.attivo,
    )
    db_session.add(infermiere)
    db_session.commit()
    db_session.refresh(infermiere)

    headers = auth_headers(client, caposala_a.email, "password123")
    created = client.post(
        f"/api/v1/utenti/{infermiere.id}/password-temporanea", headers=headers
    )

    assert created.status_code == 200, created.text
    temporary_password = created.json()["temporary_password"]
    assert len(temporary_password) == 12
    assert db_session.get(PasswordResetRequirement, infermiere.id) is not None

    login = client.post(
        "/api/v1/auth/token",
        data={"username": str(infermiere.id), "password": temporary_password},
    )
    assert login.status_code == 403, login.text
    assert login.json()["detail"] == "password_change_required"

    changed = client.post(
        "/api/v1/auth/change-temporary-password",
        json={
            "utente_id": infermiere.id,
            "temporary_password": temporary_password,
            "new_password": "new-password",
        },
    )
    assert changed.status_code == 200, changed.text
    assert db_session.get(PasswordResetRequirement, infermiere.id) is None

    # check the new password works first — an old-password attempt right
    # after would trip the per-account backoff and block this one.
    new_login = client.post(
        "/api/v1/auth/token",
        data={"username": str(infermiere.id), "password": "new-password"},
    )
    assert new_login.status_code == 200, new_login.text

    old_login = client.post(
        "/api/v1/auth/token",
        data={"username": str(infermiere.id), "password": temporary_password},
    )
    assert old_login.status_code == 401, old_login.text


def _create_expired_requirement(db_session, caposala_a, reparto):
    infermiere = Utente(
        email="nurse.expired@example.com",
        password_hash=hash_password("temp-password-123"),
        nome="Nurse",
        cognome="Expired",
        ruolo=RuoloUtente.infermiere,
        reparto_id=reparto.id,
        stato=StatoUtente.attivo,
    )
    db_session.add(infermiere)
    db_session.commit()
    db_session.refresh(infermiere)

    requirement = PasswordResetRequirement(
        utente_id=infermiere.id,
        created_by_id=caposala_a.id,
        created_at=datetime.datetime.now(datetime.UTC) - datetime.timedelta(hours=49),
    )
    db_session.add(requirement)
    db_session.commit()
    return infermiere


def test_login_rejects_expired_temporary_password(client, db_session, caposala_a, reparti):
    reparto_a, _ = reparti
    infermiere = _create_expired_requirement(db_session, caposala_a, reparto_a)

    response = client.post(
        "/api/v1/auth/token",
        data={"username": str(infermiere.id), "password": "temp-password-123"},
    )
    assert response.status_code == 403, response.text
    assert response.json()["detail"] == "temporary_password_expired"


def test_change_temporary_password_rejects_expired(client, db_session, caposala_a, reparti):
    reparto_a, _ = reparti
    infermiere = _create_expired_requirement(db_session, caposala_a, reparto_a)

    response = client.post(
        "/api/v1/auth/change-temporary-password",
        json={
            "utente_id": infermiere.id,
            "temporary_password": "temp-password-123",
            "new_password": "new-password",
        },
    )
    assert response.status_code == 403, response.text
    assert response.json()["detail"] == "temporary_password_expired"
    # requirement untouched, password unchanged
    assert db_session.get(PasswordResetRequirement, infermiere.id) is not None


def test_non_expired_temporary_password_still_works(client, db_session, caposala_a, reparti):
    reparto_a, _ = reparti
    infermiere = Utente(
        email="nurse.fresh@example.com",
        password_hash=hash_password("temp-password-456"),
        nome="Nurse",
        cognome="Fresh",
        ruolo=RuoloUtente.infermiere,
        reparto_id=reparto_a.id,
        stato=StatoUtente.attivo,
    )
    db_session.add(infermiere)
    db_session.commit()
    db_session.refresh(infermiere)

    requirement = PasswordResetRequirement(
        utente_id=infermiere.id,
        created_by_id=caposala_a.id,
        created_at=datetime.datetime.now(datetime.UTC) - datetime.timedelta(hours=1),
    )
    db_session.add(requirement)
    db_session.commit()

    login = client.post(
        "/api/v1/auth/token",
        data={"username": str(infermiere.id), "password": "temp-password-456"},
    )
    assert login.status_code == 403, login.text
    assert login.json()["detail"] == "password_change_required"

    changed = client.post(
        "/api/v1/auth/change-temporary-password",
        json={
            "utente_id": infermiere.id,
            "temporary_password": "temp-password-456",
            "new_password": "new-password",
        },
    )
    assert changed.status_code == 200, changed.text


def test_login_rate_limited_after_five_per_minute(client):
    # distinct nonexistent ids so per-account backoff never kicks in;
    # isolates the per-IP slowapi limit on /auth/token.
    for fake_id in range(90001, 90006):
        response = client.post(
            "/api/v1/auth/token",
            data={"username": str(fake_id), "password": "wrong-password"},
        )
        assert response.status_code == 401, response.text

    sixth = client.post(
        "/api/v1/auth/token",
        data={"username": "90006", "password": "wrong-password"},
    )
    assert sixth.status_code == 429, sixth.text


def test_login_per_account_backoff_after_single_failure(client, caposala_a):
    first = client.post(
        "/api/v1/auth/token",
        data={"username": str(caposala_a.id), "password": "wrong-password"},
    )
    assert first.status_code == 401, first.text

    second = client.post(
        "/api/v1/auth/token",
        data={"username": str(caposala_a.id), "password": "wrong-password"},
    )
    assert second.status_code == 429, second.text
    assert second.json()["detail"] == "too_many_attempts"

    # correct password is also blocked while backoff is in effect
    third = client.post(
        "/api/v1/auth/token",
        data={"username": str(caposala_a.id), "password": "password123"},
    )
    assert third.status_code == 429, third.text
