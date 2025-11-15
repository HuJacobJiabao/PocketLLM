"""
Configuration management for PocketLLM backend.
Uses pydantic-settings for environment variable validation.
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "PocketLLM"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Security
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Database
    DATABASE_URL: str = "sqlite:///./pocketllm.db"

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: Optional[str] = None

    # LLM Model
    MODEL_PATH: str = "./models/tinyllama-1.1b-chat-q4.gguf"
    MODEL_N_CTX: int = 2048  # Context window
    MODEL_N_THREADS: int = 4  # CPU threads
    MODEL_N_GPU_LAYERS: int = 0  # GPU layers (0 = CPU only)
    MODEL_TEMPERATURE: float = 0.7
    MODEL_TOP_P: float = 0.95
    MODEL_MAX_TOKENS: int = 512

    # Cache settings
    CACHE_TTL_SECONDS: int = 3600  # 1 hour
    ENABLE_CACHE: bool = True

    # Rate limiting
    RATE_LIMIT_REQUESTS: int = 10
    RATE_LIMIT_PERIOD: int = 60  # seconds

    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
