from pymongo import MongoClient
from app.api.auth import generate_custom_id

# Connect to database
client = MongoClient("mongodb://localhost:27017")
db = client.ginilytics_db
users_collection = db.users

def repair_users():
    print("Repairing existing users in ginilytics_db...")
    users = list(users_collection.find({"custom_id": {"$exists": False}}))
    print(f"Found {len(users)} users to repair.")
    
    for user in users:
        role = user.get("role", "developer")
        email = user["email"]
        name = user.get("name") or email.split("@")[0].capitalize()
        
        # Calculate next ID correctly by role
        custom_id = generate_custom_id(role)
        
        users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {
                "name": name,
                "custom_id": custom_id
            }}
        )
        print(f"Repaired {email} -> {name} ({custom_id})")

if __name__ == "__main__":
    repair_users()
