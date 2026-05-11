from fastapi import APIRouter
from app.db.database import users_collection, db
from datetime import datetime, timedelta, timezone

router = APIRouter()

# Collection for system logs
logs_collection = db.logs

@router.get("/stats")
async def get_stats():
    total_users = users_collection.count_documents({})
    # We count AI requests from the logs collection
    ai_requests = logs_collection.count_documents({"type": "ai"})
    
    # Count Live Users (active in last 5 mins)
    ist = timezone(timedelta(hours=5, minutes=30))
    five_mins_ago = (datetime.now(ist) - timedelta(minutes=5)).isoformat()
    live_users = users_collection.count_documents({"last_active": {"$gte": five_mins_ago}})
    
    return {
        "totalUsers": total_users,
        "aiRequests": ai_requests,
        "liveUsers": live_users,
        "status": "Active"
    }

@router.get("/logs")
async def get_logs():
    # Fetch latest 10 logs
    logs = list(logs_collection.find().sort("timestamp", -1).limit(10))
    # Convert MongoDB _id to string for JSON
    ist = timezone(timedelta(hours=5, minutes=30))
    for log in logs:
        log["_id"] = str(log["_id"])
        # If timestamp is naive or in UTC, replace/convert to IST
        ts = log["timestamp"]
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        ts_ist = ts.astimezone(ist)
        log["time"] = ts_ist.strftime("%I:%M %p")
    return logs

@router.get("/logs/all")
async def get_all_logs():
    # Fetch all logs, newest first
    logs = list(logs_collection.find().sort("timestamp", -1))
    ist = timezone(timedelta(hours=5, minutes=30))
    for log in logs:
        log["_id"] = str(log["_id"])
        ts = log["timestamp"]
        if ts.tzinfo is None: ts = ts.replace(tzinfo=timezone.utc)
        ts_ist = ts.astimezone(ist)
        log["time"] = ts_ist.strftime("%d %b, %I:%M %p")
    return logs

@router.delete("/logs/clear")
async def clear_logs():
    logs_collection.delete_many({})
    return {"message": "Logs cleared successfully"}

@router.delete("/logs/{log_id}")
async def delete_log_entry(log_id: str):
    from bson import ObjectId
    try:
        result = logs_collection.delete_one({"_id": ObjectId(log_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Log not found")
        return {"message": "Log deleted successfully"}
    except:
        raise HTTPException(status_code=400, detail="Invalid Log ID")

def add_log(event: str, log_type: str = "sys", user_email: str = "unknown"):
    # Use Indian Standard Time (UTC+5:30)
    ist = timezone(timedelta(hours=5, minutes=30))
    logs_collection.insert_one({
        "event": event,
        "type": log_type,
        "user_email": user_email,
        "timestamp": datetime.now(ist)
    })
