from fastapi import APIRouter, Depends, Request, Response
from app.api.dependencies import authenticated
from app.schemas.profile import ProfileUpdate
from app.services import profiles as service

router = APIRouter()


@router.patch("/auth/profile")
def update_profile(body: ProfileUpdate, request: Request, auth=Depends(authenticated)):
    return service.update_profile(request.app.state.store, auth[0], auth[1], body)


@router.get("/users/{user_id}/avatar")
def get_avatar(user_id: str, request: Request, auth=Depends(authenticated)):
    return Response(content=service.get_avatar(request.app.state.store.db, auth[0], user_id), media_type="image/webp")
