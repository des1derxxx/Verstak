from app.database.mongo import new_id, now


def public(document):
    return {key: value for key, value in document.items() if key not in {"_id", "workspace_id"}}


def notify(db, workspace_id, task, actor, event, session, commenters=False):
    recipients = {task.get("assigneeId"), task.get("createdById")}
    if commenters:
        recipients.update(item["authorId"] for item in db.comments.find({"workspace_id": workspace_id, "taskId": task["id"]}, session=session))
    allowed = {item["user_id"] for item in db.members.find({"workspace_id": workspace_id}, session=session)}
    for user_id in (recipients & allowed) - {actor["_id"], None}:
        identifier = new_id()
        db.notifications.insert_one({"_id": identifier, "id": identifier, "workspace_id": workspace_id,
            "workspaceId": workspace_id, "userId": user_id, "taskId": task["id"], "taskKey": task["key"], "taskTitle": task["title"],
            "event": event, "actorName": actor["name"], "createdAt": now().isoformat(), "readAt": None}, session=session)


def audit(db, workspace_id, task, actor, event, changes, session):
    if actor is None:
        return  # Migration does not invent authors or historical actions.
    identifier = new_id()
    db.history.insert_one({"_id": identifier, "id": identifier, "workspace_id": workspace_id,
        "taskId": task["id"], "taskKey": task["key"], "actorId": actor["_id"], "actorName": actor["name"],
        "event": event, "changes": changes, "createdAt": now().isoformat()}, session=session)
    notify(db, workspace_id, task, actor, event, session, commenters=True)


def add_comment(db, workspace_id, task, actor, body, kind, session):
    identifier = new_id()
    document = {"_id": identifier, "id": identifier, "workspace_id": workspace_id, "taskId": task["id"],
        "authorId": actor["_id"], "authorName": actor["name"], "body": body.strip(), "kind": kind,
        "createdAt": now().isoformat()}
    db.comments.insert_one(document, session=session)
    history_id = new_id()
    db.history.insert_one({"_id": history_id, "id": history_id, "workspace_id": workspace_id,
        "taskId": task["id"], "taskKey": task["key"], "actorId": actor["_id"], "actorName": actor["name"],
        "event": "resolution" if kind == "resolution" else "commented", "changes": {},
        "createdAt": document["createdAt"]}, session=session)
    notify(db, workspace_id, task, actor, "resolution" if kind == "resolution" else "commented", session, commenters=True)
    return public(document)
