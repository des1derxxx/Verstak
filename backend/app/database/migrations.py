from copy import deepcopy
from app.services.tasks.mutations import persist


def migrate(store):
    """Idempotent online migration of v1 data; IDs, links and allocated keys survive."""
    from app.services.workspaces import read_data
    for workspace in store.db.workspaces.find({}):
        def operation(session):
            current = store.db.workspaces.find_one({"_id": workspace["_id"]}, session=session)
            if current.get("schema_version", 1) >= 2:
                return
            store.db.workspaces.update_one({"_id": current["_id"]}, {"$inc": {"revision": 1}, "$set": {"schema_version": 2}}, session=session)
            previous = read_data(store.db, current["_id"], session)
            # Deterministic allocation for legacy tasks.
            proposed = deepcopy(previous)
            proposed["tasks"].sort(key=lambda task: (task["createdAt"], task["id"]))
            persist(store.db, current["_id"], previous, proposed, None, session, restore=True)
        store.run(operation)
