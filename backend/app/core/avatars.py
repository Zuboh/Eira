import logging
from io import BytesIO
from pathlib import Path
from typing import Any, Protocol
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

AVATAR_DIR = Path(__file__).resolve().parent.parent.parent / "uploads" / "avatars"
AVATAR_URL_PREFIX = "/static/avatars"
DEFAULT_AVATAR_DIR = Path(__file__).resolve().parent.parent / "static" / "avatars" / "default"
DEFAULT_AVATAR_URL_PREFIX = f"{AVATAR_URL_PREFIX}/default"
ALLOWED_AVATAR_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_AVATAR_BYTES = 2 * 1024 * 1024  # 2MB
MAX_AVATAR_PIXELS = 20_000_000
MAX_AVATAR_DIMENSION = 1024
logger = logging.getLogger(__name__)


class AvatarOwner(Protocol):
    avatar_path: str | None

_NOMI_FEMMINILI_NON_IN_A = {
    "beatrice",
    "denise",
    "irene",
    "isabel",
    "miriam",
    "rachele",
}
_NOMI_MASCHILI_IN_A = {
    "andrea",
    "eliah",
    "enea",
    "luca",
    "mattia",
    "nicola",
}


def _ruolo_value(ruolo: Any) -> str:
    return str(getattr(ruolo, "value", ruolo))


def _genere_avatar(nome: str) -> str:
    primo_nome = nome.strip().split(maxsplit=1)[0].casefold() if nome.strip() else ""
    if primo_nome in _NOMI_FEMMINILI_NON_IN_A:
        return "donna"
    if primo_nome in _NOMI_MASCHILI_IN_A:
        return "uomo"
    return "donna" if primo_nome.endswith("a") or primo_nome == "admin" else "uomo"


def avatar_url(avatar_path: str | None, *, ruolo: Any, nome: str) -> str:
    if avatar_path:
        return f"{AVATAR_URL_PREFIX}/{avatar_path}"

    ruolo_value = _ruolo_value(ruolo)
    if ruolo_value not in {"infermiere", "caposala"}:
        ruolo_value = "infermiere"
    return f"{DEFAULT_AVATAR_URL_PREFIX}/{ruolo_value}-{_genere_avatar(nome)}.webp"


def remove_avatar_file(avatar_path: str) -> None:
    """Pulizia best-effort: un problema filesystem non deve invalidare il commit DB."""
    try:
        (AVATAR_DIR / avatar_path).unlink(missing_ok=True)
    except OSError:
        logger.warning("Impossibile eliminare il file avatar %s", avatar_path, exc_info=True)


def commit_avatar_update(
    db: Session, owner: AvatarOwner, filename: str
) -> None:
    """Aggiorna DB e filesystem preservando almeno una versione consistente."""
    old_path = owner.avatar_path
    owner.avatar_path = filename
    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        remove_avatar_file(filename)
        raise
    db.refresh(owner)
    if old_path:
        remove_avatar_file(old_path)


async def store_avatar_file(file: UploadFile) -> str:
    """Valida e salva un file avatar su disco, ritorna il filename salvato."""
    if (file.content_type or "") not in ALLOWED_AVATAR_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato immagine non supportato (jpeg/png/webp)",
        )

    contents = await file.read(MAX_AVATAR_BYTES + 1)
    if not contents:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Immagine vuota")
    if len(contents) > MAX_AVATAR_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Immagine troppo grande (max 2MB)"
        )

    try:
        with Image.open(BytesIO(contents)) as source:
            if source.width * source.height > MAX_AVATAR_PIXELS:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Risoluzione immagine troppo elevata",
                )
            source.load()
            image = source.convert("RGB")
            image.thumbnail((MAX_AVATAR_DIMENSION, MAX_AVATAR_DIMENSION))
            output = BytesIO()
            # Ricodificare elimina EXIF e altri metadati non necessari.
            image.save(output, format="WEBP", quality=85, method=6)
    except HTTPException:
        raise
    except (Image.DecompressionBombError, OSError, UnidentifiedImageError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="File immagine non valido"
        ) from exc

    AVATAR_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid4().hex}.webp"
    (AVATAR_DIR / filename).write_bytes(output.getvalue())
    return filename
