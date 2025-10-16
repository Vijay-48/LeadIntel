import { useState, useEffect, useMemo } from 'react';
import { Search, RefreshCw, Download, Building2, Users, Database, Mail, Phone, Globe, MapPin, DollarSign, Briefcase, Linkedin } from 'lucide-react';
import { apiService, CompanyData, DataStatus } from '../services/api';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<'companies' | 'contacts'>('companies');
  const [searchQuery, setSearchQuery] = useState('');
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DataStatus | null>(null);

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

  const fetchData = async (search?: string) => {
    setLoading(true);
    try {
      const result = await apiService.searchEnrichment({
        query: search || undefined,
        limit: 50,
      });
      setCompanies(result.results);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData(searchQuery);
    await fetchStats();
    setRefreshing(false);
  };

  const handleExport = () => {
    const dataToExport = filteredData.map(item => ({
      company_name: item.company_name,
      industry: item.industry,
      location: item.location,
      website: item.website,
      email: item.email,
      contact_number: item.contact_number,
      prospect_name: item.prospect_full_name,
      employee_count: item.employee_count,
      funding: item.funding,
    }));

    const csv = [
      Object.keys(dataToExport[0] || {}).join(','),
      ...dataToExport.map(row => Object.values(row).map(v => `"${v || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leadintel_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Real-time search filtering
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return companies;
    
    const query = searchQuery.toLowerCase();
    return companies.filter(company => 
      company.company_name?.toLowerCase().includes(query) ||
      company.industry?.toLowerCase().includes(query) ||
      company.location?.toLowerCase().includes(query) ||
      company.email?.toLowerCase().includes(query) ||
      company.prospect_full_name?.toLowerCase().includes(query) ||
      company.website?.toLowerCase().includes(query)
    );
  }, [companies, searchQuery]);

  // Separate companies and contacts
  const companiesData = filteredData;
  const contactsData = filteredData.filter(item => item.email || item.contact_number || item.prospect_full_name);

  const totalCompanies = (stats?.crunchbase_companies || 0) + (stats?.linkedin_companies || 0);
  const totalContacts = contactsData.length;
  const dataSources = 2; // Crunchbase + LinkedIn

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200">
              Business Intelligence Hub
            </h1>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Discover company insights across multiple data sources
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="group relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-white/60 text-sm">Total Companies</p>
                  <p className="text-3xl font-bold text-white">{totalCompanies.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="group relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-white/60 text-sm">Total Contacts</p>
                  <p className="text-3xl font-bold text-white">{totalContacts.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="group relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                  <Database className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-white/60 text-sm">Data Sources</p>
                  <p className="text-3xl font-bold text-white">{dataSources}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-8">
            <div className="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-purple-500 transition-all">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
              <input
                type="text"
                placeholder="Search companies, contacts, industries, locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-16 pr-6 py-5 bg-transparent text-white placeholder-white/40 text-lg outline-none"
              />
            </div>
          </div>

          {/* Tabs and Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex gap-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('companies')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'companies'
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Companies
              </button>
              <button
                onClick={() => setActiveTab('contacts')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'contacts'
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Contacts
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-5 py-2.5 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/15 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-5 py-2.5 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/15 transition-all"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Data Display */}
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              <p className="text-white/60 mt-4">Loading data...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activeTab === 'companies' ? (
                companiesData.length > 0 ? (
                  companiesData.map((company, idx) => (
                    <CompanyCard key={idx} company={company} />
                  ))
                ) : (
                  <div className="col-span-2 text-center py-12 text-white/60">
                    No companies found
                  </div>
                )
              ) : (
                contactsData.length > 0 ? (
                  contactsData.map((contact, idx) => (
                    <ContactCard key={idx} contact={contact} />
                  ))
                ) : (
                  <div className="col-span-2 text-center py-12 text-white/60">
                    No contacts found
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CompanyCard({ company }: { company: CompanyData }) {
  return (
    <div className="group backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]">
      <h3 className="text-2xl font-bold text-white mb-4">{company.company_name || 'N/A'}</h3>
      
      <div className="space-y-3">
        {company.industry && (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-full text-sm text-purple-200">
              {company.industry}
            </span>
          </div>
        )}

        {company.website && (
          <div className="flex items-start gap-3 text-white/80">
            <Globe className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <span className="break-all">{company.website}</span>
          </div>
        )}

        {company.location && (
          <div className="flex items-start gap-3 text-white/80">
            <MapPin className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <span>{company.location}</span>
          </div>
        )}

        {company.employee_count && (
          <div className="flex items-start gap-3 text-white/80">
            <Users className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
            <span>{company.employee_count} employees</span>
          </div>
        )}

        {company.funding && (
          <div className="flex items-start gap-3 text-white/80">
            <DollarSign className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <span>{company.funding}</span>
          </div>
        )}

        {company.description && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-white/60 text-sm line-clamp-2">{company.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ContactCard({ contact }: { contact: CompanyData }) {
  return (
    <div className="group backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]">
      <h3 className="text-2xl font-bold text-white mb-2">{contact.prospect_full_name || 'N/A'}</h3>
      
      {contact.company_name && (
        <div className="flex items-center gap-2 mb-4">
          <Briefcase className="w-4 h-4 text-white/60" />
          <span className="text-white/80">{contact.company_name}</span>
        </div>
      )}

      <div className="space-y-3">
        {contact.contact_number && (
          <div className="flex items-start gap-3 text-white/80">
            <Phone className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
            <span>{contact.contact_number}</span>
          </div>
        )}

        {contact.email && (
          <div className="flex items-start gap-3 text-white/80">
            <Mail className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <span className="break-all">{contact.email}</span>
          </div>
        )}

        {contact.linkedin && (
          <div className="flex items-start gap-3 text-white/80">
            <Linkedin className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
            <span className="break-all">{contact.linkedin}</span>
          </div>
        )}

        {contact.website && (
          <div className="flex items-start gap-3 text-white/80">
            <Globe className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
            <span className="break-all">{contact.website}</span>
          </div>
        )}
      </div>
    </div>
  );
}
