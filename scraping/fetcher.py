# 📁 app/scraping/fetcher.py

from fastapi import HTTPException
import feedparser
from bs4 import BeautifulSoup
import json, os
from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError, ConnectionFailure
from fastapi.encoders import jsonable_encoder
from bson import ObjectId

# MongoDB connection with error handling
try:
    client = MongoClient("mongodb://localhost:27017", serverSelectionTimeoutMS=5000)
    # Test the connection
    client.admin.command('ping')
    db = client["news"]
    collection = db["articles"]
    mongodb_available = True
    print("✅ MongoDB connected successfully")
except (ServerSelectionTimeoutError, ConnectionFailure) as e:
    print("⚠️ MongoDB not available, running without database storage from fetcher")
    mongodb_available = False
    client = None
    db = None
    collection = None

# Define your RSS sources
RSS_FEEDS = {
    "ANI": "https://www.aninews.in/rss/national-news.xml",
    "NDTV": "http://feeds.feedburner.com/ndtvnews-top-stories",
    "Indian Express": "https://indianexpress.com/section/india/feed/",
    "Hindustan Times": "https://www.hindustantimes.com/rss/topnews/rssfeed.xml",
    "The Hindu": "https://www.thehindu.com/news/national/feeder/default.rss",
    "India Today": "https://www.indiatoday.in/rss/home",
    "News18": "https://www.news18.com/rss/world.xml",
    "DNA India": "https://www.dnaindia.com/feeds/india.xml",
    "Firstpost": "https://www.firstpost.com/rss/india.xml",
    "Business Standard": "https://www.business-standard.com/rss/home_page_top_stories.rss",
    "Outlook India": "https://www.outlookindia.com/rss/main/magazine",
    "Free Press Journal": "https://www.freepressjournal.in/stories.rss",
    "Deccan Chronicle": "https://www.deccanchronicle.com/rss_feed/",
    "Moneycontrol": "http://www.moneycontrol.com/rss/latestnews.xml"
}

# Function to strip HTML tags from RSS summary
def clean_summary(summary_html):
    soup = BeautifulSoup(summary_html, "html.parser")
    return soup.get_text()

def get_news(n: int):
    if n <= 0:
        raise HTTPException(status_code=401, detail="Bad Request")
    
    all_articles = []
    count = n

    # Fetch RSS feeds
    for source_name, url in RSS_FEEDS.items():
        feed = feedparser.parse(url)
        if count == 0:
            break
        
        for entry in feed.entries[:n]:
            article_data = {
                "source": source_name,
                "title": entry.title,
                "summary": clean_summary(entry.summary),
                "link": entry.link,
                "published": entry.get("published", "Unknown")
            }
            all_articles.append(article_data)
            count -= 1
    
    # Load existing articles from JSON file
    json_path = "article.json"
    existing_articles = []
    
    if os.path.exists(json_path):
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                existing_articles = json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            existing_articles = []
    
    # Remove duplicates based on title
    existing_titles = set(article.get('title', '') for article in existing_articles)
    unique_new_articles = [article for article in all_articles if article.get('title', '') not in existing_titles]
    
    # Combine existing and new articles
    combined_articles = existing_articles + unique_new_articles
    
    # Save all articles to JSON file
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(combined_articles, f, indent=4, ensure_ascii=False)

    print("File saved at:", os.path.abspath(json_path))
    print(f"Total articles: {len(combined_articles)} (Added {len(unique_new_articles)} new)")

    # Save new articles to MongoDB if available
    if mongodb_available and collection is not None:
        try:
            if unique_new_articles:
                collection.insert_many(unique_new_articles)
            print("✅ New data saved to MongoDB")
        except Exception as e:
            print(f"⚠️ Failed to save to MongoDB: {e}")
    else:
        print("ℹ️ Skipping MongoDB storage (not available)")

    # Encode articles to handle ObjectId
    articles_for_return = jsonable_encoder(
        unique_new_articles,
        custom_encoder={ObjectId: str}
    )

    return {
        "total": len(unique_new_articles),
        "articles": articles_for_return,
        "total_in_system": len(combined_articles)
    }
