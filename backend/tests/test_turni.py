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


def _turno(db_session, reparto_id, data=None, tipo=None):
    from app.models.enums import TipoTurno
    from app.models.turno import Turno

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
    return turno


def test_calendario_turni_include_assegnazioni_attive(client, db_session, caposala_a, reparti):
    from app.models.enums import StatoAssegnazione
    from app.models.turno import AssegnazioneTurno

    reparto_a, _ = reparti
    infermiere = _infermiere(db_session, reparto_a.id)
    turno_coperto = _turno(db_session, reparto_a.id)
    _turno(db_session, reparto_a.id, data=datetime.date.today() + datetime.timedelta(days=1))

    assegnazione = AssegnazioneTurno(
        turno_id=turno_coperto.id, infermiere_id=infermiere.id, stato=StatoAssegnazione.attiva
    )
    db_session.add(assegnazione)
    db_session.commit()

    headers = auth_headers(client, "caposala.a@example.com", "password123")
    response = client.get("/api/v1/turni/calendario", headers=headers)

    assert response.status_code == 200, response.text
    body = response.json()
    assert len(body) == 2
    coperto = next(t for t in body if t["id"] == turno_coperto.id)
    scoperto = next(t for t in body if t["id"] != turno_coperto.id)
    assert len(coperto["assegnazioni"]) == 1
    assert coperto["assegnazioni"][0]["infermiere_id"] == infermiere.id
    assert scoperto["assegnazioni"] == []


def test_calendario_turni_forbidden_per_infermiere(client, db_session, reparti):
    reparto_a, _ = reparti
    infermiere = _infermiere(db_session, reparto_a.id)

    headers = auth_headers(client, infermiere.email, "password123")
    response = client.get("/api/v1/turni/calendario", headers=headers)

    assert response.status_code == 403


def test_turni_scoperti_include_turni_con_meno_di_due_infermieri(client, db_session, caposala_a, reparti):
    from app.models.enums import StatoAssegnazione
    from app.models.turno import AssegnazioneTurno

    reparto_a, _ = reparti
    infermiere_a = _infermiere(db_session, reparto_a.id, "nurse.cover.a@example.com")
    infermiere_b = _infermiere(db_session, reparto_a.id, "nurse.cover.b@example.com")
    turno_zero = _turno(db_session, reparto_a.id, data=datetime.date.today())
    turno_uno = _turno(db_session, reparto_a.id, data=datetime.date.today() + datetime.timedelta(days=1))
    turno_due = _turno(db_session, reparto_a.id, data=datetime.date.today() + datetime.timedelta(days=2))
    db_session.add_all(
        [
            AssegnazioneTurno(
                turno_id=turno_uno.id,
                infermiere_id=infermiere_a.id,
                stato=StatoAssegnazione.attiva,
            ),
            AssegnazioneTurno(
                turno_id=turno_due.id,
                infermiere_id=infermiere_a.id,
                stato=StatoAssegnazione.attiva,
            ),
            AssegnazioneTurno(
                turno_id=turno_due.id,
                infermiere_id=infermiere_b.id,
                stato=StatoAssegnazione.attiva,
            ),
        ]
    )
    db_session.commit()

    headers = auth_headers(client, "caposala.a@example.com", "password123")
    response = client.get("/api/v1/turni/scoperti", headers=headers)

    assert response.status_code == 200, response.text
    assert [turno["id"] for turno in response.json()] == [turno_zero.id, turno_uno.id]


def test_assegna_turno_accetta_solo_utenti_infermieri(client, db_session, caposala_a, reparti):
    reparto_a, _ = reparti
    turno = _turno(db_session, reparto_a.id, data=datetime.date.today() + datetime.timedelta(days=3))

    headers = auth_headers(client, "caposala.a@example.com", "password123")
    response = client.post(
        f"/api/v1/turni/{turno.id}/assegnazioni",
        headers=headers,
        json={"infermiere_id": caposala_a.id},
    )

    assert response.status_code == 403


def test_rimuovi_assegnazione_con_cambio_pendente_ritorna_409(client, db_session, caposala_a, reparti):
    from app.models.cambio_turno import RichiestaCambioTurno
    from app.models.enums import StatoAssegnazione, StatoCambioTurno
    from app.models.turno import AssegnazioneTurno

    reparto_a, _ = reparti
    infermiere_a = _infermiere(db_session, reparto_a.id, "nurse.a@example.com")
    infermiere_b = _infermiere(db_session, reparto_a.id, "nurse.b@example.com")
    turno = _turno(db_session, reparto_a.id)

    assegnazione = AssegnazioneTurno(
        turno_id=turno.id, infermiere_id=infermiere_a.id, stato=StatoAssegnazione.attiva
    )
    db_session.add(assegnazione)
    db_session.commit()
    db_session.refresh(assegnazione)

    richiesta = RichiestaCambioTurno(
        assegnazione_turno_id=assegnazione.id,
        richiedente_id=infermiere_a.id,
        collega_id=infermiere_b.id,
        stato=StatoCambioTurno.in_attesa_collega,
    )
    db_session.add(richiesta)
    db_session.commit()

    headers = auth_headers(client, "caposala.a@example.com", "password123")
    response = client.delete(
        f"/api/v1/turni/{turno.id}/assegnazioni",
        headers=headers,
        params={"assegnazione_id": assegnazione.id},
    )

    assert response.status_code == 409, response.text
    assert db_session.get(AssegnazioneTurno, assegnazione.id) is not None


def test_miei_prossimi_turni_include_colleghi_stesso_turno(client, db_session, reparti):
    from app.models.enums import StatoAssegnazione
    from app.models.turno import AssegnazioneTurno

    reparto_a, reparto_b = reparti
    infermiere = _infermiere(db_session, reparto_a.id, "nurse.me@example.com")
    collega_a = _infermiere(db_session, reparto_a.id, "nurse.b@example.com")
    collega_b = _infermiere(db_session, reparto_a.id, "nurse.c@example.com")
    collega_altro_reparto = _infermiere(db_session, reparto_b.id, "nurse.other@example.com")
    turno_passato = _turno(db_session, reparto_a.id, data=datetime.date.today() - datetime.timedelta(days=1))
    turno = _turno(db_session, reparto_a.id, data=datetime.date.today() + datetime.timedelta(days=1))
    turno_successivo = _turno(
        db_session, reparto_a.id, data=datetime.date.today() + datetime.timedelta(days=2)
    )

    db_session.add_all(
        [
            AssegnazioneTurno(
                turno_id=turno_passato.id,
                infermiere_id=infermiere.id,
                stato=StatoAssegnazione.attiva,
            ),
            AssegnazioneTurno(
                turno_id=turno.id,
                infermiere_id=infermiere.id,
                stato=StatoAssegnazione.attiva,
            ),
            AssegnazioneTurno(
                turno_id=turno.id,
                infermiere_id=collega_b.id,
                stato=StatoAssegnazione.attiva,
            ),
            AssegnazioneTurno(
                turno_id=turno.id,
                infermiere_id=collega_a.id,
                stato=StatoAssegnazione.attiva,
            ),
            AssegnazioneTurno(
                turno_id=turno.id,
                infermiere_id=collega_altro_reparto.id,
                stato=StatoAssegnazione.attiva,
            ),
            AssegnazioneTurno(
                turno_id=turno_successivo.id,
                infermiere_id=infermiere.id,
                stato=StatoAssegnazione.attiva,
            ),
        ]
    )
    db_session.commit()

    headers = auth_headers(client, infermiere.email, "password123")
    response = client.get("/api/v1/turni/miei-prossimi-turni", headers=headers)

    assert response.status_code == 200, response.text
    body = response.json()
    assert [entry["turno"]["id"] for entry in body] == [turno.id, turno_successivo.id]
    assert {collega["id"] for collega in body[0]["colleghi"]} == {collega_a.id, collega_b.id}
    assert body[1]["colleghi"] == []


def test_miei_prossimi_turni_forbidden_per_caposala(client, caposala_a):
    headers = auth_headers(client, "caposala.a@example.com", "password123")
    response = client.get("/api/v1/turni/miei-prossimi-turni", headers=headers)

    assert response.status_code == 403
