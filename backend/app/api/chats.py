from fastapi import APIRouter, HTTPException
from app.db.database import db
from pydantic import BaseModel
from typing import List, Optional
import time

router = APIRouter()
chats_collection = db.chat_sessions

class Message(BaseModel):
    role: str
    content: str
    timestamp: Optional[str] = None

class ChatSession(BaseModel):
    id: int
    title: str
    messages: List[Message]
    email: str
    role: str
    pinned: Optional[bool] = False
    temp: Optional[bool] = False

@router.get("/")
async def get_user_chats(email: str, role: str):
    chats = list(chats_collection.find({"email": email, "role": role}).sort("id", -1))
    for chat in chats:
        chat["_id"] = str(chat["_id"])
    return chats

@router.post("/save")
async def save_chat_session(session: ChatSession):
    # Update if exists, else insert
    chats_collection.update_one(
        {"id": session.id, "email": session.email},
        {"$set": session.dict()},
        upsert=True
    )
    return {"status": "success"}

@router.delete("/{session_id}")
async def delete_chat_session(session_id: int, email: str):
    result = chats_collection.delete_one({"id": session_id, "email": email})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"status": "deleted"}
