from fastapi import APIRouter
from app.db.database import users_collection, db
from datetime import datetime

router = APIRouter()

# Collection for system logs
logs_collection = db.logs

@router.get("/stats")
async def get_stats():
    total_users = users_collection.count_documents({})
    # We count AI requests from the logs collection
    ai_requests = logs_collection.count_documents({"type": "ai"})
    
    return {
        "totalUsers": total_users,
        "aiRequests": ai_requests,
        "status": "Active"
    }

@router.get("/logs")
async def get_logs():
    # Fetch latest 10 logs
    logs = list(logs_collection.find().sort("timestamp", -1).limit(10))
    # Convert MongoDB _id to string for JSON
    for log in logs:
        log["_id"] = str(log["_id"])
        log["time"] = log["timestamp"].strftime("%I:%M %p")
    return logs

def add_log(event: str, log_type: str = "sys"):
    logs_collection.insert_one({
        "event": event,
        "type": log_type,
        "timestamp": datetime.now()
    })
