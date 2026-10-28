from typing import Literal
from pydantic import Field, StringConstraints
from typing_extensions import Annotated
from .common import Model, Identifier


class ApiTokenCreate(Model):
    workspaceId: Identifier
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)]
    scopes: list[Literal["tasks:read", "tasks:write", "notes:read"]] = Field(default_factory=lambda: ["tasks:read"], min_length=1, max_length=3)
    expiresInDays: int = Field(default=90, ge=1, le=365)
