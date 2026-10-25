"""Application composition. HTTP handlers and business rules live in their packages."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from pymongo.errors import PyMongoError

from app.api.middleware import database_error, request_policy
from app.api.router import router
from app.core.config import Settings
from app.core.security import PASSWORDS
from app.database.migrations import migrate
from app.database.mongo import MongoStore
from app.infrastructure.email import SmtpMailer


def create_app(settings=None, store=None, mailer=None):
    settings = settings or Settings.from_env()

    @asynccontextmanager
    async def lifespan(app):
        active_store = store or MongoStore(settings.mongo_uri, settings.mongo_database)
        active_store.initialize()
        migrate(active_store)
        app.state.store = active_store
        app.state.dummy_password = PASSWORDS.hash("not-a-real-user-password")
        yield
        if store is None:
            active_store.close()

    app = FastAPI(
        title="Verstak API", version="0.1.0", lifespan=lifespan,
        docs_url="/api/docs", redoc_url="/api/redoc", openapi_url="/api/openapi.json",
    )
    app.state.settings = settings
    app.state.mailer = mailer or SmtpMailer(settings)
    app.middleware("http")(request_policy)
    app.add_exception_handler(PyMongoError, database_error)
    app.include_router(router)
    return app


app = create_app()
