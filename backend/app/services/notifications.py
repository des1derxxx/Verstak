from app.database.mongo import now
from .activity import public


def list_notifications(db, user):
    spaces = [m["workspace_id"] for m in db.members.find({"user_id": user["_id"]})]
    return [public(n) for n in list(db.notifications.find({"userId": user["_id"], "workspace_id": {"$in": spaces}}).sort("createdAt", -1))[:100]]


def mark_read(db, user, notification_id):
    db.notifications.update_one({"_id": notification_id, "userId": user["_id"]}, {"$set": {"readAt": now().isoformat()}})
