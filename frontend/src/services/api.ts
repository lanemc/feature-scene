import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Insights API
export const insightsAPI = {
  getAll: async (filters?: { status?: string; category?: string; priority?: string }) => {
    const response = await api.get('/insights', { params: filters });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/insights/${id}`);
    return response.data;
  },
  
  updateStatus: async (id: string, status: string) => {
    const response = await api.patch(`/insights/${id}/status`, { status });
    return response.data;
  },
  
  createJiraTicket: async (id: string) => {
    const response = await api.post(`/insights/${id}/jira`);
    return response.data;
  },
};

// Analytics API
export const analyticsAPI = {
  getSummary: async (startDate?: string, endDate?: string) => {
    const response = await api.get('/analytics/summary', { 
      params: { startDate, endDate } 
    });
    return response.data;
  },
  
  getPaths: async (startPage?: string, maxLength?: number) => {
    const response = await api.get('/analytics/paths', { 
      params: { startPage, maxLength } 
    });
    return response.data;
  },
  
  getFunnel: async (steps: string[]) => {
    const response = await api.post('/analytics/funnel', { steps });
    return response.data;
  },
  
  getPagePerformance: async () => {
    const response = await api.get('/analytics/pages/performance');
    return response.data;
  },
};

// Batch API
export const batchAPI = {
  run: async (force?: boolean) => {
    const response = await api.post('/batch/run', { force });
    return response.data;
  },
  
  getStatus: async () => {
    const response = await api.get('/batch/status');
    return response.data;
  },
  
  getHistory: async (limit?: number) => {
    const response = await api.get('/batch/history', { params: { limit } });
    return response.data;
  },
};

// Health API
export const healthAPI = {
  check: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};