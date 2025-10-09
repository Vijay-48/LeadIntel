import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import axios from "axios";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { TestimonialCard } from "@/components/ui/testimonial-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Search, Download, RefreshCw, Database, Users, Building2, Mail, Phone, Globe, MapPin, TrendingUp, Sparkles } from "lucide-react";
import EnrichmentSearch from "@/components/EnrichmentSearch";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const testimonials = [
  {
    author: {
      name: "Sarah Johnson",
      handle: "@sarahleads",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face"
    },
    text: "LeadIntel has revolutionized our lead generation. Apollo.io integration saves us hours daily!"
  },
  {
    author: {
      name: "Michael Chen",
      handle: "@mchen_sales",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
    },
    text: "The Crunchbase data scraping is spot-on. Real-time funding information at our fingertips."
  },
  {
    author: {
      name: "Emily Rodriguez",
      handle: "@emily_biz",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face"
    },
    text: "Email verification feature is a game-changer. We've increased our outreach success by 85%."
  }
];

const Home = ({ onNavigate }) => {
  return (
    <div>
      <BackgroundPaths title="LeadIntel" onGetStarted={() => onNavigate('dashboard')} />
      
      <div className="bg-gradient-to-b from-slate-50 to-white py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-slate-900">Why Choose LeadIntel?</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Automate lead generation with powerful data extraction from Apollo.io, Crunchbase, and LinkedIn
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-24">
            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Database className="w-12 h-12 text-emerald-600 mb-4" />
                <CardTitle>Multi-Source Data</CardTitle>
                <CardDescription>Extract from Apollo.io, Crunchbase & LinkedIn</CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Mail className="w-12 h-12 text-blue-600 mb-4" />
                <CardTitle>Email Verification</CardTitle>
                <CardDescription>Free permutation generator with Apollo validation</CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <TrendingUp className="w-12 h-12 text-purple-600 mb-4" />
                <CardTitle>Real-Time Updates</CardTitle>
                <CardDescription>On-demand data refresh with 1-hour caching</CardDescription>
              </CardHeader>
            </Card>
          </div>
          
          <div className="mb-16">
            <h3 className="text-3xl font-bold text-center mb-12 text-slate-900">Trusted by Sales Teams</h3>
            <div className="flex justify-center gap-6 flex-wrap">
              {testimonials.map((testimonial, i) => (
                <TestimonialCard key={i} {...testimonial} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("company");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [activeTab, setActiveTab] = useState("apollo");

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setLoading(true);
    try {
      let response;
      
      if (activeTab === "apollo") {
        response = await axios.post(`${API}/apollo/search`, {
          query: searchQuery,
          search_type: searchType
        });
      } else if (activeTab === "crunchbase") {
        response = await axios.post(`${API}/crunchbase/search`, {
          company_name: searchQuery
        });
      } else if (activeTab === "linkedin") {
        response = await axios.post(`${API}/linkedin/search`, {
          query: searchQuery,
          search_type: searchType
        });
      }

      if (response?.data) {
        setResults(response.data.results || []);
        toast.success(`Found ${response.data.results?.length || 0} results`);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error(error.response?.data?.detail || "Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    if (results.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      const response = await axios.post(
        `${API}/export/${format}`,
        { data: results },
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `leadintel_export.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Exported ${results.length} records as ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export failed. Please try again.");
    }
  };

  const handleRefresh = async () => {
    if (results.length > 0) {
      toast.info("Refreshing data...");
      await handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50" data-testid="dashboard">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">LeadIntel Dashboard</h1>
              <p className="text-slate-600">Extract company and contact data from multiple sources</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleRefresh}
                variant="outline"
                disabled={results.length === 0}
                data-testid="refresh-btn"
                className="border-slate-300 hover:bg-slate-100"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Search Section */}
          <Card className="border-slate-200 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Search Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="apollo" data-testid="apollo-tab">Apollo.io</TabsTrigger>
                  <TabsTrigger value="crunchbase" data-testid="crunchbase-tab">Crunchbase</TabsTrigger>
                  <TabsTrigger value="linkedin" data-testid="linkedin-tab">LinkedIn</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder={activeTab === "crunchbase" ? "Enter company name..." : "Enter search query..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    data-testid="search-input"
                    className="h-12"
                  />
                </div>
                
                {activeTab !== "crunchbase" && (
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    data-testid="search-type-select"
                    className="px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="company">Company</option>
                    <option value="contact">Contact</option>
                  </select>
                )}
                
                <Button
                  onClick={handleSearch}
                  disabled={loading}
                  data-testid="search-btn"
                  className="px-8 h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  {loading ? "Searching..." : "Search"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        {results.length > 0 && (
          <Card className="border-slate-200 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Search Results
                    <Badge variant="secondary" className="ml-2">{results.length}</Badge>
                  </CardTitle>
                  <CardDescription>Data cached for 1 hour</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleExport('csv')}
                    variant="outline"
                    size="sm"
                    data-testid="export-csv-btn"
                    className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    CSV
                  </Button>
                  <Button
                    onClick={() => handleExport('txt')}
                    variant="outline"
                    size="sm"
                    data-testid="export-txt-btn"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    TXT
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead><Building2 className="w-4 h-4 inline mr-1" />Company</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead><Globe className="w-4 h-4 inline mr-1" />Website</TableHead>
                      <TableHead><MapPin className="w-4 h-4 inline mr-1" />Location</TableHead>
                      <TableHead><Users className="w-4 h-4 inline mr-1" />Employees</TableHead>
                      <TableHead>Funding</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead><Mail className="w-4 h-4 inline mr-1" />Email</TableHead>
                      <TableHead><Phone className="w-4 h-4 inline mr-1" />Phone</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result, idx) => (
                      <TableRow key={idx} data-testid={`result-row-${idx}`}>
                        <TableCell className="font-medium">{result.company_name || '-'}</TableCell>
                        <TableCell>{result.industry || '-'}</TableCell>
                        <TableCell>
                          {result.website ? (
                            <a href={result.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {result.website.replace(/^https?:\/\//, '').substring(0, 25)}
                            </a>
                          ) : '-'}
                        </TableCell>
                        <TableCell>{result.location || '-'}</TableCell>
                        <TableCell>{result.employee_count || '-'}</TableCell>
                        <TableCell>{result.funding || '-'}</TableCell>
                        <TableCell>{result.contact_name || '-'}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{result.contact_email || '-'}</TableCell>
                        <TableCell>{result.contact_phone || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && results.length === 0 && (
          <Card className="border-slate-200 shadow-md" data-testid="empty-state">
            <CardContent className="py-16 text-center">
              <Database className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No Results Yet</h3>
              <p className="text-slate-500">Start by searching for companies or contacts above</p>
            </CardContent>
          </Card>
        )}
      </div>
      
      <Toaster position="top-right" />
    </div>
  );
};

function App() {
  const [currentView, setCurrentView] = useState('home');

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            currentView === 'home' 
              ? <Home onNavigate={setCurrentView} /> 
              : <Dashboard />
          } />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
