from fastapi import APIRouter
from app.scraping.fetcher import get_news 

router = APIRouter()

@router.get("/news/{article}")
def read_news(article:int):
    return get_news(article)




