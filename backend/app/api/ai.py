from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.schemas.ai import AIRequest
from app.services.ai_services import get_ai_response_stream
from app.db.database import users_collection
from app.api.stats import add_log
from rag_service.rag_core import rag_engine
import json
from datetime import datetime, timedelta, timezone

router = APIRouter()

@router.post("/chat")
async def chat(request: AIRequest):
    msg = request.message.lower()
    user_role = getattr(request, 'role', 'guest') 
    
    # Log the request (Full message + Identity)
    add_log(f"AI Request from {user_role}: {request.message}", "ai", user_email=request.email)
    
    # 1. Check if the user is actually asking for platform data (Admin Only)
    data_keywords = ["user", "how many", "status", "total", "count", "stat"]
    is_asking_for_data = any(key in msg for key in data_keywords)

    if is_asking_for_data and user_role != "admin":
        def error_gen():
            yield "I'm sorry, only Administrators have permission to view platform statistics."
        return StreamingResponse(error_gen(), media_type="text/plain")

    # 2. RAG SEARCH: Check if there are relevant documents
    context_docs = rag_engine.search(request.message)
    context_text = "\n".join(context_docs) if context_docs else ""

    # 3. Construct History Text
    history_text = ""
    if request.history:
        # Take the last 6 messages to keep the prompt size reasonable
        for chat_msg in request.history[-6:]:
            role_label = "User" if chat_msg.get('role') == 'user' else "AI"
            history_text += f"{role_label}: {chat_msg.get('content')}\n"

    # 4. Construct Final Prompt
    if is_asking_for_data and user_role == "admin":
        users = list(users_collection.find({}, {"password": 0}))
        ist = timezone(timedelta(hours=5, minutes=30))
        now = datetime.now(ist)
        online_users = []
        for u in users:
            last_active_str = u.get("last_active")
            if last_active_str:
                try:
                    last_active = datetime.fromisoformat(last_active_str)
                    if now - last_active < timedelta(minutes=5):
                        online_users.append(f"{u['name']} ({u['role']})")
                except: pass
        
        online_context = ", ".join(online_users) if online_users else "None"
        user_count = len(users)
        
        prompt = (
            f"System Context: Total Registered Users = {user_count}. Users Currently LIVE/Online = {online_context}.\n"
            f"Relevant Docs: {context_text}\n"
            f"{history_text}"
            f"User: {request.message}\n"
            f"AI:"
        )
    else:
        base_prompt = f"System: You are GiniLytics AI, a professional assistant for the {user_role} team.\n"
        if context_text.strip():
            base_prompt += (
                f"You have been provided with the following uploaded document context to help answer the user's query.\n"
                f"--- UPLOADED DOCUMENT CONTEXT ---\n{context_text}\n---------------------------------\n\n"
            )
        
        prompt = base_prompt + f"{history_text}User Query: {request.message}\nAI:"

    return StreamingResponse(get_ai_response_stream(prompt), media_type="text/event-stream")