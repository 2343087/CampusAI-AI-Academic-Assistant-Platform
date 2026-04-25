import redis.asyncio as aioredis
import os

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Async Redis client
redis_client = aioredis.from_url(REDIS_URL, decode_responses=True)

async def get_redis():
    """Dependency for getting a redis client."""
    return redis_client
