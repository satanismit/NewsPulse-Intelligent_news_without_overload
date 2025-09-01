from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from routes.news import router
from routes.about import router2
from scraping import fetcher

import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

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

@app.post("/scrape")
def scrape_and_store(n: int = 20):
    result = fetcher.get_news(n)
    return {
        "message": f"Scraped {result['total']} new articles, total in system: {result['total_in_system']}",
        "new_articles": result['articles']
    }
# Request body
class ChatRequest(BaseModel):
    query: str

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        # Enhanced prompt to get better formatted responses
        enhanced_prompt = f"""
        Please provide a well-formatted response to the following query. 
        Use proper formatting with:
        - Headers (## for main sections, ### for subsections)
        - Bullet points for lists
        - Bold text for important points
        - Clear sections and paragraphs
        - Numbered lists when appropriate
        - Summary sections when relevant
        
        Query: {request.query}
        
        Format your response with proper markdown-style formatting that can be easily parsed and displayed in a chat interface.
        """
        
        response = model.generate_content(enhanced_prompt)
        
        # Parse and structure the response
        formatted_response = {
            "text": response.text,
            "formatted": True,
            "sections": parse_response_sections(response.text)
        }
        
        return formatted_response
    except Exception as e:
        return {"error": str(e)}

def parse_response_sections(text):
    """Parse the response text into structured sections"""
    sections = []
    lines = text.split('\n')
    current_section = {"type": "paragraph", "content": []}
    
    for line in lines:
        line = line.strip()
        if not line:
            if current_section["content"]:
                sections.append(current_section)
                current_section = {"type": "paragraph", "content": []}
            continue
            
        # Check for headers
        if line.startswith('## '):
            if current_section["content"]:
                sections.append(current_section)
            current_section = {"type": "header", "level": 2, "content": [line[3:]]}
            sections.append(current_section)
            current_section = {"type": "paragraph", "content": []}
        elif line.startswith('### '):
            if current_section["content"]:
                sections.append(current_section)
            current_section = {"type": "header", "level": 3, "content": [line[4:]]}
            sections.append(current_section)
            current_section = {"type": "paragraph", "content": []}
        # Check for bullet points
        elif line.startswith('- ') or line.startswith('• ') or line.startswith('* '):
            if current_section["type"] != "bullet_list":
                if current_section["content"]:
                    sections.append(current_section)
                current_section = {"type": "bullet_list", "content": []}
            current_section["content"].append(line[2:])
        # Check for numbered lists
        elif line[0].isdigit() and '. ' in line[:5]:
            if current_section["type"] != "numbered_list":
                if current_section["content"]:
                    sections.append(current_section)
                current_section = {"type": "numbered_list", "content": []}
            current_section["content"].append(line)
        else:
            # Regular paragraph text
            if current_section["type"] != "paragraph":
                if current_section["content"]:
                    sections.append(current_section)
                current_section = {"type": "paragraph", "content": []}
            current_section["content"].append(line)
    
    # Add the last section
    if current_section["content"]:
        sections.append(current_section)
    
    return sections


# Include other routers
app.include_router(router)
app.include_router(router2)
