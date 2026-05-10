from pymongo import MongoClient
import os
from dotenv import load_dotenv
from app.core.security import hash_password

load_dotenv()
MONGO_URL = os.getenv("MONGO_URL")
client = MongoClient(MONGO_URL)
db = client["ginilytics_db"]
users_collection = db["users"]

users_to_add = [
    {"email": "admin@gmail.com", "password": "admin", "role": "admin"},
    {"email": "management@gmail.com", "password": "management", "role": "management"},
    {"email": "sales@gmail.com", "password": "sales", "role": "sales"},
    {"email": "developer@gmail.com", "password": "developer", "role": "developer"},
]

for user_data in users_to_add:
    if not users_collection.find_one({"email": user_data["email"]}):
        user_data["password"] = hash_password(user_data["password"])
        users_collection.insert_one(user_data)
        print(f"Added user: {user_data['email']}")
    else:
        print(f"User already exists: {user_data['email']}")

print("Seeding complete.")
