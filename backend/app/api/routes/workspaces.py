from fastapi import APIRouter, Depends, Request
from app.api.dependencies import authenticated
from app.schemas import workspaces as schemas
from app.services import workspaces as services

router = APIRouter()


@router.get("/workspaces")
def workspaces(request: Request, auth=Depends(authenticated)):
    return services.workspace_list(request.app.state.store.db, auth[0]["_id"])


@router.post("/workspaces", status_code=201)
def new_workspace(body: schemas.WorkspaceCreate, request: Request, auth=Depends(authenticated)):
    return request.app.state.store.run(lambda session: services.create_workspace(request.app.state.store.db, auth[0]["_id"], body.name, session))


@router.get("/workspaces/{workspace_id}/data")
def get_data(workspace_id: str, request: Request, auth=Depends(authenticated)):
    return services.get_data(request.app.state.store, workspace_id, auth[0]["_id"])


@router.patch("/workspaces/{workspace_id}/data")
def save_data(workspace_id: str, body: schemas.Changes, request: Request, auth=Depends(authenticated)):
    return services.write_data(request.app.state.store, workspace_id, auth[0]["_id"], body)


@router.put("/workspaces/{workspace_id}/data")
def import_data(workspace_id: str, body: schemas.Import, request: Request, auth=Depends(authenticated)):
    return services.write_data(request.app.state.store, workspace_id, auth[0]["_id"], body, replace=True)


@router.get("/workspaces/{workspace_id}/members")
def members(workspace_id: str, request: Request, auth=Depends(authenticated)):
    return services.list_members(request.app.state.store.db, workspace_id, auth[0]["_id"])


@router.patch("/workspaces/{workspace_id}/members/{user_id}", status_code=204)
def update_member(workspace_id: str, user_id: str, body: schemas.MemberUpdate, request: Request, auth=Depends(authenticated)):
    services.change_member(request.app.state.store, workspace_id, auth[0]["_id"], user_id, body.role)


@router.delete("/workspaces/{workspace_id}/members/{user_id}", status_code=204)
def remove_member(workspace_id: str, user_id: str, request: Request, auth=Depends(authenticated)):
    services.change_member(request.app.state.store, workspace_id, auth[0]["_id"], user_id)
