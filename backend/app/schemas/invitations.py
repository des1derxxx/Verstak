from pydantic import EmailStr, Field
from .common import Model, InviteRole


class InviteCreate(Model):
    email: EmailStr
    role: InviteRole = "editor"


class InviteAccept(Model):
    token: str = Field(min_length=20, max_length=100)
