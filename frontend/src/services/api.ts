import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface EnrichmentSearchParams {
  query?: string;
  industry?: string;
  location?: string;
  min_employees?: number;
  max_employees?: number;
  limit?: number;
}

export interface CompanyData {
  email?: string;
  linkedin?: string;
  contact_number?: string;
  company_name?: string;
  prospect_full_name?: string;
  website?: string;
  industry?: string;
  location?: string;
  employee_count?: string;
  description?: string;
  funding?: string;
  data_source?: string;
}

export interface DataStatus {
  status: string;
  crunchbase_companies: number;
  linkedin_companies: number;
  job_postings: number;
}

export const apiService = {
  async getDataStatus(): Promise<DataStatus> {
    const response = await api.get('/data/status');
    return response.data;
  },

  async searchEnrichment(params: EnrichmentSearchParams): Promise<{ results: CompanyData[]; count: number }> {
    const response = await api.post('/enrichment/search', params);
    return response.data;
  },

  async loadData(): Promise<void> {
    await api.post('/data/load');
  },
};

export default api;
