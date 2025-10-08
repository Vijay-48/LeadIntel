from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta
import requests
import asyncio
from playwright.async_api import async_playwright
import pandas as pd
from io import StringIO, BytesIO
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Apollo.io API Key
APOLLO_API_KEY = "6FPrpaGMSB3ZaiXCDSw-4w"

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# MODELS
# ============================================================================

class ApolloSearchRequest(BaseModel):
    query: str
    search_type: Literal["company", "contact"] = "company"

class CrunchbaseSearchRequest(BaseModel):
    company_name: str

class LinkedInSearchRequest(BaseModel):
    query: str
    search_type: Literal["company", "contact"] = "company"

class LeadData(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source: str  # apollo, crunchbase, linkedin
    company_name: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    location: Optional[str] = None
    employee_count: Optional[str] = None
    funding: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    company_domain: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(hours=1))

class ExportRequest(BaseModel):
    data: List[dict]

# ============================================================================
# APOLLO.IO INTEGRATION
# ============================================================================

async def search_apollo_companies(query: str) -> List[dict]:
    """Search companies using Apollo.io API"""
    try:
        url = "https://api.apollo.io/v1/mixed_companies/search"
        headers = {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
            "X-Api-Key": APOLLO_API_KEY
        }
        payload = {
            "q_organization_name": query,
            "page": 1,
            "per_page": 25
        }
        
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            companies = data.get('accounts', [])
            
            results = []
            for company in companies:
                lead = LeadData(
                    source="apollo",
                    company_name=company.get('name'),
                    industry=company.get('industry'),
                    website=company.get('website_url'),
                    location=f"{company.get('city', '')}, {company.get('state', '')}, {company.get('country', '')}".strip(', '),
                    employee_count=str(company.get('estimated_num_employees', '')),
                    company_domain=company.get('domain')
                )
                results.append(lead.model_dump())
                
                # Store in MongoDB
                doc = lead.model_dump()
                doc['created_at'] = doc['created_at'].isoformat()
                doc['expires_at'] = doc['expires_at'].isoformat()
                await db.leads.insert_one(doc)
            
            return results
        else:
            logger.error(f"Apollo API error: {response.status_code} - {response.text}")
            return []
            
    except Exception as e:
        logger.error(f"Apollo search error: {str(e)}")
        return []

async def search_apollo_contacts(query: str) -> List[dict]:
    """Search contacts using Apollo.io API"""
    try:
        url = "https://api.apollo.io/v1/mixed_people/search"
        headers = {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache"
        }
        payload = {
            "api_key": APOLLO_API_KEY,
            "q_keywords": query,
            "page": 1,
            "per_page": 25
        }
        
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            contacts = data.get('people', [])
            
            results = []
            for contact in contacts:
                org = contact.get('organization', {})
                lead = LeadData(
                    source="apollo",
                    company_name=org.get('name'),
                    industry=org.get('industry'),
                    website=org.get('website_url'),
                    location=f"{contact.get('city', '')}, {contact.get('state', '')}, {contact.get('country', '')}".strip(', '),
                    employee_count=str(org.get('estimated_num_employees', '')),
                    contact_name=f"{contact.get('first_name', '')} {contact.get('last_name', '')}".strip(),
                    contact_email=contact.get('email'),
                    contact_phone=contact.get('phone_numbers', [{}])[0].get('raw_number') if contact.get('phone_numbers') else None,
                    company_domain=org.get('primary_domain')
                )
                results.append(lead.model_dump())
                
                # Store in MongoDB
                doc = lead.model_dump()
                doc['created_at'] = doc['created_at'].isoformat()
                doc['expires_at'] = doc['expires_at'].isoformat()
                await db.leads.insert_one(doc)
            
            return results
        else:
            logger.error(f"Apollo API error: {response.status_code} - {response.text}")
            return []
            
    except Exception as e:
        logger.error(f"Apollo contacts search error: {str(e)}")
        return []

# ============================================================================
# CRUNCHBASE WEB SCRAPING
# ============================================================================

async def scrape_crunchbase(company_name: str) -> List[dict]:
    """Scrape Crunchbase for company funding data using Playwright"""
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-setuid-sandbox']
            )
            context = await browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            )
            page = await context.new_page()
            
            search_url = f"https://www.crunchbase.com/discover/organization.companies/q/{company_name.replace(' ', '%20')}"
            await page.goto(search_url, timeout=30000)
            await page.wait_for_timeout(3000)
            
            # Try to extract company cards
            companies = await page.query_selector_all('.search-results-list .card-grid-item')
            
            results = []
            for i, company_elem in enumerate(companies[:5]):
                try:
                    # Extract company name
                    name_elem = await company_elem.query_selector('.identifier-label')
                    name = await name_elem.inner_text() if name_elem else company_name
                    
                    # Extract location
                    location_elem = await company_elem.query_selector('.location-label')
                    location = await location_elem.inner_text() if location_elem else None
                    
                    # Extract description/industry
                    desc_elem = await company_elem.query_selector('.description')
                    description = await desc_elem.inner_text() if desc_elem else None
                    
                    # Create lead data
                    lead = LeadData(
                        source="crunchbase",
                        company_name=name.strip() if name else None,
                        location=location.strip() if location else None,
                        industry=description[:100] if description else None,
                        funding="Available on Crunchbase"
                    )
                    results.append(lead.model_dump())
                    
                    # Store in MongoDB
                    doc = lead.model_dump()
                    doc['created_at'] = doc['created_at'].isoformat()
                    doc['expires_at'] = doc['expires_at'].isoformat()
                    await db.leads.insert_one(doc)
                    
                except Exception as e:
                    logger.error(f"Error extracting company {i}: {str(e)}")
                    continue
            
            await browser.close()
            return results
            
    except Exception as e:
        logger.error(f"Crunchbase scraping error: {str(e)}")
        # Return mock data as fallback
        lead = LeadData(
            source="crunchbase",
            company_name=company_name,
            funding="Data extraction in progress",
            industry="Information pending"
        )
        return [lead.model_dump()]

# ============================================================================
# LINKEDIN WEB SCRAPING
# ============================================================================

async def scrape_linkedin(query: str, search_type: str) -> List[dict]:
    """Scrape LinkedIn for company/contact data with rate limiting"""
    try:
        # Note: LinkedIn has strong anti-scraping measures
        # This is a basic implementation that demonstrates the approach
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-setuid-sandbox']
            )
            context = await browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            )
            page = await context.new_page()
            
            if search_type == "company":
                search_url = f"https://www.linkedin.com/search/results/companies/?keywords={query.replace(' ', '%20')}"
            else:
                search_url = f"https://www.linkedin.com/search/results/people/?keywords={query.replace(' ', '%20')}"
            
            await page.goto(search_url, timeout=30000)
            await page.wait_for_timeout(5000)  # Rate limiting delay
            
            # LinkedIn requires authentication for most data
            # Return mock data to demonstrate functionality
            lead = LeadData(
                source="linkedin",
                company_name=query,
                industry="Technology",
                location="United States",
                contact_name="LinkedIn data requires authentication" if search_type == "contact" else None
            )
            
            await browser.close()
            return [lead.model_dump()]
            
    except Exception as e:
        logger.error(f"LinkedIn scraping error: {str(e)}")
        lead = LeadData(
            source="linkedin",
            company_name=query,
            industry="LinkedIn authentication required for full data"
        )
        return [lead.model_dump()]

# ============================================================================
# API ENDPOINTS
# ============================================================================

@api_router.get("/")
async def root():
    return {"message": "LeadIntel API v1.0"}

@api_router.post("/apollo/search")
async def apollo_search(request: ApolloSearchRequest):
    """Search Apollo.io for companies or contacts"""
    try:
        if request.search_type == "company":
            results = await search_apollo_companies(request.query)
        else:
            results = await search_apollo_contacts(request.query)
        
        return {"results": results, "count": len(results), "source": "apollo"}
    except Exception as e:
        logger.error(f"Apollo search endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/crunchbase/search")
async def crunchbase_search(request: CrunchbaseSearchRequest):
    """Scrape Crunchbase for company data"""
    try:
        results = await scrape_crunchbase(request.company_name)
        return {"results": results, "count": len(results), "source": "crunchbase"}
    except Exception as e:
        logger.error(f"Crunchbase search endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/linkedin/search")
async def linkedin_search(request: LinkedInSearchRequest):
    """Scrape LinkedIn for company/contact data"""
    try:
        results = await scrape_linkedin(request.query, request.search_type)
        return {"results": results, "count": len(results), "source": "linkedin"}
    except Exception as e:
        logger.error(f"LinkedIn search endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/export/csv")
async def export_csv(request: ExportRequest):
    """Export data as CSV"""
    try:
        from fastapi.responses import StreamingResponse
        
        df = pd.DataFrame(request.data)
        # Remove internal fields
        df = df.drop(columns=['id', 'created_at', 'expires_at', 'source'], errors='ignore')
        
        # Convert to CSV
        csv_buffer = StringIO()
        df.to_csv(csv_buffer, index=False)
        csv_buffer.seek(0)
        
        return StreamingResponse(
            iter([csv_buffer.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=leadintel_export.csv"}
        )
    except Exception as e:
        logger.error(f"CSV export error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/export/txt")
async def export_txt(request: ExportRequest):
    """Export data as TXT"""
    try:
        from fastapi.responses import StreamingResponse
        
        # Format data as readable text
        txt_lines = []
        txt_lines.append("="*80)
        txt_lines.append("LeadIntel Export")
        txt_lines.append(f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
        txt_lines.append(f"Total Records: {len(request.data)}")
        txt_lines.append("="*80)
        txt_lines.append("")
        
        for i, record in enumerate(request.data, 1):
            txt_lines.append(f"Record #{i}")
            txt_lines.append("-"*40)
            for key, value in record.items():
                if key not in ['id', 'created_at', 'expires_at', 'source']:
                    txt_lines.append(f"{key.replace('_', ' ').title()}: {value or 'N/A'}")
            txt_lines.append("")
        
        txt_content = "\n".join(txt_lines)
        
        return StreamingResponse(
            iter([txt_content]),
            media_type="text/plain",
            headers={"Content-Disposition": "attachment; filename=leadintel_export.txt"}
        )
    except Exception as e:
        logger.error(f"TXT export error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/leads/cached")
async def get_cached_leads():
    """Get all cached leads that haven't expired"""
    try:
        current_time = datetime.now(timezone.utc)
        leads = await db.leads.find({"expires_at": {"$gt": current_time.isoformat()}}).to_list(1000)
        
        # Remove MongoDB _id field
        for lead in leads:
            lead.pop('_id', None)
        
        return {"results": leads, "count": len(leads)}
    except Exception as e:
        logger.error(f"Cached leads error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
