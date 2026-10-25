from fastapi import APIRouter, Request

router = APIRouter()


@router.get("/health")
def health(request: Request):
    request.app.state.store.client.admin.command("ping")
    return {"status": "ok"}
