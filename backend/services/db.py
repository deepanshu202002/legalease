import os
from datetime import datetime, timezone
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DB = os.getenv("MONGODB_DB", "legalease")

client: Optional[AsyncIOMotorClient] = None


def get_database():
    return client[MONGODB_DB]


def get_collection():
    return get_database()["analyses"]


async def connect_db():
    global client
    client = AsyncIOMotorClient(MONGODB_URL)


async def close_db():
    global client
    if client:
        client.close()


async def save_analysis(doc: dict) -> str:
    col = get_collection()
    await col.insert_one(doc)
    return doc["_id"]


async def update_summary(analysis_id: str, summary: str):
    col = get_collection()
    await col.update_one(
        {"_id": analysis_id},
        {"$set": {"summary": summary}}
    )


async def get_all_analyses():
    col = get_collection()
    cursor = col.find().sort("created_at", -1)
    results = []
    async for doc in cursor:
        doc["id"] = doc.pop("_id")
        results.append(doc)
    return results


async def get_analysis_by_id(analysis_id: str):
    col = get_collection()
    doc = await col.find_one({"_id": analysis_id})
    if doc:
        doc["id"] = doc.pop("_id")
    return doc


async def delete_analysis(analysis_id: str) -> bool:
    col = get_collection()
    result = await col.delete_one({"_id": analysis_id})
    return result.deleted_count > 0
