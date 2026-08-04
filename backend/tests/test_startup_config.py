import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings, settings
from app.main import _check_jwt_secret, create_app


def test_check_jwt_secret_raises_on_production_default(monkeypatch):
    monkeypatch.setattr(settings, "environment", "production")
    monkeypatch.setattr(settings, "jwt_secret_key", "dev-secret-change-in-production")

    with pytest.raises(RuntimeError):
        _check_jwt_secret()


def test_environment_normalizza_production_mixed_case():
    config = Settings(environment="Production")
    assert config.environment == "production"
    with pytest.raises(RuntimeError):
        _check_jwt_secret(config)


def test_environment_rifiuta_valori_sconosciuti():
    with pytest.raises(ValueError):
        Settings(environment="prod")


def test_check_jwt_secret_only_warns_on_development_default(monkeypatch, caplog):
    monkeypatch.setattr(settings, "environment", "development")
    monkeypatch.setattr(settings, "jwt_secret_key", "dev-secret-change-in-production")

    _check_jwt_secret()  # non deve sollevare


def test_check_jwt_secret_ok_on_production_with_custom_secret(monkeypatch):
    monkeypatch.setattr(settings, "environment", "production")
    monkeypatch.setattr(settings, "jwt_secret_key", "un-secret-vero-e-lungo")

    _check_jwt_secret()  # non deve sollevare


def test_production_never_enables_seed_even_if_requested():
    config = Settings(environment="production", seed_enabled=True)
    assert config.should_seed is False


def test_cors_origins_are_parsed_from_comma_separated_setting():
    config = Settings(cors_origins="https://one.example, https://two.example")
    assert config.parsed_cors_origins == ["https://one.example", "https://two.example"]


def test_production_lifespan_does_not_run_seed(monkeypatch):
    def unexpected_seed(_config):
        raise AssertionError("production must not seed")

    monkeypatch.setattr("app.main._seed_dev_data", unexpected_seed)
    config = Settings(
        environment="production",
        seed_enabled=True,
        jwt_secret_key="production-test-secret",
    )
    with TestClient(create_app(config=config)) as client:
        assert client.get("/health").status_code == 200
