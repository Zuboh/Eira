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


def _payload():
    return {
        "turno_id": None,
        "temperatura": 37.2,
        "frequenza_cardiaca": 82,
        "pressione_sistolica": 125,
        "pressione_diastolica": 80,
        "frequenza_respiratoria": 18,
        "saturazione_o2": 97,
        "stato_coscienza": "vigile",
        "ossigeno": False,
        "note": "Paziente collaborante.",
    }


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


def test_create_and_list_parametri_vitali(client, db_session, reparti):
    reparto_a, _ = reparti
    from app.models.turno import Turno
    from app.models.enums import TipoTurno

    infermiere = _infermiere(db_session, reparto_a.id)
    paziente = _paziente(reparto_a.id)
    turno = Turno(
        data=datetime.date.today(),
        tipo=TipoTurno.mattina,
        reparto_id=reparto_a.id,
        ora_inizio=datetime.time(7, 0),
        ora_fine=datetime.time(14, 0),
    )
    db_session.add_all([paziente, turno])
    db_session.commit()
    db_session.refresh(paziente)
    db_session.refresh(turno)

    headers = auth_headers(client, infermiere.email, "password123")
    response = client.post(
        f"/api/v1/pazienti/{paziente.id}/parametri-vitali",
        headers=headers,
        json={**_payload(), "turno_id": turno.id},
    )
    assert response.status_code == 201, response.text
    assert response.json()["paziente_id"] == paziente.id

    listed = client.get(f"/api/v1/pazienti/{paziente.id}/parametri-vitali", headers=headers)
    assert listed.status_code == 200
    assert len(listed.json()) == 1
    assert listed.json()[0]["temperatura"] == 37.2


def test_create_parametri_vitali_other_reparto_forbidden(client, db_session, reparti):
    reparto_a, reparto_b = reparti
    infermiere = _infermiere(db_session, reparto_a.id)
    paziente = _paziente(reparto_b.id)
    db_session.add(paziente)
    db_session.commit()
    db_session.refresh(paziente)

    headers = auth_headers(client, infermiere.email, "password123")
    response = client.post(
        f"/api/v1/pazienti/{paziente.id}/parametri-vitali",
        headers=headers,
        json=_payload(),
    )
    assert response.status_code == 403


def test_create_parametri_vitali_turno_other_reparto_forbidden(client, db_session, reparti):
    reparto_a, reparto_b = reparti
    from app.models.turno import Turno
    from app.models.enums import TipoTurno

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
        f"/api/v1/pazienti/{paziente.id}/parametri-vitali",
        headers=headers,
        json={**_payload(), "turno_id": turno_b.id},
    )
    assert response.status_code == 403
