# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException, File, UploadFile
import shutil
import uuid
from app.db.database import users_collection
from app.core.security import verify_password, create_access_token, hash_password
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.api.stats import add_log
from typing import List
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

import os
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

router = APIRouter(prefix="/auth", tags=["Auth"])

def generate_custom_id(role: str):
    prefix_map = {
        "admin": "E",
        "management": "M",
        "sales": "S",
        "developer": "D"
    }
    prefix = prefix_map.get(role.lower(), "X")
    
    # Find count of users with this prefix already
    count = users_collection.count_documents({"role": role})
    new_id = f"{prefix}-{str(count + 1).zfill(3)}"
    return new_id

@router.post("/login")
def login(data: dict):
    user = users_collection.find_one({"email": data["email"]})

    if not user:
        add_log(f"Failed login attempt: {data['email']}", "auth")
        return {"message": "Invalid Login"}

    if not verify_password(data["password"], user["password"]):
        add_log(f"Failed password for: {data['email']}", "auth")
        return {"message": "Invalid Login"}

    access_token = create_access_token(
        data={"sub": user["email"]}
    )

    add_log(f"User login: {user['email']} ({user['role']})", "auth")

    return {
        "access_token": access_token,
        "role": user["role"],
        "name": user.get("name", "User"),
        "profile_pic": user.get("profile_pic", "")
    }

@router.post("/google")
async def google_login(data: dict):
    token = data.get("credential")
    if not token:
        raise HTTPException(status_code=400, detail="Credential missing")
    
    try:
        # Verify the ID token
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), GOOGLE_CLIENT_ID)
        
        email = idinfo['email']
        name = idinfo.get('name', email.split('@')[0])
        
        # Check if user exists
        user = users_collection.find_one({"email": email})
        
        if not user:
            # Create new user if they don't exist
            # Default role: management (can be adjusted)
            role = "management"
            custom_id = generate_custom_id(role)
            new_user = {
                "name": name,
                "email": email,
                "password": hash_password("google-oauth-user"), # Placeholder
                "role": role,
                "custom_id": custom_id
            }
            users_collection.insert_one(new_user)
            user = new_user
            add_log(f"New user created via Google: {email}", "sys")
        
        access_token = create_access_token(data={"sub": email})
        add_log(f"Google login: {email}", "auth")
        
        return {
            "access_token": access_token,
            "role": user["role"],
            "email": email,
            "name": name,
            "profile_pic": user.get("profile_pic", "")
        }
        
    except ValueError:
        # Invalid token
        raise HTTPException(status_code=401, detail="Invalid Google token")

@router.get("/users", response_model=List[UserResponse])
def get_users():
    users = list(users_collection.find({}, {"_id": 0, "password": 0}))
    return users
    
@router.post("/upload-profile-pic")
async def upload_profile_pic(email: str, file: UploadFile = File(...)):
    # Create unique filename
    extension = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{extension}"
    file_path = f"uploads/profile_pics/{filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Update user in DB
    profile_url = f"/uploads/profile_pics/{filename}"
    users_collection.update_one({"email": email}, {"$set": {"profile_pic": profile_url}})
    
    return {"message": "Profile picture updated", "url": profile_url}

@router.post("/users")
def create_user(user: UserCreate):
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="User already exists")
    
    hashed_pwd = hash_password(user.password)
    custom_id = generate_custom_id(user.role)
    
    new_user = {
        "name": user.name,
        "email": user.email,
        "password": hashed_pwd,
        "role": user.role,
        "custom_id": custom_id
    }
    users_collection.insert_one(new_user)
    add_log(f"New user created: {user.name} ({custom_id})", "sys")
    return {"message": "User created successfully", "custom_id": custom_id}

@router.put("/users/{email}")
def update_user(email: str, user_update: UserUpdate):
    user = users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = {}
    if user_update.name:
        update_data["name"] = user_update.name
    if user_update.password:
        update_data["password"] = hash_password(user_update.password)
    if user_update.role:
        update_data["role"] = user_update.role
    
    if update_data:
        users_collection.update_one({"email": email}, {"$set": update_data})
        add_log(f"User updated: {email}", "sys")
    
    return {"message": "User updated successfully"}

@router.delete("/users/{email}")
def delete_user(email: str):
    user = users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user["role"] == "admin":
        raise HTTPException(status_code=403, detail="Administrator accounts cannot be deleted for security reasons.")
    
    result = users_collection.delete_one({"email": email})
    add_log(f"User deleted: {email}", "sys")
    return {"message": "User deleted successfully"}