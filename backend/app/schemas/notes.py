from datetime import datetime
from pydantic import Field, field_validator
from .common import Model, Identifier, Title


class Note(Model):
    id: Identifier
    projectId: Identifier
    title: Title
    body: str = Field(default="", max_length=200000)
    updatedAt: str

    @field_validator("updatedAt")
    @classmethod
    def valid_time(cls, value):
        datetime.fromisoformat(value.replace("Z", "+00:00"))
        return value
