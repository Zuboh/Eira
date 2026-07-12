import datetime

from tests.conftest import auth_headers


def _payload(reparto_id: int) -> dict:
    return {
        "nome": "Mario",
        "cognome": "Bianchi",
        "eta": 72,
        "letto": "3B",
        "data_ricovero": datetime.date.today().isoformat(),
        "diagnosi_ingresso": "polmonite",
        "reparto_id": reparto_id,
    }


def test_create_paziente_forces_reparto_from_current_user(client, caposala_a, reparti):
    reparto_a, reparto_b = reparti
    headers = auth_headers(client, "caposala.a@example.com", "password123")

    response = client.post("/api/v1/pazienti/", headers=headers, json=_payload(reparto_b.id))

    assert response.status_code == 201, response.text
    assert response.json()["reparto_id"] == reparto_a.id


def test_list_pazienti_only_returns_same_reparto(client, db_session, caposala_a, reparti):
    from app.models.paziente import Paziente

    reparto_a, reparto_b = reparti
    paziente_a = Paziente(**{**_payload(reparto_a.id), "data_ricovero": datetime.date.today()})
    paziente_b = Paziente(**{**_payload(reparto_b.id), "data_ricovero": datetime.date.today()})
    db_session.add_all([paziente_a, paziente_b])
    db_session.commit()

    headers = auth_headers(client, "caposala.a@example.com", "password123")
    response = client.get("/api/v1/pazienti/", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["reparto_id"] == reparto_a.id


def test_get_paziente_other_reparto_forbidden(client, db_session, caposala_a, reparti):
    from app.models.paziente import Paziente

    _, reparto_b = reparti
    paziente_b = Paziente(**{**_payload(reparto_b.id), "data_ricovero": datetime.date.today()})
    db_session.add(paziente_b)
    db_session.commit()
    db_session.refresh(paziente_b)

    headers = auth_headers(client, "caposala.a@example.com", "password123")
    response = client.get(f"/api/v1/pazienti/{paziente_b.id}", headers=headers)

    assert response.status_code == 403


def test_update_paziente_other_reparto_forbidden(client, db_session, caposala_a, reparti):
    from app.models.paziente import Paziente

    _, reparto_b = reparti
    paziente_b = Paziente(**{**_payload(reparto_b.id), "data_ricovero": datetime.date.today()})
    db_session.add(paziente_b)
    db_session.commit()
    db_session.refresh(paziente_b)

    headers = auth_headers(client, "caposala.a@example.com", "password123")
    response = client.patch(
        f"/api/v1/pazienti/{paziente_b.id}", headers=headers, json={"dimesso": True}
    )

    assert response.status_code == 403


def test_update_paziente_same_reparto_succeeds(client, db_session, caposala_a, reparti):
    from app.models.paziente import Paziente

    reparto_a, _ = reparti
    paziente_a = Paziente(**{**_payload(reparto_a.id), "data_ricovero": datetime.date.today()})
    db_session.add(paziente_a)
    db_session.commit()
    db_session.refresh(paziente_a)

    headers = auth_headers(client, "caposala.a@example.com", "password123")
    response = client.patch(
        f"/api/v1/pazienti/{paziente_a.id}", headers=headers, json={"dimesso": True}
    )

    assert response.status_code == 200
    assert response.json()["dimesso"] is True
