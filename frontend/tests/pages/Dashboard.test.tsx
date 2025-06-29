import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../../src/pages/Dashboard';
import * as api from '../../src/services/api';

// Mock API
jest.mock('../../src/services/api');

const mockSummary = {
  painPoints: {
    dropoffs: 5,
    cycles: 3,
    underused: 7
  },
  topDropoffs: [
    {
      page: '/checkout',
      title: 'Checkout Page',
      dropoffRate: 45.5,
      incoming: 1000,
      outgoing: 545
    }
  ],
  commonPaths: [],
  underusedFeatures: []
};

const mockInsights = {
  insights: [
    {
      id: '1',
      title: 'Fix Checkout Flow',
      summary: 'Users struggle with payment form',
      priority: 'high',
      category: 'conversion',
      status: 'new',
      metrics: { affectedUsers: 450 }
    }
  ],
  total: 1
};

const mockBatchStatus = {
  status: 'idle'
};

describe('Dashboard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false }
      }
    });

    (api.analyticsAPI.getSummary as jest.Mock).mockResolvedValue(mockSummary);
    (api.insightsAPI.getAll as jest.Mock).mockResolvedValue(mockInsights);
    (api.batchAPI.getStatus as jest.Mock).mockResolvedValue(mockBatchStatus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderDashboard = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('should render dashboard title', async () => {
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('should display loading state', () => {
    renderDashboard();
    
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  it('should display stats cards with correct values', async () => {
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Total Pain Points')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument(); // 5 + 3 + 7
      
      expect(screen.getByText('New Insights')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      
      expect(screen.getByText('Drop-off Points')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      
      expect(screen.getByText('Underused Features')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
    });
  });

  it('should display batch job status', async () => {
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/Last update:/)).toBeInTheDocument();
    });
  });

  it('should show running batch job status', async () => {
    (api.batchAPI.getStatus as jest.Mock).mockResolvedValue({
      status: 'running'
    });

    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Batch job running...')).toBeInTheDocument();
    });
  });

  it('should display top dropoff points', async () => {
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Top Drop-off Points')).toBeInTheDocument();
      expect(screen.getByText('Checkout Page')).toBeInTheDocument();
      expect(screen.getByText('/checkout')).toBeInTheDocument();
      expect(screen.getByText('45.5%')).toBeInTheDocument();
    });
  });

  it('should display recent insights section', async () => {
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Recent Insights')).toBeInTheDocument();
      expect(screen.getByText('Fix Checkout Flow')).toBeInTheDocument();
    });
  });

  it('should render pain points chart', async () => {
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Pain Points Overview')).toBeInTheDocument();
      expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument();
    });
  });

  it('should handle empty dropoff data', async () => {
    (api.analyticsAPI.getSummary as jest.Mock).mockResolvedValue({
      ...mockSummary,
      topDropoffs: []
    });

    renderDashboard();
    
    await waitFor(() => {
      expect(screen.queryByText('Top Drop-off Points')).not.toBeInTheDocument();
    });
  });
});