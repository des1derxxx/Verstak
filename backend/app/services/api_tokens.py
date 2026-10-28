from datetime import timedelta
import secrets
from app.core.security import digest, rate_limit
from app.database.mongo import new_id, now
from . import workspaces as services


def token_public(t):
    return {"id": t["_id"], "name": t["name"], "workspaceId": t["workspace_id"], "scopes": t["scopes"], "last4": t["last4"], "expiresAt": t["expires_at"].isoformat()}


def list_tokens(db, user):
    return [token_public(t) for t in db.api_tokens.find({"user_id": user["_id"], "expires_at": {"$gt": now()}})]


def create_token(store, user, body):
    rate_limit(store.db, f"tokens:{user['_id']}", limit=30, seconds=3600)
    raw = "vsk_" + secrets.token_urlsafe(32)
    def operation(session):
        services.membership(store.db, body.workspaceId, user["_id"], session, {"owner", "editor"} if {"tasks:write", "notes:write"} & set(body.scopes) else None)
        scopes = list(set(body.scopes) | {"tasks:read"})
        document = {"_id": new_id(), "user_id": user["_id"], "workspace_id": body.workspaceId,
            "name": body.name, "scopes": scopes, "token_hash": digest(raw), "last4": raw[-4:],
            "expires_at": now() + timedelta(days=body.expiresInDays)}
        store.db.api_tokens.insert_one(document, session=session)
        return {**token_public(document), "token": raw}
    return store.run(operation)


def revoke_token(store, user, token_id):
    def operation(session):
        token = store.db.api_tokens.find_one({"_id": token_id, "user_id": user["_id"]}, session=session)
        if token:
            store.db.workspaces.update_one({"_id": token["workspace_id"]}, {"$inc": {"revision": 1}}, session=session)
            store.db.api_tokens.delete_one({"_id": token_id}, session=session)
    store.run(operation)
