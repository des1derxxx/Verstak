from fastapi import HTTPException
from app.database.mongo import new_id, now
from .. import workspaces as services
from ..activity import public, add_comment
from .mutations import persist
from .access import execute, find_task
from app.schemas.projects import status_category, status_for


def list_projects(store, auth, workspace_id):
    return execute(store, auth, workspace_id, lambda db, ws, s: [public(p) for p in db.projects.find({"workspace_id": ws}, session=s)])


def list_tasks(store, auth, workspace_id=None, project_id=None, status=None, parent_id=None, limit=100, offset=0):
    def operation(db, ws, session):
        query = {"workspace_id": ws}
        for key, value in (("projectId", project_id), ("status", status), ("parentId", parent_id)):
            if value is not None: query[key] = value
        items = list(db.tasks.find(query, session=session).sort("createdAt", 1))
        return {"items": [public(t) for t in items[offset:offset + limit]], "total": len(items), "limit": limit, "offset": offset}
    return execute(store, auth, workspace_id, operation)


def create_task(store, auth, body):
    identifier = new_id()
    def operation(db, ws, session):
        previous = services.read_data(db, ws, session)
        task = {**body.model_dump(mode="json", exclude={"workspaceId"}), "id": identifier, "createdAt": now().isoformat()}
        result = persist(db, ws, previous, {**previous, "tasks": [*previous["tasks"], task]}, auth["user"], session)
        return next(t for t in result["tasks"] if t["id"] == identifier)
    return execute(store, auth, body.workspaceId, operation, True)


def get_task(store, auth, ref, workspace_id=None):
    return execute(store, auth, workspace_id, lambda db, ws, s: find_task(db, ws, ref, s))


def update_task(store, auth, ref, body, workspace_id=None):
    def operation(db, ws, session):
        task = find_task(db, ws, ref, session)
        if task["revision"] != body.revision:
            raise HTTPException(409, "Задача изменилась. Прочитай её заново и повтори правку.")
        previous = services.read_data(db, ws, session)
        changes = body.model_dump(mode="json", exclude_unset=True, exclude={"revision"})
        if changes.get("projectId", task["projectId"]) != task["projectId"] and "status" not in changes:
            # Columns differ between projects, so keep the same stage in the new project.
            projects = {project["id"]: project for project in previous["projects"]}
            if changes["projectId"] in projects:
                category = status_category(projects.get(task["projectId"], {}), task["status"]) or "todo"
                changes["status"] = status_for(projects[changes["projectId"]], category)
        result = persist(db, ws, previous, {**previous, "tasks": [{**t, **changes} if t["id"] == task["id"] else t for t in previous["tasks"]]}, auth["user"], session)
        return next(t for t in result["tasks"] if t["id"] == task["id"])
    return execute(store, auth, workspace_id, operation, True)


def delete_task(store, auth, ref, revision, workspace_id=None):
    def operation(db, ws, session):
        task = find_task(db, ws, ref, session)
        if task["revision"] != revision: raise HTTPException(409, "Задача изменилась")
        previous = services.read_data(db, ws, session)
        persist(db, ws, previous, {**previous, "tasks": [t for t in previous["tasks"] if t["id"] != task["id"]]}, auth["user"], session)
    execute(store, auth, workspace_id, operation, True)


def list_comments(store, auth, ref, workspace_id=None):
    def operation(db, ws, session):
        task = find_task(db, ws, ref, session)
        return [public(c) for c in db.comments.find({"workspace_id": ws, "taskId": task["id"]}, session=session).sort("createdAt", 1)]
    return execute(store, auth, workspace_id, operation)


def add_task_comment(store, auth, ref, body, workspace_id=None):
    def operation(db, ws, session):
        task = find_task(db, ws, ref, session)
        project = db.projects.find_one({"workspace_id": ws, "id": task["projectId"]}, session=session) or {}
        if body.kind == "resolution" and status_category(project, task["status"]) != "done":
            raise HTTPException(422, "Итоговый комментарий добавляется при завершении задачи")
        return add_comment(db, ws, task, auth["user"], body.body, body.kind, session)
    return execute(store, auth, workspace_id, operation, True)


def list_history(store, auth, ref, workspace_id=None):
    def operation(db, ws, session):
        task = find_task(db, ws, ref, session)
        return [public(e) for e in db.history.find({"workspace_id": ws, "taskId": task["id"]}, session=session).sort("createdAt", 1)]
    return execute(store, auth, workspace_id, operation)
