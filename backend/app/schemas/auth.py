from pydantic import EmailStr, Field, StringConstraints
from typing_extensions import Annotated
from .common import Model


class Register(Model):
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)]
    email: EmailStr
    password: str = Field(min_length=12, max_length=256)
    invitationToken: str = Field(default="", max_length=100)


class Login(Model):
    email: EmailStr
    password: str = Field(min_length=1, max_length=256)


class PasswordForgot(Model):
    email: EmailStr


class PasswordReset(Model):
    token: str = Field(min_length=30, max_length=100)
    password: str = Field(min_length=12, max_length=256)
