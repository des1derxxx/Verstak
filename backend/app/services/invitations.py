from datetime import timedelta
import secrets
from fastapi import HTTPException
from app.core.security import digest
from app.database.mongo import new_id, now
from .workspaces import membership


def create_invitation(store, workspace_id, user_id, body):
    token = secrets.token_urlsafe(32)
    invitation_id = new_id()

    def operation(session):
        membership(store.db, workspace_id, user_id, session, {"owner"})
        email = str(body.email).lower()
        target = store.db.users.find_one({"email": email}, session=session)
        if target and store.db.members.find_one({"workspace_id": workspace_id, "user_id": target["_id"]}, session=session):
            raise HTTPException(409, "Этот пользователь уже участвует в пространстве")
        # A new invitation replaces old invitations for this email and workspace.
        store.db.invitations.delete_many({"workspace_id": workspace_id, "email": email}, session=session)
        store.db.invitations.insert_one({"_id": invitation_id, "token_hash": digest(token), "workspace_id": workspace_id, "email": email, "role": body.role, "created_by": user_id, "expires_at": now() + timedelta(days=7)}, session=session)
        return {"id": invitation_id, "token": token}
    return store.run(operation)


def accept_invitation(store, user, token):
    def operation(session):
        invite = store.db.invitations.find_one({"token_hash": digest(token), "expires_at": {"$gt": now()}}, session=session)
        if not invite:
            raise HTTPException(404, "Приглашение истекло или было отозвано")
        if invite["email"] != user["email"]:
            raise HTTPException(403, "Приглашение предназначено для другого email")
        workspace = store.db.workspaces.find_one({"_id": invite["workspace_id"]}, session=session)
        if not workspace:
            raise HTTPException(404, "Пространство не найдено")
        existing = store.db.members.find_one({"workspace_id": invite["workspace_id"], "user_id": user["_id"]}, session=session)
        if not existing:
            store.db.members.insert_one({"_id": new_id(), "workspace_id": invite["workspace_id"], "user_id": user["_id"], "role": invite["role"]}, session=session)
        store.db.invitations.delete_one({"_id": invite["_id"]}, session=session)
        return {"id": workspace["_id"], "name": workspace["name"], "role": existing["role"] if existing else invite["role"]}
    return store.run(operation)
