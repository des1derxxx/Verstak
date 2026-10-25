from fastapi import APIRouter, Depends, Request
from app.api.dependencies import authenticated
from app.schemas import invitations as schemas
from app.services import invitations as services
from app.core.security import rate_limit
from app.database.mongo import now

router = APIRouter()


@router.get("/workspaces/{workspace_id}/invitations")
def invitations(workspace_id: str, request: Request, auth=Depends(authenticated)):
    db = request.app.state.store.db
    services.membership(db, workspace_id, auth[0]["_id"], roles={"owner"})
    return [{"id": item["_id"], "email": item["email"], "role": item["role"], "expiresAt": item["expires_at"].isoformat()} for item in db.invitations.find({"workspace_id": workspace_id, "expires_at": {"$gt": now()}})]


@router.post("/workspaces/{workspace_id}/invitations", status_code=201)
def invite(workspace_id: str, body: schemas.InviteCreate, request: Request, auth=Depends(authenticated)):
    settings = request.app.state.settings
    rate_limit(request.app.state.store.db, f"invites:{auth[0]['_id']}", limit=30, seconds=3600)
    result = services.create_invitation(request.app.state.store, workspace_id, auth[0]["_id"], body)
    return {"id": result["id"], "url": f"{settings.public_origin}/invite#invite={result['token']}"}


@router.delete("/workspaces/{workspace_id}/invitations/{invitation_id}", status_code=204)
def revoke(workspace_id: str, invitation_id: str, request: Request, auth=Depends(authenticated)):
    db = request.app.state.store.db
    services.membership(db, workspace_id, auth[0]["_id"], roles={"owner"})
    db.invitations.delete_one({"_id": invitation_id, "workspace_id": workspace_id})


@router.post("/invitations/accept")
def accept(body: schemas.InviteAccept, request: Request, auth=Depends(authenticated)):
    return services.accept_invitation(request.app.state.store, auth[0], body.token)
