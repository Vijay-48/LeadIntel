"""
Data Loader Module - Loads and indexes data from JSON and CSV files into MongoDB
"""
import json
import pandas as pd
import logging
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime
import asyncio

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent / 'data'

class DataLoader:
    def __init__(self, db):
        self.db = db
        
    async def load_crunchbase_json_data(self):
        """Load Crunchbase JSON files into MongoDB"""
        try:
            # Load crunchbase-keyword-results.json
            keyword_file = DATA_DIR / 'crunchbase-keyword-results.json'
            if keyword_file.exists():
                logger.info("Loading crunchbase-keyword-results.json...")
                with open(keyword_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                # Process and insert data
                for item in data:
                    item['_data_source'] = 'crunchbase_keywords'
                    item['_loaded_at'] = datetime.utcnow().isoformat()
                    
                    # Upsert based on company id
                    await self.db.crunchbase_companies.update_one(
                        {'id': item.get('id')},
                        {'$set': item},
                        upsert=True
                    )
                logger.info(f"Loaded {len(data)} records from crunchbase-keyword-results.json")
            
            # Load crunchbase-company-profiles.json
            profiles_file = DATA_DIR / 'crunchbase-company-profiles.json'
            if profiles_file.exists():
                logger.info("Loading crunchbase-company-profiles.json...")
                with open(profiles_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                for item in data:
                    item['_data_source'] = 'crunchbase_profiles'
                    item['_loaded_at'] = datetime.utcnow().isoformat()
                    
                    # Upsert based on company id
                    await self.db.crunchbase_companies.update_one(
                        {'id': item.get('id')},
                        {'$set': item},
                        upsert=True
                    )
                logger.info(f"Loaded {len(data)} records from crunchbase-company-profiles.json")
            
            # Load large companies.json (process in chunks)
            # Handle both JSON array and newline-delimited JSON (NDJSON)
            companies_file = DATA_DIR / 'companies.json'
            if companies_file.exists():
                logger.info("Loading companies.json (large file)...")
                
                try:
                    # Try loading as JSON array first
                    with open(companies_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                except json.JSONDecodeError:
                    # If that fails, try loading as NDJSON (newline-delimited JSON)
                    logger.info("Loading as NDJSON (newline-delimited JSON)...")
                    data = []
                    with open(companies_file, 'r', encoding='utf-8') as f:
                        for line_num, line in enumerate(f, 1):
                            line = line.strip()
                            if line:
                                try:
                                    data.append(json.loads(line))
                                except json.JSONDecodeError as e:
                                    logger.warning(f"Skipping invalid JSON at line {line_num}: {str(e)}")
                                    continue
                    
                # Process in batches of 1000
                batch_size = 1000
                total_records = len(data)
                logger.info(f"Total records to process: {total_records}")
                
                for i in range(0, total_records, batch_size):
                    batch = data[i:i+batch_size]
                    for item in batch:
                        item['_data_source'] = 'crunchbase_companies'
                        item['_loaded_at'] = datetime.utcnow().isoformat()
                    
                    # Bulk insert
                    operations = [
                        {
                            'updateOne': {
                                'filter': {'id': item.get('id')},
                                'update': {'$set': item},
                                'upsert': True
                            }
                        }
                        for item in batch if item.get('id')
                    ]
                    if operations:
                        await self.db.crunchbase_companies.bulk_write(operations)
                    
                    logger.info(f"Processed {min(i+batch_size, total_records)}/{total_records} records from companies.json")
                
                logger.info(f"Loaded {total_records} records from companies.json")
                
        except Exception as e:
            logger.error(f"Error loading Crunchbase JSON data: {str(e)}")
            raise
    
    async def load_csv_data(self):
        """Load CSV files into MongoDB"""
        try:
            # Load companies.csv
            companies_csv = DATA_DIR / 'companies.csv'
            if companies_csv.exists():
                logger.info("Loading companies.csv...")
                df = pd.read_csv(companies_csv)
                # Replace NaN with None
                df = df.replace({pd.NA: None, pd.NaT: None})
                df = df.where(pd.notna(df), None)
                records = df.to_dict('records')
                
                for record in records:
                    record['_data_source'] = 'linkedin_companies'
                    record['_loaded_at'] = datetime.utcnow().isoformat()
                    
                    # Convert company_id to string for consistency
                    if 'company_id' in record and record['company_id'] is not None:
                        record['company_id'] = str(record['company_id'])
                    
                    if record.get('company_id') and record['company_id'] != 'None':
                        await self.db.linkedin_companies.update_one(
                            {'company_id': record.get('company_id')},
                            {'$set': record},
                            upsert=True
                        )
                logger.info(f"Loaded {len(records)} records from companies.csv")
            
            # Load company_industries.csv
            industries_csv = DATA_DIR / 'company_industries.csv'
            if industries_csv.exists():
                logger.info("Loading company_industries.csv...")
                df = pd.read_csv(industries_csv)
                df['company_id'] = df['company_id'].astype(str)
                
                # Group by company_id and aggregate industries
                grouped = df.groupby('company_id')['industry'].apply(list).reset_index()
                
                for _, row in grouped.iterrows():
                    await self.db.linkedin_companies.update_one(
                        {'company_id': row['company_id']},
                        {'$set': {'industries': row['industry']}},
                        upsert=False
                    )
                logger.info(f"Updated industries for companies")
            
            # Load company_specialities.csv
            specialities_csv = DATA_DIR / 'company_specialities.csv'
            if specialities_csv.exists():
                logger.info("Loading company_specialities.csv...")
                df = pd.read_csv(specialities_csv)
                df['company_id'] = df['company_id'].astype(str)
                
                # Group by company_id and aggregate specialities
                grouped = df.groupby('company_id')['speciality'].apply(list).reset_index()
                
                for _, row in grouped.iterrows():
                    await self.db.linkedin_companies.update_one(
                        {'company_id': row['company_id']},
                        {'$set': {'specialities': row['speciality']}},
                        upsert=False
                    )
                logger.info(f"Updated specialities for companies")
            
            # Load employee_counts.csv
            employees_csv = DATA_DIR / 'employee_counts.csv'
            if employees_csv.exists():
                logger.info("Loading employee_counts.csv...")
                df = pd.read_csv(employees_csv)
                df = df.replace({pd.NA: None, pd.NaT: None})
                df = df.where(pd.notna(df), None)
                df['company_id'] = df['company_id'].apply(lambda x: str(x) if x is not None else None)
                records = df.to_dict('records')
                
                for record in records:
                    if record.get('company_id') and record['company_id'] != 'None':
                        await self.db.linkedin_companies.update_one(
                            {'company_id': record['company_id']},
                            {'$set': {
                                'employee_count': record.get('employee_count'),
                                'follower_count': record.get('follower_count'),
                                'time_recorded': record.get('time_recorded')
                            }},
                            upsert=False
                        )
                logger.info(f"Updated employee counts for companies")
            
            # Load job_postings.csv
            jobs_csv = DATA_DIR / 'job_postings.csv'
            if jobs_csv.exists():
                logger.info("Loading job_postings.csv...")
                # Load in chunks due to large size
                chunk_size = 10000
                total_loaded = 0
                
                for chunk in pd.read_csv(jobs_csv, chunksize=chunk_size):
                    # Replace NaN with None for MongoDB compatibility
                    chunk = chunk.replace({pd.NA: None, pd.NaT: None})
                    chunk = chunk.where(pd.notna(chunk), None)
                    
                    # Convert IDs to string, handling NaN
                    chunk['company_id'] = chunk['company_id'].apply(lambda x: str(x) if x is not None and not pd.isna(x) else None)
                    chunk['job_id'] = chunk['job_id'].apply(lambda x: str(x) if x is not None and not pd.isna(x) else None)
                    
                    records = chunk.to_dict('records')
                    
                    for record in records:
                        record['_data_source'] = 'linkedin_jobs'
                        record['_loaded_at'] = datetime.utcnow().isoformat()
                    
                    # Bulk insert - only insert records with valid job_id
                    operations = [
                        {
                            'updateOne': {
                                'filter': {'job_id': record.get('job_id')},
                                'update': {'$set': record},
                                'upsert': True
                            }
                        }
                        for record in records if record.get('job_id') and record.get('job_id') != 'None'
                    ]
                    if operations:
                        await self.db.linkedin_jobs.bulk_write(operations)
                    
                    total_loaded += len(records)
                    if total_loaded % 50000 == 0:
                        logger.info(f"Loaded {total_loaded} job postings...")
                
                logger.info(f"Finished loading {total_loaded} records from job_postings.csv")
                
        except Exception as e:
            logger.error(f"Error loading CSV data: {str(e)}")
            raise
    
    async def create_indexes(self):
        """Create indexes for faster searching"""
        try:
            logger.info("Creating database indexes...")
            
            # Crunchbase companies indexes
            await self.db.crunchbase_companies.create_index('name')
            await self.db.crunchbase_companies.create_index('id')
            await self.db.crunchbase_companies.create_index('contact_email')
            await self.db.crunchbase_companies.create_index('website')
            
            # LinkedIn companies indexes
            await self.db.linkedin_companies.create_index('company_id')
            await self.db.linkedin_companies.create_index('name')
            await self.db.linkedin_companies.create_index('industries')
            await self.db.linkedin_companies.create_index('city')
            await self.db.linkedin_companies.create_index('country')
            
            # LinkedIn jobs indexes
            await self.db.linkedin_jobs.create_index('job_id')
            await self.db.linkedin_jobs.create_index('company_id')
            await self.db.linkedin_jobs.create_index('title')
            await self.db.linkedin_jobs.create_index('location')
            
            logger.info("Indexes created successfully")
            
        except Exception as e:
            logger.error(f"Error creating indexes: {str(e)}")
            raise
    
    async def load_all_data(self):
        """Load all data sources"""
        try:
            logger.info("Starting data load process...")
            
            # Check if data is already loaded
            crunchbase_count = await self.db.crunchbase_companies.count_documents({})
            linkedin_count = await self.db.linkedin_companies.count_documents({})
            
            if crunchbase_count > 0 and linkedin_count > 0:
                logger.info(f"Data already loaded: {crunchbase_count} Crunchbase companies, {linkedin_count} LinkedIn companies")
                return
            
            await self.load_crunchbase_json_data()
            await self.load_csv_data()
            await self.create_indexes()
            
            logger.info("Data load process completed successfully")
            
        except Exception as e:
            logger.error(f"Error in load_all_data: {str(e)}")
            raise
