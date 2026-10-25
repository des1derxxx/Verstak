from datetime import date, datetime
from typing import Literal
from pydantic import Field, HttpUrl, StringConstraints, field_validator, model_validator
from typing_extensions import Annotated
from .common import Model, Identifier, Title, IssueKey, TaskType


class Check(Model):
    id: Identifier
    text: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=500)]
    done: bool


class TaskLink(Model):
    url: HttpUrl
    label: str = Field(default="", max_length=80)
    kind: Literal["pr", "commit", "reference"] = "reference"


class TaskFields(Model):
    projectId: Identifier
    title: Title
    description: str = Field(default="", max_length=20000)
    status: Literal["backlog", "todo", "progress", "done"] = "todo"
    priority: Literal["low", "medium", "high"] = "medium"
    due: str = ""
    labels: list[Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=40)]] = Field(default_factory=list, max_length=20)
    checklist: list[Check] = Field(default_factory=list, max_length=100)
    parentId: Identifier | None = None
    assigneeId: Identifier | None = None
    type: TaskType = "task"
    links: list[TaskLink] = Field(default_factory=list, max_length=30)
    resolutionComment: str | None = Field(default=None, max_length=10000)

    @field_validator("due")
    @classmethod
    def valid_due(cls, value):
        if value and (len(value) != 10 or date.fromisoformat(value).isoformat() != value):
            raise ValueError("Некорректный срок")
        return value

    @model_validator(mode="after")
    def unique_checks(self):
        if len({item.id for item in self.checklist}) != len(self.checklist):
            raise ValueError("Повторяющиеся пункты чеклиста")
        return self


class Task(TaskFields):
    id: Identifier
    createdAt: str
    key: IssueKey | None = None
    revision: int = Field(default=0, ge=0)
    createdById: Identifier | None = None
    updatedAt: str | None = None

    @field_validator("createdAt", "updatedAt")
    @classmethod
    def valid_time(cls, value):
        if value is not None:
            datetime.fromisoformat(value.replace("Z", "+00:00"))
        return value


class TaskCreate(TaskFields):
    workspaceId: Identifier | None = None


class TaskPatch(Model):
    revision: int = Field(ge=1)
    title: Title | None = None
    description: str | None = Field(default=None, max_length=20000)
    projectId: Identifier | None = None
    status: Literal["backlog", "todo", "progress", "done"] | None = None
    priority: Literal["low", "medium", "high"] | None = None
    due: str | None = None
    labels: list[str] | None = None
    checklist: list[Check] | None = None
    parentId: Identifier | None = None
    assigneeId: Identifier | None = None
    type: TaskType | None = None
    links: list[TaskLink] | None = None
    resolutionComment: str | None = Field(default=None, max_length=10000)


class CommentCreate(Model):
    body: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=10000)]
    kind: Literal["comment", "resolution"] = "comment"
