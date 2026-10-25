from pydantic import EmailStr, Field, StringConstraints
from typing_extensions import Annotated
from .common import Model


class ProfileUpdate(Model):
    revision: int = Field(ge=0)
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)]
    email: EmailStr
    bio: str = Field(default="", max_length=500)
    currentPassword: str = Field(default="", max_length=256)
    avatarData: str | None = Field(default=None, max_length=2800000)
