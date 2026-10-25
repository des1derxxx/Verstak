from fastapi import APIRouter, Depends, Query, Request
from app.api.dependencies import authenticate
from app.schemas import tasks as schemas
from app.services.tasks import operations as service

router = APIRouter()


@router.get("/projects")
def projects(request: Request, workspaceId: str | None = None, auth=Depends(authenticate)):
    return service.list_projects(request.app.state.store, auth, workspaceId)


@router.get("/tasks")
def tasks(request: Request, workspaceId: str | None = None, projectId: str | None = None,
          status: str | None = None, parentId: str | None = None,
          limit: int = Query(100, ge=1, le=200), offset: int = Query(0, ge=0), auth=Depends(authenticate)):
    return service.list_tasks(request.app.state.store, auth, workspaceId, projectId, status, parentId, limit, offset)


@router.post("/tasks", status_code=201)
def create_task(body: schemas.TaskCreate, request: Request, auth=Depends(authenticate)):
    return service.create_task(request.app.state.store, auth, body)


@router.get("/tasks/{ref}")
def get_task(ref: str, request: Request, workspaceId: str | None = None, auth=Depends(authenticate)):
    return service.get_task(request.app.state.store, auth, ref, workspaceId)


@router.patch("/tasks/{ref}")
def update_task(ref: str, body: schemas.TaskPatch, request: Request, workspaceId: str | None = None, auth=Depends(authenticate)):
    return service.update_task(request.app.state.store, auth, ref, body, workspaceId)


@router.delete("/tasks/{ref}", status_code=204)
def delete_task(ref: str, request: Request, revision: int = Query(ge=1), workspaceId: str | None = None, auth=Depends(authenticate)):
    return service.delete_task(request.app.state.store, auth, ref, revision, workspaceId)


@router.get("/tasks/{ref}/comments")
def comments(ref: str, request: Request, workspaceId: str | None = None, auth=Depends(authenticate)):
    return service.list_comments(request.app.state.store, auth, ref, workspaceId)


@router.post("/tasks/{ref}/comments", status_code=201)
def comment(ref: str, body: schemas.CommentCreate, request: Request, workspaceId: str | None = None, auth=Depends(authenticate)):
    return service.add_task_comment(request.app.state.store, auth, ref, body, workspaceId)


@router.get("/tasks/{ref}/history")
def history(ref: str, request: Request, workspaceId: str | None = None, auth=Depends(authenticate)):
    return service.list_history(request.app.state.store, auth, ref, workspaceId)
