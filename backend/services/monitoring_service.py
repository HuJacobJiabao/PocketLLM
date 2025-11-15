"""Monitoring service for system metrics and telemetry."""
import psutil
from datetime import datetime
from typing import Dict
from schemas.admin import SystemMetrics


class MonitoringService:
    """Monitors system resources and application metrics."""

    def __init__(self):
        """Initialize monitoring service."""
        self.total_requests = 0
        self.start_time = datetime.utcnow()

    def get_system_metrics(self, cache_stats: dict, active_sessions: int) -> SystemMetrics:
        """Get current system metrics."""
        # CPU usage
        cpu_usage = psutil.cpu_percent(interval=0.1)

        # Memory usage
        memory = psutil.virtual_memory()
        memory_usage = memory.percent

        # Cache hit rate
        cache_hit_rate = cache_stats.get("hit_rate", 0.0)

        # Uptime
        uptime_seconds = self.get_uptime()

        return SystemMetrics(
            cpu_usage=cpu_usage,
            memory_usage=memory_usage,
            cache_hit_rate=cache_hit_rate,
            total_requests=self.total_requests,
            active_sessions=active_sessions,
            uptime_seconds=uptime_seconds
        )

    def increment_request_count(self):
        """Increment total request counter."""
        self.total_requests += 1

    def get_uptime(self) -> float:
        """Get service uptime in seconds."""
        return (datetime.utcnow() - self.start_time).total_seconds()
