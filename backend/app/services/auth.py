from fastapi import HTTPException
from pymongo.errors import DuplicateKeyError
from app.core.security import PASSWORDS, create_session, digest, rate_limit
from app.database.mongo import new_id, now
from .users import public_user
from .workspaces import create_workspace


def register(store, settings, body):
    email = str(body.email).lower()
    password_hash = PASSWORDS.hash(body.password)
    user = {"_id": new_id(), "name": body.name, "email": email, "password_hash": password_hash, "created_at": now()}

    def operation(session):
        if not settings.registration_enabled:
            invite = store.db.invitations.find_one({"token_hash": digest(body.invitationToken), "email": email, "expires_at": {"$gt": now()}}, session=session)
            if not invite:
                raise HTTPException(403, "Регистрация доступна по приглашению")
        store.db.users.insert_one(user, session=session)
        create_workspace(store.db, user["_id"], f"Пространство {body.name}", session)
        return create_session(store.db, user["_id"], settings.session_days, session)

    try:
        token, csrf = store.run(operation)
    except DuplicateKeyError:
        raise HTTPException(409, "Аккаунт с этим email уже существует")
    return public_user(user), token, csrf


def login(store, settings, body, host, dummy_password):
    db = store.db
    email = str(body.email).lower()
    rate_limit(db, f"login:{email}")
    rate_limit(db, f"login-ip:{host}", limit=100)
    user = db.users.find_one({"email": email})
    valid = PASSWORDS.verify(body.password, user["password_hash"] if user else dummy_password)
    if not user or not valid:
        raise HTTPException(401, "Неверный email или пароль")
    def operation(session):
        locked = db.users.update_one({"_id": user["_id"], "password_hash": user["password_hash"]}, {"$inc": {"auth_revision": 1}}, session=session)
        if locked.matched_count != 1:
            raise HTTPException(401, "Пароль изменён. Повтори вход.")
        return create_session(db, user["_id"], settings.session_days, session)
    token, csrf = store.run(operation)
    return public_user(user), token, csrf
