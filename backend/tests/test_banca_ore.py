import datetime

from tests.conftest import auth_headers


def _infermiere(db_session, reparto_id, email="nurse.a@example.com"):
    from app.core.security import hash_password
    from app.models.enums import RuoloUtente
    from app.models.utente import Utente

    utente = Utente(
        email=email,
        password_hash=hash_password("password123"),
        nome="Nurse",
        cognome="A",
        ruolo=RuoloUtente.infermiere,
        reparto_id=reparto_id,
    )
    db_session.add(utente)
    db_session.commit()
    db_session.refresh(utente)

    from app.models.profilo_infermiere import ProfiloInfermiere

    profilo = ProfiloInfermiere(utente_id=utente.id, ore_contrattuali_mensili=150)
    db_session.add(profilo)
    db_session.commit()
    return utente


def test_caposala_cannot_view_banca_ore_altro_reparto(client, db_session, caposala_a, reparti):
    reparto_a, reparto_b = reparti
    infermiere_b = _infermiere(db_session, reparto_b.id, "nurse.b@example.com")

    headers = auth_headers(client, "caposala.a@example.com", "password123")
    mese = datetime.date.today().strftime("%Y-%m")
    response = client.get(f"/api/v1/banca-ore/{infermiere_b.id}?mese={mese}", headers=headers)

    assert response.status_code == 403


def test_caposala_can_view_banca_ore_stesso_reparto(client, db_session, caposala_a, reparti):
    reparto_a, _ = reparti
    infermiere_a = _infermiere(db_session, reparto_a.id, "nurse.a@example.com")

    headers = auth_headers(client, "caposala.a@example.com", "password123")
    mese = datetime.date.today().strftime("%Y-%m")
    response = client.get(f"/api/v1/banca-ore/{infermiere_a.id}?mese={mese}", headers=headers)

    assert response.status_code == 200, response.text
    assert response.json()["infermiere_id"] == infermiere_a.id


def test_infermiere_cannot_view_others_banca_ore(client, db_session, reparti):
    reparto_a, _ = reparti
    infermiere_a = _infermiere(db_session, reparto_a.id, "nurse.a@example.com")
    infermiere_b = _infermiere(db_session, reparto_a.id, "nurse.b@example.com")

    headers = auth_headers(client, infermiere_a.email, "password123")
    mese = datetime.date.today().strftime("%Y-%m")
    response = client.get(f"/api/v1/banca-ore/{infermiere_b.id}?mese={mese}", headers=headers)

    assert response.status_code == 403
