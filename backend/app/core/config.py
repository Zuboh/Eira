from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./consegne_infermieristiche.db"
    jwt_secret_key: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60 * 8

    seed_reparto_nome: str = "Medicina Generale e Geriatria"
    seed_caposala_nome: str = "Admin"
    seed_caposala_cognome: str = "Caposala"
    seed_caposala_password: str = "dev-caposala-change-in-production"


settings = Settings()
