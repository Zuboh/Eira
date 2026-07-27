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


def _turno_con_assegnazione(db_session, reparto_id, infermiere_id, data=None, tipo=None):
    from app.models.enums import StatoAssegnazione
    from app.models.turno import AssegnazioneTurno

    turno = _turno(db_session, reparto_id, data=data, tipo=tipo)
    assegnazione = AssegnazioneTurno(
        turno_id=turno.id, infermiere_id=infermiere_id, stato=StatoAssegnazione.attiva
    )
    db_session.add(assegnazione)
    db_session.commit()
    db_session.refresh(assegnazione)
    return turno, assegnazione


def test_dashboard_caposala_conta_solo_turni_senza_infermieri_e_cambi_in_attesa(
    client, db_session, caposala_a, reparti
):
    from app.models.cambio_turno import RichiestaCambioTurno
    from app.models.enums import StatoCambioTurno

    reparto_a, _ = reparti
    infermiere_a = _infermiere(db_session, reparto_a.id, "nurse.a@example.com")
    infermiere_b = _infermiere(db_session, reparto_a.id, "nurse.b@example.com")

    _turno(db_session, reparto_a.id, tipo=None)  # turno scoperto (nessuna assegnazione)
    _, assegnazione = _turno_con_assegnazione(
        db_session, reparto_a.id, infermiere_a.id, data=datetime.date.today() + datetime.timedelta(days=1)
    )
    turno_coperto, _ = _turno_con_assegnazione(
        db_session, reparto_a.id, infermiere_a.id, data=datetime.date.today() + datetime.timedelta(days=2)
    )
    from app.models.enums import StatoAssegnazione
    from app.models.turno import AssegnazioneTurno

    db_session.add(
        AssegnazioneTurno(
            turno_id=turno_coperto.id,
            infermiere_id=infermiere_b.id,
            stato=StatoAssegnazione.attiva,
        )
    )
    richiesta = RichiestaCambioTurno(
        assegnazione_turno_id=assegnazione.id,
        richiedente_id=infermiere_a.id,
        collega_id=infermiere_b.id,
        stato=StatoCambioTurno.in_attesa_collega,
    )
    db_session.add(richiesta)
    db_session.commit()

    headers = auth_headers(client, "caposala.a@example.com", "password123")
    response = client.get("/api/v1/dashboard/caposala", headers=headers)

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["turni_scoperti_count"] == 1
    assert body["cambi_turno_in_attesa_count"] == 1


def test_dashboard_caposala_esclude_turni_passati(client, db_session, caposala_a, reparti):
    reparto_a, _ = reparti
    ieri = datetime.date.today() - datetime.timedelta(days=1)
    _turno(db_session, reparto_a.id, data=ieri)
    _turno(db_session, reparto_a.id, data=datetime.date.today())

    headers = auth_headers(client, "caposala.a@example.com", "password123")
    body = client.get("/api/v1/dashboard/caposala", headers=headers).json()

    assert body["turni_scoperti_count"] == 1
    assert all(t["data"] >= datetime.date.today().isoformat() for t in body["turni_scoperti"])


def test_dashboard_caposala_esclude_tipi_non_lavorativi(client, db_session, caposala_a, reparti):
    from app.models.enums import TipoTurno

    reparto_a, _ = reparti
    # riposo/ferie sono assenze: non serve assegnare un infermiere
    _turno(db_session, reparto_a.id, tipo=TipoTurno.riposo)
    _turno(db_session, reparto_a.id, tipo=TipoTurno.ferie)
    _turno(db_session, reparto_a.id, tipo=TipoTurno.ferie_estive)
    _turno(db_session, reparto_a.id, tipo=TipoTurno.notte)

    headers = auth_headers(client, "caposala.a@example.com", "password123")
    body = client.get("/api/v1/dashboard/caposala", headers=headers).json()

    assert body["turni_scoperti_count"] == 1
    assert [t["tipo"] for t in body["turni_scoperti"]] == ["notte"]


def test_dashboard_caposala_finestra_giorni(client, db_session, caposala_a, reparti):
    from app.models.enums import TipoTurno

    reparto_a, _ = reparti
    oggi = datetime.date.today()
    _turno(db_session, reparto_a.id, data=oggi, tipo=TipoTurno.mattina)
    _turno(db_session, reparto_a.id, data=oggi + datetime.timedelta(days=9), tipo=TipoTurno.mattina)

    headers = auth_headers(client, "caposala.a@example.com", "password123")

    body_7 = client.get("/api/v1/dashboard/caposala", headers=headers).json()
    assert body_7["turni_scoperti_count"] == 1

    body_14 = client.get("/api/v1/dashboard/caposala?giorni=14", headers=headers).json()
    assert body_14["turni_scoperti_count"] == 2

    assert client.get("/api/v1/dashboard/caposala?giorni=99", headers=headers).status_code == 422


def test_dashboard_caposala_count_resta_reale_oltre_il_limite(client, db_session, caposala_a, reparti):
    from app.routers.dashboard import LIMITE_TURNI_SCOPERTI

    reparto_a, _ = reparti
    oggi = datetime.date.today()
    tipi = _tipi_lavorativi()
    # 3 tipi * N giorni: supera il limite di lista restando dentro la finestra
    totale = LIMITE_TURNI_SCOPERTI + 3
    for i in range(totale):
        _turno(
            db_session,
            reparto_a.id,
            data=oggi + datetime.timedelta(days=i // 3),
            tipo=tipi[i % 3],
        )

    headers = auth_headers(client, "caposala.a@example.com", "password123")
    body = client.get("/api/v1/dashboard/caposala?giorni=30", headers=headers).json()

    assert body["turni_scoperti_count"] == totale
    assert len(body["turni_scoperti"]) == LIMITE_TURNI_SCOPERTI

    body_senza_troncamento = client.get(
        "/api/v1/dashboard/caposala?giorni=30&limit=90",
        headers=headers,
    ).json()
    assert body_senza_troncamento["turni_scoperti_count"] == totale
    assert len(body_senza_troncamento["turni_scoperti"]) == totale

    assert (
        client.get(
            "/api/v1/dashboard/caposala?giorni=30&limit=91",
            headers=headers,
        ).status_code
        == 422
    )


def _tipi_lavorativi():
    from app.models.enums import TipoTurno

    return [TipoTurno.mattina, TipoTurno.pomeriggio, TipoTurno.notte]


def test_dashboard_caposala_forbidden_per_infermiere(client, db_session, reparti):
    reparto_a, _ = reparti
    infermiere = _infermiere(db_session, reparto_a.id)

    headers = auth_headers(client, infermiere.email, "password123")
    response = client.get("/api/v1/dashboard/caposala", headers=headers)

    assert response.status_code == 403
