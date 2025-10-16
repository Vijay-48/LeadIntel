#!/usr/bin/env python3
"""
Backend Test Suite for LeadIntel Enrichment Search Functionality
Tests the enrichment search endpoints with various filters and validates response structure
"""

import requests
import json
import sys
import os
from datetime import datetime

# Get backend URL from environment
BACKEND_URL = "https://backend-debug-5.preview.emergentagent.com/api"

class LeadIntelTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_results = []
        self.failed_tests = []
        
    def log_test(self, test_name, status, details=""):
        """Log test results"""
        result = {
            "test": test_name,
            "status": status,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        if status == "FAIL":
            self.failed_tests.append(result)
            
        print(f"[{status}] {test_name}: {details}")
    
    def test_data_status(self):
        """Test GET /api/data/status endpoint"""
        try:
            response = requests.get(f"{self.base_url}/data/status", timeout=30)
            
            if response.status_code != 200:
                self.log_test("Data Status Endpoint", "FAIL", f"Status code: {response.status_code}")
                return False
                
            data = response.json()
            
            # Validate response structure
            required_fields = ["status", "crunchbase_companies", "linkedin_companies"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                self.log_test("Data Status Endpoint", "FAIL", f"Missing fields: {missing_fields}")
                return False
            
            # Check if data is loaded
            if data["status"] != "loaded":
                self.log_test("Data Status Endpoint", "WARN", f"Status: {data['status']}, may need data loading")
            
            # Log counts
            cb_count = data["crunchbase_companies"]
            li_count = data["linkedin_companies"]
            
            self.log_test("Data Status Endpoint", "PASS", 
                         f"Status: {data['status']}, Crunchbase: {cb_count}, LinkedIn: {li_count}")
            
            return True
            
        except Exception as e:
            self.log_test("Data Status Endpoint", "FAIL", f"Exception: {str(e)}")
            return False
    
    def test_enrichment_search_by_company_name(self):
        """Test enrichment search by company name"""
        try:
            payload = {
                "query": "Apple",
                "limit": 10
            }
            
            response = requests.post(f"{self.base_url}/enrichment/search", 
                                   json=payload, timeout=30)
            
            if response.status_code != 200:
                self.log_test("Enrichment Search - Company Name", "FAIL", 
                             f"Status code: {response.status_code}, Response: {response.text}")
                return False
            
            data = response.json()
            
            # Validate response structure
            if "results" not in data or "count" not in data:
                self.log_test("Enrichment Search - Company Name", "FAIL", 
                             "Missing 'results' or 'count' in response")
                return False
            
            results = data["results"]
            count = data["count"]
            
            if count == 0:
                self.log_test("Enrichment Search - Company Name", "WARN", 
                             "No results found for 'Apple'")
                return True
            
            # Validate enrichment fields in first result
            if results:
                result = results[0]
                success = self.validate_enrichment_fields(result, "Apple search")
                if success:
                    self.log_test("Enrichment Search - Company Name", "PASS", 
                                 f"Found {count} results with proper enrichment fields")
                return success
            
            return True
            
        except Exception as e:
            self.log_test("Enrichment Search - Company Name", "FAIL", f"Exception: {str(e)}")
            return False
    
    def test_enrichment_search_by_industry(self):
        """Test enrichment search by industry"""
        try:
            payload = {
                "industry": "Technology",
                "limit": 10
            }
            
            response = requests.post(f"{self.base_url}/enrichment/search", 
                                   json=payload, timeout=30)
            
            if response.status_code != 200:
                self.log_test("Enrichment Search - Industry", "FAIL", 
                             f"Status code: {response.status_code}, Response: {response.text}")
                return False
            
            data = response.json()
            results = data.get("results", [])
            count = data.get("count", 0)
            
            if count == 0:
                self.log_test("Enrichment Search - Industry", "WARN", 
                             "No results found for 'Technology' industry")
                return True
            
            # Validate enrichment fields in first result
            if results:
                result = results[0]
                success = self.validate_enrichment_fields(result, "Technology industry search")
                if success:
                    self.log_test("Enrichment Search - Industry", "PASS", 
                                 f"Found {count} results with proper enrichment fields")
                return success
            
            return True
            
        except Exception as e:
            self.log_test("Enrichment Search - Industry", "FAIL", f"Exception: {str(e)}")
            return False
    
    def test_enrichment_search_by_location(self):
        """Test enrichment search by location"""
        try:
            payload = {
                "location": "California",
                "limit": 10
            }
            
            response = requests.post(f"{self.base_url}/enrichment/search", 
                                   json=payload, timeout=30)
            
            if response.status_code != 200:
                self.log_test("Enrichment Search - Location", "FAIL", 
                             f"Status code: {response.status_code}, Response: {response.text}")
                return False
            
            data = response.json()
            results = data.get("results", [])
            count = data.get("count", 0)
            
            if count == 0:
                self.log_test("Enrichment Search - Location", "WARN", 
                             "No results found for 'California' location")
                return True
            
            # Validate enrichment fields in first result
            if results:
                result = results[0]
                success = self.validate_enrichment_fields(result, "California location search")
                if success:
                    self.log_test("Enrichment Search - Location", "PASS", 
                                 f"Found {count} results with proper enrichment fields")
                return success
            
            return True
            
        except Exception as e:
            self.log_test("Enrichment Search - Location", "FAIL", f"Exception: {str(e)}")
            return False
    
    def test_enrichment_search_combined(self):
        """Test enrichment search with combined filters"""
        try:
            payload = {
                "query": "Data",
                "industry": "Software",
                "location": "New York",
                "limit": 5
            }
            
            response = requests.post(f"{self.base_url}/enrichment/search", 
                                   json=payload, timeout=30)
            
            if response.status_code != 200:
                self.log_test("Enrichment Search - Combined", "FAIL", 
                             f"Status code: {response.status_code}, Response: {response.text}")
                return False
            
            data = response.json()
            results = data.get("results", [])
            count = data.get("count", 0)
            
            if count == 0:
                self.log_test("Enrichment Search - Combined", "WARN", 
                             "No results found for combined search")
                return True
            
            # Validate enrichment fields in first result
            if results:
                result = results[0]
                success = self.validate_enrichment_fields(result, "Combined search")
                if success:
                    self.log_test("Enrichment Search - Combined", "PASS", 
                                 f"Found {count} results with proper enrichment fields")
                return success
            
            return True
            
        except Exception as e:
            self.log_test("Enrichment Search - Combined", "FAIL", f"Exception: {str(e)}")
            return False
    
    def validate_enrichment_fields(self, result, test_context):
        """Validate enrichment fields in a result"""
        try:
            # Check for enrichment_fields structure
            if "enrichment_fields" not in result:
                self.log_test(f"Enrichment Fields Validation - {test_context}", "FAIL", 
                             "Missing 'enrichment_fields' in result")
                return False
            
            enrichment_fields = result["enrichment_fields"]
            
            # Required enrichment fields
            required_fields = [
                "email", "linkedin", "contact_number", 
                "company_name", "prospect_full_name"
            ]
            
            missing_fields = [field for field in required_fields if field not in enrichment_fields]
            
            if missing_fields:
                self.log_test(f"Enrichment Fields Validation - {test_context}", "FAIL", 
                             f"Missing enrichment fields: {missing_fields}")
                return False
            
            # Check additional fields
            additional_fields = [
                "all_emails", "all_linkedin_profiles", "all_prospects",
                "website", "industry", "location", "employee_count", 
                "description", "data_source"
            ]
            
            missing_additional = [field for field in additional_fields if field not in result]
            
            if missing_additional:
                self.log_test(f"Additional Fields Validation - {test_context}", "WARN", 
                             f"Missing additional fields: {missing_additional}")
            
            # Validate data_source
            if result.get("data_source") not in ["crunchbase", "linkedin"]:
                self.log_test(f"Data Source Validation - {test_context}", "FAIL", 
                             f"Invalid data_source: {result.get('data_source')}")
                return False
            
            self.log_test(f"Enrichment Fields Validation - {test_context}", "PASS", 
                         "All required enrichment fields present")
            return True
            
        except Exception as e:
            self.log_test(f"Enrichment Fields Validation - {test_context}", "FAIL", 
                         f"Exception: {str(e)}")
            return False
    
    def test_data_load_if_needed(self):
        """Test data loading if no data is present"""
        try:
            # First check status
            status_response = requests.get(f"{self.base_url}/data/status", timeout=30)
            if status_response.status_code == 200:
                status_data = status_response.json()
                if status_data.get("status") == "empty":
                    # Try to load data
                    load_response = requests.post(f"{self.base_url}/data/load", timeout=120)
                    if load_response.status_code == 200:
                        self.log_test("Data Loading", "PASS", "Data loaded successfully")
                        return True
                    else:
                        self.log_test("Data Loading", "FAIL", 
                                     f"Load failed with status: {load_response.status_code}")
                        return False
                else:
                    self.log_test("Data Loading", "SKIP", "Data already loaded")
                    return True
            
            return False
            
        except Exception as e:
            self.log_test("Data Loading", "FAIL", f"Exception: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print(f"Starting LeadIntel Backend Tests at {datetime.now()}")
        print(f"Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Test sequence
        tests = [
            ("Data Status Check", self.test_data_status),
            ("Data Load (if needed)", self.test_data_load_if_needed),
            ("Search by Company Name", self.test_enrichment_search_by_company_name),
            ("Search by Industry", self.test_enrichment_search_by_industry),
            ("Search by Location", self.test_enrichment_search_by_location),
            ("Combined Search", self.test_enrichment_search_combined),
        ]
        
        passed = 0
        failed = 0
        warnings = 0
        
        for test_name, test_func in tests:
            print(f"\nRunning: {test_name}")
            try:
                result = test_func()
                if result:
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                self.log_test(test_name, "FAIL", f"Unexpected error: {str(e)}")
                failed += 1
        
        # Count warnings
        warnings = len([r for r in self.test_results if r["status"] == "WARN"])
        
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {len(tests)}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        print(f"Warnings: {warnings}")
        
        if self.failed_tests:
            print("\nFAILED TESTS:")
            for test in self.failed_tests:
                print(f"- {test['test']}: {test['details']}")
        
        return failed == 0

def main():
    """Main test runner"""
    tester = LeadIntelTester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/test_results_detailed.json', 'w') as f:
        json.dump(tester.test_results, f, indent=2)
    
    print(f"\nDetailed results saved to: /app/test_results_detailed.json")
    
    if success:
        print("\n✅ All tests passed!")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()