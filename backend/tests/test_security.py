from fastapi.testclient import TestClient
import pytest

from app.core.config import Settings
from app.main import create_app
from app.core.security import PASSWORDS
from conftest import register


def test_password_hash_uses_individual_salt_and_verifies():
    first = PASSWORDS.hash("correct-horse-battery")
    second = PASSWORDS.hash("correct-horse-battery")
    assert first != second
    assert PASSWORDS.verify("correct-horse-battery", first)
    assert not PASSWORDS.verify("wrong", first)
    assert not PASSWORDS.verify("correct-horse-battery", "not-a-valid-hash")


def test_production_rejects_insecure_cookie_configuration(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("PUBLIC_ORIGIN", "https://verstak.example.com")
    monkeypatch.setenv("COOKIE_SECURE", "false")
    with pytest.raises(ValueError):
        Settings.from_env()


def test_secure_cookie_when_configured(store):
    app = create_app(Settings(public_origin="https://testserver", secure_cookies=True), store)
    with TestClient(app, base_url="https://testserver", headers={"X-Verstak-Client": "web", "Origin": "https://testserver"}) as client:
        result = client.post("/api/auth/register", json={"name": "Owner", "email": "secure@example.com", "password": "correct-horse-battery"})
        assert result.status_code == 201
        assert "secure" in result.headers["set-cookie"].lower()
        assert client.get("/api/auth/me").status_code == 200


def test_closed_registration_allows_only_valid_invitation_for_same_email(client, store):
    _, space = register(client)
    result = client.post(f"/api/workspaces/{space['id']}/invitations", json={"email": "invited@example.com", "role": "editor"})
    token = result.json()["url"].split("#invite=", 1)[1]
    app = create_app(Settings(public_origin="http://testserver", registration_enabled=False), store)
    with TestClient(app, headers={"X-Verstak-Client": "web"}) as closed:
        body = {"name": "Guest", "email": "invited@example.com", "password": "correct-horse-battery"}
        assert closed.post("/api/auth/register", json=body).status_code == 403
        assert closed.post("/api/auth/register", json={**body, "email": "wrong@example.com", "invitationToken": token}).status_code == 403
        response = closed.post("/api/auth/register", json={**body, "invitationToken": token})
        assert response.status_code == 201
        closed.headers["X-CSRF-Token"] = response.json()["csrf"]
        assert closed.post("/api/invitations/accept", json={"token": token}).status_code == 200


def test_login_attempt_limit(client):
    for _ in range(20):
        assert client.post("/api/auth/login", json={"email": "missing@example.com", "password": "wrong"}).status_code == 401
    response = client.post("/api/auth/login", json={"email": "missing@example.com", "password": "wrong"})
    assert response.status_code == 429
    assert "retry-after" in response.headers
