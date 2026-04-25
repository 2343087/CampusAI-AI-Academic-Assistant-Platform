from app.core.redis_provider import redis_client
import json

class ChatMemory:
    def __init__(self, ttl: int = 3600):
        self.ttl = ttl  # History expires in 1 hour
        self.prefix = "chat_mem:"

    async def get_history(self, user_id: str, limit: int = 5) -> str:
        """Get last N messages from Redis for this user."""
        key = f"{self.prefix}{user_id}"
        # Redis list: latest at the end
        messages = await redis_client.lrange(key, -limit, -1)
        
        history_text = ""
        for msg_json in messages:
            msg = json.loads(msg_json)
            history_text += f"User: {msg['query']}\nAI: {msg['response']}\n"
        
        return history_text.strip()

    async def add_message(self, user_id: str, query: str, response: str):
        """Add a new message pair to Redis."""
        key = f"{self.prefix}{user_id}"
        msg_json = json.dumps({"query": query, "response": response})
        
        # Push to list
        await redis_client.rpush(key, msg_json)
        # Trim list to keep only last 10 messages
        await redis_client.ltrim(key, -10, -1)
        # Set expiration
        await redis_client.expire(key, self.ttl)

    async def clear_history(self, user_id: str):
        """Wipe all redis memory for this user."""
        key = f"{self.prefix}{user_id}"
        await redis_client.delete(key)

chat_memory = ChatMemory()
