"""Account profile and private, normalized avatar images."""
import base64
import binascii
from io import BytesIO
import warnings

from fastapi import HTTPException
from PIL import Image, ImageOps, UnidentifiedImageError
from pymongo.errors import DuplicateKeyError

from app.core.security import PASSWORDS, rate_limit
from .users import public_user
from app.database.mongo import new_id

MAX_AVATAR_BYTES = 2 * 1024 * 1024
MAX_PIXELS = 16_000_000


def normalize_avatar(value):
    try:
        header, encoded = value.split(",", 1)
        if header not in {"data:image/png;base64", "data:image/jpeg;base64", "data:image/webp;base64"}:
            raise ValueError()
        raw = base64.b64decode(encoded, validate=True)
        if len(raw) > MAX_AVATAR_BYTES:
            raise ValueError()
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(BytesIO(raw)) as image:
                if image.format not in {"PNG", "JPEG", "WEBP"} or image.width * image.height > MAX_PIXELS or getattr(image, "is_animated", False):
                    raise ValueError()
                image.load()
                resized = ImageOps.fit(ImageOps.exif_transpose(image).convert("RGBA"), (256, 256), method=Image.Resampling.LANCZOS)
                output = BytesIO()
                resized.save(output, format="WEBP", quality=85)
                return output.getvalue()
    except (ValueError, binascii.Error, UnidentifiedImageError, OSError, Image.DecompressionBombError, Image.DecompressionBombWarning):
        raise HTTPException(422, "Выбери статичное изображение PNG, JPEG или WebP до 2 МБ и 16 мегапикселей")


def update_profile(store, user, session_info, body):
    rate_limit(store.db, f"profile:{user['_id']}", limit=30, seconds=600)
    email = str(body.email).lower()
    changing_email = email != user["email"]
    if changing_email and not PASSWORDS.verify(body.currentPassword, user["password_hash"]):
        raise HTTPException(403, "Для смены email введи текущий пароль")
    image = normalize_avatar(body.avatarData) if body.avatarData is not None else None
    avatar_changed = "avatarData" in body.model_fields_set

    def operation(session):
        current = store.db.users.find_one({"_id": user["_id"]}, session=session)
        if not current or current.get("profile_revision", 0) != body.revision:
            raise HTTPException(409, "Профиль уже изменён. Загрузи актуальные данные перед сохранением.")
        if current["email"] != user["email"] or current["password_hash"] != user["password_hash"]:
            raise HTTPException(409, "Данные входа изменились. Открой профиль заново.")
        updates = {"name": body.name, "email": email, "bio": body.bio.strip(), "profile_revision": body.revision + 1}
        if avatar_changed:
            if image:
                avatar_version = new_id()
                store.db.avatars.replace_one({"_id": user["_id"]}, {"_id": user["_id"], "data": image}, upsert=True, session=session)
                updates["avatar_version"] = avatar_version
            else:
                store.db.avatars.delete_one({"_id": user["_id"]}, session=session)
                updates["avatar_version"] = None
        store.db.users.update_one({"_id": user["_id"]}, {"$set": updates}, session=session)
        if changing_email:
            # Keep the current browser session, revoke other sessions and old recovery links.
            for item in store.db.sessions.find({"user_id": user["_id"]}, session=session):
                if item["_id"] != session_info["_id"]: store.db.sessions.delete_one({"_id": item["_id"]}, session=session)
            store.db.password_resets.delete_many({"user_id": user["_id"]}, session=session)
        return public_user({**current, **updates})
    try:
        return store.run(operation)
    except DuplicateKeyError:
        raise HTTPException(409, "Этот email уже занят")


def get_avatar(db, user, user_id):
    if user_id != user["_id"]:
        spaces = [m["workspace_id"] for m in db.members.find({"user_id": user["_id"]})]
        if not db.members.find_one({"user_id": user_id, "workspace_id": {"$in": spaces}}):
            raise HTTPException(404, "Изображение не найдено")
    image = db.avatars.find_one({"_id": user_id})
    if not image:
        raise HTTPException(404, "Изображение не найдено")
    return image["data"]
