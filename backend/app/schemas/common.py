from typing import Literal
from pydantic import BaseModel, ConfigDict, StringConstraints
from typing_extensions import Annotated

Identifier = Annotated[str, StringConstraints(pattern=r"^[a-zA-Z0-9_-]{1,80}$")]
Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=180)]
Role = Literal["owner", "editor", "viewer"]
InviteRole = Literal["editor", "viewer"]
ProjectKey = Annotated[str, StringConstraints(pattern=r"^[A-Z][A-Z0-9]{1,9}$")]
IssueKey = Annotated[str, StringConstraints(pattern=r"^[A-Z][A-Z0-9]{1,9}-[1-9][0-9]*$")]
TaskType = Literal["task", "bug", "story"]
StatusId = Annotated[str, StringConstraints(pattern=r"^[a-zA-Z0-9_-]{1,40}$")]
StatusCategory = Literal["backlog", "todo", "progress", "done"]


class Model(BaseModel):
    model_config = ConfigDict(extra="forbid")
