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


def _norton_payload():
    return {
        "data_valutazione": datetime.date.today().isoformat(),
        "condizioni_generali": 3,
        "stato_mentale": 3,
        "attivita": 2,
        "mobilita": 2,
        "incontinenza": 3,
    }


def _conley_payload():
    return {
        "data_valutazione": datetime.date.today().isoformat(),
        "storia_cadute": 1,
        "deficit_visivo": 0,
        "alterazione_eliminazione": 1,
        "agitazione": 0,
        "deficit_vista_osservato": 0,
        "andatura_alterata": 1,
    }


def test_create_norton_computes_punteggio_totale(client, db_session, reparti):
    reparto_a, _ = reparti
    infermiere = _infermiere(db_session, reparto_a.id)
    paziente = _paziente(reparto_a.id)
    db_session.add(paziente)
    db_session.commit()
    db_session.refresh(paziente)

    headers = auth_headers(client, infermiere.email, "password123")
    response = client.post(
        f"/api/v1/pazienti/{paziente.id}/norton", headers=headers, json=_norton_payload()
    )

    assert response.status_code == 201, response.text
    body = response.json()
    assert body["autore_id"] == infermiere.id
    assert body["punteggio_totale"] == 3 + 3 + 2 + 2 + 3


def test_create_norton_other_reparto_forbidden(client, db_session, reparti):
    reparto_a, reparto_b = reparti
    infermiere = _infermiere(db_session, reparto_a.id)
    paziente_b = _paziente(reparto_b.id)
    db_session.add(paziente_b)
    db_session.commit()
    db_session.refresh(paziente_b)

    headers = auth_headers(client, infermiere.email, "password123")
    response = client.post(
        f"/api/v1/pazienti/{paziente_b.id}/norton", headers=headers, json=_norton_payload()
    )

    assert response.status_code == 403


def test_list_norton_same_reparto_succeeds(client, db_session, reparti):
    reparto_a, _ = reparti
    infermiere = _infermiere(db_session, reparto_a.id)
    paziente = _paziente(reparto_a.id)
    db_session.add(paziente)
    db_session.commit()
    db_session.refresh(paziente)

    headers = auth_headers(client, infermiere.email, "password123")
    client.post(f"/api/v1/pazienti/{paziente.id}/norton", headers=headers, json=_norton_payload())

    response = client.get(f"/api/v1/pazienti/{paziente.id}/norton", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_list_norton_other_reparto_forbidden(client, db_session, reparti):
    reparto_a, reparto_b = reparti
    infermiere = _infermiere(db_session, reparto_a.id)
    paziente_b = _paziente(reparto_b.id)
    db_session.add(paziente_b)
    db_session.commit()
    db_session.refresh(paziente_b)

    headers = auth_headers(client, infermiere.email, "password123")
    response = client.get(f"/api/v1/pazienti/{paziente_b.id}/norton", headers=headers)
    assert response.status_code == 403


def test_create_conley_computes_punteggio_totale(client, db_session, reparti):
    reparto_a, _ = reparti
    infermiere = _infermiere(db_session, reparto_a.id)
    paziente = _paziente(reparto_a.id)
    db_session.add(paziente)
    db_session.commit()
    db_session.refresh(paziente)

    headers = auth_headers(client, infermiere.email, "password123")
    response = client.post(
        f"/api/v1/pazienti/{paziente.id}/conley", headers=headers, json=_conley_payload()
    )

    assert response.status_code == 201, response.text
    body = response.json()
    assert body["autore_id"] == infermiere.id
    assert body["punteggio_totale"] == 1 + 0 + 1 + 0 + 0 + 1


def test_create_conley_other_reparto_forbidden(client, db_session, reparti):
    reparto_a, reparto_b = reparti
    infermiere = _infermiere(db_session, reparto_a.id)
    paziente_b = _paziente(reparto_b.id)
    db_session.add(paziente_b)
    db_session.commit()
    db_session.refresh(paziente_b)

    headers = auth_headers(client, infermiere.email, "password123")
    response = client.post(
        f"/api/v1/pazienti/{paziente_b.id}/conley", headers=headers, json=_conley_payload()
    )

    assert response.status_code == 403


def test_valutazioni_aggregate_returns_both(client, db_session, reparti):
    reparto_a, _ = reparti
    infermiere = _infermiere(db_session, reparto_a.id)
    paziente = _paziente(reparto_a.id)
    db_session.add(paziente)
    db_session.commit()
    db_session.refresh(paziente)

    headers = auth_headers(client, infermiere.email, "password123")
    client.post(f"/api/v1/pazienti/{paziente.id}/norton", headers=headers, json=_norton_payload())
    client.post(f"/api/v1/pazienti/{paziente.id}/conley", headers=headers, json=_conley_payload())

    response = client.get(f"/api/v1/pazienti/{paziente.id}/valutazioni", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert len(body["norton"]) == 1
    assert len(body["conley"]) == 1
