"""
Bütün konfiqurasiya bir yerdə. Heç bir secret kodun içində hardcode
olunmur — .env faylından oxunur. Bu, təhlükəsizlik baxımından vacibdir:
repo GitHub-a push olunanda parolun/secret-in görünməməsi üçün .env
gitignore-da olmalıdır (aşağıda .env.example var, .env deyil).
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Postgres bağlantısı. Format:
    # postgresql://<user>:<password>@<host>:<port>/<db_name>
    database_url: str = "postgresql://dolphy:dolphy@localhost:5432/dolphy"

    # JWT üçün gizli açar. PRODUCTION-da MÜTLƏQ .env-də dəyişdirin —
    # aşağıdakı default yalnız local development üçündür.
    jwt_secret: str = "dev-only-secret-change-me-in-env-file"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 gün

    # CORS — frontend hansı origin-lərdən sorğu ata bilər
    cors_origins: list[str] = [
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
