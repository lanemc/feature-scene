import request from 'supertest';
import express from 'express';
import insightsRoutes from '../../src/api/routes/insights';
import { getInsightsFromStore, getInsightById, updateInsightStatus } from '../../src/services/insights-store';
import { jiraService } from '../../src/integrations/jira';

// Mock dependencies
jest.mock('../../src/services/insights-store');
jest.mock('../../src/integrations/jira');
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('Insights API', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/insights', insightsRoutes);
    jest.clearAllMocks();
  });

  describe('GET /api/insights', () => {
    it('should return all insights', async () => {
      const mockInsights = [
        {
          id: '1',
          title: 'Test Insight 1',
          status: 'new',
          category: 'conversion',
          priority: 'high'
        },
        {
          id: '2',
          title: 'Test Insight 2',
          status: 'reviewed',
          category: 'usability',
          priority: 'medium'
        }
      ];

      (getInsightsFromStore as jest.Mock).mockResolvedValue(mockInsights);

      const response = await request(app)
        .get('/api/insights')
        .expect(200);

      expect(response.body).toEqual({
        insights: mockInsights,
        total: 2,
        filters: { status: undefined, category: undefined, priority: undefined }
      });
    });

    it('should filter insights by status', async () => {
      const allInsights = [
        { id: '1', status: 'new' },
        { id: '2', status: 'reviewed' }
      ];

      (getInsightsFromStore as jest.Mock).mockResolvedValue(allInsights);

      const response = await request(app)
        .get('/api/insights?status=new')
        .expect(200);

      expect(response.body.insights).toHaveLength(1);
      expect(response.body.insights[0].status).toBe('new');
    });

    it('should filter by multiple criteria', async () => {
      const allInsights = [
        { id: '1', status: 'new', category: 'conversion', priority: 'high' },
        { id: '2', status: 'new', category: 'usability', priority: 'high' },
        { id: '3', status: 'new', category: 'conversion', priority: 'low' }
      ];

      (getInsightsFromStore as jest.Mock).mockResolvedValue(allInsights);

      const response = await request(app)
        .get('/api/insights?status=new&category=conversion&priority=high')
        .expect(200);

      expect(response.body.insights).toHaveLength(1);
      expect(response.body.insights[0].id).toBe('1');
    });

    it('should handle errors gracefully', async () => {
      (getInsightsFromStore as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/insights')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to fetch insights' });
    });
  });

  describe('GET /api/insights/:id', () => {
    it('should return a specific insight', async () => {
      const mockInsight = {
        id: '123',
        title: 'Test Insight',
        summary: 'Test summary',
        recommendation: 'Test recommendation'
      };

      (getInsightById as jest.Mock).mockResolvedValue(mockInsight);

      const response = await request(app)
        .get('/api/insights/123')
        .expect(200);

      expect(response.body).toEqual(mockInsight);
    });

    it('should return 404 for non-existent insight', async () => {
      (getInsightById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/insights/999')
        .expect(404);

      expect(response.body).toEqual({ error: 'Insight not found' });
    });
  });

  describe('PATCH /api/insights/:id/status', () => {
    it('should update insight status', async () => {
      const updatedInsight = {
        id: '123',
        status: 'reviewed'
      };

      (updateInsightStatus as jest.Mock).mockResolvedValue(updatedInsight);

      const response = await request(app)
        .patch('/api/insights/123/status')
        .send({ status: 'reviewed' })
        .expect(200);

      expect(response.body).toEqual(updatedInsight);
      expect(updateInsightStatus).toHaveBeenCalledWith('123', 'reviewed');
    });

    it('should reject invalid status', async () => {
      const response = await request(app)
        .patch('/api/insights/123/status')
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(response.body.error).toContain('Invalid status');
    });

    it('should return 404 if insight not found', async () => {
      (updateInsightStatus as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/insights/999/status')
        .send({ status: 'reviewed' })
        .expect(404);

      expect(response.body).toEqual({ error: 'Insight not found' });
    });
  });

  describe('POST /api/insights/:id/jira', () => {
    beforeEach(() => {
      (jiraService.isAvailable as jest.Mock).mockReturnValue(true);
    });

    it('should create Jira ticket for insight', async () => {
      const mockInsight = {
        id: '123',
        title: 'Test Insight',
        summary: 'Test summary',
        recommendation: 'Test recommendation',
        priority: 'high',
        category: 'conversion',
        metrics: {},
        createdAt: new Date()
      };

      const mockJiraIssue = {
        key: 'PROJ-123',
        self: 'https://example.atlassian.net/rest/api/3/issue/12345'
      };

      (getInsightById as jest.Mock).mockResolvedValue(mockInsight);
      (jiraService.createIssue as jest.Mock).mockResolvedValue(mockJiraIssue);
      (updateInsightStatus as jest.Mock).mockResolvedValue({ ...mockInsight, status: 'in_progress' });

      const response = await request(app)
        .post('/api/insights/123/jira')
        .expect(200);

      expect(response.body).toEqual({
        message: 'Jira ticket created successfully',
        ticketKey: 'PROJ-123',
        ticketUrl: 'https://example.atlassian.net/browse/PROJ-123'
      });

      expect(jiraService.createIssue).toHaveBeenCalledWith(mockInsight);
      expect(updateInsightStatus).toHaveBeenCalledWith('123', 'in_progress');
    });

    it('should return error if Jira ticket already exists', async () => {
      const mockInsight = {
        id: '123',
        jiraTicketId: 'PROJ-100'
      };

      (getInsightById as jest.Mock).mockResolvedValue(mockInsight);

      const response = await request(app)
        .post('/api/insights/123/jira')
        .expect(400);

      expect(response.body).toEqual({
        error: 'Jira ticket already created',
        ticketId: 'PROJ-100'
      });
    });

    it('should return 503 if Jira not configured', async () => {
      (jiraService.isAvailable as jest.Mock).mockReturnValue(false);
      (getInsightById as jest.Mock).mockResolvedValue({ id: '123' });

      const response = await request(app)
        .post('/api/insights/123/jira')
        .expect(503);

      expect(response.body).toEqual({
        error: 'Jira integration not configured'
      });
    });

    it('should handle Jira API errors', async () => {
      const mockInsight = { id: '123' };

      (getInsightById as jest.Mock).mockResolvedValue(mockInsight);
      (jiraService.createIssue as jest.Mock).mockRejectedValue(new Error('Jira API Error'));

      const response = await request(app)
        .post('/api/insights/123/jira')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to create Jira ticket' });
    });
  });
});