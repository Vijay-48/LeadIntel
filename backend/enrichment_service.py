"""
Enrichment Service - Combines data from multiple sources to provide comprehensive enrichment
"""
import logging
from typing import List, Dict, Optional
import re
import math
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

def clean_json_data(data):
    """Remove NaN, Infinity, and ObjectId from data for JSON serialization"""
    if isinstance(data, dict):
        cleaned = {}
        for key, value in data.items():
            if key == '_id':
                continue  # Skip MongoDB ObjectId
            cleaned[key] = clean_json_data(value)
        return cleaned
    elif isinstance(data, list):
        return [clean_json_data(item) for item in data]
    elif isinstance(data, float):
        if math.isnan(data) or math.isinf(data):
            return None
        return data
    else:
        return data

class EnrichmentService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
    
    async def search_companies(self, 
                               query: str = None,
                               industry: str = None,
                               location: str = None,
                               min_employees: int = None,
                               max_employees: int = None,
                               limit: int = 50) -> List[Dict]:
        """
        Search companies across all data sources with multiple filters
        """
        try:
            results = []
            
            # Search in Apollo CSV data (new enriched data)
            apollo_filter = {}
            if query:
                apollo_filter['$or'] = [
                    {'company_name': {'$regex': query, '$options': 'i'}},
                    {'website': {'$regex': query, '$options': 'i'}},
                    {'enrichment_fields.company_name': {'$regex': query, '$options': 'i'}},
                    {'all_prospects.name': {'$regex': query, '$options': 'i'}},
                ]
            
            if industry:
                apollo_filter['industry'] = {'$regex': industry, '$options': 'i'}
            
            if location:
                apollo_filter['$or'] = apollo_filter.get('$or', []) + [
                    {'location': {'$regex': location, '$options': 'i'}},
                ]
            
            # Query enriched_data collection for Apollo CSV data
            apollo_data = await self.db.enriched_data.find(
                {'data_source': {'$in': ['apollo_csv', 'apollo_csv_companies']}, **apollo_filter}
            ).limit(limit // 3).to_list(length=limit // 3)
            
            # Apollo CSV data is already in enriched format, clean ObjectId and add to results
            for item in apollo_data:
                # Remove MongoDB _id field
                if '_id' in item:
                    del item['_id']
                results.append(item)
            
            # Search in Crunchbase data
            crunchbase_filter = {}
            if query:
                # Case-insensitive regex search on name, about, or website
                crunchbase_filter['$or'] = [
                    {'name': {'$regex': query, '$options': 'i'}},
                    {'about': {'$regex': query, '$options': 'i'}},
                    {'website': {'$regex': query, '$options': 'i'}}
                ]
            
            if industry:
                crunchbase_filter['industries.value'] = {'$regex': industry, '$options': 'i'}
            
            if location:
                crunchbase_filter['$or'] = crunchbase_filter.get('$or', []) + [
                    {'region': {'$regex': location, '$options': 'i'}},
                    {'address': {'$regex': location, '$options': 'i'}},
                    {'country_code': {'$regex': location, '$options': 'i'}}
                ]
            
            crunchbase_companies = await self.db.crunchbase_companies.find(
                crunchbase_filter
            ).limit(limit // 3).to_list(length=limit // 3)
            
            # Process Crunchbase results
            for company in crunchbase_companies:
                enriched = await self.enrich_company_data(company, 'crunchbase')
                results.append(enriched)
            
            # Search in LinkedIn data
            linkedin_filter = {}
            if query:
                linkedin_filter['$or'] = [
                    {'name': {'$regex': query, '$options': 'i'}},
                    {'description': {'$regex': query, '$options': 'i'}},
                    {'url': {'$regex': query, '$options': 'i'}}
                ]
            
            if industry:
                linkedin_filter['industries'] = {'$regex': industry, '$options': 'i'}
            
            if location:
                linkedin_filter['$or'] = linkedin_filter.get('$or', []) + [
                    {'city': {'$regex': location, '$options': 'i'}},
                    {'state': {'$regex': location, '$options': 'i'}},
                    {'country': {'$regex': location, '$options': 'i'}}
                ]
            
            linkedin_companies = await self.db.linkedin_companies.find(
                linkedin_filter
            ).limit(limit // 3).to_list(length=limit // 3)
            
            # Process LinkedIn results
            for company in linkedin_companies:
                enriched = await self.enrich_company_data(company, 'linkedin')
                results.append(enriched)
            
            # Remove duplicates based on company name
            seen_names = set()
            unique_results = []
            for result in results:
                name_lower = result.get('company_name', '').lower()
                if name_lower and name_lower not in seen_names:
                    seen_names.add(name_lower)
                    unique_results.append(result)
            
            return unique_results[:limit]
            
        except Exception as e:
            logger.error(f"Error in search_companies: {str(e)}")
            return []
    
    async def enrich_company_data(self, company: Dict, source: str) -> Dict:
        """
        Enrich company data by extracting and normalizing fields in order:
        1. Email
        2. LinkedIn
        3. Contact Number
        4. Company Name
        5. Prospect Full Name
        """
        try:
            enriched = {
                'data_source': source,
                'enrichment_fields': {}
            }
            
            # 1. Email extraction
            emails = []
            if source == 'crunchbase':
                if company.get('contact_email'):
                    emails.append(company['contact_email'])
                
                # Extract emails from contacts
                contacts = company.get('contacts', [])
                for contact in contacts:
                    if contact.get('name'):
                        # Generate potential email from name and domain
                        name = contact['name'].lower().replace(' ', '.')
                        if company.get('website'):
                            domain = self._extract_domain(company['website'])
                            if domain:
                                emails.append(f"{name}@{domain}")
            
            enriched['enrichment_fields']['email'] = emails[0] if emails else None
            enriched['all_emails'] = list(set(emails))  # Remove duplicates
            
            # 2. LinkedIn extraction
            linkedin_profiles = []
            if source == 'crunchbase':
                social_links = company.get('social_media_links', [])
                for link in social_links:
                    if 'linkedin.com' in link:
                        linkedin_profiles.append(link)
                
                # Extract LinkedIn IDs from contacts
                contacts = company.get('contacts', [])
                for contact in contacts:
                    linkedin_id = contact.get('linkedin_id')
                    if linkedin_id:
                        linkedin_profiles.append(f"https://www.linkedin.com/in/{linkedin_id}")
            
            elif source == 'linkedin':
                if company.get('url'):
                    linkedin_profiles.append(company['url'])
            
            enriched['enrichment_fields']['linkedin'] = linkedin_profiles[0] if linkedin_profiles else None
            enriched['all_linkedin_profiles'] = list(set(linkedin_profiles))
            
            # 3. Contact Number
            contact_numbers = []
            if source == 'crunchbase':
                if company.get('contact_phone'):
                    contact_numbers.append(company['contact_phone'])
            
            enriched['enrichment_fields']['contact_number'] = contact_numbers[0] if contact_numbers else None
            enriched['all_contact_numbers'] = contact_numbers
            
            # 4. Company Name
            company_name = None
            if source == 'crunchbase':
                company_name = company.get('name') or company.get('legal_name')
            elif source == 'linkedin':
                company_name = company.get('name')
            
            enriched['enrichment_fields']['company_name'] = company_name
            enriched['company_name'] = company_name
            
            # 5. Prospect Full Name
            prospect_names = []
            if source == 'crunchbase':
                # Extract from contacts
                contacts = company.get('contacts', [])
                for contact in contacts:
                    if contact.get('name'):
                        prospect_names.append({
                            'name': contact['name'],
                            'title': contact.get('job_title'),
                            'linkedin_id': contact.get('linkedin_id'),
                            'departments': contact.get('departments', [])
                        })
                
                # Extract from current_employees
                employees = company.get('current_employees', [])
                for emp in employees:
                    if emp.get('name'):
                        prospect_names.append({
                            'name': emp['name'],
                            'title': emp.get('title'),
                            'permalink': emp.get('permalink')
                        })
            
            enriched['enrichment_fields']['prospect_full_name'] = prospect_names[0]['name'] if prospect_names else None
            enriched['all_prospects'] = prospect_names
            
            # Additional enrichment fields
            enriched['website'] = company.get('website') or company.get('url')
            enriched['industry'] = self._extract_industry(company, source)
            enriched['location'] = self._extract_location(company, source)
            enriched['employee_count'] = self._extract_employee_count(company, source)
            enriched['description'] = company.get('about') or company.get('description')
            enriched['founded_date'] = company.get('founded_date')
            enriched['social_media'] = company.get('social_media_links', [])
            
            # Additional fields from source
            if source == 'crunchbase':
                enriched['funding'] = company.get('funding')
                enriched['cb_rank'] = company.get('cb_rank')
                enriched['operating_status'] = company.get('operating_status')
                enriched['founders'] = company.get('founders', [])
            
            elif source == 'linkedin':
                enriched['company_size'] = company.get('company_size')
                enriched['specialities'] = company.get('specialities', [])
                enriched['follower_count'] = company.get('follower_count')
                enriched['address'] = company.get('address')
                enriched['zip_code'] = company.get('zip_code')
            
            # Sanitize all float values to prevent JSON serialization errors
            enriched = self._sanitize_data(enriched)
            
            return enriched
            
        except Exception as e:
            logger.error(f"Error enriching company data: {str(e)}")
            return {'error': str(e)}
    
    def _extract_domain(self, url: str) -> Optional[str]:
        """Extract domain from URL"""
        try:
            if not url:
                return None
            # Remove protocol and www
            domain = re.sub(r'https?://(www\.)?', '', url)
            # Get just the domain part
            domain = domain.split('/')[0]
            return domain
        except:
            return None
    
    def _extract_industry(self, company: Dict, source: str) -> Optional[str]:
        """Extract industry information"""
        if source == 'crunchbase':
            industries = company.get('industries', [])
            if industries and isinstance(industries, list):
                return ', '.join([ind.get('value', '') for ind in industries if ind.get('value')])
        elif source == 'linkedin':
            industries = company.get('industries', [])
            if industries:
                return ', '.join(industries) if isinstance(industries, list) else industries
        return None
    
    def _extract_location(self, company: Dict, source: str) -> Optional[str]:
        """Extract location information"""
        if source == 'crunchbase':
            return company.get('address')
        elif source == 'linkedin':
            parts = []
            if company.get('city'):
                parts.append(company['city'])
            if company.get('state'):
                parts.append(company['state'])
            if company.get('country'):
                parts.append(company['country'])
            return ', '.join(parts) if parts else None
        return None
    
    def _extract_employee_count(self, company: Dict, source: str) -> Optional[str]:
        """Extract employee count"""
        if source == 'crunchbase':
            return company.get('num_employees')
        elif source == 'linkedin':
            emp_count = company.get('employee_count')
            return str(emp_count) if emp_count else company.get('company_size')
        return None
    
    async def get_company_jobs(self, company_id: str = None, company_name: str = None) -> List[Dict]:
        """Get job postings for a company"""
        try:
            query = {}
            if company_id:
                query['company_id'] = company_id
            elif company_name:
                query['company_name'] = {'$regex': company_name, '$options': 'i'}
            
            jobs = await self.db.linkedin_jobs.find(query).to_list(length=100)
            
            # Clean up job data
            cleaned_jobs = []
            for job in jobs:
                job.pop('_id', None)
                job.pop('_data_source', None)
                job.pop('_loaded_at', None)
                cleaned_jobs.append(job)
            
            return cleaned_jobs
            
        except Exception as e:
            logger.error(f"Error getting company jobs: {str(e)}")
            return []
    
    def _sanitize_data(self, data):
        """Sanitize data to prevent JSON serialization errors with NaN/Infinity values"""
        if isinstance(data, dict):
            return {k: self._sanitize_data(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self._sanitize_data(item) for item in data]
        elif isinstance(data, float):
            if math.isnan(data) or math.isinf(data):
                return None
            return data
        else:
            return data
