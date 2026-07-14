import datetime

from tests.conftest import auth_headers


def _setup_turno_paziente_assegnazione(db_session, reparto_id, infermiere_id, assegna=True):
    from app.models.enums import StatoAssegnazione, TipoTurno
    from app.models.paziente import Paziente
    from app.models.turno import AssegnazioneTurno, Turno

    turno = Turno(
        data=datetime.date.today(),
        tipo=TipoTurno.mattina,
        reparto_id=reparto_id,
        ora_inizio=datetime.time(7, 0),
        ora_fine=datetime.time(14, 0),
    )
    paziente = Paziente(
        nome="Mario",
        cognome="Bianchi",
        eta=72,
        letto="3B",
        data_ricovero=datetime.date.today(),
        diagnosi_ingresso="polmonite",
        reparto_id=reparto_id,
    )
    db_session.add_all([turno, paziente])
    db_session.commit()
    db_session.refresh(turno)
    db_session.refresh(paziente)

    if assegna:
        assegnazione = AssegnazioneTurno(
            turno_id=turno.id, infermiere_id=infermiere_id, stato=StatoAssegnazione.attiva
        )
        db_session.add(assegnazione)
        db_session.commit()

    return turno, paziente


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


def test_create_consegna_requires_assegnazione(client, db_session, reparti):
    reparto_a, _ = reparti
    infermiere = _infermiere(db_session, reparto_a.id)
    turno, paziente = _setup_turno_paziente_assegnazione(
        db_session, reparto_a.id, infermiere.id, assegna=False
    )

    headers = auth_headers(client, infermiere.email, "password123")
    response = client.post(
        "/api/v1/consegne-sbar/",
        headers=headers,
        json={
            "paziente_id": paziente.id,
            "turno_id": turno.id,
            "situation": "s",
            "background": "b",
            "assessment": "a",
            "recommendation": "r",
        },
    )
    assert response.status_code == 403


def test_create_and_get_own_consegna(client, db_session, reparti):
    reparto_a, _ = reparti
    infermiere = _infermiere(db_session, reparto_a.id)
    turno, paziente = _setup_turno_paziente_assegnazione(db_session, reparto_a.id, infermiere.id)

    headers = auth_headers(client, infermiere.email, "password123")
    response = client.post(
        "/api/v1/consegne-sbar/",
        headers=headers,
        json={
            "paziente_id": paziente.id,
            "turno_id": turno.id,
            "situation": "s",
            "background": "b",
            "assessment": "a",
            "recommendation": "r",
        },
    )
    assert response.status_code == 201, response.text
    assert response.json()["autore_id"] == infermiere.id

    listed = client.get("/api/v1/consegne-sbar/", headers=headers)
    assert listed.status_code == 200
    assert len(listed.json()) == 1


def test_infermiere_not_assigned_does_not_see_others_consegna(client, db_session, reparti):
    reparto_a, _ = reparti
    infermiere_a = _infermiere(db_session, reparto_a.id, "nurse.a@example.com")
    infermiere_b = _infermiere(db_session, reparto_a.id, "nurse.b@example.com")
    turno, paziente = _setup_turno_paziente_assegnazione(
        db_session, reparto_a.id, infermiere_a.id
    )

    headers_a = auth_headers(client, infermiere_a.email, "password123")
    client.post(
        "/api/v1/consegne-sbar/",
        headers=headers_a,
        json={
            "paziente_id": paziente.id,
            "turno_id": turno.id,
            "situation": "s",
            "background": "b",
            "assessment": "a",
            "recommendation": "r",
        },
    )

    headers_b = auth_headers(client, infermiere_b.email, "password123")
    listed = client.get("/api/v1/consegne-sbar/", headers=headers_b)
    assert listed.status_code == 200
    assert listed.json() == []


def test_update_consegna_only_by_author(client, db_session, reparti):
    reparto_a, _ = reparti
    infermiere_a = _infermiere(db_session, reparto_a.id, "nurse.a@example.com")
    infermiere_b = _infermiere(db_session, reparto_a.id, "nurse.b@example.com")
    turno, paziente = _setup_turno_paziente_assegnazione(
        db_session, reparto_a.id, infermiere_a.id
    )
    from app.models.enums import StatoAssegnazione
    from app.models.turno import AssegnazioneTurno

    db_session.add(
        AssegnazioneTurno(
            turno_id=turno.id, infermiere_id=infermiere_b.id, stato=StatoAssegnazione.attiva
        )
    )
    db_session.commit()

    headers_a = auth_headers(client, infermiere_a.email, "password123")
    created = client.post(
        "/api/v1/consegne-sbar/",
        headers=headers_a,
        json={
            "paziente_id": paziente.id,
            "turno_id": turno.id,
            "situation": "s",
            "background": "b",
            "assessment": "a",
            "recommendation": "r",
        },
    )
    consegna_id = created.json()["id"]

    headers_b = auth_headers(client, infermiere_b.email, "password123")
    forbidden = client.patch(
        f"/api/v1/consegne-sbar/{consegna_id}", headers=headers_b, json={"situation": "hacked"}
    )
    assert forbidden.status_code == 403

    ok = client.patch(
        f"/api/v1/consegne-sbar/{consegna_id}", headers=headers_a, json={"situation": "updated"}
    )
    assert ok.status_code == 200
    assert ok.json()["situation"] == "updated"
