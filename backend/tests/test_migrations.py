from sqlalchemy import create_engine, inspect, text

import app.models  # noqa: F401
from app.cli.db import BASELINE_REVISION, bootstrap_database, upgrade_database
from app.core.database import Base


def _sqlite_url(tmp_path, name: str) -> str:
    return f"sqlite:///{tmp_path / name}"


def test_bootstrap_crea_database_vuoto(tmp_path):
    database_url = _sqlite_url(tmp_path, "empty.db")

    bootstrap_database(database_url)

    engine = create_engine(database_url)
    try:
        tables = set(inspect(engine).get_table_names())
        assert set(Base.metadata.tables) <= tables
        with engine.connect() as connection:
            assert connection.execute(text("SELECT version_num FROM alembic_version")).scalar() == (
                BASELINE_REVISION
            )
    finally:
        engine.dispose()


def test_bootstrap_adotta_schema_corrente_senza_perdere_dati(tmp_path):
    database_url = _sqlite_url(tmp_path, "existing.db")
    engine = create_engine(database_url)
    Base.metadata.create_all(engine)
    with engine.begin() as connection:
        connection.execute(text("INSERT INTO reparto (nome) VALUES ('Reparto preservato')"))
    engine.dispose()

    bootstrap_database(database_url)

    engine = create_engine(database_url)
    try:
        with engine.connect() as connection:
            assert connection.execute(text("SELECT nome FROM reparto")).scalar() == (
                "Reparto preservato"
            )
            assert connection.execute(text("SELECT version_num FROM alembic_version")).scalar() == (
                BASELINE_REVISION
            )
    finally:
        engine.dispose()


def test_bootstrap_rifiuta_schema_inatteso_senza_stamparlo(tmp_path):
    database_url = _sqlite_url(tmp_path, "unexpected.db")
    engine = create_engine(database_url)
    with engine.begin() as connection:
        connection.execute(text("CREATE TABLE tabella_estranea (id INTEGER PRIMARY KEY)"))
    engine.dispose()

    try:
        bootstrap_database(database_url)
    except RuntimeError as exc:
        assert "Schema SQLite non riconosciuto" in str(exc)
    else:
        raise AssertionError("Il bootstrap doveva rifiutare lo schema inatteso")

    engine = create_engine(database_url)
    try:
        assert "alembic_version" not in inspect(engine).get_table_names()
    finally:
        engine.dispose()


def test_bootstrap_rifiuta_schema_senza_indice_unique(tmp_path):
    database_url = _sqlite_url(tmp_path, "missing-index.db")
    engine = create_engine(database_url)
    Base.metadata.create_all(engine)
    with engine.begin() as connection:
        connection.execute(text("DROP INDEX ix_utente_email"))
    engine.dispose()

    try:
        bootstrap_database(database_url)
    except RuntimeError as exc:
        assert "indici diversi" in str(exc)
    else:
        raise AssertionError("Il bootstrap doveva rifiutare l'indice mancante")

    engine = create_engine(database_url)
    try:
        assert "alembic_version" not in inspect(engine).get_table_names()
    finally:
        engine.dispose()


def test_bootstrap_rifiuta_foreign_key_orfana(tmp_path):
    database_url = _sqlite_url(tmp_path, "orphan.db")
    engine = create_engine(database_url)
    Base.metadata.create_all(engine)
    connection = engine.raw_connection()
    try:
        connection.execute("PRAGMA foreign_keys=OFF")
        connection.execute(
            "INSERT INTO paziente "
            "(nome, cognome, eta, letto, data_ricovero, diagnosi_ingresso, "
            "reparto_id, dimesso) VALUES "
            "('Mario', 'Rossi', 70, '1A', '2026-08-04', 'Test', 999, 0)"
        )
        connection.commit()
    finally:
        connection.close()
    engine.dispose()

    try:
        bootstrap_database(database_url)
    except RuntimeError as exc:
        assert "foreign key orfani" in str(exc)
    else:
        raise AssertionError("Il bootstrap doveva rifiutare riferimenti orfani")

    engine = create_engine(database_url)
    try:
        assert "alembic_version" not in inspect(engine).get_table_names()
    finally:
        engine.dispose()


def test_upgrade_rifiuta_database_legacy_senza_modificarlo(tmp_path):
    database_url = _sqlite_url(tmp_path, "legacy.db")
    engine = create_engine(database_url)
    Base.metadata.create_all(engine)
    engine.dispose()

    try:
        upgrade_database(database_url)
    except RuntimeError as exc:
        assert "bootstrap" in str(exc)
    else:
        raise AssertionError("Upgrade doveva rifiutare un database non versionato")

    engine = create_engine(database_url)
    try:
        assert "alembic_version" not in inspect(engine).get_table_names()
    finally:
        engine.dispose()
