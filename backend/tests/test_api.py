from datetime import timedelta
from urllib.parse import urlparse, parse_qs

from conftest import login, register
from app.core.security import SESSION_COOKIE, digest
from app.database.mongo import now

PROJECT = {"id": "project-1", "name": "Verstak", "description": "Project", "color": "#bb684a"}
TASK = {"id": "task-1", "projectId": "project-1", "title": "Ship", "description": "", "status": "todo", "priority": "high", "due": "2026-11-01", "labels": ["backend"], "checklist": [], "createdAt": "2026-10-24T00:00:00Z"}


def save(client, space, revision=0, projects=None, tasks=None, notes=None, remove=None):
    return client.patch(f"/api/workspaces/{space['id']}/data", json={"revision": revision, "upsert": {"projects": projects or [], "tasks": tasks or [], "notes": notes or []}, "remove": remove or {}})


def invite(client, space, email, role="editor"):
    response = client.post(f"/api/workspaces/{space['id']}/invitations", json={"email": email, "role": role})
    assert response.status_code == 201, response.text
    return response.json(), parse_qs(urlparse(response.json()["url"]).fragment)["invite"][0]


def test_api_documentation_uses_paths_forwarded_by_the_gateway(client):
    schema = client.get("/api/openapi.json")
    assert schema.status_code == 200
    assert "/api/tasks" in schema.json()["paths"]
    for path in ("/api/docs", "/api/redoc"):
        response = client.get(path)
        assert response.status_code == 200
        assert "/api/openapi.json" in response.text


def test_registration_hashes_password_and_uses_private_cookie(client, store):
    user, space = register(client)
    saved = store.db.users.find_one({"_id": user["id"]})
    assert saved["password_hash"].startswith("$argon2id$")
    assert "password_hash" not in client.get("/api/auth/me").json()["user"]
    assert space["role"] == "owner"
    session = client.cookies[SESSION_COOKIE]
    assert store.db.sessions.find_one({"_id": digest(session)})
    assert not store.db.sessions.find_one({"_id": session})


def test_session_cookie_is_httponly(client):
    response = client.post("/api/auth/register", json={"name": "Owner", "email": "owner@example.com", "password": "correct-horse-battery"})
    cookie = response.headers["set-cookie"].lower()
    assert "httponly" in cookie and "samesite=lax" in cookie
    active = [item for item in client.cookies.jar if item.name == SESSION_COOKIE]
    assert len(active) == 1 and active[0].path == "/"
    assert any("Path=/api" in value and "Max-Age=0" in value for value in response.headers.get_list("set-cookie"))


def test_duplicate_email_is_case_insensitive(client):
    register(client)
    response = client.post("/api/auth/register", json={"name": "Other", "email": "OWNER@example.com", "password": "correct-horse-battery"})
    assert response.status_code == 409


def test_login_logout_and_expired_session(client, store):
    register(client)
    assert client.post("/api/auth/logout", json={}).status_code == 204
    assert client.get("/api/auth/me").status_code == 401
    assert client.post("/api/auth/login", json={"email": "owner@example.com", "password": "wrong"}).status_code == 401
    login(client)
    store.db.sessions.update_one({"_id": digest(client.cookies[SESSION_COOKIE])}, {"$set": {"expires_at": now() - timedelta(seconds=1)}})
    assert client.get("/api/auth/me").status_code == 401


def test_unauthenticated_cannot_read_spaces(client):
    assert client.get("/api/workspaces").status_code == 401


def test_csrf_and_foreign_origin_rejected(client):
    _, space = register(client)
    del client.headers["X-CSRF-Token"]
    assert save(client, space).status_code == 403
    login(client)
    assert client.post("/api/workspaces", headers={"Origin": "https://evil.example"}, json={"name": "bad"}).status_code == 403
    assert client.post("/api/workspaces", headers={"X-Verstak-Client": ""}, json={"name": "bad"}).status_code == 403


def test_projects_tasks_and_notes_persist_and_cascade(client):
    _, space = register(client)
    note = {"id": "note-1", "projectId": PROJECT["id"], "title": "Plan", "body": "# Hello", "updatedAt": TASK["createdAt"]}
    result = save(client, space, projects=[PROJECT], tasks=[TASK], notes=[note])
    assert result.status_code == 200, result.text
    assert result.json()["revision"] == 1
    result = client.get(f"/api/workspaces/{space['id']}/data").json()
    assert result["data"]["tasks"][0]["title"] == "Ship"
    assert save(client, space, revision=1, remove={"projects": [PROJECT["id"]]}).status_code == 200
    result = client.get(f"/api/workspaces/{space['id']}/data").json()
    assert result["data"] == {"version": 1, "projects": [], "tasks": [], "notes": []}


def test_stale_update_cannot_overwrite_other_changes(client):
    _, space = register(client)
    assert save(client, space, projects=[PROJECT]).status_code == 200
    assert save(client, space, projects=[{**PROJECT, "name": "Lost update"}]).status_code == 409
    assert client.get(f"/api/workspaces/{space['id']}/data").json()["data"]["projects"][0]["name"] == "Verstak"


def test_invalid_relationship_rolls_back_revision(client):
    _, space = register(client)
    assert save(client, space, tasks=[TASK]).status_code == 422
    result = client.get(f"/api/workspaces/{space['id']}/data").json()
    assert result["revision"] == 0 and result["data"]["tasks"] == []


def test_cross_workspace_isolation(client):
    _, first = register(client)
    save(client, first, projects=[PROJECT])
    _, second = register(client, "outsider@example.com", "Other")
    assert client.get(f"/api/workspaces/{first['id']}/data").status_code == 404
    assert save(client, first, revision=1, projects=[{**PROJECT, "name": "Hacked"}]).status_code == 404
    assert save(client, second, projects=[PROJECT]).status_code == 200
    login(client)
    assert client.get(f"/api/workspaces/{first['id']}/data").json()["data"]["projects"][0]["name"] == "Verstak"


def test_invitation_email_binding_single_use_and_viewer_permissions(client):
    _, space = register(client)
    result, token = invite(client, space, "viewer@example.com", "viewer")
    assert token not in str(client.get(f"/api/workspaces/{space['id']}/invitations").json())
    register(client, "wrong@example.com", "Wrong")
    assert client.post("/api/invitations/accept", json={"token": token}).status_code == 403
    register(client, "viewer@example.com", "Viewer")
    assert client.post("/api/invitations/accept", json={"token": token}).status_code == 200
    assert client.post("/api/invitations/accept", json={"token": token}).status_code == 404
    assert client.get(f"/api/workspaces/{space['id']}/data").status_code == 200
    assert save(client, space, projects=[PROJECT]).status_code == 403
    assert client.post(f"/api/workspaces/{space['id']}/invitations", json={"email": "another@example.com", "role": "editor"}).status_code == 403


def test_editor_can_write_but_cannot_import_or_manage_members(client):
    owner, space = register(client)
    _, token = invite(client, space, "editor@example.com")
    register(client, "editor@example.com", "Editor")
    assert client.post("/api/invitations/accept", json={"token": token}).status_code == 200
    assert save(client, space, projects=[PROJECT]).status_code == 200
    assert client.put(f"/api/workspaces/{space['id']}/data", json={"revision": 1, "data": {"version": 1, "projects": [], "tasks": [], "notes": []}}).status_code == 403
    assert client.request("DELETE", f"/api/workspaces/{space['id']}/members/{owner['id']}", json={}).status_code == 403


def test_owner_can_revoke_membership_without_removing_own_access(client):
    owner, space = register(client)
    _, token = invite(client, space, "editor@example.com")
    editor, _ = register(client, "editor@example.com", "Editor")
    client.post("/api/invitations/accept", json={"token": token})
    login(client)
    assert client.request("DELETE", f"/api/workspaces/{space['id']}/members/{owner['id']}", json={}).status_code == 403
    assert client.request("DELETE", f"/api/workspaces/{space['id']}/members/{editor['id']}", json={}).status_code == 204
    login(client, "editor@example.com")
    assert client.get(f"/api/workspaces/{space['id']}/data").status_code == 404


def test_invitation_revocation_and_expiration(client, store):
    _, space = register(client)
    invitation, token = invite(client, space, "editor@example.com")
    assert client.request("DELETE", f"/api/workspaces/{space['id']}/invitations/{invitation['id']}", json={}).status_code == 204
    register(client, "editor@example.com", "Editor")
    assert client.post("/api/invitations/accept", json={"token": token}).status_code == 404
    login(client)
    _, token = invite(client, space, "editor@example.com")
    store.db.invitations.update_one({"token_hash": digest(token)}, {"$set": {"expires_at": now() - timedelta(seconds=1)}})
    login(client, "editor@example.com")
    assert client.post("/api/invitations/accept", json={"token": token}).status_code == 404


def test_unknown_fields_and_nosql_operators_are_rejected(client):
    _, space = register(client)
    assert save(client, space, projects=[{**PROJECT, "workspace_id": "other"}]).status_code == 422
    response = client.post("/api/auth/login", json={"email": {"$ne": None}, "password": "irrelevant"})
    assert response.status_code == 422


def test_owner_import_is_validated_and_atomic(client):
    _, space = register(client)
    assert save(client, space, projects=[PROJECT]).status_code == 200
    path = f"/api/workspaces/{space['id']}/data"
    invalid = {"version": 1, "projects": [], "tasks": [TASK], "notes": []}
    assert client.put(path, json={"revision": 1, "data": invalid}).status_code == 422
    assert client.get(path).json()["revision"] == 1
    assert client.put(path, json={"revision": 1, "data": {"version": 1, "projects": [], "tasks": [], "notes": []}}).status_code == 200


def test_login_and_logout_remove_legacy_api_cookie(client):
    register(client)
    client.cookies.set(SESSION_COOKIE, "legacy-session", domain="testserver.local", path="/api")
    login(client)
    active = [item for item in client.cookies.jar if item.name == SESSION_COOKIE]
    assert len(active) == 1 and active[0].path == "/"
    assert client.get("/api/auth/me").status_code == 200
    assert client.post("/api/auth/logout", json={}).status_code == 204
    assert not [item for item in client.cookies.jar if item.name == SESSION_COOKIE]
