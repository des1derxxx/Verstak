"""Create local credentials without printing them or replacing an existing .env."""
from pathlib import Path
import os
import secrets

root = Path(__file__).resolve().parents[1]
target = root / ".env"
if target.exists():
    print(".env already exists; kept unchanged.")
else:
    content = (root / ".env.example").read_text()
    content = content.replace("MONGO_ROOT_PASSWORD=\n", f"MONGO_ROOT_PASSWORD={secrets.token_urlsafe(32)}\n")
    content = content.replace("MONGO_APP_PASSWORD=\n", f"MONGO_APP_PASSWORD={secrets.token_urlsafe(32)}\n")
    descriptor = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, "w") as file:
        file.write(content)
    print("Created .env with unique MongoDB passwords. Start with docker compose up --build -d")
