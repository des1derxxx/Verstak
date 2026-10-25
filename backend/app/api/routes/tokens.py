from fastapi import APIRouter, Depends, Request
from app.api.dependencies import authenticated
from app.schemas.tokens import ApiTokenCreate
from app.services import api_tokens as service

router = APIRouter()


@router.get("/api-tokens")
def tokens(request: Request, auth=Depends(authenticated)):
    return service.list_tokens(request.app.state.store.db, auth[0])


@router.post("/api-tokens", status_code=201)
def create_token(body: ApiTokenCreate, request: Request, auth=Depends(authenticated)):
    return service.create_token(request.app.state.store, auth[0], body)


@router.delete("/api-tokens/{token_id}", status_code=204)
def revoke_token(token_id: str, request: Request, auth=Depends(authenticated)):
    service.revoke_token(request.app.state.store, auth[0], token_id)
