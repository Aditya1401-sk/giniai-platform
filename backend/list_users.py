from pymongo import MongoClient

# LIVE PRODUCTION URL
MONGO_URL = "mongodb+srv://giniDB:GiniLytics2026@cluster0.nudeyev.mongodb.net/?appName=Cluster0"
client = MongoClient(MONGO_URL)
db = client["ginilytics_db"]
users_collection = db["users"]

print("\n--- Current Users in Production Database ---")
users = list(users_collection.find({}, {"_id": 0, "password": 0}))

if not users:
    print("Database is empty.")
else:
    for idx, user in enumerate(users, 1):
        print(f"{idx}. Name: {user.get('name', 'N/A')} | Email: {user['email']} | Role: {user['role']} | ID: {user.get('custom_id', 'N/A')}")
print("-------------------------------------------\n")
