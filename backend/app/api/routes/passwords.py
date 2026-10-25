from fastapi import APIRouter, BackgroundTasks, Request
from app.schemas.auth import PasswordForgot, PasswordReset
from app.services import passwords as service

router = APIRouter()


@router.post("/auth/forgot-password", status_code=202)
def forgot(body: PasswordForgot, request: Request, background: BackgroundTasks):
    return service.request_reset(request.app.state.store, request.app.state.settings, request.app.state.mailer, body, request.client.host, background)


@router.post("/auth/reset-password", status_code=204)
def reset(body: PasswordReset, request: Request):
    service.reset_password(request.app.state.store, body, request.client.host)
