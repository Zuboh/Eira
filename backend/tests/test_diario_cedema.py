import datetime

from tests.conftest import auth_headers


def _paziente(reparto_id: int):
    from app.models.paziente import Paziente

    return Paziente(
        nome="Mario",
        cognome="Bianchi",
        eta=72,
        letto="3B",
        data_ricovero=datetime.date.today(),
        diagnosi_ingresso="polmonite",
        reparto_id=reparto_id,
    )


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
    return utente


def _voce_payload(turno_id=None):
    return {
        "turno_id": turno_id,
        "coscienza": "vigile",
        "emotivita": "tranquillo",
        "dolore": "assente",
        "emodinamica": "stabile",
        "mobilizzazione": "autonoma",
        "allert": "nessuno",
    }


def test_create_voce_other_reparto_forbidden(client, db_session, reparti):
    reparto_a, reparto_b = reparti
    infermiere = _infermiere(db_session, reparto_a.id)
    paziente_b = _paziente(reparto_b.id)
    db_session.add(paziente_b)
    db_session.commit()
    db_session.refresh(paziente_b)

    headers = auth_headers(client, infermiere.email, "password123")
    response = client.post(
        f"/api/v1/pazienti/{paziente_b.id}/diario-cedema", headers=headers, json=_voce_payload()
    )

    assert response.status_code == 403


def test_create_and_list_voce_same_reparto_succeeds(client, db_session, reparti):
    reparto_a, _ = reparti
    infermiere = _infermiere(db_session, reparto_a.id)
    paziente = _paziente(reparto_a.id)
    db_session.add(paziente)
    db_session.commit()
    db_session.refresh(paziente)

    headers = auth_headers(client, infermiere.email, "password123")
    created = client.post(
        f"/api/v1/pazienti/{paziente.id}/diario-cedema", headers=headers, json=_voce_payload()
    )
    assert created.status_code == 201, created.text
    assert created.json()["autore_id"] == infermiere.id

    listed = client.get(f"/api/v1/pazienti/{paziente.id}/diario-cedema", headers=headers)
    assert listed.status_code == 200
    assert len(listed.json()) == 1


def test_list_voci_other_reparto_forbidden(client, db_session, reparti):
    reparto_a, reparto_b = reparti
    infermiere = _infermiere(db_session, reparto_a.id)
    paziente_b = _paziente(reparto_b.id)
    db_session.add(paziente_b)
    db_session.commit()
    db_session.refresh(paziente_b)

    headers = auth_headers(client, infermiere.email, "password123")
    response = client.get(f"/api/v1/pazienti/{paziente_b.id}/diario-cedema", headers=headers)
    assert response.status_code == 403


def test_create_voce_with_turno_other_reparto_forbidden(client, db_session, reparti):
    from app.models.enums import TipoTurno
    from app.models.turno import Turno

    reparto_a, reparto_b = reparti
    infermiere = _infermiere(db_session, reparto_a.id)
    paziente = _paziente(reparto_a.id)
    turno_b = Turno(
        data=datetime.date.today(),
        tipo=TipoTurno.mattina,
        reparto_id=reparto_b.id,
        ora_inizio=datetime.time(7, 0),
        ora_fine=datetime.time(14, 0),
    )
    db_session.add_all([paziente, turno_b])
    db_session.commit()
    db_session.refresh(paziente)
    db_session.refresh(turno_b)

    headers = auth_headers(client, infermiere.email, "password123")
    response = client.post(
        f"/api/v1/pazienti/{paziente.id}/diario-cedema",
        headers=headers,
        json=_voce_payload(turno_id=turno_b.id),
    )
    assert response.status_code == 403
