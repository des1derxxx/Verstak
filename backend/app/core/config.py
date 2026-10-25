from dataclasses import dataclass
import os


@dataclass(frozen=True)
class Settings:
    mongo_uri: str = "mongodb://localhost:27017/?replicaSet=rs0&directConnection=true"
    mongo_database: str = "verstak"
    public_origin: str = "http://localhost:8080"
    secure_cookies: bool = False
    registration_enabled: bool = True
    session_days: int = 14

    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from: str = ""
    smtp_security: str = "starttls"

    @classmethod
    def from_env(cls):
        origin = os.getenv("PUBLIC_ORIGIN", "http://localhost:8080").rstrip("/")
        production = os.getenv("APP_ENV", "development") == "production"
        secure = os.getenv("COOKIE_SECURE", "true" if production else "false").lower() == "true"
        if production and (not secure or not origin.startswith("https://")):
            raise ValueError("Production requires PUBLIC_ORIGIN=https://… and COOKIE_SECURE=true")
        return cls(
            mongo_uri=os.getenv("MONGODB_URI", cls.mongo_uri),
            mongo_database=os.getenv("MONGODB_DATABASE", "verstak"),
            public_origin=origin,
            smtp_host=os.getenv("SMTP_HOST", ""),
            smtp_port=int(os.getenv("SMTP_PORT", "587")),
            smtp_username=os.getenv("SMTP_USERNAME", ""),
            smtp_password=os.getenv("SMTP_PASSWORD", ""),
            smtp_from=os.getenv("SMTP_FROM", ""),
            smtp_security=os.getenv("SMTP_SECURITY", "starttls"),
            secure_cookies=secure,
            registration_enabled=os.getenv("ALLOW_REGISTRATION", "true").lower() == "true",
        )
