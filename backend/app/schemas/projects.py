from pydantic import Field, StringConstraints, model_validator
from typing_extensions import Annotated
from .common import Model, Identifier, ProjectKey, StatusId, StatusCategory


class ProjectStatus(Model):
    id: StatusId
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=40)]
    category: StatusCategory


# Projects without their own columns use these; the ids match the original fixed statuses.
DEFAULT_STATUSES = [
    {"id": "backlog", "name": "Бэклог", "category": "backlog"},
    {"id": "todo", "name": "К выполнению", "category": "todo"},
    {"id": "progress", "name": "В работе", "category": "progress"},
    {"id": "done", "name": "Готово", "category": "done"},
]


class Project(Model):
    id: Identifier
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)]
    description: str = Field(default="", max_length=4000)
    color: str = Field(pattern=r"^#[0-9a-fA-F]{6}$")
    key: ProjectKey | None = None
    statuses: list[ProjectStatus] | None = Field(default=None, min_length=2, max_length=20)

    @model_validator(mode="after")
    def valid_statuses(self):
        if self.statuses is not None:
            if len({status.id for status in self.statuses}) != len(self.statuses):
                raise ValueError("Колонки проекта должны быть уникальны")
            if not {"todo", "done"} <= {status.category for status in self.statuses}:
                raise ValueError("Нужна хотя бы одна колонка «К выполнению» и одна «Готово»")
        return self


def project_statuses(project) -> list[dict]:
    statuses = project.get("statuses") if isinstance(project, dict) else project.statuses
    if not statuses:
        return DEFAULT_STATUSES
    return [status if isinstance(status, dict) else status.model_dump() for status in statuses]


def status_category(project, status_id):
    return next((status["category"] for status in project_statuses(project) if status["id"] == status_id), None)


def status_for(project, category="todo", current=None):
    """Keeps the status if the project has it, otherwise picks the first one of the same category."""
    statuses = project_statuses(project)
    if any(status["id"] == current for status in statuses):
        return current
    return next((status["id"] for status in statuses if status["category"] == category),
                next(status["id"] for status in statuses if status["category"] == "todo"))
