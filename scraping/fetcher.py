# 📁 app/routes/news.py

from fastapi import APIRouter, HTTPException
import feedparser
from bs4 import BeautifulSoup
import json,os
from pymongo import MongoClient

router = APIRouter()


client = MongoClient("mongodb://localhost:27017")  # Ensure MongoDB is running
db = client["test"]                            # Database name
collection = db["Project-2"]      



# Define your RSS sources
RSS_FEEDS = {
    "The Hindu": "https://www.thehindu.com/news/national/feeder/default.rss",
    "ANI": "https://www.aninews.in/rss/national-news.xml",
    "NDTV": "http://feeds.feedburner.com/ndtvnews-top-stories",
    "Indian Express": "https://indianexpress.com/section/india/feed/",
    "Hindustan Times": "https://www.hindustantimes.com/rss/topnews/rssfeed.xml"
}

# Function to strip HTML tags from RSS summary
def clean_summary(summary_html):
    soup = BeautifulSoup(summary_html, "html.parser")
    return soup.get_text()


@router.get("/news", summary="Get latest news from Indian sources")
def get_news(n:int):

    if n<=0 :
        raise HTTPException(status_code=401,detail="Bad Request")
    
    all_articles = []
    mongo_articles=[]
    count=n

    for source_name, url in RSS_FEEDS.items():
        feed = feedparser.parse(url)
        if(count==0):
            break
        
        for entry in feed.entries[:n]:  

            
            all_articles.append({
                "source": source_name,
                "title": entry.title,
                "summary": clean_summary(entry.summary),
                "link": entry.link,
                "published": entry.get("published", "Unknown")
            })
            mongo_articles.append({  "Title":entry.title,
                                  "article":clean_summary(entry.summary),
                                    "published": entry.get("published", "Unknown")})
            
            count=count-1
    
    json_path = "D:/sem_5/p2/app/article.json"

    # Step 1: Load existing articles if file exists
    if os.path.exists(json_path):
        with open(json_path, "r", encoding="utf-8") as f:
            try:
                existing_articles = json.load(f)
            except json.JSONDecodeError:
                existing_articles = []
    else:
        existing_articles = []

    # Step 2: Merge old + new
    combined_articles = existing_articles + all_articles

    # Step 3: Save all back to file
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(combined_articles, f, indent=4, ensure_ascii=False)

    print("File saved at:", os.path.abspath(json_path))


    # with open("article.json") as f:
    #     data = json.load(f)
    #     collection.insert_many(data)
    collection.insert_many(mongo_articles) 
    
    

    cleaned_articles = [
        {**article, "_id": str(article["_id"])} if "_id" in article else article
        for article in all_articles
    ]


    return {"total": len(cleaned_articles), "articles": cleaned_articles}
