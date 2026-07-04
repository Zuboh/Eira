from fastapi import APIRouter

from app.deps import CurrentUserDep
from app.schemas.banca_ore import BancaOreRead

router = APIRouter(prefix="/banca-ore", tags=["banca-ore"])


@router.get("/{infermiere_id}")
def get_banca_ore(infermiere_id: int, mese: str, current_user: CurrentUserDep) -> BancaOreRead:
    return BancaOreRead(infermiere_id=infermiere_id, mese=mese, ore_pianificate=0, ore_contrattuali=0, saldo=0)
