"""Admin schemas."""
from pydantic import BaseModel
from typing import Dict, Any


class SystemMetrics(BaseModel):
    """System metrics schema."""
    cpu_usage: float
    memory_usage: float
    cache_hit_rate: float
    total_requests: int
    active_sessions: int
    uptime_seconds: float


class CacheFlushResponse(BaseModel):
    """Cache flush response schema."""
    success: bool
    message: str
    entries_flushed: int


class ModelConfig(BaseModel):
    """Model configuration schema."""
    model_config = {"protected_namespaces": ()}  # Allow model_ prefix

    model_path: str
    n_ctx: int
    n_threads: int
    n_gpu_layers: int
    temperature: float
    top_p: float
    max_tokens: int
