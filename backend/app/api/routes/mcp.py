"""MCP over Streamable HTTP: stateless, plain JSON responses, no server-initiated stream."""
from fastapi import APIRouter, Body, HTTPException, Request, Response
from app.api.dependencies import authenticate
from app.services import mcp as service

router = APIRouter()
VERSIONS = ("2025-11-25", "2025-06-18", "2025-03-26")


def reply(message, result=None, error=None):
    return {"jsonrpc": "2.0", "id": message.get("id"), **({"error": error} if error else {"result": result})}


@router.post("/mcp")
def mcp(request: Request, message: dict = Body(...)):
    if not request.headers.get("authorization"):
        raise HTTPException(401, "Нужен API-токен: Authorization: Bearer vsk_…")
    auth = authenticate(request)
    # Notifications and responses expect no reply.
    if "id" not in message or "method" not in message:
        return Response(status_code=202)
    params = message.get("params") or {}
    match message["method"]:
        case "initialize":
            version = params.get("protocolVersion")
            return reply(message, {"protocolVersion": version if version in VERSIONS else VERSIONS[0],
                "capabilities": {"tools": {}}, "serverInfo": {"name": "verstak", "version": request.app.version},
                "instructions": service.INSTRUCTIONS})
        case "ping":
            return reply(message, {})
        case "tools/list":
            return reply(message, {"tools": service.definitions()})
        case "tools/call":
            try:
                return reply(message, service.call(request.app.state.store, auth, params.get("name"), params.get("arguments")))
            except LookupError:
                return reply(message, error={"code": -32602, "message": f"Неизвестный инструмент: {params.get('name')}"})
    return reply(message, error={"code": -32601, "message": "Метод не поддерживается"})
