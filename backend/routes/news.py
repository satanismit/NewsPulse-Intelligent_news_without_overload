from fastapi import APIRouter
from scraping.fetcher import get_news 
from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError, ConnectionFailure

router = APIRouter()

# MongoDB connection with error handling
try:
    client = MongoClient("mongodb://localhost:27017", serverSelectionTimeoutMS=5000)
    # Test the connection
    client.admin.command('ping')
    db = client["news"]
    collection = db["articles"]
    mongodb_available = True
except (ServerSelectionTimeoutError, ConnectionFailure) as e:
    mongodb_available = False
    client = None
    db = None
    collection = None

@router.get("/news/{article}")
def read_news(article: int):
    return get_news(article)

@router.get("/articles")
def get_articles_from_mongodb():
    """Get all articles from MongoDB"""
    if not mongodb_available or not collection:
        return {"error": "MongoDB not available", "total": 0, "articles": []}
    
    try:
        articles = list(collection.find({}, {"_id": 0}))  # Exclude MongoDB _id field
        return {"total": len(articles), "articles": articles}
    except Exception as e:
        return {"error": str(e), "total": 0, "articles": []}




