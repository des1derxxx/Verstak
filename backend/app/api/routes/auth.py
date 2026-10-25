from fastapi import APIRouter, Depends, Request, Response
from app.api.dependencies import authenticated
from datetime import timedelta
from app.schemas import auth as schemas
from app.services import auth as services
from app.core.security import SESSION_COOKIE, rate_limit


def session_response(response, user, token, csrf, settings):
    response.delete_cookie(SESSION_COOKIE, path="/api", httponly=True, secure=settings.secure_cookies, samesite="lax")
    response.set_cookie(SESSION_COOKIE, token, httponly=True, secure=settings.secure_cookies, samesite="lax", max_age=int(timedelta(days=settings.session_days).total_seconds()), path="/")
    return {"user": user, "csrf": csrf}

router = APIRouter()


@router.post("/auth/register", status_code=201)
def register(body: schemas.Register, request: Request, response: Response):
    settings = request.app.state.settings
    db = request.app.state.store.db
    rate_limit(db, f"register:{request.client.host}", limit=10, seconds=3600)
    user, token, csrf = services.register(request.app.state.store, settings, body)
    return session_response(response, user, token, csrf, settings)


@router.get("/auth/me")
def me(auth=Depends(authenticated)):
    return {"user": services.public_user(auth[0]), "csrf": auth[1]["csrf"]}


@router.post("/auth/logout", status_code=204)
def logout(request: Request, response: Response, auth=Depends(authenticated)):
    settings = request.app.state.settings
    request.app.state.store.db.sessions.delete_one({"_id": auth[1]["_id"]})
    response.delete_cookie(SESSION_COOKIE, path="/", httponly=True, secure=settings.secure_cookies, samesite="lax")
    response.delete_cookie(SESSION_COOKIE, path="/api", httponly=True, secure=settings.secure_cookies, samesite="lax")

@router.post("/auth/login")
def login(body: schemas.Login, request: Request, response: Response):
    settings = request.app.state.settings
    user, token, csrf = services.login(request.app.state.store, settings, body, request.client.host, request.app.state.dummy_password)
    return session_response(response, user, token, csrf, settings)
