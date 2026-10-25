import re
from fastapi import HTTPException
from pymongo import ReturnDocument
from pydantic import ValidationError
from app.schemas.workspaces import Data
from app.database.mongo import now
from ..activity import audit, add_comment

WRITABLE = ("projectId", "title", "description", "status", "priority", "due", "labels", "checklist", "parentId", "assigneeId", "type", "links")


def reserve_prefix(db, workspace_id, project, previous, used, session):
    supplied = project.get("key")
    old_key = previous.get("key") if previous else None
    old_reservation = db.project_keys.find_one({"_id": f"{workspace_id}:{old_key}"}, session=session) if old_key else None
    if old_key and supplied and supplied != old_key and old_reservation and old_reservation.get("next_number", 0):
        raise HTTPException(409, "Ключ проекта с выданными номерами задач менять нельзя")
    prefix = supplied or old_key
    generated = not prefix
    if generated:
        prefix = re.sub(r"[^A-Z0-9]", "", project["name"].upper())[:8]
        if not prefix or not prefix[0].isalpha(): prefix = "PRJ"
        if len(prefix) < 2: prefix += "P"
    base, suffix = prefix, 1
    while True:
        reservation = db.project_keys.find_one({"_id": f"{workspace_id}:{prefix}"}, session=session)
        if prefix not in used and (not reservation or reservation["project_id"] == project["id"]): break
        if not generated: raise HTTPException(409, "Такой ключ проекта уже занят или использовался раньше")
        suffix += 1
        prefix = f"{base[:7]}{suffix}"
    if old_key and old_key != prefix and old_reservation and old_reservation.get("next_number", 0) == 0:
        db.project_keys.delete_one({"_id": old_reservation["_id"]}, session=session)
    db.project_keys.update_one({"_id": f"{workspace_id}:{prefix}"},
        {"$setOnInsert": {"workspace_id": workspace_id, "project_id": project["id"], "next_number": 0}}, upsert=True, session=session)
    project["key"] = prefix
    used.add(prefix)


def persist(db, workspace_id, previous, proposed, actor, session, restore=False):
    """Called inside a transaction after acquiring the workspace write lock."""
    try:
        result = Data.model_validate(proposed).model_dump(mode="json")
    except ValidationError:
        raise HTTPException(422, "Проверь поля задачи и связи подзадач: один проект, без циклов")
    old_projects = {item["id"]: item for item in previous["projects"]}
    old_tasks = {item["id"]: item for item in previous["tasks"]}
    projects = {item["id"]: item for item in result["projects"]}
    used = set()
    for project in result["projects"]:
        reserve_prefix(db, workspace_id, project, old_projects.get(project["id"]), used, session)
    members = {item["user_id"] for item in db.members.find({"workspace_id": workspace_id}, session=session)}
    resolutions = {}
    changes_by_id = {}
    for task in result["tasks"]:
        old = old_tasks.get(task["id"])
        resolution = (task.pop("resolutionComment", None) or "").strip()
        if task.get("assigneeId") and task["assigneeId"] not in members and (not old or old.get("assigneeId") != task["assigneeId"]):
            raise HTTPException(422, "Исполнитель должен быть участником пространства")
        prefix = projects[task["projectId"]]["key"]
        if old and old.get("key"):
            if old["projectId"] != task["projectId"]:
                raise HTTPException(409, "Задачу с постоянным ключом нельзя перенести в другой проект")
            if task.get("key") and task["key"] != old["key"]:
                raise HTTPException(409, "Ключ задачи неизменяем")
            task["key"] = old["key"]
        elif restore and task.get("key"):
            if not task["key"].startswith(prefix + "-"):
                raise HTTPException(422, "Ключ задачи не соответствует ключу проекта")
            reservation = db.project_keys.find_one({"_id": f"{workspace_id}:{prefix}"}, session=session)
            number = int(task["key"].rsplit("-", 1)[1])
            if number > reservation["next_number"]:
                db.project_keys.update_one({"_id": reservation["_id"]}, {"$set": {"next_number": number}}, session=session)
        else:
            reservation = db.project_keys.find_one_and_update({"_id": f"{workspace_id}:{prefix}"},
                {"$inc": {"next_number": 1}}, return_document=ReturnDocument.AFTER, session=session)
            task["key"] = f"{prefix}-{reservation['next_number']}"
        key_id = f"{workspace_id}:{task['key']}"
        claim = db.issue_keys.find_one({"_id": key_id}, session=session)
        if claim and claim["task_id"] != task["id"]:
            raise HTTPException(409, "Этот номер уже принадлежал другой задаче")
        db.issue_keys.update_one({"_id": key_id}, {"$setOnInsert": {"workspace_id": workspace_id, "task_id": task["id"]}}, upsert=True, session=session)
        closing = task["status"] == "done" and (not old or old["status"] != "done")
        if closing and not restore:
            if not resolution:
                raise HTTPException(422, "Для завершения задачи нужен итоговый комментарий")
            if any(child.get("parentId") == task["id"] and child["status"] != "done" for child in result["tasks"]):
                raise HTTPException(409, "Сначала заверши все подзадачи")
            resolutions[task["id"]] = resolution
        task["createdAt"] = old["createdAt"] if old else task["createdAt"] if restore else now().isoformat()
        task["createdById"] = old.get("createdById") if old else actor["_id"] if actor else None
        changes = {field: {"from": old.get(field), "to": task.get(field)} for field in WRITABLE if old and old.get(field) != task.get(field)}
        task["revision"] = max(old.get("revision", 0), 1) + int(bool(changes)) if old else 1
        task["updatedAt"] = now().isoformat() if not old or changes else old.get("updatedAt") or old["createdAt"]
        changes_by_id[task["id"]] = changes
    if len({task["key"] for task in result["tasks"]}) != len(result["tasks"]):
        raise HTTPException(422, "Ключи задач не должны повторяться")
    for kind in ("projects", "tasks", "notes"):
        old = {item["id"]: item for item in previous[kind]}
        current = {item["id"]: item for item in result[kind]}
        removed = list(set(old) - set(current))
        if removed:
            db[kind].delete_many({"workspace_id": workspace_id, "id": {"$in": removed}}, session=session)
            if kind == "tasks":
                for identifier in removed:
                    audit(db, workspace_id, old[identifier], actor, "deleted", {}, session)
        for identifier, item in current.items():
            if old.get(identifier) != item:
                document = {**item, "_id": f"{workspace_id}:{identifier}", "workspace_id": workspace_id}
                db[kind].replace_one({"_id": document["_id"], "workspace_id": workspace_id}, document, upsert=True, session=session)
                if kind == "tasks" and (identifier not in old or changes_by_id[identifier]):
                    event = "created" if identifier not in old else "status_changed" if "status" in changes_by_id[identifier] else "updated"
                    audit(db, workspace_id, item, actor, event, changes_by_id[identifier], session)
                if kind == "tasks" and identifier in resolutions:
                    add_comment(db, workspace_id, item, actor, resolutions[identifier], "resolution", session)
    return result
