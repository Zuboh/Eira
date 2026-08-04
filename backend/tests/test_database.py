from sqlalchemy import text


def test_sqlite_foreign_keys_are_enabled_for_test_connections(db_session):
    enabled = db_session.execute(text("PRAGMA foreign_keys")).scalar_one()
    assert enabled == 1
