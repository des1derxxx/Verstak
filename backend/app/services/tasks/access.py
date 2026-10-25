from fastapi import HTTPException
from app.database.mongo import now
from ..workspaces import membership
from ..activity import public


def access(db, auth, workspace_id, session, write=False):
    if auth["token_id"]:
        token = db.api_tokens.find_one({"_id": auth["token_id"], "expires_at": {"$gt": now()}}, session=session)
        if not token:
            raise HTTPException(401, "Токен отозван или истёк")
        if workspace_id and workspace_id != token["workspace_id"]:
            raise HTTPException(404, "Пространство не найдено")
        db.api_tokens.update_one({"_id": token["_id"]}, {"$set": {"last_used_at": now()}}, session=session)
        workspace_id = token["workspace_id"]
        if ("tasks:write" if write else "tasks:read") not in token["scopes"]:
            raise HTTPException(403, "Токен не разрешает это действие")
    if not workspace_id:
        raise HTTPException(422, "Укажи workspaceId")
    membership(db, workspace_id, auth["user"]["_id"], session, {"owner", "editor"} if write else None)
    return workspace_id


def execute(store, auth, workspace_id, callback, write=False):
    def operation(session):
        ws = access(store.db, auth, workspace_id, session, write)
        if write:
            store.db.workspaces.update_one({"_id": ws}, {"$inc": {"revision": 1}}, session=session)
        return callback(store.db, ws, session)
    return store.run(operation)


def find_task(db, ws, ref, session):
    task = db.tasks.find_one({"workspace_id": ws, "id": ref}, session=session)
    task = task or db.tasks.find_one({"workspace_id": ws, "key": ref}, session=session)
    if not task:
        raise HTTPException(404, "Задача не найдена")
    return public(task)
