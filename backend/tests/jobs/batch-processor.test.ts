import { BatchProcessor } from '../../src/jobs/batch-processor';
import { postHogService } from '../../src/integrations/posthog';
import { neo4jService } from '../../src/integrations/neo4j';
import { aiAnalysisService } from '../../src/services/ai-analysis';
import { setCurrentBatchJob } from '../../src/services/batch-store';
import { saveInsights } from '../../src/services/insights-store';

// Mock dependencies
jest.mock('../../src/integrations/posthog');
jest.mock('../../src/integrations/neo4j');
jest.mock('../../src/services/ai-analysis');
jest.mock('../../src/services/batch-store');
jest.mock('../../src/services/insights-store');

describe('BatchProcessor', () => {
  let batchProcessor: BatchProcessor;

  beforeEach(() => {
    batchProcessor = new BatchProcessor();
    jest.clearAllMocks();
  });

  describe('run', () => {
    it('should successfully complete a batch job', async () => {
      // Mock PostHog events
      const mockEvents = [
        {
          distinct_id: 'user-1',
          event: '$pageview',
          properties: {
            '$current_url': '/home',
            '$title': 'Home',
            '$session_id': 'session-1'
          },
          timestamp: '2024-01-01T00:00:00Z'
        },
        {
          distinct_id: 'user-1',
          event: '$pageview',
          properties: {
            '$current_url': '/product',
            '$title': 'Product',
            '$session_id': 'session-1'
          },
          timestamp: '2024-01-01T00:01:00Z'
        }
      ];

      (postHogService.getEvents as jest.Mock).mockResolvedValue(mockEvents);

      // Mock Neo4j operations
      (neo4jService.createOrUpdateUser as jest.Mock).mockResolvedValue(undefined);
      (neo4jService.createOrUpdatePage as jest.Mock).mockResolvedValue(undefined);
      (neo4jService.createEvent as jest.Mock).mockResolvedValue(undefined);
      (neo4jService.createPageTransition as jest.Mock).mockResolvedValue(undefined);

      // Mock pain point detection
      const mockPainPoints = [
        {
          id: 'pp-1',
          type: 'dropoff',
          severity: 'high',
          location: '/checkout',
          description: 'High drop-off at checkout',
          affectedUsers: 600,
          affectedPercentage: 60,
          metrics: { dropoffRate: 60 },
          detectedAt: new Date()
        }
      ];

      (neo4jService.getTopDropoffPages as jest.Mock).mockResolvedValue([
        {
          page: '/checkout',
          title: 'Checkout',
          dropoffRate: 60,
          incoming: 1000,
          outgoing: 400
        }
      ]);
      (neo4jService.getUserCycles as jest.Mock).mockResolvedValue([]);
      (neo4jService.getUnderusedFeatures as jest.Mock).mockResolvedValue([]);

      // Mock AI analysis
      const mockInsight = {
        id: 'insight-1',
        painPointId: 'pp-1',
        title: 'Fix Checkout Drop-off',
        summary: 'Users are abandoning checkout',
        recommendation: 'Simplify checkout process',
        priority: 'high',
        impact: 'High revenue impact',
        effort: 'medium',
        category: 'conversion',
        metrics: {},
        createdAt: new Date(),
        status: 'new'
      };

      (aiAnalysisService.analyzePainPoint as jest.Mock).mockResolvedValue(mockInsight);
      (aiAnalysisService.prioritizeInsights as jest.Mock).mockImplementation(insights => insights);

      // Mock storage operations
      (setCurrentBatchJob as jest.Mock).mockResolvedValue(undefined);
      (saveInsights as jest.Mock).mockResolvedValue(undefined);

      // Run batch processor
      const result = await batchProcessor.run();

      // Verify job completed successfully
      expect(result.status).toBe('completed');
      expect(result.metrics?.eventsProcessed).toBe(2);
      expect(result.metrics?.painPointsDetected).toBeGreaterThan(0);
      expect(result.metrics?.insightsGenerated).toBeGreaterThan(0);

      // Verify all steps were called
      expect(postHogService.getEvents).toHaveBeenCalled();
      expect(neo4jService.createOrUpdateUser).toHaveBeenCalled();
      expect(neo4jService.createOrUpdatePage).toHaveBeenCalled();
      expect(aiAnalysisService.analyzePainPoint).toHaveBeenCalled();
      expect(saveInsights).toHaveBeenCalled();
      expect(setCurrentBatchJob).toHaveBeenCalledTimes(2); // Start and complete
    });

    it('should handle errors and mark job as failed', async () => {
      // Make PostHog fail
      (postHogService.getEvents as jest.Mock).mockRejectedValue(new Error('PostHog API Error'));

      await expect(batchProcessor.run()).rejects.toThrow('PostHog API Error');

      // Verify job was marked as failed
      expect(setCurrentBatchJob).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          error: 'PostHog API Error'
        })
      );
    });
  });

  describe('event processing', () => {
    it('should group events by user session', async () => {
      const mockEvents = [
        {
          distinct_id: 'user-1',
          event: '$pageview',
          properties: {
            '$current_url': '/home',
            '$session_id': 'session-1'
          },
          timestamp: '2024-01-01T00:00:00Z'
        },
        {
          distinct_id: 'user-2',
          event: '$pageview',
          properties: {
            '$current_url': '/home',
            '$session_id': 'session-2'
          },
          timestamp: '2024-01-01T00:00:00Z'
        },
        {
          distinct_id: 'user-1',
          event: '$pageview',
          properties: {
            '$current_url': '/product',
            '$session_id': 'session-1'
          },
          timestamp: '2024-01-01T00:01:00Z'
        }
      ];

      (postHogService.getEvents as jest.Mock).mockResolvedValue(mockEvents);
      
      // Mock all other dependencies to complete successfully
      (neo4jService.createOrUpdateUser as jest.Mock).mockResolvedValue(undefined);
      (neo4jService.createOrUpdatePage as jest.Mock).mockResolvedValue(undefined);
      (neo4jService.createEvent as jest.Mock).mockResolvedValue(undefined);
      (neo4jService.createPageTransition as jest.Mock).mockResolvedValue(undefined);
      (neo4jService.getTopDropoffPages as jest.Mock).mockResolvedValue([]);
      (neo4jService.getUserCycles as jest.Mock).mockResolvedValue([]);
      (neo4jService.getUnderusedFeatures as jest.Mock).mockResolvedValue([]);

      await batchProcessor.run();

      // Verify users were created
      expect(neo4jService.createOrUpdateUser).toHaveBeenCalledWith('user-1');
      expect(neo4jService.createOrUpdateUser).toHaveBeenCalledWith('user-2');

      // Verify page transition was created for user-1's journey
      expect(neo4jService.createPageTransition).toHaveBeenCalledWith(
        'user-1',
        expect.stringContaining('home'),
        expect.stringContaining('product'),
        expect.any(Date)
      );
    });
  });

  describe('pain point detection', () => {
    it('should detect multiple types of pain points', async () => {
      // Setup minimal event data
      (postHogService.getEvents as jest.Mock).mockResolvedValue([]);

      // Mock different pain point types
      (neo4jService.getTopDropoffPages as jest.Mock).mockResolvedValue([
        {
          page: '/checkout',
          title: 'Checkout',
          dropoffRate: 45,
          incoming: 1000,
          outgoing: 550
        }
      ]);

      (neo4jService.getUserCycles as jest.Mock).mockResolvedValue([
        {
          page: '/settings',
          title: 'Settings',
          cycleCount: 25
        }
      ]);

      (neo4jService.getUnderusedFeatures as jest.Mock).mockResolvedValue([
        {
          page: '/export',
          title: 'Export Feature',
          usageRate: 2.5,
          visits: 25,
          totalUsers: 1000
        }
      ]);

      // Mock AI to return insights
      (aiAnalysisService.analyzePainPoint as jest.Mock).mockImplementation(pp => ({
        id: `insight-${pp.id}`,
        painPointId: pp.id,
        title: `Fix ${pp.type}`,
        summary: pp.description,
        recommendation: 'Fix it',
        priority: pp.severity,
        impact: 'Medium',
        effort: 'medium',
        category: 'usability',
        metrics: pp.metrics,
        createdAt: new Date(),
        status: 'new'
      }));

      (aiAnalysisService.prioritizeInsights as jest.Mock).mockImplementation(insights => insights);

      const result = await batchProcessor.run();

      expect(result.metrics?.painPointsDetected).toBe(3);
      expect(result.metrics?.insightsGenerated).toBe(3);
      
      // Verify all pain point types were analyzed
      expect(aiAnalysisService.analyzePainPoint).toHaveBeenCalledTimes(3);
      expect(aiAnalysisService.analyzePainPoint).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'dropoff' })
      );
      expect(aiAnalysisService.analyzePainPoint).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'cycle' })
      );
      expect(aiAnalysisService.analyzePainPoint).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'underused' })
      );
    });
  });
});