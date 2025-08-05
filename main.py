from fastapi import FastAPI
from app.routes.news import router 
from app.routes.about import router2
 
app = FastAPI(title="NewsPulse")

app.include_router(router)
app.include_router(router2)