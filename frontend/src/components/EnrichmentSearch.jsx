import { useState, useEffect } from "react";
import axios from "axios";
import { SearchComponent } from "@/components/ui/search-bar";
import { HoverEffect } from "@/components/ui/hover-effect";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Building2, MapPin, Briefcase, Download, Loader2, Filter } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EnrichmentSearch = () => {
  const [searchFilters, setSearchFilters] = useState({
    query: "",
    industry: "",
    location: "",
    limit: 50
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [dataStatus, setDataStatus] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);

  useEffect(() => {
    checkDataStatus();
  }, []);

  const checkDataStatus = async () => {
    try {
      const response = await axios.get(`${API}/data/status`);
      setDataStatus(response.data);
      
      if (response.data.status === 'empty') {
        toast.info("Loading data files... This may take a few minutes on first run.");
        await axios.post(`${API}/data/load`);
        toast.success("Data loaded successfully!");
        await checkDataStatus();
      }
    } catch (error) {
      console.error("Error checking data status:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchFilters.query && !searchFilters.industry && !searchFilters.location) {
      toast.error("Please enter at least one search filter");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/enrichment/search`, searchFilters);
      
      if (response?.data) {
        setResults(response.data.results || []);
        toast.success(`Found ${response.data.results?.length || 0} enriched companies`);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error(error.response?.data?.detail || "Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (company) => {
    setSelectedCompany(company);
  };

  const prepareHoverEffectData = () => {
    return results.map(company => ({
      title: company.company_name || 'Unknown Company',
      description: company.description?.substring(0, 150) + '...' || 'No description available',
      enrichment: company.enrichment_fields
    }));
  };

  const exportEnrichedData = (format) => {
    if (results.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      // Prepare enriched data for export
      const exportData = results.map(company => ({
        // Primary Enrichment Fields (in order)
        email: company.enrichment_fields?.email || '',
        linkedin: company.enrichment_fields?.linkedin || '',
        contact_number: company.enrichment_fields?.contact_number || '',
        company_name: company.enrichment_fields?.company_name || '',
        prospect_full_name: company.enrichment_fields?.prospect_full_name || '',
        
        // Additional Fields
        website: company.website || '',
        industry: company.industry || '',
        location: company.location || '',
        employee_count: company.employee_count || '',
        description: company.description || '',
        founded_date: company.founded_date || '',
        
        // All enrichment data
        all_emails: company.all_emails?.join('; ') || '',
        all_linkedin_profiles: company.all_linkedin_profiles?.join('; ') || '',
        all_prospects: company.all_prospects?.map(p => `${p.name} (${p.title || 'N/A'})`).join('; ') || '',
        
        // Source
        data_source: company.data_source || ''
      }));

      if (format === 'csv') {
        // Convert to CSV
        const headers = Object.keys(exportData[0]).join(',');
        const rows = exportData.map(row => 
          Object.values(row).map(val => 
            `"${String(val).replace(/"/g, '""')}"`
          ).join(',')
        );
        const csv = [headers, ...rows].join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `enriched_companies_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else if (format === 'json') {
        const json = JSON.stringify(exportData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `enriched_companies_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      toast.success(`Exported ${results.length} enriched records as ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                🔍 Enrichment Search
              </h1>
              <p className="text-slate-600">
                Search across Crunchbase, LinkedIn, and job postings with advanced enrichment
              </p>
            </div>
            {dataStatus && (
              <Badge variant="secondary" className="h-8">
                📊 {dataStatus.crunchbase_companies + dataStatus.linkedin_companies} Companies Loaded
              </Badge>
            )}
          </div>

          {/* Advanced Search Filters */}
          <Card className="border-slate-200 shadow-md mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Multi-Filter Search
              </CardTitle>
              <CardDescription>
                Search by company name, industry, or location. Leave blank to search all.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Building2 className="w-4 h-4 inline mr-1" />
                    Company / Keyword
                  </label>
                  <Input
                    placeholder="e.g., Google, Microsoft..."
                    value={searchFilters.query}
                    onChange={(e) => setSearchFilters({...searchFilters, query: e.target.value})}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Briefcase className="w-4 h-4 inline mr-1" />
                    Industry
                  </label>
                  <Input
                    placeholder="e.g., Technology, Finance..."
                    value={searchFilters.industry}
                    onChange={(e) => setSearchFilters({...searchFilters, industry: e.target.value})}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Location
                  </label>
                  <Input
                    placeholder="e.g., San Francisco, California..."
                    value={searchFilters.location}
                    onChange={(e) => setSearchFilters({...searchFilters, location: e.target.value})}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <Button
                  onClick={handleSearch}
                  disabled={loading}
                  className="px-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>

                {results.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => exportEnrichedData('csv')}
                      variant="outline"
                      size="sm"
                      className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button
                      onClick={() => exportEnrichedData('json')}
                      variant="outline"
                      size="sm"
                      className="border-purple-600 text-purple-600 hover:bg-purple-50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export JSON
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Display */}
        {results.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-slate-900">
              Search Results
              <Badge variant="secondary" className="ml-3">{results.length} Companies</Badge>
            </h2>
            
            {/* Search Bar for Results */}
            <div className="mb-6">
              <SearchComponent 
                data={results} 
                onResultClick={handleResultClick}
              />
            </div>

            {/* Hover Effect Cards */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Enriched Company Data</h3>
              <HoverEffect items={prepareHoverEffectData()} />
            </div>
          </div>
        )}

        {/* Selected Company Details */}
        {selectedCompany && (
          <Card className="mt-8 border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle>📋 Detailed Enrichment Data</CardTitle>
              <CardDescription>Complete enrichment information for selected company</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Primary Enrichment Fields */}
                <div>
                  <h4 className="font-semibold text-lg mb-3 text-blue-600">Primary Enrichment</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-semibold">📧 Email:</span>
                      <span className="ml-2">{selectedCompany.enrichment_fields?.email || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-semibold">💼 LinkedIn:</span>
                      <a 
                        href={selectedCompany.enrichment_fields?.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 hover:underline"
                      >
                        {selectedCompany.enrichment_fields?.linkedin || 'N/A'}
                      </a>
                    </div>
                    <div>
                      <span className="font-semibold">📞 Contact Number:</span>
                      <span className="ml-2">{selectedCompany.enrichment_fields?.contact_number || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-semibold">🏢 Company Name:</span>
                      <span className="ml-2">{selectedCompany.enrichment_fields?.company_name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-semibold">👤 Prospect Name:</span>
                      <span className="ml-2">{selectedCompany.enrichment_fields?.prospect_full_name || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <h4 className="font-semibold text-lg mb-3 text-green-600">Additional Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-semibold">🌐 Website:</span>
                      <a 
                        href={selectedCompany.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 hover:underline"
                      >
                        {selectedCompany.website || 'N/A'}
                      </a>
                    </div>
                    <div>
                      <span className="font-semibold">🏭 Industry:</span>
                      <span className="ml-2">{selectedCompany.industry || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-semibold">📍 Location:</span>
                      <span className="ml-2">{selectedCompany.location || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-semibold">👥 Employees:</span>
                      <span className="ml-2">{selectedCompany.employee_count || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-semibold">📅 Founded:</span>
                      <span className="ml-2">{selectedCompany.founded_date || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* All Prospects List */}
              {selectedCompany.all_prospects && selectedCompany.all_prospects.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-lg mb-3 text-purple-600">All Prospects</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedCompany.all_prospects.map((prospect, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                        <div className="font-semibold">{prospect.name}</div>
                        <div className="text-sm text-slate-600">{prospect.title || 'Title not available'}</div>
                        {prospect.linkedin_id && (
                          <a 
                            href={`https://www.linkedin.com/in/${prospect.linkedin_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            View LinkedIn Profile
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EnrichmentSearch;
