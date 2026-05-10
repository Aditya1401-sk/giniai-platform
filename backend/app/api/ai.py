from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.schemas.ai import AIRequest
from app.services.ai_services import get_ai_response_stream
from app.db.database import users_collection
from app.api.stats import add_log
from rag_service.rag_core import rag_engine
import json

router = APIRouter()

@router.post("/chat")
def chat(request: AIRequest):
    msg = request.message.lower()
    user_role = getattr(request, 'role', 'guest') 
    
    # Log the request (Full message)
    add_log(f"AI Request from {user_role}: {request.message}", "ai")
    
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

    # 3. Construct Prompt
    if is_asking_for_data and user_role == "admin":
        user_count = users_collection.count_documents({})
        prompt = (
            f"Context: Total Users = {user_count}, Status = Active.\n"
            f"Relevant Docs: {context_text}\n"
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
        
        prompt = base_prompt + f"User Query: {request.message}\nAI:"

    return StreamingResponse(get_ai_response_stream(prompt), media_type="text/event-stream")