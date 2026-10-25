from typing import Literal
from pydantic import Field, StringConstraints, model_validator
from typing_extensions import Annotated
from .common import Model, Identifier, InviteRole
from .projects import Project, project_statuses
from .notes import Note
from .tasks import Task


class WorkspaceCreate(Model):
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)]


class MemberUpdate(Model):
    role: InviteRole


class Data(Model):
    version: Literal[1] = 1
    projects: list[Project] = Field(default_factory=list, max_length=1000)
    tasks: list[Task] = Field(default_factory=list, max_length=10000)
    notes: list[Note] = Field(default_factory=list, max_length=2000)

    @model_validator(mode="after")
    def consistent_references(self):
        ids = [item.id for items in (self.projects, self.tasks, self.notes) for item in items]
        if len(ids) != len(set(ids)):
            raise ValueError("Идентификаторы должны быть уникальны")
        projects = {project.id: project for project in self.projects}
        if any(item.projectId not in projects for item in [*self.tasks, *self.notes]):
            raise ValueError("Задача или заметка ссылается на неизвестный проект")
        statuses = {project.id: {status["id"] for status in project_statuses(project)} for project in self.projects}
        if any(task.status not in statuses[task.projectId] for task in self.tasks):
            raise ValueError("Статус задачи должен быть колонкой её проекта")
        tasks = {task.id: task for task in self.tasks}
        for task in self.tasks:
            seen = {task.id}
            parent = task.parentId
            while parent:
                if parent in seen:
                    raise ValueError("Связи подзадач не могут образовывать цикл")
                if parent not in tasks or tasks[parent].projectId != task.projectId:
                    raise ValueError("Родительская задача должна находиться в том же проекте")
                seen.add(parent)
                if len(seen) > 32:
                    raise ValueError("Допускается не больше 32 уровней подзадач")
                parent = tasks[parent].parentId
        return self


class Upsert(Model):
    projects: list[Project] = Field(default_factory=list, max_length=1000)
    tasks: list[Task] = Field(default_factory=list, max_length=10000)
    notes: list[Note] = Field(default_factory=list, max_length=2000)


class Remove(Model):
    projects: list[Identifier] = Field(default_factory=list, max_length=1000)
    tasks: list[Identifier] = Field(default_factory=list, max_length=10000)
    notes: list[Identifier] = Field(default_factory=list, max_length=2000)


class Changes(Model):
    revision: int = Field(ge=0)
    upsert: Upsert = Field(default_factory=Upsert)
    remove: Remove = Field(default_factory=Remove)


class Import(Model):
    revision: int = Field(ge=0)
    data: Data
