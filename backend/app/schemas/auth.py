from pydantic import BaseModel, Field


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TemporaryPasswordChange(BaseModel):
    utente_id: int
    temporary_password: str
    new_password: str = Field(min_length=8)
