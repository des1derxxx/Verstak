from datetime import datetime, timezone
from uuid import uuid4

from pymongo import MongoClient
from pymongo.read_concern import ReadConcern
from pymongo.write_concern import WriteConcern


def now():
    return datetime.now(timezone.utc)


def new_id():
    return str(uuid4())


class MongoStore:
    def __init__(self, uri, database):
        self.client = MongoClient(uri, tz_aware=True, serverSelectionTimeoutMS=5000)
        self.db = self.client[database]

    def initialize(self):
        self.client.admin.command("ping")
        topology = self.client.admin.command("hello")
        if not topology.get("setName") and topology.get("msg") != "isdbgrid":
            raise RuntimeError("Verstak requires a MongoDB replica set or sharded cluster for transactions")
        # Idempotent index migration. Future schema changes get separate scripts.
        self.db.users.create_index("email", unique=True)
        self.db.avatars.create_index("_id")
        self.db.members.create_index([("workspace_id", 1), ("user_id", 1)], unique=True)
        self.db.members.create_index("user_id")
        for collection in ("projects", "tasks", "notes"):
            self.db[collection].create_index([("workspace_id", 1), ("id", 1)], unique=True)
        for collection in ("tasks", "notes"):
            self.db[collection].create_index([("workspace_id", 1), ("projectId", 1)])
        for collection in ("sessions", "invitations", "rate_limits"):
            self.db[collection].create_index("expires_at", expireAfterSeconds=0)
        self.db.invitations.create_index("token_hash", unique=True)
        self.db.invitations.create_index("workspace_id")
        for collection in ("projects", "tasks"):
            self.db[collection].create_index([("workspace_id", 1), ("key", 1)], unique=True,
                partialFilterExpression={"key": {"$type": "string"}})
        for collection in ("comments", "history"):
            self.db[collection].create_index([("workspace_id", 1), ("taskId", 1), ("createdAt", 1)])
        self.db.notifications.create_index([("userId", 1), ("createdAt", -1)])
        for collection in ("api_tokens", "password_resets"):
            self.db[collection].create_index("token_hash", unique=True)
            self.db[collection].create_index("expires_at", expireAfterSeconds=0)
        # Create collections before the first multi-document transaction.
        for collection in ("project_keys", "issue_keys", "comments", "history", "notifications"):
            self.db[collection].create_index("workspace_id")

    def run(self, callback):
        with self.client.start_session() as session:
            return session.with_transaction(
                callback,
                read_concern=ReadConcern("snapshot"),
                write_concern=WriteConcern("majority"),
            )

    def close(self):
        self.client.close()
