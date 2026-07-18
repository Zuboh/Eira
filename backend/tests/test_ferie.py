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


def _caposala(db_session, reparto_id, email="caposala.a@example.com"):
    from app.core.security import hash_password
    from app.models.enums import RuoloUtente
    from app.models.utente import Utente

    utente = Utente(
        email=email,
        password_hash=hash_password("password123"),
        nome="Anna",
        cognome="Rossi",
        ruolo=RuoloUtente.caposala,
        reparto_id=reparto_id,
    )
    db_session.add(utente)
    db_session.commit()
    db_session.refresh(utente)
    return utente


def test_slot_disponibili_sono_tutti_blocchi_di_14_giorni(client, db_session, reparti):
    reparto_a, _ = reparti
    infermiere = _infermiere(db_session, reparto_a.id)
    headers = auth_headers(client, infermiere.email, "password123")

    response = client.get("/api/v1/ferie/slot-disponibili", headers=headers)
    assert response.status_code == 200
    slot = response.json()
    assert len(slot) > 0
    for a, b in zip(slot, slot[1:]):
        data_a = datetime.date.fromisoformat(a)
        data_b = datetime.date.fromisoformat(b)
        assert (data_b - data_a).days == 14


def test_create_richiesta_rifiuta_data_fuori_griglia(client, db_session, reparti):
    reparto_a, _ = reparti
    infermiere = _infermiere(db_session, reparto_a.id)
    headers = auth_headers(client, infermiere.email, "password123")

    response = client.post(
        "/api/v1/ferie/richieste",
        headers=headers,
        json={"preferenze": ["2026-06-02"]},
    )
    assert response.status_code == 400


def test_create_richiesta_rifiuta_zero_o_troppe_preferenze(client, db_session, reparti):
    reparto_a, _ = reparti
    infermiere = _infermiere(db_session, reparto_a.id)
    headers = auth_headers(client, infermiere.email, "password123")
    slot = client.get("/api/v1/ferie/slot-disponibili", headers=headers).json()

    vuota = client.post("/api/v1/ferie/richieste", headers=headers, json={"preferenze": []})
    assert vuota.status_code == 400

    troppe = client.post(
        "/api/v1/ferie/richieste", headers=headers, json={"preferenze": slot[:4]}
    )
    assert troppe.status_code == 400


def test_create_richiesta_rifiuta_preferenze_duplicate(client, db_session, reparti):
    reparto_a, _ = reparti
    infermiere = _infermiere(db_session, reparto_a.id)
    headers = auth_headers(client, infermiere.email, "password123")
    slot = client.get("/api/v1/ferie/slot-disponibili", headers=headers).json()

    response = client.post(
        "/api/v1/ferie/richieste", headers=headers, json={"preferenze": [slot[0], slot[0]]}
    )
    assert response.status_code == 400


def test_create_richiesta_con_piu_preferenze_ordinate(client, db_session, reparti):
    reparto_a, _ = reparti
    infermiere = _infermiere(db_session, reparto_a.id)
    headers = auth_headers(client, infermiere.email, "password123")
    slot = client.get("/api/v1/ferie/slot-disponibili", headers=headers).json()

    created = client.post(
        "/api/v1/ferie/richieste", headers=headers, json={"preferenze": slot[:3]}
    )
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["stato"] == "in_attesa"
    assert body["data_inizio"] is None
    assert body["data_fine"] is None
    assert [p["rank"] for p in body["preferenze"]] == [1, 2, 3]
    assert body["preferenze"][0]["data_inizio"] == slot[0]


def test_seconda_richiesta_bloccata_mentre_prima_attiva(client, db_session, reparti):
    reparto_a, _ = reparti
    infermiere = _infermiere(db_session, reparto_a.id)
    headers = auth_headers(client, infermiere.email, "password123")
    slot = client.get("/api/v1/ferie/slot-disponibili", headers=headers).json()

    prima = client.post("/api/v1/ferie/richieste", headers=headers, json={"preferenze": [slot[0]]})
    assert prima.status_code == 201

    seconda = client.post(
        "/api/v1/ferie/richieste", headers=headers, json={"preferenze": [slot[1]]}
    )
    assert seconda.status_code == 409


def test_update_richiesta_sovrascrive_preferenze(client, db_session, reparti):
    reparto_a, _ = reparti
    infermiere = _infermiere(db_session, reparto_a.id)
    headers = auth_headers(client, infermiere.email, "password123")
    slot = client.get("/api/v1/ferie/slot-disponibili", headers=headers).json()

    created = client.post("/api/v1/ferie/richieste", headers=headers, json={"preferenze": [slot[0]]})
    richiesta_id = created.json()["id"]

    updated = client.patch(
        f"/api/v1/ferie/richieste/{richiesta_id}",
        headers=headers,
        json={"preferenze": [slot[1], slot[2]]},
    )
    assert updated.status_code == 200, updated.text
    body = updated.json()
    assert [p["data_inizio"] for p in body["preferenze"]] == [slot[1], slot[2]]


def test_update_richiesta_altrui_vietato(client, db_session, reparti):
    reparto_a, _ = reparti
    infermiere_a = _infermiere(db_session, reparto_a.id, "nurse.a@example.com")
    infermiere_b = _infermiere(db_session, reparto_a.id, "nurse.b@example.com")
    headers_a = auth_headers(client, infermiere_a.email, "password123")
    headers_b = auth_headers(client, infermiere_b.email, "password123")
    slot = client.get("/api/v1/ferie/slot-disponibili", headers=headers_a).json()

    created = client.post("/api/v1/ferie/richieste", headers=headers_a, json={"preferenze": [slot[0]]})
    richiesta_id = created.json()["id"]

    response = client.patch(
        f"/api/v1/ferie/richieste/{richiesta_id}",
        headers=headers_b,
        json={"preferenze": [slot[1]]},
    )
    assert response.status_code == 403


def test_delete_richiesta_in_attesa(client, db_session, reparti):
    reparto_a, _ = reparti
    infermiere = _infermiere(db_session, reparto_a.id)
    headers = auth_headers(client, infermiere.email, "password123")
    slot = client.get("/api/v1/ferie/slot-disponibili", headers=headers).json()

    created = client.post("/api/v1/ferie/richieste", headers=headers, json={"preferenze": [slot[0]]})
    richiesta_id = created.json()["id"]

    deleted = client.delete(f"/api/v1/ferie/richieste/{richiesta_id}", headers=headers)
    assert deleted.status_code == 204

    listed = client.get("/api/v1/ferie/richieste", headers=headers)
    assert listed.json() == []

    # dopo la cancellazione si puo' aprire una nuova richiesta
    ricreata = client.post("/api/v1/ferie/richieste", headers=headers, json={"preferenze": [slot[0]]})
    assert ricreata.status_code == 201


def test_delete_richiesta_approvata_vietato(client, db_session, reparti):
    reparto_a, _ = reparti
    infermiere = _infermiere(db_session, reparto_a.id)
    caposala = _caposala(db_session, reparto_a.id)
    headers = auth_headers(client, infermiere.email, "password123")
    slot = client.get("/api/v1/ferie/slot-disponibili", headers=headers).json()

    created = client.post("/api/v1/ferie/richieste", headers=headers, json={"preferenze": [slot[0]]})
    richiesta_id = created.json()["id"]

    headers_caposala = auth_headers(client, caposala.email, "password123")
    client.post(
        f"/api/v1/ferie/richieste/{richiesta_id}/rispondi",
        headers=headers_caposala,
        json={"accetta": True, "preferenza_rank": 1},
    )

    deleted = client.delete(f"/api/v1/ferie/richieste/{richiesta_id}", headers=headers)
    assert deleted.status_code == 409


def test_full_flow_approvazione_seconda_preferenza_crea_turni_ferie_estive(
    client, db_session, reparti
):
    reparto_a, _ = reparti
    infermiere = _infermiere(db_session, reparto_a.id)
    caposala = _caposala(db_session, reparto_a.id)

    headers = auth_headers(client, infermiere.email, "password123")
    slot = client.get("/api/v1/ferie/slot-disponibili", headers=headers).json()

    created = client.post(
        "/api/v1/ferie/richieste", headers=headers, json={"preferenze": [slot[0], slot[1]]}
    )
    assert created.status_code == 201, created.text
    richiesta_id = created.json()["id"]

    headers_caposala = auth_headers(client, caposala.email, "password123")
    approvata = client.post(
        f"/api/v1/ferie/richieste/{richiesta_id}/rispondi",
        headers=headers_caposala,
        json={"accetta": True, "preferenza_rank": 2},
    )
    assert approvata.status_code == 200, approvata.text
    body = approvata.json()
    assert body["stato"] == "approvata"
    assert body["data_inizio"] == slot[1]
    assert body["data_fine"] == (
        datetime.date.fromisoformat(slot[1]) + datetime.timedelta(days=13)
    ).isoformat()

    from app.models.enums import StatoAssegnazione, TipoTurno
    from app.models.turno import AssegnazioneTurno, Turno

    turni_ferie = (
        db_session.query(Turno)
        .filter(Turno.reparto_id == reparto_a.id, Turno.tipo == TipoTurno.ferie_estive)
        .all()
    )
    assert len(turni_ferie) == 14
    assert {t.data.isoformat() for t in turni_ferie} == {
        (datetime.date.fromisoformat(slot[1]) + datetime.timedelta(days=offset)).isoformat()
        for offset in range(14)
    }

    assegnazioni = (
        db_session.query(AssegnazioneTurno)
        .join(Turno, AssegnazioneTurno.turno_id == Turno.id)
        .filter(
            AssegnazioneTurno.infermiere_id == infermiere.id,
            AssegnazioneTurno.stato == StatoAssegnazione.attiva,
            Turno.tipo == TipoTurno.ferie_estive,
        )
        .all()
    )
    assert len(assegnazioni) == 14


def test_approvazione_senza_preferenza_rank_rifiutata(client, db_session, reparti):
    reparto_a, _ = reparti
    infermiere = _infermiere(db_session, reparto_a.id)
    caposala = _caposala(db_session, reparto_a.id)

    headers = auth_headers(client, infermiere.email, "password123")
    slot = client.get("/api/v1/ferie/slot-disponibili", headers=headers).json()
    created = client.post("/api/v1/ferie/richieste", headers=headers, json={"preferenze": [slot[0]]})
    richiesta_id = created.json()["id"]

    headers_caposala = auth_headers(client, caposala.email, "password123")
    response = client.post(
        f"/api/v1/ferie/richieste/{richiesta_id}/rispondi",
        headers=headers_caposala,
        json={"accetta": True},
    )
    assert response.status_code == 400


def test_rifiuta_richiesta_non_crea_turni(client, db_session, reparti):
    reparto_a, _ = reparti
    infermiere = _infermiere(db_session, reparto_a.id)
    caposala = _caposala(db_session, reparto_a.id)

    headers = auth_headers(client, infermiere.email, "password123")
    slot = client.get("/api/v1/ferie/slot-disponibili", headers=headers).json()

    created = client.post(
        "/api/v1/ferie/richieste",
        headers=headers,
        json={"preferenze": [slot[0]]},
    )
    richiesta_id = created.json()["id"]

    headers_caposala = auth_headers(client, caposala.email, "password123")
    rifiutata = client.post(
        f"/api/v1/ferie/richieste/{richiesta_id}/rispondi",
        headers=headers_caposala,
        json={"accetta": False, "motivo_rifiuto": "reparto scoperto"},
    )
    assert rifiutata.status_code == 200
    assert rifiutata.json()["stato"] == "rifiutata"
    assert rifiutata.json()["motivo_rifiuto"] == "reparto scoperto"

    from app.models.enums import TipoTurno
    from app.models.turno import Turno

    assert (
        db_session.query(Turno)
        .filter(Turno.reparto_id == reparto_a.id, Turno.tipo == TipoTurno.ferie_estive)
        .count()
        == 0
    )


def test_dopo_rifiuto_si_puo_ricreare_richiesta(client, db_session, reparti):
    reparto_a, _ = reparti
    infermiere = _infermiere(db_session, reparto_a.id)
    caposala = _caposala(db_session, reparto_a.id)

    headers = auth_headers(client, infermiere.email, "password123")
    slot = client.get("/api/v1/ferie/slot-disponibili", headers=headers).json()
    created = client.post("/api/v1/ferie/richieste", headers=headers, json={"preferenze": [slot[0]]})
    richiesta_id = created.json()["id"]

    headers_caposala = auth_headers(client, caposala.email, "password123")
    client.post(
        f"/api/v1/ferie/richieste/{richiesta_id}/rispondi",
        headers=headers_caposala,
        json={"accetta": False},
    )

    nuova = client.post("/api/v1/ferie/richieste", headers=headers, json={"preferenze": [slot[1]]})
    assert nuova.status_code == 201


def test_approvazione_rifiutata_se_conflitto_turno_esistente(client, db_session, reparti):
    reparto_a, _ = reparti
    infermiere = _infermiere(db_session, reparto_a.id)
    caposala = _caposala(db_session, reparto_a.id)

    headers = auth_headers(client, infermiere.email, "password123")
    slot = client.get("/api/v1/ferie/slot-disponibili", headers=headers).json()
    data_inizio = datetime.date.fromisoformat(slot[0])

    from app.models.enums import StatoAssegnazione, TipoTurno
    from app.models.turno import AssegnazioneTurno, Turno

    turno_conflitto = Turno(
        data=data_inizio,
        tipo=TipoTurno.mattina,
        reparto_id=reparto_a.id,
        ora_inizio=datetime.time(7, 0),
        ora_fine=datetime.time(14, 0),
    )
    db_session.add(turno_conflitto)
    db_session.commit()
    db_session.refresh(turno_conflitto)
    db_session.add(
        AssegnazioneTurno(
            turno_id=turno_conflitto.id,
            infermiere_id=infermiere.id,
            stato=StatoAssegnazione.attiva,
        )
    )
    db_session.commit()

    created = client.post(
        "/api/v1/ferie/richieste",
        headers=headers,
        json={"preferenze": [slot[0]]},
    )
    richiesta_id = created.json()["id"]

    headers_caposala = auth_headers(client, caposala.email, "password123")
    response = client.post(
        f"/api/v1/ferie/richieste/{richiesta_id}/rispondi",
        headers=headers_caposala,
        json={"accetta": True, "preferenza_rank": 1},
    )
    assert response.status_code == 409


def test_list_richieste_infermiere_vede_solo_le_proprie(client, db_session, reparti):
    reparto_a, _ = reparti
    infermiere_a = _infermiere(db_session, reparto_a.id, "nurse.a@example.com")
    infermiere_b = _infermiere(db_session, reparto_a.id, "nurse.b@example.com")

    headers_a = auth_headers(client, infermiere_a.email, "password123")
    slot = client.get("/api/v1/ferie/slot-disponibili", headers=headers_a).json()
    client.post("/api/v1/ferie/richieste", headers=headers_a, json={"preferenze": [slot[0]]})

    headers_b = auth_headers(client, infermiere_b.email, "password123")
    listed_b = client.get("/api/v1/ferie/richieste", headers=headers_b)
    assert listed_b.status_code == 200
    assert listed_b.json() == []

    listed_a = client.get("/api/v1/ferie/richieste", headers=headers_a)
    assert len(listed_a.json()) == 1
