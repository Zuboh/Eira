from typing import Annotated

from pydantic import AfterValidator, BaseModel

from app.core.security import validate_password

Password = Annotated[str, AfterValidator(validate_password)]


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TemporaryPasswordChange(BaseModel):
    utente_id: int
    temporary_password: Password
    new_password: Password
