from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import sys
import os

# Add rag-service to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.api.ai import router as ai_router
from app.api.auth import router as auth_router
from app.api.stats import router as stats_router
from app.api.files import router as files_router
from app.api.chats import router as chats_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import traceback
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print("GLOBAL EXCEPTION CAUGHT:")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"message": "Internal Server Error", "detail": str(exc)},
    )

import os
if not os.path.exists("uploads/profile_pics"):
    os.makedirs("uploads/profile_pics")

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth_router)
app.include_router(ai_router)
app.include_router(files_router, prefix="/api/files")
app.include_router(stats_router, prefix="/api/stats")
app.include_router(chats_router, prefix="/api/chats")


@app.get("/")
def root():
    return {"message": "API Running"}