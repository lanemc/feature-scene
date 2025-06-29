import { AIAnalysisService } from '../../src/services/ai-analysis';
import { PainPoint } from '../../src/models';

// Mock OpenAI
jest.mock('openai', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify({
                  title: "High Drop-off at Checkout",
                  summary: "60% of users abandon the checkout process. This indicates confusion or friction in the payment flow.",
                  recommendation: "Simplify the checkout form and add a progress indicator to guide users through the process.",
                  impact: "Could increase conversion rate by 20-30% based on industry standards.",
                  effort: "medium",
                  category: "conversion"
                })
              }
            }]
          })
        }
      }
    }))
  };
});

describe('AIAnalysisService', () => {
  let aiService: AIAnalysisService;

  beforeEach(() => {
    aiService = new AIAnalysisService();
  });

  describe('analyzePainPoint', () => {
    it('should generate insight from pain point', async () => {
      const painPoint: PainPoint = {
        id: 'test-1',
        type: 'dropoff',
        severity: 'high',
        location: '/checkout',
        description: '60% of users drop off at checkout page',
        affectedUsers: 600,
        affectedPercentage: 60,
        metrics: {
          incoming: 1000,
          outgoing: 400,
          dropoffRate: 60
        },
        detectedAt: new Date()
      };

      const insight = await aiService.analyzePainPoint(painPoint);

      expect(insight).toMatchObject({
        painPointId: 'test-1',
        title: 'High Drop-off at Checkout',
        summary: expect.stringContaining('60% of users'),
        recommendation: expect.stringContaining('Simplify'),
        priority: 'high',
        effort: 'medium',
        category: 'conversion'
      });
      expect(insight.id).toBeDefined();
      expect(insight.createdAt).toBeInstanceOf(Date);
    });

    it('should handle AI response errors gracefully', async () => {
      const OpenAI = require('openai').default;
      OpenAI.mockImplementationOnce(() => ({
        chat: {
          completions: {
            create: jest.fn().mockRejectedValue(new Error('API Error'))
          }
        }
      }));

      const painPoint: PainPoint = {
        id: 'test-2',
        type: 'cycle',
        severity: 'medium',
        location: '/settings',
        description: 'Users navigating in circles',
        affectedUsers: 50,
        affectedPercentage: 5,
        metrics: { cycleCount: 150 },
        detectedAt: new Date()
      };

      await expect(aiService.analyzePainPoint(painPoint)).rejects.toThrow('API Error');
    });
  });

  describe('prioritizeInsights', () => {
    it('should reorder insights based on AI recommendation', async () => {
      const insights = [
        {
          id: '1',
          painPointId: 'p1',
          title: 'Low priority issue',
          summary: 'Minor issue',
          recommendation: 'Fix later',
          priority: 'low' as const,
          impact: 'Small',
          effort: 'low' as const,
          category: 'usability' as const,
          metrics: { affectedUsers: 10 },
          createdAt: new Date(),
          status: 'new' as const
        },
        {
          id: '2',
          painPointId: 'p2',
          title: 'Critical conversion issue',
          summary: 'Major drop-off',
          recommendation: 'Fix immediately',
          priority: 'high' as const,
          impact: 'Large',
          effort: 'medium' as const,
          category: 'conversion' as const,
          metrics: { affectedUsers: 1000 },
          createdAt: new Date(),
          status: 'new' as const
        }
      ];

      const OpenAI = require('openai').default;
      const mockInstance = new OpenAI();
      mockInstance.chat.completions.create.mockResolvedValueOnce({
        choices: [{
          message: { content: '2,1' }
        }]
      });

      const prioritized = await aiService.prioritizeInsights(insights);

      expect(prioritized[0].id).toBe('2');
      expect(prioritized[1].id).toBe('1');
    });
  });
});