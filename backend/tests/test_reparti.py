import datetime

from app.core.security import hash_password
from app.models.enums import RuoloUtente, StatoAssegnazione, StatoUtente, TipoTurno
from app.models.turno import AssegnazioneTurno, Turno
from app.models.utente import Utente


def test_list_reparti(client, reparti):
    reparto_a, reparto_b = reparti
    response = client.get("/api/v1/reparti/")
    assert response.status_code == 200, response.text
    nomi = {r["nome"] for r in response.json()}
    assert nomi == {"Cardiologia", "Oncologia"}


def test_list_utenti_by_reparto(client, db_session, reparti):
    reparto_a, _ = reparti
    utente = Utente(
        email="attivo@example.com",
        password_hash=hash_password("password123"),
        nome="Mario",
        cognome="Bianchi",
        ruolo=RuoloUtente.infermiere,
        reparto_id=reparto_a.id,
        stato=StatoUtente.attivo,
    )
    pending = Utente(
        email="pending@example.com",
        password_hash=hash_password("password123"),
        nome="Luca",
        cognome="Verdi",
        ruolo=RuoloUtente.infermiere,
        reparto_id=reparto_a.id,
        stato=StatoUtente.in_attesa,
    )
    db_session.add_all([utente, pending])
    db_session.commit()

    response = client.get(f"/api/v1/reparti/{reparto_a.id}/utenti")
    assert response.status_code == 200, response.text
    body = response.json()
    assert len(body) == 1
    assert body[0]["nome"] == "Mario"
    assert "email" not in body[0]


def test_list_utenti_by_reparto_empty(client, reparti):
    reparto_a, _ = reparti
    response = client.get(f"/api/v1/reparti/{reparto_a.id}/utenti")
    assert response.status_code == 200, response.text
    assert response.json() == []


def test_list_utenti_by_reparto_unknown_id_404(client, reparti):
    response = client.get("/api/v1/reparti/9999/utenti")
    assert response.status_code == 404, response.text


def _utente(db_session, reparto_id, email="nurse@example.com"):
    utente = Utente(
        email=email,
        password_hash=hash_password("password123"),
        nome="Giulia",
        cognome="Bianchi",
        ruolo=RuoloUtente.infermiere,
        reparto_id=reparto_id,
        stato=StatoUtente.attivo,
    )
    db_session.add(utente)
    db_session.commit()
    db_session.refresh(utente)
    return utente


def test_turno_oggi_utente_returns_tipo_when_assigned_today(client, db_session, reparti):
    reparto_a, _ = reparti
    utente = _utente(db_session, reparto_a.id)
    turno = Turno(
        data=datetime.date.today(),
        tipo=TipoTurno.notte,
        reparto_id=reparto_a.id,
        ora_inizio=datetime.time(22, 0),
        ora_fine=datetime.time(6, 0),
    )
    db_session.add(turno)
    db_session.commit()
    db_session.add(
        AssegnazioneTurno(
            turno_id=turno.id, infermiere_id=utente.id, stato=StatoAssegnazione.attiva
        )
    )
    db_session.commit()

    response = client.get(
        f"/api/v1/reparti/{reparto_a.id}/utenti/{utente.id}/turno-oggi"
    )
    assert response.status_code == 200, response.text
    assert response.json() == {"tipo": "notte"}


def test_turno_oggi_utente_returns_null_when_not_assigned_today(client, db_session, reparti):
    reparto_a, _ = reparti
    utente = _utente(db_session, reparto_a.id)
    turno_domani = Turno(
        data=datetime.date.today() + datetime.timedelta(days=1),
        tipo=TipoTurno.mattina,
        reparto_id=reparto_a.id,
        ora_inizio=datetime.time(7, 0),
        ora_fine=datetime.time(14, 0),
    )
    db_session.add(turno_domani)
    db_session.commit()
    db_session.add(
        AssegnazioneTurno(
            turno_id=turno_domani.id, infermiere_id=utente.id, stato=StatoAssegnazione.attiva
        )
    )
    db_session.commit()

    response = client.get(
        f"/api/v1/reparti/{reparto_a.id}/utenti/{utente.id}/turno-oggi"
    )
    assert response.status_code == 200, response.text
    assert response.json() is None


def test_turno_oggi_utente_wrong_reparto_404(client, db_session, reparti):
    reparto_a, reparto_b = reparti
    utente = _utente(db_session, reparto_a.id)

    response = client.get(
        f"/api/v1/reparti/{reparto_b.id}/utenti/{utente.id}/turno-oggi"
    )
    assert response.status_code == 404, response.text
