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

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth_router)
app.include_router(ai_router)
app.include_router(files_router, prefix="/api/files")
app.include_router(stats_router, prefix="/api/stats")


@app.get("/")
def root():
    return {"message": "API Running"}