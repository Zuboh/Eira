from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: Literal["development", "e2e", "test", "production"] = "development"
    database_url: str = "sqlite:///./consegne_infermieristiche.db"
    jwt_secret_key: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60 * 8
    cors_origins: str = "http://localhost:5173,http://localhost:5174"
    seed_enabled: bool | None = None
    bcrypt_rounds: int = Field(default=12, ge=4, le=16)

    seed_reparto_nome: str = "Medicina Generale e Geriatria"
    seed_secondo_reparto_nome: str = "Chirurgia Generale"
    seed_caposala_nome: str = "Admin"
    seed_caposala_cognome: str = "Caposala"
    seed_caposala_password: str = "password"
    seed_infermiere_email: str = "infermiere@eira.local"
    seed_infermiere_nome: str = "Giulia"
    seed_infermiere_cognome: str = "Bianchi"
    seed_infermiere_password: str = "password"
    seed_infermiere_ore_contrattuali_mensili: int = 150

    @field_validator("environment", mode="before")
    @classmethod
    def normalize_environment(cls, value):
        return value.casefold() if isinstance(value, str) else value

    @property
    def should_seed(self) -> bool:
        """Il seed non deve mai poter creare credenziali note in produzione."""
        if self.environment.casefold() == "production":
            return False
        if self.seed_enabled is not None:
            return self.seed_enabled
        return self.environment.casefold() in {"development", "e2e"}

    @property
    def parsed_cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
