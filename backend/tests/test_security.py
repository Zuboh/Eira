import bcrypt
import pytest

from app.core.security import hash_password, verify_password


def test_hash_and_verify_password_roundtrip():
    hashed = hash_password("correct horse battery staple")
    assert hashed != "correct horse battery staple"
    assert verify_password("correct horse battery staple", hashed)


def test_verify_password_rejects_wrong_password():
    hashed = hash_password("correct horse battery staple")
    assert not verify_password("wrong password", hashed)


def test_password_over_72_utf8_bytes_fails_closed():
    oversized = "è" * 37
    with pytest.raises(ValueError):
        hash_password(oversized)
    assert not verify_password(oversized, hash_password("password123"))


def test_hash_password_rejects_password_shorter_than_eight_characters():
    with pytest.raises(ValueError):
        hash_password("short")

    with pytest.raises(ValueError):
        hash_password("😀😀")


def test_verify_password_rejects_malformed_hash_without_raising():
    assert not verify_password("password123", "not-a-bcrypt-hash")


def test_verify_password_accepts_legacy_short_password_hash():
    legacy_hash = bcrypt.hashpw(b"short", bcrypt.gensalt(rounds=4)).decode()
    assert verify_password("short", legacy_hash)
