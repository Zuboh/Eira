from fastapi import status

UNAUTHORIZED = {status.HTTP_401_UNAUTHORIZED: {"description": "Token mancante o non valido"}}
FORBIDDEN = {
    status.HTTP_403_FORBIDDEN: {"description": "Ruolo non autorizzato o risorsa di un altro reparto"}
}
NOT_FOUND = {status.HTTP_404_NOT_FOUND: {"description": "Risorsa non trovata"}}
CONFLICT = {status.HTTP_409_CONFLICT: {"description": "Conflitto di stato o unicità"}}
BAD_REQUEST = {status.HTTP_400_BAD_REQUEST: {"description": "Richiesta non valida"}}


def errors(*groups: dict) -> dict:
    merged: dict = {}
    for group in groups:
        merged.update(group)
    return merged
