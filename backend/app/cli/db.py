import argparse
from pathlib import Path
from tempfile import TemporaryDirectory

from alembic.config import Config
from sqlalchemy import create_engine, inspect, text

from alembic import command
from app.core.config import settings

BASELINE_REVISION = "c69bcd5937f8"
BACKEND_ROOT = Path(__file__).resolve().parents[2]


def _alembic_config(database_url: str) -> Config:
    config = Config(str(BACKEND_ROOT / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_ROOT / "alembic"))
    config.set_main_option("sqlalchemy.url", database_url.replace("%", "%%"))
    return config


def _foreign_key_signature(foreign_key: dict) -> tuple:
    return (
        tuple(foreign_key.get("constrained_columns") or ()),
        foreign_key.get("referred_table"),
        tuple(foreign_key.get("referred_columns") or ()),
    )


def _column_signature(column: dict, dialect) -> tuple:
    default = column.get("default")
    return (
        column["type"].compile(dialect=dialect).upper(),
        bool(column["nullable"]),
        None if default is None else str(default).strip("()"),
    )


def _index_signature(index: dict) -> tuple:
    return (
        index["name"],
        tuple(index.get("column_names") or ()),
        bool(index.get("unique")),
    )


def _unique_signature(constraint: dict) -> tuple[str, ...]:
    return tuple(constraint.get("column_names") or ())


def _assert_matches_baseline(database_url: str) -> None:
    engine = create_engine(database_url)
    with TemporaryDirectory(prefix="eira-baseline-") as directory:
        reference_url = f"sqlite:///{Path(directory) / 'baseline.db'}"
        command.upgrade(_alembic_config(reference_url), BASELINE_REVISION)
        reference_engine = create_engine(reference_url)
        try:
            inspector = inspect(engine)
            reference = inspect(reference_engine)
            actual_tables = set(inspector.get_table_names()) - {"alembic_version"}
            expected_tables = set(reference.get_table_names()) - {"alembic_version"}
            if actual_tables != expected_tables:
                raise RuntimeError(
                    "Schema SQLite non riconosciuto: tabelle diverse dalla baseline "
                    f"(mancanti={sorted(expected_tables - actual_tables)}, "
                    f"inattese={sorted(actual_tables - expected_tables)})."
                )

            for table_name in expected_tables:
                actual_columns = {
                    column["name"]: _column_signature(column, engine.dialect)
                    for column in inspector.get_columns(table_name)
                }
                expected_columns = {
                    column["name"]: _column_signature(column, reference_engine.dialect)
                    for column in reference.get_columns(table_name)
                }
                if actual_columns != expected_columns:
                    raise RuntimeError(
                        f"Schema SQLite non riconosciuto per {table_name}: "
                        "definizione colonne diversa dalla baseline."
                    )

                actual_pk = tuple(
                    inspector.get_pk_constraint(table_name).get("constrained_columns") or ()
                )
                expected_pk = tuple(
                    reference.get_pk_constraint(table_name).get("constrained_columns") or ()
                )
                if actual_pk != expected_pk:
                    raise RuntimeError(
                        f"Schema SQLite non riconosciuto per {table_name}: primary key diversa."
                    )

                actual_fks = {
                    _foreign_key_signature(foreign_key)
                    for foreign_key in inspector.get_foreign_keys(table_name)
                }
                expected_fks = {
                    _foreign_key_signature(foreign_key)
                    for foreign_key in reference.get_foreign_keys(table_name)
                }
                if actual_fks != expected_fks:
                    raise RuntimeError(
                        f"Schema SQLite non riconosciuto per {table_name}: foreign key diverse."
                    )

                actual_uniques = {
                    _unique_signature(constraint)
                    for constraint in inspector.get_unique_constraints(table_name)
                }
                expected_uniques = {
                    _unique_signature(constraint)
                    for constraint in reference.get_unique_constraints(table_name)
                }
                if actual_uniques != expected_uniques:
                    raise RuntimeError(
                        f"Schema SQLite non riconosciuto per {table_name}: "
                        "vincoli unique diversi."
                    )

                actual_indexes = {
                    _index_signature(index) for index in inspector.get_indexes(table_name)
                }
                expected_indexes = {
                    _index_signature(index) for index in reference.get_indexes(table_name)
                }
                if actual_indexes != expected_indexes:
                    raise RuntimeError(
                        f"Schema SQLite non riconosciuto per {table_name}: indici diversi."
                    )

            if engine.dialect.name == "sqlite":
                with engine.connect() as connection:
                    violations = connection.execute(text("PRAGMA foreign_key_check")).fetchall()
                if violations:
                    raise RuntimeError(
                        "Schema SQLite non riconosciuto: "
                        "presenti riferimenti foreign key orfani."
                    )
        finally:
            reference_engine.dispose()
            engine.dispose()


def bootstrap_database(database_url: str = settings.database_url) -> None:
    """Porta un DB vuoto/versionato a head o adotta una baseline identica.

    Nessun dato viene cancellato. Un database esistente che non coincide con
    la migrazione baseline congelata viene rifiutato prima di creare
    ``alembic_version``.
    """

    config = _alembic_config(database_url)
    engine = create_engine(database_url)
    try:
        tables = set(inspect(engine).get_table_names())
    finally:
        engine.dispose()

    if "alembic_version" in tables:
        command.upgrade(config, "head")
        return

    application_tables = tables - {"alembic_version"}
    if not application_tables:
        command.upgrade(config, "head")
        return

    _assert_matches_baseline(database_url)
    command.stamp(config, BASELINE_REVISION)
    command.upgrade(config, "head")


def upgrade_database(database_url: str = settings.database_url) -> None:
    """Aggiorna esclusivamente un database già versionato da Alembic."""

    engine = create_engine(database_url)
    try:
        tables = set(inspect(engine).get_table_names())
    finally:
        engine.dispose()
    if "alembic_version" not in tables:
        raise RuntimeError(
            "Database non versionato: usare 'python -m app.cli.db bootstrap'."
        )
    command.upgrade(_alembic_config(database_url), "head")


def main() -> None:
    parser = argparse.ArgumentParser(description="Gestione schema database Eira")
    parser.add_argument(
        "command",
        choices=("bootstrap", "upgrade"),
        help="bootstrap adotta in sicurezza DB correnti; upgrade richiede un DB versionato",
    )
    args = parser.parse_args()

    if args.command == "bootstrap":
        bootstrap_database()
    else:
        upgrade_database()


if __name__ == "__main__":
    main()
