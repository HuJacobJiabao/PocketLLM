"""
Configuration management for PocketLLM backend.
Uses pydantic-settings for environment variable validation.
"""
from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
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

    # Model Params
    MODEL_PATH: str = "./models/model.gguf"
    MODEL_N_CTX: int = int(os.getenv("MODEL_N_CTX", 768))
    MODEL_N_THREADS: int = int(os.getenv("MODEL_N_THREADS", 3))
    MODEL_N_GPU_LAYERS: int = int(os.getenv("MODEL_N_GPU_LAYERS", 0))
    MODEL_TEMPERATURE: float = float(os.getenv("MODEL_TEMPERATURE", 0.0))
    MODEL_TOP_P: float = float(os.getenv("MODEL_TOP_P", 1.0))
    MODEL_MAX_TOKENS: int = int(os.getenv("MODEL_MAX_TOKENS", 512))
    MODEL_N_BATCH: int = int(os.getenv("MODEL_N_BATCH", 128))

    CACHE_TTL_SECONDS: int = 3600  # 1 hour
    ENABLE_CACHE: bool = True

    RATE_LIMIT_REQUESTS: int = 10
    RATE_LIMIT_PERIOD: int = 60  # seconds

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()