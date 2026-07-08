from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    database_url: str = "sqlite:///./sql_app.db"
    anthropic_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    cors_origins: str = ""
    seed_on_startup: bool = True
    app_name: str = "People's Priorities"
    app_version: str = "1.0.0"

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
