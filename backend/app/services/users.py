def public_user(user):
    return {"id": user["_id"], "name": user["name"], "email": user["email"],
        "bio": user.get("bio", ""), "profileRevision": user.get("profile_revision", 0),
        "avatarUrl": f"/api/users/{user['_id']}/avatar?v={user['avatar_version']}" if user.get("avatar_version") else None}
