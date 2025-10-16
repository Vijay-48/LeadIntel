import pandas as pd
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import asyncio
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def load_apollo_people_data():
    """Load Apollo people data from CSV"""
    print("Loading Apollo people data...")
    
    # Read the CSV
    df = pd.read_csv('apollo_people_data.csv')
    
    # Convert to records
    records = []
    for _, row in df.iterrows():
        record = {
            'data_source': 'apollo_csv',
            'enrichment_fields': {
                'email': row.get('Email', ''),
                'linkedin': row.get('LinkedIn URL', ''),
                'contact_number': row.get('Company Phone Number', ''),
                'company_name': row.get('Company Name', ''),
                'prospect_full_name': row.get('Full Name', ''),
            },
            'all_prospects': [{
                'name': row.get('Full Name', ''),
                'title': row.get('Job Title', ''),
                'first_name': row.get('First Name', ''),
                'last_name': row.get('Last Name', ''),
                'email': row.get('Email', ''),
                'email_status': row.get('Email Status', ''),
                'linkedin_id': row.get('LinkedIn URL', ''),
                'twitter': row.get('Twitter URL', ''),
                'facebook': row.get('Facebook URL', ''),
                'city': row.get('City', ''),
                'state': row.get('State', ''),
                'country': row.get('Country', ''),
            }],
            'company_name': row.get('Company Name', ''),
            'website': row.get('Company Website', ''),
            'industry': row.get('Industry', ''),
            'location': f"{row.get('City', '')}, {row.get('State', '')}, {row.get('Country', '')}".strip(', '),
            'employee_count': str(row.get('Employees', '')),
            'description': '',
            'company_details': {
                'logo_url': row.get('Company Logo URL', ''),
                'city': row.get('Company City', ''),
                'state': row.get('Company State', ''),
                'country': row.get('Company Country', ''),
                'linkedin_url': row.get('Company LinkedIn URL', ''),
                'twitter_url': row.get('Company Twitter URL', ''),
                'facebook_url': row.get('Company Facebook URL', ''),
                'phone_number': row.get('Company Phone Number', ''),
                'keywords': row.get('Keywords', ''),
            }
        }
        records.append(record)
    
    # Clear existing Apollo CSV data
    await db.enriched_data.delete_many({'data_source': 'apollo_csv'})
    
    # Insert new data
    if records:
        result = await db.enriched_data.insert_many(records)
        print(f"✅ Inserted {len(result.inserted_ids)} people records from Apollo CSV")
    
    return len(records)

async def load_apollo_companies_data():
    """Load Apollo companies data from the second CSV"""
    print("Loading Apollo companies data...")
    
    # Read the CSV
    df = pd.read_csv('apollo_companies_data.csv')
    
    # Convert to records
    records = []
    for _, row in df.iterrows():
        # Parse the data (seems to have some formatting issues)
        name = row.get('Name', '')
        title = row.get('Title', '')
        company = row.get('Company Name', '')
        industry = row.get('Industry', '')
        location = row.get('Company Location', '')
        employees = row.get('Employees', '')
        
        record = {
            'data_source': 'apollo_csv_companies',
            'enrichment_fields': {
                'email': '',
                'linkedin': '',
                'contact_number': '',
                'company_name': company,
                'prospect_full_name': name,
            },
            'all_prospects': [{
                'name': name,
                'title': title,
            }],
            'company_name': company,
            'website': '',
            'industry': industry,
            'location': location,
            'employee_count': str(employees),
            'description': '',
        }
        records.append(record)
    
    # Clear existing Apollo companies CSV data
    await db.enriched_data.delete_many({'data_source': 'apollo_csv_companies'})
    
    # Insert new data
    if records:
        result = await db.enriched_data.insert_many(records)
        print(f"✅ Inserted {len(result.inserted_ids)} company records from Apollo CSV")
    
    return len(records)

async def main():
    try:
        people_count = await load_apollo_people_data()
        companies_count = await load_apollo_companies_data()
        
        print(f"\n✅ Apollo CSV Data Loading Complete!")
        print(f"   - People records: {people_count}")
        print(f"   - Company records: {companies_count}")
        print(f"   - Total: {people_count + companies_count}")
        
    except Exception as e:
        print(f"❌ Error loading Apollo CSV data: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    asyncio.run(main())
