from pymongo import MongoClient
from passlib.context import CryptContext

# Simple hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# LIVE PRODUCTION URL
MONGO_URL = "mongodb+srv://giniDB:GiniLytics2026@cluster0.nudeyev.mongodb.net/?appName=Cluster0"
client = MongoClient(MONGO_URL)
db = client["ginilytics_db"]
users_collection = db["users"]

# Add the specific user requested
user_data = {
    "name": "Aditya",
    "email": "aditya@gmail.com", 
    "password": pwd_context.hash("123456"), 
    "role": "admin",
    "custom_id": "E-001"
}

if not users_collection.find_one({"email": user_data["email"]}):
    users_collection.insert_one(user_data)
    print(f"✅ Success! Created user: {user_data['email']} (Password: 123456)")
else:
    # Update password just in case it was wrong
    users_collection.update_one({"email": user_data["email"]}, {"$set": {"password": user_data["password"]}})
    print(f"✅ Success! Updated password for existing user: {user_data['email']}")

print("Production Seeding Complete.")
