import axios from 'axios';
import { insightsAPI, analyticsAPI, batchAPI, healthAPI } from '../../src/services/api';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API Service', () => {
  beforeEach(() => {
    mockedAxios.create.mockReturnValue({
      get: mockedAxios.get,
      post: mockedAxios.post,
      patch: mockedAxios.patch,
      put: mockedAxios.put,
      delete: mockedAxios.delete,
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('insightsAPI', () => {
    it('should fetch all insights with filters', async () => {
      const mockResponse = { data: { insights: [], total: 0 } };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const filters = { status: 'new', category: 'conversion', priority: 'high' };
      const result = await insightsAPI.getAll(filters);

      expect(mockedAxios.get).toHaveBeenCalledWith('/insights', { params: filters });
      expect(result).toEqual(mockResponse.data);
    });

    it('should fetch insight by ID', async () => {
      const mockInsight = { id: '123', title: 'Test Insight' };
      mockedAxios.get.mockResolvedValue({ data: mockInsight });

      const result = await insightsAPI.getById('123');

      expect(mockedAxios.get).toHaveBeenCalledWith('/insights/123');
      expect(result).toEqual(mockInsight);
    });

    it('should update insight status', async () => {
      const mockUpdated = { id: '123', status: 'reviewed' };
      mockedAxios.patch.mockResolvedValue({ data: mockUpdated });

      const result = await insightsAPI.updateStatus('123', 'reviewed');

      expect(mockedAxios.patch).toHaveBeenCalledWith('/insights/123/status', { status: 'reviewed' });
      expect(result).toEqual(mockUpdated);
    });

    it('should create Jira ticket', async () => {
      const mockResponse = { ticketKey: 'PROJ-123' };
      mockedAxios.post.mockResolvedValue({ data: mockResponse });

      const result = await insightsAPI.createJiraTicket('123');

      expect(mockedAxios.post).toHaveBeenCalledWith('/insights/123/jira');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('analyticsAPI', () => {
    it('should fetch analytics summary with date range', async () => {
      const mockSummary = { totalUsers: 1000 };
      mockedAxios.get.mockResolvedValue({ data: mockSummary });

      const result = await analyticsAPI.getSummary('2024-01-01', '2024-01-31');

      expect(mockedAxios.get).toHaveBeenCalledWith('/analytics/summary', {
        params: { startDate: '2024-01-01', endDate: '2024-01-31' }
      });
      expect(result).toEqual(mockSummary);
    });

    it('should fetch user paths', async () => {
      const mockPaths = { paths: [] };
      mockedAxios.get.mockResolvedValue({ data: mockPaths });

      const result = await analyticsAPI.getPaths('/home', 5);

      expect(mockedAxios.get).toHaveBeenCalledWith('/analytics/paths', {
        params: { startPage: '/home', maxLength: 5 }
      });
      expect(result).toEqual(mockPaths);
    });

    it('should fetch funnel data', async () => {
      const mockFunnel = { steps: [] };
      mockedAxios.post.mockResolvedValue({ data: mockFunnel });

      const steps = ['step1', 'step2', 'step3'];
      const result = await analyticsAPI.getFunnel(steps);

      expect(mockedAxios.post).toHaveBeenCalledWith('/analytics/funnel', { steps });
      expect(result).toEqual(mockFunnel);
    });

    it('should fetch page performance', async () => {
      const mockPerformance = { pages: [] };
      mockedAxios.get.mockResolvedValue({ data: mockPerformance });

      const result = await analyticsAPI.getPagePerformance();

      expect(mockedAxios.get).toHaveBeenCalledWith('/analytics/pages/performance');
      expect(result).toEqual(mockPerformance);
    });
  });

  describe('batchAPI', () => {
    it('should run batch job', async () => {
      const mockResponse = { message: 'Batch job started' };
      mockedAxios.post.mockResolvedValue({ data: mockResponse });

      const result = await batchAPI.run(true);

      expect(mockedAxios.post).toHaveBeenCalledWith('/batch/run', { force: true });
      expect(result).toEqual(mockResponse);
    });

    it('should fetch batch status', async () => {
      const mockStatus = { status: 'running' };
      mockedAxios.get.mockResolvedValue({ data: mockStatus });

      const result = await batchAPI.getStatus();

      expect(mockedAxios.get).toHaveBeenCalledWith('/batch/status');
      expect(result).toEqual(mockStatus);
    });

    it('should fetch batch history', async () => {
      const mockHistory = { history: [] };
      mockedAxios.get.mockResolvedValue({ data: mockHistory });

      const result = await batchAPI.getHistory(10);

      expect(mockedAxios.get).toHaveBeenCalledWith('/batch/history', { params: { limit: 10 } });
      expect(result).toEqual(mockHistory);
    });
  });

  describe('healthAPI', () => {
    it('should check health status', async () => {
      const mockHealth = { status: 'ok' };
      mockedAxios.get.mockResolvedValue({ data: mockHealth });

      const result = await healthAPI.check();

      expect(mockedAxios.get).toHaveBeenCalledWith('/health');
      expect(result).toEqual(mockHealth);
    });
  });
});