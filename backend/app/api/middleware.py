from fastapi.responses import JSONResponse


async def request_policy(request, call_next):
    settings = request.app.state.settings
    if request.method not in {"GET", "HEAD", "OPTIONS"}:
        origin = request.headers.get("origin")
        if origin and origin.rstrip("/") != settings.public_origin:
            return JSONResponse({"detail": "Недопустимый источник запроса"}, 403)
        # /api/mcp accepts only bearer tokens, so it never needs the browser header.
        integration = request.url.path == "/api/mcp" or request.headers.get("authorization", "").startswith("Bearer ") and (request.url.path == "/api/tasks" or request.url.path.startswith("/api/tasks/") or request.url.path == "/api/projects")
        if not integration and request.headers.get("x-verstak-client") != "web":
            return JSONResponse({"detail": "Отсутствует заголовок клиента"}, 403)
        if "application/json" not in request.headers.get("content-type", ""):
            return JSONResponse({"detail": "Ожидается application/json"}, 415)
        try:
            length = int(request.headers.get("content-length", "0"))
        except ValueError:
            return JSONResponse({"detail": "Некорректная длина запроса"}, 400)
        if length > 10 * 1024 * 1024:
            return JSONResponse({"detail": "Запрос слишком большой"}, 413)
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Cache-Control"] = "no-store"
    return response


async def database_error(_request, _error):
    return JSONResponse({"detail": "База данных временно недоступна. Изменения не подтверждены."}, 503)
