"""MCP tools over the workspace an API token belongs to."""
import json
from typing import Literal
from fastapi import HTTPException
from pydantic import Field, ValidationError
from app.database.mongo import new_id, now
from app.schemas.common import Model, Identifier, StatusId, Title
from app.schemas.notes import Note
from app.schemas.projects import project_statuses, status_category
from app.schemas.tasks import CommentCreate, TaskCreate, TaskFields, TaskPatch
from . import workspaces
from .activity import public
from .tasks import operations
from .tasks.access import execute, find_task
from .tasks.mutations import persist

INSTRUCTIONS = (
    "Verstak — трекер задач. Токен привязан к одному пространству. Начни с workspace_overview: "
    "там участники, проекты и их колонки (status задачи — id колонки её проекта). "
    "Задачи можно искать по ключу вида OM-52 или UUID. Страницы — заметки проектов. "
    "Перед update_task прочитай задачу через get_task и передай её revision; при конфликте прочитай заново. "
    "Перевод в колонку стадии done требует resolutionComment — итог работы."
)


def names(db, ws, session):
    members = list(db.members.find({"workspace_id": ws}, session=session))
    users = db.users.find({"_id": {"$in": [m["user_id"] for m in members]}}, session=session)
    return {user["_id"]: user["name"] for user in users}


def summary(task, people):
    fields = ("id", "key", "title", "projectId", "status", "priority", "type", "due", "labels", "parentId", "assigneeId", "updatedAt")
    return {**{key: task.get(key) for key in fields}, "assigneeName": people.get(task.get("assigneeId"))}


class Overview(Model):
    pass


def overview(store, auth, _args):
    def operation(db, ws, session):
        workspace = db.workspaces.find_one({"_id": ws}, session=session)
        people = names(db, ws, session)
        projects = [public(p) for p in db.projects.find({"workspace_id": ws}, session=session)]
        tasks = list(db.tasks.find({"workspace_id": ws}, session=session))
        def counts(project):
            own = [t for t in tasks if t["projectId"] == project["id"]]
            return {"total": len(own), "open": sum(status_category(project, t["status"]) != "done" for t in own)}
        return {
            "workspace": {"id": ws, "name": workspace["name"]},
            "members": [{"id": m["user_id"], "name": people.get(m["user_id"]), "role": m["role"]} for m in db.members.find({"workspace_id": ws}, session=session)],
            "projects": [{"id": p["id"], "key": p.get("key"), "name": p["name"], "description": p.get("description", ""),
                "statuses": project_statuses(p), "tasks": counts(p)} for p in projects],
        }
    return execute(store, auth, None, operation)


class ListTasks(Model):
    projectId: Identifier | None = Field(None, description="UUID проекта")
    status: StatusId | None = Field(None, description="id колонки проекта")
    stage: Literal["backlog", "todo", "progress", "done"] | None = Field(None, description="Стадия колонки, общая для всех проектов")
    priority: Literal["low", "medium", "high"] | None = None
    assigneeId: Identifier | None = None
    parentId: Identifier | None = Field(None, description="UUID родительской задачи — вернёт её подзадачи")
    query: str | None = Field(None, max_length=200, description="Поиск по ключу, названию, описанию и меткам")
    limit: int = Field(50, ge=1, le=200)
    offset: int = Field(0, ge=0)


def list_tasks(store, auth, args):
    def operation(db, ws, session):
        projects = {p["id"]: p for p in db.projects.find({"workspace_id": ws}, session=session)}
        items = sorted(db.tasks.find({"workspace_id": ws}, session=session), key=lambda t: t["createdAt"])
        for key in ("projectId", "status", "priority", "assigneeId", "parentId"):
            if getattr(args, key) is not None:
                items = [t for t in items if t.get(key) == getattr(args, key)]
        if args.stage:
            items = [t for t in items if status_category(projects.get(t["projectId"], {}), t["status"]) == args.stage]
        if args.query:
            needle = args.query.casefold()
            items = [t for t in items if needle in " ".join([t.get("key") or "", t["title"], t.get("description", ""), *t.get("labels", [])]).casefold()]
        people = names(db, ws, session)
        return {"items": [summary(t, people) for t in items[args.offset:args.offset + args.limit]],
            "total": len(items), "limit": args.limit, "offset": args.offset}
    return execute(store, auth, None, operation)


class GetTask(Model):
    ref: str = Field(min_length=1, max_length=80, description="Ключ задачи (OM-52) или UUID")
    includeHistory: bool = Field(False, description="Добавить историю изменений")


def get_task(store, auth, args):
    def operation(db, ws, session):
        task = find_task(db, ws, args.ref, session)
        people = names(db, ws, session)
        result = {**task, "assigneeName": people.get(task.get("assigneeId")),
            "subtasks": [summary(public(t), people) for t in db.tasks.find({"workspace_id": ws, "parentId": task["id"]}, session=session)],
            "comments": [public(c) for c in db.comments.find({"workspace_id": ws, "taskId": task["id"]}, session=session).sort("createdAt", 1)]}
        if args.includeHistory:
            result["history"] = [public(e) for e in db.history.find({"workspace_id": ws, "taskId": task["id"]}, session=session).sort("createdAt", 1)]
        return result
    return execute(store, auth, None, operation)


class ListPages(Model):
    projectId: Identifier | None = Field(None, description="UUID проекта")
    query: str | None = Field(None, max_length=200, description="Поиск по названию и тексту")


def list_pages(store, auth, args):
    def operation(db, ws, session):
        notes = db.notes.find({"workspace_id": ws, **({"projectId": args.projectId} if args.projectId else {})}, session=session)
        needle = (args.query or "").casefold()
        return [{"id": n["id"], "projectId": n["projectId"], "title": n["title"], "updatedAt": n["updatedAt"], "length": len(n.get("body", ""))}
            for n in notes if needle in (n["title"] + " " + n.get("body", "")).casefold()]
    return execute(store, auth, None, operation, scope="notes:read")


class GetPage(Model):
    id: Identifier = Field(description="UUID страницы из list_pages")


def get_page(store, auth, args):
    def operation(db, ws, session):
        note = db.notes.find_one({"workspace_id": ws, "id": args.id}, session=session)
        if not note:
            raise HTTPException(404, "Страница не найдена")
        return public(note)
    return execute(store, auth, None, operation, scope="notes:read")


class CreateTask(TaskFields):
    pass


def create_task(store, auth, args):
    return operations.create_task(store, auth, TaskCreate.model_validate(args.model_dump(mode="json")))


class UpdateTask(TaskPatch):
    ref: str = Field(min_length=1, max_length=80, description="Ключ задачи (OM-52) или UUID")


def update_task(store, auth, args):
    changes = TaskPatch.model_validate(args.model_dump(mode="json", exclude_unset=True, exclude={"ref"}))
    return operations.update_task(store, auth, args.ref, changes)


class AddComment(Model):
    ref: str = Field(min_length=1, max_length=80, description="Ключ задачи (OM-52) или UUID")
    body: str = Field(min_length=1, max_length=10000, description="Текст в Markdown")


def add_comment(store, auth, args):
    return operations.add_task_comment(store, auth, args.ref, CommentCreate(body=args.body))


def save_note(store, auth, note, check=None):
    def operation(db, ws, session):
        previous = workspaces.read_data(db, ws, session)
        old = next((n for n in previous["notes"] if n["id"] == note["id"]), None)
        if check:
            check(old)
        merged = {**(old or {}), **note, "updatedAt": now().isoformat()}
        if not any(p["id"] == merged["projectId"] for p in previous["projects"]):
            raise HTTPException(404, "Проект не найден")
        notes = [n for n in previous["notes"] if n["id"] != note["id"]] + [merged]
        result = persist(db, ws, previous, {**previous, "notes": notes}, auth["user"], session)
        return next(n for n in result["notes"] if n["id"] == note["id"])
    return execute(store, auth, None, operation, write=True, scope="notes:write")


class CreatePage(Model):
    projectId: Identifier = Field(description="UUID проекта")
    title: Title
    body: str = Field("", max_length=200000, description="Текст в Markdown")


def create_page(store, auth, args):
    return save_note(store, auth, {"id": new_id(), **args.model_dump()})


class UpdatePage(Model):
    id: Identifier = Field(description="UUID страницы")
    updatedAt: str = Field(description="updatedAt из get_page — защита от затирания чужих правок")
    title: Title | None = None
    body: str | None = Field(None, max_length=200000, description="Новый текст целиком, в Markdown")


def update_page(store, auth, args):
    def check(old):
        if not old:
            raise HTTPException(404, "Страница не найдена")
        if old["updatedAt"] != args.updatedAt:
            raise HTTPException(409, "Страница изменилась. Прочитай её заново и повтори правку.")
    return save_note(store, auth, args.model_dump(exclude_unset=True, exclude={"updatedAt"}), check)


READ, WRITE = {"readOnlyHint": True}, {"readOnlyHint": False, "destructiveHint": False, "idempotentHint": False}
TOOLS = {
    "workspace_overview": (Overview, overview, READ, "Пространство: участники, проекты, их колонки и число задач."),
    "list_tasks": (ListTasks, list_tasks, READ, "Список задач с фильтрами и поиском. Возвращает краткие карточки без описаний."),
    "get_task": (GetTask, get_task, READ, "Полная задача: описание, чеклист, ссылки, подзадачи и комментарии."),
    "list_pages": (ListPages, list_pages, READ, "Страницы (заметки) проектов без текста. Нужен токен с доступом к страницам."),
    "get_page": (GetPage, get_page, READ, "Текст страницы в Markdown. Нужен токен с доступом к страницам."),
    "create_task": (CreateTask, create_task, WRITE, "Создать задачу или подзадачу (parentId). status — id колонки проекта, без него задача попадёт в первую колонку todo."),
    "update_task": (UpdateTask, update_task, WRITE, "Частично изменить задачу. Нужна revision из get_task; null очищает parentId и assigneeId."),
    "add_comment": (AddComment, add_comment, WRITE, "Добавить комментарий к задаче."),
    "create_page": (CreatePage, create_page, WRITE, "Создать страницу в проекте. Нужен токен с правом изменять страницы."),
    "update_page": (UpdatePage, update_page, WRITE, "Изменить название или текст страницы. Нужен updatedAt из get_page."),
}


def definitions():
    return [{"name": name, "description": description, "inputSchema": model.model_json_schema(),
        "annotations": annotations} for name, (model, _, annotations, description) in TOOLS.items()]


def call(store, auth, name, arguments):
    if name not in TOOLS:
        raise LookupError(name)
    model, handler, _, _ = TOOLS[name]
    try:
        result = handler(store, auth, model.model_validate(arguments or {}))
    except ValidationError as error:
        return failure("; ".join(f"{'.'.join(map(str, e['loc']))}: {e['msg']}" for e in error.errors()))
    except HTTPException as error:
        if error.status_code == 401:
            raise
        return failure(error.detail)
    return {"content": [{"type": "text", "text": json.dumps(result, ensure_ascii=False, default=str)}]}


def failure(message):
    return {"content": [{"type": "text", "text": message}], "isError": True}
