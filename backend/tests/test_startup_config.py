import pytest

from app.core.config import settings
from app.main import _check_jwt_secret


def test_check_jwt_secret_raises_on_production_default(monkeypatch):
    monkeypatch.setattr(settings, "environment", "production")
    monkeypatch.setattr(settings, "jwt_secret_key", "dev-secret-change-in-production")

    with pytest.raises(RuntimeError):
        _check_jwt_secret()


def test_check_jwt_secret_only_warns_on_development_default(monkeypatch, caplog):
    monkeypatch.setattr(settings, "environment", "development")
    monkeypatch.setattr(settings, "jwt_secret_key", "dev-secret-change-in-production")

    _check_jwt_secret()  # non deve sollevare


def test_check_jwt_secret_ok_on_production_with_custom_secret(monkeypatch):
    monkeypatch.setattr(settings, "environment", "production")
    monkeypatch.setattr(settings, "jwt_secret_key", "un-secret-vero-e-lungo")

    _check_jwt_secret()  # non deve sollevare
