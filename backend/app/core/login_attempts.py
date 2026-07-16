"""Per-account exponential backoff for /auth/token, layered on top of the
per-IP rate limit. In-memory only: resets on process restart, which is fine
for Eira's single-process, no-standing-deploy threat model.
"""

import time

_BACKOFF_CAP_SECONDS = 30

_failed_attempts: dict[int, tuple[int, float]] = {}


def seconds_until_retry(utente_id: int) -> float:
    entry = _failed_attempts.get(utente_id)
    if entry is None:
        return 0.0
    _, retry_at = entry
    return max(0.0, retry_at - time.monotonic())


def record_failure(utente_id: int) -> None:
    count, _ = _failed_attempts.get(utente_id, (0, 0.0))
    count += 1
    delay = min(2 ** (count - 1), _BACKOFF_CAP_SECONDS)
    _failed_attempts[utente_id] = (count, time.monotonic() + delay)


def record_success(utente_id: int) -> None:
    _failed_attempts.pop(utente_id, None)


def reset() -> None:
    """Test-only: clear all tracked attempts so state doesn't leak across tests."""
    _failed_attempts.clear()
