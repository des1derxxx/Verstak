"""Small transactional test double; real MongoDB tests use VERSTAK_TEST_MONGODB_URI.

This verifies API policy and business behavior, not MongoDB query/transaction semantics.
"""
from copy import deepcopy
from threading import RLock
from types import SimpleNamespace

from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError


def matches(document, query):
    for key, expected in query.items():
        actual = document.get(key)
        if isinstance(expected, dict):
            for operator, operand in expected.items():
                if operator == "$gt" and not (actual is not None and actual > operand):
                    return False
                if operator == "$in" and actual not in operand:
                    return False
                if operator not in {"$gt", "$in"}:
                    raise NotImplementedError(operator)
        elif actual != expected:
            return False
    return True


class Cursor(list):
    def sort(self, field, direction):
        return Cursor(sorted(self, key=lambda item: item[field], reverse=direction < 0))


class Collection:
    def __init__(self):
        self.documents = {}
        self.unique = [["_id"]]

    def create_index(self, keys, unique=False, **_kwargs):
        if unique:
            self.unique.append([keys] if isinstance(keys, str) else [key for key, _ in keys])

    def find(self, query=None, **_kwargs):
        return Cursor(deepcopy(item) for item in self.documents.values() if matches(item, query or {}))

    def find_one(self, query, **_kwargs):
        return next(iter(self.find(query)), None)

    def check_unique(self, document, ignore=None):
        for keys in self.unique:
            if any(all(item.get(key) == document.get(key) for key in keys) for item in self.documents.values() if item["_id"] != ignore):
                raise DuplicateKeyError("duplicate test key")

    def insert_one(self, document, **_kwargs):
        self.check_unique(document)
        self.documents[document["_id"]] = deepcopy(document)
        return SimpleNamespace(inserted_id=document["_id"])

    def delete_one(self, query, **_kwargs):
        items = self.find(query)
        if items:
            del self.documents[items[0]["_id"]]
        return SimpleNamespace(deleted_count=int(bool(items)))

    def delete_many(self, query, **_kwargs):
        items = self.find(query)
        for item in items:
            del self.documents[item["_id"]]
        return SimpleNamespace(deleted_count=len(items))

    def replace_one(self, query, replacement, upsert=False, **_kwargs):
        item = self.find_one(query)
        if item:
            self.check_unique(replacement, item["_id"])
            self.documents[item["_id"]] = deepcopy(replacement)
        elif upsert:
            self.insert_one(replacement)
        return SimpleNamespace(matched_count=int(item is not None))

    def find_one_and_update(self, query, update, upsert=False, return_document=None, **_kwargs):
        item = self.find_one(query)
        previous = deepcopy(item)
        created = item is None
        if created:
            if not upsert:
                return None
            item = deepcopy(query)
            item.update(update.get("$setOnInsert", {}))
        item.update(update.get("$set", {}))
        for key, value in update.get("$inc", {}).items():
            item[key] = item.get(key, 0) + value
        if created:
            self.insert_one(item)
        else:
            self.check_unique(item, item["_id"])
            self.documents[item["_id"]] = item
        return deepcopy(item if return_document == ReturnDocument.AFTER else previous)

    def update_one(self, query, update, **kwargs):
        found = self.find_one(query) is not None
        self.find_one_and_update(query, update, **kwargs)
        return SimpleNamespace(matched_count=int(found))


class Database:
    def __init__(self):
        self.collections = {}

    def __getitem__(self, key):
        return self.collections.setdefault(key, Collection())

    def __getattr__(self, key):
        return self[key]


class FakeStore:
    def __init__(self):
        self.db = Database()
        self.client = SimpleNamespace(admin=SimpleNamespace(command=lambda _: {"ok": 1}))
        self.lock = RLock()

    def initialize(self):
        self.db.users.create_index("email", unique=True)
        self.db.members.create_index([("workspace_id", 1), ("user_id", 1)], unique=True)
        self.db.invitations.create_index("token_hash", unique=True)

    def run(self, callback):
        with self.lock:
            previous = deepcopy(self.db.collections)
            try:
                return callback(None)
            except Exception:
                self.db.collections = previous
                raise

    def close(self):
        pass
