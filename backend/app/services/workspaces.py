from fastapi import HTTPException
from pydantic import ValidationError
from app.schemas.workspaces import Data
from app.database.mongo import new_id, now
from .users import public_user

KINDS = ("projects", "tasks", "notes")


def membership(db, workspace_id, user_id, session=None, roles=None):
    member = db.members.find_one({"workspace_id": workspace_id, "user_id": user_id}, session=session)
    if not member:
        raise HTTPException(404, "Пространство не найдено")
    if roles and member["role"] not in roles:
        raise HTTPException(403, "Недостаточно прав для этого действия")
    return member


def create_workspace(db, user_id, name, session):
    workspace_id = new_id()
    db.workspaces.insert_one({"_id": workspace_id, "name": name, "revision": 0, "schema_version": 2, "created_at": now()}, session=session)
    db.members.insert_one({"_id": new_id(), "workspace_id": workspace_id, "user_id": user_id, "role": "owner"}, session=session)
    return {"id": workspace_id, "name": name, "role": "owner"}


def workspace_list(db, user_id):
    members = list(db.members.find({"user_id": user_id}))
    roles = {item["workspace_id"]: item["role"] for item in members}
    return [{"id": item["_id"], "name": item["name"], "role": roles[item["_id"]]} for item in db.workspaces.find({"_id": {"$in": list(roles)}}).sort("created_at", 1)]


def read_data(db, workspace_id, session):
    result = {"version": 1}
    for kind in KINDS:
        result[kind] = [{key: value for key, value in document.items() if key not in ("_id", "workspace_id")} for document in db[kind].find({"workspace_id": workspace_id}, session=session).sort("_id", 1)]
    return result


def get_data(store, workspace_id, user_id):
    def operation(session):
        membership(store.db, workspace_id, user_id, session)
        workspace = store.db.workspaces.find_one({"_id": workspace_id}, session=session)
        if not workspace:
            raise HTTPException(404, "Пространство не найдено")
        return {"revision": workspace["revision"], "data": read_data(store.db, workspace_id, session)}
    return store.run(operation)


def apply_changes(previous, changes):
    result = {"version": 1}
    for kind in KINDS:
        items = {item["id"]: item for item in previous[kind]}
        removals = getattr(changes.remove, kind)
        upserts = getattr(changes.upsert, kind)
        if len({item.id for item in upserts}) != len(upserts) or set(removals) & {item.id for item in upserts}:
            raise HTTPException(422, "Один объект нельзя одновременно изменить и удалить")
        for item_id in removals:
            items.pop(item_id, None)
        for item in upserts:
            if kind == "tasks" and item.id in items and "revision" in item.model_fields_set and item.revision != items[item.id].get("revision", 0):
                raise HTTPException(409, "Задача изменилась. Обнови карточку перед сохранением.")
            items[item.id] = item.model_dump(mode="json")
        result[kind] = list(items.values())
    # Deleting a project also deletes its tasks and notes.
    deleted_projects = set(changes.remove.projects)
    for kind in ("tasks", "notes"):
        result[kind] = [item for item in result[kind] if item["projectId"] not in deleted_projects]
    try:
        return Data.model_validate(result).model_dump(mode="json")
    except ValidationError:
        raise HTTPException(422, "Проверь связи и ограничения данных проекта")


def write_data(store, workspace_id, user_id, body, replace=False):
    def operation(session):
        membership(store.db, workspace_id, user_id, session, {"owner"} if replace else {"owner", "editor"})
        # Every mutation locks this document, serializing imports and membership changes.
        updated = store.db.workspaces.update_one({"_id": workspace_id, "revision": body.revision}, {"$inc": {"revision": 1}}, session=session)
        if updated.matched_count != 1:
            raise HTTPException(409, "Данные уже изменены другим участником. Обнови пространство и повтори действие.")
        previous = read_data(store.db, workspace_id, session)
        from app.services.tasks.mutations import persist
        proposed = body.data.model_dump(mode="json") if replace else apply_changes(previous, body)
        actor = store.db.users.find_one({"_id": user_id}, session=session)
        result = persist(store.db, workspace_id, previous, proposed, actor, session, restore=replace)
        return {"revision": body.revision + 1, "data": result}
    return store.run(operation)


def list_members(db, workspace_id, user_id):
    membership(db, workspace_id, user_id)
    members = list(db.members.find({"workspace_id": workspace_id}))
    users = {user["_id"]: user for user in db.users.find({"_id": {"$in": [member["user_id"] for member in members]}})}
    return [{"user": public_user(users[item["user_id"]]), "role": item["role"]} for item in members if item["user_id"] in users]


def change_member(store, workspace_id, user_id, target_id, role=None):
    def operation(session):
        membership(store.db, workspace_id, user_id, session, {"owner"})
        target = store.db.members.find_one({"workspace_id": workspace_id, "user_id": target_id}, session=session)
        if not target:
            raise HTTPException(404, "Участник не найден")
        if target["role"] == "owner":
            raise HTTPException(403, "Владельца нельзя удалить или изменить его роль")
        if role:
            store.db.members.update_one({"_id": target["_id"]}, {"$set": {"role": role}}, session=session)
        else:
            store.db.members.delete_one({"_id": target["_id"]}, session=session)
        store.db.workspaces.update_one({"_id": workspace_id}, {"$inc": {"revision": 1}}, session=session)
    store.run(operation)
