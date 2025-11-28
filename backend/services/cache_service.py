"""Cache manager service using Redis for prompt caching with in-memory fallback."""
from typing import Optional, Dict
import hashlib
import json
from config import settings
from datetime import datetime, timedelta

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False


class CacheManager:
    """Manages caching of LLM inference results using Redis with in-memory fallback."""

    def __init__(self):
        """Initialize cache manager."""
        self.ttl = settings.CACHE_TTL_SECONDS
        self.redis_client: Optional[redis.Redis] = None
        self.use_redis = False

        # In-memory cache fallback
        self.memory_cache: Dict[str, tuple[str, datetime]] = {}

        # Try to connect to Redis if available
        if settings.ENABLE_CACHE and REDIS_AVAILABLE:
            try:
                self.redis_client = redis.Redis(
                    host=settings.REDIS_HOST,
                    port=settings.REDIS_PORT,
                    db=settings.REDIS_DB,
                    password=settings.REDIS_PASSWORD,
                    decode_responses=True,
                    socket_connect_timeout=5
                )
                # Test connection
                self.redis_client.ping()
                self.use_redis = True
                print("✓ Redis cache enabled")
            except (redis.ConnectionError, redis.TimeoutError, Exception) as e:
                print(f"⚠ Redis unavailable ({e}). Using in-memory cache fallback.")
                self.redis_client = None
                self.use_redis = False
        else:
            print("⚠ Redis not installed. Using in-memory cache fallback.")

        self.enabled = settings.ENABLE_CACHE

        # Statistics
        self.hits = 0
        self.misses = 0

    def _generate_cache_key(self, prompt: str, **kwargs) -> str:
        """Generate cache key from prompt and parameters."""
        # Handle both string prompts and pre-built cache keys
        if isinstance(prompt, str) and prompt.startswith('{'):
            # Already a JSON cache key
            try:
                json.loads(prompt)  # Validate it's valid JSON
                return f"llm:{hashlib.sha256(prompt.encode()).hexdigest()}"
            except json.JSONDecodeError:
                pass
        
        # Build cache key from parameters
        cache_data = {
            "prompt": prompt,
            "temperature": kwargs.get("temperature", settings.MODEL_TEMPERATURE),
            "max_tokens": kwargs.get("max_tokens", settings.MODEL_MAX_TOKENS),
        }
        cache_str = json.dumps(cache_data, sort_keys=True)
        return f"llm:{hashlib.sha256(cache_str.encode()).hexdigest()}"

    def _clean_expired_entries(self):
        """Remove expired entries from in-memory cache."""
        now = datetime.utcnow()
        expired_keys = [key for key, (_, expiry) in self.memory_cache.items() if expiry < now]
        for key in expired_keys:
            del self.memory_cache[key]

    def get(self, prompt: str, **kwargs) -> Optional[str]:
        """Get cached response for a prompt."""
        if not self.enabled:
            return None

        try:
            cache_key = self._generate_cache_key(prompt, **kwargs)

            # Try Redis first
            if self.use_redis and self.redis_client:
                try:
                    cached_value = self.redis_client.get(cache_key)
                    if cached_value:
                        self.hits += 1
                        return cached_value
                    else:
                        self.misses += 1
                        return None
                except Exception as e:
                    print(f"[Cache] Redis get error: {e}")
                    # Fall through to memory cache

            # Use in-memory cache
            self._clean_expired_entries()
            if cache_key in self.memory_cache:
                value, expiry = self.memory_cache[cache_key]
                if expiry > datetime.utcnow():
                    self.hits += 1
                    return value
                else:
                    # Expired
                    del self.memory_cache[cache_key]

            self.misses += 1
            return None
        except Exception as e:
            print(f"[Cache] Get error: {type(e).__name__}: {str(e)}")
            self.misses += 1
            return None

    def set(self, prompt: str, response: str, **kwargs) -> bool:
        """Cache a response for a prompt."""
        if not self.enabled:
            return False

        try:
            cache_key = self._generate_cache_key(prompt, **kwargs)

            # Try Redis first
            if self.use_redis and self.redis_client:
                try:
                    self.redis_client.setex(cache_key, self.ttl, response)
                    return True
                except Exception as e:
                    print(f"[Cache] Redis set error: {e}")
                    # Fall through to memory cache

            # Use in-memory cache
            expiry = datetime.utcnow() + timedelta(seconds=self.ttl)
            self.memory_cache[cache_key] = (response, expiry)
            return True
        except Exception as e:
            print(f"[Cache] Set error: {type(e).__name__}: {str(e)}")
            return False

    def flush(self) -> int:
        """Flush all cache entries (admin operation)."""
        if not self.enabled:
            return 0

        count = 0

        # Flush Redis
        if self.use_redis and self.redis_client:
            try:
                keys = self.redis_client.keys("llm:*")
                if keys:
                    count = self.redis_client.delete(*keys)
            except Exception as e:
                print(f"[Cache] Redis flush error: {e}")

        # Flush in-memory cache
        memory_count = len(self.memory_cache)
        self.memory_cache.clear()
        count += memory_count

        return count

    def get_stats(self) -> dict:
        """Get cache statistics."""
        total = self.hits + self.misses
        hit_rate = (self.hits / total * 100) if total > 0 else 0

        stats = {
            "enabled": self.enabled,
            "backend": "redis" if self.use_redis else "in-memory",
            "hits": self.hits,
            "misses": self.misses,
            "total_requests": total,
            "hit_rate": round(hit_rate, 2)
        }

        if self.use_redis and self.redis_client:
            try:
                info = self.redis_client.info("memory")
                stats["memory_used"] = info.get("used_memory_human", "N/A")
                stats["entries"] = self.redis_client.dbsize()
            except Exception:
                pass
        else:
            # In-memory cache stats
            self._clean_expired_entries()
            stats["entries"] = len(self.memory_cache)

        return stats