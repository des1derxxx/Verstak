from fastapi import APIRouter, Depends, Request
from app.api.dependencies import authenticated
from app.services import notifications as service

router = APIRouter()


@router.get("/notifications")
def notifications(request: Request, auth=Depends(authenticated)):
    return service.list_notifications(request.app.state.store.db, auth[0])


@router.patch("/notifications/{notification_id}/read", status_code=204)
def read_notification(notification_id: str, request: Request, auth=Depends(authenticated)):
    service.mark_read(request.app.state.store.db, auth[0], notification_id)
