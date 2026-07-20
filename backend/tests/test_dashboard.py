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


def test_dashboard_caposala_conta_turni_con_meno_di_due_infermieri_e_cambi_in_attesa(
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
    assert body["turni_scoperti_count"] == 2
    assert body["cambi_turno_in_attesa_count"] == 1


def test_dashboard_caposala_forbidden_per_infermiere(client, db_session, reparti):
    reparto_a, _ = reparti
    infermiere = _infermiere(db_session, reparto_a.id)

    headers = auth_headers(client, infermiere.email, "password123")
    response = client.get("/api/v1/dashboard/caposala", headers=headers)

    assert response.status_code == 403
