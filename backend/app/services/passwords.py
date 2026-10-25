from datetime import timedelta
import logging
import secrets
import smtplib
from fastapi import HTTPException
from app.core.security import PASSWORDS, digest, rate_limit
from app.database.mongo import new_id, now

logger = logging.getLogger(__name__)


def request_reset(store, settings, sender, body, host, background):
    db = store.db
    email = str(body.email).lower()
    rate_limit(db, f"reset-ip:{host}", limit=20, seconds=3600)
    rate_limit(db, f"reset-email:{digest(email)}", limit=5, seconds=3600)
    if not sender.configured:
        raise HTTPException(503, "Отправка почты ещё не настроена. Обратись к владельцу сервера.")
    user = db.users.find_one({"email": email})
    def deliver():
        if not user:
            return
        raw = secrets.token_urlsafe(32)
        identifier = new_id()
        db.password_resets.insert_one({"_id": identifier, "token_hash": digest(raw), "user_id": user["_id"], "expires_at": now() + timedelta(minutes=30)})
        try:
            sender.send_reset(email, f"{settings.public_origin}/reset-password#reset={raw}")
        except (OSError, smtplib.SMTPException):
            db.password_resets.delete_one({"_id": identifier})
            logger.error("Password recovery email delivery failed")
    # Email latency does not reveal whether an account exists in the HTTP response.
    background.add_task(deliver)
    return {"message": "Если аккаунт существует, письмо со ссылкой придёт на почту."}


def reset_password(store, body, host):
    rate_limit(store.db, f"reset-submit:{host}", limit=20, seconds=3600)
    password_hash = PASSWORDS.hash(body.password)
    def operation(session):
        item = store.db.password_resets.find_one({"token_hash": digest(body.token), "expires_at": {"$gt": now()}}, session=session)
        if not item:
            raise HTTPException(400, "Ссылка недействительна или истекла. Запроси новую.")
        # The user write serializes concurrent recovery attempts; invalidates all credentials.
        store.db.users.update_one({"_id": item["user_id"]}, {"$set": {"password_hash": password_hash}}, session=session)
        for collection in ("sessions", "api_tokens", "password_resets"):
            store.db[collection].delete_many({"user_id": item["user_id"]}, session=session)
    store.run(operation)
