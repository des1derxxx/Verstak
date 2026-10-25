from pydantic import Field, StringConstraints
from typing_extensions import Annotated
from .common import Model, Identifier, ProjectKey


class Project(Model):
    id: Identifier
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)]
    description: str = Field(default="", max_length=4000)
    color: str = Field(pattern=r"^#[0-9a-fA-F]{6}$")
    key: ProjectKey | None = None
