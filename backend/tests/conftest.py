import os
from uuid import uuid4

from fastapi.testclient import TestClient
import pytest

from app.core.config import Settings
from app.main import create_app
from app.database.mongo import MongoStore
from fake_store import FakeStore


@pytest.fixture
def store():
    uri = os.getenv("VERSTAK_TEST_MONGODB_URI")
    value = MongoStore(uri, f"verstak_test_{uuid4().hex}") if uri else FakeStore()
    yield value
    if uri:
        value.client.drop_database(value.db.name)
    value.close()


@pytest.fixture
def app(store):
    return create_app(Settings(public_origin="http://testserver"), store)


@pytest.fixture
def client(app):
    with TestClient(app, headers={"X-Verstak-Client": "web", "Origin": "http://testserver"}) as client:
        yield client


def register(client, email="owner@example.com", name="Owner"):
    response = client.post("/api/auth/register", json={"name": name, "email": email, "password": "correct-horse-battery"})
    assert response.status_code == 201, response.text
    client.headers["X-CSRF-Token"] = response.json()["csrf"]
    space = client.get("/api/workspaces").json()[0]
    return response.json()["user"], space


def login(client, email="owner@example.com"):
    response = client.post("/api/auth/login", json={"email": email, "password": "correct-horse-battery"})
    assert response.status_code == 200, response.text
    client.headers["X-CSRF-Token"] = response.json()["csrf"]
    return response
