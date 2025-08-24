from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.news import router 
from routes.about import router2
from scraping import fetcher
 
app = FastAPI(title="NewsPulse")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/articles")
def get_all_articles():
    if fetcher.mongodb_available and fetcher.collection is not None:
        articles = list(fetcher.collection.find({}, {"_id": 0}))  # exclude MongoDB _id
        return {"articles": articles}
    return {"articles": []}

app.include_router(router)
app.include_router(router2)