"""Verify the public gateway serves FastAPI, Next.js HTML and compiled assets."""
import json
import re
import argparse
import secrets
from http.cookiejar import CookieJar
from urllib.parse import urljoin, urlparse
from urllib.request import urlopen, Request, build_opener, HTTPCookieProcessor


def check_stack(origin):
    with urlopen(f"{origin}/api/health", timeout=10) as response:
        if json.load(response).get("status") != "ok":
            raise RuntimeError("FastAPI health check failed")
    with urlopen(f"{origin}/api/openapi.json", timeout=10) as response:
        if "/api/tasks" not in json.load(response).get("paths", {}):
            raise RuntimeError("The gateway did not serve the API schema")
    with urlopen(f"{origin}/api/docs", timeout=10) as response:
        if "/api/openapi.json" not in response.read().decode():
            raise RuntimeError("The API documentation points to an unavailable schema")

    with urlopen(f"{origin}/", timeout=15) as response:
        html = response.read().decode()
        policy = response.headers.get("Content-Security-Policy", "")
    nonce = re.search(r"'nonce-([^']+)'", policy)
    if not nonce or not re.search(r'<script\b[^>]*nonce="' + re.escape(nonce[1]) + '"', html):
        raise RuntimeError("The Next.js page is missing scripts with the current CSP nonce")
    stylesheet = re.search(r'href="([^" ]*/_next/static/[^" ]+\.css[^" ]*)"', html)
    if not stylesheet:
        raise RuntimeError("The Next.js stylesheet was not found")
    url = urljoin(f"{origin}/", stylesheet[1])
    if urlparse(url).netloc != urlparse(origin).netloc:
        raise RuntimeError("The stylesheet must be served from the application origin")
    with urlopen(url, timeout=10) as response:
        css = response.read().decode()
    if "--color-brand" not in css or "@layer" not in css:
        raise RuntimeError("The compiled Tailwind stylesheet is missing")
    print("Stack smoke check passed: FastAPI, Next.js, CSP and Tailwind assets")


def exercise_routes(origin):
    """Creates disposable test data. Use only with an isolated Compose test stack."""
    jar = CookieJar()
    browser = build_opener(HTTPCookieProcessor(jar))
    csrf = ""

    def request(path, body=None, method="GET"):
        headers = {"X-Verstak-Client": "web", "Origin": origin, "X-CSRF-Token": csrf}
        data = None
        if body is not None:
            data = json.dumps(body).encode()
            headers["Content-Type"] = "application/json"
        with browser.open(Request(f"{origin}{path}", data=data, headers=headers, method=method), timeout=20) as response:
            content = response.read()
            return json.loads(content) if content else None

    suffix = secrets.token_hex(6)
    session = request("/api/auth/register", {"name": f"Smoke {suffix}", "email": f"smoke-{suffix}@example.com", "password": secrets.token_urlsafe(24)}, "POST")
    csrf = session["csrf"]
    cookies = [cookie for cookie in jar if cookie.name == "verstak_session"]
    if len(cookies) != 1 or cookies[0].path != "/":
        raise RuntimeError("The session cookie is not available to Next.js server pages")
    workspace = request("/api/workspaces")[0]
    base = f"/workspaces/{workspace['id']}"
    snapshot = request(f"/api/workspaces/{workspace['id']}/data")
    project_id = f"project-{suffix}"
    project = {"id": project_id, "name": f"Project {suffix}", "description": "", "color": "#0c66e4", "key": "SMK"}
    request(f"/api/workspaces/{workspace['id']}/data", {"revision": snapshot["revision"], "upsert": {"projects": [project]}}, "PATCH")
    title = f"SSR route smoke {suffix}"
    task = request("/api/tasks", {"workspaceId": workspace["id"], "projectId": project_id, "title": title}, "POST")
    paths = [f"{base}/board", f"{base}/backlog", f"{base}/list", f"{base}/today", f"{base}/pages", f"{base}/projects/{project_id}/board", f"{base}/tasks/{task['key']}", f"{base}/settings/profile", f"{base}/settings/members", f"{base}/settings/tokens", f"{base}/settings/data", f"{base}/notifications"]
    for path in paths:
        with browser.open(f"{origin}{path}", timeout=20) as response:
            html = response.read().decode()
            if urlparse(response.url).path != path or "<!DOCTYPE html>" not in html:
                raise RuntimeError(f"A direct route failed: {path}")
            if "no-store" not in response.headers.get("Cache-Control", ""):
                raise RuntimeError("Private server pages must not enter a shared cache")
            if path.endswith("/board") and not re.search(r">" + re.escape(title) + r"<", html):
                raise RuntimeError("The board did not server-render its initial task data")
            if path.endswith(f"/tasks/{task['key']}") and not re.search(r">" + re.escape(title) + r"<", html):
                raise RuntimeError("The direct task URL did not render task details")
    request("/api/auth/logout", {}, "POST")
    with browser.open(f"{origin}{base}/board", timeout=20) as response:
        if urlparse(response.url).path != "/login":
            raise RuntimeError("An unauthenticated private route did not redirect to login")
        if title in response.read().decode():
            raise RuntimeError("A private task leaked into the login response")
    print("Route smoke check passed: root cookie, authenticated SSR, direct pages and logout")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("origin", nargs="?", default="http://localhost:8080")
    parser.add_argument("--exercise", action="store_true", help="Create test data to verify private routes; isolated test stacks only")
    arguments = parser.parse_args()
    origin = arguments.origin.rstrip("/")
    check_stack(origin)
    if arguments.exercise:
        exercise_routes(origin)
