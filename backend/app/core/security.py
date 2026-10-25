from datetime import timedelta
import hashlib
import secrets

from fastapi import HTTPException
from cryptography.exceptions import InvalidKey
from cryptography.hazmat.primitives.kdf.argon2 import Argon2id
from pymongo import ReturnDocument

from app.database.mongo import now

class Passwords:
    @staticmethod
    def hash(password):
        return Argon2id(salt=secrets.token_bytes(16), length=32, iterations=3, lanes=4, memory_cost=64 * 1024).derive_phc_encoded(password.encode())

    @staticmethod
    def verify(password, encoded):
        try:
            Argon2id.verify_phc_encoded(password.encode(), encoded)
            return True
        except InvalidKey:
            return False


PASSWORDS = Passwords()
SESSION_COOKIE = "verstak_session"


def digest(token):
    return hashlib.sha256(token.encode()).hexdigest()


def create_session(db, user_id, days, session=None):
    token = secrets.token_urlsafe(32)
    csrf = secrets.token_urlsafe(32)
    db.sessions.insert_one({
        "_id": digest(token), "user_id": user_id, "csrf": csrf,
        "expires_at": now() + timedelta(days=days),
    }, session=session)
    return token, csrf


def rate_limit(db, key, limit=20, seconds=600):
    current = now()
    bucket = int(current.timestamp()) // seconds
    document = db.rate_limits.find_one_and_update(
        {"_id": digest(f"{key}:{bucket}")},
        {"$inc": {"count": 1}, "$setOnInsert": {"expires_at": current + timedelta(seconds=seconds * 2)}},
        upsert=True, return_document=ReturnDocument.AFTER,
    )
    if document["count"] > limit:
        raise HTTPException(429, "Слишком много попыток. Попробуй позже.", headers={"Retry-After": str(seconds)})
