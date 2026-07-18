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
    return utente


def _turno_con_assegnazione(db_session, reparto_id, infermiere_id, data=None, tipo=None):
    from app.models.enums import StatoAssegnazione, TipoTurno
    from app.models.turno import AssegnazioneTurno, Turno

    turno = Turno(
        data=data or datetime.date.today(),
        tipo=tipo or TipoTurno.mattina,
        reparto_id=reparto_id,
        ora_inizio=datetime.time(7, 0),
        ora_fine=datetime.time(14, 0),
    )
    db_session.add(turno)
    db_session.commit()
    db_session.refresh(turno)

    assegnazione = AssegnazioneTurno(
        turno_id=turno.id, infermiere_id=infermiere_id, stato=StatoAssegnazione.attiva
    )
    db_session.add(assegnazione)
    db_session.commit()
    db_session.refresh(assegnazione)
    return turno, assegnazione


def test_create_richiesta_only_own_assegnazione(client, db_session, reparti):
    reparto_a, _ = reparti
    infermiere_a = _infermiere(db_session, reparto_a.id, "nurse.a@example.com")
    infermiere_b = _infermiere(db_session, reparto_a.id, "nurse.b@example.com")
    infermiere_c = _infermiere(db_session, reparto_a.id, "nurse.c@example.com")
    _, assegnazione_b = _turno_con_assegnazione(db_session, reparto_a.id, infermiere_b.id)

    headers_a = auth_headers(client, infermiere_a.email, "password123")
    response = client.post(
        "/api/v1/cambi-turno/",
        headers=headers_a,
        json={"assegnazione_turno_id": assegnazione_b.id, "collega_id": infermiere_c.id},
    )
    assert response.status_code == 403


def test_full_flow_accepted_swaps_infermiere(client, db_session, reparti):
    reparto_a, _ = reparti
    infermiere_a = _infermiere(db_session, reparto_a.id, "nurse.a@example.com")
    infermiere_b = _infermiere(db_session, reparto_a.id, "nurse.b@example.com")
    from app.core.security import hash_password
    from app.models.enums import RuoloUtente
    from app.models.utente import Utente

    caposala = Utente(
        email="caposala.a@example.com",
        password_hash=hash_password("password123"),
        nome="Anna",
        cognome="Rossi",
        ruolo=RuoloUtente.caposala,
        reparto_id=reparto_a.id,
    )
    db_session.add(caposala)
    db_session.commit()

    turno, assegnazione = _turno_con_assegnazione(db_session, reparto_a.id, infermiere_a.id)

    headers_a = auth_headers(client, infermiere_a.email, "password123")
    created = client.post(
        "/api/v1/cambi-turno/",
        headers=headers_a,
        json={"assegnazione_turno_id": assegnazione.id, "collega_id": infermiere_b.id},
    )
    assert created.status_code == 201, created.text
    richiesta_id = created.json()["id"]
    assert created.json()["stato"] == "in_attesa_collega"

    headers_b = auth_headers(client, infermiere_b.email, "password123")
    accettata_collega = client.post(
        f"/api/v1/cambi-turno/{richiesta_id}/risposta-collega",
        headers=headers_b,
        json={"accetta": True},
    )
    assert accettata_collega.status_code == 200
    assert accettata_collega.json()["stato"] == "in_attesa_caposala"

    headers_caposala = auth_headers(client, "caposala.a@example.com", "password123")
    approvata = client.post(
        f"/api/v1/cambi-turno/{richiesta_id}/risposta-caposala",
        headers=headers_caposala,
        json={"accetta": True},
    )
    assert approvata.status_code == 200
    assert approvata.json()["stato"] == "approvata"

    db_session.refresh(assegnazione)
    assert assegnazione.infermiere_id == infermiere_b.id


def test_collega_rifiuta_stops_flow(client, db_session, reparti):
    reparto_a, _ = reparti
    infermiere_a = _infermiere(db_session, reparto_a.id, "nurse.a@example.com")
    infermiere_b = _infermiere(db_session, reparto_a.id, "nurse.b@example.com")
    turno, assegnazione = _turno_con_assegnazione(db_session, reparto_a.id, infermiere_a.id)

    headers_a = auth_headers(client, infermiere_a.email, "password123")
    created = client.post(
        "/api/v1/cambi-turno/",
        headers=headers_a,
        json={"assegnazione_turno_id": assegnazione.id, "collega_id": infermiere_b.id},
    )
    richiesta_id = created.json()["id"]

    headers_b = auth_headers(client, infermiere_b.email, "password123")
    rifiutata = client.post(
        f"/api/v1/cambi-turno/{richiesta_id}/risposta-collega",
        headers=headers_b,
        json={"accetta": False},
    )
    assert rifiutata.status_code == 200
    assert rifiutata.json()["stato"] == "rifiutata_collega"

    # richiesta not in attesa caposala anymore -> caposala response now invalid
    from app.core.security import hash_password
    from app.models.enums import RuoloUtente
    from app.models.utente import Utente

    caposala = Utente(
        email="caposala.a@example.com",
        password_hash=hash_password("password123"),
        nome="Anna",
        cognome="Rossi",
        ruolo=RuoloUtente.caposala,
        reparto_id=reparto_a.id,
    )
    db_session.add(caposala)
    db_session.commit()
    headers_caposala = auth_headers(client, "caposala.a@example.com", "password123")
    response = client.post(
        f"/api/v1/cambi-turno/{richiesta_id}/risposta-caposala",
        headers=headers_caposala,
        json={"accetta": True},
    )
    assert response.status_code == 409


def test_richiedente_puo_annullare_richiesta_pendente(client, db_session, reparti):
    reparto_a, _ = reparti
    infermiere_a = _infermiere(db_session, reparto_a.id, "nurse.a@example.com")
    infermiere_b = _infermiere(db_session, reparto_a.id, "nurse.b@example.com")
    turno, assegnazione = _turno_con_assegnazione(db_session, reparto_a.id, infermiere_a.id)

    headers_a = auth_headers(client, infermiere_a.email, "password123")
    created = client.post(
        "/api/v1/cambi-turno/",
        headers=headers_a,
        json={"assegnazione_turno_id": assegnazione.id, "collega_id": infermiere_b.id},
    )
    richiesta_id = created.json()["id"]

    deleted = client.delete(f"/api/v1/cambi-turno/{richiesta_id}", headers=headers_a)
    assert deleted.status_code == 204

    listed = client.get("/api/v1/cambi-turno/", headers=headers_a)
    assert listed.json() == []


def test_collega_non_puo_annullare_richiesta_altrui(client, db_session, reparti):
    reparto_a, _ = reparti
    infermiere_a = _infermiere(db_session, reparto_a.id, "nurse.a@example.com")
    infermiere_b = _infermiere(db_session, reparto_a.id, "nurse.b@example.com")
    turno, assegnazione = _turno_con_assegnazione(db_session, reparto_a.id, infermiere_a.id)

    headers_a = auth_headers(client, infermiere_a.email, "password123")
    created = client.post(
        "/api/v1/cambi-turno/",
        headers=headers_a,
        json={"assegnazione_turno_id": assegnazione.id, "collega_id": infermiere_b.id},
    )
    richiesta_id = created.json()["id"]

    headers_b = auth_headers(client, infermiere_b.email, "password123")
    response = client.delete(f"/api/v1/cambi-turno/{richiesta_id}", headers=headers_b)
    assert response.status_code == 403


def test_annullamento_richiesta_gia_approvata_vietato(client, db_session, reparti):
    reparto_a, _ = reparti
    infermiere_a = _infermiere(db_session, reparto_a.id, "nurse.a@example.com")
    infermiere_b = _infermiere(db_session, reparto_a.id, "nurse.b@example.com")
    from app.core.security import hash_password
    from app.models.enums import RuoloUtente
    from app.models.utente import Utente

    caposala = Utente(
        email="caposala.a@example.com",
        password_hash=hash_password("password123"),
        nome="Anna",
        cognome="Rossi",
        ruolo=RuoloUtente.caposala,
        reparto_id=reparto_a.id,
    )
    db_session.add(caposala)
    db_session.commit()

    turno, assegnazione = _turno_con_assegnazione(db_session, reparto_a.id, infermiere_a.id)

    headers_a = auth_headers(client, infermiere_a.email, "password123")
    created = client.post(
        "/api/v1/cambi-turno/",
        headers=headers_a,
        json={"assegnazione_turno_id": assegnazione.id, "collega_id": infermiere_b.id},
    )
    richiesta_id = created.json()["id"]

    headers_b = auth_headers(client, infermiere_b.email, "password123")
    client.post(
        f"/api/v1/cambi-turno/{richiesta_id}/risposta-collega",
        headers=headers_b,
        json={"accetta": True},
    )
    headers_caposala = auth_headers(client, "caposala.a@example.com", "password123")
    client.post(
        f"/api/v1/cambi-turno/{richiesta_id}/risposta-caposala",
        headers=headers_caposala,
        json={"accetta": True},
    )

    response = client.delete(f"/api/v1/cambi-turno/{richiesta_id}", headers=headers_a)
    assert response.status_code == 409


def test_caposala_rejects_doppio_turno_on_approval(client, db_session, reparti):
    reparto_a, _ = reparti
    infermiere_a = _infermiere(db_session, reparto_a.id, "nurse.a@example.com")
    infermiere_b = _infermiere(db_session, reparto_a.id, "nurse.b@example.com")
    from app.core.security import hash_password
    from app.models.enums import RuoloUtente
    from app.models.utente import Utente

    caposala = Utente(
        email="caposala.a@example.com",
        password_hash=hash_password("password123"),
        nome="Anna",
        cognome="Rossi",
        ruolo=RuoloUtente.caposala,
        reparto_id=reparto_a.id,
    )
    db_session.add(caposala)
    db_session.commit()

    from app.models.enums import TipoTurno

    data = datetime.date.today()
    turno, assegnazione = _turno_con_assegnazione(db_session, reparto_a.id, infermiere_a.id, data)
    # infermiere_b already working same day on a different turno
    _turno_con_assegnazione(db_session, reparto_a.id, infermiere_b.id, data, TipoTurno.pomeriggio)

    headers_a = auth_headers(client, infermiere_a.email, "password123")
    created = client.post(
        "/api/v1/cambi-turno/",
        headers=headers_a,
        json={"assegnazione_turno_id": assegnazione.id, "collega_id": infermiere_b.id},
    )
    richiesta_id = created.json()["id"]

    headers_b = auth_headers(client, infermiere_b.email, "password123")
    client.post(
        f"/api/v1/cambi-turno/{richiesta_id}/risposta-collega",
        headers=headers_b,
        json={"accetta": True},
    )

    headers_caposala = auth_headers(client, "caposala.a@example.com", "password123")
    response = client.post(
        f"/api/v1/cambi-turno/{richiesta_id}/risposta-caposala",
        headers=headers_caposala,
        json={"accetta": True},
    )
    assert response.status_code == 409
