from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()
MONGO_URL = os.getenv("MONGO_URL")
client = MongoClient(MONGO_URL)
db = client["ginilytics_db"]
users_collection = db["users"]

print(f"Total users: {users_collection.count_documents({})}")
for user in users_collection.find():
    print(f"Email: {user.get('email')}, Role: {user.get('role')}")
