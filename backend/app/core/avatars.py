from pathlib import Path
from typing import Any

AVATAR_DIR = Path(__file__).resolve().parent.parent.parent / "uploads" / "avatars"
AVATAR_URL_PREFIX = "/static/avatars"
DEFAULT_AVATAR_DIR = Path(__file__).resolve().parent.parent / "static" / "avatars" / "default"
DEFAULT_AVATAR_URL_PREFIX = f"{AVATAR_URL_PREFIX}/default"
ALLOWED_AVATAR_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
MAX_AVATAR_BYTES = 2 * 1024 * 1024  # 2MB

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
