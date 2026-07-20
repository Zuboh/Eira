import datetime

from tests.conftest import auth_headers


def _infermiere(db_session, reparto_id, email="nurse.farmaci@example.com"):
    from app.core.security import hash_password
    from app.models.enums import RuoloUtente
    from app.models.utente import Utente

    utente = Utente(
        email=email,
        password_hash=hash_password("password123"),
        nome="Nurse",
        cognome="Farmaci",
        ruolo=RuoloUtente.infermiere,
        reparto_id=reparto_id,
    )
    db_session.add(utente)
    db_session.commit()
    db_session.refresh(utente)
    return utente


def _carello(db_session, reparto_id, nome="Paracetamolo", quantita=10, soglia=5):
    from app.models.farmaco import CarelloFarmaco, Farmaco

    farmaco = Farmaco(nome=nome, unita_misura="compresse", categoria="Analgesici")
    db_session.add(farmaco)
    db_session.commit()
    db_session.refresh(farmaco)
    carello = CarelloFarmaco(
        farmaco_id=farmaco.id,
        reparto_id=reparto_id,
        quantita=quantita,
        soglia_minima=soglia,
        prossima_scadenza=datetime.date.today() + datetime.timedelta(days=10),
    )
    db_session.add(carello)
    db_session.commit()
    db_session.refresh(carello)
    return carello, farmaco


def test_list_carello_farmaci_is_reparto_scoped_and_filterable(client, db_session, reparti):
    reparto_a, reparto_b = reparti
    infermiere = _infermiere(db_session, reparto_a.id)
    carello_a, farmaco_a = _carello(db_session, reparto_a.id, nome="Paracetamolo")
    _carello(db_session, reparto_b.id, nome="Amoxicillina")

    headers = auth_headers(client, infermiere.email, "password123")
    response = client.get("/api/v1/carello-farmaci/?search=para&categoria=Analgesici", headers=headers)

    assert response.status_code == 200, response.text
    assert [r["id"] for r in response.json()] == [carello_a.id]
    assert response.json()[0]["farmaco"]["id"] == farmaco_a.id


def test_patch_updates_quantity_and_writes_movimento(client, db_session, reparti):
    reparto_a, _ = reparti
    infermiere = _infermiere(db_session, reparto_a.id)
    carello, _ = _carello(db_session, reparto_a.id, quantita=10)
    headers = auth_headers(client, infermiere.email, "password123")

    response = client.patch(f"/api/v1/carello-farmaci/{carello.id}", headers=headers, json={"delta": -3})

    assert response.status_code == 200, response.text
    assert response.json()["quantita"] == 7

    movimenti = client.get("/api/v1/carello-farmaci/movimenti", headers=headers)
    assert movimenti.status_code == 200
    assert len(movimenti.json()) == 1
    assert movimenti.json()[0]["delta"] == -3
    assert movimenti.json()[0]["quantita_dopo"] == 7


def test_patch_clamps_quantity_at_zero_and_audits_effective_delta(client, db_session, reparti):
    reparto_a, _ = reparti
    infermiere = _infermiere(db_session, reparto_a.id)
    carello, _ = _carello(db_session, reparto_a.id, quantita=2)
    headers = auth_headers(client, infermiere.email, "password123")

    response = client.patch(f"/api/v1/carello-farmaci/{carello.id}", headers=headers, json={"delta": -5})

    assert response.status_code == 200, response.text
    assert response.json()["quantita"] == 0
    movimenti = client.get("/api/v1/carello-farmaci/movimenti", headers=headers)
    assert movimenti.json()[0]["delta"] == -2
    assert movimenti.json()[0]["quantita_dopo"] == 0


def test_cross_reparto_patch_is_forbidden(client, db_session, reparti):
    reparto_a, reparto_b = reparti
    infermiere = _infermiere(db_session, reparto_a.id)
    carello_b, _ = _carello(db_session, reparto_b.id)
    headers = auth_headers(client, infermiere.email, "password123")

    response = client.patch(f"/api/v1/carello-farmaci/{carello_b.id}", headers=headers, json={"delta": 1})

    assert response.status_code == 403


def test_caposala_can_adjust_quantita(client, db_session, reparti, caposala_a):
    reparto_a, _ = reparti
    carello, _ = _carello(db_session, reparto_a.id, quantita=4)
    headers = auth_headers(client, caposala_a.email, "password123")

    response = client.patch(f"/api/v1/carello-farmaci/{carello.id}", headers=headers, json={"delta": 2})

    assert response.status_code == 200, response.text
    assert response.json()["quantita"] == 6
