import redis
import json

# Connect to local redis (or the one in docker later)
redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

def get_cache(key: str):
    try:
        data = redis_client.get(key)
        return json.loads(data) if data else None
    except Exception:
        return None

def set_cache(key: str, value: any, expiry: int = 3600):
    try:
        redis_client.setex(key, expiry, json.dumps(value))
    except Exception:
        pass
