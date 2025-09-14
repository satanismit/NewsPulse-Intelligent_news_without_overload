from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from routes.news import router
from routes.about import router2
from scraping import fetcher
from typing import List, Dict, Any

import google.generativeai as genai
import os
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests
import json
from datetime import datetime

load_dotenv()
# Also try loading from parent directory
load_dotenv("../.env")

# Debug environment loading
print("=== Environment Debug ===")
print(f"Current working directory: {os.getcwd()}")
print(f"GEMINI_API_KEY loaded: {bool(os.getenv('GEMINI_API_KEY'))}")
print(f"SENDER_EMAIL: {os.getenv('SENDER_EMAIL')}")
print(f"SENDER_PASSWORD exists: {bool(os.getenv('SENDER_PASSWORD'))}")
print("========================")

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI(title="PulseAI")

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
# Request body models
class ChatRequest(BaseModel):
    query: str

class EmailRequest(BaseModel):
    email: str
    articles: List[Dict[str, Any]]

class WhatsAppRequest(BaseModel):
    whatsapp: str
    articles: List[Dict[str, Any]]


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

def format_articles_for_email(articles):
    """Format articles for email content"""
    email_content = """
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: #667eea; color: white; padding: 20px; text-align: center; }
            .article { border: 1px solid #ddd; margin: 20px 0; padding: 15px; border-radius: 8px; }
            .source { background: #667eea; color: white; padding: 5px 10px; border-radius: 15px; font-size: 12px; }
            .title { color: #1e293b; font-size: 18px; font-weight: bold; margin: 10px 0; }
            .summary { color: #64748b; margin: 10px 0; }
            .link { color: #667eea; text-decoration: none; }
            .footer { text-align: center; color: #64748b; margin-top: 30px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>📰 Your News Update from PulseAI</h1>
            <p>Here are your selected news articles</p>
        </div>
    """
    
    for article in articles:
        email_content += f"""
        <div class="article">
            <span class="source">{article.get('source', 'Unknown')}</span>
            <h2 class="title">{article.get('title', 'No Title')}</h2>
            <p class="summary">{article.get('summary', 'No summary available')}</p>
            <p><strong>Published:</strong> {article.get('published', 'Unknown date')}</p>
            <p><a href="{article.get('link', '#')}" class="link" target="_blank">Read Full Article →</a></p>
        </div>
        """
    
    email_content += """
        <div class="footer">
            <p>Powered by PulseAI - Intelligent News Without Overload</p>
            <p>This email was sent because you requested news updates through our platform.</p>
        </div>
    </body>
    </html>
    """
    
    return email_content

def format_articles_for_whatsapp(articles):
    """Format articles for WhatsApp message"""
    message = "📰 *Your News Update from PulseAI*\n\n"
    
    for i, article in enumerate(articles, 1):
        message += f"*{i}. {article.get('title', 'No Title')}*\n"
        message += f"📍 Source: {article.get('source', 'Unknown')}\n"
        message += f"📅 {article.get('published', 'Unknown date')}\n\n"
        message += f"{article.get('summary', 'No summary available')}\n\n"
        if article.get('link'):
            message += f"🔗 Read more: {article.get('link')}\n\n"
        message += "─────────────────\n\n"
    
    message += "Powered by PulseAI 🤖\n"
    message += "Intelligent News Without Overload"
    
    return message

@app.post("/send-email")
async def send_email(request: EmailRequest):
    try:
        # Email configuration from environment variables
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        sender_email = os.getenv("SENDER_EMAIL")
        sender_password = os.getenv("SENDER_PASSWORD")
        
        print(f"Debug - SENDER_EMAIL: {sender_email}")
        print(f"Debug - SENDER_PASSWORD exists: {bool(sender_password)}")
        print(f"Debug - SMTP_SERVER: {smtp_server}")
        print(f"Debug - SMTP_PORT: {smtp_port}")
        
        if not sender_email or not sender_password:
            raise HTTPException(
                status_code=500, 
                detail=f"Email configuration not found. SENDER_EMAIL: {bool(sender_email)}, SENDER_PASSWORD: {bool(sender_password)}"
            )
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"📰 News Update from PulseAI - {len(request.articles)} Articles"
        msg['From'] = sender_email
        msg['To'] = request.email
        
        # Create HTML content
        html_content = format_articles_for_email(request.articles)
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        # Send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(msg)
        
        return {
            "success": True,
            "message": f"Successfully sent {len(request.articles)} articles to {request.email}"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

@app.post("/send-whatsapp")
async def send_whatsapp(request: WhatsAppRequest):
    try:
        # WhatsApp API configuration from environment variables
        whatsapp_token = os.getenv("WHATSAPP_TOKEN")
        whatsapp_phone_id = os.getenv("WHATSAPP_PHONE_ID")
        
        # For testing purposes, if WhatsApp credentials are not configured,
        # we'll simulate the sending and save to a file instead
        if not whatsapp_token or not whatsapp_phone_id or whatsapp_token == "your_whatsapp_business_api_token":
            # Format message
            message_text = format_articles_for_whatsapp(request.articles)
            
            # Save to file for testing
            timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
            filename = f"whatsapp_message_{timestamp}.txt"
            
            try:
                with open(filename, 'w', encoding='utf-8') as f:
                    f.write(f"WhatsApp Message for: {request.whatsapp}\n")
                    f.write(f"Timestamp: {datetime.now()}\n")
                    f.write("="*50 + "\n\n")
                    f.write(message_text)
                
                return {
                    "success": True,
                    "message": f"WhatsApp simulation: Message saved to {filename}. {len(request.articles)} articles prepared for {request.whatsapp}",
                    "simulation": True
                }
            except Exception as e:
                print(f"Error saving WhatsApp simulation: {e}")
                return {
                    "success": True,
                    "message": f"WhatsApp simulation successful: {len(request.articles)} articles prepared for {request.whatsapp}",
                    "simulation": True
                }
        
        # Real WhatsApp API implementation
        # Format message
        message_text = format_articles_for_whatsapp(request.articles)
        
        # WhatsApp Business API endpoint
        url = f"https://graph.facebook.com/v17.0/{whatsapp_phone_id}/messages"
        
        headers = {
            "Authorization": f"Bearer {whatsapp_token}",
            "Content-Type": "application/json"
        }
        
        # Clean phone number (remove non-digits except +)
        phone_number = ''.join(c for c in request.whatsapp if c.isdigit() or c == '+')
        if not phone_number.startswith('+'):
            phone_number = '+' + phone_number
        
        payload = {
            "messaging_product": "whatsapp",
            "to": phone_number,
            "type": "text",
            "text": {
                "body": message_text
            }
        }
        
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code == 200:
            return {
                "success": True,
                "message": f"Successfully sent {len(request.articles)} articles to {request.whatsapp}"
            }
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"WhatsApp API error: {response.text}"
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send WhatsApp message: {str(e)}")


# Include other routers
app.include_router(router)
app.include_router(router2)
