from fastapi import APIRouter
from .routes import auth, health, invitations, mcp, notifications, passwords, profile, tasks, tokens, workspaces

router = APIRouter(prefix="/api")
for module in (health, auth, workspaces, invitations, profile, tasks, tokens, notifications, passwords, mcp):
    router.include_router(module.router)
