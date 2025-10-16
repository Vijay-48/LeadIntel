import { useState, useEffect } from 'react';
import { 
  Search, RefreshCw, Download, Building2, Users, Database, 
  Mail, Phone, Globe, MapPin, Briefcase, Linkedin, User, Filter,
  ChevronDown, X
} from 'lucide-react';
import { apiService, CompanyData, DataStatus } from '../services/api';

export function NewDashboard() {
  const [activeTab, setActiveTab] = useState<'companies' | 'contacts'>('companies');
  const [searchQuery, setSearchQuery] = useState('');
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DataStatus | null>(null);
  const [enrichedContacts, setEnrichedContacts] = useState<any[]>([]);
  const [enriching, setEnriching] = useState(false);
  
  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    industry: '',
    location: '',
    minEmployees: '',
    maxEmployees: '',
  });

  // Fetch initial data
  useEffect(() => {
    fetchData();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await apiService.getDataStatus();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await apiService.searchEnrichment({
        query: searchQuery || undefined,
        industry: filters.industry || undefined,
        location: filters.location || undefined,
        min_employees: filters.minEmployees ? parseInt(filters.minEmployees) : undefined,
        max_employees: filters.maxEmployees ? parseInt(filters.maxEmployees) : undefined,
        limit: 100,
      });
      setCompanies(result.results);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchData();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    await fetchStats();
    setRefreshing(false);
  };

  const handleExport = () => {
    const dataToExport = activeTab === 'companies' ? companies : extractContacts();
    
    const csv = [
      Object.keys(dataToExport[0] || {}).join(','),
      ...dataToExport.map(row => Object.values(row).map(v => `"${v || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leadintel_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Extract contacts from company data
  const extractContacts = () => {
    const contacts: any[] = [];
    companies.forEach(company => {
      // Check enrichment_fields first
      const enrichmentFields = company.enrichment_fields;
      const prospectName = enrichmentFields?.prospect_full_name || company.prospect_full_name;
      
      if (company.all_prospects && company.all_prospects.length > 0) {
        // Use all_prospects if available
        company.all_prospects.forEach(prospect => {
          contacts.push({
            name: prospect.name,
            title: prospect.title,
            company: company.company_name,
            email: enrichmentFields?.email || company.email,
            phone: enrichmentFields?.contact_number || company.contact_number,
            linkedin: enrichmentFields?.linkedin || company.linkedin,
            industry: company.industry,
            location: company.location,
          });
        });
      } else if (prospectName) {
        // Fallback to prospect_full_name
        const names = prospectName.split(',').map(n => n.trim());
        names.forEach(name => {
          contacts.push({
            name,
            company: company.company_name,
            email: enrichmentFields?.email || company.email,
            phone: enrichmentFields?.contact_number || company.contact_number,
            linkedin: enrichmentFields?.linkedin || company.linkedin,
            industry: company.industry,
            location: company.location,
          });
        });
      }
    });
    return contacts;
  };

  const enrichContacts = async () => {
    setEnriching(true);
    try {
      const contacts = extractContacts().slice(0, 10); // Limit to 10 for API
      const details = contacts.map(contact => {
        const [firstName, ...lastNameParts] = contact.name.split(' ');
        return {
          first_name: firstName || '',
          last_name: lastNameParts.join(' ') || firstName,
          organization_name: contact.company || ''
        };
      });

      const result = await apiService.enrichContacts({ details });
      setEnrichedContacts(result.people || []);
    } catch (error) {
      console.error('Error enriching contacts:', error);
    } finally {
      setEnriching(false);
    }
  };

  const totalCompanies = (stats?.crunchbase_companies || 0) + (stats?.linkedin_companies || 0);
  const contactsData = extractContacts();
  const totalContacts = contactsData.length;

  const clearFilters = () => {
    setFilters({
      industry: '',
      location: '',
      minEmployees: '',
      maxEmployees: '',
    });
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-950/20 to-black" />
      
      {/* Floating Shapes Background */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <div className="absolute top-20 right-20 w-64 h-24 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-xl" />
        <div className="absolute bottom-40 left-20 w-80 h-32 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-xl" />
      </div>

      <div className="relative z-10 p-8 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <span className="text-white text-sm font-medium">LeadIntel</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-white">Business Intelligence </span>
            <span className="bg-gradient-to-r from-blue-400 to-pink-500 bg-clip-text text-transparent">Hub</span>
          </h1>
          <p className="text-gray-400">Discover company insights across multiple data sources</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Companies</p>
                <p className="text-white text-2xl font-bold">{totalCompanies.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Contacts</p>
                <p className="text-white text-2xl font-bold">{totalContacts.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Database className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Data Sources</p>
                <p className="text-white text-2xl font-bold">2</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search companies, contacts, industries, locations..."
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <Filter className="w-5 h-5" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  value={filters.industry}
                  onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
                  placeholder="Industry"
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  placeholder="Location"
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="number"
                  value={filters.minEmployees}
                  onChange={(e) => setFilters({ ...filters, minEmployees: e.target.value })}
                  placeholder="Min Employees"
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="number"
                  value={filters.maxEmployees}
                  onChange={(e) => setFilters({ ...filters, maxEmployees: e.target.value })}
                  placeholder="Max Employees"
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Tabs and Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('companies')}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'companies'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              Companies ({companies.length})
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'contacts'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              Contacts ({totalContacts})
            </button>
          </div>

          <div className="flex gap-2">
            {activeTab === 'contacts' && (
              <button
                onClick={enrichContacts}
                disabled={enriching || contactsData.length === 0}
                className="px-4 py-3 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <User className="w-5 h-5" />
                {enriching ? 'Enriching...' : 'Enrich Contacts'}
              </button>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Export
            </button>
          </div>
        </div>

        {/* Data Display */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-400">Loading...</div>
          </div>
        ) : (
          <>
            {activeTab === 'companies' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {companies.length > 0 ? (
                  companies.map((company, index) => (
                    <div
                      key={index}
                      className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">
                          {company.company_name || 'Unknown Company'}
                        </h3>
                        {company.industry && (
                          <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                            {company.industry.split(',')[0].trim()}
                          </span>
                        )}
                      </div>

                      <div className="space-y-3">
                        {company.website && (
                          <div className="flex items-center gap-2 text-gray-400">
                            <Globe className="w-4 h-4 flex-shrink-0" />
                            <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors truncate">
                              {company.website}
                            </a>
                          </div>
                        )}

                        {company.location && (
                          <div className="flex items-center gap-2 text-gray-400">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{company.location}</span>
                          </div>
                        )}

                        {company.employee_count && (
                          <div className="flex items-center gap-2 text-gray-400">
                            <Users className="w-4 h-4 flex-shrink-0" />
                            <span>{company.employee_count} employees</span>
                          </div>
                        )}

                        {company.email && (
                          <div className="flex items-center gap-2 text-gray-400">
                            <Mail className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{company.email}</span>
                          </div>
                        )}

                        {company.contact_number && (
                          <div className="flex items-center gap-2 text-gray-400">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            <span>{company.contact_number}</span>
                          </div>
                        )}

                        {company.description && (
                          <p className="text-gray-500 text-sm mt-3 line-clamp-2">
                            {company.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-12 text-gray-400">
                    No companies found. Try adjusting your search or filters.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'contacts' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {contactsData.length > 0 ? (
                  contactsData.map((contact, index) => {
                    const enrichedData = enrichedContacts.find(
                      e => e.first_name && contact.name.toLowerCase().includes(e.first_name.toLowerCase())
                    );

                    return (
                      <div
                        key={index}
                        className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-white mb-1">{contact.name}</h3>
                            {enrichedData?.title && (
                              <p className="text-purple-400 text-sm mb-2">{enrichedData.title}</p>
                            )}
                            {contact.company && (
                              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                                <Briefcase className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{contact.company}</span>
                              </div>
                            )}
                            {(contact.email || enrichedData?.email) && (
                              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                                <Mail className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{enrichedData?.email || contact.email}</span>
                              </div>
                            )}
                            {(contact.phone || enrichedData?.phone_numbers?.[0]) && (
                              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                                <Phone className="w-4 h-4 flex-shrink-0" />
                                <span>{enrichedData?.phone_numbers?.[0] || contact.phone}</span>
                              </div>
                            )}
                            {(contact.linkedin || enrichedData?.linkedin_url) && (
                              <div className="flex items-center gap-2 text-gray-400 text-sm">
                                <Linkedin className="w-4 h-4 flex-shrink-0" />
                                <a 
                                  href={enrichedData?.linkedin_url || contact.linkedin} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="hover:text-blue-400 transition-colors truncate"
                                >
                                  LinkedIn Profile
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-2 text-center py-12 text-gray-400">
                    No contacts found. Search for companies first to view their contacts.
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
