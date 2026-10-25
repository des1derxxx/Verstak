import hmac
from fastapi import HTTPException, Request
from app.core.security import SESSION_COOKIE, digest
from app.database.mongo import now


def authenticated(request: Request):
    if request.headers.get("authorization"):
        raise HTTPException(401, "Для этого действия нужна сессия в браузере")
    token = request.cookies.get(SESSION_COOKIE, "")
    session = request.app.state.store.db.sessions.find_one({"_id": digest(token), "expires_at": {"$gt": now()}}) if token else None
    if not session:
        raise HTTPException(401, "Войди в аккаунт")
    if request.method not in {"GET", "HEAD", "OPTIONS"} and not hmac.compare_digest(request.headers.get("x-csrf-token", ""), session["csrf"]):
        raise HTTPException(403, "Обнови страницу и повтори действие")
    user = request.app.state.store.db.users.find_one({"_id": session["user_id"]})
    if not user:
        raise HTTPException(401, "Войди в аккаунт")
    return user, session


def authenticate(request: Request):
    authorization = request.headers.get("authorization")
    if authorization is None:
        user, _ = authenticated(request)
        return {"user": user, "token_id": None}
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Ожидается Bearer-токен")
    db = request.app.state.store.db
    token = db.api_tokens.find_one({"token_hash": digest(authorization[7:]), "expires_at": {"$gt": now()}})
    user = db.users.find_one({"_id": token["user_id"]}) if token else None
    if not user:
        raise HTTPException(401, "Токен недействителен или истёк")
    return {"user": user, "token_id": token["_id"]}
